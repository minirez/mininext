import Partner from '#modules/partner/partner.model.js'
import SubscriptionInvoice from '#modules/subscriptionInvoice/subscriptionInvoice.model.js'
import SubscriptionPackage from '#modules/subscriptions/subscription-package.model.js'
import SubscriptionService from '#modules/subscriptions/subscription-service.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError, ForbiddenError, BadRequestError } from '#core/errors.js'
import { createInvoice } from '#modules/subscriptionInvoice/subscriptionInvoice.service.js'
import PDFDocument from 'pdfkit'
import axios from 'axios'
import logger from '#core/logger.js'

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:7043'

// ───────────────── helpers ─────────────────

function requirePartner(req) {
  if (req.user.accountType !== 'partner') throw new ForbiddenError('PARTNER_ONLY')
  return req.user.accountId
}

// ───────────────── subscription info ─────────────────

export const getMySubscription = asyncHandler(async (req, res) => {
  const partnerId = requirePartner(req)
  const partner = await Partner.findById(partnerId)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const subscriptionStatus = partner.getSubscriptionStatus()

  // PMS usage count
  const Hotel = (await import('#modules/hotel/hotel.model.js')).default
  const pmsHotelsCount = await Hotel.countDocuments({ partner: partnerId, 'pms.enabled': true })

  // Map purchases
  const purchases = (partner.subscription?.purchases || [])
    .map(p => ({
      _id: p._id,
      type: p.type,
      package: p.package,
      service: p.service,
      label: p.label,
      status: p.status,
      period: p.period,
      price: p.price,
      billingPeriod: p.billingPeriod,
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
      status: subscriptionStatus.status,
      statusLabel: subscriptionStatus.statusLabel,
      trial: subscriptionStatus.trial,
      currentPurchase: subscriptionStatus.currentPurchase,
      startDate: subscriptionStatus.startDate,
      endDate: subscriptionStatus.endDate,
      gracePeriodEndDate: subscriptionStatus.gracePeriodEndDate,
      remainingDays: subscriptionStatus.remainingDays,
      gracePeriodRemainingDays: subscriptionStatus.gracePeriodRemainingDays,
      pmsStatus: {
        ...subscriptionStatus.pmsStatus,
        used: pmsHotelsCount
      },
      webDesignStatus: subscriptionStatus.webDesignStatus,
      purchases
    }
  })
})

// ───────────────── invoices ─────────────────

