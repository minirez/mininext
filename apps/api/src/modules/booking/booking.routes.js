/**
 * Booking Routes
 * Protected routes for partner/admin booking operations
 */

import express from 'express'
import { protect, requireAdmin } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'
import paymentRoutes from './payment.routes.js'

// Import sub-route modules
import paymentHelperRoutes from './routes/bookingPayment.routes.js'
import searchRoutes from './routes/bookingSearch.routes.js'
import draftRoutes from './routes/bookingDraft.routes.js'
import crudRoutes from './routes/bookingCrud.routes.js'
import statusRoutes from './routes/bookingStatus.routes.js'
import amendmentRoutes from './routes/bookingAmendment.routes.js'
import emailRoutes from './routes/bookingEmail.routes.js'

const router = express.Router()

// ==================== PUBLIC ROUTES (no auth) ====================
// Payment webhook and BIN query
router.use('/', paymentHelperRoutes)

// ==================== PROTECTED ROUTES ====================
// All routes below require authentication and admin role
router.use(protect)
router.use(requireAdmin)
router.use(partnerContext)

// Mount sub-routers
router.use('/', searchRoutes) // Helper routes, stats, search, price-quote
router.use('/', draftRoutes) // Draft bookings
router.use('/', crudRoutes) // CRUD operations
router.use('/', statusRoutes) // Status updates, cancellation
router.use('/', amendmentRoutes) // Amendments
router.use('/', emailRoutes) // Email preview and sending

// ==================== PAYMENTS ====================
// Mount payment routes under /api/bookings/:id/payments
router.use('/:id/payments', paymentRoutes)

export default router
