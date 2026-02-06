/**
 * Widget Store
 * B2C Widget için state yönetimi
 * Mevcut booking store'u extend eder
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export const useWidgetStore = defineStore('widget', () => {
  // ==================== CONFIG STATE ====================

  // Widget configuration (from data attributes)
  const config = ref({
    hotelCode: null,
    partnerId: null, // Partner ID for partner hotels
    mode: 'floating', // 'inline' | 'floating' | 'fullpage'
    theme: 'light', // 'light' | 'dark' | 'auto'
    primaryColor: '#7c3aed', // Purple as default
    language: null, // Auto-detect from browser
    embedded: false // Is embedded in another site
  })

  // Hotel data
  const hotel = ref(null)
  const hotelConfig = ref(null)

  // Market detection (from IP)
  const market = ref({
    countryCode: null,
    currency: 'EUR',
    locale: 'en-US'
  })

  // ==================== BOOKING STATE ====================

  // Search parameters
  const search = ref({
    checkIn: null,
    checkOut: null,
    rooms: [
      { adults: 2, children: [] } // Default: 1 room, 2 adults
    ]
  })

  // Search results
  const searchResults = ref({
    available: false,
    roomTypes: [],
    loading: false,
    error: null
  })

  // Selected rooms for booking
  const selectedRooms = ref([])
  // Structure: [{ roomTypeId, mealPlanId, roomType, mealPlan, pricing, guests: [] }]

  // Contact information
  const contact = ref({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: 'TR'
  })

  // Room guests
  const roomGuests = ref([])
  // Structure: [[{ title, firstName, lastName, nationality, birthDate, type }]]

  // Special requests
  const specialRequests = ref('')

  // Terms accepted
  const termsAccepted = ref(false)

  // Payment
  const payment = ref({
    method: null, // 'card' | 'atHotel' | 'transfer'
    cardData: null
  })

  // Booking result
  const bookingResult = ref(null)

  // ==================== UI STATE ====================

  const isOpen = ref(false)
  const currentStep = ref(1) // 1: Search, 2: Rooms, 3: Guests, 4: Payment, 5: Confirmation
  const isLoading = ref(false)
  const error = ref(null)

  // ==================== GETTERS ====================

  const nights = computed(() => {
    if (!search.value.checkIn || !search.value.checkOut) return 0
    const start = new Date(search.value.checkIn)
    const end = new Date(search.value.checkOut)
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  })

  const totalGuests = computed(() => {
    return search.value.rooms.reduce((total, room) => {
      return total + room.adults + (room.children?.length || 0)
    }, 0)
  })

  const totalAdults = computed(() => {
    return search.value.rooms.reduce((sum, room) => sum + room.adults, 0)
  })

  const totalChildren = computed(() => {
    return search.value.rooms.reduce((sum, room) => sum + (room.children?.length || 0), 0)
  })

  const totalRooms = computed(() => search.value.rooms.length)

  const currency = computed(() => market.value.currency || 'EUR')

  const subtotal = computed(() => {
    return selectedRooms.value.reduce((sum, room) => {
      return sum + (room.pricing?.originalTotal || 0)
    }, 0)
  })

  const totalDiscount = computed(() => {
    return selectedRooms.value.reduce((sum, room) => {
      return sum + (room.pricing?.totalDiscount || 0)
    }, 0)
  })

  const grandTotal = computed(() => {
    return selectedRooms.value.reduce((sum, room) => {
      return sum + (room.pricing?.finalTotal || 0)
    }, 0)
  })

  const avgPerNight = computed(() => {
    return nights.value > 0 ? grandTotal.value / nights.value : 0
  })

  const appliedCampaigns = computed(() => {
    const campaigns = []
    const seen = new Set()
    selectedRooms.value.forEach(room => {
      if (room.pricing?.campaigns) {
        room.pricing.campaigns.forEach(c => {
          if (!seen.has(c.code)) {
            seen.add(c.code)
            campaigns.push(c)
          }
        })
      }
    })
    return campaigns
  })

  const canProceedToRooms = computed(() => {
    return search.value.checkIn &&
           search.value.checkOut &&
           nights.value > 0 &&
           nights.value <= 30
  })

  const canProceedToGuests = computed(() => {
    return selectedRooms.value.length === search.value.rooms.length
  })

  const canProceedToPayment = computed(() => {
    // Check contact info
    if (!contact.value.firstName || !contact.value.lastName ||
        !contact.value.email || !contact.value.phone) {
      return false
    }

    // Check all room guests are filled
    for (let i = 0; i < roomGuests.value.length; i++) {
      const guests = roomGuests.value[i]
      if (!guests || guests.length === 0) return false

      for (const guest of guests) {
        if (!guest.title || !guest.firstName || !guest.lastName || !guest.nationality) {
          return false
        }
      }
    }

    return true
  })

  const canCreateBooking = computed(() => {
    return canProceedToPayment.value &&
           payment.value.method &&
           termsAccepted.value
  })

  // Step titles for progress indicator
  const steps = computed(() => [
    { id: 1, key: 'search', icon: 'calendar_month' },
    { id: 2, key: 'rooms', icon: 'bed' },
    { id: 3, key: 'guests', icon: 'person' },
    { id: 4, key: 'payment', icon: 'credit_card' },
    { id: 5, key: 'confirmation', icon: 'check_circle' }
  ])

  // ==================== ACTIONS ====================

  /**
   * Initialize widget with config
   */
  async function initialize(options = {}) {
    // Set config
    config.value = {
      ...config.value,
      ...options
    }

    // Auto-detect language from browser
    if (!config.value.language) {
      const browserLang = navigator.language?.split('-')[0] || 'en'
      config.value.language = browserLang
    }

    // Detect theme preference
    if (config.value.theme === 'auto') {
      config.value.theme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }

    // Set default dates (tomorrow + 2 nights)
    if (!search.value.checkIn) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      search.value.checkIn = formatDate(tomorrow)

      const checkout = new Date(tomorrow)
      checkout.setDate(checkout.getDate() + 2)
      search.value.checkOut = formatDate(checkout)
    }
  }

  /**
   * Set market from detection
   */
  function setMarket(marketData) {
    market.value = {
      ...market.value,
      ...marketData
    }
  }

  /**
   * Set hotel data
   */
  function setHotel(hotelData) {
    hotel.value = hotelData
  }

  /**
   * Set hotel widget config
   */
  function setHotelConfig(configData) {
    hotelConfig.value = configData
  }

  /**
   * Update search parameters
   */
  function updateSearch(params) {
    search.value = {
      ...search.value,
      ...params
    }
  }

  /**
   * Add a room to search
   */
  function addRoom() {
    if (search.value.rooms.length < 5) {
      search.value.rooms.push({ adults: 2, children: [] })
    }
  }

  /**
   * Remove a room from search
   */
  function removeRoom(index) {
    if (search.value.rooms.length > 1) {
      search.value.rooms.splice(index, 1)
    }
  }

  /**
   * Update room occupancy
   */
  function updateRoomOccupancy(roomIndex, field, value) {
    if (search.value.rooms[roomIndex]) {
      search.value.rooms[roomIndex][field] = value
    }
  }

  /**
   * Set search results
   */
  function setSearchResults(results) {
    searchResults.value = {
      ...searchResults.value,
      ...results
    }
  }

  /**
   * Select a room for booking
   */
  function selectRoom(roomIndex, roomType, mealPlan, pricing) {
    // Initialize guests for this room
    const room = search.value.rooms[roomIndex]
    const guests = []

    // Add adults
    for (let i = 0; i < room.adults; i++) {
      guests.push({
        title: '',
        firstName: '',
        lastName: '',
        nationality: market.value.countryCode || 'TR',
        birthDate: '',
        type: 'adult'
      })
    }

    // Add children
    for (const childAge of (room.children || [])) {
      guests.push({
        title: '',
        firstName: '',
        lastName: '',
        nationality: market.value.countryCode || 'TR',
        birthDate: '',
        type: 'child',
        age: childAge
      })
    }

    // Add to selected rooms
    selectedRooms.value[roomIndex] = {
      roomTypeId: roomType._id,
      mealPlanId: mealPlan._id,
      roomType,
      mealPlan,
      pricing,
      adults: room.adults,
      children: room.children || []
    }

    // Initialize room guests
    roomGuests.value[roomIndex] = guests
  }

  /**
   * Remove selected room
   */
  function unselectRoom(roomIndex) {
    selectedRooms.value[roomIndex] = null
    roomGuests.value[roomIndex] = []
  }

  /**
   * Update contact info
   */
  function updateContact(data) {
    contact.value = {
      ...contact.value,
      ...data
    }
  }

  /**
   * Update guest info
   */
  function updateGuest(roomIndex, guestIndex, data) {
    if (!roomGuests.value[roomIndex]) {
      roomGuests.value[roomIndex] = []
    }
    if (!roomGuests.value[roomIndex][guestIndex]) {
      roomGuests.value[roomIndex][guestIndex] = {}
    }
    roomGuests.value[roomIndex][guestIndex] = {
      ...roomGuests.value[roomIndex][guestIndex],
      ...data
    }
  }

  /**
   * Set payment method
   */
  function setPaymentMethod(method) {
    payment.value.method = method
  }

  /**
   * Set booking result
   */
  function setBookingResult(result) {
    bookingResult.value = result
  }

  // ==================== NAVIGATION ====================

  function openWidget() {
    isOpen.value = true
  }

  function closeWidget() {
    isOpen.value = false
  }

  function goToStep(step) {
    currentStep.value = step
  }

  function nextStep() {
    if (currentStep.value < 5) {
      currentStep.value++
    }
  }

  function prevStep() {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  // ==================== RESET ====================

  function resetBooking() {
    selectedRooms.value = []
    roomGuests.value = []
    contact.value = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      countryCode: 'TR'
    }
    specialRequests.value = ''
    termsAccepted.value = false
    payment.value = { method: null, cardData: null }
    bookingResult.value = null
    currentStep.value = 1
    error.value = null
  }

  function resetAll() {
    resetBooking()
    search.value = {
      checkIn: null,
      checkOut: null,
      rooms: [{ adults: 2, children: [] }]
    }
    searchResults.value = {
      available: false,
      roomTypes: [],
      loading: false,
      error: null
    }
  }

  // ==================== HELPERS ====================

  function formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // ==================== RETURN ====================

  return {
    // Config state
    config,
    hotel,
    hotelConfig,
    market,

    // Booking state
    search,
    searchResults,
    selectedRooms,
    contact,
    roomGuests,
    specialRequests,
    termsAccepted,
    payment,
    bookingResult,

    // UI state
    isOpen,
    currentStep,
    isLoading,
    error,

    // Getters
    nights,
    totalGuests,
    totalAdults,
    totalChildren,
    totalRooms,
    currency,
    subtotal,
    totalDiscount,
    grandTotal,
    avgPerNight,
    appliedCampaigns,
    canProceedToRooms,
    canProceedToGuests,
    canProceedToPayment,
    canCreateBooking,
    steps,

    // Actions
    initialize,
    setMarket,
    setHotel,
    setHotelConfig,
    updateSearch,
    addRoom,
    removeRoom,
    updateRoomOccupancy,
    setSearchResults,
    selectRoom,
    unselectRoom,
    updateContact,
    updateGuest,
    setPaymentMethod,
    setBookingResult,

    // Navigation
    openWidget,
    closeWidget,
    goToStep,
    nextStep,
    prevStep,

    // Reset
    resetBooking,
    resetAll
  }
})
