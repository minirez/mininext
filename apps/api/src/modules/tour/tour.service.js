import mongoose from 'mongoose'
import { nanoid } from 'nanoid'
import { asyncHandler, escapeRegex } from '#helpers'
import { BadRequestError, ConflictError, NotFoundError } from '#core/errors.js'
import Tour from './tour.model.js'
import TourDeparture from './tourDeparture.model.js'
import TourExtra from './tourExtra.model.js'
import TourBooking from './tourBooking.model.js'
import {
  getTourGalleryFileUrl,
  getTourStopPhotoUrl,
  deleteTourGalleryFile,
  deleteTourStopPhotoFile
} from '#helpers/tourUpload.js'
import { slugify } from '@booking-engine/utils/string'

const parseIntSafe = (v, fallback) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

const requirePartnerId = req => {
  const partnerId = req.partnerId
  if (!partnerId) throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  return partnerId
}

async function generateUniqueSlug({ partnerId, baseSlug, excludeId = null }) {
  if (!baseSlug) return null
  let slug = baseSlug
  let counter = 1

  // Ensure uniqueness per partner by suffixing -2, -3, ...
  while (true) {
    const exists = await Tour.findOne({
      partner: partnerId,
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {})
    })
      .select('_id')
      .lean()

    if (!exists) return slug
    counter += 1
    slug = `${baseSlug}-${counter}`
  }
}

function buildTourSearchMatch({ partnerId, q, tag, locationId, channel }) {
  const match = { partner: new mongoose.Types.ObjectId(partnerId) }

  if (channel === 'b2c') match['visibility.b2c'] = true
  if (channel === 'b2b') match['visibility.b2b'] = true

  if (tag) {
    match.tags = tag
  }

  if (locationId) {
    match.$or = [
      { 'primaryLocation.refId': new mongoose.Types.ObjectId(locationId) },
      { 'routePlan.stops.locationRef.refId': new mongoose.Types.ObjectId(locationId) }
    ]
  }

  if (q) {
    const escaped = escapeRegex(q)
    match.$or = [
      ...(match.$or || []),
      { code: { $regex: escaped, $options: 'i' } },
      { 'name.tr': { $regex: escaped, $options: 'i' } },
      { 'name.en': { $regex: escaped, $options: 'i' } },
      { tags: { $regex: escaped, $options: 'i' } },
      { 'routePlan.stops.locationSnapshot.name': { $regex: escaped, $options: 'i' } }
    ]
  }

  return match
}

function normalizeTourPayload(body = {}) {
  const payload = { ...body }

  // Ensure shapes exist
  if (!payload.visibility) payload.visibility = { b2c: true, b2b: true }
  if (!payload.content) payload.content = {}
  if (!payload.routePlan) payload.routePlan = { mode: 'sequence', stops: [] }
  if (!Array.isArray(payload.routePlan?.stops)) payload.routePlan.stops = []
  if (!Array.isArray(payload.tags)) payload.tags = []
  if (!Array.isArray(payload.gallery)) payload.gallery = []

  // Uppercase code
  if (payload.code) payload.code = String(payload.code).trim().toUpperCase()

  // Keep route stops sequence consistent
  payload.routePlan.stops = payload.routePlan.stops.map((s, idx) => ({
    ...s,
    sequence: s.sequence ?? idx + 1
  }))

  return payload
}

function getMainGalleryImage(tour) {
  const gallery = tour?.gallery || []
  const main = gallery.find(i => i?.isMain) || gallery[0]
  return main?.url || null
}

// ==================== TOURS ====================

