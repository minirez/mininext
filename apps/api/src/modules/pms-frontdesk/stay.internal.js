/**
 * Stay Service - Internal shared helpers
 * Socket events, notifications, and utility functions used across stay sub-services
 */

import { emitToRoom } from '#core/socket.js'
import { broadcastNotification } from '#modules/notification/notification.service.js'
import { scheduleAutoSend as kbsScheduleAutoSend } from '#modules/pms-guest/kbsClient.js'
import { PAYMENT_METHODS } from '#modules/pms-billing/transaction.model.js'
import logger from '#core/logger.js'
import { DEFAULT_GUEST_DISPLAY_NAME } from '#constants/defaults.js'

export const emitCheckIn = (hotelId, data) => {
  emitToRoom(`hotel:${hotelId}`, 'checkin', { hotelId, timestamp: Date.now(), ...data })
}

export const emitCheckOut = (hotelId, data) => {
  emitToRoom(`hotel:${hotelId}`, 'checkout', { hotelId, timestamp: Date.now(), ...data })
}

export const emitStayUpdate = (hotelId, event, data) => {
  emitToRoom(`hotel:${hotelId}`, 'stay:updated', {
    hotelId,
    timestamp: Date.now(),
    action: event,
    ...data
  })
}

export const getGuestDisplayName = guest => {
  if (!guest) return DEFAULT_GUEST_DISPLAY_NAME
  const parts = []
  if (guest.firstName) parts.push(guest.firstName)
  if (guest.lastName) parts.push(guest.lastName)
  return parts.length > 0 ? parts.join(' ') : DEFAULT_GUEST_DISPLAY_NAME
}

/**
 * Notify hotel PMS users via in-app notification
 * Finds all partner users with PMS access and sends notification
 */
export const notifyHotelUsers = async (
  hotelId,
  excludeUserId,
  { type, title, message, reference, actionUrl }
) => {
  try {
    const Hotel = (await import('#modules/hotel/hotel.model.js')).default
    const User = (await import('#modules/user/user.model.js')).default

    const hotel = await Hotel.findById(hotelId).select('partner')
    if (!hotel?.partner) return

    // Find all partner users with PMS access (excluding the user who triggered the action)
    const users = await User.find({
      accountType: 'partner',
      accountId: hotel.partner,
      status: 'active',
      _id: { $ne: excludeUserId },
      $or: [
        { role: 'admin' },
        { pmsRole: { $ne: null } },
        { pmsPermissions: { $exists: true, $ne: [] } }
      ]
    }).select('_id')

    if (users.length === 0) return

    const pmsType = `pms:${type}`
    await broadcastNotification({
      recipientIds: users.map(u => u._id),
      recipientModel: 'User',
      type: pmsType,
      title,
      message,
      reference,
      hotel: hotelId,
      partner: hotel.partner,
      actionUrl: `/pms${actionUrl}`
    })
  } catch (error) {
    logger.error('[PMS Notification] Error:', error.message)
  }
}

/**
 * Schedule automatic KBS notification after check-in
 */
export const scheduleAutoSend = (hotelId, stay, room) => {
  try {
    kbsScheduleAutoSend(hotelId, stay, room)
  } catch (error) {
    logger.error('[KBS AutoSend] Schedule error:', error.message)
  }
}

// Simple in-memory lock as placeholder
export const distributedLock = {
  async acquire(resource, ttl) {
    return { acquired: true, lockId: `local-${Date.now()}` }
  },
  async release(resource, lockId) {
    // noop
  }
}

/**
 * Helper: Map payment method string to PAYMENT_METHODS constant
 */
export function mapPaymentMethod(method) {
  const methodMap = {
    cash: PAYMENT_METHODS.CASH,
    nakit: PAYMENT_METHODS.CASH,
    credit_card: PAYMENT_METHODS.CREDIT_CARD,
    kredi_karti: PAYMENT_METHODS.CREDIT_CARD,
    debit_card: PAYMENT_METHODS.DEBIT_CARD,
    banka_karti: PAYMENT_METHODS.DEBIT_CARD,
    bank_transfer: PAYMENT_METHODS.BANK_TRANSFER,
    havale: PAYMENT_METHODS.BANK_TRANSFER,
    eft: PAYMENT_METHODS.BANK_TRANSFER,
    room_charge: PAYMENT_METHODS.ROOM_CHARGE,
    city_ledger: PAYMENT_METHODS.CITY_LEDGER,
    voucher: PAYMENT_METHODS.VOUCHER,
    online: PAYMENT_METHODS.ONLINE,
    other: PAYMENT_METHODS.OTHER
  }
  return methodMap[method?.toLowerCase()] || PAYMENT_METHODS.CASH
}
