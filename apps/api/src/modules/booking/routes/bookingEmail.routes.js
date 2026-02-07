/**
 * Booking Email Routes
 * Email preview and sending
 */

import express from 'express'
import * as bookingService from '../booking.service.js'

const router = express.Router()

/**
 * @swagger
 * /api/booking/{id}/email-preview/{type}:
 *   get:
 *     tags: [Bookings]
 *     summary: Preview booking email
 *     description: Get email HTML preview for a booking
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: type
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [confirmation, payment_reminder, hotel_notification, checkin_reminder]
 *       - name: language
 *         in: query
 *         schema:
 *           type: string
 *           enum: [tr, en]
 *           default: tr
 *     responses:
 *       200:
 *         description: Email preview HTML
 */
router.get('/:id/email-preview/:type', bookingService.previewBookingEmail)

/**
 * @swagger
 * /api/booking/{id}/send-email:
 *   post:
 *     tags: [Bookings]
 *     summary: Send booking email
 *     description: Send email to guest or hotel
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [confirmation, payment_reminder, hotel_notification, checkin_reminder]
 *               recipient:
 *                 type: string
 *                 enum: [guest, hotel]
 *               customEmail:
 *                 type: string
 *                 format: email
 *               language:
 *                 type: string
 *                 enum: [tr, en]
 *               sendCopy:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Email sent successfully
 */
router.post('/:id/send-email', bookingService.sendBookingEmail)

export default router
