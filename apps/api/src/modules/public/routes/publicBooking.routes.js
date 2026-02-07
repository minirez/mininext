/**
 * Public Booking Routes
 * Booking creation, lookup, and cancellation
 */

import express from 'express'
import * as publicService from '../public.service.js'
import { publicBookingLimiter } from '#middleware/rateLimiter.js'
import { validateBody, validateQuery } from '#middleware/validation.js'

const router = express.Router()

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

export default router
