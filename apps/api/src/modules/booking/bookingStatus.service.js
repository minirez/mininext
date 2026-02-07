/**
 * Booking Status Service
 * Handles booking cancellation and deletion operations
 */

import { asyncHandler } from '#helpers'
import Booking from './booking.model.js'
import Payment from './payment.model.js'
import PaymentLink from '../paymentLink/paymentLink.model.js'
import pricingService from '#services/pricingService.js'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import logger from '#core/logger.js'
import { getPartnerId } from '#services/helpers.js'

/**
 * Cancel booking
 * POST /api/bookings/:id/cancel
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { id } = req.params
  const { reason } = req.body

  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  }).populate('hotel', 'policies')

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Check if cancellation is allowed
  const canCancelResult = booking.canCancel()
  if (!canCancelResult.allowed) {
    throw new BadRequestError(canCancelResult.reason || 'CANCELLATION_NOT_ALLOWED')
  }

  // Calculate refund based on cancellation policy
  const checkIn = new Date(booking.checkIn)
  const now = new Date()
  const daysBeforeCheckIn = Math.floor((checkIn - now) / (1000 * 60 * 60 * 24))

  let refundPercent = 0
  if (
    booking.hotel?.policies?.freeCancellation?.enabled &&
    daysBeforeCheckIn >= (booking.hotel.policies.freeCancellation.daysBeforeCheckIn || 1)
  ) {
    refundPercent = 100
  } else if (booking.hotel?.policies?.cancellationRules?.length > 0) {
    // Find applicable rule
    const sortedRules = [...booking.hotel.policies.cancellationRules].sort(
      (a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn
    )
    for (const rule of sortedRules) {
      if (daysBeforeCheckIn >= rule.daysBeforeCheckIn) {
        refundPercent = rule.refundPercent
        break
      }
    }
  }

  const refundAmount = (booking.payment.paidAmount || 0) * (refundPercent / 100)

  // Update booking
  booking.status = 'cancelled'
  booking.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: req.user?._id,
    reason,
    refundAmount,
    refundStatus: refundAmount > 0 ? 'pending' : undefined,
    policy: {
      daysBeforeCheckIn,
      refundPercent
    }
  }

  // Add modification record
  booking.modifications.push({
    modifiedAt: new Date(),
    modifiedBy: req.user?._id,
    type: 'status',
    description: `Booking cancelled. Reason: ${reason || 'Not specified'}`,
    previousValue: booking.status,
    newValue: 'cancelled'
  })

  await booking.save()

  // Release allotment
  for (const room of booking.rooms) {
    const dates = room.dailyBreakdown.map(d => d.date)
    try {
      await pricingService.releaseAllotment({
        hotelId: booking.hotel._id?.toString() || booking.hotel.toString(),
        roomTypeId: room.roomType.toString(),
        mealPlanId: room.mealPlan.toString(),
        marketId: booking.market.toString(),
        dates,
        rooms: 1
      })
    } catch (error) {
      logger.error('Allotment release error:', error.message)
    }
  }

  res.json({
    success: true,
    data: {
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      cancellation: {
        cancelledAt: booking.cancellation.cancelledAt,
        reason: booking.cancellation.reason,
        refundPercent,
        refundAmount,
        refundStatus: booking.cancellation.refundStatus
      }
    }
  })
})

/**
 * Hard delete booking (superadmin only)
 * DELETE /api/bookings/:id
 */
export const deleteBooking = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  // Check if user is platform admin (superadmin)
  if (req.user?.accountType !== 'platform' || req.user?.role !== 'admin') {
    throw new BadRequestError('SUPERADMIN_REQUIRED')
  }

  const { id } = req.params

  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Release allotment if booking was confirmed
  if (['pending', 'confirmed'].includes(booking.status)) {
    for (const room of booking.rooms || []) {
      const dates = (room.dailyBreakdown || []).map(d => d.date)
      if (dates.length > 0) {
        try {
          await pricingService.releaseAllotment({
            hotelId: booking.hotel?.toString(),
            roomTypeId: room.roomType?.toString(),
            mealPlanId: room.mealPlan?.toString(),
            marketId: booking.market?.toString(),
            dates,
            rooms: 1
          })
        } catch (error) {
          logger.error('Allotment release error during delete:', error.message)
        }
      }
    }
  }

  // CASCADE DELETE: Delete related payments and payment links to prevent orphan data
  const deletedPayments = await Payment.deleteMany({ booking: id })
  const deletedPaymentLinks = await PaymentLink.deleteMany({ booking: id })

  logger.info(`Cascade delete: ${deletedPayments.deletedCount} payments, ${deletedPaymentLinks.deletedCount} payment links`)

  // Hard delete the booking
  await Booking.findByIdAndDelete(id)

  logger.info(`Booking ${booking.bookingNumber} permanently deleted by ${req.user?.email}`)

  res.json({
    success: true,
    message: 'BOOKING_DELETED',
    data: {
      bookingNumber: booking.bookingNumber
    }
  })
})
