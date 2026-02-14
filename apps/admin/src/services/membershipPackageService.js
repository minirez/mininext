import api from './api'
import { apiLogger } from '@/utils/logger'

const BASE_URL = '/membership-packages'

export async function getMembershipPackages(params = {}) {
  try {
    const { data } = await api.get(BASE_URL, { params })
    return data
  } catch (error) {
    apiLogger.error('getMembershipPackages failed:', error)
    throw error
  }
}

export async function getMembershipPackage(id) {
  try {
    const { data } = await api.get(`${BASE_URL}/${id}`)
    return data
  } catch (error) {
    apiLogger.error('getMembershipPackage failed:', error)
    throw error
  }
}

export async function getPublicCatalog(params = {}) {
  try {
    const { data } = await api.get(`${BASE_URL}/public`, { params })
    return data
  } catch (error) {
    apiLogger.error('getPublicCatalog failed:', error)
    throw error
  }
}

export async function createMembershipPackage(payload) {
  try {
    const { data } = await api.post(BASE_URL, payload)
    return data
  } catch (error) {
    apiLogger.error('createMembershipPackage failed:', error)
    throw error
  }
}

export async function updateMembershipPackage(id, payload) {
  try {
    const { data } = await api.put(`${BASE_URL}/${id}`, payload)
    return data
  } catch (error) {
    apiLogger.error('updateMembershipPackage failed:', error)
    throw error
  }
}

export async function archiveMembershipPackage(id) {
  try {
    const { data } = await api.delete(`${BASE_URL}/${id}`)
    return data
  } catch (error) {
    apiLogger.error('archiveMembershipPackage failed:', error)
    throw error
  }
}

export async function calculatePackagePrice(id, currency = 'TRY') {
  try {
    const { data } = await api.get(`${BASE_URL}/${id}/calculate-price`, { params: { currency } })
    return data
  } catch (error) {
    apiLogger.error('calculatePackagePrice failed:', error)
    throw error
  }
}

export async function getMembershipPackageStats() {
  try {
    const { data } = await api.get(`${BASE_URL}/stats`)
    return data
  } catch (error) {
    apiLogger.error('getMembershipPackageStats failed:', error)
    throw error
  }
}

// Partner subscription assignment endpoints (admin)
export async function assignPackageToPartner(partnerId, payload) {
  try {
    const { data } = await api.post(`/partners/${partnerId}/subscription/assign-package`, payload)
    return data
  } catch (error) {
    apiLogger.error('assignPackageToPartner failed:', error)
    throw error
  }
}

export async function addServiceToPartner(partnerId, payload) {
  try {
    const { data } = await api.post(`/partners/${partnerId}/subscription/add-service`, payload)
    return data
  } catch (error) {
    apiLogger.error('addServiceToPartner failed:', error)
    throw error
  }
}

export async function removeServiceFromPartner(partnerId, serviceId) {
  try {
    const { data } = await api.delete(`/partners/${partnerId}/subscription/services/${serviceId}`)
    return data
  } catch (error) {
    apiLogger.error('removeServiceFromPartner failed:', error)
    throw error
  }
}

export default {
  getMembershipPackages,
  getMembershipPackage,
  getPublicCatalog,
  createMembershipPackage,
  updateMembershipPackage,
  archiveMembershipPackage,
  calculatePackagePrice,
  getMembershipPackageStats,
  assignPackageToPartner,
  addServiceToPartner,
  removeServiceFromPartner
}
