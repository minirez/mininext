import MembershipPackage from './membership-package.model.js'
import MembershipService from '#modules/membership-service/membership-service.model.js'
import Partner from '#modules/partner/partner.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import logger from '#core/logger.js'

/**
 * Get all membership packages (admin)
 */
export const getList = asyncHandler(async (req, res) => {
  const { status, partnerType, search } = req.query

  const filter = {}

  if (status) filter.status = status
  if (partnerType) filter.targetPartnerType = { $in: [partnerType, 'all'] }

  if (search) {
    filter.$or = [
      { 'name.tr': { $regex: search, $options: 'i' } },
      { 'name.en': { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ]
  }

  const items = await MembershipPackage.find(filter)
    .populate('services.service', 'name code category pricing icon')
    .sort({ sortOrder: 1, 'name.tr': 1 })

  res.json({
    success: true,
    data: items
  })
})

/**
 * Public catalog (for partner self-service)
 */
export const getPublicCatalog = asyncHandler(async (req, res) => {
  const partnerType = req.user?.partnerType || req.query.partnerType || 'all'

  const items = await MembershipPackage.findPublicCatalog(partnerType)

  res.json({
    success: true,
    data: items
  })
})

/**
 * Get single package by ID (with populated services)
 */
export const getById = asyncHandler(async (req, res) => {
  const item = await MembershipPackage.findById(req.params.id).populate('services.service')

  if (!item) {
    throw new NotFoundError('MEMBERSHIP_PACKAGE_NOT_FOUND')
  }

  res.json({
    success: true,
    data: item
  })
})

/**
 * Create new membership package
 */
export const create = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    code,
    targetPartnerType,
    services,
    pricing,
    trial,
    badge,
    icon,
    color,
    sortOrder,
    isPublic,
    status
  } = req.body

  if (!name?.tr || !name?.en) {
    throw new BadRequestError('NAME_REQUIRED')
  }

  if (!code) {
    throw new BadRequestError('CODE_REQUIRED')
  }

  // Check duplicate code
  const existing = await MembershipPackage.findOne({ code: code.toLowerCase() })
  if (existing) {
    throw new BadRequestError('PACKAGE_CODE_EXISTS')
  }

  // Validate service references
  if (services?.length) {
    const serviceIds = services.map(s => s.service)
    const validServices = await MembershipService.countDocuments({
      _id: { $in: serviceIds },
      status: { $ne: 'archived' }
    })
    if (validServices !== serviceIds.length) {
      throw new BadRequestError('INVALID_SERVICE_REFERENCES')
    }
  }

  const item = await MembershipPackage.create({
    name,
    description,
    code,
    targetPartnerType,
    services: services?.map(s => ({
      service: s.service,
      featureOverrides: s.featureOverrides
        ? new Map(Object.entries(s.featureOverrides))
        : undefined,
      included: s.included !== false
    })),
    pricing,
    trial,
    badge,
    icon,
    color,
    sortOrder,
    isPublic,
    status,
    createdBy: req.user._id
  })

  // Populate services for response
  await item.populate('services.service', 'name code category pricing icon')

  logger.info(`Membership package created: ${code} by user ${req.user._id}`)

  res.status(201).json({
    success: true,
    data: item,
    message: 'MEMBERSHIP_PACKAGE_CREATED'
  })
})

/**
 * Update membership package
 */
