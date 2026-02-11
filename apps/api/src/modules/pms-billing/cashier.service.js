/**
 * Cashier Service
 * Handles cashier/POS operations
 */

import { asyncHandler, escapeRegex } from '#helpers'
import { parsePagination } from '#services/queryBuilder.js'
import Transaction, {
  TRANSACTION_TYPES,
  TRANSACTION_CATEGORIES,
  PAYMENT_METHODS
} from './transaction.model.js'
import CashRegister, {
  SHIFT_STATUS,
  CASH_MOVEMENT_TYPES,
  SUPPORTED_CURRENCIES
} from './cashRegister.model.js'
import Stay from '#modules/pms-frontdesk/stay.model.js'
import Hotel from '#modules/hotel/hotel.model.js'
import PmsSettings from '#modules/pms-settings/settings.model.js'
import { getExchangeRates, convertCurrency } from '#services/currencyService.js'

import { DEFAULT_CASHIER_NAME } from '#constants/defaults.js'
import { emitToRoom } from '#core/socket.js'

const emitTransactionUpdate = (hotelId, action, data) => {
  emitToRoom(`hotel:${hotelId}`, 'transaction', { hotelId, timestamp: Date.now(), action, ...data })
}

// ==========================================
// SHIFT MANAGEMENT
// ==========================================

// Get active shift
export const getActiveShift = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const shift = await CashRegister.getActiveShift(hotelId)

  res.json({
    success: true,
    data: shift
  })
})

// Get all shifts with filters
export const getShifts = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { date, status } = req.query
  const { page, limit, skip } = parsePagination(req.query)

  const query = { hotel: hotelId }

  if (status && status !== 'all') {
    query.status = status
  }

  if (date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)
    query.openedAt = { $gte: startOfDay, $lt: endOfDay }
  }

  const [shifts, total] = await Promise.all([
    CashRegister.find(query)
      .sort({ openedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('cashier', 'name email')
      .populate('closedBy', 'name email')
      .lean(),
    CashRegister.countDocuments(query)
  ])

  res.json({
    success: true,
    data: shifts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
})

// Get single shift
export const getShift = asyncHandler(async (req, res) => {
  const { hotelId, shiftId } = req.params

  const shift = await CashRegister.findOne({
    _id: shiftId,
    hotel: hotelId
  })
    .populate('cashier', 'name email')
    .populate('closedBy', 'name email')
    .lean()

  if (!shift) {
    return res.status(404).json({
      success: false,
      message: 'Shift not found'
    })
  }

  // Get transactions for this shift
  const transactions = await Transaction.find({
    cashRegister: shiftId,
    status: { $ne: 'cancelled' }
  })
    .sort({ createdAt: -1 })
    .lean()

  res.json({
    success: true,
    data: {
      ...shift,
      transactions
    }
  })
})

// Open new shift
export const openShift = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const {
    openingCash = 0,
    registerId = 'MAIN',
    notes,
    // Multi-currency support
    activeCurrencies = ['TRY'],
    openingBalances = []
  } = req.body

  // Check if there's already an open shift
  const existingShift = await CashRegister.getActiveShift(hotelId)
  if (existingShift) {
    return res.status(400).json({
      success: false,
      message: 'Zaten acik bir vardiya var. Once mevcut vardiyayi kapatmaniz gerekiyor.'
    })
  }

  // Get hotel
  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Hotel not found'
    })
  }

  // Capture exchange rates at shift opening
  const { rates, baseCurrency } = await getExchangeRates()
  const exchangeRatesSnapshot = {
    baseCurrency,
    rates,
    capturedAt: new Date()
  }

  const shift = new CashRegister({
    hotel: hotelId,
    registerId,
    cashier: req.user?._id,
    cashierName:
      req.user?.fullName ||
      req.user?.firstName ||
      req.user?.name ||
      req.user?.email ||
      DEFAULT_CASHIER_NAME,
    // Legacy single-currency (backward compatibility)
    openingBalance: {
      cash: openingCash
    },
    currentBalance: {
      cash: openingCash,
      card: 0,
      other: 0
    },
    // Multi-currency support
    activeCurrencies,
    exchangeRatesSnapshot,
    openingNotes: notes,
    cashMovements: [
      {
        type: CASH_MOVEMENT_TYPES.OPENING,
        amount: openingCash,
        currency: 'TRY',
        description: 'Shift opened',
        createdAt: new Date(),
        createdBy: req.user?._id
      }
    ]
  })

  // Initialize multi-currency balances
  if (activeCurrencies.length > 0 || openingBalances.length > 0) {
    shift.initializeCurrencyBalances(
      activeCurrencies.length > 0 ? activeCurrencies : ['TRY'],
      openingBalances
    )

    // Add opening movements for each currency with non-zero balance
    openingBalances.forEach(bal => {
      if (bal.cash > 0) {
        shift.cashMovements.push({
          type: CASH_MOVEMENT_TYPES.OPENING,
          amount: bal.cash,
          currency: bal.currency,
          description: `Shift opened - ${bal.currency}`,
          createdAt: new Date(),
          createdBy: req.user?._id
        })
      }
    })
  }

  await shift.save()

  res.status(201).json({
    success: true,
    data: shift
  })
})