export const getMyInvoices = asyncHandler(async (req, res) => {
  const partnerId = requirePartner(req)
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

export const downloadMyInvoicePDF = asyncHandler(async (req, res) => {
  const partnerId = requirePartner(req)
  const invoice = await SubscriptionInvoice.findOne({
    _id: req.params.id,
    partner: partnerId
  }).populate('partner')

  if (!invoice) throw new NotFoundError('INVOICE_NOT_FOUND')

  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)
  doc.pipe(res)

  doc.fontSize(24).font('Helvetica-Bold').text('FATURA / INVOICE', { align: 'center' })
  doc.moveDown(0.5)
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Fatura No: ${invoice.invoiceNumber}`, { align: 'center' })
  doc.text(`Tarih: ${invoice.invoiceDate.toLocaleDateString('tr-TR')}`, { align: 'center' })
  doc.moveDown(2)

  const startY = doc.y
  doc.fontSize(10).font('Helvetica-Bold').text('SATICI / SELLER', 50, startY)
  doc.font('Helvetica').fontSize(9)
  doc.text(invoice.seller.companyName || '-', 50, startY + 15)
  if (invoice.seller.taxNumber) doc.text(`Vergi No: ${invoice.seller.taxNumber}`, 50)
  if (invoice.seller.taxOffice) doc.text(`Vergi Dairesi: ${invoice.seller.taxOffice}`, 50)
  if (invoice.seller.address?.street) {
    doc.text(invoice.seller.address.street, 50)
    doc.text(`${invoice.seller.address.city || ''} ${invoice.seller.address.country || ''}`, 50)
  }
  if (invoice.seller.email) doc.text(`Email: ${invoice.seller.email}`, 50)
  if (invoice.seller.phone) doc.text(`Tel: ${invoice.seller.phone}`, 50)

  doc.fontSize(10).font('Helvetica-Bold').text('ALICI / BUYER', 320, startY)
  doc.font('Helvetica').fontSize(9)
  doc.text(invoice.buyer.companyName || '-', 320, startY + 15)
  if (invoice.buyer.tradeName) doc.text(invoice.buyer.tradeName, 320)
  if (invoice.buyer.taxNumber) doc.text(`Vergi No: ${invoice.buyer.taxNumber}`, 320)
  if (invoice.buyer.taxOffice) doc.text(`Vergi Dairesi: ${invoice.buyer.taxOffice}`, 320)
  if (invoice.buyer.address?.street) {
    doc.text(invoice.buyer.address.street, 320)
    doc.text(`${invoice.buyer.address.city || ''} ${invoice.buyer.address.country || ''}`, 320)
  }
  if (invoice.buyer.email) doc.text(`Email: ${invoice.buyer.email}`, 320)

  doc.moveDown(5)

  const tableTop = doc.y + 20
  doc.fontSize(9).font('Helvetica-Bold')
  doc.text('Aciklama / Description', 50, tableTop)
  doc.text('Miktar', 300, tableTop)
  doc.text('Birim Fiyat', 360, tableTop)
  doc.text('KDV', 440, tableTop)
  doc.text('Toplam', 490, tableTop)
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke()

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

  doc
    .moveTo(50, y + 5)
    .lineTo(550, y + 5)
    .stroke()

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

  if (invoice.status === 'paid') {
    y += 40
    doc.font('Helvetica').fontSize(10)
    doc.fillColor('green').text('ODENDI / PAID', 400, y)
    doc.fillColor('black')
    if (invoice.paidAt)
      doc
        .fontSize(9)
        .text(`Odeme Tarihi: ${invoice.paidAt.toLocaleDateString('tr-TR')}`, 400, y + 15)
    if (invoice.paymentReference) doc.text(`Referans: ${invoice.paymentReference}`, 400, y + 28)
  }

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

  if (invoice.notes) {
    doc.moveDown(3)
    doc.fontSize(9).font('Helvetica-Bold').text('Notlar / Notes:', 50)
    doc.font('Helvetica').text(invoice.notes, 50, doc.y + 5, { width: 500 })
  }

  doc
    .fontSize(8)
    .font('Helvetica')
    .text('Bu fatura elektronik ortamda olusturulmustur.', 50, 780, { align: 'center' })
  doc.text('This invoice was generated electronically.', 50, 792, { align: 'center' })

  doc.end()
})

// ───────────────── BIN query (EUR-only) ─────────────────

export const querySubscriptionBin = asyncHandler(async (req, res) => {
  requirePartner(req)

  const { bin, amount } = req.body
  if (!bin || bin.length < 6) throw new BadRequestError('INVALID_BIN')
  if (!amount || amount <= 0) throw new BadRequestError('INVALID_AMOUNT')

  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/bin`,
      { bin: bin.substring(0, 8), amount, currency: 'eur' },
      { headers: { Authorization: req.headers.authorization, 'Content-Type': 'application/json' } }
    )
    if (response.data.success) {
      res.json({ success: true, data: response.data.data })
    } else {
      throw new BadRequestError(response.data.error || 'BIN_QUERY_FAILED')
    }
  } catch (error) {
    if (error.response?.data?.error) throw new BadRequestError(error.response.data.error)
    throw error
  }
})

// ───────────────── initiate purchase (package or service) ─────────────────