export const update = asyncHandler(async (req, res) => {
  const item = await MembershipPackage.findById(req.params.id)

  if (!item) {
    throw new NotFoundError('MEMBERSHIP_PACKAGE_NOT_FOUND')
  }

  if (item.status === 'archived') {
    throw new BadRequestError('ARCHIVED_PACKAGE_CANNOT_BE_EDITED')
  }

  const {
    name,
    description,
    code,
    targetPartnerType,
    services,
    pricing,
    trial,
    badge,
    icon,
    color,
    sortOrder,
    isPublic,
    status
  } = req.body

  // Check duplicate code if changed
  if (code && code !== item.code) {
    const existing = await MembershipPackage.findOne({
      code: code.toLowerCase(),
      _id: { $ne: item._id }
    })
    if (existing) {
      throw new BadRequestError('PACKAGE_CODE_EXISTS')
    }
  }

  // Validate service references if changed
  if (services?.length) {
    const serviceIds = services.map(s => s.service)
    const validServices = await MembershipService.countDocuments({
      _id: { $in: serviceIds },
      status: { $ne: 'archived' }
    })
    if (validServices !== serviceIds.length) {
      throw new BadRequestError('INVALID_SERVICE_REFERENCES')
    }
  }

  if (name) item.name = name
  if (description !== undefined) item.description = description
  if (code) item.code = code
  if (targetPartnerType) item.targetPartnerType = targetPartnerType
  if (services !== undefined) {
    item.services = services.map(s => ({
      service: s.service,
      featureOverrides: s.featureOverrides
        ? new Map(Object.entries(s.featureOverrides))
        : new Map(),
      included: s.included !== false
    }))
  }
  if (pricing) item.pricing = pricing
  if (trial !== undefined) item.trial = trial
  if (badge !== undefined) item.badge = badge
  if (icon !== undefined) item.icon = icon
  if (color !== undefined) item.color = color
  if (sortOrder !== undefined) item.sortOrder = sortOrder
  if (isPublic !== undefined) item.isPublic = isPublic
  if (status) item.status = status
  item.updatedBy = req.user._id

  await item.save()
  await item.populate('services.service', 'name code category pricing icon')

  logger.info(`Membership package updated: ${item.code} by user ${req.user._id}`)

  res.json({
    success: true,
    data: item,
    message: 'MEMBERSHIP_PACKAGE_UPDATED'
  })
})

/**
 * Archive membership package (soft delete)
 * Aktif atama varsa engelle
 */
export const archive = asyncHandler(async (req, res) => {
  const item = await MembershipPackage.findById(req.params.id)

  if (!item) {
    throw new NotFoundError('MEMBERSHIP_PACKAGE_NOT_FOUND')
  }

  if (item.status === 'archived') {
    throw new BadRequestError('PACKAGE_ALREADY_ARCHIVED')
  }

  // Check if any partner is using this package
  const activeAssignments = await Partner.countDocuments({
    'subscription.currentPackage': item._id,
    'subscription.status': { $in: ['active', 'grace_period'] }
  })

  if (activeAssignments > 0) {
    throw new BadRequestError('PACKAGE_HAS_ACTIVE_ASSIGNMENTS')
  }

  item.status = 'archived'
  item.updatedBy = req.user._id
  await item.save()

  logger.info(`Membership package archived: ${item.code} by user ${req.user._id}`)

  res.json({
    success: true,
    message: 'MEMBERSHIP_PACKAGE_ARCHIVED'
  })
})

/**
 * Calculate price for a package in a specific currency
 * Auto mode: sum up service prices
 */
export const calculatePrice = asyncHandler(async (req, res) => {
  const item = await MembershipPackage.findById(req.params.id).populate('services.service')

  if (!item) {
    throw new NotFoundError('MEMBERSHIP_PACKAGE_NOT_FOUND')
  }

  const currency = req.query.currency || 'TRY'
  const price = item.getPrice(currency)

  // Also return per-service breakdown
  const breakdown = item.services
    .filter(s => s.included && s.service)
    .map(s => ({
      service: {
        _id: s.service._id,
        name: s.service.name,
        code: s.service.code
      },
      price: s.service.getPrice(currency),
      currency
    }))

  res.json({
    success: true,
    data: {
      totalPrice: price,
      currency,
      interval: item.pricing.interval,
      priceMode: item.pricing.priceMode,
      breakdown
    }
  })
})

/**
 * Get package stats (for dashboard cards)
 */
export const getStats = asyncHandler(async (req, res) => {
  const [total, active, inactive, archived] = await Promise.all([
    MembershipPackage.countDocuments(),
    MembershipPackage.countDocuments({ status: 'active' }),
    MembershipPackage.countDocuments({ status: 'inactive' }),
    MembershipPackage.countDocuments({ status: 'archived' })
  ])

  // Count partners using packages
  const partnersWithPackage = await Partner.countDocuments({
    'subscription.currentPackage': { $exists: true, $ne: null }
  })

  res.json({
    success: true,
    data: { total, active, inactive, archived, partnersWithPackage }
  })
})
