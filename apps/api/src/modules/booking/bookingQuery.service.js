/**
 * Booking Query Service
 * Handles get, list, search, and filter operations for bookings
 */

import { asyncHandler, escapeRegex } from '#helpers'
import Booking from './booking.model.js'
import Payment from './payment.model.js'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import { getPartnerId } from '#services/helpers.js'

/**
 * List bookings for partner
 * GET /api/bookings
 */
export const listBookings = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const {
    status,
    hotelId,
    checkInFrom,
    checkInTo,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  // Build query
  const query = { partner: partnerId }

  if (status) {
    query.status = status
  }
  if (hotelId) {
    query.hotel = hotelId
  }
  if (checkInFrom || checkInTo) {
    query.checkIn = {}
    if (checkInFrom) query.checkIn.$gte = new Date(checkInFrom)
    if (checkInTo) query.checkIn.$lte = new Date(checkInTo)
  }
  if (search) {
    const escapedSearch = escapeRegex(search)
    query.$or = [
      { bookingNumber: { $regex: escapedSearch, $options: 'i' } },
      { 'contact.email': { $regex: escapedSearch, $options: 'i' } },
      { 'leadGuest.firstName': { $regex: escapedSearch, $options: 'i' } },
      { 'leadGuest.lastName': { $regex: escapedSearch, $options: 'i' } },
      { hotelName: { $regex: escapedSearch, $options: 'i' } }
    ]
  }

  // Agency user: only see their own bookings
  if (req.user?.accountType === 'agency') {
    query['source.agencyId'] = req.user.accountId
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  // Sort - map frontend keys to database fields
  const sortFieldMap = {
    bookingNumber: 'bookingNumber',
    createdAt: 'createdAt',
    hotelName: 'hotelName',
    checkIn: 'checkIn',
    pricing: 'pricing.grandTotal'
  }
  const sortField = sortFieldMap[sortBy] || 'createdAt'
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const sortOption = { [sortField]: sortDirection }

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .select(
        'bookingNumber status hotel hotelName hotelCode checkIn checkOut nights totalRooms totalAdults totalChildren leadGuest contact pricing payment source expiresAt lastActivityAt createdAt rooms.roomTypeName rooms.roomTypeCode rooms.mealPlanName rooms.mealPlanCode rooms.pricing rooms.rateType rooms.nonRefundableDiscount market marketCode marketName season seasonCode seasonName modifications salesChannel searchCriteria.channel'
      )
      .populate('hotel', 'name slug code')
      .populate('market', '_id name code currency')
      .populate('season', '_id name code color')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Booking.countDocuments(query)
  ])

  // Calculate actual paid amounts from Payment collection (single source of truth)
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
        paidAmount: { $sum: {
          $cond: [
            { $gt: ['$cardDetails.currencyConversion.originalAmount', null] },
            '$cardDetails.currencyConversion.originalAmount',
            '$amount'
          ]
        }},
        paymentCount: { $sum: 1 },
        currencyConversion: { $first: '$cardDetails.currencyConversion' }
      }
    }
  ])

  // Create a map for quick lookup
  const paymentMap = new Map(
    paymentAggregates.map(p => [p._id.toString(), { paidAmount: p.paidAmount, paymentCount: p.paymentCount, currencyConversion: p.currencyConversion || null }])
  )

  // Map bookings for response with calculated payment data
  const mappedBookings = bookings.map(b => {
    const paymentData = paymentMap.get(b._id.toString()) || { paidAmount: 0, paymentCount: 0 }
    const grandTotal = b.pricing?.grandTotal || 0

    // Calculate payment status from actual data
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
    hotelName: b.hotel?.name?.tr || b.hotel?.name?.en || b.hotelName,
    hotelCode: b.hotel?.code || b.hotelCode,
    hotel: {
      _id: b.hotel?._id,
      name: b.hotel?.name || b.hotelName,
      slug: b.hotel?.slug
    },
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: b.nights,
    totalRooms: b.totalRooms,
    totalAdults: b.totalAdults,
    totalChildren: b.totalChildren,
    leadGuest: b.leadGuest
      ? {
          firstName: b.leadGuest.firstName,
          lastName: b.leadGuest.lastName,
          nationality: b.leadGuest.nationality
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
      paidAmount: paymentData.paidAmount,
      ...(paymentData.currencyConversion && { currencyConversion: paymentData.currencyConversion })
    },
    source: {
      type: b.source?.type,
      agencyName: b.source?.agencyName
    },
    market: b.market
      ? {
          _id: b.market._id,
          code: b.market.code || b.marketCode,
          name: b.market.name || b.marketName,
          currency: b.market.currency
        }
      : b.marketCode
        ? { code: b.marketCode, name: b.marketName }
        : null,
    season: b.season
      ? {
          _id: b.season._id,
          code: b.season.code || b.seasonCode,
          name: b.season.name || b.seasonName,
          color: b.season.color
        }
      : b.seasonCode
        ? { code: b.seasonCode, name: b.seasonName }
        : null,
    expiresAt: b.expiresAt,
    lastActivityAt: b.lastActivityAt,
    createdAt: b.createdAt,
    rooms: (b.rooms || []).map(r => ({
      roomTypeName: r.roomTypeName,
      roomTypeCode: r.roomTypeCode,
      mealPlanName: r.mealPlanName,
      mealPlanCode: r.mealPlanCode,
      pricing: r.pricing
        ? {
            currency: r.pricing.currency,
            finalTotal: r.pricing.finalTotal
          }
        : null,
      rateType: r.rateType,
      nonRefundableDiscount: r.nonRefundableDiscount
    })),
    modifications: b.modifications || [],
    salesChannel: b.salesChannel,
    searchCriteria: b.searchCriteria ? { channel: b.searchCriteria.channel } : null
  }})

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
 * Get booking detail
 * GET /api/bookings/:id
 */
export const getBookingDetail = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { id } = req.params

  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  })
    .populate('hotel', 'name slug code address images contact')
    .populate('market', 'name code currency')
    .populate('rooms.roomType', 'name code images')
    .populate('rooms.mealPlan', 'name code')

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Agency user: only see their own bookings
  if (req.user?.accountType === 'agency') {
    if (booking.source?.agencyId?.toString() !== req.user.accountId.toString()) {
      throw new NotFoundError('BOOKING_NOT_FOUND')
    }
  }

  // Calculate actual paid amount from Payment collection (single source of truth)
  const paymentAggregate = await Payment.aggregate([
    {
      $match: {
        booking: booking._id,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        paidAmount: { $sum: {
          $cond: [
            { $gt: ['$cardDetails.currencyConversion.originalAmount', null] },
            '$cardDetails.currencyConversion.originalAmount',
            '$amount'
          ]
        }},
        paymentCount: { $sum: 1 }
      }
    }
  ])

  const paidAmount = paymentAggregate[0]?.paidAmount || 0
  const grandTotal = booking.pricing?.grandTotal || 0

  // Calculate payment status from actual data
  let paymentStatus = 'pending'
  if (paidAmount >= grandTotal && grandTotal > 0) {
    paymentStatus = 'paid'
  } else if (paidAmount > 0) {
    paymentStatus = 'partial'
  }

  // Override booking.payment with calculated values
  const bookingData = booking.toObject()
  bookingData.payment = {
    ...bookingData.payment,
    status: paymentStatus,
    paidAmount: paidAmount
  }

  res.json({
    success: true,
    data: bookingData
  })
})
