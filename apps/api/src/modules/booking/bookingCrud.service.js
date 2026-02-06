/**
 * Booking CRUD Service
 * Core booking CRUD operations
 * Split from booking.service.js for better maintainability
 * Supports sortBy/sortOrder params for server-side sorting
 */

import { asyncHandler, escapeRegex } from '#helpers'
import Hotel from '../hotel/hotel.model.js'
import RoomType from '../planning/roomType.model.js'
import MealPlan from '../planning/mealPlan.model.js'
import Market from '../planning/market.model.js'
import Booking from './booking.model.js'
import Payment from './payment.model.js'
import PaymentLink from '../paymentLink/paymentLink.model.js'
import Partner from '../partner/partner.model.js'
import pricingService from '#services/pricingService.js'
import notificationService from '#services/notificationService.js'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import logger from '#core/logger.js'
import { getPartnerId, getSourceInfo } from '#services/helpers.js'
import { sanitizeGuest, sanitizeRoomGuests } from './helpers.js'

// ==================== BOOKING CRUD ====================

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

/**
 * Create booking
 * POST /api/bookings
 */
export const createBooking = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { hotelId, marketId, checkIn, checkOut, rooms, contact, billing, specialRequests, salesChannel = 'b2c' } =
    req.body

  // Validate hotel
  const hotel = await Hotel.findOne({
    _id: hotelId,
    partner: partnerId,
    status: 'active'
  })
    .select('_id partner name slug code pricingSettings')
    .lean()

  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Validate dates
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (checkInDate < today) {
    throw new BadRequestError('CHECK_IN_MUST_BE_FUTURE')
  }

  if (checkOutDate <= checkInDate) {
    throw new BadRequestError('INVALID_DATE_RANGE')
  }

  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
  if (nights > 30) {
    throw new BadRequestError('MAX_30_NIGHTS')
  }

  // Validate contact
  if (!contact?.email || !contact?.phone) {
    throw new BadRequestError('CONTACT_INFO_REQUIRED')
  }

  // Validate rooms
  if (!rooms || rooms.length === 0) {
    throw new BadRequestError('ROOMS_REQUIRED')
  }

  // Get market
  let market
  if (marketId) {
    market = await Market.findOne({
      _id: marketId,
      hotel: hotel._id,
      status: 'active'
    }).lean()
  }
  if (!market) {
    market = await Market.findOne({
      hotel: hotel._id,
      isDefault: true,
      status: 'active'
    }).lean()
  }
  if (!market) {
    throw new NotFoundError('NO_MARKET_AVAILABLE')
  }

  // Process rooms and calculate prices
  const processedRooms = []
  let totalAdults = 0
  let totalChildren = 0
  let totalInfants = 0
  let subtotal = 0
  let totalDiscount = 0

  for (const room of rooms) {
    // Get room type
    const roomType = await RoomType.findOne({
      _id: room.roomTypeId,
      hotel: hotel._id,
      status: 'active'
    }).lean()

    if (!roomType) {
      throw new NotFoundError(`ROOM_TYPE_NOT_FOUND: ${room.roomTypeId}`)
    }

    // Get meal plan
    const mealPlan = await MealPlan.findOne({
      _id: room.mealPlanId,
      hotel: hotel._id,
      status: 'active'
    }).lean()

    if (!mealPlan) {
      throw new NotFoundError(`MEAL_PLAN_NOT_FOUND: ${room.mealPlanId}`)
    }

    const adults = room.adults || 2
    const children = room.children || []

    // Calculate price
    const priceResult = await pricingService.calculatePriceWithCampaigns({
      hotelId: hotel._id.toString(),
      roomTypeId: roomType._id.toString(),
      mealPlanId: mealPlan._id.toString(),
      marketId: market._id.toString(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults,
      children: children.map(age => ({ age })),
      includeCampaigns: true
    })

    if (!priceResult.availability?.isAvailable) {
      const issues = priceResult.availability?.issues || []
      throw new BadRequestError(
        `ROOM_NOT_AVAILABLE: ${roomType.name?.tr || roomType.code}. ${issues[0]?.message || ''}`
      )
    }

    // Determine display price based on sales channel
    const channelPrice = salesChannel === 'b2b'
      ? priceResult.pricing.b2bPrice
      : priceResult.pricing.b2cPrice

    // Build room booking
    const roomBooking = {
      roomType: roomType._id,
      roomTypeCode: roomType.code,
      roomTypeName: roomType.name,
      mealPlan: mealPlan._id,
      mealPlanCode: mealPlan.code,
      mealPlanName: mealPlan.name,
      guests: sanitizeRoomGuests(room.guests),
      pricing: {
        currency: market.currency,
        originalTotal: priceResult.pricing.originalTotal,
        discount: priceResult.pricing.totalDiscount,
        finalTotal: channelPrice,
        avgPerNight: channelPrice / nights
      },
      dailyBreakdown: priceResult.dailyBreakdown,
      campaigns: priceResult.campaigns.applied,
      specialRequests: room.specialRequests
    }

    processedRooms.push(roomBooking)

    // Update totals with channel-specific prices
    totalAdults += adults
    totalChildren += children.filter(age => age >= 2).length
    totalInfants += children.filter(age => age < 2).length
    subtotal += priceResult.pricing.originalTotal
    totalDiscount += (priceResult.pricing.originalTotal - channelPrice)
  }

  // Calculate final pricing
  const grandTotal = subtotal - totalDiscount
  const taxRate = hotel.pricingSettings?.taxRate || 0
  const tax = hotel.pricingSettings?.taxIncluded ? 0 : (grandTotal * taxRate) / 100

  // Get primary season from first room's first day
  let primarySeason = null
  if (processedRooms[0]?.dailyBreakdown?.[0]?.season) {
    primarySeason = processedRooms[0].dailyBreakdown[0].season
  }

  // Generate booking number
  const bookingNumber = await Booking.generateBookingNumber(partnerId)

  // Get lead guest
  let leadGuest = null
  for (const room of rooms) {
    if (room.guests) {
      leadGuest = room.guests.find(g => g.isLead)
      if (leadGuest) break
    }
  }
  if (!leadGuest && rooms[0]?.guests?.[0]) {
    leadGuest = { ...rooms[0].guests[0], isLead: true }
  }
  if (!leadGuest) {
    leadGuest = {
      firstName: contact.firstName || 'Guest',
      lastName: contact.lastName || '',
      type: 'adult',
      isLead: true
    }
  }

  // Create booking
  const booking = new Booking({
    bookingNumber,
    partner: partnerId,
    hotel: hotel._id,
    hotelCode: hotel.slug || hotel.code,
    hotelName: hotel.name,
    market: market._id,
    marketCode: market.code,
    marketName: market.name,
    season: primarySeason?._id,
    seasonCode: primarySeason?.code,
    seasonName: primarySeason?.name,
    salesChannel,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    nights,
    rooms: processedRooms,
    totalRooms: processedRooms.length,
    totalAdults,
    totalChildren,
    totalInfants,
    leadGuest: sanitizeGuest(leadGuest),
    contact: {
      email: contact.email,
      phone: contact.phone,
      countryCode: contact.countryCode
    },
    billing,
    pricing: {
      currency: market.currency,
      subtotal,
      totalDiscount,
      tax,
      taxRate,
      grandTotal: grandTotal + tax
    },
    payment: {
      status: 'pending',
      dueAmount: grandTotal + tax
    },
    status: 'pending',
    source: getSourceInfo(req),
    specialRequests
  })

  await booking.save()

  // Reserve allotment for all rooms/dates
  for (const room of processedRooms) {
    const dates = room.dailyBreakdown.map(d => d.date)
    try {
      await pricingService.reserveAllotment({
        hotelId: hotel._id.toString(),
        roomTypeId: room.roomType.toString(),
        mealPlanId: room.mealPlan.toString(),
        marketId: market._id.toString(),
        dates,
        rooms: 1
      })
    } catch (error) {
      logger.error('Allotment reservation error:', error.message)
    }
  }

  // Populate for response
  await booking.populate('hotel', 'name slug')

  res.status(201).json({
    success: true,
    data: {
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      hotel: {
        _id: booking.hotel._id,
        name: booking.hotel.name,
        slug: booking.hotel.slug
      },
      checkIn: booking.formattedCheckIn,
      checkOut: booking.formattedCheckOut,
      nights: booking.nights,
      rooms: booking.totalRooms,
      guests: {
        adults: booking.totalAdults,
        children: booking.totalChildren
      },
      pricing: booking.pricing,
      contact: {
        email: booking.contact.email
      }
    }
  })
})

