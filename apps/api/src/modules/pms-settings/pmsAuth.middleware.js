import jwt from 'jsonwebtoken'
import config from '../../config/index.js'
import PmsUser from './pmsUser.model.js'
import User from '../user/user.model.js'
import Partner from '../partner/partner.model.js'
import { UnauthorizedError, ForbiddenError } from '../../core/errors.js'

/**
 * PMS Authentication Middleware
 * Verifies PMS JWT token and attaches user to request
 */
export const pmsProtect = async (req, res, next) => {
  try {
    let token

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      throw new UnauthorizedError('NOT_AUTHENTICATED')
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret)

    // Check if it's a PMS token
    if (decoded.type !== 'pms') {
      throw new UnauthorizedError('INVALID_TOKEN_TYPE')
    }

    // Get user
    const user = await PmsUser.findById(decoded.pmsUserId)

    if (!user) {
      throw new UnauthorizedError('USER_NOT_FOUND')
    }

    if (!user.isActive) {
      throw new UnauthorizedError('USER_INACTIVE')
    }

    // Check if user still has access to the hotel
    if (!user.hasAccessToHotel(decoded.hotelId)) {
      throw new UnauthorizedError('NO_ACCESS_TO_HOTEL')
    }

    // Attach to request
    req.pmsUser = user
    req.pmsUserId = user._id
    req.pmsHotelId = decoded.hotelId
    req.pmsPartnerId = decoded.partnerId
    req.pmsRole = decoded.role

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('INVALID_TOKEN'))
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('TOKEN_EXPIRED'))
    }
    next(error)
  }
}

/**
 * Check if user has specific permission for current hotel
 * @param {string|string[]} permissions - Required permission(s)
 */
export const pmsRequirePermission = (permissions) => {
  return (req, res, next) => {
    const user = req.pmsUser
    const hotelId = req.pmsHotelId

    if (!user || !hotelId) {
      return next(new UnauthorizedError('NOT_AUTHENTICATED'))
    }

    // Get user's role for this hotel
    const role = user.getRoleForHotel(hotelId)

    // Admin has all permissions
    if (role === 'pms_admin') {
      return next()
    }

    // Check permissions
    const permissionsToCheck = Array.isArray(permissions) ? permissions : [permissions]
    const userPermissions = user.getPermissionsForHotel(hotelId)

    const hasPermission = permissionsToCheck.some(p => userPermissions.includes(p))

    if (!hasPermission) {
      return next(new ForbiddenError('INSUFFICIENT_PERMISSIONS'))
    }

    next()
  }
}

/**
 * Check if user has specific role for current hotel
 * @param {string|string[]} roles - Required role(s)
 */
export const pmsRequireRole = (roles) => {
  return (req, res, next) => {
    const user = req.pmsUser
    const hotelId = req.pmsHotelId

    if (!user || !hotelId) {
      return next(new UnauthorizedError('NOT_AUTHENTICATED'))
    }

    const userRole = user.getRoleForHotel(hotelId)
    const allowedRoles = Array.isArray(roles) ? roles : [roles]

    if (!allowedRoles.includes(userRole)) {
      return next(new ForbiddenError('INSUFFICIENT_ROLE'))
    }

    next()
  }
}

/**
 * Optional PMS auth - doesn't fail if no token, but attaches user if present
 */
export const pmsOptionalAuth = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return next()
    }

    const decoded = jwt.verify(token, config.jwt.secret)

    if (decoded.type !== 'pms') {
      return next()
    }

    const user = await PmsUser.findById(decoded.pmsUserId)

    if (user && user.isActive) {
      req.pmsUser = user
      req.pmsUserId = user._id
      req.pmsHotelId = decoded.hotelId
      req.pmsPartnerId = decoded.partnerId
      req.pmsRole = decoded.role
    }

    next()
  } catch (error) {
    // Ignore errors for optional auth
    next()
  }
}

/**
 * Dual-Auth Middleware for PMS Routes
 * Accepts BOTH PMS tokens AND regular Partner/Admin tokens
 * This allows PMS staff and Partner admins to access the same endpoints
 *
 * Sets req.authMode = 'pms' | 'partner' to indicate which auth was used
 */
