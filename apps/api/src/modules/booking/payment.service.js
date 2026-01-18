import path from 'path'
import fs from 'fs'
import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import Payment from './payment.model.js'
import Booking from './booking.model.js'
import paymentGateway from '#services/paymentGateway.js'

/**
 * Get all payments for a booking
 */
export const getPayments = asyncHandler(async (req, res) => {
  const { id: bookingId } = req.params
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  // Verify booking exists and belongs to partner
  const booking = await Booking.findOne({
    _id: bookingId,
    ...(partnerId && { partner: partnerId })
  }).select('bookingNumber pricing.grandTotal pricing.currency payment')

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  const payments = await Payment.findByBooking(bookingId)

  // Calculate totals
  const paidAmount = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  res.json({
    success: true,
    data: {
      payments,
      summary: {
        grandTotal: booking.pricing?.grandTotal || 0,
        paidAmount,
        pendingAmount,
        remainingAmount: (booking.pricing?.grandTotal || 0) - paidAmount,
        currency: booking.pricing?.currency || 'TRY'
      }
    }
  })
})

/**
 * Add new payment
 */
export const addPayment = asyncHandler(async (req, res) => {
  const { id: bookingId } = req.params
  const partnerId =
    req.user.role === 'platform_admin'
      ? req.body.partnerId || req.query.partnerId
      : req.user.partner

  // Verify booking exists
  const booking = await Booking.findOne({
    _id: bookingId,
    ...(partnerId && { partner: partnerId })
  })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  const { type, amount, currency, notes, bankTransfer, cardDetails } = req.body

  // Validate amount
  if (!amount || amount <= 0) {
    throw new BadRequestError('INVALID_AMOUNT')
  }

  // Create payment
  const payment = new Payment({
    partner: booking.partner,
    booking: bookingId,
    type,
    amount,
    currency: currency || booking.pricing?.currency || 'TRY',
    notes,
    createdBy: req.user._id
  })

  // Add type-specific details
  if (type === 'bank_transfer' && bankTransfer) {
    payment.bankTransfer = {
      bankName: bankTransfer.bankName,
      iban: bankTransfer.iban,
      accountHolder: bankTransfer.accountHolder,
      reference: bankTransfer.reference,
      receiptUrl: bankTransfer.receiptUrl
    }
  }

  if (type === 'credit_card' && cardDetails) {
    payment.cardDetails = {
      lastFour: cardDetails.lastFour,
      brand: cardDetails.brand,
      paymentLink: cardDetails.paymentLink,
      linkSentAt: cardDetails.linkSentAt
    }
  }

  await payment.save()

  // Update booking payment reference and recalculate paidAmount
  await updateBookingPayment(bookingId)

  // Populate and return
  await payment.populate('createdBy', 'firstName lastName email')

  res.status(201).json({
    success: true,
    data: payment,
    message: 'PAYMENT_ADDED'
  })
})

/**
 * Update payment
 */
export const updatePayment = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    ...(partnerId && { partner: partnerId })
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  // Only pending payments can be updated
  if (payment.status !== 'pending') {
    throw new BadRequestError('PAYMENT_NOT_EDITABLE')
  }

  const allowedFields = ['amount', 'notes', 'bankTransfer', 'cardDetails']
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'bankTransfer') {
        payment.bankTransfer = { ...payment.bankTransfer, ...req.body.bankTransfer }
      } else if (field === 'cardDetails') {
        payment.cardDetails = { ...payment.cardDetails, ...req.body.cardDetails }
      } else {
        payment[field] = req.body[field]
      }
    }
  })

  await payment.save()
  await updateBookingPayment(bookingId)

  res.json({
    success: true,
    data: payment,
    message: 'PAYMENT_UPDATED'
  })
})

/**
 * Confirm bank transfer payment
 */
export const confirmPayment = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    ...(partnerId && { partner: partnerId })
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  if (payment.status !== 'pending') {
    throw new BadRequestError('PAYMENT_NOT_PENDING')
  }

  await payment.confirm(req.user._id)
  await updateBookingPayment(bookingId)

  res.json({
    success: true,
    data: payment,
    message: 'PAYMENT_CONFIRMED'
  })
})

/**
 * Cancel payment
 */
export const cancelPayment = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    ...(partnerId && { partner: partnerId })
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  await payment.cancel()
  await updateBookingPayment(bookingId)

  res.json({
    success: true,
    data: payment,
    message: 'PAYMENT_CANCELLED'
  })
})

/**
 * Refund payment
 */
