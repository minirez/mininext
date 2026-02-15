/**
 * Payment Transactions Composable
 * Transaction listing, stats, filtering
 */
import { ref } from 'vue'
import * as api from '@/services/virtualPosService'
import { storeLogger } from '@/utils/logger'

export function usePaymentTransactions(sharedState) {
  // State
  const transactions = ref([])
  const stats = ref(null)

  // Actions
  async function fetchTransactions(params = {}) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const res = await api.getTransactions(params)
      transactions.value = res.transactions || res.data?.transactions || res || []
      return res
    } catch (e) {
      sharedState.error.value = e.message
      storeLogger.error('Fetch transactions failed:', e)
    } finally {
      sharedState.loading.value = false
    }
  }

  async function fetchStats() {
    try {
      stats.value = null
    } catch (e) {
      storeLogger.error('Fetch stats failed:', e)
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
      storeLogger.error('Fetch filter POS list failed:', e)
      return []
    }
  }

  return {
    // State
    transactions,
    stats,
    // Actions
    fetchTransactions,
    fetchStats,
    getTransaction,
    fetchFilterPosList
  }
}
