import apiClient from '@/services/api'

const BASE = '/channel-manager'

// Connection
export const getConnection = async hotelId => {
  const response = await apiClient.get(`${BASE}/hotels/${hotelId}/connection`)
  return response.data
}

export const saveConnection = async (hotelId, data) => {
  const response = await apiClient.post(`${BASE}/hotels/${hotelId}/connection`, data)
  return response.data
}

export const testConnection = async hotelId => {
  const response = await apiClient.post(`${BASE}/hotels/${hotelId}/connection/test`)
  return response.data
}

export const deleteConnection = async hotelId => {
  const response = await apiClient.delete(`${BASE}/hotels/${hotelId}/connection`)
  return response.data
}

// Products & Mappings
export const fetchProducts = async hotelId => {
  const response = await apiClient.get(`${BASE}/hotels/${hotelId}/products`)
  return response.data
}

export const saveMappings = async (hotelId, mappings) => {
  const response = await apiClient.put(`${BASE}/hotels/${hotelId}/mappings`, { mappings })
  return response.data
}

// OTA
export const fetchOTAs = async hotelId => {
  const response = await apiClient.get(`${BASE}/hotels/${hotelId}/ota-list`)
  return response.data
}

export const fetchOTAProducts = async hotelId => {
  const response = await apiClient.get(`${BASE}/hotels/${hotelId}/ota-products`)
  return response.data
}

// Sync
export const triggerReservationSync = async hotelId => {
  const response = await apiClient.post(`${BASE}/hotels/${hotelId}/sync/reservations`)
  return response.data
}

export const triggerInventorySync = async hotelId => {
  const response = await apiClient.post(`${BASE}/hotels/${hotelId}/sync/inventory`)
  return response.data
}

export const getSyncStatus = async hotelId => {
  const response = await apiClient.get(`${BASE}/hotels/${hotelId}/sync/status`)
  return response.data
}

// Logs
export const getLogs = async (hotelId, params = {}) => {
  const response = await apiClient.get(`${BASE}/hotels/${hotelId}/logs`, { params })
  return response.data
}

export const getLogDetail = async (hotelId, logId) => {
  const response = await apiClient.get(`${BASE}/hotels/${hotelId}/logs/${logId}`)
  return response.data
}

export default {
  getConnection,
  saveConnection,
  testConnection,
  deleteConnection,
  fetchProducts,
  saveMappings,
  fetchOTAs,
  fetchOTAProducts,
  triggerReservationSync,
  triggerInventorySync,
  getSyncStatus,
  getLogs,
  getLogDetail
}
