<template>
  <div class="max-w-3xl mx-auto px-4 py-12">
    <!-- Lookup form -->
    <div v-if="!booking" class="max-w-md mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 mb-6 text-center">
        {{ $t('booking.lookup.title') }}
      </h1>
      <form @submit.prevent="lookupBooking" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{
            $t('booking.lookup.bookingNumber')
          }}</label>
          <input
            v-model="bookingNum"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{
            $t('booking.lookup.email')
          }}</label>
          <input
            v-model="emailInput"
            type="email"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 bg-site-primary text-white rounded-lg font-medium hover:bg-site-primary-dark disabled:opacity-50 transition-colors"
        >
          {{ loading ? $t('common.loading') : $t('booking.lookup.query') }}
        </button>
        <p v-if="error" class="text-sm text-red-500 text-center">{{ error }}</p>
      </form>
    </div>

    <!-- Booking details -->
    <div v-else class="space-y-6">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('booking.confirmation.details') }}</h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ $t('booking.confirmation.bookingNumber') }}: {{ booking.bookingNumber }}
        </p>
      </div>

      <div class="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-gray-500">Status</dt>
            <dd class="font-medium">
              <Badge :variant="booking.status === 'confirmed' ? 'success' : 'warning'">
                {{ booking.status }}
              </Badge>
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">{{ $t('common.total') }}</dt>
            <dd class="font-bold text-lg">
              {{ formatPrice(booking.totalPrice, booking.currency) }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">{{ $t('search.checkIn') }}</dt>
            <dd>{{ booking.checkIn }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">{{ $t('search.checkOut') }}</dt>
            <dd>{{ booking.checkOut }}</dd>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getBooking } = useBookingApi()
const { formatPrice } = useCurrency()

const bookingNum = ref((route.params.bookingNumber as string) || '')
const emailInput = ref((route.query.email as string) || '')
const booking = ref<any>(null)
const loading = ref(false)
const error = ref('')

async function lookupBooking() {
  loading.value = true
  error.value = ''
  try {
    booking.value = await getBooking(bookingNum.value, emailInput.value)
  } catch (err: any) {
    error.value = err?.message || 'Booking not found'
  } finally {
    loading.value = false
  }
}

// Auto-lookup if params present
onMounted(() => {
  if (bookingNum.value && emailInput.value) {
    lookupBooking()
  }
})

const { t: $t } = useI18n()
useSeo({ title: $t('booking.lookup.title'), noindex: true })
</script>