/**
 * Update booking status
 * PATCH /api/bookings/:id/status
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { id } = req.params
  const { status } = req.body

  if (!['confirmed', 'cancelled', 'completed', 'no_show'].includes(status)) {
    throw new BadRequestError('INVALID_STATUS')
  }

  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  const previousStatus = booking.status

  // Add modification record
  booking.modifications.push({
    modifiedAt: new Date(),
    modifiedBy: req.user?._id,
    type: 'status',
    description: `Status changed from ${previousStatus} to ${status}`,
    previousValue: previousStatus,
    newValue: status
  })

  booking.status = status
  await booking.save()

  res.json({
    success: true,
    data: {
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      previousStatus
    }
  })
})

/**
 * Cancel booking
 * POST /api/bookings/:id/cancel
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { id } = req.params
  const { reason } = req.body

  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  }).populate('hotel', 'policies')

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Check if cancellation is allowed
  const canCancelResult = booking.canCancel()
  if (!canCancelResult.allowed) {
    throw new BadRequestError(canCancelResult.reason || 'CANCELLATION_NOT_ALLOWED')
  }

  // Calculate refund based on cancellation policy
  const checkIn = new Date(booking.checkIn)
  const now = new Date()
  const daysBeforeCheckIn = Math.floor((checkIn - now) / (1000 * 60 * 60 * 24))

  let refundPercent = 0
  if (
    booking.hotel?.policies?.freeCancellation?.enabled &&
    daysBeforeCheckIn >= (booking.hotel.policies.freeCancellation.daysBeforeCheckIn || 1)
  ) {
    refundPercent = 100
  } else if (booking.hotel?.policies?.cancellationRules?.length > 0) {
    // Find applicable rule
    const sortedRules = [...booking.hotel.policies.cancellationRules].sort(
      (a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn
    )
    for (const rule of sortedRules) {
      if (daysBeforeCheckIn >= rule.daysBeforeCheckIn) {
        refundPercent = rule.refundPercent
        break
      }
    }
  }

  const refundAmount = (booking.payment.paidAmount || 0) * (refundPercent / 100)

  // Update booking
  booking.status = 'cancelled'
  booking.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: req.user?._id,
    reason,
    refundAmount,
    refundStatus: refundAmount > 0 ? 'pending' : undefined,
    policy: {
      daysBeforeCheckIn,
      refundPercent
    }
  }

  // Add modification record
  booking.modifications.push({
    modifiedAt: new Date(),
    modifiedBy: req.user?._id,
    type: 'status',
    description: `Booking cancelled. Reason: ${reason || 'Not specified'}`,
    previousValue: booking.status,
    newValue: 'cancelled'
  })

  await booking.save()

  // Release allotment
  for (const room of booking.rooms) {
    const dates = room.dailyBreakdown.map(d => d.date)
    try {
      await pricingService.releaseAllotment({
        hotelId: booking.hotel._id?.toString() || booking.hotel.toString(),
        roomTypeId: room.roomType.toString(),
        mealPlanId: room.mealPlan.toString(),
        marketId: booking.market.toString(),
        dates,
        rooms: 1
      })
    } catch (error) {
      logger.error('Allotment release error:', error.message)
    }
  }

  res.json({
    success: true,
    data: {
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      cancellation: {
        cancelledAt: booking.cancellation.cancelledAt,
        reason: booking.cancellation.reason,
        refundPercent,
        refundAmount,
        refundStatus: booking.cancellation.refundStatus
      }
    }
  })
})

/**
 * Hard delete booking (superadmin only)
 * DELETE /api/bookings/:id
 */
