/**
 * Public Hotel Routes
 * Hotel information, search, room types, meal plans, widget config
 */

import express from 'express'
import * as publicService from '../public.service.js'
import { publicSearchLimiter } from '#middleware/rateLimiter.js'
import { validateQuery, validateBody } from '#middleware/validation.js'

const router = express.Router()

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

export default router
