import Stay, { STAY_STATUS, PAYMENT_STATUS } from './stay.model.js'
import Room, { ROOM_STATUS, HOUSEKEEPING_STATUS } from '#modules/pms-housekeeping/room.model.js'
import Guest from '#modules/pms-guest/guest.model.js'
import Booking from '#modules/booking/booking.model.js'
import Transaction, {
  TRANSACTION_TYPES,
  TRANSACTION_CATEGORIES,
  PAYMENT_METHODS
} from '#modules/pms-billing/transaction.model.js'
import CashRegister from '#modules/pms-billing/cashRegister.model.js'
import { asyncHandler, withTransaction } from '#helpers'
import { BadRequestError, NotFoundError, ConflictError } from '#core/errors.js'
import logger from '#core/logger.js'

// Import helper functions from modular file
import {
  findOrCreateGuestProfile,
  findOrCreateGuestProfileForCheckIn,
  sanitizePagination
} from './stay.helpers.js'

import { emitToRoom } from '#core/socket.js'
import { broadcastNotification } from '#modules/notification/notification.service.js'
import { scheduleAutoSend as kbsScheduleAutoSend } from '#modules/pms-guest/kbsClient.js'

const emitCheckIn = (hotelId, data) => {
  emitToRoom(`hotel:${hotelId}`, 'checkin', { hotelId, timestamp: Date.now(), ...data })
}
const emitCheckOut = (hotelId, data) => {
  emitToRoom(`hotel:${hotelId}`, 'checkout', { hotelId, timestamp: Date.now(), ...data })
}
const emitStayUpdate = (hotelId, event, data) => {
  emitToRoom(`hotel:${hotelId}`, 'stay:updated', {
    hotelId,
    timestamp: Date.now(),
    action: event,
    ...data
  })
}
const getGuestDisplayName = guest => {
  if (!guest) return 'Misafir'
  const parts = []
  if (guest.firstName) parts.push(guest.firstName)
  if (guest.lastName) parts.push(guest.lastName)
  return parts.length > 0 ? parts.join(' ') : 'Misafir'
}

/**
 * Notify hotel PMS users via in-app notification
 * Finds all partner users with PMS access and sends notification
 */
const notifyHotelUsers = async (
  hotelId,
  excludeUserId,
  { type, title, message, reference, actionUrl }
) => {
  try {
    const Hotel = (await import('#modules/hotel/hotel.model.js')).default
    const User = (await import('#modules/user/user.model.js')).default

    const hotel = await Hotel.findById(hotelId).select('partner')
    if (!hotel?.partner) return

    // Find all partner users with PMS access (excluding the user who triggered the action)
    const users = await User.find({
      accountType: 'partner',
      accountId: hotel.partner,
      status: 'active',
      _id: { $ne: excludeUserId },
      $or: [
        { role: 'admin' },
        { pmsRole: { $ne: null } },
        { pmsPermissions: { $exists: true, $ne: [] } }
      ]
    }).select('_id')

    if (users.length === 0) return

    const pmsType = `pms:${type}`
    await broadcastNotification({
      recipientIds: users.map(u => u._id),
      recipientModel: 'User',
      type: pmsType,
      title,
      message,
      reference,
      hotel: hotelId,
      partner: hotel.partner,
      actionUrl: `/pms${actionUrl}`
    })
  } catch (error) {
    logger.error('[PMS Notification] Error:', error.message)
  }
}

/**
 * Schedule automatic KBS notification after check-in
 */
const scheduleAutoSend = (hotelId, stay, room) => {
  try {
    kbsScheduleAutoSend(hotelId, stay, room)
  } catch (error) {
    logger.error('[KBS AutoSend] Schedule error:', error.message)
  }
}

// Simple in-memory lock as placeholder
const distributedLock = {
  async acquire(resource, ttl) {
    return { acquired: true, lockId: `local-${Date.now()}` }
  },
  async release(resource, lockId) {
    // noop
  }
}

