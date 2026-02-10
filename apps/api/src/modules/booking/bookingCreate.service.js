/**
 * Booking Create Service
 * Handles booking creation logic (with and without payment links)
 */

import { asyncHandler, withTransaction } from '#helpers'
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

/**
 * Create booking
 * POST /api/bookings
 */
export const createBooking = asyncHandler(async (req, res) => {
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
    salesChannel = 'b2c'
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
    const channelPrice =
      salesChannel === 'b2b' ? priceResult.pricing.b2bPrice : priceResult.pricing.b2cPrice

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
    totalDiscount += priceResult.pricing.originalTotal - channelPrice
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

  // Duplicate check - prevent double submission within 2 minutes
  const recentDuplicate = await Booking.findOne({
    partner: partnerId,
    hotel: hotel._id,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    'contact.email': contact.email,
    status: { $nin: ['cancelled'] },
    createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
  }).lean()
  if (recentDuplicate) {
    throw new BadRequestError('DUPLICATE_BOOKING')
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
      firstName: contact.firstName || 'Misafir',
      lastName: contact.lastName || '-',
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
    const channelPrice =
      salesChannel === 'b2b' ? priceResult.pricing.b2bPrice : priceResult.pricing.b2cPrice

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
    totalDiscount += priceResult.pricing.originalTotal - channelPrice
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

  // Duplicate check - prevent double submission within 2 minutes
  const recentDuplicate = await Booking.findOne({
    partner: partnerId,
    hotel: hotel._id,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    'contact.email': contact.email,
    status: { $nin: ['cancelled'] },
    createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
  }).lean()
  if (recentDuplicate) {
    throw new BadRequestError('DUPLICATE_BOOKING')
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
      firstName: contact.firstName || 'Misafir',
      lastName: contact.lastName || '-',
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

  // Get partner info for payment link
  const partner = await Partner.findById(partnerId).lean()

  // Create payment link (expires in 30 days)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  // Build customer name with fallback
  const customerName =
    `${leadGuest.firstName || ''} ${leadGuest.lastName || ''}`.trim() || 'Müşteri'

  // Wrap critical save operations in a transaction (graceful fallback on standalone)
  const { payment, paymentLink } = await withTransaction(async session => {
    const opts = session ? { session } : {}

    // 1. Save booking
    await booking.save(opts)

    // 2. Create payment record
    const _payment = new Payment({
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
    await _payment.save(opts)

    // 3. Create payment link
    const [_paymentLink] = await PaymentLink.create(
      [
        {
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
          linkedPayment: _payment._id,
          expiresAt,
          createdBy: req.user._id
        }
      ],
      opts
    )

    // 4. Update booking with payment link reference
    booking.payment.paymentLinkId = _paymentLink._id
    booking.payment.paymentLinkToken = _paymentLink.token
    await booking.save(opts)

    // 5. Update payment with paymentLink reference
    _payment.cardDetails.paymentLink = _paymentLink._id
    _payment.cardDetails.linkSentAt = new Date()
    await _payment.save(opts)

    return { payment: _payment, paymentLink: _paymentLink }
  })

  // Reserve allotment for all rooms/dates (best-effort, outside transaction)
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

  // Update booking payment summary (outside transaction - self-contained atomic op)
  const { updateBookingPayment } = await import('./payment.service.js')
  await updateBookingPayment(booking._id)

  // Send notification
  if (sendEmail || sendSms) {
    try {
      const companyName = partner?.companyName || process.env.PLATFORM_NAME || 'MaxiRez'
      const formattedAmount = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(
        finalTotal
      )
      const currencySymbol =
        { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }[market.currency] || market.currency
      const formattedExpiry = new Date(expiresAt).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })

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
