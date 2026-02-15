/**
 * Booking Store
 * 2-phase booking flow: Search+Rooms → Guests+Payment
 * Supports draft bookings with localStorage (Phase 1) and DB (Phase 2) persistence
 *
 * Actions have been modularized into separate files:
 * - booking/cartActions.js - Cart management
 * - booking/searchActions.js - Hotel search and selection
 * - booking/draftActions.js - Draft and localStorage persistence
 * - booking/paximumActions.js - Paximum OTA integration
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import bookingService from '@/services/bookingService'
import * as storageService from '@/services/bookingStorageService'
import { storeLogger } from '@/utils/logger'

// Import modular actions
import {
  createCartActions,
  createSearchActions,
  createDraftActions,
  createPaximumActions
} from './booking/index.js'

// Helper: Format date as YYYY-MM-DD (local timezone)
const formatDateLocal = date => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper: Get default date range (today + 2 nights)
const getDefaultDateRange = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkOut = new Date(today)
  checkOut.setDate(checkOut.getDate() + 2)
  return {
    start: formatDateLocal(today),
    end: formatDateLocal(checkOut)
  }
}

export const useBookingStore = defineStore('booking', () => {
  // ==================== STATE ====================

  // Current phase (1: Search+Rooms, 2: Guests+Payment)
  const currentPhase = ref(1)

  // Active provider: 'local' (partner hotels) or 'paximum' (external OTA)
  const activeProvider = ref('local')

  // Search parameters
  const search = ref({
    tourismRegionIds: [], // Selected tourism regions
    hotelIds: [], // Directly selected hotels
    dateRange: getDefaultDateRange(), // Default: today + 2 nights
    adults: 2,
    children: [], // Array of child ages
    countryCode: 'TR',
    channel: 'B2B' // B2B or B2C
  })

  // Search results
  const searchResults = ref({
    hotels: [], // Hotel list with cheapest prices
    unavailableHotels: [], // Hotels without availability (from debug)
    selectedHotelId: null, // Currently selected hotel for room view
    selectedHotelRooms: [], // Rooms of selected hotel
    selectedHotel: null, // Full selected hotel object
    selectedMarket: null // Market used for pricing { _id, code, currency }
  })

  // Cart (selected rooms)
  const cart = ref([])

  // Guest information
  const guests = ref({
    leadGuest: {
      title: 'mr',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationality: 'TR',
      tcNumber: '',
      passportNumber: '',
      birthDate: '',
      type: 'adult',
      isLead: true
    },
    roomGuests: [] // Array of room guests
  })

  // Payment
  const payment = ref({
    method: null, // 'cash', 'bank_transfer', 'credit_card'
    acceptedMethods: [] // From hotel settings
  })

  // Additional info
  const specialRequests = ref('')
  const termsAccepted = ref(false)

  // Booking result
  const bookingResult = ref(null)

  // Invoice details
  const invoiceDetails = ref({
    type: 'individual', // 'individual' or 'corporate'
    individual: {
      firstName: '',
      lastName: '',
      tcNumber: '',
      address: {
        street: '',
        district: '',
        city: '',
        postalCode: '',
        country: 'TR'
      }
    },
    corporate: {
      companyName: '',
      taxNumber: '',
      taxOffice: '',
      address: {
        street: '',
        district: '',
        city: '',
        postalCode: '',
        country: 'TR'
      }
    }
  })

  // Draft booking state
  const draftBookingNumber = ref(null)
  const draftData = ref(null)
  const lastSavedAt = ref(null)
  const allotmentError = ref(null)

  // Paximum integration status
  const paximumEnabled = ref(false)
  const paximumDefaultMarkup = ref(10)

  // Paximum search parameters
  const paximumSearch = ref({
    location: null, // { id, name, type } from autocomplete
    checkIn: null, // YYYY-MM-DD
    nights: 7,
    rooms: [{ adults: 2, childAges: [] }],
    nationality: 'TR',
    currency: 'TRY',
    culture: 'tr-TR'
  })

  // Paximum search results
  const paximumResults = ref({
    hotels: [],
    searchId: null,
    selectedHotel: null,
    selectedHotelOffers: [],
    selectedOffer: null,
    searchPerformed: false,
    noResults: false
  })

  // Paximum transaction state
  const paximumTransaction = ref({
    transactionId: null,
    reservationNumber: null
  })

  // UI State
  const loading = ref({
    hotels: false,
    rooms: false,
    booking: false,
    draft: false,
    paximum: false,
    paximumOffers: false
  })
  const error = ref(null)

  // ==================== GETTERS ====================

  const nights = computed(() => {
    if (activeProvider.value === 'paximum' && paximumSearch.value.nights) {
      return paximumSearch.value.nights
    }
    if (!search.value.dateRange.start || !search.value.dateRange.end) {
      return 0
    }
    const start = new Date(search.value.dateRange.start)
    const end = new Date(search.value.dateRange.end)
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  })

  const totalRooms = computed(() => cart.value.length)
  const totalAdults = computed(() => cart.value.reduce((sum, item) => sum + item.adults, 0))
  const totalChildren = computed(() =>
    cart.value.reduce((sum, item) => sum + (item.children?.length || 0), 0)
  )
  const totalGuests = computed(() => totalAdults.value + totalChildren.value)

  const currency = computed(() => {
    if (cart.value.length > 0) {
      return cart.value[0].pricing?.currency
    }
    return searchResults.value.hotels[0]?.currency || 'TRY'
  })

  const subtotal = computed(() =>
    cart.value.reduce((sum, item) => sum + (item.pricing?.originalTotal || 0), 0)
  )
  const totalDiscount = computed(() =>
    cart.value.reduce((sum, item) => sum + (item.pricing?.totalDiscount || 0), 0)
  )
  const grandTotal = computed(() =>
    cart.value.reduce((sum, item) => sum + (item.pricing?.finalTotal || 0), 0)
  )
  const avgPerNight = computed(() => (nights.value === 0 ? 0 : grandTotal.value / nights.value))

  const appliedCampaigns = computed(() => {
    const campaigns = []
    const seen = new Set()
    cart.value.forEach(item => {
      if (item.campaigns) {
        item.campaigns.forEach(c => {
          if (!seen.has(c.code)) {
            seen.add(c.code)
            campaigns.push(c)
          }
        })
      }
    })
    return campaigns
  })

  const selectedHotel = computed(() => {
    if (!searchResults.value.selectedHotelId) return null
    return searchResults.value.hotels.find(h => h._id === searchResults.value.selectedHotelId)
  })

  const canProceedToCheckout = computed(() => cart.value.length > 0)

  const canCreateBooking = computed(() => {
    const lead = guests.value.leadGuest
    return (
      lead.firstName?.trim() &&
      lead.lastName?.trim() &&
      lead.email?.trim() &&
      lead.phone?.trim() &&
      payment.value.method &&
      termsAccepted.value
    )
  })

  const isSearchValid = computed(() => {
    return (
      search.value.dateRange.start &&
      search.value.dateRange.end &&
      search.value.adults >= 1 &&
      nights.value >= 1 &&
      nights.value <= 30
    )
  })

  // ==================== STATE REFS FOR ACTIONS ====================

  const stateRefs = {
    currentPhase,
    activeProvider,
    search,
    searchResults,
    cart,
    guests,
    payment,
    specialRequests,
    termsAccepted,
    bookingResult,
    invoiceDetails,
    draftBookingNumber,
    draftData,
    lastSavedAt,
    allotmentError,
    paximumEnabled,
    paximumDefaultMarkup,
    paximumSearch,
    paximumResults,
    paximumTransaction,
    loading,
    error
  }

  const getterRefs = {
    isSearchValid,
    canProceedToCheckout,
    canCreateBooking
  }

  // ==================== INITIALIZE MODULAR ACTIONS ====================

  // Cart actions (need to be created first as others depend on initializeRoomGuests)
  const cartActions = createCartActions(stateRefs)
  const { initializeRoomGuests } = cartActions

  // Search actions
  const searchActions = createSearchActions(stateRefs, getterRefs)

  // Draft actions (needs initializeRoomGuests helper)
  const draftActions = createDraftActions(stateRefs, getterRefs, { initializeRoomGuests })

  // Paximum actions (needs initializeRoomGuests helper)
  const paximumActions = createPaximumActions(stateRefs, { initializeRoomGuests })

  // ==================== PHASE NAVIGATION ====================

  function goToCheckout() {
    if (canProceedToCheckout.value) {
      currentPhase.value = 2
    }
  }

  function goBackToSearch() {
    currentPhase.value = 1
  }

  // ==================== BOOKING CREATION ====================

  async function createBooking() {
    // Guard against multiple submissions
    if (loading.value.booking) {
      storeLogger.warn('Booking creation already in progress')
      return null
    }

    if (!canCreateBooking.value) {
      error.value = 'Lütfen tüm bilgileri doldurun'
      return null
    }

    loading.value.booking = true
    error.value = null

    try {
      const firstItem = cart.value[0]

      const roomsData = cart.value.map((item, index) => ({
        roomTypeId: item.roomType._id,
        mealPlanId: item.mealPlan._id,
        adults: item.adults,
        children: item.children,
        guests: guests.value.roomGuests[index] || [],
        specialRequests: '',
        rateType: item.rateType || 'refundable',
        isNonRefundable: item.isNonRefundable || false,
        nonRefundableDiscount: item.nonRefundableDiscount || 0,
        customDiscount: item.customDiscount || null,
        pricing: item.pricing
      }))

      const bookingData = {
        hotelId: firstItem.hotelId,
        checkIn: search.value.dateRange.start,
        checkOut: search.value.dateRange.end,
        rooms: roomsData,
        salesChannel: search.value.channel?.toLowerCase() || 'b2c',
        contact: {
          email: guests.value.leadGuest.email,
          phone: guests.value.leadGuest.phone,
          countryCode: search.value.countryCode,
          firstName: guests.value.leadGuest.firstName,
          lastName: guests.value.leadGuest.lastName
        },
        billing: {
          paymentMethod: payment.value.method
        },
        specialRequests: specialRequests.value
      }

      const response = await bookingService.createBooking(bookingData)

      if (response.success) {
        bookingResult.value = response.data
        return response.data
      } else {
        error.value = response.message
        return null
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return null
    } finally {
      loading.value.booking = false
    }
  }

  // ==================== CREATE BOOKING WITH PAYMENT LINK ====================

  async function createBookingWithPaymentLink({ sendEmail = true, sendSms = false } = {}) {
    // Guard against multiple submissions
    if (loading.value.booking) {
      storeLogger.warn('Booking creation already in progress')
      return null
    }

    loading.value.booking = true
    error.value = null

    try {
      const firstItem = cart.value[0]

      const roomsData = cart.value.map((item, index) => ({
        roomTypeId: item.roomType._id,
        mealPlanId: item.mealPlan._id,
        adults: item.adults,
        children: item.children,
        guests: guests.value.roomGuests[index] || [],
        specialRequests: '',
        rateType: item.rateType || 'refundable',
        isNonRefundable: item.isNonRefundable || false,
        nonRefundableDiscount: item.nonRefundableDiscount || 0,
        customDiscount: item.customDiscount || null,
        pricing: item.pricing
      }))

      const bookingData = {
        hotelId: firstItem.hotelId,
        marketId: firstItem.marketId || searchResults.value.selectedMarket?._id,
        checkIn: search.value.dateRange.start,
        checkOut: search.value.dateRange.end,
        rooms: roomsData,
        salesChannel: search.value.channel?.toLowerCase() || 'b2c',
        contact: {
          email: guests.value.leadGuest.email,
          phone: guests.value.leadGuest.phone,
          countryCode: search.value.countryCode,
          firstName: guests.value.leadGuest.firstName,
          lastName: guests.value.leadGuest.lastName
        },
        specialRequests: specialRequests.value,
        sendEmail,
        sendSms
      }

      const response = await bookingService.createBookingWithPaymentLink(bookingData)

      if (response.success) {
        bookingResult.value = response.data.booking
        return response.data
      } else {
        error.value = response.message
        return null
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value.booking = false
    }
  }

  // ==================== PAYMENT METHOD ====================

  function setPaymentMethod(method) {
    payment.value.method = method
  }

  // ==================== RESET ====================

  function resetAll() {
    currentPhase.value = 1

    search.value = {
      tourismRegionIds: [],
      hotelIds: [],
      dateRange: getDefaultDateRange(), // Default: today + 2 nights
      adults: 2,
      children: [],
      countryCode: 'TR',
      channel: 'B2B'
    }

    searchResults.value = {
      hotels: [],
      selectedHotelId: null,
      selectedHotelRooms: [],
      selectedHotel: null,
      selectedMarket: null
    }

    cart.value = []

    guests.value = {
      leadGuest: {
        title: 'mr',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        nationality: 'TR',
        tcNumber: '',
        passportNumber: '',
        birthDate: '',
        type: 'adult',
        isLead: true
      },
      roomGuests: []
    }

    payment.value = { method: null, acceptedMethods: [] }
    specialRequests.value = ''
    termsAccepted.value = false
    bookingResult.value = null
    loading.value = { hotels: false, rooms: false, booking: false, draft: false }
    error.value = null

    draftBookingNumber.value = null
    draftData.value = null
    lastSavedAt.value = null
    allotmentError.value = null

    invoiceDetails.value = {
      type: 'individual',
      individual: {
        firstName: '',
        lastName: '',
        tcNumber: '',
        address: { street: '', district: '', city: '', postalCode: '', country: 'TR' }
      },
      corporate: {
        companyName: '',
        taxNumber: '',
        taxOffice: '',
        address: { street: '', district: '', city: '', postalCode: '', country: 'TR' }
      }
    }

    storageService.clearPhase1Data()
  }

  // ==================== RETURN ====================

  return {
    // State
    currentPhase,
    activeProvider,
    search,
    searchResults,
    cart,
    guests,
    payment,
    specialRequests,
    termsAccepted,
    bookingResult,
    loading,
    error,
    invoiceDetails,
    draftBookingNumber,
    draftData,
    lastSavedAt,
    allotmentError,

    // Paximum State
    paximumEnabled,
    paximumDefaultMarkup,
    paximumSearch,
    paximumResults,
    paximumTransaction,

    // Getters
    nights,
    totalRooms,
    totalAdults,
    totalChildren,
    totalGuests,
    currency,
    subtotal,
    totalDiscount,
    grandTotal,
    avgPerNight,
    appliedCampaigns,
    selectedHotel,
    canProceedToCheckout,
    canCreateBooking,
    isSearchValid,

    // Phase navigation
    goToCheckout,
    goBackToSearch,

    // Guest actions
    updateLeadGuest: value => {
      guests.value.leadGuest = { ...guests.value.leadGuest, ...value }
    },
    updateRoomGuests: value => {
      guests.value.roomGuests = value
    },

    // Booking
    createBooking,
    createBookingWithPaymentLink,
    setPaymentMethod,
    resetAll,

    // Cart actions
    ...cartActions,

    // Search actions
    ...searchActions,

    // Draft actions
    ...draftActions,

    // Paximum actions
    ...paximumActions
  }
})
