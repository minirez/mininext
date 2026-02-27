/**
 * Payment Webhook Routes
 * Receives callbacks from Payment Service (external gateways)
 *
 * NOTE: The main webhook handler is in payment.service.js (paymentWebhook function).
 * This file is kept for backward compatibility and specific gateway integrations.
 *
 * Notification functions are centralized in payment-notifications.service.js
 */

import express from 'express'
import { asyncHandler } from '#helpers'
import Payment from './payment.model.js'
import Booking from './booking.model.js'
import logger from '#core/logger.js'
// Import shared functions to avoid duplication
import { updateBookingPayment } from './payment.service.js'
import { sendPaymentNotification } from './payment-notifications.service.js'

const router = express.Router()

// Re-export for backward compatibility (if any code imports from here)
export { sendPaymentNotification }

/**
 * POST /api/payments/webhook
 * Webhook endpoint for payment service callbacks
 *
 * Expected payload:
 * {
 *   event: 'payment.completed' | 'payment.failed' | 'payment.refunded',
 *   transactionId: string,
 *   externalId: string (our Payment _id),
 *   status: string,
 *   data: { ... }
 * }
 */
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const { event, transactionId, externalId, status, data } = req.body

    logger.info('[PaymentWebhook] Received event:', {
      event,
      transactionId,
      externalId,
      status
    })

    // ============================================================================
    // SECURITY: Validate API key
    // ============================================================================
    const apiKey = req.headers['x-api-key']
    const validApiKey = process.env.PAYMENT_WEBHOOK_KEY

    if (apiKey !== validApiKey) {
      logger.error('[PaymentWebhook] Invalid API key')
      return res.status(401).json({ success: false, error: 'Invalid API key' })
    }

    // Find payment by external ID (our payment _id) or transaction ID
    let paymentId = null

    if (externalId) {
      paymentId = externalId
    } else if (transactionId) {
      const paymentByTx = await Payment.findByGatewayTransaction(transactionId)
      paymentId = paymentByTx?._id
    }

    if (!paymentId) {
      logger.warn('[PaymentWebhook] Payment not found:', { transactionId, externalId })
      // Return 200 to prevent retries - payment might have been deleted
      return res.json({
        success: false,
        message: 'Payment not found'
      })
    }

    // ============================================================================
    // ATOMIC: Process events with findOneAndUpdate to prevent race conditions
    // ============================================================================
    let payment = null
    let bookingId = null

    switch (event) {
      case 'payment.completed': {
        // ATOMIC: Only update if still pending
        const updateData = {
          status: 'completed',
          completedAt: new Date(),
          'cardDetails.gatewayStatus': 'completed',
          'cardDetails.gatewayResponse': data || {},
          'cardDetails.processedAt': new Date(),
          ...(data?.lastFour && { 'cardDetails.lastFour': data.lastFour }),
          ...(data?.brand && { 'cardDetails.brand': data.brand }),
          ...(data?.installment && { 'cardDetails.installment': data.installment })
        }

        payment = await Payment.findOneAndUpdate(
          { _id: paymentId, status: 'pending' },
          { $set: updateData },
          { new: true }
        )

        if (payment) {
          bookingId = payment.booking
          await updateBookingPayment(bookingId)
          logger.info('[PaymentWebhook] Payment completed atomically:', { paymentId: payment._id })
        } else {
          const existing = await Payment.findById(paymentId)
          if (!existing) {
            return res.json({ success: false, message: 'Payment not found' })
          }
          logger.info('[PaymentWebhook] Payment already processed:', {
            paymentId,
            status: existing.status
          })
          return res.json({ success: true, message: 'Already processed' })
        }
        break
      }

      case 'payment.failed': {
        // ATOMIC: Only update if still pending
        const updateData = {
          status: 'failed',
          'cardDetails.gatewayStatus': 'failed',
          'cardDetails.gatewayResponse': { error: data?.error || 'Payment failed', ...data },
          'cardDetails.processedAt': new Date()
        }

        payment = await Payment.findOneAndUpdate(
          { _id: paymentId, status: 'pending' },
          { $set: updateData },
          { new: true }
        )

        if (payment) {
          bookingId = payment.booking
          logger.info('[PaymentWebhook] Payment failed atomically:', { paymentId: payment._id })
        } else {
          const existing = await Payment.findById(paymentId)
          if (!existing) {
            return res.json({ success: false, message: 'Payment not found' })
          }
          logger.info('[PaymentWebhook] Payment already processed:', {
            paymentId,
            status: existing.status
          })
          return res.json({ success: true, message: 'Already processed' })
        }
        break
      }

      case 'payment.refunded': {
        // ATOMIC: Only update if currently completed
        const updateData = {
          status: 'refunded',
          'cardDetails.gatewayStatus': 'refunded',
          'cardDetails.gatewayResponse': data || {},
          refund: {
            amount: data?.amount,
            reason: data?.reason || 'Refunded via gateway',
            refundedAt: new Date(),
            gatewayRef: data?.refundTransactionId
          }
        }

        // First get the payment to know the amount for full refund
        const existingPayment = await Payment.findById(paymentId)
        if (!existingPayment) {
          return res.json({ success: false, message: 'Payment not found' })
        }

        // If no amount specified, use full payment amount
        if (!updateData.refund.amount) {
          updateData.refund.amount = existingPayment.amount
        }

        payment = await Payment.findOneAndUpdate(
          { _id: paymentId, status: 'completed' },
          { $set: updateData },
          { new: true }
        )

        if (payment) {
          bookingId = payment.booking
          await updateBookingPayment(bookingId)
          logger.info('[PaymentWebhook] Payment refunded atomically:', { paymentId: payment._id })
        } else {
          logger.info('[PaymentWebhook] Payment not in completed state:', {
            paymentId,
            status: existingPayment.status
          })
          return res.json({ success: true, message: 'Payment not in completed state' })
        }
        break
      }

      case 'payment.cancelled': {
        // ATOMIC: Only update if still pending
        const updateData = {
          status: 'cancelled',
          'cardDetails.gatewayStatus': 'cancelled',
          'cardDetails.gatewayResponse': data || {}
        }

        payment = await Payment.findOneAndUpdate(
          { _id: paymentId, status: 'pending' },
          { $set: updateData },
          { new: true }
        )

        if (payment) {
          logger.info('[PaymentWebhook] Payment cancelled atomically:', { paymentId: payment._id })
        } else {
          const existing = await Payment.findById(paymentId)
          logger.info('[PaymentWebhook] Payment not in pending state:', {
            paymentId,
            status: existing?.status
          })
          return res.json({ success: true, message: 'Payment not in pending state' })
        }
        break
      }

      default:
        logger.warn('[PaymentWebhook] Unknown event:', { event })
        return res.json({ success: true, message: 'Unknown event' })
    }

    // ============================================================================
    // Send notification (non-blocking)
    // ============================================================================
    if (
      payment &&
      bookingId &&
      ['payment.completed', 'payment.failed', 'payment.refunded'].includes(event)
    ) {
      try {
        const booking = await Booking.findById(bookingId)
        if (booking) {
          const eventMap = {
            'payment.completed': 'completed',
            'payment.failed': 'failed',
            'payment.refunded': 'refunded'
          }
          await sendPaymentNotification(payment, booking, eventMap[event])
        }
      } catch (notifyError) {
        logger.error('[PaymentWebhook] Failed to send notification:', notifyError.message)
      }
    }

    res.json({
      success: true,
      message: 'Webhook processed'
    })
  })
)

/**
 * GET /api/payments/webhook/test
 * Test endpoint to verify webhook is accessible
 */
router.get('/webhook/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString()
  })
})

export default router
