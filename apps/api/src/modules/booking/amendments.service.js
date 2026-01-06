/**
 * Amendments Service
 * Booking modification/amendment operations
 * Split from booking.service.js for better maintainability
 */

import mongoose from 'mongoose'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import RoomType from '../planning/roomType.model.js'
import MealPlan from '../planning/mealPlan.model.js'
import Market from '../planning/market.model.js'
import Booking from './booking.model.js'
import pricingService from '../../services/pricingService.js'
import { BadRequestError, NotFoundError } from '../../core/errors.js'
import { emitReservationUpdate, getGuestDisplayName } from '../pms/pmsSocket.js'
import logger from '../../core/logger.js'
import { getPartnerId } from '../../services/helpers.js'
import { createBookingSnapshot, compareValues, detectAmendmentType } from './helpers.js'

// ==================== AMENDMENT (BOOKING MODIFICATION) ====================

/**
 * Get booking data for amendment
 * GET /api/bookings/:id/amendment
 * Returns booking with hotel's available room types and meal plans
 */
export const getBookingForAmendment = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { id } = req.params

  // Get booking with populated data
  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  })
    .populate('hotel', '_id name code address images childAgeGroups pricingSettings')
    .populate('market', '_id name code currency')
    .populate('rooms.roomType', '_id name code images occupancy')
    .populate('rooms.mealPlan', '_id name code')
    .lean()

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Check if booking can be amended (only pending, confirmed, checked_in)
  const amendableStatuses = ['pending', 'confirmed', 'checked_in']
  if (!amendableStatuses.includes(booking.status)) {
    throw new BadRequestError('BOOKING_CANNOT_BE_AMENDED', {
      status: booking.status,
      allowedStatuses: amendableStatuses
    })
  }

  // If booking doesn't have a market, assign a default one for display
  if (!booking.market) {
    const defaultMarket = await Market.findOne({
      hotel: booking.hotel._id,
      isDefault: true,
      status: 'active'
    })
      .select('_id code name currency')
      .lean()

    if (defaultMarket) {
      booking.market = defaultMarket
    } else {
      // Get any active market
      const anyMarket = await Market.findOne({
        hotel: booking.hotel._id,
        status: 'active'
      })
        .select('_id code name currency')
        .lean()

      if (anyMarket) {
        booking.market = anyMarket
      }
    }
  }

  // Get hotel's active room types
  const roomTypes = await RoomType.find({
    hotel: booking.hotel._id,
    status: 'active'
  })
    .select('_id code name images occupancy displayOrder')
    .sort('displayOrder')
    .lean()

  // Get hotel's active meal plans
  const mealPlans = await MealPlan.find({
    hotel: booking.hotel._id,
    status: 'active'
  })
    .select('_id code name displayOrder')
    .sort('displayOrder')
    .lean()

  // Get available markets for this hotel
  const markets = await Market.find({
    hotel: booking.hotel._id,
    status: 'active'
  })
    .select('_id code name currency countries isDefault')
    .lean()

  res.json({
    success: true,
    data: {
      booking,
      availableRoomTypes: roomTypes,
      availableMealPlans: mealPlans,
      availableMarkets: markets,
      canAmend: true
    }
  })
})

/**
 * Preview amendment changes
 * POST /api/bookings/:id/amendment/preview
 * Calculates new prices, checks availability, returns comparison
 */
