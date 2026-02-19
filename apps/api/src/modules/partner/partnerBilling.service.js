import Partner from './partner.model.js'
import SubscriptionPackage from '#modules/subscriptions/subscription-package.model.js'
import SubscriptionService from '#modules/subscriptions/subscription-service.model.js'
import PaymentLink from '#modules/paymentLink/paymentLink.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { createInvoice } from '#modules/subscriptionInvoice/subscriptionInvoice.service.js'
import logger from '#core/logger.js'

/**
 * Get all purchases across all partners (admin subscription management)
 */
export const getAllPurchases = asyncHandler(async (req, res) => {
  const partners = await Partner.find({
    'subscription.purchases': { $exists: true, $ne: [] }
  })
    .select('companyName email subscription.purchases')
    .lean()

  const allPurchases = []

  for (const partner of partners) {
    if (partner.subscription?.purchases) {
      for (const purchase of partner.subscription.purchases) {
        allPurchases.push({
          partner: {
            _id: partner._id,
            companyName: partner.companyName,
            email: partner.email
          },
          purchase: {
            _id: purchase._id,
            type: purchase.type,
            package: purchase.package,
            service: purchase.service,
            label: purchase.label,
            period: purchase.period,
            price: purchase.price,
            billingPeriod: purchase.billingPeriod,
            payment: purchase.payment,
            status: purchase.status,
            createdAt: purchase.createdAt
          }
        })
      }
    }
  }

  allPurchases.sort((a, b) => new Date(b.purchase.createdAt) - new Date(a.purchase.createdAt))

  res.json({ success: true, data: allPurchases })
})

/**
 * Get available packages and services for the purchase dropdown
 */
export const getCatalog = asyncHandler(async (req, res) => {
  const [packages, services] = await Promise.all([
    SubscriptionPackage.find({ isActive: true })
      .populate('services', 'name slug price icon category')
      .sort({ sortOrder: 1 }),
    SubscriptionService.find({ isActive: true }).sort({ sortOrder: 1, category: 1 })
  ])

  res.json({
    success: true,
    data: { packages, services }
  })
})

/**
 * Get partner subscription details
 */
export const getSubscription = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const subscriptionStatus = partner.getSubscriptionStatus()

  res.json({ success: true, data: subscriptionStatus })
})

/**
 * Update partner subscription settings (customLimits, status, notes)
 */
export const updateSubscription = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const { customLimits, notes, status } = req.body

  if (!partner.subscription) {
    partner.subscription = { purchases: [] }
  }

  if (status) {
    const validStatuses = ['active', 'cancelled', 'suspended']
    if (!validStatuses.includes(status)) throw new BadRequestError('INVALID_SUBSCRIPTION_STATUS')
    partner.subscription.status = status
    logger.info(`Partner ${partner._id} subscription status set to: ${status}`)
  }

  if (customLimits !== undefined) {
    if (!partner.subscription.customLimits) partner.subscription.customLimits = {}

    if (customLimits.pmsMaxHotels !== undefined) {
      const pmsLimit = customLimits.pmsMaxHotels
      if (pmsLimit !== null && pmsLimit !== -1 && pmsLimit < 0)
        throw new BadRequestError('INVALID_PMS_LIMIT')
      partner.subscription.customLimits.pmsMaxHotels = pmsLimit

      if (pmsLimit > 0 || pmsLimit === -1) {
        if (!partner.pmsIntegration) partner.pmsIntegration = {}
        partner.pmsIntegration.enabled = true
      } else if (pmsLimit === 0) {
        if (partner.pmsIntegration) partner.pmsIntegration.enabled = false
      }
      logger.info(`Partner ${partner._id} custom PMS limit set: ${pmsLimit}`)
    }
  }

  if (notes !== undefined) partner.subscription.notes = notes

  await partner.save()

  const subscriptionStatus = partner.getSubscriptionStatus()
  res.json({
    success: true,
    message: req.t ? req.t('SUBSCRIPTION_UPDATED') : 'Subscription updated successfully',
    data: subscriptionStatus
  })
})

/**
 * Add a purchase (package subscription or standalone service) to partner
 */
