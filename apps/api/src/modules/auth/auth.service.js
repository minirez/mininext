import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import config from '#config'
import User from '../user/user.model.js'
import Partner from '../partner/partner.model.js'
import Agency from '../agency/agency.model.js'
import Session from '../session/session.model.js'
import {
  UnauthorizedError,
  BadRequestError,
  TooManyRequestsError,
  ValidationError
} from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { verify2FAToken } from '#helpers/twoFactor.js'
import { sendPasswordResetEmail, sendNewPartnerNotification, getAdminUrl } from '#helpers/mail.js'
import {
  checkLoginLockout,
  recordFailedLogin,
  clearFailedLogins,
  unblockAccount
} from '#middleware/rateLimiter.js'
import logger from '#core/logger.js'

// Generate JWT tokens
export const generateTokens = (user, account) => {
  const payload = {
    userId: user._id,
    accountId: account._id,
    accountType: user.accountType,
    role: user.role
  }

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpire
  })

  const refreshToken = jwt.sign({ userId: user._id }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpire
  })

  return { accessToken, refreshToken }
}

// Login
export const login = asyncHandler(async (req, res) => {
  const { email, password, twoFactorToken } = req.body

  // Validation
  if (!email || !password) {
    throw new BadRequestError('REQUIRED_EMAIL_PASSWORD')
  }

  // Check if account is locked out due to too many failed attempts
  const lockoutStatus = await checkLoginLockout(email)
  if (lockoutStatus.isLocked) {
    if (lockoutStatus.isBlocked) {
      logger.warn(`Login attempt for permanently blocked account: ${email}`)
      throw new TooManyRequestsError('ACCOUNT_BLOCKED')
    }
    logger.warn(`Login attempt for locked account: ${email}`)
    throw new TooManyRequestsError('ACCOUNT_LOCKED', {
      lockoutMinutes: lockoutStatus.lockoutMinutes
    })
  }

  // Find user by email only - auto-detect accountType
  const user = await User.findOne({
    email: email.toLowerCase()
  }).select('+password +twoFactorSecret')

  if (!user || !(await user.comparePassword(password))) {
    // Record failed attempt
    const failedResult = await recordFailedLogin(email)
    logger.warn(
      `Failed login attempt for ${email}. Remaining attempts: ${failedResult.remainingAttempts}`
    )

    if (failedResult.isLocked) {
      if (failedResult.isBlocked) {
        throw new TooManyRequestsError('ACCOUNT_BLOCKED')
      }
      throw new TooManyRequestsError('ACCOUNT_LOCKED', {
        lockoutMinutes: failedResult.lockoutMinutes
      })
    }

    throw new UnauthorizedError('INVALID_CREDENTIALS', {
      remainingAttempts: failedResult.remainingAttempts
    })
  }

  if (!user.isActive()) {
    throw new UnauthorizedError('ACCOUNT_INACTIVE')
  }

  // Get accountType from user record
  const accountType = user.accountType

  // For partner/agency users, verify the account is active
  let account = { _id: user.accountId }
  if (accountType === 'partner') {
    account = await Partner.findById(user.accountId)
    if (!account || !account.isActive()) {
      throw new UnauthorizedError('ACCOUNT_INACTIVE')
    }
  } else if (accountType === 'agency') {
    account = await Agency.findById(user.accountId).populate('partner')
    if (!account || !account.isActive()) {
      throw new UnauthorizedError('ACCOUNT_INACTIVE')
    }
  }

  // Check 2FA if enabled
  if (user.twoFactorEnabled) {
    if (!twoFactorToken) {
      return res.json({
        success: false,
        requiresTwoFactor: true,
        message: req.t('REQUIRED_2FA_TOKEN')
      })
    }

    const isValid = verify2FAToken(twoFactorToken, user.twoFactorSecret)
    if (!isValid) {
      throw new UnauthorizedError('INVALID_2FA_TOKEN')
    }
  }

  // Clear failed login attempts on successful login
  clearFailedLogins(email)

  // Update last login
  await user.updateLastLogin()

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user, account)

  // Create session for tracking
  try {
    await Session.createFromToken(user._id, accessToken, {
      userAgent: req.headers['user-agent'],
      ipAddress:
        req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]
    })
  } catch (sessionError) {
    logger.error('Failed to create session:', sessionError)
    // Don't block login if session creation fails
  }

  logger.info(`Successful ${accountType} login for ${email}`)

  res.json({
    success: true,
    message: req.t('LOGIN_SUCCESS'),
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        accountId: user.accountId,
        permissions: user.permissions || [],
        avatar: user.avatar
      },
      account: {
        id: account._id,
        name: accountType === 'partner' ? account.companyName : account.name,
        type: accountType
      },
      accessToken,
      refreshToken,
      forcePasswordChange: user.forcePasswordChange || false
    }
  })
})

