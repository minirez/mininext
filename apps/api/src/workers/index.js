/**
 * @module workers
 * @description Register all queue workers
 * Called during server startup to initialize job processors
 */

import { registerWorker, addScheduledJob } from '#core/queue.js'
import logger from '#core/logger.js'
import { isRedisConnected } from '#core/redis.js'

/**
 * Initialize all workers and scheduled jobs
 * Call this after Redis is connected
 */
export async function initWorkers() {
  if (!isRedisConnected()) {
    logger.info('Redis not available - workers will run in inline fallback mode')
  }

  // Email worker - handles all email sending
  registerWorker(
    'email',
    async job => {
      const { sendEmail } = await import('#services/emailService.js')
      const { to, subject, template, data } = job.data

      await sendEmail({ to, subject, template, data })
      logger.debug(`Email sent: ${template} → ${to}`)
    },
    { concurrency: 3 }
  )

  // Exchange rate worker - fetches TCMB rates
  registerWorker(
    'exchange',
    async job => {
      const { fetchAndUpdateRates } = await import('#services/exchangeScheduler.js')
      await fetchAndUpdateRates()
    },
    { concurrency: 1 }
  )

  // Channel sync worker - processes channel manager sync queue
  registerWorker(
    'channel-sync',
    async job => {
      const { processSyncQueue } = await import('#modules/channel-manager/channelScheduler.js')
      await processSyncQueue()
    },
    { concurrency: 1 }
  )

  // Set up scheduled/repeatable jobs (only with Redis)
  if (isRedisConnected()) {
    // Exchange rates: every 5 minutes during business hours
    await addScheduledJob(
      'exchange',
      'fetch-rates',
      {},
      {
        pattern: '*/5 9-17 * * 1-5', // Every 5 min, 9-17, Mon-Fri (Turkey time)
        tz: 'Europe/Istanbul'
      }
    )

    // Channel sync: every 10 minutes
    await addScheduledJob(
      'channel-sync',
      'poll-reservations',
      {},
      {
        every: 10 * 60 * 1000 // 10 minutes
      }
    )

    logger.info('Scheduled jobs registered (Redis-backed)')
  }

  logger.info('Workers initialized')
}
