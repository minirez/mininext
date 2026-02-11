/**
 * Public Payment Service
 * Payment endpoints for B2C widget (no authentication required)
 */

import { asyncHandler } from '#helpers'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import Hotel from '../hotel/hotel.model.js'
import Booking from '../booking/booking.model.js'
import Payment from '../booking/payment.model.js'
import paymentGateway from '#services/paymentGateway.js'
import { convertCurrency } from '#services/currencyService.js'
import logger from '#core/logger.js'
import { DEFAULT_GUEST_DISPLAY_NAME } from '#constants/defaults.js'

/**
 * Helper: Get hotel by slug or ID
 * @private
 */
async function getHotelByCode(hotelCode) {
  const query = { status: 'active', 'visibility.b2c': true }
  if (hotelCode.match(/^[0-9a-fA-F]{24}$/)) {
    query._id = hotelCode
  } else {
    query.slug = hotelCode.toLowerCase()
  }
  return Hotel.findOne(query).select('_id partner widgetConfig').lean()
}

/**
 * Helper: Build payment form URL based on environment
 * @private
 */
function getPaymentFormUrl(transactionId, req) {
  const host = req.get('host') || ''
  // Development
  if (host.includes('mini.com') || host.includes('localhost')) {
    return `https://payment.mini.com/payment/${transactionId}/form`
  }
  // Production
  return `https://payment.maxirez.com/payment/${transactionId}/form`
}

/**
 * Query BIN for installment options (public, no auth)
 * POST /public/payment/bin
 * Body: { hotelCode, bin, amount, currency }
 */
export const queryBinPublic = asyncHandler(async (req, res) => {
  const { hotelCode, bin, amount, currency = 'TRY' } = req.body

  // Validate
  if (!hotelCode) {
    throw new BadRequestError('HOTEL_CODE_REQUIRED')
  }

  if (!bin || bin.length < 6) {
    throw new BadRequestError('BIN numarası en az 6 karakter olmalı')
  }

  if (!amount || amount <= 0) {
    throw new BadRequestError('Geçerli bir tutar belirtilmeli')
  }

  // Get hotel for partner ID
  const hotel = await getHotelByCode(hotelCode)
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Check if credit card payments are enabled
  if (hotel.widgetConfig?.paymentMethods?.creditCard === false) {
    throw new BadRequestError('CREDIT_CARD_PAYMENT_DISABLED')
  }

  const partnerId = hotel.partner?.toString()
  const currencyUpper = currency.toUpperCase()
  const currencyLower = currency.toLowerCase()

  let result
  let currencyConversion = null

  if (currencyUpper === 'TRY') {
    // Already TRY, no conversion needed
    result = await paymentGateway.queryBin(bin, amount, 'try', partnerId)
  } else {
    // Foreign currency - try original first, check if domestic card
    try {
      result = await paymentGateway.queryBin(bin, amount, currencyLower, partnerId)

      // Check if domestic (TR) card → needs TRY conversion
      if (result.card?.country?.toLowerCase() === 'tr') {
        logger.debug(
          '[Public Payment] Domestic card detected, converting',
          amount,
          currencyUpper,
          '→ TRY'
        )
        const conversion = await convertCurrency(amount, currencyUpper, 'TRY')
        currencyConversion = {
          originalCurrency: currencyUpper,
          originalAmount: amount,
          convertedCurrency: 'TRY',
          convertedAmount: conversion.convertedAmount,
          exchangeRate: conversion.rate
        }

        // Re-query with TRY for correct POS & installments
        result = await paymentGateway.queryBin(bin, conversion.convertedAmount, 'try', partnerId)
        result.currencyConversion = currencyConversion
      }
    } catch (err) {
      // No POS for original currency - try TRY as fallback
      logger.debug(
        '[Public Payment] BIN query with',
        currencyUpper,
        'failed, trying TRY fallback:',
        err.message
      )

      const conversion = await convertCurrency(amount, currencyUpper, 'TRY')

      result = await paymentGateway.queryBin(bin, conversion.convertedAmount, 'try', partnerId)

      // Only convert if domestic card, otherwise foreign card has no suitable POS
      if (result.card?.country?.toLowerCase() === 'tr') {
        currencyConversion = {
          originalCurrency: currencyUpper,
          originalAmount: amount,
          convertedCurrency: 'TRY',
          convertedAmount: conversion.convertedAmount,
          exchangeRate: conversion.rate
        }
        result.currencyConversion = currencyConversion
      } else {
        throw new BadRequestError('Bu para birimi için uygun ödeme yöntemi bulunamadı')
      }
    }
  }

  res.json({
    success: true,
    data: result
  })
})

