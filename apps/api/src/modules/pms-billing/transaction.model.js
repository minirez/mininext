/**
 * Transaction Model
 * Tracks all financial transactions in the hotel
 */

import mongoose from 'mongoose'
import logger from '#core/logger.js'
import { validateForeignKeys } from '#helpers'

// Transaction types
export const TRANSACTION_TYPES = {
  // Income
  ROOM_CHARGE: 'room_charge',
  EXTRA_CHARGE: 'extra_charge',
  RESTAURANT: 'restaurant',
  BAR: 'bar',
  MINIBAR: 'minibar',
  SPA: 'spa',
  LAUNDRY: 'laundry',
  PARKING: 'parking',
  PHONE: 'phone',
  OTHER_INCOME: 'other_income',

  // Payments received
  PAYMENT: 'payment',
  DEPOSIT: 'deposit',
  ADVANCE: 'advance',

  // Refunds/Discounts
  REFUND: 'refund',
  DISCOUNT: 'discount',
  VOID: 'void',

  // Expenses
  EXPENSE: 'expense',
  PAYOUT: 'payout'
}

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
  ROOM_CHARGE: 'room_charge',
  CITY_LEDGER: 'city_ledger',
  VOUCHER: 'voucher',
  ONLINE: 'online',
  OTHER: 'other'
}

// Transaction categories for reporting
export const TRANSACTION_CATEGORIES = {
  ACCOMMODATION: 'accommodation',
  FOOD_BEVERAGE: 'food_beverage',
  SPA_WELLNESS: 'spa_wellness',
  OTHER_SERVICES: 'other_services',
  PAYMENTS: 'payments',
  ADJUSTMENTS: 'adjustments'
}

const transactionSchema = new mongoose.Schema(
  {
    // Hotel reference
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true
    },

    // Transaction number (auto-generated)
    transactionNumber: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined for pre-save hook to generate
      index: true
    },

    // Transaction type
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
      index: true
    },

    // Category for reporting
    category: {
      type: String,
      enum: Object.values(TRANSACTION_CATEGORIES),
      required: true
    },

    // Description
    description: {
      type: String,
      required: true,
      trim: true
    },

    // Amount (positive for income, negative for expense/refund)
    amount: {
      type: Number,
      required: true
    },

    // Currency
    currency: {
      type: String,
      default: 'TRY',
      uppercase: true
    },

    // Amount converted to TRY (for unified reporting)
    amountInTRY: {
      type: Number
    },

    // Conversion details (when currency is not TRY)
    convertedAmount: {
      amount: { type: Number },
      currency: { type: String, uppercase: true },
      rate: { type: Number },
      convertedAt: { type: Date }
    },

    // Exchange rate at time of transaction
    exchangeRate: {
      type: Number
    },

    // Payment method (for payments)
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS)
    },

    // Reference to related entities
    stay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stay',
      index: true
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },

    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest'
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },

    // Cash register/shift reference
    cashRegister: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashRegister'
    },

    // Invoice/Receipt number
    invoiceNumber: {
      type: String,
      trim: true
    },

    receiptNumber: {
      type: String,
      trim: true
    },

    // Reference (for card transactions, bank transfers, etc.)
    reference: {
      type: String,
      trim: true
    },

    // Card details (masked)
    cardDetails: {
      lastFourDigits: { type: String },
      cardType: { type: String }, // visa, mastercard, etc.
      authCode: { type: String }
    },

    // Quantity and unit price (for itemized transactions)
    quantity: {
      type: Number,
      default: 1
    },

    unitPrice: {
      type: Number
    },

    // Tax
    taxRate: {
      type: Number,
      default: 0
    },

    taxAmount: {
      type: Number,
      default: 0
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'refunded'],
      default: 'completed',
      index: true
    },

    // Voided/cancelled info
    voidedAt: { type: Date },
    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    voidReason: { type: String, trim: true },

    // Original transaction (for refunds/voids)
    originalTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },

    // Created by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // POS terminal ID
    terminalId: { type: String, trim: true },

    // Notes
    notes: { type: String, trim: true },

    // Deleted stay info (for audit trail when stay is deleted)
    deletedStayInfo: {
      stayNumber: String,
      checkInDate: Date,
      checkOutDate: Date,
      guestName: String,
      deletedAt: Date
    },

    // Metadata
    metadata: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes
transactionSchema.index({ hotel: 1, createdAt: -1 })
transactionSchema.index({ hotel: 1, type: 1, createdAt: -1 })
transactionSchema.index({ hotel: 1, cashRegister: 1 })
transactionSchema.index({ hotel: 1, stay: 1 })
transactionSchema.index({ hotel: 1, status: 1, createdAt: -1 })

// Additional indexes for performance
transactionSchema.index({ booking: 1 })
transactionSchema.index({ guest: 1 })
transactionSchema.index({ room: 1 })
transactionSchema.index({ createdBy: 1 })
transactionSchema.index({ voidedBy: 1 })
transactionSchema.index({ originalTransaction: 1 }) // For refund tracking

// Query optimization indexes
transactionSchema.index({ hotel: 1, paymentMethod: 1, createdAt: -1 }) // Payment method reporting
transactionSchema.index({ hotel: 1, type: 1, status: 1, createdAt: -1 }) // Detailed transaction filtering
transactionSchema.index({ hotel: 1, guest: 1, createdAt: -1 }) // Guest transaction history
transactionSchema.index({ stay: 1, type: 1 }) // Stay-specific transaction lookups
transactionSchema.index({ hotel: 1, category: 1, createdAt: -1 }) // Category-based reporting
transactionSchema.index({ hotel: 1, currency: 1, createdAt: -1 }) // Multi-currency reporting

// Additional indexes for common queries
transactionSchema.index({ hotel: 1, voidedAt: 1 }) // Voided transaction audit
transactionSchema.index({ hotel: 1, invoiceNumber: 1 }) // Invoice lookup
transactionSchema.index({ hotel: 1, receiptNumber: 1 }) // Receipt lookup
transactionSchema.index({ paymentMethod: 1, status: 1, createdAt: -1 }) // Daily reconciliation

// Pre-save: Validate foreign key references
transactionSchema.pre('save', async function (next) {
  const fkFields = ['hotel', 'stay', 'booking', 'guest', 'room', 'cashRegister']
  const needsValidation = this.isNew || fkFields.some(f => this.isModified(f))

  if (needsValidation) {
    try {
      await validateForeignKeys([
        { model: 'Hotel', id: this.hotel, field: 'Otel', required: true },
        // All optional FKs must belong to the same hotel if provided
        { model: 'Stay', id: this.stay, field: 'Konaklama', query: { hotel: this.hotel } },
        { model: 'Booking', id: this.booking, field: 'Rezervasyon', query: { hotel: this.hotel } },
        { model: 'Guest', id: this.guest, field: 'Misafir', query: { hotel: this.hotel } },
        { model: 'Room', id: this.room, field: 'Oda', query: { hotel: this.hotel } },
        {
          model: 'CashRegister',
          id: this.cashRegister,
          field: 'Kasa',
          query: { hotel: this.hotel }
        }
      ])
    } catch (error) {
      return next(error)
    }
  }
  next()
})

// Pre-save: Generate transaction number and calculate amountInTRY
transactionSchema.pre('save', async function (next) {
  if (this.isNew && !this.transactionNumber) {
    const date = new Date()
    const prefix = 'TXN'
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    // Get count for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const count = await this.constructor.countDocuments({
      hotel: this.hotel,
      createdAt: { $gte: today, $lt: tomorrow }
    })

    const sequence = (count + 1).toString().padStart(5, '0')
    this.transactionNumber = `${prefix}${year}${month}${day}${sequence}`
  }

  // Calculate amountInTRY if currency is not TRY and exchangeRate is provided
  if (this.currency === 'TRY') {
    this.amountInTRY = this.amount
  } else if (this.exchangeRate && this.amount) {
    const rate = this.exchangeRate
    if (rate <= 0 || rate > 10000) {
      this.amountInTRY = this.amount // Fallback to original amount
    } else {
      const rawAmount = this.amount * rate
      this.amountInTRY = Math.round(rawAmount * 100) / 100
    }

    // Store conversion details
    if (!this.convertedAmount || !this.convertedAmount.amount) {
      this.convertedAmount = {
        amount: this.amountInTRY,
        currency: 'TRY',
        rate: this.exchangeRate,
        convertedAt: new Date()
      }
    }
  }

  next()
})

