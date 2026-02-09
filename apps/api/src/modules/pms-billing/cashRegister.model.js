/**
 * Cash Register Model
 * Manages cashier shifts and daily cash operations
 */

import mongoose from 'mongoose'

// Shift status
export const SHIFT_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  SUSPENDED: 'suspended'
}

// Cash movement types
export const CASH_MOVEMENT_TYPES = {
  OPENING: 'opening',
  SALE: 'sale',
  REFUND: 'refund',
  PAYOUT: 'payout',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  ADJUSTMENT: 'adjustment',
  CLOSING: 'closing'
}

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  'TRY',
  'USD',
  'EUR',
  'GBP',
  'RUB',
  'SAR',
  'AED',
  'CHF',
  'JPY',
  'CNY'
]

// Cash movement schema
const cashMovementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(CASH_MOVEMENT_TYPES),
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'TRY',
      uppercase: true,
      enum: SUPPORTED_CURRENCIES
    },
    description: {
      type: String,
      trim: true
    },
    reference: {
      type: String,
      trim: true
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { _id: true }
)

// Currency balance schema (for multi-currency support)
const currencyBalanceSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      required: true,
      uppercase: true,
      enum: SUPPORTED_CURRENCIES
    },
    cash: { type: Number, default: 0 },
    card: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    denominations: [
      {
        denomination: { type: Number, required: true },
        count: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
      }
    ]
  },
  { _id: false }
)

// Currency totals schema (for per-currency reporting)
const currencyTotalsSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      required: true,
      uppercase: true,
      enum: SUPPORTED_CURRENCIES
    },
    grossSales: { type: Number, default: 0 },
    netSales: { type: Number, default: 0 },
    cashReceived: { type: Number, default: 0 },
    cardReceived: { type: Number, default: 0 },
    otherReceived: { type: Number, default: 0 },
    refunds: { type: Number, default: 0 },
    payouts: { type: Number, default: 0 },
    deposits: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 }
  },
  { _id: false }
)

// Denomination count schema (for cash counting)
const denominationSchema = new mongoose.Schema(
  {
    denomination: { type: Number, required: true },
    count: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  { _id: false }
)

const cashRegisterSchema = new mongoose.Schema(
  {
    // Hotel reference
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true
    },

    // Shift number (auto-generated)
    shiftNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    // Register/Terminal ID
    registerId: {
      type: String,
      default: 'MAIN',
      trim: true
    },

    // Status
    status: {
      type: String,
      enum: Object.values(SHIFT_STATUS),
      default: SHIFT_STATUS.OPEN,
      index: true
    },

    // Cashier
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    cashierName: {
      type: String,
      trim: true
    },

    // Shift timing
    openedAt: {
      type: Date,
      required: true,
      default: Date.now
    },

    closedAt: {
      type: Date
    },

    // Opening balance
    openingBalance: {
      cash: { type: Number, default: 0 },
      denominations: [denominationSchema]
    },

    // Current balance (updated with each transaction)
    currentBalance: {
      cash: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },

    // Closing balance
    closingBalance: {
      cash: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      denominations: [denominationSchema]
    },

    // ==========================================
    // MULTI-CURRENCY SUPPORT
    // ==========================================

    // Active currencies for this shift
    activeCurrencies: {
      type: [String],
      default: ['TRY'],
      validate: {
        validator: function (v) {
          return v.every(c => SUPPORTED_CURRENCIES.includes(c))
        },
        message: 'Invalid currency in activeCurrencies'
      }
    },

    // Multi-currency opening balances
    openingBalances: [currencyBalanceSchema],

    // Multi-currency current balances
    currentBalances: [currencyBalanceSchema],

    // Multi-currency closing balances
    closingBalances: [currencyBalanceSchema],

    // Per-currency totals
    currencyTotals: [currencyTotalsSchema],

    // Exchange rates snapshot at shift opening (for reporting)
    exchangeRatesSnapshot: {
      baseCurrency: { type: String, default: 'TRY' },
      rates: mongoose.Schema.Types.Mixed,
      capturedAt: { type: Date }
    },

    // ==========================================
    // END MULTI-CURRENCY SUPPORT
    // ==========================================

    // Expected vs actual (for discrepancy tracking)
    expectedCash: { type: Number, default: 0 },
    actualCash: { type: Number, default: 0 },
    discrepancy: { type: Number, default: 0 },
    discrepancyNote: { type: String, trim: true },

    // Transaction counts
    transactionCounts: {
      total: { type: Number, default: 0 },
      cash: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
      refunds: { type: Number, default: 0 },
      voids: { type: Number, default: 0 }
    },

    // Summary totals
    totals: {
      grossSales: { type: Number, default: 0 },
      discounts: { type: Number, default: 0 },
      refunds: { type: Number, default: 0 },
      netSales: { type: Number, default: 0 },
      cashReceived: { type: Number, default: 0 },
      cardReceived: { type: Number, default: 0 },
      otherReceived: { type: Number, default: 0 },
      payouts: { type: Number, default: 0 },
      deposits: { type: Number, default: 0 }
    },

    // Cash movements (in/out)
    cashMovements: [cashMovementSchema],

    // Notes
    openingNotes: { type: String, trim: true },
    closingNotes: { type: String, trim: true },

    // Closed by (can be different from cashier)
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Verified by supervisor
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: { type: Date },

    // Print status
    reportPrinted: { type: Boolean, default: false },
    reportPrintedAt: { type: Date }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes
cashRegisterSchema.index({ hotel: 1, status: 1 })
cashRegisterSchema.index({ hotel: 1, openedAt: -1 })
cashRegisterSchema.index({ hotel: 1, cashier: 1, status: 1 })

// Additional indexes for auditing
cashRegisterSchema.index({ cashier: 1 })
cashRegisterSchema.index({ closedBy: 1 })
cashRegisterSchema.index({ verifiedBy: 1 })

// Pre-save: Generate shift number
cashRegisterSchema.pre('save', async function (next) {
  if (this.isNew && !this.shiftNumber) {
    const date = new Date()
    const prefix = 'SFT'
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
      openedAt: { $gte: today, $lt: tomorrow }
    })

    const sequence = (count + 1).toString().padStart(3, '0')
    this.shiftNumber = `${prefix}${year}${month}${day}${sequence}`
  }
  next()
})

