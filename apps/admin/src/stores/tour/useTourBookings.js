/**
 * Tour Bookings Composable
 * Booking CRUD, status management, payments, visa, notes
 */
import { ref, computed } from 'vue'
import * as tourService from '@/services/tourService'
import { useToast } from 'vue-toastification'
import i18n from '@/plugins/i18n'

export function useTourBookings(sharedState) {
  const toast = useToast()
  const t = i18n.global.t

  // State
  const bookings = ref([])
  const currentBooking = ref(null)
  const upcomingBookings = ref([])

  // Getters
  const pendingBookings = computed(() => bookings.value.filter(b => b.status === 'pending'))
  const confirmedBookings = computed(() => bookings.value.filter(b => b.status === 'confirmed'))

  // Actions
  async function fetchBookings(params = {}) {
    sharedState.loading.value = true
    try {
      const response = await tourService.getBookings(params)
      bookings.value = response.data?.items || response.data || []
      if (response.data?.pagination) {
        sharedState.pagination.value = response.data.pagination
      }
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.loadBookings'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function fetchBooking(id) {
    sharedState.loading.value = true
    try {
      const response = await tourService.getBooking(id)
      currentBooking.value = response.data
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.loadBooking'))
      throw err
    } finally {
      sharedState.loading.value = false
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
    sharedState.loading.value = true
    try {
      const response = await tourService.createBooking(payload)
      bookings.value.unshift(response.data)
      toast.success(t('tour.toasts.bookingCreated'))
      return response.data
    } catch (err) {
      toast.error(err.response?.data?.message || t('tour.errors.createBooking'))
      throw err
    } finally {
      sharedState.loading.value = false
    }
  }

  async function updateBooking(id, payload) {
    sharedState.loading.value = true
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
      sharedState.loading.value = false
    }
  }

  async function updateBookingStatus(id, status) {
    sharedState.loading.value = true
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
      sharedState.loading.value = false
    }
  }

  async function cancelBooking(id, payload = {}) {
    sharedState.loading.value = true
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
      sharedState.loading.value = false
    }
  }

  async function addPayment(bookingId, payload) {
    sharedState.loading.value = true
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
      sharedState.loading.value = false
    }
  }

  async function updateVisaStatus(bookingId, passengerIndex, payload) {
    sharedState.loading.value = true
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
      sharedState.loading.value = false
    }
  }

  async function addNote(bookingId, payload) {
    sharedState.loading.value = true
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
      sharedState.loading.value = false
    }
  }

  function clearCurrentBooking() {
    currentBooking.value = null
  }

  return {
    // State
    bookings,
    currentBooking,
    upcomingBookings,
    // Getters
    pendingBookings,
    confirmedBookings,
    // Actions
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
    clearCurrentBooking
  }
}
