import PaymentLink from './paymentLink.model.js'
import Partner from '../partner/partner.model.js'
import Booking from '../booking/booking.model.js'
import Payment from '../booking/payment.model.js'
import { NotFoundError, BadRequestError, ConflictError } from '#core/errors.js'
import { asyncHandler, getEffectivePartnerId, escapeRegex } from '#helpers'
import logger from '#core/logger.js'
import paymentGateway from '#services/paymentGateway.js'
// Import centralized notification function
import { sendPaymentLinkNotification } from '../booking/payment-notifications.service.js'

// Re-export for backward compatibility
export { sendPaymentLinkNotification }

/**
 * Get payment links list with filtering and pagination
 */
export const getPaymentLinks = asyncHandler(async (req, res) => {
  const {
    status,
    search,
    booking,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  // Build filter using $and to ensure partner isolation is never overwritten
  const conditions = []

  // Partner isolation - STRICT SEPARATION (ALWAYS FIRST, NEVER OVERWRITTEN)
  if (req.user.accountType === 'partner') {
    // Partner users: ONLY see their own partner's links
    conditions.push({ partner: req.user.accountId })
  } else {
    // Platform admin
    if (req.partnerId) {
      // Partner selected: show ONLY that partner's links
      conditions.push({ partner: req.partnerId })
    } else {
      // No partner selected: show ONLY platform-level links (partner is null or doesn't exist)
      conditions.push({
        $or: [{ partner: null }, { partner: { $exists: false } }]
      })
    }
  }

  // Status filter
  if (status) {
    conditions.push({ status })
  }

  // Booking filter
  if (booking) {
    conditions.push({ booking })
  }

  // Date range filter
  if (startDate || endDate) {
    const dateFilter = {}
    if (startDate) {
      dateFilter.$gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate)
    }
    conditions.push({ createdAt: dateFilter })
  }

  // Search filter - SECURITY: escape regex special characters to prevent injection
  if (search) {
    const escapedSearch = escapeRegex(search)
    conditions.push({
      $or: [
        { linkNumber: { $regex: escapedSearch, $options: 'i' } },
        { 'customer.name': { $regex: escapedSearch, $options: 'i' } },
        { 'customer.email': { $regex: escapedSearch, $options: 'i' } },
        { 'customer.phone': { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } }
      ]
    })
  }

  // Build final filter with $and to ensure all conditions apply
  const filter = conditions.length > 0 ? { $and: conditions } : {}

  // Debug logging
  logger.info('[PaymentLinks] Query debug:', {
    accountType: req.user.accountType,
    partnerId: req.partnerId,
    userAccountId: req.user.accountId,
    filter: JSON.stringify(filter)
  })

  // Pagination - validate and sanitize
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)) // Max 100 per page
  const skip = (pageNum - 1) * limitNum
  const total = await PaymentLink.countDocuments(filter)

  // Sort
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

  const paymentLinks = await PaymentLink.find(filter)
    .populate('partner', 'companyName')
    .populate('booking', 'bookingNumber')
    .populate('createdBy', 'name email')
    .populate('cancelledBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limitNum)

  res.json({
    success: true,
    data: {
      items: paymentLinks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  })
})

/**
 * Get payment link by ID
 */
export const getPaymentLink = asyncHandler(async (req, res) => {
  const paymentLink = await PaymentLink.findById(req.params.id)
    .populate('partner', 'companyName branding')
    .populate('booking')
    .populate('createdBy', 'name email')
    .populate('cancelledBy', 'name email')

  if (!paymentLink) {
    throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
  }

  // Check ownership - STRICT SEPARATION
  if (req.user.accountType === 'partner') {
    // Partner user: must match their partner
    if (
      !paymentLink.partner ||
      paymentLink.partner._id.toString() !== req.user.accountId.toString()
    ) {
      throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
    }
  } else {
    // Platform admin
    if (req.partnerId) {
      // Partner selected: must match that partner
      if (!paymentLink.partner || paymentLink.partner._id.toString() !== req.partnerId.toString()) {
        throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
      }
    } else {
      // No partner selected: must be platform-level (no partner)
      if (paymentLink.partner) {
        throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
      }
    }
  }

  res.json({
    success: true,
    data: paymentLink
  })
})