export const getStays = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { status, from, to, room, limit: queryLimit = 50, page: queryPage = 1 } = req.query

  // Sanitize pagination parameters
  const { limit, page } = sanitizePagination(queryLimit, queryPage)

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

  const skip = (page - 1) * limit

  const [stays, total] = await Promise.all([
    Stay.find(filter)
      .populate('room', 'roomNumber floor')
      .populate('roomType', 'name code')
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
    // 1. Get today's bookings (confirmed + pending)
    const todayBookings = await Booking.find({
      hotel: hotelId,
      checkIn: { $gte: today, $lt: tomorrow },
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
  const pendingStays = await Stay.find({
    hotel: hotelId,
    checkInDate: { $gte: today, $lt: tomorrow },
    status: STAY_STATUS.PENDING
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  // Combine both sources for expected arrivals
  const expectedArrivals = [...expectedFromBookings, ...pendingStays]

  // Get today's check-ins (already checked in today)
  const todayCheckIns = await Stay.find({
    hotel: hotelId,
    actualCheckIn: { $gte: today, $lt: tomorrow }
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  // Get pending check-outs (should check out today)
  const pendingCheckOuts = await Stay.find({
    hotel: hotelId,
    checkOutDate: { $gte: today, $lt: tomorrow },
    status: STAY_STATUS.CHECKED_IN
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  // Get today's actual check-outs
  const todayCheckOuts = await Stay.find({
    hotel: hotelId,
    actualCheckOut: { $gte: today, $lt: tomorrow }
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

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
 * Walk-in check-in (without reservation)
 */
export const walkInCheckIn = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const {
    roomId,
    checkInDate,
    checkOutDate,
    guests,
    adultsCount,
    childrenCount,
    mealPlan,
    roomRate,
    specialRequests,
    paymentMethod,
    paymentAmount
  } = req.body

  // Validate room (read operation - outside transaction)
  const room = await Room.findOne({
    _id: roomId,
    hotel: hotelId
  }).populate('roomType')

  if (!room) {
    throw new NotFoundError('Oda bulunamadi')
  }

  if (!room.isAvailableForCheckIn()) {
    throw new BadRequestError('Bu oda check-in icin uygun degil')
  }

  // Validate guest count against room capacity
  const roomType = room.roomType
  if (roomType) {
    const totalGuests = guests?.length || 0
    const adultGuests = guests?.filter(g => g.type !== 'child').length || adultsCount || 1
    const childGuests = guests?.filter(g => g.type === 'child').length || childrenCount || 0

    if (roomType.maxOccupancy && totalGuests > roomType.maxOccupancy) {
      throw new BadRequestError(`Bu oda tipi maksimum ${roomType.maxOccupancy} misafir kabul eder`)
    }
    if (roomType.maxAdults && adultGuests > roomType.maxAdults) {
      throw new BadRequestError(`Bu oda tipi maksimum ${roomType.maxAdults} yetişkin kabul eder`)
    }
    if (roomType.maxChildren && childGuests > roomType.maxChildren) {
      throw new BadRequestError(`Bu oda tipi maksimum ${roomType.maxChildren} çocuk kabul eder`)
    }
  }

  // Calculate nights
  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

  if (nights < 1) {
    throw new BadRequestError('Gecersiz tarih araligi')
  }

  // Ensure at least one main guest and link to Guest profiles (outside transaction - read heavy)
  const guestList = await Promise.all(
    guests.map(async (g, index) => {
      // Find or create Guest profile
      const guestProfileId = await findOrCreateGuestProfileForCheckIn(hotelId, g)
      return {
        ...g,
        guest: guestProfileId,
        isMainGuest: index === 0 || g.isMainGuest
      }
    })
  )

  // Execute critical operations within a transaction
  const stay = await withTransaction(async session => {
    // CRITICAL: Use conditional update to prevent race conditions
    // Only update if room is still available (optimistic locking)
    const roomUpdate = await Room.findOneAndUpdate(
      {
        _id: roomId,
        status: { $in: [ROOM_STATUS.VACANT_CLEAN, ROOM_STATUS.INSPECTED] }
      },
      {
        $set: {
          status: ROOM_STATUS.OCCUPIED,
          currentBooking: null,
          currentGuests: guestList.map(g => ({
            firstName: g.firstName,
            lastName: g.lastName,
            isMainGuest: g.isMainGuest || false
          })),
          checkInDate: new Date(),
          expectedCheckoutDate: checkOut
        }
      },
      { session, new: true }
    )

    // If room wasn't updated, another request grabbed it first
    if (!roomUpdate) {
      throw new BadRequestError('Oda artık müsait değil - başka bir işlem tarafından alındı')
    }

    // Create stay (room is now locked for us)
    const [newStay] = await Stay.create(
      [
        {
          hotel: hotelId,
          room: roomId,
          roomType: room.roomType._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          actualCheckIn: new Date(),
          nights,
          guests: guestList,
          adultsCount: adultsCount || 1,
          childrenCount: childrenCount || 0,
          mealPlan,
          roomRate: roomRate ?? 0,
          totalAmount: roomRate ?? 0,
          specialRequests,
          source: 'walk_in',
          isWalkIn: true,
          status: STAY_STATUS.CHECKED_IN,
          checkedInBy: req.user._id
        }
      ],
      { session }
    )

    return newStay
  })

  // Add initial payment if provided (outside transaction - triggers post-save hooks)
  if (paymentAmount && paymentAmount > 0) {
    await stay.addPayment(
      {
        amount: paymentAmount,
        method: paymentMethod || 'cash'
      },
      req.user._id
    )
  }

  const populatedStay = await Stay.findById(stay._id)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  // Emit socket event for real-time updates
  emitCheckIn(hotelId, {
    stayId: stay._id,
    roomId: roomId,
    roomNumber: room.roomNumber,
    guestName: getGuestDisplayName(guestList[0]),
    checkInTime: stay.actualCheckIn
  })

  // Send notification to all staff users
  notifyHotelUsers(hotelId, req.user._id, {
    type: 'checkin',
    title: 'Check-in Yapıldı',
    message: `${getGuestDisplayName(guestList[0])} - Oda ${room.roomNumber}`,
    reference: { model: 'Stay', id: stay._id },
    actionUrl: `/front-desk?stayId=${stay._id}`
  }).catch(err => logger.error('[Notification] Check-in notification error:', err.message))

  // Schedule automatic KBS notification (if enabled)
  scheduleAutoSend(hotelId, populatedStay, room)

  res.status(201).json({
    success: true,
    data: populatedStay
  })
})

/**
 * Check-in from booking
 */
export const checkInFromBooking = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { bookingId, roomId, roomIndex = 0, guests, specialRequests } = req.body

  // CRITICAL: Acquire distributed lock for this room to prevent concurrent check-ins
  // This prevents race conditions when two requests try to check into the same room
  const lockResource = `room-checkin:${roomId}`
  const { acquired, lockId } = await distributedLock.acquire(lockResource, 30000) // 30 second TTL

  if (!acquired) {
    throw new ConflictError('Bu oda için başka bir check-in işlemi devam ediyor. Lütfen bekleyin.')
  }

  try {
    // Get booking (read operation - outside transaction)
    let booking
    try {
      booking = await Booking.findOne({
        _id: bookingId,
        hotel: hotelId
      }).populate('rooms.roomType')
    } catch (e) {
      // Differentiate between cast errors (invalid ID) and real database errors
      if (e.name === 'CastError') {
        throw new BadRequestError('Geçersiz rezervasyon ID formatı')
      }
      logger.error('Booking query error:', e.message)
      throw new Error('Veritabanı hatası: Rezervasyon sorgulanamadı')
    }

    if (!booking) {
      throw new NotFoundError('Rezervasyon bulunamadi')
    }

    // Validate room (read operation - outside transaction)
    const room = await Room.findOne({
      _id: roomId,
      hotel: hotelId
    }).populate('roomType')

    if (!room) {
      throw new NotFoundError('Oda bulunamadi')
    }

    if (!room.isAvailableForCheckIn()) {
      throw new BadRequestError('Bu oda check-in icin uygun degil')
    }

    // Calculate nights
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

    // Validate guest count against room capacity
    const roomTypeData = room.roomType
    const bookingAdults = booking.adults || 1
    const bookingChildren = booking.children || 0
    const totalGuests = bookingAdults + bookingChildren

    if (roomTypeData) {
      if (roomTypeData.maxOccupancy && totalGuests > roomTypeData.maxOccupancy) {
        throw new BadRequestError(
          `Bu oda tipi maksimum ${roomTypeData.maxOccupancy} misafir kabul eder`
        )
      }
      if (roomTypeData.maxAdults && bookingAdults > roomTypeData.maxAdults) {
        throw new BadRequestError(
          `Bu oda tipi maksimum ${roomTypeData.maxAdults} yetişkin kabul eder`
        )
      }
      if (roomTypeData.maxChildren && bookingChildren > roomTypeData.maxChildren) {
        throw new BadRequestError(
          `Bu oda tipi maksimum ${roomTypeData.maxChildren} çocuk kabul eder`
        )
      }
    }

    // Use provided guests, or extract from booking structure
    let guestList = guests
    if (!guestList || guestList.length === 0) {
      const lead = booking.leadGuest
      const bookingRoom = booking.rooms?.[roomIndex] || booking.rooms?.[0]
      const roomGuests = bookingRoom?.guests || []

      // For multi-room bookings, prefer the room's own lead guest
      const roomLead = roomGuests.find(g => g.isLead)
      const hasRoomLead = roomLead?.firstName && roomLead.firstName !== 'Guest'

      if (hasRoomLead) {
        // Use room's own lead guest as main guest
        guestList = [
          {
            firstName: roomLead.firstName,
            lastName: roomLead.lastName || '-',
            type: roomLead.type || 'adult',
            nationality: roomLead.nationality,
            isMainGuest: true,
            phone: booking.contact?.phone,
            email: booking.contact?.email
          }
        ]
        // Add remaining room guests (non-lead, with real names)
        for (const g of roomGuests) {
          if (
            g === roomLead ||
            (g.firstName === roomLead.firstName && g.lastName === roomLead.lastName)
          )
            continue
          if (g.firstName && g.firstName !== 'Guest') {
            guestList.push({
              firstName: g.firstName,
              lastName: g.lastName || '-',
              type: g.type || 'adult',
              nationality: g.nationality,
              isMainGuest: false
            })
          }
        }
      } else if (lead?.firstName && lead.firstName !== 'Guest') {
        // Fallback to booking leadGuest (single-room or no room lead)
        guestList = [
          {
            firstName: lead.firstName,
            lastName: lead.lastName || '-',
            type: lead.type || 'adult',
            nationality: lead.nationality,
            isMainGuest: true,
            phone: booking.contact?.phone,
            email: booking.contact?.email
          }
        ]
        for (const g of roomGuests) {
          if (g.isLead || (g.firstName === lead.firstName && g.lastName === lead.lastName)) continue
          if (g.firstName && g.firstName !== 'Guest') {
            guestList.push({
              firstName: g.firstName,
              lastName: g.lastName || '-',
              type: g.type || 'adult',
              nationality: g.nationality,
              isMainGuest: false
            })
          }
        }
      } else if (roomGuests.length > 0) {
        // No usable lead at all, use room guests
        guestList = roomGuests
          .filter(g => g.firstName && g.firstName !== 'Guest')
          .map((g, i) => ({
            firstName: g.firstName,
            lastName: g.lastName || '-',
            type: g.type || 'adult',
            nationality: g.nationality,
            isMainGuest: g.isLead || i === 0
          }))
      }

      // Final fallback
      if (!guestList || guestList.length === 0) {
        guestList = [
          {
            firstName: lead?.firstName || 'Misafir',
            lastName: lead?.lastName || '-',
            isMainGuest: true
          }
        ]
      }
    }

    // Execute critical operations within a transaction
    const stay = await withTransaction(async session => {
      // CRITICAL: First lock the room with conditional update to prevent race conditions
      const roomUpdate = await Room.findOneAndUpdate(
        {
          _id: roomId,
          status: { $in: [ROOM_STATUS.VACANT_CLEAN, ROOM_STATUS.INSPECTED] }
        },
        {
          $set: {
            status: ROOM_STATUS.OCCUPIED,
            currentBooking: bookingId,
            currentGuests: guestList.map(g => ({
              firstName: g.firstName,
              lastName: g.lastName,
              isMainGuest: g.isMainGuest || false
            })),
            checkInDate: new Date(),
            expectedCheckoutDate: checkOut
          }
        },
        { session, new: true }
      )

      // If room wasn't updated, another request grabbed it first
      if (!roomUpdate) {
        throw new BadRequestError('Oda artık müsait değil - başka bir işlem tarafından alındı')
      }

      // Check if pending Stay exists for this specific room index
      let existingStay = await Stay.findOne({ booking: bookingId, roomIndex }).session(session)

      let savedStay
      if (existingStay) {
        // Stay already exists - check status
        if (existingStay.status === STAY_STATUS.CHECKED_IN) {
          throw new BadRequestError('Bu rezervasyon icin zaten check-in yapilmis')
        }

        // Update existing pending Stay to checked_in
        existingStay.room = roomId
        existingStay.roomType = room.roomType._id
        existingStay.actualCheckIn = new Date()
        existingStay.status = STAY_STATUS.CHECKED_IN
        existingStay.checkedInBy = req.user._id
        if (guests && guests.length > 0) {
          existingStay.guests = guestList
        }
        if (specialRequests) {
          existingStay.specialRequests = specialRequests
        }
        savedStay = await existingStay.save({ session })
      } else {
        // No pending Stay exists (backward compatibility) - create new one
        const bookingRoom = booking.rooms?.[roomIndex] || booking.rooms?.[0]
        const roomFinalTotal = bookingRoom?.pricing?.finalTotal
        const [newStay] = await Stay.create(
          [
            {
              hotel: hotelId,
              room: roomId,
              roomType: room.roomType._id,
              booking: bookingId,
              bookingNumber: booking.bookingNumber,
              roomIndex,
              checkInDate: checkIn,
              checkOutDate: checkOut,
              actualCheckIn: new Date(),
              nights,
              guests: guestList,
              adultsCount: booking.adults || 1,
              childrenCount: booking.children || 0,
              mealPlan: bookingRoom?.mealPlan || booking.mealPlan,
              mealPlanCode: booking.mealPlanCode,
              roomRate: roomFinalTotal ?? booking.totalAmount ?? 0,
              totalAmount: roomFinalTotal ?? booking.totalAmount ?? 0,
              paidAmount: booking.paidAmount ?? 0,
              specialRequests: specialRequests || booking.specialRequests,
              source: 'booking',
              isWalkIn: false,
              status: STAY_STATUS.CHECKED_IN,
              checkedInBy: req.user._id
            }
          ],
          { session }
        )
        savedStay = newStay
      }

      // Conditionally update booking status:
      // Only set checked_in when ALL rooms have been checked in
      const totalRooms = booking.rooms?.length || 1
      const stayCount = await Stay.countDocuments({ booking: bookingId }).session(session)
      if (stayCount >= totalRooms) {
        await Booking.updateOne({ _id: bookingId }, { $set: { status: 'checked_in' } }, { session })
      }

      return savedStay
    })

    // Non-critical operations (outside transaction)

    // Update hotel guest record with stay history
    try {
      const mainGuest = guestList.find(g => g.isMainGuest) || guestList[0]
      const guestData = {
        firstName: mainGuest?.firstName || booking.leadGuest?.firstName,
        lastName: mainGuest?.lastName || booking.leadGuest?.lastName,
        email: mainGuest?.email || booking.contact?.email,
        phone: mainGuest?.phone || booking.contact?.phone
      }

      const guest = await Guest.findOrCreate(hotelId, guestData)
      if (guest) {
        await guest.addStayToHistory({
          _id: stay._id,
          booking: bookingId,
          checkInDate: stay.checkInDate,
          checkOutDate: stay.checkOutDate,
          room: { roomNumber: room.roomNumber },
          roomType: { code: room.roomType?.code },
          totalAmount: stay.totalAmount,
          nights: stay.nights,
          status: stay.status
        })
      }
    } catch (err) {
      logger.warn('[CheckIn] Guest history update failed (non-critical):', err.message)
    }

    const populatedStay = await Stay.findById(stay._id)
      .populate('room', 'roomNumber floor')
      .populate('roomType', 'name code')

    // Emit socket event for real-time updates
    emitCheckIn(hotelId, {
      stayId: stay._id,
      roomId: roomId,
      roomNumber: room.roomNumber,
      guestName: getGuestDisplayName(guestList[0]),
      checkInTime: stay.actualCheckIn
    })

    // Send notification to all staff users
    notifyHotelUsers(hotelId, req.user._id, {
      type: 'checkin',
      title: 'Rezervasyon Check-in',
      message: `${getGuestDisplayName(guestList[0])} - Oda ${room.roomNumber} (${booking.bookingNumber || 'Walk-in'})`,
      reference: { model: 'Stay', id: stay._id },
      actionUrl: `/front-desk?stayId=${stay._id}`
    }).catch(err =>
      logger.error('[Notification] Booking check-in notification error:', err.message)
    )

    // Schedule automatic KBS notification (if enabled)
    scheduleAutoSend(hotelId, populatedStay, room)

    res.status(201).json({
      success: true,
      data: populatedStay
    })
  } finally {
    // CRITICAL: Always release the distributed lock
    await distributedLock.release(lockResource, lockId)
  }
})

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
            guest: stay.guests?.[0]?._id,
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
          type: TRANSACTION_TYPES.CHARGE,
          category: TRANSACTION_CATEGORIES.EXTRAS,
          description: `${description} - ${stay.stayNumber}`,
          amount: totalAmount,
          currency: 'TRY',
          amountInTRY: totalAmount,
          stay: stayId,
          guest: stay.guests?.[0]?._id,
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
          guest: stay.guests?.[0]?._id,
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

/**
 * Helper: Map payment method string to PAYMENT_METHODS constant
 */
function mapPaymentMethod(method) {
  const methodMap = {
    cash: PAYMENT_METHODS.CASH,
    nakit: PAYMENT_METHODS.CASH,
    credit_card: PAYMENT_METHODS.CREDIT_CARD,
    kredi_karti: PAYMENT_METHODS.CREDIT_CARD,
    debit_card: PAYMENT_METHODS.DEBIT_CARD,
    banka_karti: PAYMENT_METHODS.DEBIT_CARD,
    bank_transfer: PAYMENT_METHODS.BANK_TRANSFER,
    havale: PAYMENT_METHODS.BANK_TRANSFER,
    eft: PAYMENT_METHODS.BANK_TRANSFER,
    room_charge: PAYMENT_METHODS.ROOM_CHARGE,
    city_ledger: PAYMENT_METHODS.CITY_LEDGER,
    voucher: PAYMENT_METHODS.VOUCHER,
    online: PAYMENT_METHODS.ONLINE,
    other: PAYMENT_METHODS.OTHER
  }
  return methodMap[method?.toLowerCase()] || PAYMENT_METHODS.CASH
}

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

  if (!newRoom.isAvailableForCheckIn()) {
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
        status: { $in: [ROOM_STATUS.VACANT_CLEAN, ROOM_STATUS.INSPECTED] }
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

/**
 * Get available rooms for check-in
 */
export const getAvailableRooms = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { checkIn, checkOut, roomType } = req.query

  const filter = {
    hotel: hotelId,
    isActive: true,
    status: { $in: [ROOM_STATUS.VACANT_CLEAN, ROOM_STATUS.INSPECTED] }
  }

  if (roomType) {
    filter.roomType = roomType
  }

  const rooms = await Room.find(filter)
    .populate('roomType', 'name code occupancy')
    .sort({ floor: 1, roomNumber: 1 })

  res.json({
    success: true,
    data: rooms
  })
})

/**
 * Create a new stay directly (for hotel reservations)
 * POST /api/hotels/:hotelId/stays
 */
export const createStay = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const {
    room: roomId,
    guests,
    checkInDate,
    checkOutDate,
    adults = 1,
    children = 0,
    status = 'pending',
    source = 'direct',
    rateType = 'standard',
    roomRate = 0,
    currency = 'TRY',
    paymentStatus = 'pending',
    notes
  } = req.body

  // Map source to valid enum values
  const sourceMap = {
    direct: 'phone',
    'booking.com': 'ota',
    expedia: 'ota',
    airbnb: 'ota',
    'hotels.com': 'ota',
    agoda: 'ota'
  }
  const mappedSource = sourceMap[source] || source

  // Validate room
  const room = await Room.findOne({
    _id: roomId,
    hotel: hotelId
  }).populate('roomType')

  if (!room) {
    throw new NotFoundError('Oda bulunamadi')
  }

  // Check if room is available
  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)

  // Check for conflicting stays
  const conflictingStay = await Stay.findOne({
    hotel: hotelId,
    room: roomId,
    status: { $in: [STAY_STATUS.PENDING, STAY_STATUS.CHECKED_IN] },
    $or: [{ checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }]
  })

  if (conflictingStay) {
    throw new BadRequestError('Bu oda secilen tarihler icin musait degil')
  }

  // Calculate nights
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

  if (nights < 1) {
    throw new BadRequestError('Gecersiz tarih araligi')
  }

  // Format guests
  const guestList =
    guests?.map((g, index) => ({
      firstName: g.firstName,
      lastName: g.lastName,
      email: g.email,
      phone: g.phone,
      nationality: g.nationality,
      idType: g.idType,
      idNumber: g.idNumber,
      isMainGuest: g.isPrimary || index === 0
    })) || []

  // Calculate total amount properly (roomRate * nights)
  const calculatedTotal = (roomRate ?? 0) * nights

  // Execute within transaction for atomicity
  const stay = await withTransaction(async session => {
    // Re-check for conflicts within transaction to prevent race conditions
    const conflictCheck = await Stay.findOne({
      hotel: hotelId,
      room: roomId,
      status: { $in: [STAY_STATUS.PENDING, STAY_STATUS.CHECKED_IN] },
      $or: [{ checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }]
    }).session(session)

    if (conflictCheck) {
      throw new BadRequestError('Bu oda secilen tarihler icin musait degil')
    }

    // Create stay
    const [newStay] = await Stay.create(
      [
        {
          hotel: hotelId,
          room: roomId,
          roomType: room.roomType._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          nights,
          guests: guestList,
          adultsCount: adults,
          childrenCount: children,
          roomRate: roomRate ?? 0,
          totalAmount: calculatedTotal,
          currency,
          specialRequests: notes,
          source: mappedSource,
          isWalkIn: mappedSource === 'walk_in',
          status: status === 'checked_in' ? STAY_STATUS.CHECKED_IN : STAY_STATUS.PENDING,
          paymentStatus: paymentStatus === 'paid' ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
          actualCheckIn: status === 'checked_in' ? new Date() : null
        }
      ],
      { session }
    )

    // If checked_in status, update room atomically
    if (status === 'checked_in') {
      const roomUpdate = await Room.findOneAndUpdate(
        {
          _id: roomId,
          status: { $in: [ROOM_STATUS.VACANT_CLEAN, ROOM_STATUS.INSPECTED] }
        },
        {
          $set: {
            status: ROOM_STATUS.OCCUPIED,
            currentGuests: guestList.map(g => ({
              firstName: g.firstName,
              lastName: g.lastName,
              isMainGuest: g.isMainGuest || false
            })),
            checkInDate: new Date(),
            expectedCheckoutDate: checkOut
          }
        },
        { session, new: true }
      )

      if (!roomUpdate) {
        throw new BadRequestError('Oda artık müsait değil - başka bir işlem tarafından alındı')
      }
    }

    return newStay
  })

  const populatedStay = await Stay.findById(stay._id)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  res.status(201).json({
    success: true,
    data: populatedStay
  })
})

/**
 * Check-in from pending Stay (created when booking was confirmed)
 * PATCH /api/hotels/:hotelId/stays/:stayId/check-in
 */
export const checkInFromStay = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { roomId, guests, specialRequests } = req.body

  // Get pending stay
  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId
  })

  if (!stay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  if (stay.status === STAY_STATUS.CHECKED_IN) {
    throw new BadRequestError('Bu konaklama icin zaten check-in yapilmis')
  }

  if (stay.status !== STAY_STATUS.PENDING) {
    throw new BadRequestError('Bu konaklama check-in icin uygun durumda degil')
  }

  // Validate room
  const room = await Room.findOne({
    _id: roomId,
    hotel: hotelId
  }).populate('roomType')

  if (!room) {
    throw new NotFoundError('Oda bulunamadi')
  }

  if (!room.isAvailableForCheckIn()) {
    throw new BadRequestError('Bu oda check-in icin uygun degil')
  }

  // Update stay to checked_in
  stay.room = roomId
  stay.roomType = room.roomType._id
  stay.actualCheckIn = new Date()
  stay.status = STAY_STATUS.CHECKED_IN
  stay.checkedInBy = req.user._id

  if (guests && guests.length > 0) {
    stay.guests = guests.map((g, index) => ({
      ...g,
      isMainGuest: index === 0 || g.isMainGuest
    }))
  }

  if (specialRequests) {
    stay.specialRequests = specialRequests
  }

  await stay.save()

  // Update room status
  await room.checkIn(stay.booking, stay.guests, stay.checkOutDate)

  // Conditionally update booking status if exists
  // Only set checked_in when ALL rooms have been checked in
  if (stay.booking) {
    try {
      const booking = await Booking.findById(stay.booking).select('rooms').lean()
      const totalRooms = booking?.rooms?.length || 1
      const stayCount = await Stay.countDocuments({ booking: stay.booking })
      if (stayCount >= totalRooms) {
        await Booking.findByIdAndUpdate(stay.booking, { status: 'checked_in' })
      }
    } catch {
      // Non-critical - booking status update failed
    }
  }

  // Update hotel guest record with stay history
  try {
    const mainGuest = stay.guests.find(g => g.isMainGuest) || stay.guests[0]
    if (mainGuest) {
      const guestData = {
        firstName: mainGuest.firstName,
        lastName: mainGuest.lastName,
        email: mainGuest.email,
        phone: mainGuest.phone
      }

      const guest = await Guest.findOrCreate(hotelId, guestData)
      if (guest) {
        await guest.addStayToHistory({
          _id: stay._id,
          booking: stay.booking,
          checkInDate: stay.checkInDate,
          checkOutDate: stay.checkOutDate,
          room: { roomNumber: room.roomNumber },
          roomType: { code: room.roomType?.code },
          totalAmount: stay.totalAmount,
          nights: stay.nights,
          status: stay.status
        })
      }
    }
  } catch {
    // Non-critical - guest history update failed
  }

  const populatedStay = await Stay.findById(stay._id)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  // Emit socket event for real-time updates
  emitCheckIn(hotelId, {
    stayId: stay._id,
    roomId: roomId,
    roomNumber: room.roomNumber,
    guestName: getGuestDisplayName(stay.guests[0]),
    checkInTime: stay.actualCheckIn
  })

  // Send notification to all staff users
  notifyHotelUsers(hotelId, req.user._id, {
    type: 'checkin',
    title: 'Check-in Yapıldı',
    message: `${getGuestDisplayName(stay.guests[0])} - Oda ${room.roomNumber}`,
    reference: { model: 'Stay', id: stay._id },
    actionUrl: `/front-desk?stayId=${stay._id}`
  }).catch(err => logger.error('[Notification] Stay check-in notification error:', err.message))

  // Schedule automatic KBS notification (if enabled)
  scheduleAutoSend(hotelId, populatedStay, room)

  res.json({
    success: true,
    data: populatedStay
  })
})

/**
 * Update stay guests
 */
export const updateGuests = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { guests } = req.body

  if (!guests || !Array.isArray(guests)) {
    throw new BadRequestError('Misafir listesi gerekli')
  }

  // Ensure at least one main guest
  const guestList = guests.map((g, index) => ({
    ...g,
    isMainGuest: g.isMainGuest || index === 0
  }))

  // Ensure exactly one main guest
  const mainGuestCount = guestList.filter(g => g.isMainGuest).length
  if (mainGuestCount > 1) {
    // Keep only first main guest
    let foundFirst = false
    guestList.forEach(g => {
      if (g.isMainGuest) {
        if (foundFirst) {
          g.isMainGuest = false
        } else {
          foundFirst = true
        }
      }
    })
  }

  const stay = await Stay.findOneAndUpdate(
    {
      _id: stayId,
      hotel: hotelId
    },
    {
      $set: {
        guests: guestList,
        adultsCount: guestList.filter(g => g.type !== 'child').length,
        childrenCount: guestList.filter(g => g.type === 'child').length
      }
    },
    { new: true }
  )
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  if (!stay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  // Emit socket event
  emitStayUpdate(hotelId, {
    stayId: stay._id,
    roomId: stay.room?._id,
    roomNumber: stay.room?.roomNumber,
    guestName: getGuestDisplayName(guestList[0])
  })

  res.json({
    success: true,
    data: stay
  })
})

