<template>
  <div class="h-full flex flex-col">
    <!-- Phase 1: Search & Room Selection -->
    <div
      v-if="bookingStore.currentPhase === 1"
      class="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden"
    >
      <!-- Left Column: Search + Hotel List (Fixed Width, Independent Scroll) -->
      <div class="w-full lg:w-[400px] flex-shrink-0 h-full overflow-y-auto">
        <div class="space-y-4 pb-4">
          <SearchPanel @search="handleSearch" @paximum-search="handlePaximumSearch" />

          <!-- Local Hotel List -->
          <HotelList
            v-if="
              bookingStore.activeProvider === 'local' &&
              (bookingStore.searchResults.hotels.length > 0 ||
                bookingStore.searchResults.unavailableHotels?.length > 0)
            "
            :hotels="bookingStore.searchResults.hotels"
            :unavailable-hotels="bookingStore.searchResults.unavailableHotels || []"
            :selected-hotel-id="bookingStore.searchResults.selectedHotelId"
            :loading="bookingStore.loading.hotels"
            @select="handleSelectHotel"
          />

          <!-- Paximum Hotel List -->
          <PaximumHotelList
            v-if="
              bookingStore.activeProvider === 'paximum' &&
              (bookingStore.paximumResults.hotels.length > 0 ||
                bookingStore.paximumResults.searchPerformed)
            "
            @hotel-selected="handlePaximumHotelSelected"
          />
        </div>
      </div>

      <!-- Right Column: Cart + Rooms (Fill Remaining, Independent Scroll) -->
      <div class="flex-1 h-full overflow-y-auto">
        <div class="space-y-4 pb-4 min-h-full flex flex-col">
          <!-- Cart Summary (Top - Sticky) -->
          <CartSummary
            v-if="bookingStore.cart.length > 0"
            :cart="bookingStore.cart"
            :currency="bookingStore.currency"
            :total="bookingStore.grandTotal"
            :nights="bookingStore.nights"
            @proceed="handleProceedToCheckout"
            @remove="handleRemoveFromCart"
          />

          <!-- Local Room Panel -->
          <RoomPanel
            v-if="
              bookingStore.activeProvider === 'local' && bookingStore.searchResults.selectedHotelId
            "
            :hotel="bookingStore.searchResults.selectedHotel"
            :rooms="bookingStore.searchResults.selectedHotelRooms"
            :loading="bookingStore.loading.rooms"
            class="flex-1"
            @add-to-cart="handleAddToCart"
          />

          <!-- Paximum Room Panel -->
          <PaximumRoomPanel
            v-if="
              bookingStore.activeProvider === 'paximum' && bookingStore.paximumResults.selectedHotel
            "
            class="flex-1"
            @add-to-cart="handlePaximumAddToCart"
          />

          <!-- Empty State - Local -->
          <div
            v-else-if="
              bookingStore.activeProvider === 'local' &&
              bookingStore.searchResults.hotels.length > 0
            "
            class="flex-1 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 min-h-[400px]"
          >
            <div class="text-center p-8">
              <span class="material-icons text-6xl text-gray-300 dark:text-slate-600">hotel</span>
              <p class="mt-4 text-gray-500 dark:text-slate-400">
                {{ $t('booking.selectHotelToViewRooms') }}
              </p>
            </div>
          </div>

          <!-- Empty State - Paximum -->
          <div
            v-else-if="
              bookingStore.activeProvider === 'paximum' &&
              bookingStore.paximumResults.hotels.length > 0
            "
            class="flex-1 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 min-h-[400px]"
          >
            <div class="text-center p-8">
              <span class="material-icons text-6xl text-gray-300 dark:text-slate-600">hotel</span>
              <p class="mt-4 text-gray-500 dark:text-slate-400">
                {{ $t('booking.selectHotelToViewRooms') }}
              </p>
            </div>
          </div>

          <!-- Initial Empty State -->
          <div
            v-else
            class="flex-1 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 min-h-[400px]"
          >
            <div class="text-center p-8">
              <span class="material-icons text-6xl text-gray-300 dark:text-slate-600">search</span>
              <p class="mt-4 text-gray-500 dark:text-slate-400">
                {{ $t('booking.searchToStart') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Phase 2: Guest Info & Payment -->
    <div v-else class="flex-1">
      <div class="flex flex-col lg:flex-row gap-4 lg:items-start">
        <!-- Left Column: Booking Summary (Sticky on Desktop) -->
        <div class="w-full lg:w-[400px] flex-shrink-0 lg:sticky lg:top-0">
          <div class="space-y-4 pb-4">
            <!-- Draft Info Banner (not shown for Paximum bookings) -->
            <div
              v-if="bookingStore.draftBookingNumber && !bookingStore.hasPaximumItems()"
              class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="material-icons text-purple-600 dark:text-purple-400">drafts</span>
                  <span class="font-medium text-purple-800 dark:text-purple-300">{{
                    bookingStore.draftBookingNumber
                  }}</span>
                </div>
                <div class="text-xs text-purple-600 dark:text-purple-400">
                  <span v-if="bookingStore.lastSavedAt">
                    {{ $t('booking.lastSaved') }}: {{ formatTime(bookingStore.lastSavedAt) }}
                  </span>
                  <span v-else>{{ $t('booking.draft') }}</span>
                </div>
              </div>
            </div>

            <BookingSummary
              :cart="bookingStore.cart"
              :search="bookingStore.search"
              :nights="bookingStore.nights"
              :currency="bookingStore.currency"
              :subtotal="bookingStore.subtotal"
              :discount="bookingStore.totalDiscount"
              :total="bookingStore.grandTotal"
            />
          </div>
        </div>

        <!-- Right Column: Guest Forms + Invoice + Payment -->
        <div class="flex-1">
          <div class="space-y-4 pb-4">
            <GuestForms
              :cart="bookingStore.cart"
              :lead-guest="bookingStore.guests.leadGuest"
              :room-guests="bookingStore.guests.roomGuests"
              :check-in-date="bookingStore.search.dateRange.start"
              :show-validation="showValidation"
              @update:lead-guest="handleUpdateLeadGuest"
              @update:room-guests="handleUpdateRoomGuests"
            />

            <!-- Invoice Details -->
            <InvoiceDetailsForm
              :invoice-details="bookingStore.invoiceDetails"
              :lead-guest="bookingStore.guests.leadGuest"
              :show-validation="showValidation"
              @update="handleUpdateInvoiceDetails"
            />

            <PaymentMethodSelect
              :accepted-methods="bookingStore.payment.acceptedMethods"
              :selected-method="bookingStore.payment.method"
              @select="handleSetPaymentMethod"
            />

            <!-- Terms & Create Booking -->
            <div
              class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700"
            >
              <!-- Special Requests -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {{ $t('booking.specialRequests') }}
                </label>
                <textarea
                  v-model="bookingStore.specialRequests"
                  rows="3"
                  class="form-input w-full"
                  :placeholder="$t('booking.specialRequestsPlaceholder')"
                  @blur="triggerAutoSave"
                ></textarea>
              </div>

              <!-- Terms Checkbox -->
              <div class="flex items-start mb-6">
                <input
                  id="terms"
                  v-model="bookingStore.termsAccepted"
                  type="checkbox"
                  class="form-checkbox h-5 w-5 text-purple-600 rounded mt-0.5"
                  :class="{
                    'border-red-500 ring-red-500': showValidation && !bookingStore.termsAccepted
                  }"
                />
                <label
                  for="terms"
                  class="ml-3 text-sm"
                  :class="
                    showValidation && !bookingStore.termsAccepted
                      ? 'text-red-500'
                      : 'text-gray-600 dark:text-slate-400'
                  "
                >
                  {{ $t('booking.acceptTerms') }}
                  <span
                    v-if="showValidation && !bookingStore.termsAccepted"
                    class="text-red-500 font-medium"
                    >*</span
                  >
                </label>
              </div>

              <!-- Validation Summary -->
              <div
                v-if="showValidation && validationErrors.length > 0"
                class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
              >
                <div class="flex items-start">
                  <span class="material-icons text-red-500 mr-2 flex-shrink-0">error_outline</span>
                  <div>
                    <h4 class="font-medium text-red-800 dark:text-red-300 mb-2">
                      {{ $t('booking.validation.pleaseComplete') }}
                    </h4>
                    <ul
                      class="list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-400"
                    >
                      <li v-for="(error, index) in validationErrors" :key="index">{{ error }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Allotment Error -->
              <div
                v-if="bookingStore.allotmentError"
                class="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4"
              >
                <div class="flex items-start">
                  <span class="material-icons text-orange-500 mr-2 flex-shrink-0">warning</span>
                  <div>
                    <h4 class="font-medium text-orange-800 dark:text-orange-300 mb-1">
                      {{ $t('booking.allotmentError') }}
                    </h4>
                    <p class="text-sm text-orange-600 dark:text-orange-400">
                      {{ bookingStore.allotmentError }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center justify-between">
                <button class="btn-secondary px-6 py-2.5" @click="handleGoBack">
                  <span class="material-icons mr-2">arrow_back</span>
                  {{ $t('common.back') }}
                </button>
                <button
                  :disabled="bookingStore.loading.booking"
                  class="btn-primary px-8 py-2.5"
                  @click="handleTryCreateBooking"
                >
                  <span v-if="bookingStore.loading.booking" class="material-icons animate-spin mr-2"
                    >refresh</span
                  >
                  <span v-else class="material-icons mr-2">check_circle</span>
                  {{ $t('booking.createBooking') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Toast -->
    <div
      v-if="bookingStore.error"
      class="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50"
    >
      <span class="material-icons mr-2">error</span>
      {{ bookingStore.error }}
      <button class="ml-4" @click="bookingStore.error = null">
        <span class="material-icons">close</span>
      </button>
    </div>

    <!-- Success Modal -->
    <Modal v-model="showSuccessModal" :title="$t('booking.bookingCreated')">
      <div class="text-center py-6">
        <span class="material-icons text-6xl text-green-500">check_circle</span>
        <h3 class="text-xl font-semibold mt-4">{{ $t('booking.bookingSuccess') }}</h3>
        <p class="text-gray-600 dark:text-slate-400 mt-2">
          {{ $t('booking.bookingNumber') }}:
          <strong>{{ bookingStore.bookingResult?.bookingNumber }}</strong>
        </p>
        <div class="mt-6 flex justify-center gap-4">
          <button class="btn-secondary px-6 py-2" @click="handleNewBooking">
            {{ $t('booking.newBooking') }}
          </button>
          <button class="btn-primary px-6 py-2" @click="handleViewBooking">
            {{ $t('booking.viewBooking') }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBookingStore } from '@/stores/booking'
import { useBookingValidation } from '@/composables/useBookingValidation'
import { savePhase1Data, clearPhase1Data } from '@/services/bookingStorageService'
import SearchPanel from './search/SearchPanel.vue'
import HotelList from './search/HotelList.vue'
import PaximumHotelList from './search/PaximumHotelList.vue'
import RoomPanel from './rooms/RoomPanel.vue'
import PaximumRoomPanel from './search/PaximumRoomPanel.vue'
import CartSummary from './cart/CartSummary.vue'
import BookingSummary from './checkout/BookingSummary.vue'
import GuestForms from './checkout/GuestForms.vue'
import InvoiceDetailsForm from './checkout/InvoiceDetailsForm.vue'
import PaymentMethodSelect from './checkout/PaymentMethodSelect.vue'
import Modal from '@/components/common/Modal.vue'

const router = useRouter()
const bookingStore = useBookingStore()
const { t } = useI18n()
const { validateBooking, formatErrors } = useBookingValidation()

const showSuccessModal = ref(false)
const showValidation = ref(false)

// Auto-save debounce timer
let autoSaveTimer = null

// Cleanup timer on unmount to prevent memory leak
onUnmounted(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
})

// Format time for display
const formatTime = date => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

// Save Phase 1 data to localStorage
const savePhase1ToStorage = () => {
  if (bookingStore.currentPhase !== 1) return

  const data = {
    search: bookingStore.search,
    cart: bookingStore.cart,
    selectedHotel: bookingStore.searchResults.selectedHotel,
    searchResults: {
      hotels: bookingStore.searchResults.hotels,
      selectedHotelRooms: bookingStore.searchResults.selectedHotelRooms
    }
  }
  savePhase1Data(data)
}

// Watch Phase 1 data changes and save to localStorage
watch(
  () => [bookingStore.search, bookingStore.cart, bookingStore.searchResults.selectedHotelId],
  () => {
    if (bookingStore.currentPhase === 1) {
      savePhase1ToStorage()
    }
  },
  { deep: true }
)

// Trigger auto-save for Phase 2 (local bookings only)
const triggerAutoSave = () => {
  // Skip auto-save for Paximum bookings (no draft)
  if (bookingStore.hasPaximumItems()) return
  if (bookingStore.currentPhase !== 2 || !bookingStore.draftBookingNumber) return

  // Debounce auto-save
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  autoSaveTimer = setTimeout(async () => {
    await bookingStore.updateDraft()
  }, 2000)
}

// Validation errors computed - uses centralized validation from useBookingValidation
// Tüm kurallar: /composables/useBookingValidation.js
const validationErrors = computed(() => {
  const result = validateBooking({
    leadGuest: bookingStore.guests.leadGuest,
    roomGuests: bookingStore.guests.roomGuests,
    invoiceDetails: bookingStore.invoiceDetails,
    payment: bookingStore.payment
  })

  const errors = formatErrors(result.errors)

  // Terms validation (UI only - not in schema)
  if (!bookingStore.termsAccepted) {
    errors.push(t('booking.validation.termsRequired'))
  }

  return errors
})

// Try to create booking with validation
const handleTryCreateBooking = async () => {
  showValidation.value = true
  bookingStore.allotmentError = null

  if (validationErrors.value.length > 0) {
    // Scroll to validation summary
    const validationBox = document.querySelector('.bg-red-50')
    if (validationBox) {
      validationBox.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  let result = null

  // Check if this is a Paximum booking
  if (bookingStore.hasPaximumItems()) {
    console.log('[Paximum] Creating Paximum booking...')
    result = await bookingStore.createPaximumBooking()
  } else {
    // Local booking - complete draft (this also checks allotment)
    result = await bookingStore.completeDraft()
  }

  if (result) {
    // Clear localStorage on successful booking
    clearPhase1Data()
    showSuccessModal.value = true
    showValidation.value = false
  }
}

// Search handler
const handleSearch = async () => {
  await bookingStore.searchHotels()
}

// Paximum search handler
const handlePaximumSearch = () => {
  // Search is handled in SearchPanel, just log for now
  console.log('Paximum search completed')
}

// Paximum hotel selected handler
const handlePaximumHotelSelected = hotel => {
  console.log('Paximum hotel selected:', hotel.name)
}

// Paximum add to cart handler
const handlePaximumAddToCart = offer => {
  console.log('Paximum offer added to cart:', offer)
  bookingStore.addPaximumToCart(offer)
}

// Select hotel
const handleSelectHotel = async hotelId => {
  await bookingStore.selectHotel(hotelId)
}

// Add room to cart
const handleAddToCart = (roomType, mealPlan, option) => {
  console.log('🛒 BookingLayout handleAddToCart:', { roomType, mealPlan, option })
  bookingStore.addToCart(roomType, mealPlan, option)
  console.log('🛒 Cart after add:', bookingStore.cart)
}

// Remove from cart
const handleRemoveFromCart = index => {
  bookingStore.removeFromCart(index)
}

// Proceed to checkout - creates draft (for local) or just goes to Phase 2 (for Paximum)
const handleProceedToCheckout = async () => {
  // For Paximum bookings, skip draft creation and go directly to Phase 2
  if (bookingStore.hasPaximumItems()) {
    console.log('[Paximum] Skipping draft, going to Phase 2')
    bookingStore.goToCheckout()
    return
  }

  // For local bookings, create draft in database
  const success = await bookingStore.createDraft()
  if (success) {
    // Clear localStorage since data is now in database
    clearPhase1Data()
    // Go to Phase 2
    bookingStore.goToCheckout()
  }
}

// Go back to search
const handleGoBack = () => {
  bookingStore.goBackToSearch()
}

// Handle lead guest update with auto-save
const handleUpdateLeadGuest = data => {
  bookingStore.updateLeadGuest(data)
  triggerAutoSave()
}

// Handle room guests update with auto-save
const handleUpdateRoomGuests = data => {
  bookingStore.updateRoomGuests(data)
  triggerAutoSave()
}

// Handle invoice details update with auto-save
const handleUpdateInvoiceDetails = data => {
  bookingStore.updateInvoiceDetails(data)
  triggerAutoSave()
}

// Handle payment method with auto-save
const handleSetPaymentMethod = method => {
  bookingStore.setPaymentMethod(method)
  triggerAutoSave()
}

// New booking
const handleNewBooking = () => {
  showSuccessModal.value = false
  bookingStore.resetAll()
  router.push('/bookings/new')
}

// View booking
const handleViewBooking = () => {
  showSuccessModal.value = false
  const bookingId = bookingStore.bookingResult?._id
  bookingStore.resetAll()
  if (bookingId) {
    router.push(`/bookings/${bookingId}`)
  }
}
</script>
