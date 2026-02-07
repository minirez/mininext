/**
 * Booking Search & Pricing Routes
 * Search, availability, price quotes, and helper endpoints
 */

import express from 'express'
import * as bookingService from '../booking.service.js'

const router = express.Router()

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

export default router
