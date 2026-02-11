/**
 * Tour Store
 * Modular Pinia store composed from domain-specific composables.
 *
 * Sub-composables:
 *   - useTourCore       -> Tour CRUD, stats
 *   - useTourDepartures -> Departure management
 *   - useTourExtras     -> Extra services management
 *   - useTourBookings   -> Booking management
 *
 * Fully backward-compatible: all properties previously exposed
 * by the monolithic store are still available at the top level.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

import { useTourCore } from './useTourCore'
import { useTourDepartures } from './useTourDepartures'
import { useTourExtras } from './useTourExtras'
import { useTourBookings } from './useTourBookings'

export const useTourStore = defineStore('tour', () => {
  // =====================
  // SHARED STATE
  // =====================
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const sharedState = { loading, error, pagination }

  // =====================
  // COMPOSE SUB-MODULES
  // =====================
  const core = useTourCore(sharedState)
  const departuresModule = useTourDepartures(sharedState)
  const extrasModule = useTourExtras(sharedState)
  const bookingsModule = useTourBookings(sharedState)

  // =====================
  // UTILITY
  // =====================
  function clearAll() {
    core.tours.value = []
    core.currentTour.value = null
    departuresModule.departures.value = []
    departuresModule.currentDeparture.value = null
    extrasModule.extras.value = []
    extrasModule.currentExtra.value = null
    bookingsModule.bookings.value = []
    bookingsModule.currentBooking.value = null
  }

  // =====================
  // EXPOSE (backward-compatible flat API)
  // =====================
  return {
    // Shared state
    loading,
    error,
    pagination,

    // --- Tour Core ---
    tours: core.tours,
    currentTour: core.currentTour,
    tourStats: core.tourStats,
    activeTours: core.activeTours,
    featuredTours: core.featuredTours,
    tourCount: core.tourCount,
    fetchTours: core.fetchTours,
    fetchTour: core.fetchTour,
    fetchTourStats: core.fetchTourStats,
    createTour: core.createTour,
    updateTour: core.updateTour,
    deleteTour: core.deleteTour,
    duplicateTour: core.duplicateTour,
    clearCurrentTour: core.clearCurrentTour,

    // --- Departures ---
    departures: departuresModule.departures,
    currentDeparture: departuresModule.currentDeparture,
    upcomingDepartures: departuresModule.upcomingDepartures,
    fetchDepartures: departuresModule.fetchDepartures,
    fetchDeparture: departuresModule.fetchDeparture,
    createDeparture: departuresModule.createDeparture,
    bulkCreateDepartures: departuresModule.bulkCreateDepartures,
    updateDeparture: departuresModule.updateDeparture,
    deleteDeparture: departuresModule.deleteDeparture,
    searchDepartures: departuresModule.searchDepartures,
    fetchAllDepartures: departuresModule.fetchAllDepartures,
    checkAvailability: departuresModule.checkAvailability,
    fetchUpcomingDepartures: departuresModule.fetchUpcomingDepartures,
    bulkUpdateDeparturePricing: departuresModule.bulkUpdateDeparturePricing,
    clearCurrentDeparture: departuresModule.clearCurrentDeparture,

    // --- Extras ---
    extras: extrasModule.extras,
    currentExtra: extrasModule.currentExtra,
    activeExtras: extrasModule.activeExtras,
    extrasByCategory: extrasModule.extrasByCategory,
    fetchExtras: extrasModule.fetchExtras,
    fetchExtra: extrasModule.fetchExtra,
    createExtra: extrasModule.createExtra,
    updateExtra: extrasModule.updateExtra,
    deleteExtra: extrasModule.deleteExtra,
    clearCurrentExtra: extrasModule.clearCurrentExtra,

    // --- Bookings ---
    bookings: bookingsModule.bookings,
    currentBooking: bookingsModule.currentBooking,
    upcomingBookings: bookingsModule.upcomingBookings,
    pendingBookings: bookingsModule.pendingBookings,
    confirmedBookings: bookingsModule.confirmedBookings,
    fetchBookings: bookingsModule.fetchBookings,
    fetchBooking: bookingsModule.fetchBooking,
    fetchUpcomingBookings: bookingsModule.fetchUpcomingBookings,
    calculatePrice: bookingsModule.calculatePrice,
    createBooking: bookingsModule.createBooking,
    updateBooking: bookingsModule.updateBooking,
    updateBookingStatus: bookingsModule.updateBookingStatus,
    cancelBooking: bookingsModule.cancelBooking,
    addPayment: bookingsModule.addPayment,
    updateVisaStatus: bookingsModule.updateVisaStatus,
    addNote: bookingsModule.addNote,
    clearCurrentBooking: bookingsModule.clearCurrentBooking,

    // --- Utility ---
    clearAll
  }
})
