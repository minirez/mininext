/**
 * Allotment Module
 * Allotment management functions
 */

import Rate from '../../modules/planning/rate.model.js'
import { BadRequestError } from '../../core/errors.js'
import { queueChannelSync } from '#modules/channel-manager/channelSync.helper.js'

/**
 * Reserve allotment for a booking (decrease available rooms)
 * Should be called when a booking is confirmed
 * @param {Object} params - { hotelId, roomTypeId, mealPlanId, marketId, dates: [date1, date2, ...], rooms = 1 }
 * @returns {Object} { success, updatedRates }
 */
export async function reserveAllotment(params) {
  const { hotelId, roomTypeId, mealPlanId, marketId, dates, rooms = 1 } = params

  if (!dates || dates.length === 0) {
    throw new BadRequestError('DATES_REQUIRED')
  }

  const updatedRates = []
  const errors = []

  for (const date of dates) {
    try {
      const rate = await Rate.findOne({
        hotel: hotelId,
        roomType: roomTypeId,
        mealPlan: mealPlanId,
        market: marketId,
        date: new Date(date)
      })

      if (!rate) {
        errors.push({ date, error: 'RATE_NOT_FOUND' })
        continue
      }

      // Check if enough allotment is available
      const available = (rate.allotment ?? 0) - (rate.sold ?? 0)
      if (available < rooms) {
        errors.push({ date, error: 'INSUFFICIENT_ALLOTMENT', available, required: rooms })
        continue
      }

      // Increment sold count
      rate.sold = (rate.sold ?? 0) + rooms
      await rate.save()

      updatedRates.push({
        rateId: rate._id,
        date: rate.date,
        allotment: rate.allotment,
        sold: rate.sold,
        available: rate.allotment - rate.sold
      })
    } catch (error) {
      errors.push({ date, error: error.message })
    }
  }

  // Channel sync — availability changed
  if (updatedRates.length > 0 && hotelId) {
    queueChannelSync(
      hotelId,
      updatedRates.map(r => r.rateId.toString()),
      ['sold']
    )
  }

  return {
    success: errors.length === 0,
    updatedRates,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Release allotment for a cancelled booking (increase available rooms)
 * Should be called when a booking is cancelled
 * @param {Object} params - { hotelId, roomTypeId, mealPlanId, marketId, dates: [date1, date2, ...], rooms = 1 }
 * @returns {Object} { success, updatedRates }
 */
export async function releaseAllotment(params) {
  const { hotelId, roomTypeId, mealPlanId, marketId, dates, rooms = 1 } = params

  if (!dates || dates.length === 0) {
    throw new BadRequestError('DATES_REQUIRED')
  }

  const updatedRates = []
  const errors = []

  for (const date of dates) {
    try {
      const rate = await Rate.findOne({
        hotel: hotelId,
        roomType: roomTypeId,
        mealPlan: mealPlanId,
        market: marketId,
        date: new Date(date)
      })

      if (!rate) {
        errors.push({ date, error: 'RATE_NOT_FOUND' })
        continue
      }

      // Decrease sold count (minimum 0)
      rate.sold = Math.max(0, (rate.sold ?? 0) - rooms)
      await rate.save()

      updatedRates.push({
        rateId: rate._id,
        date: rate.date,
        allotment: rate.allotment,
        sold: rate.sold,
        available: (rate.allotment ?? 0) - rate.sold
      })
    } catch (error) {
      errors.push({ date, error: error.message })
    }
  }

  // Channel sync — availability changed
  if (updatedRates.length > 0 && hotelId) {
    queueChannelSync(
      hotelId,
      updatedRates.map(r => r.rateId.toString()),
      ['sold']
    )
  }

  return {
    success: errors.length === 0,
    updatedRates,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Get allotment status for a date range
 * @param {Object} params - { hotelId, roomTypeId, mealPlanId, marketId, startDate, endDate }
 * @returns {Array} Allotment status per day
 */
export async function getAllotmentStatus(params) {
  const { hotelId, roomTypeId, mealPlanId, marketId, startDate, endDate } = params

  const rates = await Rate.findInRange(hotelId, startDate, endDate, {
    roomType: roomTypeId,
    mealPlan: mealPlanId,
    market: marketId
  })

  return rates.map(rate => ({
    date: rate.date,
    allotment: rate.allotment ?? null,
    sold: rate.sold ?? 0,
    available: rate.allotment !== null ? rate.allotment - (rate.sold ?? 0) : null,
    stopSale: rate.stopSale || false
  }))
}
