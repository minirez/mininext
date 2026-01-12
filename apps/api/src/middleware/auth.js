import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import User from '../modules/user/user.model.js'
import Partner from '../modules/partner/partner.model.js'
import Agency from '../modules/agency/agency.model.js'
import { UnauthorizedError } from '../core/errors.js'

// Protect middleware - Require authentication
export const protect = async (req, res, next) => {
  try {
    // Get token from header
    let token
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      throw new UnauthorizedError('UNAUTHORIZED')
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret)

    // Get user
    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive()) {
      throw new UnauthorizedError('UNAUTHORIZED')
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      throw new UnauthorizedError('PASSWORD_CHANGED')
    }

    // Get account (skip for platform)
    let account = null
    if (user.accountType === 'partner') {
      account = await Partner.findById(user.accountId)
      if (!account || !account.isActive()) {
        throw new UnauthorizedError('ACCOUNT_INACTIVE')
      }
    } else if (user.accountType === 'agency') {
      account = await Agency.findById(user.accountId).populate('partner')
      if (!account || !account.isActive()) {
        throw new UnauthorizedError('ACCOUNT_INACTIVE')
      }
    }

    // Attach to request
    req.user = user
    req.account = account
    req.token = decoded

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('INVALID_TOKEN'))
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('TOKEN_EXPIRED'))
    } else {
      next(error)
    }
  }
}

// Require admin role
// - Platform admins: always allowed
// - Partner/Agency admins (role: 'admin'): always allowed
// Note: For permission-based access, use requirePermission() middleware instead
export const requireAdmin = (req, res, next) => {
  // Platform admins always have full access
  if (req.user.accountType === 'platform') {
    return next()
  }

  // Admin role has full access
  if (req.user.isAdmin && req.user.isAdmin()) {
    return next()
  }

  // Non-admin users must use requirePermission() for specific module access
  throw new UnauthorizedError('FORBIDDEN')
}

// Require specific module permission
// Usage: requirePermission('hotels', 'view') or requirePermission('hotels') for any action
export const requirePermission = (module, action = 'view') => {
  return (req, res, next) => {
    // Platform admins always have full access
    if (req.user.accountType === 'platform') {
      return next()
    }

    // Admin role has full access
    if (req.user.isAdmin && req.user.isAdmin()) {
      return next()
    }

    // Check specific module permission
    const permissions = req.user.permissions || []
    const modulePermission = permissions.find(p => p.module === module)

    if (modulePermission && modulePermission.actions && modulePermission.actions[action]) {
      return next()
    }

    throw new UnauthorizedError('PERMISSION_DENIED')
  }
}

// Require specific account type
export const requireAccountType = (...accountTypes) => {
  return (req, res, next) => {
    if (!accountTypes.includes(req.user.accountType)) {
      throw new UnauthorizedError('FORBIDDEN')
    }
    next()
  }
}

// Require platform admin (SuperAdmin)
export const requirePlatformAdmin = (req, res, next) => {
  if (req.user.accountType !== 'platform') {
    throw new UnauthorizedError('FORBIDDEN')
  }
  next()
}

// Require partner user or platform admin
export const requirePartnerOrAdmin = (req, res, next) => {
  const isPlatformAdmin = req.user.accountType === 'platform'
  const isPartnerUser = req.user.accountType === 'partner'

  if (!isPlatformAdmin && !isPartnerUser) {
    throw new UnauthorizedError('FORBIDDEN')
  }

  // Set req.partner for PMS services
  if (req.user.accountType === 'partner') {
    req.partner = req.account
  }

  next()
}

// Set partner context from hotel (for platform admins viewing hotel data)
export const setPartnerFromHotel = async (req, res, next) => {
  try {
    // If partner already set (partner user), skip
    if (req.partner) {
      return next()
    }

    // For platform admin, get partner from hotel
    const { hotelId } = req.params
    if (!hotelId) {
      return next()
    }

    // Import Hotel model dynamically to avoid circular dependency
    const { default: Hotel } = await import('../modules/hotel/hotel.model.js')
    const hotel = await Hotel.findById(hotelId).populate('partner')

    if (!hotel) {
      return next(new UnauthorizedError('HOTEL_NOT_FOUND'))
    }

    if (hotel.partner) {
      req.partner = hotel.partner
    } else {
      // For base hotels without partner, use hotel's _id as a fallback identifier
      // This allows platform admin to view base hotels
      req.partner = { _id: hotel._id }
    }
    req.hotel = hotel

    next()
  } catch (error) {
    next(error)
  }
}
