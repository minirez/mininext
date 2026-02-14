import Partner from './partner.model.js'
import MembershipPackage from '#modules/membership-package/membership-package.model.js'
import MembershipService from '#modules/membership-service/membership-service.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { SUBSCRIPTION_PLANS, PLAN_TYPES } from '#constants/subscriptionPlans.js'
import { createInvoice } from '#modules/subscriptionInvoice/subscriptionInvoice.service.js'
import logger from '#core/logger.js'

/**
 * Get all purchases across all partners (for admin subscription management)
 */
export const getAllPurchases = asyncHandler(async (req, res) => {
  // Get all partners with their subscription purchases
  const partners = await Partner.find({
    'subscription.purchases': { $exists: true, $ne: [] }
  })
    .select('companyName email subscription.purchases')
    .lean()

  // Flatten purchases with partner info
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
            plan: purchase.plan,
            planName: SUBSCRIPTION_PLANS[purchase.plan]?.name || purchase.plan,
            period: purchase.period,
            price: purchase.price,
            payment: purchase.payment,
            status: purchase.status,
            createdAt: purchase.createdAt
          }
        })
      }
    }
  }

  // Sort by createdAt desc (newest first)
  allPurchases.sort((a, b) => new Date(b.purchase.createdAt) - new Date(a.purchase.createdAt))

  res.json({
    success: true,
    data: allPurchases
  })
})

/**
 * Get available subscription plans
 */
export const getSubscriptionPlans = asyncHandler(async (req, res) => {
  const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, value]) => ({
    id: key,
    ...value
  }))

  res.json({
    success: true,
    data: plans
  })
})

/**
 * Get partner subscription details
 */
export const getSubscription = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Use the helper method to get full subscription status
  const subscriptionStatus = partner.getSubscriptionStatus()

  res.json({
    success: true,
    data: subscriptionStatus
  })
})

/**
 * Update partner subscription settings (customLimits, status, notes)
 * Note: Plan and dates are managed through purchases
 */
export const updateSubscription = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { customLimits, notes, status } = req.body

  // Initialize subscription if not exists
  if (!partner.subscription) {
    partner.subscription = { purchases: [] }
  }

  // Update status (for manual override like suspend/cancel)
  if (status) {
    const validStatuses = ['active', 'cancelled', 'suspended']
    if (!validStatuses.includes(status)) {
      throw new BadRequestError('INVALID_SUBSCRIPTION_STATUS')
    }
    partner.subscription.status = status
    logger.info(`Partner ${partner._id} subscription status set to: ${status}`)
  }

  // Update custom limits
  if (customLimits !== undefined) {
    if (!partner.subscription.customLimits) {
      partner.subscription.customLimits = {}
    }

    // Handle pmsMaxHotels
    if (customLimits.pmsMaxHotels !== undefined) {
      const pmsLimit = customLimits.pmsMaxHotels

      // Validate: must be -1 (unlimited), 0 (disabled), null (use plan default), or positive number
      if (pmsLimit !== null && pmsLimit !== -1 && pmsLimit < 0) {
        throw new BadRequestError('INVALID_PMS_LIMIT')
      }

      partner.subscription.customLimits.pmsMaxHotels = pmsLimit

      // Update pmsIntegration.enabled based on custom limit
      if (pmsLimit > 0 || pmsLimit === -1) {
        if (!partner.pmsIntegration) {
          partner.pmsIntegration = {}
        }
        partner.pmsIntegration.enabled = true
      } else if (pmsLimit === 0) {
        if (partner.pmsIntegration) {
          partner.pmsIntegration.enabled = false
        }
      }

      logger.info(`Partner ${partner._id} custom PMS limit set: ${pmsLimit}`)
    }
  }

  // Update notes
  if (notes !== undefined) {
    partner.subscription.notes = notes
  }

  await partner.save()

  // Return updated subscription status
  const subscriptionStatus = partner.getSubscriptionStatus()

  res.json({
    success: true,
    message: req.t ? req.t('SUBSCRIPTION_UPDATED') : 'Subscription updated successfully',
    data: subscriptionStatus
  })
})