/**
 * Create new payment link
 */
export const createPaymentLink = asyncHandler(async (req, res) => {
  let partnerId = req.body.partner
  let partner = null

  // Debug logging
  logger.info('[PaymentLink] Create request:', {
    accountType: req.user.accountType,
    headerPartnerId: req.partnerId,
    bodyPartnerId: req.body.partner
  })

  // Partner isolation
  if (req.user.accountType === 'partner') {
    // Partner users must use their own partner
    partnerId = req.user.accountId
  } else {
    // Platform admin: use partner from header (selected in UI) or body
    // req.partnerId comes from X-Partner-Id header set by partnerContext middleware
    partnerId = req.partnerId || req.body.partner || null
  }

  // Partner is required only for partner users
  if (req.user.accountType === 'partner' && !partnerId) {
    throw new BadRequestError('REQUIRED_PARTNER')
  }

  // Verify partner exists and is active (if provided)
  if (partnerId) {
    partner = await Partner.findById(partnerId)
    if (!partner) {
      throw new NotFoundError('PARTNER_NOT_FOUND')
    }
    if (!partner.isActive()) {
      throw new BadRequestError('PARTNER_NOT_ACTIVE')
    }
  }

  // If booking is provided, verify it exists
  if (req.body.booking) {
    const booking = await Booking.findById(req.body.booking)
    if (!booking) {
      throw new NotFoundError('BOOKING_NOT_FOUND')
    }
    // Verify booking belongs to same partner (if partner is set)
    if (partnerId && booking.partner.toString() !== partnerId.toString()) {
      throw new BadRequestError('BOOKING_PARTNER_MISMATCH')
    }
  }

  // VALIDATION: Amount must be a positive number
  const amount = parseFloat(req.body.amount)
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new BadRequestError('INVALID_AMOUNT')
  }
  if (amount > 1000000) {
    // Max 1 million - reasonable limit
    throw new BadRequestError('AMOUNT_TOO_LARGE')
  }

  // Calculate expiry date (default 30 days)
  let expiresAt
  if (req.body.expiresAt) {
    expiresAt = new Date(req.body.expiresAt)
    // VALIDATION: Expiry date must be valid and in the future
    if (isNaN(expiresAt.getTime())) {
      throw new BadRequestError('INVALID_EXPIRY_DATE')
    }
    if (expiresAt <= new Date()) {
      throw new BadRequestError('EXPIRY_DATE_MUST_BE_FUTURE')
    }
    // Max 1 year expiry
    const maxExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    if (expiresAt > maxExpiry) {
      throw new BadRequestError('EXPIRY_DATE_TOO_FAR')
    }
  } else {
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }

  // Clean rates object - ensure numeric values with string keys
  const cleanedRates = {}
  const ratesObj = req.body.installment?.rates || {}
  if (ratesObj && typeof ratesObj === 'object') {
    Object.entries(ratesObj).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && !isNaN(value)) {
        cleanedRates[String(key)] = Number(value)
      }
    })
  }

  logger.info('Creating payment link with rates:', { rates: cleanedRates })

  // Create payment link
  const paymentLink = await PaymentLink.create({
    partner: partnerId || undefined,
    customer: {
      name: req.body.customer.name,
      email: req.body.customer.email,
      phone: req.body.customer.phone
    },
    description: req.body.description,
    amount: amount, // Use validated amount
    currency: req.body.currency || 'TRY',
    installment: {
      enabled: req.body.installment?.enabled || false,
      maxCount: req.body.installment?.maxCount || 1,
      rates: cleanedRates
    },
    booking: req.body.booking,
    expiresAt,
    createdBy: req.user._id
  })

  // Send notification if requested
  const sendEmail = req.body.sendEmail !== false
  const sendSms = req.body.sendSms === true

  if (sendEmail || sendSms) {
    try {
      await sendPaymentLinkNotification(paymentLink, partner, {
        email: sendEmail,
        sms: sendSms
      })
    } catch (error) {
      logger.error('Failed to send payment link notification:', error.message)
    }
  }

  // Populate for response
  await paymentLink.populate('partner', 'companyName')
  await paymentLink.populate('createdBy', 'name email')

  res.status(201).json({
    success: true,
    message: req.t('PAYMENT_LINK_CREATED'),
    data: paymentLink
  })
})

