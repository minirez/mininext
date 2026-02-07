/**
 * Tour Departures Composable
 * Departure CRUD, bulk operations, search, availability
 */
import { ref } from 'vue'
import * as tourService from '@/services/tourService'
import { useToast } from 'vue-toastification'
import i18n from '@/plugins/i18n'

export function useTourDepartures(sharedState) {
  const toast = useToast()
  const t = i18n.global.t

  // State
  const departures = ref([])
  const currentDeparture = ref(null)
  const upcomingDepartures = ref([])

  // Actions
  async function fetchDepartures(tourId, params = {}) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const response = await tourService.getDepartures(tourId, params)
      departures.value = response.data?.items || response.data || []
      return response.data
    } catch (err) {
      sharedState.error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.loadDepartures'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function fetchDeparture(id) {
    sharedState.loading.value = true
    try {
      const response = await tourService.getDeparture(id)
      currentDeparture.value = response.data
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.loadDeparture'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function createDeparture(tourId, payload) {
    sharedState.loading.value = true
    try {
      const response = await tourService.createDeparture(tourId, payload)
      departures.value.unshift(response.data)
      toast.success(t('tour.toasts.departureCreated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.createDeparture'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function bulkCreateDepartures(tourId, payload) {
    sharedState.loading.value = true
    try {
      const response = await tourService.bulkCreateDepartures(tourId, payload)
      if (response.data?.created) {
        departures.value.unshift(...response.data.created)
      }
      toast.success(t('tour.toasts.departuresBulkCreated', { count: response.data?.count || 0 }))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.bulkCreateDepartures'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function updateDeparture(id, payload) {
    sharedState.loading.value = true
    try {
      const response = await tourService.updateDeparture(id, payload)
      const index = departures.value.findIndex(d => d._id === id)
      if (index !== -1) {
        departures.value[index] = response.data
      }
      toast.success(t('tour.toasts.departureUpdated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.updateDeparture'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function deleteDeparture(id) {
    sharedState.loading.value = true
    try {
      await tourService.deleteDeparture(id)
      departures.value = departures.value.filter(d => d._id !== id)
      toast.success(t('tour.toasts.departureDeleted'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.deleteDeparture'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function searchDepartures(params = {}) {
    sharedState.loading.value = true
    try {
      const response = await tourService.searchDepartures(params)
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.searchDepartures'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function fetchAllDepartures(params = {}) {
    sharedState.loading.value = true
    sharedState.error.value = null
    try {
      const response = await tourService.searchDepartures(params)
      departures.value = response.data?.items || response.data || []
      return response.data
    } catch (err) {
      sharedState.error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.loadDepartures'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function checkAvailability(departureId, params = {}) {
    try {
      const response = await tourService.checkAvailability(departureId, params)
      return response.data
    } catch (err) {
      throw err
    }
  }

  async function fetchUpcomingDepartures(params = {}) {
    try {
      const response = await tourService.getUpcomingDepartures(params)
      upcomingDepartures.value = response.data || []
      return response.data
    } catch (err) {
      console.error('Upcoming departures fetch error:', err)
    }
  }

  async function bulkUpdateDeparturePricing(tourId, payload) {
    sharedState.loading.value = true
    try {
      const response = await tourService.bulkUpdateDeparturePricing(tourId, payload)
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update departure pricing')
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  function clearCurrentDeparture() {
    currentDeparture.value = null
  }

  return {
    // State
    departures,
    currentDeparture,
    upcomingDepartures,
    // Actions
    fetchDepartures,
    fetchDeparture,
    createDeparture,
    bulkCreateDepartures,
    updateDeparture,
    deleteDeparture,
    searchDepartures,
    fetchAllDepartures,
    checkAvailability,
    fetchUpcomingDepartures,
    bulkUpdateDeparturePricing,
    clearCurrentDeparture
  }
}
