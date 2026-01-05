import apiClient from './api'

/**
 * Get partner email settings
 * @param {string} partnerId - Partner ID
 */
export const getEmailSettings = async partnerId => {
  const response = await apiClient.get(`/partners/${partnerId}/email-settings`)
  return response.data.data
}

/**
 * Update partner email settings
 * @param {string} partnerId - Partner ID
 * @param {Object} settings - Email settings
 */
export const updateEmailSettings = async (partnerId, settings) => {
  const response = await apiClient.put(`/partners/${partnerId}/email-settings`, settings)
  return response.data.data
}

/**
 * Create domain identity in AWS SES
 * @param {string} partnerId - Partner ID
 * @param {Object} data - Domain and sender info
 * @param {string} data.domain - Domain name (e.g., sirket.com)
 * @param {string} data.fromEmail - Sender email (e.g., noreply@sirket.com)
 * @param {string} data.fromName - Sender name
 */
export const createIdentity = async (partnerId, data) => {
  const response = await apiClient.post(
    `/partners/${partnerId}/email-settings/create-identity`,
    data
  )
  return response.data.data
}

/**
 * Get domain verification status from AWS SES
 * @param {string} partnerId - Partner ID
 */
export const getVerificationStatus = async partnerId => {
  const response = await apiClient.get(`/partners/${partnerId}/email-settings/verification-status`)
  return response.data.data
}

/**
 * Delete domain identity from AWS SES
 * @param {string} partnerId - Partner ID
 */
export const deleteIdentity = async partnerId => {
  const response = await apiClient.delete(`/partners/${partnerId}/email-settings/delete-identity`)
  return response.data
}

/**
 * Send test email
 * @param {string} partnerId - Partner ID
 * @param {string} email - Email address to send test to
 */
export const testEmail = async (partnerId, email) => {
  const response = await apiClient.post(`/partners/${partnerId}/email-settings/test-email`, {
    email
  })
  return response.data
}

/**
 * Verify domain in AWS SES
 * @param {string} partnerId - Partner ID
 */
export const verifyDomain = async partnerId => {
  const response = await apiClient.post(`/partners/${partnerId}/email-settings/verify-domain`)
  return response.data.data
}

/**
 * Get domain status from AWS SES
 * @param {string} partnerId - Partner ID
 */
export const getDomainStatus = async partnerId => {
  const response = await apiClient.get(`/partners/${partnerId}/email-settings/domain-status`)
  return response.data.data
}

export default {
  getEmailSettings,
  updateEmailSettings,
  createIdentity,
  getVerificationStatus,
  deleteIdentity,
  testEmail,
  verifyDomain,
  getDomainStatus
}
