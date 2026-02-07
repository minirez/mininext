/**
 * Booking CRUD Routes
 * List, create, get, update, delete bookings
 */

import express from 'express'
import * as bookingService from '../booking.service.js'

const router = express.Router()

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
 * /api/booking/with-payment-link:
 *   post:
 *     tags: [Bookings]
 *     summary: Create booking with payment link
 *     description: Create a booking and generate a payment link for credit card payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hotelId, checkIn, checkOut, rooms, contact]
 *             properties:
 *               hotelId:
 *                 type: string
 *               marketId:
 *                 type: string
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
 *               contact:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *               sendEmail:
 *                 type: boolean
 *                 default: true
 *               sendSms:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Booking created with payment link
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
 *                     paymentLink:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         linkNumber:
 *                           type: string
 *                         token:
 *                           type: string
 *                         paymentUrl:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         currency:
 *                           type: string
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/with-payment-link', bookingService.createBookingWithPaymentLink)

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

/**
 * @swagger
 * /api/booking/{id}/guest-info:
 *   patch:
 *     tags: [Bookings]
 *     summary: Update guest info (inline edit)
 *     description: Update lead guest, contact, or room guest information
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadGuest:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *               contact:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *               guestLanguage:
 *                 type: string
 *                 enum: [tr, en, ru, de, fr]
 *     responses:
 *       200:
 *         description: Guest info updated
 */
router.patch('/:id/guest-info', bookingService.updateGuestInfo)

export default router
