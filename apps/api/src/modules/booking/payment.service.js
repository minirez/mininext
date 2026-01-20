import path from 'path'
import fs from 'fs'
import mongoose from 'mongoose'
import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import Payment from './payment.model.js'
import Booking from './booking.model.js'
import paymentGateway from '#services/paymentGateway.js'
import logger from '#core/logger.js'

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

/**
 * Build secure partner filter for booking/payment queries
 * NEVER allows access without partner context
 */
function buildSecurePartnerFilter(req) {
  const partnerId = getRequiredPartnerId(req)
  return { partner: partnerId }
}

/**
 * Get all payments for a booking
 */
export const getPayments = asyncHandler(async (req, res) => {
  const { id: bookingId } = req.params
  const partnerId = getRequiredPartnerId(req)

  // Verify booking exists and belongs to partner
  const booking = await Booking.findOne({
    _id: bookingId,
    partner: partnerId // SECURE: Always filter by partner
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
  const partnerId = getRequiredPartnerId(req)

  // Verify booking exists
  const booking = await Booking.findOne({
    _id: bookingId,
    partner: partnerId // SECURE: Always filter by partner
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

  // Send notification for auto-completed payments (cash, agency_credit)
  if (['cash', 'agency_credit'].includes(type) && payment.status === 'completed') {
    try {
      const { sendPaymentNotification } = await import('./payment-notifications.service.js')
      await sendPaymentNotification(payment, booking, 'completed')
    } catch (notifyError) {
      logger.error('[addPayment] Failed to send notification:', notifyError.message)
    }
  }

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
  const partnerId = getRequiredPartnerId(req)

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    partner: partnerId // SECURE: Always filter by partner
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  // Only pending payments can be updated
  if (payment.status !== 'pending') {
    throw new BadRequestError('PAYMENT_NOT_EDITABLE')
  }

  // VALIDATION: If amount is being updated, validate it
  if (req.body.amount !== undefined) {
    const newAmount = parseFloat(req.body.amount)
    if (!newAmount || isNaN(newAmount) || newAmount <= 0) {
      throw new BadRequestError('INVALID_AMOUNT')
    }
    if (newAmount > 1000000) {
      throw new BadRequestError('AMOUNT_TOO_LARGE')
    }
  }

  const allowedFields = ['amount', 'notes', 'bankTransfer', 'cardDetails']
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'bankTransfer') {
        payment.bankTransfer = { ...payment.bankTransfer, ...req.body.bankTransfer }
      } else if (field === 'cardDetails') {
        payment.cardDetails = { ...payment.cardDetails, ...req.body.cardDetails }
      } else if (field === 'amount') {
        payment.amount = parseFloat(req.body.amount) // Use parsed value
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
  const partnerId = getRequiredPartnerId(req)

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    partner: partnerId // SECURE: Always filter by partner
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
  const partnerId = getRequiredPartnerId(req)

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    partner: partnerId // SECURE: Always filter by partner
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

/**
 * Upload receipt for bank transfer
 */
export const uploadReceipt = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const partnerId = getRequiredPartnerId(req)

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    type: 'bank_transfer',
    partner: partnerId // SECURE: Always filter by partner
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
  const partnerId = getRequiredPartnerId(req)

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    partner: partnerId // SECURE: Always filter by partner
  })

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  if (!payment.bankTransfer?.receiptUrl) {
    throw new NotFoundError('RECEIPT_NOT_FOUND')
  }

  // SECURITY: Validate and sanitize file path to prevent directory traversal
  const filename = path.basename(payment.bankTransfer.receiptUrl)

  // Validate filename - only allow alphanumeric, dash, underscore, dot
  if (!/^[\w\-\.]+$/.test(filename)) {
    throw new BadRequestError('INVALID_FILE_NAME')
  }

  // Build and validate file path
  const uploadsDir = path.resolve(process.cwd(), 'uploads', 'payments')
  const filePath = path.resolve(uploadsDir, filename)

  // SECURITY: Ensure resolved path is within uploads directory (prevent traversal)
  if (!filePath.startsWith(uploadsDir)) {
    logger.warn('[getReceipt] Directory traversal attempt:', { filename, filePath, uploadsDir })
    throw new BadRequestError('INVALID_FILE_PATH')
  }

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
  const partnerId = getRequiredPartnerId(req)

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    partner: partnerId // SECURE: Always filter by partner
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
 * Exported for use by paymentLink.service.js
 *
 * ATOMIC VERSION: Uses aggregation for accurate calculation
 * and findOneAndUpdate for atomic booking update
 */
export async function updateBookingPayment(bookingId) {
  // Step 1: Calculate payment summary using aggregation (accurate, no race)
  const [summary] = await Payment.aggregate([
    { $match: { booking: new mongoose.Types.ObjectId(bookingId) } },
    {
      $group: {
        _id: null,
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
          }
        },
        hasRefund: {
          $max: {
            $cond: [{ $eq: ['$status', 'refunded'] }, true, false]
          }
        },
        paymentIds: { $push: '$_id' }
      }
    }
  ])

  const paidAmount = summary?.paidAmount || 0
  const hasRefund = summary?.hasRefund || false
  const paymentIds = summary?.paymentIds || []

  // Step 2: Get booking grandTotal for status calculation
  const booking = await Booking.findById(bookingId).select('pricing.grandTotal').lean()
  if (!booking) return

  const grandTotal = booking.pricing?.grandTotal || 0

  // Step 3: Determine payment status
  let status = 'pending'
  if (paidAmount >= grandTotal && grandTotal > 0) {
    status = 'paid'
  } else if (paidAmount > 0) {
    status = 'partial'
  }
  if (hasRefund && paidAmount === 0) {
    status = 'refunded'
  }

  // Step 4: ATOMIC update booking with calculated values
  await Booking.findByIdAndUpdate(
    bookingId,
    {
      $set: {
        'payment.paidAmount': paidAmount,
        'payment.status': status,
        'payment.payments': paymentIds
      }
    },
    { new: true }
  )
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
  // Production: payment.minires.com (dedicated payment domain)
  const getFormUrl = (transactionId) => {
    if (!requires3D) return null
    const host = req.get('host') || ''
    // Always use HTTPS for payment forms (avoid mixed content)
    if (host.includes('mini.com')) {
      return `https://payment.mini.com/payment/${transactionId}/form`
    }
    // Default to minires.com for production
    return `https://payment.minires.com/payment/${transactionId}/form`
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

  // ATOMIC: Find and lock payment in single operation to prevent race conditions
  // Only process if status is 'pending' - this prevents double-processing
  const newStatus = success ? 'completed' : 'failed'
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

  const payment = await Payment.findOneAndUpdate(
    {
      _id: externalId,
      status: 'pending' // Only update if still pending - ATOMIC GUARD
    },
    { $set: updateData },
    { new: true }
  )

  // If no payment found or already processed
  if (!payment) {
    // Check if payment exists but was already processed
    const existingPayment = await Payment.findById(externalId)
    if (!existingPayment) {
      logger.error('[Payment Webhook] Payment not found:', externalId)
      return res.status(404).json({ success: false, error: 'Payment not found' })
    }
    // Already processed by another webhook call
    logger.info('[Payment Webhook] Payment already processed, status:', existingPayment.status)
    return res.json({ success: true, message: 'Already processed' })
  }

  logger.info('[Payment Webhook] Payment updated atomically:', { paymentId: payment._id, status: payment.status })

  // Fetch booking for notifications
  const booking = await Booking.findById(payment.booking)

  // Update booking payment summary
  if (success) {
    await updateBookingPayment(payment.booking)
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

// ============================================================================
// PAYMENT LINK FOR EXISTING PAYMENT
// ============================================================================

/**
 * Create a payment link for an existing pending payment
 * This allows customers to pay via a public link
 */
export const createPaymentLinkForPayment = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const { sendEmail = false, sendSms = false } = req.body
  const partnerId = getRequiredPartnerId(req)

  // VALIDATION: expiresInDays must be a positive integer (1-365)
  let expiresInDays = parseInt(req.body.expiresInDays) || 7
  if (expiresInDays < 1) expiresInDays = 1
  if (expiresInDays > 365) expiresInDays = 365

  // Find the payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    type: 'credit_card',
    partner: partnerId // SECURE: Always filter by partner
  }).populate('booking', 'bookingNumber leadGuest contact partner')

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  // Only pending payments can have links created
  if (payment.status !== 'pending') {
    throw new BadRequestError('PAYMENT_NOT_PENDING')
  }

  // Check if there's already an active payment link for this payment
  const PaymentLink = (await import('../paymentLink/paymentLink.model.js')).default
  const existingLink = await PaymentLink.findOne({
    linkedPayment: payment._id,
    status: { $in: ['pending', 'viewed', 'processing'] }
  })

  if (existingLink) {
    // Update existing link with latest customer info if needed
    const leadGuest = payment.booking?.leadGuest || {}
    const contact = payment.booking?.contact || {}
    const updatedEmail = leadGuest.email || contact.email || ''
    const updatedPhone = leadGuest.phone || contact.phone || ''

    // Update customer info if it was empty before
    if ((!existingLink.customer.email && updatedEmail) || (!existingLink.customer.phone && updatedPhone)) {
      existingLink.customer.email = existingLink.customer.email || updatedEmail
      existingLink.customer.phone = existingLink.customer.phone || updatedPhone
      await existingLink.save()
    }

    // Send notifications if requested and not sent before
    const shouldSendEmail = sendEmail && existingLink.customer.email && !existingLink.notifications.emailSent
    const shouldSendSms = sendSms && existingLink.customer.phone && !existingLink.notifications.smsSent

    if (shouldSendEmail || shouldSendSms) {
      try {
        const { sendPaymentLinkNotification } = await import('./payment-notifications.service.js')
        const Partner = (await import('../partner/partner.model.js')).default
        const partner = await Partner.findById(payment.partner)

        await sendPaymentLinkNotification(existingLink, partner, {
          email: shouldSendEmail,
          sms: shouldSendSms
        })
      } catch (notifyError) {
        logger.error('Failed to send notification for existing link:', notifyError.message)
      }
    }

    return res.json({
      success: true,
      data: existingLink,
      message: 'EXISTING_LINK_RETURNED'
    })
  }

  // Get customer info from booking (leadGuest + contact fallback)
  const leadGuest = payment.booking?.leadGuest || {}
  const contact = payment.booking?.contact || {}
  const customerName = `${leadGuest.firstName || ''} ${leadGuest.lastName || ''}`.trim() || 'Müşteri'
  const customerEmail = leadGuest.email || contact.email || ''
  const customerPhone = leadGuest.phone || contact.phone || ''

  // Create payment link
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const paymentLink = new PaymentLink({
    partner: payment.partner,
    booking: payment.booking._id,
    linkedPayment: payment._id,
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone
    },
    description: `Rezervasyon Ödemesi - ${payment.booking.bookingNumber}`,
    amount: payment.amount,
    currency: payment.currency,
    installment: {
      enabled: true,
      maxCount: 12,
      rates: {}
    },
    expiresAt,
    createdBy: req.user._id
  })

  await paymentLink.save()

  // Store payment link reference in payment
  payment.cardDetails = payment.cardDetails || {}
  payment.cardDetails.paymentLink = paymentLink._id
  payment.cardDetails.linkSentAt = new Date()
  await payment.save()

  // Send notifications if requested
  if ((sendEmail || sendSms) && (customerEmail || customerPhone)) {
    try {
      const { sendPaymentLinkNotification } = await import('./payment-notifications.service.js')
      const Partner = (await import('../partner/partner.model.js')).default
      const partner = await Partner.findById(payment.partner)

      await sendPaymentLinkNotification(paymentLink, partner, {
        email: sendEmail && !!customerEmail,
        sms: sendSms && !!customerPhone
      })
    } catch (notifyError) {
      logger.error('Failed to send payment link notification:', notifyError.message)
      // Don't fail the request, just log the error
    }
  }

  res.status(201).json({
    success: true,
    data: paymentLink,
    message: 'PAYMENT_LINK_CREATED'
  })
})
