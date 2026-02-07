import { nanoid } from 'nanoid'
import { asyncHandler } from '#helpers'
import { BadRequestError, ConflictError, NotFoundError } from '#core/errors.js'
import Tour from './tour.model.js'
import TourDeparture from './tourDeparture.model.js'
import TourBooking from './tourBooking.model.js'

const parseIntSafe = (v, fallback) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

const requirePartnerId = req => {
  const partnerId = req.partnerId
  if (!partnerId) throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  return partnerId
}

// ==================== BOOKINGS ====================

async function applyDepartureSeatDelta({
  partnerId,
  departureId,
  deltaReserved = 0,
  deltaSold = 0
}) {
  const dep = await TourDeparture.findOne({ _id: departureId, partner: partnerId })
  if (!dep) throw new NotFoundError('DEPARTURE_NOT_FOUND')

  const total = Number(dep.capacity?.total || 0)
  const reserved = Math.max(0, Number(dep.capacity?.reserved || 0) + deltaReserved)
  const sold = Math.max(0, Number(dep.capacity?.sold || 0) + deltaSold)
  const available = total - reserved - sold

  if (available < 0) {
    throw new ConflictError('DEPARTURE_CAPACITY_EXCEEDED')
  }

  dep.capacity.reserved = reserved
  dep.capacity.sold = sold
  dep.capacity.available = available

  // Auto sold_out
  if (dep.capacity.available === 0 && !['cancelled', 'completed'].includes(dep.status)) {
    dep.status = 'sold_out'
  }
  if (dep.capacity.available > 0 && dep.status === 'sold_out') {
    dep.status = 'scheduled'
  }

  await dep.save()
  return dep
}

export const getBookings = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { page = 1, limit = 20, status, fromDate, toDate } = req.query

  const pageNum = Math.max(1, parseIntSafe(page, 1))
  const limitNum = Math.min(100, Math.max(1, parseIntSafe(limit, 20)))
  const skip = (pageNum - 1) * limitNum

  const filter = { partner: partnerId }
  if (status) filter.status = status
  if (fromDate || toDate) {
    filter.createdAt = {}
    if (fromDate) filter.createdAt.$gte = new Date(String(fromDate))
    if (toDate) filter.createdAt.$lte = new Date(String(toDate))
  }

  const [total, items] = await Promise.all([
    TourBooking.countDocuments(filter),
    TourBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('tour', 'code name')
      .populate('departure', 'departureDate returnDate status')
      .lean()
  ])

  res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  })
})

export const getUpcomingBookings = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const now = new Date()

  const items = await TourBooking.find({ partner: partnerId, status: { $nin: ['cancelled'] } })
    .populate({
      path: 'departure',
      match: { departureDate: { $gte: now } },
      select: 'departureDate returnDate status tour'
    })
    .populate('tour', 'code name')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()

  const filtered = items.filter(b => b.departure)
  res.json({ success: true, data: filtered })
})

export const calculateBookingPrice = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { departure, passengers = [], extras = [] } = req.body || {}
  if (!departure) throw new BadRequestError('REQUIRED_DEPARTURE')

  const dep = await TourDeparture.findOne({ _id: departure, partner: partnerId }).lean()
  if (!dep) throw new NotFoundError('DEPARTURE_NOT_FOUND')

  const passengerList = Array.isArray(passengers) ? passengers : []
  const adultCount = passengerList.filter(p => (p?.type || 'adult') === 'adult').length
  const childCount = passengerList.filter(p => p?.type === 'child').length
  const infantCount = passengerList.filter(p => p?.type === 'infant').length

  const adultsTotal = adultCount * Number(dep.pricing?.adult?.double || 0)
  const childrenTotal = childCount * Number(dep.pricing?.child?.withBed || 0)
  const infantsTotal = infantCount * Number(dep.pricing?.infant?.price || 0)

  const extrasTotal = (Array.isArray(extras) ? extras : []).reduce((sum, e) => {
    const t = Number(e?.totalPrice || 0)
    return sum + (Number.isFinite(t) ? t : 0)
  }, 0)

  const grandTotal = adultsTotal + childrenTotal + infantsTotal + extrasTotal

  res.json({
    success: true,
    data: {
      currency: dep.currency || 'TRY',
      adults: adultsTotal,
      children: childrenTotal,
      infants: infantsTotal,
      extras: extrasTotal,
      grandTotal
    }
  })
})

