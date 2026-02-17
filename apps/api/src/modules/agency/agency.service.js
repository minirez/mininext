import Agency from './agency.model.js'
import Partner from '../partner/partner.model.js'
import User from '../user/user.model.js'
import { NotFoundError, ConflictError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { getPartnerId } from '#services/helpers.js'
import { parsePagination } from '#services/queryBuilder.js'
import { sendWelcomeEmail } from '#helpers/mail.js'
import crypto from 'crypto'
import logger from '#core/logger.js'
import config from '#config'

// Generate random password (must satisfy: uppercase + lowercase + number)
const generatePassword = () => {
  const base = crypto.randomBytes(6).toString('hex') // lowercase + digits
  const upper = String.fromCharCode(65 + crypto.randomInt(26)) // random A-Z
  return upper + base + crypto.randomInt(10) // e.g. "Xa3f1b9c2e7d4"
}

// Create agency
export const createAgency = asyncHandler(async (req, res) => {
  const partnerId = req.body.partner || getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('REQUIRED_PARTNER')
  }

  // Verify partner exists and is active
  const partner = await Partner.findById(partnerId)
  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }
  if (!partner.isActive()) {
    throw new BadRequestError('PARTNER_NOT_ACTIVE')
  }

  const agency = await Agency.create({
    ...req.body,
    partner: partnerId
  })

  // Create admin user for agency
  const tempPassword = generatePassword()
  const agencyName = agency.companyName || agency.name
  const adminUser = await User.create({
    accountType: 'agency',
    accountId: agency._id,
    name: (req.body.contactPerson?.name || agencyName) + ' Admin',
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
      accountType: 'Agency',
      partnerId: partner._id,
      loginUrl: partner.branding?.extranetDomain
        ? `https://${partner.branding.extranetDomain}/login`
        : `${config.adminUrl}/login`
    })
    logger.info(`Welcome email sent to agency admin: ${adminUser.email}`)
  } catch (error) {
    logger.error(`Failed to send welcome email: ${error.message}`)
  }

  // Update partner stats
  await Partner.findByIdAndUpdate(partnerId, {
    $inc: { 'stats.totalAgencies': 1 }
  })

  res.status(201).json({
    success: true,
    message: req.t('AGENCY_CREATED'),
    data: {
      agency,
      adminUser: {
        email: adminUser.email,
        tempPassword // Remove this in production, only send via email
      }
    }
  })
})

// Get all agencies
export const getAgencies = asyncHandler(async (req, res) => {
  const { partner, status, search } = req.query
  const { page, limit, skip } = parsePagination(req.query)

  // Build filter
  const filter = {}

  // Resolve partner context (partner user, PMS context, platform admin)
  const resolvedPartnerId = partner || getPartnerId(req)
  if (resolvedPartnerId) {
    filter.partner = resolvedPartnerId
  }

  if (status) filter.status = status
  if (search) {
    filter.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { taxNumber: { $regex: search, $options: 'i' } }
    ]
  }

  // Pagination
  const total = await Agency.countDocuments(filter)
  const agencies = await Agency.find(filter)
    .populate('partner', 'companyName email status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  res.json({
    success: true,
    data: {
      agencies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

// Get agency by ID
export const getAgency = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id).populate('partner')

  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  res.json({
    success: true,
    data: agency
  })
})

// Update agency
export const updateAgency = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)

  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Update only allowed fields (security: prevent mass assignment)
  const allowedFields = [
    'companyName',
    'tradeName',
    'name',
    'taxOffice',
    'taxNumber',
    'contactPerson',
    'email',
    'phone',
    'address',
    'settings',
    'commission',
    'notes',
    'preferredCurrency',
    'paymentTerms'
  ]

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      agency[field] = req.body[field]
    }
  })

  await agency.save()

  res.json({
    success: true,
    message: req.t('AGENCY_UPDATED'),
    data: agency
  })
})

// Delete agency
export const deleteAgency = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)

  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Check if agency has users
  const usersCount = await User.countDocuments({
    accountType: 'agency',
    accountId: agency._id
  })

  if (usersCount > 0) {
    throw new ConflictError('AGENCY_HAS_USERS')
  }

  const partnerId = agency.partner

  await agency.deleteOne()

  // Update partner stats
  await Partner.findByIdAndUpdate(partnerId, {
    $inc: { 'stats.totalAgencies': -1 }
  })

  res.json({
    success: true,
    message: req.t('AGENCY_DELETED')
  })
})

// Activate agency
export const activateAgency = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)

  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  await agency.activate()

  res.json({
    success: true,
    message: req.t('AGENCY_ACTIVATED'),
    data: agency
  })
})

// Deactivate agency
export const deactivateAgency = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)

  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  await agency.deactivate()

  res.json({
    success: true,
    message: req.t('AGENCY_DEACTIVATED'),
    data: agency
  })
})

