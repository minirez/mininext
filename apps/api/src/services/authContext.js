/**
 * Auth Context Service
 * Centralized helpers for extracting authentication context from requests
 * Replaces duplicate implementations across modules
 */

import Hotel from '../modules/hotel/hotel.model.js'
import { NotFoundError, ForbiddenError } from '../core/errors.js'

/**
 * Extract partner ID from request context
 * Handles: partner users, agency users, platform admins viewing as partner
 * @param {Object} req - Express request object
 * @returns {string|null} Partner ID or null
 */
export const getPartnerId = req => {
  // Partner user - direct access
  if (req.user?.accountType === 'partner') {
    return req.user.accountId
  }

  // Agency user - get partner from populated agency account
  if (req.user?.accountType === 'agency' && req.account?.partner) {
    return req.account.partner._id || req.account.partner
  }

  // PMS context - partner set by setPmsHotelContext middleware
  if (req.partner?._id) {
    return req.partner._id
  }

  // Platform admin viewing as specific partner (via header/query)
  if (req.partnerId) {
    return req.partnerId
  }

  return null
}

/**
 * Require partner context - throws if not available
 * @param {Object} req - Express request object
 * @returns {string} Partner ID
 * @throws {BadRequestError} If partner context not found
 */
export const requirePartnerId = req => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    const { BadRequestError } = require('../core/errors.js')
    throw new BadRequestError('PARTNER_REQUIRED')
  }
  return partnerId
}

/**
 * Get source info for tracking booking/transaction origins
 * @param {Object} req - Express request object
 * @returns {Object} Source information object
 */
export const getSourceInfo = req => {
  const source = {
    type: 'admin',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  }

  if (req.user?.accountType === 'agency') {
    source.type = 'b2b'
    source.agencyId = req.user.accountId
    source.agencyName = req.account?.companyName || req.account?.name
    source.agencyUserId = req.user._id
  } else if (req.user?.accountType === 'partner') {
    source.type = 'admin'
    source.partnerId = req.user.accountId
  } else if (req.user?.accountType === 'platform') {
    source.type = 'admin'
    source.platformAdmin = true
  }

  return source
}

/**
 * Get actor information for audit logging
 * @param {Object} req - Express request object
 * @returns {Object} Actor information for audit trails
 */
export const getAuditActor = req => {
  if (!req.user) {
    return { role: 'system' }
  }

  return {
    userId: req.user._id,
    partnerId: req.user.accountType === 'partner' ? req.user.accountId : req.partnerId,
    email: req.user.email,
    name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
    role: req.user.role,
    accountType: req.user.accountType,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }
}

/**
 * Verify hotel belongs to partner
 * @param {string} hotelId - Hotel ID to verify
 * @param {string} partnerId - Partner ID to check against
 * @returns {Promise<Object>} Hotel document if valid
 * @throws {NotFoundError} If hotel not found
 * @throws {ForbiddenError} If hotel doesn't belong to partner
 */
export const verifyHotelOwnership = async (hotelId, partnerId) => {
  const hotel = await Hotel.findById(hotelId)

  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  if (hotel.partner.toString() !== partnerId.toString()) {
    throw new ForbiddenError('FORBIDDEN')
  }

  return hotel
}

/**
 * Get hotel with ownership verification in one call
 * @param {Object} req - Express request object
 * @param {string} hotelId - Hotel ID from params
 * @returns {Promise<{hotel: Object, partnerId: string}>}
 */
export const getHotelWithOwnership = async (req, hotelId) => {
  const partnerId = requirePartnerId(req)
  const hotel = await verifyHotelOwnership(hotelId, partnerId)
  return { hotel, partnerId }
}

export default {
  getPartnerId,
  requirePartnerId,
  getSourceInfo,
  getAuditActor,
  verifyHotelOwnership,
  getHotelWithOwnership
}
