import Stay, { STAY_STATUS, PAYMENT_STATUS } from './stay.model.js'
import Room, { ROOM_STATUS, HOUSEKEEPING_STATUS } from '../pms-housekeeping/room.model.js'
import Guest from '../pms-guest/guest.model.js'
import Booking from '../booking/booking.model.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import { BadRequestError, NotFoundError } from '../../core/errors.js'
import { emitCheckIn, emitCheckOut, getGuestDisplayName } from '../pms/pmsSocket.js'
import { scheduleAutoSend } from '../pms-guest/kbsClient.js'
import { notifyHotelUsers } from '../notification/notification.service.js'

/**
 * Get all stays for a hotel
 */
export const getStays = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { status, from, to, room, limit = 50, page = 1 } = req.query

  const filter = {
    hotel: hotelId,
    partner: req.partner._id
  }

  if (status) filter.status = status
  if (room) filter.room = room

  if (from || to) {
    filter.checkInDate = {}
    if (from) filter.checkInDate.$gte = new Date(from)
    if (to) filter.checkInDate.$lte = new Date(to)
  }

  const skip = (parseInt(page) - 1) * parseInt(limit)

  const [stays, total] = await Promise.all([
    Stay.find(filter)
      .populate('room', 'roomNumber floor')
      .populate('roomType', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Stay.countDocuments(filter)
  ])

  res.json({
    success: true,
    data: stays,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
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
    hotel: hotelId,
    partner: req.partner._id
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

  // Get expected arrivals from Bookings (not yet converted to Stay)
  const checkedInBookingIds = await Stay.find({
    hotel: hotelId,
    booking: { $ne: null }
  }).distinct('booking')

  let expectedFromBookings = []
  try {
    expectedFromBookings = await Booking.find({
      hotel: hotelId,
      partner: req.partner._id,
      checkIn: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'pending'] },
      _id: { $nin: checkedInBookingIds }
    }).populate('roomType', 'name code')
  } catch (e) {
    // Booking model might not exist yet
  }

  // Get pending Stays (direct reservations created in PMS, not yet checked in)
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

  // Validate room
  const room = await Room.findOne({
    _id: roomId,
    hotel: hotelId,
    partner: req.partner._id
  }).populate('roomType')

  if (!room) {
    throw new NotFoundError('Oda bulunamadi')
  }

  if (!room.isAvailableForCheckIn()) {
    throw new BadRequestError('Bu oda check-in icin uygun degil')
  }

  // Calculate nights
  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

  if (nights < 1) {
    throw new BadRequestError('Gecersiz tarih araligi')
  }

  // Ensure at least one main guest
  const guestList = guests.map((g, index) => ({
    ...g,
    isMainGuest: index === 0 || g.isMainGuest
  }))

  // Create stay
  const stay = await Stay.create({
    partner: req.partner._id,
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
    roomRate: roomRate || 0,
    totalAmount: roomRate || 0,
    specialRequests,
    source: 'walk_in',
    isWalkIn: true,
    status: STAY_STATUS.CHECKED_IN,
    checkedInBy: req.user._id
  })

  // Add initial payment if provided
  if (paymentAmount && paymentAmount > 0) {
    await stay.addPayment({
      amount: paymentAmount,
      method: paymentMethod || 'cash'
    }, req.user._id)
  }

  // Update room status
  await room.checkIn(null, guestList, checkOut)

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

  // Send notification to all PMS users
  notifyHotelUsers(hotelId, req.user._id, {
    type: 'pms:checkin',
    title: 'Check-in Yapıldı',
    message: `${getGuestDisplayName(guestList[0])} - Oda ${room.roomNumber}`,
    reference: { model: 'Stay', id: stay._id },
    actionUrl: `/pms/front-desk?stayId=${stay._id}`
  }).catch(err => console.error('[Notification] Check-in notification error:', err.message))

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
  const { bookingId, roomId, guests, specialRequests } = req.body

  // Get booking
  let booking
  try {
    booking = await Booking.findOne({
      _id: bookingId,
      hotel: hotelId,
      partner: req.partner._id
    }).populate('rooms.roomType')
  } catch (e) {
    console.error('Booking query error:', e.message)
    throw new NotFoundError('Rezervasyon bulunamadi')
  }

  if (!booking) {
    throw new NotFoundError('Rezervasyon bulunamadi')
  }

  // Validate room
  const room = await Room.findOne({
    _id: roomId,
    hotel: hotelId,
    partner: req.partner._id
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

  // Use provided guests or booking guests
  const guestList = guests || booking.guests || [{
    firstName: booking.customerName?.split(' ')[0] || 'Misafir',
    lastName: booking.customerName?.split(' ').slice(1).join(' ') || '',
    isMainGuest: true,
    phone: booking.customerPhone,
    email: booking.customerEmail
  }]

  // Check if pending Stay exists (from booking confirmation)
  let stay = await Stay.findOne({ booking: bookingId })

  if (stay) {
    // Stay already exists - check status
    if (stay.status === STAY_STATUS.CHECKED_IN) {
      throw new BadRequestError('Bu rezervasyon icin zaten check-in yapilmis')
    }

    // Update existing pending Stay to checked_in
    stay.room = roomId
    stay.roomType = room.roomType._id
    stay.actualCheckIn = new Date()
    stay.status = STAY_STATUS.CHECKED_IN
    stay.checkedInBy = req.user._id
    if (guests && guests.length > 0) {
      stay.guests = guestList
    }
    if (specialRequests) {
      stay.specialRequests = specialRequests
    }
    await stay.save()
  } else {
    // No pending Stay exists (backward compatibility) - create new one
    stay = await Stay.create({
      partner: req.partner._id,
      hotel: hotelId,
      room: roomId,
      roomType: room.roomType._id,
      booking: bookingId,
      bookingNumber: booking.bookingNumber,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      actualCheckIn: new Date(),
      nights,
      guests: guestList,
      adultsCount: booking.adults || 1,
      childrenCount: booking.children || 0,
      mealPlan: booking.mealPlan,
      mealPlanCode: booking.mealPlanCode,
      roomRate: booking.totalAmount || 0,
      totalAmount: booking.totalAmount || 0,
      paidAmount: booking.paidAmount || 0,
      specialRequests: specialRequests || booking.specialRequests,
      source: 'booking',
      isWalkIn: false,
      status: STAY_STATUS.CHECKED_IN,
      checkedInBy: req.user._id
    })
  }

  // Update room status
  await room.checkIn(bookingId, guestList, checkOut)

  // Update booking status
  try {
    await Booking.findByIdAndUpdate(bookingId, { status: 'checked_in' })
  } catch (e) {
    // Non-critical - booking status update failed
  }

  // Update PMS guest record with stay history
  try {
    const mainGuest = guestList.find(g => g.isMainGuest) || guestList[0]
    const guestData = {
      partner: req.partner._id,
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
  } catch (e) {
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
    guestName: getGuestDisplayName(guestList[0]),
    checkInTime: stay.actualCheckIn
  })

  // Send notification to all PMS users
  notifyHotelUsers(hotelId, req.user._id, {
    type: 'pms:checkin',
    title: 'Rezervasyon Check-in',
    message: `${getGuestDisplayName(guestList[0])} - Oda ${room.roomNumber} (${booking.bookingNumber || 'Walk-in'})`,
    reference: { model: 'Stay', id: stay._id },
    actionUrl: `/pms/front-desk?stayId=${stay._id}`
  }).catch(err => console.error('[Notification] Booking check-in notification error:', err.message))

  // Schedule automatic KBS notification (if enabled)
  scheduleAutoSend(hotelId, populatedStay, room)

  res.status(201).json({
    success: true,
    data: populatedStay
  })
})

/**
 * Check-out
 */
export const checkOut = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { settleBalance, paymentMethod } = req.body

  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId,
    partner: req.partner._id,
    status: STAY_STATUS.CHECKED_IN
  })

  if (!stay) {
    throw new NotFoundError('Aktif konaklama bulunamadi')
  }

  // If settling balance, add final payment
  if (settleBalance && stay.balance > 0) {
    await stay.addPayment({
      amount: stay.balance,
      method: paymentMethod || 'cash',
      notes: 'Check-out odemesi'
    }, req.user._id)
  }

  // Perform checkout
  await stay.checkOut(req.user._id)

  // Update booking status if exists
  if (stay.booking) {
    try {
      await Booking.findByIdAndUpdate(stay.booking, { status: 'completed' })
    } catch (e) {
      // Non-critical - booking status update failed
    }
  }

  const updatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

  // Emit socket event for real-time updates
  emitCheckOut(hotelId, {
    stayId: stayId,
    roomId: stay.room,
    roomNumber: updatedStay.room?.roomNumber,
    guestName: getGuestDisplayName(stay.guests?.[0]),
    checkOutTime: updatedStay.actualCheckOut
  })

  // Send notification to all PMS users
  notifyHotelUsers(hotelId, req.user._id, {
    type: 'pms:checkout',
    title: 'Check-out Yapıldı',
    message: `${getGuestDisplayName(stay.guests?.[0])} - Oda ${updatedStay.room?.roomNumber}`,
    reference: { model: 'Stay', id: stayId },
    actionUrl: `/pms/housekeeping`
  }).catch(err => console.error('[Notification] Check-out notification error:', err.message))

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
  const { description, amount, quantity, category } = req.body

  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId,
    partner: req.partner._id,
    status: STAY_STATUS.CHECKED_IN
  })

  if (!stay) {
    throw new NotFoundError('Aktif konaklama bulunamadi')
  }

  await stay.addExtra({
    description,
    amount,
    quantity: quantity || 1,
    category: category || 'other'
  }, req.user._id)

  const updatedStay = await Stay.findById(stayId)

  res.json({
    success: true,
    data: updatedStay
  })
})

