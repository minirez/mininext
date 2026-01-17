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

    // Optional Booking Reference
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      index: true
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
      maskedCard: { type: String },        // "5401 34** **** 7890"
      lastFour: { type: String },
      brand: { type: String },             // Visa, Mastercard, etc.
      cardType: { type: String },          // credit, debit
      cardFamily: { type: String },        // World, Axess, Bonus, etc.

      // Banka bilgileri
      cardBank: { type: String },          // Kartı veren banka
      cardCountry: { type: String },       // Kart ülkesi (tr, us, etc.)

      // POS bilgileri
      posId: { type: mongoose.Schema.Types.ObjectId, ref: 'VirtualPos' },
      posName: { type: String },
      posBank: { type: String },           // POS bankası

      // Taksit
      installmentCount: { type: Number, default: 1 },

      // Komisyon bilgileri
      commission: {
        bankRate: { type: Number, default: 0 },       // Banka komisyon oranı %
        bankAmount: { type: Number, default: 0 },     // Banka komisyon tutarı
        platformRate: { type: Number, default: 0 },   // Platform komisyon oranı %
        platformAmount: { type: Number, default: 0 }, // Platform komisyon tutarı
        totalRate: { type: Number, default: 0 },      // Toplam komisyon oranı %
        totalAmount: { type: Number, default: 0 },    // Toplam kesinti
        netAmount: { type: Number, default: 0 }       // Net tutar
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

  // Generate link number if not set
  if (!this.linkNumber) {
    const year = new Date().getFullYear()
    const count = await this.constructor.countDocuments({
      partner: this.partner,
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      }
    })
    this.linkNumber = `PL-${year}-${String(count + 1).padStart(6, '0')}`
  }

  next()
})

// Virtuals
paymentLinkSchema.virtual('isExpired').get(function () {
  return this.expiresAt < new Date() && this.status === 'pending'
})

paymentLinkSchema.virtual('paymentUrl').get(function () {
  const isDev = process.env.NODE_ENV === 'development'
  const defaultUrl = isDev ? 'https://payment.mini.com' : 'https://payment.minires.com'
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
  return this.findOne({ token }).populate('partner', 'companyName branding')
}

paymentLinkSchema.statics.findActiveByPartner = function (partnerId) {
  return this.find({
    partner: partnerId,
    status: { $in: ['pending', 'viewed', 'processing'] },
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 })
}

paymentLinkSchema.statics.getStats = async function (partnerId = null) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Build match filter - if partnerId provided, filter by it; otherwise show all (platform view)
  const matchFilter = partnerId
    ? { partner: new mongoose.Types.ObjectId(partnerId) }
    : {}

  const [stats] = await this.aggregate([
    { $match: matchFilter },
    {
      $facet: {
        total: [{ $count: 'count' }],
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        thisMonth: [
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $count: 'count' }
        ],
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
