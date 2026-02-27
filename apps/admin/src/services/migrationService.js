import apiClient from './api'
import { apiLogger } from '@/utils/logger'

const BASE = '/migration'

const connectLegacy = async uri => {
  try {
    const response = await apiClient.post(`${BASE}/connect`, { uri })
    return response.data
  } catch (error) {
    apiLogger.error('Migration Service: Connect failed', error.response?.data || error.message)
    throw error
  }
}

const disconnectLegacy = async () => {
  try {
    const response = await apiClient.post(`${BASE}/disconnect`)
    return response.data
  } catch (error) {
    apiLogger.error('Migration Service: Disconnect failed', error.response?.data || error.message)
    throw error
  }
}

const getStatus = async () => {
  try {
    const response = await apiClient.get(`${BASE}/status`)
    return response.data
  } catch (error) {
    apiLogger.error('Migration Service: Status check failed', error.response?.data || error.message)
    throw error
  }
}

const getAccounts = async (params = {}) => {
  try {
    const response = await apiClient.get(`${BASE}/accounts`, { params })
    return response.data
  } catch (error) {
    apiLogger.error('Migration Service: Get accounts failed', error.response?.data || error.message)
    throw error
  }
}

const getAccountHotels = async accountId => {
  try {
    const response = await apiClient.get(`${BASE}/accounts/${accountId}/hotels`)
    return response.data
  } catch (error) {
    apiLogger.error('Migration Service: Get hotels failed', error.response?.data || error.message)
    throw error
  }
}

const previewHotel = async (accountId, hotelId) => {
  try {
    const response = await apiClient.get(`${BASE}/accounts/${accountId}/hotels/${hotelId}/preview`)
    return response.data
  } catch (error) {
    apiLogger.error('Migration Service: Preview failed', error.response?.data || error.message)
    throw error
  }
}

const migrate = async data => {
  try {
    const response = await apiClient.post(`${BASE}/migrate`, data, { timeout: 300000 })
    return response.data
  } catch (error) {
    apiLogger.error('Migration Service: Migration failed', error.response?.data || error.message)
    throw error
  }
}

const getAccountReservations = async (accountId, params = {}) => {
  try {
    const response = await apiClient.get(`${BASE}/accounts/${accountId}/reservations`, { params })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Migration Service: Get reservations failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const migrateReservations = async data => {
  try {
    const response = await apiClient.post(`${BASE}/migrate-reservations`, data, { timeout: 600000 })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Migration Service: Reservation migration failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const getHistory = async (params = {}) => {
  try {
    const response = await apiClient.get(`${BASE}/history`, { params })
    return response.data
  } catch (error) {
    apiLogger.error('Migration Service: Get history failed', error.response?.data || error.message)
    throw error
  }
}

// Standalone reservation migration
const getLegacyHotelsWithBookings = async () => {
  try {
    const response = await apiClient.get(`${BASE}/reservations/legacy-hotels`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Migration Service: Get legacy hotels failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const getNewSystemHotels = async partnerId => {
  try {
    const response = await apiClient.get(`${BASE}/reservations/new-hotels`, {
      params: { partnerId }
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Migration Service: Get new hotels failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const startReservationMigration = async data => {
  try {
    const response = await apiClient.post(`${BASE}/reservations/migrate`, data, { timeout: 600000 })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Migration Service: Reservation migration failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const getReservationMigrationHistory = async (params = {}) => {
  try {
    const response = await apiClient.get(`${BASE}/reservations/history`, { params })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Migration Service: Get reservation history failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export default {
  connectLegacy,
  disconnectLegacy,
  getStatus,
  getAccounts,
  getAccountHotels,
  previewHotel,
  migrate,
  getAccountReservations,
  migrateReservations,
  getHistory,
  getLegacyHotelsWithBookings,
  getNewSystemHotels,
  startReservationMigration,
  getReservationMigrationHistory
}
