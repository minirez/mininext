/**
 * Tour Extras Composable
 * Extra services CRUD
 */
import { ref, computed } from 'vue'
import * as tourService from '@/services/tourService'
import { useToast } from 'vue-toastification'
import i18n from '@/plugins/i18n'

export function useTourExtras(sharedState) {
  const toast = useToast()
  const t = i18n.global.t

  // State
  const extras = ref([])
  const currentExtra = ref(null)

  // Getters
  const activeExtras = computed(() => extras.value.filter(e => e.status === 'active'))
  const extrasByCategory = computed(() => {
    const grouped = {}
    extras.value.forEach(extra => {
      if (!grouped[extra.category]) {
        grouped[extra.category] = []
      }
      grouped[extra.category].push(extra)
    })
    return grouped
  })

  // Actions
  async function fetchExtras(params = {}) {
    sharedState.loading.value = true
    try {
      const response = await tourService.getExtras(params)
      extras.value = response.data?.items || response.data || []
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.loadExtras'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function fetchExtra(id) {
    sharedState.loading.value = true
    try {
      const response = await tourService.getExtra(id)
      currentExtra.value = response.data
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.loadExtra'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function createExtra(payload) {
    sharedState.loading.value = true
    try {
      const response = await tourService.createExtra(payload)
      extras.value.unshift(response.data)
      toast.success(t('tour.toasts.extraCreated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.createExtra'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function updateExtra(id, payload) {
    sharedState.loading.value = true
    try {
      const response = await tourService.updateExtra(id, payload)
      const index = extras.value.findIndex(e => e._id === id)
      if (index !== -1) {
        extras.value[index] = response.data
      }
      toast.success(t('tour.toasts.extraUpdated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.updateExtra'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function deleteExtra(id) {
    sharedState.loading.value = true
    try {
      await tourService.deleteExtra(id)
      extras.value = extras.value.filter(e => e._id !== id)
      toast.success(t('tour.toasts.extraDeleted'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.deleteExtra'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  function clearCurrentExtra() {
    currentExtra.value = null
  }

  return {
    // State
    extras,
    currentExtra,
    // Getters
    activeExtras,
    extrasByCategory,
    // Actions
    fetchExtras,
    fetchExtra,
    createExtra,
    updateExtra,
    deleteExtra,
    clearCurrentExtra
  }
}
