import { Router } from 'express'
import { protect, requirePlatformAdmin } from '#middleware/auth.js'
import * as service from './migration.service.js'

const router = Router()

// All migration routes require platform admin
router.use(protect)
router.use(requirePlatformAdmin)

// Connection management
router.post('/connect', service.connect)
router.post('/disconnect', service.disconnect)
router.get('/status', service.getStatus)

// Legacy data browsing
router.get('/accounts', service.getAccounts)
router.get('/accounts/:accountId/hotels', service.getAccountHotels)
router.get('/accounts/:accountId/hotels/:hotelId/preview', service.previewHotel)

// Migration execution
router.post('/migrate', service.migrate)

// Reservation migration
router.get('/accounts/:accountId/reservations', service.getAccountReservations)
router.post('/migrate-reservations', service.migrateReservations)

// History
router.get('/history', service.getHistory)

export default router