/**
 * Add single guest to stay
 */
export const addGuest = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const guestData = req.body

  if (!guestData.firstName || !guestData.lastName) {
    throw new BadRequestError('Misafir adı ve soyadı gerekli')
  }

  // Find or create Guest profile for stay history tracking
  const guestProfileId = await findOrCreateGuestProfile(hotelId, guestData)

  const newGuest = {
    ...guestData,
    guest: guestProfileId,
    isMainGuest: guestData.isMainGuest || false,
    type: guestData.type || 'adult'
  }

  // Use atomic operation to prevent race conditions
  const updatedStay = await Stay.findOneAndUpdate(
    { _id: stayId, hotel: hotelId },
    {
      $push: { guests: newGuest },
      $inc: {
        adultsCount: newGuest.type !== 'child' ? 1 : 0,
        childrenCount: newGuest.type === 'child' ? 1 : 0
      }
    },
    { new: true }
  )

  if (!updatedStay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  // If this is first guest and no main guest set, update to make them main
  if (updatedStay.guests.length === 1 && !updatedStay.guests[0].isMainGuest) {
    await Stay.updateOne({ _id: stayId }, { $set: { 'guests.0.isMainGuest': true } })
  }

  const populatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  res.json({
    success: true,
    data: populatedStay
  })
})