/**
 * Update payment link (only pending/viewed status)
 */
export const updatePaymentLink = asyncHandler(async (req, res) => {
  const paymentLink = await PaymentLink.findById(req.params.id)

  if (!paymentLink) {
    throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
  }

  // Check ownership - STRICT SEPARATION
  if (req.user.accountType === 'partner') {
    if (!paymentLink.partner || paymentLink.partner.toString() !== req.user.accountId.toString()) {
      throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
    }
  } else {
    if (req.partnerId) {
      if (!paymentLink.partner || paymentLink.partner.toString() !== req.partnerId.toString()) {
        throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
      }
    } else {
      // Platform admin without partner: only platform-level links
      if (paymentLink.partner) {
        throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
      }
    }
  }

  // Can only update pending or viewed links
  if (!['pending', 'viewed'].includes(paymentLink.status)) {
    throw new ConflictError('PAYMENT_LINK_CANNOT_UPDATE')
  }

  // Allowed fields to update
  const allowedFields = [
    'customer',
    'description',
    'amount',
    'currency',
    'installment',
    'expiresAt'
  ]

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'customer') {
        // Merge customer fields
        paymentLink.customer = {
          ...paymentLink.customer.toObject(),
          ...req.body.customer
        }
      } else if (field === 'installment') {
        // Merge installment fields
        const currentInstallment = paymentLink.installment || {}
        const newInstallment = req.body.installment || {}

        // Clean rates object - ensure numeric values with string keys
        const cleanedRates = {}
        const ratesObj = newInstallment.rates ?? currentInstallment.rates ?? {}
        if (ratesObj && typeof ratesObj === 'object') {
          Object.entries(ratesObj).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && !isNaN(value)) {
              cleanedRates[String(key)] = Number(value)
            }
          })
        }

        paymentLink.installment = {
          enabled: newInstallment.enabled ?? currentInstallment.enabled ?? false,
          maxCount: newInstallment.maxCount ?? currentInstallment.maxCount ?? 1,
          rates: cleanedRates
        }

        // Mark as modified so Mongoose saves the Mixed type
        paymentLink.markModified('installment')

        logger.info('Updating installment:', {
          linkId: paymentLink._id,
          rates: cleanedRates,
          enabled: paymentLink.installment.enabled,
          maxCount: paymentLink.installment.maxCount
        })
      } else if (field === 'expiresAt') {
        const newExpiry = new Date(req.body.expiresAt)
        // VALIDATION: Expiry date must be valid and in the future
        if (isNaN(newExpiry.getTime())) {
          throw new BadRequestError('INVALID_EXPIRY_DATE')
        }
        if (newExpiry <= new Date()) {
          throw new BadRequestError('EXPIRY_DATE_MUST_BE_FUTURE')
        }
        paymentLink.expiresAt = newExpiry
      } else if (field === 'amount') {
        const newAmount = parseFloat(req.body.amount)
        // VALIDATION: Amount must be positive
        if (!newAmount || isNaN(newAmount) || newAmount <= 0) {
          throw new BadRequestError('INVALID_AMOUNT')
        }
        if (newAmount > 1000000) {
          throw new BadRequestError('AMOUNT_TOO_LARGE')
        }
        paymentLink.amount = newAmount
      } else {
        paymentLink[field] = req.body[field]
      }
    }
  })

  await paymentLink.save()

  res.json({
    success: true,
    message: req.t('PAYMENT_LINK_UPDATED'),
    data: paymentLink
  })
})

/**
 * Cancel payment link
 */
