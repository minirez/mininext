import crypto from 'crypto'
import User from './user.model.js'
import Partner from '../partner/partner.model.js'
import Agency from '../agency/agency.model.js'
import Session from '../session/session.model.js'
import AuditLog from '../audit/audit.model.js'
import { NotFoundError, ForbiddenError, BadRequestError } from '#core/errors.js'
import { asyncHandler, escapeRegex } from '#helpers'
import { generate2FASecret, generateQRCode, verify2FAToken } from '#helpers/twoFactor.js'
import {
  send2FASetupEmail,
  sendActivationEmail,
  sendWelcomeEmail,
  sendAdminActivatedEmail,
  sendAdminActivatedWithCredentialsEmail
} from '#helpers/mail.js'
import config from '#config'
import logger from '#core/logger.js'
import { parsePagination } from '#services/queryBuilder.js'

// ============================================
// User CRUD
// ============================================

// Create user (sends activation email)
export const createUser = asyncHandler(async (req, res) => {
  const {
    accountType,
    accountId,
    name,
    email,
    role,
    permissions,
    password,
    pmsRole,
    pmsDepartment,
    pmsPermissions,
    pmsHotels,
    position,
    phone
  } = req.body

  // Determine account info
  let targetAccountType = accountType
  let targetAccountId = accountId

  // If not provided, use current user's account
  if (!targetAccountType || !targetAccountId) {
    targetAccountType = req.user.accountType
    targetAccountId = req.user.accountId
  }

  // Verify permissions
  if (req.user.accountType === 'partner') {
    if (
      targetAccountType !== 'partner' ||
      targetAccountId.toString() !== req.user.accountId.toString()
    ) {
      throw new ForbiddenError('FORBIDDEN')
    }
  } else if (req.user.accountType === 'agency') {
    if (
      targetAccountType !== 'agency' ||
      targetAccountId.toString() !== req.user.accountId.toString()
    ) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  // Verify account exists
  let accountName = ''
  let partnerCity = ''
  if (targetAccountType === 'partner') {
    const partner = await Partner.findById(targetAccountId)
    if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')
    accountName = partner.companyName
    partnerCity = partner.address?.city || ''
  } else if (targetAccountType === 'agency') {
    const agency = await Agency.findById(targetAccountId)
    if (!agency) throw new NotFoundError('AGENCY_NOT_FOUND')
    accountName = agency.companyName
  }

  // Check if email already exists
  const existingUser = await User.findOne({
    accountId: targetAccountId,
    email: email.toLowerCase()
  })
  if (existingUser) {
    throw new BadRequestError('USER_ALREADY_EXISTS')
  }

  // Create user - if password provided, set active directly (PMS staff);
  // otherwise use pending + activation email flow
  const user = new User({
    accountType: targetAccountType,
    accountId: targetAccountId,
    name,
    email,
    role: role || 'user',
    permissions: permissions || [],
    pmsRole: pmsRole || undefined,
    pmsDepartment: pmsDepartment || undefined,
    pmsPermissions: pmsPermissions || [],
    pmsHotels: pmsHotels || [],
    position: position || undefined,
    phone: phone || undefined,
    status: password ? 'active' : 'pending',
    ...(password ? { password } : {}),
    invitedBy: req.user._id
  })

  if (!password) {
    // Generate activation token and send email
    const activationToken = user.generateActivationToken()
    await user.save()

    try {
      const partnerId = targetAccountType === 'partner' ? targetAccountId : null
      await sendActivationEmail({
        to: email,
        name,
        inviterName: req.user.name,
        accountName,
        token: activationToken,
        partnerId,
        partnerCity
      })
      logger.info(`Activation email sent to ${email}`)
    } catch (error) {
      logger.error('Failed to send activation email:', error)
    }
  } else {
    await user.save()
  }

  // Remove sensitive fields from response
  const userObj = user.toObject()
  delete userObj.password
  delete userObj.activationToken
  delete userObj.activationTokenExpires

  res.status(201).json({
    success: true,
    message: req.t('USER_CREATED'),
    data: userObj
  })
})

// Get all users
export const getUsers = asyncHandler(async (req, res) => {
  const {
    accountType,
    accountId,
    status,
    search,
    role,
    pmsRole,
    pmsDepartment,
    pmsAccess,
    hotelId
  } = req.query
  const { page, limit, skip } = parsePagination(req.query)

  // Build filter based on user permissions
  const filter = {}

  if (req.user.accountType === 'partner') {
    filter.accountType = 'partner'
    filter.accountId = req.user.accountId
  } else if (req.user.accountType === 'agency') {
    filter.accountType = 'agency'
    filter.accountId = req.user.accountId
  } else if (req.viewingAsPartner && req.partnerId) {
    // Platform admin viewing as a specific partner
    filter.accountType = 'partner'
    filter.accountId = req.partnerId
  } else {
    if (accountType) filter.accountType = accountType
    if (accountId) filter.accountId = accountId
  }

  // Additional filters
  if (status) filter.status = status
  if (role) filter.role = role
  if (search) {
    const escaped = escapeRegex(search)
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } }
    ]
  }

  // PMS-specific filters
  if (pmsRole) filter.pmsRole = pmsRole
  if (pmsDepartment) filter.pmsDepartment = pmsDepartment
  if (pmsAccess === 'true') filter.pmsRole = { $ne: null }

  // PMS hotel filter - show only users assigned to this specific hotel
  if (hotelId) {
    filter.pmsHotels = hotelId
  }

  // Pagination
  const total = await User.countDocuments(filter)
  const users = await User.find(filter)
    .populate('accountId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  res.json({
    success: true,
    data: {
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

// Get user by ID
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('accountId')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Check permissions
  if (req.user.accountType === 'partner' || req.user.accountType === 'agency') {
    if (user.accountId._id.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  res.json({
    success: true,
    data: user
  })
})

// Update user
export const updateUser = asyncHandler(async (req, res) => {
  // Select password field to check if user has a password (for pending users)
  const user = await User.findById(req.params.id).select('+password')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Check permissions
  if (req.user.accountType === 'partner' || req.user.accountType === 'agency') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  // For pending users without password: non-platform users cannot activate via simple status toggle
  if (req.body.status === 'active' && user.status === 'pending' && !user.password) {
    if (req.user.accountType !== 'platform') {
      throw new BadRequestError('PENDING_USER_NO_PASSWORD')
    }
    // Platform admins should use the dedicated admin-activate endpoint instead
    throw new BadRequestError('USE_ADMIN_ACTIVATE_ENDPOINT')
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
    'notificationSettings',
    'status',
    'pmsRole',
    'pmsDepartment',
    'pmsPermissions',
    'pmsHotels',
    'position',
    'language'
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

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Check permissions
  if (req.user.accountType === 'partner' || req.user.accountType === 'agency') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
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

// ============================================
// Account Activation (Public Routes)
// ============================================

// Verify activation token (public)
export const verifyActivationToken = asyncHandler(async (req, res) => {
  const { token } = req.params

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const user = await User.findOne({
    activationToken: hashedToken,
    activationTokenExpires: { $gt: Date.now() },
    status: { $in: ['pending', 'pending_activation'] }
  }).select('+activationToken +activationTokenExpires')

  if (!user) {
    throw new NotFoundError('INVALID_OR_EXPIRED_TOKEN')
  }

  // Get account info
  let accountName = ''
  if (user.accountType === 'partner') {
    const partner = await Partner.findById(user.accountId)
    accountName = partner?.companyName || ''
  } else if (user.accountType === 'agency') {
    const agency = await Agency.findById(user.accountId)
    accountName = agency?.companyName || ''
  }

  res.json({
    success: true,
    data: {
      email: user.email,
      name: user.name,
      accountType: user.accountType,
      accountName,
      role: user.role
    }
  })
})

// Activate account - set password (public)
export const activateAccount = asyncHandler(async (req, res) => {
  const { token } = req.params
  const { password } = req.body

  if (!password) {
    throw new BadRequestError('PASSWORD_REQUIRED')
  }

  // Hash the token to compare
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const user = await User.findOne({
    activationToken: hashedToken,
    activationTokenExpires: { $gt: Date.now() },
    status: { $in: ['pending', 'pending_activation'] }
  }).select('+activationToken +activationTokenExpires')

  if (!user) {
    throw new NotFoundError('INVALID_OR_EXPIRED_TOKEN')
  }

  // Set password and activate
  user.password = password
  user.status = 'active'
  user.clearActivationToken()
  user.inviteAcceptedAt = new Date()
  await user.save()

  // Send welcome email after successful activation
  try {
    let loginUrl = config.adminUrl
    let accountName = ''
    let partnerId = null

    // Get account-specific info for login URL
    if (user.accountType === 'partner') {
      const partner = await Partner.findById(user.accountId)
      if (partner) {
        partnerId = partner._id
        accountName = partner.companyName
        if (partner.branding?.siteDomain) {
          loginUrl = `https://${partner.branding.siteDomain}/login`
        }
      }
    } else if (user.accountType === 'agency') {
      const agency = await Agency.findById(user.accountId)
      if (agency) {
        partnerId = agency.partner
        accountName = agency.name
      }
    }

    await sendWelcomeEmail({
      to: user.email,
      name: user.name,
      email: user.email,
      password: '(Şifrenizi zaten belirlediniz)',
      accountType:
        user.accountType === 'partner'
          ? 'Partner'
          : user.accountType === 'agency'
            ? 'Acente'
            : 'Platform',
      accountName,
      partnerId,
      loginUrl
    })
    logger.info(`Welcome email sent to activated user: ${user.email}`)
  } catch (error) {
    logger.error(`Failed to send welcome email to ${user.email}:`, error.message)
    // Don't fail activation if email fails
  }

  // Remove sensitive fields
  const userObj = user.toObject()
  delete userObj.password
  delete userObj.activationToken
  delete userObj.activationTokenExpires

  res.json({
    success: true,
    message: req.t ? req.t('ACCOUNT_ACTIVATED') : 'Account activated',
    data: userObj
  })
})

// Resend activation email
export const resendActivation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+activationToken +activationTokenExpires')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Verify ownership
  if (req.user.accountType !== 'platform') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  if (!['pending', 'pending_activation'].includes(user.status)) {
    throw new BadRequestError('USER_ALREADY_ACTIVATED')
  }

  // Get account info
  let accountName = ''
  let partnerCity = ''
  if (user.accountType === 'partner') {
    const partner = await Partner.findById(user.accountId)
    accountName = partner?.companyName || ''
    partnerCity = partner?.address?.city || ''
  } else if (user.accountType === 'agency') {
    const agency = await Agency.findById(user.accountId)
    accountName = agency?.companyName || ''
  }

  // Generate new token
  const activationToken = user.generateActivationToken()
  await user.save()

  // Send email
  try {
    const partnerId = user.accountType === 'partner' ? user.accountId : null

    await sendActivationEmail({
      to: user.email,
      name: user.name,
      inviterName: req.user.name,
      accountName,
      token: activationToken,
      partnerId,
      partnerCity
    })
    logger.info(`Activation email resent to ${user.email}`)
  } catch (error) {
    logger.error('Failed to send activation email:', error)
    throw new BadRequestError('EMAIL_SEND_FAILED')
  }

  res.json({
    success: true,
    message: req.t('ACTIVATION_EMAIL_SENT')
  })
})

// ============================================
// Password Management
// ============================================

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.params.id

  const user = await User.findById(userId).select('+password')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Check permissions - admin can only change passwords within their own account
  if (user._id.toString() !== req.user._id.toString()) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('FORBIDDEN')
    }
    // Cross-account check: admin can only change passwords for users in the same account
    if (
      req.user.accountType !== 'platform' &&
      user.accountId?.toString() !== req.user.accountId?.toString()
    ) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  // If changing someone else's password (admin), don't require current password
  if (user._id.toString() !== req.user._id.toString()) {
    user.password = newPassword
  } else {
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      throw new BadRequestError('CURRENT_PASSWORD_INCORRECT')
    }
    user.password = newPassword
  }

  await user.save()

  res.json({
    success: true,
    message: req.t('PASSWORD_CHANGED')
  })
})

