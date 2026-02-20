/**
 * Drafts Service
 * Draft booking management operations
 * Split from booking.service.js for better maintainability
 */

import { asyncHandler } from '#helpers'
import Hotel from '../hotel/hotel.model.js'
import Market from '../planning/market.model.js'
import Booking from './booking.model.js'
import Payment from './payment.model.js'
import pricingService from '#services/pricingService.js'
import { BadRequestError, NotFoundError, ForbiddenError } from '#core/errors.js'
import logger from '#core/logger.js'
import { validateData } from '@booking-engine/validation/adapters/mongoose'
import {
  leadGuestSchema,
  roomGuestSchema,
  invoiceIndividualValidation,
  invoiceCorporateValidation,
  paymentValidationSchema,
  bookingValidationSchema
} from '@booking-engine/validation/schemas'
import { getPartnerId, getSourceInfo } from '#services/helpers.js'
import { sanitizeRoomGuests } from './helpers.js'
import { updateBookingPayment } from './payment.service.js'

// ==================== DRAFT BOOKING MANAGEMENT ====================

/**
 * Create a new draft booking
 * POST /api/bookings/drafts
 * Called when user proceeds from Phase 1 to Phase 2
 */
export const createDraft = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const {
    searchCriteria,
    hotel: hotelId,
    market: marketId,
    marketCode: requestMarketCode,
    rooms,
    checkIn,
    checkOut
  } = req.body

  // Validate hotel exists and belongs to partner
  const hotel = await Hotel.findOne({
    _id: hotelId,
    partner: partnerId,
    status: 'active'
  }).lean()

  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Get market - prefer the one passed from frontend (used during pricing)
  let market = null
  if (marketId) {
    market = await Market.findOne({
      _id: marketId,
      hotel: hotelId,
      status: 'active'
    }).lean()
  }

  // Fallback: try to find by country code
  if (!market && searchCriteria?.countryCode) {
    market = await Market.findOne({
      hotel: hotelId,
      countries: searchCriteria.countryCode.toUpperCase(),
      status: 'active'
    }).lean()
  }

  // Validate market is found
  if (!market) {
    throw new BadRequestError('MARKET_NOT_FOUND')
  }

  // Calculate totals
  const totalRooms = rooms?.length || 0
  const totalAdults = searchCriteria?.adults || 2
  const totalChildren = searchCriteria?.children?.length || 0

  // Calculate pricing totals from rooms
  let subtotal = 0
  let totalDiscount = 0
  let currency = 'TRY'
  if (rooms && rooms.length > 0) {
    rooms.forEach(room => {
      if (room.pricing) {
        subtotal += room.pricing.originalTotal || room.pricing.finalTotal || 0
        totalDiscount += room.pricing.totalDiscount || 0
        currency = room.pricing.currency || currency
        // Add custom discount
        if (room.customDiscount?.amount) {
          totalDiscount += room.customDiscount.amount
        }
      }
    })
  }

  // Generate draft booking number
  const bookingNumber = await Booking.generateBookingNumber(partnerId, 'draft')

  // Determine sales channel from request or searchCriteria
  // searchCriteria.channel is 'B2B' or 'B2C', salesChannel is 'b2b' or 'b2c'
  const salesChannel = req.body.salesChannel || searchCriteria?.channel?.toLowerCase() || 'b2c'

  // Create draft
  const draft = new Booking({
    bookingNumber,
    partner: partnerId,
    status: 'draft',
    currentPhase: 2,
    hotel: hotelId,
    hotelCode: hotel.code,
    hotelName: hotel.name?.tr || hotel.name?.en || hotel.name,
    market: market?._id,
    marketCode: market?.code,
    salesChannel, // Save sales channel for consistent pricing
    checkIn: checkIn || searchCriteria?.dateRange?.start,
    checkOut: checkOut || searchCriteria?.dateRange?.end,
    searchCriteria,
    rooms: rooms?.map(room => ({
      roomType: room.roomType,
      roomTypeCode: room.roomTypeCode,
      roomTypeName: room.roomTypeName,
      mealPlan: room.mealPlan,
      mealPlanCode: room.mealPlanCode,
      mealPlanName: room.mealPlanName,
      pricing: room.pricing,
      dailyBreakdown: room.dailyBreakdown,
      campaigns: room.campaigns,
      guests: [],
      // Rate type information
      rateType: room.rateType || 'refundable',
      nonRefundableDiscount: room.nonRefundableDiscount || 0,
      customDiscount: room.customDiscount || null,
      // Cancellation policy based on rate type
      cancellationPolicy: {
        isRefundable: room.rateType !== 'non_refundable'
      }
    })),
    totalRooms,
    totalAdults,
    totalChildren,
    pricing: {
      currency,
      subtotal,
      totalDiscount,
      grandTotal: subtotal - totalDiscount
    },
    source: getSourceInfo(req)
  })

  await draft.save()

  res.status(201).json({
    success: true,
    data: {
      bookingNumber: draft.bookingNumber,
      _id: draft._id,
      status: draft.status,
      currentPhase: draft.currentPhase,
      expiresAt: draft.expiresAt,
      hotel: {
        _id: hotel._id,
        name: hotel.name,
        code: hotel.code
      },
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      rooms: draft.rooms,
      pricing: draft.pricing
    }
  })
})

