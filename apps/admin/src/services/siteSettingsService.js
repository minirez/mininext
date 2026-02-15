import apiClient from './api'
import { apiLogger } from '@/utils/logger'

const getSiteSettings = async () => {
  try {
    const response = await apiClient.get('/site-settings')
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to fetch settings',
      error.response?.data || error.message
    )
    throw error
  }
}

const updateSiteSettings = async data => {
  try {
    const response = await apiClient.put('/site-settings', data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to update settings',
      error.response?.data || error.message
    )
    throw error
  }
}

const updateSetup = async data => {
  try {
    const response = await apiClient.put('/site-settings/setup', data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to update setup',
      error.response?.data || error.message
    )
    throw error
  }
}

const updateGeneral = async data => {
  try {
    const response = await apiClient.put('/site-settings/general', data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to update general settings',
      error.response?.data || error.message
    )
    throw error
  }
}

const updateHomepage = async data => {
  try {
    const response = await apiClient.put('/site-settings/homepage', data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to update homepage settings',
      error.response?.data || error.message
    )
    throw error
  }
}

const updateContact = async data => {
  try {
    const response = await apiClient.put('/site-settings/contact', data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to update contact settings',
      error.response?.data || error.message
    )
    throw error
  }
}

const updateTracking = async data => {
  try {
    const response = await apiClient.put('/site-settings/tracking', data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to update tracking settings',
      error.response?.data || error.message
    )
    throw error
  }
}

// Slider management
const addSliderItem = async data => {
  try {
    const response = await apiClient.post('/site-settings/slider', data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to add slider',
      error.response?.data || error.message
    )
    throw error
  }
}

const updateSliderItem = async (sliderId, data) => {
  try {
    const response = await apiClient.put(`/site-settings/slider/${sliderId}`, data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to update slider',
      error.response?.data || error.message
    )
    throw error
  }
}

const deleteSliderItem = async sliderId => {
  try {
    const response = await apiClient.delete(`/site-settings/slider/${sliderId}`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to delete slider',
      error.response?.data || error.message
    )
    throw error
  }
}

// SSL management
const requestSsl = async type => {
  try {
    const response = await apiClient.post('/site-settings/ssl/request', { type })
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to request SSL',
      error.response?.data || error.message
    )
    throw error
  }
}

const verifyDns = async (type, domain) => {
  try {
    const response = await apiClient.post('/site-settings/ssl/verify-dns', { type, domain })
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to verify DNS',
      error.response?.data || error.message
    )
    throw error
  }
}

const setupSsl = async type => {
  try {
    const response = await apiClient.post('/site-settings/ssl/setup', { type })
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to setup SSL',
      error.response?.data || error.message
    )
    throw error
  }
}

const getSslStatus = async type => {
  try {
    const response = await apiClient.get(`/site-settings/ssl/status/${type}`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to get SSL status',
      error.response?.data || error.message
    )
    throw error
  }
}

// File uploads
const uploadImage = async (file, type) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await apiClient.post('/site-settings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to upload image',
      error.response?.data || error.message
    )
    throw error
  }
}

const deleteImage = async (filename, type) => {
  try {
    const response = await apiClient.delete('/site-settings/upload', {
      data: { filename, type }
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'SiteSettings Service: Failed to delete image',
      error.response?.data || error.message
    )
    throw error
  }
}

// DNS management (Hostinger)
const getDnsRecords = async domain => {
  const response = await apiClient.get('/site-settings/dns/records', { params: { domain } })
  return response.data
}

const updateDnsRecords = async (domain, records, overwrite = false) => {
  const response = await apiClient.put('/site-settings/dns/records', { domain, records, overwrite })
  return response.data
}

const deleteDnsRecords = async (domain, filters) => {
  const response = await apiClient.delete('/site-settings/dns/records', {
    data: { domain, filters }
  })
  return response.data
}

const createAutoCname = async domain => {
  const response = await apiClient.post('/site-settings/dns/auto-cname', { domain })
  return response.data
}

const oneClickSetup = async type => {
  const response = await apiClient.post('/site-settings/dns/one-click-setup', { type })
  return response.data
}

export default {
  getSiteSettings,
  updateSiteSettings,
  updateSetup,
  updateGeneral,
  updateHomepage,
  updateContact,
  updateTracking,
  addSliderItem,
  updateSliderItem,
  deleteSliderItem,
  requestSsl,
  verifyDns,
  setupSsl,
  getSslStatus,
  uploadImage,
  deleteImage,
  getDnsRecords,
  updateDnsRecords,
  deleteDnsRecords,
  createAutoCname,
  oneClickSetup
}
