/**
 * Channel Sync Helper
 * Provides real getAvailability/getRates functions and
 * fire-and-forget sync after rate changes in planning module
 */

import logger from '#core/logger.js'
import Rate from '#modules/planning/rate.model.js'
import Market from '#modules/planning/market.model.js'
import ChannelConnection from './channelConnection.model.js'
import PendingSync from './pendingSync.model.js'
import * as reselivaClient from './reseliva.client.js'

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  return new Date(date).toISOString().split('T')[0]
}

/**
 * Get available rooms for a room type on a specific date
 * Aggregates across all markets/mealPlans for the room type
 * @param {string} hotelId
 * @param {string} roomTypeId
 * @param {Date} date
 * @returns {Promise<number>}
 */
export async function getAvailabilityForDate(hotelId, roomTypeId, date) {
  const dateObj = new Date(date)
  dateObj.setUTCHours(0, 0, 0, 0)

  // Get all active rates for this room type on this date
  const rates = await Rate.find({
    hotel: hotelId,
    roomType: roomTypeId,
    date: dateObj,
    status: 'active'
  }).lean()

  if (rates.length === 0) return 0

  // Allotment represents physical room availability (should be same across rates)
  // Take the max to be safe, subtract total sold
  const allotment = Math.max(...rates.map(r => r.allotment || 0))
  const totalSold = rates.reduce((sum, r) => sum + (r.sold || 0), 0)

  return Math.max(0, allotment - totalSold)
}

/**
 * Get rate data for a specific room type + meal plan + date
 * Uses the default market or specified market for pricing
 * @param {string} hotelId
 * @param {string} roomTypeId
 * @param {string} mealPlanId
 * @param {Date} date
 * @param {string} [marketId] - If not provided, uses default market
 * @returns {Promise<Object|null>}
 */
export async function getRatesForDate(hotelId, roomTypeId, mealPlanId, date, marketId) {
  // Find market to use
  let mId = marketId
  if (!mId) {
    const defaultMarket = await Market.findDefaultByHotel(hotelId)
    if (!defaultMarket) return null
    mId = defaultMarket._id
  }

  const dateObj = new Date(date)
  dateObj.setUTCHours(0, 0, 0, 0)

  const rate = await Rate.findOne({
    hotel: hotelId,
    roomType: roomTypeId,
    mealPlan: mealPlanId,
    market: mId,
    date: dateObj,
    status: 'active'
  }).lean()

  if (!rate) return null

  // Build prices object based on pricing type
  const prices = {}

  if (rate.pricingType === 'per_person' && rate.occupancyPricing) {
    // Per-person pricing: price1=1pax, price2=2pax, etc.
    for (let i = 1; i <= 10; i++) {
      if (rate.occupancyPricing[String(i)] !== undefined) {
        prices[`price${i}`] = rate.occupancyPricing[String(i)]
      }
    }
  } else {
    // Unit pricing: single price for all
    prices.price1 = rate.pricePerNight || 0
  }

  return {
    prices,
    stopSale: rate.stopSale || false,
    minStay: rate.minStay || 1,
    closedToArrival: rate.closedToArrival || false,
    closedToDeparture: rate.closedToDeparture || false
  }
}

/**
 * Sync specific rate changes to channel manager (fire-and-forget)
 * Called after rate updates in planning module
 * @param {string} hotelId
 * @param {Array<string>} rateIds - Rate document IDs that were changed
 * @param {Array<string>} [changedFields] - Which fields changed (for optimization)
 */
export async function syncRateChangesToChannel(hotelId, rateIds, changedFields) {
  try {
    // Find active two-way connections for this hotel
    const connections = await ChannelConnection.find({
      hotel: hotelId,
      status: 'active',
      integrationType: 'two_way'
    })

    if (connections.length === 0) return

    // Get the affected rates
    const rates = await Rate.find({ _id: { $in: rateIds } }).lean()
    if (rates.length === 0) return

    // Determine what to sync based on changed fields
    const syncAvail =
      !changedFields || changedFields.some(f => ['allotment', 'sold', 'stopSale'].includes(f))
    const syncPrices =
      !changedFields ||
      changedFields.some(f =>
        [
          'pricePerNight',
          'occupancyPricing',
          'pricingType',
          'extraAdult',
          'extraChild',
          'extraInfant'
        ].includes(f)
      )
    const syncRestrictions =
      !changedFields ||
      changedFields.some(f =>
        ['minStay', 'maxStay', 'closedToArrival', 'closedToDeparture', 'stopSale'].includes(f)
      )

    for (const connection of connections) {
      try {
        await syncRatesToConnection(connection, rates, { syncAvail, syncPrices, syncRestrictions })
      } catch (err) {
        logger.error(`Channel sync failed for connection ${connection._id}:`, err.message)
      }
    }
  } catch (err) {
    logger.error('Channel sync error:', err.message)
  }
}

/**
 * Sync rates to a specific connection
 */