// Virtual: Is income
transactionSchema.virtual('isIncome').get(function () {
  const incomeTypes = [
    TRANSACTION_TYPES.ROOM_CHARGE,
    TRANSACTION_TYPES.EXTRA_CHARGE,
    TRANSACTION_TYPES.RESTAURANT,
    TRANSACTION_TYPES.BAR,
    TRANSACTION_TYPES.MINIBAR,
    TRANSACTION_TYPES.SPA,
    TRANSACTION_TYPES.LAUNDRY,
    TRANSACTION_TYPES.PARKING,
    TRANSACTION_TYPES.PHONE,
    TRANSACTION_TYPES.OTHER_INCOME,
    TRANSACTION_TYPES.PAYMENT,
    TRANSACTION_TYPES.DEPOSIT,
    TRANSACTION_TYPES.ADVANCE
  ]
  return incomeTypes.includes(this.type)
})

// Static: Get daily summary with multi-currency support
transactionSchema.statics.getDailySummary = async function (hotelId, date = new Date()) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const result = await this.aggregate([
    {
      $match: {
        hotel: new mongoose.Types.ObjectId(hotelId),
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $addFields: {
        calculatedAmountInTRY: {
          $switch: {
            branches: [
              {
                case: { $gt: [{ $ifNull: ['$amountInTRY', 0] }, 0] },
                then: '$amountInTRY'
              },
              {
                case: { $eq: [{ $ifNull: ['$currency', 'TRY'] }, 'TRY'] },
                then: '$amount'
              }
            ],
            default: { $multiply: ['$amount', { $ifNull: ['$exchangeRate', 1] }] }
          }
        }
      }
    },
    {
      $group: {
        _id: {
          currency: { $ifNull: ['$currency', 'TRY'] },
          paymentMethod: '$paymentMethod'
        },
        total: { $sum: '$amount' },
        totalInTRY: { $sum: '$calculatedAmountInTRY' },
        count: { $sum: 1 }
      }
    }
  ])

  // Calculate totals (backward compatible - all in TRY)
  const totals = {
    cash: 0,
    card: 0,
    other: 0,
    total: 0,
    totalInTRY: 0,
    transactionCount: 0,
    byCurrency: {}
  }

  result.forEach(item => {
    const currency = item._id.currency || 'TRY'
    const paymentMethod = item._id.paymentMethod

    totals.transactionCount += item.count
    totals.totalInTRY += item.totalInTRY

    // Initialize currency entry if not exists
    if (!totals.byCurrency[currency]) {
      totals.byCurrency[currency] = {
        cash: 0,
        card: 0,
        other: 0,
        total: 0,
        count: 0
      }
    }

    totals.byCurrency[currency].total += item.total
    totals.byCurrency[currency].count += item.count

    if (paymentMethod === PAYMENT_METHODS.CASH) {
      totals.byCurrency[currency].cash += item.total
      totals.cash += item.totalInTRY // For backward compatibility
    } else if ([PAYMENT_METHODS.CREDIT_CARD, PAYMENT_METHODS.DEBIT_CARD].includes(paymentMethod)) {
      totals.byCurrency[currency].card += item.total
      totals.card += item.totalInTRY
    } else {
      totals.byCurrency[currency].other += item.total
      totals.other += item.totalInTRY
    }
  })

  // Calculate total (sum of all in TRY for backward compatibility)
  totals.total = totals.cash + totals.card + totals.other

  return totals
}

