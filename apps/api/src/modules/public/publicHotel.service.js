/**
 * Public Hotel Service
 * Hotel listing and info endpoints for B2C
 */

import { asyncHandler } from '#helpers'
import Hotel from '../hotel/hotel.model.js'
import RoomType from '../planning/roomType.model.js'
import MealPlan from '../planning/mealPlan.model.js'
import { NotFoundError } from '#core/errors.js'

/**
 * List hotels with filters
 * GET /public/hotels
 * Query: { city, country, stars, type, amenities, page, limit, sort }
 */
export const listHotels = asyncHandler(async (req, res) => {
  const {
    city,
    country,
    stars,
    type,
    amenities,
    featured,
    page = 1,
    limit = 20,
    sort = 'displayOrder'
  } = req.query

  // Build query
  const query = {
    status: 'active',
    'visibility.b2c': true
  }

  // Filters
  if (city) {
    query['address.city'] = { $regex: city, $options: 'i' }
  }
  if (country) {
    query['location.countryCode'] = country.toUpperCase()
  }
  if (stars) {
    query.stars = parseInt(stars)
  }
  if (type) {
    query.type = type
  }
  if (amenities) {
    const amenityList = amenities.split(',').map(a => a.trim())
    query.amenities = { $all: amenityList }
  }
  if (featured === 'true') {
    query.featured = true
  }

  // Build sort
  let sortOption = { displayOrder: 1, name: 1 }
  if (sort === 'name') sortOption = { name: 1 }
  if (sort === '-name') sortOption = { name: -1 }
  if (sort === 'stars') sortOption = { stars: -1, name: 1 }
  if (sort === 'rating') sortOption = { 'stats.averageRating': -1, name: 1 }

  // Pagination
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  // Execute query
  const [hotels, total] = await Promise.all([
    Hotel.find(query)
      .select(
        'name slug stars type category address.city address.country location.countryCode images amenities featured stats'
      )
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Hotel.countDocuments(query)
  ])

  res.json({
    success: true,
    data: {
      hotels: hotels.map(h => ({
        name: h.name,
        slug: h.slug,
        stars: h.stars,
        type: h.type,
        category: h.category,
        city: h.address?.city,
        country: h.address?.country,
        countryCode: h.location?.countryCode,
        image: h.images?.find(img => img.isMain)?.url || h.images?.[0]?.url,
        amenities: h.amenities?.slice(0, 10),
        featured: h.featured,
        rating: h.stats?.averageRating || 0,
        reviewCount: h.stats?.reviewCount || 0
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  })
})

/**
 * Get hotel info for public display
 * GET /public/hotels/:hotelCode
 */
export const getHotelInfo = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params

  const hotel = await Hotel.findOne({ code: hotelCode.toUpperCase(), status: 'active' })
    .select('code name description starRating amenities images location contact childAgeGroups')
    .lean()

  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  res.json({
    success: true,
    data: {
      code: hotel.code,
      name: hotel.name,
      description: hotel.description,
      starRating: hotel.starRating,
      amenities: hotel.amenities,
      images: hotel.images,
      location: hotel.location,
      contact: {
        phone: hotel.contact?.phone,
        email: hotel.contact?.email
      },
      childAgeGroups: hotel.childAgeGroups
    }
  })
})

/**
 * Get available room types for a hotel
 * GET /public/hotels/:hotelCode/room-types
 */
export const getRoomTypes = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params

  const hotel = await Hotel.findOne({ code: hotelCode.toUpperCase(), status: 'active' }).select(
    '_id'
  )
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  const roomTypes = await RoomType.find({
    hotel: hotel._id,
    status: 'active'
  })
    .select('code name description images amenities occupancy')
    .sort('displayOrder')
    .lean()

  res.json({
    success: true,
    data: roomTypes.map(rt => ({
      code: rt.code,
      name: rt.name,
      description: rt.description,
      images: rt.images,
      amenities: rt.amenities,
      occupancy: {
        baseOccupancy: rt.occupancy?.baseOccupancy ?? 2,
        maxAdults: rt.occupancy?.maxAdults ?? 2,
        maxChildren: rt.occupancy?.maxChildren ?? 0,
        totalMaxGuests: rt.occupancy?.totalMaxGuests ?? 4
      }
    }))
  })
})

/**
 * Get meal plans for a hotel
 * GET /public/hotels/:hotelCode/meal-plans
 */
export const getMealPlans = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params

  const hotel = await Hotel.findOne({ code: hotelCode.toUpperCase(), status: 'active' }).select(
    '_id'
  )
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  const mealPlans = await MealPlan.find({
    hotel: hotel._id,
    status: 'active'
  })
    .select('code name description')
    .sort('displayOrder')
    .lean()

  res.json({
    success: true,
    data: mealPlans
  })
})
