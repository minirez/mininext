/**
 * Booking Module Index
 * Re-exports all booking-related services for backward compatibility
 */

// Helpers
export {
  sanitizeGuest,
  sanitizeRoomGuests,
  createGuestFromBooking,
  createPendingStayFromBooking,
  createBookingSnapshot,
  compareValues,
  detectAmendmentType
} from './helpers.js'

// Hotel Listing
export {
  getPartnerHotels,
  getPartnerHotelsWithRegions,
  searchHotelsAndRegions
} from './hotelListing.service.js'

// Search
export {
  searchHotelsWithPrices,
  searchAvailability,
  getPriceQuote
} from './search.service.js'

// Booking CRUD
export {
  listBookings,
  getBookingDetail,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  addBookingNote
} from './bookingCrud.service.js'

// Statistics
export {
  getBookingStats
} from './stats.service.js'

// Drafts
export {
  createDraft,
  getMyDrafts,
  getDraft,
  updateDraft,
  deleteDraft,
  completeDraft
} from './drafts.service.js'

// Amendments
export {
  getBookingForAmendment,
  previewAmendment,
  applyAmendment,
  getAmendmentHistory
} from './amendments.service.js'
