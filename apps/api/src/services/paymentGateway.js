/**
 * Payment Gateway Service
 * Communicates with the Payment Service for credit card processing
 */

import logger from '../core/logger.js'

// Payment Service base URL (internal communication)
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://127.0.0.1:7043'

// API Key for internal service authentication
const API_KEY = process.env.PAYMENT_API_KEY || 'internal-service-key'

/**
 * Make request to Payment Service
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @param {string} token - Optional JWT token for user context
 * @returns {Promise<Object>}
 */
async function makeRequest(method, endpoint, data = null, token = null) {
  const url = `${PAYMENT_SERVICE_URL}/api${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': API_KEY
  }

  // Pass JWT token if provided (for user context)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const options = {
    method,
    headers
  }

  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    options.body = JSON.stringify(data)
  }

  try {
    logger.debug(`[PaymentGateway] ${method} ${url}`, { data })

    const response = await fetch(url, options)
    const result = await response.json()

    if (!response.ok) {
      logger.error(`[PaymentGateway] Error response:`, {
        status: response.status,
        result
      })
      throw new Error(result.error || result.message || 'Payment service error')
    }

    return result
  } catch (error) {
    logger.error(`[PaymentGateway] Request failed:`, {
      endpoint,
      error: error.message
    })
    throw error
  }
}

/**
 * Query BIN and get installment options
 * @param {string} bin - First 6-8 digits of card
 * @param {number} amount - Payment amount
 * @param {string} currency - Currency code (try, usd, eur)
 * @param {string} partnerId - Optional partner ID for partner-specific POS
 * @param {string} token - Optional JWT token
 * @returns {Promise<Object>} - { success, pos, card, installments }
 */
export async function queryBin(bin, amount, currency, partnerId = null, token = null) {
  return makeRequest('POST', '/bin', {
    bin,
    amount,
    currency: currency.toLowerCase(),
    partnerId
  }, token)
}

/**
 * Process credit card payment
 * @param {Object} params - Payment parameters
 * @param {string} params.posId - Optional POS ID (auto-selected if not provided)
 * @param {number} params.amount - Payment amount
 * @param {string} params.currency - Currency code
 * @param {number} params.installment - Number of installments (1 for single)
 * @param {Object} params.card - Card details { holder, number, expiry, cvv }
 * @param {Object} params.customer - Customer info { name, email, phone, ip }
 * @param {string} params.externalId - External reference (booking payment ID)
 * @param {string} params.partnerId - Optional partner ID
 * @param {string} token - Optional JWT token
 * @returns {Promise<Object>} - { success, transactionId, requires3D, formUrl }
 */
export async function processPayment(params, token = null) {
  return makeRequest('POST', '/pay', params, token)
}

/**
 * Get transaction status
 * @param {string} transactionId - Payment Service transaction ID
 * @param {string} token - Optional JWT token
 * @returns {Promise<Object>} - Transaction details
 */
export async function getTransactionStatus(transactionId, token = null) {
  return makeRequest('GET', `/${transactionId}`, null, token)
}

/**
 * Refund a completed payment
 * @param {string} transactionId - Payment Service transaction ID
 * @param {string} token - Optional JWT token
 * @returns {Promise<Object>} - Refund result
 */
export async function refundTransaction(transactionId, token = null) {
  return makeRequest('POST', '/refund', { transactionId }, token)
}

/**
 * Cancel a payment (same day only)
 * @param {string} transactionId - Payment Service transaction ID
 * @param {string} token - Optional JWT token
 * @returns {Promise<Object>} - Cancel result
 */
export async function cancelTransaction(transactionId, token = null) {
  return makeRequest('POST', '/cancel', { transactionId }, token)
}

/**
 * Get payment form URL for 3D Secure redirect
 * @param {string} transactionId - Payment Service transaction ID
 * @returns {string} - Full URL to payment form
 */
export function getPaymentFormUrl(transactionId) {
  // Use public-facing URL for browser redirect
  const publicUrl = process.env.PAYMENT_PUBLIC_URL || 'https://api.minires.com/payment-api'
  return `${publicUrl}/payment/${transactionId}/form`
}

/**
 * Pre-authorize an amount (for hold without capture)
 * @param {Object} params - Same as processPayment
 * @param {string} token - Optional JWT token
 * @returns {Promise<Object>} - Pre-auth result
 */
export async function preAuthorize(params, token = null) {
  return makeRequest('POST', '/pre-auth', params, token)
}

/**
 * Capture a pre-authorized amount
 * @param {string} transactionId - Pre-auth transaction ID
 * @param {string} token - Optional JWT token
 * @returns {Promise<Object>} - Capture result
 */
export async function capturePreAuth(transactionId, token = null) {
  return makeRequest('POST', '/post-auth', { transactionId }, token)
}

/**
 * Get POS capabilities
 * @param {string} posId - POS ID
 * @param {string} token - Optional JWT token
 * @returns {Promise<Object>} - POS capabilities
 */
export async function getPosCapabilities(posId, token = null) {
  return makeRequest('GET', `/capabilities/${posId}`, null, token)
}

// Default export for convenience
export default {
  queryBin,
  processPayment,
  getTransactionStatus,
  refundTransaction,
  cancelTransaction,
  getPaymentFormUrl,
  preAuthorize,
  capturePreAuth,
  getPosCapabilities
}
