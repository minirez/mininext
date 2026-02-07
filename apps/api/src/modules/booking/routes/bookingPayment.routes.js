/**
 * Booking Payment Helper Routes
 * Payment webhook and BIN query
 */

import express from 'express'
import * as paymentService from '../payment.service.js'

const router = express.Router()

/**
 * @swagger
 * /api/bookings/payment-webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Payment webhook from payment service
 *     description: Webhook endpoint called by payment-service when 3D Secure completes
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *               externalId:
 *                 type: string
 *               success:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/payment-webhook', paymentService.paymentWebhook)

/**
 * @swagger
 * /api/bookings/query-bin:
 *   post:
 *     tags: [Bookings]
 *     summary: Query card BIN for installment options
 *     description: Query card BIN without requiring a booking/payment record.
 *       Used for inline payment flow where form is shown before booking is created.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bin, amount]
 *             properties:
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
 *         description: BIN info and installment options
 */
router.post('/query-bin', paymentService.queryBinByPartner)

export default router
