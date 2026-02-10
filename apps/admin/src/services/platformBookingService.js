/**
 * Platform Booking Service
 * API calls for platform-level booking operations (cross-partner)
 */

import apiClient from './api'

/**
 * Get bookings across all partners
 * @param {Object} params - { status, partnerId, hotelId, checkInFrom, checkInTo, search, source, page, limit, sortBy, sortOrder }
 */
const getBookings = async (params = {}) => {
  const response = await apiClient.get('/platform/bookings', { params })
  return response.data
}

/**
 * Get platform-wide booking statistics
 * @param {Object} params - { partnerId, period }
 */
const getStats = async (params = {}) => {
  const response = await apiClient.get('/platform/bookings/stats', { params })
  return response.data
}

export default {
  getBookings,
  getStats
}
