/**
 * PMS Reservation Service
 * Handles reservation management for PMS frontdesk operations
 */

import { asyncHandler } from '../../helpers/asyncHandler.js'
import Booking from '../booking/booking.model.js'
import Room from '../pms-housekeeping/room.model.js'
import RoomType from '../planning/roomType.model.js'
import MealPlan from '../planning/mealPlan.model.js'
import Hotel from '../hotel/hotel.model.js'

// Get all reservations for a hotel
export const getReservations = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { status, startDate, endDate, search, page = 1, limit = 20 } = req.query

  const query = { hotel: hotelId }

  // Status filter
  if (status && status !== 'all') {
    query.status = status
  }

  // Date filters
  if (startDate) {
    query.checkIn = { $gte: new Date(startDate) }
  }
  if (endDate) {
    query.checkOut = { ...query.checkOut, $lte: new Date(endDate) }
  }

  // Search filter (booking number, guest name, email, phone)
  if (search) {
    query.$or = [
      { bookingNumber: { $regex: search, $options: 'i' } },
      { 'leadGuest.firstName': { $regex: search, $options: 'i' } },
      { 'leadGuest.lastName': { $regex: search, $options: 'i' } },
      { 'contact.email': { $regex: search, $options: 'i' } },
      { 'contact.phone': { $regex: search, $options: 'i' } }
    ]
  }

  const skip = (page - 1) * limit

  const [reservations, total] = await Promise.all([
    Booking.find(query)
      .sort({ checkIn: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Booking.countDocuments(query)
  ])

  res.json({
    success: true,
    data: reservations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})

// Get reservations by date range (for calendar view)
export const getReservationsByDateRange = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { startDate, endDate } = req.query

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'startDate and endDate are required'
    })
  }

  const reservations = await Booking.find({
    hotel: hotelId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { checkIn: { $gte: new Date(startDate), $lte: new Date(endDate) } },
      { checkOut: { $gte: new Date(startDate), $lte: new Date(endDate) } },
      { checkIn: { $lte: new Date(startDate) }, checkOut: { $gte: new Date(endDate) } }
    ]
  })
    .populate('rooms.roomType', 'code name')
    .sort({ checkIn: 1 })
    .lean()

  res.json({
    success: true,
    data: reservations
  })
})

// Get single reservation
export const getReservation = asyncHandler(async (req, res) => {
  const { hotelId, reservationId } = req.params

  const reservation = await Booking.findOne({
    _id: reservationId,
    hotel: hotelId
  })
    .populate('rooms.roomType', 'code name maxOccupancy')
    .populate('rooms.mealPlan', 'code name')
    .lean()

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    })
  }

  res.json({
    success: true,
    data: reservation
  })
})

// Get today's arrivals
export const getTodayArrivals = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const arrivals = await Booking.find({
    hotel: hotelId,
    checkIn: { $gte: today, $lt: tomorrow },
    status: { $in: ['pending', 'confirmed'] }
  })
    .populate('rooms.roomType', 'code name')
    .sort({ checkIn: 1 })
    .lean()

  res.json({
    success: true,
    data: arrivals
  })
})

// Get today's departures
export const getTodayDepartures = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const departures = await Booking.find({
    hotel: hotelId,
    checkOut: { $gte: today, $lt: tomorrow },
    status: 'confirmed'
  })
    .populate('rooms.roomType', 'code name')
    .sort({ checkOut: 1 })
    .lean()

  res.json({
    success: true,
    data: departures
  })
})

// Get reservation statistics
export const getReservationStats = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Next 7 days
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const [
    todayArrivals,
    todayDepartures,
    pendingReservations,
    upcomingReservations,
    confirmedThisMonth
  ] = await Promise.all([
    Booking.countDocuments({
      hotel: hotelId,
      checkIn: { $gte: today, $lt: tomorrow },
      status: { $in: ['pending', 'confirmed'] }
    }),
    Booking.countDocuments({
      hotel: hotelId,
      checkOut: { $gte: today, $lt: tomorrow },
      status: 'confirmed'
    }),
    Booking.countDocuments({
      hotel: hotelId,
      status: 'pending'
    }),
    Booking.countDocuments({
      hotel: hotelId,
      checkIn: { $gte: today, $lte: nextWeek },
      status: { $in: ['pending', 'confirmed'] }
    }),
    Booking.countDocuments({
      hotel: hotelId,
      status: 'confirmed',
      confirmedAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), 1)
      }
    })
  ])

  res.json({
    success: true,
    data: {
      todayArrivals,
      todayDepartures,
      pendingReservations,
      upcomingReservations,
      confirmedThisMonth
    }
  })
})

