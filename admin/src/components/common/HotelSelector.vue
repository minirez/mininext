<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="toggleDropdown"
      class="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors w-full"
      :class="{
        'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400': hasSelectedHotel
      }"
    >
      <span class="material-icons text-xl">apartment</span>
      <div class="text-left flex-1 min-w-0">
        <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.selectHotel') }}</div>
        <div class="text-sm font-medium truncate">
          {{ selectedHotel?.name || $t('planning.noHotelSelected') }}
        </div>
      </div>
      <svg class="w-4 h-4 transition-transform flex-shrink-0" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-50"
      >
        <!-- Search Input -->
        <div class="p-2 border-b border-gray-200 dark:border-slate-700">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">search</span>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="$t('planning.searchHotel')"
              class="w-full pl-10 pr-3 py-2 text-sm bg-gray-100 dark:bg-slate-700 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder-gray-400"
              @input="handleSearch"
            />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </div>
        </div>

        <!-- Scrollable List -->
        <div class="max-h-64 overflow-y-auto">
          <!-- Loading State -->
          <div v-if="loading" class="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <span class="text-sm">{{ $t('common.loading') }}</span>
          </div>

          <!-- Hotels List -->
          <div v-else-if="hotels.length > 0">
            <button
              v-for="hotel in hotels"
              :key="hotel._id"
              @click="selectHotel(hotel)"
              class="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 last:border-b-0"
              :class="{
                'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400': selectedHotel?._id === hotel._id
              }"
            >
              <!-- Hotel Logo/Thumbnail -->
              <div class="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-600 flex-shrink-0 overflow-hidden">
                <img
                  v-if="hotel.logo || getMainImage(hotel)"
                  :src="getImageUrl(hotel.logo || getMainImage(hotel))"
                  :alt="hotel.name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="material-icons text-2xl text-gray-400 dark:text-slate-500 flex items-center justify-center w-full h-full">hotel</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ hotel.name }}</div>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                  <span class="flex items-center">
                    <span class="material-icons text-yellow-400 text-xs mr-0.5">star</span>
                    {{ hotel.stars }}
                  </span>
                  <span v-if="hotel.address?.city">{{ hotel.address.city }}</span>
                  <span
                    class="px-1.5 py-0.5 rounded text-xs"
                    :class="{
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': hotel.status === 'active',
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': hotel.status === 'draft',
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400': hotel.status === 'inactive'
                    }"
                  >
                    {{ $t(`hotels.statuses.${hotel.status}`) }}
                  </span>
                </div>
              </div>

              <span v-if="selectedHotel?._id === hotel._id" class="material-icons text-indigo-600 dark:text-indigo-400">check</span>
            </button>
          </div>

          <!-- No Results -->
          <div v-else class="px-4 py-8 text-center text-gray-500 dark:text-slate-400 text-sm">
            <span class="material-icons text-3xl mb-2 block">search_off</span>
            {{ searchQuery ? $t('planning.noHotelsFound') : $t('planning.noHotelsAvailable') }}
          </div>
        </div>

        <!-- Results Info -->
        <div v-if="!loading && totalCount > 0" class="px-4 py-2 text-xs text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-700">
          {{ $t('planning.showingHotels', { count: hotels.length, total: totalCount }) }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import hotelService from '@/services/hotelService'
import { usePartnerContext } from '@/composables/usePartnerContext'
import { useHotelStore } from '@/stores/hotel'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const { t } = useI18n()
const hotelStore = useHotelStore()

const isOpen = ref(false)
const dropdownRef = ref(null)
const searchInputRef = ref(null)
const hotels = ref([])
const loading = ref(false)
const searchQuery = ref('')
const totalCount = ref(0)
const LIMIT = 50
let searchTimeout = null

const selectedHotel = computed(() => props.modelValue)
const hasSelectedHotel = computed(() => !!selectedHotel.value)

// Partner context for reactivity
const { currentPartnerId } = usePartnerContext({
  onPartnerChange: (partner) => {
    // Load saved hotel for this partner (or clear if no partner)
    hotelStore.setPartner(partner?._id || null)
    // Emit the loaded hotel (could be null or saved hotel)
    emit('update:modelValue', hotelStore.selectedHotel)
    emit('change', hotelStore.selectedHotel)
    if (isOpen.value) {
      fetchHotels()
    }
  },
  immediate: false // Don't trigger on mount, only on actual partner change
})


const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
  const baseUrl = apiBaseUrl.replace('/api', '')
  return `${baseUrl}${url}`
}

const getMainImage = (hotel) => {
  const mainImage = hotel.images?.find(img => img.isMain)
  return mainImage?.url || hotel.images?.[0]?.url || null
}

const toggleDropdown = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await fetchHotels()
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
}

const fetchHotels = async (search = '') => {
  loading.value = true
  try {
    const params = { limit: LIMIT }
    if (search) {
      params.search = search
    }
    const response = await hotelService.getHotels(params)
    if (response.success) {
      hotels.value = response.data.items || []
      totalCount.value = response.data.pagination?.total || hotels.value.length
    }
  } catch (error) {
    console.error('Failed to fetch hotels:', error)
    hotels.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    fetchHotels(searchQuery.value)
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  fetchHotels()
  searchInputRef.value?.focus()
}

const selectHotel = (hotel) => {
  emit('update:modelValue', hotel)
  emit('change', hotel)
  isOpen.value = false
  searchQuery.value = ''
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)

  // Initialize partner and load saved hotel on mount
  if (currentPartnerId.value && !hotelStore.currentPartnerId) {
    hotelStore.setPartner(currentPartnerId.value)
    // Sync store to parent if there's a saved hotel
    if (hotelStore.selectedHotel) {
      emit('update:modelValue', hotelStore.selectedHotel)
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>
