/**
 * Booking Update Service
 * Handles booking updates, status changes, and notes
 */

import { asyncHandler } from '#helpers'
import Booking from './booking.model.js'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import { getPartnerId } from '#services/helpers.js'

/**
 * Update booking status
 * PATCH /api/bookings/:id/status
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { id } = req.params
  const { status } = req.body

  if (!['confirmed', 'cancelled', 'completed', 'no_show'].includes(status)) {
    throw new BadRequestError('INVALID_STATUS')
  }

  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  const previousStatus = booking.status

  // Add modification record
  booking.modifications.push({
    modifiedAt: new Date(),
    modifiedBy: req.user?._id,
    type: 'status',
    description: `Status changed from ${previousStatus} to ${status}`,
    previousValue: previousStatus,
    newValue: status
  })

  booking.status = status
  await booking.save()

  res.json({
    success: true,
    data: {
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      previousStatus
    }
  })
})

/**
 * Add note to booking
 * POST /api/bookings/:id/notes
 */
export const addBookingNote = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { id } = req.params
  const { content, isInternal = true } = req.body

  if (!content) {
    throw new BadRequestError('NOTE_CONTENT_REQUIRED')
  }

  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  booking.notes.push({
    createdAt: new Date(),
    createdBy: req.user?._id,
    content,
    isInternal
  })

  await booking.save()

  res.json({
    success: true,
    data: {
      _id: booking._id,
      notes: booking.notes
    }
  })
})
