/**
 * Widget Store
 * Central state management for the booking widget
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { widgetApi } from '../services/api'
import { useWidgetPersistence } from '../composables/useWidgetPersistence'

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
  const paymentMethod = ref('credit_card') // credit_card, pay_at_checkin, bank_transfer
  const paymentResult = ref(null)
  const selectedPaymentType = ref('full') // 'full' | 'prepayment'

  // Payment Terms (from market)
  const paymentTerms = ref(null)
  const bankTransferDiscount = ref(0)
  const bankTransferReleaseDays = ref(3)

  // Bank Transfer State
  const bankAccounts = ref([])
  const bankTransferDescription = ref({})
  const bankTransferEnabled = ref(false)

  // Cancellation Guarantee Package
  const cancellationGuarantee = ref(false) // purchased toggle
  const cancellationGuaranteeConfig = ref(null) // { enabled, rate } from search response

  // Promo Code State
  const promoCode = ref('')
  const promoResult = ref(null) // { valid, campaign, error }
  const promoLoading = ref(false)

  // Market Detection
  const detectedMarket = ref(null)

  // State Persistence (extracted to composable)
  const persistence = useWidgetPersistence(() => config.value.hotelCode)
  const resultsStale = persistence.resultsStale

  function getStateSnapshot() {
    return {
      currentStep: currentStep.value,
      searchParams: searchParams.value,
      searchResults: searchResults.value,
      selectedRoom: selectedRoom.value,
      selectedOption: selectedOption.value,
      bookingData: bookingData.value,
      paymentMethod: paymentMethod.value,
      booking: booking.value,
      promoCode: promoCode.value,
      promoResult: promoResult.value
    }
  }

  function applyRestoredState(saved) {
    if (saved.currentStep) currentStep.value = saved.currentStep
    if (saved.searchParams) Object.assign(searchParams.value, saved.searchParams)
    if (saved.searchResults) searchResults.value = saved.searchResults
    if (saved.selectedRoom) selectedRoom.value = saved.selectedRoom
    if (saved.selectedOption) selectedOption.value = saved.selectedOption
    if (saved.bookingData) Object.assign(bookingData.value, saved.bookingData)
    if (saved.paymentMethod) paymentMethod.value = saved.paymentMethod
    if (saved.booking) booking.value = saved.booking
    if (saved.promoCode) promoCode.value = saved.promoCode
    if (saved.promoResult) promoResult.value = saved.promoResult
  }

  function restoreState() {
    const saved = persistence.restoreState()
    if (!saved) return false
    applyRestoredState(saved)
    return true
  }

  function validateRestoredState() {
    const step = currentStep.value

    // Payment/bank-transfer without a booking → go to booking
    if ((step === 'payment' || step === 'bank-transfer') && !booking.value?.bookingNumber) {
      currentStep.value = 'booking'
    }

    // Booking without selectedRoom → go to results or search
    if (step === 'booking' && !selectedRoom.value) {
      currentStep.value = searchResults.value ? 'results' : 'search'
    }

    // Results without searchResults → go to search
    if (step === 'results' && !searchResults.value) {
      currentStep.value = 'search'
    }
  }

  // Computed: active session indicator for trigger badge
  const hasActiveSession = computed(() => {
    const step = currentStep.value
    return step !== 'search' && step !== 'confirmation'
  })

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

  // Cancellation guarantee amount
  const guaranteeAmount = computed(() => {
    if (!cancellationGuarantee.value || !cancellationGuaranteeConfig.value?.enabled) return 0
    const rate = cancellationGuaranteeConfig.value.rate || 0
    const total = selectedOption.value?.pricing?.finalTotal || 0
    return Math.round((total * rate) / 100)
  })

  // Amount to charge based on prepayment selection
  const paymentAmountToCharge = computed(() => {
    const grandTotal = booking.value?.pricing?.grandTotal || 0
    if (
      selectedPaymentType.value === 'prepayment' &&
      paymentTerms.value?.prepaymentRequired &&
      paymentMethod.value === 'credit_card'
    ) {
      const pct = paymentTerms.value.prepaymentPercentage || 30
      return Math.round((grandTotal * pct) / 100)
    }
    return grandTotal
  })

  // Actions
  async function initialize(cfg) {
    config.value = { ...config.value, ...cfg }

    // Migrate from old sessionStorage to localStorage
    persistence.migrateFromSessionStorage()

    // Restore saved state before API calls
    const restored = restoreState()
    if (restored) {
      validateRestoredState()
    }

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

      // Partner ID'yi API'den al (embed kodda yoksa)
      if (hotelData.hotel.partnerId && !config.value.partnerId) {
        config.value.partnerId = hotelData.hotel.partnerId
      }

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
          booking,
          promoCode,
          promoResult
        ],
        () => persistence.debouncedSave(getStateSnapshot),
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
    // Only clear state when closing from confirmation (booking flow complete)
    if (currentStep.value === 'confirmation') {
      persistence.clearSavedState()
    }
    // Otherwise keep current step and data so user can resume
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

    // Clear children if not allowed by market
    if (widgetConfig.value?.childrenAllowed === false) {
      searchParams.value.children = []
    }

    try {
      isLoading.value = true
      error.value = null

      const searchBody = {
        checkIn: searchParams.value.checkIn,
        checkOut: searchParams.value.checkOut,
        adults: searchParams.value.adults,
        children: searchParams.value.children,
        countryCode: searchParams.value.countryCode,
        currency: searchParams.value.currency
      }

      // Include promo code if validated
      if (promoCode.value && promoResult.value?.valid) {
        searchBody.campaignCode = promoCode.value
      }

      const results = await widgetApi.searchAvailability(
        resolvedHotelCode.value,
        searchBody,
        config.value.apiUrl
      )

      searchResults.value = results
      resultsStale.value = false

      // Pazar ödeme koşullarını kaydet
      if (results.search?.paymentTerms) {
        paymentTerms.value = results.search.paymentTerms
      }
      // Cancellation guarantee config
      if (results.search?.cancellationGuarantee) {
        cancellationGuaranteeConfig.value = results.search.cancellationGuarantee
      }
      if (results.search?.bankTransferDiscount) {
        bankTransferDiscount.value = results.search.bankTransferDiscount
      }
      if (results.search?.bankTransferReleaseDays != null) {
        bankTransferReleaseDays.value = results.search.bankTransferReleaseDays
      }

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

  function navigateAfterBooking() {
    if (paymentMethod.value === 'credit_card' && widgetConfig.value?.paymentMethods?.creditCard) {
      currentStep.value = 'payment'
    } else if (paymentMethod.value === 'bank_transfer') {
      currentStep.value = 'bank-transfer'
    } else {
      currentStep.value = 'confirmation'
    }
  }

  async function createBooking() {
    // If booking already exists (user went back and re-submitted), just navigate
    if (booking.value?.bookingNumber) {
      navigateAfterBooking()
      return
    }

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
        paymentMethod: paymentMethod.value,
        guestLanguage: config.value.language || 'en',
        ...(promoCode.value && promoResult.value?.valid && { campaignCode: promoCode.value }),
        ...(cancellationGuarantee.value && { cancellationGuarantee: { purchased: true } })
      }

      const result = await widgetApi.createBooking(bookingPayload, config.value.apiUrl)
      booking.value = result

      navigateAfterBooking()
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
          installment: cardData.installment,
          amount: paymentAmountToCharge.value
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

  async function applyPromoCode(code) {
    if (!code?.trim()) return

    try {
      promoLoading.value = true
      promoResult.value = null

      const result = await widgetApi.validatePromoCode(
        resolvedHotelCode.value,
        {
          code: code.trim(),
          checkIn: searchParams.value.checkIn,
          checkOut: searchParams.value.checkOut,
          countryCode: searchParams.value.countryCode,
          currency: searchParams.value.currency
        },
        config.value.apiUrl
      )

      promoCode.value = code.trim()
      promoResult.value = result

      // If valid, re-search to get updated prices
      if (result.valid) {
        await search()
      }
    } catch (err) {
      promoResult.value = { valid: false, error: 'NETWORK_ERROR' }
    } finally {
      promoLoading.value = false
    }
  }

  function clearPromoCode() {
    const hadValidPromo = promoCode.value && promoResult.value?.valid
    promoCode.value = ''
    promoResult.value = null

    // Re-search to remove promo discount from prices
    if (hadValidPromo && searchResults.value) {
      search()
    }
  }

  function goBack() {
    // Payment and bank-transfer should always go back to booking
    if (currentStep.value === 'payment' || currentStep.value === 'bank-transfer') {
      currentStep.value = 'booking'
      return
    }
    const stepOrder = ['search', 'results', 'booking']
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
    persistence.clearSavedState()
    currentStep.value = 'search'
    searchResults.value = null
    selectedRoom.value = null
    selectedOption.value = null
    booking.value = null
    paymentResult.value = null
    selectedPaymentType.value = 'full'
    cancellationGuarantee.value = false
    cancellationGuaranteeConfig.value = null
    promoCode.value = ''
    promoResult.value = null
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
    selectedPaymentType,
    paymentTerms,
    bankTransferDiscount,
    bankTransferReleaseDays,
    bankAccounts,
    bankTransferDescription,
    bankTransferEnabled,
    detectedMarket,
    cancellationGuarantee,
    cancellationGuaranteeConfig,
    promoCode,
    promoResult,
    promoLoading,

    // Computed
    effectiveTheme,
    nights,
    guaranteeAmount,
    paymentAmountToCharge,
    hasActiveSession,
    resultsStale,

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
    applyPromoCode,
    clearPromoCode,
    goBack,
    reset
  }
})
