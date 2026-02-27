/**
 * Public Booking Service
 * Booking creation, retrieval, and cancellation for B2C
 */

import { asyncHandler } from '#helpers'
import Hotel from '../hotel/hotel.model.js'
import RoomType from '../planning/roomType.model.js'
import MealPlan from '../planning/mealPlan.model.js'
import Market from '../planning/market.model.js'
import Booking from '../booking/booking.model.js'
import Payment from '../booking/payment.model.js'
import { updateBookingPayment } from '../booking/payment.service.js'
import pricingService from '#services/pricingService.js'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import { GUEST_PLACEHOLDER_NAME } from '#constants/defaults.js'
import logger from '#core/logger.js'

/**
 * Find market for hotel by country code
 * @private
 */
async function findMarket(hotelId, countryCode) {
  let market = null

  if (countryCode) {
    market = await Market.findOne({
      hotel: hotelId,
      countries: countryCode.toUpperCase(),
      status: 'active'
    }).lean()
  }

  if (!market) {
    market = await Market.findOne({
      hotel: hotelId,
      isDefault: true,
      status: 'active'
    }).lean()
  }

  return market
}

/**
 * Create a new booking
 * POST /public/bookings
 * Body: { hotelCode, checkIn, checkOut, rooms: [{ roomTypeCode, mealPlanCode, adults, children, guests }], contact, billing, specialRequests }
 */