/**
 * Get user's draft bookings
 * GET /api/bookings/drafts
 */
export const getMyDrafts = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const query = {
    partner: partnerId,
    status: 'draft'
  }

  // If agency user, only show their drafts
  if (req.user?.accountType === 'agency') {
    query['source.agencyUserId'] = req.user._id
  }

  const drafts = await Booking.find(query)
    .populate('hotel', 'name code images')
    .sort({ lastActivityAt: -1 })
    .lean()

  res.json({
    success: true,
    data: drafts.map(d => ({
      bookingNumber: d.bookingNumber,
      _id: d._id,
      hotel: d.hotel,
      checkIn: d.checkIn,
      checkOut: d.checkOut,
      nights: d.nights,
      totalRooms: d.totalRooms,
      totalAdults: d.totalAdults,
      totalChildren: d.totalChildren,
      pricing: d.pricing,
      currentPhase: d.currentPhase,
      expiresAt: d.expiresAt,
      lastActivityAt: d.lastActivityAt,
      createdAt: d.createdAt
    }))
  })
})

/**
 * Get a single draft by booking number
 * GET /api/bookings/drafts/:bookingNumber
 */
export const getDraft = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { bookingNumber } = req.params

  const draft = await Booking.findOne({
    bookingNumber: bookingNumber.toUpperCase(),
    partner: partnerId,
    status: 'draft'
  })
    .populate('hotel', 'name code images address stars commission')
    .populate('rooms.roomType', 'name code images')
    .populate('rooms.mealPlan', 'name code')

  if (!draft) {
    throw new NotFoundError('DRAFT_NOT_FOUND')
  }

  // Check if agency user owns this draft
  if (req.user?.accountType === 'agency') {
    if (draft.source?.agencyUserId?.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('NOT_YOUR_DRAFT')
    }
  }

  res.json({
    success: true,
    data: draft
  })
})

/**
 * Update a draft booking
 * PUT /api/bookings/drafts/:bookingNumber
 * Used for auto-save in Phase 2
 */
