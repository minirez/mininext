import apiClient from './api'
import { apiLogger } from '@/utils/logger'

const getPartners = async (params = {}) => {
  try {
    const response = await apiClient.get('/partners', { params })
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
    apiLogger.error(
      'Partner Service: Approve partner failed',
      error.response?.data || error.message
    )
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
    apiLogger.error(
      'Partner Service: Upload document failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const deleteDocument = async (id, documentId) => {
  try {
    const response = await apiClient.delete(`/partners/${id}/documents/${documentId}`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Delete document failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// PMS Integration - Hotel based
const getHotelPmsStatus = async hotelId => {
  try {
    const response = await apiClient.get(`/hotels/${hotelId}/pms-status`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Get hotel PMS status failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const provisionHotelToPms = async (hotelId, options = {}) => {
  try {
    const response = await apiClient.post(`/hotels/${hotelId}/provision-pms`, options)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Provision hotel to PMS failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// Subscription Management
const getSubscriptionCatalog = async () => {
  try {
    const response = await apiClient.get('/partners/subscription-catalog')
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Get subscription catalog failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const getSubscription = async partnerId => {
  try {
    const response = await apiClient.get(`/partners/${partnerId}/subscription`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Get subscription failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const updateSubscription = async (partnerId, data) => {
  try {
    const response = await apiClient.put(`/partners/${partnerId}/subscription`, data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Update subscription failed',
      error.response?.data || error.message
    )
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

const getAllPurchases = async (params = {}) => {
  try {
    const response = await apiClient.get('/partners/subscriptions/purchases', { params })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Get all purchases failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const updatePurchase = async (partnerId, purchaseId, data) => {
  try {
    const response = await apiClient.put(
      `/partners/${partnerId}/subscription/purchases/${purchaseId}`,
      data
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Update purchase failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const cancelPurchase = async (partnerId, purchaseId, reason) => {
  try {
    const response = await apiClient.post(
      `/partners/${partnerId}/subscription/purchases/${purchaseId}/cancel`,
      { reason }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Cancel purchase failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const deletePurchase = async (partnerId, purchaseId) => {
  try {
    const response = await apiClient.delete(
      `/partners/${partnerId}/subscription/purchases/${purchaseId}`
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Delete purchase failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const markPurchaseAsPaid = async (partnerId, purchaseId, paymentData) => {
  try {
    const response = await apiClient.post(
      `/partners/${partnerId}/subscription/purchases/${purchaseId}/mark-paid`,
      paymentData
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Mark purchase as paid failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const createPurchaseWithPaymentLink = async (partnerId, data) => {
  try {
    const response = await apiClient.post(
      `/partners/${partnerId}/subscription/purchase-with-link`,
      data
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Create purchase with payment link failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const getPaymentLinksForPurchase = async (partnerId, purchaseId) => {
  try {
    const response = await apiClient.get(
      `/partners/${partnerId}/subscription/purchases/${purchaseId}/payment-links`
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Get payment links failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const sendPaymentLinkForPurchase = async (partnerId, purchaseId) => {
  try {
    const response = await apiClient.post(
      `/partners/${partnerId}/subscription/purchases/${purchaseId}/send-link`
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Send payment link failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const cancelSubscriptionPaymentLink = async (partnerId, linkId, reason) => {
  try {
    const response = await apiClient.post(
      `/partners/${partnerId}/subscription/payment-links/${linkId}/cancel`,
      { reason }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Cancel subscription payment link failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const resendSubscriptionPaymentLinkNotification = async (partnerId, linkId, channel) => {
  try {
    const response = await apiClient.post(
      `/partners/${partnerId}/subscription/payment-links/${linkId}/resend`,
      { channel }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Resend subscription payment link notification failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const getAllSubscriptionPaymentLinks = async (params = {}) => {
  try {
    const response = await apiClient.get('/partners/subscription-payment-links', { params })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Get all subscription payment links failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const softDeleteSubscriptionPaymentLink = async linkId => {
  try {
    const response = await apiClient.delete(`/partners/subscription-payment-links/${linkId}`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Soft delete subscription payment link failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const restoreSubscriptionPaymentLink = async linkId => {
  try {
    const response = await apiClient.post(`/partners/subscription-payment-links/${linkId}/restore`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Restore subscription payment link failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// ==================== Partner Self-Profile ====================

// Get my profile (for partner users)
const getMyProfile = async () => {
  try {
    const response = await apiClient.get('/partners/my/profile')
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Get my profile failed', error.response?.data || error.message)
    throw error
  }
}

// Update my profile (for partner users)
const updateMyProfile = async data => {
  try {
    const response = await apiClient.put('/partners/my/profile', data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Update my profile failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// Update my admin theme (for partner users)
const updatePosSettings = async data => {
  try {
    const response = await apiClient.put('/partners/my/pos-settings', data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Update POS settings failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const updateMyAdminTheme = async theme => {
  try {
    const response = await apiClient.put('/partners/my/admin-theme', { theme })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Update my admin theme failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// Update partner admin theme (for platform admins)
const updatePartnerAdminTheme = async (partnerId, theme) => {
  try {
    const response = await apiClient.put(`/partners/${partnerId}/admin-theme`, { theme })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Update partner admin theme failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// Upload my logo (for partner users)
const uploadMyLogo = async file => {
  try {
    const formData = new FormData()
    formData.append('logo', file)
    const response = await apiClient.post('/partners/my/profile/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Upload my logo failed', error.response?.data || error.message)
    throw error
  }
}

// Delete my logo (for partner users)
const deleteMyLogo = async () => {
  try {
    const response = await apiClient.delete('/partners/my/profile/logo')
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Delete my logo failed', error.response?.data || error.message)
    throw error
  }
}

// Upload my favicon (for partner users)
const uploadMyFavicon = async file => {
  try {
    const formData = new FormData()
    formData.append('favicon', file)
    const response = await apiClient.post('/partners/my/profile/favicon', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Upload my favicon failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// Delete my favicon (for partner users)
const deleteMyFavicon = async () => {
  try {
    const response = await apiClient.delete('/partners/my/profile/favicon')
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Delete my favicon failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// Get my subscription (for partner users)
const getMySubscription = async () => {
  try {
    const response = await apiClient.get('/my/subscription')
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Get my subscription failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// Get my membership summary (for partner users)
const getMyMembership = async () => {
  try {
    const response = await apiClient.get('/my/membership')
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Get my membership failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// Get membership catalog (packages + services for partner users)
const getMembershipCatalog = async () => {
  try {
    const response = await apiClient.get('/my/membership/catalog')
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Get membership catalog failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// Purchase membership (create pending purchase - no payment)
const purchaseMembership = async data => {
  try {
    const response = await apiClient.post('/my/membership/purchase', data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Purchase membership failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// Get my invoices (for partner users)
const getMyInvoices = async (params = {}) => {
  try {
    const response = await apiClient.get('/my/invoices', { params })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Get my invoices failed',
      error.response?.data || error.message
    )
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
    apiLogger.error(
      'Partner Service: Download invoice PDF failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// Query BIN for subscription payment (for partner users)
const querySubscriptionBin = async (bin, amount) => {
  try {
    const response = await apiClient.post('/my/subscription/query-bin', { bin, amount })
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
    apiLogger.error(
      'Partner Service: Initiate purchase failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const activateTrial = async data => {
  try {
    const response = await apiClient.post('/my/subscription/activate-trial', data)
    return response.data
  } catch (error) {
    apiLogger.error('Partner Service: Activate trial failed', error.response?.data || error.message)
    throw error
  }
}

const getSubscriptionAlert = async () => {
  try {
    const response = await apiClient.get('/my/subscription/alert')
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Get subscription alert failed',
      error.response?.data || error.message
    )
    throw error
  }
}

// Pay for existing pending purchase (admin-created packages)
const payPendingPurchase = async (purchaseId, data) => {
  try {
    const response = await apiClient.post(`/my/subscription/purchases/${purchaseId}/pay`, data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Partner Service: Pay pending purchase failed',
      error.response?.data || error.message
    )
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
  getSubscriptionCatalog,
  getSubscription,
  updateSubscription,
  addPurchase,
  getAllPurchases,
  updatePurchase,
  cancelPurchase,
  deletePurchase,
  markPurchaseAsPaid,
  createPurchaseWithPaymentLink,
  getPaymentLinksForPurchase,
  sendPaymentLinkForPurchase,
  cancelSubscriptionPaymentLink,
  resendSubscriptionPaymentLinkNotification,
  getAllSubscriptionPaymentLinks,
  softDeleteSubscriptionPaymentLink,
  restoreSubscriptionPaymentLink,
  // Partner Self-Profile
  getMyProfile,
  updateMyProfile,
  updateMyAdminTheme,
  updatePosSettings,
  updatePartnerAdminTheme,
  uploadMyLogo,
  deleteMyLogo,
  uploadMyFavicon,
  deleteMyFavicon,
  // Subscription (partner self-service)
  getMySubscription,
  getMyMembership,
  getMembershipCatalog,
  purchaseMembership,
  getMyInvoices,
  downloadMyInvoicePdf,
  querySubscriptionBin,
  initiatePurchase,
  payPendingPurchase,
  activateTrial,
  getSubscriptionAlert
}
