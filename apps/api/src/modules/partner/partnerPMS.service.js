import Partner from './partner.model.js'
import User from '../user/user.model.js'
import Hotel from '../hotel/hotel.model.js'
import { NotFoundError, ConflictError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { queueHotelProvisioning, queueUserProvisioning, getQueueStatus } from '#services/pmsQueueService.js'
import crypto from 'crypto'
import logger from '#core/logger.js'

/**
 * Activate PMS for a partner
 * - Generates API credentials
 * - Queues hotel provisioning jobs for all partner hotels
 * - Queues admin user provisioning job
 */
export const activatePms = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Check if PMS is already activated
  if (partner.pmsIntegration?.enabled && partner.pmsIntegration?.provisioningStatus === 'completed') {
    throw new ConflictError('PMS_ALREADY_ACTIVATED')
  }

  // Check queue status
  const queueStatus = await getQueueStatus()
  if (!queueStatus.enabled) {
    throw new BadRequestError('PMS_QUEUE_NOT_AVAILABLE')
  }

  // Get optional PMS domain from request
  const { pmsDomain } = req.body

  // Generate PMS credentials if not already generated
  if (!partner.pmsIntegration?.apiSettings?.apiKey) {
    partner.generatePmsCredentials()
  }

  // Update PMS integration settings
  partner.pmsIntegration.enabled = true
  partner.pmsIntegration.provisioningStatus = 'pending'
  if (pmsDomain) {
    partner.pmsIntegration.pmsDomain = pmsDomain
  }

  await partner.save()

  // Get all active hotels for this partner
  const hotels = await Hotel.find({ partner: partner._id, status: 'active' })

  if (hotels.length === 0) {
    throw new BadRequestError('NO_HOTELS_TO_PROVISION')
  }

  // Get partner admin user
  const adminUser = await User.findOne({
    accountType: 'partner',
    accountId: partner._id,
    role: 'admin',
    status: 'active'
  })

  if (!adminUser) {
    throw new NotFoundError('PARTNER_ADMIN_USER_NOT_FOUND')
  }

  // Generate temporary password for PMS user
  const tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 16)

  // Queue provisioning jobs
  const jobResults = {
    hotels: [],
    user: null
  }

  try {
    // Queue hotel provisioning jobs
    for (const hotel of hotels) {
      // Skip already provisioned hotels
      if (partner.isHotelProvisioned(hotel._id)) {
        logger.info(`Hotel ${hotel._id} already provisioned, skipping`)
        continue
      }

      const jobInfo = await queueHotelProvisioning(partner, hotel)
      jobResults.hotels.push({
        hotelId: hotel._id,
        hotelName: hotel.name?.tr || hotel.name?.en || hotel.name,
        jobId: jobInfo.jobId
      })

      // Track provisioned hotel
      partner.pmsIntegration.provisionedHotels.push({
        hotelId: hotel._id,
        status: 'pending',
        provisionedAt: new Date()
      })
    }

    // Queue user provisioning for the first hotel
    if (hotels.length > 0) {
      const primaryHotel = hotels[0]
      const userJobInfo = await queueUserProvisioning(partner, primaryHotel, adminUser, tempPassword)
      jobResults.user = {
        userId: adminUser._id,
        email: adminUser.email,
        jobId: userJobInfo.jobId,
        tempPassword // Only returned once - should be sent via email
      }
    }

    await partner.save()

    logger.info(`PMS activation initiated for partner ${partner._id}: ${jobResults.hotels.length} hotels, 1 user`)

    res.json({
      success: true,
      message: req.t ? req.t('PMS_ACTIVATION_INITIATED') : 'PMS activation initiated',
      data: {
        partnerId: partner._id,
        status: partner.pmsIntegration.provisioningStatus,
        queuedJobs: {
          hotels: jobResults.hotels.length,
          users: jobResults.user ? 1 : 0
        },
        tempPassword: jobResults.user?.tempPassword,
        pmsDomain: partner.pmsIntegration.pmsDomain
      }
    })
  } catch (error) {
    // Update status on failure
    partner.pmsIntegration.provisioningStatus = 'failed'
    partner.pmsIntegration.lastError = {
      message: error.message,
      timestamp: new Date()
    }
    await partner.save()

    logger.error(`PMS activation failed for partner ${partner._id}: ${error.message}`)
    throw new BadRequestError(error.message || 'PMS_ACTIVATION_FAILED')
  }
})

/**
 * Get PMS integration status for a partner
 */
export const getPmsStatus = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const pmsIntegration = partner.pmsIntegration || {}

  // Get queue status
  const queueStatus = await getQueueStatus()

  // Get provisioned hotels details
  const provisionedHotels = []
  if (pmsIntegration.provisionedHotels?.length > 0) {
    const hotelIds = pmsIntegration.provisionedHotels.map(h => h.hotelId)
    const hotels = await Hotel.find({ _id: { $in: hotelIds } }).select('name slug').lean()
    const hotelMap = new Map(hotels.map(h => [h._id.toString(), h]))

    for (const ph of pmsIntegration.provisionedHotels) {
      const hotel = hotelMap.get(ph.hotelId.toString())
      provisionedHotels.push({
        hotelId: ph.hotelId,
        hotelName: hotel?.name?.tr || hotel?.name?.en || 'Unknown',
        pmsHotelId: ph.pmsHotelId,
        status: ph.status,
        provisionedAt: ph.provisionedAt,
        lastError: ph.lastError
      })
    }
  }

  res.json({
    success: true,
    data: {
      enabled: pmsIntegration.enabled || false,
      pmsDomain: pmsIntegration.pmsDomain,
      provisioningStatus: pmsIntegration.provisioningStatus || 'none',
      provisionedHotels,
      lastSyncAt: pmsIntegration.lastSyncAt,
      lastError: pmsIntegration.lastError,
      queueStatus: {
        enabled: queueStatus.enabled,
        status: queueStatus.status
      }
    }
  })
})