/**
 * Generate unique booking number with retry logic
 */
async function generateUniqueBookingNo(partnerId, maxRetries = 5) {
  const dateStr = new Date().toISOString().slice(0, 10).replaceAll('-', '')

  for (let i = 0; i < maxRetries; i++) {
    const bookingNo = `TRB-${dateStr}-${nanoid(6).toUpperCase()}`

    // Check if this booking number already exists for this partner
    const exists = await TourBooking.exists({ partner: partnerId, bookingNo })
    if (!exists) {
      return bookingNo
    }
  }

  // Fallback with timestamp for guaranteed uniqueness
  return `TRB-${dateStr}-${Date.now().toString(36).toUpperCase()}`
}

export const createBooking = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const body = req.body || {}

  if (!body.tour) throw new BadRequestError('REQUIRED_TOUR')
  if (!body.departure) throw new BadRequestError('REQUIRED_DEPARTURE')

  const tourExists = await Tour.exists({ _id: body.tour, partner: partnerId })
  if (!tourExists) throw new NotFoundError('TOUR_NOT_FOUND')

  const dep = await TourDeparture.findOne({
    _id: body.departure,
    partner: partnerId,
    tour: body.tour
  })
  if (!dep) throw new NotFoundError('DEPARTURE_NOT_FOUND')

  if (['cancelled', 'completed'].includes(dep.status)) {
    throw new ConflictError('DEPARTURE_NOT_BOOKABLE')
  }

  // Generate unique booking number
  const bookingNo = body.bookingNo || (await generateUniqueBookingNo(partnerId))

  const booking = await TourBooking.create({
    partner: partnerId,
    tour: body.tour,
    departure: body.departure,
    bookingNo,
    passengers: body.passengers || [],
    contact: body.contact || {},
    extras: body.extras || [],
    pricing: body.pricing || {},
    payment: body.payment || {},
    specialRequests: body.specialRequests || '',
    salesChannel: body.salesChannel || 'admin',
    status: body.status || 'pending'
  })

  // Reserve seats for pending/confirmed bookings
  if (['pending', 'confirmed'].includes(booking.status)) {
    await applyDepartureSeatDelta({
      partnerId,
      departureId: booking.departure,
      deltaReserved: booking.status === 'pending' ? booking.seatCount : 0,
      deltaSold: booking.status === 'confirmed' ? booking.seatCount : 0
    })
  }

  res.status(201).json({ success: true, data: booking })
})

export const getBooking = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const booking = await TourBooking.findOne({ _id: req.params.id, partner: partnerId })
    .populate('tour', 'code name')
    .populate('departure', 'departureDate returnDate status capacity currency pricing')
    .lean()

  if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND')
  res.json({ success: true, data: booking })
})

