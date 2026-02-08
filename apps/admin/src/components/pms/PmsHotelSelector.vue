<template>
  <div ref="dropdownRef" class="relative">
    <button
      class="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors w-full"
      :class="{
        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400':
          pmsStore.hasSelectedHotel
      }"
      @click="toggleDropdown"
    >
      <span class="material-icons text-xl">apartment</span>
      <div class="text-left flex-1 min-w-0">
        <div class="text-xs text-gray-500 dark:text-slate-400">
          {{ $t('pms.selectHotel') }}
        </div>
        <div class="text-sm font-medium truncate">
          {{ pmsStore.hotelName || $t('pms.noHotelSelected') }}
        </div>
      </div>
      <svg
        class="w-4 h-4 transition-transform flex-shrink-0"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
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
        class="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-50 min-w-[280px]"
      >
        <!-- Search Input -->
        <div class="p-2 border-b border-gray-200 dark:border-slate-700">
          <div class="relative">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg"
              >search</span
            >
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="$t('pms.searchHotel')"
              class="w-full pl-10 pr-3 py-2 text-sm bg-gray-100 dark:bg-slate-700 border-0 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white placeholder-gray-400"
              @input="handleSearch"
            />
          </div>
        </div>

        <!-- Scrollable List -->
        <div class="max-h-64 overflow-y-auto">
          <!-- Loading State -->
          <div v-if="loading" class="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
            <div
              class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"
            ></div>
            <span class="text-sm">{{ $t('common.loading') }}</span>
          </div>

          <!-- Hotels List -->
          <div v-else-if="hotels.length > 0">
            <button
              v-for="hotel in hotels"
              :key="hotel._id"
              class="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 last:border-b-0"
              :class="{
                'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400':
                  pmsStore.hotelId === hotel._id
              }"
              @click="selectHotel(hotel)"
            >
              <div
                class="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-600 flex-shrink-0 overflow-hidden flex items-center justify-center"
              >
                <span class="material-icons text-2xl text-gray-400 dark:text-slate-500">hotel</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ hotel.name }}</div>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                  <span v-if="hotel.address?.city">{{ hotel.address.city }}</span>
                  <span
                    class="px-1.5 py-0.5 rounded text-xs"
                    :class="{
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                        hotel.status === 'active',
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                        hotel.status === 'draft',
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400':
                        hotel.status === 'inactive'
                    }"
                  >
                    {{ hotel.status }}
                  </span>
                </div>
              </div>

              <span
                v-if="pmsStore.hotelId === hotel._id"
                class="material-icons text-purple-600 dark:text-purple-400"
                >check</span
              >
            </button>
          </div>

          <!-- No Results -->
          <div v-else class="px-4 py-8 text-center text-gray-500 dark:text-slate-400 text-sm">
            <span class="material-icons text-3xl mb-2 block">search_off</span>
            {{ $t('pms.noHotelsFound') }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import hotelService from '@/services/hotelService'
import { usePmsStore } from '@/stores/pms'

const pmsStore = usePmsStore()

const isOpen = ref(false)
const dropdownRef = ref(null)
const searchInputRef = ref(null)
const hotels = ref([])
const loading = ref(false)
const searchQuery = ref('')
let searchTimeout = null

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
    const params = { limit: 50 }
    if (search) params.search = search
    const response = await hotelService.getHotels(params)
    if (response.success) {
      hotels.value = response.data.items || []
    }
  } catch (error) {
    console.error('Failed to fetch hotels:', error)
    hotels.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchHotels(searchQuery.value)
  }, 300)
}

const selectHotel = hotel => {
  pmsStore.setHotel(hotel)
  isOpen.value = false
  searchQuery.value = ''
}

const handleClickOutside = event => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
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
