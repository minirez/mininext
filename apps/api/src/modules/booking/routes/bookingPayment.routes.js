/**
 * Booking Payment Helper Routes
 * Payment webhook (PUBLIC - no auth required)
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

export default router
