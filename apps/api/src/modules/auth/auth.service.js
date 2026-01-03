import jwt from 'jsonwebtoken'
import config from '../../config/index.js'
import User from '../user/user.model.js'
import Partner from '../partner/partner.model.js'
import Agency from '../agency/agency.model.js'
import { UnauthorizedError, BadRequestError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import { verify2FAToken } from '../../helpers/twoFactor.js'

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

  const refreshToken = jwt.sign(
    { userId: user._id },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpire }
  )

  return { accessToken, refreshToken }
}

// Login
export const login = asyncHandler(async (req, res) => {
  const { email, password, accountType, twoFactorToken } = req.body

  // Validation
  if (!email || !password) {
    throw new BadRequestError('REQUIRED_EMAIL_PASSWORD')
  }

  if (!accountType) {
    throw new BadRequestError('REQUIRED_ACCOUNT_TYPE')
  }

  // Platform admin login
  if (accountType === 'platform') {
    const user = await User.findOne({
      email: email.toLowerCase(),
      accountType: 'platform'
    }).select('+password +twoFactorSecret')

    if (!user || !await user.comparePassword(password)) {
      throw new UnauthorizedError('INVALID_CREDENTIALS')
    }

    if (!user.isActive()) {
      throw new UnauthorizedError('ACCOUNT_INACTIVE')
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

    // Update last login
    await user.updateLastLogin()

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user, { _id: user.accountId })

    return res.json({
      success: true,
      message: req.t('LOGIN_SUCCESS'),
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          accountType: user.accountType
        },
        accessToken,
        refreshToken,
        forcePasswordChange: user.forcePasswordChange || false
      }
    })
  }

  // Partner/Agency login
  // accountId gerekli (partner veya agency ID'si)
  const { accountId } = req.body

  if (!accountId) {
    throw new BadRequestError('REQUIRED_ACCOUNT_ID')
  }

  // User bul
  const user = await User.findOne({
    email: email.toLowerCase(),
    accountId,
    accountType
  }).select('+password +twoFactorSecret')

  if (!user || !await user.comparePassword(password)) {
    throw new UnauthorizedError('INVALID_CREDENTIALS')
  }

  if (!user.isActive()) {
    throw new UnauthorizedError('ACCOUNT_INACTIVE')
  }

  // Account kontrolü
  let account
  if (accountType === 'partner') {
    account = await Partner.findById(accountId)
  } else if (accountType === 'agency') {
    account = await Agency.findById(accountId).populate('partner')
  }

  if (!account || !account.isActive()) {
    throw new UnauthorizedError('ACCOUNT_INACTIVE')
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

  // Update last login
  await user.updateLastLogin()

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user, account)

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
        accountId: user.accountId
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
  } catch (error) {
    throw new UnauthorizedError('INVALID_TOKEN')
  }
})

// Logout
export const logout = asyncHandler(async (req, res) => {
  // Set user offline
  await req.user.setOffline()

  res.json({
    success: true,
    message: req.t('LOGOUT_SUCCESS')
  })
})

// Get current user
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
        language: user.language,
        isOnline: user.isOnline,
        lastLogin: user.lastLogin,
        notificationPreferences: user.notificationPreferences
      },
      account: account ? {
        id: account._id,
        name: user.accountType === 'partner' ? account.companyName : account.name,
        type: user.accountType
      } : null
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

// Partner registration (public endpoint)
export const register = asyncHandler(async (req, res) => {
  const { companyName, name, email, phone, password } = req.body

  // Validation
  if (!companyName || !name || !email || !phone || !password) {
    throw new BadRequestError('REQUIRED_REGISTRATION_FIELDS')
  }

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
    email: email.toLowerCase(),
    phone,
    status: 'pending'
  })

  // Create admin user for partner (also in inactive status)
  // User will be activated when partner is approved
  await User.create({
    accountType: 'partner',
    accountId: partner._id,
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role: 'admin',
    status: 'inactive' // Will be activated on approval
  })

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
