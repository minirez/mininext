<template>
  <Transition name="slide-up">
    <div
      v-if="bookingStore.cart.length > 0"
      class="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
    >
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4"
      >
        <!-- Cart info -->
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="flex items-center justify-center w-10 h-10 bg-site-primary/10 rounded-full shrink-0"
          >
            <svg
              class="w-5 h-5 text-site-primary"
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
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900">
              {{ $t('booking.cartItems', { n: bookingStore.cart.length }) }}
            </p>
            <p class="text-xs text-gray-500 truncate">
              {{ bookingStore.cart.map(i => i.roomTypeName).join(', ') }}
            </p>
          </div>
        </div>

        <!-- Total + CTA -->
        <div class="flex items-center gap-4 shrink-0">
          <div class="text-right hidden sm:block">
            <p class="text-xs text-gray-500">{{ $t('common.total') }}</p>
            <p class="text-lg font-bold text-gray-900">
              {{ formatPrice(bookingStore.cartTotal.amount, bookingStore.cartTotal.currency) }}
            </p>
          </div>
          <button
            @click="goToBooking"
            class="px-5 py-2.5 bg-site-primary text-white text-sm font-semibold rounded-xl hover:bg-site-primary-dark transition-colors whitespace-nowrap"
          >
            {{ $t('booking.continueToBooking') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{ hotelCode: string }>()
const bookingStore = useBookingStore()
const { formatPrice } = useCurrency()
const { t: $t } = useI18n()

function goToBooking() {
  bookingStore.step = 1
  navigateTo(`/hotels/${props.hotelCode}/book`)
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