// Refresh token
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    throw new BadRequestError('REQUIRED_REFRESH_TOKEN')
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwt.secret)

    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive()) {
      throw new UnauthorizedError('INVALID_TOKEN')
    }

    // Get account
    let account
    if (user.accountType === 'partner') {
      account = await Partner.findById(user.accountId)
    } else if (user.accountType === 'agency') {
      account = await Agency.findById(user.accountId)
    } else {
      account = { _id: user.accountId }
    }

    // Generate new access token
    const { accessToken } = generateTokens(user, account)

    res.json({
      success: true,
      data: { accessToken }
    })
  } catch {
    throw new UnauthorizedError('INVALID_TOKEN')
  }
})

// Logout
export const logout = asyncHandler(async (req, res) => {
  // Set user offline
  await req.user.setOffline()

  // Terminate current session
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      const session = await Session.findByToken(token)
      if (session) {
        await session.terminate(req.user._id, 'logout')
      }
    }
  } catch (sessionError) {
    logger.error('Failed to terminate session on logout:', sessionError)
  }

  res.json({
    success: true,
    message: req.t('LOGOUT_SUCCESS')
  })
})

// Get current user - returns user info with permissions
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  // Get account
  let account
  if (user.accountType === 'partner') {
    account = await Partner.findById(user.accountId)
  } else if (user.accountType === 'agency') {
    account = await Agency.findById(user.accountId).populate('partner')
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountType: user.accountType,
        accountId: user.accountId,
        permissions: user.permissions || [],
        language: user.language,
        isOnline: user.isOnline,
        lastLogin: user.lastLogin,
        notificationPreferences: user.notificationPreferences,
        preferences: user.preferences || {},
        avatar: user.avatar
      },
      account: account
        ? {
            id: account._id,
            name: user.accountType === 'partner' ? account.companyName : account.name,
            type: user.accountType,
            branding: account.branding || {}
          }
        : null
    }
  })
})

// Update notification preferences
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { notificationPreferences } = req.body

  if (!notificationPreferences) {
    throw new BadRequestError('REQUIRED_NOTIFICATION_PREFERENCES')
  }

  const user = await User.findById(req.user._id)

  // Update notification preferences
  if (notificationPreferences.email) {
    user.notificationPreferences.email = {
      ...user.notificationPreferences.email,
      ...notificationPreferences.email
    }
  }
  if (notificationPreferences.sms) {
    user.notificationPreferences.sms = {
      ...user.notificationPreferences.sms,
      ...notificationPreferences.sms
    }
  }
  if (notificationPreferences.push) {
    user.notificationPreferences.push = {
      ...user.notificationPreferences.push,
      ...notificationPreferences.push
    }
  }

  await user.save()

  res.json({
    success: true,
    message: req.t('NOTIFICATION_PREFERENCES_UPDATED'),
    data: {
      notificationPreferences: user.notificationPreferences
    }
  })
})

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    throw new BadRequestError('REQUIRED_PASSWORDS')
  }

  if (newPassword.length < 8) {
    throw new BadRequestError('PASSWORD_TOO_SHORT')
  }

  const user = await User.findById(req.user._id).select('+password')

  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) {
    throw new UnauthorizedError('INVALID_PASSWORD')
  }

  user.password = newPassword
  user.forcePasswordChange = false // Clear force password change flag
  await user.save()

  res.json({
    success: true,
    message: req.t('PASSWORD_CHANGED')
  })
})

