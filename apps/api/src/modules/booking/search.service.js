/**
 * Search Service
 * Availability search and pricing operations for booking
 * Split from booking.service.js for better maintainability
 */

import { asyncHandler } from '#helpers'
import Hotel from '../hotel/hotel.model.js'
import RoomType from '../planning/roomType.model.js'
import MealPlan from '../planning/mealPlan.model.js'
import Market from '../planning/market.model.js'
import pricingService from '#services/pricingService.js'
import { getEffectiveChildAgeGroups } from '#services/pricing/multipliers.js'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import { getPartnerId } from '#services/helpers.js'

// ==================== MULTI-HOTEL SEARCH ====================

/**
 * Search hotels with cheapest prices (for region/multi-hotel search)
 * POST /api/bookings/search-hotels
 */
export const searchHotelsWithPrices = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const {
    tourismRegionIds = [],
    hotelIds = [],
    checkIn,
    checkOut,
    adults = 2,
    children = [],
    countryCode,
    channel = 'B2B',
    salesChannel = 'b2c'
  } = req.body

  // Validate dates
  if (!checkIn || !checkOut) {
    throw new BadRequestError('DATES_REQUIRED')
  }

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

  // Build hotel query
  const hotelQuery = {
    partner: partnerId,
    status: 'active'
  }

  // Filter by tourism regions or specific hotels
  if (tourismRegionIds.length > 0) {
    hotelQuery['location.tourismRegions'] = { $in: tourismRegionIds }
  }

  if (hotelIds.length > 0) {
    hotelQuery._id = { $in: hotelIds }
  }

  // Get hotels
  const hotels = await Hotel.find(hotelQuery)
    .select(
      '_id code name slug stars type address images childAgeGroups pricingSettings paymentMethods location'
    )
    .lean()

  if (hotels.length === 0) {
    return res.json({
      success: true,
      data: {
        hotels: [],
        search: { checkIn, checkOut, nights, adults, children, countryCode, channel }
      }
    })
  }

  // Process each hotel and get cheapest price
  const hotelResults = []
  const debugInfo = []

  for (const hotel of hotels) {
    const hotelDebug = { hotelId: hotel._id, name: hotel.name, issues: [] }

    try {
      // Find market for this hotel
      let market = null
      if (countryCode) {
        market = await Market.findOne({
          hotel: hotel._id,
          countries: countryCode.toUpperCase(),
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
        market = await Market.findOne({
          hotel: hotel._id,
          status: 'active'
        }).lean()
      }

      if (!market) {
        hotelDebug.issues.push('NO_MARKET_FOUND')
        debugInfo.push(hotelDebug)
        continue
      }

      hotelDebug.marketId = market._id
      hotelDebug.marketName = market.name

      // Get active room types
      const roomTypes = await RoomType.find({
        hotel: hotel._id,
        status: 'active'
      })
        .select('_id code occupancy')
        .lean()

      hotelDebug.roomTypeCount = roomTypes.length

      if (roomTypes.length === 0) {
        hotelDebug.issues.push('NO_ROOM_TYPES')
        debugInfo.push(hotelDebug)
        continue
      }

      // Get active meal plans
      const mealPlans = await MealPlan.find({
        hotel: hotel._id,
        status: 'active'
      })
        .select('_id code')
        .lean()

      hotelDebug.mealPlanCount = mealPlans.length

      if (mealPlans.length === 0) {
        hotelDebug.issues.push('NO_MEAL_PLANS')
        debugInfo.push(hotelDebug)
        continue
      }

      let cheapestPrice = null
      let availableRoomCount = 0
      const currency = market.currency
      const priceErrors = []

      // Get effective child age groups to determine infant age range
      const childAgeGroups = getEffectiveChildAgeGroups(hotel, market)
      const infantGroup = childAgeGroups.find(g => g.code === 'infant')
      const maxInfantAge = infantGroup?.maxAge ?? 2

      // Classify children by age (infant vs child)
      let infantCount = 0
      let childCount = 0
      for (const childAge of children) {
        if (childAge <= maxInfantAge) {
          infantCount++
        } else {
          childCount++
        }
      }

      // Find cheapest available option
      for (const roomType of roomTypes) {
        // Check capacity
        const maxAdults = roomType.occupancy?.maxAdults || 2
        const maxChildren = roomType.occupancy?.maxChildren ?? 0
        const maxInfants = roomType.occupancy?.maxInfants ?? 1
        const maxTotal = roomType.occupancy?.totalMaxGuests || 4
        const totalPax = adults + childCount // Infants don't count towards total

        // Skip if infant capacity exceeded
        if (infantCount > maxInfants) {
          continue
        }

        // Skip if child capacity exceeded
        if (childCount > maxChildren) {
          continue
        }

        if (adults > maxAdults || totalPax > maxTotal) {
          continue
        }

        for (const mealPlan of mealPlans) {
          try {
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

            if (priceResult.availability?.isAvailable) {
              availableRoomCount++
              // Use channel-specific price (NOT hotelCost!)
              const price = salesChannel === 'b2b'
                ? priceResult.pricing.b2bPrice
                : priceResult.pricing.b2cPrice

              if (cheapestPrice === null || price < cheapestPrice) {
                cheapestPrice = price
              }
            } else {
              priceErrors.push({
                roomType: roomType.code,
                mealPlan: mealPlan.code,
                reason: priceResult.availability?.reason || 'NOT_AVAILABLE'
              })
            }
          } catch (err) {
            priceErrors.push({
              roomType: roomType.code,
              mealPlan: mealPlan.code,
              error: err.message
            })
          }
        }
      }

      hotelDebug.availableRoomCount = availableRoomCount
      hotelDebug.cheapestPrice = cheapestPrice
      hotelDebug.priceErrors = priceErrors.slice(0, 5)

      if (cheapestPrice !== null) {
        hotelResults.push({
          _id: hotel._id,
          code: hotel.code,
          name: hotel.name,
          slug: hotel.slug,
          stars: hotel.stars,
          type: hotel.type,
          city: hotel.address?.city,
          image: hotel.images?.find(img => img.isMain)?.url || hotel.images?.[0]?.url,
          cheapestPrice,
          currency,
          availableRoomCount,
          paymentMethods: hotel.paymentMethods || [],
          childAgeGroups: hotel.childAgeGroups
        })
      } else {
        hotelDebug.issues.push('NO_AVAILABLE_PRICE')
        debugInfo.push(hotelDebug)
      }
    } catch (err) {
      hotelDebug.issues.push(`ERROR: ${err.message}`)
      debugInfo.push(hotelDebug)
    }
  }

  // Sort by cheapest price
  hotelResults.sort((a, b) => a.cheapestPrice - b.cheapestPrice)

  res.json({
    success: true,
    data: {
      hotels: hotelResults,
      debug: debugInfo,
      search: {
        checkIn,
        checkOut,
        nights,
        adults,
        children,
        countryCode,
        channel
      }
    }
  })
})