export const updateBooking = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const booking = await TourBooking.findOne({ _id: req.params.id, partner: partnerId })
  if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND')

  // Prevent changing departure/tour via generic update
  const body = { ...(req.body || {}) }
  delete body.partner
  delete body.tour
  delete body.departure
  delete body.seatCount

  Object.keys(body).forEach(k => {
    booking[k] = body[k]
  })

  await booking.save()
  res.json({ success: true, data: booking })
})

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { status } = req.body || {}
  if (!status) throw new BadRequestError('REQUIRED_STATUS')

  const booking = await TourBooking.findOne({ _id: req.params.id, partner: partnerId })
  if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND')

  const prev = booking.status
  if (prev === status) {
    return res.json({ success: true, data: booking })
  }

  // Capacity transitions
  // pending -> confirmed: reserved->sold
  // confirmed -> cancelled: sold release
  // pending -> cancelled: reserved release
  if (prev === 'pending' && status === 'confirmed') {
    await applyDepartureSeatDelta({
      partnerId,
      departureId: booking.departure,
      deltaReserved: -booking.seatCount,
      deltaSold: booking.seatCount
    })
  } else if (prev === 'confirmed' && status === 'cancelled') {
    await applyDepartureSeatDelta({
      partnerId,
      departureId: booking.departure,
      deltaSold: -booking.seatCount
    })
    booking.cancelledAt = new Date()
  } else if (prev === 'pending' && status === 'cancelled') {
    await applyDepartureSeatDelta({
      partnerId,
      departureId: booking.departure,
      deltaReserved: -booking.seatCount
    })
    booking.cancelledAt = new Date()
  }

  booking.status = status
  await booking.save()

  res.json({ success: true, data: booking })
})

export const cancelBooking = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const booking = await TourBooking.findOne({ _id: req.params.id, partner: partnerId })
  if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND')
  if (booking.status === 'cancelled') return res.json({ success: true, data: booking })

  const { reason = '' } = req.body || {}

  if (booking.status === 'confirmed') {
    await applyDepartureSeatDelta({
      partnerId,
      departureId: booking.departure,
      deltaSold: -booking.seatCount
    })
  } else if (booking.status === 'pending') {
    await applyDepartureSeatDelta({
      partnerId,
      departureId: booking.departure,
      deltaReserved: -booking.seatCount
    })
  }

  booking.status = 'cancelled'
  booking.cancelledAt = new Date()
  booking.cancellationReason = reason
  await booking.save()

  res.json({ success: true, data: booking })
})

export const addBookingPayment = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const booking = await TourBooking.findOne({ _id: req.params.id, partner: partnerId })
  if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND')

  const { amount, currency, method, reference, note } = req.body || {}
  const amt = Number(amount || 0)
  if (!Number.isFinite(amt) || amt <= 0) throw new BadRequestError('INVALID_PAYMENT_AMOUNT')

  if (!booking.payment) booking.payment = { transactions: [] }
  if (!Array.isArray(booking.payment.transactions)) booking.payment.transactions = []

  booking.payment.transactions.push({
    amount: amt,
    currency: currency || booking.pricing?.currency || 'TRY',
    method: method || booking.payment.method || '',
    reference: reference || '',
    paidAt: new Date(),
    note: note || ''
  })

  booking.payment.paidAmount = Number(booking.payment.paidAmount || 0) + amt
  booking.payment.dueAmount = Math.max(0, Number(booking.payment.dueAmount || 0) - amt)
  booking.payment.status =
    booking.payment.dueAmount === 0 ? 'paid' : booking.payment.status || 'partial'

  await booking.save()
  res.status(201).json({ success: true, data: booking })
})

export const updateBookingPassengerVisa = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const booking = await TourBooking.findOne({ _id: req.params.id, partner: partnerId })
  if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND')

  const idx = parseIntSafe(req.params.passengerIndex, -1)
  if (idx < 0 || idx >= (booking.passengers || []).length) {
    throw new BadRequestError('INVALID_PASSENGER_INDEX')
  }

  const { status, notes } = req.body || {}
  if (!status) throw new BadRequestError('REQUIRED_VISA_STATUS')

  booking.passengers[idx].visa = {
    status,
    notes: notes || booking.passengers[idx]?.visa?.notes || '',
    updatedAt: new Date()
  }

  await booking.save()
  res.json({ success: true, data: booking })
})

export const addBookingNote = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const booking = await TourBooking.findOne({ _id: req.params.id, partner: partnerId })
  if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND')

  const { message } = req.body || {}
  if (!message) throw new BadRequestError('REQUIRED_NOTE_MESSAGE')

  booking.notes.push({
    message,
    createdBy: req.user?._id,
    createdAt: new Date()
  })

  await booking.save()
  res.status(201).json({ success: true, data: booking })
})
