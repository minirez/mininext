<template>
  <div class="h-full flex flex-col">
    <!-- Navigation -->
    <ModuleNavigation :items="navItems" color="purple" />

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <span class="material-icons text-4xl text-purple-500 animate-spin">refresh</span>
        <p class="mt-2 text-gray-600 dark:text-gray-400">{{ $t('common.loading') }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="flex-1 flex items-center justify-center">
      <div class="text-center max-w-md">
        <span class="material-icons text-4xl text-red-500">error_outline</span>
        <p class="mt-2 text-gray-600 dark:text-gray-400">{{ loadError }}</p>
        <button
          class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          @click="router.push('/bookings/new')"
        >
          {{ $t('booking.startNewBooking') }}
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="flex-1 overflow-y-auto py-4 lg:py-6">
      <BookingLayout />
    </div>

    <!-- Continue or Start Fresh Modal -->
    <Modal v-model="showContinueModal" :title="$t('booking.existingDataFound')">
      <div class="py-4">
        <div class="flex items-center justify-center mb-4">
          <span class="material-icons text-5xl text-purple-500">restore</span>
        </div>
        <p class="text-center text-gray-600 dark:text-slate-400 mb-2">
          {{ $t('booking.existingDataMessage') }}
        </p>
        <p
          v-if="existingDraftNumber"
          class="text-center text-sm text-purple-600 dark:text-purple-400 font-medium mb-4"
        >
          {{ $t('booking.draftNumber') }}: {{ existingDraftNumber }}
        </p>
        <p
          v-else-if="hasLocalStorageData"
          class="text-center text-sm text-gray-500 dark:text-slate-500 mb-4"
        >
          {{ $t('booking.unsavedSearchData') }}
        </p>
      </div>
      <div class="flex gap-3 mt-4">
        <button
          class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          @click="handleStartFresh"
        >
          <span class="material-icons text-sm mr-1 align-middle">add</span>
          {{ $t('booking.startFresh') }}
        </button>
        <button
          class="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          @click="handleContinueExisting"
        >
          <span class="material-icons text-sm mr-1 align-middle">play_arrow</span>
          {{ $t('booking.continueExisting') }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/booking'
import { useUIStore } from '@/stores/ui'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { loadPhase1Data, clearPhase1Data } from '@/services/bookingStorageService'
import BookingLayout from '@/components/booking/BookingLayout.vue'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'
import Modal from '@/components/common/Modal.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()
const uiStore = useUIStore()

// Async action composables
const { isLoading: loading, execute: executeInit } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })

const loadError = ref(null)
const showContinueModal = ref(false)
const existingDraftNumber = ref(null)
const hasLocalStorageData = ref(false)
const pendingPhase1Data = ref(null)

// Navigation items - dynamic based on draft state
const navItems = computed(() => {
  const items = [
    {
      name: 'bookings',
      to: '/bookings',
      icon: 'event_note',
      label: t('booking.bookings'),
      matchPattern: '^/bookings(/[a-f0-9]+)?$'
    }
  ]

  // If we have a draft, show its number
  if (bookingStore.draftBookingNumber) {
    items.push({
      name: 'current-draft',
      to: `/bookings/draft/${bookingStore.draftBookingNumber}`,
      icon: 'edit_note',
      label: bookingStore.draftBookingNumber,
      exact: true
    })
  } else {
    items.push({
      name: 'new-booking',
      to: '/bookings/new',
      icon: 'add',
      label: t('booking.newBooking'),
      exact: true
    })
  }

  return items
})

// Helper to get localized hotel name
const getLocalizedName = name => {
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
}

// Format date for display
const formatDate = dateStr => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-GB', {
    day: 'numeric',
    month: 'short'
  })
}

