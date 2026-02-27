/**
 * Hotel Link Service
 * Partner-HotelBase linking operations
 */

import Hotel from './hotel.model.js'
import Market from '../planning/market.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler, escapeRegex } from '#helpers'
import logger from '#core/logger.js'
import { parsePagination } from '#services/queryBuilder.js'
import { getPartnerId, verifyHotelOwnership } from '#services/helpers.js'

/**
 * Get available base hotels for partner to link
 */
export const getAvailableBases = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { city, stars, search } = req.query
  const { page, limit, skip } = parsePagination(req.query)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  // Get base hotels that partner hasn't already linked
  const linkedBaseIds = await Hotel.find({
    partner: partnerId,
    hotelType: 'linked'
  }).distinct('hotelBase')

  // Build filter
  const filter = {
    hotelType: 'base',
    status: 'active',
    _id: { $nin: linkedBaseIds }
  }

  if (city) {
    filter['location.city'] = city
  }

  if (stars) {
    filter.stars = parseInt(stars)
  }

  if (search) {
    const escaped = escapeRegex(search)
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { 'address.city': { $regex: escaped, $options: 'i' } }
    ]
  }

  const total = await Hotel.countDocuments(filter)

  const hotels = await Hotel.find(filter)
    .populate('location.city', 'name countryCode')
    .sort({ stars: -1, name: 1 })
    .skip(skip)
    .limit(limit)
    .select('name stars type category address location images logo')

  res.json({
    success: true,
    data: {
      items: hotels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

/**
 * Link partner to a base hotel (create linked hotel)
 */
export const linkToBase = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { baseId } = req.params

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  // Verify base hotel exists
  const baseHotel = await Hotel.findOne({ _id: baseId, hotelType: 'base', status: 'active' })
  if (!baseHotel) {
    throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
  }

  // Check if partner already linked this base
  const alreadyLinked = await Hotel.isBaseAlreadyLinked(partnerId, baseId)
  if (alreadyLinked) {
    throw new BadRequestError('BASE_ALREADY_LINKED')
  }

  // Create linked hotel with partner settings
  const linkedHotel = await Hotel.create({
    hotelType: 'linked',
    partner: partnerId,
    hotelBase: baseId,
    // Copy required fields from base hotel
    name: baseHotel.name,
    slug: baseHotel.slug,
    stars: baseHotel.stars,
    address: baseHotel.address,
    location: baseHotel.location,
    // Partner settings (defaults)
    status: 'draft',
    visibility: { b2c: true, b2b: true },
    pricingSettings: {
      model: 'net',
      defaultMarkup: 20,
      defaultCommission: 15,
      currency: 'EUR',
      taxIncluded: true,
      taxRate: 10
    },
    policies: {
      useBaseDefaults: true
    },
    seo: { title: {}, description: {}, keywords: {} },
    featured: false,
    displayOrder: 0,
    createdBy: req.user._id
  })

  logger.info(`Partner ${partnerId} linked to base hotel ${baseId}`)

  // Create default market for the linked hotel
  try {
    await Market.create({
      partner: partnerId,
      hotel: linkedHotel._id,
      code: 'DEF',
      name: {
        tr: 'Varsayılan Pazar',
        en: 'Default Market'
      },
      currency: 'TRY',
      countries: [], // Empty = all countries
      isDefault: true,
      status: 'active',
      paymentTerms: {
        prepaymentRequired: true,
        prepaymentPercentage: 100
      },
      salesChannels: {
        b2c: true,
        b2b: true
      }
    })
    logger.info(`Default market created for linked hotel ${linkedHotel._id}`)
  } catch (marketError) {
    logger.warn(
      `Failed to create default market for linked hotel ${linkedHotel._id}: ${marketError.message}`
    )
  }

  // Return resolved data
  const resolvedData = await linkedHotel.resolveData()

  res.status(201).json({
    success: true,
    message: req.t('HOTEL_LINKED'),
    data: resolvedData
  })
})

/**
 * Unlink from base (convert linked hotel to partner hotel)
 * Copies base hotel data to partner hotel
 */
export const unlinkFromBase = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const hotel = await verifyHotelOwnership(id, partnerId)

  if (hotel.hotelType !== 'linked') {
    throw new BadRequestError('HOTEL_NOT_LINKED')
  }

  // Get base hotel data
  const baseHotel = await Hotel.findById(hotel.hotelBase)
  if (!baseHotel) {
    throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
  }

  // Copy base hotel data to this hotel
  hotel.name = baseHotel.name
  hotel.description = baseHotel.description
  hotel.logo = baseHotel.logo
  hotel.stars = baseHotel.stars
  hotel.type = baseHotel.type
  hotel.category = baseHotel.category
  hotel.address = baseHotel.address
  hotel.location = baseHotel.location
  hotel.contact = baseHotel.contact
  hotel.images = baseHotel.images
  hotel.amenities = baseHotel.amenities
  hotel.roomConfig = baseHotel.roomConfig
  hotel.profile = baseHotel.profile
  hotel.tags = baseHotel.tags

  // Copy policies if using base defaults
  if (hotel.policies.useBaseDefaults) {
    hotel.policies = {
      ...baseHotel.policies,
      useBaseDefaults: false
    }
  }

  // Convert to partner hotel
  hotel.hotelType = 'partner'
  hotel.hotelBase = null
  hotel.updatedBy = req.user._id

  await hotel.save()

  logger.info(`Hotel ${id} unlinked from base, converted to partner hotel`)

  res.json({
    success: true,
    message: req.t('HOTEL_UNLINKED'),
    data: hotel
  })
})

