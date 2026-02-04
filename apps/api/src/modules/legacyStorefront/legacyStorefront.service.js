/**
 * Legacy Storefront Service
 *
 * Provides backward compatibility with the old storefront API structure.
 * Resolves partner from domain/referer and returns data in legacy format.
 */

import { asyncHandler } from '#helpers'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import Storefront from '#modules/storefront/storefront.model.js'
import Partner from '#modules/partner/partner.model.js'
import Hotel from '#modules/hotel/hotel.model.js'
import Tour from '#modules/tour/tour.model.js'
import logger from '#core/logger.js'

/**
 * Escape user input for safe regex usage.
 */
const escapeRegExp = input => String(input || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Normalize domain from referer parameter
 */
const normalizeDomain = raw => {
  if (!raw) return ''
  let s = String(raw).trim()
  if (!s) return ''

  // If a full URL was passed, extract hostname
  try {
    if (s.includes('://')) s = new URL(s).hostname
  } catch (e) {
    // Ignore URL parse errors
  }

  // Strip path/query and port
  s = s.split('/')[0].split('?')[0].split('#')[0]
  s = s.split(':')[0]

  s = s.toLowerCase().trim()
  if (s.startsWith('www.')) s = s.slice(4)
  return s
}

/**
 * Resolve partner ID from referer parameter (legacy) or domain header (new)
 */
const resolvePartnerFromReferer = async req => {
  // Legacy: use referer query param
  const referer = req.query.referer || req.body?.referer
  // New: use x-storefront-domain header
  const domainHeader = req.headers['x-storefront-domain']

  const domainRaw = referer || domainHeader || req.hostname || req.headers.host
  const normalizedDomain = normalizeDomain(domainRaw)

  if (!normalizedDomain) return null

  const candidates = Array.from(new Set([normalizedDomain, `www.${normalizedDomain}`]))

  const partner = await Partner.findOne({
    status: 'active',
    $or: [
      { 'branding.siteDomain': { $in: candidates } },
      { 'branding.pmsDomain': { $in: candidates } },
      { 'branding.extranetDomain': { $in: candidates } }
    ]
  }).select('_id status branding')

  return partner
}

/**
 * GET /storefronts
 * Legacy storefront data endpoint
 */
export const getLegacyStorefront = asyncHandler(async (req, res) => {
  const partner = await resolvePartnerFromReferer(req)

  if (!partner) {
    return res.json({
      status: false,
      msg: 'Partner not found for this domain'
    })
  }

  // Avoid returning heavy/admin-only parts of Storefront to legacy clients.
  // Legacy site3 typically only needs published settings/theme/sections.
  const storefront = await Storefront.findOne({ partner: partner._id })
    .select({
      // Explicitly exclude potentially heavy/admin-only fields
      savedThemePresets: 0,
      draft: 0,
      __v: 0
    })
    .lean()

  if (!storefront) {
    return res.json({
      status: false,
      msg: 'Storefront not found'
    })
  }

  // Return in legacy format
  res.json({
    status: true,
    data: {
      ...storefront,
      partner: partner._id,
      partnerBranding: partner.branding
    }
  })
})

/**
 * GET /storefronts/pages
 * Legacy pages endpoint
 */
export const getLegacyPages = asyncHandler(async (req, res) => {
  const partner = await resolvePartnerFromReferer(req)

  if (!partner) {
    return res.json({
      status: false,
      msg: 'Partner not found'
    })
  }

  const { url } = req.query
  // `pages` is select:false in schema, so we must explicitly include it.
  const storefront = await Storefront.findOne({ partner: partner._id }).select('+pages').lean()

  if (!storefront) {
    return res.json({
      status: false,
      msg: 'Kayıt bulunamadı'
    })
  }

  const pages = storefront.pages || []

  if (url) {
    // Return specific page
    const page = pages.find(p => p.url === url)
    if (!page) {
      return res.json({
        status: false,
        msg: 'Kayıt bulunamadı'
      })
    }
    return res.json({
      status: true,
      pages: [page]
    })
  }

  // Return all pages
  res.json({
    status: true,
    pages
  })
})

/**
 * POST /storefronts/search
 * Legacy search autocomplete
 */
export const legacySearch = asyncHandler(async (req, res) => {
  const partner = await resolvePartnerFromReferer(req)

  if (!partner) {
    return res.json({
      status: false,
      msg: 'Partner not found'
    })
  }

  const { search, type, route } = req.body
  const searchTerm = (search || '').trim()
  const safeTerm = escapeRegExp(searchTerm)
  const termRegex = safeTerm ? new RegExp(safeTerm, 'i') : null

  // Prevent broad scans on very short input
  if (!termRegex || searchTerm.length < 2) {
    if (!type) return res.json({ hotel: [], tour: [], location: [], transfer: [] })
    if (type === 'tour') return res.json({ records: [], locations: [], tags: [] })
    if (type === 'transfer') return res.json({ transferLocations: [] })
    return res.json({ records: [] })
  }

  // Build base query for this partner
  const baseQuery = {
    partner: partner._id,
    status: 'active'
  }

  // Search based on type
  if (!type) {
    // 'All' tab - search hotels, tours, and locations
    const [hotels, tours] = await Promise.all([
      Hotel.find({
        ...baseQuery,
        'visibility.b2c': true,
        $or: [
          { name: termRegex },
          { 'address.city': termRegex },
          { 'address.district': termRegex }
        ]
      })
        .select('name address.city address.district images slug')
        .limit(10)
        .lean(),

      Tour.find({
        ...baseQuery,
        'visibility.b2c': true,
        $or: [
          { 'name.tr': termRegex },
          { 'name.en': termRegex },
          { 'primaryLocation.name': termRegex }
        ]
      })
        .select('name primaryLocation gallery slug')
        .limit(10)
        .lean()
    ])

    // Extract unique locations from hotels
    const locationSet = new Set()
    hotels.forEach(h => {
      if (h.address?.city) locationSet.add(h.address.city)
      if (h.address?.district) locationSet.add(h.address.district)
    })

    const locations = Array.from(locationSet)
      .filter(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(l => ({ name: l }))

    return res.json({
      hotel: hotels.map(h => ({
        id: h._id,
        name: h.name,
        city: h.address?.city,
        slug: h.slug,
        image: h.images?.[0]?.url
      })),
      tour: tours.map(t => ({
        id: t._id,
        name: t.name?.tr || t.name?.en || '',
        city: t.primaryLocation?.name,
        slug: t.slug,
        image: t.gallery?.[0]?.url
      })),
      location: locations,
      transfer: []
    })
  }

  if (type === 'hotel') {
    const hotels = await Hotel.find({
      ...baseQuery,
      'visibility.b2c': true,
      $or: [
        { name: termRegex },
        { 'address.city': termRegex },
        { 'address.district': termRegex }
      ]
    })
      .select('name address.city address.district images slug')
      .limit(20)
      .lean()

    return res.json({
      records: hotels.map(h => ({
        id: h._id,
        name: h.name,
        city: h.address?.city,
        slug: h.slug,
        image: h.images?.[0]?.url
      }))
    })
  }

  if (type === 'tour') {
    const tours = await Tour.find({
      ...baseQuery,
      'visibility.b2c': true,
      $or: [
        { 'name.tr': termRegex },
        { 'name.en': termRegex },
        { 'primaryLocation.name': termRegex },
        { tags: termRegex }
      ]
    })
      .select('name primaryLocation gallery slug tags')
      .limit(20)
      .lean()

    // Extract unique locations and tags
    const locationSet = new Set()
    const tagSet = new Set()

    tours.forEach(t => {
      if (t.primaryLocation?.name) locationSet.add(t.primaryLocation.name)
      if (Array.isArray(t.tags)) {
        t.tags.forEach(tag => tagSet.add(tag))
      }
    })

    return res.json({
      records: tours.map(t => ({
        id: t._id,
        name: t.name?.tr || t.name?.en || '',
        city: t.primaryLocation?.name,
        slug: t.slug,
        image: t.gallery?.[0]?.url
      })),
      locations: Array.from(locationSet)
        .filter(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 5),
      tags: Array.from(tagSet)
        .filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 10)
    })
  }

  if (type === 'transfer') {
    // NOTE: Dedicated Transfer module doesn't exist yet in this API.
    // For compatibility, return an empty list (safe default).
    return res.json({
      transferLocations: []
    })
  }

  // Default response
  res.json({ records: [] })
})

/**
 * GET /storefronts/locations/search
 * Legacy location search
 */
export const legacyLocationSearch = asyncHandler(async (req, res) => {
  const partner = await resolvePartnerFromReferer(req)

  if (!partner) {
    return res.json({ status: false, locations: [] })
  }

  const { query } = req.query
  const searchTerm = (query || '').trim()
  const safeTerm = escapeRegExp(searchTerm)
  const termRegex = safeTerm ? new RegExp(safeTerm, 'i') : null

  if (searchTerm.length < 2) {
    return res.json({ status: true, locations: [] })
  }

  // Get unique cities/districts from hotels (match first to reduce scan)
  const hotels = await Hotel.find({
    partner: partner._id,
    status: 'active',
    'visibility.b2c': true,
    ...(termRegex
      ? {
          $or: [{ 'address.city': termRegex }, { 'address.district': termRegex }]
        }
      : {})
  })
    .select('address.city address.district')
    .limit(200)
    .lean()

  const locationSet = new Set()
  for (const h of hotels) {
    if (h.address?.city) locationSet.add(h.address.city)
    if (h.address?.district) locationSet.add(h.address.district)
  }

  const locations = Array.from(locationSet).map(name => ({ name })).slice(0, 20)

  res.json({
    status: true,
    locations
  })
})

/**
 * GET /storefronts/mainpagehotels
 * Featured hotels for homepage
 */
export const getMainPageHotels = asyncHandler(async (req, res) => {
  const partner = await resolvePartnerFromReferer(req)

  if (!partner) {
    return res.json({ status: false, list: [] })
  }

  // Get featured/active hotels for this partner
  const hotels = await Hotel.find({
    partner: partner._id,
    status: 'active',
    'visibility.b2c': true
  })
    .select('name slug stars type address images amenities featured displayOrder')
    .sort({ featured: -1, displayOrder: 1, createdAt: -1 })
    .limit(12)
    .lean()

  const list = hotels.map(h => ({
    id: h._id,
    name: h.name,
    slug: h.slug,
    stars: h.stars,
    type: h.type,
    city: h.address?.city,
    district: h.address?.district,
    image: h.images?.find(img => img.isMain)?.url || h.images?.[0]?.url,
    amenities: h.amenities?.slice(0, 5) || [],
    featured: h.featured
  }))

  res.json({
    status: true,
    list
  })
})

/**
 * GET /storefronts/location/:searchterm
 * Hotel search by location
 */
export const getHotelsByLocation = asyncHandler(async (req, res) => {
  const partner = await resolvePartnerFromReferer(req)

  if (!partner) {
    return res.json({ status: false, msg: 'Partner not found' })
  }

  const { searchterm } = req.params
  // Decode and handle + as space
  const searchTerm = decodeURIComponent((searchterm || '').replace(/\+/g, ' ')).trim()

  if (!searchTerm) {
    return res.json({ status: false, msg: 'Search term required' })
  }

  // Search hotels by location
  const hotels = await Hotel.find({
    partner: partner._id,
    status: 'active',
    'visibility.b2c': true,
    $or: [
      { 'address.city': new RegExp(escapeRegExp(searchTerm), 'i') },
      { 'address.district': new RegExp(escapeRegExp(searchTerm), 'i') },
      { name: new RegExp(escapeRegExp(searchTerm), 'i') }
    ]
  })
    .select('name slug stars type address images amenities description')
    .sort({ featured: -1, displayOrder: 1 })
    .lean()

  res.json({
    status: true,
    hotels: hotels.map(h => ({
      id: h._id,
      name: h.name,
      slug: h.slug,
      stars: h.stars,
      type: h.type,
      city: h.address?.city,
      district: h.address?.district,
      image: h.images?.find(img => img.isMain)?.url || h.images?.[0]?.url,
      images: h.images?.slice(0, 5).map(img => img.url) || [],
      amenities: h.amenities?.slice(0, 8) || [],
      description: h.description
    })),
    searchTerm,
    count: hotels.length
  })
})

/**
 * GET /storefronts/hotel/:hotelId
 * Hotel details
 */
export const getHotelDetails = asyncHandler(async (req, res) => {
  const partner = await resolvePartnerFromReferer(req)

  if (!partner) {
    return res.json({ status: false, msg: 'Partner not found' })
  }

  const { hotelId } = req.params

  // Try to find by ID or slug
  let hotel = null
  const isObjectId = /^[a-f\d]{24}$/i.test(hotelId)

  if (isObjectId) {
    hotel = await Hotel.findOne({
      _id: hotelId,
      partner: partner._id,
      status: 'active',
      'visibility.b2c': true
    })
      .select(
        'hotelType hotelBase name slug stars type category description address contact images amenities policies profile tags seo location'
      )
      .populate('location.city', 'name')
      .populate('location.district', 'name')
      .populate('location.tourismRegions', 'name')
      .populate('tags', 'name slug')
      .lean()
  }

  if (!hotel) {
    // Try by slug
    hotel = await Hotel.findOne({
      slug: hotelId,
      partner: partner._id,
      status: 'active',
      'visibility.b2c': true
    })
      .select(
        'hotelType hotelBase name slug stars type category description address contact images amenities policies profile tags seo location'
      )
      .populate('location.city', 'name')
      .populate('location.district', 'name')
      .populate('location.tourismRegions', 'name')
      .populate('tags', 'name slug')
      .lean()
  }

  if (!hotel) {
    return res.json({ status: false, msg: 'Hotel not found' })
  }

  // For linked hotels, resolve base data
  if (hotel.hotelType === 'linked' && hotel.hotelBase) {
    const HotelModel = Hotel // Already imported
    const hotelDoc = await HotelModel.findById(hotel._id)
    if (hotelDoc && hotelDoc.resolveData) {
      hotel = await hotelDoc.resolveData()
    }
  }

  res.json({
    status: true,
    record: {
      id: hotel._id,
      name: hotel.name,
      slug: hotel.slug,
      stars: hotel.stars,
      type: hotel.type,
      category: hotel.category,
      description: hotel.description,
      address: hotel.address,
      contact: hotel.contact,
      images: hotel.images || [],
      amenities: hotel.amenities || [],
      policies: hotel.policies,
      profile: hotel.profile,
      tags: hotel.tags,
      seo: hotel.seo,
      location: hotel.location
    }
  })
})

/**
 * GET /storefronts/hotel/:hotelId/photos
 * Hotel photos
 */
export const getHotelPhotos = asyncHandler(async (req, res) => {
  const partner = await resolvePartnerFromReferer(req)
  const { hotelId } = req.params

  // IMPORTANT: keep strict tenant isolation (do not return data without partner scoping).
  if (!partner) {
    return res.json({ status: false, photos: [] })
  }

  const isObjectId = /^[a-f\d]{24}$/i.test(hotelId)

  const query = isObjectId ? { _id: hotelId } : { slug: hotelId }
  const hotel = await Hotel.findOne({
    ...query,
    partner: partner._id,
    status: 'active',
    'visibility.b2c': true
  })
    .select('images')
    .lean()

  if (!hotel) {
    return res.json({ status: false, photos: [] })
  }

  res.json({
    status: true,
    photos: (hotel.images || []).map(img => ({
      id: img._id,
      url: img.url,
      caption: img.caption,
      isMain: img.isMain,
      order: img.order
    }))
  })
})

/**
 * GET /storefronts/mainpagetours
 * Featured tours for homepage
 */
export const getMainPageTours = asyncHandler(async (req, res) => {
  const partner = await resolvePartnerFromReferer(req)

  if (!partner) {
    return res.json({ status: false, list: [] })
  }

  // Get active tours for this partner
  const tours = await Tour.find({
    partner: partner._id,
    status: 'active',
    'visibility.b2c': true
  })
    .select('name slug primaryLocation gallery content isFeatured displayOrder')
    .sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 })
    .limit(12)
    .lean()

  const list = tours.map(t => ({
    id: t._id,
    name: t.name?.tr || t.name?.en || '',
    slug: t.slug,
    city: t.primaryLocation?.name,
    image: t.gallery?.[0]?.url,
    description: t.content?.shortDescription?.tr || t.content?.shortDescription?.en || '',
    featured: t.isFeatured
  }))

  res.json({
    status: true,
    list
  })
})

