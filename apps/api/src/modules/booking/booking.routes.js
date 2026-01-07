/**
 * Booking Routes
 * Protected routes for partner/admin booking operations
 */

import express from 'express'
import { protect, requireAdmin } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'
import * as bookingService from './booking.service.js'
import paymentRoutes from './payment.routes.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(protect)
router.use(requireAdmin)
router.use(partnerContext)

// ==================== HELPER ROUTES ====================

/**
 * @swagger
 * /api/booking/hotels:
 *   get:
 *     tags: [Bookings]
 *     summary: Get partner hotels for booking
 *     description: Get list of partner's hotels for booking dropdown
 *     responses:
 *       200:
 *         description: List of hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 */
router.get('/hotels', bookingService.getPartnerHotels)

/**
 * @swagger
 * /api/booking/hotels-with-regions:
 *   get:
 *     tags: [Bookings]
 *     summary: Get hotels with regions
 *     description: Get partner's hotels grouped by regions for autocomplete
 *     responses:
 *       200:
 *         description: Hotels and regions data
 */
router.get('/hotels-with-regions', bookingService.getPartnerHotelsWithRegions)

/**
 * @swagger
 * /api/booking/search-autocomplete:
 *   post:
 *     tags: [Bookings]
 *     summary: Search hotels and regions
 *     description: Autocomplete search for hotels and regions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
router.post('/search-autocomplete', bookingService.searchHotelsAndRegions)

/**
 * @swagger
 * /api/booking/stats:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking statistics
 *     description: Get booking statistics for the partner
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Booking statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBookings:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                     averageBookingValue:
 *                       type: number
 */
router.get('/stats', bookingService.getBookingStats)

// ==================== SEARCH & PRICING ====================

/**
 * @swagger
 * /api/booking/search-hotels:
 *   post:
 *     tags: [Bookings]
 *     summary: Search hotels with prices
 *     description: Search multiple hotels or regions with availability and pricing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [checkInDate, checkOutDate, rooms]
 *             properties:
 *               hotelIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               regionId:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               rooms:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     adults:
 *                       type: integer
 *                     children:
 *                       type: integer
 *                     childrenAges:
 *                       type: array
 *                       items:
 *                         type: integer
 *     responses:
 *       200:
 *         description: Search results with availability and pricing
 */
router.post('/search-hotels', bookingService.searchHotelsWithPrices)

/**
 * @swagger
 * /api/booking/search:
 *   post:
 *     tags: [Bookings]
 *     summary: Search availability
 *     description: Search room availability for a single hotel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hotelId, checkInDate, checkOutDate, rooms]
 *             properties:
 *               hotelId:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               rooms:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     adults:
 *                       type: integer
 *                     children:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Available rooms with pricing
 */
router.post('/search', bookingService.searchAvailability)

/**
 * @swagger
 * /api/booking/price-quote:
 *   post:
 *     tags: [Bookings]
 *     summary: Get price quote
 *     description: Get detailed price quote for selected rooms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hotelId, checkInDate, checkOutDate, rooms]
 *             properties:
 *               hotelId:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               rooms:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     roomTypeCode:
 *                       type: string
 *                     mealPlanCode:
 *                       type: string
 *                     adults:
 *                       type: integer
 *                     children:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Detailed price quote
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PriceQuote'
 */
router.post('/price-quote', bookingService.getPriceQuote)

// ==================== DRAFT BOOKING ====================

/**
 * @swagger
 * /api/booking/drafts:
 *   get:
 *     tags: [Bookings]
 *     summary: List draft bookings
 *     description: Get all draft bookings for the current user
 *     responses:
 *       200:
 *         description: List of draft bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 */
router.get('/drafts', bookingService.getMyDrafts)

/**
 * @swagger
 * /api/booking/drafts:
 *   post:
 *     tags: [Bookings]
 *     summary: Create draft booking
 *     description: Create a new draft booking (Phase 1 -> Phase 2 transition)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hotelId, checkInDate, checkOutDate, rooms]
 *             properties:
 *               hotelId:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               rooms:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Draft booking created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingNumber:
 *                       type: string
 */
router.post('/drafts', bookingService.createDraft)

