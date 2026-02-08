import express from 'express'
import * as stayService from './stay.service.js'
import * as reportsService from './reports.service.js'
import roomPlanRoutes from './roomPlan.routes.js'
import { protect, requirePmsAccess, setPmsHotelContext } from '#middleware/auth.js'

const router = express.Router()

const hotelMiddleware = [protect, requirePmsAccess, setPmsHotelContext]

// ===========================================
// FRONT DESK ROUTES (Alias for compatibility)
// ===========================================

// Today's arrivals (alias for reports)
router.get(
  '/hotels/:hotelId/front-desk/arrivals',
  hotelMiddleware,
  reportsService.getArrivalsReport
)

// Today's departures (alias for reports)
router.get(
  '/hotels/:hotelId/front-desk/departures',
  hotelMiddleware,
  reportsService.getDeparturesReport
)

// In-house guests (alias for reports)
router.get('/hotels/:hotelId/front-desk/in-house', hotelMiddleware, reportsService.getInHouseReport)

// ===========================================
// STAY MANAGEMENT ROUTES (Front Desk)
// ===========================================

// Get all stays
router.get('/hotels/:hotelId/stays', hotelMiddleware, stayService.getStays)

// Create new stay directly
router.post('/hotels/:hotelId/stays', hotelMiddleware, stayService.createStay)

// Get front desk statistics
router.get('/hotels/:hotelId/stays/stats', hotelMiddleware, stayService.getFrontDeskStats)

// Get today's activity (arrivals, departures)
router.get('/hotels/:hotelId/stays/today', hotelMiddleware, stayService.getTodayActivity)

// Get active stays
router.get('/hotels/:hotelId/stays/active', hotelMiddleware, stayService.getActiveStays)

// Get available rooms for check-in
router.get('/hotels/:hotelId/stays/available-rooms', hotelMiddleware, stayService.getAvailableRooms)

// Get single stay
router.get('/hotels/:hotelId/stays/:stayId', hotelMiddleware, stayService.getStay)

// Walk-in check-in
router.post('/hotels/:hotelId/stays/walk-in', hotelMiddleware, stayService.walkInCheckIn)

// Check-in from booking
router.post('/hotels/:hotelId/stays/check-in', hotelMiddleware, stayService.checkInFromBooking)

// Check-in from pending stay (staff reservation or auto-created from booking)
router.patch(
  '/hotels/:hotelId/stays/:stayId/check-in',
  hotelMiddleware,
  stayService.checkInFromStay
)

// Check-out
router.post('/hotels/:hotelId/stays/:stayId/check-out', hotelMiddleware, stayService.checkOut)

// Add extra charge
router.post('/hotels/:hotelId/stays/:stayId/extras', hotelMiddleware, stayService.addExtra)

// Add payment
router.post('/hotels/:hotelId/stays/:stayId/payments', hotelMiddleware, stayService.addPayment)

// Change room
router.post('/hotels/:hotelId/stays/:stayId/change-room', hotelMiddleware, stayService.changeRoom)

// Extend stay
router.post('/hotels/:hotelId/stays/:stayId/extend', hotelMiddleware, stayService.extendStay)

// Update notes
router.patch('/hotels/:hotelId/stays/:stayId/notes', hotelMiddleware, stayService.updateNotes)

// Guest management
router.put('/hotels/:hotelId/stays/:stayId/guests', hotelMiddleware, stayService.updateGuests)
router.post('/hotels/:hotelId/stays/:stayId/guests', hotelMiddleware, stayService.addGuest)
router.patch(
  '/hotels/:hotelId/stays/:stayId/guests/:guestIndex',
  hotelMiddleware,
  stayService.updateGuest
)
router.delete(
  '/hotels/:hotelId/stays/:stayId/guests/:guestIndex',
  hotelMiddleware,
  stayService.removeGuest
)

// ===========================================
// REPORTS ROUTES
// ===========================================

// Dashboard summary report
router.get('/hotels/:hotelId/reports/dashboard', hotelMiddleware, reportsService.getDashboardReport)

// Occupancy reports
router.get('/hotels/:hotelId/reports/occupancy', hotelMiddleware, reportsService.getOccupancyReport)
router.get(
  '/hotels/:hotelId/reports/occupancy/room-types',
  hotelMiddleware,
  reportsService.getRoomTypeOccupancy
)

// Arrival/Departure reports
router.get('/hotels/:hotelId/reports/arrivals', hotelMiddleware, reportsService.getArrivalsReport)
router.get(
  '/hotels/:hotelId/reports/departures',
  hotelMiddleware,
  reportsService.getDeparturesReport
)
router.get('/hotels/:hotelId/reports/in-house', hotelMiddleware, reportsService.getInHouseReport)

// Financial reports
router.get('/hotels/:hotelId/reports/revenue', hotelMiddleware, reportsService.getRevenueReport)
router.get('/hotels/:hotelId/reports/shifts', hotelMiddleware, reportsService.getShiftReport)

// Housekeeping report
router.get(
  '/hotels/:hotelId/reports/housekeeping',
  hotelMiddleware,
  reportsService.getHousekeepingReport
)

// Guest reports
router.get(
  '/hotels/:hotelId/reports/guests/nationality',
  hotelMiddleware,
  reportsService.getGuestNationalityReport
)
router.get(
  '/hotels/:hotelId/reports/guests/vip',
  hotelMiddleware,
  reportsService.getVipGuestsReport
)

// ===========================================
// ROOM PLAN ROUTES
// Timeline view for room occupancy management
// ===========================================

router.use('/hotels/:hotelId/room-plan', hotelMiddleware, roomPlanRoutes)

export default router
