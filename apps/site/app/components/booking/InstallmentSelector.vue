<template>
  <div>
    <h4 class="text-sm font-medium text-gray-700 mb-2">{{ $t('booking.installments') }}</h4>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <button
        v-for="opt in bookingStore.installmentOptions"
        :key="opt"
        @click="bookingStore.installment = opt"
        class="px-3 py-2 border rounded-lg text-sm text-center transition-colors"
        :class="
          bookingStore.installment === opt
            ? 'border-site-primary bg-site-primary/5 text-site-primary font-medium'
            : 'border-gray-200 text-gray-700 hover:border-gray-300'
        "
      >
        {{ opt === 1 ? $t('booking.singlePayment') : $t('booking.installmentCount', { n: opt }) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const bookingStore = useBookingStore()
</script>
