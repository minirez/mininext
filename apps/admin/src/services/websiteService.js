import apiClient from './api'
import { apiLogger } from '@/utils/logger'
import { STOREFRONT_DRAFT_ALLOWED_FIELDS } from '@booking-engine/constants'

// ==================== HELPERS ====================

const request = async (label, fn) => {
  try {
    return (await fn()).data
  } catch (error) {
    apiLogger.error(label, error.response?.data || error.message)
    throw error
  }
}

const buildQuery = params => {
  const qs = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => v != null && v !== '' && qs.set(k, String(v)))
  const s = qs.toString()
  return s ? `?${s}` : ''
}

const upload = (url, file, extra = {}) => {
  const formData = new FormData()
  formData.append('file', file)
  Object.entries(extra).forEach(([k, v]) => v != null && formData.append(k, String(v)))
  return request('Upload failed', () =>
    apiClient.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  )
}

// ==================== STOREFRONT ====================

export const getStorefront = (options = {}) =>
  request('Fetch storefront', () =>
    apiClient.get(
      `/storefronts${buildQuery({ view: options.view, include: options.include, exclude: options.exclude, includeDraft: options.includeDraft !== false ? 'true' : 'false' })}`
    )
  )

export const updateStorefront = data =>
  request('Update storefront', () => apiClient.put('/storefronts', data))

// Legacy aliases
export const updateTheme = data =>
  request('Update theme', () => apiClient.put('/storefronts/homepage-theme', data))
export const updateHomepage = updateStorefront

// ==================== DRAFT ====================

const sanitizeDraftPayload = data => {
  const src = data && typeof data === 'object' ? data : {}
  const allowed = new Set(STOREFRONT_DRAFT_ALLOWED_FIELDS)
  const out = {}
  Object.entries(src).forEach(([k, v]) => {
    if (!allowed.has(k)) return
    out[k] = v
  })
  return out
}

export const saveDraft = data =>
  request('Save draft', () => apiClient.put('/storefronts/draft', sanitizeDraftPayload(data)))
export const publishDraft = () =>
  request('Publish draft', () => apiClient.post('/storefronts/draft/publish'))
export const discardDraft = () =>
  request('Discard draft', () => apiClient.delete('/storefronts/draft'))

// ==================== PAGES ====================

export const savePage = data =>
  request('Save page', () => apiClient.post('/storefronts/pages', data))
export const deletePage = url =>
  request('Delete page', () => apiClient.delete(`/storefronts/pages/${encodeURIComponent(url)}`))

// ==================== UPLOADS ====================

export const uploadPhoto = file => upload('/storefronts/upload', file, { uploadType: 'general' })
export const deletePhoto = id =>
  request('Delete photo', () =>
    apiClient.delete('/storefronts/upload', { data: { relativePath: id } })
  )
export const uploadSectionImage = (file, uploadType, index = 0, extra = {}) =>
  upload('/storefronts/upload', file, { uploadType, uploadIndex: index, ...extra })

// ==================== AI MIGRATION ====================

export const aiMigrateStorefront = (jsonData, downloadImages = true) =>
  request('AI migrate', () =>
    apiClient.post('/storefronts/ai-migrate', { jsonData, downloadImages })
  )
export const applyMigratedStorefront = migratedData =>
  request('Apply migration', () =>
    apiClient.post('/storefronts/ai-migrate/apply', { migratedData })
  )
export const downloadAndUploadImage = (imageUrl, uploadType, uploadIndex = '0') =>
  request('Download image', () =>
    apiClient.post('/storefronts/ai-migrate/download-image', { imageUrl, uploadType, uploadIndex })
  )

// ==================== PRESETS ====================

export const getThemePresets = () =>
  request('Get presets', () => apiClient.get('/storefronts/custom-theme/presets'))
export const saveThemePreset = (name, description = '') =>
  request('Save preset', () =>
    apiClient.post('/storefronts/custom-theme/presets', { name, description })
  )
export const updateThemePreset = (presetId, data) =>
  request('Update preset', () =>
    apiClient.put(`/storefronts/custom-theme/presets/${presetId}`, data)
  )
export const applyThemePreset = presetId =>
  request('Apply preset', () =>
    apiClient.post(`/storefronts/custom-theme/presets/${presetId}/apply`)
  )
export const deleteThemePreset = presetId =>
  request('Delete preset', () => apiClient.delete(`/storefronts/custom-theme/presets/${presetId}`))

// ==================== DEFAULT EXPORT ====================

export default {
  getStorefront,
  updateStorefront,
  updateTheme,
  updateHomepage,
  saveDraft,
  publishDraft,
  discardDraft,
  savePage,
  deletePage,
  uploadPhoto,
  deletePhoto,
  uploadSectionImage,
  aiMigrateStorefront,
  applyMigratedStorefront,
  downloadAndUploadImage,
  getThemePresets,
  saveThemePreset,
  updateThemePreset,
  applyThemePreset,
  deleteThemePreset
}
