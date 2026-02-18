/**
 * Stay Service - Query Operations
 * Read-only operations: list, detail, active stays, today activity, stats, available rooms
 */

import Stay, { STAY_STATUS } from './stay.model.js'
import Room, { ROOM_STATUS } from '#modules/pms-housekeeping/room.model.js'
import Booking from '#modules/booking/booking.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError } from '#core/errors.js'
import logger from '#core/logger.js'
import { parsePagination } from '#services/queryBuilder.js'

/**
 * Get paginated stays list
 */
export const getStays = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { status, from, to, room } = req.query
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 })

  const filter = {
    hotel: hotelId
  }

  if (status) filter.status = status
  if (room) filter.room = room

  if (from || to) {
    filter.checkInDate = {}
    if (from) filter.checkInDate.$gte = new Date(from)
    if (to) filter.checkInDate.$lte = new Date(to)
  }

  const [stays, total] = await Promise.all([
    Stay.find(filter)
      .populate('room', 'roomNumber floor')
      .populate('roomType', 'name code')
      .populate('booking', 'leadGuest bookingNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Stay.countDocuments(filter)
  ])

  res.json({
    success: true,
    data: stays,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    }
  })
})

/**
 * Get single stay
 */
export const getStay = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params

  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId
  })
    .populate('room', 'roomNumber floor status')
    .populate('roomType', 'name code occupancy')
    .populate('booking')
    .populate('checkedInBy', 'firstName lastName')
    .populate('checkedOutBy', 'firstName lastName')
    .populate('extras.addedBy', 'firstName lastName')
    .populate('payments.receivedBy', 'firstName lastName')

  if (!stay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  res.json({
    success: true,
    data: stay
  })
})

/**
 * Get active stays (checked in)
 */
export const getActiveStays = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const stays = await Stay.getActiveStays(hotelId)

  res.json({
    success: true,
    data: stays
  })
})

/**
 * Get today's arrivals and departures
 */
