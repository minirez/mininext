/**
 * Draft Booking Routes
 * Draft bookings CRUD and completion
 */

import express from 'express'
import * as bookingService from '../booking.service.js'

const router = express.Router()

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

export default router
