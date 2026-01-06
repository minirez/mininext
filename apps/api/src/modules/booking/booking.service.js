/**
 * Booking Service
 * Partner/Admin booking operations with partner context
 * Authenticated endpoints for B2C booking within admin panel
 *
 * NOTE: This file has been refactored and split into smaller modules:
 * - helpers.js - Common helper functions
 * - hotelListing.service.js - Hotel listing and search
 * - search.service.js - Availability search and pricing
 * - bookingCrud.service.js - Core CRUD operations
 * - stats.service.js - Booking statistics
 * - drafts.service.js - Draft booking management
 * - amendments.service.js - Booking modifications
 *
 * This file re-exports everything for backward compatibility.
 * New code should import directly from the specific service files.
 */

// Re-export everything from index.js
export * from './index.js'
