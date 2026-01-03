/**
 * Exchange Rate Scheduler
 * Fetches rates from TCMB every 5 minutes between 09:00-17:00 (Turkey time)
 */

import Exchange from '../models/exchange.model.js'
import logger from '../core/logger.js'

// Configuration
const CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds
const WORKING_HOURS_START = 9 // 09:00
const WORKING_HOURS_END = 17 // 17:00
const TIMEZONE_OFFSET = 3 // Turkey is UTC+3

let schedulerInterval = null
let isRunning = false

/**
 * Get current hour in Turkey timezone
 */
function getTurkeyHour() {
  const now = new Date()
  const utcHour = now.getUTCHours()
  const turkeyHour = (utcHour + TIMEZONE_OFFSET) % 24
  return turkeyHour
}

/**
 * Check if current time is within working hours
 */
function isWithinWorkingHours() {
  const turkeyHour = getTurkeyHour()
  const day = new Date().getDay()

  // Skip weekends (Saturday = 6, Sunday = 0)
  if (day === 0 || day === 6) {
    return false
  }

  return turkeyHour >= WORKING_HOURS_START && turkeyHour < WORKING_HOURS_END
}

/**
 * Fetch exchange rates if within working hours
 */
async function fetchRatesIfNeeded() {
  if (!isWithinWorkingHours()) {
    return null
  }

  try {
    const result = await Exchange.retrieve()
    logger.info('Exchange rates updated from TCMB')
    return result
  } catch (error) {
    logger.error('Exchange rate fetch failed', { error: error.message })
    return null
  }
}

/**
 * Start the scheduler
 */
export function startExchangeScheduler() {
  if (isRunning) {
    return
  }

  logger.info('Exchange scheduler started', {
    interval: `${CHECK_INTERVAL / 60000} minutes`,
    workingHours: `${WORKING_HOURS_START}:00-${WORKING_HOURS_END}:00 (Turkey)`
  })

  // Fetch immediately on start
  fetchRatesIfNeeded()

  // Set up interval
  schedulerInterval = setInterval(fetchRatesIfNeeded, CHECK_INTERVAL)
  isRunning = true
}

/**
 * Stop the scheduler
 */
export function stopExchangeScheduler() {
  if (!isRunning) {
    return
  }

  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }

  isRunning = false
  logger.info('Exchange scheduler stopped')
}

/**
 * Force fetch rates (bypass time check)
 */
export async function forceFetchRates() {
  try {
    const result = await Exchange.retrieve()
    logger.info('Exchange rates force-fetched from TCMB')
    return result
  } catch (error) {
    logger.error('Exchange rate force-fetch failed', { error: error.message })
    throw error
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    isRunning,
    checkInterval: CHECK_INTERVAL / 60000, // in minutes
    workingHours: {
      start: WORKING_HOURS_START,
      end: WORKING_HOURS_END,
      timezone: 'UTC+3 (Turkey)'
    },
    isWithinWorkingHours: isWithinWorkingHours(),
    currentTurkeyHour: getTurkeyHour()
  }
}

export default {
  start: startExchangeScheduler,
  stop: stopExchangeScheduler,
  forceFetch: forceFetchRates,
  getStatus: getSchedulerStatus
}
