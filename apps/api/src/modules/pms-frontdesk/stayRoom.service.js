/**
 * Stay Service - Room Operations
 * Room change, stay extension, and notes update
 */

import Stay, { STAY_STATUS } from './stay.model.js'
import Room, { ROOM_STATUS, HOUSEKEEPING_STATUS } from '#modules/pms-housekeeping/room.model.js'
import Booking from '#modules/booking/booking.model.js'
import { asyncHandler, withTransaction } from '#helpers'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import { emitStayUpdate, getGuestDisplayName } from './stay.internal.js'

/**
 * Change room
 */
export const changeRoom = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { newRoomId, reason } = req.body

  // Validate stay exists (read operation - outside transaction)
  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId,
    status: STAY_STATUS.CHECKED_IN
  }).populate('room', 'roomNumber')

  if (!stay) {
    throw new NotFoundError('Aktif konaklama bulunamadi')
  }

  // Validate new room (read operation - outside transaction)
  const newRoom = await Room.findOne({
    _id: newRoomId,
    hotel: hotelId
  }).populate('roomType')

  if (!newRoom) {
    throw new NotFoundError('Yeni oda bulunamadi')
  }

  // Check if the room has an active stay (more reliable than status alone)
  const existingStay = await Stay.findOne({
    hotel: hotelId,
    room: newRoomId,
    status: { $in: [STAY_STATUS.CHECKED_IN, STAY_STATUS.RESERVED] }
  })

  if (existingStay) {
    throw new BadRequestError('Yeni oda musait degil - aktif konaklama var')
  }

  // Allow rooms that are vacant_clean, inspected, or occupied-but-no-active-stay (stale status)
  const allowedStatuses = [ROOM_STATUS.VACANT_CLEAN, ROOM_STATUS.INSPECTED, ROOM_STATUS.OCCUPIED]
  if (!allowedStatuses.includes(newRoom.status)) {
    throw new BadRequestError('Yeni oda musait degil')
  }

  const oldRoomId = stay.room._id || stay.room
  const userId = req.user._id

  // Execute room change within a transaction
  await withTransaction(async session => {
    // 1. CRITICAL: First lock new room with conditional update to prevent race conditions
    const newRoomUpdate = await Room.findOneAndUpdate(
      {
        _id: newRoomId,
        status: { $in: [ROOM_STATUS.VACANT_CLEAN, ROOM_STATUS.INSPECTED, ROOM_STATUS.OCCUPIED] }
      },
      {
        $set: {
          status: ROOM_STATUS.OCCUPIED,
          currentBooking: stay.booking,
          currentGuests: stay.guests.map(g => ({
            firstName: g.firstName,
            lastName: g.lastName,
            isMainGuest: g.isMainGuest || false
          })),
          checkInDate: new Date(),
          expectedCheckoutDate: stay.checkOutDate
        }
      },
      { session, new: true }
    )

    // If new room wasn't updated, another request grabbed it first
    if (!newRoomUpdate) {
      throw new BadRequestError('Yeni oda artık müsait değil - başka bir işlem tarafından alındı')
    }

    // 2. Release old room (now safe since new room is locked)
    await Room.updateOne(
      { _id: oldRoomId },
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

    // 3. Update stay with new room and add to history
    await Stay.updateOne(
      { _id: stayId },
      {
        $set: {
          room: newRoomId,
          roomType: newRoom.roomType._id || newRoom.roomType
        },
        $push: {
          roomHistory: {
            room: oldRoomId,
            fromDate: stay.actualCheckIn || stay.checkInDate,
            toDate: new Date(),
            reason,
            changedBy: userId
          }
        }
      },
      { session }
    )
  })

  const updatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  // Emit socket event for real-time updates
  emitStayUpdate(hotelId, 'room_changed', {
    stayId: updatedStay._id,
    oldRoomNumber: stay.room?.roomNumber,
    newRoomNumber: newRoom.roomNumber,
    guestName: getGuestDisplayName(stay.guests?.[0])
  })

  res.json({
    success: true,
    data: updatedStay
  })
})

/**
 * Extend stay
 */
export const extendStay = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { newCheckOutDate, additionalAmount } = req.body

  // Validate stay exists (read operation - outside transaction)
  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId,
    status: STAY_STATUS.CHECKED_IN
  }).populate('room', 'roomNumber')

  if (!stay) {
    throw new NotFoundError('Aktif konaklama bulunamadi')
  }

  // Validate new checkout date
  const newCheckOut = new Date(newCheckOutDate)
  if (newCheckOut <= stay.checkOutDate) {
    throw new BadRequestError('Yeni cikis tarihi mevcut tarihten sonra olmali')
  }

  // Check if room is available for extended period (read operation)
  const conflictingStay = await Stay.findOne({
    hotel: hotelId,
    room: stay.room,
    _id: { $ne: stayId },
    status: STAY_STATUS.CHECKED_IN,
    checkInDate: { $lt: newCheckOut },
    checkOutDate: { $gt: stay.checkOutDate }
  })

  if (conflictingStay) {
    throw new BadRequestError('Oda bu tarihler icin musait degil')
  }

  // Calculate new nights and charges
  const oldNights = stay.nights
  const newNights = Math.ceil((newCheckOut - new Date(stay.checkInDate)) / (1000 * 60 * 60 * 24))
  const addedNights = newNights - oldNights

  // Build update operations
  const stayUpdate = {
    $set: {
      checkOutDate: newCheckOut,
      nights: newNights
    }
  }

  // Add extension charge if additional rate provided and different from room rate
  if (
    additionalAmount !== null &&
    additionalAmount !== undefined &&
    additionalAmount !== stay.roomRate &&
    addedNights > 0
  ) {
    const rateDifference = (additionalAmount - stay.roomRate) * addedNights
    if (rateDifference !== 0) {
      stayUpdate.$push = {
        extras: {
          date: new Date(),
          description: `Konaklama uzatma (${addedNights} gece)`,
          amount: rateDifference,
          quantity: 1,
          category: 'other'
        }
      }
    }
  }

  // Execute extension within a transaction
  await withTransaction(async session => {
    // 1. Update Stay with new checkout date and nights
    await Stay.updateOne({ _id: stayId }, stayUpdate, { session })

    // 2. Update Room expected checkout date
    await Room.updateOne(
      { _id: stay.room._id || stay.room },
      { $set: { expectedCheckoutDate: newCheckOut } },
      { session }
    )

    // 3. Update Booking if exists
    if (stay.booking) {
      await Booking.updateOne(
        { _id: stay.booking },
        { $set: { checkOut: newCheckOut } },
        { session }
      )
    }
  })

  const updatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  // Emit socket event for real-time updates
  emitStayUpdate(hotelId, 'stay_extended', {
    stayId: updatedStay._id,
    roomNumber: stay.room?.roomNumber,
    oldCheckOut: stay.checkOutDate,
    newCheckOut: newCheckOut,
    addedNights,
    guestName: getGuestDisplayName(stay.guests?.[0])
  })

  res.json({
    success: true,
    data: updatedStay
  })
})

/**
 * Update stay notes
 */
export const updateNotes = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { specialRequests, internalNotes } = req.body

  const stay = await Stay.findOneAndUpdate(
    {
      _id: stayId,
      hotel: hotelId
    },
    {
      $set: {
        ...(specialRequests !== undefined && { specialRequests }),
        ...(internalNotes !== undefined && { internalNotes })
      }
    },
    { new: true }
  )

  if (!stay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  res.json({
    success: true,
    data: stay
  })
})
