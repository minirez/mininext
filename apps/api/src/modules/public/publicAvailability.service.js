/**
 * Public Availability Service
 * Availability search, pricing, and campaign endpoints for B2C
 */

import { asyncHandler } from '#helpers'
import Hotel from '../hotel/hotel.model.js'
import RoomType from '../planning/roomType.model.js'
import MealPlan from '../planning/mealPlan.model.js'
import Market from '../planning/market.model.js'
import Campaign from '../planning/campaign.model.js'
import pricingService from '#services/pricingService.js'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import logger from '#core/logger.js'

/**
 * Find market for hotel by country code or currency
 * @private
 */
async function findMarket(hotelId, countryCode, currency) {
  let market = null

  if (countryCode) {
    market = await Market.findOne({
      hotel: hotelId,
      countries: countryCode.toUpperCase(),
      status: 'active'
    }).lean()
  }

  // Fallback to default market
  if (!market) {
    market = await Market.findOne({
      hotel: hotelId,
      isDefault: true,
      status: 'active'
    }).lean()
  }

  // Fallback to any active market with matching currency
  if (!market && currency) {
    market = await Market.findOne({
      hotel: hotelId,
      currency: currency.toUpperCase(),
      status: 'active'
    }).lean()
  }

  // Final fallback - any active market
  if (!market) {
    market = await Market.findOne({
      hotel: hotelId,
      status: 'active'
    }).lean()
  }

  return market
}

/**
 * Search availability and prices
 * POST /public/hotels/:hotelCode/search
 * Body: { checkIn, checkOut, adults, children: [age1, age2], countryCode, currency }
 */
export const searchAvailability = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params
  const { checkIn, checkOut, adults = 2, children = [], countryCode, currency } = req.body

  // Validate required fields
  if (!checkIn || !checkOut) {
    throw new BadRequestError('CHECK_IN_OUT_REQUIRED')
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

  // Get hotel (hotelCode can be slug or _id)
  const hotelQuery = { status: 'active', 'visibility.b2c': true }
  if (hotelCode.match(/^[0-9a-fA-F]{24}$/)) {
    hotelQuery._id = hotelCode
  } else {
    hotelQuery.slug = hotelCode.toLowerCase()
  }

  const hotel = await Hotel.findOne(hotelQuery).select('_id slug name childAgeGroups').lean()

  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Find market
  const market = await findMarket(hotel._id, countryCode, currency)
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
        code: roomType.code,
        name: roomType.name,
        description: roomType.description,
        images: roomType.images?.slice(0, 3), // Limit images for performance
        occupancy: roomType.occupancy
      },
      options: []
    }

    // Check capacity
    const maxAdults = roomType.occupancy?.maxAdults ?? 2
    const maxChildren = roomType.occupancy?.maxChildren ?? 0
    const maxTotal = roomType.occupancy?.totalMaxGuests ?? 4
    const totalPax = adults + children.length

    // Check if room accepts children
    if (children.length > maxChildren) {
      roomResult.capacityExceeded = true
      roomResult.capacityMessage =
        maxChildren === 0
          ? 'Bu oda çocuk kabul etmemektedir'
          : `Max ${maxChildren} çocuk kabul edilmektedir`
      results.push(roomResult)
      continue
    }

    if (adults > maxAdults || totalPax > maxTotal) {
      roomResult.capacityExceeded = true
      roomResult.capacityMessage = `Max ${maxAdults} adults, ${maxTotal} total guests`
      results.push(roomResult)
      continue
    }

    // Process each meal plan
    for (const mealPlan of mealPlans) {
      try {
        // Use the server-side pricing service
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
          roomResult.options.push({
            mealPlan: {
              code: mealPlan.code,
              name: mealPlan.name
            },
            pricing: {
              currency: market.currency,
              originalTotal: priceResult.pricing.originalTotal,
              totalDiscount: priceResult.pricing.totalDiscount,
              finalTotal: priceResult.pricing.finalTotal,
              avgPerNight: priceResult.pricing.avgPerNight
            },
            campaigns: priceResult.campaigns.applied.map(c => ({
              code: c.code,
              name: c.name,
              discountText: c.discountText
            })),
            nights
          })
        } else {
          // Include unavailable options with reason
          roomResult.options.push({
            mealPlan: {
              code: mealPlan.code,
              name: mealPlan.name
            },
            available: false,
            issues: priceResult.availability?.issues || []
          })
        }
      } catch (error) {
        // Skip this combination if pricing fails
        logger.error(`Pricing error for ${roomType.code}/${mealPlan.code}:`, error.message)
      }
    }

    // Only include room types with at least one option
    if (roomResult.options.length > 0 || roomResult.capacityExceeded) {
      results.push(roomResult)
    }
  }

  res.json({
    success: true,
    data: {
      hotel: {
        slug: hotel.slug,
        name: hotel.name
      },
      search: {
        checkIn,
        checkOut,
        nights,
        adults,
        children,
        market: market.code,
        currency: market.currency,
        paymentTerms: market.paymentTerms || null,
        bankTransferDiscount: market.paymentMethods?.bankTransfer?.discountRate || 0,
        bankTransferReleaseDays: market.paymentMethods?.bankTransfer?.releaseDays ?? 3
      },
      results
    }
  })
})

