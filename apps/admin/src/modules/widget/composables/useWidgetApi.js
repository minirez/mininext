/**
 * Widget API Composable
 * Public API calls for B2C widget
 */

import { ref } from 'vue'
import axios from 'axios'

// API base URL - will be set dynamically based on environment
const getApiBase = () => {
  // Check if we're embedded (external site)
  if (window.__MINIRES_WIDGET_API__) {
    return window.__MINIRES_WIDGET_API__
  }
  // Development - use explicit API URL since widget may bypass Vite proxy
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
  }
  // Production - use same origin
  return '/api'
}

// Create axios instance for widget
const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add API base
api.interceptors.request.use(config => {
  config.baseURL = getApiBase()
  return config
})

// Response interceptor - unwrap axios response AND API envelope { success, data }
api.interceptors.response.use(
  response => {
    const body = response.data
    // Unwrap standard API envelope { success: true, data: ... }
    if (body && body.success && body.data !== undefined) {
      return body.data
    }
    return body
  },
  error => {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Network error'
    return Promise.reject(new Error(message))
  }
)

export function useWidgetApi() {
  const loading = ref(false)
  const error = ref(null)

  /**
   * Detect market from IP
   */
  async function detectMarket() {
    try {
      const response = await api.get('/public/detect-market')
      return response
    } catch (err) {
      console.warn('Market detection failed, using defaults:', err.message)
      return {
        countryCode: 'XX',
        currency: 'EUR',
        locale: 'en-US'
      }
    }
  }

  /**
   * Get hotel by code
   * @param {string} hotelCode - Hotel slug or ID
   * @param {string} partnerId - Partner ID for validation (optional)
   */
  async function getHotel(hotelCode, partnerId = null) {
    loading.value = true
    error.value = null
    try {
      const params = partnerId ? { partner: partnerId } : {}
      const response = await api.get(`/public/hotels/${hotelCode}`, { params })
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get hotel widget config
   * @param {string} hotelCode - Hotel slug or ID
   * @param {string} partnerId - Partner ID for validation (optional)
   */
  async function getWidgetConfig(hotelCode, partnerId = null) {
    try {
      const params = partnerId ? { partner: partnerId } : {}
      const response = await api.get(`/public/hotels/${hotelCode}/widget-config`, { params })
      return response
    } catch (err) {
      console.warn('Widget config fetch failed:', err.message)
      return null
    }
  }

  /**
   * Search availability
   */
  async function searchAvailability(hotelCode, params) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/public/hotels/${hotelCode}/search`, params)
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get price quote for specific room/meal plan
   */
  async function getPriceQuote(hotelCode, params) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/public/hotels/${hotelCode}/price-quote`, params)
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get active campaigns
   */
  async function getCampaigns(hotelCode) {
    try {
      const response = await api.get(`/public/hotels/${hotelCode}/campaigns`)
      return response
    } catch (err) {
      console.warn('Campaigns fetch failed:', err.message)
      return []
    }
  }

  /**
   * Create booking
   */
  async function createBooking(bookingData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/public/bookings', bookingData)
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get booking by number and email
   */
  async function getBooking(bookingNumber, email) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/public/bookings/${bookingNumber}`, {
        params: { email }
      })
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Cancel booking
   */
  async function cancelBooking(bookingNumber, email, reason) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/public/bookings/${bookingNumber}/cancel`, {
        email,
        reason
      })
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get availability calendar
   */
  async function getAvailabilityCalendar(hotelCode, params) {
    try {
      const response = await api.get(`/public/hotels/${hotelCode}/availability`, {
        params
      })
      return response
    } catch (err) {
      console.warn('Availability calendar fetch failed:', err.message)
      return null
    }
  }

  return {
    loading,
    error,
    detectMarket,
    getHotel,
    getWidgetConfig,
    searchAvailability,
    getPriceQuote,
    getCampaigns,
    createBooking,
    getBooking,
    cancelBooking,
    getAvailabilityCalendar
  }
}