/**
 * @swagger
 * /api/booking/drafts/{bookingNumber}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get draft booking
 *     description: Get a draft booking by booking number
 *     parameters:
 *       - name: bookingNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Draft booking details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/drafts/:bookingNumber', bookingService.getDraft)

/**
 * @swagger
 * /api/booking/drafts/{bookingNumber}:
 *   put:
 *     tags: [Bookings]
 *     summary: Update draft booking
 *     description: Update a draft booking (auto-save)
 *     parameters:
 *       - name: bookingNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadGuest:
 *                 type: object
 *               rooms:
 *                 type: array
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Draft updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/drafts/:bookingNumber', bookingService.updateDraft)

/**
 * @swagger
 * /api/booking/drafts/{bookingNumber}:
 *   delete:
 *     tags: [Bookings]
 *     summary: Delete draft booking
 *     description: Delete a draft booking
 *     parameters:
 *       - name: bookingNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Draft deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/drafts/:bookingNumber', bookingService.deleteDraft)

/**
 * @swagger
 * /api/booking/drafts/{bookingNumber}/complete:
 *   post:
 *     tags: [Bookings]
 *     summary: Complete draft booking
 *     description: Convert draft to confirmed booking
 *     parameters:
 *       - name: bookingNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Draft incomplete or validation failed
 */
router.post('/drafts/:bookingNumber/complete', bookingService.completeDraft)

// ==================== BOOKING CRUD ====================

/**
 * @swagger
 * /api/booking:
 *   get:
 *     tags: [Bookings]
 *     summary: List bookings
 *     description: Get all bookings for the partner with filtering and pagination
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed, no_show]
 *       - name: hotelId
 *         in: query
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', bookingService.listBookings)

/**
 * @swagger
 * /api/booking:
 *   post:
 *     tags: [Bookings]
 *     summary: Create booking
 *     description: Create a new confirmed booking directly (skip draft)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hotelId, checkInDate, checkOutDate, rooms, leadGuest]
 *             properties:
 *               hotelId:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               rooms:
 *                 type: array
 *                 items:
 *                   type: object
 *               leadGuest:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', bookingService.createBooking)

/**
 * @swagger
 * /api/booking/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking detail
 *     description: Get detailed booking information by ID
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', bookingService.getBookingDetail)

/**
 * @swagger
 * /api/booking/{id}:
 *   delete:
 *     tags: [Bookings]
 *     summary: Delete booking permanently (Superadmin only)
 *     description: Hard delete a booking from the system. Only platform admins can perform this action.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Booking deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingNumber:
 *                       type: string
 *       400:
 *         description: Superadmin access required
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', bookingService.deleteBooking)

/**
 * @swagger
 * /api/booking/{id}/status:
 *   patch:
 *     tags: [Bookings]
 *     summary: Update booking status
 *     description: Update booking status
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, completed, no_show]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status transition
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/status', bookingService.updateBookingStatus)

/**
 * @swagger
 * /api/booking/{id}/cancel:
 *   post:
 *     tags: [Bookings]
 *     summary: Cancel booking
 *     description: Cancel a booking with reason
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Booking cancelled
 *       400:
 *         description: Cannot cancel this booking
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/cancel', bookingService.cancelBooking)

/**
 * @swagger
 * /api/booking/{id}/notes:
 *   post:
 *     tags: [Bookings]
 *     summary: Add booking note
 *     description: Add a note to a booking
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [note]
 *             properties:
 *               note:
 *                 type: string
 *               isInternal:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Note added
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/notes', bookingService.addBookingNote)

// ==================== AMENDMENT (BOOKING MODIFICATION) ====================

/**
 * @swagger
 * /api/booking/{id}/amendment:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking for amendment
 *     description: Get booking data with available room types and meal plans for modification
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Booking data for amendment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *                     availableRoomTypes:
 *                       type: array
 *                     availableMealPlans:
 *                       type: array
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/amendment', bookingService.getBookingForAmendment)

/**
 * @swagger
 * /api/booking/{id}/amendment/preview:
 *   post:
 *     tags: [Bookings]
 *     summary: Preview amendment
 *     description: Preview amendment changes with new pricing and availability check
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               rooms:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Amendment preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     originalTotal:
 *                       type: number
 *                     newTotal:
 *                       type: number
 *                     difference:
 *                       type: number
 *                     isAvailable:
 *                       type: boolean
 *       400:
 *         description: Amendment not possible
 */
router.post('/:id/amendment/preview', bookingService.previewAmendment)

/**
 * @swagger
 * /api/booking/{id}/amendment/apply:
 *   post:
 *     tags: [Bookings]
 *     summary: Apply amendment
 *     description: Apply amendment changes to the booking
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               rooms:
 *                 type: array
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Amendment applied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Amendment failed
 */
router.post('/:id/amendment/apply', bookingService.applyAmendment)

/**
 * @swagger
 * /api/booking/{id}/amendments:
 *   get:
 *     tags: [Bookings]
 *     summary: Get amendment history
 *     description: Get all amendments made to a booking
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Amendment history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       amendmentNumber:
 *                         type: integer
 *                       changes:
 *                         type: object
 *                       priceDifference:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       createdBy:
 *                         type: object
 */
router.get('/:id/amendments', bookingService.getAmendmentHistory)

// ==================== PAYMENTS ====================
// Mount payment routes under /api/bookings/:id/payments
router.use('/:id/payments', paymentRoutes)

export default router
