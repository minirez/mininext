/**
 * Occupancy Service
 * Calculates real occupancy from bookings and syncs Rate.sold fields
 */

import Booking from '#modules/booking/booking.model.js'
import Rate from '#modules/planning/rate.model.js'
import logger from '#core/logger.js'

/**
 * Calculate occupancy from active bookings for a date range
 * @param {string} hotelId
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Map<string, number>} key: "YYYY-MM-DD_roomTypeId", value: booked room count
 */
export async function calculateOccupancyFromBookings(hotelId, startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  // endDate is inclusive for rates, but for booking overlap we need checkIn < day after endDate
  const endPlusOne = new Date(end)
  endPlusOne.setDate(endPlusOne.getDate() + 1)

  const bookings = await Booking.find({
    hotel: hotelId,
    status: { $in: ['pending', 'confirmed', 'checked_in'] },
    checkIn: { $lt: endPlusOne },
    checkOut: { $gt: start }
  })
    .select('checkIn checkOut rooms.roomType')
    .lean()

  const occupancyMap = new Map()

  for (const booking of bookings) {
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)

    for (const room of booking.rooms) {
      const roomTypeId = room.roomType.toString()

      // Iterate each night: checkIn inclusive, checkOut exclusive
      // Clamp to the requested range
      const nightStart = new Date(Math.max(checkIn.getTime(), start.getTime()))
      const nightEnd = new Date(Math.min(checkOut.getTime(), endPlusOne.getTime()))

      const current = new Date(nightStart)
      while (current < nightEnd) {
        const dateStr = current.toISOString().slice(0, 10)
        const key = `${dateStr}_${roomTypeId}`
        occupancyMap.set(key, (occupancyMap.get(key) || 0) + 1)
        current.setDate(current.getDate() + 1)
      }
    }
  }

  return occupancyMap
}

/**
 * Sync Rate.sold fields with actual booking counts
 * @param {string} hotelId
 * @param {string} startDate
 * @param {string} endDate
 * @param {Map<string, number>} occupancyMap
 * @returns {{ synced: number }}
 */
export async function syncRateSoldFields(hotelId, startDate, endDate, occupancyMap) {
  const rates = await Rate.find({
    hotel: hotelId,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    status: 'active'
  }).select('_id date roomType sold')

  const bulkOps = []
  for (const rate of rates) {
    const dateStr = rate.date.toISOString().slice(0, 10)
    const rtId = rate.roomType.toString()
    const key = `${dateStr}_${rtId}`
    const actualSold = occupancyMap.get(key) || 0

    if ((rate.sold ?? 0) !== actualSold) {
      bulkOps.push({
        updateOne: {
          filter: { _id: rate._id },
          update: { $set: { sold: actualSold } }
        }
      })
    }
  }

  if (bulkOps.length > 0) {
    await Rate.bulkWrite(bulkOps)
    logger.info(`Synced ${bulkOps.length} Rate.sold fields for hotel ${hotelId}`)
  }

  return { synced: bulkOps.length }
}
