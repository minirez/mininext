import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

/**
 * PaymentLink Model
 * Standalone payment links that can be sent to customers
 */

const paymentLinkSchema = new mongoose.Schema(
  {
    // Relations
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      index: true
    },

    // Unique identifiers
    token: {
      type: String,
      unique: true,
      index: true
    },
    linkNumber: {
      type: String,
      unique: true,
      index: true
    },

    // Customer Info
    customer: {
      name: {
        type: String,
        required: [true, 'REQUIRED_CUSTOMER_NAME'],
        trim: true
      },
      email: {
        type: String,
        lowercase: true,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      }
    },

    // Payment Details
    description: {
      type: String,
      required: [true, 'REQUIRED_DESCRIPTION'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'REQUIRED_AMOUNT'],
      min: [0.01, 'INVALID_AMOUNT']
    },
    currency: {
      type: String,
      enum: ['TRY', 'USD', 'EUR', 'GBP'],
      default: 'TRY',
      uppercase: true
    },

    // Tax / VAT (KDV)
    tax: {
      rate: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
      subtotal: { type: Number, default: 0 }
    },

    // Installment Settings
    installment: {
      enabled: {
        type: Boolean,
        default: false
      },
      maxCount: {
        type: Number,
        min: 1,
        max: 12,
        default: 1
      },
      // Interest rates per installment count (e.g., { "2": 1, "3": 1.5, "6": 2 })
      rates: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },

    // Purpose of the payment link
    purpose: {
      type: String,
      enum: ['booking', 'subscription_package', 'subscription_service', 'other'],
      default: 'booking'
    },

    // Optional Booking Reference
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      index: true
    },

    // Optional Payment Reference (for creating link from existing pending payment)
    linkedPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      index: true
    },

    // Subscription purchase context (when purpose = subscription_package | subscription_service)
    subscriptionContext: {
      targetPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
      purchaseId: { type: mongoose.Schema.Types.ObjectId },
      purchaseIds: [{ type: mongoose.Schema.Types.ObjectId }],
      package: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPackage' },
      service: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionService' }
    },

    // Link Settings
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    // Status Tracking
    status: {
      type: String,
      enum: ['pending', 'viewed', 'processing', 'paid', 'expired', 'cancelled'],
      default: 'pending',
      index: true
    },
    viewedAt: { type: Date },
    paidAt: { type: Date },

    // Payment Transaction (when paid)
    transaction: {
      // İşlem bilgileri
      gatewayTransactionId: { type: String, index: true },
      authCode: { type: String },
      refNumber: { type: String },
      provisionNumber: { type: String },

      // Kart bilgileri
      maskedCard: { type: String }, // "5401 34** **** 7890"
      lastFour: { type: String },
      brand: { type: String }, // Visa, Mastercard, etc.
      cardType: { type: String }, // credit, debit
      cardFamily: { type: String }, // World, Axess, Bonus, etc.

      // Banka bilgileri
      cardBank: { type: String }, // Kartı veren banka
      cardCountry: { type: String }, // Kart ülkesi (tr, us, etc.)

      // POS bilgileri
      posId: { type: mongoose.Schema.Types.ObjectId, ref: 'VirtualPos' },
      posName: { type: String },
      posBank: { type: String }, // POS bankası

      // Taksit
      installmentCount: { type: Number, default: 1 },

      // Komisyon bilgileri
      commission: {
        bankRate: { type: Number, default: 0 }, // Banka komisyon oranı %
        bankAmount: { type: Number, default: 0 }, // Banka komisyon tutarı
        platformRate: { type: Number, default: 0 }, // Platform komisyon oranı %
        platformAmount: { type: Number, default: 0 }, // Platform komisyon tutarı
        totalRate: { type: Number, default: 0 }, // Toplam komisyon oranı %
        totalAmount: { type: Number, default: 0 }, // Toplam kesinti
        netAmount: { type: Number, default: 0 } // Net tutar
      },

      // Ham yanıt
      gatewayResponse: { type: mongoose.Schema.Types.Mixed }
    },

    // Notification Tracking
    notifications: {
      emailSent: { type: Boolean, default: false },
      emailSentAt: { type: Date },
      smsSent: { type: Boolean, default: false },
      smsSentAt: { type: Date },
      lastResendAt: { type: Date },
      resendCount: { type: Number, default: 0 }
    },

    // Audit Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: { type: Date },
    cancelReason: { type: String }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes
paymentLinkSchema.index({ partner: 1, status: 1 })
paymentLinkSchema.index({ partner: 1, createdAt: -1 })
paymentLinkSchema.index({ 'customer.email': 1 })
paymentLinkSchema.index({ expiresAt: 1, status: 1 }) // For expiry job

// Pre-save middleware
paymentLinkSchema.pre('save', async function (next) {
  // Generate token if not set
  if (!this.token) {
    this.token = uuidv4()
  }

  // Generate link number if not set (globally unique, not per-partner)
  if (!this.linkNumber) {
    const year = new Date().getFullYear()
    const lastLink = await this.constructor
      .findOne({ linkNumber: { $regex: `^PL-${year}-` } })
      .sort({ linkNumber: -1 })
      .select('linkNumber')
      .lean()

    let nextNum = 1
    if (lastLink?.linkNumber) {
      const match = lastLink.linkNumber.match(/PL-\d{4}-(\d+)/)
      if (match) nextNum = parseInt(match[1]) + 1
    }
    this.linkNumber = `PL-${year}-${String(nextNum).padStart(6, '0')}`
  }

  next()
})

