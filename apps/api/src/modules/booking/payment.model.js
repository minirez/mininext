import mongoose from 'mongoose'

/**
 * Payment Model
 * Tracks all payments for bookings
 */

const paymentSchema = new mongoose.Schema(
  {
    // Relations
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: [true, 'REQUIRED_PARTNER'],
      index: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'REQUIRED_BOOKING'],
      index: true
    },

    // Payment Info
    type: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'cash', 'agency_credit', 'pay_at_checkin'],
      required: [true, 'REQUIRED_PAYMENT_TYPE']
    },
    amount: {
      type: Number,
      required: [true, 'REQUIRED_AMOUNT'],
      min: [0.01, 'INVALID_AMOUNT']
    },
    currency: {
      type: String,
      default: 'TRY',
      uppercase: true
    },

    // Status
    status: {
      type: String,
      enum: [
        'pending',
        'pre_authorized',
        'completed',
        'failed',
        'refunded',
        'cancelled',
        'released'
      ],
      default: 'pending',
      index: true
    },

    // Pre-authorization Info
    preAuth: {
      isPreAuth: { type: Boolean, default: false },
      authorizedAt: { type: Date },
      capturedAt: { type: Date },
      releasedAt: { type: Date },
      expiresAt: { type: Date }, // Pre-auths typically expire in 7-30 days
      captureDeadline: { type: Date }
    },

    // Dates
    completedAt: { type: Date },

    // Credit Card Details
    cardDetails: {
      lastFour: { type: String },
      brand: { type: String }, // visa, mastercard, amex
      cardFamily: { type: String }, // bonus, world, maximum, etc.
      bankName: { type: String }, // Issuing bank name
      installment: { type: Number, default: 1 }, // Number of installments
      // Reference to PaymentLink if payment was created via payment link
      paymentLink: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentLink' },
      linkSentAt: { type: Date },
      linkExpiresAt: { type: Date },
      // Gateway/POS integration
      gatewayTransactionId: { type: String, index: true }, // Payment Service transaction ID
      gatewayPosId: { type: String }, // Virtual POS used
      gatewayPosName: { type: String }, // POS display name
      gatewayStatus: {
        type: String,
        enum: [
          'pending',
          'processing',
          'requires_3d',
          'completed',
          'failed',
          'cancelled',
          'refunded'
        ],
        default: 'pending'
      },
      gatewayResponse: { type: mongoose.Schema.Types.Mixed }, // Raw response from gateway
      // 3D Secure
      requires3D: { type: Boolean, default: false },
      formUrl: { type: String }, // 3D Secure form URL
      processedAt: { type: Date }, // When payment was processed
      // Currency conversion (DCC) - when TR card pays in foreign currency
      currencyConversion: {
        originalCurrency: { type: String }, // Booking currency (EUR, USD)
        originalAmount: { type: Number }, // Amount in booking currency
        convertedCurrency: { type: String }, // Payment currency (TRY)
        convertedAmount: { type: Number }, // Amount charged in TRY
        exchangeRate: { type: Number } // Exchange rate used
      }
    },

    // Bank Transfer Details
    bankTransfer: {
      bankName: { type: String },
      iban: { type: String },
      accountHolder: { type: String },
      reference: { type: String }, // Dekont/transfer reference
      receiptUrl: { type: String }, // Uploaded receipt file
      confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      confirmedAt: { type: Date }
    },

    // General
    notes: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Refund Info
    refund: {
      amount: { type: Number },
      reason: { type: String },
      refundedAt: { type: Date },
      refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      gatewayRef: { type: String }
    },

    // Commission Info (for credit card payments)
    commission: {
      bankRate: { type: Number }, // Bank commission rate %
      bankAmount: { type: Number }, // Bank commission amount
      platformRate: { type: Number }, // Platform margin rate %
      platformAmount: { type: Number }, // Platform margin amount
      totalRate: { type: Number }, // Total commission rate %
      totalAmount: { type: Number }, // Total commission amount
      netAmount: { type: Number } // Net amount after commission
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes
paymentSchema.index({ partner: 1, booking: 1 })
paymentSchema.index({ partner: 1, status: 1 })
paymentSchema.index({ partner: 1, type: 1 })
paymentSchema.index({ partner: 1, createdAt: -1 })
paymentSchema.index({ 'bankTransfer.reference': 1 })
paymentSchema.index({ 'cardDetails.gatewayTransactionId': 1 })

// Virtuals
paymentSchema.virtual('isPending').get(function () {
  return this.status === 'pending'
})

paymentSchema.virtual('isCompleted').get(function () {
  return this.status === 'completed'
})

paymentSchema.virtual('isRefunded').get(function () {
  return this.status === 'refunded'
})

// Pre-save middleware
paymentSchema.pre('save', function (next) {
  // Auto-complete certain payment types
  if (this.isNew) {
    if (['cash', 'agency_credit'].includes(this.type)) {
      this.status = 'completed'
      this.completedAt = new Date()
    }
  }

  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date()
  }

  next()
})

