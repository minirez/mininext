<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 mb-6">{{ $t('booking.yourRooms') }}</h2>

    <!-- Empty cart -->
    <div
      v-if="!bookingStore.cart.length"
      class="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center"
    >
      <svg
        class="w-10 h-10 text-gray-300 mx-auto mb-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="1.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
        />
      </svg>
      <p class="text-gray-500 text-sm mb-4">{{ $t('booking.emptyCart') }}</p>
      <button
        @click="goBackToHotel"
        class="px-4 py-2 bg-site-primary text-white text-sm font-medium rounded-lg hover:bg-site-primary-dark transition-colors"
      >
        {{ $t('booking.selectRoomsFirst') }}
      </button>
    </div>

    <!-- Cart items -->
    <div v-else class="space-y-3">
      <div
        v-for="(item, idx) in bookingStore.cart"
        :key="item.id"
        class="bg-white border border-gray-200 rounded-xl p-4"
      >
        <div class="flex items-start gap-4">
          <!-- Room image -->
          <img
            v-if="item.images?.[0]"
            :src="item.images[0].url || item.images[0]"
            :alt="item.roomTypeName"
            class="w-20 h-16 object-cover rounded-lg shrink-0"
          />
          <div
            v-else
            class="w-20 h-16 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center"
          >
            <svg
              class="w-6 h-6 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1"
                d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0H21"
              />
            </svg>
          </div>

          <!-- Room info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h4 class="font-semibold text-gray-900 text-sm">
                  {{ idx + 1 }}. {{ item.roomTypeName }}
                </h4>
                <p class="text-xs text-gray-500 mt-0.5">{{ item.mealPlanName }}</p>
                <p class="text-xs text-gray-400 mt-1">
                  {{ item.guests.adults }} {{ $t('search.adults') }}
                  <template v-if="item.guests.children?.length">
                    , {{ item.guests.children.length }} {{ $t('search.children') }}
                  </template>
                </p>
              </div>
              <div class="text-right shrink-0">
                <p class="font-bold text-gray-900 text-sm">
                  {{
                    formatPrice(
                      item.price?.finalTotal || item.price?.total || 0,
                      item.price?.currency || 'TRY'
                    )
                  }}
                </p>
                <button
                  @click="bookingStore.removeFromCart(item.id)"
                  class="text-xs text-red-500 hover:text-red-700 font-medium mt-1"
                >
                  {{ $t('booking.removeFromCart') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Total -->
      <div class="border-t border-gray-200 pt-4 mt-4">
        <div class="flex justify-between items-center">
          <span class="font-semibold text-gray-900">{{ $t('common.total') }}</span>
          <span class="text-lg font-bold text-site-primary">
            {{ formatPrice(bookingStore.cartTotal.amount, bookingStore.cartTotal.currency) }}
          </span>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between pt-4">
        <button
          @click="goBackToHotel"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {{ $t('booking.addAnotherRoom') }}
        </button>
        <button
          @click="bookingStore.goToStep(2)"
          class="px-6 py-2.5 bg-site-primary text-white text-sm font-semibold rounded-lg hover:bg-site-primary-dark transition-colors"
        >
          {{ $t('booking.step2') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ hotelCode: string }>()
const bookingStore = useBookingStore()
const { formatPrice } = useCurrency()
const { t: $t } = useI18n()

function goBackToHotel() {
  navigateTo(`/hotels/${props.hotelCode}`)
}
</script>