// ============================================
// 2FA Functions
// ============================================

// Enable 2FA
export const enable2FA = asyncHandler(async (req, res) => {
  const userId = req.user._id

  const user = await User.findById(userId).select('+twoFactorSecret')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  if (user.twoFactorEnabled) {
    throw new BadRequestError('2FA_ALREADY_ENABLED')
  }

  const { secret, otpauthUrl } = generate2FASecret(user.email)
  const qrCodeDataUrl = await generateQRCode(otpauthUrl)

  user.twoFactorSecret = secret
  await user.save()

  try {
    await send2FASetupEmail({
      to: user.email,
      name: user.name,
      qrCodeUrl: qrCodeDataUrl,
      secretCode: secret
    })
  } catch (error) {
    logger.error('Failed to send 2FA setup email:', error)
  }

  res.json({
    success: true,
    data: {
      secret: secret,
      qrCode: qrCodeDataUrl,
      otpauthUrl: otpauthUrl
    }
  })
})

// Verify and confirm 2FA
export const verify2FA = asyncHandler(async (req, res) => {
  const { token } = req.body
  const userId = req.user._id

  if (!token) {
    throw new BadRequestError('REQUIRED_2FA_TOKEN')
  }

  const user = await User.findById(userId).select('+twoFactorSecret')

  if (!user || !user.twoFactorSecret) {
    throw new BadRequestError('2FA_NOT_ENABLED')
  }

  const isValid = verify2FAToken(token, user.twoFactorSecret, 1, userId.toString())

  if (!isValid) {
    throw new BadRequestError('INVALID_2FA_TOKEN')
  }

  user.twoFactorEnabled = true
  await user.save()

  res.json({
    success: true,
    message: req.t('2FA_ENABLED')
  })
})