/**
 * Update single guest in stay
 */
export const updateGuest = asyncHandler(async (req, res) => {
  const { hotelId, stayId, guestIndex } = req.params
  const guestData = req.body

  const index = parseInt(guestIndex, 10)
  if (isNaN(index) || index < 0) {
    throw new BadRequestError('Geçersiz misafir indeksi')
  }

  // First get the stay to access current guest data
  const stay = await Stay.findOne({ _id: stayId, hotel: hotelId })

  if (!stay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  if (index >= stay.guests.length) {
    throw new BadRequestError('Geçersiz misafir indeksi')
  }

  const currentGuest = stay.guests[index]

  // Find or create Guest profile if idNumber is provided
  let guestProfileId = currentGuest.guest
  if (guestData.idNumber || guestData.firstName || guestData.lastName) {
    const profileData = { ...currentGuest.toObject(), ...guestData }
    guestProfileId = await findOrCreateGuestProfile(hotelId, profileData)
  }

  // Build atomic update for the specific guest
  const updateFields = {}
  const allowedFields = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'nationality',
    'idType',
    'idNumber',
    'type',
    'isMainGuest',
    'dateOfBirth',
    'gender'
  ]

  allowedFields.forEach(field => {
    if (guestData[field] !== undefined) {
      updateFields[`guests.${index}.${field}`] = guestData[field]
    }
  })
  updateFields[`guests.${index}.guest`] = guestProfileId

  // Use atomic operation
  const updateOps = { $set: updateFields }

  // If setting as main guest, unset others first
  if (guestData.isMainGuest) {
    // First unset all main guests
    await Stay.updateOne({ _id: stayId }, { $set: { 'guests.$[].isMainGuest': false } })
  }

  const updatedStay = await Stay.findOneAndUpdate({ _id: stayId, hotel: hotelId }, updateOps, {
    new: true
  })

  // Recalculate counts atomically
  const adultsCount = updatedStay.guests.filter(g => g.type !== 'child').length
  const childrenCount = updatedStay.guests.filter(g => g.type === 'child').length

  await Stay.updateOne({ _id: stayId }, { $set: { adultsCount, childrenCount } })

  const populatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  res.json({
    success: true,
    data: populatedStay
  })
})

