import apiClient from './api'
import { apiLogger } from '@/utils/logger'

const getPartners = async () => {
  try {
    const response = await apiClient.get('/partners')
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Get partners failed', error.response?.data || error.message)
    throw error
  }
}

const getPartner = async id => {
  try {
    const response = await apiClient.get(`/partners/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Get partner failed', error.response?.data || error.message)
    throw error
  }
}

const createPartner = async data => {
  try {
    const response = await apiClient.post('/partners', data)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Create partner failed', error.response?.data || error.message)
    throw error
  }
}

const updatePartner = async (id, data) => {
  try {
    const response = await apiClient.put(`/partners/${id}`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Update partner failed', error.response?.data || error.message)
    throw error
  }
}

const deletePartner = async id => {
  try {
    const response = await apiClient.delete(`/partners/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Delete partner failed', error.response?.data || error.message)
    throw error
  }
}

const approvePartner = async id => {
  try {
    const response = await apiClient.post(`/partners/${id}/approve`)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Approve partner failed', error.response?.data || error.message)
    throw error
  }
}

const uploadDocument = async (id, formData) => {
  try {
    const response = await apiClient.post(`/partners/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Upload document failed', error.response?.data || error.message)
    throw error
  }
}

const deleteDocument = async (id, documentId) => {
  try {
    const response = await apiClient.delete(`/partners/${id}/documents/${documentId}`)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Delete document failed', error.response?.data || error.message)
    throw error
  }
}

// PMS Integration - Hotel based
const getHotelPmsStatus = async hotelId => {
  try {
    const response = await apiClient.get(`/hotels/${hotelId}/pms-status`)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Get hotel PMS status failed', error.response?.data || error.message)
    throw error
  }
}

const provisionHotelToPms = async (hotelId, options = {}) => {
  try {
    const response = await apiClient.post(`/hotels/${hotelId}/provision-pms`, options)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Provision hotel to PMS failed', error.response?.data || error.message)
    throw error
  }
}

export default {
  getPartners,
  getPartner,
  createPartner,
  updatePartner,
  deletePartner,
  approvePartner,
  uploadDocument,
  deleteDocument,
  getHotelPmsStatus,
  provisionHotelToPms
}
