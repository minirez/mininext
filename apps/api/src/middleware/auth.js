import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import User from '../modules/user/user.model.js'
import Partner from '../modules/partner/partner.model.js'
import Agency from '../modules/agency/agency.model.js'
import { UnauthorizedError } from '../core/errors.js'

// Protect middleware - Require authentication
// Supports both regular user tokens and PMS tokens
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

    // Check if it's a PMS token
    if (decoded.type === 'pms') {
      // PMS token - get PMS user
      const { default: PmsUser } = await import('../modules/pms-settings/pmsUser.model.js')
      const pmsUser = await PmsUser.findById(decoded.pmsUserId)

      if (!pmsUser || !pmsUser.isActive) {
        throw new UnauthorizedError('UNAUTHORIZED')
      }

      // Check hotel access
      if (!pmsUser.hasAccessToHotel(decoded.hotelId)) {
        throw new UnauthorizedError('NO_ACCESS_TO_HOTEL')
      }

      // Attach PMS user info to request
      req.pmsUser = pmsUser
      req.pmsUserId = pmsUser._id
      req.pmsHotelId = decoded.hotelId
      req.pmsPartnerId = decoded.partnerId
      req.pmsRole = decoded.role
      req.authMode = 'pms'

      // Create a pseudo user object for compatibility with existing code
      req.user = {
        _id: pmsUser._id,
        name: pmsUser.name,
        email: pmsUser.email,
        role: decoded.role === 'pms_admin' ? 'admin' : 'user',
        accountType: 'partner', // Treat PMS users as partner users for authorization
        accountId: decoded.partnerId,
        isAdmin: () => decoded.role === 'pms_admin',
        isActive: () => pmsUser.isActive
      }

      // Get partner account
      const partner = await Partner.findById(decoded.partnerId)
      if (partner) {
        req.account = partner
      }

      return next()
    }

    // Regular token - get user
    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive()) {
      throw new UnauthorizedError('UNAUTHORIZED')
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
    req.authMode = 'regular'

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
export const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin()) {
    throw new UnauthorizedError('FORBIDDEN')
  }
  next()
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

// Require partner admin or platform admin
export const requirePartnerOrAdmin = (req, res, next) => {
  const isPlatformAdmin = req.user.accountType === 'platform'
  const isPartnerAdmin = req.user.accountType === 'partner' && req.user.isAdmin()

  if (!isPlatformAdmin && !isPartnerAdmin) {
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