// Close shift
export const closeShift = asyncHandler(async (req, res) => {
  const { hotelId, shiftId } = req.params
  const {
    actualCash,
    closingNotes,
    discrepancyNote,
    // Multi-currency support
    closingBalances = []
  } = req.body

  const shift = await CashRegister.findOne({
    _id: shiftId,
    hotel: hotelId,
    status: SHIFT_STATUS.OPEN
  })

  if (!shift) {
    return res.status(404).json({
      success: false,
      message: 'Open shift not found'
    })
  }

  // Use multi-currency close if closingBalances provided
  if (closingBalances.length > 0) {
    await shift.closeShiftMultiCurrency(
      {
        closingBalances,
        closingNotes,
        discrepancyNote,
        actualCash
      },
      req.user?._id
    )
  } else {
    await shift.closeShift(
      {
        actualCash,
        closingNotes,
        discrepancyNote
      },
      req.user?._id
    )
  }

  res.json({
    success: true,
    data: shift
  })
})

// Add cash movement (payout, deposit, etc.)
export const addCashMovement = asyncHandler(async (req, res) => {
  const { hotelId, shiftId } = req.params
  const { type, amount, description, reference, currency = 'TRY' } = req.body

  if (!type || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Type and amount are required'
    })
  }

  const shift = await CashRegister.findOne({
    _id: shiftId,
    hotel: hotelId,
    status: SHIFT_STATUS.OPEN
  })

  if (!shift) {
    return res.status(404).json({
      success: false,
      message: 'Open shift not found'
    })
  }

  // Use multi-currency method if currency is specified
  await shift.addCashMovementWithCurrency({
    type,
    amount,
    currency,
    description,
    reference,
    createdBy: req.user?._id
  })

  // Update totals (for both legacy and multi-currency)
  if (type === CASH_MOVEMENT_TYPES.PAYOUT) {
    if (currency === 'TRY') {
      shift.totals.payouts += Math.abs(amount)
    }
    // Update currency-specific totals
    const currencyTotals = shift.currencyTotals.find(t => t.currency === currency)
    if (currencyTotals) {
      currencyTotals.payouts += Math.abs(amount)
    }
  } else if (type === CASH_MOVEMENT_TYPES.DEPOSIT) {
    if (currency === 'TRY') {
      shift.totals.deposits += amount
    }
    const currencyTotals = shift.currencyTotals.find(t => t.currency === currency)
    if (currencyTotals) {
      currencyTotals.deposits += amount
    }
  }
  await shift.save()

  res.json({
    success: true,
    data: shift
  })
})

// Get daily summary
export const getDailySummary = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { date } = req.query

  const targetDate = date ? new Date(date) : new Date()

  const [shiftSummary, transactionSummary] = await Promise.all([
    CashRegister.getDailySummary(hotelId, targetDate),
    Transaction.getDailySummary(hotelId, targetDate)
  ])

  res.json({
    success: true,
    data: {
      date: targetDate.toISOString().split('T')[0],
      shifts: shiftSummary,
      transactions: transactionSummary
    }
  })
})

