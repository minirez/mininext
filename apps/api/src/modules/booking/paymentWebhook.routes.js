/**
 * Payment Webhook Routes
 * Receives callbacks from Payment Service
 */

import express from 'express'
import { asyncHandler } from '#helpers'
// Error handling provided by asyncHandler
import Payment from './payment.model.js'
import Booking from './booking.model.js'
import logger from '#core/logger.js'
import notificationService from '#services/notificationService.js'

const router = express.Router()

/**
 * Send payment notification to customer
 */
async function sendPaymentNotification(payment, booking, eventType) {
  if (!booking?.leadGuest?.email) {
    logger.warn('[PaymentWebhook] No email for notification:', { bookingId: booking?._id })
    return
  }

  try {
    const notificationTypes = {
      completed: 'payment_completed',
      failed: 'payment_failed',
      refunded: 'payment_refunded'
    }

    const notificationType = notificationTypes[eventType]
    if (!notificationType) return

    // Format amount
    const currencySymbol = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }[payment.currency] || payment.currency
    const formattedAmount = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(payment.amount)

    await notificationService.send({
      type: notificationType,
      recipient: {
        email: booking.leadGuest.email,
        name: `${booking.leadGuest.firstName} ${booking.leadGuest.lastName}`,
        phone: booking.leadGuest.phone
      },
      data: {
        subject: eventType === 'completed' ? 'Ödemeniz Alındı' :
                 eventType === 'failed' ? 'Ödeme Başarısız' :
                 'İade İşleminiz Tamamlandı',
        CUSTOMER_NAME: `${booking.leadGuest.firstName} ${booking.leadGuest.lastName}`,
        BOOKING_NUMBER: booking.bookingNumber,
        AMOUNT: `${currencySymbol}${formattedAmount}`,
        CURRENCY: payment.currency,
        PAYMENT_TYPE: payment.type,
        PAYMENT_DATE: new Date().toLocaleDateString('tr-TR'),
        HOTEL_NAME: booking.hotelName,
        CHECK_IN: new Date(booking.checkIn).toLocaleDateString('tr-TR'),
        CHECK_OUT: new Date(booking.checkOut).toLocaleDateString('tr-TR'),
        // Refund specific
        REFUND_AMOUNT: payment.refund?.amount ? `${currencySymbol}${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(payment.refund.amount)}` : null,
        REFUND_REASON: payment.refund?.reason
      },
      channels: ['email'],
      partnerId: booking.partner,
      relatedTo: { model: 'Payment', id: payment._id }
    })

    logger.info('[PaymentWebhook] Notification sent:', {
      type: notificationType,
      paymentId: payment._id,
      email: booking.leadGuest.email
    })
  } catch (error) {
    logger.error('[PaymentWebhook] Failed to send notification:', error.message)
  }
}

/**
 * Update booking payment status and amounts
 */
async function updateBookingPayment(bookingId) {
  const payments = await Payment.find({ booking: bookingId })

  const paidAmount = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const booking = await Booking.findById(bookingId)
  if (!booking) return

  const grandTotal = booking.pricing?.grandTotal || 0

  let status = 'pending'
  if (paidAmount >= grandTotal) {
    status = 'paid'
  } else if (paidAmount > 0) {
    status = 'partial'
  }

  const hasRefund = payments.some(p => p.status === 'refunded')
  if (hasRefund && paidAmount === 0) {
    status = 'refunded'
  }

  booking.payment.paidAmount = paidAmount
  booking.payment.status = status
  booking.payment.payments = payments.map(p => p._id)

  await booking.save()
}

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
router.post('/webhook', asyncHandler(async (req, res) => {
  const { event, transactionId, externalId, status, data } = req.body

  logger.info('[PaymentWebhook] Received event:', {
    event,
    transactionId,
    externalId,
    status
  })

  // Find payment by external ID (our payment _id) or transaction ID
  let payment = null

  if (externalId) {
    payment = await Payment.findById(externalId)
  }

  if (!payment && transactionId) {
    payment = await Payment.findByGatewayTransaction(transactionId)
  }

  if (!payment) {
    logger.warn('[PaymentWebhook] Payment not found:', { transactionId, externalId })
    // Return 200 to prevent retries - payment might have been deleted
    return res.json({
      success: false,
      message: 'Payment not found'
    })
  }

  // Fetch booking for notifications
  const booking = await Booking.findById(payment.booking)

  // Process event
  switch (event) {
    case 'payment.completed':
      if (payment.status !== 'completed') {
        await payment.completeCardPayment(data || {})
        await updateBookingPayment(payment.booking)
        logger.info('[PaymentWebhook] Payment completed:', { paymentId: payment._id })

        // Send notification
        if (booking) {
          await sendPaymentNotification(payment, booking, 'completed')
        }
      }
      break

    case 'payment.failed':
      if (!['failed', 'completed'].includes(payment.status)) {
        await payment.failCardPayment(data?.error || 'Payment failed', data || {})
        logger.info('[PaymentWebhook] Payment failed:', { paymentId: payment._id })

        // Send notification
        if (booking) {
          await sendPaymentNotification(payment, booking, 'failed')
        }
      }
      break

    case 'payment.refunded':
      if (payment.status === 'completed') {
        payment.status = 'refunded'
        payment.cardDetails.gatewayStatus = 'refunded'
        payment.cardDetails.gatewayResponse = data
        payment.refund = {
          amount: data?.amount || payment.amount,
          reason: data?.reason || 'Refunded via gateway',
          refundedAt: new Date(),
          gatewayRef: data?.refundTransactionId
        }
        await payment.save()
        await updateBookingPayment(payment.booking)
        logger.info('[PaymentWebhook] Payment refunded:', { paymentId: payment._id })

        // Send notification
        if (booking) {
          await sendPaymentNotification(payment, booking, 'refunded')
        }
      }
      break

    case 'payment.cancelled':
      if (payment.status === 'pending') {
        payment.status = 'cancelled'
        payment.cardDetails.gatewayStatus = 'cancelled'
        payment.cardDetails.gatewayResponse = data
        await payment.save()
        logger.info('[PaymentWebhook] Payment cancelled:', { paymentId: payment._id })
      }
      break

    default:
      logger.warn('[PaymentWebhook] Unknown event:', { event })
  }

  res.json({
    success: true,
    message: 'Webhook processed'
  })
}))

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
