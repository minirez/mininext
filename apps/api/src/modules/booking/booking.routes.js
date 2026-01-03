/**
 * Booking Routes
 * Protected routes for partner/admin booking operations
 */

import express from 'express'
import { protect, requireAdmin } from '../../middleware/auth.js'
import { partnerContext } from '../../middlewares/partnerContext.js'
import * as bookingService from './booking.service.js'
import paymentRoutes from './payment.routes.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(protect)
router.use(requireAdmin)
router.use(partnerContext)

// ==================== HELPER ROUTES ====================

// Get partner's hotels for booking dropdown
router.get('/hotels', bookingService.getPartnerHotels)

// Get partner's hotels with regions (for autocomplete)
router.get('/hotels-with-regions', bookingService.getPartnerHotelsWithRegions)

// Search hotels and regions (autocomplete)
router.post('/search-autocomplete', bookingService.searchHotelsAndRegions)

// Get booking statistics
router.get('/stats', bookingService.getBookingStats)

// ==================== SEARCH & PRICING ====================

// Search hotels with prices (multi-hotel/region search)
router.post('/search-hotels', bookingService.searchHotelsWithPrices)

// Search availability for single hotel
router.post('/search', bookingService.searchAvailability)

// Get price quote
router.post('/price-quote', bookingService.getPriceQuote)

// ==================== DRAFT BOOKING ====================

// List user's drafts
router.get('/drafts', bookingService.getMyDrafts)

// Create draft (Phase 1 -> Phase 2 transition)
router.post('/drafts', bookingService.createDraft)

// Get draft by booking number
router.get('/drafts/:bookingNumber', bookingService.getDraft)

// Update draft (auto-save)
router.put('/drafts/:bookingNumber', bookingService.updateDraft)

// Delete draft
router.delete('/drafts/:bookingNumber', bookingService.deleteDraft)

// Complete draft -> confirmed booking
router.post('/drafts/:bookingNumber/complete', bookingService.completeDraft)

// ==================== BOOKING CRUD ====================

// List bookings
router.get('/', bookingService.listBookings)

// Create booking
router.post('/', bookingService.createBooking)

// Get booking detail
router.get('/:id', bookingService.getBookingDetail)

// Update booking status
router.patch('/:id/status', bookingService.updateBookingStatus)

// Cancel booking
router.post('/:id/cancel', bookingService.cancelBooking)

// Add note to booking
router.post('/:id/notes', bookingService.addBookingNote)

// ==================== AMENDMENT (BOOKING MODIFICATION) ====================

// Get booking data for amendment (includes available room types and meal plans)
router.get('/:id/amendment', bookingService.getBookingForAmendment)

// Preview amendment changes (calculates new price, checks availability)
router.post('/:id/amendment/preview', bookingService.previewAmendment)

// Apply amendment to booking
router.post('/:id/amendment/apply', bookingService.applyAmendment)

// Get amendment history
router.get('/:id/amendments', bookingService.getAmendmentHistory)

// ==================== PAYMENTS ====================
// Mount payment routes under /api/bookings/:id/payments
router.use('/:id/payments', paymentRoutes)

export default router
