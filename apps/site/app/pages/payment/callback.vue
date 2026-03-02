<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full text-center">
      <!-- Loading -->
      <div v-if="loading">
        <div
          class="animate-spin w-12 h-12 border-4 border-site-primary border-t-transparent rounded-full mx-auto mb-4"
        />
        <p class="text-gray-600">{{ $t('common.loading') }}</p>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'">
        <div
          class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ $t('payment.success') }}</h1>
        <NuxtLink
          v-if="bookingNumber"
          :to="`/booking/${bookingNumber}`"
          class="inline-flex mt-4 px-6 py-2 bg-site-primary text-white rounded-lg"
        >
          {{ $t('booking.confirmation.details') }}
        </NuxtLink>
      </div>

      <!-- Failed -->
      <div v-else>
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ $t('payment.failed') }}</h1>
        <p class="text-gray-500">{{ $t('payment.failedDesc') }}</p>
        <NuxtLink to="/" class="inline-flex mt-4 px-6 py-2 border border-gray-300 rounded-lg">
          {{ $t('error.backHome') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const route = useRoute()
const bookingNumber = (route.query.bookingNumber as string) || ''
const email = (route.query.email as string) || ''

const loading = ref(true)
const status = ref<'success' | 'failed' | 'pending'>('pending')

onMounted(async () => {
  if (!bookingNumber || !email) {
    status.value = 'failed'
    loading.value = false
    return
  }

  try {
    const { getPaymentStatus } = usePaymentApi()
    const result = await getPaymentStatus(bookingNumber, email)
    status.value =
      result?.status === 'success' || result?.status === 'completed' ? 'success' : 'failed'
  } catch {
    status.value = 'failed'
  } finally {
    loading.value = false
  }
})
</script>
