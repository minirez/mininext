import { Router } from 'express'
import { protect, requirePlatformAdmin } from '#middleware/auth.js'
import * as service from './migration.service.js'
import * as resMigService from './reservationMigration.service.js'

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

// Reservation migration (legacy - hotel-dependent)
router.get('/accounts/:accountId/reservations', service.getAccountReservations)
router.post('/migrate-reservations', service.migrateReservations)

// Standalone reservation migration
router.get('/reservations/legacy-hotels', resMigService.getLegacyHotelsWithBookings)
router.get('/reservations/new-hotels', resMigService.getNewSystemHotels)
router.post('/reservations/migrate', resMigService.startMigration)
router.get('/reservations/history', resMigService.getHistory)

// History
router.get('/history', service.getHistory)

export default router
