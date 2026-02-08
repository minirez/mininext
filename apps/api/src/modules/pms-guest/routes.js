import express from 'express'
import * as guestService from './guest.service.js'
import kbsRoutes from './kbs.routes.js'
import { protect, requirePmsAccess, setPmsHotelContext } from '#middleware/auth.js'

const router = express.Router()

// ===========================================
// GUEST MANAGEMENT ROUTES
// ===========================================

// Common Middleware for this module's hotel routes
const hotelMiddleware = [protect, requirePmsAccess, setPmsHotelContext]

// Get all guests
router.get('/hotels/:hotelId/guests', hotelMiddleware, guestService.getGuests)

// Get guest statistics
router.get('/hotels/:hotelId/guests/stats', hotelMiddleware, guestService.getGuestStats)

// Get VIP guests
router.get('/hotels/:hotelId/guests/vip', hotelMiddleware, guestService.getVipGuests)

// Get blacklisted guests
router.get(
  '/hotels/:hotelId/guests/blacklisted',
  hotelMiddleware,
  guestService.getBlacklistedGuests
)

// Get recent guests
router.get('/hotels/:hotelId/guests/recent', hotelMiddleware, guestService.getRecentGuests)

// Get single guest
router.get('/hotels/:hotelId/guests/:guestId', hotelMiddleware, guestService.getGuest)

// Create new guest
router.post('/hotels/:hotelId/guests', hotelMiddleware, guestService.createGuest)

// Update guest
router.put('/hotels/:hotelId/guests/:guestId', hotelMiddleware, guestService.updateGuest)

// Delete guest
router.delete('/hotels/:hotelId/guests/:guestId', hotelMiddleware, guestService.deleteGuest)

// Set VIP level
router.patch('/hotels/:hotelId/guests/:guestId/vip', hotelMiddleware, guestService.setVipLevel)

// Blacklist guest
router.post(
  '/hotels/:hotelId/guests/:guestId/blacklist',
  hotelMiddleware,
  guestService.blacklistGuest
)

// Remove from blacklist
router.delete(
  '/hotels/:hotelId/guests/:guestId/blacklist',
  hotelMiddleware,
  guestService.removeFromBlacklist
)

// Add note to guest
router.post('/hotels/:hotelId/guests/:guestId/notes', hotelMiddleware, guestService.addNote)

// Delete note from guest
router.delete(
  '/hotels/:hotelId/guests/:guestId/notes/:noteId',
  hotelMiddleware,
  guestService.deleteNote
)

// Update guest tags
router.patch('/hotels/:hotelId/guests/:guestId/tags', hotelMiddleware, guestService.updateTags)

// Get guest stay history
router.get('/hotels/:hotelId/guests/:guestId/stays', hotelMiddleware, guestService.getStayHistory)

// Merge guests
router.post('/hotels/:hotelId/guests/merge', hotelMiddleware, guestService.mergeGuests)

// ===========================================
// KBS (Kimlik Bildirim Sistemi) ROUTES
// ===========================================

router.use('/hotels/:hotelId/kbs', hotelMiddleware, kbsRoutes)

export default router
