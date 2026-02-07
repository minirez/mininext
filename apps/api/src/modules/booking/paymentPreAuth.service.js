import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import Payment from './payment.model.js'
import paymentGateway from '#services/paymentGateway.js'
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
// PRE-AUTHORIZATION METHODS
// ============================================================================

/**
 * Pre-authorize card payment (hold amount without capturing)
 */
export const preAuthorizeCard = asyncHandler(async (req, res) => {
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

  // Only pending payments can be pre-authorized
  if (payment.status !== 'pending') {
    throw new BadRequestError('PAYMENT_NOT_PENDING')
  }

  // Prepare customer info
  const customerInfo = customer || {}
  if (payment.booking?.leadGuest) {
    customerInfo.name = customerInfo.name || `${payment.booking.leadGuest.firstName} ${payment.booking.leadGuest.lastName}`
    customerInfo.email = customerInfo.email || payment.booking.leadGuest.email
    customerInfo.phone = customerInfo.phone || payment.booking.leadGuest.phone
  }
  customerInfo.ip = req.ip || req.connection?.remoteAddress

  // Pre-authorize through gateway
  const token = req.headers.authorization?.split(' ')[1]
  const result = await paymentGateway.preAuthorize({
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
    throw new BadRequestError(result.error || 'PRE_AUTH_FAILED')
  }

  // Get BIN info for card details
  const binInfo = await paymentGateway.queryBin(
    card.number.slice(0, 8),
    payment.amount,
    payment.currency.toLowerCase(),
    partnerId?.toString(),
    token
  ).catch(() => null)

  // Update payment with pre-auth info
  await payment.initPreAuth({
    transactionId: result.transactionId,
    posId: result.posId,
    posName: result.posName,
    requires3D: result.requires3D,
    formUrl: result.requires3D ? paymentGateway.getPaymentFormUrl(result.transactionId) : null,
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
      requires3D: result.requires3D,
      formUrl: result.requires3D ? paymentGateway.getPaymentFormUrl(result.transactionId) : null,
      status: 'pre_authorized',
      expiresAt: payment.preAuth.expiresAt
    }
  })
})

/**
 * Capture pre-authorized payment
 */
export const capturePreAuth = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const partnerId = getRequiredPartnerId(req)

  // Find payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    status: 'pre_authorized',
    partner: partnerId // SECURE: Always filter by partner
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  if (!payment.preAuth?.isPreAuth) {
    throw new BadRequestError('PAYMENT_NOT_PRE_AUTHORIZED')
  }

  // Check if pre-auth is expired
  if (payment.isPreAuthExpired()) {
    throw new BadRequestError('PRE_AUTH_EXPIRED')
  }

  // Capture through gateway
  const token = req.headers.authorization?.split(' ')[1]
  const result = await paymentGateway.capturePreAuth(
    payment.cardDetails.gatewayTransactionId,
    token
  )

  if (!result.success) {
    throw new BadRequestError(result.error || 'CAPTURE_FAILED')
  }

  // Update payment status
  await payment.capturePreAuth(result)
  await updateBookingPayment(bookingId)

  res.json({
    success: true,
    data: payment,
    message: 'PAYMENT_CAPTURED'
  })
})

/**
 * Release (void) pre-authorized payment
 */
export const releasePreAuth = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const partnerId = getRequiredPartnerId(req)

  // Find payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    status: 'pre_authorized',
    partner: partnerId // SECURE: Always filter by partner
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  if (!payment.preAuth?.isPreAuth) {
    throw new BadRequestError('PAYMENT_NOT_PRE_AUTHORIZED')
  }

  // Release through gateway (cancel)
  const token = req.headers.authorization?.split(' ')[1]
  const result = await paymentGateway.cancelTransaction(
    payment.cardDetails.gatewayTransactionId,
    token
  )

  if (!result.success) {
    throw new BadRequestError(result.error || 'RELEASE_FAILED')
  }

  // Update payment status
  await payment.releasePreAuth(result)

  res.json({
    success: true,
    data: payment,
    message: 'PRE_AUTH_RELEASED'
  })
})

/**
 * Get pre-authorized payments for a booking
 */
export const getPreAuthorizedPayments = asyncHandler(async (req, res) => {
  const { id: bookingId } = req.params
  const partnerId = getRequiredPartnerId(req)

  const payments = await Payment.find({
    booking: bookingId,
    status: 'pre_authorized',
    'preAuth.isPreAuth': true,
    partner: partnerId // SECURE: Always filter by partner
  }).sort({ createdAt: -1 })

  // Add expiry info
  const paymentsWithExpiry = payments.map(p => ({
    ...p.toObject(),
    isExpired: p.isPreAuthExpired(),
    daysUntilExpiry: p.preAuth?.expiresAt
      ? Math.ceil((new Date(p.preAuth.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
      : null
  }))

  res.json({
    success: true,
    data: paymentsWithExpiry
  })
})
