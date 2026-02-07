import Partner from './partner.model.js'
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
  }).select('companyName email subscription.purchases').lean()

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
  const { plan, startDate, endDate, amount, currency, paymentMethod, paymentReference, paymentNotes } = req.body

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
