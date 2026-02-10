/**
 * Sync Queue Processor
 * Polls PendingSync collection and sends batched updates to Reseliva
 */

import logger from '#core/logger.js'
import PendingSync from './pendingSync.model.js'
import ChannelConnection from './channelConnection.model.js'
import { getAvailabilityForDate, getRatesForDate } from './channelSync.helper.js'
import * as reselivaClient from './reseliva.client.js'

let isProcessing = false

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  return new Date(date).toISOString().split('T')[0]
}

/**
 * Check if two dates are consecutive (d2 = d1 + 1 day)
 */
function isConsecutive(d1, d2) {
  const a = new Date(d1)
  const b = new Date(d2)
  a.setUTCHours(0, 0, 0, 0)
  b.setUTCHours(0, 0, 0, 0)
  return b.getTime() - a.getTime() === 86400000
}

/**
 * Group pending items into date ranges for efficient API calls
 * Items must share same connection + roomTypeId + syncFields
 */
function groupIntoDateRanges(items) {
  if (items.length === 0) return []

  // Sort by date
  const sorted = [...items].sort((a, b) => new Date(a.date) - new Date(b.date))

  const ranges = []
  let current = {
    startDate: sorted[0].date,
    endDate: sorted[0].date,
    items: [sorted[0]]
  }

  for (let i = 1; i < sorted.length; i++) {
    if (isConsecutive(current.endDate, sorted[i].date)) {
      current.endDate = sorted[i].date
      current.items.push(sorted[i])
    } else {
      ranges.push(current)
      current = {
        startDate: sorted[i].date,
        endDate: sorted[i].date,
        items: [sorted[i]]
      }
    }
  }
  ranges.push(current)

  return ranges
}

/**
 * Process all pending syncs
 */
export async function processPendingSync() {
  if (isProcessing) {
    logger.debug('Sync queue: previous processing still running, skipping')
    return
  }

  isProcessing = true
  const stats = { processed: 0, succeeded: 0, failed: 0 }

  try {
    // 1. Find pending items ready to process
    const pendingItems = await PendingSync.find({
      status: 'pending',
      scheduledAfter: { $lte: new Date() }
    })
      .sort({ priority: -1, date: 1 })
      .limit(200)
      .lean()

    if (pendingItems.length === 0) return

    // 2. Atomic lock: set status to 'processing'
    const ids = pendingItems.map(item => item._id)
    await PendingSync.updateMany(
      { _id: { $in: ids }, status: 'pending' },
      { $set: { status: 'processing' } }
    )

    // 3. Group by connection
    const byConnection = new Map()
    for (const item of pendingItems) {
      const connId = item.connection.toString()
      if (!byConnection.has(connId)) {
        byConnection.set(connId, [])
      }
      byConnection.get(connId).push(item)
    }

    // 4. Process each connection
    for (const [connId, items] of byConnection) {
      try {
        const connection = await ChannelConnection.findById(connId)
        if (!connection || connection.status !== 'active') {
          // Connection no longer active, discard items
          const itemIds = items.map(i => i._id)
          await PendingSync.deleteMany({ _id: { $in: itemIds } })
          stats.processed += items.length
          continue
        }

        await processConnectionItems(connection, items, stats)
      } catch (err) {
        logger.error(`Sync queue: connection ${connId} processing error:`, err.message)
        // Mark items as failed with retry
        await markItemsFailed(items, err.message)
        stats.failed += items.length
      }
    }

    if (stats.processed > 0 || stats.succeeded > 0 || stats.failed > 0) {
      logger.info(
        `Sync queue: processed=${stats.processed + stats.succeeded + stats.failed}, ` +
          `succeeded=${stats.succeeded}, failed=${stats.failed}`
      )
    }
  } catch (err) {
    logger.error('Sync queue processor error:', err.message)
  } finally {
    isProcessing = false
  }
}

/**
 * Process items for a single connection
 */