async function syncRatesToConnection(
  connection,
  rates,
  { syncAvail, syncPrices, syncRestrictions }
) {
  // Group rates by roomType + date for efficient updates
  const updateMap = new Map()

  for (const rate of rates) {
    const roomMapping = connection.roomMappings.find(
      m => m.localRoomTypeId?.toString() === rate.roomType?.toString()
    )
    if (!roomMapping) continue

    const dateKey = formatDate(rate.date)
    const mapKey = `${roomMapping.reselivaRoomId}_${dateKey}`

    if (!updateMap.has(mapKey)) {
      updateMap.set(mapKey, {
        date: dateKey,
        reselivaRoomId: roomMapping.reselivaRoomId,
        roomMapping,
        rates: []
      })
    }
    updateMap.get(mapKey).rates.push(rate)
  }

  if (updateMap.size === 0) return

  // Build inventory updates
  const inventoryUpdates = []

  for (const [, group] of updateMap) {
    const update = {
      from: group.date,
      to: group.date,
      roomTypes: [
        {
          reselivaRoomId: group.reselivaRoomId
        }
      ]
    }

    const rt = update.roomTypes[0]

    // Availability (at room type level)
    if (syncAvail) {
      const availability = await getAvailabilityForDate(
        connection.hotel,
        group.roomMapping.localRoomTypeId,
        group.date
      )
      rt.availability = availability

      // Stop sale (any rate has stop sale → room is stopped)
      const anyStopSale = group.rates.some(r => r.stopSale)
      rt.stopsale = anyStopSale
    }

    // Rates and restrictions (at rate plan level)
    if (syncPrices || syncRestrictions) {
      const ratePlans = []

      for (const rate of group.rates) {
        // Find rate mapping for this meal plan
        const rateMapping = group.roomMapping.rateMappings?.find(
          rm => rm.localMealPlanId?.toString() === rate.mealPlan?.toString()
        )
        if (!rateMapping) continue

        // Avoid duplicate rate plan entries
        if (ratePlans.some(rp => rp.reselivaRateId === rateMapping.reselivaRateId)) continue

        const ratePlan = { reselivaRateId: rateMapping.reselivaRateId }

        if (syncPrices) {
          const rateData = await getRatesForDate(
            connection.hotel,
            rate.roomType,
            rate.mealPlan,
            rate.date,
            rate.market
          )
          if (rateData) {
            ratePlan.prices = rateData.prices
          }
        }

        if (syncRestrictions) {
          ratePlan.restrictions = {
            minLOS: rate.minStay || 1,
            closed: rate.stopSale || false
          }
        }

        ratePlans.push(ratePlan)
      }

      if (ratePlans.length > 0) {
        rt.ratePlans = ratePlans
      }
    }

    inventoryUpdates.push(update)
  }

  if (inventoryUpdates.length > 0) {
    await reselivaClient.updateInventory(connection, inventoryUpdates)
    logger.info(
      `Channel sync: sent ${inventoryUpdates.length} updates to Reseliva for hotel ${connection.hotel}`
    )
  }
}

/**
 * Map changed fields to sync field types
 */
function mapToSyncFields(changedFields) {
  if (!changedFields || changedFields.length === 0) {
    return ['availability', 'rates', 'restrictions']
  }

  const syncFields = new Set()

  for (const field of changedFields) {
    if (['allotment', 'sold', 'stopSale'].includes(field)) {
      syncFields.add('availability')
    }
    if (
      [
        'pricePerNight',
        'occupancyPricing',
        'pricingType',
        'extraAdult',
        'extraChild',
        'extraInfant'
      ].includes(field)
    ) {
      syncFields.add('rates')
    }
    if (
      ['minStay', 'maxStay', 'closedToArrival', 'closedToDeparture', 'stopSale'].includes(field)
    ) {
      syncFields.add('restrictions')
    }
  }

  return [...syncFields]
}

/**
 * Queue channel sync to persistent MongoDB queue
 * Changes are batched and sent by syncQueueProcessor on a 60s interval
 * @param {string} hotelId
 * @param {Array<string>} rateIds
 * @param {Array<string>} [changedFields]
 */
export function queueChannelSync(hotelId, rateIds, changedFields) {
  // Fire and forget - don't block the rate update
  Promise.resolve().then(async () => {
    try {
      // Find active two-way connections
      const connections = await ChannelConnection.find({
        hotel: hotelId,
        status: 'active',
        integrationType: 'two_way'
      }).lean()

      if (connections.length === 0) return

      // Get affected rates
      const rates = await Rate.find({ _id: { $in: rateIds } }).lean()
      if (rates.length === 0) return

      const syncFields = mapToSyncFields(changedFields)
      if (syncFields.length === 0) return

      // Upsert pending syncs for each connection + roomType + date
      const bulkOps = []

      for (const connection of connections) {
        for (const rate of rates) {
          // Check if room type is mapped
          const hasMapping = connection.roomMappings?.some(
            m => m.localRoomTypeId?.toString() === rate.roomType?.toString()
          )
          if (!hasMapping) continue

          const dateObj = new Date(rate.date)
          dateObj.setUTCHours(0, 0, 0, 0)

          bulkOps.push({
            updateOne: {
              filter: {
                connection: connection._id,
                roomTypeId: rate.roomType,
                date: dateObj,
                status: 'pending'
              },
              update: {
                $addToSet: { syncFields: { $each: syncFields } },
                $set: {
                  hotel: hotelId,
                  mealPlanId: rate.mealPlan || null
                },
                $setOnInsert: {
                  priority: 0,
                  attempts: 0,
                  maxAttempts: 5,
                  scheduledAfter: new Date()
                }
              },
              upsert: true
            }
          })
        }
      }

      if (bulkOps.length > 0) {
        await PendingSync.bulkWrite(bulkOps, { ordered: false })
        logger.debug(`Channel sync queued: ${bulkOps.length} pending sync(s) for hotel ${hotelId}`)
      }
    } catch (err) {
      logger.error('Channel sync queue error:', err.message)
    }
  })
}

export default {
  getAvailabilityForDate,
  getRatesForDate,
  syncRateChangesToChannel,
  queueChannelSync
}
