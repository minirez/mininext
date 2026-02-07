import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import Payment from './payment.model.js'
import paymentGateway from '#services/paymentGateway.js'
import logger from '#core/logger.js'
import { updateBookingPayment } from './payment.service.js'

/**
 * SECURITY: Get partner ID with strict validation
 * For booking/payment operations, partner is ALWAYS required
 * Platform admins must select a partner before accessing booking data
 */
function getRequiredPartnerId(req, source = 'query') {
  // Partner users: always use their own partner
  if (req.user?.accountType === 'partner') {
    return req.user.accountId
  }

  // Platform admin: check multiple sources
  const partnerId = req.partnerId || req.body?.partnerId || req.query?.partnerId

  if (!partnerId) {
    throw new BadRequestError('PARTNER_SELECTION_REQUIRED')
  }

  return partnerId
}

// ============================================================================
// REFUND OPERATIONS
// ============================================================================

/**
 * Refund payment
 */
export const refundPayment = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const { amount, reason } = req.body
  const partnerId = getRequiredPartnerId(req)

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    partner: partnerId // SECURE: Always filter by partner
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  if (!amount || amount <= 0) {
    throw new BadRequestError('INVALID_REFUND_AMOUNT')
  }

  // SECURITY: Validate refund amount doesn't exceed payment amount
  if (amount > payment.amount) {
    throw new BadRequestError('REFUND_EXCEEDS_PAYMENT_AMOUNT')
  }

  // Check for partial refunds - if already refunded, check remaining amount
  if (payment.refund?.amount) {
    const totalRefunded = payment.refund.amount + amount
    if (totalRefunded > payment.amount) {
      throw new BadRequestError('TOTAL_REFUND_EXCEEDS_PAYMENT_AMOUNT')
    }
  }

  // Payment must be completed to refund
  if (payment.status !== 'completed') {
    throw new BadRequestError('PAYMENT_NOT_COMPLETED')
  }

  if (!reason) {
    throw new BadRequestError('REFUND_REASON_REQUIRED')
  }

  // For credit card payments, process refund through gateway
  if (payment.type === 'credit_card' && payment.cardDetails?.gatewayTransactionId) {
    const token = req.headers.authorization?.split(' ')[1]

    try {
      const refundResult = await paymentGateway.refundTransaction(
        payment.cardDetails.gatewayTransactionId,
        token
      )

      if (!refundResult.success) {
        throw new BadRequestError(refundResult.error || 'GATEWAY_REFUND_FAILED')
      }

      // Store gateway refund reference
      await payment.processRefund(amount, reason, req.user._id, refundResult.refundId)
    } catch (error) {
      // If it's a same-day transaction, try cancel instead
      if (error.message?.includes('REFUND_NOT_ALLOWED') || error.message?.includes('same_day')) {
        try {
          const cancelResult = await paymentGateway.cancelTransaction(
            payment.cardDetails.gatewayTransactionId,
            token
          )

          if (!cancelResult.success) {
            throw new BadRequestError(cancelResult.error || 'GATEWAY_CANCEL_FAILED')
          }

          await payment.processRefund(amount, reason, req.user._id, cancelResult.cancelId)
        } catch (cancelError) {
          throw new BadRequestError(`İade işlemi başarısız: ${cancelError.message}`)
        }
      } else {
        throw new BadRequestError(`İade işlemi başarısız: ${error.message}`)
      }
    }
  } else {
    // Non-card payments: just update local status
    await payment.processRefund(amount, reason, req.user._id)
  }

  await updateBookingPayment(bookingId)

  res.json({
    success: true,
    data: payment,
    message: 'PAYMENT_REFUNDED'
  })
})
