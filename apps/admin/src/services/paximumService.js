import apiClient from './api'

/**
 * Check if Paximum integration is enabled
 */
export const getStatus = async () => {
  const response = await apiClient.get('/paximum/status')
  return response.data.data
}

/**
 * Search locations (autocomplete)
 * @param {string} query - Search term
 * @param {number} productType - Product type (2 = Hotel)
 */
export const autocomplete = async (query, productType = 2) => {
  const response = await apiClient.post('/paximum/autocomplete', { query, productType })
  return response.data.data
}

/**
 * Search hotels
 * @param {Object} params - Search parameters
 * @param {Array} params.arrivalLocations - Location IDs
 * @param {string} params.checkIn - Check-in date (YYYY-MM-DD)
 * @param {number} params.nights - Number of nights
 * @param {Array} params.roomCriteria - Room criteria [{adult: 2, childAges: []}]
 * @param {string} params.nationality - Nationality code (e.g., 'TR')
 * @param {string} params.currency - Currency code (e.g., 'TRY')
 * @param {string} params.culture - Culture code (e.g., 'tr-TR')
 * @param {number} params.markupPercent - Optional markup percentage
 */
export const searchHotels = async (params) => {
  const response = await apiClient.post('/paximum/search', params)
  return response.data.data
}

/**
 * Get hotel details
 * @param {string} hotelId - Paximum hotel ID
 * @param {string} culture - Culture code (e.g., 'tr-TR')
 */
export const getHotelDetails = async (hotelId, culture = 'tr-TR') => {
  const response = await apiClient.post(`/paximum/hotel/${hotelId}`, { culture })
  return response.data.data
}

/**
 * Get offers (rooms) for a hotel
 * @param {Object} params - Search parameters
 * @param {string} params.searchId - SearchId from priceSearch (required)
 * @param {string} params.hotelId - Paximum hotel ID
 * @param {string} params.checkIn - Check-in date
 * @param {number} params.nights - Number of nights
 * @param {Array} params.roomCriteria - Room criteria
 * @param {string} params.nationality - Nationality code
 * @param {string} params.currency - Currency code
 * @param {string} params.culture - Culture code
 * @param {number} params.markupPercent - Optional markup percentage
 */
export const getOffers = async (params) => {
  const response = await apiClient.post('/paximum/offers', params)
  return response.data.data
}

/**
 * Get offer details
 * @param {string} offerId - Offer ID
 * @param {string} currency - Currency code
 * @param {string} culture - Culture code
 */
export const getOfferDetails = async (offerId, currency = 'TRY', culture = 'tr-TR') => {
  const response = await apiClient.post('/paximum/offer-details', { offerId, currency, culture })
  return response.data.data
}

/**
 * Begin a booking transaction
 * @param {Array} offerIds - Array of offer IDs
 * @param {string} currency - Currency code
 * @param {string} culture - Culture code
 */
export const beginTransaction = async (offerIds, currency = 'TRY', culture = 'tr-TR') => {
  const response = await apiClient.post('/paximum/transaction', { offerIds, currency, culture })
  return response.data.data
}

/**
 * Add services to a transaction
 * @param {string} transactionId - Transaction ID
 * @param {Array} offers - Offer details
 * @param {string} currency - Currency code
 * @param {string} culture - Culture code
 */
export const addServices = async (transactionId, offers, currency = 'TRY', culture = 'tr-TR') => {
  const response = await apiClient.post(`/paximum/transaction/${transactionId}/services`, {
    offers,
    currency,
    culture
  })
  return response.data.data
}

/**
 * Set reservation info (travellers)
 * @param {string} transactionId - Transaction ID
 * @param {Array} travellers - Traveller info array
 * @param {Object} customerInfo - Customer contact info
 * @param {string} agencyReservationNumber - Optional agency reference
 */
export const setReservationInfo = async (transactionId, travellers, customerInfo, agencyReservationNumber) => {
  const response = await apiClient.post(`/paximum/transaction/${transactionId}/reservation-info`, {
    travellers,
    customerInfo,
    agencyReservationNumber
  })
  return response.data.data
}

/**
 * Commit transaction (finalize booking)
 * @param {string} transactionId - Transaction ID
 */
export const commitTransaction = async (transactionId) => {
  const response = await apiClient.post(`/paximum/transaction/${transactionId}/commit`)
  return response.data.data
}

/**
 * Get reservation details
 * @param {string} reservationNumber - Paximum reservation number
 */
export const getReservation = async (reservationNumber) => {
  const response = await apiClient.get(`/paximum/reservation/${reservationNumber}`)
  return response.data.data
}

/**
 * Get reservation list
 * @param {Object} params - Filter parameters
 */
export const getReservationList = async (params = {}) => {
  const response = await apiClient.post('/paximum/reservations', params)
  return response.data.data
}

/**
 * Get cancellation penalty
 * @param {string} reservationNumber - Paximum reservation number
 */
export const getCancellationPenalty = async (reservationNumber) => {
  const response = await apiClient.get(`/paximum/reservation/${reservationNumber}/penalty`)
  return response.data.data
}

/**
 * Cancel reservation
 * @param {string} reservationNumber - Paximum reservation number
 * @param {string} reason - Cancellation reason
 */
export const cancelReservation = async (reservationNumber, reason) => {
  const response = await apiClient.post(`/paximum/reservation/${reservationNumber}/cancel`, { reason })
  return response.data.data
}

export default {
  getStatus,
  autocomplete,
  searchHotels,
  getHotelDetails,
  getOffers,
  getOfferDetails,
  beginTransaction,
  addServices,
  setReservationInfo,
  commitTransaction,
  getReservation,
  getReservationList,
  getCancellationPenalty,
  cancelReservation
}
