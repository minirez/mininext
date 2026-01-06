/**
 * Stats Service
 * Booking statistics operations
 * Split from booking.service.js for better maintainability
 */

import { asyncHandler } from '../../helpers/asyncHandler.js'
import Booking from './booking.model.js'
import { BadRequestError } from '../../core/errors.js'
import { getPartnerId } from '../../services/helpers.js'

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

  // Calculate date range
  const now = new Date()
  const startDate = new Date()
  if (period === '7d') startDate.setDate(now.getDate() - 7)
  else if (period === '30d') startDate.setDate(now.getDate() - 30)
  else if (period === '90d') startDate.setDate(now.getDate() - 90)
  else if (period === '365d') startDate.setDate(now.getDate() - 365)

  // Build query for period stats
  const periodQuery = {
    partner: partnerId,
    createdAt: { $gte: startDate }
  }
  if (hotelId) {
    periodQuery.hotel = hotelId
  }

  // Build query for all-time status counts
  const allTimeQuery = {
    partner: partnerId
  }
  if (hotelId) {
    allTimeQuery.hotel = hotelId
  }

  // Aggregate stats for period
  const [periodStats, statusCounts] = await Promise.all([
    // Period-based stats (revenue, etc.)
    Booking.aggregate([
      { $match: periodQuery },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, '$pricing.grandTotal', 0]
            }
          },
          totalRooms: { $sum: '$totalRooms' },
          totalGuests: { $sum: { $add: ['$totalAdults', '$totalChildren'] } }
        }
      }
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
    ])
  ])

  // Convert status counts to object
  const statusMap = {}
  let total = 0
  statusCounts.forEach(s => {
    statusMap[s._id] = s.count
    total += s.count
  })

  const result = {
    // All-time counts
    total,
    draft: statusMap.draft || 0,
    pending: statusMap.pending || 0,
    confirmed: statusMap.confirmed || 0,
    completed: statusMap.completed || 0,
    cancelled: statusMap.cancelled || 0,
    // Period-based stats
    revenue: periodStats[0]?.totalRevenue || 0,
    totalRooms: periodStats[0]?.totalRooms || 0,
    totalGuests: periodStats[0]?.totalGuests || 0
  }

  res.json({
    success: true,
    data: {
      period,
      ...result
    }
  })
})
