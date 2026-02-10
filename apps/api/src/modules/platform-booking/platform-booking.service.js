/**
 * Platform Booking Service
 * Platform-level booking listing and statistics across all partners
 */

import { asyncHandler, escapeRegex } from '#helpers'
import Booking from '#modules/booking/booking.model.js'
import Payment from '#modules/booking/payment.model.js'
import mongoose from 'mongoose'

/**
 * List bookings across all partners (platform admin view)
 * GET /api/platform/bookings
 */
export const listPlatformBookings = asyncHandler(async (req, res) => {
  const {
    status,
    partnerId,
    hotelId,
    checkInFrom,
    checkInTo,
    checkOutFrom,
    checkOutTo,
    createdFrom,
    createdTo,
    search,
    guestName,
    bookingNumber,
    source,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  // Build query - no partner filter by default (cross-partner view)
  const query = {}

  if (partnerId) {
    query.partner = partnerId
  }
  if (status) {
    query.status = status
  }
  if (hotelId) {
    query.hotel = hotelId
  }
  if (source) {
    query['source.type'] = source
  }

  // Check-in date range
  if (checkInFrom || checkInTo) {
    query.checkIn = {}
    if (checkInFrom) query.checkIn.$gte = new Date(checkInFrom)
    if (checkInTo) query.checkIn.$lte = new Date(checkInTo + 'T23:59:59.999Z')
  }

  // Check-out date range
  if (checkOutFrom || checkOutTo) {
    query.checkOut = {}
    if (checkOutFrom) query.checkOut.$gte = new Date(checkOutFrom)
    if (checkOutTo) query.checkOut.$lte = new Date(checkOutTo + 'T23:59:59.999Z')
  }

  // Created (reservation) date range
  if (createdFrom || createdTo) {
    query.createdAt = {}
    if (createdFrom) query.createdAt.$gte = new Date(createdFrom)
    if (createdTo) query.createdAt.$lte = new Date(createdTo + 'T23:59:59.999Z')
  }

  // Booking number filter
  if (bookingNumber) {
    const escapedBN = escapeRegex(bookingNumber)
    query.bookingNumber = { $regex: escapedBN, $options: 'i' }
  }

  // Guest name filter
  if (guestName) {
    const escapedName = escapeRegex(guestName)
    const nameConditions = [
      { 'leadGuest.firstName': { $regex: escapedName, $options: 'i' } },
      { 'leadGuest.lastName': { $regex: escapedName, $options: 'i' } }
    ]
    // If there's also a general search, combine with $and
    if (search) {
      if (!query.$and) query.$and = []
      query.$and.push({ $or: nameConditions })
    } else {
      query.$or = nameConditions
    }
  }

  // General search (booking number, email, guest name, hotel name)
  if (search) {
    const escapedSearch = escapeRegex(search)
    const searchConditions = [
      { bookingNumber: { $regex: escapedSearch, $options: 'i' } },
      { 'contact.email': { $regex: escapedSearch, $options: 'i' } },
      { 'leadGuest.firstName': { $regex: escapedSearch, $options: 'i' } },
      { 'leadGuest.lastName': { $regex: escapedSearch, $options: 'i' } },
      { hotelName: { $regex: escapedSearch, $options: 'i' } }
    ]
    if (guestName) {
      // Already have $or for guest name, use $and for search
      if (!query.$and) query.$and = []
      query.$and.push({ $or: searchConditions })
    } else {
      query.$or = searchConditions
    }
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  // Sort
  const sortFieldMap = {
    bookingNumber: 'bookingNumber',
    createdAt: 'createdAt',
    hotelName: 'hotelName',
    checkIn: 'checkIn',
    pricing: 'pricing.grandTotal'
  }
  const sortField = sortFieldMap[sortBy] || 'createdAt'
  const sortDirection = sortOrder === 'asc' ? 1 : -1

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .select(
        'bookingNumber status partner hotel hotelName hotelCode checkIn checkOut nights ' +
          'totalRooms totalAdults totalChildren leadGuest contact pricing payment source ' +
          'createdAt rooms.roomTypeName rooms.roomTypeCode rooms.mealPlanCode rooms.pricing rooms.rateType'
      )
      .populate('partner', 'companyName tradeName email')
      .populate('hotel', 'name slug code')
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Booking.countDocuments(query)
  ])

  // Calculate paid amounts from Payment collection
  const bookingIds = bookings.map(b => b._id)
  const paymentAggregates = await Payment.aggregate([
    {
      $match: {
        booking: { $in: bookingIds },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$booking',
        paidAmount: {
          $sum: {
            $cond: [
              { $gt: ['$cardDetails.currencyConversion.originalAmount', null] },
              '$cardDetails.currencyConversion.originalAmount',
              '$amount'
            ]
          }
        },
        paymentCount: { $sum: 1 }
      }
    }
  ])

  const paymentMap = new Map(
    paymentAggregates.map(p => [
      p._id.toString(),
      { paidAmount: p.paidAmount, paymentCount: p.paymentCount }
    ])
  )

  // Map bookings with partner info and payment data
  const mappedBookings = bookings.map(b => {
    const paymentData = paymentMap.get(b._id.toString()) || { paidAmount: 0, paymentCount: 0 }
    const grandTotal = b.pricing?.grandTotal || 0

    let paymentStatus = 'pending'
    if (paymentData.paidAmount >= grandTotal && grandTotal > 0) {
      paymentStatus = 'paid'
    } else if (paymentData.paidAmount > 0) {
      paymentStatus = 'partial'
    }

    return {
      _id: b._id,
      bookingNumber: b.bookingNumber,
      status: b.status,
      partner: b.partner
        ? {
            _id: b.partner._id,
            companyName: b.partner.companyName || b.partner.tradeName,
            email: b.partner.email
          }
        : null,
      hotelName: b.hotel?.name?.tr || b.hotel?.name?.en || b.hotelName,
      hotelCode: b.hotel?.code || b.hotelCode,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      nights: b.nights,
      totalRooms: b.totalRooms,
      totalAdults: b.totalAdults,
      totalChildren: b.totalChildren,
      leadGuest: b.leadGuest
        ? {
            firstName: b.leadGuest.firstName,
            lastName: b.leadGuest.lastName
          }
        : null,
      contact: {
        email: b.contact?.email,
        phone: b.contact?.phone
      },
      pricing: {
        currency: b.pricing?.currency,
        grandTotal: b.pricing?.grandTotal
      },
      payment: {
        status: paymentStatus,
        paidAmount: paymentData.paidAmount
      },
      source: {
        type: b.source?.type,
        agencyName: b.source?.agencyName
      },
      rooms: (b.rooms || []).map(r => ({
        roomTypeName: r.roomTypeName,
        roomTypeCode: r.roomTypeCode,
        mealPlanCode: r.mealPlanCode,
        rateType: r.rateType
      })),
      createdAt: b.createdAt
    }
  })

  res.json({
    success: true,
    data: mappedBookings,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  })
})