/**
 * Get price quote for a specific combination
 * POST /public/hotels/:hotelCode/price-quote
 * Body: { roomTypeCode, mealPlanCode, checkIn, checkOut, adults, children: [age1, age2], countryCode }
 */
export const getPriceQuote = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params
  const {
    roomTypeCode,
    mealPlanCode,
    checkIn,
    checkOut,
    adults = 2,
    children = [],
    countryCode
  } = req.body

  // Validate
  if (!roomTypeCode || !mealPlanCode || !checkIn || !checkOut) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  // Get hotel (hotelCode can be slug or _id)
  const hotelQuery = { status: 'active', 'visibility.b2c': true }
  if (hotelCode.match(/^[0-9a-fA-F]{24}$/)) {
    hotelQuery._id = hotelCode
  } else {
    hotelQuery.slug = hotelCode.toLowerCase()
  }

  const hotel = await Hotel.findOne(hotelQuery)
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Get room type
  const roomType = await RoomType.findOne({
    hotel: hotel._id,
    code: roomTypeCode.toUpperCase(),
    status: 'active'
  })
  if (!roomType) {
    throw new NotFoundError('ROOM_TYPE_NOT_FOUND')
  }

  // Get meal plan
  const mealPlan = await MealPlan.findOne({
    hotel: hotel._id,
    code: mealPlanCode.toUpperCase(),
    status: 'active'
  })
  if (!mealPlan) {
    throw new NotFoundError('MEAL_PLAN_NOT_FOUND')
  }

  // Find market
  const market = await findMarket(hotel._id, countryCode)
  if (!market) {
    throw new NotFoundError('NO_MARKET_AVAILABLE')
  }

  // Calculate price with campaigns
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
        slug: hotel.slug,
        name: hotel.name
      },
      roomType: {
        code: roomType.code,
        name: roomType.name
      },
      mealPlan: {
        code: mealPlan.code,
        name: mealPlan.name
      },
      market: {
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

/**
 * Check availability for specific dates
 * GET /public/hotels/:hotelCode/availability
 * Query: { checkIn, checkOut, roomTypeCode, mealPlanCode, countryCode }
 */
export const checkAvailability = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params
  const { checkIn, checkOut, roomTypeCode, mealPlanCode, countryCode } = req.query

  if (!checkIn || !checkOut) {
    throw new BadRequestError('DATES_REQUIRED')
  }

  // Get hotel (hotelCode can be slug or _id)
  const hotelQuery = { status: 'active', 'visibility.b2c': true }
  if (hotelCode.match(/^[0-9a-fA-F]{24}$/)) {
    hotelQuery._id = hotelCode
  } else {
    hotelQuery.slug = hotelCode.toLowerCase()
  }

  const hotel = await Hotel.findOne(hotelQuery)
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Get room types to check
  let roomTypes
  if (roomTypeCode) {
    const roomType = await RoomType.findOne({
      hotel: hotel._id,
      code: roomTypeCode.toUpperCase(),
      status: 'active'
    })
    if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')
    roomTypes = [roomType]
  } else {
    roomTypes = await RoomType.find({ hotel: hotel._id, status: 'active' })
  }

  // Get meal plans
  let mealPlans
  if (mealPlanCode) {
    const mealPlan = await MealPlan.findOne({
      hotel: hotel._id,
      code: mealPlanCode.toUpperCase(),
      status: 'active'
    })
    if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')
    mealPlans = [mealPlan]
  } else {
    mealPlans = await MealPlan.find({ hotel: hotel._id, status: 'active' })
  }

  // Find market
  const market = await findMarket(hotel._id, countryCode)
  if (!market) {
    throw new NotFoundError('NO_MARKET_AVAILABLE')
  }

  // Check availability for each combination
  const availability = []

  for (const roomType of roomTypes) {
    for (const mealPlan of mealPlans) {
      const result = await pricingService.checkAvailability({
        hotelId: hotel._id.toString(),
        roomTypeId: roomType._id.toString(),
        mealPlanId: mealPlan._id.toString(),
        marketId: market._id.toString(),
        startDate: checkIn,
        endDate: checkOut,
        adults: 2
      })

      availability.push({
        roomType: roomType.code,
        mealPlan: mealPlan.code,
        isAvailable: result.isAvailable,
        unavailableDates: result.unavailableDates,
        totalDaysChecked: result.totalDaysChecked
      })
    }
  }

  res.json({
    success: true,
    data: {
      hotel: hotel.slug,
      checkIn,
      checkOut,
      market: market.code,
      availability
    }
  })
})