// ==========================================
// TRANSACTION MANAGEMENT
// ==========================================

// Get transactions
export const getTransactions = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { type, status, currency, startDate, endDate, search } = req.query
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 })

  const query = { hotel: hotelId }

  if (type && type !== 'all') {
    query.type = type
  }

  if (status && status !== 'all') {
    query.status = status
  }

  if (currency && currency !== 'all') {
    query.currency = currency
  }

  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setDate(end.getDate() + 1)
      query.createdAt.$lt = end
    }
  }

  // Escape regex special characters to prevent injection
  if (search) {
    const escapedSearch = escapeRegex(search)
    query.$or = [
      { transactionNumber: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } },
      { reference: { $regex: escapedSearch, $options: 'i' } }
    ]
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('stay', 'stayNumber')
      .populate('guest', 'firstName lastName')
      .populate('room', 'roomNumber')
      .lean(),
    Transaction.countDocuments(query)
  ])

  res.json({
    success: true,
    data: transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
})

// Create transaction
export const createTransaction = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const {
    type,
    category,
    description,
    amount,
    currency = 'TRY',
    paymentMethod = PAYMENT_METHODS.CASH,
    stayId,
    guestId,
    roomId,
    quantity = 1,
    unitPrice,
    reference,
    notes
  } = req.body

  if (!type || !description || amount === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Type, description and amount are required'
    })
  }

  // Get hotel
  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Hotel not found'
    })
  }

  // Expense types should store negative amounts
  const EXPENSE_TYPES = ['expense', 'payout', 'refund', 'discount']
  const finalAmount = EXPENSE_TYPES.includes(type) && amount > 0 ? -amount : amount

  // Get active shift
  const activeShift = await CashRegister.getActiveShift(hotelId)

  // Calculate exchange rate and amount in TRY
  let exchangeRate = 1
  let amountInTRY = finalAmount
  if (currency !== 'TRY') {
    try {
      const conversion = await convertCurrency(Math.abs(finalAmount), currency, 'TRY')
      exchangeRate = conversion.rate
      amountInTRY = finalAmount < 0 ? -conversion.convertedAmount : conversion.convertedAmount
    } catch (error) {
      // Fallback: use shift's captured rates if available
      if (activeShift?.exchangeRatesSnapshot?.rates?.[currency]) {
        exchangeRate = activeShift.exchangeRatesSnapshot.rates[currency]
        amountInTRY = finalAmount * exchangeRate
      }
    }
  }

  const transaction = new Transaction({
    hotel: hotelId,
    type,
    category: category || getCategoryForType(type),
    description,
    amount: finalAmount,
    currency,
    exchangeRate: currency !== 'TRY' ? exchangeRate : undefined,
    amountInTRY,
    paymentMethod,
    stay: stayId,
    guest: guestId,
    room: roomId,
    cashRegister: activeShift?._id,
    quantity,
    unitPrice: unitPrice || amount,
    reference,
    notes,
    createdBy: req.user?._id
  })

  await transaction.save()

  // NOTE: CashRegister and Stay sync is now handled automatically by Transaction post-save hooks
  // See transaction.model.js for auto-sync implementation

  // Emit socket event for real-time updates
  emitTransactionUpdate(hotelId, 'created', {
    transactionId: transaction._id,
    transactionNumber: transaction.transactionNumber,
    type: transaction.type,
    amount: transaction.amount,
    paymentMethod: transaction.paymentMethod,
    roomNumber: null, // TODO: populate if needed
    guestName: null // TODO: populate if needed
  })

  res.status(201).json({
    success: true,
    data: transaction
  })
})

