import Partner from '#modules/partner/partner.model.js'
import MembershipPackage from '#modules/membership-package/membership-package.model.js'
import MembershipService from '#modules/membership-service/membership-service.model.js'
import SubscriptionInvoice from '#modules/subscriptionInvoice/subscriptionInvoice.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError, ForbiddenError, BadRequestError } from '#core/errors.js'
import { SUBSCRIPTION_PLANS, PLAN_TYPES } from '#constants/subscriptionPlans.js'
import { createInvoice } from '#modules/subscriptionInvoice/subscriptionInvoice.service.js'
import { convertCurrency } from '#services/currencyService.js'
import PDFDocument from 'pdfkit'
import axios from 'axios'
import logger from '#core/logger.js'

// Payment service URL
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:7043'

// Get my subscription info (for partner users)
export const getMySubscription = asyncHandler(async (req, res) => {
  // Only partner users can access this
  if (req.user.accountType !== 'partner') {
    throw new ForbiddenError('PARTNER_ONLY')
  }

  const partnerId = req.user.accountId
  const partner = await Partner.findById(partnerId)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const subscriptionStatus = partner.getSubscriptionStatus()
  const plan = SUBSCRIPTION_PLANS[subscriptionStatus.plan] || SUBSCRIPTION_PLANS.business

  // Get PMS usage
  const Hotel = (await import('#modules/hotel/hotel.model.js')).default
  const pmsHotelsCount = await Hotel.countDocuments({
    partner: partnerId,
    'pms.enabled': true
  })

  // Get purchases sorted by date (newest first)
  const purchases = (partner.subscription?.purchases || [])
    .map(p => ({
      _id: p._id,
      plan: p.plan,
      planName: SUBSCRIPTION_PLANS[p.plan]?.name || p.plan,
      status: p.status,
      period: p.period,
      price: p.price,
      payment: p.payment,
      invoice: p.invoice,
      createdAt: p.createdAt,
      cancelledAt: p.cancelledAt,
      cancellationReason: p.cancellationReason
    }))
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.period?.startDate) - new Date(a.createdAt || a.period?.startDate)
    )

  res.json({
    success: true,
    data: {
      plan: subscriptionStatus.plan,
      planName: plan.name,
      status: subscriptionStatus.status,
      startDate: subscriptionStatus.startDate,
      endDate: subscriptionStatus.endDate,
      renewalDate: subscriptionStatus.renewalDate,
      gracePeriodEndDate: subscriptionStatus.gracePeriodEndDate,
      remainingDays: subscriptionStatus.remainingDays,
      gracePeriodRemainingDays: subscriptionStatus.gracePeriodRemainingDays,
      paymentHistory: subscriptionStatus.paymentHistory,
      lastPayment: subscriptionStatus.lastPayment,
      // PMS info
      pmsEnabled: plan.pmsEnabled,
      pmsLimit: subscriptionStatus.customLimits?.pmsMaxHotels ?? plan.pmsMaxHotels,
      pmsUsed: pmsHotelsCount,
      // Plan features
      features: plan.features || [],
      // Purchases (for purchase history)
      purchases
    }
  })
})

