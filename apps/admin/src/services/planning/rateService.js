/**
 * Rate Service
 * Handles rate CRUD operations and bulk operations
 */

import apiClient from '../api'
import { apiLogger } from '@/utils/logger'

const BASE_URL = '/planning'

// ==================== RATE CRUD ====================

export const getRates = async (hotelId, params = {}) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/rates`, { params })
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get rates failed', error.response?.data || error.message)
    throw error
  }
}

export const getRatesCalendar = async (hotelId, params = {}) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/rates/calendar`, { params })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Get rates calendar failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const getRatesPriceList = async (hotelId, params = {}) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/rates/price-list`, {
      params
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Get rates price list failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const getRate = async (hotelId, id) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/rates/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get rate failed', error.response?.data || error.message)
    throw error
  }
}

export const createRate = async (hotelId, data) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/rates`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Create rate failed', error.response?.data || error.message)
    throw error
  }
}

export const updateRate = async (hotelId, id, data) => {
  try {
    const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/rates/${id}`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Update rate failed', error.response?.data || error.message)
    throw error
  }
}

export const deleteRate = async (hotelId, id) => {
  try {
    const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/rates/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Delete rate failed', error.response?.data || error.message)
    throw error
  }
}

// ==================== BULK OPERATIONS ====================

export const bulkCreateRates = async (hotelId, rates) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/rates/bulk`, { rates })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Bulk create rates failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const bulkUpdateRates = async (hotelId, updates, filters) => {
  try {
    const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/rates/bulk`, {
      updates,
      filters
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Bulk update rates failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const quickUpdateRates = async (hotelId, rateIds, field, value) => {
  try {
    const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/rates/quick-update`, {
      rateIds,
      field,
      value
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Quick update rates failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const quickUpdateRate = async (hotelId, rateId, data) => {
  try {
    const response = await apiClient.patch(
      `${BASE_URL}/hotels/${hotelId}/rates/${rateId}/quick`,
      data
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Quick update rate failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const toggleStopSale = async (hotelId, rateIds, stopSale, reason = '') => {
  try {
    const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/rates/stop-sale`, {
      rateIds,
      stopSale,
      reason
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Toggle stop sale failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const updateAllotment = async (hotelId, rateIds, allotment) => {
  try {
    const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/rates/allotment`, {
      rateIds,
      allotment
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Update allotment failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const bulkUpdateByDates = async (hotelId, cells, updateFields, marketId) => {
  try {
    const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/rates/by-dates`, {
      cells,
      updateFields,
      marketId
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Bulk update by dates failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const getForecast = async (hotelId, params = {}) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/rates/forecast`, { params })
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get forecast failed', error.response?.data || error.message)
    throw error
  }
}

export default {
  getRates,
  getRatesCalendar,
  getRatesPriceList,
  getRate,
  createRate,
  updateRate,
  deleteRate,
  bulkCreateRates,
  bulkUpdateRates,
  quickUpdateRates,
  quickUpdateRate,
  toggleStopSale,
  updateAllotment,
  bulkUpdateByDates,
  getForecast
}
