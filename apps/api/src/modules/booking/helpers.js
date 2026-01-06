/**
 * Booking Helpers
 * Common helper functions for booking operations
 * Split from booking.service.js for better maintainability
 */

import Guest from '../pms-guest/guest.model.js'
import Stay, { STAY_STATUS, PAYMENT_STATUS } from '../pms-frontdesk/stay.model.js'
import logger from '../../core/logger.js'

/**
 * Sanitize guest data before saving
 */
export const sanitizeGuest = guest => {
  if (!guest) return null
  const sanitized = {
    type: guest.type || 'adult',
    title: guest.title || 'mr',
    firstName: guest.firstName?.trim() || 'Guest',
    lastName: guest.lastName?.trim() || 'Guest',
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
 * Create or find PMS guest from booking data
 */
export const createGuestFromBooking = async booking => {
  try {
    const hotelId = booking.hotel?._id?.toString() || booking.hotel?.toString()
    const partnerId = booking.partner?._id?.toString() || booking.partner?.toString()

    if (!hotelId || !partnerId) {
      logger.warn('[Guest] Missing hotel or partner ID for guest creation')
      return null
    }

    const guestData = {
      partner: partnerId,
      firstName: booking.leadGuest?.firstName,
      lastName: booking.leadGuest?.lastName,
      title: booking.leadGuest?.title,
      nationality: booking.leadGuest?.nationality,
      dateOfBirth: booking.leadGuest?.dateOfBirth,
      email: booking.contact?.email,
      phone: booking.contact?.phone
    }

    // If passport number exists, add as ID
    if (booking.leadGuest?.passportNumber) {
      guestData.idType = 'passport'
      guestData.idNumber = booking.leadGuest.passportNumber
    }

    const guest = await Guest.findOrCreate(hotelId, guestData)
    return guest
  } catch {
    return null
  }
}

/**
 * Create pending Stay from confirmed booking (PMS Integration)
 */
export const createPendingStayFromBooking = async booking => {
  try {
    const hotelId = booking.hotel?._id?.toString() || booking.hotel?.toString()
    const partnerId = booking.partner?._id?.toString() || booking.partner?.toString()

    if (!hotelId || !partnerId) {
      logger.warn('[Stay] Missing hotel or partner ID for stay creation')
      return null
    }

    // Check if Stay already exists for this booking
    const existingStay = await Stay.findOne({ booking: booking._id })
    if (existingStay) {
      return existingStay
    }

    // Get room info from first room in booking
    const roomInfo = booking.rooms?.[0]
    if (!roomInfo) {
      logger.warn('[Stay] No room info in booking')
      return null
    }

    // Build guests array from booking
    const guests = []

    // Add lead guest as main guest
    if (booking.leadGuest?.firstName && booking.leadGuest?.lastName) {
      guests.push({
        firstName: booking.leadGuest.firstName,
        lastName: booking.leadGuest.lastName,
        type: 'adult',
        nationality: booking.leadGuest.nationality || '',
        idType: booking.leadGuest.passportNumber ? 'passport' : 'tc_kimlik',
        idNumber: booking.leadGuest.passportNumber || '',
        phone: booking.contact?.phone || '',
        email: booking.contact?.email || '',
        dateOfBirth: booking.leadGuest.dateOfBirth,
        isMainGuest: true
      })
    }

    // Add other guests from room
    if (roomInfo.guests && Array.isArray(roomInfo.guests)) {
      roomInfo.guests.forEach((g, idx) => {
        // Skip if same as lead guest
        if (
          g.firstName === booking.leadGuest?.firstName &&
          g.lastName === booking.leadGuest?.lastName
        ) {
          return
        }
        guests.push({
          firstName: g.firstName || `Misafir ${idx + 2}`,
          lastName: g.lastName || '',
          type: g.type || 'adult',
          nationality: g.nationality || '',
          isMainGuest: false
        })
      })
    }

    // Calculate nights
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

    // Get pricing
    const roomRate = booking.pricing?.grandTotal ? booking.pricing.grandTotal / nights : 0
    const totalAmount = booking.pricing?.grandTotal || 0

    // Create pending Stay
    const stay = await Stay.create({
      partner: partnerId,
      hotel: hotelId,
      booking: booking._id,
      bookingNumber: booking.bookingNumber,
      roomType: roomInfo.roomType,
      room: null, // Room will be assigned at check-in
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nights,
      guests,
      adultsCount: roomInfo.adults || 1,
      childrenCount: roomInfo.children || 0,
      mealPlan: roomInfo.mealPlan,
      mealPlanCode: roomInfo.mealPlanCode,
      status: STAY_STATUS.PENDING,
      roomRate,
      totalAmount,
      paidAmount: booking.payment?.paidAmount || 0,
      balance: totalAmount - (booking.payment?.paidAmount || 0),
      currency: booking.pricing?.currency || 'TRY',
      paymentStatus:
        booking.payment?.paidAmount >= totalAmount ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
      specialRequests: booking.specialRequests || '',
      source: 'booking',
      isWalkIn: false,
      isVip: booking.leadGuest?.isVip || false
    })

    return stay
  } catch {
    return null
  }
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