export const addPurchase = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const {
    type, // 'package_subscription' | 'service_purchase'
    packageId,
    serviceId,
    startDate,
    endDate,
    amount,
    billingPeriod
  } = req.body

  if (!type || !startDate || !endDate || amount == null) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  if (!['package_subscription', 'service_purchase'].includes(type)) {
    throw new BadRequestError('INVALID_PURCHASE_TYPE')
  }

  let label = { tr: '', en: '' }

  if (type === 'package_subscription') {
    if (!packageId) throw new BadRequestError('PACKAGE_ID_REQUIRED')
    const pkg = await SubscriptionPackage.findById(packageId)
    if (!pkg) throw new NotFoundError('PACKAGE_NOT_FOUND')
    label = { tr: pkg.name.tr, en: pkg.name.en }
  } else {
    if (!serviceId) throw new BadRequestError('SERVICE_ID_REQUIRED')
    const svc = await SubscriptionService.findById(serviceId)
    if (!svc) throw new NotFoundError('SERVICE_NOT_FOUND')
    label = { tr: svc.name.tr, en: svc.name.en }
  }

  if (!partner.subscription) partner.subscription = { purchases: [] }
  if (!partner.subscription.purchases) partner.subscription.purchases = []

  // Expire old purchases that have ended
  const now = new Date()
  partner.subscription.purchases.forEach(p => {
    if (p.status === 'active' && new Date(p.period.endDate) < now) {
      p.status = 'expired'
    }
  })

  const purchase = {
    type,
    package: type === 'package_subscription' ? packageId : undefined,
    service: type === 'service_purchase' ? serviceId : undefined,
    label,
    period: { startDate: new Date(startDate), endDate: new Date(endDate) },
    price: { amount, currency: 'EUR' },
    billingPeriod: billingPeriod || 'yearly',
    status: 'pending',
    createdAt: new Date(),
    createdBy: req.user._id
  }

  partner.subscription.purchases.push(purchase)
  await partner.save()

  const addedPurchase = partner.subscription.purchases[partner.subscription.purchases.length - 1]

  logger.info(`Purchase added for partner ${partner._id}: ${type} - ${amount} EUR (pending)`)

  res.json({
    success: true,
    message: req.t ? req.t('PURCHASE_ADDED') : 'Purchase added successfully',
    data: {
      purchase: {
        _id: addedPurchase._id,
        type: addedPurchase.type,
        label: addedPurchase.label,
        period: addedPurchase.period,
        price: addedPurchase.price,
        billingPeriod: addedPurchase.billingPeriod,
        status: addedPurchase.status
      },
      subscription: partner.getSubscriptionStatus()
    }
  })
})

/**
 * Update existing purchase
 */
export const updatePurchase = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const { purchaseId } = req.params
  const {
    startDate,
    endDate,
    amount,
    billingPeriod,
    paymentMethod,
    paymentReference,
    paymentNotes
  } = req.body

  const purchase = partner.subscription?.purchases?.find(p => p._id.toString() === purchaseId)
  if (!purchase) throw new NotFoundError('PURCHASE_NOT_FOUND')

  if (!['pending', 'active'].includes(purchase.status)) {
    throw new BadRequestError('PURCHASE_CANNOT_BE_EDITED')
  }

  if (startDate) purchase.period.startDate = new Date(startDate)
  if (endDate) purchase.period.endDate = new Date(endDate)
  if (amount !== undefined) purchase.price.amount = amount
  purchase.price.currency = 'EUR'
  if (billingPeriod) purchase.billingPeriod = billingPeriod

  if (paymentMethod || paymentReference || paymentNotes) {
    if (!purchase.payment) purchase.payment = {}
    if (paymentMethod) purchase.payment.method = paymentMethod
    if (paymentReference !== undefined) purchase.payment.reference = paymentReference
    if (paymentNotes !== undefined) purchase.payment.notes = paymentNotes
  }

  await partner.save()

  logger.info(`Purchase ${purchaseId} updated for partner ${partner._id}`)

  res.json({
    success: true,
    message: req.t ? req.t('PURCHASE_UPDATED') : 'Purchase updated successfully',
    data: {
      purchase: {
        _id: purchase._id,
        type: purchase.type,
        label: purchase.label,
        period: purchase.period,
        price: purchase.price,
        billingPeriod: purchase.billingPeriod,
        payment: purchase.payment,
        status: purchase.status
      },
      subscription: partner.getSubscriptionStatus()
    }
  })
})

