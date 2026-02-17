import apiClient from './api'
import { apiLogger } from '@/utils/logger'

const getServices = async (params = {}) => {
  try {
    const response = await apiClient.get('/subscriptions/services', { params })
    return response.data
  } catch (error) {
    apiLogger.error(
      'SubscriptionService: Get services failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const getActiveServices = async () => {
  try {
    const response = await apiClient.get('/subscriptions/services/active')
    return response.data
  } catch (error) {
    apiLogger.error(
      'SubscriptionService: Get active services failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const getService = async id => {
  try {
    const response = await apiClient.get(`/subscriptions/services/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SubscriptionService: Get service failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const createService = async data => {
  try {
    const response = await apiClient.post('/subscriptions/services', data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SubscriptionService: Create service failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const updateService = async (id, data) => {
  try {
    const response = await apiClient.put(`/subscriptions/services/${id}`, data)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SubscriptionService: Update service failed',
      error.response?.data || error.message
    )
    throw error
  }
}

const deleteService = async id => {
  try {
    const response = await apiClient.delete(`/subscriptions/services/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'SubscriptionService: Delete service failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export default {
  getServices,
  getActiveServices,
  getService,
  createService,
  updateService,
  deleteService
}
