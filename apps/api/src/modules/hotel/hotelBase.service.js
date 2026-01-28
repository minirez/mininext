/**
 * Hotel Base Service
 * SuperAdmin operations for base hotels (hotel catalog)
 */

import Hotel from './hotel.model.js'
import City from '../location/city.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import {
  downloadHotelImages,
  downloadHotelLogo,
  downloadRoomTemplateImages
} from '#helpers/imageDownloader.js'
import logger from '#core/logger.js'

/**
 * Get all base hotels (SuperAdmin only)
 */
export const getBaseHotels = asyncHandler(async (req, res) => {
  const { status, stars, city, search, page = 1, limit = 20 } = req.query

  // Build filter
  const filter = { hotelType: 'base' }

  if (status) {
    filter.status = status
  }

  if (stars) {
    filter.stars = parseInt(stars)
  }

  if (city) {
    filter['location.city'] = city
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } }
    ]
  }

  const skip = (parseInt(page) - 1) * parseInt(limit)
  const total = await Hotel.countDocuments(filter)

  const hotels = await Hotel.find(filter)
    .populate('location.city', 'name countryCode')
    .sort({ stars: -1, name: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('-__v')
    .lean()

  // Get linked counts for all base hotels in one query
  const hotelIds = hotels.map(h => h._id)
  const linkedCounts = await Hotel.aggregate([
    {
      $match: {
        hotelBase: { $in: hotelIds },
        hotelType: 'linked'
      }
    },
    {
      $group: {
        _id: '$hotelBase',
        count: { $sum: 1 }
      }
    }
  ])

  // Create a map for quick lookup
  const linkedCountMap = {}
  linkedCounts.forEach(item => {
    linkedCountMap[item._id.toString()] = item.count
  })

  // Add linkedCount to each hotel
  const hotelsWithLinkedCount = hotels.map(hotel => ({
    ...hotel,
    linkedCount: linkedCountMap[hotel._id.toString()] || 0
  }))

  res.json({
    success: true,
    data: {
      items: hotelsWithLinkedCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  })
})

/**
 * Get single base hotel (SuperAdmin only)
 */
export const getBaseHotel = asyncHandler(async (req, res) => {
  const { id } = req.params

  const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
    .populate('location.city', 'name countryCode')
    .populate('location.district', 'name')
    .populate('location.tourismRegions', 'name')
    .populate('tags', 'name slug')

  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Get linked hotels count
  const linkedCount = await Hotel.countDocuments({ hotelBase: id, hotelType: 'linked' })

  res.json({
    success: true,
    data: {
      ...hotel.toObject(),
      _linkedCount: linkedCount
    }
  })
})

/**
 * Get linked partners for a base hotel (SuperAdmin only)
 */
export const getLinkedPartners = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Verify it's a base hotel
  const baseHotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
  if (!baseHotel) {
    throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
  }

  // Get all linked hotels with partner info
  const linkedHotels = await Hotel.find({ hotelBase: id, hotelType: 'linked' })
    .populate('partner', 'companyName email phone logo status')
    .select('partner status createdAt')
    .lean()

  // Format response
  const partners = linkedHotels.map(h => ({
    hotelId: h._id,
    hotelStatus: h.status,
    linkedAt: h.createdAt,
    partner: h.partner
  }))

  res.json({
    success: true,
    data: {
      baseHotel: {
        _id: baseHotel._id,
        name: baseHotel.name
      },
      partners
    }
  })
})

/**
 * Create base hotel (SuperAdmin only)
 */
