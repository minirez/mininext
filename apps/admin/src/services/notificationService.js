import apiClient from './api'

const BASE_URL = '/notifications'

/**
 * Get notifications for current user
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {boolean} params.unreadOnly - Only return unread notifications
 */
export const getNotifications = async (params = {}) => {
  const response = await apiClient.get(BASE_URL, { params })
  return response.data
}

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
  const response = await apiClient.get(`${BASE_URL}/unread-count`)
  return response.data
}

/**
 * Mark a single notification as read
 * @param {string} notificationId - Notification ID
 */
export const markAsRead = async notificationId => {
  const response = await apiClient.post(`${BASE_URL}/${notificationId}/read`)
  return response.data
}

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  const response = await apiClient.post(`${BASE_URL}/read-all`)
  return response.data
}

/**
 * Mark multiple notifications as read
 * @param {string[]} ids - Array of notification IDs
 */
export const markMultipleAsRead = async ids => {
  const response = await apiClient.post(`${BASE_URL}/read-multiple`, { ids })
  return response.data
}

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 */
export const deleteNotification = async notificationId => {
  const response = await apiClient.delete(`${BASE_URL}/${notificationId}`)
  return response.data
}

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  markMultipleAsRead,
  deleteNotification
}
