import express from 'express'
import * as service from './tour.service.js'
import { protect, requireAdmin } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'
import { tourGalleryUpload, tourStopPhotoUpload } from '#helpers/tourUpload.js'

const router = express.Router()

// All tour module endpoints are protected and partner-scoped
router.use(protect)
router.use(requireAdmin)
router.use(partnerContext)

// ==================== AI ====================
router.post('/ai/extract', service.aiExtractTourData)

// ==================== TOURS ====================
router.get('/', service.getTours)
router.get('/stats', service.getTourStats)
router.get('/search', service.searchTours)

router.post('/', service.createTour)

// ==================== MEDIA (NEW) ====================
router.post('/:id/gallery', tourGalleryUpload.single('file'), service.uploadGalleryImage)
router.delete('/:id/gallery/:imageId', service.deleteGalleryImage)
router.post(
  '/:id/route-stops/:stopId/photo',
  tourStopPhotoUpload.single('file'),
  service.uploadRouteStopPhoto
)
router.delete('/:id/route-stops/:stopId/photo', service.deleteRouteStopPhoto)

// ==================== DEPARTURES ====================
// Global (no tourId)
router.get('/departures/search', service.searchDepartures)
router.get('/departures/upcoming', service.getUpcomingDepartures)
router.get('/departures/:id', service.getDeparture)
router.put('/departures/:id', service.updateDeparture)
router.delete('/departures/:id', service.deleteDeparture)
router.get('/departures/:id/availability', service.getDepartureAvailability)

// Per-tour
router.get('/:tourId/departures', service.getTourDepartures)
router.post('/:tourId/departures', service.createTourDeparture)
router.post('/:tourId/departures/bulk', service.bulkCreateDepartures)
router.delete('/:tourId/departures/bulk', service.bulkDeleteDepartures)
router.put('/:tourId/departures/pricing', service.bulkUpdateDeparturePricing)

// ==================== EXTRAS ====================
router.get('/extras', service.getExtras)
router.post('/extras', service.createExtra)
router.get('/extras/:id', service.getExtra)
router.put('/extras/:id', service.updateExtra)
router.delete('/extras/:id', service.deleteExtra)

// ==================== BOOKINGS ====================
router.get('/bookings', service.getBookings)
router.get('/bookings/upcoming', service.getUpcomingBookings)
router.post('/bookings/calculate-price', service.calculateBookingPrice)
router.post('/bookings', service.createBooking)
router.get('/bookings/:id', service.getBooking)
router.put('/bookings/:id', service.updateBooking)
router.patch('/bookings/:id/status', service.updateBookingStatus)
router.post('/bookings/:id/cancel', service.cancelBooking)
router.post('/bookings/:id/payments', service.addBookingPayment)
router.post('/bookings/:id/visa/:passengerIndex', service.updateBookingPassengerVisa)
router.post('/bookings/:id/notes', service.addBookingNote)

// ==================== TOURS (ID ROUTES LAST) ====================
router.get('/:id', service.getTour)
router.put('/:id', service.updateTour)
router.delete('/:id', service.deleteTour)
router.post('/:id/duplicate', service.duplicateTour)

export default router
