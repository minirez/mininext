/**
 * Virtual POS Service API
 * Communicates with the payment microservice
 */

import axios from 'axios'

const PAYMENT_API = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:7043/api'

// Create axios instance for payment service
const posClient = axios.create({
  baseURL: PAYMENT_API,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
posClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ============================================================================
// Companies - DEPRECATED (Use partnerId on POS instead)
// ============================================================================

/** @deprecated Use partnerId on VirtualPos instead */
export const getCompanies = async (params = {}) => {
  console.warn('getCompanies is deprecated - use partnerId on POS')
  const response = await posClient.get('/companies', { params })
  return response.data
}

/** @deprecated Use partnerId on VirtualPos instead */
export const getCompany = async (id) => {
  console.warn('getCompany is deprecated - use partnerId on POS')
  const response = await posClient.get(`/companies/${id}`)
  return response.data
}

/** @deprecated Use partnerId on VirtualPos instead */
export const createCompany = async (data) => {
  console.warn('createCompany is deprecated - use partnerId on POS')
  const response = await posClient.post('/companies', data)
  return response.data
}

/** @deprecated Use partnerId on VirtualPos instead */
export const updateCompany = async (id, data) => {
  console.warn('updateCompany is deprecated - use partnerId on POS')
  const response = await posClient.put(`/companies/${id}`, data)
  return response.data
}

/** @deprecated Use partnerId on VirtualPos instead */
export const deleteCompany = async (id) => {
  console.warn('deleteCompany is deprecated - use partnerId on POS')
  const response = await posClient.delete(`/companies/${id}`)
  return response.data
}

// ============================================================================
// POS (Virtual POS)
// ============================================================================

export const getPosList = async (params = {}) => {
  const response = await posClient.get('/pos', { params })
  return response.data
}

export const getPos = async (id) => {
  const response = await posClient.get(`/pos/${id}`)
  return response.data
}

export const createPos = async (data) => {
  const response = await posClient.post('/pos', data)
  return response.data
}

export const updatePos = async (id, data) => {
  const response = await posClient.put(`/pos/${id}`, data)
  return response.data
}

export const deletePos = async (id) => {
  const response = await posClient.delete(`/pos/${id}`)
  return response.data
}

export const testPos = async (id, data) => {
  const response = await posClient.post(`/pos/${id}/test`, data)
  return response.data
}

/**
 * Update POS platform commission margins
 * @param {string} posId - POS ID
 * @param {string} periodId - Commission period ID
 * @param {Object} data - { foreignCardMargin, foreignBankMargin, rates }
 */
export const updatePosCommission = async (posId, periodId, data) => {
  const response = await posClient.put(`/pos/${posId}/commission/${periodId}`, data)
  return response.data
}

// ============================================================================
// Transactions
// ============================================================================

export const getTransactions = async (params = {}) => {
  const response = await posClient.get('/transactions', { params })
  return response.data
}

export const getTransaction = async (id) => {
  const response = await posClient.get(`/transactions/${id}`)
  return response.data
}

export const refundTransaction = async (id, data = {}) => {
  const response = await posClient.post(`/transactions/${id}/refund`, data)
  return response.data
}

export const cancelTransaction = async (id, data = {}) => {
  const response = await posClient.post(`/transactions/${id}/cancel`, data)
  return response.data
}

// ============================================================================
// BINs
// ============================================================================

export const getBins = async (params = {}) => {
  const response = await posClient.get('/bins', { params })
  return response.data
}

export const getBin = async (id) => {
  const response = await posClient.get(`/bins/${id}`)
  return response.data
}

export const createBin = async (data) => {
  const response = await posClient.post('/bins', data)
  return response.data
}

export const updateBin = async (id, data) => {
  const response = await posClient.put(`/bins/${id}`, data)
  return response.data
}

export const deleteBin = async (id) => {
  const response = await posClient.delete(`/bins/${id}`)
  return response.data
}

export const importBins = async (data) => {
  const response = await posClient.post('/bins/import', data)
  return response.data
}

export const lookupBin = async (binNumber) => {
  const response = await posClient.get(`/bins/lookup/${binNumber}`)
  return response.data
}

// ============================================================================
// Payment Test
// ============================================================================

export const testPayment = async (data) => {
  const response = await posClient.post('/pay', data)
  return response.data
}

export const getPaymentProviders = async () => {
  const response = await posClient.get('/providers')
  return response.data
}

/**
 * Get payment service info (server IP, callback URLs, etc.)
 * Used for displaying IP address requirements for bank POS configuration
 */
export const getServerInfo = async () => {
  // Use base URL without /api (info endpoint is at root)
  const baseUrl = PAYMENT_API.replace('/api', '')
  const response = await axios.get(`${baseUrl}/info`)
  return response.data
}

// ============================================================================
// Partner POS Commissions
// ============================================================================

export const getPartnerCommissions = async (params = {}) => {
  const response = await posClient.get('/partner-commissions', { params })
  return response.data
}

export const getPartnerCommission = async (id) => {
  const response = await posClient.get(`/partner-commissions/${id}`)
  return response.data
}

export const createPartnerCommission = async (data) => {
  const response = await posClient.post('/partner-commissions', data)
  return response.data
}

export const updatePartnerCommission = async (id, data) => {
  const response = await posClient.put(`/partner-commissions/${id}`, data)
  return response.data
}

export const deletePartnerCommission = async (id) => {
  const response = await posClient.delete(`/partner-commissions/${id}`)
  return response.data
}

export const calculateCommission = async (data) => {
  const response = await posClient.post('/partner-commissions/calculate', data)
  return response.data
}

// ============================================================================
// API Objects (for component compatibility)
// ============================================================================

/** @deprecated Use partnerId on VirtualPos instead */
export const companyApi = {
  list: getCompanies,
  get: getCompany,
  create: createCompany,
  update: updateCompany,
  delete: deleteCompany,
  getApiKeys: async (id) => {
    console.warn('companyApi.getApiKeys is deprecated')
    const response = await posClient.get(`/companies/${id}/api-keys`)
    return response
  },
  createApiKey: async (id, data) => {
    console.warn('companyApi.createApiKey is deprecated')
    const response = await posClient.post(`/companies/${id}/api-keys`, data)
    return response
  },
  deleteApiKey: async (companyId, keyId) => {
    console.warn('companyApi.deleteApiKey is deprecated')
    const response = await posClient.delete(`/companies/${companyId}/api-keys/${keyId}`)
    return response
  }
}

export const binApi = {
  list: async (params = {}) => {
    const response = await posClient.get('/bins', { params })
    return response
  },
  get: getBin,
  create: createBin,
  update: updateBin,
  delete: deleteBin,
  bulkImport: importBins,
  search: async (bin) => {
    const response = await posClient.get(`/bins/search/${bin}`)
    return response
  },
  lookup: async (bin) => {
    const response = await posClient.get(`/bins/lookup/${bin}`)
    return response
  },
  getStats: async () => {
    const response = await posClient.get('/bins/stats')
    return response
  },
  getBanks: async () => {
    const response = await posClient.get('/bins/banks')
    return response
  },
  getFamilies: async () => {
    const response = await posClient.get('/bins/families')
    return response
  }
}

export const posApi = {
  list: getPosList,
  get: getPos,
  create: createPos,
  update: updatePos,
  delete: deletePos,
  testConnection: testPos,
  getProviders: getPaymentProviders,
  getBanks: async () => {
    const response = await posClient.get('/pos/banks')
    return response
  },
  setDefault: async (id, currency) => {
    const response = await posClient.post(`/pos/${id}/set-default/${currency}`)
    return response
  },
  unsetDefault: async (id, currency) => {
    const response = await posClient.delete(`/pos/${id}/unset-default/${currency}`)
    return response
  }
}

export const transactionApi = {
  list: getTransactions,
  get: getTransaction,
  refund: refundTransaction,
  cancel: cancelTransaction,
  getStats: async (params = {}) => {
    const response = await posClient.get('/transactions/stats', { params })
    return response
  },
  getPosList: async () => {
    const response = await posClient.get('/transactions/pos-list')
    return response
  }
}

export const paymentApi = {
  pay: testPayment,
  queryBin: async (data) => {
    const response = await posClient.post('/bin', data)
    return response
  },
  getStatus: async (id) => {
    const response = await posClient.get(`/${id}`)
    return response
  },
  refund: async (transactionId) => {
    const response = await posClient.post('/refund', { transactionId })
    return response
  },
  cancel: async (transactionId) => {
    const response = await posClient.post('/cancel', { transactionId })
    return response
  },
  queryStatus: async (id) => {
    const response = await posClient.get(`/status/${id}`)
    return response
  },
  getCapabilities: async (posId) => {
    const response = await posClient.get(`/capabilities/${posId}`)
    return response
  }
}

export const partnerCommissionApi = {
  list: getPartnerCommissions,
  get: getPartnerCommission,
  create: createPartnerCommission,
  update: updatePartnerCommission,
  delete: deletePartnerCommission,
  calculate: calculateCommission
}

export default {
  // Companies
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,

  // POS
  getPosList,
  getPos,
  createPos,
  updatePos,
  deletePos,
  testPos,
  updatePosCommission,

  // Transactions
  getTransactions,
  getTransaction,
  refundTransaction,
  cancelTransaction,

  // BINs
  getBins,
  getBin,
  createBin,
  updateBin,
  deleteBin,
  importBins,
  lookupBin,

  // Payment
  testPayment,
  getPaymentProviders,
  getServerInfo,

  // Partner Commissions
  getPartnerCommissions,
  getPartnerCommission,
  createPartnerCommission,
  updatePartnerCommission,
  deletePartnerCommission,
  calculateCommission,

  // API Objects
  companyApi,
  binApi,
  posApi,
  transactionApi,
  paymentApi,
  partnerCommissionApi
}
