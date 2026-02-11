/**
 * Booking Helpers
 * Common helper functions for booking operations
 * Split from booking.service.js for better maintainability
 */

import { DEFAULT_GUEST_FIRST_NAME, DEFAULT_GUEST_LAST_NAME } from '#constants/defaults.js'

/**
 * Sanitize guest data before saving
 */
export const sanitizeGuest = guest => {
  if (!guest) return null
  const sanitized = {
    type: guest.type || 'adult',
    title: guest.title || 'mr',
    firstName: guest.firstName?.trim() || DEFAULT_GUEST_FIRST_NAME,
    lastName: guest.lastName?.trim() || DEFAULT_GUEST_LAST_NAME,
    nationality: guest.nationality || '',
    isLead: guest.isLead || false
  }
  // Preserve optional fields if they exist
  if (guest.tcNumber) sanitized.tcNumber = guest.tcNumber.trim()
  if (guest.passportNumber) sanitized.passportNumber = guest.passportNumber.trim()
  if (guest.dateOfBirth) sanitized.dateOfBirth = guest.dateOfBirth
  if (guest.age !== undefined) sanitized.age = guest.age
  return sanitized
}

/**
 * Sanitize room guests array
 */
export const sanitizeRoomGuests = guests => {
  if (!guests || !Array.isArray(guests)) return []
  return guests.map(g => sanitizeGuest(g)).filter(g => g !== null)
}

/**
 * Create full booking snapshot for amendments
 */
export const createBookingSnapshot = booking => {
  return {
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    rooms: booking.rooms.map(r => ({
      roomType: r.roomType,
      roomTypeCode: r.roomTypeCode,
      roomTypeName: r.roomTypeName,
      mealPlan: r.mealPlan,
      mealPlanCode: r.mealPlanCode,
      mealPlanName: r.mealPlanName,
      guests: r.guests,
      pricing: r.pricing,
      dailyBreakdown: r.dailyBreakdown,
      campaigns: r.campaigns,
      rateType: r.rateType,
      nonRefundableDiscount: r.nonRefundableDiscount,
      specialRequests: r.specialRequests
    })),
    leadGuest: booking.leadGuest,
    contact: booking.contact,
    pricing: booking.pricing,
    invoiceDetails: booking.invoiceDetails,
    totalAdults: booking.totalAdults,
    totalChildren: booking.totalChildren,
    totalInfants: booking.totalInfants,
    totalRooms: booking.totalRooms,
    specialRequests: booking.specialRequests
  }
}

/**
 * Compare two values and generate change record
 */
export const compareValues = (field, fieldLabel, oldVal, newVal) => {
  // Deep comparison for objects
  const oldStr = JSON.stringify(oldVal)
  const newStr = JSON.stringify(newVal)
  if (oldStr !== newStr) {
    return { field, fieldLabel, from: oldVal, to: newVal }
  }
  return null
}

/**
 * Detect amendment type based on changes
 */
export const detectAmendmentType = changes => {
  const hasDateChange = changes.some(c => ['checkIn', 'checkOut', 'nights'].includes(c.field))
  const hasRoomChange = changes.some(c => c.field.startsWith('rooms'))
  const hasGuestChange = changes.some(c => c.field.startsWith('leadGuest') || c.field === 'contact')
  const hasPricingChange = changes.some(c => c.field.startsWith('pricing'))

  if (hasDateChange && hasRoomChange) return 'full'
  if (hasDateChange) return 'dates'
  if (hasRoomChange) return 'rooms'
  if (hasGuestChange) return 'guests'
  if (hasPricingChange) return 'pricing'
  return 'full'
}
