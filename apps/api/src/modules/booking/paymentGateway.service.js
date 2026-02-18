import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import Payment from './payment.model.js'
import Booking from './booking.model.js'
import Partner from '#modules/partner/partner.model.js'
import paymentGateway from '#services/paymentGateway.js'
import { convertCurrency } from '#services/currencyService.js'
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
  const partnerId =
    req.user.accountType === 'platform'
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

  // Check if partner uses own POS (no platform fallback)
  const token = req.headers.authorization?.split(' ')[1]
  let noFallback = false
  if (partnerId) {
    const partnerDoc = await Partner.findById(partnerId).select('paymentSettings.useOwnPos').lean()
    noFallback = partnerDoc?.paymentSettings?.useOwnPos === true
  }
  const queryOpts = { noFallback }

  const currencyUpper = currency.toUpperCase()
  const currencyLower = currency.toLowerCase()

  let result
  let currencyConversion = null

  if (currencyUpper === 'TRY') {
    try {
      result = await paymentGateway.queryBin(
        bin,
        amount,
        'try',
        partnerId?.toString(),
        token,
        queryOpts
      )
    } catch (err) {
      throw new BadRequestError(err.message || 'BIN_QUERY_FAILED')
    }
  } else {
    // Foreign currency - check if domestic (TR) card needs TRY conversion
    try {
      result = await paymentGateway.queryBin(
        bin,
        amount,
        currencyLower,
        partnerId?.toString(),
        token,
        queryOpts
      )

      // Card is likely domestic if country is 'tr' or card info is unreliable
      const cardCountry = result.card?.country?.toLowerCase() || ''
      const hasReliableBankInfo = result.card?.bankCode && result.card?.bank !== 'Unknown'
      const isLikelyDomestic = cardCountry === 'tr' || !hasReliableBankInfo

      if (isLikelyDomestic) {
        const conversion = await convertCurrency(amount, currencyUpper, 'TRY')
        currencyConversion = {
          originalCurrency: currencyUpper,
          originalAmount: amount,
          convertedCurrency: 'TRY',
          convertedAmount: conversion.convertedAmount,
          exchangeRate: conversion.rate
        }
        result = await paymentGateway.queryBin(
          bin,
          conversion.convertedAmount,
          'try',
          partnerId?.toString(),
          token,
          queryOpts
        )
        result.currencyConversion = currencyConversion
      }
    } catch (err) {
      // No POS for original currency - try TRY fallback
      const conversion = await convertCurrency(amount, currencyUpper, 'TRY')
      result = await paymentGateway.queryBin(
        bin,
        conversion.convertedAmount,
        'try',
        partnerId?.toString(),
        token,
        queryOpts
      )

      const cardCountry = result.card?.country?.toLowerCase() || ''
      const hasReliableBankInfo = result.card?.bankCode && result.card?.bank !== 'Unknown'
      const isLikelyDomestic = cardCountry === 'tr' || !hasReliableBankInfo

      if (isLikelyDomestic) {
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
 * Query card BIN for installment options (Booking-based)
 * Includes DCC: TR cards with foreign currency are converted to TRY
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

  // Check if partner uses own POS (no platform fallback)
  const token = req.headers.authorization?.split(' ')[1]
  let noFallbackBin = false
  if (partnerId) {
    const partnerDoc = await Partner.findById(partnerId).select('paymentSettings.useOwnPos').lean()
    noFallbackBin = partnerDoc?.paymentSettings?.useOwnPos === true
  }
  const queryOpts = { noFallback: noFallbackBin }

  const currencyUpper = payment.currency.toUpperCase()
  const currencyLower = payment.currency.toLowerCase()

  let result
  let currencyConversion = null

  if (currencyUpper === 'TRY') {
    result = await paymentGateway.queryBin(
      bin,
      payment.amount,
      'try',
      partnerId?.toString(),
      token,
      queryOpts
    )
  } else {
    // Foreign currency - check if domestic (TR) card needs TRY conversion
    try {
      result = await paymentGateway.queryBin(
        bin,
        payment.amount,
        currencyLower,
        partnerId?.toString(),
        token,
        queryOpts
      )

      const cardCountry = result.card?.country?.toLowerCase() || ''
      const hasReliableBankInfo = result.card?.bankCode && result.card?.bank !== 'Unknown'
      const isLikelyDomestic = cardCountry === 'tr' || !hasReliableBankInfo

      if (isLikelyDomestic) {
        const conversion = await convertCurrency(payment.amount, currencyUpper, 'TRY')
        currencyConversion = {
          originalCurrency: currencyUpper,
          originalAmount: payment.amount,
          convertedCurrency: 'TRY',
          convertedAmount: conversion.convertedAmount,
          exchangeRate: conversion.rate
        }
        result = await paymentGateway.queryBin(
          bin,
          conversion.convertedAmount,
          'try',
          partnerId?.toString(),
          token,
          queryOpts
        )
        result.currencyConversion = currencyConversion
      }
    } catch (err) {
      // No POS for original currency - try TRY fallback
      const conversion = await convertCurrency(payment.amount, currencyUpper, 'TRY')
      result = await paymentGateway.queryBin(
        bin,
        conversion.convertedAmount,
        'try',
        partnerId?.toString(),
        token,
        queryOpts
      )

      const cardCountry = result.card?.country?.toLowerCase() || ''
      const hasReliableBankInfo = result.card?.bankCode && result.card?.bank !== 'Unknown'
      const isLikelyDomestic = cardCountry === 'tr' || !hasReliableBankInfo

      if (isLikelyDomestic) {
        currencyConversion = {
          originalCurrency: currencyUpper,
          originalAmount: payment.amount,
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
 * Process credit card payment
 * Includes DCC: TR cards with foreign currency are converted to TRY
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
    customerInfo.name =
      customerInfo.name ||
      `${payment.booking.leadGuest.firstName} ${payment.booking.leadGuest.lastName}`
    customerInfo.email = customerInfo.email || payment.booking.leadGuest.email
    customerInfo.phone = customerInfo.phone || payment.booking.leadGuest.phone
  }
  customerInfo.ip = req.ip || req.connection?.remoteAddress

  // DCC: Check if domestic (TR) card needs currency conversion
  const token = req.headers.authorization?.split(' ')[1]
  let noFallbackPay = false
  if (partnerId) {
    const partnerDocPay = await Partner.findById(partnerId)
      .select('paymentSettings.useOwnPos')
      .lean()
    noFallbackPay = partnerDocPay?.paymentSettings?.useOwnPos === true
  }
  const payQueryOpts = { noFallback: noFallbackPay }

  const currencyUpper = payment.currency.toUpperCase()
  let paymentAmount = payment.amount
  let paymentCurrency = payment.currency
  let currencyConversion = null

  if (currencyUpper !== 'TRY') {
    // Check card country via BIN query
    const cardBin = card.number.replace(/\s/g, '').slice(0, 8)
    let cardCountry = null
    let hasReliableBankInfo = false
    try {
      const binCheck = await paymentGateway.queryBin(
        cardBin,
        payment.amount,
        payment.currency.toLowerCase(),
        partnerId?.toString(),
        token,
        payQueryOpts
      )
      cardCountry = binCheck?.card?.country?.toLowerCase() || null
      hasReliableBankInfo = !!(binCheck?.card?.bankCode && binCheck?.card?.bank !== 'Unknown')
    } catch (err) {
      // No POS for original currency - try TRY to get card info
      try {
        const tryBinCheck = await paymentGateway.queryBin(
          cardBin,
          payment.amount,
          'try',
          partnerId?.toString(),
          token,
          payQueryOpts
        )
        cardCountry = tryBinCheck?.card?.country?.toLowerCase() || null
        hasReliableBankInfo = !!(
          tryBinCheck?.card?.bankCode && tryBinCheck?.card?.bank !== 'Unknown'
        )
      } catch (err2) {
        logger.debug('[B2B Payment] BIN check for DCC failed:', err2.message)
      }
    }

    // Card is likely domestic if country is 'tr' or card info is unreliable
    const isLikelyDomestic = cardCountry === 'tr' || !hasReliableBankInfo

    if (isLikelyDomestic) {
      // Domestic card with foreign currency → convert to TRY
      const conversion = await convertCurrency(payment.amount, currencyUpper, 'TRY')
      paymentAmount = conversion.convertedAmount
      paymentCurrency = 'TRY'
      currencyConversion = {
        originalCurrency: currencyUpper,
        originalAmount: payment.amount,
        convertedCurrency: 'TRY',
        convertedAmount: conversion.convertedAmount,
        exchangeRate: conversion.rate
      }
      logger.info('[B2B Payment] DCC applied:', currencyConversion)

      // Update payment record with converted amount/currency
      payment.amount = paymentAmount
      payment.currency = paymentCurrency
      if (currencyConversion) {
        payment.notes = `B2B ödeme (${currencyConversion.originalAmount} ${currencyConversion.originalCurrency} → ${paymentAmount} TRY, kur: ${currencyConversion.exchangeRate})`
      }
      await payment.save()
    }
  }

  // Process payment through gateway
  let result
  try {
    result = await paymentGateway.processPayment(
      {
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
        partnerId: partnerId?.toString(),
        noFallback: noFallbackPay
      },
      token
    )
  } catch (err) {
    // Convert payment gateway errors to proper BadRequestError
    throw new BadRequestError(err.message || 'PAYMENT_FAILED')
  }

  if (!result.success) {
    throw new BadRequestError(result.error || 'PAYMENT_FAILED')
  }

  // In Turkey, 3D Secure is mandatory for all card transactions
  // If payment service doesn't return requires3D, assume true
  const requires3D = result.requires3D !== false // Default to true if undefined

  // Determine payment form URL based on request host
  const getFormUrl = transactionId => {
    if (!requires3D) return null
    const host = req.get('host') || ''
    if (host.includes('mini.com')) {
      return `https://payment.mini.com/payment/${transactionId}/form`
    }
    return `https://payment.maxirez.com/payment/${transactionId}/form`
  }

  const formUrl = getFormUrl(result.transactionId)

  // Get BIN info for card details
  const binInfo = await paymentGateway
    .queryBin(
      card.number.slice(0, 8),
      paymentAmount,
      paymentCurrency.toLowerCase(),
      partnerId?.toString(),
      token,
      payQueryOpts
    )
    .catch(() => null)

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
    installment: installment || 1,
    currencyConversion: currencyConversion
  })

  res.json({
    success: true,
    data: {
      transactionId: result.transactionId,
      requires3D: requires3D,
      formUrl: formUrl,
      status: requires3D ? 'requires_3d' : 'processing',
      ...(currencyConversion && { currencyConversion })
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
