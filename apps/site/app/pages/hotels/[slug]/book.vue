<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Step indicator -->
    <div class="flex items-center justify-center gap-2 mb-8">
      <template v-for="s in 4" :key="s">
        <div
          class="flex items-center gap-2"
          :class="s <= bookingStore.step ? 'text-site-primary' : 'text-gray-400'"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2"
            :class="
              s < bookingStore.step
                ? 'bg-site-primary border-site-primary text-white'
                : s === bookingStore.step
                  ? 'border-site-primary text-site-primary'
                  : 'border-gray-300 text-gray-400'
            "
          >
            <svg
              v-if="s < bookingStore.step"
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span v-else>{{ s }}</span>
          </div>
          <span class="hidden sm:inline text-sm font-medium">{{ $t(`booking.step${s}`) }}</span>
        </div>
        <div v-if="s < 4" class="w-8 sm:w-16 h-px bg-gray-300" />
      </template>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main content -->
      <div class="lg:col-span-2">
        <!-- Step 1: Room Selection -->
        <RoomSelector v-if="bookingStore.step === 1" :hotel-code="slug" />

        <!-- Step 2: Guest Form -->
        <GuestForm v-else-if="bookingStore.step === 2" />

        <!-- Step 3: Payment -->
        <PaymentForm v-else-if="bookingStore.step === 3" :hotel-code="slug" />

        <!-- Step 4: Confirmation -->
        <BookingConfirmation v-else-if="bookingStore.step === 4" />
      </div>

      <!-- Sidebar: Booking Summary -->
      <aside v-if="bookingStore.step < 4">
        <BookingSummary :hotel-code="slug" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'booking' })

const route = useRoute()
const slug = route.params.slug as string
const bookingStore = useBookingStore()

// Reset booking state when entering
onMounted(() => {
  // Parse search params from query
  if (route.query.checkIn) bookingStore.searchParams.checkIn = route.query.checkIn as string
  if (route.query.checkOut) bookingStore.searchParams.checkOut = route.query.checkOut as string
  if (route.query.adults) bookingStore.searchParams.adults = Number(route.query.adults)
})

const { t: $t } = useI18n()

// SEO
useSeo({
  title: $t('booking.title'),
  noindex: true
})
</script>
