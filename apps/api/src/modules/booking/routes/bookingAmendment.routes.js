/**
 * Booking Amendment Routes
 * Handle booking modifications and amendment history
 */

import express from 'express'
import * as bookingService from '../booking.service.js'

const router = express.Router()

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

export default router