/**
 * Mark pending purchase as paid
 */
export const markPurchaseAsPaid = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const { purchaseId } = req.params
  const { paymentDate, paymentMethod, paymentReference, paymentNotes } = req.body

  if (!paymentDate) throw new BadRequestError('PAYMENT_DATE_REQUIRED')

  const purchase = partner.subscription?.purchases?.find(p => p._id.toString() === purchaseId)
  if (!purchase) throw new NotFoundError('PURCHASE_NOT_FOUND')
  if (purchase.status !== 'pending') throw new BadRequestError('PURCHASE_NOT_PENDING')

  purchase.status = 'active'
  purchase.payment = {
    date: new Date(paymentDate),
    method: paymentMethod || 'bank_transfer',
    reference: paymentReference,
    notes: paymentNotes
  }

  partner.subscription.status = 'active'

  await partner.save()

  // Create invoice (idempotent – skip if already created for this purchase)
  let invoice = null
  try {
    invoice = await createInvoice(partner._id, purchase, req.user._id)
    purchase.invoice = invoice._id
    await partner.save()
    logger.info(`Invoice ${invoice.invoiceNumber} created for partner ${partner._id}`)
  } catch (invoiceError) {
    logger.error(`Failed to create invoice for partner ${partner._id}: ${invoiceError.message}`)
  }

  logger.info(`Purchase ${purchaseId} marked as paid for partner ${partner._id}`)

  res.json({
    success: true,
    message: req.t ? req.t('PURCHASE_MARKED_PAID') : 'Purchase marked as paid successfully',
    data: {
      purchase: {
        _id: purchase._id,
        type: purchase.type,
        label: purchase.label,
        period: purchase.period,
        price: purchase.price,
        billingPeriod: purchase.billingPeriod,
        payment: purchase.payment,
        status: purchase.status,
        invoice: invoice ? { _id: invoice._id, invoiceNumber: invoice.invoiceNumber } : null
      },
      subscription: partner.getSubscriptionStatus()
    }
  })
})

/**
 * Cancel purchase
 */
export const cancelPurchase = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const { purchaseId } = req.params
  const { reason } = req.body

  const purchase = partner.subscription?.purchases?.find(p => p._id.toString() === purchaseId)
  if (!purchase) throw new NotFoundError('PURCHASE_NOT_FOUND')
  if (purchase.status === 'cancelled') throw new BadRequestError('PURCHASE_ALREADY_CANCELLED')

  purchase.status = 'cancelled'
  purchase.cancelledAt = new Date()
  purchase.cancelledBy = req.user._id
  purchase.cancellationReason = reason

  partner.subscription.status = partner.calculateSubscriptionStatus()
  await partner.save()

  logger.info(`Purchase ${purchaseId} cancelled for partner ${partner._id}`)

  res.json({
    success: true,
    message: req.t ? req.t('PURCHASE_CANCELLED') : 'Purchase cancelled successfully',
    data: { subscription: partner.getSubscriptionStatus() }
  })
})

/**
 * Create purchase from admin subscription modal.
 * Uses SubscriptionPackage/SubscriptionService catalog (EUR-only).
 * Supports actions: send_link, save_pending, mark_paid
 */
