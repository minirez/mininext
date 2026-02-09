import api from './api'

/**
 * Mailbox Service
 * Handles inbox email operations
 */

/**
 * Get emails with filters
 */
export const getEmails = async (params = {}) => {
  const response = await api.get('/mailbox', { params })
  return response.data
}

/**
 * Get inbox stats
 */
export const getEmailStats = async () => {
  const response = await api.get('/mailbox/stats')
  return response.data
}

/**
 * Get conversation thread
 */
export const getThread = async threadId => {
  const response = await api.get(`/mailbox/thread/${threadId}`)
  return response.data
}

/**
 * Get single email (marks as read)
 */
export const getEmail = async id => {
  const response = await api.get(`/mailbox/${id}`)
  return response.data
}

/**
 * Reply to email
 */
export const replyToEmail = async (id, data) => {
  const response = await api.post(`/mailbox/${id}/reply`, data)
  return response.data
}

/**
 * Compose new email
 */
export const composeEmail = async data => {
  const response = await api.post('/mailbox/compose', data)
  return response.data
}

/**
 * Mark as read
 */
export const markAsRead = async id => {
  const response = await api.patch(`/mailbox/${id}/read`)
  return response.data
}

/**
 * Mark as unread
 */
export const markAsUnread = async id => {
  const response = await api.patch(`/mailbox/${id}/unread`)
  return response.data
}

/**
 * Toggle star
 */
export const toggleStar = async id => {
  const response = await api.patch(`/mailbox/${id}/star`)
  return response.data
}

/**
 * Archive email
 */
export const archiveEmail = async id => {
  const response = await api.patch(`/mailbox/${id}/archive`)
  return response.data
}

export default {
  getEmails,
  getEmailStats,
  getThread,
  getEmail,
  replyToEmail,
  composeEmail,
  markAsRead,
  markAsUnread,
  toggleStar,
  archiveEmail
}