export const createBooking = asyncHandler(async (req, res) => {
  const {
    hotelCode,
    checkIn,
    checkOut,
    rooms,
    contact,
    billing,
    specialRequests,
    countryCode,
    paymentMethod,
    guestLanguage,
    campaignCode,
    cancellationGuarantee: cancellationGuaranteeInput
  } = req.body

  // Validate hotel (hotelCode can be slug or _id)
  const hotelQuery = { status: 'active' }
  if (hotelCode.match(/^[0-9a-fA-F]{24}$/)) {
    hotelQuery._id = hotelCode
  } else {
    hotelQuery.slug = hotelCode.toLowerCase()
  }
  const hotel = await Hotel.findOne(hotelQuery)
    .select(
      '_id partner name slug pricingSettings policies.freeCancellation policies.cancellationRules'
    )
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

  // Find market
  const market = await findMarket(hotel._id, countryCode)
  if (!market) {
    throw new NotFoundError('NO_MARKET_AVAILABLE')
  }

  // Process rooms and calculate prices
  const processedRooms = []
  let totalAdults = 0
  let totalChildren = 0
  const totalInfants = 0
  let subtotal = 0
  let totalDiscount = 0

  for (const room of rooms) {
    // Get room type
    const roomType = await RoomType.findOne({
      hotel: hotel._id,
      code: room.roomTypeCode.toUpperCase(),
      status: 'active'
    }).lean()

    if (!roomType) {
      throw new NotFoundError(`ROOM_TYPE_NOT_FOUND: ${room.roomTypeCode}`)
    }

    // Get meal plan
    const mealPlan = await MealPlan.findOne({
      hotel: hotel._id,
      code: room.mealPlanCode.toUpperCase(),
      status: 'active'
    }).lean()

    if (!mealPlan) {
      throw new NotFoundError(`MEAL_PLAN_NOT_FOUND: ${room.mealPlanCode}`)
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
      includeCampaigns: true,
      campaignCode: campaignCode || null
    })

    if (!priceResult.availability?.isAvailable) {
      throw new BadRequestError(`ROOM_NOT_AVAILABLE: ${room.roomTypeCode}`)
    }

    // Build room booking
    const roomBooking = {
      roomType: roomType._id,
      roomTypeCode: roomType.code,
      roomTypeName: roomType.name,
      mealPlan: mealPlan._id,
      mealPlanCode: mealPlan.code,
      mealPlanName: mealPlan.name,
      guests: room.guests || [],
      pricing: {
        currency: market.currency,
        originalTotal: priceResult.pricing.b2cOriginalTotal,
        discount: priceResult.pricing.b2cTotalDiscount,
        finalTotal: priceResult.pricing.b2cPrice,
        avgPerNight: priceResult.pricing.perNight.b2cPrice
      },
      dailyBreakdown: priceResult.dailyBreakdown,
      campaigns: priceResult.campaigns.applied,
      specialRequests: room.specialRequests
    }

    // Cancellation policy snapshot
    const useHotelPolicy = market.cancellationPolicy?.useHotelPolicy !== false
    const cpSource = useHotelPolicy
      ? { fc: hotel.policies?.freeCancellation, rules: hotel.policies?.cancellationRules }
      : { fc: market.cancellationPolicy?.freeCancellation, rules: market.cancellationPolicy?.rules }
    roomBooking.cancellationPolicy = {
      isRefundable: cpSource.fc?.enabled || (cpSource.rules || []).some(r => r.refundPercent > 0),
      freeCancellation: {
        enabled: cpSource.fc?.enabled || false,
        daysBeforeCheckIn: cpSource.fc?.daysBeforeCheckIn || 0
      },
      rules: (cpSource.rules || []).map(r => ({
        daysBeforeCheckIn: r.daysBeforeCheckIn,
        refundPercent: r.refundPercent
      }))
    }

    processedRooms.push(roomBooking)

    // Update totals
    totalAdults += adults
    totalChildren += children.length
    subtotal += priceResult.pricing.b2cOriginalTotal
    totalDiscount += priceResult.pricing.b2cTotalDiscount
  }

  // Calculate final pricing
  const grandTotal = subtotal - totalDiscount
  const taxRate = hotel.pricingSettings?.taxRate || 0
  const tax = hotel.pricingSettings?.taxIncluded ? 0 : (grandTotal * taxRate) / 100

  // Calculate cancellation guarantee
  // lean() bypasses Mongoose defaults - treat missing guaranteePackage as enabled with 1% rate
  const gp = market.cancellationPolicy?.guaranteePackage
  const gpEnabled = gp ? gp.enabled !== false : true
  let guaranteeData = null
  let guaranteeAmount = 0
  if (cancellationGuaranteeInput?.purchased && gpEnabled) {
    const rate = gp?.rate ?? 1
    guaranteeAmount = Math.round((grandTotal * rate) / 100)
    guaranteeData = {
      purchased: true,
      rate,
      amount: guaranteeAmount,
      currency: market.currency
    }
  }

  // Generate booking number
  const bookingNumber = await Booking.generateBookingNumber(hotel.partner)

  // Create booking
  const publicFinalTotal = grandTotal + tax + guaranteeAmount

  const booking = new Booking({
    bookingNumber,
    partner: hotel.partner,
    hotel: hotel._id,
    hotelCode: hotel.slug,
    hotelName: hotel.name,
    market: market._id,
    marketCode: market.code,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    nights,
    rooms: processedRooms,
    totalRooms: processedRooms.length,
    totalAdults,
    totalChildren,
    totalInfants,
    leadGuest: rooms[0]?.guests?.find(g => g.isLead) ||
      rooms[0]?.guests?.[0] || {
        firstName: contact.firstName || GUEST_PLACEHOLDER_NAME,
        lastName: contact.lastName || '',
        isLead: true
      },
    contact: {
      email: contact.email,
      phone: contact.phone,
      countryCode: countryCode || contact.countryCode
    },
    billing,
    ...(guaranteeData && { cancellationGuarantee: guaranteeData }),
    pricing: {
      currency: market.currency,
      subtotal,
      totalDiscount,
      tax,
      taxRate,
      grandTotal: publicFinalTotal
    },
    payment: {
      status: 'pending',
      method: paymentMethod || 'credit_card',
      dueAmount: publicFinalTotal,
      ...(market.paymentTerms?.prepaymentRequired && {
        paymentTerms: {
          prepaymentRequired: true,
          prepaymentPercentage: market.paymentTerms.prepaymentPercentage || 30,
          remainingPayment: market.paymentTerms.remainingPayment || null
        }
      })
    },
    status: 'pending',
    source: {
      type: 'b2c',
      sessionId: req.headers['x-session-id'],
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    },
    specialRequests,
    ...(guestLanguage && { guestLanguage })
  })

  await booking.save()

  // Reserve allotment for all rooms/dates
  for (const room of processedRooms) {
    const dates = room.dailyBreakdown.map(d => d.date)
    await pricingService.reserveAllotment({
      hotelId: hotel._id.toString(),
      roomTypeId: room.roomType.toString(),
      mealPlanId: room.mealPlan.toString(),
      marketId: market._id.toString(),
      dates,
      rooms: 1
    })
  }

  // Create pending Payment record for non-card methods (bank_transfer, pay_at_checkin)
  // For credit_card: Payment record is created via widget PaymentView → 3D Secure → webhook
  if (paymentMethod === 'bank_transfer' || paymentMethod === 'pay_at_checkin') {
    try {
      const pendingPayment = new Payment({
        partner: hotel.partner,
        booking: booking._id,
        type: paymentMethod,
        amount: publicFinalTotal,
        currency: market.currency,
        status: 'pending'
      })
      await pendingPayment.save()
      await updateBookingPayment(booking._id)
    } catch (paymentErr) {
      logger.error('[PublicBooking] Failed to create pending payment:', paymentErr.message)
    }
  }

  // Send automatic booking emails (non-blocking)
  // For credit_card: emails are sent after payment completes (via webhook)
  // For pay_at_hotel and bank_transfer: send immediately
  if (paymentMethod !== 'credit_card') {
    try {
      const { sendAutomaticBookingEmails } = await import('../booking/email.service.js')
      // Don't await - fire and forget to not delay the response
      sendAutomaticBookingEmails(booking._id, {
        trigger: 'creation'
      }).catch(err => logger.error('[PublicBooking] Auto email failed:', err.message))
    } catch (err) {
      logger.error('[PublicBooking] Failed to import email service:', err.message)
    }
  }

  res.status(201).json({
    success: true,
    data: {
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      hotel: {
        name: hotel.name,
        slug: hotel.slug
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
 * Get booking by reference number
 * GET /public/bookings/:bookingNumber
 * Query: { email }
 */
export const getBooking = asyncHandler(async (req, res) => {
  const { bookingNumber } = req.params
  const { email } = req.query

  if (!email) {
    throw new BadRequestError('EMAIL_REQUIRED')
  }

  const booking = await Booking.findByBookingNumber(bookingNumber)
    .populate('hotel', 'name slug address images')
    .populate('rooms.roomType', 'name code images')
    .populate('rooms.mealPlan', 'name code')

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Verify email matches
  if (booking.contact.email.toLowerCase() !== email.toLowerCase()) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  res.json({
    success: true,
    data: {
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      hotel: {
        name: booking.hotel?.name || booking.hotelName,
        slug: booking.hotel?.slug || booking.hotelCode,
        address: booking.hotel?.address,
        image: booking.hotel?.images?.find(img => img.isMain)?.url
      },
      checkIn: booking.formattedCheckIn,
      checkOut: booking.formattedCheckOut,
      nights: booking.nights,
      rooms: booking.rooms.map(r => ({
        roomType: {
          name: r.roomTypeName || r.roomType?.name,
          code: r.roomTypeCode
        },
        mealPlan: {
          name: r.mealPlanName || r.mealPlan?.name,
          code: r.mealPlanCode
        },
        guests: r.guests,
        pricing: r.pricing
      })),
      guests: {
        adults: booking.totalAdults,
        children: booking.totalChildren,
        lead: booking.leadGuest
      },
      contact: booking.contact,
      pricing: booking.pricing,
      payment: {
        status: booking.payment.status,
        paidAmount: booking.payment.paidAmount,
        dueAmount: booking.payment.dueAmount
      },
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt,
      confirmedAt: booking.confirmedAt,
      cancellation:
        booking.status === 'cancelled'
          ? {
              cancelledAt: booking.cancellation?.cancelledAt,
              reason: booking.cancellation?.reason,
              refundAmount: booking.cancellation?.refundAmount
            }
          : undefined
    }
  })
})

/**
 * Request booking cancellation
 * POST /public/bookings/:bookingNumber/cancel
 * Body: { email, reason }
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingNumber } = req.params
  const { email, reason } = req.body

  if (!email) {
    throw new BadRequestError('EMAIL_REQUIRED')
  }

  const booking = await Booking.findByBookingNumber(bookingNumber).populate('hotel', 'policies')

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Verify email matches
  if (booking.contact.email.toLowerCase() !== email.toLowerCase()) {
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
    refundPercent = booking.hotel.calculateRefund?.(daysBeforeCheckIn) || 0
  }

  // If cancellation guarantee purchased, override to full refund (on refundable amount)
  if (booking.cancellationGuarantee?.purchased && refundPercent < 100) {
    refundPercent = 100
  }

  // Deduct guarantee amount from refundable base
  const guaranteeAmount = booking.cancellationGuarantee?.purchased
    ? booking.cancellationGuarantee.amount || 0
    : 0
  const refundableAmount = (booking.payment.paidAmount || 0) - guaranteeAmount
  const refundAmount = Math.max(0, refundableAmount * (refundPercent / 100))

  // Update booking
  booking.status = 'cancelled'
  booking.cancellation = {
    cancelledAt: new Date(),
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
    type: 'status',
    description: 'Booking cancelled by guest',
    previousValue: 'pending',
    newValue: 'cancelled'
  })

  await booking.save()

  // Release allotment
  for (const room of booking.rooms) {
    const dates = room.dailyBreakdown.map(d => d.date)
    await pricingService.releaseAllotment({
      hotelId: booking.hotel._id?.toString() || booking.hotel.toString(),
      roomTypeId: room.roomType.toString(),
      mealPlanId: room.mealPlan.toString(),
      marketId: booking.market.toString(),
      dates,
      rooms: 1
    })
  }

  res.json({
    success: true,
    data: {
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