export const previewAmendment = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { id } = req.params
  const {
    checkIn: newCheckIn,
    checkOut: newCheckOut,
    rooms: newRooms,
    leadGuest: newLeadGuest,
    contact: newContact,
    invoiceDetails: newInvoiceDetails,
    specialRequests: newSpecialRequests
  } = req.body

  // Get current booking
  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  })
    .populate('hotel', '_id name code pricingSettings childAgeGroups')
    .populate('market', '_id name code currency')
    .populate('rooms.roomType', '_id name code')
    .populate('rooms.mealPlan', '_id name code')

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Validate that hotel is properly populated
  if (!booking.hotel?._id) {
    throw new BadRequestError('BOOKING_HOTEL_NOT_FOUND', {
      message: 'Rezervasyonun oteli bulunamadı'
    })
  }

  // If booking doesn't have a market, try to get the default market for the hotel
  let effectiveMarket = booking.market
  if (!effectiveMarket?._id) {
    effectiveMarket = await Market.findOne({
      hotel: booking.hotel._id,
      isDefault: true,
      status: 'active'
    }).lean()

    // If no default market, get any active market for this hotel
    if (!effectiveMarket) {
      effectiveMarket = await Market.findOne({
        hotel: booking.hotel._id,
        status: 'active'
      }).lean()
    }

    if (!effectiveMarket) {
      throw new BadRequestError('NO_MARKET_AVAILABLE', {
        message: 'Bu otel için aktif bir pazar bulunamadı. Lütfen önce bir pazar tanımlayın.'
      })
    }
  }

  // Check if booking can be amended
  const amendableStatuses = ['pending', 'confirmed', 'checked_in']
  if (!amendableStatuses.includes(booking.status)) {
    throw new BadRequestError('BOOKING_CANNOT_BE_AMENDED')
  }

  // Track changes
  const changes = []
  const availabilityIssues = []
  let newPricing = null
  const newRoomsProcessed = []

  // Determine effective dates
  const effectiveCheckIn = newCheckIn || booking.checkIn
  const effectiveCheckOut = newCheckOut || booking.checkOut
  const effectiveNights = Math.ceil(
    (new Date(effectiveCheckOut) - new Date(effectiveCheckIn)) / (1000 * 60 * 60 * 24)
  )

  // Date changes
  if (
    newCheckIn &&
    new Date(newCheckIn).toISOString() !== new Date(booking.checkIn).toISOString()
  ) {
    changes.push(compareValues('checkIn', 'Giriş Tarihi', booking.checkIn, new Date(newCheckIn)))
  }
  if (
    newCheckOut &&
    new Date(newCheckOut).toISOString() !== new Date(booking.checkOut).toISOString()
  ) {
    changes.push(compareValues('checkOut', 'Çıkış Tarihi', booking.checkOut, new Date(newCheckOut)))
  }

  // Lead guest changes
  if (newLeadGuest) {
    if (newLeadGuest.firstName !== booking.leadGuest?.firstName) {
      changes.push(
        compareValues(
          'leadGuest.firstName',
          'Adı',
          booking.leadGuest?.firstName,
          newLeadGuest.firstName
        )
      )
    }
    if (newLeadGuest.lastName !== booking.leadGuest?.lastName) {
      changes.push(
        compareValues(
          'leadGuest.lastName',
          'Soyadı',
          booking.leadGuest?.lastName,
          newLeadGuest.lastName
        )
      )
    }
    if (newLeadGuest.tcNumber !== booking.leadGuest?.tcNumber) {
      changes.push(
        compareValues(
          'leadGuest.tcNumber',
          'T.C. Kimlik No',
          booking.leadGuest?.tcNumber,
          newLeadGuest.tcNumber
        )
      )
    }
    if (newLeadGuest.passportNumber !== booking.leadGuest?.passportNumber) {
      changes.push(
        compareValues(
          'leadGuest.passportNumber',
          'Pasaport No',
          booking.leadGuest?.passportNumber,
          newLeadGuest.passportNumber
        )
      )
    }
    if (newLeadGuest.nationality !== booking.leadGuest?.nationality) {
      changes.push(
        compareValues(
          'leadGuest.nationality',
          'Uyruk',
          booking.leadGuest?.nationality,
          newLeadGuest.nationality
        )
      )
    }
  }

  // Contact changes
  if (newContact) {
    if (newContact.email !== booking.contact?.email) {
      changes.push(
        compareValues('contact.email', 'E-posta', booking.contact?.email, newContact.email)
      )
    }
    if (newContact.phone !== booking.contact?.phone) {
      changes.push(
        compareValues('contact.phone', 'Telefon', booking.contact?.phone, newContact.phone)
      )
    }
  }

  // Filter out null changes
  const validChanges = changes.filter(c => c !== null)

  // If rooms or dates changed, recalculate pricing using centralized pricing service
  const roomsToProcess =
    newRooms ||
    booking.rooms.map(r => ({
      roomTypeId: r.roomType._id?.toString() || r.roomType.toString(),
      mealPlanId: r.mealPlan._id?.toString() || r.mealPlan.toString(),
      adults: r.guests?.filter(g => g.type === 'adult').length || 2,
      children: r.guests?.filter(g => g.type === 'child').map(g => g.age) || [],
      guests: r.guests,
      rateType: r.rateType || 'refundable'
    }))

  // Validate room data before pricing
  for (let i = 0; i < roomsToProcess.length; i++) {
    const roomData = roomsToProcess[i]
    if (!roomData.roomTypeId || roomData.roomTypeId === 'undefined') {
      availabilityIssues.push({
        roomIndex: i,
        error: 'INVALID_ROOM_TYPE_ID',
        message: 'Geçersiz oda tipi ID'
      })
    }
    if (!roomData.mealPlanId || roomData.mealPlanId === 'undefined') {
      availabilityIssues.push({
        roomIndex: i,
        error: 'INVALID_MEAL_PLAN_ID',
        message: 'Geçersiz pansiyon tipi ID'
      })
    }
  }

  // Determine sales channel from booking or request
  const effectiveSalesChannel = req.body.salesChannel || booking.salesChannel || 'b2c'

  // Use centralized multi-room pricing calculation
  const pricingResult = await pricingService.calculateMultiRoomBookingPrice({
    hotelId: booking.hotel._id.toString(),
    rooms: roomsToProcess.filter(r => r.roomTypeId && r.roomTypeId !== 'undefined'),
    marketId: effectiveMarket._id.toString(),
    checkInDate: effectiveCheckIn,
    checkOutDate: effectiveCheckOut,
    includeCampaigns: true,
    throwOnError: false,
    salesChannel: effectiveSalesChannel
  })

  // Add pricing errors to availability issues
  if (pricingResult.errors) {
    pricingResult.errors.forEach(err => {
      availabilityIssues.push({
        roomIndex: err.roomIndex,
        error: err.error,
        message: err.message || 'Fiyat hesaplanamadı'
      })
    })
  }

  // Track room changes and build processed rooms
  for (let i = 0; i < pricingResult.rooms.length; i++) {
    const roomResult = pricingResult.rooms[i]
    const roomData = roomsToProcess[roomResult.roomIndex]
    const originalRoom = booking.rooms[roomResult.roomIndex]

    // Track room changes
    if (originalRoom) {
      const origRoomTypeId =
        originalRoom.roomType._id?.toString() || originalRoom.roomType.toString()
      const origMealPlanId =
        originalRoom.mealPlan._id?.toString() || originalRoom.mealPlan.toString()

      if (roomData.roomTypeId !== origRoomTypeId) {
        validChanges.push({
          field: `rooms[${roomResult.roomIndex}].roomType`,
          fieldLabel: `Oda ${roomResult.roomIndex + 1} Tipi`,
          from: originalRoom.roomTypeName,
          to: roomResult.roomTypeName
        })
      }
      if (roomData.mealPlanId !== origMealPlanId) {
        validChanges.push({
          field: `rooms[${roomResult.roomIndex}].mealPlan`,
          fieldLabel: `Oda ${roomResult.roomIndex + 1} Pansiyon`,
          from: originalRoom.mealPlanName,
          to: roomResult.mealPlanName
        })
      }
    }

    // Check availability
    if (!roomResult.available) {
      availabilityIssues.push({
        roomIndex: roomResult.roomIndex,
        roomType: roomData.roomTypeId,
        message: 'Bu oda tipi için seçilen tarihlerde müsaitlik yok'
      })
    }

    newRoomsProcessed.push({
      roomType: roomResult.roomTypeId,
      roomTypeCode: roomResult.roomTypeCode,
      roomTypeName: roomResult.roomTypeName,
      mealPlan: roomResult.mealPlanId,
      mealPlanCode: roomResult.mealPlanCode,
      mealPlanName: roomResult.mealPlanName,
      guests: roomData.guests || originalRoom?.guests || [],
      occupancy: roomResult.occupancy,
      pricing: {
        currency: pricingResult.totals.currency,
        originalTotal: roomResult.pricing.originalTotal,
        discount: roomResult.pricing.campaignDiscount,
        finalTotal: roomResult.pricing.finalTotal,
        avgPerNight: roomResult.pricing.avgPerNight
      },
      dailyBreakdown: roomResult.dailyBreakdown,
      campaigns: roomResult.campaigns,
      rateType: roomResult.rateType,
      nonRefundableDiscount: roomResult.nonRefundable?.discountPercent || 0,
      available: roomResult.available
    })
  }

  // Use totals from centralized pricing service
  const { subtotal, totalDiscount, grandTotal, currency } = pricingResult.totals

  newPricing = {
    currency,
    subtotal,
    totalDiscount,
    grandTotal
  }

  // Calculate price difference
  const originalTotal = booking.pricing?.grandTotal || 0
  const difference = grandTotal - originalTotal

  res.json({
    success: true,
    data: {
      changes: validChanges,
      amendmentType: detectAmendmentType(validChanges),
      availability: {
        allAvailable: availabilityIssues.length === 0,
        issues: availabilityIssues
      },
      original: {
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        rooms: booking.rooms,
        pricing: booking.pricing,
        leadGuest: booking.leadGuest,
        contact: booking.contact
      },
      preview: {
        checkIn: effectiveCheckIn,
        checkOut: effectiveCheckOut,
        nights: effectiveNights,
        rooms: newRoomsProcessed,
        pricing: newPricing,
        leadGuest: newLeadGuest || booking.leadGuest,
        contact: newContact || booking.contact
      },
      priceDifference: {
        currency,
        originalTotal,
        newTotal: grandTotal,
        difference,
        isIncrease: difference > 0,
        isDecrease: difference < 0
      }
    }
  })
})

