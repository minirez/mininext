import mongoose from 'mongoose'
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

// ==================== DEPARTURES ====================

export const getTourDepartures = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { tourId } = req.params
  const { fromDate, toDate, status } = req.query

  const filter = { partner: partnerId, tour: tourId }
  if (status) filter.status = status
  if (fromDate || toDate) {
    filter.departureDate = {}
    if (fromDate) filter.departureDate.$gte = new Date(String(fromDate))
    if (toDate) filter.departureDate.$lte = new Date(String(toDate))
  }

  const departures = await TourDeparture.find(filter).sort({ departureDate: 1 }).lean()

  res.json({ success: true, data: departures })
})

export const createTourDeparture = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { tourId } = req.params

  const tourExists = await Tour.exists({ _id: tourId, partner: partnerId })
  if (!tourExists) throw new NotFoundError('TOUR_NOT_FOUND')

  const body = req.body || {}
  if (!body.departureDate || !body.returnDate) {
    throw new BadRequestError('REQUIRED_DATES')
  }

  const capacityTotal = Number(body.capacity?.total ?? body.capacityTotal ?? 0)
  if (!Number.isFinite(capacityTotal) || capacityTotal <= 0) {
    throw new BadRequestError('INVALID_CAPACITY_TOTAL')
  }

  const departure = await TourDeparture.create({
    partner: partnerId,
    tour: tourId,
    status: body.status || 'scheduled',
    departureDate: new Date(body.departureDate),
    returnDate: new Date(body.returnDate),
    time: body.time,
    currency: body.currency || 'TRY',
    pricing: body.pricing || {},
    guaranteedDeparture: Boolean(body.guaranteedDeparture),
    labels: body.labels || [],
    capacity: {
      total: capacityTotal,
      reserved: Number(body.capacity?.reserved || 0),
      sold: Number(body.capacity?.sold || 0),
      available: Number(body.capacity?.available || 0) // will be normalized by model hook
    }
  })

  res.status(201).json({ success: true, data: departure })
})

export const bulkCreateDepartures = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { tourId } = req.params

  const tourExists = await Tour.exists({ _id: tourId, partner: partnerId })
  if (!tourExists) throw new NotFoundError('TOUR_NOT_FOUND')

  const { departures = [] } = req.body || {}
  if (!Array.isArray(departures) || departures.length === 0) {
    throw new BadRequestError('REQUIRED_DEPARTURES')
  }

  const docs = departures.map(d => {
    const capacityTotal = Number(d.capacity?.total ?? d.capacityTotal ?? 0)
    return {
      partner: partnerId,
      tour: tourId,
      status: d.status || 'scheduled',
      departureDate: new Date(d.departureDate),
      returnDate: new Date(d.returnDate),
      time: d.time,
      currency: d.currency || 'TRY',
      pricing: d.pricing || {},
      guaranteedDeparture: Boolean(d.guaranteedDeparture),
      labels: d.labels || [],
      capacity: {
        total: capacityTotal,
        reserved: Number(d.capacity?.reserved || 0),
        sold: Number(d.capacity?.sold || 0),
        available: Number(d.capacity?.available || 0)
      }
    }
  })

  // Filter invalid entries quickly
  const validDocs = docs.filter(d => d.departureDate && d.returnDate && d.capacity.total > 0)

  // Prevent duplicates (same date) by skipping existing ones
  const depDates = validDocs.map(d => d.departureDate)
  const existing = await TourDeparture.find({
    partner: partnerId,
    tour: tourId,
    departureDate: { $in: depDates }
  })
    .select('departureDate')
    .lean()
  const existingSet = new Set(
    existing.map(e => new Date(e.departureDate).toISOString().slice(0, 10))
  )

  const toInsert = validDocs.filter(d => {
    const key = new Date(d.departureDate).toISOString().slice(0, 10)
    return !existingSet.has(key)
  })

  const created = toInsert.length ? await TourDeparture.insertMany(toInsert) : []

  res.status(201).json({
    success: true,
    data: {
      count: created.length,
      created
    }
  })
})

export const searchDepartures = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { tour, status, fromDate, toDate, limit = 500 } = req.query

  const filter = { partner: partnerId }
  if (tour) filter.tour = tour
  if (status) filter.status = status
  if (fromDate || toDate) {
    filter.departureDate = {}
    if (fromDate) filter.departureDate.$gte = new Date(String(fromDate))
    if (toDate) filter.departureDate.$lte = new Date(String(toDate))
  }

  const limitNum = Math.min(2000, Math.max(1, parseIntSafe(limit, 500)))

  const departures = await TourDeparture.find(filter)
    .sort({ departureDate: 1 })
    .limit(limitNum)
    .populate('tour', 'code name')
    .lean()

  res.json({ success: true, data: departures })
})

