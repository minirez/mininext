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

// Subscription Management
const getSubscriptionPlans = async () => {
  try {
    const response = await apiClient.get('/partners/subscription-plans')
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Get subscription plans failed', error.response?.data || error.message)
    throw error
  }
}

const getSubscription = async partnerId => {
  try {
    const response = await apiClient.get(`/partners/${partnerId}/subscription`)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Get subscription failed', error.response?.data || error.message)
    throw error
  }
}

const updateSubscription = async (partnerId, data) => {
  try {
    const response = await apiClient.put(`/partners/${partnerId}/subscription`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Update subscription failed', error.response?.data || error.message)
    throw error
  }
}

const addPurchase = async (partnerId, data) => {
  try {
    const response = await apiClient.post(`/partners/${partnerId}/subscription/purchases`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Add purchase failed', error.response?.data || error.message)
    throw error
  }
}

const getAllPurchases = async () => {
  try {
    const response = await apiClient.get('/partners/subscriptions/purchases')
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Get all purchases failed', error.response?.data || error.message)
    throw error
  }
}

const updatePurchase = async (partnerId, purchaseId, data) => {
  try {
    const response = await apiClient.put(`/partners/${partnerId}/subscription/purchases/${purchaseId}`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Update purchase failed', error.response?.data || error.message)
    throw error
  }
}

const cancelPurchase = async (partnerId, purchaseId, reason) => {
  try {
    const response = await apiClient.post(`/partners/${partnerId}/subscription/purchases/${purchaseId}/cancel`, { reason })
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Cancel purchase failed', error.response?.data || error.message)
    throw error
  }
}

const markPurchaseAsPaid = async (partnerId, purchaseId, paymentData) => {
  try {
    const response = await apiClient.post(`/partners/${partnerId}/subscription/purchases/${purchaseId}/mark-paid`, paymentData)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Mark purchase as paid failed', error.response?.data || error.message)
    throw error
  }
}

// Get my subscription (for partner users)
const getMySubscription = async () => {
  try {
    const response = await apiClient.get('/my/subscription')
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Get my subscription failed', error.response?.data || error.message)
    throw error
  }
}

// Get my invoices (for partner users)
const getMyInvoices = async (params = {}) => {
  try {
    const response = await apiClient.get('/my/invoices', { params })
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Get my invoices failed', error.response?.data || error.message)
    throw error
  }
}

// Download my invoice PDF (for partner users)
const downloadMyInvoicePdf = async invoiceId => {
  try {
    const response = await apiClient.get(`/my/invoices/${invoiceId}/pdf`, {
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Download invoice PDF failed', error.response?.data || error.message)
    throw error
  }
}

// Query BIN for subscription payment (for partner users)
const querySubscriptionBin = async (bin, plan) => {
  try {
    const response = await apiClient.post('/my/subscription/query-bin', { bin, plan })
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Query BIN failed', error.response?.data || error.message)
    throw error
  }
}

// Initiate subscription purchase with payment (for partner users)
const initiatePurchase = async data => {
  try {
    const response = await apiClient.post('/my/subscription/purchase', data)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Initiate purchase failed', error.response?.data || error.message)
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
  provisionHotelToPms,
  getSubscriptionPlans,
  getSubscription,
  updateSubscription,
  addPurchase,
  getAllPurchases,
  updatePurchase,
  cancelPurchase,
  markPurchaseAsPaid,
  getMySubscription,
  getMyInvoices,
  downloadMyInvoicePdf,
  querySubscriptionBin,
  initiatePurchase
}
