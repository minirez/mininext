/**
 * Widget API Service
 * HTTP client for public API endpoints
 */

const DEFAULT_API_URL = 'https://api.maxirez.com/api'

/**
 * Make API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @param {string} apiUrl - Base API URL
 */
async function request(endpoint, options = {}, apiUrl = DEFAULT_API_URL) {
  const url = `${apiUrl}/public${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'API request failed')
  }

  return data.data
}

export const widgetApi = {
  /**
   * Detect market from IP
   */
  async detectMarket(apiUrl) {
    return request('/detect-market', {}, apiUrl)
  },

  /**
   * Get widget configuration for hotel
   */
  async getWidgetConfig(hotelCode, partnerId, apiUrl) {
    const query = partnerId ? `?partner=${partnerId}` : ''
    return request(`/hotels/${hotelCode}/widget-config${query}`, {}, apiUrl)
  },

  /**
   * Get hotel info
   */
  async getHotelInfo(hotelCode, apiUrl) {
    return request(`/hotels/${hotelCode}`, {}, apiUrl)
  },

  /**
   * Get room types
   */
  async getRoomTypes(hotelCode, apiUrl) {
    return request(`/hotels/${hotelCode}/room-types`, {}, apiUrl)
  },

  /**
   * Get meal plans
   */
  async getMealPlans(hotelCode, apiUrl) {
    return request(`/hotels/${hotelCode}/meal-plans`, {}, apiUrl)
  },

  /**
   * Search availability
   */
  async searchAvailability(hotelCode, params, apiUrl) {
    return request(
      `/hotels/${hotelCode}/search`,
      {
        method: 'POST',
        body: JSON.stringify(params)
      },
      apiUrl
    )
  },

  /**
   * Get price quote
   */
  async getPriceQuote(hotelCode, params, apiUrl) {
    return request(
      `/hotels/${hotelCode}/price-quote`,
      {
        method: 'POST',
        body: JSON.stringify(params)
      },
      apiUrl
    )
  },

  /**
   * Get active campaigns
   */
  async getCampaigns(hotelCode, checkIn, checkOut, apiUrl) {
    const query = new URLSearchParams()
    if (checkIn) query.append('checkIn', checkIn)
    if (checkOut) query.append('checkOut', checkOut)

    return request(`/hotels/${hotelCode}/campaigns?${query}`, {}, apiUrl)
  },

  /**
   * Create booking
   */
  async createBooking(bookingData, apiUrl) {
    return request(
      '/bookings',
      {
        method: 'POST',
        body: JSON.stringify(bookingData)
      },
      apiUrl
    )
  },

  /**
   * Get booking by number
   */
  async getBooking(bookingNumber, email, apiUrl) {
    return request(`/bookings/${bookingNumber}?email=${encodeURIComponent(email)}`, {}, apiUrl)
  },

  /**
   * Cancel booking
   */
  async cancelBooking(bookingNumber, email, reason, apiUrl) {
    return request(
      `/bookings/${bookingNumber}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ email, reason })
      },
      apiUrl
    )
  },

  // Payment Methods

  /**
   * Get payment methods for hotel
   */
  async getPaymentMethods(hotelCode, apiUrl) {
    return request(`/hotels/${hotelCode}/payment-methods`, {}, apiUrl)
  },

  /**
   * Query BIN for installment options
   */
  async queryBin(hotelCode, bin, amount, currency, apiUrl) {
    return request(
      '/payment/bin',
      {
        method: 'POST',
        body: JSON.stringify({ hotelCode, bin, amount, currency })
      },
      apiUrl
    )
  },

  /**
   * Initiate payment for booking
   */
  async initiatePayment(bookingNumber, paymentData, apiUrl) {
    return request(
      `/bookings/${bookingNumber}/pay`,
      {
        method: 'POST',
        body: JSON.stringify(paymentData)
      },
      apiUrl
    )
  },

  /**
   * Get bank accounts for bank transfer
   */
  async getBankAccounts(partnerId, apiUrl) {
    const query = partnerId ? `?partnerId=${partnerId}` : ''
    return request(`/payment/bank-accounts${query}`, {}, apiUrl)
  },

  /**
   * Get payment status
   */
  async getPaymentStatus(bookingNumber, email, paymentId, apiUrl) {
    const query = new URLSearchParams({ email })
    if (paymentId) query.append('paymentId', paymentId)

    return request(`/bookings/${bookingNumber}/payment-status?${query}`, {}, apiUrl)
  }
}

export default widgetApi