// Void transaction
export const voidTransaction = asyncHandler(async (req, res) => {
  const { hotelId, transactionId } = req.params
  const { reason } = req.body

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Void reason is required'
    })
  }

  const transaction = await Transaction.findOne({
    _id: transactionId,
    hotel: hotelId
  })

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    })
  }

  if (transaction.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Only completed transactions can be voided'
    })
  }

  await transaction.void(reason, req.user?._id)

  // Emit socket event for real-time updates
  emitTransactionUpdate(hotelId, 'voided', {
    transactionId: transaction._id,
    transactionNumber: transaction.transactionNumber,
    type: transaction.type,
    amount: transaction.amount,
    paymentMethod: transaction.paymentMethod,
    roomNumber: null,
    guestName: null
  })

  res.json({
    success: true,
    data: transaction
  })
})

// Refund transaction
export const refundTransaction = asyncHandler(async (req, res) => {
  const { hotelId, transactionId } = req.params
  const { amount, reason } = req.body

  const transaction = await Transaction.findOne({
    _id: transactionId,
    hotel: hotelId
  })

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    })
  }

  if (transaction.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Only completed transactions can be refunded'
    })
  }

  const refundAmount = amount || transaction.amount
  if (refundAmount > transaction.amount) {
    return res.status(400).json({
      success: false,
      message: 'Refund amount cannot exceed original amount'
    })
  }

  const refund = await transaction.createRefund(refundAmount, reason, req.user?._id)

  // NOTE: CashRegister sync is now handled automatically by Transaction post-save hooks
  // See transaction.model.js for auto-sync implementation

  // Emit socket event for real-time updates
  emitTransactionUpdate(hotelId, 'refunded', {
    transactionId: refund._id,
    transactionNumber: refund.transactionNumber,
    type: refund.type,
    amount: refund.amount,
    paymentMethod: refund.paymentMethod,
    roomNumber: null,
    guestName: null
  })

  res.json({
    success: true,
    data: refund
  })
})

// Get transaction types and categories (for dropdowns)
export const getTransactionTypes = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      types: TRANSACTION_TYPES,
      categories: TRANSACTION_CATEGORIES,
      paymentMethods: PAYMENT_METHODS
    }
  })
})

