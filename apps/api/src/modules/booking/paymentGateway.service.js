import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import Payment from './payment.model.js'
import Booking from './booking.model.js'
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
// CREDIT CARD PAYMENT METHODS
// ============================================================================

/**
 * Query card BIN for installment options (Partner-based, no booking required)
 * Used for inline payment flow where booking/payment doesn't exist yet
 */
export const queryBinByPartner = asyncHandler(async (req, res) => {
  const { bin, amount, currency = 'TRY' } = req.body
  // FIXED: Use accountType instead of role for platform admin check
  const partnerId = req.user.accountType === 'platform'
    ? req.body.partnerId || req.query.partnerId || req.partnerId
    : req.user.accountId // Partner user uses their own accountId

  // Validate BIN
  if (!bin || bin.length < 6) {
    throw new BadRequestError('BIN numarası en az 6 karakter olmalı')
  }

  // Validate amount
  if (!amount || amount <= 0) {
    throw new BadRequestError('Geçerli bir tutar belirtilmeli')
  }

  // Query BIN from payment gateway
  const token = req.headers.authorization?.split(' ')[1]
  const result = await paymentGateway.queryBin(
    bin,
    amount,
    currency.toLowerCase(),
    partnerId?.toString(),
    token
  )

  res.json({
    success: true,
    data: result
  })
})

/**
 * Query card BIN for installment options (Booking-based)
 */
export const queryCardBin = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const { bin } = req.body
  const partnerId = getRequiredPartnerId(req)

  // Validate BIN
  if (!bin || bin.length < 6) {
    throw new BadRequestError('INVALID_BIN')
  }

  // Find payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    type: 'credit_card',
    partner: partnerId // SECURE: Always filter by partner
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  // Only pending payments can be processed
  if (payment.status !== 'pending') {
    throw new BadRequestError('PAYMENT_NOT_PENDING')
  }

  // Query BIN from payment gateway
  const token = req.headers.authorization?.split(' ')[1]
  const result = await paymentGateway.queryBin(
    bin,
    payment.amount,
    payment.currency.toLowerCase(),
    partnerId?.toString(),
    token
  )

  res.json({
    success: true,
    data: result
  })
})

/**
 * Process credit card payment
 */
export const processCardPayment = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const { posId, installment, card, customer } = req.body
  const partnerId = getRequiredPartnerId(req)

  // Validate card
  if (!card || !card.holder || !card.number || !card.expiry || !card.cvv) {
    throw new BadRequestError('INVALID_CARD_DETAILS')
  }

  // Find payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    type: 'credit_card',
    partner: partnerId // SECURE: Always filter by partner
  }).populate('booking', 'bookingNumber confirmationNumber leadGuest')

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  // Only pending payments can be processed
  if (payment.status !== 'pending') {
    throw new BadRequestError('PAYMENT_ALREADY_PROCESSED')
  }

  // Already has a transaction ID - check status instead
  if (payment.cardDetails?.gatewayTransactionId) {
    throw new BadRequestError('PAYMENT_ALREADY_INITIATED')
  }

  // Prepare customer info
  const customerInfo = customer || {}
  if (payment.booking?.leadGuest) {
    customerInfo.name = customerInfo.name || `${payment.booking.leadGuest.firstName} ${payment.booking.leadGuest.lastName}`
    customerInfo.email = customerInfo.email || payment.booking.leadGuest.email
    customerInfo.phone = customerInfo.phone || payment.booking.leadGuest.phone
  }
  customerInfo.ip = req.ip || req.connection?.remoteAddress

  // Process payment through gateway
  const token = req.headers.authorization?.split(' ')[1]
  const result = await paymentGateway.processPayment({
    posId,
    amount: payment.amount,
    currency: payment.currency.toLowerCase(),
    installment: installment || 1,
    card: {
      holder: card.holder,
      number: card.number.replace(/\s/g, ''),
      expiry: card.expiry,
      cvv: card.cvv
    },
    customer: customerInfo,
    externalId: payment._id.toString(),
    partnerId: partnerId?.toString()
  }, token)

  if (!result.success) {
    throw new BadRequestError(result.error || 'PAYMENT_FAILED')
  }

  // In Turkey, 3D Secure is mandatory for all card transactions
  // If payment service doesn't return requires3D, assume true
  const requires3D = result.requires3D !== false // Default to true if undefined

  // Determine payment form URL based on request host
  // Development: payment.mini.com (dedicated payment domain)
  // Production: payment.maxirez.com (dedicated payment domain)
  const getFormUrl = (transactionId) => {
    if (!requires3D) return null
    const host = req.get('host') || ''
    // Always use HTTPS for payment forms (avoid mixed content)
    if (host.includes('mini.com')) {
      return `https://payment.mini.com/payment/${transactionId}/form`
    }
    // Default to maxirez.com for production
    return `https://payment.maxirez.com/payment/${transactionId}/form`
  }

  const formUrl = getFormUrl(result.transactionId)

  // Get BIN info for card details
  const binInfo = await paymentGateway.queryBin(
    card.number.slice(0, 8),
    payment.amount,
    payment.currency.toLowerCase(),
    partnerId?.toString(),
    token
  ).catch(() => null)

  // Update payment with transaction info
  await payment.initCardPayment({
    transactionId: result.transactionId,
    posId: result.posId,
    posName: result.posName,
    requires3D: requires3D,
    formUrl: formUrl,
    lastFour: card.number.slice(-4),
    brand: binInfo?.card?.brand || null,
    cardFamily: binInfo?.card?.cardFamily || null,
    bankName: binInfo?.card?.bankName || null,
    installment: installment || 1
  })

  res.json({
    success: true,
    data: {
      transactionId: result.transactionId,
      requires3D: requires3D,
      formUrl: formUrl,
      status: requires3D ? 'requires_3d' : 'processing'
    }
  })
})

/**
 * Get card payment status
 */
export const getCardPaymentStatus = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const partnerId = getRequiredPartnerId(req)

  // Find payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    type: 'credit_card',
    partner: partnerId // SECURE: Always filter by partner
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  // If no transaction ID, return local status
  if (!payment.cardDetails?.gatewayTransactionId) {
    return res.json({
      success: true,
      data: {
        status: payment.status,
        gatewayStatus: payment.cardDetails?.gatewayStatus || 'pending'
      }
    })
  }

  // Query gateway for latest status
  const token = req.headers.authorization?.split(' ')[1]
  try {
    const gatewayResult = await paymentGateway.getTransactionStatus(
      payment.cardDetails.gatewayTransactionId,
      token
    )

    // Update local status if changed
    if (gatewayResult.transaction) {
      const txStatus = gatewayResult.transaction.status

      if (txStatus === 'completed' && payment.status !== 'completed') {
        await payment.completeCardPayment(gatewayResult.transaction)
        await updateBookingPayment(bookingId)
      } else if (txStatus === 'failed' && payment.status !== 'failed') {
        await payment.failCardPayment(
          gatewayResult.transaction.error || 'Payment failed',
          gatewayResult.transaction
        )
      }
    }

    res.json({
      success: true,
      data: {
        status: payment.status,
        gatewayStatus: gatewayResult.transaction?.status || payment.cardDetails.gatewayStatus,
        cardDetails: {
          lastFour: payment.cardDetails.lastFour,
          brand: payment.cardDetails.brand,
          installment: payment.cardDetails.installment
        }
      }
    })
  } catch (error) {
    // Return local status on gateway error
    res.json({
      success: true,
      data: {
        status: payment.status,
        gatewayStatus: payment.cardDetails.gatewayStatus,
        gatewayError: error.message
      }
    })
  }
})
