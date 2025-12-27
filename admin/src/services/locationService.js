import apiClient from './api'

/**
 * Location Service
 * Handles city, district and tourism region API calls
 */

// ============= Cities =============

/**
 * Get cities by country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 */
export const getCities = async (countryCode) => {
  const response = await apiClient.get('/locations/cities', {
    params: { country: countryCode }
  })
  return response.data
}

/**
 * Get all cities (admin only)
 * @param {Object} params - Query parameters
 */
export const getAllCities = async (params = {}) => {
  const response = await apiClient.get('/locations/cities/all', { params })
  return response.data
}

/**
 * Create a city (platform admin only)
 * @param {Object} data - City data
 */
export const createCity = async (data) => {
  const response = await apiClient.post('/locations/cities', data)
  return response.data
}

/**
 * Update city (platform admin only)
 * @param {string} id - City ID
 * @param {Object} data - City data
 */
export const updateCity = async (id, data) => {
  const response = await apiClient.put(`/locations/cities/${id}`, data)
  return response.data
}

/**
 * Delete city (platform admin only)
 * @param {string} id - City ID
 */
export const deleteCity = async (id) => {
  const response = await apiClient.delete(`/locations/cities/${id}`)
  return response.data
}

// ============= Districts (İlçeler) =============

/**
 * Get districts by city
 * @param {string} cityId - City ID
 */
export const getDistricts = async (cityId) => {
  const response = await apiClient.get('/locations/districts', {
    params: { city: cityId }
  })
  return response.data
}

/**
 * Get all districts (admin only)
 * @param {Object} params - Query parameters
 */
export const getAllDistricts = async (params = {}) => {
  const response = await apiClient.get('/locations/districts/all', { params })
  return response.data
}

/**
 * Get single district
 * @param {string} id - District ID
 */
export const getDistrict = async (id) => {
  const response = await apiClient.get(`/locations/districts/${id}`)
  return response.data
}

/**
 * Create a district (platform admin only)
 * @param {Object} data - District data
 */
export const createDistrict = async (data) => {
  const response = await apiClient.post('/locations/districts', data)
  return response.data
}

/**
 * Update district (platform admin only)
 * @param {string} id - District ID
 * @param {Object} data - District data
 */
export const updateDistrict = async (id, data) => {
  const response = await apiClient.put(`/locations/districts/${id}`, data)
  return response.data
}

/**
 * Delete district (platform admin only)
 * @param {string} id - District ID
 */
export const deleteDistrict = async (id) => {
  const response = await apiClient.delete(`/locations/districts/${id}`)
  return response.data
}

// ============= Tourism Regions =============

/**
 * Get tourism regions by city
 * @param {string} cityId - City ID
 */
export const getRegions = async (cityId) => {
  const response = await apiClient.get('/locations/regions', {
    params: { city: cityId }
  })
  return response.data
}

/**
 * Get all regions (admin only)
 * @param {Object} params - Query parameters
 */
export const getAllRegions = async (params = {}) => {
  const response = await apiClient.get('/locations/regions/all', { params })
  return response.data
}

/**
 * Get single region
 * @param {string} id - Region ID
 */
export const getRegion = async (id) => {
  const response = await apiClient.get(`/locations/regions/${id}`)
  return response.data
}

/**
 * Create a tourism region (platform admin only)
 * @param {Object} data - Region data
 */
export const createRegion = async (data) => {
  const response = await apiClient.post('/locations/regions', data)
  return response.data
}

/**
 * Update tourism region (platform admin only)
 * @param {string} id - Region ID
 * @param {Object} data - Region data
 */
export const updateRegion = async (id, data) => {
  const response = await apiClient.put(`/locations/regions/${id}`, data)
  return response.data
}

/**
 * Delete tourism region (platform admin only)
 * @param {string} id - Region ID
 */
export const deleteRegion = async (id) => {
  const response = await apiClient.delete(`/locations/regions/${id}`)
  return response.data
}

// ============= Search =============

/**
 * Search locations (for autocomplete)
 * @param {string} query - Search query
 * @param {Object} options - Search options
 */
export const searchLocations = async (query, options = {}) => {
  const response = await apiClient.get('/locations/search', {
    params: {
      q: query,
      country: options.country,
      type: options.type || 'all'
    }
  })
  return response.data
}

export default {
  // Cities
  getCities,
  getAllCities,
  createCity,
  updateCity,
  deleteCity,
  // Districts
  getDistricts,
  getAllDistricts,
  getDistrict,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  // Regions
  getRegions,
  getAllRegions,
  getRegion,
  createRegion,
  updateRegion,
  deleteRegion,
  // Search
  searchLocations
}
