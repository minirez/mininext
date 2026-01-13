import api from './api'

/**
 * Email Log Service
 * Handles email log viewing and stats
 */

/**
 * Get email logs with filters
 */
export const getEmailLogs = async (params = {}) => {
  const response = await api.get('/email-logs', { params })
  return response.data
}

/**
 * Get email stats
 */
export const getEmailStats = async (params = {}) => {
  const response = await api.get('/email-logs/stats', { params })
  return response.data
}

/**
 * Get single email log
 */
export const getEmailLog = async (id) => {
  const response = await api.get(`/email-logs/${id}`)
  return response.data
}

/**
 * Retry failed email
 */
export const retryEmail = async (id) => {
  const response = await api.post(`/email-logs/${id}/retry`)
  return response.data
}

export default {
  getEmailLogs,
  getEmailStats,
  getEmailLog,
  retryEmail
}