export const initiatePurchase = asyncHandler(async (req, res) => {
  const partnerId = requirePartner(req)
  const { type, packageId, serviceId, card, installment = 1 } = req.body

  if (!type || !['package_subscription', 'service_purchase'].includes(type)) {
    throw new BadRequestError('INVALID_PURCHASE_TYPE')
  }

  const installmentCount = parseInt(installment) || 1
  if (installmentCount < 1 || installmentCount > 12)
    throw new BadRequestError('INVALID_INSTALLMENT')

  const partner = await Partner.findById(partnerId)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  // Resolve catalog item
  let amount, label, billingPeriod, catalogRef

  if (type === 'package_subscription') {
    if (!packageId) throw new BadRequestError('PACKAGE_ID_REQUIRED')
    const pkg = await SubscriptionPackage.findById(packageId)
    if (!pkg || !pkg.isActive) throw new NotFoundError('PACKAGE_NOT_FOUND')
    amount = pkg.price // virtual: overridePrice ?? calculatedPrice
    label = { tr: pkg.name.tr, en: pkg.name.en }
    billingPeriod = pkg.billingPeriod || 'yearly'
    catalogRef = { package: pkg._id }
  } else {
    if (!serviceId) throw new BadRequestError('SERVICE_ID_REQUIRED')
    const svc = await SubscriptionService.findById(serviceId)
    if (!svc || !svc.isActive) throw new NotFoundError('SERVICE_NOT_FOUND')
    amount = svc.price
    label = { tr: svc.name.tr, en: svc.name.en }
    billingPeriod = svc.billingPeriod || 'yearly'
    catalogRef = { service: svc._id }
  }

  // Build period
  const startDate = new Date()
  const endDate = new Date(startDate)
  if (billingPeriod === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1)
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1)
  }

  // Create pending purchase
  if (!partner.subscription) partner.subscription = { purchases: [] }
  if (!partner.subscription.purchases) partner.subscription.purchases = []

  const purchase = {
    type,
    ...catalogRef,
    label,
    period: { startDate, endDate },
    price: { amount, currency: 'EUR' },
    billingPeriod,
    status: 'pending',
    createdAt: new Date(),
    createdBy: req.user._id
  }

  partner.subscription.purchases.push(purchase)
  await partner.save()

  const purchaseId = partner.subscription.purchases.slice(-1)[0]._id

  // Call payment service (EUR-only – no currency conversion)
  try {
    const paymentResponse = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/pay`,
      {
        amount,
        currency: 'eur',
        installment: installmentCount,
        card: { holder: card.holder, number: card.number, expiry: card.expiry, cvv: card.cvv },
        customer: {
          name: partner.companyName,
          email: partner.email,
          ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        },
        externalId: `subscription-${partnerId}-${purchaseId}`,
        callbackUrl: `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/my/subscription/payment-callback`
      },
      { headers: { Authorization: req.headers.authorization, 'Content-Type': 'application/json' } }
    )

    if (!paymentResponse.data.success) {
      partner.subscription.purchases.pull(purchaseId)
      await partner.save()
      throw new BadRequestError(paymentResponse.data.error || 'PAYMENT_INIT_FAILED')
    }

    const purchaseDoc = partner.subscription.purchases.id(purchaseId)
    purchaseDoc.payment = { transactionId: paymentResponse.data.transactionId }
    await partner.save()

    res.json({
      success: true,
      data: {
        formUrl: paymentResponse.data.formUrl,
        transactionId: paymentResponse.data.transactionId,
        purchaseId
      }
    })
  } catch (error) {
    partner.subscription.purchases.pull(purchaseId)
    await partner.save()
    if (error.response?.data?.error) throw new BadRequestError(error.response.data.error)
    throw error
  }
})

// ───────────────── pay existing pending purchase ─────────────────

export const payPendingPurchase = asyncHandler(async (req, res) => {
  const partnerId = requirePartner(req)
  const { purchaseId } = req.params
  const { card, installment = 1 } = req.body

  if (!card?.holder || !card?.number || !card?.expiry || !card?.cvv) {
    throw new BadRequestError('CARD_INFO_REQUIRED')
  }

  const partner = await Partner.findById(partnerId)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const purchase = partner.subscription?.purchases?.find(p => p._id.toString() === purchaseId)
  if (!purchase) throw new NotFoundError('PURCHASE_NOT_FOUND')
  if (purchase.status !== 'pending') throw new BadRequestError('PURCHASE_NOT_PENDING')

  const installmentCount = parseInt(installment) || 1
  if (installmentCount < 1 || installmentCount > 12)
    throw new BadRequestError('INVALID_INSTALLMENT')

  const amount = purchase.price.amount
  // EUR-only — no conversion
  try {
    const paymentResponse = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/pay`,
      {
        amount,
        currency: 'eur',
        installment: installmentCount,
        card: { holder: card.holder, number: card.number, expiry: card.expiry, cvv: card.cvv },
        customer: {
          name: partner.companyName,
          email: partner.email,
          ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        },
        externalId: `subscription-${partnerId}-${purchaseId}`,
        callbackUrl: `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/my/subscription/payment-callback`
      },
      { headers: { Authorization: req.headers.authorization, 'Content-Type': 'application/json' } }
    )

    if (!paymentResponse.data.success)
      throw new BadRequestError(paymentResponse.data.error || 'PAYMENT_INIT_FAILED')

    purchase.payment = purchase.payment || {}
    purchase.payment.transactionId = paymentResponse.data.transactionId
    await partner.save()

    res.json({
      success: true,
      data: {
        formUrl: paymentResponse.data.formUrl,
        transactionId: paymentResponse.data.transactionId,
        purchaseId
      }
    })
  } catch (error) {
    if (error.response?.data?.error) throw new BadRequestError(error.response.data.error)
    throw error
  }
})