// Create new reservation (from PMS)
export const createReservation = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const {
    roomTypeId,
    mealPlanId,
    checkIn,
    checkOut,
    adults,
    childrenAges = [],
    leadGuest,
    contact,
    pricing,
    specialRequests,
    paymentMethod,
    paymentAmount,
    agencyId
  } = req.body

  const children = childrenAges.length

  // Validate required fields
  if (!roomTypeId || !mealPlanId || !checkIn || !checkOut || !leadGuest || !contact) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    })
  }

  // Get hotel for partner ID
  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Hotel not found'
    })
  }

  // Get room type and meal plan
  const [roomType, mealPlan] = await Promise.all([
    RoomType.findById(roomTypeId),
    MealPlan.findById(mealPlanId)
  ])

  if (!roomType || !mealPlan) {
    return res.status(400).json({
      success: false,
      message: 'Invalid room type or meal plan'
    })
  }

  // Calculate nights
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))

  // Generate booking number
  const bookingNumber = await Booking.generateBookingNumber(hotel.partner)

  // Create reservation
  const reservation = new Booking({
    bookingNumber,
    partner: hotel.partner,
    hotel: hotelId,
    hotelCode: hotel.code,
    hotelName: hotel.name?.tr || hotel.name?.en,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    nights,
    rooms: [{
      roomType: roomTypeId,
      roomTypeCode: roomType.code,
      roomTypeName: roomType.name,
      mealPlan: mealPlanId,
      mealPlanCode: mealPlan.code,
      mealPlanName: mealPlan.name,
      guests: [{
        type: 'adult',
        firstName: leadGuest.firstName,
        lastName: leadGuest.lastName,
        isLead: true
      }],
      pricing: {
        currency: pricing?.currency || 'TRY',
        originalTotal: pricing?.total || 0,
        discount: 0,
        finalTotal: pricing?.total || 0
      }
    }],
    totalRooms: 1,
    totalAdults: adults,
    totalChildren: children,
    totalInfants: 0,
    leadGuest: {
      type: 'adult',
      firstName: leadGuest.firstName,
      lastName: leadGuest.lastName,
      nationality: leadGuest.nationality,
      passportNumber: leadGuest.idNumber,
      isLead: true
    },
    contact: {
      email: contact.email,
      phone: contact.phone
    },
    pricing: {
      currency: pricing?.currency || 'TRY',
      subtotal: pricing?.total || 0,
      totalDiscount: 0,
      tax: 0,
      grandTotal: pricing?.total || 0
    },
    payment: {
      status: paymentAmount > 0 ? 'partial' : 'pending',
      method: paymentMethod || 'cash',
      paidAmount: paymentAmount || 0,
      dueAmount: (pricing?.total || 0) - (paymentAmount || 0),
      transactions: paymentAmount > 0 ? [{
        type: 'payment',
        amount: paymentAmount,
        currency: pricing?.currency || 'TRY',
        status: 'completed',
        reference: 'PMS Direct'
      }] : []
    },
    status: 'confirmed',
    confirmedAt: new Date(),
    source: {
      type: 'pms',
      channel: 'PMS',
      agencyId: agencyId || undefined
    },
    specialRequests
  })

  await reservation.save()

  res.status(201).json({
    success: true,
    data: reservation
  })
})

// Update reservation
export const updateReservation = asyncHandler(async (req, res) => {
  const { hotelId, reservationId } = req.params
  const updates = req.body

  const reservation = await Booking.findOne({
    _id: reservationId,
    hotel: hotelId
  })

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    })
  }

  // Check if modification is allowed
  if (['cancelled', 'completed', 'no_show'].includes(reservation.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot modify a finalized reservation'
    })
  }

  // Track modifications
  const modification = {
    modifiedAt: new Date(),
    modifiedBy: req.user?._id,
    type: 'other',
    description: 'Reservation updated from PMS'
  }

  // Update allowed fields
  if (updates.checkIn) {
    modification.type = 'dates'
    modification.previousValue = { checkIn: reservation.checkIn }
    reservation.checkIn = new Date(updates.checkIn)
    modification.newValue = { checkIn: reservation.checkIn }
  }

  if (updates.checkOut) {
    modification.type = 'dates'
    modification.previousValue = { ...modification.previousValue, checkOut: reservation.checkOut }
    reservation.checkOut = new Date(updates.checkOut)
    modification.newValue = { ...modification.newValue, checkOut: reservation.checkOut }
  }

  if (updates.specialRequests !== undefined) {
    reservation.specialRequests = updates.specialRequests
  }

  if (updates.leadGuest) {
    modification.type = 'guests'
    reservation.leadGuest = { ...reservation.leadGuest, ...updates.leadGuest }
  }

  if (updates.contact) {
    reservation.contact = { ...reservation.contact, ...updates.contact }
  }

  // Add modification to history
  reservation.modifications.push(modification)

  await reservation.save()

  res.json({
    success: true,
    data: reservation
  })
})