export const createPurchaseWithPaymentLink = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const { packageId, serviceIds = [], interval = 'yearly', action } = req.body

  if (!action || !['send_link', 'save_pending', 'mark_paid'].includes(action)) {
    throw new BadRequestError('INVALID_ACTION')
  }
  if (!packageId && serviceIds.length === 0) {
    throw new BadRequestError('NO_ITEMS_SELECTED')
  }

  if (!partner.subscription) partner.subscription = { purchases: [] }
  if (!partner.subscription.purchases) partner.subscription.purchases = []

  const now = new Date()
  partner.subscription.purchases.forEach(p => {
    if (p.status === 'active' && new Date(p.period.endDate) < now) {
      p.status = 'expired'
    }
  })

  const startDate = new Date()
  const endDate = new Date(startDate)
  if (interval === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1)
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1)
  }

  const createdPurchases = []
  let totalAmount = 0
  let packageServiceSlugs = []

  if (packageId) {
    const pkg = await SubscriptionPackage.findById(packageId).populate('services')
    if (!pkg) throw new NotFoundError('PACKAGE_NOT_FOUND')

    const amount = pkg.price
    totalAmount += amount
    packageServiceSlugs = (pkg.services || []).map(s => s.slug)

    const purchase = {
      type: 'package_subscription',
      package: pkg._id,
      label: { tr: pkg.name.tr, en: pkg.name.en },
      period: { startDate, endDate },
      price: { amount, currency: 'EUR' },
      billingPeriod: interval,
      status: action === 'mark_paid' ? 'active' : 'pending',
      createdAt: new Date(),
      createdBy: req.user._id
    }

    if (action === 'mark_paid') {
      purchase.payment = {
        date: new Date(),
        method: 'manual',
        reference: `admin-${req.user._id}`
      }
    }

    partner.subscription.purchases.push(purchase)
    createdPurchases.push({
      purchase: partner.subscription.purchases[partner.subscription.purchases.length - 1],
      label: pkg.name
    })
  }

  for (const svcId of serviceIds) {
    const svc = await SubscriptionService.findById(svcId)
    if (!svc) continue
    if (packageServiceSlugs.includes(svc.slug)) continue

    const amount = svc.price
    totalAmount += amount

    const purchase = {
      type: 'service_purchase',
      service: svc._id,
      label: { tr: svc.name.tr, en: svc.name.en },
      period: { startDate, endDate },
      price: { amount, currency: 'EUR' },
      billingPeriod: interval,
      status: action === 'mark_paid' ? 'active' : 'pending',
      createdAt: new Date(),
      createdBy: req.user._id
    }

    if (action === 'mark_paid') {
      purchase.payment = {
        date: new Date(),
        method: 'manual',
        reference: `admin-${req.user._id}`
      }
    }

    partner.subscription.purchases.push(purchase)
    createdPurchases.push({
      purchase: partner.subscription.purchases[partner.subscription.purchases.length - 1],
      label: svc.name
    })
  }

  if (action === 'mark_paid') {
    partner.subscription.status = 'active'
  }

  await partner.save()

  let paymentLink = null
  if (action === 'send_link' && totalAmount > 0) {
    const linkData = {
      partner: partner._id,
      customer: {
        name: partner.companyName,
        email: partner.email,
        phone: partner.phone || ''
      },
      description: createdPurchases.map(p => p.label?.tr || p.label?.en).join(', '),
      amount: totalAmount,
      currency: 'EUR',
      purpose: 'subscription_package',
      subscriptionContext: {
        targetPartner: partner._id,
        purchaseId: createdPurchases[0]?.purchase?._id
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
      createdBy: req.user._id
    }

    paymentLink = await PaymentLink.create(linkData)
    logger.info(`Payment link ${paymentLink._id} created for partner ${partner._id}`)
  }

  if (action === 'mark_paid') {
    for (const { purchase } of createdPurchases) {
      try {
        await createInvoice(partner._id, purchase, req.user._id)
      } catch (err) {
        logger.error(`Invoice creation failed for purchase ${purchase._id}: ${err.message}`)
      }
    }
  }

  logger.info(
    `${createdPurchases.length} purchases created for partner ${partner._id} (action: ${action})`
  )

  res.json({
    success: true,
    data: {
      purchases: createdPurchases.map(p => ({
        _id: p.purchase._id,
        type: p.purchase.type,
        label: p.purchase.label,
        status: p.purchase.status,
        price: p.purchase.price
      })),
      paymentLink: paymentLink
        ? { _id: paymentLink._id, paymentUrl: `/payment/${paymentLink.token}` }
        : null,
      subscription: partner.getSubscriptionStatus()
    }
  })
})