/**
 * Add purchase (package) to partner subscription
 * @param {boolean} isPaid - If false, creates a pending purchase awaiting payment
 */
export const addPurchase = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const {
    plan,
    startDate,
    endDate,
    amount,
    currency,
    isPaid = true,
    paymentDate,
    paymentMethod,
    paymentReference,
    paymentNotes
  } = req.body

  // Validate required fields
  if (!plan || !startDate || !endDate || !amount) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  // Validate plan
  if (!PLAN_TYPES.includes(plan)) {
    throw new BadRequestError('INVALID_SUBSCRIPTION_PLAN')
  }

  // Initialize subscription if not exists
  if (!partner.subscription) {
    partner.subscription = { purchases: [] }
  }
  if (!partner.subscription.purchases) {
    partner.subscription.purchases = []
  }

  // Mark previous active purchases as expired (if their end date has passed)
  const now = new Date()
  partner.subscription.purchases.forEach(p => {
    if (p.status === 'active' && new Date(p.period.endDate) < now) {
      p.status = 'expired'
    }
  })

  // Create purchase object - always starts as 'pending', requires manual approval
  const purchase = {
    plan,
    period: {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    },
    price: {
      amount,
      currency: currency || 'USD'
    },
    status: 'pending', // Always pending - must be approved via "Mark as Paid"
    createdAt: new Date(),
    createdBy: req.user._id
  }

  // Add purchase to array
  partner.subscription.purchases.push(purchase)

  await partner.save()

  // Get the added purchase with its generated _id
  const addedPurchase = partner.subscription.purchases[partner.subscription.purchases.length - 1]

  logger.info(
    `Purchase added for partner ${partner._id}: ${plan} - ${amount} ${currency || 'USD'} (pending - awaiting payment approval)`
  )

  res.json({
    success: true,
    message: req.t ? req.t('PURCHASE_ADDED') : 'Purchase added successfully',
    data: {
      purchase: {
        _id: addedPurchase._id,
        plan: addedPurchase.plan,
        planName: SUBSCRIPTION_PLANS[addedPurchase.plan]?.name || addedPurchase.plan,
        period: addedPurchase.period,
        price: addedPurchase.price,
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

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { purchaseId } = req.params
  const {
    plan,
    startDate,
    endDate,
    amount,
    currency,
    paymentMethod,
    paymentReference,
    paymentNotes
  } = req.body

  const purchase = partner.subscription?.purchases?.find(p => p._id.toString() === purchaseId)

  if (!purchase) {
    throw new NotFoundError('PURCHASE_NOT_FOUND')
  }

  // Only pending or active purchases can be edited
  if (!['pending', 'active'].includes(purchase.status)) {
    throw new BadRequestError('PURCHASE_CANNOT_BE_EDITED')
  }

  // Update fields if provided
  if (plan) {
    if (!PLAN_TYPES.includes(plan)) {
      throw new BadRequestError('INVALID_SUBSCRIPTION_PLAN')
    }
    purchase.plan = plan
  }

  if (startDate) purchase.period.startDate = new Date(startDate)
  if (endDate) purchase.period.endDate = new Date(endDate)

  if (amount !== undefined) purchase.price.amount = amount
  if (currency) purchase.price.currency = currency

  // Update payment info if provided (for pending purchases)
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
        plan: purchase.plan,
        planName: SUBSCRIPTION_PLANS[purchase.plan]?.name || purchase.plan,
        period: purchase.period,
        price: purchase.price,
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

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { purchaseId } = req.params
  const { paymentDate, paymentMethod, paymentReference, paymentNotes } = req.body

  if (!paymentDate) {
    throw new BadRequestError('PAYMENT_DATE_REQUIRED')
  }

  const purchase = partner.subscription?.purchases?.find(p => p._id.toString() === purchaseId)

  if (!purchase) {
    throw new NotFoundError('PURCHASE_NOT_FOUND')
  }

  if (purchase.status !== 'pending') {
    throw new BadRequestError('PURCHASE_NOT_PENDING')
  }

  // Update purchase status and payment info
  purchase.status = 'active'
  purchase.payment = {
    date: new Date(paymentDate),
    method: paymentMethod || 'bank_transfer',
    reference: paymentReference,
    notes: paymentNotes
  }

  // Update general subscription status
  partner.subscription.status = 'active'

  // Update PMS integration based on plan
  const planConfig = SUBSCRIPTION_PLANS[purchase.plan]
  if (planConfig?.pmsEnabled) {
    if (!partner.pmsIntegration) {
      partner.pmsIntegration = {}
    }
    partner.pmsIntegration.enabled = true
  }

  await partner.save()

  // Create invoice for the purchase
  let invoice = null
  try {
    invoice = await createInvoice(partner._id, purchase, req.user._id)

    // Update purchase with invoice reference
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
        plan: purchase.plan,
        planName: SUBSCRIPTION_PLANS[purchase.plan]?.name || purchase.plan,
        period: purchase.period,
        price: purchase.price,
        payment: purchase.payment,
        status: purchase.status,
        invoice: invoice
          ? {
              _id: invoice._id,
              invoiceNumber: invoice.invoiceNumber
            }
          : null
      },
      subscription: partner.getSubscriptionStatus()
    }
  })
})

