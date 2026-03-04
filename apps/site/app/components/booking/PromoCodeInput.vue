<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4">
    <div class="flex gap-2">
      <input
        v-model="bookingStore.promoCode"
        type="text"
        :placeholder="$t('booking.promoCode')"
        :disabled="bookingStore.promoApplied"
        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-site-primary focus:border-site-primary disabled:bg-gray-100"
      />
      <button
        v-if="!bookingStore.promoApplied"
        @click="applyPromoCode"
        :disabled="!bookingStore.promoCode || applying"
        class="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {{ applying ? '...' : $t('booking.applyPromo') }}
      </button>
      <button
        v-else
        @click="removePromo"
        class="px-4 py-2 text-red-600 text-sm border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
      >
        {{ $t('booking.removePromo') }}
      </button>
    </div>
    <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
    <p v-if="bookingStore.promoApplied" class="text-xs text-green-600 mt-1">
      {{ $t('booking.discount') }}: -{{
        formatPrice(bookingStore.promoDiscount, bookingStore.cartTotal.currency || 'TRY')
      }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ hotelCode: string }>()
const emit = defineEmits<{ applied: [] }>()
const bookingStore = useBookingStore()
const { applyPromo } = usePricing()
const { formatPrice } = useCurrency()

const applying = ref(false)
const error = ref('')

async function applyPromoCode() {
  applying.value = true
  error.value = ''
  try {
    const result = await applyPromo(props.hotelCode, {
      code: bookingStore.promoCode,
      checkIn: bookingStore.searchParams.checkIn,
      checkOut: bookingStore.searchParams.checkOut,
      roomTypeCode: bookingStore.selectedRoom?.roomTypeCode || '',
      mealPlanCode: bookingStore.selectedRoom?.mealPlanCode || ''
    })
    if (result) {
      bookingStore.promoApplied = true
      bookingStore.promoDiscount = result.discount || 0
      emit('applied')
    } else {
      error.value = 'Invalid promo code'
    }
  } catch {
    error.value = 'Invalid promo code'
  } finally {
    applying.value = false
  }
}

function removePromo() {
  bookingStore.promoApplied = false
  bookingStore.promoDiscount = 0
  bookingStore.promoCode = ''
}
</script>
