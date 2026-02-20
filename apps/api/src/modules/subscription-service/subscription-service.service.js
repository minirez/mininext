import SubscriptionService from './subscription-service.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import logger from '#core/logger.js'
import { slugify } from '@booking-engine/utils/string'

/**
 * List all services (admin) – optionally filter by isActive
 */
export const list = asyncHandler(async (req, res) => {
  const { active } = req.query
  const query = {}
  if (active !== undefined) query.isActive = active === 'true'

  const services = await SubscriptionService.find(query).sort({ sortOrder: 1, createdAt: -1 })

  res.json({ success: true, data: services })
})

/**
 * List active services (public / partner facing)
 */
export const listActive = asyncHandler(async (req, res) => {
  const services = await SubscriptionService.find({ isActive: true }).sort({ sortOrder: 1 })
  res.json({ success: true, data: services })
})

/**
 * Get single service by id
 */
export const getById = asyncHandler(async (req, res) => {
  const service = await SubscriptionService.findById(req.params.id)
  if (!service) throw new NotFoundError('SERVICE_NOT_FOUND')

  res.json({ success: true, data: service })
})

/**
 * Create a new service (admin)
 */
export const create = asyncHandler(async (req, res) => {
  const { name, description, slug, price, billingPeriod, entitlements, sortOrder, category, icon } =
    req.body

  if (!name?.tr || !name?.en) throw new BadRequestError('NAME_REQUIRED')

  // Auto-generate slug from English name if not provided
  const finalSlug = slug || slugify(name.en)
  if (!finalSlug) throw new BadRequestError('SLUG_REQUIRED')

  if (price == null || price < 0) throw new BadRequestError('VALID_PRICE_REQUIRED')

  const service = await SubscriptionService.create({
    name,
    description,
    slug: finalSlug,
    price,
    billingPeriod,
    entitlements,
    sortOrder,
    category: category || 'other',
    icon: icon || 'extension'
  })

  logger.info(`SubscriptionService created: ${service.slug} (${service._id})`)

  res.status(201).json({ success: true, data: service })
})

/**
 * Update service (admin)
 */
export const update = asyncHandler(async (req, res) => {
  const service = await SubscriptionService.findById(req.params.id)
  if (!service) throw new NotFoundError('SERVICE_NOT_FOUND')

  const allowedFields = [
    'name',
    'description',
    'slug',
    'price',
    'billingPeriod',
    'entitlements',
    'sortOrder',
    'isActive',
    'category',
    'icon'
  ]

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      service[field] = req.body[field]
    }
  }

  await service.save()

  logger.info(`SubscriptionService updated: ${service.slug} (${service._id})`)

  res.json({ success: true, data: service })
})

/**
 * Delete service (admin) – hard delete only if no packages reference it
 */
export const remove = asyncHandler(async (req, res) => {
  const service = await SubscriptionService.findById(req.params.id)
  if (!service) throw new NotFoundError('SERVICE_NOT_FOUND')

  // Lazy-import to avoid circular dep
  const SubscriptionPackage = (await import('#modules/subscriptions/subscription-package.model.js'))
    .default

  const referencingPackages = await SubscriptionPackage.countDocuments({ services: service._id })
  if (referencingPackages > 0) {
    throw new BadRequestError('SERVICE_IN_USE_BY_PACKAGES')
  }

  await service.deleteOne()

  logger.info(`SubscriptionService deleted: ${service.slug} (${service._id})`)

  res.json({ success: true, message: 'Service deleted' })
})