/**
 * Get active campaigns for a hotel
 * GET /public/hotels/:hotelCode/campaigns
 * Query: { checkIn, checkOut }
 */
export const getActiveCampaigns = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params
  const { checkIn, checkOut } = req.query

  // Get hotel (hotelCode can be slug or _id)
  const hotelQuery = { status: 'active', 'visibility.b2c': true }
  if (hotelCode.match(/^[0-9a-fA-F]{24}$/)) {
    hotelQuery._id = hotelCode
  } else {
    hotelQuery.slug = hotelCode.toLowerCase()
  }

  const hotel = await Hotel.findOne(hotelQuery)
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  const now = new Date()
  const query = {
    hotel: hotel._id,
    status: 'active',
    'bookingWindow.startDate': { $lte: now },
    'bookingWindow.endDate': { $gte: now }
  }

  // Filter by stay window if dates provided
  if (checkIn && checkOut) {
    query['stayWindow.startDate'] = { $lte: new Date(checkOut) }
    query['stayWindow.endDate'] = { $gte: new Date(checkIn) }
  }

  const campaigns = await Campaign.find(query)
    .select('code name description type discount conditions stayWindow visibility')
    .sort({ priority: -1 })
    .lean()

  // Filter by visibility (B2C only)
  const publicCampaigns = campaigns.filter(c => c.visibility?.b2c !== false)

  res.json({
    success: true,
    data: publicCampaigns.map(c => ({
      code: c.code,
      name: c.name,
      description: c.description,
      type: c.type,
      discount: {
        type: c.discount.type,
        value: c.discount.value,
        freeNights: c.discount.freeNights
      },
      conditions: {
        minNights: c.conditions?.minNights,
        maxNights: c.conditions?.maxNights
      },
      stayWindow: c.stayWindow
    }))
  })
})
