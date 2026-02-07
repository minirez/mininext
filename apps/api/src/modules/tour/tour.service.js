/**
 * Tour Service - Main entry point
 *
 * This file re-exports all tour-related service functions from specialized sub-services
 * for backward compatibility. All existing imports will continue to work.
 *
 * Split into:
 * - tourCrud.service.js -> Tour CRUD operations (list, get, create, update, delete, duplicate, search, stats)
 * - tourMedia.service.js -> Gallery and route stop photo uploads
 * - tourDeparture.service.js -> Departure management and scheduling
 * - tourExtras.service.js -> Tour extras/add-ons management
 * - tourBooking.service.js -> Tour booking operations and pricing
 * - tourAI.service.js -> AI-powered tour data extraction
 */

// ==================== TOURS (CRUD) ====================
export {
  getTours,
  getTourStats,
  searchTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  duplicateTour
} from './tourCrud.service.js'

// ==================== MEDIA ====================
export {
  uploadGalleryImage,
  deleteGalleryImage,
  uploadRouteStopPhoto,
  deleteRouteStopPhoto
} from './tourMedia.service.js'

// ==================== DEPARTURES ====================
export {
  getTourDepartures,
  createTourDeparture,
  bulkCreateDepartures,
  searchDepartures,
  getUpcomingDepartures,
  getDeparture,
  updateDeparture,
  deleteDeparture,
  getDepartureAvailability,
  bulkUpdateDeparturePricing
} from './tourDeparture.service.js'

// ==================== EXTRAS ====================
export {
  getExtras,
  getExtra,
  createExtra,
  updateExtra,
  deleteExtra
} from './tourExtras.service.js'

// ==================== BOOKINGS ====================
export {
  getBookings,
  getUpcomingBookings,
  calculateBookingPrice,
  createBooking,
  getBooking,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  addBookingPayment,
  updateBookingPassengerVisa,
  addBookingNote
} from './tourBooking.service.js'

// ==================== AI EXTRACTION ====================
export {
  aiExtractTourData
} from './tourAI.service.js'