export const getUpcomingDepartures = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { days = 60, limit = 100 } = req.query

  const now = new Date()
  const end = new Date(now)
  end.setDate(end.getDate() + Math.max(1, parseIntSafe(days, 60)))

  const items = await TourDeparture.find({
    partner: partnerId,
    status: { $nin: ['cancelled', 'completed'] },
    departureDate: { $gte: now, $lte: end }
  })
    .sort({ departureDate: 1 })
    .limit(Math.min(500, Math.max(1, parseIntSafe(limit, 100))))
    .populate('tour', 'code name')
    .lean()

  res.json({ success: true, data: items })
})

export const getDeparture = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const dep = await TourDeparture.findOne({ _id: req.params.id, partner: partnerId })
    .populate('tour', 'code name')
    .lean()
  if (!dep) throw new NotFoundError('DEPARTURE_NOT_FOUND')
  res.json({ success: true, data: dep })
})

export const updateDeparture = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const dep = await TourDeparture.findOne({ _id: req.params.id, partner: partnerId })
  if (!dep) throw new NotFoundError('DEPARTURE_NOT_FOUND')

  const body = req.body || {}
  if (body.departureDate) dep.departureDate = new Date(body.departureDate)
  if (body.returnDate) dep.returnDate = new Date(body.returnDate)
  if (body.time !== undefined) dep.time = body.time
  if (body.status) dep.status = body.status
  if (body.currency) dep.currency = body.currency
  if (body.pricing) dep.pricing = body.pricing
  if (body.guaranteedDeparture !== undefined)
    dep.guaranteedDeparture = Boolean(body.guaranteedDeparture)
  if (body.labels) dep.labels = body.labels

  if (body.capacity?.total != null) dep.capacity.total = Number(body.capacity.total)
  if (body.capacity?.reserved != null) dep.capacity.reserved = Number(body.capacity.reserved)
  if (body.capacity?.sold != null) dep.capacity.sold = Number(body.capacity.sold)

  await dep.save()

  res.json({ success: true, data: dep })
})

export const deleteDeparture = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const dep = await TourDeparture.findOne({ _id: req.params.id, partner: partnerId })
  if (!dep) throw new NotFoundError('DEPARTURE_NOT_FOUND')

  const hasBookings = await TourBooking.exists({
    partner: partnerId,
    departure: dep._id,
    status: { $nin: ['cancelled'] }
  })
  if (hasBookings) {
    throw new ConflictError('DEPARTURE_HAS_BOOKINGS')
  }

  await dep.deleteOne()
  res.json({ success: true })
})

export const bulkDeleteDepartures = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { tourId } = req.params

  const departures = await TourDeparture.find({ tour: tourId, partner: partnerId })
  if (departures.length === 0) {
    return res.json({ success: true, data: { deleted: 0, skipped: 0 } })
  }

  const departureIds = departures.map(d => d._id)
  const bookingsMap = await TourBooking.aggregate([
    {
      $match: {
        partner: partnerId,
        departure: { $in: departureIds },
        status: { $nin: ['cancelled'] }
      }
    },
    { $group: { _id: '$departure', count: { $sum: 1 } } }
  ])
  const hasBookingsSet = new Set(bookingsMap.map(b => b._id.toString()))

  const toDelete = departures.filter(d => !hasBookingsSet.has(d._id.toString()))
  if (toDelete.length > 0) {
    await TourDeparture.deleteMany({ _id: { $in: toDelete.map(d => d._id) } })
  }

  res.json({
    success: true,
    data: { deleted: toDelete.length, skipped: departures.length - toDelete.length }
  })
})

export const getDepartureAvailability = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const dep = await TourDeparture.findOne({ _id: req.params.id, partner: partnerId }).lean()
  if (!dep) throw new NotFoundError('DEPARTURE_NOT_FOUND')

  res.json({
    success: true,
    data: {
      departureId: dep._id,
      capacity: dep.capacity,
      status: dep.status,
      isBookable:
        !['cancelled', 'completed'].includes(dep.status) && (dep.capacity?.available || 0) > 0
    }
  })
})

/**
 * Bulk update pricing for all departures of a tour
 * Used when tour base pricing changes
 */
export const bulkUpdateDeparturePricing = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { tourId } = req.params
  const { pricing, currency, onlyFuture = true } = req.body || {}

  if (!pricing) {
    throw new BadRequestError('REQUIRED_PRICING')
  }

  const tourExists = await Tour.exists({ _id: tourId, partner: partnerId })
  if (!tourExists) throw new NotFoundError('TOUR_NOT_FOUND')

  // Build filter for departures to update
  const filter = { partner: partnerId, tour: tourId }

  // Only update future departures by default
  if (onlyFuture) {
    filter.departureDate = { $gte: new Date() }
    filter.status = { $nin: ['cancelled', 'completed'] }
  }

  // Build update
  const update = { pricing }
  if (currency) {
    update.currency = currency
  }

  const result = await TourDeparture.updateMany(filter, { $set: update })

  res.json({
    success: true,
    data: {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    }
  })
})