async function processConnectionItems(connection, items, stats) {
  // Group by roomTypeId
  const byRoomType = new Map()
  for (const item of items) {
    const rtId = item.roomTypeId.toString()
    if (!byRoomType.has(rtId)) {
      byRoomType.set(rtId, [])
    }
    byRoomType.get(rtId).push(item)
  }

  // Build inventory updates
  const inventoryUpdates = []
  const processedItemIds = []

  for (const [roomTypeIdStr, rtItems] of byRoomType) {
    // Find room mapping
    const roomMapping = connection.roomMappings.find(
      m => m.localRoomTypeId?.toString() === roomTypeIdStr
    )
    if (!roomMapping) {
      // No mapping for this room type, remove items
      const itemIds = rtItems.map(i => i._id)
      await PendingSync.deleteMany({ _id: { $in: itemIds } })
      stats.processed += rtItems.length
      continue
    }

    // Merge syncFields across all items for this roomType
    const allSyncFields = new Set()
    for (const item of rtItems) {
      item.syncFields.forEach(f => allSyncFields.add(f))
    }

    const syncAvail = allSyncFields.has('availability')
    const syncPrices = allSyncFields.has('rates')
    const syncRestrictions = allSyncFields.has('restrictions')

    // Group into date ranges for efficient updates
    const dateRanges = groupIntoDateRanges(rtItems)

    for (const range of dateRanges) {
      // For each date in range, build the update data
      for (const item of range.items) {
        const dateStr = formatDate(item.date)

        const update = {
          from: dateStr,
          to: dateStr,
          roomTypes: [
            {
              reselivaRoomId: roomMapping.reselivaRoomId
            }
          ]
        }

        const rt = update.roomTypes[0]

        if (syncAvail) {
          const availability = await getAvailabilityForDate(
            connection.hotel,
            roomMapping.localRoomTypeId,
            item.date
          )
          rt.availability = availability
          // Check stop sale from rates
          rt.stopsale = false // Will be set below if rates exist
        }

        if (syncPrices || syncRestrictions) {
          const ratePlans = []

          // Get rate plans from mappings
          for (const rateMapping of roomMapping.rateMappings || []) {
            const ratePlan = { reselivaRateId: rateMapping.reselivaRateId }

            if (syncPrices) {
              const rateData = await getRatesForDate(
                connection.hotel,
                roomMapping.localRoomTypeId,
                rateMapping.localMealPlanId,
                item.date
              )
              if (rateData) {
                ratePlan.prices = rateData.prices
                if (syncAvail && rateData.stopSale) {
                  rt.stopsale = true
                }
                if (syncRestrictions) {
                  ratePlan.restrictions = {
                    minLOS: rateData.minStay || 1,
                    closed: rateData.stopSale || false
                  }
                }
              }
            } else if (syncRestrictions) {
              const rateData = await getRatesForDate(
                connection.hotel,
                roomMapping.localRoomTypeId,
                rateMapping.localMealPlanId,
                item.date
              )
              if (rateData) {
                ratePlan.restrictions = {
                  minLOS: rateData.minStay || 1,
                  closed: rateData.stopSale || false
                }
              }
            }

            ratePlans.push(ratePlan)
          }

          if (ratePlans.length > 0) {
            rt.ratePlans = ratePlans
          }
        }

        inventoryUpdates.push(update)
        processedItemIds.push(item._id)
      }
    }
  }

  if (inventoryUpdates.length === 0) return

  // Send to Reseliva
  try {
    await reselivaClient.updateInventory(connection, inventoryUpdates)
    // Success: delete processed items
    await PendingSync.deleteMany({ _id: { $in: processedItemIds } })
    stats.succeeded += processedItemIds.length
    logger.info(
      `Sync queue: sent ${inventoryUpdates.length} updates to Reseliva for hotel ${connection.hotel}`
    )
  } catch (err) {
    logger.error(`Sync queue: Reseliva API error for hotel ${connection.hotel}:`, err.message)
    // Find the actual documents (not lean) for retry
    const failedItems = await PendingSync.find({ _id: { $in: processedItemIds } })
    await markItemsFailed(failedItems, err.message)
    stats.failed += processedItemIds.length
  }
}

/**
 * Mark items as failed with exponential backoff
 */
async function markItemsFailed(items, errorMessage) {
  const bulkOps = []

  for (const item of items) {
    const attempts = (item.attempts || 0) + 1
    const maxAttempts = item.maxAttempts || 5

    if (attempts >= maxAttempts) {
      bulkOps.push({
        updateOne: {
          filter: { _id: item._id },
          update: {
            $set: {
              status: 'failed',
              lastError: errorMessage,
              attempts
            }
          }
        }
      })
    } else {
      // Exponential backoff: 30s, 60s, 120s, 240s, ...
      const delayMs = Math.pow(2, attempts) * 30 * 1000
      const scheduledAfter = new Date(Date.now() + delayMs)

      bulkOps.push({
        updateOne: {
          filter: { _id: item._id },
          update: {
            $set: {
              status: 'pending',
              lastError: errorMessage,
              attempts,
              scheduledAfter
            }
          }
        }
      })
    }
  }

  if (bulkOps.length > 0) {
    await PendingSync.bulkWrite(bulkOps)
  }
}

export default { processPendingSync }
