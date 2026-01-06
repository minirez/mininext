/**
 * Hotel Listing Service
 * Hotel listing and search operations for booking
 * Split from booking.service.js for better maintainability
 */

import { asyncHandler } from '../../helpers/asyncHandler.js'
import Hotel from '../hotel/hotel.model.js'
import { BadRequestError } from '../../core/errors.js'
import { getPartnerId } from '../../services/helpers.js'

// ==================== HOTEL LISTING ====================

/**
 * Get partner's hotels for booking
 * GET /api/bookings/hotels
 */
export const getPartnerHotels = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const hotels = await Hotel.find({
    partner: partnerId,
    status: 'active'
  })
    .select('_id code name slug stars type address.city location.countryCode images childAgeGroups')
    .sort('name')
    .lean()

  res.json({
    success: true,
    data: hotels.map(h => ({
      _id: h._id,
      code: h.code,
      name: h.name,
      slug: h.slug,
      stars: h.stars,
      type: h.type,
      city: h.address?.city,
      countryCode: h.location?.countryCode,
      image: h.images?.find(img => img.isMain)?.url || h.images?.[0]?.url,
      childAgeGroups: h.childAgeGroups
    }))
  })
})

/**
 * Get partner's hotels with regions and provinces
 * Returns all hotels with their tourism regions for autocomplete
 * GET /api/bookings/hotels-with-regions
 */
export const getPartnerHotelsWithRegions = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  // Get all hotels with populated tourism regions
  const hotels = await Hotel.find({
    partner: partnerId,
    status: 'active'
  })
    .select(
      '_id code name slug stars type address.city location images policies.maxChildAge childAgeGroups'
    )
    .populate('location.tourismRegions', 'name code province')
    .sort('name')
    .lean()

  // Extract unique regions and provinces from hotels
  const regionsMap = new Map()
  const provincesMap = new Map()

  hotels.forEach(hotel => {
    // Count hotels per region (tourismRegions is an array)
    if (hotel.location?.tourismRegions?.length > 0) {
      hotel.location.tourismRegions.forEach(region => {
        if (region && region._id) {
          if (regionsMap.has(region._id.toString())) {
            regionsMap.get(region._id.toString()).hotelCount++
          } else {
            regionsMap.set(region._id.toString(), {
              _id: region._id,
              name: region.name,
              code: region.code,
              provinceName: hotel.address?.city,
              hotelCount: 1
            })
          }
        }
      })
    }

    // Count hotels per province (city)
    if (hotel.address?.city) {
      const cityKey = hotel.address.city.toLowerCase()
      if (provincesMap.has(cityKey)) {
        provincesMap.get(cityKey).hotelCount++
      } else {
        provincesMap.set(cityKey, {
          _id: cityKey,
          name: { tr: hotel.address.city, en: hotel.address.city },
          hotelCount: 1
        })
      }
    }
  })

  res.json({
    success: true,
    data: {
      hotels: hotels.map(h => {
        // Get first tourism region for display
        const firstRegion = h.location?.tourismRegions?.[0]
        return {
          _id: h._id,
          code: h.code,
          name: h.name,
          slug: h.slug,
          stars: h.stars,
          type: h.type,
          city: h.address?.city,
          tourismRegion: firstRegion
            ? {
                _id: firstRegion._id,
                name: firstRegion.name
              }
            : null,
          images: h.images?.slice(0, 1) || [],
          maxChildAge: h.policies?.maxChildAge || 12,
          childAgeGroups: h.childAgeGroups
        }
      }),
      regions: Array.from(regionsMap.values()),
      provinces: Array.from(provincesMap.values())
    }
  })
})

/**
 * Search hotels and regions with autocomplete
 * POST /api/bookings/search-autocomplete
 */
export const searchHotelsAndRegions = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }

  const { query, mode = 'hotel' } = req.body

  if (!query || query.length < 2) {
    return res.json({
      success: true,
      data: { hotels: [], regions: [], provinces: [] }
    })
  }

  const searchRegex = new RegExp(query, 'i')

  if (mode === 'hotel') {
    // Search hotels
    const hotels = await Hotel.find({
      partner: partnerId,
      status: 'active',
      $or: [{ name: searchRegex }, { code: searchRegex }, { 'address.city': searchRegex }]
    })
      .select(
        '_id code name slug stars type address.city location images policies.maxChildAge childAgeGroups'
      )
      .populate('location.tourismRegions', 'name code')
      .limit(20)
      .lean()

    res.json({
      success: true,
      data: {
        hotels: hotels.map(h => {
          const firstRegion = h.location?.tourismRegions?.[0]
          return {
            _id: h._id,
            code: h.code,
            name: h.name,
            slug: h.slug,
            stars: h.stars,
            type: h.type,
            city: h.address?.city,
            tourismRegion: firstRegion || null,
            images: h.images?.slice(0, 1) || [],
            maxChildAge: h.policies?.maxChildAge || 12,
            childAgeGroups: h.childAgeGroups
          }
        }),
        regions: [],
        provinces: []
      }
    })
  } else {
    // Search regions - get hotels first to find their regions
    const hotels = await Hotel.find({
      partner: partnerId,
      status: 'active'
    })
      .select('_id address.city location')
      .populate('location.tourismRegions', 'name code province')
      .lean()

    // Aggregate regions and provinces matching the query
    const regionsMap = new Map()
    const provincesMap = new Map()

    hotels.forEach(hotel => {
      // Check tourism regions (array)
      if (hotel.location?.tourismRegions?.length > 0) {
        hotel.location.tourismRegions.forEach(region => {
          if (region && region._id) {
            const regionName = region.name?.tr || region.name?.en || ''
            if (searchRegex.test(regionName) || searchRegex.test(region.code)) {
              const key = region._id.toString()
              if (regionsMap.has(key)) {
                regionsMap.get(key).hotelCount++
              } else {
                regionsMap.set(key, {
                  _id: region._id,
                  name: region.name,
                  code: region.code,
                  provinceName: hotel.address?.city,
                  hotelCount: 1
                })
              }
            }
          }
        })
      }

      // Check province/city
      if (hotel.address?.city) {
        if (searchRegex.test(hotel.address.city)) {
          const key = hotel.address.city.toLowerCase()
          if (provincesMap.has(key)) {
            provincesMap.get(key).hotelCount++
          } else {
            provincesMap.set(key, {
              _id: key,
              name: { tr: hotel.address.city, en: hotel.address.city },
              hotelCount: 1
            })
          }
        }
      }
    })

    res.json({
      success: true,
      data: {
        hotels: [],
        regions: Array.from(regionsMap.values()).slice(0, 10),
        provinces: Array.from(provincesMap.values()).slice(0, 10)
      }
    })
  }
})