// Virtual: Duration in hours
cashRegisterSchema.virtual('durationHours').get(function () {
  const end = this.closedAt || new Date()
  const start = this.openedAt
  return ((end - start) / (1000 * 60 * 60)).toFixed(2)
})

// Method: Add cash movement
cashRegisterSchema.methods.addCashMovement = function (movement) {
  this.cashMovements.push(movement)

  // Update current balance
  if ([CASH_MOVEMENT_TYPES.SALE, CASH_MOVEMENT_TYPES.DEPOSIT].includes(movement.type)) {
    this.currentBalance.cash += movement.amount
  } else if (
    [
      CASH_MOVEMENT_TYPES.REFUND,
      CASH_MOVEMENT_TYPES.PAYOUT,
      CASH_MOVEMENT_TYPES.WITHDRAWAL
    ].includes(movement.type)
  ) {
    this.currentBalance.cash -= Math.abs(movement.amount)
  }

  return this.save()
}

// Method: Record transaction
cashRegisterSchema.methods.recordTransaction = function (transaction) {
  this.transactionCounts.total++

  const amount = transaction.amount

  if (transaction.paymentMethod === 'cash') {
    this.transactionCounts.cash++
    this.currentBalance.cash += amount
    this.totals.cashReceived += amount
  } else if (['credit_card', 'debit_card'].includes(transaction.paymentMethod)) {
    this.transactionCounts.card++
    this.currentBalance.card += amount
    this.totals.cardReceived += amount
  } else {
    this.currentBalance.other += amount
    this.totals.otherReceived += amount
  }

  if (transaction.type === 'refund') {
    this.transactionCounts.refunds++
    this.totals.refunds += Math.abs(amount)
  } else {
    this.totals.grossSales += amount
  }

  this.totals.netSales = this.totals.grossSales - this.totals.discounts - this.totals.refunds

  return this.save()
}

// Method: Close shift
cashRegisterSchema.methods.closeShift = function (closingData, userId) {
  this.status = SHIFT_STATUS.CLOSED
  this.closedAt = new Date()
  this.closedBy = userId

  if (closingData.closingBalance) {
    this.closingBalance = closingData.closingBalance
  }

  if (closingData.actualCash !== undefined) {
    this.actualCash = closingData.actualCash
    this.expectedCash = this.openingBalance.cash + this.totals.cashReceived - this.totals.payouts
    this.discrepancy = this.actualCash - this.expectedCash
    this.discrepancyNote = closingData.discrepancyNote
  }

  if (closingData.closingNotes) {
    this.closingNotes = closingData.closingNotes
  }

  // Add closing movement
  this.cashMovements.push({
    type: CASH_MOVEMENT_TYPES.CLOSING,
    amount: this.actualCash || this.currentBalance.cash,
    description: 'Shift closed',
    createdAt: new Date(),
    createdBy: userId
  })

  return this.save()
}

