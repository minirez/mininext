import express from 'express'
import { protect, requirePmsAccess, setPmsHotelContext } from '#middleware/auth.js'
import * as service from './channel-manager.service.js'

const router = express.Router()

const hotelMiddleware = [protect, requirePmsAccess, setPmsHotelContext]

// ========================
// Webhook routes (no auth)
// ========================

// Reservation push notification from Reseliva
router.get('/webhook/reservation-push', service.handleReservationPush)

// Error report from Reseliva (JSON POST)
router.post('/webhook/error-report', service.handleErrorReport)

// ========================
// Protected routes
// ========================

// Connection CRUD
router.get('/hotels/:hotelId/connection', hotelMiddleware, service.getConnection)
router.post('/hotels/:hotelId/connection', hotelMiddleware, service.createOrUpdateConnection)
router.post('/hotels/:hotelId/connection/test', hotelMiddleware, service.testConnection)
router.delete('/hotels/:hotelId/connection', hotelMiddleware, service.deleteConnection)

// Products & Mappings
router.get('/hotels/:hotelId/products', hotelMiddleware, service.fetchProducts)
router.put('/hotels/:hotelId/mappings', hotelMiddleware, service.saveRoomMappings)

// OTA
router.get('/hotels/:hotelId/ota-list', hotelMiddleware, service.fetchOTAs)
router.get('/hotels/:hotelId/ota-products', hotelMiddleware, service.fetchOTAProducts)

// Sync
router.post('/hotels/:hotelId/sync/reservations', hotelMiddleware, service.triggerManualSync)
router.post('/hotels/:hotelId/sync/inventory', hotelMiddleware, service.triggerInventorySync)
router.get('/hotels/:hotelId/sync/status', hotelMiddleware, service.getSyncStatus)
router.get('/hotels/:hotelId/sync/pending', hotelMiddleware, service.getPendingSyncs)
router.post('/hotels/:hotelId/sync/retry-failed', hotelMiddleware, service.retryFailedSyncs)

// Logs
router.get('/hotels/:hotelId/logs', hotelMiddleware, service.getLogs)
router.get('/hotels/:hotelId/logs/:logId', hotelMiddleware, service.getLogDetail)

// Scheduler
router.get('/scheduler/status', protect, service.getSchedulerStatus)

export default router