/**
 * GET /storefronts/tour/:tourId
 * Tour details
 */
export const getTourDetails = asyncHandler(async (req, res) => {
  const partner = await resolvePartnerFromReferer(req)

  if (!partner) {
    return res.json({ status: false, msg: 'Partner not found' })
  }

  const { tourId } = req.params

  // Try to find by ID or slug (public-safe projection)
  let tour = null
  const isObjectId = /^[a-f\d]{24}$/i.test(tourId)

  if (isObjectId) {
    tour = await Tour.findOne({
      _id: tourId,
      partner: partner._id,
      status: 'active',
      'visibility.b2c': true
    })
      .select(
        'code name slug type tags primaryLocation basePricing content routePlan gallery isFeatured displayOrder createdAt updatedAt'
      )
      .lean()
  }

  if (!tour) {
    tour = await Tour.findOne({
      slug: tourId,
      partner: partner._id,
      status: 'active',
      'visibility.b2c': true
    })
      .select(
        'code name slug type tags primaryLocation basePricing content routePlan gallery isFeatured displayOrder createdAt updatedAt'
      )
      .lean()
  }

  if (!tour) {
    return res.json({ status: false, msg: 'Tour not found' })
  }

  res.json({
    status: true,
    record: {
      id: tour._id,
      code: tour.code,
      name: tour.name,
      slug: tour.slug,
      type: tour.type,
      tags: tour.tags || [],
      primaryLocation: tour.primaryLocation,
      basePricing: tour.basePricing,
      content: tour.content,
      routePlan: tour.routePlan,
      gallery: tour.gallery || [],
      featured: Boolean(tour.isFeatured),
      displayOrder: tour.displayOrder
    }
  })
})

