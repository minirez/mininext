/**
 * Stay Service Helper Functions
 * Extracted from stay.service.js for better modularity
 */

import Guest from '#modules/pms-guest/guest.model.js'
import { DEFAULT_GUEST_DISPLAY_NAME } from '#constants/defaults.js'

// Pagination validation constants
export const MAX_PAGE_LIMIT = 100
export const DEFAULT_PAGE_LIMIT = 50

/**
 * Sanitize pagination parameters
 * @param {number|string} limit - Page limit
 * @param {number|string} page - Page number
 * @returns {{limit: number, page: number}}
 */
export const sanitizePagination = (limit, page) => {
  let sanitizedLimit = parseInt(limit, 10)
  let sanitizedPage = parseInt(page, 10)

  // Handle NaN and enforce limits
  if (isNaN(sanitizedLimit) || sanitizedLimit < 1) {
    sanitizedLimit = DEFAULT_PAGE_LIMIT
  }
  sanitizedLimit = Math.min(sanitizedLimit, MAX_PAGE_LIMIT)

  if (isNaN(sanitizedPage) || sanitizedPage < 1) {
    sanitizedPage = 1
  }

  return { limit: sanitizedLimit, page: sanitizedPage }
}

/**
 * Find or create a Guest profile and return its ID
 * Used for linking stay guests to Guest collection for history tracking
 * Uses atomic operations to prevent race conditions
 *
 * @param {string} hotelId - Hotel ID
 * @param {Object} guestData - Guest data
 * @returns {Promise<string>} Guest ID
 */
export const findOrCreateGuestProfile = async (hotelId, guestData) => {
  // If guest reference already provided, use it
  if (guestData.guest) {
    return guestData.guest
  }

  // Try to find and update existing guest by idNumber using atomic operation
  if (guestData.idNumber) {
    const existingGuest = await Guest.findOneAndUpdate(
      {
        hotel: hotelId,
        idNumber: guestData.idNumber
      },
      {
        $set: {
          // Only update if new value is provided (don't overwrite with undefined)
          ...(guestData.firstName && { firstName: guestData.firstName }),
          ...(guestData.lastName && { lastName: guestData.lastName }),
          ...(guestData.phone && { phone: guestData.phone }),
          ...(guestData.email && { email: guestData.email }),
          ...(guestData.nationality && { nationality: guestData.nationality }),
          ...(guestData.dateOfBirth && { dateOfBirth: guestData.dateOfBirth })
        }
      },
      { new: true }
    )

    if (existingGuest) {
      return existingGuest._id
    }
  }

  // Create new guest profile - use try/catch for potential duplicate key error
  try {
    const newGuest = await Guest.create({
      hotel: hotelId,
      firstName: guestData.firstName,
      lastName: guestData.lastName,
      idType: guestData.idType || 'tc_kimlik',
      idNumber: guestData.idNumber,
      phone: guestData.phone,
      email: guestData.email,
      nationality: guestData.nationality,
      dateOfBirth: guestData.dateOfBirth,
      gender: guestData.gender
    })
    return newGuest._id
  } catch (error) {
    // Handle duplicate key error from race condition - retry find
    if (error.code === 11000 && guestData.idNumber) {
      const existingGuest = await Guest.findOne({
        hotel: hotelId,
        idNumber: guestData.idNumber
      })
      if (existingGuest) {
        return existingGuest._id
      }
    }
    throw error
  }
}

// Alias for check-in usage
export const findOrCreateGuestProfileForCheckIn = findOrCreateGuestProfile

/**
 * Calculate stay totals (room charges, extras, payments)
 * @param {Object} stay - Stay document
 * @returns {{roomTotal: number, extrasTotal: number, grandTotal: number, paidTotal: number, balance: number}}
 */
export const calculateStayTotals = stay => {
  const roomTotal = stay.roomCharges?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
  const extrasTotal = stay.extras?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
  const grandTotal = roomTotal + extrasTotal
  const paidTotal =
    stay.payments?.reduce((sum, p) => sum + (p.amountInBaseCurrency || p.amount || 0), 0) || 0
  const balance = grandTotal - paidTotal

  return {
    roomTotal,
    extrasTotal,
    grandTotal,
    paidTotal,
    balance
  }
}

/**
 * Map pricing data from booking to stay format
 * @param {Object} booking - Booking document
 * @returns {Object} Pricing data for stay
 */
export const mapBookingPricingToStay = booking => {
  const pricing = booking.pricing || {}

  return {
    dailyRate: pricing.dailyRate || pricing.roomRate || 0,
    currency: pricing.currency || 'TRY',
    mealPlan: pricing.mealPlan || booking.mealPlan || 'room_only',
    totalAmount: pricing.grandTotal || pricing.totalAmount || 0
  }
}

/**
 * Build guest display name from guest data
 * @param {Object} guestData - Guest data object
 * @returns {string} Display name
 */
export const buildGuestDisplayName = guestData => {
  if (!guestData) return DEFAULT_GUEST_DISPLAY_NAME

  const parts = []
  if (guestData.firstName) parts.push(guestData.firstName)
  if (guestData.lastName) parts.push(guestData.lastName)

  return parts.length > 0 ? parts.join(' ') : DEFAULT_GUEST_DISPLAY_NAME
}

export default {
  sanitizePagination,
  findOrCreateGuestProfile,
  findOrCreateGuestProfileForCheckIn,
  calculateStayTotals,
  mapBookingPricingToStay,
  buildGuestDisplayName,
  MAX_PAGE_LIMIT,
  DEFAULT_PAGE_LIMIT
}
