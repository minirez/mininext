<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ $t('booking.yourReservation') }}
      </h2>
      <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
        {{ $t('booking.cartDescription') }}
      </p>
    </div>

    <!-- Empty Cart -->
    <div
      v-if="bookingStore.cart.length === 0"
      class="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-xl"
    >
      <span class="material-icons text-5xl text-gray-300 dark:text-slate-600">shopping_cart</span>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        {{ $t('booking.cartEmpty') }}
      </h3>
      <p class="mt-2 text-gray-500 dark:text-slate-400">
        {{ $t('booking.cartEmptyDescription') }}
      </p>
      <button class="mt-4 btn-primary" @click="$emit('go-back')">
        <span class="material-icons mr-2">arrow_back</span>
        {{ $t('booking.selectRooms') }}
      </button>
    </div>

    <!-- Cart Items -->
    <div v-else class="space-y-4">
      <!-- Hotel Info -->
      <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 flex items-center space-x-4">
        <div
          class="w-16 h-16 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0"
        >
          <span class="material-icons text-purple-500 text-2xl">hotel</span>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ bookingStore.search.hotel?.name || bookingStore.availability.hotel?.name }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-slate-400">
            {{ formatDateRange }} &bull; {{ bookingStore.nights }} {{ $t('booking.nights') }}
          </p>
        </div>
      </div>

      <!-- Room Cards -->
      <div class="space-y-4">
        <div
          v-for="(item, index) in bookingStore.cart"
          :key="index"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start space-x-4">
              <!-- Room Image -->
              <div
                class="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 flex-shrink-0"
              >
                <img
                  v-if="item.roomType.images?.[0]?.url"
                  :src="item.roomType.images[0].url"
                  :alt="getRoomName(item.roomType)"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <span class="material-icons text-gray-400">bed</span>
                </div>
              </div>

              <!-- Room Info -->
              <div>
                <h4 class="font-semibold text-gray-900 dark:text-white">
                  {{ getRoomName(item.roomType) }}
                </h4>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ getMealPlanName(item.mealPlan) }}
                </p>
                <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  {{ item.adults }} {{ $t('booking.adults') }}
                  <span v-if="item.children?.length > 0">
                    + {{ item.children.length }} {{ $t('booking.children') }}
                  </span>
                </p>

                <!-- Campaigns -->
                <div v-if="item.campaigns?.length" class="mt-2 flex flex-wrap gap-1">
                  <span
                    v-for="campaign in item.campaigns"
                    :key="campaign.code"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  >
                    {{ campaign.discountText || campaign.name }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Price & Remove -->
            <div class="text-right">
              <p v-if="item.pricing?.totalDiscount > 0" class="text-sm text-gray-400 line-through">
                {{ formatPrice(item.pricing.originalTotal, item.pricing.currency) }}
              </p>
              <p class="text-lg font-bold text-purple-600 dark:text-purple-400">
                {{ formatPrice(item.pricing?.finalTotal, item.pricing?.currency) }}
              </p>
              <button
                class="mt-2 text-red-500 hover:text-red-600 text-sm flex items-center"
                @click="removeRoom(index)"
              >
                <span class="material-icons text-sm mr-1">delete</span>
                {{ $t('common.remove') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Another Room -->
      <button
        class="w-full border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 text-gray-500 dark:text-slate-400 hover:border-purple-400 hover:text-purple-500 transition-colors flex items-center justify-center"
        @click="$emit('go-back')"
      >
        <span class="material-icons mr-2">add</span>
        {{ $t('booking.addAnotherRoom') }}
      </button>

      <!-- Cancellation Guarantee Package -->
      <div
        v-if="showGuarantee"
        class="bg-white dark:bg-slate-800 rounded-xl border-2 transition-all cursor-pointer p-4"
        :class="
          bookingStore.cancellationGuarantee
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-slate-600'
        "
        @click="bookingStore.cancellationGuarantee = !bookingStore.cancellationGuarantee"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
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
                <span class="material-icons text-blue-600 text-lg">verified_user</span>
                <span class="font-semibold text-gray-800 dark:text-white text-sm">
                  {{ $t('booking.cancellationGuarantee') }}
                  ({{ bookingStore.cancellationGuaranteeConfig?.rate }}%)
                </span>
              </div>
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {{ $t('planning.markets.guaranteePackageDescription') }}
              </p>
            </div>
          </div>
          <div v-if="bookingStore.cancellationGuarantee" class="text-right">
            <span class="text-sm font-bold text-blue-600 dark:text-blue-400">
              +{{ formatPrice(bookingStore.guaranteeAmount, bookingStore.currency) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Price Summary -->
      <PriceSummary
        :subtotal="bookingStore.subtotal"
        :discount="bookingStore.totalDiscount"
        :total="bookingStore.grandTotalWithGuarantee"
        :currency="bookingStore.currency"
        :nights="bookingStore.nights"
        :campaigns="bookingStore.appliedCampaigns"
        :cancellation-guarantee="
          bookingStore.cancellationGuarantee
            ? {
                purchased: true,
                rate: bookingStore.cancellationGuaranteeConfig?.rate,
                amount: bookingStore.guaranteeAmount
              }
            : null
        "
      />

      <!-- Continue Button -->
      <div class="flex justify-end pt-4">
        <button class="btn-primary px-8 py-3" @click="$emit('proceed')">
          {{ $t('booking.continueToGuests') }}
          <span class="material-icons ml-2">arrow_forward</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookingStore } from '@/stores/booking'
import PriceSummary from '@/components/booking/PriceSummary.vue'

const { locale } = useI18n()
const bookingStore = useBookingStore()

defineEmits(['go-back', 'proceed'])

// Show guarantee if config enabled and no non-refundable only rate
const showGuarantee = computed(() => {
  if (!bookingStore.cancellationGuaranteeConfig?.enabled) return false
  // Hide if all cart items are non-refundable
  const allNonRefundable = bookingStore.cart.every(item => item.rateType === 'non_refundable')
  return !allNonRefundable
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

// Remove room
const removeRoom = index => {
  bookingStore.removeFromCart(index)
}
</script>