// Disable 2FA
export const disable2FA = asyncHandler(async (req, res) => {
  const { token } = req.body
  const userId = req.user._id

  if (!token) {
    throw new BadRequestError('REQUIRED_2FA_TOKEN')
  }

  const user = await User.findById(userId).select('+twoFactorSecret')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  if (!user.twoFactorEnabled) {
    throw new BadRequestError('2FA_NOT_ENABLED')
  }

  const isValid = verify2FAToken(token, user.twoFactorSecret, 1, userId.toString())

  if (!isValid) {
    throw new BadRequestError('INVALID_2FA_TOKEN')
  }

  user.twoFactorEnabled = false
  user.twoFactorSecret = undefined
  await user.save()

  res.json({
    success: true,
    message: req.t('2FA_DISABLED')
  })
})

// ============================================
// User Status Functions
// ============================================

// Activate user (admin action)
export const activateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Verify ownership
  if (req.user.accountType !== 'platform') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  // For pending users without password, non-platform admins cannot activate
  if (!user.password && ['pending', 'pending_activation'].includes(user.status)) {
    if (req.user.accountType !== 'platform') {
      throw new BadRequestError('PENDING_USER_NO_PASSWORD')
    }
  }

  user.status = 'active'
  await user.save()

  const userObj = user.toObject()
  delete userObj.password

  res.json({
    success: true,
    message: req.t('USER_ACTIVATED'),
    data: userObj
  })
})