// Get cashier statistics
export const getCashierStats = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // This month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const mongoose = (await import('mongoose')).default
  const hotelObjectId = new mongoose.Types.ObjectId(hotelId)

  const [activeShift, todayShifts, todaySummary, monthlyTotals, monthlyByCurrencyResult] =
    await Promise.all([
      CashRegister.getActiveShift(hotelId),
      CashRegister.countDocuments({
        hotel: hotelId,
        openedAt: { $gte: today, $lt: tomorrow }
      }),
      Transaction.getDailySummary(hotelId, today),
      Transaction.aggregate([
        {
          $match: {
            hotel: hotelObjectId,
            createdAt: { $gte: monthStart },
            status: { $ne: 'cancelled' }
          }
        },
        {
          // Calculate amountInTRY on the fly if not stored
          $addFields: {
            calculatedAmountInTRY: {
              $switch: {
                branches: [
                  // If amountInTRY exists and > 0, use it
                  {
                    case: { $gt: [{ $ifNull: ['$amountInTRY', 0] }, 0] },
                    then: '$amountInTRY'
                  },
                  // If currency is TRY or null, use amount directly
                  {
                    case: { $eq: [{ $ifNull: ['$currency', 'TRY'] }, 'TRY'] },
                    then: '$amount'
                  }
                ],
                // For foreign currencies, multiply by exchange rate
                default: { $multiply: ['$amount', { $ifNull: ['$exchangeRate', 1] }] }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$calculatedAmountInTRY' },
            count: { $sum: 1 }
          }
        }
      ]),
      // Monthly totals grouped by currency
      Transaction.aggregate([
        {
          $match: {
            hotel: hotelObjectId,
            createdAt: { $gte: monthStart },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: { $ifNull: ['$currency', 'TRY'] },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])
    ])

  // Convert monthlyByCurrency array to object { TRY: 1234, USD: 567, ... }
  const monthlyByCurrency = {}
  monthlyByCurrencyResult.forEach(item => {
    monthlyByCurrency[item._id] = item.total
  })

  res.json({
    success: true,
    data: {
      hasActiveShift: !!activeShift,
      activeShift: activeShift
        ? {
            shiftNumber: activeShift.shiftNumber,
            cashierName: activeShift.cashierName,
            openedAt: activeShift.openedAt,
            currentBalance: activeShift.currentBalance
          }
        : null,
      todayShifts,
      todaySummary,
      monthlyTotal: monthlyTotals[0]?.total || 0,
      monthlyTransactions: monthlyTotals[0]?.count || 0,
      monthlyByCurrency: Object.keys(monthlyByCurrency).length > 0 ? monthlyByCurrency : null
    }
  })
})

// Helper function to get category for transaction type
function getCategoryForType(type) {
  const categoryMap = {
    [TRANSACTION_TYPES.ROOM_CHARGE]: TRANSACTION_CATEGORIES.ACCOMMODATION,
    [TRANSACTION_TYPES.RESTAURANT]: TRANSACTION_CATEGORIES.FOOD_BEVERAGE,
    [TRANSACTION_TYPES.BAR]: TRANSACTION_CATEGORIES.FOOD_BEVERAGE,
    [TRANSACTION_TYPES.MINIBAR]: TRANSACTION_CATEGORIES.FOOD_BEVERAGE,
    [TRANSACTION_TYPES.SPA]: TRANSACTION_CATEGORIES.SPA_WELLNESS,
    [TRANSACTION_TYPES.LAUNDRY]: TRANSACTION_CATEGORIES.OTHER_SERVICES,
    [TRANSACTION_TYPES.PARKING]: TRANSACTION_CATEGORIES.OTHER_SERVICES,
    [TRANSACTION_TYPES.PHONE]: TRANSACTION_CATEGORIES.OTHER_SERVICES,
    [TRANSACTION_TYPES.EXTRA_CHARGE]: TRANSACTION_CATEGORIES.OTHER_SERVICES,
    [TRANSACTION_TYPES.OTHER_INCOME]: TRANSACTION_CATEGORIES.OTHER_SERVICES,
    [TRANSACTION_TYPES.PAYMENT]: TRANSACTION_CATEGORIES.PAYMENTS,
    [TRANSACTION_TYPES.DEPOSIT]: TRANSACTION_CATEGORIES.PAYMENTS,
    [TRANSACTION_TYPES.ADVANCE]: TRANSACTION_CATEGORIES.PAYMENTS,
    [TRANSACTION_TYPES.REFUND]: TRANSACTION_CATEGORIES.ADJUSTMENTS,
    [TRANSACTION_TYPES.DISCOUNT]: TRANSACTION_CATEGORIES.ADJUSTMENTS,
    [TRANSACTION_TYPES.VOID]: TRANSACTION_CATEGORIES.ADJUSTMENTS
  }
  return categoryMap[type] || TRANSACTION_CATEGORIES.OTHER_SERVICES
}

// ==========================================
// MULTI-CURRENCY SUPPORT
// ==========================================

// Get available currencies and exchange rates
export const getCurrencies = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  // Default currencies if settings not configured
  const defaultCurrencies = ['TRY', 'USD', 'EUR', 'GBP']
  let activeCurrencies = defaultCurrencies

  // Get hotel's active currencies from settings
  const hotel = await Hotel.findById(hotelId)
  if (hotel) {
    const settings = await PmsSettings.findOne({ hotel: hotelId }).lean()

    // Check for activeCurrencies in settings.cashier
    const cashierCurrencies = settings?.cashier?.activeCurrencies

    if (Array.isArray(cashierCurrencies) && cashierCurrencies.length > 0) {
      activeCurrencies = cashierCurrencies
    } else if (settings) {
      // If settings exists but cashier.activeCurrencies is empty, update it with defaults
      await PmsSettings.updateOne(
        { hotel: hotelId },
        { $set: { 'cashier.activeCurrencies': defaultCurrencies } }
      )
      activeCurrencies = defaultCurrencies
    }
  }

  const exchangeData = await getExchangeRates()
  const { rates, baseCurrency, lastUpdated } = exchangeData

  // Filter exchange rates to only include active currencies
  const filteredRates = {}
  for (const currency of activeCurrencies) {
    if (rates[currency]) {
      filteredRates[currency] = rates[currency]
    } else if (currency === 'TRY') {
      filteredRates[currency] = 1 // TRY is always 1
    }
  }

  res.json({
    success: true,
    data: {
      currencies: SUPPORTED_CURRENCIES,
      availableCurrencies: activeCurrencies,
      exchangeRates: filteredRates,
      baseCurrency: baseCurrency || 'TRY',
      lastUpdated
    }
  })
})

