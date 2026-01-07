/**
 * Booking Service
 * API calls for booking operations
 */

import apiClient from './api'

/**
 * Get partner's hotels for booking dropdown
 */
const getPartnerHotels = async () => {
  const response = await apiClient.get('/bookings/hotels')
  return response.data
}

/**
 * Get partner's hotels with regions and provinces for autocomplete
 */
const getPartnerHotelsWithRegions = async () => {
  const response = await apiClient.get('/bookings/hotels-with-regions')
  return response.data
}

/**
 * Search hotels and regions (autocomplete)
 * @param {Object} data - { query, mode: 'hotel' | 'region' }
 */
const searchHotelsAndRegions = async data => {
  const response = await apiClient.post('/bookings/search-autocomplete', data)
  return response.data
}

/**
 * Search hotels with prices (multi-hotel/region search)
 * @param {Object} data - { tourismRegionIds, hotelIds, checkIn, checkOut, adults, children, countryCode, channel }
 */
const searchHotelsWithPrices = async data => {
  const response = await apiClient.post('/bookings/search-hotels', data)
  return response.data
}

/**
 * Search availability for a hotel
 * @param {Object} data - { hotelId, checkIn, checkOut, adults, children, countryCode, currency }
 */
const searchAvailability = async data => {
  const response = await apiClient.post('/bookings/search', data)
  return response.data
}

/**
 * Get detailed price quote
 * @param {Object} data - { hotelId, roomTypeId, mealPlanId, marketId, checkIn, checkOut, adults, children }
 */
const getPriceQuote = async data => {
  const response = await apiClient.post('/bookings/price-quote', data)
  return response.data
}

/**
 * Get list of bookings
 * @param {Object} params - { status, hotelId, checkInFrom, checkInTo, search, page, limit, sort }
 */
const getBookings = async (params = {}) => {
  const response = await apiClient.get('/bookings', { params })
  return response.data
}

/**
 * Get booking detail
 * @param {string} id - Booking ID
 */
const getBooking = async id => {
  const response = await apiClient.get(`/bookings/${id}`)
  return response.data
}

/**
 * Create a new booking
 * @param {Object} data - Booking data
 */
const createBooking = async data => {
  const response = await apiClient.post('/bookings', data)
  return response.data
}

/**
 * Update booking status
 * @param {string} id - Booking ID
 * @param {string} status - New status
 */
const updateBookingStatus = async (id, status) => {
  const response = await apiClient.patch(`/bookings/${id}/status`, { status })
  return response.data
}

/**
 * Cancel booking
 * @param {string} id - Booking ID
 * @param {string} reason - Cancellation reason
 */
const cancelBooking = async (id, reason = '') => {
  const response = await apiClient.post(`/bookings/${id}/cancel`, { reason })
  return response.data
}

/**
 * Add note to booking
 * @param {string} id - Booking ID
 * @param {string} content - Note content
 * @param {boolean} isInternal - Whether note is internal
 */
const addBookingNote = async (id, content, isInternal = true) => {
  const response = await apiClient.post(`/bookings/${id}/notes`, { content, isInternal })
  return response.data
}

/**
 * Hard delete booking (superadmin only)
 * @param {string} id - Booking ID
 */
const deleteBooking = async id => {
  const response = await apiClient.delete(`/bookings/${id}`)
  return response.data
}

/**
 * Get booking statistics
 * @param {Object} params - { hotelId, period }
 */
const getBookingStats = async (params = {}) => {
  const response = await apiClient.get('/bookings/stats', { params })
  return response.data
}

// ==================== DRAFT BOOKING FUNCTIONS ====================

/**
 * Get user's draft bookings
 */
const getMyDrafts = async () => {
  const response = await apiClient.get('/bookings/drafts')
  return response.data
}

/**
 * Create a draft booking (Phase 1 -> Phase 2 transition)
 * @param {Object} data - { searchCriteria, cart, selectedHotel }
 */
const createDraft = async data => {
  const response = await apiClient.post('/bookings/drafts', data)
  return response.data
}

/**
 * Get draft by booking number
 * @param {string} bookingNumber - DRF-YYYY-NNNNNN
 */
const getDraft = async bookingNumber => {
  const response = await apiClient.get(`/bookings/drafts/${bookingNumber}`)
  return response.data
}

/**
 * Update draft (auto-save)
 * @param {string} bookingNumber - DRF-YYYY-NNNNNN
 * @param {Object} data - Updated draft data
 */
const updateDraft = async (bookingNumber, data) => {
  const response = await apiClient.put(`/bookings/drafts/${bookingNumber}`, data)
  return response.data
}

/**
 * Delete draft
 * @param {string} bookingNumber - DRF-YYYY-NNNNNN
 */
const deleteDraft = async bookingNumber => {
  const response = await apiClient.delete(`/bookings/drafts/${bookingNumber}`)
  return response.data
}

/**
 * Complete draft -> confirmed booking
 * @param {string} bookingNumber - DRF-YYYY-NNNNNN
 * @param {Object} data - { paymentMethod, invoiceDetails, leadGuest, roomGuests }
 */
const completeDraft = async (bookingNumber, data) => {
  const response = await apiClient.post(`/bookings/drafts/${bookingNumber}/complete`, data)
  return response.data
}

// ==================== AMENDMENT (BOOKING MODIFICATION) FUNCTIONS ====================

/**
 * Get booking data for amendment
 * @param {string} id - Booking ID
 * @returns {Promise} - { booking, availableRoomTypes, availableMealPlans, availableMarkets, canAmend }
 */
const getBookingForAmendment = async id => {
  const response = await apiClient.get(`/bookings/${id}/amendment`)
  return response.data
}

/**
 * Preview amendment changes (calculates new price, checks availability)
 * @param {string} id - Booking ID
 * @param {Object} data - { checkIn, checkOut, rooms, leadGuest, contact, invoiceDetails, specialRequests }
 * @returns {Promise} - { changes, availability, original, preview, priceDifference }
 */
const previewAmendment = async (id, data) => {
  const response = await apiClient.post(`/bookings/${id}/amendment/preview`, data)
  return response.data
}

/**
 * Apply amendment to booking
 * @param {string} id - Booking ID
 * @param {Object} data - { checkIn, checkOut, rooms, leadGuest, contact, invoiceDetails, specialRequests, reason, priceDifferenceAdjustment }
 * @returns {Promise} - { bookingNumber, amendmentApplied, snapshotId, changes, priceDifference }
 */
const applyBookingAmendment = async (id, data) => {
  const response = await apiClient.post(`/bookings/${id}/amendment/apply`, data)
  return response.data
}

/**
 * Get amendment history for a booking
 * @param {string} id - Booking ID
 * @returns {Promise} - { bookingNumber, totalAmendments, amendments: [...] }
 */
const getAmendmentHistory = async id => {
  const response = await apiClient.get(`/bookings/${id}/amendments`)
  return response.data
}

export { getBookingForAmendment, previewAmendment, applyBookingAmendment, getAmendmentHistory }

export default {
  getPartnerHotels,
  getPartnerHotelsWithRegions,
  searchHotelsAndRegions,
  searchHotelsWithPrices,
  searchAvailability,
  getPriceQuote,
  getBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  addBookingNote,
  getBookingStats,
  // Draft functions
  getMyDrafts,
  createDraft,
  getDraft,
  updateDraft,
  deleteDraft,
  completeDraft,
  // Amendment functions
  getBookingForAmendment,
  previewAmendment,
  applyBookingAmendment,
  getAmendmentHistory
}
