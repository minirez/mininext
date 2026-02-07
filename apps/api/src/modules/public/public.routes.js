/**
 * @module modules/public/routes
 * @description Public API Routes - No authentication required.
 * For B2C booking engine integration. All routes are rate limited.
 */

import express from 'express'
import { globalLimiter } from '#middleware/rateLimiter.js'

// Import sub-route modules
import widgetRoutes from './routes/publicWidget.routes.js'
import hotelRoutes from './routes/publicHotel.routes.js'
import pricingRoutes from './routes/publicPricing.routes.js'
import bookingRoutes from './routes/publicBooking.routes.js'
import paymentRoutes from './routes/publicPayment.routes.js'

const router = express.Router()

// Apply global rate limiter to all public routes
router.use(globalLimiter)

// Mount sub-routers
router.use('/', widgetRoutes) // Market detection, domain resolution
router.use('/', hotelRoutes) // Hotel info, search, availability, campaigns
router.use('/', pricingRoutes) // Price quotes
router.use('/', bookingRoutes) // Booking CRUD
router.use('/', paymentRoutes) // Payment endpoints

export default router