/**
 * Get platform-wide booking statistics
 * GET /api/platform/bookings/stats
 */
export const getPlatformBookingStats = asyncHandler(async (req, res) => {
  const { partnerId, period = '30d' } = req.query

  // Calculate date range
  const now = new Date()
  const startDate = new Date()
  if (period === '7d') startDate.setDate(now.getDate() - 7)
  else if (period === '30d') startDate.setDate(now.getDate() - 30)
  else if (period === '90d') startDate.setDate(now.getDate() - 90)
  else if (period === '365d') startDate.setDate(now.getDate() - 365)

  // Build queries
  const periodQuery = { createdAt: { $gte: startDate } }
  const allTimeQuery = {}

  if (partnerId) {
    periodQuery.partner = new mongoose.Types.ObjectId(partnerId)
    allTimeQuery.partner = new mongoose.Types.ObjectId(partnerId)
  }

  // Payment period query
  const paymentPeriodQuery = { status: 'completed', createdAt: { $gte: startDate } }
  if (partnerId) {
    paymentPeriodQuery.partner = new mongoose.Types.ObjectId(partnerId)
  }

  const [periodStats, revenueByCurrency, paidByCurrency, statusCounts, partnerRevenue] =
    await Promise.all([
      // Period-based stats (counts only, no revenue)
      Booking.aggregate([
        { $match: periodQuery },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRooms: { $sum: '$totalRooms' },
            totalGuests: { $sum: { $add: ['$totalAdults', '$totalChildren'] } }
          }
        }
      ]),

      // Revenue grouped by currency (booking totals)
      Booking.aggregate([
        {
          $match: {
            ...periodQuery,
            status: { $in: ['confirmed', 'completed'] }
          }
        },
        {
          $group: {
            _id: '$pricing.currency',
            amount: { $sum: '$pricing.grandTotal' },
            count: { $sum: 1 }
          }
        },
        { $sort: { amount: -1 } }
      ]),

      // Paid amounts grouped by currency (completed payments)
      Payment.aggregate([
        { $match: paymentPeriodQuery },
        {
          $group: {
            _id: {
              $cond: [
                { $gt: ['$cardDetails.currencyConversion.originalCurrency', null] },
                '$cardDetails.currencyConversion.originalCurrency',
                '$currency'
              ]
            },
            amount: {
              $sum: {
                $cond: [
                  { $gt: ['$cardDetails.currencyConversion.originalAmount', null] },
                  '$cardDetails.currencyConversion.originalAmount',
                  '$amount'
                ]
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { amount: -1 } }
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

      // Revenue by partner (top 10)
      Booking.aggregate([
        {
          $match: {
            ...periodQuery,
            status: { $in: ['confirmed', 'completed'] }
          }
        },
        {
          $group: {
            _id: '$partner',
            revenue: { $sum: '$pricing.grandTotal' },
            bookingCount: { $sum: 1 },
            roomCount: { $sum: '$totalRooms' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'partners',
            localField: '_id',
            foreignField: '_id',
            as: 'partnerInfo'
          }
        },
        { $unwind: { path: '$partnerInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            partnerId: '$_id',
            companyName: { $ifNull: ['$partnerInfo.companyName', '$partnerInfo.tradeName'] },
            revenue: 1,
            bookingCount: 1,
            roomCount: 1
          }
        }
      ])
    ])

  // Convert status counts
  const statusMap = {}
  let total = 0
  statusCounts.forEach(s => {
    statusMap[s._id] = s.count
    total += s.count
  })

  res.json({
    success: true,
    data: {
      period,
      total,
      draft: statusMap.draft || 0,
      pending: statusMap.pending || 0,
      confirmed: statusMap.confirmed || 0,
      completed: statusMap.completed || 0,
      cancelled: statusMap.cancelled || 0,
      checked_in: statusMap.checked_in || 0,
      no_show: statusMap.no_show || 0,
      revenueByCurrency: revenueByCurrency.map(r => ({
        currency: r._id || 'TRY',
        amount: r.amount,
        count: r.count
      })),
      paidByCurrency: paidByCurrency.map(p => ({
        currency: p._id || 'TRY',
        amount: p.amount,
        count: p.count
      })),
      totalBookings: periodStats[0]?.totalBookings || 0,
      totalRooms: periodStats[0]?.totalRooms || 0,
      totalGuests: periodStats[0]?.totalGuests || 0,
      topPartners: partnerRevenue
    }
  })
})
