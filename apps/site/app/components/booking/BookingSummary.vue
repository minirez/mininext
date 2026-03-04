<template>
  <div class="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
    <h3 class="font-semibold text-gray-900 mb-4">{{ $t('booking.summary') }}</h3>

    <!-- Cart items -->
    <div v-if="bookingStore.cart.length" class="space-y-3 text-sm">
      <!-- Room list -->
      <div
        v-for="(item, idx) in bookingStore.cart"
        :key="item.id"
        class="pb-3"
        :class="{ 'border-b border-gray-100': idx < bookingStore.cart.length - 1 }"
      >
        <div class="font-medium text-gray-800">{{ item.roomTypeName }}</div>
        <div class="text-gray-500 text-xs mt-0.5">{{ item.mealPlanName }}</div>
        <div class="flex justify-between mt-1">
          <span class="text-gray-400 text-xs">
            {{ item.guests.adults }} {{ $t('search.adults') }}
          </span>
          <span class="font-medium text-gray-700">
            {{
              formatPrice(
                item.price?.finalTotal || item.price?.total || 0,
                item.price?.currency || 'TRY'
              )
            }}
          </span>
        </div>
      </div>

      <!-- Dates -->
      <div v-if="bookingStore.searchParams.checkIn" class="flex justify-between">
        <span class="text-gray-600">{{ $t('search.checkIn') }}</span>
        <span>{{ bookingStore.searchParams.checkIn }}</span>
      </div>
      <div v-if="bookingStore.searchParams.checkOut" class="flex justify-between">
        <span class="text-gray-600">{{ $t('search.checkOut') }}</span>
        <span>{{ bookingStore.searchParams.checkOut }}</span>
      </div>

      <div class="border-t border-gray-200 pt-3 mt-3">
        <!-- Subtotal -->
        <div class="flex justify-between">
          <span class="text-gray-600">{{ $t('booking.subtotal') }}</span>
          <span>{{
            formatPrice(bookingStore.cartTotal.amount, bookingStore.cartTotal.currency)
          }}</span>
        </div>

        <!-- Discount -->
        <div v-if="bookingStore.promoDiscount" class="flex justify-between text-green-600">
          <span>{{ $t('booking.discount') }}</span>
          <span
            >-{{ formatPrice(bookingStore.promoDiscount, bookingStore.cartTotal.currency) }}</span
          >
        </div>

        <!-- Cancellation Guarantee -->
        <div
          v-if="bookingStore.cancellationGuaranteeConfig?.enabled"
          class="mt-3 pt-3 border-t border-gray-100"
        >
          <label class="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              v-model="bookingStore.cancellationGuarantee"
              class="mt-0.5 w-4 h-4 text-site-primary border-gray-300 rounded focus:ring-site-primary"
            />
            <div class="flex-1">
              <div class="flex items-center gap-1.5">
                <svg
                  class="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
                <span
                  class="text-sm font-medium text-gray-800 group-hover:text-site-primary transition-colors"
                >
                  {{ $t('booking.cancellationGuarantee') }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ $t('booking.cancellationGuaranteeDesc') }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                %{{ bookingStore.cancellationGuaranteeConfig.rate }} ·
                {{ formatPrice(bookingStore.guaranteeAmount, bookingStore.cartTotal.currency) }}
              </p>
            </div>
          </label>
        </div>

        <!-- Guarantee amount if selected -->
        <div
          v-if="bookingStore.guaranteeAmount > 0"
          class="flex justify-between mt-2 text-blue-600"
        >
          <span>{{ $t('booking.cancellationGuarantee') }}</span>
          <span
            >+{{ formatPrice(bookingStore.guaranteeAmount, bookingStore.cartTotal.currency) }}</span
          >
        </div>

        <!-- Total -->
        <div class="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-200">
          <span>{{ $t('common.total') }}</span>
          <span class="text-site-primary">
            {{ formatPrice(totalPrice, bookingStore.cartTotal.currency) }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="text-sm text-gray-500">
      {{ $t('hotel.selectRoom') }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ hotelCode: string }>()
const { t: $t } = useI18n()
const bookingStore = useBookingStore()
const { formatPrice } = useCurrency()

const totalPrice = computed(() => {
  return bookingStore.cartTotal.amount - bookingStore.promoDiscount + bookingStore.guaranteeAmount
})
</script>