export const getTours = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { page = 1, limit = 20, search, status, tag, visibilityChannel, locationId } = req.query

  const pageNum = Math.max(1, parseIntSafe(page, 1))
  const limitNum = Math.min(100, Math.max(1, parseIntSafe(limit, 20)))
  const skip = (pageNum - 1) * limitNum

  const filter = { partner: partnerId }
  if (status) filter.status = status
  if (tag) filter.tags = tag
  if (visibilityChannel === 'b2c') filter['visibility.b2c'] = true
  if (visibilityChannel === 'b2b') filter['visibility.b2b'] = true
  if (locationId) {
    filter.$or = [
      { 'primaryLocation.refId': locationId },
      { 'routePlan.stops.locationRef.refId': locationId }
    ]
  }

  if (search) {
    const escaped = escapeRegex(search)
    filter.$or = [
      ...(filter.$or || []),
      { code: { $regex: escaped, $options: 'i' } },
      { 'name.tr': { $regex: escaped, $options: 'i' } },
      { 'name.en': { $regex: escaped, $options: 'i' } },
      { tags: { $regex: escaped, $options: 'i' } },
      { 'routePlan.stops.locationSnapshot.name': { $regex: escaped, $options: 'i' } }
    ]
  }

  const [total, items] = await Promise.all([
    Tour.countDocuments(filter),
    Tour.find(filter).sort({ displayOrder: 1, createdAt: -1 }).skip(skip).limit(limitNum).lean()
  ])

  // Decorate list items with simple computed fields admin expects
  const tourIds = items.map(t => t._id)
  const departureCounts = await TourDeparture.aggregate([
    { $match: { partner: new mongoose.Types.ObjectId(partnerId), tour: { $in: tourIds } } },
    { $group: { _id: '$tour', count: { $sum: 1 } } }
  ])
  const depCountMap = new Map(departureCounts.map(d => [String(d._id), d.count]))

  const decorated = items.map(t => ({
    ...t,
    departureCount: depCountMap.get(String(t._id)) || 0,
    mainImage: getMainGalleryImage(t)
  }))

  res.json({
    success: true,
    data: {
      items: decorated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  })
})

export const getTourStats = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)

  const [total, active] = await Promise.all([
    Tour.countDocuments({ partner: partnerId }),
    Tour.countDocuments({ partner: partnerId, status: 'active' })
  ])

  const upcomingDepartures = await TourDeparture.countDocuments({
    partner: partnerId,
    status: { $nin: ['cancelled', 'completed'] },
    departureDate: { $gte: new Date() }
  })

  res.json({
    success: true,
    data: { total, active, upcomingDepartures }
  })
})

/**
 * GET /api/tour/search
 * Used by dropdown/autocomplete (B2C/B2B) and internal wizard
 */
export const searchTours = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { q = '', channel = '', date, locationId, tag, limit = 20 } = req.query
  const limitNum = Math.min(50, Math.max(1, parseIntSafe(limit, 20)))

  const match = buildTourSearchMatch({
    partnerId,
    q: String(q || '').trim(),
    tag: tag ? String(tag).trim() : null,
    locationId: locationId ? String(locationId).trim() : null,
    channel: channel ? String(channel).trim() : null
  })

  const dateFilter = date ? new Date(String(date)) : null

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'tourdepartures',
        let: { tourId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$tour', '$$tourId'] },
              partner: new mongoose.Types.ObjectId(partnerId),
              status: { $nin: ['cancelled', 'completed'] },
              ...(dateFilter ? { departureDate: { $gte: dateFilter } } : {})
            }
          },
          { $sort: { departureDate: 1 } }
        ],
        as: 'deps'
      }
    },
    {
      $addFields: {
        nextDepartureDate: { $arrayElemAt: ['$deps.departureDate', 0] },
        // Derive priceFrom from cheapest upcoming departure (adult.double)
        priceFrom: {
          $min: {
            $map: {
              input: '$deps',
              as: 'd',
              in: '$$d.pricing.adult.double'
            }
          }
        },
        currency: { $arrayElemAt: ['$deps.currency', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        code: 1,
        name: 1,
        slug: 1,
        primaryLocation: 1,
        stopNames: '$routePlan.stops.locationSnapshot.name',
        nextDepartureDate: 1,
        priceFrom: 1,
        currency: 1
      }
    },
    { $limit: limitNum }
  ]

  const items = await Tour.aggregate(pipeline)

  res.json({
    success: true,
    data: items
  })
})

