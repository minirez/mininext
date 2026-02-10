<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ $t('booking.reviewAndConfirm') }}
      </h2>
      <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
        {{ $t('booking.reviewDescription') }}
      </p>
    </div>

    <!-- Hotel & Dates Summary -->
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 md:p-6">
      <div class="flex items-start space-x-4">
        <div
          class="w-16 h-16 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm"
        >
          <span class="material-icons text-purple-500 text-2xl">hotel</span>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-gray-900 dark:text-white text-lg">
            {{ bookingStore.search.hotel?.name || bookingStore.availability.hotel?.name }}
          </h3>
          <div class="mt-2 flex flex-wrap gap-3 text-sm">
            <span class="inline-flex items-center text-gray-600 dark:text-slate-400">
              <span class="material-icons text-sm mr-1">calendar_today</span>
              {{ formatDateRange }}
            </span>
            <span class="inline-flex items-center text-gray-600 dark:text-slate-400">
              <span class="material-icons text-sm mr-1">nights_stay</span>
              {{ bookingStore.nights }} {{ $t('booking.nights') }}
            </span>
            <span class="inline-flex items-center text-gray-600 dark:text-slate-400">
              <span class="material-icons text-sm mr-1">meeting_room</span>
              {{ bookingStore.totalRooms }} {{ $t('booking.rooms') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Rooms Summary -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
      >
        <h3 class="font-semibold text-gray-900 dark:text-white flex items-center">
          <span class="material-icons text-purple-500 mr-2">bed</span>
          {{ $t('booking.selectedRooms') }}
        </h3>
      </div>
      <div class="divide-y divide-gray-200 dark:divide-slate-700">
        <div v-for="(room, index) in bookingStore.cart" :key="index" class="p-4">
          <div class="flex items-start justify-between">
            <div class="flex items-start space-x-4">
              <div
                class="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0"
              >
                <span class="font-bold text-purple-600 dark:text-purple-400">{{ index + 1 }}</span>
              </div>
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">
                  {{ getRoomName(room.roomType) }}
                </h4>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ getMealPlanName(room.mealPlan) }}
                </p>
                <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  {{ room.adults }} {{ $t('booking.adults') }}
                  <span v-if="room.children?.length > 0">
                    + {{ room.children.length }} {{ $t('booking.children') }}
                  </span>
                </p>
                <!-- Campaigns -->
                <div v-if="room.campaigns?.length" class="mt-2 flex flex-wrap gap-1">
                  <span
                    v-for="campaign in room.campaigns"
                    :key="campaign.code"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  >
                    {{ campaign.discountText || campaign.name }}
                  </span>
                </div>
              </div>
            </div>
            <div class="text-right">
              <p v-if="room.pricing?.totalDiscount > 0" class="text-sm text-gray-400 line-through">
                {{ formatPrice(room.pricing.originalTotal, room.pricing.currency) }}
              </p>
              <p class="text-lg font-bold text-purple-600 dark:text-purple-400">
                {{ formatPrice(room.pricing?.finalTotal, room.pricing?.currency) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lead Guest Summary -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between"
      >
        <h3 class="font-semibold text-gray-900 dark:text-white flex items-center">
          <span class="material-icons text-purple-500 mr-2">person</span>
          {{ $t('booking.leadGuest') }}
        </h3>
        <button
          class="text-purple-600 dark:text-purple-400 text-sm hover:underline flex items-center"
          @click="$emit('edit-guests')"
        >
          <span class="material-icons text-sm mr-1">edit</span>
          {{ $t('common.edit') }}
        </button>
      </div>
      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500 dark:text-slate-400">{{ $t('booking.name') }}:</span>
            <span class="ml-2 text-gray-900 dark:text-white font-medium">
              {{ formatGuestName(bookingStore.guests.leadGuest) }}
            </span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-slate-400">{{ $t('common.email') }}:</span>
            <span class="ml-2 text-gray-900 dark:text-white">
              {{ bookingStore.guests.leadGuest?.email }}
            </span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-slate-400">{{ $t('booking.phone') }}:</span>
            <span class="ml-2 text-gray-900 dark:text-white">
              {{ bookingStore.guests.leadGuest?.phone }}
            </span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-slate-400">{{ $t('booking.nationality') }}:</span>
            <span class="ml-2 text-gray-900 dark:text-white">
              {{ bookingStore.guests.leadGuest?.nationality }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Special Requests -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 md:p-6"
    >
      <h3 class="font-semibold text-gray-900 dark:text-white flex items-center mb-4">
        <span class="material-icons text-purple-500 mr-2">note_add</span>
        {{ $t('booking.specialRequests') }}
      </h3>
      <textarea
        v-model="specialRequests"
        :placeholder="$t('booking.specialRequestsPlaceholder')"
        rows="3"
        class="form-input w-full resize-none"
      ></textarea>
      <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">
        {{ $t('booking.specialRequestsNote') }}
      </p>
    </div>

    <!-- Price Summary -->
    <PriceSummary
      :subtotal="bookingStore.subtotal"
      :discount="bookingStore.totalDiscount"
      :total="bookingStore.grandTotal"
      :currency="bookingStore.currency"
      :nights="bookingStore.nights"
      :campaigns="bookingStore.appliedCampaigns"
      :show-breakdown="true"
      :daily-breakdown="dailyBreakdown"
    />

    <!-- Payment Method Selection -->
    <PaymentMethodSelect
      :accepted-methods="['cash', 'bank_transfer', 'credit_card']"
      :selected-method="paymentMethod"
      @select="paymentMethod = $event"
    />

    <!-- Credit Card Payment Options (only when credit_card selected) -->
    <CreditCardPaymentOptions
      v-if="paymentMethod === 'credit_card'"
      v-model="creditCardOption"
      v-model:send-email="sendPaymentLinkEmail"
      v-model:send-sms="sendPaymentLinkSms"
    />

    <!-- Terms & Conditions -->
    <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 md:p-6">
      <label class="flex items-start space-x-3 cursor-pointer">
        <input
          v-model="termsAccepted"
          type="checkbox"
          class="form-checkbox h-5 w-5 text-purple-600 rounded mt-0.5"
        />
        <span class="text-sm text-gray-600 dark:text-slate-400">
          {{ $t('booking.termsAcceptText') }}
          <a
            href="#"
            class="text-purple-600 dark:text-purple-400 hover:underline"
            @click.prevent="showTerms = true"
          >
            {{ $t('booking.termsAndConditions') }}
          </a>
          {{ $t('booking.and') }}
          <a
            href="#"
            class="text-purple-600 dark:text-purple-400 hover:underline"
            @click.prevent="showPrivacy = true"
          >
            {{ $t('booking.privacyPolicy') }}
          </a>
          {{ $t('booking.termsAcceptSuffix') }}
        </span>
      </label>
    </div>

    <!-- Booking Status Note -->
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
      <div class="flex items-start">
        <span class="material-icons text-blue-500 mr-3 mt-0.5">info</span>
        <div>
          <p class="font-medium text-blue-700 dark:text-blue-400">
            {{ $t('booking.bookingStatusNote') }}
          </p>
          <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
            {{ $t('booking.bookingStatusDescription') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div
      class="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-gray-200 dark:border-slate-700"
    >
      <button class="btn-secondary px-6 py-3 order-2 sm:order-1" @click="$emit('go-back')">
        <span class="material-icons mr-2">arrow_back</span>
        {{ $t('common.back') }}
      </button>
      <button
        :disabled="!termsAccepted || isSubmitting"
        class="btn-primary px-8 py-3 order-1 sm:order-2"
        @click="handleConfirm"
      >
        <span v-if="isSubmitting" class="material-icons animate-spin mr-2">refresh</span>
        <span v-else class="material-icons mr-2">check_circle</span>
        {{ $t('booking.confirmBooking') }}
      </button>
    </div>

    <!-- Terms Modal -->
    <Modal v-model="showTerms" :title="$t('booking.termsAndConditions')" size="lg">
      <div class="prose dark:prose-invert max-w-none">
        <p>{{ $t('booking.termsContent') }}</p>
      </div>
      <template #footer>
        <button class="btn-primary" @click="showTerms = false">
          {{ $t('common.close') }}
        </button>
      </template>
    </Modal>

    <!-- Privacy Modal -->
    <Modal v-model="showPrivacy" :title="$t('booking.privacyPolicy')" size="lg">
      <div class="prose dark:prose-invert max-w-none">
        <p>{{ $t('booking.privacyContent') }}</p>
      </div>
      <template #footer>
        <button class="btn-primary" @click="showPrivacy = false">
          {{ $t('common.close') }}
        </button>
      </template>
    </Modal>

    <!-- Success Modal -->
    <Modal v-model="showSuccess" :title="$t('booking.bookingSuccess')" :closable="false">
      <div class="text-center py-6">
        <div
          class="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4"
        >
          <span class="material-icons text-4xl text-green-500">check_circle</span>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {{ $t('booking.bookingSuccessTitle') }}
        </h3>
        <p class="text-gray-500 dark:text-slate-400 mb-4">
          {{
            paymentLinkResult
              ? $t('booking.creditCardOptions.paymentLinkSentDescription')
              : $t('booking.bookingSuccessDescription')
          }}
        </p>
        <div v-if="bookingResult" class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('booking.confirmationNumber') }}
          </p>
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {{ bookingResult.bookingNumber || bookingResult.confirmationNumber }}
          </p>
        </div>

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
                {{ formatPrice(paymentLinkResult.amount, paymentLinkResult.currency) }}
              </span>
            </span>
            <span class="text-gray-600 dark:text-slate-400">
              {{ $t('booking.creditCardOptions.expiresAt') }}:
              <span class="font-medium text-gray-900 dark:text-white">
                {{ formatExpiryDate(paymentLinkResult.expiresAt) }}
              </span>
            </span>
          </div>
          <div class="mt-3 flex gap-2">
            <button
              class="flex-1 btn-sm btn-secondary flex items-center justify-center"
              @click="copyPaymentLink"
            >
              <span class="material-icons text-sm mr-1">content_copy</span>
              {{ $t('booking.creditCardOptions.copyLink') }}
            </button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex flex-col sm:flex-row gap-3 w-full">
          <button class="flex-1 btn-primary" @click="handleViewBooking">
            {{ $t('booking.viewBooking') }}
          </button>
          <button class="flex-1 btn-secondary" @click="handleNewBooking">
            {{ $t('booking.newBooking') }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/booking'
import { useToast } from 'vue-toastification'
import PriceSummary from '@/components/booking/PriceSummary.vue'
import PaymentMethodSelect from '@/components/booking/checkout/PaymentMethodSelect.vue'
import CreditCardPaymentOptions from '@/components/booking/wizard/CreditCardPaymentOptions.vue'
import Modal from '@/components/common/Modal.vue'

const { t, locale } = useI18n()
const router = useRouter()
const bookingStore = useBookingStore()
const toast = useToast()

defineEmits(['go-back', 'edit-guests', 'proceed'])

// Form state
const specialRequests = ref('')
const termsAccepted = ref(false)
const isSubmitting = ref(false)

// Payment state
const paymentMethod = ref('cash')
const creditCardOption = ref('payment_link') // 'inline' or 'payment_link'
const sendPaymentLinkEmail = ref(true)
const sendPaymentLinkSms = ref(false)

// Modals
const showTerms = ref(false)
const showPrivacy = ref(false)
const showSuccess = ref(false)

// Booking result
const bookingResult = ref(null)
const paymentLinkResult = ref(null)

// Sync special requests with store
watch(specialRequests, value => {
  bookingStore.setSpecialRequests(value)
})

// Sync terms accepted with store
watch(termsAccepted, value => {
  bookingStore.setTermsAccepted(value)
})

// Format date range
const formatDateRange = computed(() => {
  const start = bookingStore.search.dateRange.start
  const end = bookingStore.search.dateRange.end
  if (!start || !end) return ''

  const formatDate = dateStr => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return `${formatDate(start)} - ${formatDate(end)}`
})

// Daily breakdown
const dailyBreakdown = computed(() => {
  const breakdown = []
  bookingStore.cart.forEach(room => {
    if (room.pricing?.dailyBreakdown) {
      room.pricing.dailyBreakdown.forEach(day => {
        const existing = breakdown.find(b => b.date === day.date)
        if (existing) {
          existing.price += day.finalPrice || day.price
          existing.originalPrice += day.originalPrice || day.price
          existing.discountAmount += day.discountAmount || 0
        } else {
          breakdown.push({
            date: day.date,
            price: day.finalPrice || day.price,
            originalPrice: day.originalPrice || day.price,
            discountAmount: day.discountAmount || 0
          })
        }
      })
    }
  })
  return breakdown.sort((a, b) => new Date(a.date) - new Date(b.date))
})

// Format price
const formatPrice = (amount, currency) => {
  if (!amount) return ''
  const formatter = new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency || 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
  return formatter.format(amount)
}

// Get room name
const getRoomName = roomType => {
  const name = roomType.name
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name || ''
}

// Get meal plan name
const getMealPlanName = mealPlan => {
  const name = mealPlan.name
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || mealPlan.code
  }
  return name || mealPlan.code
}

// Format guest name
const formatGuestName = guest => {
  if (!guest) return ''
  const titleMap = {
    mr: t('booking.titleMr'),
    mrs: t('booking.titleMrs'),
    ms: t('booking.titleMs')
  }
  const title = titleMap[guest.title] || ''
  return `${title} ${guest.firstName} ${guest.lastName}`.trim()
}

// Handle confirm
const handleConfirm = async () => {
  // Guard against multiple submissions
  if (isSubmitting.value) return

  if (!termsAccepted.value) {
    toast.error(t('booking.pleaseAcceptTerms'))
    return
  }

  if (!paymentMethod.value) {
    toast.error(t('booking.validation.paymentMethod'))
    return
  }

  isSubmitting.value = true

  try {
    // Handle credit card with payment link option
    if (paymentMethod.value === 'credit_card' && creditCardOption.value === 'payment_link') {
      const result = await bookingStore.createBookingWithPaymentLink({
        sendEmail: sendPaymentLinkEmail.value,
        sendSms: sendPaymentLinkSms.value
      })

      if (result) {
        bookingResult.value = result.booking
        paymentLinkResult.value = result.paymentLink
        showSuccess.value = true
      }
    } else {
      // Standard booking flow (cash, bank_transfer, or inline credit card)
      bookingStore.setPaymentMethod(paymentMethod.value)
      const result = await bookingStore.createBooking()

      if (result) {
        bookingResult.value = result
        paymentLinkResult.value = null
        showSuccess.value = true
      }
    }
  } catch (error) {
    toast.error(error.message || t('booking.bookingFailed'))
    isSubmitting.value = false
  }
}

// Format expiry date
const formatExpiryDate = dateStr => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Copy payment link to clipboard
const copyPaymentLink = async () => {
  if (!paymentLinkResult.value?.paymentUrl) return

  try {
    await navigator.clipboard.writeText(paymentLinkResult.value.paymentUrl)
    toast.success(t('booking.creditCardOptions.linkCopied'))
  } catch {
    toast.error(t('common.copyError'))
  }
}

// Handle view booking
const handleViewBooking = () => {
  showSuccess.value = false
  router.push(`/bookings/${bookingResult.value._id}`)
}

// Handle new booking
const handleNewBooking = () => {
  showSuccess.value = false
  bookingStore.resetWizard()
  router.push('/bookings/new')
}
</script>