// ==========================================
// MULTI-CURRENCY METHODS
// ==========================================

// Method: Get or create currency balance
cashRegisterSchema.methods.getCurrencyBalance = function (currency) {
  let balance = this.currentBalances.find(b => b.currency === currency)
  if (!balance) {
    balance = { currency, cash: 0, card: 0, other: 0 }
    this.currentBalances.push(balance)
  }
  return balance
}

// Method: Get or create currency totals
cashRegisterSchema.methods.getCurrencyTotals = function (currency) {
  let totals = this.currencyTotals.find(t => t.currency === currency)
  if (!totals) {
    totals = {
      currency,
      grossSales: 0,
      netSales: 0,
      cashReceived: 0,
      cardReceived: 0,
      otherReceived: 0,
      refunds: 0,
      payouts: 0,
      deposits: 0,
      discounts: 0
    }
    this.currencyTotals.push(totals)
  }
  return totals
}

// Method: Add cash movement with currency
cashRegisterSchema.methods.addCashMovementWithCurrency = function (movement) {
  const currency = movement.currency || 'TRY'
  this.cashMovements.push({ ...movement, currency })

  // Find or create currency balance
  let balance = this.currentBalances.find(b => b.currency === currency)
  if (!balance) {
    balance = { currency, cash: 0, card: 0, other: 0 }
    this.currentBalances.push(balance)
  }

  // Update currency balance
  if ([CASH_MOVEMENT_TYPES.SALE, CASH_MOVEMENT_TYPES.DEPOSIT].includes(movement.type)) {
    balance.cash += movement.amount
  } else if (
    [
      CASH_MOVEMENT_TYPES.REFUND,
      CASH_MOVEMENT_TYPES.PAYOUT,
      CASH_MOVEMENT_TYPES.WITHDRAWAL
    ].includes(movement.type)
  ) {
    balance.cash -= Math.abs(movement.amount)
  }

  // Also update legacy single-currency balance for TRY (backward compatibility)
  if (currency === 'TRY') {
    if ([CASH_MOVEMENT_TYPES.SALE, CASH_MOVEMENT_TYPES.DEPOSIT].includes(movement.type)) {
      this.currentBalance.cash += movement.amount
    } else if (
      [
        CASH_MOVEMENT_TYPES.REFUND,
        CASH_MOVEMENT_TYPES.PAYOUT,
        CASH_MOVEMENT_TYPES.WITHDRAWAL
      ].includes(movement.type)
    ) {
      this.currentBalance.cash -= Math.abs(movement.amount)
    }
  }

  return this.save()
}

// Method: Record transaction with currency
cashRegisterSchema.methods.recordTransactionWithCurrency = function (
  transaction,
  currency = 'TRY'
) {
  this.transactionCounts.total++

  const amount = transaction.amount

  // Find or create currency balance and totals
  let balance = this.currentBalances.find(b => b.currency === currency)
  if (!balance) {
    balance = { currency, cash: 0, card: 0, other: 0 }
    this.currentBalances.push(balance)
  }

  let currencyTotal = this.currencyTotals.find(t => t.currency === currency)
  if (!currencyTotal) {
    currencyTotal = {
      currency,
      grossSales: 0,
      netSales: 0,
      cashReceived: 0,
      cardReceived: 0,
      otherReceived: 0,
      refunds: 0,
      payouts: 0,
      deposits: 0,
      discounts: 0
    }
    this.currencyTotals.push(currencyTotal)
  }

  // Update based on payment method
  if (transaction.paymentMethod === 'cash') {
    this.transactionCounts.cash++
    balance.cash += amount
    currencyTotal.cashReceived += amount
  } else if (['credit_card', 'debit_card'].includes(transaction.paymentMethod)) {
    this.transactionCounts.card++
    balance.card += amount
    currencyTotal.cardReceived += amount
  } else {
    balance.other += amount
    currencyTotal.otherReceived += amount
  }

  // Update totals
  if (transaction.type === 'refund') {
    this.transactionCounts.refunds++
    currencyTotal.refunds += Math.abs(amount)
  } else {
    currencyTotal.grossSales += amount
  }

  currencyTotal.netSales =
    currencyTotal.grossSales - currencyTotal.discounts - currencyTotal.refunds

  // Also update legacy single-currency totals for TRY (backward compatibility)
  if (currency === 'TRY') {
    if (transaction.paymentMethod === 'cash') {
      this.currentBalance.cash += amount
      this.totals.cashReceived += amount
    } else if (['credit_card', 'debit_card'].includes(transaction.paymentMethod)) {
      this.currentBalance.card += amount
      this.totals.cardReceived += amount
    } else {
      this.currentBalance.other += amount
      this.totals.otherReceived += amount
    }

    if (transaction.type === 'refund') {
      this.totals.refunds += Math.abs(amount)
    } else {
      this.totals.grossSales += amount
    }

    this.totals.netSales = this.totals.grossSales - this.totals.discounts - this.totals.refunds
  }

  return this.save()
}