export const getTour = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const tour = await Tour.findOne({ _id: req.params.id, partner: partnerId }).lean()
  if (!tour) throw new NotFoundError('TOUR_NOT_FOUND')

  res.json({ success: true, data: tour })
})

export const createTour = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const payload = normalizeTourPayload(req.body)

  if (!payload.code) throw new BadRequestError('REQUIRED_CODE')
  if (!payload.name?.tr) throw new BadRequestError('REQUIRED_TOUR_NAME_TR')

  const baseSlug = slugify(payload.name.tr || payload.name.en || payload.code)
  payload.slug = await generateUniqueSlug({ partnerId, baseSlug })

  const tour = await Tour.create({
    ...payload,
    partner: partnerId
  })

  res.status(201).json({
    success: true,
    message: req.t ? req.t('TOUR_CREATED') : 'Tour created',
    data: tour
  })
})

export const updateTour = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const tour = await Tour.findOne({ _id: req.params.id, partner: partnerId })
  if (!tour) throw new NotFoundError('TOUR_NOT_FOUND')

  const payload = normalizeTourPayload(req.body)

  // If name changed, ensure slug uniqueness
  if (payload.name?.tr && payload.name?.tr !== tour.name?.tr) {
    const baseSlug = slugify(payload.name.tr || payload.name.en || payload.code || tour.code)
    payload.slug = await generateUniqueSlug({ partnerId, baseSlug, excludeId: tour._id })
  }

  Object.keys(payload).forEach(k => {
    tour[k] = payload[k]
  })

  await tour.save()

  res.json({
    success: true,
    message: req.t ? req.t('TOUR_UPDATED') : 'Tour updated',
    data: tour
  })
})

export const deleteTour = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)

  const tour = await Tour.findOne({ _id: req.params.id, partner: partnerId })
  if (!tour) throw new NotFoundError('TOUR_NOT_FOUND')

  const hasDepartures = await TourDeparture.exists({ partner: partnerId, tour: tour._id })
  if (hasDepartures) {
    throw new ConflictError('TOUR_HAS_DEPARTURES')
  }

  const hasBookings = await TourBooking.exists({ partner: partnerId, tour: tour._id })
  if (hasBookings) {
    throw new ConflictError('TOUR_HAS_BOOKINGS')
  }

  await tour.deleteOne()

  res.json({
    success: true,
    message: req.t ? req.t('TOUR_DELETED') : 'Tour deleted'
  })
})

export const duplicateTour = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const source = await Tour.findOne({ _id: req.params.id, partner: partnerId }).lean()
  if (!source) throw new NotFoundError('TOUR_NOT_FOUND')

  const newCode = `${source.code}-COPY-${nanoid(4).toUpperCase()}`
  const baseSlug = slugify(`${source.slug || source.name?.tr || source.code}-copy`)
  const uniqueSlug = await generateUniqueSlug({ partnerId, baseSlug })

  const duplicated = await Tour.create({
    ...source,
    _id: undefined,
    code: newCode,
    slug: uniqueSlug,
    status: 'draft',
    isFeatured: false,
    gallery: (source.gallery || []).map(img => ({
      ...img,
      _id: undefined,
      isMain: false
    })),
    partner: partnerId,
    createdAt: undefined,
    updatedAt: undefined
  })

  res.status(201).json({
    success: true,
    message: req.t ? req.t('TOUR_DUPLICATED') : 'Tour duplicated',
    data: duplicated
  })
})

// ==================== MEDIA ====================

