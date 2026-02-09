import logger from '#core/logger.js'
import * as reselivaClient from './reseliva.client.js'

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  return date.toISOString().split('T')[0]
}

/**
 * Get date range array
 */
function getDateRange(from, to) {
  const dates = []
  const current = new Date(from)
  const end = new Date(to)
  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

/**
 * Sync room availability to Reseliva
 * @param {Object} connection - ChannelConnection document
 * @param {string} roomTypeId - Local room type ObjectId
 * @param {Date} fromDate - Start date
 * @param {Date} toDate - End date
 * @param {Function} getAvailability - async function(hotelId, roomTypeId, date) => number
 */
export async function syncAvailability(connection, roomTypeId, fromDate, toDate, getAvailability) {
  // Find room mapping
  const mapping = connection.roomMappings.find(
    m => m.localRoomTypeId.toString() === roomTypeId.toString()
  )
  if (!mapping) {
    throw new Error(`No mapping found for room type ${roomTypeId}`)
  }

  const dates = getDateRange(fromDate, toDate)

  // Group consecutive days with same availability
  const updates = []
  let currentGroup = null

  for (const date of dates) {
    const availability = await getAvailability(connection.hotel, roomTypeId, date)

    if (currentGroup && currentGroup.availability === availability) {
      // Extend current group
      currentGroup.to = formatDate(date)
    } else {
      // Start new group
      if (currentGroup) updates.push(currentGroup)
      currentGroup = {
        from: formatDate(date),
        to: formatDate(date),
        availability,
        reselivaRoomId: mapping.reselivaRoomId
      }
    }
  }
  if (currentGroup) updates.push(currentGroup)

  // Build inventory update
  const inventoryUpdates = updates.map(u => ({
    from: u.from,
    to: u.to,
    roomTypes: [
      {
        reselivaRoomId: u.reselivaRoomId,
        availability: u.availability
      }
    ]
  }))

  const result = await reselivaClient.updateInventory(connection, inventoryUpdates)

  // Update last sync time
  connection.lastSync.inventory = new Date()
  await connection.save()

  return result
}

/**
 * Sync rates to Reseliva
 * @param {Object} connection - ChannelConnection document
 * @param {string} roomTypeId - Local room type ObjectId
 * @param {string} mealPlanId - Local meal plan ObjectId
 * @param {Date} fromDate - Start date
 * @param {Date} toDate - End date
 * @param {Function} getRates - async function(hotelId, roomTypeId, mealPlanId, date) => {price1, price2, ...}
 */
export async function syncRates(connection, roomTypeId, mealPlanId, fromDate, toDate, getRates) {
  // Find room and rate mapping
  const roomMapping = connection.roomMappings.find(
    m => m.localRoomTypeId.toString() === roomTypeId.toString()
  )
  if (!roomMapping) {
    throw new Error(`No mapping found for room type ${roomTypeId}`)
  }

  const rateMapping = roomMapping.rateMappings.find(
    m => m.localMealPlanId.toString() === mealPlanId.toString()
  )
  if (!rateMapping) {
    throw new Error(`No rate mapping found for meal plan ${mealPlanId}`)
  }

  const dates = getDateRange(fromDate, toDate)

  // Group consecutive days with same rates
  const updates = []
  let currentGroup = null

  for (const date of dates) {
    const rates = await getRates(connection.hotel, roomTypeId, mealPlanId, date)
    const rateKey = JSON.stringify(rates)

    if (currentGroup && currentGroup.rateKey === rateKey) {
      currentGroup.to = formatDate(date)
    } else {
      if (currentGroup) updates.push(currentGroup)
      currentGroup = {
        from: formatDate(date),
        to: formatDate(date),
        rates,
        rateKey
      }
    }
  }
  if (currentGroup) updates.push(currentGroup)

  // Build inventory update
  const inventoryUpdates = updates.map(u => ({
    from: u.from,
    to: u.to,
    roomTypes: [
      {
        reselivaRoomId: roomMapping.reselivaRoomId,
        ratePlans: [
          {
            reselivaRateId: rateMapping.reselivaRateId,
            prices: u.rates
          }
        ]
      }
    ]
  }))

  const result = await reselivaClient.updateInventory(connection, inventoryUpdates)
  return result
}

/**
 * Full sync: all mapped rooms for 1 year ahead
 * @param {Object} connection - ChannelConnection document
 * @param {Function} getAvailability - availability function
 * @param {Function} getRates - rates function (optional)
 */
export async function fullSync(connection, getAvailability, getRates) {
  const results = {
    roomsSynced: 0,
    errors: []
  }

  const fromDate = new Date()
  const toDate = new Date()
  toDate.setFullYear(toDate.getFullYear() + 1)

  for (const mapping of connection.roomMappings) {
    try {
      // Sync availability
      await syncAvailability(connection, mapping.localRoomTypeId, fromDate, toDate, getAvailability)

      // Sync rates if two-way and function provided
      if (connection.integrationType === 'two_way' && getRates) {
        for (const rateMapping of mapping.rateMappings) {
          try {
            await syncRates(
              connection,
              mapping.localRoomTypeId,
              rateMapping.localMealPlanId,
              fromDate,
              toDate,
              getRates
            )
          } catch (err) {
            results.errors.push({
              roomId: mapping.reselivaRoomId,
              rateId: rateMapping.reselivaRateId,
              error: err.message
            })
          }
        }
      }

      results.roomsSynced++
    } catch (err) {
      logger.error(`Full sync error for room ${mapping.reselivaRoomId}:`, err.message)
      results.errors.push({
        roomId: mapping.reselivaRoomId,
        error: err.message
      })
    }
  }

  connection.lastSync.inventory = new Date()
  await connection.save()

  return results
}

export default {
  syncAvailability,
  syncRates,
  fullSync
}
