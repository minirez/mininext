import apiClient from './api'

/**
 * Tag Service
 * Handles tag-related API calls
 */

/**
 * Get all tags
 * @param {Object} params - Query parameters
 * @param {string} params.search - Search query
 * @param {string} params.active - Filter by active status ('true' or 'false')
 */
export const getTags = async (params = {}) => {
  const response = await apiClient.get('/tags', { params })
  return response.data
}

/**
 * Get single tag
 * @param {string} id - Tag ID
 */
export const getTag = async (id) => {
  const response = await apiClient.get(`/tags/${id}`)
  return response.data
}

/**
 * Search tags (for autocomplete)
 * @param {string} query - Search query
 * @param {string} lang - Language code
 * @param {number} limit - Max results
 */
export const searchTags = async (query, lang = 'tr', limit = 10) => {
  const response = await apiClient.get('/tags/search', {
    params: { q: query, lang, limit }
  })
  return response.data
}

/**
 * Create a new tag (with auto-translation)
 * @param {Object} data - Tag data
 * @param {Object} data.name - Multilingual name object
 * @param {string} data.color - Tag color (hex)
 * @param {string} data.sourceLang - Source language for translation
 */
export const createTag = async (data) => {
  const response = await apiClient.post('/tags', data)
  return response.data
}

/**
 * Update tag
 * @param {string} id - Tag ID
 * @param {Object} data - Tag data to update
 */
export const updateTag = async (id, data) => {
  const response = await apiClient.put(`/tags/${id}`, data)
  return response.data
}

/**
 * Delete tag
 * @param {string} id - Tag ID
 */
export const deleteTag = async (id) => {
  const response = await apiClient.delete(`/tags/${id}`)
  return response.data
}

export default {
  getTags,
  getTag,
  searchTags,
  createTag,
  updateTag,
  deleteTag
}
