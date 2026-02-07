/**
 * Booking Status Routes
 * Status updates, cancellation, and state management
 */

import express from 'express'
import * as bookingService from '../booking.service.js'

const router = express.Router()

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

export default router