/**
 * Add payment to stay
 */
export const addPayment = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { amount, method, reference, notes } = req.body

  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId,
    partner: req.partner._id
  })

  if (!stay) {
    throw new NotFoundError('Konaklama bulunamadi')
  }

  await stay.addPayment({
    amount,
    method,
    reference,
    notes
  }, req.user._id)

  const updatedStay = await Stay.findById(stayId)

  res.json({
    success: true,
    data: updatedStay
  })
})

/**
 * Change room
 */
export const changeRoom = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { newRoomId, reason } = req.body

  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId,
    partner: req.partner._id,
    status: STAY_STATUS.CHECKED_IN
  })

  if (!stay) {
    throw new NotFoundError('Aktif konaklama bulunamadi')
  }

  // Validate new room
  const newRoom = await Room.findOne({
    _id: newRoomId,
    hotel: hotelId,
    partner: req.partner._id
  })

  if (!newRoom) {
    throw new NotFoundError('Yeni oda bulunamadi')
  }

  if (!newRoom.isAvailableForCheckIn()) {
    throw new BadRequestError('Yeni oda musait degil')
  }

  await stay.changeRoom(newRoomId, reason, req.user._id)

  const updatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

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

  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId,
    partner: req.partner._id,
    status: STAY_STATUS.CHECKED_IN
  })

  if (!stay) {
    throw new NotFoundError('Aktif konaklama bulunamadi')
  }

  // Check room availability for extended dates
  const newCheckOut = new Date(newCheckOutDate)
  if (newCheckOut <= stay.checkOutDate) {
    throw new BadRequestError('Yeni cikis tarihi mevcut tarihten sonra olmali')
  }

  // Check if room is available for extended period
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

  await stay.extendStay(newCheckOut, additionalAmount)

  const updatedStay = await Stay.findById(stayId)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')

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
      hotel: hotelId,
      partner: req.partner._id
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
    partner: req.partner._id,
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
 * Create a new stay directly (for PMS reservations)
 * POST /pms/hotels/:hotelId/stays
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
    'direct': 'phone',
    'booking.com': 'ota',
    'expedia': 'ota',
    'airbnb': 'ota',
    'hotels.com': 'ota',
    'agoda': 'ota'
  }
  const mappedSource = sourceMap[source] || source

  // Validate room
  const room = await Room.findOne({
    _id: roomId,
    hotel: hotelId,
    partner: req.partner._id
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
    $or: [
      { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }
    ]
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
  const guestList = guests?.map((g, index) => ({
    firstName: g.firstName,
    lastName: g.lastName,
    email: g.email,
    phone: g.phone,
    nationality: g.nationality,
    idType: g.idType,
    idNumber: g.idNumber,
    isMainGuest: g.isPrimary || index === 0
  })) || []

  // Create stay
  const stay = await Stay.create({
    partner: req.partner._id,
    hotel: hotelId,
    room: roomId,
    roomType: room.roomType._id,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    nights,
    guests: guestList,
    adultsCount: adults,
    childrenCount: children,
    roomRate: roomRate || 0,
    totalAmount: roomRate || 0,
    currency,
    specialRequests: notes,
    source: mappedSource,
    isWalkIn: mappedSource === 'walk_in',
    status: status === 'checked_in' ? STAY_STATUS.CHECKED_IN : STAY_STATUS.PENDING,
    paymentStatus: paymentStatus === 'paid' ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING
  })

  // If checked_in status, update room and set actual check-in
  if (status === 'checked_in') {
    stay.actualCheckIn = new Date()
    await stay.save()
    await room.checkIn(null, guestList, checkOut)
  }

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
 * PATCH /pms/hotels/:hotelId/stays/:stayId/check-in
 */
export const checkInFromStay = asyncHandler(async (req, res) => {
  const { hotelId, stayId } = req.params
  const { roomId, guests, specialRequests } = req.body

  // Get pending stay
  const stay = await Stay.findOne({
    _id: stayId,
    hotel: hotelId,
    partner: req.partner._id
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
    hotel: hotelId,
    partner: req.partner._id
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

  // Update booking status if exists
  if (stay.booking) {
    try {
      await Booking.findByIdAndUpdate(stay.booking, { status: 'checked_in' })
    } catch (e) {
      // Non-critical - booking status update failed
    }
  }

  // Update PMS guest record with stay history
  try {
    const mainGuest = stay.guests.find(g => g.isMainGuest) || stay.guests[0]
    if (mainGuest) {
      const guestData = {
        partner: req.partner._id,
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
  } catch (e) {
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

  // Send notification to all PMS users
  notifyHotelUsers(hotelId, req.user._id, {
    type: 'pms:checkin',
    title: 'Check-in Yapıldı',
    message: `${getGuestDisplayName(stay.guests[0])} - Oda ${room.roomNumber}`,
    reference: { model: 'Stay', id: stay._id },
    actionUrl: `/pms/front-desk?stayId=${stay._id}`
  }).catch(err => console.error('[Notification] Stay check-in notification error:', err.message))

  // Schedule automatic KBS notification (if enabled)
  scheduleAutoSend(hotelId, populatedStay, room)

  res.json({
    success: true,
    data: populatedStay
  })
})

// Export enums
export { STAY_STATUS, PAYMENT_STATUS }