// Admin activate pending user (platform admin only - supports optional password)
export const adminActivateUser = asyncHandler(async (req, res) => {
  if (req.user.accountType !== 'platform') {
    throw new ForbiddenError('PLATFORM_ADMIN_REQUIRED')
  }

  const user = await User.findById(req.params.id).select('+password')
  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  if (!['pending', 'pending_activation'].includes(user.status)) {
    throw new BadRequestError('USER_NOT_PENDING')
  }

  const { password } = req.body
  const previousStatus = user.status

  // Get account info for emails
  let accountName = ''
  let partnerId = null
  let loginUrl = config.adminUrl
  if (user.accountType === 'partner') {
    const partner = await Partner.findById(user.accountId)
    if (partner) {
      partnerId = partner._id
      accountName = partner.companyName
      if (partner.branding?.siteDomain) {
        loginUrl = `https://${partner.branding.siteDomain}/login`
      } else if (partner.partnerType === 'hotel') {
        loginUrl = loginUrl.replace('maxirez.com', 'minirez.com')
      }
    }
  } else if (user.accountType === 'agency') {
    const agency = await Agency.findById(user.accountId)
    if (agency) {
      partnerId = agency.partner
      accountName = agency.companyName
    }
  }

  if (password) {
    // Admin provides a password: activate fully, force password change on first login
    user.password = password
    user.status = 'active'
    user.forcePasswordChange = true
    user.clearActivationToken()
    await user.save()

    // Send credentials email
    try {
      await sendAdminActivatedWithCredentialsEmail({
        to: user.email,
        name: user.name,
        email: user.email,
        password,
        accountName,
        loginUrl,
        partnerId,
        adminName: req.user.name
      })
      logger.info(`Admin-activated credentials email sent to ${user.email}`)
    } catch (error) {
      logger.error(
        `Failed to send admin-activated credentials email to ${user.email}:`,
        error.message
      )
    }

    // Audit log
    await AuditLog.log({
      actor: {
        userId: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      module: 'user',
      subModule: 'activation',
      action: 'activate',
      target: {
        collection: 'users',
        documentId: user._id,
        documentName: user.name
      },
      changes: {
        before: { status: previousStatus, hasPassword: false },
        after: { status: 'active', hasPassword: true, forcePasswordChange: true },
        diff: [
          { field: 'status', from: previousStatus, to: 'active' },
          { field: 'password', from: null, to: '[set by admin]' },
          { field: 'forcePasswordChange', from: false, to: true }
        ]
      },
      metadata: {
        reason: 'Platform admin activated user with manual password',
        notes: `Activated by ${req.user.name} (${req.user.email})`
      }
    })
  } else {
    // No password: activate and generate a password reset token so user can set their own password
    user.status = 'active'
    user.forcePasswordChange = true
    user.clearActivationToken()
    const resetToken = user.generatePasswordResetToken()
    await user.save()

    const resetUrl = `${loginUrl.replace('/login', '')}/reset-password/${resetToken}`

    // Send activation notification email with password setup link
    try {
      await sendAdminActivatedEmail({
        to: user.email,
        name: user.name,
        accountName,
        loginUrl,
        resetUrl,
        partnerId,
        adminName: req.user.name
      })
      logger.info(`Admin-activated notification email sent to ${user.email}`)
    } catch (error) {
      logger.error(`Failed to send admin-activated email to ${user.email}:`, error.message)
    }

    // Audit log
    await AuditLog.log({
      actor: {
        userId: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      module: 'user',
      subModule: 'activation',
      action: 'activate',
      target: {
        collection: 'users',
        documentId: user._id,
        documentName: user.name
      },
      changes: {
        before: { status: previousStatus, hasPassword: false },
        after: { status: 'active', hasPassword: false, forcePasswordChange: true },
        diff: [
          { field: 'status', from: previousStatus, to: 'active' },
          { field: 'forcePasswordChange', from: false, to: true }
        ]
      },
      metadata: {
        reason: 'Platform admin activated user without password (awaiting user password setup)',
        notes: `Activated by ${req.user.name} (${req.user.email})`
      }
    })
  }

  const userObj = user.toObject()
  delete userObj.password

  res.json({
    success: true,
    message: req.t(password ? 'USER_ADMIN_ACTIVATED_WITH_PASSWORD' : 'USER_ADMIN_ACTIVATED'),
    data: userObj
  })
})

// Deactivate user
export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Verify ownership
  if (req.user.accountType !== 'platform') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  // Cannot deactivate yourself
  if (user._id.toString() === req.user._id.toString()) {
    throw new BadRequestError('CANNOT_DEACTIVATE_YOURSELF')
  }

  user.status = 'inactive'
  await user.save()

  // Terminate all sessions
  await Session.terminateAllForUser(user._id, req.user._id, 'admin_action')

  res.json({
    success: true,
    message: req.t('USER_DEACTIVATED'),
    data: user
  })
})