// Statics
paymentSchema.statics.findByBooking = function (bookingId) {
  return this.find({ booking: bookingId })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName email')
    .populate('bankTransfer.confirmedBy', 'firstName lastName')
    .populate('refund.refundedBy', 'firstName lastName')
}

paymentSchema.statics.calculatePaidAmount = async function (bookingId) {
  const result = await this.aggregate([
    { $match: { booking: new mongoose.Types.ObjectId(bookingId), status: 'completed' } },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [
              { $gt: ['$cardDetails.currencyConversion.originalAmount', null] },
              '$cardDetails.currencyConversion.originalAmount',
              '$amount'
            ]
          }
        }
      }
    }
  ])
  return result[0]?.total || 0
}

paymentSchema.statics.getPendingBankTransfers = function (partnerId) {
  return this.find({
    partner: partnerId,
    type: 'bank_transfer',
    status: 'pending'
  })
    .populate('booking', 'bookingNumber hotelName checkIn')
    .sort({ createdAt: -1 })
}

/**
 * Find payment by gateway transaction ID
 */
paymentSchema.statics.findByGatewayTransaction = function (transactionId) {
  return this.findOne({ 'cardDetails.gatewayTransactionId': transactionId }).populate(
    'booking',
    'bookingNumber confirmationNumber'
  )
}

/**
 * Get pending card payments (awaiting 3D callback)
 */
paymentSchema.statics.getPendingCardPayments = function (partnerId) {
  return this.find({
    ...(partnerId && { partner: partnerId }),
    type: 'credit_card',
    status: 'pending',
    'cardDetails.gatewayStatus': { $in: ['pending', 'processing', 'requires_3d'] }
  })
    .populate('booking', 'bookingNumber hotelName checkIn')
    .sort({ createdAt: -1 })
}

// Methods
paymentSchema.methods.confirm = async function (userId) {
  if (this.status !== 'pending') {
    throw new Error('PAYMENT_NOT_PENDING')
  }

  this.status = 'completed'
  this.completedAt = new Date()

  if (this.type === 'bank_transfer') {
    this.bankTransfer.confirmedBy = userId
    this.bankTransfer.confirmedAt = new Date()
  }

  await this.save()
  return this
}

paymentSchema.methods.cancel = async function () {
  if (this.status !== 'pending') {
    throw new Error('PAYMENT_NOT_PENDING')
  }

  this.status = 'cancelled'
  await this.save()
  return this
}

paymentSchema.methods.processRefund = async function (amount, reason, userId, gatewayRef = null) {
  if (this.status !== 'completed') {
    throw new Error('PAYMENT_NOT_COMPLETED')
  }

  if (amount > this.amount) {
    throw new Error('REFUND_EXCEEDS_PAYMENT')
  }

  // Calculate total refunded amount (including previous partial refunds)
  const previousRefund = this.refund?.amount || 0
  const totalRefund = previousRefund + amount

  if (totalRefund > this.amount) {
    throw new Error('TOTAL_REFUND_EXCEEDS_PAYMENT')
  }

  // Update refund info
  this.refund = {
    amount: totalRefund, // Store cumulative refund amount
    reason,
    refundedAt: new Date(),
    refundedBy: userId,
    gatewayRef
  }

  // Only change status to 'refunded' if FULL refund
  // Partial refund: keep status as 'completed' but record refund info
  if (totalRefund >= this.amount) {
    this.status = 'refunded'
    // Update card details status if credit card payment
    if (this.type === 'credit_card' && this.cardDetails) {
      this.cardDetails.gatewayStatus = 'refunded'
    }
  }

  await this.save()
  return this
}

/**
 * Initialize card payment with gateway transaction
 */
paymentSchema.methods.initCardPayment = async function (transactionData) {
  if (this.type !== 'credit_card') {
    throw new Error('NOT_CARD_PAYMENT')
  }

  this.cardDetails = {
    ...this.cardDetails,
    gatewayTransactionId: transactionData.transactionId,
    gatewayPosId: transactionData.posId,
    gatewayPosName: transactionData.posName,
    gatewayStatus: transactionData.requires3D ? 'requires_3d' : 'processing',
    requires3D: transactionData.requires3D || false,
    formUrl: transactionData.formUrl,
    lastFour: transactionData.lastFour,
    brand: transactionData.brand,
    cardFamily: transactionData.cardFamily,
    bankName: transactionData.bankName,
    installment: transactionData.installment || 1,
    ...(transactionData.currencyConversion && {
      currencyConversion: transactionData.currencyConversion
    })
  }

  await this.save()
  return this
}

/**
 * Complete card payment after successful processing
 */
