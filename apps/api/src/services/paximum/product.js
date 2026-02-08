/**
 * Paximum Product Module
 *
 * Handles product search, hotel details, and offer operations
 */

import { makeRequest } from './auth.js'
import logger from '../../core/logger.js'

// API path
const PRODUCT_SERVICE = '/api/productservice'

/**
 * Apply markup to price
 */
export function applyMarkup(amount, markupPercent) {
  return parseFloat((amount + (amount * markupPercent) / 100).toFixed(2))
}

/**
 * Search for arrival locations (autocomplete)
 */
export async function searchLocations(query, productType = 2) {
  const result = await makeRequest(`${PRODUCT_SERVICE}/getarrivalautocomplete`, {
    Query: query,
    ProductType: productType, // 2 = Hotel
    Culture: 'tr-TR'
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Lokasyon araması başarısız')
  }

  const items = result.body?.items || []

  // Normalize data for frontend
  // Type 1 = City/Region, Type 2 = Hotel, Type 3 = Country (not supported)
  return items
    .filter(item => item.type !== 3) // Filter out Country type - not supported for hotel search
    .map(item => {
      const isHotel = item.type === 2

      return {
        id: isHotel ? item.hotel?.id : item.city?.id,
        name: isHotel ? item.hotel?.name : item.city?.name,
        type: item.type,
        country: item.country?.name || '',
        countryCode: item.country?.id || '',
        city: item.city?.name || item.state?.name || '',
        hotelCount: item.hotelCount || 0,
        geolocation: item.geolocation || null,
        // Keep original data for search
        provider: item.provider,
        giataInfo: item.giataInfo
      }
    })
    .filter(item => item.id && item.name) // Filter out invalid items
}

/**
 * Search hotels with pricing
 */
export async function searchHotels(params, markupPercent = 10) {
  const {
    arrivalLocations,
    Products,
    checkIn,
    nights,
    roomCriteria,
    nationality = 'TR',
    currency = 'TRY',
    culture = 'tr-TR'
  } = params

  const requestBody = {
    ProductType: 2, // Hotel
    CheckAllotment: true,
    CheckStopSale: true,
    GetOnlyDiscountedPrice: false,
    GetOnlyBestOffers: false, // false = get ALL offers, not just best one
    CheckIn: checkIn, // Format: YYYY-MM-DD
    Night: nights,
    RoomCriteria: roomCriteria, // [{ adult: 2, childAges: [] }]
    Nationality: nationality,
    Currency: currency,
    Culture: culture
  }

  // If explicit Products array is provided (single-hotel search / showcase),
  // pass it directly — no arrivalLocations needed.
  if (Products && Products.length) {
    requestBody.Products = Products.map(String)
  } else {
    // Location-based search: forward arrivalLocations as-is to Paximum.
    // The frontend already sends the correct Paximum format:
    //   [{id: "60689", type: 2}]  →  city/region search
    // We pass it through directly, same as the old backend did.
    requestBody.ArrivalLocations = arrivalLocations
  }

  const result = await makeRequest(`${PRODUCT_SERVICE}/pricesearch`, requestBody)

  // Check if it's a "no results" response (not an actual error)
  if (!result.header?.success) {
    const message = result.header?.messages?.[0]?.message || ''
    // "No price found" messages are valid - just return empty result
    if (
      message.includes('fiyat bulunamadı') ||
      message.includes('price') ||
      message.includes('bulunamadı')
    ) {
      logger.info('Paximum: No hotels found for criteria', { message })
      return { hotels: [], searchId: null }
    }
    // Actual API error
    throw new Error(message || 'Otel araması başarısız')
  }

  const hotels = result.body?.hotels || []
  const searchId = result.body?.searchId || null

  // Apply markup to prices
  for (const hotel of hotels) {
    for (const offer of hotel.offers || []) {
      if (offer.price?.amount) {
        offer.originalPrice = { ...offer.price }
        offer.price.amount = applyMarkup(offer.price.amount, markupPercent)
      }
      for (const room of offer.rooms || []) {
        if (room.price?.amount) {
          room.originalPrice = { ...room.price }
          room.price.amount = applyMarkup(room.price.amount, markupPercent)
        }
      }
    }
  }

  return { hotels, searchId }
}

/**
 * Get hotel details
 */
export async function getHotelDetails(hotelId, culture = 'tr-TR') {
  const result = await makeRequest(`${PRODUCT_SERVICE}/getproductinfo`, {
    ProductType: 2,
    Product: hotelId,
    Culture: culture
  })

  return result.body || null
}

/**
 * Get offers for a hotel
 */
export async function getOffers(params, markupPercent = 10) {
  const {
    searchId,
    hotelId,
    checkIn,
    nights,
    roomCriteria,
    nationality = 'TR',
    currency = 'TRY',
    culture = 'tr-TR'
  } = params

  const result = await makeRequest(`${PRODUCT_SERVICE}/getoffers`, {
    SearchId: searchId,
    ProductType: 2,
    Product: hotelId,
    CheckIn: checkIn,
    Night: nights,
    RoomCriteria: roomCriteria,
    Nationality: nationality,
    Currency: currency,
    Culture: culture,
    GetOnlyBestOffers: false
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Oda fiyatları alınamadı')
  }

  const offers = result.body?.offers || []

  // Apply markup
  for (const offer of offers) {
    if (offer.price?.amount) {
      offer.originalPrice = { ...offer.price }
      offer.price.amount = applyMarkup(offer.price.amount, markupPercent)
    }
    for (const room of offer.rooms || []) {
      if (room.price?.amount) {
        room.originalPrice = { ...room.price }
        room.price.amount = applyMarkup(room.price.amount, markupPercent)
      }
    }
  }

  return offers
}

/**
 * Get offer details
 */
export async function getOfferDetails(offerId, currency = 'TRY', culture = 'tr-TR') {
  const result = await makeRequest(`${PRODUCT_SERVICE}/getofferdetails`, {
    OfferId: offerId,
    Currency: currency,
    Culture: culture
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Oda detayları alınamadı')
  }

  return result.body
}
