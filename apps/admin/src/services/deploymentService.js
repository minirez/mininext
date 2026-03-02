import apiClient from './api'

/**
 * List deployments with pagination and filters
 */
export const getDeployments = async (params = {}) => {
  const response = await apiClient.get('/deployments', { params })
  return response.data
}

/**
 * Get deployment statistics
 */
export const getDeploymentStats = async (days = 30) => {
  const response = await apiClient.get('/deployments/stats', { params: { days } })
  return response.data.data
}

/**
 * Get deployment detail
 */
export const getDeployment = async id => {
  const response = await apiClient.get(`/deployments/${id}`)
  return response.data.data
}

/**
 * Sync deployments from GitHub
 */
export const syncDeployments = async () => {
  const response = await apiClient.post('/deployments/sync')
  return response.data
}

/**
 * Sync jobs for a specific deployment
 */
export const syncDeploymentJobs = async id => {
  const response = await apiClient.post(`/deployments/${id}/sync-jobs`)
  return response.data
}

export default {
  getDeployments,
  getDeploymentStats,
  getDeployment,
  syncDeployments,
  syncDeploymentJobs
}
