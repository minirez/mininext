import apiClient from './api'

/**
 * Get platform settings
 */
export const getSettings = async () => {
  const response = await apiClient.get('/platform-settings')
  return response.data.data
}

/**
 * Update platform settings
 */
export const updateSettings = async (settings) => {
  const response = await apiClient.put('/platform-settings', settings)
  return response.data.data
}

/**
 * Test email configuration
 */
export const testEmail = async (email) => {
  const response = await apiClient.post('/platform-settings/test-email', { email })
  return response.data
}

/**
 * Test SMS configuration
 */
export const testSMS = async (phone) => {
  const response = await apiClient.post('/platform-settings/test-sms', { phone })
  return response.data
}

/**
 * Generate VAPID keys
 */
export const generateVAPIDKeys = async () => {
  const response = await apiClient.post('/platform-settings/generate-vapid')
  return response.data.data
}

/**
 * Get VAPID public key (for push subscription)
 */
export const getVAPIDPublicKey = async () => {
  const response = await apiClient.get('/push/vapid-public-key')
  return response.data.data.publicKey
}

/**
 * Test Paximum connection
 */
export const testPaximum = async () => {
  const response = await apiClient.post('/platform-settings/test-paximum')
  return response.data
}

export default {
  getSettings,
  updateSettings,
  testEmail,
  testSMS,
  generateVAPIDKeys,
  getVAPIDPublicKey,
  testPaximum
}