/**
 * Initiate payment for a booking (public)
 * POST /public/bookings/:bookingNumber/pay
 * Body: { email, posId, installment, card: { holder, number, expiry, cvv } }
 */
export const initiateBookingPayment = asyncHandler(async (req, res) => {
  const { bookingNumber } = req.params
  const { email, posId, installment, card } = req.body

  // Validate card
  if (!card || !card.holder || !card.number || !card.expiry || !card.cvv) {
    throw new BadRequestError('Geçersiz kart bilgileri')
  }

  if (!email) {
    throw new BadRequestError('E-posta adresi gerekli')
  }

  // Find booking by number and verify email
  const booking = await Booking.findOne({ bookingNumber })
    .populate('hotel', 'partner widgetConfig')
    .select('partner hotel contact pricing payment status leadGuest')

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Verify email matches
  if (booking.contact?.email?.toLowerCase() !== email.toLowerCase()) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Check booking status - only pending/confirmed with remaining balance
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new BadRequestError('Bu rezervasyon için ödeme yapılamaz')
  }

  // Check if credit card payments are enabled for this hotel
  if (booking.hotel?.widgetConfig?.paymentMethods?.creditCard === false) {
    throw new BadRequestError('CREDIT_CARD_PAYMENT_DISABLED')
  }

  // Calculate remaining amount
  const grandTotal = booking.pricing?.grandTotal || 0
  const paidAmount = booking.payment?.paidAmount || 0
  const remainingAmount = grandTotal - paidAmount

  if (remainingAmount <= 0) {
    throw new BadRequestError('Bu rezervasyon için ödeme yapılmış')
  }

  // Check if domestic (TR) card needs currency conversion
  const bookingCurrency = booking.pricing?.currency || 'TRY'
  let paymentAmount = remainingAmount
  let paymentCurrency = bookingCurrency
  let currencyConversion = null

  if (bookingCurrency.toUpperCase() !== 'TRY') {
    // Check card country via BIN query (try original currency, fallback to TRY)
    const cardBin = card.number.replace(/\s/g, '').slice(0, 8)
    let cardCountry = null
    try {
      const binCheck = await paymentGateway.queryBin(
        cardBin,
        remainingAmount,
        bookingCurrency.toLowerCase(),
        booking.partner?.toString()
      )
      cardCountry = binCheck?.card?.country?.toLowerCase() || null
    } catch (err) {
      // No POS for original currency - try TRY to get card info
      try {
        const tryBinCheck = await paymentGateway.queryBin(
          cardBin,
          remainingAmount,
          'try',
          booking.partner?.toString()
        )
        cardCountry = tryBinCheck?.card?.country?.toLowerCase() || null
      } catch (err2) {
        logger.debug('[Public Payment] BIN check for payment failed:', err2.message)
      }
    }

    if (cardCountry === 'tr') {
      // Domestic card with foreign currency → convert to TRY
      const conversion = await convertCurrency(
        remainingAmount,
        bookingCurrency.toUpperCase(),
        'TRY'
      )
      paymentAmount = conversion.convertedAmount
      paymentCurrency = 'TRY'
      currencyConversion = {
        originalCurrency: bookingCurrency.toUpperCase(),
        originalAmount: remainingAmount,
        convertedCurrency: 'TRY',
        convertedAmount: conversion.convertedAmount,
        exchangeRate: conversion.rate
      }
    }
  }

  // Create payment record
  const payment = new Payment({
    partner: booking.partner,
    booking: booking._id,
    type: 'credit_card',
    amount: paymentAmount,
    currency: paymentCurrency,
    notes: currencyConversion
      ? `Widget ile online ödeme (${currencyConversion.originalAmount} ${currencyConversion.originalCurrency} → ${paymentAmount} TRY, kur: ${currencyConversion.exchangeRate})`
      : 'Widget ile online ödeme',
    source: 'widget'
  })

  await payment.save()

  // Prepare customer info
  const customerInfo = {
    name:
      `${booking.leadGuest?.firstName || ''} ${booking.leadGuest?.lastName || ''}`.trim() ||
      DEFAULT_GUEST_DISPLAY_NAME,
    email: booking.contact?.email,
    phone: booking.contact?.phone,
    ip: req.ip || req.connection?.remoteAddress
  }

  // Process payment through gateway
  const result = await paymentGateway.processPayment({
    posId,
    amount: paymentAmount,
    currency: paymentCurrency.toLowerCase(),
    installment: installment || 1,
    card: {
      holder: card.holder,
      number: card.number.replace(/\s/g, ''),
      expiry: card.expiry,
      cvv: card.cvv
    },
    customer: customerInfo,
    externalId: payment._id.toString(),
    partnerId: booking.partner?.toString()
  })

  if (!result.success) {
    // Mark payment as failed
    payment.status = 'failed'
    payment.cardDetails = {
      gatewayStatus: 'failed',
      gatewayResponse: { error: result.error }
    }
    await payment.save()
    throw new BadRequestError(result.error || 'Ödeme işlemi başarısız')
  }

  // 3D Secure is mandatory in Turkey
  const requires3D = result.requires3D !== false
  const formUrl = requires3D ? getPaymentFormUrl(result.transactionId, req) : null

  // Get BIN info for card details
  const binInfo = await paymentGateway
    .queryBin(
      card.number.slice(0, 8),
      payment.amount,
      payment.currency.toLowerCase(),
      booking.partner?.toString()
    )
    .catch(() => null)

  // Update payment with transaction info
  payment.cardDetails = {
    gatewayTransactionId: result.transactionId,
    gatewayStatus: requires3D ? 'requires_3d' : 'processing',
    posId: result.posId,
    posName: result.posName,
    requires3D,
    formUrl,
    lastFour: card.number.slice(-4),
    brand: binInfo?.card?.brand || null,
    cardFamily: binInfo?.card?.cardFamily || null,
    bankName: binInfo?.card?.bankName || null,
    installment: installment || 1,
    ...(currencyConversion && { currencyConversion })
  }
  await payment.save()

  logger.info('[Public Payment] Payment initiated:', {
    bookingNumber,
    paymentId: payment._id,
    transactionId: result.transactionId,
    requires3D,
    ...(currencyConversion && { currencyConversion })
  })

  res.json({
    success: true,
    data: {
      paymentId: payment._id,
      transactionId: result.transactionId,
      requires3D,
      formUrl,
      status: requires3D ? 'requires_3d' : 'processing'
    }
  })
})