/**
 * Apply amendment to booking
 * POST /api/bookings/:id/amendment/apply
 * Creates snapshot, updates booking, handles allotment
 */
export const applyAmendment = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { id } = req.params
  const {
    checkIn: newCheckIn,
    checkOut: newCheckOut,
    rooms: newRooms,
    leadGuest: newLeadGuest,
    contact: newContact,
    invoiceDetails: newInvoiceDetails,
    specialRequests: newSpecialRequests,
    reason,
    priceDifferenceAdjustment
  } = req.body

  // Validate reason
  if (!reason || reason.trim().length < 10) {
    throw new BadRequestError('AMENDMENT_REASON_REQUIRED', {
      message: 'Değişiklik nedeni en az 10 karakter olmalıdır'
    })
  }

  // Get current booking
  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  })
    .populate('hotel', 'name code pricingSettings')
    .populate('market', 'name code currency')

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // If booking doesn't have a market, try to get the default market for the hotel
  let effectiveMarket = booking.market
  if (!effectiveMarket?._id) {
    effectiveMarket = await Market.findOne({
      hotel: booking.hotel._id,
      isDefault: true,
      status: 'active'
    }).lean()

    // If no default market, get any active market for this hotel
    if (!effectiveMarket) {
      effectiveMarket = await Market.findOne({
        hotel: booking.hotel._id,
        status: 'active'
      }).lean()
    }

    if (!effectiveMarket) {
      throw new BadRequestError('NO_MARKET_AVAILABLE', {
        message: 'Bu otel için aktif bir pazar bulunamadı'
      })
    }
  }

  // Check if booking can be amended
  const amendableStatuses = ['pending', 'confirmed', 'checked_in']
  if (!amendableStatuses.includes(booking.status)) {
    throw new BadRequestError('BOOKING_CANNOT_BE_AMENDED')
  }

  // Create snapshot of current state BEFORE any changes
  const snapshot = {
    snapshotId: new mongoose.Types.ObjectId().toString(),
    takenAt: new Date(),
    takenBy: req.user?._id,
    takenByName: req.user?.name || req.user?.email || 'System',
    reason: reason.trim(),
    bookingState: createBookingSnapshot(booking),
    amendment: {
      type: 'full', // Will be updated after detecting changes
      changes: [],
      priceDifference: {
        currency: booking.pricing?.currency || 'TRY',
        originalTotal: booking.pricing?.grandTotal || 0,
        newTotal: 0,
        difference: 0,
        adjustedDifference: priceDifferenceAdjustment?.adjustedAmount,
        adjustmentReason: priceDifferenceAdjustment?.reason,
        waived: priceDifferenceAdjustment?.waived || false
      }
    }
  }

  // Track changes
  const changes = []

  // Release old allotment first
  for (const room of booking.rooms) {
    const dates = room.dailyBreakdown?.map(d => d.date) || []
    if (dates.length > 0) {
      try {
        await pricingService.releaseAllotment({
          hotelId: booking.hotel._id.toString(),
          roomTypeId: room.roomType._id?.toString() || room.roomType.toString(),
          mealPlanId: room.mealPlan._id?.toString() || room.mealPlan.toString(),
          marketId: booking.market._id.toString(),
          dates,
          rooms: 1
        })
      } catch (error) {
        logger.error('Allotment release error:', error.message)
      }
    }
  }

  // Update dates if changed
  if (newCheckIn) {
    const oldCheckIn = booking.checkIn
    booking.checkIn = new Date(newCheckIn)
    if (oldCheckIn?.toISOString() !== booking.checkIn.toISOString()) {
      changes.push({
        field: 'checkIn',
        fieldLabel: 'Giriş Tarihi',
        from: oldCheckIn,
        to: booking.checkIn
      })
    }
  }
  if (newCheckOut) {
    const oldCheckOut = booking.checkOut
    booking.checkOut = new Date(newCheckOut)
    if (oldCheckOut?.toISOString() !== booking.checkOut.toISOString()) {
      changes.push({
        field: 'checkOut',
        fieldLabel: 'Çıkış Tarihi',
        from: oldCheckOut,
        to: booking.checkOut
      })
    }
  }

  // Recalculate nights
  booking.nights = Math.ceil(
    (new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)
  )

  // Update lead guest if changed
  if (newLeadGuest) {
    const oldLeadGuest = { ...booking.leadGuest }
    Object.assign(booking.leadGuest, newLeadGuest)
    changes.push({
      field: 'leadGuest',
      fieldLabel: 'Misafir Bilgileri',
      from: oldLeadGuest,
      to: booking.leadGuest
    })
  }

  // Update contact if changed
  if (newContact) {
    const oldContact = { ...booking.contact }
    booking.contact = { ...booking.contact, ...newContact }
    changes.push({
      field: 'contact',
      fieldLabel: 'İletişim Bilgileri',
      from: oldContact,
      to: booking.contact
    })
  }

  // Update invoice details if changed
  if (newInvoiceDetails) {
    const oldInvoice = { ...booking.invoiceDetails }
    booking.invoiceDetails = newInvoiceDetails
    changes.push({
      field: 'invoiceDetails',
      fieldLabel: 'Fatura Bilgileri',
      from: oldInvoice,
      to: booking.invoiceDetails
    })
  }

  // Update special requests if changed
  if (newSpecialRequests !== undefined) {
    const oldRequests = booking.specialRequests
    booking.specialRequests = newSpecialRequests
    if (oldRequests !== newSpecialRequests) {
      changes.push({
        field: 'specialRequests',
        fieldLabel: 'Özel İstekler',
        from: oldRequests,
        to: newSpecialRequests
      })
    }
  }

  // Process rooms if changed
  if (newRooms && newRooms.length > 0) {
    const processedRooms = []
    let subtotal = 0
    let totalDiscount = 0
    const currency = effectiveMarket?.currency || booking.pricing?.currency || 'TRY'

    for (const roomData of newRooms) {
      const priceResult = await pricingService.calculatePriceWithCampaigns({
        hotelId: booking.hotel._id.toString(),
        roomTypeId: roomData.roomTypeId,
        mealPlanId: roomData.mealPlanId,
        marketId: effectiveMarket._id.toString(),
        checkInDate: booking.checkIn,
        checkOutDate: booking.checkOut,
        adults: roomData.adults || 2,
        children: roomData.children?.map(age => ({ age })) || [],
        includeCampaigns: true
      })

      if (!priceResult.availability?.isAvailable) {
        throw new BadRequestError('ROOM_NOT_AVAILABLE', {
          roomType: roomData.roomTypeId,
          message: 'Seçilen oda tipi için müsaitlik yok'
        })
      }

      const roomType = await RoomType.findById(roomData.roomTypeId).select('code name').lean()
      const mealPlan = await MealPlan.findById(roomData.mealPlanId).select('code name').lean()

      let finalPrice = priceResult.pricing.finalTotal
      if (roomData.rateType === 'non_refundable' && priceResult.nonRefundable?.enabled) {
        finalPrice = priceResult.nonRefundable.discountedTotal
      }

      // Get season info from daily breakdown
      const seasonInfo = priceResult.dailyBreakdown?.[0]?.season || priceResult.season

      processedRooms.push({
        roomType: roomData.roomTypeId,
        roomTypeCode: roomType?.code,
        roomTypeName: roomType?.name,
        mealPlan: roomData.mealPlanId,
        mealPlanCode: mealPlan?.code,
        mealPlanName: mealPlan?.name,
        // Preserve hotel info
        hotel: booking.hotel._id,
        hotelCode: booking.hotel.code || booking.hotelCode,
        hotelName: booking.hotel.name || booking.hotelName,
        // Preserve market info
        market: effectiveMarket._id,
        marketCode: effectiveMarket.code,
        marketName: effectiveMarket.name,
        // Preserve season info
        season: seasonInfo?._id || seasonInfo?.seasonId,
        seasonCode: seasonInfo?.code || seasonInfo?.seasonCode,
        seasonName: seasonInfo?.name || seasonInfo?.seasonName,
        guests: roomData.guests || [],
        pricing: {
          currency,
          originalTotal: priceResult.pricing.originalTotal,
          discount: priceResult.pricing.totalDiscount,
          finalTotal: finalPrice,
          avgPerNight: finalPrice / booking.nights
        },
        dailyBreakdown: priceResult.dailyBreakdown,
        campaigns: priceResult.campaigns?.applied || [],
        rateType: roomData.rateType || 'refundable',
        nonRefundableDiscount:
          roomData.rateType === 'non_refundable' ? priceResult.nonRefundable?.discountPercent : 0,
        specialRequests: roomData.specialRequests
      })

      subtotal += priceResult.pricing.originalTotal
      totalDiscount += priceResult.pricing.totalDiscount

      // Reserve new allotment
      const dates = priceResult.dailyBreakdown.map(d => d.date)
      try {
        await pricingService.reserveAllotment({
          hotelId: booking.hotel._id.toString(),
          roomTypeId: roomData.roomTypeId,
          mealPlanId: roomData.mealPlanId,
          marketId: effectiveMarket._id.toString(),
          dates,
          rooms: 1
        })
      } catch (error) {
        logger.error('Allotment reservation error:', error.message)
      }
    }

    changes.push({
      field: 'rooms',
      fieldLabel: 'Odalar',
      from: booking.rooms.length,
      to: processedRooms.length
    })

    booking.rooms = processedRooms
    booking.totalRooms = processedRooms.length

    // Ensure market is set on booking (if it was missing)
    if (!booking.market) {
      booking.market = effectiveMarket._id
      booking.marketName = effectiveMarket.name
    }

    // Update pricing
    const grandTotal = subtotal - totalDiscount
    booking.pricing = {
      ...booking.pricing,
      subtotal,
      totalDiscount,
      grandTotal
    }

    // Update snapshot with price difference
    snapshot.amendment.priceDifference.newTotal = grandTotal
    snapshot.amendment.priceDifference.difference =
      grandTotal - snapshot.amendment.priceDifference.originalTotal
  }

  // Update snapshot with changes
  snapshot.amendment.changes = changes
  snapshot.amendment.type = detectAmendmentType(changes)

  // Add snapshot to booking
  if (!booking.amendmentSnapshots) {
    booking.amendmentSnapshots = []
  }
  booking.amendmentSnapshots.push(snapshot)

  // Add modification record
  booking.modifications.push({
    modifiedAt: new Date(),
    modifiedBy: req.user?._id,
    type: snapshot.amendment.type,
    description: reason,
    previousValue: snapshot.bookingState.pricing?.grandTotal,
    newValue: booking.pricing?.grandTotal
  })

  // Save booking
  await booking.save()

  // Emit socket event
  const hotelId = booking.hotel?._id?.toString() || booking.hotel?.toString()
  if (hotelId) {
    emitReservationUpdate(hotelId, 'updated', {
      reservationId: booking._id,
      bookingNumber: booking.bookingNumber,
      guestName: getGuestDisplayName(booking.leadGuest),
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      status: booking.status,
      amendmentType: snapshot.amendment.type
    })
  }

  res.json({
    success: true,
    data: {
      bookingNumber: booking.bookingNumber,
      _id: booking._id,
      status: booking.status,
      amendmentApplied: true,
      snapshotId: snapshot.snapshotId,
      changes: changes.length,
      priceDifference: snapshot.amendment.priceDifference
    }
  })
})