/**
 * Promote partner hotel to base hotel (SuperAdmin only)
 * Creates a new base hotel from partner hotel data
 */
export const promoteToBase = asyncHandler(async (req, res) => {
  const { id } = req.params

  const hotel = await Hotel.findById(id)
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  if (hotel.hotelType !== 'partner') {
    throw new BadRequestError('ONLY_PARTNER_HOTELS_CAN_BE_PROMOTED')
  }

  // Create base hotel with same data
  const baseHotel = await Hotel.create({
    hotelType: 'base',
    partner: null,
    hotelBase: null,
    // Copy all hotel data
    name: hotel.name,
    description: hotel.description,
    slug: hotel.slug ? `${hotel.slug}-base` : null, // Avoid slug conflict
    logo: hotel.logo,
    stars: hotel.stars,
    type: hotel.type,
    category: hotel.category,
    status: 'active',
    address: hotel.address,
    location: hotel.location,
    contact: hotel.contact,
    images: hotel.images,
    amenities: hotel.amenities,
    policies: hotel.policies,
    roomConfig: hotel.roomConfig,
    profile: hotel.profile,
    tags: hotel.tags,
    createdBy: req.user._id
  })

  // Convert original hotel to linked
  hotel.hotelType = 'linked'
  hotel.hotelBase = baseHotel._id
  hotel.policies.useBaseDefaults = true
  hotel.updatedBy = req.user._id
  await hotel.save()

  logger.info(`Partner hotel ${id} promoted to base hotel ${baseHotel._id}`)

  res.json({
    success: true,
    message: req.t('HOTEL_PROMOTED'),
    data: {
      baseHotel,
      linkedHotel: hotel
    }
  })
})

/**
 * Get importable room templates from linked base hotel
 * For partners to import room templates as RoomTypes
 */
export const getImportableRooms = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params // Partner's hotel ID

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const hotel = await verifyHotelOwnership(id, partnerId)

  // Must be a linked hotel
  if (hotel.hotelType !== 'linked' || !hotel.hotelBase) {
    throw new BadRequestError('HOTEL_NOT_LINKED')
  }

  // Get base hotel with room templates
  const baseHotel = await Hotel.findById(hotel.hotelBase).select('name roomTemplates')
  if (!baseHotel) {
    throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
  }

  res.json({
    success: true,
    data: {
      baseHotel: {
        _id: baseHotel._id,
        name: baseHotel.name
      },
      roomTemplates: baseHotel.roomTemplates || []
    }
  })
})