paymentSchema.methods.completeCardPayment = async function (responseData) {
  if (this.type !== 'credit_card') {
    throw new Error('NOT_CARD_PAYMENT')
  }

  this.status = 'completed'
  this.completedAt = new Date()
  this.cardDetails.gatewayStatus = 'completed'
  this.cardDetails.gatewayResponse = responseData
  this.cardDetails.processedAt = new Date()

  // Save commission info if provided
  if (responseData?.commission) {
    this.commission = {
      bankRate: responseData.commission.bankRate,
      bankAmount: responseData.commission.bankAmount,
      platformRate: responseData.commission.platformRate,
      platformAmount: responseData.commission.platformAmount,
      totalRate: responseData.commission.totalRate,
      totalAmount: responseData.commission.totalAmount,
      netAmount: responseData.commission.netAmount
    }
  }

  // Update card details from response if available
  if (responseData?.cardDetails) {
    this.cardDetails.lastFour = responseData.cardDetails.lastFour || this.cardDetails.lastFour
    this.cardDetails.brand = responseData.cardDetails.brand || this.cardDetails.brand
    this.cardDetails.cardFamily = responseData.cardDetails.cardFamily || this.cardDetails.cardFamily
    this.cardDetails.bankName = responseData.cardDetails.bankName || this.cardDetails.bankName
  }

  await this.save()
  return this
}

/**
 * Mark card payment as failed
 */
paymentSchema.methods.failCardPayment = async function (errorMessage, responseData) {
  if (this.type !== 'credit_card') {
    throw new Error('NOT_CARD_PAYMENT')
  }

  this.status = 'failed'
  this.cardDetails.gatewayStatus = 'failed'
  this.cardDetails.gatewayResponse = {
    error: errorMessage,
    ...responseData
  }
  this.cardDetails.processedAt = new Date()

  await this.save()
  return this
}

// ============================================================================
// PRE-AUTHORIZATION METHODS
// ============================================================================

/**
 * Initialize pre-authorization
 */
paymentSchema.methods.initPreAuth = async function (transactionData) {
  if (this.type !== 'credit_card') {
    throw new Error('NOT_CARD_PAYMENT')
  }

  this.status = 'pre_authorized'
  this.preAuth = {
    isPreAuth: true,
    authorizedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
    captureDeadline:
      transactionData.captureDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }

  this.cardDetails = {
    ...this.cardDetails,
    gatewayTransactionId: transactionData.transactionId,
    gatewayPosId: transactionData.posId,
    gatewayPosName: transactionData.posName,
    gatewayStatus: 'pre_authorized',
    requires3D: transactionData.requires3D || false,
    formUrl: transactionData.formUrl,
    lastFour: transactionData.lastFour,
    brand: transactionData.brand,
    cardFamily: transactionData.cardFamily,
    bankName: transactionData.bankName,
    installment: transactionData.installment || 1
  }

  await this.save()
  return this
}

/**
 * Capture pre-authorized payment
 */
paymentSchema.methods.capturePreAuth = async function (responseData) {
  if (!this.preAuth?.isPreAuth) {
    throw new Error('NOT_PRE_AUTHORIZED')
  }

  if (this.status !== 'pre_authorized') {
    throw new Error('INVALID_STATUS_FOR_CAPTURE')
  }

  this.status = 'completed'
  this.completedAt = new Date()
  this.preAuth.capturedAt = new Date()
  this.cardDetails.gatewayStatus = 'completed'
  this.cardDetails.gatewayResponse = responseData
  this.cardDetails.processedAt = new Date()

  // Save commission if provided
  if (responseData?.commission) {
    this.commission = {
      bankRate: responseData.commission.bankRate,
      bankAmount: responseData.commission.bankAmount,
      platformRate: responseData.commission.platformRate,
      platformAmount: responseData.commission.platformAmount,
      totalRate: responseData.commission.totalRate,
      totalAmount: responseData.commission.totalAmount,
      netAmount: responseData.commission.netAmount
    }
  }

  await this.save()
  return this
}

/**
 * Release pre-authorized payment (void)
 */
paymentSchema.methods.releasePreAuth = async function (responseData) {
  if (!this.preAuth?.isPreAuth) {
    throw new Error('NOT_PRE_AUTHORIZED')
  }

  if (this.status !== 'pre_authorized') {
    throw new Error('INVALID_STATUS_FOR_RELEASE')
  }

  this.status = 'released'
  this.preAuth.releasedAt = new Date()
  this.cardDetails.gatewayStatus = 'released'
  this.cardDetails.gatewayResponse = responseData

  await this.save()
  return this
}

/**
 * Check if pre-auth is expired
 */
paymentSchema.methods.isPreAuthExpired = function () {
  if (!this.preAuth?.isPreAuth) return false
  if (!this.preAuth.expiresAt) return false
  return new Date() > this.preAuth.expiresAt
}

/**
 * Get pre-authorized payments that are about to expire
 */
paymentSchema.statics.getExpiringPreAuths = function (daysUntilExpiry = 1) {
  const expiryThreshold = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000)

  return this.find({
    status: 'pre_authorized',
    'preAuth.isPreAuth': true,
    'preAuth.expiresAt': { $lte: expiryThreshold }
  })
    .populate('booking', 'bookingNumber hotelName checkIn')
    .sort({ 'preAuth.expiresAt': 1 })
}

export default mongoose.model('Payment', paymentSchema)
