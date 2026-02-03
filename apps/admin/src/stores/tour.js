import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as tourService from '@/services/tourService'
import { useToast } from 'vue-toastification'
import i18n from '@/plugins/i18n'

export const useTourStore = defineStore('tour', () => {
  const toast = useToast()
  const t = i18n.global.t

  // =====================
  // STATE - Tours
  // =====================
  const tours = ref([])
  const currentTour = ref(null)
  const tourStats = ref(null)

  // =====================
  // STATE - Departures
  // =====================
  const departures = ref([])
  const currentDeparture = ref(null)
  const upcomingDepartures = ref([])

  // =====================
  // STATE - Extras
  // =====================
  const extras = ref([])
  const currentExtra = ref(null)

  // =====================
  // STATE - Bookings
  // =====================
  const bookings = ref([])
  const currentBooking = ref(null)
  const upcomingBookings = ref([])

  // =====================
  // STATE - UI
  // =====================
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // =====================
  // GETTERS
  // =====================
  const activeTours = computed(() => tours.value.filter(t => t.status === 'active'))
  const featuredTours = computed(() => tours.value.filter(t => t.isFeatured))
  const tourCount = computed(() => tours.value.length)

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

  const pendingBookings = computed(() => bookings.value.filter(b => b.status === 'pending'))
  const confirmedBookings = computed(() => bookings.value.filter(b => b.status === 'confirmed'))

  // =====================
  // ACTIONS - Tours
  // =====================
  async function fetchTours(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await tourService.getTours(params)
      tours.value = response.data?.items || response.data || []
      if (response.data?.pagination) {
        pagination.value = response.data.pagination
      }
      return response.data
    } catch (err) {
      error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.loadTours'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTour(id) {
    loading.value = true
    error.value = null
    try {
      const response = await tourService.getTour(id)
      currentTour.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.loadTour'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTourStats() {
    try {
      const response = await tourService.getTourStats()
      tourStats.value = response.data
      return response.data
    } catch (err) {
      console.error('Stats fetch error:', err)
    }
  }

  async function createTour(payload) {
    loading.value = true
    error.value = null
    try {
      const response = await tourService.createTour(payload)
      tours.value.unshift(response.data)
      toast.success(response.message || t('tour.toasts.created'))
      return response.data
    } catch (err) {
      error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.createTour'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTour(id, payload) {
    loading.value = true
    error.value = null
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
      error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.updateTour'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTour(id) {
    loading.value = true
    error.value = null
    try {
      await tourService.deleteTour(id)
      tours.value = tours.value.filter(t => t._id !== id)
      toast.success(t('tour.toasts.deleted'))
    } catch (err) {
      error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.deleteTour'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function duplicateTour(id) {
    loading.value = true
    try {
      const response = await tourService.duplicateTour(id)
      tours.value.unshift(response.data)
      toast.success(t('tour.toasts.duplicated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.duplicateTour'))
      throw err
    } finally {
      loading.value = false
    }
  }

  // =====================
  // ACTIONS - Departures
  // =====================
  async function fetchDepartures(tourId, params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await tourService.getDepartures(tourId, params)
      departures.value = response.data?.items || response.data || []
      return response.data
    } catch (err) {
      error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.loadDepartures'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDeparture(id) {
    loading.value = true
    try {
      const response = await tourService.getDeparture(id)
      currentDeparture.value = response.data
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.loadDeparture'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createDeparture(tourId, payload) {
    loading.value = true
    try {
      const response = await tourService.createDeparture(tourId, payload)
      departures.value.unshift(response.data)
      toast.success(t('tour.toasts.departureCreated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.createDeparture'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function bulkCreateDepartures(tourId, payload) {
    loading.value = true
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
      loading.value = false
    }
  }

  async function updateDeparture(id, payload) {
    loading.value = true
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
      loading.value = false
    }
  }

  async function deleteDeparture(id) {
    loading.value = true
    try {
      await tourService.deleteDeparture(id)
      departures.value = departures.value.filter(d => d._id !== id)
      toast.success(t('tour.toasts.departureDeleted'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.deleteDeparture'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function searchDepartures(params = {}) {
    loading.value = true
    try {
      const response = await tourService.searchDepartures(params)
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.searchDepartures'))
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch all departures (uses search endpoint)
   */
  async function fetchAllDepartures(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await tourService.searchDepartures(params)
      departures.value = response.data?.items || response.data || []
      return response.data
    } catch (err) {
      error.value = err.message
      toast.error(err.response?.data?.message || t('tour.errors.loadDepartures'))
      throw err
    } finally {
      loading.value = false
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

  // =====================
  // ACTIONS - Extras
  // =====================
  async function fetchExtras(params = {}) {
    loading.value = true
    try {
      const response = await tourService.getExtras(params)
      extras.value = response.data?.items || response.data || []
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.loadExtras'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchExtra(id) {
    loading.value = true
    try {
      const response = await tourService.getExtra(id)
      currentExtra.value = response.data
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.loadExtra'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createExtra(payload) {
    loading.value = true
    try {
      const response = await tourService.createExtra(payload)
      extras.value.unshift(response.data)
      toast.success(t('tour.toasts.extraCreated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.createExtra'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateExtra(id, payload) {
    loading.value = true
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
      loading.value = false
    }
  }

  async function deleteExtra(id) {
    loading.value = true
    try {
      await tourService.deleteExtra(id)
      extras.value = extras.value.filter(e => e._id !== id)
      toast.success(t('tour.toasts.extraDeleted'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.deleteExtra'))
      throw err
    } finally {
      loading.value = false
    }
  }

  // =====================
  // ACTIONS - Bookings
  // =====================
  async function fetchBookings(params = {}) {
    loading.value = true
    try {
      const response = await tourService.getBookings(params)
      bookings.value = response.data?.items || response.data || []
      if (response.data?.pagination) {
        pagination.value = response.data.pagination
      }
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.loadBookings'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchBooking(id) {
    loading.value = true
    try {
      const response = await tourService.getBooking(id)
      currentBooking.value = response.data
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.loadBooking'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchUpcomingBookings(params = {}) {
    try {
      const response = await tourService.getUpcomingBookings(params)
      upcomingBookings.value = response.data || []
      return response.data
    } catch (err) {
      console.error('Upcoming bookings fetch error:', err)
    }
  }

  async function calculatePrice(payload) {
    try {
      const response = await tourService.calculatePrice(payload)
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.calculatePrice'))
      throw err
    }
  }

  async function createBooking(payload) {
    loading.value = true
    try {
      const response = await tourService.createBooking(payload)
      bookings.value.unshift(response.data)
      toast.success(t('tour.toasts.bookingCreated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.createBooking'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateBooking(id, payload) {
    loading.value = true
    try {
      const response = await tourService.updateBooking(id, payload)
      const index = bookings.value.findIndex(b => b._id === id)
      if (index !== -1) {
        bookings.value[index] = response.data
      }
      if (currentBooking.value?._id === id) {
        currentBooking.value = response.data
      }
      toast.success(t('tour.toasts.bookingUpdated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.updateBooking'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateBookingStatus(id, status) {
    loading.value = true
    try {
      const response = await tourService.updateBookingStatus(id, status)
      const index = bookings.value.findIndex(b => b._id === id)
      if (index !== -1) {
        bookings.value[index] = response.data
      }
      if (currentBooking.value?._id === id) {
        currentBooking.value = response.data
      }
      toast.success(t('tour.toasts.bookingStatusUpdated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.updateBookingStatus'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelBooking(id, payload = {}) {
    loading.value = true
    try {
      const response = await tourService.cancelBooking(id, payload)
      const index = bookings.value.findIndex(b => b._id === id)
      if (index !== -1) {
        bookings.value[index] = response.data
      }
      if (currentBooking.value?._id === id) {
        currentBooking.value = response.data
      }
      toast.success(t('tour.toasts.bookingCancelled'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.cancelBooking'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addPayment(bookingId, payload) {
    loading.value = true
    try {
      const response = await tourService.addBookingPayment(bookingId, payload)
      if (currentBooking.value?._id === bookingId) {
        currentBooking.value = response.data
      }
      toast.success(t('tour.toasts.paymentAdded'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.addPayment'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateVisaStatus(bookingId, passengerIndex, payload) {
    loading.value = true
    try {
      const response = await tourService.updateVisaStatus(bookingId, passengerIndex, payload)
      if (currentBooking.value?._id === bookingId) {
        currentBooking.value = response.data
      }
      toast.success(t('tour.toasts.visaUpdated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.updateVisa'))
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addNote(bookingId, payload) {
    loading.value = true
    try {
      const response = await tourService.addBookingNote(bookingId, payload)
      if (currentBooking.value?._id === bookingId) {
        currentBooking.value = response.data
      }
      toast.success(t('tour.toasts.noteAdded'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.addNote'))
      throw err
    } finally {
      loading.value = false
    }
  }

  // =====================
  // UTILITY
  // =====================
  function clearCurrentTour() {
    currentTour.value = null
  }

  function clearCurrentDeparture() {
    currentDeparture.value = null
  }

  function clearCurrentExtra() {
    currentExtra.value = null
  }

  function clearCurrentBooking() {
    currentBooking.value = null
  }

  function clearAll() {
    tours.value = []
    departures.value = []
    extras.value = []
    bookings.value = []
    currentTour.value = null
    currentDeparture.value = null
    currentExtra.value = null
    currentBooking.value = null
  }

  return {
    // State - Tours
    tours,
    currentTour,
    tourStats,
    // State - Departures
    departures,
    currentDeparture,
    upcomingDepartures,
    // State - Extras
    extras,
    currentExtra,
    // State - Bookings
    bookings,
    currentBooking,
    upcomingBookings,
    // State - UI
    loading,
    error,
    pagination,
    // Getters
    activeTours,
    featuredTours,
    tourCount,
    activeExtras,
    extrasByCategory,
    pendingBookings,
    confirmedBookings,
    // Actions - Tours
    fetchTours,
    fetchTour,
    fetchTourStats,
    createTour,
    updateTour,
    deleteTour,
    duplicateTour,
    // Actions - Departures
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
    // Actions - Extras
    fetchExtras,
    fetchExtra,
    createExtra,
    updateExtra,
    deleteExtra,
    // Actions - Bookings
    fetchBookings,
    fetchBooking,
    fetchUpcomingBookings,
    calculatePrice,
    createBooking,
    updateBooking,
    updateBookingStatus,
    cancelBooking,
    addPayment,
    updateVisaStatus,
    addNote,
    // Utility
    clearCurrentTour,
    clearCurrentDeparture,
    clearCurrentExtra,
    clearCurrentBooking,
    clearAll
  }
})
