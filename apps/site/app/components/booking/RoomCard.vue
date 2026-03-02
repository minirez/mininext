<template>
  <div class="border border-gray-200 rounded-xl overflow-hidden">
    <div class="flex flex-col sm:flex-row">
      <!-- Room image -->
      <div class="sm:w-48 shrink-0">
        <img
          v-if="room.roomType.images?.[0]"
          :src="room.roomType.images[0].url || room.roomType.images[0]"
          :alt="room.roomType.name"
          class="w-full h-36 sm:h-full object-cover"
        />
        <div
          v-else
          class="w-full h-36 sm:h-full bg-gray-100 flex items-center justify-center text-gray-400"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0H21"
            />
          </svg>
        </div>
      </div>

      <!-- Room info -->
      <div class="flex-1 p-4">
        <h3 class="font-semibold text-gray-900 mb-1">{{ room.roomType.name }}</h3>
        <p v-if="room.roomType.description" class="text-sm text-gray-500 mb-3 line-clamp-2">
          {{ room.roomType.description }}
        </p>

        <!-- Meal plan options -->
        <div class="space-y-2">
          <div
            v-for="option in room.options"
            :key="option.mealPlan.code"
            class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
          >
            <div>
              <span class="text-sm font-medium text-gray-800">{{ option.mealPlan.name }}</span>
              <span v-if="option.availability" class="text-xs text-gray-500 ml-2">
                ({{ option.availability }} {{ $t('booking.availability') }})
              </span>
              <div v-if="option.cancellationPolicy?.freeCancellation" class="mt-0.5">
                <Badge variant="success" class="text-[10px]">{{
                  $t('hotel.freeCancellation')
                }}</Badge>
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-gray-900">
                {{ formatPrice(option.prices?.total || 0, option.prices?.currency || 'TRY') }}
              </div>
              <button
                @click="selectOption(option)"
                class="mt-1 text-xs font-medium text-site-primary hover:text-site-primary-dark"
              >
                {{ $t('booking.selectThisRoom') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  room: any
  hotelCode: string
  checkIn: string
  checkOut: string
  adults: number
}>()

const { formatPrice } = useCurrency()
const bookingStore = useBookingStore()

function selectOption(option: any) {
  bookingStore.selectRoom({
    roomTypeCode: props.room.roomType.code,
    roomTypeName: props.room.roomType.name,
    mealPlanCode: option.mealPlan.code,
    mealPlanName: option.mealPlan.name,
    price: option.prices,
    availability: option.availability,
    images: props.room.roomType.images || []
  })
}
</script>
