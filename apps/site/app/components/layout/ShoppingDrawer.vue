<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="ui.cartDrawerOpen"
        class="fixed inset-0 bg-black/50 z-[9998]"
        @click="ui.cartDrawerOpen = false"
      />
    </Transition>

    <!-- Drawer -->
    <div
      class="fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-white z-[9999] flex flex-col shadow-[-4px_0_20px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out"
      :class="ui.cartDrawerOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h4 class="text-xl font-medium text-gray-900">{{ $t('cart.title') }}</h4>
          <button
            @click="ui.cartDrawerOpen = false"
            class="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div v-if="cart.totalItems > 0" class="text-sm text-gray-500 mt-1">
          {{ $t('cart.itemCount', { count: cart.totalItems }) }}
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Empty state -->
        <div
          v-if="cart.items.length === 0 && bookingStore.cart.length === 0"
          class="px-6 py-16 text-center"
        >
          <div
            class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5"
          >
            <svg
              class="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-5.98.572m5.98-.572h9m-9 0a3 3 0 01-5.98.572M17.25 14.25a3 3 0 005.98.572m-5.98-.572h-9m9 0a3 3 0 015.98.572M3.75 4.863l.75 9.75a1.5 1.5 0 001.5 1.387h9a1.5 1.5 0 001.5-1.387l.75-9.75"
              />
            </svg>
          </div>
          <h5 class="text-lg font-medium text-gray-900 mb-2">{{ $t('cart.emptyTitle') }}</h5>
          <p class="text-sm text-gray-500">{{ $t('cart.emptyMessage') }}</p>
        </div>

        <!-- Hotel booking items -->
        <div v-if="bookingStore.cart.length > 0" class="px-6 py-4">
          <div
            v-for="item in bookingStore.cart"
            :key="item.id"
            class="pb-4 mb-4 border-b border-gray-100 last:border-b-0"
          >
            <div class="flex gap-3">
              <div class="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                <img
                  v-if="item.images?.[0]"
                  :src="item.images[0]?.url || item.images[0]"
                  :alt="item.roomTypeName"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h6 class="text-sm font-medium text-gray-900 line-clamp-1">
                      {{ bookingStore.hotel?.name }}
                    </h6>
                    <p class="text-xs text-gray-500 mt-0.5">{{ item.roomTypeName }}</p>
                    <p class="text-xs text-gray-500">{{ item.mealPlanName }}</p>
                  </div>
                  <button
                    @click="bookingStore.removeFromCart(item.id)"
                    class="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0"
                  >
                    <svg
                      class="w-3.5 h-3.5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-sm font-medium text-site-primary">
                    {{
                      formatPrice(
                        item.price?.finalTotal || item.price?.total || 0,
                        item.price?.currency || 'TRY'
                      )
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- General cart items (tours, flights, etc.) -->
        <div v-if="cart.items.length > 0" class="px-6 py-4">
          <div
            v-for="item in cart.items"
            :key="item.id"
            class="pb-4 mb-4 border-b border-gray-100 last:border-b-0"
          >
            <div class="flex gap-3">
              <div class="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <svg
                    class="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                    />
                  </svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h6 class="text-sm font-medium text-gray-900 line-clamp-1">{{ item.title }}</h6>
                    <p v-if="item.location" class="text-xs text-gray-500 mt-0.5">
                      {{ item.location }}
                    </p>
                    <p v-if="item.duration" class="text-xs text-gray-500">{{ item.duration }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">
                      {{ item.guests.adults }} {{ $t('search.adults') }}
                      <template v-if="item.guests.children > 0"
                        >, {{ item.guests.children }} {{ $t('search.children') }}</template
                      >
                    </p>
                  </div>
                  <button
                    @click="cart.removeItem(item.id)"
                    class="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0"
                  >
                    <svg
                      class="w-3.5 h-3.5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-sm font-medium text-site-primary">
                    {{ formatPrice(item.totalPrice, item.currency) }}
                  </span>
                  <span v-if="item.pricePerPerson" class="text-xs text-gray-500">
                    {{ formatPrice(item.pricePerPerson, item.currency) }} /
                    {{ $t('common.person') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        v-if="cart.items.length > 0 || bookingStore.cart.length > 0"
        class="px-6 py-5 border-t border-gray-100 bg-gray-50"
      >
        <div class="flex items-center justify-between mb-4">
          <span class="font-medium text-gray-900">{{ $t('cart.total') }}</span>
          <span class="text-xl font-semibold text-site-primary">
            {{ formatPrice(grandTotal, grandCurrency) }}
          </span>
        </div>
        <button
          @click="proceedToCheckout"
          class="w-full h-12 bg-site-primary text-white font-medium rounded-lg hover:bg-site-primary-dark transition-colors flex items-center justify-center gap-2"
        >
          {{ $t('cart.checkout') }}
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
            />
          </svg>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const ui = useUiStore()
const cart = useCartStore()
const bookingStore = useBookingStore()
const router = useRouter()
const { locale } = useI18n()

function formatPrice(amount: number, currency: string): string {
  if (!amount) return ''
  try {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

const grandTotal = computed(() => {
  const cartTotal = cart.totalPrice
  const bookingTotal = bookingStore.cartTotal.amount
  return cartTotal + bookingTotal
})

const grandCurrency = computed(() => {
  return cart.currency || bookingStore.cartTotal.currency || 'TRY'
})

function proceedToCheckout() {
  ui.cartDrawerOpen = false

  if (bookingStore.cart.length > 0 && bookingStore.hotel) {
    const slug = bookingStore.hotel.slug || bookingStore.hotel.hotelCode
    if (slug) {
      router.push(`/hotels/${slug}/book`)
      return
    }
  }

  // For tours or other items, just close the drawer for now
}

onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && ui.cartDrawerOpen) {
      ui.cartDrawerOpen = false
    }
  }
  document.addEventListener('keydown', handleEscape)
  onUnmounted(() => document.removeEventListener('keydown', handleEscape))
})

watch(
  () => ui.cartDrawerOpen,
  open => {
    if (import.meta.client) {
      document.body.style.overflow = open ? 'hidden' : ''
    }
  }
)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