// Static: Get transactions by shift
transactionSchema.statics.getByShift = function (cashRegisterId) {
  return this.find({ cashRegister: cashRegisterId, status: { $ne: 'cancelled' } })
    .sort({ createdAt: -1 })
    .lean()
}

// Static: Get stay transactions
transactionSchema.statics.getByStay = function (stayId) {
  return this.find({ stay: stayId, status: { $ne: 'cancelled' } })
    .sort({ createdAt: -1 })
    .lean()
}

// Method: Void transaction
transactionSchema.methods.void = async function (reason, userId) {
  this.status = 'cancelled'
  this.voidedAt = new Date()
  this.voidedBy = userId
  this.voidReason = reason

  const result = await this.save()

  // Reverse CashRegister counters
  if (this.cashRegister) {
    const CashRegister = mongoose.model('CashRegister')
    const shift = await CashRegister.findById(this.cashRegister)
    if (shift) {
      await shift.reverseTransaction(this)
    }
  }

  // If this was a payment transaction, also remove from Stay
  const paymentTypes = [
    TRANSACTION_TYPES.PAYMENT,
    TRANSACTION_TYPES.DEPOSIT,
    TRANSACTION_TYPES.ADVANCE
  ]

  if (this.stay && paymentTypes.includes(this.type)) {
    const Stay = mongoose.model('Stay')
    const stay = await Stay.findById(this.stay)
    if (stay) {
      const originalLength = stay.payments.length
      stay.payments = stay.payments.filter(
        p => !p.transaction || p.transaction.toString() !== this._id.toString()
      )
      if (stay.payments.length < originalLength) {
        await stay.save()
        logger.info(
          `[Transaction Void] Removed payment from Stay ${stay._id}, transaction ${this._id}`
        )
      }
    }
  }

  return result
}

// Method: Create refund
transactionSchema.methods.createRefund = async function (amount, reason, userId) {
  const refund = new this.constructor({
    hotel: this.hotel,
    type: TRANSACTION_TYPES.REFUND,
    category: TRANSACTION_CATEGORIES.ADJUSTMENTS,
    description: `Refund: ${this.description}`,
    amount: -Math.abs(amount),
    currency: this.currency,
    paymentMethod: this.paymentMethod,
    stay: this.stay,
    booking: this.booking,
    guest: this.guest,
    cashRegister: this.cashRegister,
    originalTransaction: this._id,
    createdBy: userId,
    notes: reason
  })

  await refund.save()

  // Update original transaction status
  this.status = 'refunded'
  await this.save()

  return refund
}

// ==========================================
// POST-SAVE HOOKS - AUTO SYNC
// ==========================================

/**
 * Post-save: Auto-sync with CashRegister
 */
transactionSchema.post('save', async function (doc) {
  if (!doc.wasNew) return

  try {
    const CashRegister = mongoose.model('CashRegister')

    if (!doc.cashRegister) {
      const activeShift = await CashRegister.getActiveShift(doc.hotel)
      if (activeShift) {
        await mongoose.model('Transaction').findByIdAndUpdate(doc._id, {
          cashRegister: activeShift._id
        })
        await activeShift.recordTransactionWithCurrency(doc, doc.currency || 'TRY')
      }
    } else {
      const shift = await CashRegister.findById(doc.cashRegister)
      if (shift && shift.status === 'open') {
        await shift.recordTransactionWithCurrency(doc, doc.currency || 'TRY')
      }
    }
  } catch (error) {
    logger.error('[Transaction Post-Save] CashRegister sync error:', error.message)
  }
})

/**
 * Post-save: Auto-sync with Stay for payment transactions
 */
