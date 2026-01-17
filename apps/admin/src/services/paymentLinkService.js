import apiClient from './api'
import { apiLogger } from '@/utils/logger'

/**
 * Get payment links list with filters
 */
const getPaymentLinks = async (params = {}) => {
  try {
    const response = await apiClient.get('/payment-links', { params })
    return response.data
  } catch (error) {
    apiLogger.error('PaymentLink Service: Get list failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get payment link by ID
 */
const getPaymentLink = async id => {
  try {
    const response = await apiClient.get(`/payment-links/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error('PaymentLink Service: Get by ID failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Create new payment link
 */
const createPaymentLink = async data => {
  try {
    const response = await apiClient.post('/payment-links', data)
    return response.data
  } catch (error) {
    apiLogger.error('PaymentLink Service: Create failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Update payment link
 */
const updatePaymentLink = async (id, data) => {
  try {
    const response = await apiClient.put(`/payment-links/${id}`, data)
    return response.data
  } catch (error) {
    apiLogger.error('PaymentLink Service: Update failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Cancel payment link
 */
const cancelPaymentLink = async (id, reason) => {
  try {
    const response = await apiClient.post(`/payment-links/${id}/cancel`, { reason })
    return response.data
  } catch (error) {
    apiLogger.error('PaymentLink Service: Cancel failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Resend notification
 */
const resendNotification = async (id, channel = 'email') => {
  try {
    const response = await apiClient.post(`/payment-links/${id}/resend`, { channel })
    return response.data
  } catch (error) {
    apiLogger.error('PaymentLink Service: Resend failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get payment link statistics
 */
const getStats = async () => {
  try {
    const response = await apiClient.get('/payment-links/stats')
    return response.data
  } catch (error) {
    apiLogger.error('PaymentLink Service: Get stats failed', error.response?.data || error.message)
    throw error
  }
}

export default {
  getPaymentLinks,
  getPaymentLink,
  createPaymentLink,
  updatePaymentLink,
  cancelPaymentLink,
  resendNotification,
  getStats
}
