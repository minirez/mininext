/**
 * Payment Gateway Service
 * Communicates with the Payment Service for credit card processing
 */

import logger from '../core/logger.js'

// Payment Service base URL (internal communication)
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://127.0.0.1:7043'

// API Key for internal service authentication
const API_KEY = process.env.PAYMENT_API_KEY || 'pws-internal-api-key-2026'

// Request configuration
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Check if error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean}
 */
function isRetryableError(error) {
  // Network errors, timeouts, 5xx errors are retryable
  if (error.name === 'AbortError') return true
  if (error.message?.includes('ECONNREFUSED')) return true
  if (error.message?.includes('ETIMEDOUT')) return true
  if (error.message?.includes('ENOTFOUND')) return true
  if (error.status >= 500) return true
  return false
}

/**
 * Make request to Payment Service with timeout and retry
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @param {string} token - Optional JWT token for user context
 * @param {Object} options - Additional options
 * @param {number} options.timeout - Request timeout in ms
 * @param {number} options.retries - Number of retries
 * @returns {Promise<Object>}
 */
async function makeRequest(
  method,
  endpoint,
  data = null,
  token = null,
  { timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES } = {}
) {
  const url = `${PAYMENT_SERVICE_URL}/api${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': API_KEY
  }

  // Pass JWT token if provided (for user context)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Pass partnerId as x-user-id header if available (required by payment service)
  if (data?.partnerId) {
    headers['x-user-id'] = data.partnerId
  }

  const fetchOptions = {
    method,
    headers
  }

  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    fetchOptions.body = JSON.stringify(data)
  }

  let lastError
  for (let attempt = 1; attempt <= retries; attempt++) {
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      logger.debug(`[PaymentGateway] ${method} ${url} (attempt ${attempt}/${retries})`, { data })

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (!response.ok) {
        const error = new Error(result.error || result.message || 'Payment service error')
        error.status = response.status
        error.response = result

        // Don't retry 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          logger.error(`[PaymentGateway] Client error (no retry):`, {
            status: response.status,
            result
          })
          throw error
        }

        throw error
      }

      return result
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error

      // Handle timeout
      if (error.name === 'AbortError') {
        logger.warn(`[PaymentGateway] Request timeout (attempt ${attempt}/${retries}):`, {
          endpoint,
          timeout
        })
      } else {
        logger.warn(`[PaymentGateway] Request failed (attempt ${attempt}/${retries}):`, {
          endpoint,
          error: error.message
        })
      }

      // Check if we should retry
      if (attempt < retries && isRetryableError(error)) {
        const delay = RETRY_DELAY * attempt // Exponential backoff
        logger.info(`[PaymentGateway] Retrying in ${delay}ms...`)
        await sleep(delay)
        continue
      }

      // No more retries
      break
    }
  }

  logger.error(`[PaymentGateway] All retries exhausted:`, {
    endpoint,
    error: lastError?.message
  })
  throw lastError
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
export async function queryBin(
  bin,
  amount,
  currency,
  partnerId = null,
  token = null,
  options = {}
) {
  return makeRequest(
    'POST',
    '/bin',
    {
      bin,
      amount,
      currency: currency.toLowerCase(),
      partnerId,
      noFallback: options.noFallback || false
    },
    token
  )
}

/**
 * Lookup BIN info (card country, brand, bank) without POS selection
 * @param {string} bin - First 6-8 digits of card
 * @param {string} partnerId - Partner ID (required for auth header)
 * @returns {Promise<Object>} - { status, bin: { bank, brand, type, family, country } }
 */
export async function lookupBin(bin, partnerId = null, token = null) {
  // Pass partnerId as data so makeRequest sets x-user-id header
  return makeRequest('GET', `/bins/lookup/${bin}`, { partnerId }, token, { retries: 1 })
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
  // Payment service runs on api.maxirez.com (separate from main API)
  const publicUrl = process.env.PAYMENT_PUBLIC_URL || 'https://api.maxirez.com/payment-api'
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

/**
 * Get default installment commission rates
 * @param {string} partnerId - Optional partner ID
 * @param {string} currency - Currency code (try, usd, eur)
 * @returns {Promise<Object>} - { defaultRates, breakdown }
 */
export async function getDefaultRates(partnerId = null, currency = 'try') {
  const params = new URLSearchParams()
  if (partnerId) params.append('partnerId', partnerId)
  if (currency) params.append('currency', currency.toLowerCase())

  const queryString = params.toString()
  const endpoint = `/commission/default-rates${queryString ? `?${queryString}` : ''}`

  return makeRequest('GET', endpoint, null, null)
}

// Default export for convenience
export default {
  queryBin,
  lookupBin,
  processPayment,
  getTransactionStatus,
  refundTransaction,
  cancelTransaction,
  getPaymentFormUrl,
  preAuthorize,
  capturePreAuth,
  getPosCapabilities,
  getDefaultRates
}