/**
 * Check payment status (public)
 * GET /public/bookings/:bookingNumber/payment-status
 * Query: { email, paymentId }
 */
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const { bookingNumber } = req.params
  const { email, paymentId } = req.query

  if (!email) {
    throw new BadRequestError('E-posta adresi gerekli')
  }

  // Find booking and verify email
  const booking = await Booking.findOne({ bookingNumber }).select('contact payment pricing status')

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Verify email matches
  if (booking.contact?.email?.toLowerCase() !== email.toLowerCase()) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // If paymentId provided, get specific payment
  if (paymentId) {
    const payment = await Payment.findOne({
      _id: paymentId,
      booking: booking._id
    }).select('status type amount currency cardDetails createdAt completedAt')

    if (!payment) {
      throw new NotFoundError('PAYMENT_NOT_FOUND')
    }

    // If payment has a gateway transaction, check status
    if (payment.cardDetails?.gatewayTransactionId && payment.status === 'pending') {
      try {
        const gatewayResult = await paymentGateway.getTransactionStatus(
          payment.cardDetails.gatewayTransactionId
        )

        if (gatewayResult.transaction) {
          const txStatus = gatewayResult.transaction.status

          if (txStatus === 'completed' && payment.status !== 'completed') {
            // Update payment status
            payment.status = 'completed'
            payment.completedAt = new Date()
            payment.cardDetails.gatewayStatus = 'completed'
            payment.cardDetails.gatewayResponse = gatewayResult.transaction
            await payment.save()

            // Update booking payment
            const { updateBookingPayment } = await import('../booking/payment.service.js')
            await updateBookingPayment(booking._id)
          } else if (txStatus === 'failed' && payment.status !== 'failed') {
            payment.status = 'failed'
            payment.cardDetails.gatewayStatus = 'failed'
            payment.cardDetails.gatewayResponse = {
              error: gatewayResult.transaction.error || 'Payment failed'
            }
            await payment.save()
          }
        }
      } catch (error) {
        logger.warn('[Public Payment] Failed to check gateway status:', error.message)
      }
    }

    return res.json({
      success: true,
      data: {
        payment: {
          id: payment._id,
          status: payment.status,
          type: payment.type,
          amount: payment.amount,
          currency: payment.currency,
          cardDetails: payment.cardDetails
            ? {
                lastFour: payment.cardDetails.lastFour,
                brand: payment.cardDetails.brand,
                installment: payment.cardDetails.installment
              }
            : null,
          completedAt: payment.completedAt
        },
        booking: {
          status: booking.status,
          grandTotal: booking.pricing?.grandTotal,
          paidAmount: booking.payment?.paidAmount,
          remainingAmount: (booking.pricing?.grandTotal || 0) - (booking.payment?.paidAmount || 0)
        }
      }
    })
  }

  // Return overall payment summary
  const payments = await Payment.find({ booking: booking._id })
    .select('status type amount currency cardDetails createdAt completedAt')
    .sort({ createdAt: -1 })

  res.json({
    success: true,
    data: {
      booking: {
        bookingNumber,
        status: booking.status,
        grandTotal: booking.pricing?.grandTotal,
        paidAmount: booking.payment?.paidAmount,
        remainingAmount: (booking.pricing?.grandTotal || 0) - (booking.payment?.paidAmount || 0),
        currency: booking.pricing?.currency
      },
      payments: payments.map(p => ({
        id: p._id,
        status: p.status,
        type: p.type,
        amount: p.amount,
        currency: p.currency,
        cardDetails: p.cardDetails
          ? {
              lastFour: p.cardDetails.lastFour,
              brand: p.cardDetails.brand,
              installment: p.cardDetails.installment
            }
          : null,
        completedAt: p.completedAt,
        createdAt: p.createdAt
      }))
    }
  })
})

