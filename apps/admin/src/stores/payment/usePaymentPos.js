/**
 * Payment POS Composable
 * POS CRUD, banks, providers
 */
import { ref } from 'vue'
import * as api from '@/services/virtualPosService'

export function usePaymentPos(sharedState) {
  // State
  const posList = ref([])
  const banks = ref([])
  const providers = ref([])

  // Actions
  async function fetchPosList(options = {}) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const params = {}
      if (options.type) params.type = options.type
      if (options.partnerId !== undefined) params.partnerId = options.partnerId
      const res = await api.getPosList(params)
      posList.value = res.posList || res.data?.posList || res || []
    } catch (e) {
      sharedState.error.value = e.message
      console.error('Fetch POS list failed:', e)
    } finally {
      sharedState.loading.value = false
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

  async function getPosCapabilities(posId) {
    try {
      const res = await api.getPos(posId)
      return res
    } catch (e) {
      console.error('Get POS capabilities failed:', e)
      return null
    }
  }

  async function updatePosCommission(posId, periodId, data) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const res = await api.updatePosCommission(posId, periodId, data)
      await fetchPosList()
      return res
    } catch (e) {
      sharedState.error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      sharedState.loading.value = false
    }
  }

  return {
    // State
    posList,
    banks,
    providers,
    // Actions
    fetchPosList,
    fetchProviders,
    fetchBanks,
    createPos,
    updatePos,
    deletePos,
    setDefaultPos,
    unsetDefaultPos,
    getPosCapabilities,
    updatePosCommission
  }
}
