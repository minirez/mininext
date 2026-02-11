/**
 * Stay Service - Check-in Operations
 * Walk-in check-in, booking check-in, create stay, check-in from pending stay
 */

import Stay, { STAY_STATUS, PAYMENT_STATUS } from './stay.model.js'
import Room, { ROOM_STATUS } from '#modules/pms-housekeeping/room.model.js'
import Guest from '#modules/pms-guest/guest.model.js'
import Booking from '#modules/booking/booking.model.js'
import { asyncHandler, withTransaction } from '#helpers'
import { BadRequestError, NotFoundError, ConflictError } from '#core/errors.js'
import logger from '#core/logger.js'
import {
  GUEST_PLACEHOLDER_NAME,
  DEFAULT_GUEST_FIRST_NAME,
  DEFAULT_GUEST_LAST_NAME
} from '#constants/defaults.js'
import { findOrCreateGuestProfileForCheckIn } from './stay.helpers.js'
import {
  emitCheckIn,
  getGuestDisplayName,
  notifyHotelUsers,
  scheduleAutoSend,
  distributedLock
} from './stay.internal.js'

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
    paymentAmount,
    currency
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
          currency: currency || 'TRY',
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
      const hasRoomLead = roomLead?.firstName && roomLead.firstName !== GUEST_PLACEHOLDER_NAME

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
          if (g.firstName && g.firstName !== GUEST_PLACEHOLDER_NAME) {
            guestList.push({
              firstName: g.firstName,
              lastName: g.lastName || DEFAULT_GUEST_LAST_NAME,
              type: g.type || 'adult',
              nationality: g.nationality,
              isMainGuest: false
            })
          }
        }
      } else if (lead?.firstName && lead.firstName !== GUEST_PLACEHOLDER_NAME) {
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
          if (g.firstName && g.firstName !== GUEST_PLACEHOLDER_NAME) {
            guestList.push({
              firstName: g.firstName,
              lastName: g.lastName || DEFAULT_GUEST_LAST_NAME,
              type: g.type || 'adult',
              nationality: g.nationality,
              isMainGuest: false
            })
          }
        }
      } else if (roomGuests.length > 0) {
        // No usable lead at all, use room guests
        guestList = roomGuests
          .filter(g => g.firstName && g.firstName !== GUEST_PLACEHOLDER_NAME)
          .map((g, i) => ({
            firstName: g.firstName,
            lastName: g.lastName || DEFAULT_GUEST_LAST_NAME,
            type: g.type || 'adult',
            nationality: g.nationality,
            isMainGuest: g.isLead || i === 0
          }))
      }

      // Final fallback
      if (!guestList || guestList.length === 0) {
        guestList = [
          {
            firstName: lead?.firstName || DEFAULT_GUEST_FIRST_NAME,
            lastName: lead?.lastName || DEFAULT_GUEST_LAST_NAME,
            isMainGuest: true
          }
        ]
      }
    }

    // Link guest profiles to guestList (same as walk-in check-in)
    guestList = await Promise.all(
      guestList.map(async (g, index) => {
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
      const guestProfileId = mainGuest?.guest
      if (guestProfileId) {
        const guest = await Guest.findById(guestProfileId)
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
    } catch (err) {
      logger.warn('[CheckIn] Booking status update failed:', err.message)
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
  } catch (err) {
    logger.warn('[CheckIn] Guest history update failed:', err.message)
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
