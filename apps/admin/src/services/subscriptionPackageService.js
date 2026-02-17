import apiClient from './api'
import { apiLogger } from '@/utils/logger'

const getPackages = async (params = {}) => {
  try {
    const response = await apiClient.get('/subscriptions/packages', { params })
    return response.data
  } catch (error) {
    apiLogger.error(
      'SubscriptionPackage: Get packages failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const getActivePackages = async () => {
  try {
    const response = await apiClient.get('/subscriptions/packages/active')
    return response.data
  } catch (error) {
    apiLogger.error(
      'SubscriptionPackage: Get active packages failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const getPackage = async id => {
  try {
    const response = await apiClient.get(`/subscriptions/packages/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SubscriptionPackage: Get package failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const createPackage = async data => {
  try {
    const response = await apiClient.post('/subscriptions/packages', data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SubscriptionPackage: Create package failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const updatePackage = async (id, data) => {
  try {
    const response = await apiClient.put(`/subscriptions/packages/${id}`, data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SubscriptionPackage: Update package failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const deletePackage = async id => {
  try {
    const response = await apiClient.delete(`/subscriptions/packages/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SubscriptionPackage: Delete package failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export default {
  getPackages,
  getActivePackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage
}