// Force password reset
export const forcePasswordReset = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Verify ownership
  if (req.user.accountType !== 'platform') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  user.forcePasswordChange = true
  await user.save()

  // Terminate all sessions
  await Session.terminateAllForUser(user._id, req.user._id, 'password_change')

  res.json({
    success: true,
    message: req.t('PASSWORD_RESET_FORCED')
  })
})

// ============================================
// Session Functions
// ============================================

// Get user sessions
export const getUserSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Verify ownership
  if (req.user.accountType !== 'platform') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  const sessions = await Session.getActiveSessions(user._id)

  res.json({
    success: true,
    data: sessions.map(s => ({
      _id: s._id,
      deviceType: s.deviceType,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ipAddress,
      location: s.location,
      lastActivity: s.lastActivity,
      createdAt: s.createdAt
    }))
  })
})

// Terminate user session
export const terminateUserSession = asyncHandler(async (req, res) => {
  const { id, sessionId } = req.params

  const user = await User.findById(id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Verify ownership
  if (req.user.accountType !== 'platform') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  const session = await Session.findById(sessionId)

  if (!session || session.userId.toString() !== user._id.toString()) {
    throw new NotFoundError('SESSION_NOT_FOUND')
  }

  await session.terminate(req.user._id, 'admin_action')

  res.json({
    success: true,
    message: req.t('SESSION_TERMINATED')
  })
})

// Terminate all user sessions
export const terminateAllUserSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Verify ownership
  if (req.user.accountType !== 'platform') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  await Session.terminateAllForUser(user._id, req.user._id, 'admin_action')

  res.json({
    success: true,
    message: req.t('ALL_SESSIONS_TERMINATED')
  })
})

