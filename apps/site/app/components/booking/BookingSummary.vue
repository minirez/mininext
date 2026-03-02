<template>
  <div class="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
    <h3 class="font-semibold text-gray-900 mb-4">{{ $t('booking.summary') }}</h3>

    <!-- Room info -->
    <div v-if="bookingStore.selectedRoom" class="space-y-3 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-600">{{ bookingStore.selectedRoom.roomTypeName }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-600">{{ bookingStore.selectedRoom.mealPlanName }}</span>
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
      <div class="flex justify-between">
        <span class="text-gray-600">{{ $t('search.guests') }}</span>
        <span>{{ bookingStore.searchParams.adults }} {{ $t('search.adults') }}</span>
      </div>

      <div class="border-t border-gray-200 pt-3 mt-3">
        <!-- Subtotal -->
        <div class="flex justify-between">
          <span class="text-gray-600">{{ $t('booking.subtotal') }}</span>
          <span>{{
            formatPrice(
              bookingStore.selectedRoom.price?.total || 0,
              bookingStore.selectedRoom.price?.currency || 'TRY'
            )
          }}</span>
        </div>

        <!-- Discount -->
        <div v-if="bookingStore.promoDiscount" class="flex justify-between text-green-600">
          <span>{{ $t('booking.discount') }}</span>
          <span
            >-{{
              formatPrice(
                bookingStore.promoDiscount,
                bookingStore.selectedRoom.price?.currency || 'TRY'
              )
            }}</span
          >
        </div>

        <!-- Total -->
        <div class="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-200">
          <span>{{ $t('common.total') }}</span>
          <span class="text-site-primary">
            {{ formatPrice(totalPrice, bookingStore.selectedRoom.price?.currency || 'TRY') }}
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
const bookingStore = useBookingStore()
const { formatPrice } = useCurrency()

const totalPrice = computed(() => {
  const base = bookingStore.selectedRoom?.price?.total || 0
  return base - bookingStore.promoDiscount
})
</script>
