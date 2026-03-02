<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 mb-6">{{ $t('booking.roomSelection') }}</h2>

    <!-- Search form (inline) -->
    <div class="bg-gray-50 rounded-xl p-4 mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">{{
            $t('search.checkIn')
          }}</label>
          <input
            v-model="checkIn"
            type="date"
            :min="today"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">{{
            $t('search.checkOut')
          }}</label>
          <input
            v-model="checkOut"
            type="date"
            :min="checkIn || today"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">{{
            $t('search.adults')
          }}</label>
          <select
            v-model.number="adults"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="searchRooms"
            :disabled="searching || !checkIn || !checkOut"
            class="w-full py-2 bg-site-primary text-white rounded-lg text-sm font-medium hover:bg-site-primary-dark disabled:opacity-50 transition-colors"
          >
            {{ searching ? $t('common.loading') : $t('common.search') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="searching" class="space-y-4">
      <Skeleton v-for="i in 3" :key="i" height="120px" rounded="rounded-xl" />
    </div>

    <div v-else-if="availableRooms.length" class="space-y-4">
      <RoomCard
        v-for="room in availableRooms"
        :key="room.roomType.code"
        :room="room"
        :hotel-code="hotelCode"
        :check-in="checkIn"
        :check-out="checkOut"
        :adults="adults"
      />
    </div>

    <div v-else-if="searched">
      <EmptyState>
        <template #title>{{ $t('hotel.noRoomsAvailable') }}</template>
      </EmptyState>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ hotelCode: string }>()
const bookingStore = useBookingStore()
const { availableRooms, searching, searchAvailability } = useAvailabilitySearch()

const checkIn = ref(bookingStore.searchParams.checkIn || '')
const checkOut = ref(bookingStore.searchParams.checkOut || '')
const adults = ref(bookingStore.searchParams.adults || 2)
const searched = ref(false)

const today = computed(() => new Date().toISOString().split('T')[0])

async function searchRooms() {
  searched.value = true
  bookingStore.searchParams = {
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    adults: adults.value,
    children: []
  }
  await searchAvailability(props.hotelCode, {
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    adults: adults.value
  })
}

// Auto-search if params present
onMounted(() => {
  if (checkIn.value && checkOut.value) {
    searchRooms()
  }
})
</script>
