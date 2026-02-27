/**
 * Stats Service
 * Booking statistics operations
 * Split from booking.service.js for better maintainability
 */

import mongoose from 'mongoose'
import { asyncHandler } from '#helpers'
import Booking from './booking.model.js'
import { BadRequestError } from '#core/errors.js'
import { getPartnerId } from '#services/helpers.js'

// ==================== STATISTICS ====================

/**
 * Get booking statistics
 * GET /api/bookings/stats
 */
export const getBookingStats = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { hotelId, period = '30d' } = req.query

  // Convert to ObjectId for aggregate pipeline (Mongoose doesn't auto-cast in aggregate)
  const partnerObjectId = new mongoose.Types.ObjectId(partnerId)

  // Calculate date range
  const now = new Date()
  const startDate = new Date()
  if (period === '7d') startDate.setDate(now.getDate() - 7)
  else if (period === '30d') startDate.setDate(now.getDate() - 30)
  else if (period === '90d') startDate.setDate(now.getDate() - 90)
  else if (period === '365d') startDate.setDate(now.getDate() - 365)

  // Build query for period stats
  const periodQuery = {
    partner: partnerObjectId,
    createdAt: { $gte: startDate }
  }
  if (hotelId) {
    periodQuery.hotel = new mongoose.Types.ObjectId(hotelId)
  }

  // Build query for all-time status counts
  const allTimeQuery = {
    partner: partnerObjectId
  }
  if (hotelId) {
    allTimeQuery.hotel = new mongoose.Types.ObjectId(hotelId)
  }

  // Aggregate stats
  const [revenueByCurrency, statusCounts, periodSummary] = await Promise.all([
    // Revenue grouped by currency (all-time, confirmed+completed only)
    Booking.aggregate([
      { $match: { ...allTimeQuery, status: { $in: ['confirmed', 'completed'] } } },
      {
        $group: {
          _id: '$pricing.currency',
          total: { $sum: '$pricing.grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]),
    // All-time status counts
    Booking.aggregate([
      { $match: allTimeQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    // Period-based summary
    Booking.aggregate([
      { $match: periodQuery },
      {
        $group: {
          _id: null,
          totalRooms: { $sum: '$totalRooms' },
          totalGuests: { $sum: { $add: ['$totalAdults', '$totalChildren'] } }
        }
      }
    ])
  ])

  // Convert status counts to object
  const statusMap = {}
  let total = 0
  statusCounts.forEach(s => {
    statusMap[s._id] = s.count
    total += s.count
  })

  // Build revenue breakdown by currency
  const revenueByCurrencyMap = revenueByCurrency
    .filter(r => r._id)
    .map(r => ({
      currency: r._id,
      total: Math.round(r.total * 100) / 100,
      count: r.count
    }))

  res.json({
    success: true,
    data: {
      period,
      // All-time counts
      total,
      draft: statusMap.draft || 0,
      pending: statusMap.pending || 0,
      confirmed: statusMap.confirmed || 0,
      completed: statusMap.completed || 0,
      cancelled: statusMap.cancelled || 0,
      // Revenue by currency
      revenueByCurrency: revenueByCurrencyMap,
      // Period-based stats
      totalRooms: periodSummary[0]?.totalRooms || 0,
      totalGuests: periodSummary[0]?.totalGuests || 0
    }
  })
})
