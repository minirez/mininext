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
              :total="bookingStore.grandTotalWithGuarantee"
              :cancellation-guarantee="
                bookingStore.cancellationGuarantee
                  ? {
                      purchased: true,
                      rate: bookingStore.cancellationGuaranteeConfig?.rate || 1,
                      amount: bookingStore.guaranteeAmount
                    }
                  : null
              "
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

            <!-- Cancellation Guarantee Package -->
            <div
              v-if="showGuarantee"
              class="bg-white dark:bg-slate-800 rounded-xl border-2 transition-all cursor-pointer p-5"
              :class="
                bookingStore.cancellationGuarantee
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
              "
              @click="toggleGuarantee"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0"
                    :class="
                      bookingStore.cancellationGuarantee
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300 dark:border-slate-500'
                    "
                  >
                    <span
                      v-if="bookingStore.cancellationGuarantee"
                      class="material-icons text-white"
                      style="font-size: 14px"
                      >check</span
                    >
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="material-icons text-blue-600 dark:text-blue-400 text-lg"
                        >verified_user</span
                      >
                      <span class="font-semibold text-gray-800 dark:text-white text-sm">
                        {{ $t('booking.cancellationGuarantee') }}
                        ({{ bookingStore.cancellationGuaranteeConfig?.rate || 1 }}%)
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-slate-400 mt-1 ml-7">
                      {{ $t('booking.cancellationGuaranteeDesc') }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="bookingStore.cancellationGuarantee"
                  class="text-right flex-shrink-0 ml-3"
                >
                  <span class="text-sm font-bold text-blue-600 dark:text-blue-400">
                    +{{ formatGuaranteeAmount }}
                  </span>
                </div>
              </div>
            </div>

            <PaymentMethodSelect
              :accepted-methods="bookingStore.payment.acceptedMethods"
              :selected-method="bookingStore.payment.method"
              @select="handleSetPaymentMethod"
            />

            <!-- Credit Card Payment Options -->
            <CreditCardPaymentOptions
              v-if="bookingStore.payment.method === 'credit_card'"
              ref="creditCardPaymentRef"
              v-model="creditCardOption"
              v-model:send-email="sendPaymentLinkEmail"
              v-model:send-sms="sendPaymentLinkSms"
              :amount="bookingStore.grandTotalWithGuarantee"
              :currency="bookingStore.currency"
              :customer-name="
                (bookingStore.guests.leadGuest?.firstName || '') +
                ' ' +
                (bookingStore.guests.leadGuest?.lastName || '')
              "
              :customer-email="bookingStore.guests.leadGuest?.email"
              :customer-phone="bookingStore.guests.leadGuest?.phone"
              @payment-start="handleInlinePaymentStart"
              @payment-success="handleInlinePaymentSuccess"
              @payment-error="handleInlinePaymentError"
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
                <!-- Hide create booking button when inline payment is selected (form has its own pay button) -->
                <button
                  v-if="
                    !(
                      bookingStore.payment.method === 'credit_card' && creditCardOption === 'inline'
                    )
                  "
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
          {{ paymentLinkResult ? $t('booking.creditCardOptions.paymentLinkSentDescription') : '' }}
        </p>
        <p class="text-gray-600 dark:text-slate-400 mt-2">
          {{ $t('booking.bookingNumber') }}:
          <strong>{{ bookingStore.bookingResult?.bookingNumber }}</strong>
        </p>

        <!-- Payment Link Info -->
        <div
          v-if="paymentLinkResult"
          class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4 text-left"
        >
          <div class="flex items-center mb-3">
            <span class="material-icons text-blue-500 mr-2">link</span>
            <span class="font-medium text-blue-700 dark:text-blue-400">
              {{ $t('booking.creditCardOptions.paymentLinkInfo') }}
            </span>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-lg p-3 mb-3">
            <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
              {{ $t('booking.creditCardOptions.linkNumber') }}
            </p>
            <p class="font-mono text-sm text-gray-900 dark:text-white">
              {{ paymentLinkResult.linkNumber }}
            </p>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-slate-400">
              {{ $t('booking.creditCardOptions.amount') }}:
              <span class="font-medium text-gray-900 dark:text-white">
                {{ formatPaymentAmount(paymentLinkResult.amount, paymentLinkResult.currency) }}
              </span>
            </span>
          </div>
          <div class="mt-3">
            <button
              class="w-full btn-sm btn-secondary flex items-center justify-center"
              @click="copyPaymentLink"
            >
              <span class="material-icons text-sm mr-1">content_copy</span>
              {{ $t('booking.creditCardOptions.copyLink') }}
            </button>
          </div>
        </div>

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
import paymentService from '@/services/paymentService'
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
import CreditCardPaymentOptions from './wizard/CreditCardPaymentOptions.vue'
import Modal from '@/components/common/Modal.vue'

const router = useRouter()
const bookingStore = useBookingStore()
const { t } = useI18n()
const { validateBooking, formatErrors } = useBookingValidation()

const showSuccessModal = ref(false)
const showValidation = ref(false)

// Credit card payment options
const creditCardOption = ref('payment_link') // 'inline' or 'payment_link'
const sendPaymentLinkEmail = ref(true)
const sendPaymentLinkSms = ref(false)
const paymentLinkResult = ref(null)
const creditCardPaymentRef = ref(null)

// Inline payment state
const inlinePaymentBookingId = ref(null)
const inlinePaymentId = ref(null)

// Cancellation guarantee
const showGuarantee = computed(() => {
  if (!bookingStore.cancellationGuaranteeConfig?.enabled) return false
  // Hide if all cart items are non-refundable
  const allNonRefundable = bookingStore.cart.every(item => item.rateType === 'non_refundable')
  return !allNonRefundable
})

const toggleGuarantee = () => {
  bookingStore.cancellationGuarantee = !bookingStore.cancellationGuarantee
  triggerAutoSave()
}

const formatGuaranteeAmount = computed(() => {
  const amount = bookingStore.guaranteeAmount
  if (!amount) return '-'
  const symbols = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }
  const symbol = symbols[bookingStore.currency] || bookingStore.currency
  return `${symbol}${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(amount)}`
})

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
    result = await bookingStore.createPaximumBooking()
  } else if (
    bookingStore.payment.method === 'credit_card' &&
    creditCardOption.value === 'payment_link'
  ) {
    // Credit card with payment link - complete draft + create payment link
    result = await bookingStore.completeDraft({
      createPaymentLink: true,
      sendEmail: sendPaymentLinkEmail.value,
      sendSms: sendPaymentLinkSms.value
    })
    if (result?.paymentLink) {
      paymentLinkResult.value = result.paymentLink
    }
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

// Inline payment handlers
const handleInlinePaymentStart = async paymentData => {
  console.log('[BookingLayout] handleInlinePaymentStart called', paymentData)
  showValidation.value = true
  bookingStore.allotmentError = null

  // Check validation first
  if (validationErrors.value.length > 0) {
    console.log('[BookingLayout] Validation errors:', validationErrors.value)
    const validationBox = document.querySelector('.bg-red-50')
    if (validationBox) {
      validationBox.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    // Reset processing state in child component
    if (creditCardPaymentRef.value?.resetProcessing) {
      creditCardPaymentRef.value.resetProcessing()
    }
    return
  }

  // Extra check for lead guest (required for booking)
  const leadGuest = bookingStore.guests.leadGuest
  if (!leadGuest?.firstName || !leadGuest?.lastName) {
    console.log('[BookingLayout] Lead guest validation failed')
    bookingStore.error = t('booking.validation.leadGuestRequired')
    if (creditCardPaymentRef.value?.resetProcessing) {
      creditCardPaymentRef.value.resetProcessing()
    }
    return
  }

  try {
    // 1. Save draft (DO NOT complete - payment not received yet!)
    console.log('[BookingLayout] Saving draft (NOT completing)...')
    await bookingStore.updateDraft()

    // Get draft booking ID from store
    const draftId = bookingStore.draftData?._id
    if (!draftId) {
      throw new Error('Draft booking ID not found')
    }
    console.log('[BookingLayout] Using draft booking ID:', draftId)

    inlinePaymentBookingId.value = draftId

    // 2. Create payment record on draft booking
    console.log('[BookingLayout] Creating payment record...')
    const paymentResponse = await paymentService.addPayment(draftId, {
      type: 'credit_card',
      amount: bookingStore.grandTotalWithGuarantee,
      currency: bookingStore.currency
    })
    console.log('[BookingLayout] Payment record created:', paymentResponse?.data?._id)

    if (!paymentResponse.success) {
      throw new Error('Payment record creation failed')
    }

    inlinePaymentId.value = paymentResponse.data._id

    // 3. Process payment through child component
    // Booking will be completed ONLY after successful 3D payment
    console.log('[BookingLayout] Calling creditCardPaymentRef.processPayment...')
    console.log('[BookingLayout] creditCardPaymentRef exists:', !!creditCardPaymentRef.value)
    if (creditCardPaymentRef.value) {
      await creditCardPaymentRef.value.processPayment(draftId, paymentResponse.data._id)
      console.log('[BookingLayout] processPayment completed')
    } else {
      console.error('[BookingLayout] creditCardPaymentRef is null!')
    }
  } catch (error) {
    console.error('[BookingLayout] Inline payment start failed:', error)
    bookingStore.error =
      error.response?.data?.message || error.message || t('booking.error.paymentFailed')
    if (creditCardPaymentRef.value?.resetProcessing) {
      creditCardPaymentRef.value.resetProcessing()
    }
  }
}

const handleInlinePaymentSuccess = async result => {
  console.log('[BookingLayout] handleInlinePaymentSuccess called!', result)

  try {
    // Payment successful - NOW complete the draft booking
    console.log('[BookingLayout] Payment successful, completing draft booking...')
    const booking = await bookingStore.completeDraft()

    if (booking) {
      console.log('[BookingLayout] Booking completed:', booking.bookingNumber)
    } else {
      console.error('[BookingLayout] Failed to complete booking after payment')
    }
  } catch (error) {
    console.error('[BookingLayout] Error completing booking:', error)
    // Payment was successful, so show success anyway
    // Backend should handle this case via webhook/callback
  }

  console.log('[BookingLayout] Opening success modal')
  clearPhase1Data()
  showSuccessModal.value = true
  showValidation.value = false
}

const handleInlinePaymentError = error => {
  console.error('Inline payment error:', error)
  if (error !== 'cancelled') {
    bookingStore.error = error
  }
  // Booking may already be created - user can retry payment from booking detail
}

// Search handler
const handleSearch = async () => {
  await bookingStore.searchHotels()
}

// Paximum search handler
const handlePaximumSearch = () => {
  // Search is handled in SearchPanel
}

// Paximum hotel selected handler
const handlePaximumHotelSelected = hotel => {
  void hotel
}

// Paximum add to cart handler
const handlePaximumAddToCart = offer => {
  bookingStore.addPaximumToCart(offer)
}

// Select hotel
const handleSelectHotel = async hotelId => {
  await bookingStore.selectHotel(hotelId)
}

// Add room to cart
const handleAddToCart = (roomType, mealPlan, option) => {
  bookingStore.addToCart(roomType, mealPlan, option)
}

// Remove from cart
const handleRemoveFromCart = index => {
  bookingStore.removeFromCart(index)
}

// Proceed to checkout - creates draft (for local) or just goes to Phase 2 (for Paximum)
const handleProceedToCheckout = async () => {
  // For Paximum bookings, skip draft creation and go directly to Phase 2
  if (bookingStore.hasPaximumItems()) {
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

// Format payment amount
const formatPaymentAmount = (amount, currency = 'TRY') => {
  if (!amount && amount !== 0) return '-'
  const symbols = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }
  const symbol = symbols[currency] || currency
  return `${symbol}${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(amount)}`
}

// Copy payment link
const copyPaymentLink = async () => {
  if (!paymentLinkResult.value?.paymentUrl) return
  try {
    await navigator.clipboard.writeText(paymentLinkResult.value.paymentUrl)
    // Could add toast here
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>
