import apiClient from './api'

/**
 * Payment Service
 * API calls for payment management
 */

/**
 * Get all payments for a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} - Payments list with summary
 */
export const getPayments = async bookingId => {
  const response = await apiClient.get(`/bookings/${bookingId}/payments`)
  return response.data
}

/**
 * Add new payment
 * @param {string} bookingId - Booking ID
 * @param {object} data - Payment data
 * @returns {Promise} - Created payment
 */
export const addPayment = async (bookingId, data) => {
  const response = await apiClient.post(`/bookings/${bookingId}/payments`, data)
  return response.data
}

/**
 * Update payment
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @param {object} data - Payment data to update
 * @returns {Promise} - Updated payment
 */
export const updatePayment = async (bookingId, paymentId, data) => {
  const response = await apiClient.patch(`/bookings/${bookingId}/payments/${paymentId}`, data)
  return response.data
}

/**
 * Confirm payment (for bank transfers)
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise} - Confirmed payment
 */
export const confirmPayment = async (bookingId, paymentId) => {
  const response = await apiClient.post(`/bookings/${bookingId}/payments/${paymentId}/confirm`)
  return response.data
}

/**
 * Cancel payment
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise} - Cancelled payment
 */
export const cancelPayment = async (bookingId, paymentId) => {
  const response = await apiClient.delete(`/bookings/${bookingId}/payments/${paymentId}`)
  return response.data
}

/**
 * Refund payment
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @param {object} data - Refund data (amount, reason)
 * @returns {Promise} - Refunded payment
 */
export const refundPayment = async (bookingId, paymentId, data) => {
  const response = await apiClient.post(`/bookings/${bookingId}/payments/${paymentId}/refund`, data)
  return response.data
}

/**
 * Upload receipt for bank transfer
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @param {File} file - Receipt file
 * @returns {Promise} - Updated payment
 */
export const uploadReceipt = async (bookingId, paymentId, file) => {
  const formData = new FormData()
  formData.append('receipt', file)

  const response = await apiClient.post(
    `/bookings/${bookingId}/payments/${paymentId}/upload-receipt`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data
}

// ============================================================================
// CREDIT CARD PAYMENT API
// ============================================================================

/**
 * Query BIN for installment options
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @param {string} bin - First 6-8 digits of card number
 * @returns {Promise} - BIN info and installment options
 */
export const queryCardBin = async (bookingId, paymentId, bin) => {
  const response = await apiClient.post(`/bookings/${bookingId}/payments/${paymentId}/card/query-bin`, { bin })
  return response.data
}

/**
 * Process credit card payment
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @param {object} data - Card payment data { card, installment, posId?, customer? }
 * @returns {Promise} - Payment result (may require 3D redirect)
 */
export const processCardPayment = async (bookingId, paymentId, data) => {
  const response = await apiClient.post(`/bookings/${bookingId}/payments/${paymentId}/card/process`, data)
  return response.data
}

/**
 * Get card payment status
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise} - Payment status
 */
export const getCardPaymentStatus = async (bookingId, paymentId) => {
  const response = await apiClient.get(`/bookings/${bookingId}/payments/${paymentId}/card/status`)
  return response.data
}

// ============================================================================
// PRE-AUTHORIZATION API
// ============================================================================

/**
 * Pre-authorize card payment (hold amount)
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @param {object} data - Card and payment data
 * @returns {Promise} - Pre-auth result
 */
export const preAuthorizeCard = async (bookingId, paymentId, data) => {
  const response = await apiClient.post(`/bookings/${bookingId}/payments/${paymentId}/card/pre-authorize`, data)
  return response.data
}

/**
 * Capture pre-authorized payment
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise} - Capture result
 */
export const capturePreAuth = async (bookingId, paymentId) => {
  const response = await apiClient.post(`/bookings/${bookingId}/payments/${paymentId}/card/capture`)
  return response.data
}

/**
 * Release pre-authorized payment
 * @param {string} bookingId - Booking ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise} - Release result
 */
export const releasePreAuth = async (bookingId, paymentId) => {
  const response = await apiClient.post(`/bookings/${bookingId}/payments/${paymentId}/card/release`)
  return response.data
}

/**
 * Get pre-authorized payments for a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} - Pre-authorized payments list
 */
export const getPreAuthorizedPayments = async bookingId => {
  const response = await apiClient.get(`/bookings/${bookingId}/payments/pre-authorized`)
  return response.data
}

// ============================================================================
// ANALYTICS API
// ============================================================================

/**
 * Get revenue summary
 * @param {object} params - Query params { startDate, endDate, currency, groupBy }
 * @returns {Promise} - Revenue data
 */
export const getRevenueSummary = async (params = {}) => {
  const response = await apiClient.get('/payments/analytics/revenue', { params })
  return response.data
}

/**
 * Get payment methods breakdown
 * @param {object} params - Query params { startDate, endDate }
 * @returns {Promise} - Methods distribution
 */
export const getPaymentMethods = async (params = {}) => {
  const response = await apiClient.get('/payments/analytics/methods', { params })
  return response.data
}

/**
 * Get commission report
 * @param {object} params - Query params { startDate, endDate, groupBy }
 * @returns {Promise} - Commission data
 */
export const getCommissionReport = async (params = {}) => {
  const response = await apiClient.get('/payments/analytics/commission', { params })
  return response.data
}

/**
 * Get installment distribution
 * @param {object} params - Query params { startDate, endDate }
 * @returns {Promise} - Installment data
 */
export const getInstallmentDistribution = async (params = {}) => {
  const response = await apiClient.get('/payments/analytics/installments', { params })
  return response.data
}

/**
 * Get payment status overview
 * @param {object} params - Query params { startDate, endDate }
 * @returns {Promise} - Status data
 */
export const getStatusOverview = async (params = {}) => {
  const response = await apiClient.get('/payments/analytics/status', { params })
  return response.data
}

export default {
  getPayments,
  addPayment,
  updatePayment,
  confirmPayment,
  cancelPayment,
  refundPayment,
  uploadReceipt,
  // Card payment methods
  queryCardBin,
  processCardPayment,
  getCardPaymentStatus,
  // Pre-authorization methods
  preAuthorizeCard,
  capturePreAuth,
  releasePreAuth,
  getPreAuthorizedPayments,
  // Analytics methods
  getRevenueSummary,
  getPaymentMethods,
  getCommissionReport,
  getInstallmentDistribution,
  getStatusOverview
}