// Get my invoices (for partner users)
export const getMyInvoices = asyncHandler(async (req, res) => {
  // Only partner users can access this
  if (req.user.accountType !== 'partner') {
    throw new ForbiddenError('PARTNER_ONLY')
  }

  const partnerId = req.user.accountId
  const { page = 1, limit = 20 } = req.query

  const invoices = await SubscriptionInvoice.find({ partner: partnerId })
    .sort({ invoiceDate: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))

  const total = await SubscriptionInvoice.countDocuments({ partner: partnerId })

  res.json({
    success: true,
    data: {
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

// Download my invoice PDF (for partner users)
export const downloadMyInvoicePDF = asyncHandler(async (req, res) => {
  // Only partner users can access this
  if (req.user.accountType !== 'partner') {
    throw new ForbiddenError('PARTNER_ONLY')
  }

  const partnerId = req.user.accountId
  const invoice = await SubscriptionInvoice.findOne({
    _id: req.params.id,
    partner: partnerId // Ensure partner can only access their own invoices
  }).populate('partner')

  if (!invoice) {
    throw new NotFoundError('INVOICE_NOT_FOUND')
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true
  })

  // Response headers
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)

  doc.pipe(res)

  // === PDF CONTENT ===

  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('FATURA / INVOICE', { align: 'center' })
  doc.moveDown(0.5)
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Fatura No: ${invoice.invoiceNumber}`, { align: 'center' })
  doc.text(`Tarih: ${invoice.invoiceDate.toLocaleDateString('tr-TR')}`, { align: 'center' })
  doc.moveDown(2)

  // Seller and Buyer Info (side by side)
  const startY = doc.y

  // Seller (Left)
  doc.fontSize(10).font('Helvetica-Bold').text('SATICI / SELLER', 50, startY)
  doc.font('Helvetica').fontSize(9)
  doc.text(invoice.seller.companyName || '-', 50, startY + 15)
  if (invoice.seller.taxNumber) {
    doc.text(`Vergi No: ${invoice.seller.taxNumber}`, 50)
  }
  if (invoice.seller.taxOffice) {
    doc.text(`Vergi Dairesi: ${invoice.seller.taxOffice}`, 50)
  }
  if (invoice.seller.address?.street) {
    doc.text(invoice.seller.address.street, 50)
    doc.text(`${invoice.seller.address.city || ''} ${invoice.seller.address.country || ''}`, 50)
  }
  if (invoice.seller.email) {
    doc.text(`Email: ${invoice.seller.email}`, 50)
  }
  if (invoice.seller.phone) {
    doc.text(`Tel: ${invoice.seller.phone}`, 50)
  }

  // Buyer (Right)
  doc.fontSize(10).font('Helvetica-Bold').text('ALICI / BUYER', 320, startY)
  doc.font('Helvetica').fontSize(9)
  doc.text(invoice.buyer.companyName || '-', 320, startY + 15)
  if (invoice.buyer.tradeName) {
    doc.text(invoice.buyer.tradeName, 320)
  }
  if (invoice.buyer.taxNumber) {
    doc.text(`Vergi No: ${invoice.buyer.taxNumber}`, 320)
  }
  if (invoice.buyer.taxOffice) {
    doc.text(`Vergi Dairesi: ${invoice.buyer.taxOffice}`, 320)
  }
  if (invoice.buyer.address?.street) {
    doc.text(invoice.buyer.address.street, 320)
    doc.text(`${invoice.buyer.address.city || ''} ${invoice.buyer.address.country || ''}`, 320)
  }
  if (invoice.buyer.email) {
    doc.text(`Email: ${invoice.buyer.email}`, 320)
  }

  doc.moveDown(5)

  // Table Header
  const tableTop = doc.y + 20
  doc.fontSize(9).font('Helvetica-Bold')
  doc.text('Aciklama / Description', 50, tableTop)
  doc.text('Miktar', 300, tableTop)
  doc.text('Birim Fiyat', 360, tableTop)
  doc.text('KDV', 440, tableTop)
  doc.text('Toplam', 490, tableTop)

  // Line
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke()

  // Items
  let y = tableTop + 25
  doc.font('Helvetica').fontSize(9)

  for (const item of invoice.lineItems) {
    doc.text(item.description, 50, y, { width: 240 })
    doc.text(item.quantity.toString(), 300, y)
    doc.text(`${item.unitPrice.toFixed(2)}`, 360, y)
    doc.text(`%${item.taxRate}`, 440, y)
    doc.text(`${item.total.toFixed(2)}`, 490, y)
    y += 20
  }

  // Bottom Line
  doc
    .moveTo(50, y + 5)
    .lineTo(550, y + 5)
    .stroke()

  // Totals (Bottom right)
  y += 20
  doc.font('Helvetica').fontSize(10)
  doc.text('Ara Toplam / Subtotal:', 380, y)
  doc.text(`${invoice.subtotal.toFixed(2)} ${invoice.currency}`, 490, y)

  if (invoice.taxAmount > 0) {
    y += 18
    doc.text(`KDV / VAT (%${invoice.taxRate}):`, 380, y)
    doc.text(`${invoice.taxAmount.toFixed(2)} ${invoice.currency}`, 490, y)
  }

  y += 25
  doc.font('Helvetica-Bold').fontSize(12)
  doc.text('GENEL TOPLAM / TOTAL:', 350, y)
  doc.text(`${invoice.total.toFixed(2)} ${invoice.currency}`, 490, y)

  // Payment Info
  if (invoice.status === 'paid') {
    y += 40
    doc.font('Helvetica').fontSize(10)
    doc.fillColor('green').text('ODENDI / PAID', 400, y)
    doc.fillColor('black')
    if (invoice.paidAt) {
      doc
        .fontSize(9)
        .text(`Odeme Tarihi: ${invoice.paidAt.toLocaleDateString('tr-TR')}`, 400, y + 15)
    }
    if (invoice.paymentReference) {
      doc.text(`Referans: ${invoice.paymentReference}`, 400, y + 28)
    }
  }

  // Subscription Period
  if (invoice.subscriptionPeriod?.startDate && invoice.subscriptionPeriod?.endDate) {
    y += 60
    doc.fontSize(9).font('Helvetica')
    doc.text('Abonelik Donemi / Subscription Period:', 50, y)
    doc.text(
      `${invoice.subscriptionPeriod.startDate.toLocaleDateString('tr-TR')} - ${invoice.subscriptionPeriod.endDate.toLocaleDateString('tr-TR')}`,
      50,
      y + 12
    )
  }

  // Notes
  if (invoice.notes) {
    doc.moveDown(3)
    doc.fontSize(9).font('Helvetica-Bold').text('Notlar / Notes:', 50)
    doc.font('Helvetica').text(invoice.notes, 50, doc.y + 5, { width: 500 })
  }

  // Footer
  doc
    .fontSize(8)
    .font('Helvetica')
    .text('Bu fatura elektronik ortamda olusturulmustur.', 50, 780, { align: 'center' })
  doc.text('This invoice was generated electronically.', 50, 792, { align: 'center' })

  doc.end()
})

// Query BIN for subscription payment
export const querySubscriptionBin = asyncHandler(async (req, res) => {
  // Only partner users can access this
  if (req.user.accountType !== 'partner') {
    throw new ForbiddenError('PARTNER_ONLY')
  }

  const { bin, plan } = req.body

  if (!bin || bin.length < 6) {
    throw new BadRequestError('INVALID_BIN')
  }

  // Validate plan
  if (!PLAN_TYPES.includes(plan)) {
    throw new BadRequestError('INVALID_PLAN')
  }

  // Get plan price
  const planInfo = SUBSCRIPTION_PLANS[plan]
  const amount = planInfo.price.yearly
  const currency = planInfo.price.currency.toLowerCase()

  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/bin`,
      {
        bin: bin.substring(0, 6),
        amount,
        currency
      },
      {
        headers: {
          Authorization: req.headers.authorization,
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.data.success) {
      res.json({
        success: true,
        data: response.data.data
      })
    } else {
      throw new BadRequestError(response.data.error || 'BIN_QUERY_FAILED')
    }
  } catch (error) {
    if (error.response?.data?.error) {
      throw new BadRequestError(error.response.data.error)
    }
    throw error
  }
})

// Initiate subscription purchase with payment
export const initiatePurchase = asyncHandler(async (req, res) => {
  // Only partner users can access this
  if (req.user.accountType !== 'partner') {
    throw new ForbiddenError('PARTNER_ONLY')
  }

  const partnerId = req.user.accountId
  const { plan, card, installment = 1 } = req.body

  // Validate plan
  if (!PLAN_TYPES.includes(plan)) {
    throw new BadRequestError('INVALID_PLAN')
  }

  // Validate installment
  const installmentCount = parseInt(installment) || 1
  if (installmentCount < 1 || installmentCount > 12) {
    throw new BadRequestError('INVALID_INSTALLMENT')
  }

  // Get plan price
  const planInfo = SUBSCRIPTION_PLANS[plan]
  let amount = planInfo.price.yearly
  let currency = planInfo.price.currency.toLowerCase()
  let originalAmount = amount
  let originalCurrency = currency
  let exchangeRate = null

  // Get partner
  const partner = await Partner.findById(partnerId)
  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Query BIN to check card country and convert currency if needed
  try {
    const binResponse = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/bin`,
      {
        bin: card.number.replace(/\s/g, '').substring(0, 8),
        amount,
        currency
      },
      {
        headers: {
          Authorization: req.headers.authorization,
          'Content-Type': 'application/json'
        }
      }
    )

    // If Turkish card and currency is not TRY, convert to TRY
    // BIN response format: { success: true, card: { country: 'tr' }, pos: {...}, installments: [...] }
    const cardCountry = binResponse.data?.card?.country?.toLowerCase()
    logger.info(`[Subscription Purchase] BIN query result - card country: ${cardCountry}`)

    if (cardCountry === 'tr' && currency !== 'try') {
      logger.info(
        `[Subscription Purchase] Turkish card detected, converting ${currency.toUpperCase()} to TRY`
      )

      const conversionResult = await convertCurrency(amount, currency.toUpperCase(), 'TRY')
      amount = conversionResult.convertedAmount
      currency = 'try'
      exchangeRate = conversionResult.rate

      logger.info(
        `[Subscription Purchase] Converted: ${originalAmount} ${originalCurrency.toUpperCase()} -> ${amount} TRY (rate: ${exchangeRate})`
      )
    }
  } catch (binError) {
    logger.error(
      '[Subscription Purchase] BIN query failed, proceeding with original currency:',
      binError.message
    )
    // Continue with original currency if BIN query fails
  }

  // Create subscription period
  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setFullYear(endDate.getFullYear() + 1)

  // Create pending purchase (store original currency for invoice)
  const purchase = {
    plan,
    period: { startDate, endDate },
    price: { amount: originalAmount, currency: originalCurrency },
    status: 'pending',
    createdAt: new Date(),
    createdBy: req.user._id
  }

  partner.subscription.purchases.push(purchase)
  await partner.save()

  const purchaseId = partner.subscription.purchases.slice(-1)[0]._id

  // Call payment service
  try {
    const paymentResponse = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/pay`,
      {
        amount,
        currency,
        installment: installmentCount,
        card: {
          holder: card.holder,
          number: card.number,
          expiry: card.expiry,
          cvv: card.cvv
        },
        customer: {
          name: partner.companyName,
          email: partner.email,
          ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        },
        externalId: `subscription-${partnerId}-${purchaseId}`,
        callbackUrl: `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/my/subscription/payment-callback`
      },
      {
        headers: {
          Authorization: req.headers.authorization,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!paymentResponse.data.success) {
      // Payment init failed, remove pending purchase
      partner.subscription.purchases.pull(purchaseId)
      await partner.save()
      throw new BadRequestError(paymentResponse.data.error || 'PAYMENT_INIT_FAILED')
    }

    // Store transaction ID and conversion info in purchase
    const purchaseDoc = partner.subscription.purchases.id(purchaseId)
    purchaseDoc.payment = {
      transactionId: paymentResponse.data.transactionId
    }
    if (exchangeRate) {
      purchaseDoc.payment.originalAmount = originalAmount
      purchaseDoc.payment.originalCurrency = originalCurrency.toUpperCase()
      purchaseDoc.payment.convertedAmount = amount
      purchaseDoc.payment.convertedCurrency = currency.toUpperCase()
      purchaseDoc.payment.exchangeRate = exchangeRate
    }
    await partner.save()

    res.json({
      success: true,
      data: {
        formUrl: paymentResponse.data.formUrl,
        transactionId: paymentResponse.data.transactionId,
        purchaseId,
        // Include conversion info if applicable
        ...(exchangeRate && {
          originalAmount,
          originalCurrency: originalCurrency.toUpperCase(),
          convertedAmount: amount,
          convertedCurrency: currency.toUpperCase(),
          exchangeRate
        })
      }
    })
  } catch (error) {
    // Remove pending purchase on error
    partner.subscription.purchases.pull(purchaseId)
    await partner.save()

    if (error.response?.data?.error) {
      throw new BadRequestError(error.response.data.error)
    }
    throw error
  }
})

// Pay for existing pending purchase (admin-created packages)
export const payPendingPurchase = asyncHandler(async (req, res) => {
  // Only partner users can access this
  if (req.user.accountType !== 'partner') {
    throw new ForbiddenError('PARTNER_ONLY')
  }

  const partnerId = req.user.accountId
  const { purchaseId } = req.params
  const { card, installment = 1 } = req.body

  // Validate card info
  if (!card?.holder || !card?.number || !card?.expiry || !card?.cvv) {
    throw new BadRequestError('CARD_INFO_REQUIRED')
  }

  // Get partner
  const partner = await Partner.findById(partnerId)
  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Find the pending purchase
  const purchase = partner.subscription?.purchases?.find(p => p._id.toString() === purchaseId)

  if (!purchase) {
    throw new NotFoundError('PURCHASE_NOT_FOUND')
  }

  if (purchase.status !== 'pending') {
    throw new BadRequestError('PURCHASE_NOT_PENDING')
  }

  // Validate installment
  const installmentCount = parseInt(installment) || 1
  if (installmentCount < 1 || installmentCount > 12) {
    throw new BadRequestError('INVALID_INSTALLMENT')
  }

  // Get amount and currency from the purchase
  let amount = purchase.price.amount
  let currency = (purchase.price.currency || 'usd').toLowerCase()
  let originalAmount = amount
  let originalCurrency = currency
  let exchangeRate = null

  // Query BIN to check card country
  try {
    const binResponse = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/bin`,
      {
        bin: card.number.replace(/\s/g, '').substring(0, 8),
        amount,
        currency
      },
      {
        headers: {
          Authorization: req.headers.authorization,
          'Content-Type': 'application/json'
        }
      }
    )

    // If Turkish card and currency is not TRY, convert to TRY
    // BIN response format: { success: true, card: { country: 'tr' }, pos: {...}, installments: [...] }
    const cardCountry = binResponse.data?.card?.country?.toLowerCase()
    logger.info(`[Subscription Payment] BIN query result - card country: ${cardCountry}`)

    if (cardCountry === 'tr' && currency !== 'try') {
      logger.info(
        `[Subscription Payment] Turkish card detected, converting ${currency.toUpperCase()} to TRY`
      )

      const conversionResult = await convertCurrency(amount, currency.toUpperCase(), 'TRY')
      amount = conversionResult.convertedAmount
      currency = 'try'
      exchangeRate = conversionResult.rate

      logger.info(
        `[Subscription Payment] Converted: ${originalAmount} ${originalCurrency.toUpperCase()} -> ${amount} TRY (rate: ${exchangeRate})`
      )
    }
  } catch (binError) {
    logger.error(
      '[Subscription Payment] BIN query failed, proceeding with original currency:',
      binError.message
    )
    // Continue with original currency if BIN query fails
  }

  // Call payment service
  try {
    const paymentResponse = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/pay`,
      {
        amount,
        currency,
        installment: installmentCount,
        card: {
          holder: card.holder,
          number: card.number,
          expiry: card.expiry,
          cvv: card.cvv
        },
        customer: {
          name: partner.companyName,
          email: partner.email,
          ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        },
        externalId: `subscription-${partnerId}-${purchaseId}`,
        callbackUrl: `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/my/subscription/payment-callback`
      },
      {
        headers: {
          Authorization: req.headers.authorization,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!paymentResponse.data.success) {
      throw new BadRequestError(paymentResponse.data.error || 'PAYMENT_INIT_FAILED')
    }

    // Store transaction ID and conversion info in purchase
    purchase.payment = purchase.payment || {}
    purchase.payment.transactionId = paymentResponse.data.transactionId
    if (exchangeRate) {
      purchase.payment.originalAmount = originalAmount
      purchase.payment.originalCurrency = originalCurrency.toUpperCase()
      purchase.payment.convertedAmount = amount
      purchase.payment.convertedCurrency = currency.toUpperCase()
      purchase.payment.exchangeRate = exchangeRate
    }
    await partner.save()

    res.json({
      success: true,
      data: {
        formUrl: paymentResponse.data.formUrl,
        transactionId: paymentResponse.data.transactionId,
        purchaseId,
        // Include conversion info if applicable
        ...(exchangeRate && {
          originalAmount,
          originalCurrency: originalCurrency.toUpperCase(),
          convertedAmount: amount,
          convertedCurrency: currency.toUpperCase(),
          exchangeRate
        })
      }
    })
  } catch (error) {
    if (error.response?.data?.error) {
      throw new BadRequestError(error.response.data.error)
    }
    throw error
  }
})

// Handle payment callback from payment service
export const paymentCallback = asyncHandler(async (req, res) => {
  const { transactionId, success, message, externalId } = req.body

  logger.info('[Subscription Callback] Received:', { transactionId, success, message, externalId })

  // Parse externalId: subscription-{partnerId}-{purchaseId}
  let partnerId = null
  let purchaseId = null
  if (externalId && externalId.startsWith('subscription-')) {
    const parts = externalId.split('-')
    // Format: subscription-{partnerId}-{purchaseId}
    if (parts.length >= 3) {
      partnerId = parts[1]
      purchaseId = parts[2]
    }
  }

  // Find partner with this transaction or by partnerId from externalId
  let partner = await Partner.findOne({
    'subscription.purchases.payment.transactionId': transactionId
  })

  // Fallback: try to find by partnerId from externalId
  if (!partner && partnerId) {
    partner = await Partner.findById(partnerId)
  }

  if (!partner) {
    logger.error('[Subscription Callback] Partner not found:', {
      transactionId,
      partnerId,
      externalId
    })
    throw new NotFoundError('PURCHASE_NOT_FOUND')
  }

  logger.info('[Subscription Callback] Found partner:', partner._id)

  // Find the purchase - prioritize purchaseId from externalId
  let purchase = null
  if (purchaseId) {
    purchase = partner.subscription.purchases.find(p => p._id.toString() === purchaseId)
  }

  // Fallback: find by transactionId or pending status
  if (!purchase) {
    purchase = partner.subscription.purchases.find(
      p => p.payment?.transactionId === transactionId || p.status === 'pending'
    )
  }

  if (!purchase) {
    logger.error('[Subscription Callback] Purchase not found:', {
      purchaseId,
      transactionId,
      purchases: partner.subscription?.purchases?.map(p => ({ id: p._id, status: p.status }))
    })
    throw new NotFoundError('PURCHASE_NOT_FOUND')
  }

  logger.info('[Subscription Callback] Found purchase:', {
    purchaseId: purchase._id,
    status: purchase.status,
    plan: purchase.plan
  })

  if (success) {
    // Mark as paid
    purchase.status = 'active'
    purchase.payment = purchase.payment || {}
    purchase.payment.date = new Date()
    purchase.payment.method = 'credit_card'
    purchase.payment.reference = transactionId
    purchase.payment.transactionId = transactionId // Store for future reference

    // Activate subscription
    partner.subscription.status = 'active'
    partner.subscription.plan = purchase.plan
    partner.subscription.startDate = purchase.period.startDate
    partner.subscription.endDate = purchase.period.endDate

    // Enable PMS if plan includes it
    const planInfo = SUBSCRIPTION_PLANS[purchase.plan]
    if (planInfo?.features?.pms?.enabled) {
      partner.pmsIntegration = partner.pmsIntegration || {}
      partner.pmsIntegration.enabled = true
    }

    await partner.save()

    logger.info(
      '[Subscription Callback] Payment successful, subscription activated for partner:',
      partner._id
    )

    // Create invoice
    try {
      await createInvoice(partner, purchase)
    } catch (invoiceError) {
      logger.error('Failed to create invoice:', invoiceError)
      // Don't fail the callback if invoice creation fails
    }

    res.json({ success: true, message: 'Payment successful, subscription activated' })
  } else {
    // Payment failed
    purchase.status = 'cancelled'
    purchase.cancellationReason = message || 'Payment failed'
    await partner.save()

    res.json({ success: true, message: 'Payment failure recorded' })
  }
})

// ==================== NEW: Membership Self-Service ====================

/**
 * Get my membership status (package + services + usage)
 */
export const getMyMembership = asyncHandler(async (req, res) => {
  if (req.user.accountType !== 'partner') {
    throw new ForbiddenError('PARTNER_ONLY')
  }

  const partnerId = req.user.accountId
  const partner = await Partner.findById(partnerId)
    .populate({
      path: 'subscription.currentPackage',
      populate: { path: 'services.service' }
    })
    .populate('subscription.individualServices.service')

  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const subscriptionStatus = partner.getSubscriptionStatus()
  const currentPkg = partner.subscription?.currentPackage

  // Get PMS usage
  const Hotel = (await import('#modules/hotel/hotel.model.js')).default
  const pmsHotelsCount = await Hotel.countDocuments({
    partner: partnerId,
    'pms.enabled': true
  })

  // Build active services list
  const activeServices = []

  // Package services
  if (currentPkg?.services) {
    for (const pkgSvc of currentPkg.services) {
      if (pkgSvc.included && pkgSvc.service) {
        activeServices.push({
          _id: pkgSvc.service._id,
          name: pkgSvc.service.name,
          code: pkgSvc.service.code,
          category: pkgSvc.service.category,
          icon: pkgSvc.service.icon,
          source: 'package',
          featureOverrides: pkgSvc.featureOverrides
        })
      }
    }
  }

  // Individual services
  const indSvcs = partner.subscription?.individualServices || []
  for (const ind of indSvcs) {
    if (ind.status === 'active' && ind.service) {
      if (ind.endDate && new Date(ind.endDate) < new Date()) continue
      if (!activeServices.some(s => s.code === ind.service.code)) {
        activeServices.push({
          _id: ind.service._id,
          name: ind.service.name,
          code: ind.service.code,
          category: ind.service.category,
          icon: ind.service.icon,
          source: 'individual',
          billingType: ind.billingType,
          endDate: ind.endDate,
          featureOverrides: ind.featureOverrides
        })
      }
    }
  }

  res.json({
    success: true,
    data: {
      // Package info
      package: currentPkg
        ? {
            _id: currentPkg._id,
            name: currentPkg.name,
            code: currentPkg.code,
            icon: currentPkg.icon,
            color: currentPkg.color,
            pricing: currentPkg.pricing
          }
        : null,

      // Subscription status
      status: subscriptionStatus.status,
      startDate: subscriptionStatus.startDate,
      endDate: subscriptionStatus.endDate,
      remainingDays: subscriptionStatus.remainingDays,
      gracePeriodEndDate: subscriptionStatus.gracePeriodEndDate,
      gracePeriodRemainingDays: subscriptionStatus.gracePeriodRemainingDays,

      // Active services
      services: activeServices,

      // Usage
      usage: {
        pmsHotels: pmsHotelsCount,
        pmsLimit: partner.getPmsLimit()
      },

      // Purchases
      purchases: subscriptionStatus.purchases
    }
  })
})

/**
 * Get membership catalog (packages available for purchase)
 */
export const getMembershipCatalog = asyncHandler(async (req, res) => {
  if (req.user.accountType !== 'partner') {
    throw new ForbiddenError('PARTNER_ONLY')
  }

  const partnerId = req.user.accountId
  const partner = await Partner.findById(partnerId)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  // Get packages for this partner type
  const packages = await MembershipPackage.findPublicCatalog(partner.partnerType)

  // Get standalone services (one_time or recurring, not archived)
  const standaloneServices = await MembershipService.find({
    status: 'active'
  }).sort({ sortOrder: 1 })

  res.json({
    success: true,
    data: {
      packages: packages.map(pkg => ({
        _id: pkg._id,
        name: pkg.name,
        description: pkg.description,
        code: pkg.code,
        icon: pkg.icon,
        color: pkg.color,
        badge: pkg.badge,
        pricing: pkg.pricing,
        trial: pkg.trial,
        services: pkg.services
          .filter(s => s.included && s.service)
          .map(s => ({
            _id: s.service._id,
            name: s.service.name,
            code: s.service.code,
            icon: s.service.icon,
            category: s.service.category
          }))
      })),
      services: standaloneServices
    }
  })
})

/**
 * Purchase a membership package or service (self-service)
 * Creates a pending purchase that can be paid via card or bank transfer
 */
export const purchaseMembership = asyncHandler(async (req, res) => {
  if (req.user.accountType !== 'partner') {
    throw new ForbiddenError('PARTNER_ONLY')
  }

  const partnerId = req.user.accountId
  const { type, packageId, serviceId, paymentMethod } = req.body

  const partner = await Partner.findById(partnerId)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  if (!partner.subscription) {
    partner.subscription = { purchases: [], individualServices: [] }
  }
  if (!partner.subscription.purchases) partner.subscription.purchases = []

  const purchaseCurrency = partner.currency || 'TRY'

  if (type === 'package') {
    if (!packageId) throw new BadRequestError('PACKAGE_ID_REQUIRED')

    const pkg = await MembershipPackage.findById(packageId).populate('services.service')
    if (!pkg || pkg.status !== 'active') throw new NotFoundError('PACKAGE_NOT_FOUND')
    if (!pkg.isPublic) throw new BadRequestError('PACKAGE_NOT_PUBLIC')

    // Validate partner type
    if (pkg.targetPartnerType !== 'all' && pkg.targetPartnerType !== partner.partnerType) {
      throw new BadRequestError('PACKAGE_NOT_COMPATIBLE')
    }

    const amount = pkg.getPrice(purchaseCurrency)

    // Calculate period
    const startDate = new Date()
    const endDate = new Date(startDate)
    if (pkg.pricing.interval === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }

    partner.subscription.purchases.push({
      purchaseType: 'package',
      package: pkg._id,
      period: { startDate, endDate },
      price: { amount, currency: purchaseCurrency },
      status: 'pending',
      createdAt: new Date(),
      createdBy: req.user._id
    })

    await partner.save()
    const addedPurchase = partner.subscription.purchases[partner.subscription.purchases.length - 1]

    return res.json({
      success: true,
      data: {
        purchaseId: addedPurchase._id,
        type: 'package',
        package: { _id: pkg._id, name: pkg.name },
        amount,
        currency: purchaseCurrency,
        period: { startDate, endDate }
      }
    })
  }

  if (type === 'service') {
    if (!serviceId) throw new BadRequestError('SERVICE_ID_REQUIRED')

    const svc = await MembershipService.findById(serviceId)
    if (!svc || svc.status !== 'active') throw new NotFoundError('SERVICE_NOT_FOUND')

    const amount = svc.getPrice(purchaseCurrency)

    const startDate = new Date()
    let endDate = null

    if (svc.pricing.billingType === 'recurring') {
      endDate = new Date(startDate)
      if (svc.pricing.interval === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1)
      } else {
        endDate.setMonth(endDate.getMonth() + 1)
      }
    }

    partner.subscription.purchases.push({
      purchaseType: 'service',
      service: svc._id,
      period: {
        startDate,
        endDate: endDate || new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000)
      },
      price: { amount, currency: purchaseCurrency },
      status: 'pending',
      createdAt: new Date(),
      createdBy: req.user._id
    })

    await partner.save()
    const addedPurchase = partner.subscription.purchases[partner.subscription.purchases.length - 1]

    return res.json({
      success: true,
      data: {
        purchaseId: addedPurchase._id,
        type: 'service',
        service: { _id: svc._id, name: svc.name },
        amount,
        currency: purchaseCurrency,
        period: { startDate, endDate }
      }
    })
  }

  throw new BadRequestError('INVALID_PURCHASE_TYPE')
})
