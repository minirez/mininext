<template>
  <div class="space-y-3">
    <!-- Selected Hotels as Chips -->
    <div v-if="selectedHotels.length" class="flex flex-wrap gap-2">
      <span
        v-for="hotel in selectedHotels"
        :key="hotel._id"
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
        :class="chipClass"
      >
        <span class="material-icons text-sm">hotel</span>
        {{ hotel.name }}
        <button
          type="button"
          @click="removeHotel(hotel._id)"
          class="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <span class="material-icons text-sm">close</span>
        </button>
      </span>
    </div>

    <!-- Search Input -->
    <div class="relative" ref="containerRef">
      <div class="relative">
        <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          :placeholder="placeholder"
          class="form-input pl-10 pr-10 w-full"
          @focus="showDropdown = true"
          @input="handleSearch"
        />
        <span
          v-if="loading"
          class="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
        >
          refresh
        </span>
        <button
          v-else-if="searchQuery"
          type="button"
          @click="clearSearch"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <span class="material-icons text-sm">close</span>
        </button>
      </div>

      <!-- Dropdown Results -->
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="showDropdown && (searchResults.length > 0 || loading || searchQuery)"
          class="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-50 max-h-64 overflow-y-auto"
        >
          <!-- Loading State -->
          <div v-if="loading" class="px-4 py-6 text-center text-gray-500 dark:text-slate-400">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <span class="text-sm">{{ $t('common.searching') }}</span>
          </div>

          <!-- Results -->
          <template v-else-if="searchResults.length > 0">
            <button
              v-for="hotel in searchResults"
              :key="hotel._id"
              type="button"
              @click="addHotel(hotel)"
              class="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 last:border-b-0 transition-colors"
              :class="{
                'opacity-50 cursor-not-allowed': isSelected(hotel._id),
                'bg-green-50 dark:bg-green-900/10': isSelected(hotel._id)
              }"
              :disabled="isSelected(hotel._id)"
            >
              <!-- Hotel Thumbnail -->
              <div class="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-600 flex-shrink-0 overflow-hidden">
                <img
                  v-if="getHotelImage(hotel)"
                  :src="getImageUrl(getHotelImage(hotel))"
                  :alt="hotel.name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="material-icons text-2xl text-gray-400 dark:text-slate-500 flex items-center justify-center w-full h-full">hotel</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900 dark:text-white truncate">{{ hotel.name }}</div>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                  <span class="flex items-center">
                    <span class="material-icons text-yellow-400 text-xs mr-0.5">star</span>
                    {{ hotel.stars }}
                  </span>
                  <span v-if="hotel.address?.city">{{ hotel.address.city }}</span>
                </div>
              </div>

              <span v-if="isSelected(hotel._id)" class="material-icons text-green-600 dark:text-green-400">check_circle</span>
              <span v-else class="material-icons text-gray-400">add_circle_outline</span>
            </button>
          </template>

          <!-- No Results -->
          <div v-else-if="searchQuery && !loading" class="px-4 py-6 text-center text-gray-500 dark:text-slate-400 text-sm">
            <span class="material-icons text-3xl mb-2 block">search_off</span>
            {{ $t('common.noResults') }}
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import hotelService from '@/services/hotelService'
import { getImageUrl } from '@/utils/imageUrl'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'green', // 'green' for allowed, 'red' for blocked
    validator: (value) => ['green', 'red', 'blue', 'purple'].includes(value)
  },
  hotels: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const containerRef = ref(null)
const inputRef = ref(null)
const searchQuery = ref('')
const searchResults = ref([])
const loading = ref(false)
const showDropdown = ref(false)
let searchTimeout = null

// Chip class based on variant
const chipClass = computed(() => {
  const classes = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
  }
  return classes[props.variant] || classes.green
})

// Get selected hotels with details from props.hotels
const selectedHotels = computed(() => {
  return props.modelValue.map(id => {
    // First try to find in props.hotels
    const hotel = props.hotels.find(h => h._id === id)
    if (hotel) return hotel
    // Otherwise return a placeholder
    return { _id: id, name: id }
  })
})

const isSelected = (hotelId) => props.modelValue.includes(hotelId)

// getImageUrl imported from @/utils/imageUrl

const getHotelImage = (hotel) => {
  const mainImage = hotel.images?.find(img => img.isMain)
  return mainImage?.url || hotel.images?.[0]?.url || hotel.logo || null
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    loading.value = true
    try {
      const response = await hotelService.getHotels({
        search: searchQuery.value,
        limit: 20
      })
      if (response.success) {
        searchResults.value = response.data.items || []
      }
    } catch (error) {
      console.error('Failed to search hotels:', error)
      searchResults.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  inputRef.value?.focus()
}

const addHotel = (hotel) => {
  if (!isSelected(hotel._id)) {
    emit('update:modelValue', [...props.modelValue, hotel._id])
  }
  searchQuery.value = ''
  searchResults.value = []
  showDropdown.value = false
}

const removeHotel = (hotelId) => {
  emit('update:modelValue', props.modelValue.filter(id => id !== hotelId))
}

// Click outside to close dropdown
const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>