/**
 * Remove guest from stay
 */
export const removeGuest = asyncHandler(async (req, res) => {
  const { hotelId, stayId, guestIndex } = req.params

  const index = parseInt(guestIndex, 10)
  if (isNaN(index) || index < 0) {
    throw new BadRequestError('Geçersiz misafir indeksi')
  }

  const stay = await Stay.findOne({ _id: stayId, hotel: hotelId })

  if (!stay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  if (index >= stay.guests.length) {
    throw new BadRequestError('Geçersiz misafir indeksi')
  }

  // Don't allow removing last guest
  if (stay.guests.length <= 1) {
    throw new BadRequestError('Son misafir silinemez')
  }

  const removedGuest = stay.guests[index]
  const wasMainGuest = removedGuest.isMainGuest

  // MongoDB doesn't support $pull by index, so we use $unset + $pull null pattern
  // First, unset the element at index
  await Stay.updateOne({ _id: stayId }, { $unset: { [`guests.${index}`]: 1 } })

  // Then pull null values to remove the gap
  await Stay.updateOne({ _id: stayId }, { $pull: { guests: null } })

  // If removed guest was main, set first as main
  if (wasMainGuest) {
    await Stay.updateOne({ _id: stayId }, { $set: { 'guests.0.isMainGuest': true } })
  }

  // Recalculate counts from current state
  const updatedStay = await Stay.findById(stayId)
  const adultsCount = updatedStay.guests.filter(g => g.type !== 'child').length
  const childrenCount = updatedStay.guests.filter(g => g.type === 'child').length

  await Stay.updateOne({ _id: stayId }, { $set: { adultsCount, childrenCount } })

  const populatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  res.json({
    success: true,
    data: populatedStay
  })
})

// Export enums
export { STAY_STATUS, PAYMENT_STATUS }