/**
 * Get amendment history
 * GET /api/bookings/:id/amendments
 * Returns all amendment snapshots for a booking
 */
export const getAmendmentHistory = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { id } = req.params

  const booking = await Booking.findOne({
    _id: id,
    partner: partnerId
  })
    .select('bookingNumber amendmentSnapshots modifications')
    .populate('amendmentSnapshots.takenBy', 'name email')
    .lean()

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Sort by date descending (newest first)
  const history = (booking.amendmentSnapshots || []).sort(
    (a, b) => new Date(b.takenAt) - new Date(a.takenAt)
  )

  res.json({
    success: true,
    data: {
      bookingNumber: booking.bookingNumber,
      totalAmendments: history.length,
      amendments: history.map(s => ({
        snapshotId: s.snapshotId,
        takenAt: s.takenAt,
        takenBy: s.takenByName || s.takenBy?.name || s.takenBy?.email || 'System',
        reason: s.reason,
        type: s.amendment?.type,
        changes: s.amendment?.changes || [],
        priceDifference: s.amendment?.priceDifference,
        // Include previous state for comparison
        previousState: {
          checkIn: s.bookingState?.checkIn,
          checkOut: s.bookingState?.checkOut,
          nights: s.bookingState?.nights,
          totalRooms: s.bookingState?.totalRooms,
          pricing: s.bookingState?.pricing
        }
      }))
    }
  })
})
