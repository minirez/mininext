/**
 * @module modules/public/routes
 * @description Public API Routes - No authentication required.
 * For B2C booking engine integration. All routes are rate limited.
 */

import express from 'express'
import * as publicService from './public.service.js'
import {
  globalLimiter,
  publicSearchLimiter,
  publicBookingLimiter,
  pricingLimiter
} from '#middleware/rateLimiter.js'
import { validateBody, validateQuery } from '#middleware/validation.js'

const router = express.Router()

// Apply global rate limiter to all public routes
router.use(globalLimiter)

// ==================== WIDGET ENDPOINTS ====================

/**
 * @swagger
 * /api/public/detect-market:
 *   get:
 *     tags: [Public]
 *     summary: Detect market from IP
 *     description: Detect visitor's country and appropriate currency from IP address
 *     security: []
 *     responses:
 *       200:
 *         description: Market information
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
 *                     countryCode:
 *                       type: string
 *                       example: TR
 *                     currency:
 *                       type: string
 *                       example: TRY
 *                     locale:
 *                       type: string
 *                       example: tr-TR
 */
router.get('/detect-market', publicService.detectMarket)

// ==================== DOMAIN RESOLUTION ====================

/**
 * @swagger
 * /api/public/resolve-domain:
 *   get:
 *     tags: [Public]
 *     summary: Resolve PMS domain
 *     description: Resolve a domain to its associated hotel or partner for white-label setups
 *     security: []
 *     parameters:
 *       - name: domain
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         example: pms.example.com
 *     responses:
 *       200:
 *         description: Domain resolved successfully
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
 *                     type:
 *                       type: string
 *                       enum: [hotel, partner]
 *                     hotel:
 *                       $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: Domain not found
 */
router.get('/resolve-domain', publicService.resolveDomain)

// ==================== HOTEL ENDPOINTS ====================

/**
 * @swagger
 * /api/public/hotels:
 *   get:
 *     tags: [Public]
 *     summary: List hotels
 *     description: Get list of available hotels with optional filters
 *     security: []
 *     parameters:
 *       - name: city
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by city name
 *       - name: country
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by country code (e.g., TR, DE)
 *       - name: stars
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by star rating
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [hotel, resort, boutique, apart, hostel]
 *         description: Filter by hotel type
 *       - name: amenities
 *         in: query
 *         schema:
 *           type: string
 *         description: Comma-separated amenities (pool,spa,gym)
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *           enum: [price, rating, name, displayOrder]
 *           default: displayOrder
 *     responses:
 *       200:
 *         description: Hotel list
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
 *                     hotels:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Hotel'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/hotels', publicService.listHotels)

/**
 * @swagger
 * /api/public/hotels/{hotelCode}:
 *   get:
 *     tags: [Public]
 *     summary: Get hotel details
 *     description: Get detailed information about a specific hotel
 *     security: []
 *     parameters:
 *       - name: hotelCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel unique code
 *         example: GRD001
 *     responses:
 *       200:
 *         description: Hotel details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/hotels/:hotelCode', publicService.getHotelInfo)

/**
 * @swagger
 * /api/public/hotels/{hotelCode}/room-types:
 *   get:
 *     tags: [Public]
 *     summary: Get hotel room types
 *     description: Get all room types available at the hotel
 *     security: []
 *     parameters:
 *       - name: hotelCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room types list
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
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       maxOccupancy:
 *                         type: integer
 *                       maxAdults:
 *                         type: integer
 *                       maxChildren:
 *                         type: integer
 *                       size:
 *                         type: number
 *                       amenities:
 *                         type: array
 *                         items:
 *                           type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 */
router.get('/hotels/:hotelCode/room-types', publicService.getRoomTypes)

