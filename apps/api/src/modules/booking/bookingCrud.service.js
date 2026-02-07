/**
 * Booking CRUD Service
 * Core booking CRUD operations
 * Split from booking.service.js for better maintainability
 *
 * This file now serves as a re-export module for backward compatibility.
 * All functions are organized into focused sub-services:
 * - bookingQuery.service.js: List and get operations
 * - bookingCreate.service.js: Booking creation (with/without payment links)
 * - bookingUpdate.service.js: Status updates and notes
 * - bookingStatus.service.js: Cancellation and deletion
 */

// Query operations
export {
  listBookings,
  getBookingDetail
} from './bookingQuery.service.js'

// Create operations
export {
  createBooking,
  createBookingWithPaymentLink
} from './bookingCreate.service.js'

// Update operations
export {
  updateBookingStatus,
  addBookingNote
} from './bookingUpdate.service.js'

// Status operations (cancel, delete)
export {
  cancelBooking,
  deleteBooking
} from './bookingStatus.service.js'