export const deleteBooking = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  // Check if user is platform admin (superadmin)
  if (req.user?.accountType !== 'platform' || req.user?.role !== 'admin') {
    throw new BadRequestError('SUPERADMIN_REQUIRED')
  }

  const { id } = req.params

  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Release allotment if booking was confirmed
  if (['pending', 'confirmed'].includes(booking.status)) {
    for (const room of booking.rooms || []) {
      const dates = (room.dailyBreakdown || []).map(d => d.date)
      if (dates.length > 0) {
        try {
          await pricingService.releaseAllotment({
            hotelId: booking.hotel?.toString(),
            roomTypeId: room.roomType?.toString(),
            mealPlanId: room.mealPlan?.toString(),
            marketId: booking.market?.toString(),
            dates,
            rooms: 1
          })
        } catch (error) {
          logger.error('Allotment release error during delete:', error.message)
        }
      }
    }
  }

  // CASCADE DELETE: Delete related payments and payment links to prevent orphan data
  const deletedPayments = await Payment.deleteMany({ booking: id })
  const deletedPaymentLinks = await PaymentLink.deleteMany({ booking: id })

  logger.info(`Cascade delete: ${deletedPayments.deletedCount} payments, ${deletedPaymentLinks.deletedCount} payment links`)

  // Hard delete the booking
  await Booking.findByIdAndDelete(id)

  logger.info(`Booking ${booking.bookingNumber} permanently deleted by ${req.user?.email}`)

  res.json({
    success: true,
    message: 'BOOKING_DELETED',
    data: {
      bookingNumber: booking.bookingNumber
    }
  })
})