/**
 * @swagger
 * /api/public/hotels/{hotelCode}/meal-plans:
 *   get:
 *     tags: [Public]
 *     summary: Get hotel meal plans
 *     description: Get all meal plans available at the hotel
 *     security: []
 *     parameters:
 *       - name: hotelCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meal plans list
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
 *                       code:
 *                         type: string
 *                         example: AI
 *                       name:
 *                         type: string
 *                         example: All Inclusive
 *                       description:
 *                         type: string
 */
router.get('/hotels/:hotelCode/meal-plans', publicService.getMealPlans)

/**
 * @swagger
 * /api/public/hotels/{hotelCode}/widget-config:
 *   get:
 *     tags: [Public]
 *     summary: Get widget configuration
 *     description: Get hotel info and widget configuration for B2C widget
 *     security: []
 *     parameters:
 *       - name: hotelCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel unique code
 *     responses:
 *       200:
 *         description: Widget configuration
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
 *                     hotel:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: object
 *                         logo:
 *                           type: object
 *                         whatsapp:
 *                           type: string
 *                     config:
 *                       type: object
 *                       properties:
 *                         theme:
 *                           type: string
 *                         primaryColor:
 *                           type: string
 *                         allowPayAtHotel:
 *                           type: boolean
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/hotels/:hotelCode/widget-config', publicService.getWidgetConfig)

// ==================== SEARCH & AVAILABILITY ====================

/**
 * @swagger
 * /api/public/hotels/{hotelCode}/search:
 *   post:
 *     tags: [Public]
 *     summary: Search availability and prices
 *     description: Search for available rooms with pricing. Rate limited to 30 requests/minute.
 *     security: []
 *     parameters:
 *       - name: hotelCode
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
 *             required: [checkIn, checkOut]
 *             properties:
 *               checkIn:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-15"
 *               checkOut:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-18"
 *               adults:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 2
 *               children:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   description: Child age
 *                 example: [5, 8]
 *               countryCode:
 *                 type: string
 *                 description: Guest country code for market-based pricing
 *                 example: "DE"
 *               currency:
 *                 type: string
 *                 example: "EUR"
 *     responses:
 *       200:
 *         description: Search results with available rooms and prices
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
 *                     rooms:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           roomType:
 *                             type: object
 *                           mealPlans:
 *                             type: array
 *                           availability:
 *                             type: integer
 *                           prices:
 *                             type: object
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  '/hotels/:hotelCode/search',
  publicSearchLimiter,
  validateBody({
    checkIn: { type: 'date', required: true },
    checkOut: { type: 'date', required: true },
    adults: { type: 'integer', min: 1, max: 10 },
    children: { type: 'array' }
  }),
  publicService.searchAvailability
)

/**
 * @swagger
 * /api/public/hotels/{hotelCode}/availability:
 *   get:
 *     tags: [Public]
 *     summary: Check availability calendar
 *     description: Check room availability for a date range
 *     security: []
 *     parameters:
 *       - name: hotelCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - name: roomTypeId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by specific room type
 *     responses:
 *       200:
 *         description: Availability calendar
 */
router.get(
  '/hotels/:hotelCode/availability',
  publicSearchLimiter,
  validateQuery({
    startDate: { type: 'string', required: true },
    endDate: { type: 'string', required: true },
    roomTypeId: { type: 'string' },
    marketId: { type: 'string' }
  }),
  publicService.checkAvailability
)

// ==================== PRICING ====================

/**
 * @swagger
 * /api/public/hotels/{hotelCode}/price-quote:
 *   post:
 *     tags: [Public]
 *     summary: Get detailed price quote
 *     description: Get a detailed price breakdown including applicable campaigns and discounts
 *     security: []
 *     parameters:
 *       - name: hotelCode
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
 *             required: [checkIn, checkOut, roomTypeCode, mealPlanCode]
 *             properties:
 *               checkIn:
 *                 type: string
 *                 format: date
 *               checkOut:
 *                 type: string
 *                 format: date
 *               roomTypeCode:
 *                 type: string
 *                 example: "STD"
 *               mealPlanCode:
 *                 type: string
 *                 example: "AI"
 *               adults:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 2
 *               children:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Price quote
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PriceQuote'
 */
