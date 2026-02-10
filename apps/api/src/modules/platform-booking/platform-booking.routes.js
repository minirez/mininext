/**
 * Platform Booking Routes
 * Platform admin only - cross-partner booking access
 */

import express from 'express'
import { protect, requirePlatformAdmin } from '#middleware/auth.js'
import * as service from './platform-booking.service.js'

const router = express.Router()

// All routes require platform admin
router.use(protect)
router.use(requirePlatformAdmin)

// List all bookings across partners
router.get('/', service.listPlatformBookings)

// Get platform-wide booking statistics
router.get('/stats', service.getPlatformBookingStats)

export default router