export const updateDraft = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { bookingNumber } = req.params
  const {
    guests,
    leadGuest,
    invoiceDetails,
    contact,
    payment,
    specialRequests,
    rooms,
    cancellationGuarantee: cancellationGuaranteeInput
  } = req.body

  const draft = await Booking.findOne({
    bookingNumber: bookingNumber.toUpperCase(),
    partner: partnerId,
    status: 'draft'
  })

  if (!draft) {
    throw new NotFoundError('DRAFT_NOT_FOUND')
  }

  // Check ownership for agency users
  if (req.user?.accountType === 'agency') {
    if (draft.source?.agencyUserId?.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('NOT_YOUR_DRAFT')
    }
  }

  // Update fields
  if (leadGuest) draft.leadGuest = leadGuest
  if (contact) draft.contact = contact
  if (invoiceDetails) draft.invoiceDetails = invoiceDetails
  if (payment) {
    draft.payment = {
      ...draft.payment,
      method: payment.method
    }
  }
  if (specialRequests !== undefined) draft.specialRequests = specialRequests

  // Update cancellation guarantee selection
  if (cancellationGuaranteeInput !== undefined) {
    if (cancellationGuaranteeInput?.purchased) {
      // Calculate guarantee amount from market config
      const gp = draft.market
        ? await Market.findById(draft.market)
            .select('cancellationPolicy.guaranteePackage currency')
            .lean()
        : null
      const gpConfig = gp?.cancellationPolicy?.guaranteePackage
      const gpEnabled = gpConfig ? gpConfig.enabled !== false : true
      if (gpEnabled) {
        const rate = gpConfig?.rate ?? 1
        const baseTotal = draft.pricing?.grandTotal || 0
        // Remove any previous guarantee amount from grandTotal before calculating
        const prevGuarantee = draft.cancellationGuarantee?.amount || 0
        const cleanTotal = baseTotal - prevGuarantee
        const amount = Math.round((cleanTotal * rate) / 100)
        draft.cancellationGuarantee = {
          purchased: true,
          rate,
          amount,
          currency: gp?.currency || draft.pricing?.currency || 'TRY'
        }
        // Update grandTotal to include guarantee
        draft.pricing.grandTotal = cleanTotal + amount
        draft.markModified('pricing')
      }
    } else {
      // Remove guarantee - subtract amount from grandTotal
      const prevGuarantee = draft.cancellationGuarantee?.amount || 0
      if (prevGuarantee > 0 && draft.pricing?.grandTotal) {
        draft.pricing.grandTotal = draft.pricing.grandTotal - prevGuarantee
        draft.markModified('pricing')
      }
      draft.cancellationGuarantee = { purchased: false }
    }
  }

  // Update room guests if provided
  if (rooms && rooms.length > 0) {
    rooms.forEach((roomData, index) => {
      if (draft.rooms[index] && roomData.guests) {
        // Sanitize guest data before saving
        const sanitized = sanitizeRoomGuests(roomData.guests)
        draft.rooms[index].guests = sanitized
      }
      if (draft.rooms[index] && roomData.specialRequests !== undefined) {
        draft.rooms[index].specialRequests = roomData.specialRequests
      }
    })
  }

  draft.lastActivityAt = new Date()
  await draft.save()

  res.json({
    success: true,
    data: {
      bookingNumber: draft.bookingNumber,
      lastActivityAt: draft.lastActivityAt,
      message: 'Draft updated successfully'
    }
  })
})

/**
 * Delete a draft booking
 * DELETE /api/bookings/drafts/:bookingNumber
 */
export const deleteDraft = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { bookingNumber } = req.params

  const draft = await Booking.findOne({
    bookingNumber: bookingNumber.toUpperCase(),
    partner: partnerId,
    status: 'draft'
  })

  if (!draft) {
    throw new NotFoundError('DRAFT_NOT_FOUND')
  }

  // Check ownership for agency users
  if (req.user?.accountType === 'agency') {
    if (draft.source?.agencyUserId?.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('NOT_YOUR_DRAFT')
    }
  }

  await draft.deleteOne()

  res.json({
    success: true,
    message: 'Draft deleted successfully'
  })
})

/**
 * Complete a draft and convert to confirmed booking
 * POST /api/bookings/drafts/:bookingNumber/complete
 * Final step - validates everything and reserves allotment
 */
