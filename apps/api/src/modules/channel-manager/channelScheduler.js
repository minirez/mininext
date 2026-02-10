/**
 * Channel Manager Scheduler
 * Periodically polls active connections for new reservations
 */

import logger from '#core/logger.js'
import ChannelConnection from './channelConnection.model.js'
import { processReservations } from './reservationSync.service.js'
import { processPendingSync } from './syncQueueProcessor.js'

const DEFAULT_INTERVAL = 10 * 60 * 1000 // 10 minutes
const SYNC_QUEUE_INTERVAL = 60 * 1000 // 60 seconds

let schedulerInterval = null
let syncQueueInterval = null
let isRunning = false
let isProcessing = false

/**
 * Poll all active connections for new reservations
 */
async function pollConnections() {
  if (isProcessing) {
    logger.debug('Channel scheduler: previous poll still running, skipping')
    return
  }

  isProcessing = true

  try {
    const connections = await ChannelConnection.find({ status: 'active' })

    if (connections.length === 0) {
      return
    }

    logger.info(`Channel scheduler: polling ${connections.length} active connection(s)`)

    for (const connection of connections) {
      try {
        const results = await processReservations(connection)
        if (results.created > 0 || results.cancelled > 0 || results.modified > 0) {
          logger.info(
            `Channel sync [${connection.hotel}]: ${results.created} created, ${results.cancelled} cancelled, ${results.modified} modified`
          )
        }
      } catch (err) {
        logger.error(`Channel sync error [${connection.hotel}]:`, err.message)
      }
    }
  } catch (err) {
    logger.error('Channel scheduler poll error:', err.message)
  } finally {
    isProcessing = false
  }
}

/**
 * Start the channel scheduler
 */
export function startChannelScheduler() {
  if (isRunning) return

  logger.info('Channel scheduler started', {
    interval: `${DEFAULT_INTERVAL / 60000} minutes`
  })

  // Don't poll immediately on start - let the system stabilize
  schedulerInterval = setInterval(pollConnections, DEFAULT_INTERVAL)

  // Start sync queue processor (60s interval)
  syncQueueInterval = setInterval(processPendingSync, SYNC_QUEUE_INTERVAL)
  logger.info('Sync queue processor started', { interval: `${SYNC_QUEUE_INTERVAL / 1000}s` })

  isRunning = true
}

/**
 * Stop the channel scheduler
 */
export function stopChannelScheduler() {
  if (!isRunning) return

  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }

  if (syncQueueInterval) {
    clearInterval(syncQueueInterval)
    syncQueueInterval = null
  }

  isRunning = false
  logger.info('Channel scheduler stopped')
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    isRunning,
    isProcessing,
    intervalMinutes: DEFAULT_INTERVAL / 60000
  }
}

/**
 * Force poll (bypass interval)
 */
export async function forcePoll() {
  await pollConnections()
}

export default {
  start: startChannelScheduler,
  stop: stopChannelScheduler,
  getStatus: getSchedulerStatus,
  forcePoll
}