router.post(
  '/hotels/:hotelCode/price-quote',
  pricingLimiter,
  validateBody({
    checkIn: { type: 'date', required: true },
    checkOut: { type: 'date', required: true },
    roomTypeCode: { type: 'string', required: true },
    mealPlanCode: { type: 'string', required: true },
    adults: { type: 'integer', min: 1, max: 10 },
    children: { type: 'array' }
  }),
  publicService.getPriceQuote
)

/**
 * @swagger
 * /api/public/hotels/{hotelCode}/campaigns:
 *   get:
 *     tags: [Public]
 *     summary: Get active campaigns
 *     description: Get currently active promotional campaigns for a hotel
 *     security: []
 *     parameters:
 *       - name: hotelCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active campaigns
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
 *                       name:
 *                         type: string
 *                       discountType:
 *                         type: string
 *                         enum: [percentage, fixed, night_free]
 *                       discountValue:
 *                         type: number
 *                       validFrom:
 *                         type: string
 *                         format: date
 *                       validTo:
 *                         type: string
 *                         format: date
 */
router.get('/hotels/:hotelCode/campaigns', publicService.getActiveCampaigns)

// ==================== BOOKING ====================

/**
 * @swagger
 * /api/public/bookings:
 *   post:
 *     tags: [Public]
 *     summary: Create a booking
 *     description: Create a new reservation. Rate limited to prevent abuse.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hotelCode, checkIn, checkOut, rooms, contact]
 *             properties:
 *               hotelCode:
 *                 type: string
 *                 example: "GRD001"
 *               checkIn:
 *                 type: string
 *                 format: date
 *               checkOut:
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
 *                       type: array
 *                       items:
 *                         type: integer
 *                     guests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [adult, child]
 *               contact:
 *                 type: object
 *                 required: [firstName, lastName, email, phone]
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *               specialRequests:
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
 *                   type: object
 *                   properties:
 *                     bookingNumber:
 *                       type: string
 *                       example: "BK-20240615-001"
 *                     status:
 *                       type: string
 *                     totalPrice:
 *                       type: number
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  '/bookings',
  publicBookingLimiter,
  validateBody({
    hotelCode: { type: 'string', required: true },
    checkIn: { type: 'date', required: true },
    checkOut: { type: 'date', required: true },
    rooms: { type: 'array', required: true },
    contact: { type: 'object', required: true }
  }),
  publicService.createBooking
)

/**
 * @swagger
 * /api/public/bookings/{bookingNumber}:
 *   get:
 *     tags: [Public]
 *     summary: Get booking details
 *     description: Retrieve booking details using booking number and email verification
 *     security: []
 *     parameters:
 *       - name: bookingNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: BK-20240615-001
 *       - name: email
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Contact email for verification
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
router.get(
  '/bookings/:bookingNumber',
  validateQuery({
    email: { type: 'string', required: true }
  }),
  publicService.getBooking
)

/**
 * @swagger
 * /api/public/bookings/{bookingNumber}/cancel:
 *   post:
 *     tags: [Public]
 *     summary: Cancel booking
 *     description: Request cancellation for a booking
 *     security: []
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
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email for verification
 *               reason:
 *                 type: string
 *                 description: Cancellation reason
 *     responses:
 *       200:
 *         description: Cancellation processed
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
 *                     status:
 *                       type: string
 *                     cancellationFee:
 *                       type: number
 *                     refundAmount:
 *                       type: number
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/bookings/:bookingNumber/cancel',
  publicBookingLimiter,
  validateBody({
    email: { type: 'string', required: true },
    reason: { type: 'string' }
  }),
  publicService.cancelBooking
)

// ==================== PAYMENT ====================

/**
 * @swagger
 * /api/public/payment/bin:
 *   post:
 *     tags: [Public]
 *     summary: Query card BIN for installment options
 *     description: Get installment options based on card BIN number (first 6-8 digits)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hotelCode, bin, amount]
 *             properties:
 *               hotelCode:
 *                 type: string
 *                 description: Hotel slug or ID
 *               bin:
 *                 type: string
 *                 description: First 6-8 digits of card number
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               currency:
 *                 type: string
 *                 default: TRY
 *     responses:
 *       200:
 *         description: BIN query result with installment options
 */
