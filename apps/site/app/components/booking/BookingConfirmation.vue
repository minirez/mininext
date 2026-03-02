<template>
  <div class="max-w-lg mx-auto text-center py-8">
    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <h2 class="text-2xl font-bold text-gray-900 mb-2">
      {{ $t('booking.confirmation.title') }}
    </h2>

    <div v-if="bookingStore.bookingResult" class="space-y-4 mt-6">
      <div class="bg-gray-50 rounded-xl p-6 text-left">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-gray-500">{{ $t('booking.confirmation.bookingNumber') }}</dt>
            <dd class="font-bold text-lg text-site-primary">
              {{ bookingStore.bookingResult.bookingNumber }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">{{ $t('common.total') }}</dt>
            <dd class="font-bold text-lg">
              {{
                formatPrice(
                  bookingStore.bookingResult.totalPrice || 0,
                  bookingStore.bookingResult.currency || 'TRY'
                )
              }}
            </dd>
          </div>
        </div>
      </div>

      <p class="text-gray-600 text-sm">
        {{ $t('booking.confirmation.emailSent', { email: bookingStore.contact.email }) }}
      </p>

      <div class="flex justify-center gap-4 mt-6">
        <NuxtLink
          to="/"
          class="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {{ $t('error.backHome') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const bookingStore = useBookingStore()
const { formatPrice } = useCurrency()
</script>