export const uploadGalleryImage = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const tourId = req.params.id

  const tour = await Tour.findOne({ _id: tourId, partner: partnerId })
  if (!tour) throw new NotFoundError('TOUR_NOT_FOUND')
  if (!req.file) throw new BadRequestError('NO_FILE_UPLOADED')

  const url = getTourGalleryFileUrl(partnerId, tourId, req.file.filename)
  const image = {
    url,
    filename: req.file.filename,
    uploadedAt: new Date(),
    caption: { tr: '', en: '' },
    order: (tour.gallery?.length || 0) + 1,
    isMain: (tour.gallery?.length || 0) === 0
  }

  tour.gallery.push(image)
  await tour.save()

  res.json({
    success: true,
    data: { tour, image: tour.gallery[tour.gallery.length - 1] }
  })
})

export const deleteGalleryImage = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const tourId = req.params.id
  const imageId = req.params.imageId

  const tour = await Tour.findOne({ _id: tourId, partner: partnerId })
  if (!tour) throw new NotFoundError('TOUR_NOT_FOUND')

  const idx = (tour.gallery || []).findIndex(img => String(img._id) === String(imageId))
  if (idx === -1) throw new NotFoundError('IMAGE_NOT_FOUND')

  const [removed] = tour.gallery.splice(idx, 1)
  if (removed?.filename) {
    deleteTourGalleryFile(partnerId, tourId, removed.filename)
  }

  // Ensure a main image exists
  if (removed?.isMain && tour.gallery.length > 0) {
    tour.gallery[0].isMain = true
  }

  await tour.save()

  res.json({ success: true, data: tour })
})

export const uploadRouteStopPhoto = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const tourId = req.params.id
  const stopId = req.params.stopId

  const tour = await Tour.findOne({ _id: tourId, partner: partnerId })
  if (!tour) throw new NotFoundError('TOUR_NOT_FOUND')
  if (!req.file) throw new BadRequestError('NO_FILE_UPLOADED')

  const stop = tour.routePlan?.stops?.id(stopId)
  if (!stop) throw new NotFoundError('ROUTE_STOP_NOT_FOUND')

  // Delete previous file if present
  if (stop.photo?.filename) {
    deleteTourStopPhotoFile(partnerId, tourId, stopId, stop.photo.filename)
  }

  stop.photo = {
    url: getTourStopPhotoUrl(partnerId, tourId, stopId, req.file.filename),
    filename: req.file.filename,
    uploadedAt: new Date(),
    alt: { tr: '', en: '' }
  }

  await tour.save()

  res.json({ success: true, data: stop })
})

export const deleteRouteStopPhoto = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const tourId = req.params.id
  const stopId = req.params.stopId

  const tour = await Tour.findOne({ _id: tourId, partner: partnerId })
  if (!tour) throw new NotFoundError('TOUR_NOT_FOUND')

  const stop = tour.routePlan?.stops?.id(stopId)
  if (!stop) throw new NotFoundError('ROUTE_STOP_NOT_FOUND')

  if (stop.photo?.filename) {
    deleteTourStopPhotoFile(partnerId, tourId, stopId, stop.photo.filename)
  }
  stop.photo = undefined

  await tour.save()

  res.json({ success: true, data: stop })
})

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

// ==================== EXTRAS ====================

export const getExtras = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { isActive, category, search } = req.query

  const filter = { partner: partnerId }
  if (isActive != null) filter.isActive = String(isActive) === 'true'
  if (category) filter.category = category
  if (search) {
    const escaped = escapeRegex(search)
    filter.$or = [
      { code: { $regex: escaped, $options: 'i' } },
      { 'name.tr': { $regex: escaped, $options: 'i' } },
      { 'name.en': { $regex: escaped, $options: 'i' } }
    ]
  }

  const items = await TourExtra.find(filter).sort({ createdAt: -1 }).lean()
  const decorated = items.map(e => ({
    ...e,
    // Backwards-compatible fields for admin UI
    status: e.isActive ? 'active' : 'inactive',
    defaultPrice: e.price?.value ?? 0,
    currency: e.price?.currency || 'TRY',
    applicableTours: [] // kept for legacy UI
  }))
  res.json({ success: true, data: decorated })
})