router.post(
  '/payment/bin',
  pricingLimiter,
  validateBody({
    hotelCode: { type: 'string', required: true },
    bin: { type: 'string', required: true },
    amount: { type: 'number', required: true },
    currency: { type: 'string' }
  }),
  publicService.queryBinPublic
)

/**
 * @swagger
 * /api/public/bookings/{bookingNumber}/pay:
 *   post:
 *     tags: [Public]
 *     summary: Initiate credit card payment for booking
 *     description: Start a credit card payment process. Returns 3D Secure redirect URL.
 *     security: []
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
 *             required: [email, card]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email for verification
 *               posId:
 *                 type: string
 *                 description: Optional POS ID (auto-selected if not provided)
 *               installment:
 *                 type: integer
 *                 default: 1
 *                 description: Number of installments
 *               card:
 *                 type: object
 *                 required: [holder, number, expiry, cvv]
 *                 properties:
 *                   holder:
 *                     type: string
 *                   number:
 *                     type: string
 *                   expiry:
 *                     type: string
 *                     description: MM/YY format
 *                   cvv:
 *                     type: string
 *     responses:
 *       200:
 *         description: Payment initiated
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
 *                     paymentId:
 *                       type: string
 *                     transactionId:
 *                       type: string
 *                     requires3D:
 *                       type: boolean
 *                     formUrl:
 *                       type: string
 *                       description: URL to redirect for 3D Secure
 *                     status:
 *                       type: string
 */
router.post(
  '/bookings/:bookingNumber/pay',
  publicBookingLimiter,
  validateBody({
    email: { type: 'string', required: true },
    posId: { type: 'string' },
    installment: { type: 'integer' },
    card: { type: 'object', required: true }
  }),
  publicService.initiateBookingPayment
)

/**
 * @swagger
 * /api/public/bookings/{bookingNumber}/payment-status:
 *   get:
 *     tags: [Public]
 *     summary: Get payment status for booking
 *     description: Check payment status for a booking. Can check specific payment or overall status.
 *     security: []
 *     parameters:
 *       - name: bookingNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: email
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *       - name: paymentId
 *         in: query
 *         schema:
 *           type: string
 *         description: Optional specific payment ID to check
 *     responses:
 *       200:
 *         description: Payment status
 */
router.get(
  '/bookings/:bookingNumber/payment-status',
  validateQuery({
    email: { type: 'string', required: true },
    paymentId: { type: 'string' }
  }),
  publicService.getPaymentStatus
)

/**
 * @swagger
 * /api/public/hotels/{hotelCode}/payment-methods:
 *   get:
 *     tags: [Public]
 *     summary: Get available payment methods for hotel
 *     description: Returns enabled payment methods and installment options
 *     security: []
 *     parameters:
 *       - name: hotelCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment methods configuration
 */
router.get('/hotels/:hotelCode/payment-methods', publicService.getPaymentMethods)

/**
 * @swagger
 * /api/public/payment/callback:
 *   get:
 *     tags: [Public]
 *     summary: 3D Secure callback
 *     description: Callback endpoint for 3D Secure verification. Redirects to appropriate page.
 *     security: []
 *     parameters:
 *       - name: transactionId
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: paymentId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to result page
 */
router.get('/payment/callback', publicService.payment3DCallback)
router.post('/payment/callback', publicService.payment3DCallback)

export default router