/**
 * Add note to booking
 * POST /api/bookings/:id/notes
 */
export const addBookingNote = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { id } = req.params
  const { content, isInternal = true } = req.body

  if (!content) {
    throw new BadRequestError('NOTE_CONTENT_REQUIRED')
  }

  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  booking.notes.push({
    createdAt: new Date(),
    createdBy: req.user?._id,
    content,
    isInternal
  })

  await booking.save()

  res.json({
    success: true,
    data: {
      _id: booking._id,
      notes: booking.notes
    }
  })
})

/**
 * Create booking with payment link
 * POST /api/bookings/with-payment-link
 * Creates a booking and generates a payment link for credit card payment
 */
export const createBookingWithPaymentLink = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const {
    hotelId,
    marketId,
    checkIn,
    checkOut,
    rooms,
    contact,
    billing,
    specialRequests,
    salesChannel = 'b2c',
    sendEmail = true,
    sendSms = false
  } = req.body

  // Validate hotel
  const hotel = await Hotel.findOne({
    _id: hotelId,
    partner: partnerId,
    status: 'active'
  })
    .select('_id partner name slug code pricingSettings')
    .lean()

  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Validate dates
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (checkInDate < today) {
    throw new BadRequestError('CHECK_IN_MUST_BE_FUTURE')
  }

  if (checkOutDate <= checkInDate) {
    throw new BadRequestError('INVALID_DATE_RANGE')
  }

  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
  if (nights > 30) {
    throw new BadRequestError('MAX_30_NIGHTS')
  }

  // Validate contact
  if (!contact?.email || !contact?.phone) {
    throw new BadRequestError('CONTACT_INFO_REQUIRED')
  }

  // Validate rooms
  if (!rooms || rooms.length === 0) {
    throw new BadRequestError('ROOMS_REQUIRED')
  }

  // Get market
  let market
  if (marketId) {
    market = await Market.findOne({
      _id: marketId,
      hotel: hotel._id,
      status: 'active'
    }).lean()
  }
  if (!market) {
    market = await Market.findOne({
      hotel: hotel._id,
      isDefault: true,
      status: 'active'
    }).lean()
  }
  if (!market) {
    throw new NotFoundError('NO_MARKET_AVAILABLE')
  }

  // Process rooms and calculate prices
  const processedRooms = []
  let totalAdults = 0
  let totalChildren = 0
  let totalInfants = 0
  let subtotal = 0
  let totalDiscount = 0

  for (const room of rooms) {
    // Get room type
    const roomType = await RoomType.findOne({
      _id: room.roomTypeId,
      hotel: hotel._id,
      status: 'active'
    }).lean()

    if (!roomType) {
      throw new NotFoundError(`ROOM_TYPE_NOT_FOUND: ${room.roomTypeId}`)
    }

    // Get meal plan
    const mealPlan = await MealPlan.findOne({
      _id: room.mealPlanId,
      hotel: hotel._id,
      status: 'active'
    }).lean()

    if (!mealPlan) {
      throw new NotFoundError(`MEAL_PLAN_NOT_FOUND: ${room.mealPlanId}`)
    }

    const adults = room.adults || 2
    const children = room.children || []

    // Calculate price
    const priceResult = await pricingService.calculatePriceWithCampaigns({
      hotelId: hotel._id.toString(),
      roomTypeId: roomType._id.toString(),
      mealPlanId: mealPlan._id.toString(),
      marketId: market._id.toString(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults,
      children: children.map(age => ({ age })),
      includeCampaigns: true
    })

    if (!priceResult.availability?.isAvailable) {
      const issues = priceResult.availability?.issues || []
      throw new BadRequestError(
        `ROOM_NOT_AVAILABLE: ${roomType.name?.tr || roomType.code}. ${issues[0]?.message || ''}`
      )
    }

    // Determine display price based on sales channel
    const channelPrice = salesChannel === 'b2b'
      ? priceResult.pricing.b2bPrice
      : priceResult.pricing.b2cPrice

    // Build room booking
    const roomBooking = {
      roomType: roomType._id,
      roomTypeCode: roomType.code,
      roomTypeName: roomType.name,
      mealPlan: mealPlan._id,
      mealPlanCode: mealPlan.code,
      mealPlanName: mealPlan.name,
      guests: sanitizeRoomGuests(room.guests),
      pricing: {
        currency: market.currency,
        originalTotal: priceResult.pricing.originalTotal,
        discount: priceResult.pricing.totalDiscount,
        finalTotal: channelPrice,
        avgPerNight: channelPrice / nights
      },
      dailyBreakdown: priceResult.dailyBreakdown,
      campaigns: priceResult.campaigns.applied,
      specialRequests: room.specialRequests
    }

    processedRooms.push(roomBooking)

    // Update totals with channel-specific prices
    totalAdults += adults
    totalChildren += children.filter(age => age >= 2).length
    totalInfants += children.filter(age => age < 2).length
    subtotal += priceResult.pricing.originalTotal
    totalDiscount += (priceResult.pricing.originalTotal - channelPrice)
  }

  // Calculate final pricing
  const grandTotal = subtotal - totalDiscount
  const taxRate = hotel.pricingSettings?.taxRate || 0
  const tax = hotel.pricingSettings?.taxIncluded ? 0 : (grandTotal * taxRate) / 100
  const finalTotal = grandTotal + tax

  // Get primary season from first room's first day
  let primarySeason = null
  if (processedRooms[0]?.dailyBreakdown?.[0]?.season) {
    primarySeason = processedRooms[0].dailyBreakdown[0].season
  }

  // Generate booking number
  const bookingNumber = await Booking.generateBookingNumber(partnerId)

  // Get lead guest
  let leadGuest = null
  for (const room of rooms) {
    if (room.guests) {
      leadGuest = room.guests.find(g => g.isLead)
      if (leadGuest) break
    }
  }
  if (!leadGuest && rooms[0]?.guests?.[0]) {
    leadGuest = { ...rooms[0].guests[0], isLead: true }
  }
  if (!leadGuest) {
    leadGuest = {
      firstName: contact.firstName || 'Guest',
      lastName: contact.lastName || '',
      type: 'adult',
      isLead: true
    }
  }

  // Create booking
  const booking = new Booking({
    bookingNumber,
    partner: partnerId,
    hotel: hotel._id,
    hotelCode: hotel.slug || hotel.code,
    hotelName: hotel.name,
    market: market._id,
    marketCode: market.code,
    marketName: market.name,
    season: primarySeason?._id,
    seasonCode: primarySeason?.code,
    seasonName: primarySeason?.name,
    salesChannel,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    nights,
    rooms: processedRooms,
    totalRooms: processedRooms.length,
    totalAdults,
    totalChildren,
    totalInfants,
    leadGuest: sanitizeGuest(leadGuest),
    contact: {
      email: contact.email,
      phone: contact.phone,
      countryCode: contact.countryCode
    },
    billing,
    pricing: {
      currency: market.currency,
      subtotal,
      totalDiscount,
      tax,
      taxRate,
      grandTotal: finalTotal
    },
    payment: {
      status: 'pending',
      method: 'credit_card',
      dueAmount: finalTotal
    },
    status: 'pending',
    source: getSourceInfo(req),
    specialRequests
  })

  await booking.save()

  // Reserve allotment for all rooms/dates
  for (const room of processedRooms) {
    const dates = room.dailyBreakdown.map(d => d.date)
    try {
      await pricingService.reserveAllotment({
        hotelId: hotel._id.toString(),
        roomTypeId: room.roomType.toString(),
        mealPlanId: room.mealPlan.toString(),
        marketId: market._id.toString(),
        dates,
        rooms: 1
      })
    } catch (error) {
      logger.error('Allotment reservation error:', error.message)
    }
  }

  // Get partner info for payment link
  const partner = await Partner.findById(partnerId).lean()

  // Create payment link (expires in 30 days)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  // Create Payment record first (so we can link it to PaymentLink)
  const payment = new Payment({
    partner: partnerId,
    booking: booking._id,
    type: 'credit_card',
    amount: finalTotal,
    currency: market.currency,
    status: 'pending',
    cardDetails: {
      linkExpiresAt: expiresAt
    },
    createdBy: req.user._id
  })
  await payment.save()

  // Build customer name with fallback
  const customerName = `${leadGuest.firstName || ''} ${leadGuest.lastName || ''}`.trim() || 'Müşteri'

  const paymentLink = await PaymentLink.create({
    partner: partnerId,
    customer: {
      name: customerName,
      email: contact.email,
      phone: contact.phone
    },
    description: `${hotel.name?.tr || hotel.name?.en || bookingNumber} - ${nights} gece konaklama`,
    amount: finalTotal,
    currency: market.currency,
    installment: {
      enabled: true,
      maxCount: 6,
      rates: {}
    },
    booking: booking._id,
    linkedPayment: payment._id,
    expiresAt,
    createdBy: req.user._id
  })

  // Update booking with payment link reference
  booking.payment.paymentLinkId = paymentLink._id
  booking.payment.paymentLinkToken = paymentLink.token
  await booking.save()

  // Update Payment with paymentLink reference
  payment.cardDetails.paymentLink = paymentLink._id
  payment.cardDetails.linkSentAt = new Date()
  await payment.save()

  // Update booking payment summary (adds payment to booking.payment.payments array)
  const { updateBookingPayment } = await import('./payment.service.js')
  await updateBookingPayment(booking._id)

  // Send notification
  if (sendEmail || sendSms) {
    try {
      const companyName = partner?.companyName || process.env.PLATFORM_NAME || 'MaxiRez'
      const formattedAmount = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(finalTotal)
      const currencySymbol = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }[market.currency] || market.currency
      const formattedExpiry = new Date(expiresAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })

      const notificationData = {
        CUSTOMER_NAME: customerName,
        DESCRIPTION: `${hotel.name?.tr || hotel.name?.en || bookingNumber} - ${nights} gece konaklama`,
        AMOUNT: `${currencySymbol}${formattedAmount}`,
        CURRENCY: market.currency,
        PAYMENT_URL: paymentLink.paymentUrl,
        EXPIRY_DATE: formattedExpiry,
        COMPANY_NAME: companyName,
        BOOKING_NUMBER: bookingNumber,
        customerName,
        amount: finalTotal,
        currency: market.currency,
        paymentUrl: paymentLink.paymentUrl,
        expiresAt,
        companyName
      }

      if (sendEmail && contact.email) {
        await notificationService.send({
          type: 'payment_link',
          recipient: {
            email: contact.email,
            name: customerName
          },
          data: {
            subject: `Ödeme Linki - ${bookingNumber}`,
            ...notificationData
          },
          channels: ['email'],
          partnerId,
          relatedTo: { model: 'PaymentLink', id: paymentLink._id }
        })
        await paymentLink.recordNotification('email')
      }

      if (sendSms && contact.phone) {
        await notificationService.send({
          type: 'payment_link',
          recipient: {
            phone: contact.phone,
            name: customerName
          },
          data: notificationData,
          channels: ['sms'],
          partnerId,
          relatedTo: { model: 'PaymentLink', id: paymentLink._id }
        })
        await paymentLink.recordNotification('sms')
      }
    } catch (error) {
      logger.error('Failed to send payment link notification:', error.message)
    }
  }

  // Populate for response
  await booking.populate('hotel', 'name slug')

  res.status(201).json({
    success: true,
    data: {
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        hotel: {
          _id: booking.hotel._id,
          name: booking.hotel.name,
          slug: booking.hotel.slug
        },
        checkIn: booking.formattedCheckIn,
        checkOut: booking.formattedCheckOut,
        nights: booking.nights,
        rooms: booking.totalRooms,
        guests: {
          adults: booking.totalAdults,
          children: booking.totalChildren
        },
        pricing: booking.pricing,
        payment: booking.payment
      },
      paymentLink: {
        _id: paymentLink._id,
        linkNumber: paymentLink.linkNumber,
        token: paymentLink.token,
        paymentUrl: paymentLink.paymentUrl,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        expiresAt: paymentLink.expiresAt,
        status: paymentLink.status,
        notifications: paymentLink.notifications
      }
    }
  })
})