export const getExtra = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const item = await TourExtra.findOne({ _id: req.params.id, partner: partnerId }).lean()
  if (!item) throw new NotFoundError('EXTRA_NOT_FOUND')
  res.json({
    success: true,
    data: {
      ...item,
      status: item.isActive ? 'active' : 'inactive',
      defaultPrice: item.price?.value ?? 0,
      currency: item.price?.currency || 'TRY',
      applicableTours: []
    }
  })
})

export const createExtra = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const body = req.body || {}
  if (!body.code) throw new BadRequestError('REQUIRED_CODE')
  if (!body.name?.tr) throw new BadRequestError('REQUIRED_NAME_TR')
  const legacyPriceValue = body.defaultPrice != null ? Number(body.defaultPrice) : null
  const legacyCurrency = body.currency ? String(body.currency) : null

  const price =
    body.price?.value != null && body.price?.currency
      ? body.price
      : legacyPriceValue != null && legacyCurrency
        ? { value: legacyPriceValue, currency: legacyCurrency }
        : null

  if (!price?.value || !price?.currency) throw new BadRequestError('REQUIRED_PRICE')

  const extra = await TourExtra.create({
    ...body,
    partner: partnerId,
    isActive:
      body.isActive != null
        ? Boolean(body.isActive)
        : body.status
          ? body.status === 'active'
          : true,
    price
  })
  const decorated = {
    ...(extra.toObject ? extra.toObject() : extra),
    status: extra.isActive ? 'active' : 'inactive',
    defaultPrice: extra.price?.value ?? 0,
    currency: extra.price?.currency || 'TRY',
    applicableTours: []
  }
  res.status(201).json({ success: true, data: decorated })
})

export const updateExtra = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const extra = await TourExtra.findOne({ _id: req.params.id, partner: partnerId })
  if (!extra) throw new NotFoundError('EXTRA_NOT_FOUND')

  const body = req.body || {}

  // Legacy compatibility: defaultPrice/currency/status -> price/isActive
  if (body.defaultPrice != null || body.currency) {
    const nextValue =
      body.defaultPrice != null ? Number(body.defaultPrice) : Number(extra.price?.value || 0)
    const nextCurrency = body.currency ? String(body.currency) : extra.price?.currency || 'TRY'
    extra.price = { value: nextValue, currency: nextCurrency }
  } else if (body.price) {
    extra.price = body.price
  }

  if (body.status) extra.isActive = body.status === 'active'
  if (body.isActive != null) extra.isActive = Boolean(body.isActive)

  Object.keys(body).forEach(k => {
    if (['defaultPrice', 'currency', 'status', 'isActive', 'price'].includes(k)) return
    extra[k] = body[k]
  })

  await extra.save()
  const decorated = {
    ...(extra.toObject ? extra.toObject() : extra),
    status: extra.isActive ? 'active' : 'inactive',
    defaultPrice: extra.price?.value ?? 0,
    currency: extra.price?.currency || 'TRY',
    applicableTours: []
  }
  res.json({ success: true, data: decorated })
})

export const deleteExtra = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const extra = await TourExtra.findOne({ _id: req.params.id, partner: partnerId })
  if (!extra) throw new NotFoundError('EXTRA_NOT_FOUND')

  await extra.deleteOne()
  res.json({ success: true })
})

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

// ======================
// AI EXTRACTION
// ======================

export const aiExtractTourData = asyncHandler(async (req, res) => {
  const { content } = req.body || {}

  if (!content || typeof content !== 'string' || content.trim().length < 50) {
    throw new BadRequestError('Content must be at least 50 characters')
  }

  const { extractTourData } = await import('#services/gemini/tourExtraction.js')
  const result = await extractTourData(content.trim())

  res.json(result)
})