// Partner registration (public endpoint - no password required)
export const register = asyncHandler(async (req, res) => {
  const {
    companyName,
    tradeName,
    name,
    email,
    phone,
    taxOffice,
    taxNumber,
    address,
    partnerType: rawPartnerType
  } = req.body

  // Validation
  if (!companyName || !name || !email || !phone) {
    throw new BadRequestError('REQUIRED_REGISTRATION_FIELDS')
  }

  // Validate partnerType
  const partnerType = ['hotel', 'agency'].includes(rawPartnerType) ? rawPartnerType : 'agency'

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    throw new BadRequestError('EMAIL_ALREADY_EXISTS')
  }

  const existingPartner = await Partner.findOne({ email: email.toLowerCase() })
  if (existingPartner) {
    throw new BadRequestError('EMAIL_ALREADY_EXISTS')
  }

  // Create partner in pending status
  const partner = await Partner.create({
    companyName,
    tradeName,
    partnerType,
    email: email.toLowerCase(),
    phone,
    taxOffice,
    taxNumber,
    address,
    status: 'pending'
  })

  // Create admin user for partner (inactive, no password yet)
  // Password will be set when partner is approved via activation link
  await User.create({
    accountType: 'partner',
    accountId: partner._id,
    name,
    email: email.toLowerCase(),
    phone,
    role: 'admin',
    status: 'pending_activation' // Will be activated on approval
  })

  logger.info(`New partner registration: ${companyName} (${email}) [${partnerType}]`)

  // Send notification to platform admins (non-blocking)
  sendNewPartnerNotification({
    partnerName: companyName,
    partnerEmail: email.toLowerCase(),
    partnerPhone: phone,
    partnerType,
    contactName: name
  }).catch(err => logger.warn('Failed to send new partner notification:', err.message))

  res.status(201).json({
    success: true,
    message: req.t('REGISTRATION_SUCCESS'),
    data: {
      partner: {
        id: partner._id,
        companyName: partner.companyName,
        email: partner.email,
        status: partner.status
      }
    }
  })
})

// Forgot Password - Request password reset
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email, accountType } = req.body

  if (!email) {
    throw new BadRequestError('REQUIRED_EMAIL')
  }

  // Build query based on account type
  const query = { email: email.toLowerCase() }
  if (accountType) {
    query.accountType = accountType
  }

  // Find user by email
  const user = await User.findOne(query).select('+passwordResetToken +passwordResetExpires')

  // Always return success to prevent email enumeration
  if (!user) {
    logger.info(`Password reset requested for non-existent email: ${email}`)
    return res.json({
      success: true,
      message: req.t
        ? req.t('PASSWORD_RESET_EMAIL_SENT')
        : 'If the email exists, a password reset link has been sent.'
    })
  }

  // Check if user is active
  if (!user.isActive()) {
    logger.warn(`Password reset requested for inactive account: ${email}`)
    return res.json({
      success: true,
      message: req.t
        ? req.t('PASSWORD_RESET_EMAIL_SENT')
        : 'If the email exists, a password reset link has been sent.'
    })
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken()
  await user.save({ validateBeforeSave: false })

  // Build reset URL - use partner's custom domain if available
  const partnerId = user.accountType === 'partner' ? user.accountId : null
  const baseUrl = await getAdminUrl(partnerId)
  const resetUrl = `${baseUrl}/reset-password/${resetToken}`

  try {
    // Send password reset email
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      partnerId: user.accountType === 'partner' ? user.accountId : null,
      language: user.language || 'tr'
    })

    logger.info(`Password reset email sent to: ${email}`)

    res.json({
      success: true,
      message: req.t ? req.t('PASSWORD_RESET_EMAIL_SENT') : 'Password reset email has been sent.'
    })
  } catch (error) {
    // Clear reset token if email fails
    user.clearPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    logger.error(`Failed to send password reset email to ${email}:`, error)
    throw new BadRequestError('EMAIL_SEND_FAILED')
  }
})