// ============================================
// Permission Functions
// ============================================

// Get user permissions
export const getUserPermissions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Verify ownership
  if (req.user.accountType !== 'platform') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  res.json({
    success: true,
    data: {
      role: user.role,
      permissions: user.getEffectivePermissions()
    }
  })
})

// Update user permissions
export const updateUserPermissions = asyncHandler(async (req, res) => {
  const { permissions, role } = req.body

  const user = await User.findById(req.params.id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Verify ownership
  if (req.user.accountType !== 'platform') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  // Cannot change own permissions
  if (user._id.toString() === req.user._id.toString()) {
    throw new BadRequestError('CANNOT_CHANGE_OWN_PERMISSIONS')
  }

  if (role && ['admin', 'user'].includes(role)) {
    user.role = role
  }

  if (permissions && Array.isArray(permissions)) {
    user.permissions = permissions
  }

  await user.save()

  res.json({
    success: true,
    message: req.t('PERMISSIONS_UPDATED'),
    data: {
      role: user.role,
      permissions: user.getEffectivePermissions()
    }
  })
})

// ============================================
// Admin 2FA Reset
// ============================================

// Reset user's 2FA (admin only)
export const resetUser2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+twoFactorSecret')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Verify ownership
  if (req.user.accountType !== 'platform') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  if (req.user.role !== 'admin') {
    throw new ForbiddenError('ADMIN_REQUIRED')
  }

  user.twoFactorEnabled = false
  user.twoFactorSecret = undefined
  await user.save()

  await Session.terminateAllForUser(user._id, req.user._id, 'security')

  res.json({
    success: true,
    message: req.t('2FA_RESET')
  })
})