// Get daily summary by currency
export const getDailySummaryByCurrency = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { date } = req.query

  const targetDate = date ? new Date(date) : new Date()
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  // Get all shifts for the day
  const shifts = await CashRegister.find({
    hotel: hotelId,
    openedAt: { $gte: startOfDay, $lt: endOfDay }
  }).lean()

  // Aggregate currency totals from all shifts
  const currencyTotals = {}
  let totalInTRY = 0

  shifts.forEach(shift => {
    if (shift.currencyTotals && shift.currencyTotals.length > 0) {
      shift.currencyTotals.forEach(ct => {
        if (!currencyTotals[ct.currency]) {
          currencyTotals[ct.currency] = {
            currency: ct.currency,
            grossSales: 0,
            netSales: 0,
            cashReceived: 0,
            cardReceived: 0,
            otherReceived: 0,
            refunds: 0,
            payouts: 0,
            deposits: 0
          }
        }
        const target = currencyTotals[ct.currency]
        target.grossSales += ct.grossSales || 0
        target.netSales += ct.netSales || 0
        target.cashReceived += ct.cashReceived || 0
        target.cardReceived += ct.cardReceived || 0
        target.otherReceived += ct.otherReceived || 0
        target.refunds += ct.refunds || 0
        target.payouts += ct.payouts || 0
        target.deposits += ct.deposits || 0
      })
    }

    // Calculate total in TRY if shift has exchange rates
    // Rates are stored as "1 foreign = X TRY", so we MULTIPLY to get TRY
    if (shift.exchangeRatesSnapshot?.rates) {
      shift.currencyTotals?.forEach(ct => {
        if (ct.currency === 'TRY') {
          totalInTRY += ct.netSales || 0
        } else if (shift.exchangeRatesSnapshot.rates[ct.currency]) {
          // e.g., 100 USD * 32.5 = 3250 TRY
          totalInTRY += (ct.netSales || 0) * shift.exchangeRatesSnapshot.rates[ct.currency]
        }
      })
    }
  })

  // Also get from legacy totals for backward compatibility
  shifts.forEach(shift => {
    if (!currencyTotals['TRY'] && shift.totals) {
      currencyTotals['TRY'] = {
        currency: 'TRY',
        grossSales: 0,
        netSales: 0,
        cashReceived: 0,
        cardReceived: 0,
        otherReceived: 0,
        refunds: 0,
        payouts: 0,
        deposits: 0
      }
    }
    if (shift.totals && currencyTotals['TRY']) {
      // Only add if not already counted from currencyTotals
      if (!shift.currencyTotals || shift.currencyTotals.length === 0) {
        currencyTotals['TRY'].grossSales += shift.totals.grossSales || 0
        currencyTotals['TRY'].netSales += shift.totals.netSales || 0
        currencyTotals['TRY'].cashReceived += shift.totals.cashReceived || 0
        currencyTotals['TRY'].cardReceived += shift.totals.cardReceived || 0
        currencyTotals['TRY'].otherReceived += shift.totals.otherReceived || 0
        currencyTotals['TRY'].refunds += shift.totals.refunds || 0
        currencyTotals['TRY'].payouts += shift.totals.payouts || 0
        currencyTotals['TRY'].deposits += shift.totals.deposits || 0
        totalInTRY += shift.totals.netSales || 0
      }
    }
  })

  res.json({
    success: true,
    data: {
      date: startOfDay.toISOString().split('T')[0],
      currencies: Object.values(currencyTotals),
      totalInTRY: Math.round(totalInTRY * 100) / 100,
      shiftsCount: shifts.length
    }
  })
})