// Method: Close shift with multi-currency
cashRegisterSchema.methods.closeShiftMultiCurrency = function (closingData, userId) {
  this.status = SHIFT_STATUS.CLOSED
  this.closedAt = new Date()
  this.closedBy = userId

  // Set multi-currency closing balances
  if (closingData.closingBalances && Array.isArray(closingData.closingBalances)) {
    this.closingBalances = closingData.closingBalances
  }

  // Legacy single-currency closing (for TRY or backward compatibility)
  if (closingData.closingBalance) {
    this.closingBalance = closingData.closingBalance
  }

  // Handle discrepancy for each currency
  if (closingData.actualCash !== undefined) {
    this.actualCash = closingData.actualCash
    this.expectedCash =
      (this.openingBalance?.cash || 0) +
      (this.totals?.cashReceived || 0) -
      (this.totals?.payouts || 0)
    this.discrepancy = this.actualCash - this.expectedCash
    this.discrepancyNote = closingData.discrepancyNote
  }

  if (closingData.closingNotes) {
    this.closingNotes = closingData.closingNotes
  }

  // Add closing movements for each currency
  const currencies = this.activeCurrencies.length > 0 ? this.activeCurrencies : ['TRY']
  currencies.forEach(currency => {
    const balance = this.currentBalances.find(b => b.currency === currency)
    if (balance) {
      this.cashMovements.push({
        type: CASH_MOVEMENT_TYPES.CLOSING,
        amount: balance.cash,
        currency,
        description: `Shift closed - ${currency}`,
        createdAt: new Date(),
        createdBy: userId
      })
    }
  })

  return this.save()
}

// Method: Get total in base currency (for reporting)
cashRegisterSchema.methods.getTotalInBaseCurrency = function (exchangeRates, baseCurrency = 'TRY') {
  let total = 0

  for (const currencyTotal of this.currencyTotals) {
    const currency = currencyTotal.currency
    const netSales = currencyTotal.netSales || 0

    if (currency === baseCurrency) {
      total += netSales
    } else if (exchangeRates && exchangeRates[currency]) {
      total += netSales / exchangeRates[currency]
    }
  }

  return Math.round(total * 100) / 100
}

// Method: Initialize multi-currency balances
cashRegisterSchema.methods.initializeCurrencyBalances = function (
  currencies,
  openingBalances = []
) {
  this.activeCurrencies = currencies

  // Initialize current balances for each currency
  currencies.forEach(currency => {
    const opening = openingBalances.find(b => b.currency === currency) || {
      cash: 0,
      card: 0,
      other: 0
    }
    this.currentBalances.push({
      currency,
      cash: opening.cash || 0,
      card: opening.card || 0,
      other: opening.other || 0
    })
    this.openingBalances.push({
      currency,
      cash: opening.cash || 0,
      card: opening.card || 0,
      other: opening.other || 0
    })
    this.currencyTotals.push({
      currency,
      grossSales: 0,
      netSales: 0,
      cashReceived: 0,
      cardReceived: 0,
      otherReceived: 0,
      refunds: 0,
      payouts: 0,
      deposits: 0,
      discounts: 0
    })
  })

  return this
}

/**
 * Method: Reverse a transaction (for voided/cancelled transactions)
 */
