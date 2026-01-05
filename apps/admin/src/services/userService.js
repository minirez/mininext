import api from './api'

/**
 * User Service
 * Handles all user management API calls
 */

// ============================================
// User CRUD
// ============================================

/**
 * Get all users with optional filters
 */
export const getUsers = async (params = {}) => {
  const response = await api.get('/users', { params })
  return response.data
}

/**
 * Get user by ID
 */
export const getUser = async id => {
  const response = await api.get(`/users/${id}`)
  return response.data
}

/**
 * Create user
 */
export const createUser = async userData => {
  const response = await api.post('/users', userData)
  return response.data
}

/**
 * Update user
 */
export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData)
  return response.data
}

/**
 * Delete user
 */
export const deleteUser = async id => {
  const response = await api.delete(`/users/${id}`)
  return response.data
}

// ============================================
// User Status
// ============================================

/**
 * Activate user
 */
export const activateUser = async id => {
  const response = await api.post(`/users/${id}/activate`)
  return response.data
}

/**
 * Deactivate user
 */
export const deactivateUser = async id => {
  const response = await api.post(`/users/${id}/deactivate`)
  return response.data
}

/**
 * Force password reset
 */
export const forcePasswordReset = async id => {
  const response = await api.post(`/users/${id}/force-password-reset`)
  return response.data
}

// ============================================
// Activation
// ============================================

/**
 * Verify activation token (public)
 */
export const verifyActivationToken = async token => {
  const response = await api.get(`/users/activate/verify/${token}`)
  return response.data
}

/**
 * Activate account - set password (public)
 */
export const activateAccount = async (token, passwordData) => {
  const response = await api.post(`/users/activate/${token}`, passwordData)
  return response.data
}

/**
 * Resend activation email
 */
export const resendActivation = async id => {
  const response = await api.post(`/users/${id}/resend-activation`)
  return response.data
}

// ============================================
// Sessions
// ============================================

/**
 * Get user sessions
 */
export const getUserSessions = async id => {
  const response = await api.get(`/users/${id}/sessions`)
  return response.data
}

/**
 * Terminate single session
 */
export const terminateSession = async (userId, sessionId) => {
  const response = await api.delete(`/users/${userId}/sessions/${sessionId}`)
  return response.data
}

/**
 * Terminate all sessions
 */
export const terminateAllSessions = async id => {
  const response = await api.post(`/users/${id}/sessions/terminate-all`)
  return response.data
}

/**
 * Get my sessions
 */
export const getMySessions = async () => {
  const response = await api.get('/sessions/my-sessions')
  return response.data
}

/**
 * Terminate my session
 */
export const terminateMySession = async sessionId => {
  const response = await api.delete(`/sessions/my-sessions/${sessionId}`)
  return response.data
}

/**
 * Terminate all other sessions
 */
export const terminateOtherSessions = async () => {
  const response = await api.post('/sessions/my-sessions/terminate-others')
  return response.data
}

// ============================================
// Permissions
// ============================================

/**
 * Get user permissions
 */
export const getUserPermissions = async id => {
  const response = await api.get(`/users/${id}/permissions`)
  return response.data
}

/**
 * Update user permissions
 */
export const updateUserPermissions = async (id, permissions) => {
  const response = await api.put(`/users/${id}/permissions`, { permissions })
  return response.data
}

// ============================================
// 2FA
// ============================================

/**
 * Reset user's 2FA (admin)
 */
export const resetUser2FA = async id => {
  const response = await api.post(`/users/${id}/2fa/reset`)
  return response.data
}

/**
 * Change password
 */
export const changePassword = async (id, passwordData) => {
  const response = await api.post(`/users/${id}/change-password`, passwordData)
  return response.data
}

// ============================================
// Invite
// ============================================

export const verifyInviteToken = async token => {
  const response = await api.get(`/users/invite/verify/${token}`)
  return response.data
}

export const acceptInvite = async (token, data) => {
  const response = await api.post(`/users/invite/accept/${token}`, data)
  return response.data
}

export default {
  // CRUD
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  // Status
  activateUser,
  deactivateUser,
  forcePasswordReset,
  // Activation
  verifyActivationToken,
  activateAccount,
  resendActivation,
  // Sessions
  getUserSessions,
  terminateSession,
  terminateAllSessions,
  getMySessions,
  terminateMySession,
  terminateOtherSessions,
  // Permissions
  getUserPermissions,
  updateUserPermissions,
  // 2FA & Password
  resetUser2FA,
  changePassword,
  // Invite
  verifyInviteToken,
  acceptInvite
}
