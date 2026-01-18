import PaymentLink from './paymentLink.model.js'
import Partner from '../partner/partner.model.js'
import Booking from '../booking/booking.model.js'
import ShortUrl from '../shortUrl/shortUrl.model.js'
import { NotFoundError, BadRequestError, ConflictError } from '#core/errors.js'
import { asyncHandler, getEffectivePartnerId } from '#helpers'
import logger from '#core/logger.js'
import notificationService from '#services/notificationService.js'
import paymentGateway from '#services/paymentGateway.js'

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
        $or: [
          { partner: null },
          { partner: { $exists: false } }
        ]
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

  // Search filter
  if (search) {
    conditions.push({
      $or: [
        { linkNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
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

  // Pagination
  const skip = (page - 1) * limit
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
    .limit(parseInt(limit))

  res.json({
    success: true,
    data: {
      items: paymentLinks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
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
    if (!paymentLink.partner || paymentLink.partner._id.toString() !== req.user.accountId.toString()) {
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

  // Calculate expiry date (default 30 days)
  const expiresAt = req.body.expiresAt
    ? new Date(req.body.expiresAt)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

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
    amount: req.body.amount,
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
        paymentLink.expiresAt = new Date(req.body.expiresAt)
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
  const paymentLink = await PaymentLink.findById(req.params.id)
    .populate('partner', 'companyName branding')

  if (!paymentLink) {
    throw new NotFoundError('PAYMENT_LINK_NOT_FOUND')
  }

  // Check ownership - STRICT SEPARATION
  if (req.user.accountType === 'partner') {
    if (!paymentLink.partner || paymentLink.partner._id.toString() !== req.user.accountId.toString()) {
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

/**
 * Helper: Send payment link notification
 */
async function sendPaymentLinkNotification(paymentLink, partner, channels = {}) {
  const { email = true, sms = false } = channels
  const result = { email: null, sms: null }

  // Default company info for platform-level links
  const companyName = partner?.companyName || process.env.PLATFORM_NAME || 'MiniRes'
  const companyLogo = partner?.branding?.logo || null

  // E-posta için uzun URL kullan
  // Template variable isimleri büyük harfli olmalı
  const formattedAmount = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(paymentLink.amount)
  const currencySymbol = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }[paymentLink.currency] || paymentLink.currency
  const formattedExpiry = new Date(paymentLink.expiresAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Site ve support bilgileri
  const siteUrl = partner?.branding?.website || process.env.FRONTEND_URL || 'https://app.minires.com'
  const supportEmail = partner?.supportEmail || process.env.SUPPORT_EMAIL || 'destek@minires.com'

  // Logo URL - tam URL olmalı
  let logoUrl = ''
  if (companyLogo) {
    if (companyLogo.startsWith('http')) {
      logoUrl = companyLogo
    } else {
      const apiUrl = process.env.API_URL || 'https://api.minires.com'
      logoUrl = `${apiUrl}${companyLogo}`
    }
  }

  const notificationData = {
    // Büyük harfli template değişkenleri
    CUSTOMER_NAME: paymentLink.customer.name,
    DESCRIPTION: paymentLink.description,
    AMOUNT: `${currencySymbol}${formattedAmount}`,
    CURRENCY: paymentLink.currency,
    PAYMENT_URL: paymentLink.paymentUrl,
    EXPIRY_DATE: formattedExpiry,
    COMPANY_NAME: companyName,
    LOGO_URL: logoUrl,
    SITE_URL: siteUrl,
    SUPPORT_EMAIL: supportEmail,
    // Küçük harfli değişkenler de gönder (SMS için)
    customerName: paymentLink.customer.name,
    description: paymentLink.description,
    amount: paymentLink.amount,
    currency: paymentLink.currency,
    paymentUrl: paymentLink.paymentUrl,
    expiresAt: paymentLink.expiresAt,
    companyName,
    companyLogo
  }

  // Send email notification
  if (email && paymentLink.customer.email) {
    try {
      const emailResult = await notificationService.send({
        type: 'payment_link',
        recipient: {
          email: paymentLink.customer.email,
          name: paymentLink.customer.name
        },
        data: {
          subject: `Ödeme Linki - ${companyName}`,
          ...notificationData
        },
        channels: ['email'],
        partnerId: partner?._id,
        relatedTo: { model: 'PaymentLink', id: paymentLink._id }
      })

      result.email = emailResult
      await paymentLink.recordNotification('email')
    } catch (error) {
      logger.error('Payment link email failed:', error.message)
      result.email = { success: false, error: error.message }
    }
  }

  // Send SMS notification with SHORT URL
  if (sms && paymentLink.customer.phone) {
    try {
      // SMS için kısa URL oluştur
      const shortUrl = await ShortUrl.createShortUrl({
        originalUrl: paymentLink.paymentUrl,
        type: 'payment_link',
        relatedId: paymentLink._id,
        partner: partner?._id,
        expiresAt: paymentLink.expiresAt
      })

      logger.info('Short URL created for payment link:', {
        linkNumber: paymentLink.linkNumber,
        shortUrl: shortUrl.shortUrl
      })

      // SMS için kısa URL'li data
      const smsData = {
        ...notificationData,
        paymentUrl: shortUrl.shortUrl // Kısa URL kullan
      }

      const smsResult = await notificationService.send({
        type: 'payment_link',
        recipient: {
          phone: paymentLink.customer.phone,
          name: paymentLink.customer.name
        },
        data: smsData,
        channels: ['sms'],
        partnerId: partner?._id,
        relatedTo: { model: 'PaymentLink', id: paymentLink._id }
      })

      result.sms = smsResult
      await paymentLink.recordNotification('sms')
    } catch (error) {
      logger.error('Payment link SMS failed:', error.message)
      result.sms = { success: false, error: error.message }
    }
  }

  return result
}

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

  // Check if expired
  if (paymentLink.expiresAt < new Date() && paymentLink.status === 'pending') {
    paymentLink.status = 'expired'
    await paymentLink.save()
  }

  // Cannot proceed with cancelled or expired links
  if (['cancelled', 'expired'].includes(paymentLink.status)) {
    return res.json({
      success: true,
      data: {
        status: paymentLink.status,
        message: paymentLink.status === 'expired'
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
      partner: paymentLink.partner ? {
        companyName: paymentLink.partner.companyName,
        branding: paymentLink.partner.branding
      } : null
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
 */
export const completePaymentLink = asyncHandler(async (req, res) => {
  const { token } = req.params
  const transactionData = req.body

  logger.info('completePaymentLink called:', { token, transactionData })

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

  // If linked to a booking, update booking payment status
  if (paymentLink.booking) {
    try {
      const booking = await Booking.findById(paymentLink.booking)
      if (booking) {
        // Add payment record to booking
        booking.payments = booking.payments || []
        booking.payments.push({
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          method: 'credit_card',
          status: 'completed',
          transactionId: transactionData.transactionId,
          paidAt: new Date(),
          source: 'payment_link',
          paymentLinkId: paymentLink._id
        })
        await booking.save()
        logger.info(`Booking ${booking.bookingNumber} payment updated via payment link`)
      }
    } catch (bookingError) {
      logger.error('Failed to update booking payment:', bookingError.message)
    }
  }

  res.json({
    success: true,
    message: 'Payment recorded successfully'
  })
})
