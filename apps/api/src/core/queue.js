/**
 * @module core/queue
 * @description BullMQ Queue Manager
 * Provides job queue infrastructure with Redis backend.
 * Falls back gracefully when Redis is not available (jobs run inline).
 *
 * Usage:
 *   import { getQueue, addJob, registerWorker } from '#core/queue.js'
 *
 *   // Add a job
 *   await addJob('email', 'send-booking-confirmation', { bookingId, email })
 *
 *   // Register a worker (in workers/ directory)
 *   registerWorker('email', async (job) => { ... })
 */

import { Queue, Worker } from 'bullmq'
import { getRedisClient } from './redis.js'
import logger from './logger.js'

/** @type {Map<string, Queue>} Active queues */
const queues = new Map()

/** @type {Map<string, Worker>} Active workers */
const workers = new Map()

/** @type {Map<string, Function>} Fallback handlers for when Redis is unavailable */
const fallbackHandlers = new Map()

/**
 * Default job options
 * @constant {Object}
 */
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  removeOnComplete: {
    age: 24 * 60 * 60, // 24 hours
    count: 1000
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60 // 7 days
  }
}

/**
 * Get Redis connection config for BullMQ
 * @private
 * @returns {Object|null}
 */
function getRedisConnection() {
  const client = getRedisClient()
  if (!client) return null

  // BullMQ needs raw connection options, not the ioredis client
  return {
    host: client.options?.host || 'localhost',
    port: client.options?.port || 6379,
    password: client.options?.password || undefined,
    db: client.options?.db || 0
  }
}

/**
 * Get or create a queue
 * @param {string} name - Queue name (e.g., 'email', 'sync', 'exchange')
 * @returns {Queue|null} BullMQ Queue or null if Redis unavailable
 */
export function getQueue(name) {
  if (queues.has(name)) return queues.get(name)

  const connection = getRedisConnection()
  if (!connection) return null

  const queue = new Queue(name, {
    connection,
    defaultJobOptions: DEFAULT_JOB_OPTIONS
  })

  queues.set(name, queue)
  logger.info(`Queue created: ${name}`)
  return queue
}

/**
 * Add a job to a queue
 * If Redis is not available, executes the fallback handler inline
 *
 * @param {string} queueName - Queue name
 * @param {string} jobName - Job name (e.g., 'send-booking-confirmation')
 * @param {Object} data - Job data
 * @param {Object} [options] - Job-specific options (overrides defaults)
 * @returns {Promise<Object|null>} Job object or null
 */
export async function addJob(queueName, jobName, data, options = {}) {
  const queue = getQueue(queueName)

  if (queue) {
    try {
      const job = await queue.add(jobName, data, { ...DEFAULT_JOB_OPTIONS, ...options })
      logger.debug(`Job added: ${queueName}/${jobName} (id: ${job.id})`)
      return job
    } catch (error) {
      logger.error(`Failed to add job ${queueName}/${jobName}:`, error.message)
    }
  }

  // Fallback: execute inline if Redis is unavailable
  const handler = fallbackHandlers.get(queueName)
  if (handler) {
    try {
      await handler({ name: jobName, data, id: `inline-${Date.now()}` })
      logger.debug(`Job executed inline (no Redis): ${queueName}/${jobName}`)
    } catch (error) {
      logger.error(`Inline job failed ${queueName}/${jobName}:`, error.message)
    }
  }

  return null
}

/**
 * Register a worker for a queue
 * @param {string} queueName - Queue name
 * @param {Function} processor - Async function (job) => { ... }
 * @param {Object} [options] - Worker options
 * @returns {Worker|null} BullMQ Worker or null
 */
export function registerWorker(queueName, processor, options = {}) {
  // Always register as fallback handler
  fallbackHandlers.set(queueName, processor)

  const connection = getRedisConnection()
  if (!connection) {
    logger.info(`Worker registered (inline mode, no Redis): ${queueName}`)
    return null
  }

  if (workers.has(queueName)) {
    logger.warn(`Worker already registered for queue: ${queueName}`)
    return workers.get(queueName)
  }

  const worker = new Worker(queueName, processor, {
    connection,
    concurrency: options.concurrency || 5,
    limiter: options.limiter || undefined
  })

  worker.on('completed', job => {
    logger.debug(`Job completed: ${queueName}/${job.name} (id: ${job.id})`)
  })

  worker.on('failed', (job, error) => {
    logger.error(`Job failed: ${queueName}/${job?.name} (id: ${job?.id}): ${error.message}`)
  })

  worker.on('error', error => {
    logger.error(`Worker error (${queueName}): ${error.message}`)
  })

  workers.set(queueName, worker)
  logger.info(`Worker started: ${queueName} (concurrency: ${options.concurrency || 5})`)
  return worker
}

/**
 * Add a repeatable/scheduled job
 * @param {string} queueName - Queue name
 * @param {string} jobName - Job name
 * @param {Object} data - Job data
 * @param {Object} repeat - Repeat config (pattern: cron string) or (every: ms interval)
 * @returns {Promise<Object|null>}
 */
export async function addScheduledJob(queueName, jobName, data, repeat) {
  const queue = getQueue(queueName)
  if (!queue) {
    logger.warn(`Cannot add scheduled job ${queueName}/${jobName}: Redis unavailable`)
    return null
  }

  try {
    const job = await queue.add(jobName, data, {
      ...DEFAULT_JOB_OPTIONS,
      repeat
    })
    logger.info(`Scheduled job added: ${queueName}/${jobName} (repeat: ${JSON.stringify(repeat)})`)
    return job
  } catch (error) {
    logger.error(`Failed to add scheduled job ${queueName}/${jobName}:`, error.message)
    return null
  }
}

/**
 * Get queue stats
 * @param {string} queueName - Queue name
 * @returns {Promise<Object>} Queue statistics
 */
export async function getQueueStats(queueName) {
  const queue = getQueue(queueName)
  if (!queue) return { available: false, queueName }

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ])

    return {
      available: true,
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed
    }
  } catch (error) {
    return { available: false, queueName, error: error.message }
  }
}

/**
 * Close all queues and workers gracefully
 */
export async function closeQueues() {
  const closePromises = []

  for (const [name, worker] of workers) {
    closePromises.push(worker.close().then(() => logger.info(`Worker closed: ${name}`)))
  }

  for (const [name, queue] of queues) {
    closePromises.push(queue.close().then(() => logger.info(`Queue closed: ${name}`)))
  }

  await Promise.allSettled(closePromises)
  workers.clear()
  queues.clear()
}

export default {
  getQueue,
  addJob,
  registerWorker,
  addScheduledJob,
  getQueueStats,
  closeQueues
}