export const cancelPaymentLink = asyncHandler(async (req, res) => {
  const paymentLink = await PaymentLink.findById(req.params.id)

  if (!paymentLink) {
    throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
  }

  // Check ownership - STRICT SEPARATION
  if (req.user.accountType === 'partner') {
    if (!paymentLink.partner || paymentLink.partner.toString() !== req.user.accountId.toString()) {
      throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
    }
  } else {
    if (req.partnerId) {
      if (!paymentLink.partner || paymentLink.partner.toString() !== req.partnerId.toString()) {
        throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
      }
    } else {
      if (paymentLink.partner) {
        throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
      }
    }
  }

  // Cannot cancel paid links
  if (paymentLink.status === 'paid') {
    throw new ConflictError('PAYMENT_LINK_ALREADY_PAID')
  }

  // Cannot cancel already cancelled links
  if (paymentLink.status === 'cancelled') {
    throw new ConflictError('PAYMENT_LINK_ALREADY_CANCELLED')
  }

  await paymentLink.cancel(req.user._id, req.body.reason)

  // CONSISTENCY: If there's a linked payment that's still pending, cancel it too
  if (paymentLink.linkedPayment) {
    const linkedPayment = await Payment.findOneAndUpdate(
      {
        _id: paymentLink.linkedPayment,
        status: 'pending' // Only cancel if still pending
      },
      {
        $set: {
          status: 'cancelled',
          'cardDetails.gatewayStatus': 'cancelled'
        }
      },
      { new: true }
    )

    if (linkedPayment) {
      logger.info('[CancelPaymentLink] Linked payment also cancelled:', {
        paymentLinkId: paymentLink._id,
        paymentId: linkedPayment._id
      })

      // Update booking payment summary
      if (linkedPayment.booking) {
        const { updateBookingPayment } = await import('../booking/payment.service.js')
        await updateBookingPayment(linkedPayment.booking)
      }
    }
  }

  res.json({
    success: true,
    message: req.t('PAYMENT_LINK_CANCELLED'),
    data: paymentLink
  })
})

/**
 * Resend notification for payment link
 */
export const resendNotification = asyncHandler(async (req, res) => {
  const paymentLink = await PaymentLink.findById(req.params.id).populate(
    'partner',
    'companyName branding'
  )

  if (!paymentLink) {
    throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
  }

  // Check ownership - STRICT SEPARATION
  if (req.user.accountType === 'partner') {
    if (
      !paymentLink.partner ||
      paymentLink.partner._id.toString() !== req.user.accountId.toString()
    ) {
      throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
    }
  } else {
    if (req.partnerId) {
      if (!paymentLink.partner || paymentLink.partner._id.toString() !== req.partnerId.toString()) {
        throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
      }
    } else {
      if (paymentLink.partner) {
        throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
      }
    }
  }

  // Can only resend for pending or viewed links
  if (!['pending', 'viewed'].includes(paymentLink.status)) {
    throw new ConflictError('PAYMENT_LINK_CANNOT_RESEND')
  }

  // Check if expired
  if (paymentLink.expiresAt < new Date()) {
    throw new ConflictError('PAYMENT_LINK_EXPIRED')
  }

  const sendEmail = req.body.channel === 'email' || req.body.channel === 'both'
  const sendSms = req.body.channel === 'sms' || req.body.channel === 'both'

  const result = await sendPaymentLinkNotification(paymentLink, paymentLink.partner, {
    email: sendEmail,
    sms: sendSms
  })

  res.json({
    success: true,
    message: req.t('PAYMENT_LINK_NOTIFICATION_SENT'),
    data: {
      email: sendEmail ? result.email : null,
      sms: sendSms ? result.sms : null
    }
  })
})

/**
 * Get payment link statistics
 */
export const getPaymentLinkStats = asyncHandler(async (req, res) => {
  let partnerId = null
  let platformOnly = false

  if (req.user.accountType === 'partner') {
    // Partner user - always filter by their partner
    partnerId = req.user.accountId
  } else if (req.partnerId) {
    // Platform admin with selected partner
    partnerId = req.partnerId
  } else {
    // Platform admin without partner - show only platform-level stats
    platformOnly = true
  }

  const stats = await PaymentLink.getStats(partnerId, platformOnly)

  res.json({
    success: true,
    data: stats
  })
})

// ===== PUBLIC ROUTES (No Auth) =====

/**
 * Get payment link by token (public)
 */