cashRegisterSchema.methods.reverseTransaction = async function (transaction) {
  const currency = transaction.currency || 'TRY'
  const amount = transaction.amount

  // Decrement transaction counts
  this.transactionCounts.total = Math.max(0, (this.transactionCounts.total || 0) - 1)

  // Find or create currency balance and totals
  const balance = this.currentBalances.find(b => b.currency === currency)
  const currencyTotal = this.currencyTotals.find(t => t.currency === currency)

  // Reverse based on payment method
  if (transaction.paymentMethod === 'cash') {
    this.transactionCounts.cash = Math.max(0, (this.transactionCounts.cash || 0) - 1)
    if (balance) balance.cash -= amount
    if (currencyTotal) currencyTotal.cashReceived -= amount
    if (currency === 'TRY') {
      this.currentBalance.cash -= amount
      this.totals.cashReceived -= amount
    }
  } else if (['credit_card', 'debit_card'].includes(transaction.paymentMethod)) {
    this.transactionCounts.card = Math.max(0, (this.transactionCounts.card || 0) - 1)
    if (balance) balance.card -= amount
    if (currencyTotal) currencyTotal.cardReceived -= amount
    if (currency === 'TRY') {
      this.currentBalance.card -= amount
      this.totals.cardReceived -= amount
    }
  } else {
    if (balance) balance.other -= amount
    if (currencyTotal) currencyTotal.otherReceived -= amount
    if (currency === 'TRY') {
      this.currentBalance.other -= amount
      this.totals.otherReceived -= amount
    }
  }

  // Reverse totals based on transaction type
  if (transaction.type === 'refund') {
    this.transactionCounts.refunds = Math.max(0, (this.transactionCounts.refunds || 0) - 1)
    if (currencyTotal) currencyTotal.refunds -= Math.abs(amount)
    if (currency === 'TRY') {
      this.totals.refunds -= Math.abs(amount)
    }
  } else {
    if (currencyTotal) currencyTotal.grossSales -= amount
    if (currency === 'TRY') {
      this.totals.grossSales -= amount
    }
  }

  // Recalculate net sales
  if (currencyTotal) {
    currencyTotal.netSales =
      currencyTotal.grossSales - currencyTotal.discounts - currencyTotal.refunds
  }
  this.totals.netSales = this.totals.grossSales - this.totals.discounts - this.totals.refunds

  // Increment void count
  this.transactionCounts.voids = (this.transactionCounts.voids || 0) + 1

  // Add cash movement for reversal
  this.cashMovements.push({
    type: CASH_MOVEMENT_TYPES.ADJUSTMENT,
    amount: -amount,
    currency,
    description: `Void: ${transaction.transactionNumber || transaction._id}`,
    reference: transaction.transactionNumber,
    transaction: transaction._id,
    createdAt: new Date()
  })

  return this.save()
}

// Static: Get active shift for cashier
cashRegisterSchema.statics.getActiveShift = function (hotelId, cashierId = null) {
  const query = {
    hotel: hotelId,
    status: SHIFT_STATUS.OPEN
  }

  if (cashierId) {
    query.cashier = cashierId
  }

  return this.findOne(query).sort({ openedAt: -1 })
}

// Static: Get shifts for date
cashRegisterSchema.statics.getShiftsForDate = function (hotelId, date = new Date()) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  return this.find({
    hotel: hotelId,
    openedAt: { $gte: startOfDay, $lt: endOfDay }
  })
    .sort({ openedAt: -1 })
    .populate('cashier', 'name email')
    .lean()
}

// Static: Get daily summary
cashRegisterSchema.statics.getDailySummary = async function (hotelId, date = new Date()) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const shifts = await this.find({
    hotel: hotelId,
    openedAt: { $gte: startOfDay, $lt: endOfDay }
  }).lean()

  const summary = {
    totalShifts: shifts.length,
    openShifts: shifts.filter(s => s.status === SHIFT_STATUS.OPEN).length,
    closedShifts: shifts.filter(s => s.status === SHIFT_STATUS.CLOSED).length,
    totalTransactions: 0,
    grossSales: 0,
    netSales: 0,
    cashReceived: 0,
    cardReceived: 0,
    refunds: 0,
    discrepancy: 0
  }

  shifts.forEach(shift => {
    summary.totalTransactions += shift.transactionCounts?.total || 0
    summary.grossSales += shift.totals?.grossSales || 0
    summary.netSales += shift.totals?.netSales || 0
    summary.cashReceived += shift.totals?.cashReceived || 0
    summary.cardReceived += shift.totals?.cardReceived || 0
    summary.refunds += shift.totals?.refunds || 0
    summary.discrepancy += shift.discrepancy || 0
  })

  return summary
}

export default mongoose.model('CashRegister', cashRegisterSchema)