export const createBaseHotel = asyncHandler(async (req, res) => {
  // Extract external image URLs before creating hotel
  const { externalImages, externalLogo, roomTemplates, ...hotelData } = req.body

  // Process room templates - extract external images for later processing
  const roomTemplatesWithExternalImages = []
  const processedRoomTemplates = (roomTemplates || []).map(rt => {
    if (rt.externalImages?.length) {
      roomTemplatesWithExternalImages.push({
        code: rt.code,
        externalImages: rt.externalImages
      })
    }
    // Remove externalImages from the template data before saving
    const { externalImages: _, ...templateData } = rt
    return {
      ...templateData,
      images: [] // Start with empty, will populate after download
    }
  })

  // Resolve hierarchical location from address data
  if (hotelData.address?.city && !hotelData.location?.city) {
    try {
      // Find city by name (case-insensitive, partial match)
      const cityName = hotelData.address.city.trim()
      const city = await City.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${cityName}$`, 'i') } },
          { name: { $regex: new RegExp(cityName, 'i') } }
        ]
      })

      if (city) {
        hotelData.location = hotelData.location || {}
        hotelData.location.city = city._id
        hotelData.location.countryCode = city.countryCode
        logger.info(`Resolved location: ${cityName} -> City ID ${city._id} (${city.countryCode})`)
      } else {
        logger.warn(`Could not find city in database: ${cityName}`)
      }
    } catch (err) {
      logger.error(`Error resolving location: ${err.message}`)
    }
  }

  const hotel = await Hotel.create({
    ...hotelData,
    roomTemplates: processedRoomTemplates,
    hotelType: 'base',
    status: 'active', // Base hotels are active by default for partner selection
    partner: null,
    hotelBase: null,
    createdBy: req.user._id
  })

  logger.info(`Base hotel created: ${hotel.name} by SuperAdmin ${req.user._id}`)

  let needsSave = false

  // Download external images (wait for completion so they appear immediately)
  if (externalImages?.length || externalLogo) {
    try {
      // Download logo
      if (externalLogo) {
        const logoPath = await downloadHotelLogo(externalLogo, hotel._id)
        if (logoPath) {
          hotel.logo = logoPath
          needsSave = true
        }
      }

      // Download gallery images
      if (externalImages?.length) {
        const downloadedImages = await downloadHotelImages(externalImages, hotel._id)
        if (downloadedImages.length) {
          hotel.images = downloadedImages
          needsSave = true
        }
      }

      logger.info(`Hotel images saved: logo=${!!hotel.logo}, gallery=${hotel.images?.length || 0}`)
    } catch (error) {
      logger.error(`Error downloading hotel images for ${hotel._id}: ${error.message}`)
    }
  }

  // Download room template images
  if (roomTemplatesWithExternalImages.length) {
    try {
      for (const rtData of roomTemplatesWithExternalImages) {
        const downloadedImages = await downloadRoomTemplateImages(
          rtData.externalImages,
          hotel._id.toString(),
          rtData.code
        )

        if (downloadedImages.length) {
          // Find the template in hotel.roomTemplates and update its images
          const templateIndex = hotel.roomTemplates.findIndex(t => t.code === rtData.code)
          if (templateIndex !== -1) {
            hotel.roomTemplates[templateIndex].images = downloadedImages
            needsSave = true
          }
        }
      }

      logger.info(`Room template images processed for hotel ${hotel._id}`)
    } catch (error) {
      logger.error(
        `Error downloading room template images for hotel ${hotel._id}: ${error.message}`
      )
    }
  }

  // Save if we downloaded any images
  if (needsSave) {
    await hotel.save()
    logger.info(`Hotel ${hotel._id} saved with all images`)
  }

  res.status(201).json({
    success: true,
    message: req.t('HOTEL_CREATED'),
    data: hotel
  })
})

/**
 * Update base hotel (SuperAdmin only)
 */
export const updateBaseHotel = asyncHandler(async (req, res) => {
  const { id } = req.params

  const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // All hotel data fields can be updated
  const allowedFields = [
    'name',
    'description',
    'slug',
    'logo',
    'stars',
    'type',
    'category',
    'status',
    'address',
    'location',
    'contact',
    'amenities',
    'policies',
    'roomConfig',
    'profile',
    'tags'
  ]

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      // Don't overwrite logo/images with empty values if they already exist
      if (field === 'logo' && !req.body[field] && hotel.logo) {
        return // Keep existing logo
      }
      // Special handling for location to properly set tourismRegions array
      if (field === 'location') {
        hotel.location = {
          countryCode: req.body.location.countryCode || hotel.location?.countryCode,
          city: req.body.location.city || hotel.location?.city,
          tourismRegions: req.body.location.tourismRegions || hotel.location?.tourismRegions || []
        }
        logger.info(`Location updated: ${JSON.stringify(hotel.location)}`)
      } else if (typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
        hotel[field] = { ...(hotel[field]?.toObject?.() || hotel[field]), ...req.body[field] }
      } else {
        hotel[field] = req.body[field]
      }
    }
  })

  // Don't overwrite images with empty array if they already exist
  if (
    req.body.images !== undefined &&
    Array.isArray(req.body.images) &&
    req.body.images.length === 0 &&
    hotel.images?.length
  ) {
    // Keep existing images
  } else if (req.body.images !== undefined) {
    hotel.images = req.body.images
  }

  hotel.updatedBy = req.user._id
  await hotel.save()

  logger.info(`Base hotel updated: ${hotel._id}`)

  res.json({
    success: true,
    message: req.t('HOTEL_UPDATED'),
    data: hotel
  })
})

/**
 * Delete base hotel (SuperAdmin only)
 * Cannot delete if there are linked hotels
 */
export const deleteBaseHotel = asyncHandler(async (req, res) => {
  const { id } = req.params

  const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Check for linked hotels
  const linkedCount = await Hotel.countDocuments({ hotelBase: id, hotelType: 'linked' })
  if (linkedCount > 0) {
    throw new BadRequestError('CANNOT_DELETE_BASE_WITH_LINKED_HOTELS')
  }

  // Delete images from disk (base hotels don't have partner folder)
  // TODO: Implement base hotel image storage

  await hotel.deleteOne()

  logger.info(`Base hotel deleted: ${id}`)

  res.json({
    success: true,
    message: req.t('HOTEL_DELETED')
  })
})