export const getPaymentLinkByToken = asyncHandler(async (req, res) => {
  const { token } = req.params

  const paymentLink = await PaymentLink.findByToken(token)

  if (!paymentLink) {
    throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
  }

  // Check if expired - both 'pending' and 'viewed' links can expire
  if (paymentLink.expiresAt < new Date() && ['pending', 'viewed'].includes(paymentLink.status)) {
    paymentLink.status = 'expired'
    await paymentLink.save()
  }

  // Cannot proceed with cancelled or expired links
  if (['cancelled', 'expired'].includes(paymentLink.status)) {
    return res.json({
      success: true,
      data: {
        status: paymentLink.status,
        message:
          paymentLink.status === 'expired'
            ? 'Bu ödeme linkinin süresi dolmuş.'
            : 'Bu ödeme linki iptal edilmiş.'
      }
    })
  }

  // Cannot proceed with already paid links
  if (paymentLink.status === 'paid') {
    return res.json({
      success: true,
      data: {
        status: 'paid',
        message: 'Bu ödeme işlemi zaten tamamlanmış.',
        paidAt: paymentLink.paidAt
      }
    })
  }

  // Mark as viewed
  await paymentLink.markViewed()

  // Return public data
  res.json({
    success: true,
    data: {
      linkNumber: paymentLink.linkNumber,
      customer: {
        name: paymentLink.customer.name,
        email: paymentLink.customer.email
      },
      description: paymentLink.description,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      installment: {
        enabled: paymentLink.installment?.enabled || false,
        maxCount: paymentLink.installment?.maxCount || 1,
        rates: paymentLink.installment?.rates || {}
      },
      expiresAt: paymentLink.expiresAt,
      daysUntilExpiry: paymentLink.daysUntilExpiry,
      status: paymentLink.status,
      partner: paymentLink.partner
        ? {
            companyName: paymentLink.partner.companyName,
            branding: paymentLink.partner.branding
          }
        : null
    }
  })
})

/**
 * Get default installment rates for payment links
 * Calculates: Bank commission + Platform margin = Default rate
 */
export const getDefaultRates = asyncHandler(async (req, res) => {
  const { currency = 'TRY' } = req.query
  const partnerId = getEffectivePartnerId(req)

  try {
    // Call payment-service to get commission rates via gateway
    const response = await paymentGateway.getDefaultRates(partnerId, currency)

    if (response.success) {
      res.json({
        success: true,
        data: response.data
      })
    } else {
      res.json({
        success: true,
        data: {
          defaultRates: {},
          breakdown: {},
          message: 'Varsayılan oranlar bulunamadı'
        }
      })
    }
  } catch (error) {
    logger.error('Failed to get default rates from payment service:', error.message)
    // Return empty rates if payment service is unavailable
    res.json({
      success: true,
      data: {
        defaultRates: {},
        breakdown: {},
        message: 'Ödeme servisi erişilemez durumda'
      }
    })
  }
})

/**
 * Complete payment link (called by payment service after successful payment)
 * SECURITY: This endpoint should only be called by the payment service
 */