/**
 * Cancel purchase from partner subscription
 */
export const cancelPurchase = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { purchaseId } = req.params
  const { reason } = req.body

  const purchase = partner.subscription?.purchases?.find(p => p._id.toString() === purchaseId)

  if (!purchase) {
    throw new NotFoundError('PURCHASE_NOT_FOUND')
  }

  if (purchase.status === 'cancelled') {
    throw new BadRequestError('PURCHASE_ALREADY_CANCELLED')
  }

  // Cancel the purchase
  purchase.status = 'cancelled'
  purchase.cancelledAt = new Date()
  purchase.cancelledBy = req.user._id
  purchase.cancellationReason = reason

  // Recalculate subscription status
  partner.subscription.status = partner.calculateSubscriptionStatus()

  await partner.save()

  logger.info(`Purchase ${purchaseId} cancelled for partner ${partner._id}`)

  res.json({
    success: true,
    message: req.t ? req.t('PURCHASE_CANCELLED') : 'Purchase cancelled successfully',
    data: {
      subscription: partner.getSubscriptionStatus()
    }
  })
})

// ==================== NEW: Membership Package/Service Assignment ====================

/**
 * Assign a membership package to a partner
 */
export const assignPackage = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const { packageId, startDate, endDate, amount, currency, paymentMethod, notes } = req.body

  if (!packageId) throw new BadRequestError('PACKAGE_ID_REQUIRED')

  const pkg = await MembershipPackage.findById(packageId).populate('services.service')
  if (!pkg) throw new NotFoundError('PACKAGE_NOT_FOUND')
  if (pkg.status !== 'active') throw new BadRequestError('PACKAGE_NOT_ACTIVE')

  // Validate partner type compatibility
  if (pkg.targetPartnerType !== 'all' && pkg.targetPartnerType !== partner.partnerType) {
    throw new BadRequestError('PACKAGE_NOT_COMPATIBLE_WITH_PARTNER_TYPE')
  }

  // Initialize subscription if not exists
  if (!partner.subscription) {
    partner.subscription = { purchases: [] }
  }
  if (!partner.subscription.purchases) {
    partner.subscription.purchases = []
  }

  // Set current package
  partner.subscription.currentPackage = pkg._id

  // Determine price
  const purchaseCurrency = currency || partner.currency || 'TRY'
  const purchaseAmount = amount !== undefined ? amount : pkg.getPrice(purchaseCurrency)

  // Calculate period
  const start = startDate ? new Date(startDate) : new Date()
  let end
  if (endDate) {
    end = new Date(endDate)
  } else {
    end = new Date(start)
    if (pkg.pricing.interval === 'yearly') {
      end.setFullYear(end.getFullYear() + 1)
    } else {
      end.setMonth(end.getMonth() + 1)
    }
  }

  // Create purchase record
  const purchase = {
    purchaseType: 'package',
    package: pkg._id,
    plan: null,
    period: { startDate: start, endDate: end },
    price: { amount: purchaseAmount, currency: purchaseCurrency },
    status: 'pending',
    createdAt: new Date(),
    createdBy: req.user._id
  }

  partner.subscription.purchases.push(purchase)
  await partner.save()

  const addedPurchase = partner.subscription.purchases[partner.subscription.purchases.length - 1]

  logger.info(`Package "${pkg.code}" assigned to partner ${partner._id} (pending)`)

  res.json({
    success: true,
    message: 'PACKAGE_ASSIGNED',
    data: {
      purchase: {
        _id: addedPurchase._id,
        purchaseType: 'package',
        package: { _id: pkg._id, name: pkg.name, code: pkg.code },
        period: addedPurchase.period,
        price: addedPurchase.price,
        status: addedPurchase.status
      },
      subscription: partner.getSubscriptionStatus()
    }
  })
})

