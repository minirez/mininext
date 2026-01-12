/**
 * PMS Queue Service
 * BullMQ producer for PMS provisioning jobs
 * Sends hotel and user creation requests to standalone PMS system
 */

import { Queue } from 'bullmq'
import { getRedisClient, isRedisConnected } from '#core/redis.js'
import logger from '#core/logger.js'
import crypto from 'crypto'
import config from '#config'

const QUEUE_NAME = 'pms:provisioning'

// Job types
export const PMS_JOB_TYPES = {
  CREATE_HOTEL: 'create_hotel',
  CREATE_USER: 'create_user',
  SYNC_HOTEL: 'sync_hotel'
}

let queue = null

/**
 * Initialize PMS provisioning queue
 * @returns {Promise<Queue|null>} Queue instance or null if Redis not available
 */
export async function initPmsQueue() {
  if (!config.pms?.queueEnabled) {
    logger.info('PMS queue is disabled in config')
    return null
  }

  if (!isRedisConnected()) {
    logger.warn('Redis not available, PMS queue disabled')
    return null
  }

  try {
    const redis = getRedisClient()

    // BullMQ requires a connection without keyPrefix
    // Create a new connection config for BullMQ
    queue = new Queue(QUEUE_NAME, {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db || 0
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000 // 5s, 10s, 20s
        },
        removeOnComplete: {
          age: 24 * 3600, // 24 hours
          count: 1000
        },
        removeOnFail: {
          age: 7 * 24 * 3600 // 7 days for debugging
        }
      }
    })

    logger.info('PMS provisioning queue initialized')
    return queue
  } catch (error) {
    logger.error('Failed to initialize PMS queue:', error.message)
    return null
  }
}

/**
 * Generate HMAC signature for payload
 * @param {Object} payload - Job payload
 * @param {number} timestamp - Unix timestamp
 * @param {string} sharedSecret - Shared secret for signing
 * @returns {string} HMAC-SHA256 signature
 */
function generateSignature(payload, timestamp, sharedSecret) {
  const data = JSON.stringify(payload) + timestamp
  return crypto.createHmac('sha256', sharedSecret).update(data).digest('hex')
}

/**
 * Generate unique idempotency key
 * @param {string} type - Job type
 * @param {string} partnerId - Partner ID
 * @param {string} entityId - Entity ID (hotel or user)
 * @returns {string} Idempotency key
 */
function generateIdempotencyKey(type, partnerId, entityId) {
  return `${type}_${partnerId}_${entityId}_${Date.now()}`
}

/**
 * Queue hotel provisioning job
 * Creates a hotel in the standalone PMS system
 *
 * @param {Object} partner - Partner document with pmsIntegration settings
 * @param {Object} hotel - Hotel document to provision
 * @returns {Promise<Object>} Job info
 */
export async function queueHotelProvisioning(partner, hotel) {
  if (!queue) {
    throw new Error('PMS queue not initialized. Call initPmsQueue() first.')
  }

  const credentials = partner.getPmsCredentials()
  if (!credentials?.sharedSecret) {
    throw new Error('PMS credentials not configured for partner')
  }

  const timestamp = Date.now()
  const idempotencyKey = generateIdempotencyKey('hotel', partner._id.toString(), hotel._id.toString())

  const payload = {
    externalId: hotel._id.toString(),
    partnerId: partner._id.toString(),
    partnerCode: partner.code,
    name: hotel.name?.tr || hotel.name?.en || hotel.name,
    code: hotel.slug?.toUpperCase() || `H-${Date.now()}`,
    email: hotel.contact?.email || partner.email,
    phone: hotel.contact?.phone || partner.phone,
    address: {
      street: hotel.address?.street || '',
      city: hotel.address?.city || '',
      country: hotel.address?.country || 'Turkey',
      postalCode: hotel.address?.postalCode || ''
    },
    timezone: 'Europe/Istanbul',
    currency: hotel.pricingSettings?.currency || partner.currency || 'TRY'
  }

  const signature = generateSignature(payload, timestamp, credentials.sharedSecret)

  const jobData = {
    type: PMS_JOB_TYPES.CREATE_HOTEL,
    idempotencyKey,
    timestamp,
    signature,
    apiKey: credentials.apiKey,
    apiUrl: credentials.apiUrl,
    data: payload
  }

  const job = await queue.add(PMS_JOB_TYPES.CREATE_HOTEL, jobData, {
    jobId: idempotencyKey // Ensures job uniqueness
  })

  logger.info(`Hotel provisioning job queued: ${job.id} for hotel ${hotel._id}`)

  return {
    jobId: job.id,
    idempotencyKey,
    hotelId: hotel._id.toString()
  }
}

/**
 * Queue user provisioning job
 * Creates an admin user in the standalone PMS system
 *
 * @param {Object} partner - Partner document with pmsIntegration settings
 * @param {Object} hotel - Hotel document the user will be assigned to
 * @param {Object} user - User document (partner admin)
 * @param {string} tempPassword - Temporary password for PMS login
 * @returns {Promise<Object>} Job info
 */
export async function queueUserProvisioning(partner, hotel, user, tempPassword) {
  if (!queue) {
    throw new Error('PMS queue not initialized. Call initPmsQueue() first.')
  }

  const credentials = partner.getPmsCredentials()
  if (!credentials?.sharedSecret) {
    throw new Error('PMS credentials not configured for partner')
  }

  const timestamp = Date.now()
  const idempotencyKey = generateIdempotencyKey('user', partner._id.toString(), user._id.toString())

  // Parse name into first/last
  const nameParts = (user.name || '').split(' ')
  const firstName = nameParts[0] || 'Admin'
  const lastName = nameParts.slice(1).join(' ') || 'User'

  const payload = {
    hotelExternalId: hotel._id.toString(),
    username: user.email,
    email: user.email,
    firstName,
    lastName,
    tempPassword,
    role: 'admin',
    department: 'management'
  }

  const signature = generateSignature(payload, timestamp, credentials.sharedSecret)

  const jobData = {
    type: PMS_JOB_TYPES.CREATE_USER,
    idempotencyKey,
    timestamp,
    signature,
    apiKey: credentials.apiKey,
    apiUrl: credentials.apiUrl,
    data: payload
  }

  const job = await queue.add(PMS_JOB_TYPES.CREATE_USER, jobData, {
    jobId: idempotencyKey
  })

  logger.info(`User provisioning job queued: ${job.id} for user ${user._id}`)

  return {
    jobId: job.id,
    idempotencyKey,
    userId: user._id.toString()
  }
}

/**
 * Get queue status
 * @returns {Promise<Object>} Queue statistics
 */
export async function getQueueStatus() {
  if (!queue) {
    return { enabled: false, status: 'not_initialized' }
  }

  try {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount()
    ])

    return {
      enabled: true,
      status: 'connected',
      counts: {
        waiting,
        active,
        completed,
        failed
      }
    }
  } catch (error) {
    logger.error('Failed to get queue status:', error.message)
    return { enabled: true, status: 'error', error: error.message }
  }
}

/**
 * Close queue connection
 */
export async function closePmsQueue() {
  if (queue) {
    try {
      await queue.close()
      logger.info('PMS queue closed')
    } catch (error) {
      logger.error('Error closing PMS queue:', error.message)
    }
    queue = null
  }
}

export default {
  initPmsQueue,
  queueHotelProvisioning,
  queueUserProvisioning,
  getQueueStatus,
  closePmsQueue,
  PMS_JOB_TYPES
}
