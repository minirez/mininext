import SubscriptionPackage from './subscription-package.model.js'
import SubscriptionService from '#modules/subscription-service/subscription-service.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import logger from '#core/logger.js'

/**
 * Recalculate calculatedPrice from linked services
 */
async function recalcPrice(pkg) {
  if (!pkg.services?.length) {
    pkg.calculatedPrice = 0
    return
  }
  const services = await SubscriptionService.find({ _id: { $in: pkg.services } })
  pkg.calculatedPrice = services.reduce((sum, s) => sum + (s.price || 0), 0)
}

/**
 * List all packages (admin) – optionally filter by isActive
 */
export const list = asyncHandler(async (req, res) => {
  const { active } = req.query
  const query = {}
  if (active !== undefined) query.isActive = active === 'true'

  const packages = await SubscriptionPackage.find(query)
    .populate('services', 'name slug price billingPeriod entitlements isActive')
    .sort({ sortOrder: 1, createdAt: -1 })

  res.json({ success: true, data: packages })
})

/**
 * List active packages (public / partner-facing)
 */
export const listActive = asyncHandler(async (req, res) => {
  const packages = await SubscriptionPackage.find({ isActive: true })
    .populate('services', 'name slug price billingPeriod entitlements isActive')
    .sort({ sortOrder: 1 })

  res.json({ success: true, data: packages })
})

/**
 * Get single package by id
 */
export const getById = asyncHandler(async (req, res) => {
  const pkg = await SubscriptionPackage.findById(req.params.id).populate(
    'services',
    'name slug price billingPeriod entitlements isActive'
  )

  if (!pkg) throw new NotFoundError('PACKAGE_NOT_FOUND')

  res.json({ success: true, data: pkg })
})

/**
 * Create package (admin)
 */
export const create = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    slug,
    services,
    overridePrice,
    billingPeriod,
    trialDays,
    sortOrder,
    targetPartnerType,
    icon,
    color,
    badge,
    isPublic
  } = req.body

  if (!name?.tr || !name?.en) throw new BadRequestError('NAME_REQUIRED')
  if (!slug) throw new BadRequestError('SLUG_REQUIRED')

  if (services?.length) {
    const count = await SubscriptionService.countDocuments({ _id: { $in: services } })
    if (count !== services.length) throw new BadRequestError('INVALID_SERVICE_IDS')
  }

  const pkg = new SubscriptionPackage({
    name,
    description,
    slug,
    services: services || [],
    overridePrice: overridePrice ?? null,
    billingPeriod,
    trialDays: trialDays ?? 15,
    sortOrder,
    targetPartnerType: targetPartnerType || 'all',
    icon: icon || 'inventory_2',
    color: color || '#6366f1',
    badge: badge || '',
    isPublic: isPublic !== false
  })

  await recalcPrice(pkg)
  await pkg.save()

  // Populate services before returning
  await pkg.populate('services', 'name slug price billingPeriod entitlements isActive')

  logger.info(`SubscriptionPackage created: ${pkg.slug} (${pkg._id})`)

  res.status(201).json({ success: true, data: pkg })
})

/**
 * Update package (admin)
 */
export const update = asyncHandler(async (req, res) => {
  const pkg = await SubscriptionPackage.findById(req.params.id)
  if (!pkg) throw new NotFoundError('PACKAGE_NOT_FOUND')

  const allowedFields = [
    'name',
    'description',
    'slug',
    'services',
    'overridePrice',
    'billingPeriod',
    'trialDays',
    'sortOrder',
    'isActive',
    'targetPartnerType',
    'icon',
    'color',
    'badge',
    'isPublic'
  ]

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      pkg[field] = req.body[field]
    }
  }

  // Validate services
  if (req.body.services !== undefined && pkg.services?.length) {
    const count = await SubscriptionService.countDocuments({ _id: { $in: pkg.services } })
    if (count !== pkg.services.length) throw new BadRequestError('INVALID_SERVICE_IDS')
  }

  await recalcPrice(pkg)
  await pkg.save()

  await pkg.populate('services', 'name slug price billingPeriod entitlements isActive')

  logger.info(`SubscriptionPackage updated: ${pkg.slug} (${pkg._id})`)

  res.json({ success: true, data: pkg })
})

/**
 * Delete package (admin) – hard delete
 */
export const remove = asyncHandler(async (req, res) => {
  const pkg = await SubscriptionPackage.findById(req.params.id)
  if (!pkg) throw new NotFoundError('PACKAGE_NOT_FOUND')

  await pkg.deleteOne()

  logger.info(`SubscriptionPackage deleted: ${pkg.slug} (${pkg._id})`)

  res.json({ success: true, message: 'Package deleted' })
})