/**
 * Add individual service to a partner
 */
export const addService = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const { serviceId, featureOverrides, startDate, endDate, amount, currency } = req.body

  if (!serviceId) throw new BadRequestError('SERVICE_ID_REQUIRED')

  const svc = await MembershipService.findById(serviceId)
  if (!svc) throw new NotFoundError('SERVICE_NOT_FOUND')
  if (svc.status !== 'active') throw new BadRequestError('SERVICE_NOT_ACTIVE')

  // Initialize subscription
  if (!partner.subscription) {
    partner.subscription = { purchases: [], individualServices: [] }
  }
  if (!partner.subscription.individualServices) {
    partner.subscription.individualServices = []
  }
  if (!partner.subscription.purchases) {
    partner.subscription.purchases = []
  }

  // Check if already has this service individually
  const existingIdx = partner.subscription.individualServices.findIndex(
    s => s.service?.toString() === serviceId && s.status === 'active'
  )
  if (existingIdx !== -1) {
    throw new BadRequestError('SERVICE_ALREADY_ASSIGNED')
  }

  // Add to individual services
  const start = startDate ? new Date(startDate) : new Date()
  let end = endDate ? new Date(endDate) : null

  // For recurring services, auto-calculate end date
  if (!end && svc.pricing.billingType === 'recurring') {
    end = new Date(start)
    if (svc.pricing.interval === 'yearly') {
      end.setFullYear(end.getFullYear() + 1)
    } else {
      end.setMonth(end.getMonth() + 1)
    }
  }

  partner.subscription.individualServices.push({
    service: svc._id,
    featureOverrides: featureOverrides ? new Map(Object.entries(featureOverrides)) : undefined,
    billingType: svc.pricing.billingType,
    status: 'active',
    startDate: start,
    endDate: end,
    addedAt: new Date(),
    addedBy: req.user._id
  })

  // Create purchase record
  const purchaseCurrency = currency || partner.currency || 'TRY'
  const purchaseAmount = amount !== undefined ? amount : svc.getPrice(purchaseCurrency)

  const purchase = {
    purchaseType: 'service',
    service: svc._id,
    plan: null,
    period: {
      startDate: start,
      endDate: end || new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year default for one_time
    },
    price: { amount: purchaseAmount, currency: purchaseCurrency },
    status: 'pending',
    createdAt: new Date(),
    createdBy: req.user._id
  }

  partner.subscription.purchases.push(purchase)
  await partner.save()

  logger.info(`Service "${svc.code}" added to partner ${partner._id}`)

  res.json({
    success: true,
    message: 'SERVICE_ADDED',
    data: {
      service: { _id: svc._id, name: svc.name, code: svc.code },
      subscription: partner.getSubscriptionStatus()
    }
  })
})

/**
 * Remove individual service from a partner
 */
export const removeService = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)
  if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')

  const { serviceId } = req.params

  const indSvc = partner.subscription?.individualServices?.find(
    s => s._id.toString() === serviceId || s.service?.toString() === serviceId
  )

  if (!indSvc) {
    throw new NotFoundError('SERVICE_NOT_FOUND_ON_PARTNER')
  }

  indSvc.status = 'cancelled'
  await partner.save()

  logger.info(`Service removed from partner ${partner._id}`)

  res.json({
    success: true,
    message: 'SERVICE_REMOVED',
    data: {
      subscription: partner.getSubscriptionStatus()
    }
  })
})