export const getTodayActivity = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get expected arrivals from Bookings (per-room expansion for multi-room bookings)
  let expectedFromBookings = []
  try {
    // 1. Get bookings with checkIn <= today that are still not fully checked in
    // This includes past-date bookings where guests haven't arrived yet
    const todayBookings = await Booking.find({
      hotel: hotelId,
      checkIn: { $lt: tomorrow },
      checkOut: { $gt: today },
      status: { $in: ['confirmed', 'pending'] }
    }).lean()

    // 2. Get all stays for these bookings (to check which rooms are already checked in)
    const bookingIds = todayBookings.map(b => b._id)
    const existingStays = await Stay.find({
      hotel: hotelId,
      booking: { $in: bookingIds }
    })
      .select('booking roomIndex')
      .lean()

    // Build a map: bookingId -> Set of checked-in roomIndexes
    const checkedInMap = new Map()
    for (const stay of existingStays) {
      const key = stay.booking.toString()
      if (!checkedInMap.has(key)) checkedInMap.set(key, new Set())
      checkedInMap.get(key).add(stay.roomIndex ?? 0)
    }

    // 3. Expand each booking into per-room entries
    for (const booking of todayBookings) {
      const bookingKey = booking._id.toString()
      const checkedInRooms = checkedInMap.get(bookingKey) || new Set()
      const rooms = booking.rooms || []

      if (rooms.length <= 1) {
        // Single-room or no rooms: check if already checked in
        if (checkedInRooms.has(0)) continue
        expectedFromBookings.push({
          ...booking,
          _type: 'booking_room',
          _roomIndex: 0,
          _totalRooms: Math.max(rooms.length, 1),
          _isMultiRoom: false,
          _checkedInCount: checkedInRooms.size,
          _roomData: rooms[0] || null
        })
      } else {
        // Multi-room booking: one entry per unchecked room
        for (let i = 0; i < rooms.length; i++) {
          if (checkedInRooms.has(i)) continue
          expectedFromBookings.push({
            ...booking,
            _type: 'booking_room',
            _roomIndex: i,
            _totalRooms: rooms.length,
            _isMultiRoom: true,
            _checkedInCount: checkedInRooms.size,
            _roomData: rooms[i]
          })
        }
      }
    }
  } catch (error) {
    logger.warn('Failed to fetch expected bookings:', { error: error.message, hotelId })
  }

  // Get pending Stays (direct reservations created in hotel, not yet checked in)
  // Include past-date pending stays where guests haven't arrived yet
  const pendingStays = await Stay.find({
    hotel: hotelId,
    checkInDate: { $lt: tomorrow },
    checkOutDate: { $gt: today },
    status: STAY_STATUS.PENDING
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
    .populate('booking', 'leadGuest bookingNumber')

  // Combine both sources for expected arrivals
  const expectedArrivals = [...expectedFromBookings, ...pendingStays]

  // Get today's check-ins (already checked in today)
  const todayCheckIns = await Stay.find({
    hotel: hotelId,
    actualCheckIn: { $gte: today, $lt: tomorrow }
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
    .populate('booking', 'leadGuest bookingNumber')

  // Get pending check-outs (should check out today or overdue)
  const pendingCheckOuts = await Stay.find({
    hotel: hotelId,
    checkOutDate: { $lte: tomorrow },
    status: STAY_STATUS.CHECKED_IN
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
    .populate('booking', 'leadGuest bookingNumber')

  // Get today's actual check-outs
  const todayCheckOuts = await Stay.find({
    hotel: hotelId,
    actualCheckOut: { $gte: today, $lt: tomorrow }
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
    .populate('booking', 'leadGuest bookingNumber')

  res.json({
    success: true,
    data: {
      expectedArrivals,
      todayCheckIns,
      pendingCheckOuts,
      todayCheckOuts
    }
  })
})

/**
 * Get front desk statistics
 */
export const getFrontDeskStats = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const stats = await Stay.getFrontDeskStats(hotelId)

  res.json({
    success: true,
    data: stats
  })
})

/**
 * Get available rooms for check-in or room change
 * A room is available if:
 * 1. Status is vacant_clean or inspected, OR
 * 2. Status is occupied but has no active stay (stale status from incomplete checkout)
 * AND no overlapping stay exists for the given date range.
 */
export const getAvailableRooms = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { checkIn, checkOut, roomType } = req.query

  const filter = {
    hotel: hotelId,
    isActive: true
  }

  if (roomType) {
    filter.roomType = roomType
  }

  // Get all active rooms (not filtering by status yet)
  const allRooms = await Room.find(filter)
    .populate('roomType', 'name code occupancy')
    .sort({ floor: 1, roomNumber: 1 })

  // Find rooms that have active stays (checked_in or reserved overlapping the date range)
  const stayFilter = {
    hotel: hotelId,
    status: { $in: [STAY_STATUS.CHECKED_IN, STAY_STATUS.RESERVED] }
  }

  // If date range provided, check overlap; otherwise just find currently active stays
  if (checkIn && checkOut) {
    stayFilter.checkInDate = { $lt: new Date(checkOut) }
    stayFilter.checkOutDate = { $gt: new Date(checkIn) }
  }

  const activeStays = await Stay.find(stayFilter).select('room').lean()
  const occupiedRoomIds = new Set(activeStays.map(s => s.room.toString()))

  // Filter: rooms without active stays + status allows check-in (or stale occupied with no stay)
  const availableRooms = allRooms.filter(room => {
    if (occupiedRoomIds.has(room._id.toString())) return false

    // Room has no active stay - available regardless of status
    // (handles stale 'occupied' status from incomplete checkouts)
    const allowedStatuses = [ROOM_STATUS.VACANT_CLEAN, ROOM_STATUS.INSPECTED, ROOM_STATUS.OCCUPIED]
    return allowedStatuses.includes(room.status)
  })

  res.json({
    success: true,
    data: availableRooms
  })
})