/**
 * Get payment methods for a hotel (public)
 * GET /public/hotels/:hotelCode/payment-methods
 */
export const getPaymentMethods = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params

  const hotel = await getHotelByCode(hotelCode)
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  const paymentMethods = hotel.widgetConfig?.paymentMethods || {
    creditCard: true,
    payAtHotel: true,
    bankTransfer: false
  }

  // Get default installment rates if credit card is enabled
  let installmentInfo = null
  if (paymentMethods.creditCard) {
    try {
      const rates = await paymentGateway.getDefaultRates(
        hotel.partner?.toString(),
        'try' // Default to TRY
      )
      installmentInfo = rates.defaultRates || null
    } catch (error) {
      logger.warn('[Public Payment] Failed to get installment rates:', error.message)
    }
  }

  res.json({
    success: true,
    data: {
      methods: paymentMethods,
      installment: installmentInfo
    }
  })
})

/**
 * 3D Secure callback handler (redirect after bank verification)
 * This is called by the bank after 3D Secure verification
 * GET/POST /public/payment/callback
 */
export const payment3DCallback = asyncHandler(async (req, res) => {
  // Get params from query or body (banks may use GET or POST)
  const params = { ...req.query, ...req.body }
  const { transactionId, status, paymentId } = params

  logger.info('[Public Payment] 3D Callback received:', { transactionId, status, paymentId })

  // Find payment by transaction ID or payment ID
  let payment
  if (paymentId) {
    payment = await Payment.findById(paymentId).populate('booking', 'bookingNumber')
  } else if (transactionId) {
    payment = await Payment.findOne({
      'cardDetails.gatewayTransactionId': transactionId
    }).populate('booking', 'bookingNumber')
  }

  if (!payment) {
    // Redirect to error page
    return res.redirect('/payment-error?reason=payment_not_found')
  }

  const bookingNumber = payment.booking?.bookingNumber

  // Check payment status from gateway
  try {
    const gatewayResult = await paymentGateway.getTransactionStatus(
      payment.cardDetails.gatewayTransactionId
    )

    if (gatewayResult.transaction?.status === 'completed') {
      // Payment successful - redirect to success page
      return res.redirect(`/payment-success?booking=${bookingNumber}`)
    } else if (gatewayResult.transaction?.status === 'failed') {
      // Payment failed - redirect to error page
      return res.redirect(`/payment-error?booking=${bookingNumber}&reason=payment_failed`)
    }
  } catch (error) {
    logger.error('[Public Payment] 3D callback error:', error.message)
  }

  // Default redirect - let client check status
  res.redirect(`/payment-result?booking=${bookingNumber}&payment=${payment._id}`)
})