export const refundPayment = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const { amount, reason } = req.body
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    ...(partnerId && { partner: partnerId })
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  if (!amount || amount <= 0) {
    throw new BadRequestError('INVALID_REFUND_AMOUNT')
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

/**
 * Upload receipt for bank transfer
 */
export const uploadReceipt = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    type: 'bank_transfer',
    ...(partnerId && { partner: partnerId })
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  if (!req.file) {
    throw new BadRequestError('NO_FILE_UPLOADED')
  }

  // Store file path
  payment.bankTransfer.receiptUrl = `/uploads/payments/${req.file.filename}`
  await payment.save()

  res.json({
    success: true,
    data: payment,
    message: 'RECEIPT_UPLOADED'
  })
})

/**
 * Get receipt file
 */
export const getReceipt = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    ...(partnerId && { partner: partnerId })
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  if (!payment.bankTransfer?.receiptUrl) {
    throw new NotFoundError('RECEIPT_NOT_FOUND')
  }

  // Get file path
  const filename = path.basename(payment.bankTransfer.receiptUrl)
  const filePath = path.join(process.cwd(), 'uploads', 'payments', filename)

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError('FILE_NOT_FOUND')
  }

  // Get file extension and set content type
  const ext = path.extname(filename).toLowerCase()
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf'
  }
  const contentType = contentTypes[ext] || 'application/octet-stream'

  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`)

  // Stream the file
  const fileStream = fs.createReadStream(filePath)
  fileStream.pipe(res)
})

/**
 * Delete payment (only pending)
 */
export const deletePayment = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    ...(partnerId && { partner: partnerId })
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  if (payment.status !== 'pending') {
    throw new BadRequestError('ONLY_PENDING_PAYMENTS_CAN_BE_DELETED')
  }

  await payment.deleteOne()
  await updateBookingPayment(bookingId)

  res.json({
    success: true,
    message: 'PAYMENT_DELETED'
  })
})

/**
 * Helper: Update booking payment status and amounts
 */
async function updateBookingPayment(bookingId) {
  const payments = await Payment.find({ booking: bookingId })

  const paidAmount = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const booking = await Booking.findById(bookingId)
  if (!booking) return

  const grandTotal = booking.pricing?.grandTotal || 0

  // Determine payment status
  let status = 'pending'
  if (paidAmount >= grandTotal) {
    status = 'paid'
  } else if (paidAmount > 0) {
    status = 'partial'
  }

  // Check if any payment was refunded
  const hasRefund = payments.some(p => p.status === 'refunded')
  if (hasRefund && paidAmount === 0) {
    status = 'refunded'
  }

  // Update booking
  booking.payment.paidAmount = paidAmount
  booking.payment.status = status
  booking.payment.payments = payments.map(p => p._id)

  await booking.save()
}

// ============================================================================
// CREDIT CARD PAYMENT METHODS
// ============================================================================

/**
 * Query card BIN for installment options
 */
export const queryCardBin = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const { bin } = req.body
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  // Validate BIN
  if (!bin || bin.length < 6) {
    throw new BadRequestError('INVALID_BIN')
  }

  // Find payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    type: 'credit_card',
    ...(partnerId && { partner: partnerId })
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
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  // Validate card
  if (!card || !card.holder || !card.number || !card.expiry || !card.cvv) {
    throw new BadRequestError('INVALID_CARD_DETAILS')
  }

  // Find payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    type: 'credit_card',
    ...(partnerId && { partner: partnerId })
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
      status: result.requires3D ? 'requires_3d' : 'processing'
    }
  })
})

/**
 * Get card payment status
 */
export const getCardPaymentStatus = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  // Find payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    type: 'credit_card',
    ...(partnerId && { partner: partnerId })
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

// ============================================================================
// PRE-AUTHORIZATION METHODS
// ============================================================================

/**
 * Pre-authorize card payment (hold amount without capturing)
 */
export const preAuthorizeCard = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const { posId, installment, card, customer } = req.body
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  // Validate card
  if (!card || !card.holder || !card.number || !card.expiry || !card.cvv) {
    throw new BadRequestError('INVALID_CARD_DETAILS')
  }

  // Find payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    type: 'credit_card',
    ...(partnerId && { partner: partnerId })
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
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  // Find payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    status: 'pre_authorized',
    ...(partnerId && { partner: partnerId })
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
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  // Find payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    status: 'pre_authorized',
    ...(partnerId && { partner: partnerId })
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
  const partnerId = req.user.role === 'platform_admin' ? req.query.partnerId : req.user.partner

  const payments = await Payment.find({
    booking: bookingId,
    status: 'pre_authorized',
    'preAuth.isPreAuth': true,
    ...(partnerId && { partner: partnerId })
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
