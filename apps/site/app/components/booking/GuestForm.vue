<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 mb-6">{{ $t('booking.guestInfo') }}</h2>

    <form @submit.prevent="goToPayment" class="space-y-6">
      <!-- Contact info -->
      <div class="bg-white border border-gray-200 rounded-xl p-6">
        <h3 class="font-semibold text-gray-800 mb-4">{{ $t('booking.contactInfo') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.firstName') }} *</label
            >
            <input
              v-model="bookingStore.contact.firstName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.lastName') }} *</label
            >
            <input
              v-model="bookingStore.contact.lastName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.email') }} *</label
            >
            <input
              v-model="bookingStore.contact.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.phone') }} *</label
            >
            <input
              v-model="bookingStore.contact.phone"
              type="tel"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary"
            />
          </div>
        </div>
      </div>

      <!-- Special requests -->
      <div class="bg-white border border-gray-200 rounded-xl p-6">
        <label class="block text-sm font-medium text-gray-700 mb-1">{{
          $t('booking.specialRequests')
        }}</label>
        <textarea
          v-model="bookingStore.specialRequests"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary"
        />
      </div>

      <!-- Navigation -->
      <div class="flex justify-between">
        <button
          type="button"
          @click="bookingStore.goToStep(1)"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {{ $t('common.back') }}
        </button>
        <button
          type="submit"
          class="px-6 py-2 bg-site-primary text-white rounded-lg text-sm font-medium hover:bg-site-primary-dark transition-colors"
        >
          {{ $t('common.next') }}: {{ $t('booking.payment') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const bookingStore = useBookingStore()

function goToPayment() {
  if (
    !bookingStore.contact.firstName ||
    !bookingStore.contact.lastName ||
    !bookingStore.contact.email ||
    !bookingStore.contact.phone
  ) {
    return
  }
  bookingStore.goToStep(3)
}
</script>
