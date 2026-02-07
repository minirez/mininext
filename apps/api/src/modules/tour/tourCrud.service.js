import mongoose from 'mongoose'
import { nanoid } from 'nanoid'
import { asyncHandler, escapeRegex } from '#helpers'
import { BadRequestError, ConflictError, NotFoundError } from '#core/errors.js'
import Tour from './tour.model.js'
import TourDeparture from './tourDeparture.model.js'
import TourBooking from './tourBooking.model.js'
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
