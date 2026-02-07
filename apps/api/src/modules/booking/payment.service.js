import path from 'path'
import fs from 'fs'
import mongoose from 'mongoose'
import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import Payment from './payment.model.js'
import Booking from './booking.model.js'
import logger from '#core/logger.js'

// ============================================================================
// RE-EXPORTS FROM SUB-SERVICES (for backward compatibility)
// ============================================================================

// Gateway operations (BIN queries, card processing, status checks)
export {
  queryBinByPartner,
  queryCardBin,
  processCardPayment,
  getCardPaymentStatus
} from './paymentGateway.service.js'

// Pre-authorization operations
export {
  preAuthorizeCard,
  capturePreAuth,
  releasePreAuth,
  getPreAuthorizedPayments
} from './paymentPreAuth.service.js'

// Refund operations
export { refundPayment } from './paymentRefund.service.js'

// Webhook handling
export { paymentWebhook } from './paymentWebhook.service.js'

// Payment link creation
export { createPaymentLinkForPayment } from './paymentLink.service.js'

// ============================================================================
// SECURITY HELPERS
// ============================================================================

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

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

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

  // Calculate totals (use booking-currency amount when DCC conversion was applied)
  const getBookingAmount = (p) =>
    p.cardDetails?.currencyConversion?.originalAmount || p.amount

  const paidAmount = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + getBookingAmount(p), 0)

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + getBookingAmount(p), 0)

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

// ============================================================================
// BOOKING INTEGRATION
// ============================================================================

/**
 * Helper: Update booking payment status and amounts
 * Exported for use by sub-services and paymentLink.service.js
 *
 * ATOMIC VERSION: Uses aggregation for accurate calculation
 * and findOneAndUpdate for atomic booking update
 */
/**
 * Update booking's payment summary from all related Payment records.
 * Accepts optional session/options for transaction support.
 *
 * @param {string|ObjectId} bookingId
 * @param {Object} [opts={}] - Mongoose options (e.g. { session } for transactions)
 */
export async function updateBookingPayment(bookingId, opts = {}) {
  // Step 1: Calculate payment summary using aggregation (accurate, no race)
  const pipeline = [
    { $match: { booking: new mongoose.Types.ObjectId(bookingId) } },
    {
      $group: {
        _id: null,
        paidAmount: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              {
                $cond: [
                  { $gt: ['$cardDetails.currencyConversion.originalAmount', null] },
                  '$cardDetails.currencyConversion.originalAmount',
                  '$amount'
                ]
              },
              0
            ]
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
  ]

  const aggregate = Payment.aggregate(pipeline)
  if (opts.session) aggregate.session(opts.session)
  const [summary] = await aggregate

  const paidAmount = summary?.paidAmount || 0
  const hasRefund = summary?.hasRefund || false
  const paymentIds = summary?.paymentIds || []

  // Step 2: Get booking grandTotal for status calculation
  const bookingQuery = Booking.findById(bookingId).select('pricing.grandTotal')
  if (opts.session) bookingQuery.session(opts.session)
  const booking = await bookingQuery.lean()
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

  // Step 4: Build update object
  const updateData = {
    'payment.paidAmount': paidAmount,
    'payment.status': status,
    'payment.payments': paymentIds
  }

  // Step 5: If payment is complete (paid), also confirm the booking
  // Only update booking status if it's currently 'pending' and payment is now 'paid'
  if (status === 'paid') {
    const statusQuery = Booking.findById(bookingId).select('status')
    if (opts.session) statusQuery.session(opts.session)
    const currentBooking = await statusQuery.lean()
    if (currentBooking && currentBooking.status === 'pending') {
      updateData.status = 'confirmed'
      updateData.confirmedAt = new Date()
      logger.info('[updateBookingPayment] Booking confirmed after full payment:', { bookingId })
    }
  }

  // Step 6: ATOMIC update booking with calculated values
  await Booking.findByIdAndUpdate(
    bookingId,
    { $set: updateData },
    { new: true, ...opts }
  )
}
