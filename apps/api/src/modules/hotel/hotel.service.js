/**
 * Hotel Service
 * Partner hotel CRUD operations
 *
 * Other hotel operations are in separate files:
 * - hotelImage.service.js - Image/logo operations
 * - hotelBase.service.js - SuperAdmin base hotel operations
 * - hotelLink.service.js - Partner-base linking
 * - hotelAi.service.js - AI extraction
 * - roomTemplate.service.js - Room template operations
 */

import Hotel from './hotel.model.js'
import Partner from '../partner/partner.model.js'
import Market from '../planning/market.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { deleteHotelFile } from '#helpers/hotelUpload.js'
import logger from '#core/logger.js'
import { getPartnerId, verifyHotelOwnership } from '#services/helpers.js'

// Re-export from other service files for backwards compatibility
export * from './hotelImage.service.js'
export * from './hotelBase.service.js'
export * from './hotelLink.service.js'
export * from './hotelAi.service.js'
export * from './roomTemplate.service.js'

/**
 * Get all hotels for partner
 */
export const getHotels = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const { status, stars, city, search, page = 1, limit = 20 } = req.query

  // Build filter
  const filter = { partner: partnerId }

  if (status) {
    filter.status = status
  }

  if (stars) {
    filter.stars = parseInt(stars)
  }

  if (city) {
    filter['address.city'] = { $regex: city, $options: 'i' }
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
    .sort({ displayOrder: 1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('-__v')

  res.json({
    success: true,
    data: {
      items: hotels,
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
 * Get single hotel
 * For linked hotels, returns resolved data (base + partner settings)
 */
export const getHotel = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params
  const { resolve = 'true' } = req.query // Whether to resolve linked hotel data

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const hotel = await verifyHotelOwnership(id, partnerId)

  // For linked hotels, resolve data from base hotel if requested
  let hotelData = hotel
  if (hotel.hotelType === 'linked' && resolve === 'true') {
    hotelData = await hotel.resolveData()
  }

  res.json({
    success: true,
    data: hotelData
  })
})

/**
 * Create hotel
 * Creates a partner-type hotel (partner's own hotel)
 */
export const createHotel = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  // Verify partner exists
  const partner = await Partner.findById(partnerId)
  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const hotel = await Hotel.create({
    ...req.body,
    partner: partnerId,
    hotelType: 'partner', // Partner's own hotel
    hotelBase: null,
    createdBy: req.user._id
  })

  logger.info(`Hotel created: ${hotel.name} by partner ${partnerId}`)

  // Create default market for the hotel
  try {
    await Market.create({
      partner: partnerId,
      hotel: hotel._id,
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
    logger.info(`Default market created for hotel ${hotel._id}`)
  } catch (marketError) {
    logger.warn(`Failed to create default market for hotel ${hotel._id}: ${marketError.message}`)
  }

  res.status(201).json({
    success: true,
    message: req.t('HOTEL_CREATED'),
    data: hotel
  })
})

/**
 * Update hotel
 * For linked hotels, only partner settings can be updated (not hotel data)
 */
export const updateHotel = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const hotel = await verifyHotelOwnership(id, partnerId)

  // Fields that can be updated depend on hotel type
  let allowedFields

  if (hotel.hotelType === 'linked') {
    // Linked hotels: only partner settings can be updated
    // Hotel data (name, description, etc.) comes from base hotel
    allowedFields = [
      'status',
      'visibility',
      'pricingSettings',
      'seo',
      'policies', // Only useBaseDefaults and overrides
      'featured',
      'displayOrder'
    ]
  } else {
    // Partner hotels: all fields can be updated
    allowedFields = [
      'name',
      'description',
      'slug',
      'logo',
      'stars',
      'type',
      'category',
      'visibility',
      'address',
      'location',
      'contact',
      'amenities',
      'policies',
      'roomConfig',
      'pricingSettings',
      'seo',
      'profile',
      'tags',
      'featured',
      'displayOrder',
      'childAgeGroups'
    ]
  }

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
        // Merge objects
        hotel[field] = { ...(hotel[field]?.toObject?.() || hotel[field]), ...req.body[field] }
      } else {
        hotel[field] = req.body[field]
      }
    }
  })

  hotel.updatedBy = req.user._id
  await hotel.save()

  logger.info(`Hotel updated: ${hotel._id}`)

  res.json({
    success: true,
    message: req.t('HOTEL_UPDATED'),
    data: hotel
  })
})

/**
 * Delete hotel
 */