transactionSchema.post('save', async function (doc) {
  if (!doc.wasNew) return
  if (!doc.stay) return

  const paymentTypes = [
    TRANSACTION_TYPES.PAYMENT,
    TRANSACTION_TYPES.DEPOSIT,
    TRANSACTION_TYPES.ADVANCE
  ]

  const chargeTypes = [
    TRANSACTION_TYPES.EXTRA_CHARGE,
    TRANSACTION_TYPES.RESTAURANT,
    TRANSACTION_TYPES.BAR,
    TRANSACTION_TYPES.MINIBAR,
    TRANSACTION_TYPES.SPA,
    TRANSACTION_TYPES.LAUNDRY,
    TRANSACTION_TYPES.PARKING,
    TRANSACTION_TYPES.PHONE,
    TRANSACTION_TYPES.OTHER_INCOME
  ]

  try {
    const Stay = mongoose.model('Stay')
    const stay = await Stay.findById(doc.stay)
    if (!stay) return

    if (paymentTypes.includes(doc.type)) {
      await stay.addPayment(
        {
          amount: doc.amount,
          method: doc.paymentMethod,
          currency: doc.currency,
          exchangeRate: doc.exchangeRate,
          amountInBaseCurrency: doc.amountInTRY ?? doc.amount,
          reference: doc.reference,
          notes: doc.notes,
          transaction: doc._id
        },
        doc.createdBy
      )
    } else if (chargeTypes.includes(doc.type)) {
      await stay.addExtra(
        {
          description: doc.description,
          amount: doc.amountInTRY ?? doc.amount,
          quantity: doc.quantity || 1,
          category: mapTransactionTypeToExtraCategory(doc.type),
          currency: doc.currency,
          exchangeRate: doc.exchangeRate,
          amountInBaseCurrency: doc.amountInTRY
        },
        doc.createdBy
      )
    }
  } catch (error) {
    logger.error('[Transaction Post-Save] Stay sync error:', error.message)
  }
})

/**
 * Post-save: Handle void/cancel - reverse CashRegister counters
 */
transactionSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc) return

  const update = this.getUpdate()
  if (!update || !update.$set || update.$set.status !== 'cancelled') return

  try {
    if (doc.cashRegister) {
      const CashRegister = mongoose.model('CashRegister')
      const shift = await CashRegister.findById(doc.cashRegister)
      if (shift) {
        await shift.reverseTransaction(doc)
      }
    }

    const paymentTypes = [
      TRANSACTION_TYPES.PAYMENT,
      TRANSACTION_TYPES.DEPOSIT,
      TRANSACTION_TYPES.ADVANCE
    ]

    if (doc.stay && paymentTypes.includes(doc.type)) {
      const Stay = mongoose.model('Stay')
      const stay = await Stay.findById(doc.stay)
      if (stay) {
        const originalLength = stay.payments.length
        stay.payments = stay.payments.filter(
          p => !p.transaction || p.transaction.toString() !== doc._id.toString()
        )
        if (stay.payments.length < originalLength) {
          await stay.save()
          logger.info(
            `[Transaction Void] Removed payment from Stay ${stay._id}, transaction ${doc._id}`
          )
        }
      }
    }
  } catch (error) {
    logger.error('[Transaction Post-Update] Void rollback error:', error.message)
  }
})

// Helper: Map transaction type to extra category
function mapTransactionTypeToExtraCategory(type) {
  const mapping = {
    [TRANSACTION_TYPES.RESTAURANT]: 'restaurant',
    [TRANSACTION_TYPES.BAR]: 'restaurant',
    [TRANSACTION_TYPES.MINIBAR]: 'minibar',
    [TRANSACTION_TYPES.SPA]: 'spa',
    [TRANSACTION_TYPES.LAUNDRY]: 'laundry',
    [TRANSACTION_TYPES.PHONE]: 'phone',
    [TRANSACTION_TYPES.PARKING]: 'other',
    [TRANSACTION_TYPES.EXTRA_CHARGE]: 'other',
    [TRANSACTION_TYPES.OTHER_INCOME]: 'other'
  }
  return mapping[type] || 'other'
}

// Pre-save: Mark as new for post-save hooks
transactionSchema.pre('save', function (next) {
  this.wasNew = this.isNew
  next()
})

export default mongoose.model('Transaction', transactionSchema)