export const completeDraft = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { bookingNumber } = req.params

  const draft = await Booking.findOne({
    bookingNumber: bookingNumber.toUpperCase(),
    partner: partnerId,
    status: 'draft'
  })

  if (!draft) {
    throw new NotFoundError('DRAFT_NOT_FOUND')
  }

  // Validate using centralized validation schema from @booking-engine/validation
  const errors = []

  // Lead Guest validation
  // Convert Mongoose subdocument to plain object for validation
  const leadGuestObj = draft.leadGuest?.toObject
    ? draft.leadGuest.toObject()
    : draft.leadGuest || {}
  const leadGuestData = {
    ...leadGuestObj,
    email: draft.contact?.email,
    phone: draft.contact?.phone
  }
  const leadResult = validateData(leadGuestData, leadGuestSchema)
  if (!leadResult.valid) {
    leadResult.errors.forEach(e => errors.push({ ...e, section: 'leadGuest' }))
  }

  // Room Guests validation
  if (draft.roomGuests) {
    draft.roomGuests.forEach((room, roomIndex) => {
      room.forEach((guest, guestIndex) => {
        if (roomIndex === 0 && guestIndex === 0 && guest.type === 'adult') return
        // Convert Mongoose subdocument to plain object for validation
        const guestObj = guest?.toObject ? guest.toObject() : guest || {}
        const guestResult = validateData(guestObj, roomGuestSchema)
        if (!guestResult.valid) {
          guestResult.errors.forEach(e =>
            errors.push({ ...e, section: 'roomGuest', roomIndex, guestIndex })
          )
        }
      })
    })
  }

  // Invoice validation
  if (draft.invoiceDetails?.type === 'individual') {
    const individualObj = draft.invoiceDetails.individual?.toObject
      ? draft.invoiceDetails.individual.toObject()
      : draft.invoiceDetails.individual || {}
    const invoiceResult = validateData(individualObj, invoiceIndividualValidation)
    if (!invoiceResult.valid) {
      invoiceResult.errors.forEach(e => errors.push({ ...e, section: 'invoiceIndividual' }))
    }
  } else if (draft.invoiceDetails?.type === 'corporate') {
    const corporateObj = draft.invoiceDetails.corporate?.toObject
      ? draft.invoiceDetails.corporate.toObject()
      : draft.invoiceDetails.corporate || {}
    const invoiceResult = validateData(corporateObj, invoiceCorporateValidation)
    if (!invoiceResult.valid) {
      invoiceResult.errors.forEach(e => errors.push({ ...e, section: 'invoiceCorporate' }))
    }
  }

  // Payment validation
  const paymentObj = draft.payment?.toObject ? draft.payment.toObject() : draft.payment || {}
  const paymentResult = validateData(paymentObj, paymentValidationSchema)
  if (!paymentResult.valid) {
    paymentResult.errors.forEach(e => errors.push({ ...e, section: 'payment' }))
  }

  // Booking general validation
  const bookingResult = validateData(
    {
      hotel: draft.hotel,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      rooms: draft.rooms,
      invoiceType: draft.invoiceDetails?.type
    },
    bookingValidationSchema
  )
  if (!bookingResult.valid) {
    bookingResult.errors.forEach(e => errors.push({ ...e, section: 'booking' }))
  }

  if (errors.length > 0) {
    throw new BadRequestError('VALIDATION_FAILED', { errors })
  }

  // Check allotment availability for all rooms/dates
  const checkIn = new Date(draft.checkIn)
  const checkOut = new Date(draft.checkOut)
  const unavailableDates = []

  // Get market for pricing check (find once, use for all rooms)
  const countryCode = draft.searchCriteria?.countryCode || 'TR'
  let market = await Market.findOne({
    hotel: draft.hotel,
    countries: countryCode,
    isActive: true
  })

  // If no specific market, try default market
  if (!market) {
    market = await Market.findOne({
      hotel: draft.hotel,
      isDefault: true,
      isActive: true
    })
  }

  // Skip availability check if no market found (will be handled at booking creation)
  if (market) {
    for (const room of draft.rooms) {
      try {
        // Check availability
        const priceResult = await pricingService.calculatePrice({
          hotelId: draft.hotel.toString(),
          roomTypeId: room.roomType.toString(),
          mealPlanId: room.mealPlan.toString(),
          marketId: market._id.toString(),
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults: draft.totalAdults,
          children: draft.searchCriteria?.children?.map(age => ({ age })) || [],
          includeCampaigns: true
        })

        if (!priceResult.availability?.isAvailable) {
          const issues = priceResult.availability?.issues || []
          issues.forEach(issue => {
            if (issue.date && !unavailableDates.includes(issue.date)) {
              unavailableDates.push(issue.date)
            }
          })
        }
      } catch (error) {
        logger.error('Availability check error:', error)
        // Don't throw, just log - availability was already checked at search time
      }
    }
  }

  if (unavailableDates.length > 0) {
    throw new BadRequestError('ALLOTMENT_NOT_AVAILABLE', {
      unavailableDates,
      message: 'Seçilen tarihlerde yeterli kontenjan kalmadı'
    })
  }

  // Reserve allotment for all rooms (using same market found above)
  if (market) {
    for (const room of draft.rooms) {
      try {
        const dates = room.dailyBreakdown?.map(d => d.date) || []
        if (dates.length > 0) {
          await pricingService.reserveAllotment({
            hotelId: draft.hotel.toString(),
            roomTypeId: room.roomType.toString(),
            mealPlanId: room.mealPlan.toString(),
            marketId: market._id.toString(),
            dates,
            quantity: 1
          })
        }
      } catch (error) {
        logger.error('Allotment reserve error:', error)
        // Continue anyway - we'll handle overbooking manually
      }
    }
  }

  // Ensure cancellation guarantee is properly calculated in pricing
  if (draft.cancellationGuarantee?.purchased && draft.cancellationGuarantee?.amount > 0) {
    // Verify grandTotal includes guarantee amount
    const roomsTotal = (draft.pricing?.subtotal || 0) - (draft.pricing?.totalDiscount || 0)
    const tax = draft.pricing?.tax || 0
    const expectedTotal = roomsTotal + tax + draft.cancellationGuarantee.amount
    if (Math.abs(draft.pricing.grandTotal - expectedTotal) > 1) {
      logger.info('[completeDraft] Correcting grandTotal to include guarantee:', {
        was: draft.pricing.grandTotal,
        expected: expectedTotal,
        guaranteeAmount: draft.cancellationGuarantee.amount
      })
      draft.pricing.grandTotal = expectedTotal
      draft.markModified('pricing')
    }
  }

  // Generate new booking number (BKG instead of DRF)
  const newBookingNumber = await Booking.generateBookingNumber(partnerId, 'booking')

  // Update draft to confirmed booking
  draft.bookingNumber = newBookingNumber
  draft.status = 'confirmed'
  draft.confirmedAt = new Date()
  draft.expiresAt = undefined // Clear expiration

  // Calculate nights if not set
  if (!draft.nights && draft.checkIn && draft.checkOut) {
    draft.nights = Math.ceil(
      (new Date(draft.checkOut) - new Date(draft.checkIn)) / (1000 * 60 * 60 * 24)
    )
  }

  // Update payment dueAmount to match grandTotal (includes guarantee if any)
  if (draft.payment) {
    draft.payment.dueAmount = draft.pricing.grandTotal
  }

  await draft.save()

  // Create Payment record based on payment method
  // This ensures the payment appears in pending payments list
  const paymentMethod = draft.payment?.method
  let createdPaymentLink = null

  if (paymentMethod && draft.pricing?.grandTotal > 0) {
    try {
      // Map booking payment method to Payment model type
      const paymentTypeMap = {
        pay_at_checkin: 'pay_at_checkin',
        cash: 'cash',
        bank_transfer: 'bank_transfer',
        credit_card: 'credit_card',
        agency_credit: 'agency_credit'
      }

      const paymentType = paymentTypeMap[paymentMethod]
      if (paymentType) {
        const payment = new Payment({
          partner: partnerId,
          booking: draft._id,
          type: paymentType,
          amount: draft.pricing.grandTotal,
          currency: draft.pricing.currency || 'TRY',
          notes: paymentMethod === 'cash' ? 'Girişte ödenecek' : '',
          createdBy: req.user?._id
        })

        await payment.save()

        // For cash payments, override the auto-complete from pre-save hook
        // "Girişte Nakit Ödeme" means payment will be collected at check-in, so it should be pending
        if (paymentType === 'cash') {
          payment.status = 'pending'
          payment.completedAt = undefined
          await payment.save()
        }

        // Create PaymentLink if requested (credit card + payment link flow)
        if (paymentType === 'credit_card' && req.body?.createPaymentLink) {
          try {
            const PaymentLink = (await import('../paymentLink/paymentLink.model.js')).default

            const leadGuest = draft.leadGuest || {}
            const contact = draft.contact || {}
            const customerName =
              `${leadGuest.firstName || ''} ${leadGuest.lastName || ''}`.trim() || 'Müşteri'
            const customerEmail = contact.email || ''
            const customerPhone = contact.phone || ''

            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 7)

            const paymentLink = new PaymentLink({
              partner: partnerId,
              booking: draft._id,
              linkedPayment: payment._id,
              customer: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone
              },
              description: `Rezervasyon Ödemesi - ${draft.bookingNumber}`,
              amount: payment.amount,
              currency: payment.currency,
              installment: { enabled: true, maxCount: 12, rates: {} },
              expiresAt,
              createdBy: req.user?._id
            })

            await paymentLink.save()

            // Store reference in payment
            payment.cardDetails = payment.cardDetails || {}
            payment.cardDetails.paymentLink = paymentLink._id
            payment.cardDetails.linkSentAt = new Date()
            await payment.save()

            createdPaymentLink = paymentLink

            // Send notifications if requested
            const { sendEmail = false, sendSms = false } = req.body
            if ((sendEmail || sendSms) && (customerEmail || customerPhone)) {
              try {
                const { sendPaymentLinkNotification } =
                  await import('./payment-notifications.service.js')
                const Partner = (await import('../partner/partner.model.js')).default
                const partner = await Partner.findById(partnerId)

                await sendPaymentLinkNotification(paymentLink, partner, {
                  email: sendEmail && !!customerEmail,
                  sms: sendSms && !!customerPhone
                })
              } catch (notifyError) {
                logger.error(
                  '[completeDraft] Payment link notification failed:',
                  notifyError.message
                )
              }
            }

            logger.info('Payment link created for booking:', {
              bookingNumber: draft.bookingNumber,
              paymentLinkId: paymentLink._id
            })
          } catch (linkError) {
            logger.error('Failed to create payment link:', linkError)
          }
        }

        // Update booking payment status and reference
        await updateBookingPayment(draft._id)

        logger.info('Payment record created for booking:', {
          bookingNumber: draft.bookingNumber,
          paymentType,
          amount: draft.pricing.grandTotal,
          paymentStatus: payment.status
        })
      }
    } catch (paymentError) {
      // Log error but don't fail the booking completion
      logger.error('Failed to create payment record:', paymentError)
    }
  }

  const responseData = {
    bookingNumber: draft.bookingNumber,
    _id: draft._id,
    status: draft.status,
    confirmedAt: draft.confirmedAt,
    hotel: draft.hotelName,
    checkIn: draft.checkIn,
    checkOut: draft.checkOut,
    pricing: draft.pricing
  }

  if (createdPaymentLink) {
    responseData.paymentLink = createdPaymentLink
  }

  res.json({
    success: true,
    data: responseData
  })
})
