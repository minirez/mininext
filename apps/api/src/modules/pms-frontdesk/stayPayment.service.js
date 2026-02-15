/**
 * Stay Service - Payment & Extra Charge Operations
 */

import Stay, { STAY_STATUS } from './stay.model.js'
import Guest from '#modules/pms-guest/guest.model.js'
import Transaction, {
  TRANSACTION_TYPES,
  TRANSACTION_CATEGORIES
} from '#modules/pms-billing/transaction.model.js'
import CashRegister from '#modules/pms-billing/cashRegister.model.js'
import { asyncHandler, withTransaction } from '#helpers'
import { NotFoundError } from '#core/errors.js'
import { emitStayUpdate, getGuestDisplayName, mapPaymentMethod } from './stay.internal.js'

/**
 * Add extra charge to stay
 */
export const addExtra = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { description, amount, quantity = 1, category = 'other' } = req.body

  // Validate stay exists (read operation - outside transaction)
  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId,
    status: STAY_STATUS.CHECKED_IN
  }).populate('room', 'roomNumber')

  if (!stay) {
    throw new NotFoundError('Aktif konaklama bulunamadi')
  }

  const userId = req.user._id
  const totalAmount = amount * quantity

  // Safely resolve guest ref
  let guestRef = stay.guests?.[0]?.guest || undefined
  if (guestRef) {
    const guestExists = await Guest.exists({ _id: guestRef, hotel: hotelId })
    if (!guestExists) guestRef = undefined
  }

  // Execute extra charge within a transaction
  await withTransaction(async session => {
    // 1. Add extra to Stay
    await Stay.updateOne(
      { _id: stayId },
      {
        $push: {
          extras: {
            date: new Date(),
            description,
            amount,
            quantity,
            category,
            addedBy: userId
          }
        }
      },
      { session }
    )

    // 2. Create Transaction record for the charge
    await Transaction.create(
      [
        {
          hotel: hotelId,
          type: TRANSACTION_TYPES.EXTRA_CHARGE,
          category: TRANSACTION_CATEGORIES.OTHER_SERVICES,
          description: `${description} - ${stay.stayNumber}`,
          amount: totalAmount,
          currency: 'TRY',
          amountInTRY: totalAmount,
          stay: stayId,
          guest: guestRef,
          room: stay.room?._id || stay.room,
          notes: `${quantity}x ${description}`,
          createdBy: userId
        }
      ],
      { session }
    )
  })

  const updatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  // Emit socket event for real-time updates
  emitStayUpdate(hotelId, 'extra_added', {
    stayId: updatedStay._id,
    stayNumber: updatedStay.stayNumber,
    roomId: updatedStay.room?._id,
    roomNumber: updatedStay.room?.roomNumber,
    guestName: getGuestDisplayName(updatedStay.guests?.[0]),
    balance: updatedStay.balance,
    totalAmount: updatedStay.totalAmount,
    paidAmount: updatedStay.paidAmount,
    paymentStatus: updatedStay.paymentStatus
  })

  res.json({
    success: true,
    data: updatedStay
  })
})

/**
 * Add payment to stay
 * Creates a Transaction record which automatically syncs to CashRegister and Stay
 * Supports cross-currency payments (e.g., paying USD debt with TRY)
 */
export const addPayment = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { amount, method, reference, notes, currency = 'TRY', exchangeRate } = req.body

  // Validate stay exists (read operation - outside transaction)
  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId
  }).populate('room', 'roomNumber')

  if (!stay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  // Get active shift for cashRegister reference (read operation)
  const activeShift = await CashRegister.getActiveShift(hotelId)

  // Map method to PAYMENT_METHODS constant
  const paymentMethod = mapPaymentMethod(method)

  // Calculate amountInTRY for cross-currency payments
  let amountInTRY = amount
  if (currency !== 'TRY' && exchangeRate) {
    amountInTRY = Math.round(amount * exchangeRate * 100) / 100
  }

  // Build description with currency info
  let description = `Ödeme - ${stay.stayNumber} - Oda ${stay.room?.roomNumber || 'N/A'}`
  if (currency !== 'TRY' && exchangeRate) {
    description += ` (${amount} ${currency} @ ${exchangeRate})`
  }

  // Safely resolve guest ref — verify it exists before passing to Transaction
  let guestRef = stay.guests?.[0]?.guest || undefined
  if (guestRef) {
    const guestExists = await Guest.exists({ _id: guestRef, hotel: hotelId })
    if (!guestExists) guestRef = undefined
  }

  // Execute payment creation within a transaction
  const transaction = await withTransaction(async session => {
    // Create Transaction
    const [newTransaction] = await Transaction.create(
      [
        {
          hotel: hotelId,
          type: TRANSACTION_TYPES.PAYMENT,
          category: TRANSACTION_CATEGORIES.PAYMENTS,
          description,
          amount,
          currency,
          exchangeRate: currency !== 'TRY' ? exchangeRate : undefined,
          amountInTRY,
          paymentMethod,
          stay: stayId,
          guest: guestRef,
          room: stay.room?._id || stay.room,
          cashRegister: activeShift?._id,
          reference,
          notes,
          createdBy: req.user._id
        }
      ],
      { session }
    )

    // Update Stay payment totals directly (avoid post-save hook race conditions)
    await Stay.updateOne(
      { _id: stayId },
      {
        $push: {
          payments: {
            transaction: newTransaction._id,
            date: new Date(),
            amount,
            amountInBaseCurrency: amountInTRY,
            method: paymentMethod,
            currency,
            exchangeRate: currency !== 'TRY' ? exchangeRate : undefined,
            reference,
            notes,
            addedBy: req.user._id
          }
        }
      },
      { session }
    )

    // Update CashRegister if active shift exists
    if (activeShift) {
      await CashRegister.updateOne(
        { _id: activeShift._id },
        {
          $inc: {
            'totals.totalPayments': amountInTRY,
            [`currencyTotals.${currency}.payments`]: amount
          }
        },
        { session }
      )
    }

    return newTransaction
  })

  // Fetch updated stay for response (outside transaction)
  const updatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  // Emit socket event for real-time updates
  emitStayUpdate(hotelId, 'payment_added', {
    stayId: updatedStay._id,
    stayNumber: updatedStay.stayNumber,
    roomId: updatedStay.room?._id,
    roomNumber: updatedStay.room?.roomNumber,
    guestName: getGuestDisplayName(updatedStay.guests?.[0]),
    balance: updatedStay.balance,
    totalAmount: updatedStay.totalAmount,
    paidAmount: updatedStay.paidAmount,
    paymentStatus: updatedStay.paymentStatus
  })

  res.json({
    success: true,
    data: updatedStay,
    transaction: {
      _id: transaction._id,
      transactionNumber: transaction.transactionNumber
    }
  })
})
