/**
 * Stay Service - Hub / Re-export
 *
 * This file re-exports all stay operations from their respective sub-services.
 * The actual implementations are split into:
 *   - stayQuery.service.js    → Read operations (list, detail, stats)
 *   - stayCheckin.service.js   → Check-in operations (walk-in, booking, pending)
 *   - stayCheckout.service.js  → Check-out operation
 *   - stayPayment.service.js   → Payment & extra charge operations
 *   - stayRoom.service.js      → Room change, extend, notes
 *   - stayGuest.service.js     → Guest CRUD operations
 *   - stay.internal.js         → Shared internal helpers (socket, notifications)
 *   - stay.helpers.js          → Guest profile helpers
 */

// Query operations
export {
  getStays,
  getStay,
  getActiveStays,
  getTodayActivity,
  getFrontDeskStats,
  getAvailableRooms
} from './stayQuery.service.js'

// Check-in operations
export {
  walkInCheckIn,
  checkInFromBooking,
  createStay,
  checkInFromStay
} from './stayCheckin.service.js'

// Check-out operation
export { checkOut } from './stayCheckout.service.js'

// Payment & extra charge operations
export { addExtra, addPayment } from './stayPayment.service.js'

// Room operations
export { changeRoom, extendStay, updateNotes } from './stayRoom.service.js'

// Guest operations
export { updateGuests, addGuest, updateGuest, removeGuest } from './stayGuest.service.js'

// Enums
export { STAY_STATUS, PAYMENT_STATUS } from './stay.model.js'
