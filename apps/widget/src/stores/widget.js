/**
 * Widget Store
 * Central state management for the booking widget
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { widgetApi } from '../services/api'

export const useWidgetStore = defineStore('widget', () => {
  // Configuration
  const config = ref({
    hotelCode: '',
    partnerId: '',
    mode: 'floating',
    theme: 'light',
    primaryColor: '#7c3aed',
    language: 'en',
    containerId: null,
    apiUrl: ''
  })

  // Hotel and widget config from API
  const hotelInfo = ref(null)
  const widgetConfig = ref(null)

  // UI State
  const isOpen = ref(false)
  const isLoading = ref(false)
  const error = ref(null)
  const currentStep = ref('search') // search, results, booking, payment, confirmation

  // Search State
  const searchParams = ref({
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: [],
    countryCode: null,
    currency: null
  })

  // Search Results
  const searchResults = ref(null)

  // Selected Room
  const selectedRoom = ref(null)
  const selectedOption = ref(null)

  // Booking State
  const bookingData = ref({
    rooms: [],
    contact: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      countryCode: ''
    },
    billing: null,
    specialRequests: ''
  })

  // Created Booking
  const booking = ref(null)

  // Payment State
  const paymentMethod = ref('credit_card') // credit_card, pay_at_hotel, bank_transfer
  const paymentResult = ref(null)

  // Bank Transfer State
  const bankAccounts = ref([])
  const bankTransferDescription = ref({})
  const bankTransferEnabled = ref(false)

  // Market Detection
  const detectedMarket = ref(null)

  // State Persistence
  const STATE_TTL = 30 * 60 * 1000 // 30 minutes
  let saveTimer = null

  function getStorageKey() {
    return `maxirez_widget_${config.value.hotelCode}`
  }

  function saveState() {
    if (!config.value.hotelCode) return
    try {
      const state = {
        currentStep: currentStep.value,
        searchParams: searchParams.value,
        searchResults: searchResults.value,
        selectedRoom: selectedRoom.value,
        selectedOption: selectedOption.value,
        bookingData: bookingData.value,
        paymentMethod: paymentMethod.value,
        booking: booking.value,
        savedAt: Date.now()
      }
      sessionStorage.setItem(getStorageKey(), JSON.stringify(state))
    } catch (e) {
      // sessionStorage full or unavailable
    }
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveState, 300)
  }

  function restoreState() {
    try {
      const raw = sessionStorage.getItem(getStorageKey())
      if (!raw) return false

      const saved = JSON.parse(raw)

      // Expire after TTL
      if (Date.now() - saved.savedAt > STATE_TTL) {
        sessionStorage.removeItem(getStorageKey())
        return false
      }

      // Restore state
      if (saved.currentStep) currentStep.value = saved.currentStep
      if (saved.searchParams) Object.assign(searchParams.value, saved.searchParams)
      if (saved.searchResults) searchResults.value = saved.searchResults
      if (saved.selectedRoom) selectedRoom.value = saved.selectedRoom
      if (saved.selectedOption) selectedOption.value = saved.selectedOption
      if (saved.bookingData) Object.assign(bookingData.value, saved.bookingData)
      if (saved.paymentMethod) paymentMethod.value = saved.paymentMethod
      if (saved.booking) booking.value = saved.booking

      return true
    } catch (e) {
      return false
    }
  }

  function clearSavedState() {
    try {
      sessionStorage.removeItem(getStorageKey())
    } catch (e) {
      // ignore
    }
  }

  // Resolve relative asset URLs (uploads, images) to absolute API URLs
  function resolveAssetUrl(path) {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const apiUrl = config.value.apiUrl || 'https://api.maxirez.com/api'
    try {
      const url = new URL(apiUrl)
      return `${url.protocol}//${url.host}${path}`
    } catch {
      return path
    }
  }

  // Computed
  // Resolved hotel ID (globally unique) - prefer over slug for API calls
  const resolvedHotelCode = computed(() => hotelInfo.value?.id || config.value.hotelCode)

  const effectiveTheme = computed(() => {
    if (config.value.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return config.value.theme
  })

  const nights = computed(() => {
    if (!searchParams.value.checkIn || !searchParams.value.checkOut) return 0
    const checkIn = new Date(searchParams.value.checkIn)
    const checkOut = new Date(searchParams.value.checkOut)
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
  })

  // Actions
  async function initialize(cfg) {
    config.value = { ...config.value, ...cfg }

    // Restore saved state before API calls
    const restored = restoreState()

    try {
      isLoading.value = true
      error.value = null

      // Load hotel and widget config
      const [hotelData, marketData] = await Promise.all([
        widgetApi.getWidgetConfig(cfg.hotelCode, cfg.partnerId, cfg.apiUrl),
        widgetApi.detectMarket(cfg.apiUrl)
      ])

      hotelInfo.value = hotelData.hotel
      widgetConfig.value = hotelData.config

      // Apply market detection (only if not restored)
      if (marketData) {
        detectedMarket.value = marketData
        if (!restored) {
          searchParams.value.countryCode = marketData.countryCode
          searchParams.value.currency = marketData.currency
        }
      }

      // Auto-open in inline/fullpage mode
      if (cfg.mode !== 'floating') {
        isOpen.value = true
      }

      // Start watching for state changes after initialization
      watch(
        [
          currentStep,
          searchParams,
          selectedRoom,
          selectedOption,
          bookingData,
          paymentMethod,
          booking
        ],
        () => debouncedSave(),
        { deep: true }
      )
    } catch (err) {
      error.value = err.message
      console.error('[Widget] Initialization failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  function openWidget() {
    isOpen.value = true
  }

  function closeWidget() {
    isOpen.value = false
    // Reset to search if not in confirmation
    if (currentStep.value !== 'confirmation') {
      // Keep search params but reset results
      currentStep.value = 'search'
      searchResults.value = null
      selectedRoom.value = null
      selectedOption.value = null
    } else {
      // Confirmation done, clear saved state
      clearSavedState()
    }
  }

  function setDates(checkIn, checkOut) {
    searchParams.value.checkIn = checkIn
    searchParams.value.checkOut = checkOut
  }

  function setGuests(adults, children = []) {
    searchParams.value.adults = adults
    searchParams.value.children = children
  }

  async function search() {
    if (!searchParams.value.checkIn || !searchParams.value.checkOut) {
      error.value = 'Lütfen tarih seçiniz'
      return
    }

    try {
      isLoading.value = true
      error.value = null

      const results = await widgetApi.searchAvailability(
        resolvedHotelCode.value,
        {
          checkIn: searchParams.value.checkIn,
          checkOut: searchParams.value.checkOut,
          adults: searchParams.value.adults,
          children: searchParams.value.children,
          countryCode: searchParams.value.countryCode,
          currency: searchParams.value.currency
        },
        config.value.apiUrl
      )

      searchResults.value = results
      currentStep.value = 'results'
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  function selectRoom(roomResult, option) {
    selectedRoom.value = roomResult
    selectedOption.value = option

    // Initialize booking data with room selection
    bookingData.value.rooms = [
      {
        roomTypeCode: roomResult.roomType.code,
        mealPlanCode: option.mealPlan.code,
        adults: searchParams.value.adults,
        children: searchParams.value.children,
        guests: []
      }
    ]

    currentStep.value = 'booking'
  }

  async function createBooking() {
    try {
      isLoading.value = true
      error.value = null

      const bookingPayload = {
        hotelCode: resolvedHotelCode.value,
        checkIn: searchParams.value.checkIn,
        checkOut: searchParams.value.checkOut,
        rooms: bookingData.value.rooms,
        contact: bookingData.value.contact,
        billing: bookingData.value.billing,
        specialRequests: bookingData.value.specialRequests,
        countryCode: searchParams.value.countryCode,
        paymentMethod: paymentMethod.value
      }

      const result = await widgetApi.createBooking(bookingPayload, config.value.apiUrl)
      booking.value = result

      // Go to appropriate step based on payment method
      if (paymentMethod.value === 'credit_card' && widgetConfig.value?.paymentMethods?.creditCard) {
        currentStep.value = 'payment'
      } else if (paymentMethod.value === 'bank_transfer') {
        currentStep.value = 'bank-transfer'
      } else {
        currentStep.value = 'confirmation'
      }
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  async function processPayment(cardData) {
    if (!booking.value?.bookingNumber) {
      error.value = 'Rezervasyon bulunamadı'
      return
    }

    try {
      isLoading.value = true
      error.value = null

      const result = await widgetApi.initiatePayment(
        booking.value.bookingNumber,
        {
          email: bookingData.value.contact.email,
          card: cardData.card,
          posId: cardData.posId,
          installment: cardData.installment
        },
        config.value.apiUrl
      )

      paymentResult.value = result

      // If 3D Secure required, return result (PaymentView handles iframe modal)
      if (result.requires3D && result.formUrl) {
        isLoading.value = false
        return result
      }

      // Payment completed without 3D
      currentStep.value = 'confirmation'
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  async function checkPaymentStatus() {
    if (!booking.value?.bookingNumber) return null

    try {
      const status = await widgetApi.getPaymentStatus(
        booking.value.bookingNumber,
        bookingData.value.contact.email,
        paymentResult.value?.paymentId,
        config.value.apiUrl
      )

      if (status.payment?.status === 'completed') {
        currentStep.value = 'confirmation'
      }

      return status
    } catch (err) {
      console.error('[Widget] Payment status check failed:', err)
      return null
    }
  }

  async function fetchBankAccounts() {
    try {
      const data = await widgetApi.getBankAccounts(config.value.partnerId, config.value.apiUrl)
      bankAccounts.value = data.bankAccounts || []
      bankTransferDescription.value = data.bankTransferDescription || {}
      bankTransferEnabled.value = data.bankTransferEnabled || false
    } catch (err) {
      console.error('[Widget] Failed to fetch bank accounts:', err)
    }
  }

  function goBack() {
    const stepOrder = ['search', 'results', 'booking', 'bank-transfer', 'payment', 'confirmation']
    const currentIndex = stepOrder.indexOf(currentStep.value)
    if (currentIndex > 0) {
      currentStep.value = stepOrder[currentIndex - 1]
    }
  }

  function setLanguage(lang) {
    const supported = [
      'tr',
      'en',
      'ru',
      'el',
      'de',
      'es',
      'it',
      'fr',
      'ro',
      'bg',
      'pt',
      'da',
      'zh',
      'ar',
      'fa',
      'he',
      'sq',
      'uk',
      'pl',
      'az'
    ]
    const normalized = lang?.split('-')[0]?.toLowerCase()
    if (supported.includes(normalized) && config.value.language !== normalized) {
      config.value.language = normalized
    }
  }

  function reset() {
    clearSavedState()
    currentStep.value = 'search'
    searchResults.value = null
    selectedRoom.value = null
    selectedOption.value = null
    booking.value = null
    paymentResult.value = null
    error.value = null
    bookingData.value = {
      rooms: [],
      contact: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        countryCode: ''
      },
      billing: null,
      specialRequests: ''
    }
  }

  return {
    // State
    config,
    hotelInfo,
    widgetConfig,
    isOpen,
    isLoading,
    error,
    currentStep,
    searchParams,
    searchResults,
    selectedRoom,
    selectedOption,
    bookingData,
    booking,
    paymentMethod,
    paymentResult,
    bankAccounts,
    bankTransferDescription,
    bankTransferEnabled,
    detectedMarket,

    // Computed
    effectiveTheme,
    nights,

    // Helpers
    resolveAssetUrl,

    // Actions
    initialize,
    openWidget,
    closeWidget,
    setDates,
    setGuests,
    setLanguage,
    search,
    selectRoom,
    createBooking,
    processPayment,
    checkPaymentStatus,
    fetchBankAccounts,
    goBack,
    reset
  }
})
