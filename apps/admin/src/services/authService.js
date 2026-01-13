import apiClient from './api'
import { apiLogger } from '@/utils/logger'

const login = async credentials => {
  try {
    // Make POST request to the backend login endpoint
    const response = await apiClient.post('/auth/login', credentials)
    // Booking engine response: { success: true, data: { accessToken, user }, message }
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Login failed', error.response?.data || error.message)
    // Re-throw the error so the component can handle it (e.g., show error message)
    throw error
  }
}

const me = async () => {
  try {
    const response = await apiClient.get('/auth/me')
    // Booking engine response: { success: true, data: { user }, message }
    return response.data
  } catch (error) {
    apiLogger.error(
      'Auth Service: Failed to fetch current user',
      error.response?.data || error.message
    )
    throw error
  }
}

const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword
    })
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Change password failed', error.response?.data || error.message)
    throw error
  }
}

const updateNotificationPreferences = async notificationPreferences => {
  try {
    const response = await apiClient.put('/auth/notification-preferences', {
      notificationPreferences
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Auth Service: Update notification preferences failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const verify2FA = async credentials => {
  try {
    // For booking engine, 2FA verification is done through the same login endpoint
    // with twoFactorToken field added to credentials
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: 2FA verification failed', error.response?.data || error.message)
    throw error
  }
}

const refreshToken = async refreshToken => {
  try {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken })
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Token refresh failed', error.response?.data || error.message)
    throw error
  }
}

const forgotPassword = async email => {
  try {
    const response = await apiClient.post('/auth/forgot-password', { email })
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Forgot password failed', error.response?.data || error.message)
    throw error
  }
}

const resetPassword = async (token, password) => {
  try {
    const response = await apiClient.post('/auth/reset-password', { token, password })
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Reset password failed', error.response?.data || error.message)
    throw error
  }
}

const unblockAccount = async email => {
  try {
    const response = await apiClient.post('/auth/admin/unblock-account', { email })
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Unblock account failed', error.response?.data || error.message)
    throw error
  }
}

const uploadAvatar = async file => {
  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await apiClient.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Avatar upload failed', error.response?.data || error.message)
    throw error
  }
}

const deleteAvatar = async () => {
  try {
    const response = await apiClient.delete('/auth/avatar')
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Avatar delete failed', error.response?.data || error.message)
    throw error
  }
}

// 2FA Methods
const enable2FA = async () => {
  try {
    const response = await apiClient.post('/users/2fa/enable')
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Enable 2FA failed', error.response?.data || error.message)
    throw error
  }
}

const verify2FASetup = async token => {
  try {
    const response = await apiClient.post('/users/2fa/verify', { token })
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Verify 2FA setup failed', error.response?.data || error.message)
    throw error
  }
}

const disable2FA = async token => {
  try {
    const response = await apiClient.post('/users/2fa/disable', { token })
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Disable 2FA failed', error.response?.data || error.message)
    throw error
  }
}

// Session Methods
const getMySessions = async () => {
  try {
    const response = await apiClient.get('/sessions/my-sessions')
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Get sessions failed', error.response?.data || error.message)
    throw error
  }
}

const terminateSession = async sessionId => {
  try {
    const response = await apiClient.delete(`/sessions/my-sessions/${sessionId}`)
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Terminate session failed', error.response?.data || error.message)
    throw error
  }
}

const terminateOtherSessions = async () => {
  try {
    const response = await apiClient.post('/sessions/my-sessions/terminate-others')
    return response.data
  } catch (error) {
    apiLogger.error('Auth Service: Terminate other sessions failed', error.response?.data || error.message)
    throw error
  }
}

export default {
  login,
  verify2FA,
  me,
  changePassword,
  updateNotificationPreferences,
  refreshToken,
  forgotPassword,
  resetPassword,
  unblockAccount,
  uploadAvatar,
  deleteAvatar,
  // 2FA
  enable2FA,
  verify2FASetup,
  disable2FA,
  // Sessions
  getMySessions,
  terminateSession,
  terminateOtherSessions
}