// Confirm reservation
export const confirmReservation = asyncHandler(async (req, res) => {
  const { hotelId, reservationId } = req.params

  const reservation = await Booking.findOne({
    _id: reservationId,
    hotel: hotelId
  })

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    })
  }

  if (reservation.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending reservations can be confirmed'
    })
  }

  reservation.status = 'confirmed'
  reservation.confirmedAt = new Date()
  reservation.modifications.push({
    modifiedAt: new Date(),
    modifiedBy: req.user?._id,
    type: 'status',
    description: 'Reservation confirmed from PMS',
    previousValue: { status: 'pending' },
    newValue: { status: 'confirmed' }
  })

  await reservation.save()

  res.json({
    success: true,
    data: reservation
  })
})

// Cancel reservation
export const cancelReservation = asyncHandler(async (req, res) => {
  const { hotelId, reservationId } = req.params
  const { reason, refundAmount = 0 } = req.body

  const reservation = await Booking.findOne({
    _id: reservationId,
    hotel: hotelId
  })

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    })
  }

  const canCancel = reservation.canCancel()
  if (!canCancel.allowed) {
    return res.status(400).json({
      success: false,
      message: canCancel.reason
    })
  }

  reservation.status = 'cancelled'
  reservation.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: req.user?._id,
    reason: reason || 'Cancelled from PMS',
    refundAmount,
    refundStatus: refundAmount > 0 ? 'pending' : undefined
  }

  reservation.modifications.push({
    modifiedAt: new Date(),
    modifiedBy: req.user?._id,
    type: 'status',
    description: `Reservation cancelled: ${reason || 'No reason provided'}`,
    previousValue: { status: reservation.status },
    newValue: { status: 'cancelled' }
  })

  await reservation.save()

  res.json({
    success: true,
    data: reservation
  })
})

// Mark as no-show
export const markNoShow = asyncHandler(async (req, res) => {
  const { hotelId, reservationId } = req.params

  const reservation = await Booking.findOne({
    _id: reservationId,
    hotel: hotelId
  })

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    })
  }

  if (!['pending', 'confirmed'].includes(reservation.status)) {
    return res.status(400).json({
      success: false,
      message: 'Only pending or confirmed reservations can be marked as no-show'
    })
  }

  reservation.status = 'no_show'
  reservation.modifications.push({
    modifiedAt: new Date(),
    modifiedBy: req.user?._id,
    type: 'status',
    description: 'Marked as no-show from PMS',
    previousValue: { status: reservation.status },
    newValue: { status: 'no_show' }
  })

  await reservation.save()

  res.json({
    success: true,
    data: reservation
  })
})

// Add note to reservation
export const addNote = asyncHandler(async (req, res) => {
  const { hotelId, reservationId } = req.params
  const { content, isInternal = true } = req.body

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Note content is required'
    })
  }

  const reservation = await Booking.findOne({
    _id: reservationId,
    hotel: hotelId
  })

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    })
  }

  reservation.notes.push({
    createdAt: new Date(),
    createdBy: req.user?._id,
    content,
    isInternal
  })

  await reservation.save()

  res.json({
    success: true,
    data: reservation
  })
})

// Add payment to reservation
export const addPayment = asyncHandler(async (req, res) => {
  const { hotelId, reservationId } = req.params
  const { amount, method = 'cash', reference } = req.body

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid payment amount is required'
    })
  }

  const reservation = await Booking.findOne({
    _id: reservationId,
    hotel: hotelId
  })

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    })
  }

  // Add transaction
  reservation.payment.transactions.push({
    type: 'payment',
    amount,
    currency: reservation.pricing.currency,
    date: new Date(),
    reference: reference || 'PMS Payment',
    status: 'completed'
  })

  // Update paid amount
  reservation.payment.paidAmount = (reservation.payment.paidAmount || 0) + amount
  reservation.payment.dueAmount = reservation.pricing.grandTotal - reservation.payment.paidAmount

  // Update payment status
  if (reservation.payment.paidAmount >= reservation.pricing.grandTotal) {
    reservation.payment.status = 'paid'
  } else if (reservation.payment.paidAmount > 0) {
    reservation.payment.status = 'partial'
  }

  reservation.payment.method = method

  await reservation.save()

  res.json({
    success: true,
    data: reservation
  })
})