// Update page title based on booking state
const updatePageTitle = () => {
  if (bookingStore.currentPhase === 2) {
    // Phase 2: Show hotel name and dates
    const hotel = bookingStore.cart[0]?.hotel
    const hotelName = hotel ? getLocalizedName(hotel.name) : ''
    const checkIn = formatDate(bookingStore.search.dateRange.start)
    const checkOut = formatDate(bookingStore.search.dateRange.end)

    let title = ''
    if (hotelName) {
      title = hotelName
      if (checkIn && checkOut) {
        title += ` (${checkIn} - ${checkOut})`
      }
    } else if (bookingStore.draftBookingNumber) {
      title = bookingStore.draftBookingNumber
    } else {
      title = t('booking.reservationDetails')
    }

    uiStore.setPageTitle(title, t('booking.enterGuestAndPayment'))
  } else {
    // Phase 1: Clear custom title (use default)
    uiStore.clearPageTitle()
  }
}

// Watch phase changes and cart updates to update title
watch(
  () => [bookingStore.currentPhase, bookingStore.cart, bookingStore.draftBookingNumber],
  () => {
    updatePageTitle()
  },
  { deep: true }
)

// Clear page title on unmount
onUnmounted(() => {
  uiStore.clearPageTitle()
})

// Initialize booking based on route
const initializeBooking = async () => {
  loadError.value = null
  const bookingNumber = route.params.bookingNumber

  if (bookingNumber) {
    // Loading existing draft from URL
    await executeInit(
      () => bookingStore.loadDraft(bookingNumber),
      {
        onError: error => {
          console.error('Failed to initialize booking:', error)
          loadError.value = error.message || t('booking.loadError')
        }
      }
    )
  } else {
    // New booking - check for existing data
    const phase1Data = loadPhase1Data()
    const hasExistingDraft = bookingStore.draftBookingNumber
    const hasCartInStore = bookingStore.cart.length > 0
    const hasCartInStorage = phase1Data?.cart?.length > 0

    // Only show modal if there's meaningful data: cart items or a saved draft
    // Don't show modal just for search results or empty data
    if (hasExistingDraft || hasCartInStore || hasCartInStorage) {
      // Store the data and show the modal
      pendingPhase1Data.value = phase1Data
      existingDraftNumber.value = hasExistingDraft || null
      hasLocalStorageData.value = !!phase1Data && !hasExistingDraft
      showContinueModal.value = true
    } else {
      // Fresh start or only search data - no need to ask
      clearPhase1Data()
      bookingStore.resetAll()
    }
  }
}

// Handle continue with existing data
const handleContinueExisting = () => {
  showContinueModal.value = false

  // If there's a draft in the store, navigate to it
  if (existingDraftNumber.value) {
    router.replace({ name: 'booking-draft', params: { bookingNumber: existingDraftNumber.value } })
    return
  }

  // Restore from localStorage if available
  const phase1Data = pendingPhase1Data.value
  if (phase1Data) {
    if (phase1Data.search) {
      bookingStore.search = { ...bookingStore.search, ...phase1Data.search }
    }
    if (phase1Data.cart) {
      bookingStore.cart = phase1Data.cart
    }
    if (phase1Data.selectedHotel) {
      bookingStore.searchResults.selectedHotelId = phase1Data.selectedHotel._id
      bookingStore.searchResults.selectedHotel = phase1Data.selectedHotel
    }
    if (phase1Data.searchResults?.hotels) {
      bookingStore.searchResults.hotels = phase1Data.searchResults.hotels
    }
    if (phase1Data.searchResults?.selectedHotelRooms) {
      bookingStore.searchResults.selectedHotelRooms = phase1Data.searchResults.selectedHotelRooms
    }
  }

  pendingPhase1Data.value = null
}

// Handle start fresh
const handleStartFresh = () => {
  showContinueModal.value = false

  // Clear everything
  clearPhase1Data()
  bookingStore.resetAll()

  pendingPhase1Data.value = null
  existingDraftNumber.value = null
  hasLocalStorageData.value = false
}

// Watch for route changes (e.g., navigating between drafts)
watch(
  () => route.params.bookingNumber,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      initializeBooking()
    }
  }
)

// Watch for draft creation to update URL
watch(
  () => bookingStore.draftBookingNumber,
  newVal => {
    if (newVal && route.name !== 'booking-draft') {
      // Draft was just created, update URL
      router.replace({ name: 'booking-draft', params: { bookingNumber: newVal } })
    }
  }
)

onMounted(() => {
  initializeBooking()
})
</script>
