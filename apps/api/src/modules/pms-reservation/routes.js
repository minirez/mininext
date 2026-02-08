import express from 'express'
import * as reservationService from './reservation.service.js'
import { protect, requirePmsAccess, setPmsHotelContext } from '#middleware/auth.js'

const router = express.Router()

const hotelMiddleware = [protect, requirePmsAccess, setPmsHotelContext]

// ===========================================
// RESERVATION MANAGEMENT ROUTES
// ===========================================

// Get all reservations for a hotel
router.get('/hotels/:hotelId/reservations', hotelMiddleware, reservationService.getReservations)

// Get reservations by date range (calendar view)
router.get(
  '/hotels/:hotelId/reservations/calendar',
  hotelMiddleware,
  reservationService.getReservationsByDateRange
)

// Get today's arrivals
router.get(
  '/hotels/:hotelId/reservations/arrivals',
  hotelMiddleware,
  reservationService.getTodayArrivals
)

// Get today's departures
router.get(
  '/hotels/:hotelId/reservations/departures',
  hotelMiddleware,
  reservationService.getTodayDepartures
)

// Get reservation statistics
router.get(
  '/hotels/:hotelId/reservations/stats',
  hotelMiddleware,
  reservationService.getReservationStats
)

// Get single reservation
router.get(
  '/hotels/:hotelId/reservations/:reservationId',
  hotelMiddleware,
  reservationService.getReservation
)

// Create new reservation
router.post('/hotels/:hotelId/reservations', hotelMiddleware, reservationService.createReservation)

// Update reservation
router.put(
  '/hotels/:hotelId/reservations/:reservationId',
  hotelMiddleware,
  reservationService.updateReservation
)

// Confirm reservation
router.post(
  '/hotels/:hotelId/reservations/:reservationId/confirm',
  hotelMiddleware,
  reservationService.confirmReservation
)

// Cancel reservation
router.post(
  '/hotels/:hotelId/reservations/:reservationId/cancel',
  hotelMiddleware,
  reservationService.cancelReservation
)

// Mark as no-show
router.post(
  '/hotels/:hotelId/reservations/:reservationId/no-show',
  hotelMiddleware,
  reservationService.markNoShow
)

// Add note to reservation
router.post(
  '/hotels/:hotelId/reservations/:reservationId/notes',
  hotelMiddleware,
  reservationService.addNote
)

// Add payment to reservation
router.post(
  '/hotels/:hotelId/reservations/:reservationId/payments',
  hotelMiddleware,
  reservationService.addPayment
)

// Recalculate payment data (fix corrupted data)
router.post(
  '/hotels/:hotelId/reservations/:reservationId/recalculate-payment',
  hotelMiddleware,
  reservationService.recalculatePayment
)

// Sync payments from reservation to associated stay
router.post(
  '/hotels/:hotelId/reservations/:reservationId/sync-to-stay',
  hotelMiddleware,
  reservationService.syncPaymentsToStay
)

export default router