// ───────────────── payment callback (idempotent) ─────────────────

export const paymentCallback = asyncHandler(async (req, res) => {
  const { transactionId, success, message, externalId } = req.body
  logger.info('[Subscription Callback] Received:', { transactionId, success, externalId })

  // Parse externalId: subscription-{partnerId}-{purchaseId}
  let partnerId = null
  let purchaseId = null
  if (externalId?.startsWith('subscription-')) {
    const parts = externalId.split('-')
    if (parts.length >= 3) {
      partnerId = parts[1]
      purchaseId = parts[2]
    }
  }

  let partner = await Partner.findOne({
    'subscription.purchases.payment.transactionId': transactionId
  })
  if (!partner && partnerId) partner = await Partner.findById(partnerId)
  if (!partner) {
    logger.error('[Subscription Callback] Partner not found:', {
      transactionId,
      partnerId,
      externalId
    })
    throw new NotFoundError('PURCHASE_NOT_FOUND')
  }

  let purchase = null
  if (purchaseId)
    purchase = partner.subscription.purchases.find(p => p._id.toString() === purchaseId)
  if (!purchase)
    purchase = partner.subscription.purchases.find(
      p => p.payment?.transactionId === transactionId || p.status === 'pending'
    )
  if (!purchase) {
    logger.error('[Subscription Callback] Purchase not found:', { purchaseId, transactionId })
    throw new NotFoundError('PURCHASE_NOT_FOUND')
  }

  // ── Idempotency: already processed ──
  if (purchase.status === 'active' && purchase.payment?.date) {
    logger.info('[Subscription Callback] Already processed, skipping:', purchase._id)
    return res.json({ success: true, message: 'Already processed' })
  }

  if (success) {
    purchase.status = 'active'
    purchase.payment = {
      ...(purchase.payment || {}),
      date: new Date(),
      method: 'credit_card',
      reference: transactionId,
      transactionId
    }

    partner.subscription.status = 'active'

    await partner.save()
    logger.info('[Subscription Callback] Payment successful, activated for partner:', partner._id)

    // Create invoice (idempotent – createInvoice deduplicates by purchase._id)
    try {
      const invoice = await createInvoice(partner._id, purchase, null)
      if (invoice && !purchase.invoice) {
        purchase.invoice = invoice._id
        await partner.save()
      }
    } catch (invoiceError) {
      logger.error('Failed to create invoice:', invoiceError.message)
    }

    res.json({ success: true, message: 'Payment successful, subscription activated' })
  } else {
    purchase.status = 'cancelled'
    purchase.cancellationReason = message || 'Payment failed'
    await partner.save()
    res.json({ success: true, message: 'Payment failure recorded' })
  }
})
