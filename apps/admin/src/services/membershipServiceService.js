import api from './api'
import { apiLogger } from '@/utils/logger'

const BASE_URL = '/membership-services'

export async function getMembershipServices(params = {}) {
  try {
    const { data } = await api.get(BASE_URL, { params })
    return data
  } catch (error) {
    apiLogger.error('getMembershipServices failed:', error)
    throw error
  }
}

export async function getMembershipService(id) {
  try {
    const { data } = await api.get(`${BASE_URL}/${id}`)
    return data
  } catch (error) {
    apiLogger.error('getMembershipService failed:', error)
    throw error
  }
}

export async function createMembershipService(payload) {
  try {
    const { data } = await api.post(BASE_URL, payload)
    return data
  } catch (error) {
    apiLogger.error('createMembershipService failed:', error)
    throw error
  }
}

export async function updateMembershipService(id, payload) {
  try {
    const { data } = await api.put(`${BASE_URL}/${id}`, payload)
    return data
  } catch (error) {
    apiLogger.error('updateMembershipService failed:', error)
    throw error
  }
}

export async function archiveMembershipService(id) {
  try {
    const { data } = await api.delete(`${BASE_URL}/${id}`)
    return data
  } catch (error) {
    apiLogger.error('archiveMembershipService failed:', error)
    throw error
  }
}

export async function getMembershipServiceStats() {
  try {
    const { data } = await api.get(`${BASE_URL}/stats`)
    return data
  } catch (error) {
    apiLogger.error('getMembershipServiceStats failed:', error)
    throw error
  }
}

export default {
  getMembershipServices,
  getMembershipService,
  createMembershipService,
  updateMembershipService,
  archiveMembershipService,
  getMembershipServiceStats
}