/**
 * GET /storefronts/tourlocation/:searchterm
 * Tour search by location
 */
export const getToursByLocation = asyncHandler(async (req, res) => {
  const partner = await resolvePartnerFromReferer(req)

  if (!partner) {
    return res.json({ status: false, msg: 'Partner not found' })
  }

  const { searchterm } = req.params
  const searchTerm = decodeURIComponent(searchterm || '').trim()

  if (!searchTerm) {
    return res.json({ status: false, msg: 'Search term required' })
  }

  // Search tours by location or name
  const tours = await Tour.find({
    partner: partner._id,
    status: 'active',
    'visibility.b2c': true,
    $or: [
      { 'primaryLocation.name': new RegExp(escapeRegExp(searchTerm), 'i') },
      { 'name.tr': new RegExp(escapeRegExp(searchTerm), 'i') },
      { 'name.en': new RegExp(escapeRegExp(searchTerm), 'i') },
      { tags: new RegExp(escapeRegExp(searchTerm), 'i') }
    ]
  })
    .select('name slug primaryLocation gallery content tags')
    .sort({ isFeatured: -1, displayOrder: 1 })
    .lean()

  res.json({
    status: true,
    tours: tours.map(t => ({
      id: t._id,
      name: t.name?.tr || t.name?.en || '',
      slug: t.slug,
      city: t.primaryLocation?.name,
      image: t.gallery?.[0]?.url,
      description: t.content?.shortDescription?.tr || t.content?.shortDescription?.en || '',
      tags: t.tags
    })),
    searchTerm,
    count: tours.length
  })
})