export const completePaymentLink = asyncHandler(async (req, res) => {
  const { token } = req.params
  const transactionData = req.body

  // ============================================================================
  // SECURITY: Validate API key - only payment service can call this endpoint
  // If PAYMENT_WEBHOOK_KEY is configured, enforce API key validation
  // Otherwise, log warning but allow (for backward compatibility)
  // ============================================================================
  const apiKey = req.headers['x-api-key']
  const configuredKey = process.env.PAYMENT_WEBHOOK_KEY

  if (configuredKey) {
    // API key is configured - enforce validation
    if (apiKey !== configuredKey) {
      logger.error('[completePaymentLink] Invalid or missing API key')
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }
  } else {
    // API key not configured - log warning for security awareness
    if (!apiKey) {
      logger.warn(
        '[completePaymentLink] No API key provided - consider configuring PAYMENT_WEBHOOK_KEY'
      )
    }
  }

  // Validate required transaction data
  if (!transactionData?.transactionId) {
    logger.error('[completePaymentLink] Missing transactionId')
    return res.status(400).json({ success: false, error: 'Missing transactionId' })
  }

  logger.info('completePaymentLink called:', {
    token,
    transactionId: transactionData.transactionId
  })

  const paymentLink = await PaymentLink.findByToken(token)

  if (!paymentLink) {
    throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
  }

  // Verify it's not already paid
  if (paymentLink.status === 'paid') {
    return res.json({
      success: true,
      message: 'Payment already recorded'
    })
  }

  // Mark as paid with full transaction data
  await paymentLink.markPaid({
    // İşlem bilgileri
    transactionId: transactionData.transactionId,
    authCode: transactionData.authCode,
    refNumber: transactionData.refNumber,
    provisionNumber: transactionData.provisionNumber,

    // Kart bilgileri
    maskedCard: transactionData.maskedCard,
    lastFour: transactionData.lastFour,
    brand: transactionData.brand,
    cardType: transactionData.cardType,
    cardFamily: transactionData.cardFamily,

    // Banka bilgileri
    cardBank: transactionData.cardBank,
    cardCountry: transactionData.cardCountry,

    // POS bilgileri
    posId: transactionData.posId,
    posName: transactionData.posName,
    posBank: transactionData.posBank,

    // Taksit ve komisyon
    installment: transactionData.installment,
    commission: transactionData.commission,

    // Ham yanıt
    rawResponse: transactionData
  })

  logger.info(`Payment link ${paymentLink.linkNumber} marked as paid`)

  // If linked to a booking (standalone link without linkedPayment), create Payment record
  if (paymentLink.booking && !paymentLink.linkedPayment) {
    try {
      const booking = await Booking.findById(paymentLink.booking)
      if (booking) {
        // Create a new Payment record for this payment link completion
        const payment = new Payment({
          partner: paymentLink.partner,
          booking: paymentLink.booking,
          type: 'credit_card',
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          status: 'completed',
          completedAt: new Date(),
          cardDetails: {
            gatewayStatus: 'completed',
            gatewayTransactionId: transactionData.transactionId,
            paymentLinkId: paymentLink._id,
            lastFour: transactionData.lastFour,
            brand: transactionData.brand,
            cardFamily: transactionData.cardFamily,
            bankName: transactionData.cardBank,
            installment: transactionData.installment || 1,
            processedAt: new Date(),
            gatewayResponse: {
              authCode: transactionData.authCode,
              refNumber: transactionData.refNumber,
              provisionNumber: transactionData.provisionNumber,
              maskedCard: transactionData.maskedCard
            }
          },
          // Commission data from payment gateway
          ...(transactionData.commission && {
            commission: {
              bankRate: transactionData.commission.bankRate,
              bankAmount: transactionData.commission.bankAmount,
              platformRate: transactionData.commission.platformRate,
              platformAmount: transactionData.commission.platformAmount,
              totalRate: transactionData.commission.totalRate,
              totalAmount: transactionData.commission.totalAmount,
              netAmount: transactionData.commission.netAmount
            }
          }),
          notes: `Payment link ile ödendi: ${paymentLink.linkNumber}`
        })
        await payment.save()

        // Update booking payment summary using atomic function
        const { updateBookingPayment } = await import('../booking/payment.service.js')
        await updateBookingPayment(paymentLink.booking)

        logger.info(`Booking ${booking.bookingNumber} payment created via standalone payment link`)
      }
    } catch (bookingError) {
      logger.error('Failed to create payment for standalone link:', bookingError.message)
    }
  }

  // ── Subscription purchase completion ──
  if (
    ['subscription_package', 'subscription_service'].includes(paymentLink.purpose) &&
    paymentLink.subscriptionContext?.targetPartner
  ) {
    try {
      const targetPartner = await Partner.findById(paymentLink.subscriptionContext.targetPartner)
      if (targetPartner) {
        const ctx = paymentLink.subscriptionContext
        const purchaseIds = ctx.purchaseIds?.length
          ? ctx.purchaseIds.map(id => id.toString())
          : ctx.purchaseId
            ? [ctx.purchaseId.toString()]
            : []

        const activatedPurchases = []
        for (const purchase of targetPartner.subscription?.purchases || []) {
          if (!purchaseIds.includes(purchase._id.toString())) continue
          if (purchase.status !== 'pending') continue

          purchase.status = 'active'
          purchase.payment = {
            ...(purchase.payment || {}),
            date: new Date(),
            method: 'payment_link',
            reference: transactionData.transactionId,
            transactionId: transactionData.transactionId
          }
          activatedPurchases.push(purchase)
        }

        if (activatedPurchases.length) {
          targetPartner.subscription.status = 'active'
          await targetPartner.save()

          for (const purchase of activatedPurchases) {
            try {
              const { createInvoice } =
                await import('#modules/subscriptionInvoice/subscriptionInvoice.service.js')
              const invoice = await createInvoice(targetPartner._id, purchase, null)
              if (invoice && !purchase.invoice) {
                purchase.invoice = invoice._id
              }
            } catch (invErr) {
              logger.error(
                'Failed to create subscription invoice from payment link:',
                invErr.message
              )
            }
          }
          if (activatedPurchases.some(p => p.invoice)) {
            await targetPartner.save()
          }

          logger.info(
            `${activatedPurchases.length} subscription purchases activated via payment link ${paymentLink.linkNumber}`
          )
        }
      }
    } catch (subErr) {
      logger.error('Failed to complete subscription via payment link:', subErr.message)
    }
  }

  // If linked to an existing Payment record, update it ATOMICALLY
  if (paymentLink.linkedPayment) {
    try {
      // ATOMIC: Only update if status is still pending - prevents race condition
      const payment = await Payment.findOneAndUpdate(
        {
          _id: paymentLink.linkedPayment,
          status: 'pending' // Only update if still pending
        },
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
            'cardDetails.gatewayStatus': 'completed',
            'cardDetails.gatewayTransactionId': transactionData.transactionId,
            'cardDetails.paymentLinkId': paymentLink._id,
            'cardDetails.gatewayResponse': {
              authCode: transactionData.authCode,
              refNumber: transactionData.refNumber,
              provisionNumber: transactionData.provisionNumber,
              maskedCard: transactionData.maskedCard,
              lastFour: transactionData.lastFour,
              brand: transactionData.brand,
              cardType: transactionData.cardType,
              cardFamily: transactionData.cardFamily,
              cardBank: transactionData.cardBank,
              installment: transactionData.installment,
              amount: paymentLink.amount
            },
            'cardDetails.processedAt': new Date(),
            'cardDetails.lastFour': transactionData.lastFour,
            'cardDetails.brand': transactionData.brand,
            'cardDetails.cardFamily': transactionData.cardFamily,
            'cardDetails.bankName': transactionData.cardBank,
            'cardDetails.installment': transactionData.installment || 1,
            // Commission data from payment gateway
            ...(transactionData.commission && {
              commission: {
                bankRate: transactionData.commission.bankRate,
                bankAmount: transactionData.commission.bankAmount,
                platformRate: transactionData.commission.platformRate,
                platformAmount: transactionData.commission.platformAmount,
                totalRate: transactionData.commission.totalRate,
                totalAmount: transactionData.commission.totalAmount,
                netAmount: transactionData.commission.netAmount
              }
            })
          }
        },
        { new: true }
      )

      if (payment) {
        // Update booking payment summary
        if (payment.booking) {
          const { updateBookingPayment } = await import('../booking/payment.service.js')
          await updateBookingPayment(payment.booking)
        }
        logger.info(
          `Linked Payment ${payment._id} completed via payment link ${paymentLink.linkNumber}`
        )
      } else {
        // Payment was already processed by another webhook
        logger.info(`Linked Payment ${paymentLink.linkedPayment} already processed, skipping`)
      }
    } catch (paymentError) {
      logger.error('Failed to update linked payment:', paymentError.message)
    }
  }

  res.json({
    success: true,
    message: 'Payment recorded successfully'
  })
})

// ===== Subscription payment-link creation (internal helper) =====

/**
 * Create a payment link for a subscription purchase (package or service).
 * Called by my.service or admin billing when partner chooses payment-link flow.
 */
export const createSubscriptionPaymentLink = async ({ partner, purchase, createdBy }) => {
  const purpose =
    purchase.type === 'package_subscription' ? 'subscription_package' : 'subscription_service'
  const lang = 'tr'
  const description = purchase.label?.[lang] || purchase.label?.en || 'Subscription'

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const link = await PaymentLink.create({
    partner: null, // platform-level – subscription payments are platform receipts
    purpose,
    customer: {
      name: partner.companyName,
      email: partner.email,
      phone: partner.phone
    },
    description: `Abonelik: ${description}`,
    amount: purchase.price.amount,
    currency: 'EUR',
    expiresAt,
    subscriptionContext: {
      targetPartner: partner._id,
      purchaseId: purchase._id,
      package: purchase.package || undefined,
      service: purchase.service || undefined
    },
    createdBy
  })

  return link
}