export const pmsDualAuth = async (req, res, next) => {
  try {
    let token

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      throw new UnauthorizedError('NOT_AUTHENTICATED')
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret)

    // Check if it's a PMS token
    if (decoded.type === 'pms') {
      // PMS User authentication
      const user = await PmsUser.findById(decoded.pmsUserId)

      if (!user) {
        throw new UnauthorizedError('USER_NOT_FOUND')
      }

      if (!user.isActive) {
        throw new UnauthorizedError('USER_INACTIVE')
      }

      // Check hotel access
      const hasAccess = user.hasAccessToHotel(decoded.hotelId)
      if (!hasAccess) {
        throw new UnauthorizedError('NO_ACCESS_TO_HOTEL')
      }

      // Attach PMS user info to request
      req.pmsUser = user
      req.pmsUserId = user._id
      req.pmsHotelId = decoded.hotelId
      req.pmsPartnerId = decoded.partnerId
      req.pmsRole = decoded.role
      req.authMode = 'pms'

      return next()
    }

    // Regular token - Partner/Admin authentication
    const user = await User.findById(decoded.userId)

    if (!user || !user.isActive()) {
      throw new UnauthorizedError('USER_NOT_FOUND')
    }

    // Get partner account if applicable
    let account = null
    if (user.accountType === 'partner') {
      account = await Partner.findById(user.accountId)
      if (!account || !account.isActive()) {
        throw new UnauthorizedError('ACCOUNT_INACTIVE')
      }
    }

    // Attach regular user info to request
    req.user = user
    req.account = account
    req.token = decoded
    req.authMode = 'partner'

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('INVALID_TOKEN'))
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('TOKEN_EXPIRED'))
    }
    next(error)
  }
}

/**
 * Require Partner/Admin role for dual-auth routes
 * Works with both auth modes
 */
export const pmsDualRequirePartnerOrAdmin = (req, res, next) => {
  if (req.authMode === 'pms') {
    // PMS users always have access (they're hotel staff)
    return next()
  }

  // Regular auth - check role
  if (!req.user) {
    return next(new UnauthorizedError('NOT_AUTHENTICATED'))
  }

  const allowedRoles = ['admin', 'superadmin', 'partner']
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ForbiddenError('INSUFFICIENT_ROLE'))
  }

  next()
}

/**
 * Set partner context from hotel ID in route params
 * Works with both auth modes
 * Sets both req.partnerId AND req.partner for backwards compatibility
 *
 * NOTE: Hotel model uses 'partner' field, not 'partnerId'
 */
export const pmsSetPartnerFromHotel = async (req, res, next) => {
  try {
    const { hotelId } = req.params

    if (!hotelId) {
      return next()
    }

    // Get hotel and partner info
    // Note: Hotel model uses 'partner' field for partner reference
    const Hotel = (await import('../hotel/hotel.model.js')).default
    const hotel = await Hotel.findById(hotelId).select('partner name')

    if (!hotel) {
      throw new UnauthorizedError('HOTEL_NOT_FOUND')
    }

    // Load the partner object for backwards compatibility
    const partner = await Partner.findById(hotel.partner)
    if (!partner) {
      throw new UnauthorizedError('PARTNER_NOT_FOUND')
    }

    if (req.authMode === 'pms') {
      // PMS mode - verify partner matches token
      if (req.pmsPartnerId && req.pmsPartnerId.toString() !== hotel.partner?.toString()) {
        throw new ForbiddenError('HOTEL_PARTNER_MISMATCH')
      }
      req.partnerId = req.pmsPartnerId || hotel.partner
      req.partner = partner
      req.hotel = hotel
      return next()
    }

    // Partner mode - check access for non-admin users
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      if (!req.user.accountId || req.user.accountId.toString() !== hotel.partner?.toString()) {
        throw new ForbiddenError('NO_ACCESS_TO_HOTEL')
      }
    }

    req.partnerId = hotel.partner
    req.partner = partner
    req.hotel = hotel
    next()
  } catch (error) {
    next(error)
  }
}

export default {
  pmsProtect,
  pmsRequirePermission,
  pmsRequireRole,
  pmsOptionalAuth,
  pmsDualAuth,
  pmsDualRequirePartnerOrAdmin,
  pmsSetPartnerFromHotel
}
