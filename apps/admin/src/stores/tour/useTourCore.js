/**
 * Tour Core Composable
 * Tour CRUD, stats, duplication
 */
import { ref, computed } from 'vue'
import * as tourService from '@/services/tourService'
import { useToast } from 'vue-toastification'
import i18n from '@/plugins/i18n'
import { storeLogger } from '@/utils/logger'

export function useTourCore(sharedState) {
  const toast = useToast()
  const t = i18n.global.t

  // State
  const tours = ref([])
  const currentTour = ref(null)
  const tourStats = ref(null)

  // Getters
  const activeTours = computed(() => tours.value.filter(t => t.status === 'active'))
  const featuredTours = computed(() => tours.value.filter(t => t.isFeatured))
  const tourCount = computed(() => tours.value.length)

  // Actions
  async function fetchTours(params = {}) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const response = await tourService.getTours(params)
      tours.value = response.data?.items || response.data || []
      if (response.data?.pagination) {
        sharedState.pagination.value = response.data.pagination
      }
      return response.data
    } catch (err) {
      sharedState.error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.loadTours'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function fetchTour(id) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const response = await tourService.getTour(id)
      currentTour.value = response.data
      return response.data
    } catch (err) {
      sharedState.error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.loadTour'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function fetchTourStats() {
    try {
      const response = await tourService.getTourStats()
      tourStats.value = response.data
      return response.data
    } catch (err) {
      storeLogger.error('Stats fetch error:', err)
    }
  }

  async function createTour(payload) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const response = await tourService.createTour(payload)
      tours.value.unshift(response.data)
      toast.success(response.message || t('tour.toasts.created'))
      return response.data
    } catch (err) {
      sharedState.error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.createTour'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function updateTour(id, payload) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const response = await tourService.updateTour(id, payload)
      const index = tours.value.findIndex(t => t._id === id)
      if (index !== -1) {
        tours.value[index] = response.data
      }
      if (currentTour.value?._id === id) {
        currentTour.value = response.data
      }
      toast.success(response.message || t('tour.toasts.updated'))
      return response.data
    } catch (err) {
      sharedState.error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.updateTour'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function deleteTour(id) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      await tourService.deleteTour(id)
      tours.value = tours.value.filter(t => t._id !== id)
      toast.success(t('tour.toasts.deleted'))
    } catch (err) {
      sharedState.error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.deleteTour'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function duplicateTour(id) {
    sharedState.loading.value = true
    try {
      const response = await tourService.duplicateTour(id)
      tours.value.unshift(response.data)
      toast.success(t('tour.toasts.duplicated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.duplicateTour'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  function clearCurrentTour() {
    currentTour.value = null
  }

  return {
    // State
    tours,
    currentTour,
    tourStats,
    // Getters
    activeTours,
    featuredTours,
    tourCount,
    // Actions
    fetchTours,
    fetchTour,
    fetchTourStats,
    createTour,
    updateTour,
    deleteTour,
    duplicateTour,
    clearCurrentTour
  }
}
