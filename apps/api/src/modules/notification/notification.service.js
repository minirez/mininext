import Notification from './notification.model.js'
import { getIO } from '#core/socket.js'
import logger from '#core/logger.js'

/**
 * Icon mapping for notification types
 */
const TYPE_ICONS = {
  // PMS Events
  'pms:checkin': 'login',
  'pms:checkout': 'logout',
  'pms:room_ready': 'check_circle',
  'pms:room_dirty': 'cleaning_services',
  'pms:payment_received': 'payments',
  'pms:booking_created': 'event_available',
  'pms:booking_cancelled': 'event_busy',
  'pms:housekeeping_started': 'cleaning_services',
  'pms:housekeeping_completed': 'check_circle',

  // Booking Events
  'booking:new': 'event_available',
  'booking:confirmed': 'verified',
  'booking:cancelled': 'event_busy',
  'booking:modified': 'edit_calendar',
  'booking:payment': 'payments',

  // System Events
  'system:announcement': 'campaign',
  'system:maintenance': 'engineering',
  'system:welcome': 'waving_hand',

  // Agency Events
  'agency:approved': 'verified_user',
  'agency:rejected': 'cancel',
  'agency:booking_new': 'event_available',

  // Partner Events
  'partner:booking_new': 'event_available',
  'partner:payment_received': 'payments'
}

/**
 * Color mapping for notification types
 */
const TYPE_COLORS = {
  // PMS Events
  'pms:checkin': 'green',
  'pms:checkout': 'gray',
  'pms:room_ready': 'green',
  'pms:room_dirty': 'amber',
  'pms:payment_received': 'green',
  'pms:booking_created': 'blue',
  'pms:booking_cancelled': 'red',
  'pms:housekeeping_started': 'amber',
  'pms:housekeeping_completed': 'green',

  // Booking Events
  'booking:new': 'blue',
  'booking:confirmed': 'green',
  'booking:cancelled': 'red',
  'booking:modified': 'amber',
  'booking:payment': 'green',

  // System Events
  'system:announcement': 'indigo',
  'system:maintenance': 'amber',
  'system:welcome': 'blue',

  // Agency Events
  'agency:approved': 'green',
  'agency:rejected': 'red',
  'agency:booking_new': 'blue',

  // Partner Events
  'partner:booking_new': 'blue',
  'partner:payment_received': 'green'
}

/**
 * Get icon for notification type
 */
const getIconForType = type => TYPE_ICONS[type] || 'notifications'

/**
 * Get color for notification type
 */
const getColorForType = type => TYPE_COLORS[type] || 'blue'

/**
 * Create and send a notification to a single user
 */
export const createNotification = async ({
  recipientId,
  recipientModel = 'User',
  type,
  title,
  message,
  reference = null,
  hotel = null,
  partner = null,
  icon = null,
  color = null,
  priority = 'normal',
  actionUrl = null,
  expiresAt = null
}) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      recipient: recipientId,
      recipientModel,
      type,
      title,
      message,
      reference,
      hotel,
      partner,
      icon: icon || getIconForType(type),
      color: color || getColorForType(type),
      priority,
      actionUrl,
      expiresAt
    })

    // Send via socket to the specific user
    const io = getIO()
    if (io) {
      const room = `user:${recipientId}`
      io.to(room).emit('notification:new', {
        notification: notification.toObject()
      })
      logger.info(`Notification sent to room ${room}`, { type, title })
    }

    return notification
  } catch (error) {
    logger.error('Failed to create notification', { error: error.message, recipientId, type })
    throw error
  }
}

/**
 * Send notification to multiple users
 */
export const broadcastNotification = async ({
  recipientIds,
  recipientModel = 'User',
  type,
  title,
  message,
  reference = null,
  hotel = null,
  partner = null,
  icon = null,
  color = null,
  priority = 'normal',
  actionUrl = null
}) => {
  const notifications = await Promise.all(
    recipientIds.map(recipientId =>
      createNotification({
        recipientId,
        recipientModel,
        type,
        title,
        message,
        reference,
        hotel,
        partner,
        icon,
        color,
        priority,
        actionUrl
      })
    )
  )

  return notifications
}

/**
 * Send notification to partner admin users
 */
export const notifyPartnerAdmins = async (partnerId, notificationData) => {
  try {
    const User = (await import('../user/user.model.js')).default

    const users = await User.find({
      partner: partnerId,
      role: { $in: ['partner_admin', 'admin'] },
      status: 'active'
    }).select('_id')

    if (users.length === 0) {
      return []
    }

    return broadcastNotification({
      recipientIds: users.map(u => u._id),
      recipientModel: 'User',
      ...notificationData,
      partner: partnerId
    })
  } catch (error) {
    logger.error('Failed to notify partner admins', { error: error.message, partnerId })
    return []
  }
}

/**
 * Send notification to platform admins
 */
export const notifyPlatformAdmins = async notificationData => {
  try {
    const User = (await import('../user/user.model.js')).default

    const users = await User.find({
      role: 'admin',
      status: 'active'
    }).select('_id')

    if (users.length === 0) {
      return []
    }

    return broadcastNotification({
      recipientIds: users.map(u => u._id),
      recipientModel: 'User',
      ...notificationData
    })
  } catch (error) {
    logger.error('Failed to notify platform admins', { error: error.message })
    return []
  }
}

/**
 * Get notifications for a user
 */
export const getNotifications = async (userId, recipientModel = 'User', options = {}) => {
  return Notification.getPaginated(userId, recipientModel, options)
}

/**
 * Get unread count for a user
 */
export const getUnreadCount = async (userId, recipientModel = 'User') => {
  return Notification.getUnreadCount(userId, recipientModel)
}

/**
 * Mark notifications as read
 */
export const markAsRead = async (notificationIds, userId) => {
  const result = await Notification.markAsRead(notificationIds, userId)

  // Emit updated count via socket
  const io = getIO()
  if (io) {
    const unreadCount = await Notification.getUnreadCount(userId)
    io.to(`user:${userId}`).emit('notification:count', { count: unreadCount })
  }

  return result
}

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId, recipientModel = 'User') => {
  const result = await Notification.markAllAsRead(userId, recipientModel)

  // Emit updated count via socket
  const io = getIO()
  if (io) {
    io.to(`user:${userId}`).emit('notification:count', { count: 0 })
  }

  return result
}

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId
  })

  if (notification && !notification.isRead) {
    // Update unread count
    const io = getIO()
    if (io) {
      const unreadCount = await Notification.getUnreadCount(userId)
      io.to(`user:${userId}`).emit('notification:count', { count: unreadCount })
    }
  }

  return notification
}

/**
 * Cleanup old notifications
 */
export const cleanupOldNotifications = async (daysToKeep = 30) => {
  return Notification.cleanupOld(daysToKeep)
}

export default {
  createNotification,
  broadcastNotification,
  notifyPartnerAdmins,
  notifyPlatformAdmins,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications
}