// Virtuals
paymentLinkSchema.virtual('isExpired').get(function () {
  // Check both 'pending' and 'viewed' statuses - a viewed link can also expire
  return this.expiresAt < new Date() && ['pending', 'viewed'].includes(this.status)
})

paymentLinkSchema.virtual('paymentUrl').get(function () {
  const isDev = process.env.NODE_ENV === 'development'
  const defaultUrl = isDev ? 'https://payment.mini.com' : 'https://payment.maxirez.com'
  const baseUrl = process.env.PAYMENT_PUBLIC_URL || defaultUrl
  return `${baseUrl}/pay-link/${this.token}`
})

paymentLinkSchema.virtual('daysUntilExpiry').get(function () {
  if (this.status !== 'pending') return 0
  const now = new Date()
  const diff = this.expiresAt - now
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

// Instance Methods
paymentLinkSchema.methods.markViewed = async function () {
  if (!this.viewedAt) {
    this.viewedAt = new Date()
    if (this.status === 'pending') {
      this.status = 'viewed'
    }
    await this.save()
  }
  return this
}

paymentLinkSchema.methods.markProcessing = async function () {
  this.status = 'processing'
  await this.save()
  return this
}

paymentLinkSchema.methods.markPaid = async function (transactionData) {
  this.status = 'paid'
  this.paidAt = new Date()
  this.transaction = {
    // İşlem bilgileri
    gatewayTransactionId: transactionData.transactionId,
    authCode: transactionData.authCode,
    refNumber: transactionData.refNumber,
    provisionNumber: transactionData.provisionNumber,

    // Kart bilgileri
    maskedCard: transactionData.maskedCard,
    lastFour: transactionData.lastFour,
    brand: transactionData.brand,
    cardType: transactionData.cardType,
    cardFamily: transactionData.cardFamily,

    // Banka bilgileri
    cardBank: transactionData.cardBank,
    cardCountry: transactionData.cardCountry,

    // POS bilgileri
    posId: transactionData.posId,
    posName: transactionData.posName,
    posBank: transactionData.posBank,

    // Taksit
    installmentCount: transactionData.installment || 1,

    // Komisyon bilgileri
    commission: transactionData.commission || {},

    // Ham yanıt
    gatewayResponse: transactionData.rawResponse
  }
  await this.save()
  return this
}

paymentLinkSchema.methods.cancel = async function (userId, reason) {
  if (this.status === 'paid') {
    throw new Error('Cannot cancel paid payment link')
  }
  this.status = 'cancelled'
  this.cancelledBy = userId
  this.cancelledAt = new Date()
  this.cancelReason = reason
  await this.save()
  return this
}

paymentLinkSchema.methods.recordNotification = async function (channel) {
  if (channel === 'email') {
    this.notifications.emailSent = true
    this.notifications.emailSentAt = new Date()
  } else if (channel === 'sms') {
    this.notifications.smsSent = true
    this.notifications.smsSentAt = new Date()
  }
  this.notifications.lastResendAt = new Date()
  this.notifications.resendCount = (this.notifications.resendCount || 0) + 1
  await this.save()
  return this
}

// Static Methods
paymentLinkSchema.statics.findByToken = function (token) {
  return this.findOne({ token })
    .populate('partner', 'companyName branding')
    .populate(
      'subscriptionContext.package',
      'name description services trialDays billingPeriod calculatedPrice overridePrice icon color'
    )
    .populate('subscriptionContext.service', 'name description price billingPeriod icon category')
}

paymentLinkSchema.statics.findActiveByPartner = function (partnerId) {
  return this.find({
    partner: partnerId,
    status: { $in: ['pending', 'viewed', 'processing'] },
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 })
}

paymentLinkSchema.statics.getStats = async function (partnerId = null, platformOnly = false) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Build match filter
  let matchFilter = {}
  if (partnerId) {
    // Specific partner
    matchFilter = { partner: new mongoose.Types.ObjectId(partnerId) }
  } else if (platformOnly) {
    // Platform-level only (no partner)
    matchFilter = { $or: [{ partner: null }, { partner: { $exists: false } }] }
  }
  // If neither, show all (but this case shouldn't happen with strict separation)

  const [stats] = await this.aggregate([
    { $match: matchFilter },
    {
      $facet: {
        total: [{ $count: 'count' }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        thisMonth: [{ $match: { createdAt: { $gte: startOfMonth } } }, { $count: 'count' }],
        paidThisMonth: [
          {
            $match: {
              status: 'paid',
              paidAt: { $gte: startOfMonth }
            }
          },
          {
            $group: {
              _id: '$currency',
              count: { $sum: 1 },
              amount: { $sum: '$amount' }
            }
          }
        ]
      }
    }
  ])

  const byStatus = {}
  stats.byStatus.forEach(s => {
    byStatus[s._id] = s.count
  })

  return {
    total: stats.total[0]?.count || 0,
    pending: byStatus.pending || 0,
    viewed: byStatus.viewed || 0,
    paid: byStatus.paid || 0,
    expired: byStatus.expired || 0,
    cancelled: byStatus.cancelled || 0,
    thisMonth: stats.thisMonth[0]?.count || 0,
    paidThisMonth: stats.paidThisMonth || []
  }
}

paymentLinkSchema.statics.expirePendingLinks = async function () {
  const now = new Date()
  const result = await this.updateMany(
    {
      status: { $in: ['pending', 'viewed'] },
      expiresAt: { $lt: now }
    },
    {
      $set: { status: 'expired' }
    }
  )
  return result.modifiedCount
}

export default mongoose.model('PaymentLink', paymentLinkSchema)
