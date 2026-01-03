/**
 * Paximum OTA Integration Service
 *
 * Handles communication with Paximum API for hotel search and booking
 * Reference: https://service.paximum.com/v2
 */

import axios from 'axios'
import dayjs from 'dayjs'
import PlatformSettings from '../modules/platform-settings/platformSettings.model.js'
import logger from '../core/logger.js'

// API paths
const PRODUCT_SERVICE = '/api/productservice'
const BOOKING_SERVICE = '/api/bookingservice'
const AUTH_SERVICE = '/api/authenticationservice'
const PAYMENT_SERVICE = '/api/paymentservice'

/**
 * Get or refresh Paximum API token
 * Token is cached in PlatformSettings and refreshed when expired
 */
async function getToken() {
  const settings = await PlatformSettings.getSettings()
  const creds = settings.getPaximumCredentials()

  if (!creds) {
    throw new Error('Paximum entegrasyonu yapılandırılmamış')
  }

  // Check if we have a valid cached token
  if (creds.token && creds.tokenExpiresOn) {
    const expiresAt = dayjs(creds.tokenExpiresOn)
    // Add 5 minute buffer before expiry
    if (expiresAt.isAfter(dayjs().add(5, 'minute'))) {
      return creds.token
    }
  }

  // Token expired or not available - get a new one
  logger.info('Paximum: Refreshing authentication token')

  try {
    const response = await axios.post(
      `${creds.endpoint}${AUTH_SERVICE}/login`,
      {
        Agency: creds.agency,
        User: creds.user,
        Password: creds.password
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    )

    if (!response.data?.body?.token) {
      throw new Error('Paximum login yanıtında token bulunamadı')
    }

    const { token, expiresOn } = response.data.body

    // Cache the new token
    await settings.updatePaximumToken(token, new Date(expiresOn))

    logger.info('Paximum: Token refreshed successfully')
    return token
  } catch (error) {
    logger.error('Paximum: Authentication failed', { error: error.message })
    throw new Error(`Paximum kimlik doğrulama hatası: ${error.message}`)
  }
}

/**
 * Get Paximum API endpoint from settings
 */
async function getEndpoint() {
  const settings = await PlatformSettings.getSettings()
  const creds = settings.getPaximumCredentials()
  if (!creds) {
    throw new Error('Paximum entegrasyonu yapılandırılmamış')
  }
  return creds.endpoint
}

/**
 * Make authenticated request to Paximum API
 */
async function makeRequest(path, data, options = {}) {
  const token = await getToken()
  const endpoint = await getEndpoint()

  try {
    const response = await axios.post(`${endpoint}${path}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: options.timeout || 60000
    })

    return response.data
  } catch (error) {
    logger.error(`Paximum API error: ${path}`, {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    })

    if (error.response?.status === 401) {
      // Token might be invalid - clear cache and retry once
      const settings = await PlatformSettings.getSettings()
      await settings.updatePaximumToken(null, null)
      throw new Error('Paximum oturum süresi dolmuş, lütfen tekrar deneyin')
    }

    throw new Error(`Paximum API hatası: ${error.message}`)
  }
}

/**
 * Apply markup to price
 */
function applyMarkup(amount, markupPercent) {
  return parseFloat((amount + (amount * markupPercent / 100)).toFixed(2))
}

/**
 * Search for arrival locations (autocomplete)
 */
async function searchLocations(query, productType = 2) {
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
async function searchHotels(params, markupPercent = 10) {
  const {
    arrivalLocations,
    checkIn,
    nights,
    roomCriteria,
    nationality = 'TR',
    currency = 'TRY',
    culture = 'tr-TR'
  } = params

  // Build request based on location type
  // Type 1 = City/Region: use ArrivalLocations with type: 2 (always 2 for cities!)
  // Type 2 = Hotel: use Products array
  const location = arrivalLocations?.[0]
  const isHotel = location?.type === 2

  const requestBody = {
    ProductType: 2, // Hotel
    CheckAllotment: true,
    CheckStopSale: true,
    GetOnlyDiscountedPrice: false,
    GetOnlyBestOffers: false, // false = get ALL offers, not just best one
    CheckIn: checkIn, // Format: YYYY-MM-DD
    Night: nights,
    RoomCriteria: roomCriteria, // [{ Adult: 2, ChildAges: [] }]
    Nationality: nationality,
    Currency: currency,
    Culture: culture
  }

  if (isHotel) {
    // For hotels, use Products array
    requestBody.Products = [location.id]
  } else {
    // For cities/regions, use ArrivalLocations with type: 2 (required by Paximum)
    requestBody.ArrivalLocations = [{ id: location.id, type: 2 }]
  }

  const result = await makeRequest(`${PRODUCT_SERVICE}/pricesearch`, requestBody)

  // Check if it's a "no results" response (not an actual error)
  if (!result.header?.success) {
    const message = result.header?.messages?.[0]?.message || ''
    // "No price found" messages are valid - just return empty result
    if (message.includes('fiyat bulunamadı') || message.includes('price') || message.includes('bulunamadı')) {
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
async function getHotelDetails(hotelId, culture = 'tr-TR') {
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
async function getOffers(params, markupPercent = 10) {
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
async function getOfferDetails(offerId, currency = 'TRY', culture = 'tr-TR') {
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

/**
 * Begin a booking transaction
 */
async function beginTransaction(offerIds, currency = 'TRY', culture = 'tr-TR') {
  const result = await makeRequest(`${BOOKING_SERVICE}/begintransaction`, {
    OfferIds: offerIds,
    Currency: currency,
    Culture: culture
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'İşlem başlatılamadı')
  }

  return result.body
}

/**
 * Add services to transaction
 */
async function addServices(transactionId, offers, currency = 'TRY', culture = 'tr-TR') {
  const result = await makeRequest(`${BOOKING_SERVICE}/addservices`, {
    TransactionId: transactionId,
    Offers: offers,
    Currency: currency,
    Culture: culture
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Servis eklenemedi')
  }

  return result.body
}

/**
 * Set reservation info (travelers and customer)
 */
async function setReservationInfo(transactionId, travellers, customerInfo, agencyReservationNumber) {
  const result = await makeRequest(`${BOOKING_SERVICE}/setreservationinfo`, {
    TransactionId: transactionId,
    Travellers: travellers,
    CustomerInfo: customerInfo,
    AgencyReservationNumber: agencyReservationNumber
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Rezervasyon bilgileri kaydedilemedi')
  }

  return result.body
}

/**
 * Commit transaction (finalize booking)
 */
async function commitTransaction(transactionId) {
  const endpoint = await getEndpoint()
  const token = await getToken()

  // First, begin payment transaction
  const paymentResult = await axios.post(
    `${endpoint}${PAYMENT_SERVICE}/beginpaymenttransaction`,
    {
      TransactionId: transactionId,
      PaymentOption: 2 // Credit to agency account
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  )

  // Then commit the transaction
  const commitResult = await makeRequest(`${BOOKING_SERVICE}/committransaction`, {
    TransactionId: transactionId,
    PaymentOption: 2
  })

  if (!commitResult.header?.success) {
    throw new Error(commitResult.header?.messages?.[0]?.message || 'Rezervasyon onaylanamadı')
  }

  return {
    payment: paymentResult.data?.body,
    reservation: commitResult.body
  }
}

/**
 * Get reservation details
 */
async function getReservationDetail(reservationNumber) {
  const result = await makeRequest(`${BOOKING_SERVICE}/getreservationdetail`, {
    ReservationNumber: reservationNumber
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Rezervasyon bulunamadı')
  }

  return result.body
}

/**
 * Get reservation list
 */
async function getReservationList(params) {
  const result = await makeRequest(`${BOOKING_SERVICE}/getreservationlist`, params)

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Rezervasyon listesi alınamadı')
  }

  return result.body
}

/**
 * Get cancellation penalties
 */
async function getCancellationPenalty(reservationNumber) {
  const result = await makeRequest(`${BOOKING_SERVICE}/getcancellationpenalty`, {
    ReservationNumber: reservationNumber
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'İptal cezası bilgisi alınamadı')
  }

  return result.body?.cancelPenalties || []
}

/**
 * Cancel reservation
 */
async function cancelReservation(reservationNumber, reason = null) {
  // Get cancellation penalties to find appropriate reason
  const penalties = await getCancellationPenalty(reservationNumber)

  let reasonId = 6 // Default: NO REASON
  for (const penalty of penalties) {
    if (penalty.name === 'NO REASON') {
      reasonId = penalty.id
      break
    }
  }

  const result = await makeRequest(`${BOOKING_SERVICE}/cancelreservation`, {
    ReservationNumber: reservationNumber,
    Reason: reason || reasonId
  })

  if (!result.header?.success) {
    throw new Error(result.header?.messages?.[0]?.message || 'Rezervasyon iptal edilemedi')
  }

  return result.body
}

/**
 * Check if Paximum integration is enabled
 */
async function isEnabled() {
  const settings = await PlatformSettings.getSettings()
  return settings.paximum?.enabled === true
}

/**
 * Get default markup percentage
 */
async function getDefaultMarkup() {
  const settings = await PlatformSettings.getSettings()
  return settings.paximum?.defaultMarkup || 10
}

export const paximumService = {
  // Auth
  getToken,
  isEnabled,
  getDefaultMarkup,

  // Search
  searchLocations,
  searchHotels,
  getHotelDetails,
  getOffers,
  getOfferDetails,

  // Booking
  beginTransaction,
  addServices,
  setReservationInfo,
  commitTransaction,

  // Reservation Management
  getReservationDetail,
  getReservationList,
  getCancellationPenalty,
  cancelReservation
}

export default paximumService