export const deleteHotel = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const hotel = await verifyHotelOwnership(id, partnerId)

  // TODO: Check if hotel has active bookings before deleting

  // Delete all hotel images from disk
  if (hotel.images && hotel.images.length > 0) {
    hotel.images.forEach(image => {
      try {
        const filename = image.url.split('/').pop()
        deleteHotelFile(partnerId, hotel._id, filename)
      } catch (err) {
        logger.warn(`Failed to delete hotel image: ${err.message}`)
      }
    })
  }

  await hotel.deleteOne()

  logger.info(`Hotel deleted: ${id}`)

  res.json({
    success: true,
    message: req.t('HOTEL_DELETED')
  })
})

/**
 * Update hotel status
 */
export const updateHotelStatus = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params
  const { status } = req.body

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  if (!['draft', 'active', 'inactive'].includes(status)) {
    throw new BadRequestError('INVALID_STATUS')
  }

  const hotel = await verifyHotelOwnership(id, partnerId)

  hotel.status = status
  await hotel.save()

  const messageKey =
    status === 'active'
      ? 'HOTEL_ACTIVATED'
      : status === 'inactive'
        ? 'HOTEL_DEACTIVATED'
        : 'HOTEL_STATUS_UPDATED'

  res.json({
    success: true,
    message: req.t(messageKey),
    data: hotel
  })
})

/**
 * Get cities with hotel count (for filtering)
 */
export const getHotelCities = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const cities = await Hotel.aggregate([
    { $match: { partner: partnerId } },
    {
      $group: {
        _id: '$address.city',
        count: { $sum: 1 }
      }
    },
    { $match: { _id: { $ne: null } } },
    { $sort: { count: -1 } }
  ])

  res.json({
    success: true,
    data: cities.map(c => ({
      city: c._id,
      count: c.count
    }))
  })
})

// ===== PMS Integration Endpoints =====

/**
 * Get hotel PMS status
 * Returns whether hotel is provisioned to PMS and its status
 */
export const getHotelPmsStatus = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  // Verify hotel ownership
  await verifyHotelOwnership(id, partnerId)

  // Get partner with PMS integration data
  const partner = await Partner.findById(partnerId)
  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Find hotel in provisioned hotels list
  const provisionedHotel = partner.pmsIntegration?.provisionedHotels?.find(
    h => h.hotelId?.toString() === id
  )

  res.json({
    success: true,
    data: {
      pmsStatus: provisionedHotel
        ? {
            status: provisionedHotel.status,
            pmsHotelId: provisionedHotel.pmsHotelId,
            provisionedAt: provisionedHotel.provisionedAt
          }
        : null,
      pmsEnabled: partner.pmsIntegration?.enabled || false
    }
  })
})

/**
 * Provision hotel to PMS
 * Queues hotel provisioning job and returns temporary credentials
 */
export const provisionHotelToPms = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  // Verify hotel ownership
  const hotel = await verifyHotelOwnership(id, partnerId)

  // Get partner
  const partner = await Partner.findById(partnerId)
  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Check if PMS integration is enabled for partner (using subscription-aware method)
  if (!partner.isPmsEnabled()) {
    throw new BadRequestError('PMS_NOT_ENABLED')
  }

  // Check if partner can provision more hotels (limit check)
  if (!partner.canProvisionMoreHotels()) {
    throw new BadRequestError('PMS_HOTEL_LIMIT_REACHED')
  }

  // Check if already provisioned
  const existingProvisioning = partner.pmsIntegration?.provisionedHotels?.find(
    h => h.hotelId?.toString() === id
  )
  if (existingProvisioning?.status === 'active') {
    throw new BadRequestError('HOTEL_ALREADY_PROVISIONED')
  }

  // Import queue service dynamically to avoid circular dependencies
  const { queueHotelProvisioning, queueUserProvisioning } = await import('#services/pmsQueueService.js')

  // Generate temporary password for PMS admin user
  const crypto = await import('crypto')
  const tempPassword = crypto.randomBytes(8).toString('hex')

  try {
    // Queue hotel provisioning
    const hotelJob = await queueHotelProvisioning(partner, hotel)

    // Queue admin user provisioning (use partner admin)
    const adminUser = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
    const userJob = await queueUserProvisioning(partner, hotel, adminUser, tempPassword)

    // Update partner's provisioned hotels
    await partner.updateHotelProvisionStatus(id, {
      status: 'pending',
      provisionedAt: new Date()
    })
    await partner.save()

    logger.info(`Hotel ${id} provisioning started for partner ${partnerId}`)

    res.json({
      success: true,
      message: req.t('HOTEL_PROVISIONING_STARTED'),
      data: {
        hotelJobId: hotelJob.jobId,
        userJobId: userJob.jobId,
        username: req.user.email,
        tempPassword
      }
    })
  } catch (error) {
    logger.error(`Hotel provisioning failed: ${error.message}`)
    throw new BadRequestError('PROVISIONING_FAILED')
  }
})
