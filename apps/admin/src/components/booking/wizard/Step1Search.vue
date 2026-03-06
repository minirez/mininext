<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ $t('booking.wizard.searchTitle') }}
      </h2>
      <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
        {{ $t('booking.wizard.searchDescription') }}
      </p>
    </div>

    <!-- Hotel Selection -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700"
    >
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {{ $t('booking.wizard.selectHotel') }} *
      </label>
      <div class="relative">
        <select
          :value="bookingStore.search.hotelId"
          class="form-input w-full pr-10"
          :disabled="hotelsLoading"
          @change="onHotelChange($event.target.value)"
        >
          <option value="">{{ $t('booking.wizard.selectHotelPlaceholder') }}</option>
          <option v-for="hotel in hotels" :key="hotel._id" :value="hotel._id">
            {{ hotel.name }} - {{ hotel.city }}
            <span v-if="hotel.stars">({{ hotel.stars }}★)</span>
          </option>
        </select>
        <span v-if="hotelsLoading" class="absolute right-3 top-1/2 -translate-y-1/2">
          <span class="material-icons animate-spin text-gray-400">refresh</span>
        </span>
      </div>

      <!-- Selected Hotel Info -->
      <div
        v-if="selectedHotel"
        class="mt-4 flex items-start space-x-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4"
      >
        <img
          v-if="selectedHotel.image"
          :src="selectedHotel.image"
          :alt="selectedHotel.name"
          class="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
        <div
          v-else
          class="w-20 h-20 rounded-lg bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0"
        >
          <span class="material-icons text-gray-400">hotel</span>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">{{ selectedHotel.name }}</h3>
          <p class="text-sm text-gray-600 dark:text-slate-400">{{ selectedHotel.city }}</p>
          <div v-if="selectedHotel.stars" class="flex items-center mt-1">
            <span
              v-for="n in selectedHotel.stars"
              :key="n"
              class="material-icons text-yellow-400 text-sm"
              >star</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Date Selection -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700"
    >
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {{ $t('booking.wizard.selectDates') }} *
      </label>
      <DateRangePicker v-model="dateRangeModel" :min-date="minDateObj" />

      <!-- Date Summary -->
      <div
        v-if="bookingStore.nights > 0"
        class="mt-4 flex items-center text-sm text-gray-600 dark:text-slate-400"
      >
        <span class="material-icons text-purple-500 mr-2">nights_stay</span>
        {{ bookingStore.nights }} {{ $t('booking.nights') }}
      </div>
    </div>

    <!-- Guest Selection -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700"
    >
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">
        {{ $t('booking.wizard.selectGuests') }} *
      </label>
      <GuestCountSelector
        :adults="bookingStore.search.adults"
        :children="bookingStore.search.children"
        :max-adults="30"
        :max-children="10"
        :max-child-age="maxChildAge"
        @update:adults="bookingStore.setGuestsCount($event, bookingStore.search.children)"
        @update:children="bookingStore.setGuestsCount(bookingStore.search.adults, $event)"
      />
    </div>

    <!-- Country Selection (for market) -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700"
    >
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {{ $t('booking.wizard.guestCountry') }}
      </label>
      <select v-model="bookingStore.search.countryCode" class="form-input w-full">
        <option value="TR">{{ $t('countries.TR') }}</option>
        <option value="DE">{{ $t('countries.DE') }}</option>
        <option value="GB">{{ $t('countries.GB') }}</option>
        <option value="RU">{{ $t('countries.RU') }}</option>
        <option value="FR">{{ $t('countries.FR') }}</option>
        <option value="NL">{{ $t('countries.NL') }}</option>
        <option value="OTHER">{{ $t('countries.OTHER') }}</option>
      </select>
      <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">
        {{ $t('booking.wizard.guestCountryHint') }}
      </p>
    </div>

    <!-- Search Button -->
    <div class="flex justify-end">
      <button
        :disabled="!bookingStore.isStep1Valid || searchLoading"
        class="btn-primary px-8 py-3 flex items-center space-x-2"
        @click="handleSearch"
      >
        <span v-if="searchLoading" class="material-icons animate-spin">refresh</span>
        <span v-else class="material-icons">search</span>
        <span>{{ $t('booking.wizard.searchAvailability') }}</span>
      </button>
    </div>

    <!-- Error Message -->
    <div
      v-if="bookingStore.error"
      class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg p-4"
    >
      <div class="flex items-start">
        <span class="material-icons mr-2">error</span>
        <p>{{ bookingStore.error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useBookingStore } from '@/stores/booking'
import bookingService from '@/services/bookingService'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import GuestCountSelector from '@/components/common/GuestCountSelector.vue'

const bookingStore = useBookingStore()

const emit = defineEmits(['search-complete'])

// Hotels
const hotels = ref([])
const hotelsLoading = ref(false)

// Search
const searchLoading = ref(false)

// Date range model for DateRangePicker
const dateRangeModel = computed({
  get: () => ({
    start: bookingStore.search.dateRange.start,
    end: bookingStore.search.dateRange.end
  }),
  set: val => {
    bookingStore.setDateRange(val?.start || null, val?.end || null)
  }
})

// Date constraints
const minDateObj = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
})

// Selected hotel
const selectedHotel = computed(() => {
  return hotels.value.find(h => h._id === bookingStore.search.hotelId)
})

// Max child age from hotel settings
const maxChildAge = computed(() => {
  if (selectedHotel.value?.childAgeGroups?.length) {
    const ages = selectedHotel.value.childAgeGroups.map(g => g.maxAge || 17)
    return Math.max(...ages)
  }
  return 17
})

// Load hotels on mount
onMounted(async () => {
  await loadHotels()
})

// Load hotels
const loadHotels = async () => {
  hotelsLoading.value = true
  try {
    const response = await bookingService.getPartnerHotels()
    if (response.success) {
      hotels.value = response.data
    }
  } catch (err) {
    console.error('Failed to load hotels:', err)
  } finally {
    hotelsLoading.value = false
  }
}

// Hotel change handler
const onHotelChange = hotelId => {
  const hotel = hotels.value.find(h => h._id === hotelId)
  bookingStore.setHotel(hotel || null)
}

// Search handler
const handleSearch = async () => {
  searchLoading.value = true
  const success = await bookingStore.searchAvailability()
  searchLoading.value = false

  if (success) {
    emit('search-complete')
  }
}

// Watch for hotel changes in store
watch(
  () => bookingStore.search.hotelId,
  newId => {
    if (newId && !selectedHotel.value) {
      const hotel = hotels.value.find(h => h._id === newId)
      if (hotel) {
        bookingStore.search.hotel = hotel
      }
    }
  }
)
</script>
