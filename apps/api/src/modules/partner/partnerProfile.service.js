import Partner from './partner.model.js'
import { escapeRegex } from '#helpers'
import User from '../user/user.model.js'
import Agency from '../agency/agency.model.js'
import { NotFoundError, ConflictError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { sendActivationEmail } from '#helpers/mail.js'
import { parsePagination } from '#services/queryBuilder.js'
import logger from '#core/logger.js'

// Create partner (always as pending; activation happens via approve flow)
export const createPartner = asyncHandler(async (req, res) => {
  req.body.status = 'pending'
  const partner = await Partner.create(req.body)

  // Create admin user for partner (pending - no password until approved)
  const adminUser = await User.create({
    accountType: 'partner',
    accountId: partner._id,
    name: req.body.companyName + ' Admin',
    email: req.body.email,
    role: 'admin',
    status: 'pending'
  })

  logger.info(
    `Partner created: ${partner.companyName} (${partner._id}), admin user: ${adminUser.email}`
  )

  res.status(201).json({
    success: true,
    message: req.t('PARTNER_CREATED'),
    data: {
      partner,
      adminUser: {
        email: adminUser.email
      }
    }
  })
})

// Get all partners
export const getPartners = asyncHandler(async (req, res) => {
  const { status, search, partnerType } = req.query
  const { page, limit, skip } = parsePagination(req.query)

  // Build filter
  const filter = {}
  if (status) filter.status = status
  if (partnerType) filter.partnerType = partnerType
  if (search) {
    const escapedSearch = escapeRegex(search)
    filter.$or = [
      { companyName: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
      { 'branding.siteDomain': { $regex: escapedSearch, $options: 'i' } }
    ]
  }

  // Pagination
  const total = await Partner.countDocuments(filter)
  const partners = await Partner.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)

  res.json({
    success: true,
    data: {
      partners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

// Get partner by ID
export const getPartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  res.json({
    success: true,
    data: partner
  })
})

// Update partner
export const updatePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Update only allowed fields (security: prevent mass assignment)
  const allowedFields = [
    'companyName',
    'tradeName',
    'email',
    'phone',
    'taxOffice',
    'taxNumber',
    'address',
    'branding',
    'settings',
    'contactPerson',
    'notes',
    'status',
    'partnerType',
    'paymentSettings'
  ]

  // Prevent setting status to 'active' via update; activation must go through the approve flow
  if (req.body.status === 'active') {
    delete req.body.status
  }

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      partner[field] = req.body[field]
    }
  })

  await partner.save()

  res.json({
    success: true,
    message: req.t('PARTNER_UPDATED'),
    data: partner
  })
})

// Delete partner
export const deletePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Check if partner has agencies - query database directly for accurate count
  const agenciesCount = await Agency.countDocuments({ partnerId: partner._id })
  if (agenciesCount > 0) {
    throw new ConflictError('PARTNER_HAS_AGENCIES')
  }

  // Also delete associated admin user
  await User.deleteMany({ accountType: 'partner', accountId: partner._id })

  await partner.deleteOne()

  res.json({
    success: true,
    message: req.t('PARTNER_DELETED')
  })
})

// Activate partner
export const activatePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  await partner.activate()

  res.json({
    success: true,
    message: req.t('PARTNER_ACTIVATED'),
    data: partner
  })
})

// Deactivate partner
export const deactivatePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  await partner.deactivate()

  res.json({
    success: true,
    message: req.t('PARTNER_DEACTIVATED'),
    data: partner
  })
})

// Approve partner (activate partner and send activation email to user)
export const approvePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  if (partner.status !== 'pending') {
    throw new ConflictError('PARTNER_NOT_PENDING')
  }

  // Find the admin user for this partner
  const adminUser = await User.findOne({
    accountType: 'partner',
    accountId: partner._id,
    role: 'admin'
  })

  if (!adminUser) {
    throw new NotFoundError('PARTNER_ADMIN_USER_NOT_FOUND')
  }

  // Activate partner
  await partner.activate()

  // Generate activation token for user to set their password
  const activationToken = adminUser.generateActivationToken()
  adminUser.status = 'pending_activation' // Keep as pending_activation until they set password
  await adminUser.save()

  // Send activation email
  let activationEmailSent = false
  try {
    logger.info(`Attempting to send activation email to: ${adminUser.email}`)
    await sendActivationEmail({
      to: adminUser.email,
      name: adminUser.name,
      inviterName: 'Booking Engine',
      accountName: partner.companyName,
      userRole: 'Partner Admin',
      token: activationToken,
      partnerId: partner._id,
      partnerCity: partner.address?.city || ''
    })
    activationEmailSent = true
    logger.info(`Activation email sent successfully to partner admin: ${adminUser.email}`)
  } catch (error) {
    logger.error(`Failed to send activation email to ${adminUser.email}:`, error.message || error)
    logger.error('Full error:', JSON.stringify(error, null, 2))
    // Don't fail the approval if email fails - they can request a new one
  }

  res.json({
    success: true,
    message: req.t('PARTNER_APPROVED'),
    data: {
      partner,
      activationEmailSent,
      adminEmail: adminUser.email
    }
  })
})
