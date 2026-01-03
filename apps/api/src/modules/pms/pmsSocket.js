/**
 * PMS Socket Emitter
 * Handles real-time event broadcasting for PMS operations
 */

import { emitToRoom } from '../../core/socket.js'

// PMS Event Types
export const PMS_EVENTS = {
  ROOM_STATUS: 'pms:room:status',
  CHECK_IN: 'pms:checkin',
  CHECK_OUT: 'pms:checkout',
  HOUSEKEEPING: 'pms:housekeeping',
  RESERVATION: 'pms:reservation',
  TRANSACTION: 'pms:transaction',
  NOTIFICATION: 'pms:notification'
}

/**
 * Emit a PMS event to a hotel room
 * @param {string} hotelId - Hotel ID
 * @param {string} event - Event type
 * @param {object} data - Event data
 */
export const emitPMSEvent = (hotelId, event, data) => {
  if (!hotelId) {
    console.warn('[PMS Socket] Cannot emit event: hotelId is required')
    return
  }

  const roomName = `pms:${hotelId}`
  const payload = {
    hotelId,
    timestamp: Date.now(),
    ...data
  }

  try {
    emitToRoom(roomName, event, payload)
  } catch (error) {
    // Socket emit errors are non-critical, silently ignore
  }
}

/**
 * Emit room status change
 * @param {string} hotelId - Hotel ID
 * @param {string} roomId - Room ID
 * @param {object} data - { roomNumber, newStatus, oldStatus, updatedBy }
 */
export const emitRoomStatusChange = (hotelId, roomId, data) => {
  emitPMSEvent(hotelId, PMS_EVENTS.ROOM_STATUS, {
    roomId,
    roomNumber: data.roomNumber,
    newStatus: data.newStatus,
    oldStatus: data.oldStatus,
    updatedBy: data.updatedBy
  })
}

/**
 * Emit check-in event
 * @param {string} hotelId - Hotel ID
 * @param {object} data - { stayId, roomNumber, guestName, roomId }
 */
export const emitCheckIn = (hotelId, data) => {
  emitPMSEvent(hotelId, PMS_EVENTS.CHECK_IN, {
    stayId: data.stayId,
    roomId: data.roomId,
    roomNumber: data.roomNumber,
    guestName: data.guestName,
    checkInTime: data.checkInTime || new Date()
  })
}

/**
 * Emit check-out event
 * @param {string} hotelId - Hotel ID
 * @param {object} data - { stayId, roomNumber, guestName, roomId }
 */
export const emitCheckOut = (hotelId, data) => {
  emitPMSEvent(hotelId, PMS_EVENTS.CHECK_OUT, {
    stayId: data.stayId,
    roomId: data.roomId,
    roomNumber: data.roomNumber,
    guestName: data.guestName,
    checkOutTime: data.checkOutTime || new Date()
  })
}

/**
 * Emit housekeeping status update
 * @param {string} hotelId - Hotel ID
 * @param {object} data - { roomId, roomNumber, status, priority, assignedTo }
 */
export const emitHousekeepingUpdate = (hotelId, data) => {
  emitPMSEvent(hotelId, PMS_EVENTS.HOUSEKEEPING, {
    roomId: data.roomId,
    roomNumber: data.roomNumber,
    status: data.status,
    priority: data.priority,
    assignedTo: data.assignedTo
  })
}

/**
 * Emit reservation event
 * @param {string} hotelId - Hotel ID
 * @param {string} action - 'created' | 'updated' | 'cancelled' | 'confirmed'
 * @param {object} data - Reservation data
 */
export const emitReservationUpdate = (hotelId, action, data) => {
  emitPMSEvent(hotelId, PMS_EVENTS.RESERVATION, {
    action,
    reservationId: data.reservationId,
    bookingNumber: data.bookingNumber,
    guestName: data.guestName,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    roomType: data.roomType,
    status: data.status
  })
}

/**
 * Emit transaction event
 * @param {string} hotelId - Hotel ID
 * @param {string} action - 'created' | 'voided' | 'refunded'
 * @param {object} data - Transaction data
 */
export const emitTransactionUpdate = (hotelId, action, data) => {
  emitPMSEvent(hotelId, PMS_EVENTS.TRANSACTION, {
    action,
    transactionId: data.transactionId,
    transactionNumber: data.transactionNumber,
    type: data.type,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    roomNumber: data.roomNumber,
    guestName: data.guestName
  })
}

/**
 * Emit notification to PMS users
 * @param {string} hotelId - Hotel ID
 * @param {object} data - { type, title, message, priority, targetRoles }
 */
export const emitNotification = (hotelId, data) => {
  emitPMSEvent(hotelId, PMS_EVENTS.NOTIFICATION, {
    type: data.type, // 'info' | 'warning' | 'error' | 'success'
    title: data.title,
    message: data.message,
    priority: data.priority || 'normal', // 'low' | 'normal' | 'high' | 'urgent'
    targetRoles: data.targetRoles, // ['receptionist', 'housekeeping'] or undefined for all
    actionUrl: data.actionUrl,
    actionLabel: data.actionLabel
  })
}

/**
 * Helper to get guest display name
 */
export const getGuestDisplayName = (guest) => {
  if (!guest) return 'Misafir'
  if (typeof guest === 'string') return guest
  return `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 'Misafir'
}

export default {
  PMS_EVENTS,
  emitPMSEvent,
  emitRoomStatusChange,
  emitCheckIn,
  emitCheckOut,
  emitHousekeepingUpdate,
  emitReservationUpdate,
  emitTransactionUpdate,
  emitNotification,
  getGuestDisplayName
}
