import MembershipService from './membership-service.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import logger from '#core/logger.js'

/**
 * Get all membership services (admin)
 * Filters: status, category, search
 */
export const getList = asyncHandler(async (req, res) => {
  const { status, category, search } = req.query

  const filter = {}

  if (status) {
    filter.status = status
  }

  if (category) {
    filter.category = category
  }

  if (search) {
    filter.$or = [
      { 'name.tr': { $regex: search, $options: 'i' } },
      { 'name.en': { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ]
  }

  const items = await MembershipService.find(filter).sort({ sortOrder: 1, 'name.tr': 1 })

  res.json({
    success: true,
    data: items
  })
})

/**
 * Get single membership service by ID
 */
export const getById = asyncHandler(async (req, res) => {
  const item = await MembershipService.findById(req.params.id)

  if (!item) {
    throw new NotFoundError('MEMBERSHIP_SERVICE_NOT_FOUND')
  }

  res.json({
    success: true,
    data: item
  })
})

/**
 * Create new membership service
 */
export const create = asyncHandler(async (req, res) => {
  const { name, description, code, category, pricing, features, icon, sortOrder, status } = req.body

  if (!name?.tr || !name?.en) {
    throw new BadRequestError('NAME_REQUIRED')
  }

  if (!code) {
    throw new BadRequestError('CODE_REQUIRED')
  }

  // Check duplicate code
  const existing = await MembershipService.findOne({ code: code.toLowerCase() })
  if (existing) {
    throw new BadRequestError('SERVICE_CODE_EXISTS')
  }

  const item = await MembershipService.create({
    name,
    description,
    code,
    category,
    pricing,
    features: features ? new Map(Object.entries(features)) : undefined,
    icon,
    sortOrder,
    status,
    createdBy: req.user._id
  })

  logger.info(`Membership service created: ${code} by user ${req.user._id}`)

  res.status(201).json({
    success: true,
    data: item,
    message: 'MEMBERSHIP_SERVICE_CREATED'
  })
})

/**
 * Update membership service
 */
export const update = asyncHandler(async (req, res) => {
  const item = await MembershipService.findById(req.params.id)

  if (!item) {
    throw new NotFoundError('MEMBERSHIP_SERVICE_NOT_FOUND')
  }

  if (item.status === 'archived') {
    throw new BadRequestError('ARCHIVED_SERVICE_CANNOT_BE_EDITED')
  }

  const { name, description, code, category, pricing, features, icon, sortOrder, status } = req.body

  // Check duplicate code if changed
  if (code && code !== item.code) {
    const existing = await MembershipService.findOne({
      code: code.toLowerCase(),
      _id: { $ne: item._id }
    })
    if (existing) {
      throw new BadRequestError('SERVICE_CODE_EXISTS')
    }
  }

  if (name) item.name = name
  if (description !== undefined) item.description = description
  if (code) item.code = code
  if (category) item.category = category
  if (pricing) item.pricing = pricing
  if (features !== undefined) item.features = new Map(Object.entries(features))
  if (icon !== undefined) item.icon = icon
  if (sortOrder !== undefined) item.sortOrder = sortOrder
  if (status) item.status = status
  item.updatedBy = req.user._id

  await item.save()

  logger.info(`Membership service updated: ${item.code} by user ${req.user._id}`)

  res.json({
    success: true,
    data: item,
    message: 'MEMBERSHIP_SERVICE_UPDATED'
  })
})

/**
 * Archive membership service (soft delete)
 * Active package'da kullanılıyorsa engelle
 */
export const archive = asyncHandler(async (req, res) => {
  const item = await MembershipService.findById(req.params.id)

  if (!item) {
    throw new NotFoundError('MEMBERSHIP_SERVICE_NOT_FOUND')
  }

  if (item.status === 'archived') {
    throw new BadRequestError('SERVICE_ALREADY_ARCHIVED')
  }

  // Check if used in active packages
  const MembershipPackage = (
    await import('#modules/membership-package/membership-package.model.js')
  ).default
  const usedInPackages = await MembershipPackage.countDocuments({
    'services.service': item._id,
    status: 'active'
  })

  if (usedInPackages > 0) {
    throw new BadRequestError('SERVICE_USED_IN_ACTIVE_PACKAGES')
  }

  item.status = 'archived'
  item.updatedBy = req.user._id
  await item.save()

  logger.info(`Membership service archived: ${item.code} by user ${req.user._id}`)

  res.json({
    success: true,
    message: 'MEMBERSHIP_SERVICE_ARCHIVED'
  })
})

/**
 * Get service stats (for dashboard cards)
 */
export const getStats = asyncHandler(async (req, res) => {
  const [total, active, inactive, archived] = await Promise.all([
    MembershipService.countDocuments(),
    MembershipService.countDocuments({ status: 'active' }),
    MembershipService.countDocuments({ status: 'inactive' }),
    MembershipService.countDocuments({ status: 'archived' })
  ])

  res.json({
    success: true,
    data: { total, active, inactive, archived }
  })
})