// Get agency users
export const getAgencyUsers = asyncHandler(async (req, res) => {
  const { status, search, role } = req.query
  const { page, limit, skip } = parsePagination(req.query)
  const agencyId = req.params.id

  // Get agency and verify ownership
  const agency = await Agency.findById(agencyId)
  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Check ownership for partner users
  if (
    req.user.accountType === 'partner' &&
    agency.partner.toString() !== req.user.accountId.toString()
  ) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Build filter
  const filter = {
    accountType: 'agency',
    accountId: agencyId
  }

  if (status) filter.status = status
  if (role) filter.role = role
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  // Pagination
  const total = await User.countDocuments(filter)
  const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)

  res.json({
    success: true,
    data: {
      agency,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

// Create agency user
export const createAgencyUser = asyncHandler(async (req, res) => {
  const agencyId = req.params.id

  // Get agency and verify ownership
  const agency = await Agency.findById(agencyId)
  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Check ownership for partner users
  if (
    req.user.accountType === 'partner' &&
    agency.partner.toString() !== req.user.accountId.toString()
  ) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Create user for this agency
  const user = await User.create({
    ...req.body,
    accountType: 'agency',
    accountId: agencyId
  })

  // Remove password from response
  const userObj = user.toObject()
  delete userObj.password

  res.status(201).json({
    success: true,
    message: req.t('USER_CREATED'),
    data: userObj
  })
})

// Update agency user
export const updateAgencyUser = asyncHandler(async (req, res) => {
  const { id: agencyId, userId } = req.params

  // Get agency and verify ownership
  const agency = await Agency.findById(agencyId)
  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Check ownership for partner users
  if (
    req.user.accountType === 'partner' &&
    agency.partner.toString() !== req.user.accountId.toString()
  ) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Get user and verify it belongs to this agency
  const user = await User.findById(userId)
  if (!user || user.accountType !== 'agency' || user.accountId.toString() !== agencyId) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Update only allowed fields (security: prevent mass assignment)
  const allowedFields = [
    'name',
    'email',
    'phone',
    'role',
    'permissions',
    'preferredLanguage',
    'avatar',
    'notificationSettings'
  ]

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field]
    }
  })

  await user.save()

  const userObj = user.toObject()
  delete userObj.password

  res.json({
    success: true,
    message: req.t('USER_UPDATED'),
    data: userObj
  })
})

// Delete agency user
export const deleteAgencyUser = asyncHandler(async (req, res) => {
  const { id: agencyId, userId } = req.params

  // Get agency and verify ownership
  const agency = await Agency.findById(agencyId)
  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Check ownership for partner users
  if (
    req.user.accountType === 'partner' &&
    agency.partner.toString() !== req.user.accountId.toString()
  ) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Get user and verify it belongs to this agency
  const user = await User.findById(userId)
  if (!user || user.accountType !== 'agency' || user.accountId.toString() !== agencyId) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Cannot delete yourself
  if (user._id.toString() === req.user._id.toString()) {
    throw new BadRequestError('CANNOT_DELETE_YOURSELF')
  }

  await user.deleteOne()

  res.json({
    success: true,
    message: req.t('USER_DELETED')
  })
})

// Approve agency (activate agency and user)
export const approveAgency = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)

  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Check ownership for partner users
  if (
    req.user.accountType === 'partner' &&
    agency.partner.toString() !== req.user.accountId.toString()
  ) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  if (agency.status !== 'pending') {
    throw new ConflictError('AGENCY_NOT_PENDING')
  }

  // Activate agency
  await agency.activate()

  // Activate agency admin user
  await User.updateOne(
    { accountType: 'agency', accountId: agency._id, role: 'admin' },
    { status: 'active' }
  )

  res.json({
    success: true,
    message: req.t('AGENCY_APPROVED'),
    data: agency
  })
})

// Upload agency document
export const uploadDocument = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)

  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Check ownership for partner users
  if (
    req.user.accountType === 'partner' &&
    agency.partner.toString() !== req.user.accountId.toString()
  ) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  if (!req.file) {
    throw new BadRequestError('NO_FILE_UPLOADED')
  }

  const { documentType } = req.body

  if (
    !documentType ||
    !['license', 'tax_certificate', 'contract', 'other'].includes(documentType)
  ) {
    throw new BadRequestError('INVALID_DOCUMENT_TYPE')
  }

  // Add document
  agency.documents.push({
    type: documentType,
    name: req.file.originalname,
    url: req.file.path,
    uploadedAt: new Date()
  })

  await agency.save()

  res.json({
    success: true,
    message: req.t('DOCUMENT_UPLOADED'),
    data: { agency }
  })
})

// Delete agency document
export const deleteDocument = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)

  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Check ownership for partner users
  if (
    req.user.accountType === 'partner' &&
    agency.partner.toString() !== req.user.accountId.toString()
  ) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  const documentId = req.params.documentId
  const documentIndex = agency.documents.findIndex(doc => doc._id.toString() === documentId)

  if (documentIndex === -1) {
    throw new NotFoundError('DOCUMENT_NOT_FOUND')
  }

  // Remove document
  agency.documents.splice(documentIndex, 1)
  await agency.save()

  res.json({
    success: true,
    message: req.t('DOCUMENT_DELETED'),
    data: agency
  })
})

// Serve agency document (authenticated)
export const serveDocument = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)

  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Check ownership for partner users
  if (
    req.user.accountType === 'partner' &&
    agency.partner.toString() !== req.user.accountId.toString()
  ) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  const documentId = req.params.documentId
  const document = agency.documents.find(doc => doc._id.toString() === documentId)

  if (!document) {
    throw new NotFoundError('DOCUMENT_NOT_FOUND')
  }

  // Send file
  res.sendFile(document.url, { root: '.' })
})

// Suspend agency
export const suspendAgency = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)

  if (!agency) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  // Check ownership for partner users
  if (
    req.user.accountType === 'partner' &&
    agency.partner.toString() !== req.user.accountId.toString()
  ) {
    throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  await agency.suspend()

  res.json({
    success: true,
    message: req.t('AGENCY_SUSPENDED'),
    data: agency
  })
})