// ==================== AVAILABILITY SEARCH ====================

/**
 * Search availability and prices
 * POST /api/bookings/search
 */
export const searchAvailability = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { hotelId, checkIn, checkOut, adults = 2, children = [], countryCode, currency, salesChannel = 'b2c' } = req.body

  // Validate required fields
  if (!hotelId || !checkIn || !checkOut) {
    throw new BadRequestError('HOTEL_AND_DATES_REQUIRED')
  }

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

  // Get hotel (must belong to partner)
  const hotel = await Hotel.findOne({
    _id: hotelId,
    partner: partnerId,
    status: 'active'
  })
    .select('_id code name childAgeGroups pricingSettings')
    .lean()

  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Find appropriate market
  let market = null
  if (countryCode) {
    market = await Market.findOne({
      hotel: hotel._id,
      countries: countryCode.toUpperCase(),
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

  if (!market && currency) {
    market = await Market.findOne({
      hotel: hotel._id,
      currency: currency.toUpperCase(),
      status: 'active'
    }).lean()
  }

  if (!market) {
    market = await Market.findOne({
      hotel: hotel._id,
      status: 'active'
    }).lean()
  }

  if (!market) {
    throw new NotFoundError('NO_MARKET_AVAILABLE')
  }

  // Get active room types and meal plans
  const [roomTypes, mealPlans] = await Promise.all([
    RoomType.find({ hotel: hotel._id, status: 'active' }).sort('displayOrder').lean(),
    MealPlan.find({ hotel: hotel._id, status: 'active' }).sort('displayOrder').lean()
  ])

  const results = []

  // Process each room type
  for (const roomType of roomTypes) {
    const roomResult = {
      roomType: {
        _id: roomType._id,
        code: roomType.code,
        name: roomType.name,
        description: roomType.description,
        images: roomType.images?.slice(0, 3),
        occupancy: roomType.occupancy
      },
      options: [],
      unavailableOptions: []
    }

    // Get effective child age groups to determine infant age range
    const childAgeGroups = getEffectiveChildAgeGroups(hotel, market)
    const infantGroup = childAgeGroups.find(g => g.code === 'infant')
    const maxInfantAge = infantGroup?.maxAge ?? 2

    // Classify children by age (infant vs child)
    let infantCount = 0
    let childCount = 0
    for (const childAge of children) {
      if (childAge <= maxInfantAge) {
        infantCount++
      } else {
        childCount++
      }
    }

    // Check capacity
    const maxAdults = roomType.occupancy?.maxAdults ?? 2
    const maxChildren = roomType.occupancy?.maxChildren ?? 0
    const maxInfants = roomType.occupancy?.maxInfants ?? 1
    const maxTotal = roomType.occupancy?.totalMaxGuests ?? 4
    const totalPax = adults + childCount // Infants typically don't count towards total

    // Check infant capacity
    if (infantCount > maxInfants) {
      roomResult.capacityExceeded = true
      roomResult.capacityMessage = maxInfants === 0
        ? 'Bu oda bebek kabul etmemektedir'
        : `Max ${maxInfants} bebek kabul edilmektedir`
      results.push(roomResult)
      continue
    }

    // Check if room accepts children
    if (childCount > maxChildren) {
      roomResult.capacityExceeded = true
      roomResult.capacityMessage = maxChildren === 0
        ? 'Bu oda çocuk kabul etmemektedir'
        : `Max ${maxChildren} çocuk kabul edilmektedir`
      results.push(roomResult)
      continue
    }

    if (adults > maxAdults || totalPax > maxTotal) {
      roomResult.capacityExceeded = true
      roomResult.capacityMessage = `Max ${maxAdults} yetişkin, ${maxTotal} toplam misafir`
      results.push(roomResult)
      continue
    }

    // Process each meal plan
    for (const mealPlan of mealPlans) {
      try {
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

        // Determine display price based on sales channel
        const channelPrice = salesChannel === 'b2b'
          ? priceResult.pricing.b2bPrice
          : priceResult.pricing.b2cPrice

        // Build option data
        const optionData = {
          mealPlan: {
            _id: mealPlan._id,
            code: mealPlan.code,
            name: mealPlan.name
          },
          pricing: {
            currency: market.currency,
            originalTotal: priceResult.pricing.originalTotal,
            totalDiscount: priceResult.pricing.originalTotal - channelPrice,
            finalTotal: channelPrice,
            avgPerNight: channelPrice / nights,
            perNight: priceResult.pricing.perNight,
            hotelCost: priceResult.pricing.hotelCost,
            b2bPrice: priceResult.pricing.b2bPrice
          },
          campaigns:
            priceResult.campaigns?.applied?.map(c => ({
              code: c.code,
              name:
                typeof c.name === 'object'
                  ? c.name.tr || c.name.en || Object.values(c.name)[0]
                  : c.name,
              discountType: c.discountType,
              discountValue: c.discountValue,
              discountAmount: c.discountAmount,
              discountText: c.discountText
            })) || [],
          dailyBreakdown: priceResult.dailyBreakdown,
          nights,
          nonRefundable: priceResult.nonRefundable?.enabled ? {
            enabled: true,
            discountPercent: priceResult.nonRefundable.discountPercent,
            pricing: {
              finalTotal: salesChannel === 'b2b'
                ? priceResult.nonRefundable.pricing.b2bPrice
                : priceResult.nonRefundable.pricing.b2cPrice,
              avgPerNight: (salesChannel === 'b2b'
                ? priceResult.nonRefundable.pricing.b2bPrice
                : priceResult.nonRefundable.pricing.b2cPrice) / nights,
              hotelCost: priceResult.nonRefundable.pricing.hotelCost,
              b2bPrice: priceResult.nonRefundable.pricing.b2bPrice
            },
            savings: priceResult.nonRefundable.savings
          } : { enabled: false }
        }

        if (priceResult.availability?.isAvailable) {
          roomResult.options.push(optionData)
        } else {
          roomResult.unavailableOptions.push({
            ...optionData,
            available: false,
            issues: priceResult.availability?.issues || [],
            unavailableReason: priceResult.availability?.issues?.[0]?.type || 'no_allotment'
          })
        }
      } catch {
        // Pricing error - silently continue
      }
    }

    if (
      roomResult.options.length > 0 ||
      roomResult.unavailableOptions.length > 0 ||
      roomResult.capacityExceeded
    ) {
      results.push(roomResult)
    }
  }

  res.json({
    success: true,
    data: {
      hotel: {
        _id: hotel._id,
        code: hotel.code,
        name: hotel.name,
        childAgeGroups: hotel.childAgeGroups
      },
      search: {
        checkIn,
        checkOut,
        nights,
        adults,
        children,
        market: {
          _id: market._id,
          code: market.code,
          currency: market.currency
        }
      },
      results
    }
  })
})

/**
 * Get detailed price quote
 * POST /api/bookings/price-quote
 */
export const getPriceQuote = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const {
    hotelId,
    roomTypeId,
    mealPlanId,
    marketId,
    checkIn,
    checkOut,
    adults = 2,
    children = []
  } = req.body

  // Validate
  if (!hotelId || !roomTypeId || !mealPlanId || !checkIn || !checkOut) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  // Get hotel
  const hotel = await Hotel.findOne({
    _id: hotelId,
    partner: partnerId,
    status: 'active'
  })
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Get room type
  const roomType = await RoomType.findOne({
    _id: roomTypeId,
    hotel: hotel._id,
    status: 'active'
  })
  if (!roomType) {
    throw new NotFoundError('ROOM_TYPE_NOT_FOUND')
  }

  // Get meal plan
  const mealPlan = await MealPlan.findOne({
    _id: mealPlanId,
    hotel: hotel._id,
    status: 'active'
  })
  if (!mealPlan) {
    throw new NotFoundError('MEAL_PLAN_NOT_FOUND')
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

  // Get effective child age groups to determine infant age range
  const childAgeGroups = getEffectiveChildAgeGroups(hotel, market)
  const infantGroup = childAgeGroups.find(g => g.code === 'infant')
  const maxInfantAge = infantGroup?.maxAge ?? 2

  // Classify children by age (infant vs child)
  let infantCount = 0
  let childCount = 0
  for (const child of children) {
    const childAge = typeof child === 'object' ? child.age : child
    if (childAge <= maxInfantAge) {
      infantCount++
    } else {
      childCount++
    }
  }

  // Check capacity
  const maxAdults = roomType.occupancy?.maxAdults ?? 2
  const maxChildren = roomType.occupancy?.maxChildren ?? 0
  const maxInfants = roomType.occupancy?.maxInfants ?? 1
  const maxTotal = roomType.occupancy?.totalMaxGuests ?? 4
  const totalPax = adults + childCount

  // Check infant capacity
  if (infantCount > maxInfants) {
    return res.json({
      success: true,
      data: {
        hotel: { _id: hotel._id, code: hotel.code, name: hotel.name },
        roomType: { _id: roomType._id, code: roomType.code, name: roomType.name },
        mealPlan: { _id: mealPlan._id, code: mealPlan.code, name: mealPlan.name },
        market: { _id: market._id, code: market.code, currency: market.currency },
        booking: { checkIn, checkOut, adults, children },
        availability: {
          isAvailable: false,
          capacityExceeded: true,
          capacityMessage: maxInfants === 0
            ? 'Bu oda bebek kabul etmemektedir'
            : `Max ${maxInfants} bebek kabul edilmektedir`
        }
      }
    })
  }

  // Check child capacity
  if (childCount > maxChildren) {
    return res.json({
      success: true,
      data: {
        hotel: { _id: hotel._id, code: hotel.code, name: hotel.name },
        roomType: { _id: roomType._id, code: roomType.code, name: roomType.name },
        mealPlan: { _id: mealPlan._id, code: mealPlan.code, name: mealPlan.name },
        market: { _id: market._id, code: market.code, currency: market.currency },
        booking: { checkIn, checkOut, adults, children },
        availability: {
          isAvailable: false,
          capacityExceeded: true,
          capacityMessage: maxChildren === 0
            ? 'Bu oda çocuk kabul etmemektedir'
            : `Max ${maxChildren} çocuk kabul edilmektedir`
        }
      }
    })
  }

  // Check adult and total capacity
  if (adults > maxAdults || totalPax > maxTotal) {
    return res.json({
      success: true,
      data: {
        hotel: { _id: hotel._id, code: hotel.code, name: hotel.name },
        roomType: { _id: roomType._id, code: roomType.code, name: roomType.name },
        mealPlan: { _id: mealPlan._id, code: mealPlan.code, name: mealPlan.name },
        market: { _id: market._id, code: market.code, currency: market.currency },
        booking: { checkIn, checkOut, adults, children },
        availability: {
          isAvailable: false,
          capacityExceeded: true,
          capacityMessage: `Max ${maxAdults} yetişkin, ${maxTotal} toplam misafir`
        }
      }
    })
  }

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

  res.json({
    success: true,
    data: {
      hotel: {
        _id: hotel._id,
        code: hotel.code,
        name: hotel.name
      },
      roomType: {
        _id: roomType._id,
        code: roomType.code,
        name: roomType.name
      },
      mealPlan: {
        _id: mealPlan._id,
        code: mealPlan.code,
        name: mealPlan.name
      },
      market: {
        _id: market._id,
        code: market.code,
        currency: market.currency
      },
      booking: {
        checkIn,
        checkOut,
        nights: priceResult.nights,
        adults,
        children
      },
      pricing: priceResult.pricing,
      dailyBreakdown: priceResult.dailyBreakdown,
      campaigns: priceResult.campaigns,
      availability: priceResult.availability
    }
  })
})
