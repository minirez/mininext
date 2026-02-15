import Partner from './partner.model.js'
import { escapeRegex } from '#helpers'
import User from '../user/user.model.js'
import Agency from '../agency/agency.model.js'
import { NotFoundError, ConflictError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { sendWelcomeEmail, sendActivationEmail } from '#helpers/mail.js'
import { parsePagination } from '#services/queryBuilder.js'
import crypto from 'crypto'
import logger from '#core/logger.js'

// Generate random password that meets complexity requirements (uppercase + lowercase + number)
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.randomBytes(12)
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length]
  }
  // Ensure at least one of each required type
  return password[0].toUpperCase() + password.slice(1, 11) + String(bytes[11] % 10)
}

// Create partner
export const createPartner = asyncHandler(async (req, res) => {
  const partner = await Partner.create(req.body)

  // Create admin user for partner
  const tempPassword = generatePassword()
  const adminUser = await User.create({
    accountType: 'partner',
    accountId: partner._id,
    name: req.body.companyName + ' Admin',
    email: req.body.email,
    password: tempPassword,
    role: 'admin',
    status: 'active'
  })

  // Send welcome email with credentials
  try {
    await sendWelcomeEmail({
      to: adminUser.email,
      name: adminUser.name,
      email: adminUser.email,
      password: tempPassword,
      accountType: 'Partner',
      loginUrl: partner.branding?.siteDomain
        ? `https://${partner.branding.siteDomain}/login`
        : 'https://admin.booking-engine.com/login'
    })
    logger.info(`Welcome email sent to partner admin: ${adminUser.email}`)
  } catch (error) {
    logger.error(`Failed to send welcome email: ${error.message}`)
  }

  res.status(201).json({
    success: true,
    message: req.t('PARTNER_CREATED'),
    data: {
      partner,
      adminUser: {
        email: adminUser.email,
        tempPassword // Remove this in production, only send via email
      }
    }
  })
})

// Get all partners
export const getPartners = asyncHandler(async (req, res) => {
  const { status, search } = req.query
  const { page, limit, skip } = parsePagination(req.query)

  // Build filter
  const filter = {}
  if (status) filter.status = status
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
