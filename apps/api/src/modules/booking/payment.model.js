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
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
      index: true
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
      paymentLink: { type: String },
      linkSentAt: { type: Date },
      linkExpiresAt: { type: Date },
      // Gateway/POS integration
      gatewayTransactionId: { type: String, index: true }, // Payment Service transaction ID
      gatewayPosId: { type: String }, // Virtual POS used
      gatewayPosName: { type: String }, // POS display name
      gatewayStatus: {
        type: String,
        enum: ['pending', 'processing', 'requires_3d', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending'
      },
      gatewayResponse: { type: mongoose.Schema.Types.Mixed }, // Raw response from gateway
      // 3D Secure
      requires3D: { type: Boolean, default: false },
      formUrl: { type: String }, // 3D Secure form URL
      processedAt: { type: Date } // When payment was processed
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
    { $group: { _id: null, total: { $sum: '$amount' } } }
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
  return this.findOne({ 'cardDetails.gatewayTransactionId': transactionId })
    .populate('booking', 'bookingNumber confirmationNumber')
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

paymentSchema.methods.processRefund = async function (amount, reason, userId) {
  if (this.status !== 'completed') {
    throw new Error('PAYMENT_NOT_COMPLETED')
  }

  if (amount > this.amount) {
    throw new Error('REFUND_EXCEEDS_PAYMENT')
  }

  this.status = 'refunded'
  this.refund = {
    amount,
    reason,
    refundedAt: new Date(),
    refundedBy: userId
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
    installment: transactionData.installment || 1
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

export default mongoose.model('Payment', paymentSchema)