// Reset Password - Set new password using token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body

  if (!token || !password) {
    throw new BadRequestError('REQUIRED_TOKEN_AND_PASSWORD')
  }

  // Validate password length
  if (password.length < 12) {
    throw new BadRequestError('PASSWORD_TOO_SHORT')
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  // Find user with valid token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken +passwordResetExpires')

  if (!user) {
    throw new BadRequestError('INVALID_OR_EXPIRED_TOKEN')
  }

  // Update password
  user.password = password
  user.forcePasswordChange = false
  user.clearPasswordResetToken()
  await user.save()

  logger.info(`Password reset successfully for: ${user.email}`)

  res.json({
    success: true,
    message: req.t
      ? req.t('PASSWORD_RESET_SUCCESS')
      : 'Password has been reset successfully. You can now login with your new password.'
  })
})

// Admin: Unblock a locked/blocked account
export const unblockLoginBlock = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    throw new BadRequestError('REQUIRED_EMAIL')
  }

  const result = await unblockAccount(email)

  logger.info(`Account unblocked by admin ${req.user.email}: ${email}`)

  res.json({
    success: true,
    message: req.t ? req.t('ACCOUNT_UNBLOCKED') : 'Account has been unblocked successfully.',
    data: result
  })
})

// Valid admin theme IDs
const ADMIN_THEME_IDS = [
  'midnight-blue',
  'ocean',
  'nord',
  'graphite',
  'sand',
  'forest',
  'rose',
  'sunset',
  'lavender',
  'emerald',
  'citrus',
  'cyber',
  'slate',
  'coffee',
  'winter',
  'aurora',
  'candy',
  'abyss',
  'silk',
  'vintage'
]

const normalizeAdminThemeId = theme => {
  if (!theme || typeof theme !== 'string') return null
  const trimmed = theme.trim()
  return ADMIN_THEME_IDS.includes(trimmed) ? trimmed : null
}

// Update user's admin theme preference
export const updateMyAdminTheme = asyncHandler(async (req, res) => {
  const { theme } = req.body

  const normalized = normalizeAdminThemeId(theme)
  if (!normalized) {
    throw new BadRequestError('INVALID_THEME_ID')
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { 'preferences.adminTheme': normalized },
    { new: true }
  )

  logger.info(`User ${req.user.email} updated admin theme to: ${normalized}`)

  res.json({
    success: true,
    message: req.t ? req.t('THEME_UPDATED') : 'Theme preference updated successfully',
    data: {
      preferences: user.preferences
    }
  })
})

// Upload Avatar
export const uploadAvatar = asyncHandler(async (req, res) => {
  const { getAvatarUrl, deleteOldAvatarExcept } = await import('#helpers/avatarUpload.js')

  if (!req.file) {
    throw new ValidationError('NO_FILE_UPLOADED')
  }

  // Delete any old avatar with different extension (but keep the new one)
  deleteOldAvatarExcept(req.user._id, req.file.filename)

  const avatarUrl = getAvatarUrl(req.file.filename)

  const avatarData = {
    filename: req.file.filename,
    url: avatarUrl,
    uploadedAt: new Date()
  }

  // Update user avatar using findByIdAndUpdate for reliability
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarData },
    { new: true }
  )

  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      avatar: updatedUser.avatar
    }
  })
})

// Delete Avatar
export const deleteAvatar = asyncHandler(async (req, res) => {
  const { deleteOldAvatar } = await import('#helpers/avatarUpload.js')

  if (req.user.avatar?.filename) {
    deleteOldAvatar(req.user._id)
  }

  // Update user using findByIdAndUpdate for reliability
  await User.findByIdAndUpdate(req.user._id, { $unset: { avatar: 1 } })

  res.json({
    success: true,
    message: 'Avatar deleted successfully'
  })
})
