import { asyncHandler, withTransaction } from '#helpers'
import Payment from './payment.model.js'
import Booking from './booking.model.js'
import logger from '#core/logger.js'
import { updateBookingPayment } from './payment.service.js'

// ============================================================================
// WEBHOOK FROM PAYMENT SERVICE
// ============================================================================

/**
 * Webhook endpoint for payment service callbacks
 * Called by payment-service when 3D Secure completes
 * No JWT auth - uses API key
 */
export const paymentWebhook = asyncHandler(async (req, res) => {
  const {
    transactionId,
    externalId,
    success,
    authCode,
    refNumber,
    provisionNumber,
    maskedCard,
    lastFour,
    brand,
    cardType,
    cardFamily,
    cardBank,
    installment,
    amount,
    error,
    commission // Commission data from payment gateway
  } = req.body

  logger.info('[Payment Webhook] Received:', { transactionId, externalId, success })

  // Validate API key (simple validation for internal service)
  const apiKey = req.headers['x-api-key']
  const validApiKey = process.env.PAYMENT_WEBHOOK_KEY || 'payment-webhook-secret'

  if (apiKey !== validApiKey) {
    logger.error('[Payment Webhook] Invalid API key')
    return res.status(401).json({ success: false, error: 'Invalid API key' })
  }

  // externalId is the Payment record ID for booking payments
  if (!externalId) {
    logger.error('[Payment Webhook] Missing externalId')
    return res.status(400).json({ success: false, error: 'Missing externalId' })
  }

  // Skip payment link webhooks (handled separately)
  if (externalId.startsWith('PL-')) {
    logger.info('[Payment Webhook] Payment link webhook, skipping (handled by pay routes)')
    return res.json({ success: true, message: 'Payment link handled separately' })
  }

  // Build update data for payment
  const updateData = success
    ? {
        status: 'completed',
        completedAt: new Date(),
        'cardDetails.gatewayStatus': 'completed',
        'cardDetails.gatewayResponse': {
          authCode,
          refNumber,
          provisionNumber,
          maskedCard,
          lastFour: lastFour || maskedCard?.slice(-4),
          brand,
          cardType,
          cardFamily,
          cardBank,
          installment,
          amount
        },
        'cardDetails.processedAt': new Date(),
        'cardDetails.lastFour': lastFour || maskedCard?.slice(-4),
        'cardDetails.brand': brand,
        'cardDetails.cardFamily': cardFamily,
        'cardDetails.bankName': cardBank,
        'cardDetails.installment': installment || 1,
        // Commission data from payment gateway
        ...(commission && {
          commission: {
            bankRate: commission.bankRate,
            bankAmount: commission.bankAmount,
            platformRate: commission.platformRate,
            platformAmount: commission.platformAmount,
            totalRate: commission.totalRate,
            totalAmount: commission.totalAmount,
            netAmount: commission.netAmount
          }
        })
      }
    : {
        status: 'failed',
        'cardDetails.gatewayStatus': 'failed',
        'cardDetails.gatewayResponse': { error: error || 'Payment failed', transactionId },
        'cardDetails.processedAt': new Date()
      }

  // Wrap payment update + booking sync in transaction for consistency
  const { payment, alreadyProcessed } = await withTransaction(async (session) => {
    const opts = session ? { session } : {}

    // ATOMIC: Find and lock payment in single operation to prevent race conditions
    // Only process if status is 'pending' - this prevents double-processing
    const _payment = await Payment.findOneAndUpdate(
      {
        _id: externalId,
        status: 'pending' // Only update if still pending - ATOMIC GUARD
      },
      { $set: updateData },
      { new: true, ...opts }
    )

    if (!_payment) {
      return { payment: null, alreadyProcessed: true }
    }

    // Update booking payment summary within same transaction
    if (success) {
      await updateBookingPayment(_payment.booking, opts)
    }

    return { payment: _payment, alreadyProcessed: false }
  })

  // Handle already-processed or not-found cases
  if (alreadyProcessed) {
    const existingPayment = await Payment.findById(externalId)
    if (!existingPayment) {
      logger.error('[Payment Webhook] Payment not found:', externalId)
      return res.status(404).json({ success: false, error: 'Payment not found' })
    }
    logger.info('[Payment Webhook] Payment already processed, status:', existingPayment.status)
    return res.json({ success: true, message: 'Already processed' })
  }

  logger.info('[Payment Webhook] Payment updated:', { paymentId: payment._id, status: payment.status })

  // Fetch booking for notifications
  const booking = await Booking.findById(payment.booking)

  if (success) {
    logger.info('[Payment Webhook] Payment completed successfully')
  } else {
    logger.info('[Payment Webhook] Payment marked as failed')
  }

  // Send notification (non-blocking)
  if (booking) {
    try {
      const { sendPaymentNotification } = await import('./payment-notifications.service.js')
      await sendPaymentNotification(payment, booking, success ? 'completed' : 'failed')
    } catch (notifyError) {
      logger.error('[Payment Webhook] Failed to send notification:', notifyError.message)
    }
  }

  res.json({
    success: true,
    message: success ? 'Payment completed' : 'Payment failed',
    paymentId: payment._id,
    paymentStatus: payment.status
  })
})
