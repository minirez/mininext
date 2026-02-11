/**
 * Stay Service - Check-out Operations
 */

import Stay, { STAY_STATUS } from './stay.model.js'
import Room, { ROOM_STATUS, HOUSEKEEPING_STATUS } from '#modules/pms-housekeeping/room.model.js'
import Guest from '#modules/pms-guest/guest.model.js'
import Booking from '#modules/booking/booking.model.js'
import Transaction, {
  TRANSACTION_TYPES,
  TRANSACTION_CATEGORIES
} from '#modules/pms-billing/transaction.model.js'
import CashRegister from '#modules/pms-billing/cashRegister.model.js'
import { asyncHandler, withTransaction } from '#helpers'
import { NotFoundError } from '#core/errors.js'
import logger from '#core/logger.js'
import {
  emitCheckOut,
  getGuestDisplayName,
  notifyHotelUsers,
  mapPaymentMethod
} from './stay.internal.js'

/**
 * Check-out
 */
export const checkOut = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { settleBalance, paymentMethod, balanceReason, balanceReasonNote } = req.body

  // Fetch stay (read operation - outside transaction for validation)
  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId,
    status: STAY_STATUS.CHECKED_IN
  }).populate('room', 'roomNumber')

  if (!stay) {
    throw new NotFoundError('Aktif konaklama bulunamadi')
  }

  // Get active shift if settling balance
  let activeShift = null
  if (settleBalance && stay.balance > 0) {
    activeShift = await CashRegister.getActiveShift(hotelId)
  }

  // Safely resolve guest ref for transaction
  let guestRef = stay.guests?.[0]?.guest || undefined
  if (guestRef) {
    const guestExists = await Guest.exists({ _id: guestRef, hotel: hotelId })
    if (!guestExists) guestRef = undefined
  }

  // Execute all checkout operations within a transaction
  const checkoutResult = await withTransaction(async session => {
    // If settling balance, create Transaction for final payment
    if (settleBalance && stay.balance > 0) {
      const method = mapPaymentMethod(paymentMethod)

      await Transaction.create(
        [
          {
            hotel: hotelId,
            type: TRANSACTION_TYPES.PAYMENT,
            category: TRANSACTION_CATEGORIES.PAYMENTS,
            description: `Check-out Ödemesi - ${stay.stayNumber} - Oda ${stay.room?.roomNumber || 'N/A'}`,
            amount: stay.balance,
            currency: 'TRY',
            amountInTRY: stay.balance,
            paymentMethod: method,
            stay: stayId,
            guest: guestRef,
            room: stay.room?._id || stay.room,
            cashRegister: activeShift?._id,
            notes: 'Check-out ödemesi',
            createdBy: req.user._id
          }
        ],
        { session }
      )
    }

    // Update Stay status to checked_out
    const stayUpdateData = {
      status: STAY_STATUS.CHECKED_OUT,
      actualCheckOut: new Date(),
      checkedOutBy: req.user._id
    }

    // If checking out with balance, record the reason
    if (balanceReason && stay.balance > 0) {
      stayUpdateData.checkoutWithBalanceReason = balanceReason
      stayUpdateData.checkoutWithBalanceNote = balanceReasonNote
    }

    await Stay.updateOne({ _id: stayId }, { $set: stayUpdateData }, { session })

    // Update Room status to checkout/dirty
    await Room.updateOne(
      { _id: stay.room._id || stay.room },
      {
        $set: {
          status: ROOM_STATUS.CHECKOUT,
          housekeepingStatus: HOUSEKEEPING_STATUS.DIRTY,
          housekeepingPriority: 'high',
          currentBooking: null,
          currentGuests: [],
          checkInDate: null,
          expectedCheckoutDate: null
        }
      },
      { session }
    )

    // Conditionally update Booking status if exists
    // Only set checked_out when ALL rooms have checked out
    if (stay.booking) {
      const bk = await Booking.findById(stay.booking).select('rooms').lean().session(session)
      const totalRooms = bk?.rooms?.length || 1
      // Count stays that are now checked_out (includes current one just updated above)
      const checkedOutCount = await Stay.countDocuments({
        booking: stay.booking,
        status: STAY_STATUS.CHECKED_OUT
      }).session(session)
      if (checkedOutCount >= totalRooms) {
        await Booking.updateOne(
          { _id: stay.booking },
          { $set: { status: 'checked_out' } },
          { session }
        )
      }
    }

    return { actualCheckOut: stayUpdateData.actualCheckOut }
  })

  // Fetch updated stay for response (outside transaction)
  const updatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  // Emit socket event for real-time updates
  emitCheckOut(hotelId, {
    stayId: stayId,
    roomId: stay.room._id || stay.room,
    roomNumber: stay.room?.roomNumber,
    guestName: getGuestDisplayName(stay.guests?.[0]),
    checkOutTime: checkoutResult.actualCheckOut
  })

  // Send notification to all staff users
  notifyHotelUsers(hotelId, req.user._id, {
    type: 'checkout',
    title: 'Check-out Yapıldı',
    message: `${getGuestDisplayName(stay.guests?.[0])} - Oda ${stay.room?.roomNumber}`,
    reference: { model: 'Stay', id: stayId },
    actionUrl: '/housekeeping'
  }).catch(err => logger.error('[Notification] Check-out notification error:', err.message))

  res.json({
    success: true,
    data: updatedStay
  })
})
