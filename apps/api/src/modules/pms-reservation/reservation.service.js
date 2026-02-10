/**
 * Reservation Service
 * Handles reservation management for frontdesk operations
 */

import { asyncHandler, withTransaction, escapeRegex } from '#helpers'
import Booking from '#modules/booking/booking.model.js'
import Room from '#modules/pms-housekeeping/room.model.js'
import RoomType from '#modules/planning/roomType.model.js'
import MealPlan from '#modules/planning/mealPlan.model.js'
import Hotel from '#modules/hotel/hotel.model.js'
import Stay from '#modules/pms-frontdesk/stay.model.js'
import Guest from '#modules/pms-guest/guest.model.js'

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
  // Escape regex special characters to prevent injection
  if (search) {
    const escapedSearch = escapeRegex(search)
    query.$or = [
      { bookingNumber: { $regex: escapedSearch, $options: 'i' } },
      { 'guests.firstName': { $regex: escapedSearch, $options: 'i' } },
      { 'guests.lastName': { $regex: escapedSearch, $options: 'i' } },
      { 'guests.email': { $regex: escapedSearch, $options: 'i' } },
      { 'guests.phone': { $regex: escapedSearch, $options: 'i' } }
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
    .populate('roomTypeId', 'code name')
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
    .populate('roomTypeId', 'code name maxOccupancy')
    .populate('mealPlanId', 'code name')
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
    .populate('roomTypeId', 'code name')
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
    .populate('roomTypeId', 'code name')
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

// Create new reservation (from system)
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

  // Get hotel
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

  // Generate booking number (hotelCode-timestamp-random)
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const bookingNumber = `${hotel.code}-${timestamp}-${random}`

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
    rooms: [
      {
        roomType: roomTypeId,
        roomTypeCode: roomType.code,
        roomTypeName: roomType.name,
        mealPlan: mealPlanId,
        mealPlanCode: mealPlan.code,
        mealPlanName: mealPlan.name,
        guests: [
          {
            type: 'adult',
            firstName: leadGuest.firstName,
            lastName: leadGuest.lastName,
            isLead: true
          }
        ],
        pricing: {
          currency: pricing?.currency || 'TRY',
          originalTotal: pricing?.total || 0,
          discount: 0,
          finalTotal: pricing?.total || 0
        }
      }
    ],
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
      transactions:
        paymentAmount > 0
          ? [
              {
                type: 'payment',
                amount: paymentAmount,
                currency: pricing?.currency || 'TRY',
                status: 'completed',
                reference: 'Direct'
              }
            ]
          : []
    },
    status: 'confirmed',
    confirmedAt: new Date(),
    source: {
      type: 'pms',
      channel: agencyId ? 'Agency' : 'Direct',
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
    description: 'Reservation updated from system'
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

  // Initialize modifications array if it doesn't exist
  if (!reservation.modifications || !Array.isArray(reservation.modifications)) {
    reservation.modifications = []
  }

  reservation.status = 'confirmed'
  reservation.confirmedAt = new Date()
  reservation.modifications.push({
    modifiedAt: new Date(),
    modifiedBy: req.user?._id,
    type: 'status',
    description: 'Reservation confirmed from system',
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

  // Fetch reservation (read operation - outside transaction)
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

  const previousStatus = reservation.status
  const userId = req.user._id

  // Check for associated Stay
  const associatedStay = await Stay.findOne({ booking: reservationId })

  // Execute cancellation within a transaction
  const updatedReservation = await withTransaction(async session => {
    // 1. Update Booking to cancelled
    const result = await Booking.findByIdAndUpdate(
      reservationId,
      {
        $set: {
          status: 'cancelled',
          cancellation: {
            cancelledAt: new Date(),
            cancelledBy: userId,
            reason: reason || 'Cancelled from system',
            refundAmount,
            refundStatus: refundAmount > 0 ? 'pending' : undefined
          }
        },
        $push: {
          modifications: {
            modifiedAt: new Date(),
            modifiedBy: userId,
            type: 'status',
            description: `Reservation cancelled: ${reason || 'No reason provided'}`,
            previousValue: { status: previousStatus },
            newValue: { status: 'cancelled' }
          }
        }
      },
      { new: true, session }
    )

    // 2. Cancel associated Stay if exists and is pending
    if (associatedStay && associatedStay.status === 'pending') {
      await Stay.updateOne(
        { _id: associatedStay._id },
        {
          $set: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: userId,
            cancellationReason: reason
          }
        },
        { session }
      )
    }

    // 3. Release room if it was assigned to this booking
    if (reservation.assignedRoom) {
      await Room.updateOne(
        { _id: reservation.assignedRoom, currentBooking: reservationId },
        {
          $set: {
            currentBooking: null,
            currentGuests: [],
            expectedCheckoutDate: null
          }
        },
        { session }
      )
    }

    // 4. Update Guest statistics
    if (reservation.guestId) {
      await Guest.updateOne(
        { _id: reservation.guestId },
        { $inc: { 'statistics.cancellationCount': 1 } },
        { session }
      )
    }

    return result
  })

  res.json({
    success: true,
    data: updatedReservation
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

  // Initialize modifications array if it doesn't exist
  if (!reservation.modifications || !Array.isArray(reservation.modifications)) {
    reservation.modifications = []
  }

  const previousStatus = reservation.status
  reservation.status = 'no_show'
  reservation.modifications.push({
    modifiedAt: new Date(),
    modifiedBy: req.user?._id,
    type: 'status',
    description: 'Marked as no-show from system',
    previousValue: { status: previousStatus },
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

  // Initialize notes array if it doesn't exist
  if (!reservation.notes || !Array.isArray(reservation.notes)) {
    reservation.notes = []
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

  // Fetch reservation (read operation - outside transaction for validation)
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

  // Calculate payment details before transaction
  const currency = reservation.pricing?.currency || reservation.currency || 'TRY'
  const grandTotal =
    reservation.pricing?.grandTotal ||
    reservation.pricing?.totalAmount ||
    reservation.totalAmount ||
    0
  const currentPaidAmount = reservation.payment?.paidAmount || 0
  const newPaidAmount = currentPaidAmount + amount
  const newDueAmount = grandTotal - newPaidAmount

  // Determine new payment status
  let newPaymentStatus = 'pending'
  if (newPaidAmount >= grandTotal) {
    newPaymentStatus = 'paid'
  } else if (newPaidAmount > 0) {
    newPaymentStatus = 'partial'
  }

  // Execute payment updates within a transaction
  const updatedReservation = await withTransaction(async session => {
    // Build the payment transaction object
    const paymentTransaction = {
      type: 'payment',
      amount,
      currency,
      date: new Date(),
      reference: reference || 'Payment',
      status: 'completed'
    }

    // Update Booking with payment
    const updateResult = await Booking.findByIdAndUpdate(
      reservationId,
      {
        $set: {
          'pricing.grandTotal': grandTotal || reservation.pricing?.grandTotal,
          'pricing.totalAmount': grandTotal || reservation.pricing?.totalAmount,
          'payment.status': newPaymentStatus,
          'payment.method': method,
          'payment.paidAmount': newPaidAmount,
          'payment.dueAmount': newDueAmount
        },
        $push: {
          'payment.transactions': paymentTransaction
        }
      },
      { new: true, session }
    )

    // Sync payment to associated Stay if exists
    await Stay.updateOne(
      { booking: reservationId },
      {
        $push: {
          payments: {
            date: new Date(),
            amount,
            method,
            currency,
            reference: reference || 'Payment from reservation',
            notes: 'Synced from reservation payment'
          }
        }
      },
      { session }
    )

    return updateResult
  })

  res.json({
    success: true,
    data: updatedReservation
  })
})

// Recalculate payment data (fix corrupted data)
export const recalculatePayment = asyncHandler(async (req, res) => {
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

  // Get the correct grand total
  const grandTotal =
    reservation.pricing?.grandTotal ||
    reservation.pricing?.totalAmount ||
    reservation.totalAmount ||
    0

  // Sync pricing if needed
  if (!reservation.pricing) {
    reservation.pricing = {
      currency: reservation.currency || 'TRY',
      grandTotal: grandTotal,
      totalAmount: grandTotal
    }
  } else if (!reservation.pricing.grandTotal && grandTotal > 0) {
    reservation.pricing.grandTotal = grandTotal
    reservation.pricing.totalAmount = grandTotal
  }

  // Initialize payment if needed
  if (!reservation.payment) {
    reservation.payment = {
      status: 'pending',
      method: null,
      paidAmount: 0,
      dueAmount: grandTotal,
      transactions: []
    }
  } else {
    // Recalculate based on transactions
    const totalPaid = (reservation.payment.transactions || [])
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    reservation.payment.paidAmount = totalPaid
    reservation.payment.dueAmount = grandTotal - totalPaid

    // Update status
    if (totalPaid >= grandTotal && grandTotal > 0) {
      reservation.payment.status = 'paid'
    } else if (totalPaid > 0) {
      reservation.payment.status = 'partial'
    } else {
      reservation.payment.status = 'pending'
    }
  }

  await reservation.save()

  res.json({
    success: true,
    message: 'Payment data recalculated',
    data: reservation
  })
})

// Sync payments from Booking to associated Stay
export const syncPaymentsToStay = asyncHandler(async (req, res) => {
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

  // Find associated Stay
  const stay = await Stay.findOne({ booking: reservationId })

  if (!stay) {
    return res.status(404).json({
      success: false,
      message: 'No associated stay found for this reservation'
    })
  }

  // Get transactions from Booking
  const bookingTransactions = reservation.payment?.transactions || []
  const existingStayPaymentRefs = stay.payments.map(p => p.reference)

  let syncedCount = 0

  // Sync each transaction that doesn't exist in Stay
  for (const transaction of bookingTransactions) {
    if (transaction.type === 'payment' && transaction.status === 'completed') {
      // Check if this payment already exists in Stay (by reference or date+amount)
      const alreadySynced = stay.payments.some(
        p =>
          p.reference === transaction.reference ||
          (Math.abs(new Date(p.date) - new Date(transaction.date)) < 60000 &&
            p.amount === transaction.amount)
      )

      if (!alreadySynced) {
        stay.payments.push({
          date: transaction.date || new Date(),
          amount: transaction.amount,
          method: reservation.payment?.method || 'cash',
          currency: transaction.currency || 'TRY',
          reference: transaction.reference || `Synced-${Date.now()}`,
          notes: 'Synced from reservation'
        })
        syncedCount++
      }
    }
  }

  if (syncedCount > 0) {
    await stay.save() // Will auto-recalculate balance
  }

  res.json({
    success: true,
    message: `Synced ${syncedCount} payment(s) to stay`,
    data: {
      stay,
      syncedCount
    }
  })
})
