/**
 * Booking CRUD Service
 * Core booking CRUD operations
 * Split from booking.service.js for better maintainability
 */

import { asyncHandler } from '../../helpers/asyncHandler.js'
import Hotel from '../hotel/hotel.model.js'
import RoomType from '../planning/roomType.model.js'
import MealPlan from '../planning/mealPlan.model.js'
import Market from '../planning/market.model.js'
import Booking from './booking.model.js'
import pricingService from '../../services/pricingService.js'
import { BadRequestError, NotFoundError } from '../../core/errors.js'
import { emitReservationUpdate, getGuestDisplayName } from '../pms/pmsSocket.js'
import logger from '../../core/logger.js'
import { getPartnerId, getSourceInfo } from '../../services/helpers.js'
import { sanitizeGuest, sanitizeRoomGuests, createGuestFromBooking } from './helpers.js'

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
    sort = '-createdAt'
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
    query.$or = [
      { bookingNumber: { $regex: search, $options: 'i' } },
      { 'contact.email': { $regex: search, $options: 'i' } },
      { 'leadGuest.firstName': { $regex: search, $options: 'i' } },
      { 'leadGuest.lastName': { $regex: search, $options: 'i' } },
      { hotelName: { $regex: search, $options: 'i' } }
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

  // Sort
  let sortOption = { createdAt: -1 }
  if (sort === 'checkIn') sortOption = { checkIn: 1 }
  if (sort === '-checkIn') sortOption = { checkIn: -1 }
  if (sort === 'createdAt') sortOption = { createdAt: 1 }
  if (sort === 'grandTotal') sortOption = { 'pricing.grandTotal': -1 }

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .select(
        'bookingNumber status hotel hotelName hotelCode checkIn checkOut nights totalRooms totalAdults totalChildren leadGuest contact pricing payment source expiresAt lastActivityAt createdAt rooms.roomTypeName rooms.roomTypeCode rooms.mealPlanName rooms.mealPlanCode rooms.pricing rooms.rateType rooms.nonRefundableDiscount market marketCode marketName season seasonCode seasonName modifications'
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

  // Map bookings for response
  const mappedBookings = bookings.map(b => ({
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
      status: b.payment?.status,
      paidAmount: b.payment?.paidAmount || 0
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
    modifications: b.modifications || []
  }))

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

  res.json({
    success: true,
    data: booking
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

  // Emit socket event for PMS real-time updates
  emitReservationUpdate(booking.hotel._id?.toString() || hotel._id.toString(), 'created', {
    reservationId: booking._id,
    bookingNumber: booking.bookingNumber,
    guestName: getGuestDisplayName(booking.leadGuest),
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    roomType: booking.rooms[0]?.roomType,
    status: booking.status,
    source: booking.source?.type || 'admin'
  })

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

  // Emit socket event for PMS real-time updates
  const hotelId = booking.hotel?._id?.toString() || booking.hotel?.toString()
  if (hotelId) {
    emitReservationUpdate(hotelId, status === 'confirmed' ? 'confirmed' : 'updated', {
      reservationId: booking._id,
      bookingNumber: booking.bookingNumber,
      guestName: getGuestDisplayName(booking.leadGuest),
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      roomType: booking.rooms[0]?.roomType,
      status: booking.status,
      previousStatus
    })
  }

  // Create PMS guest record when booking is confirmed
  if (status === 'confirmed') {
    await createGuestFromBooking(booking)
  }

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

  // Emit socket event for PMS real-time updates
  const hotelId = booking.hotel?._id?.toString() || booking.hotel?.toString()
  if (hotelId) {
    emitReservationUpdate(hotelId, 'cancelled', {
      reservationId: booking._id,
      bookingNumber: booking.bookingNumber,
      guestName: getGuestDisplayName(booking.leadGuest),
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      roomType: booking.rooms[0]?.roomType,
      status: 'cancelled',
      reason: reason || 'Not specified'
    })
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
