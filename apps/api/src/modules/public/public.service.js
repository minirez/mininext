/**
 * Public API Service
 * B2C/Public facing endpoints for hotel search, availability, and pricing
 * No authentication required, but rate limiting recommended
 *
 * This is a barrel file that re-exports all public service modules
 */

// Domain resolution
export { resolveDomain } from './publicDomain.service.js'

// Hotel listing and info
export { listHotels, getHotelInfo, getRoomTypes, getMealPlans } from './publicHotel.service.js'

// Availability and pricing
export {
  searchAvailability,
  getPriceQuote,
  checkAvailability,
  getActiveCampaigns,
  applyPromoCode
} from './publicAvailability.service.js'

// Booking operations
export { createBooking, getBooking, cancelBooking } from './publicBooking.service.js'

// Widget operations
export { detectMarket, getWidgetConfig } from './publicWidget.service.js'

// Payment operations (for B2C widget)
export {
  queryBinPublic,
  initiateBookingPayment,
  getPaymentStatus,
  getPaymentMethods,
  payment3DCallback
} from './publicPayment.service.js'
