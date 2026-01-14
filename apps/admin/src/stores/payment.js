/**
 * Payment Store
 * Virtual POS ve ödeme işlemleri state yönetimi
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/services/virtualPosService'

export const usePaymentStore = defineStore('payment', () => {
  // State
  const posList = ref([])
  const banks = ref([])
  const providers = ref([])
  const transactions = ref([])
  const stats = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // ============================================================================
  // POS
  // ============================================================================

  /**
   * Fetch POS list
   * @param {Object} options - Filter options
   * @param {string} options.type - 'platform' | 'partner' | 'all'
   * @param {string} options.partnerId - Filter by specific partner (null = platform)
   */
  async function fetchPosList(options = {}) {
    loading.value = true
    error.value = null
    try {
      const params = {}
      if (options.type) params.type = options.type
      if (options.partnerId !== undefined) params.partnerId = options.partnerId
      const res = await api.getPosList(params)
      posList.value = res.posList || res.data?.posList || res || []
    } catch (e) {
      error.value = e.message
      console.error('Fetch POS list failed:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchProviders() {
    try {
      const res = await api.getPaymentProviders()
      providers.value = res.providers || res.data?.providers || res || []
    } catch (e) {
      console.error('Fetch providers failed:', e)
    }
  }

  async function fetchBanks() {
    try {
      const res = await api.posApi.getBanks()
      banks.value = res.data?.banks || res.banks || []
    } catch (e) {
      console.error('Fetch banks failed:', e)
      banks.value = []
    }
  }

  async function createPos(data) {
    const res = await api.createPos(data)
    await fetchPosList()
    return res
  }

  async function updatePos(id, data) {
    const res = await api.updatePos(id, data)
    await fetchPosList()
    return res
  }

  async function deletePos(id) {
    await api.deletePos(id)
    await fetchPosList()
  }

  async function setDefaultPos(id, currency) {
    // If endpoint exists
    try {
      const res = await api.testPos(id, { setDefault: true, currency })
      await fetchPosList()
      return res
    } catch (e) {
      console.error('Set default POS failed:', e)
      throw e
    }
  }

  async function unsetDefaultPos(id, currency) {
    try {
      const res = await api.testPos(id, { unsetDefault: true, currency })
      await fetchPosList()
      return res
    } catch (e) {
      console.error('Unset default POS failed:', e)
      throw e
    }
  }

  // ============================================================================
  // Transactions
  // ============================================================================

  async function fetchTransactions(params = {}) {
    loading.value = true
    error.value = null
    try {
      const res = await api.getTransactions(params)
      transactions.value = res.transactions || res.data?.transactions || res || []
      return res
    } catch (e) {
      error.value = e.message
      console.error('Fetch transactions failed:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    try {
      // Stats endpoint - if available
      stats.value = null
    } catch (e) {
      console.error('Fetch stats failed:', e)
    }
  }

  async function getTransaction(id) {
    const res = await api.getTransaction(id)
    return res
  }

  async function fetchFilterPosList() {
    try {
      const res = await api.getPosList()
      return res.posList || res || []
    } catch (e) {
      console.error('Fetch filter POS list failed:', e)
      return []
    }
  }

  // ============================================================================
  // Payment
  // ============================================================================

  async function processPayment(paymentData) {
    loading.value = true
    error.value = null
    try {
      const res = await api.testPayment(paymentData)
      return res
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function queryBin(bin, amount, currency) {
    try {
      const res = await api.lookupBin(bin)
      return res
    } catch (e) {
      console.error('BIN query failed:', e)
      return null
    }
  }

  async function refundPayment(transactionId) {
    loading.value = true
    error.value = null
    try {
      const res = await api.refundTransaction(transactionId)
      return res
    } catch (e) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cancelPayment(transactionId) {
    loading.value = true
    error.value = null
    try {
      const res = await api.cancelTransaction(transactionId)
      return res
    } catch (e) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function queryBankStatus(transactionId) {
    loading.value = true
    error.value = null
    try {
      const res = await api.getTransaction(transactionId)
      return res
    } catch (e) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function getPosCapabilities(posId) {
    try {
      const res = await api.getPos(posId)
      return res
    } catch (e) {
      console.error('Get POS capabilities failed:', e)
      return null
    }
  }

  // ============================================================================
  // Commission
  // ============================================================================

  /**
   * Update POS platform commission margins
   * @param {string} posId - POS ID
   * @param {string} periodId - Commission period ID
   * @param {Object} data - Commission data { foreignCardMargin, foreignBankMargin, rates }
   */
  async function updatePosCommission(posId, periodId, data) {
    loading.value = true
    error.value = null
    try {
      const res = await api.updatePosCommission(posId, periodId, data)
      await fetchPosList() // Refresh POS list
      return res
    } catch (e) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    posList,
    banks,
    providers,
    transactions,
    stats,
    loading,
    error,
    // POS
    fetchPosList,
    fetchBanks,
    fetchProviders,
    createPos,
    updatePos,
    deletePos,
    setDefaultPos,
    unsetDefaultPos,
    // Transactions
    fetchTransactions,
    fetchStats,
    getTransaction,
    fetchFilterPosList,
    // Payment
    processPayment,
    queryBin,
    // Refund & Cancel
    refundPayment,
    cancelPayment,
    queryBankStatus,
    getPosCapabilities,
    // Commission
    updatePosCommission
  }
})
