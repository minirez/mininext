<template>
  <div ref="containerRef" class="relative">
    <!-- Mode Toggle -->
    <div class="flex rounded-lg bg-gray-100 dark:bg-slate-700 p-1 mb-3">
      <button
        type="button"
        :class="[
          'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          searchMode === 'hotel'
            ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
            : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
        ]"
        @click="searchMode = 'hotel'"
      >
        <span class="material-icons text-sm mr-1 align-middle">hotel</span>
        {{ $t('booking.hotelSearch') }}
      </button>
      <button
        type="button"
        :class="[
          'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          searchMode === 'region'
            ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
            : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
        ]"
        @click="searchMode = 'region'"
      >
        <span class="material-icons text-sm mr-1 align-middle">location_on</span>
        {{ $t('booking.regionSearch') }}
      </button>
    </div>

    <!-- Search Input -->
    <div class="relative">
      <span
        class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg z-10"
      >
        {{ searchMode === 'hotel' ? 'hotel' : 'location_on' }}
      </span>
      <input
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        :placeholder="
          searchMode === 'hotel'
            ? $t('booking.hotelSearchPlaceholder')
            : $t('booking.regionSearchPlaceholder')
        "
        class="form-input w-full pl-10 pr-10 transition-colors"
        :class="
          hasError
            ? 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500'
            : ''
        "
        @focus="handleFocus"
        @input="handleInput"
        @keydown.down.prevent="navigateDown"
        @keydown.up.prevent="navigateUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc="closeDropdown"
      />
      <button
        v-if="searchQuery || selectedItems.length > 0"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
        @click.stop="clearSelection"
      >
        <span class="material-icons text-sm">close</span>
      </button>
      <span v-else-if="isLoading" class="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500">
        <span class="material-icons text-sm animate-spin">refresh</span>
      </span>
    </div>

    <!-- Selected Items Tags -->
    <div v-if="selectedItems.length > 0" class="flex flex-wrap gap-2 mt-2">
      <span
        v-for="item in selectedItems"
        :key="item.id"
        class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
        :class="
          item.type === 'hotel'
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        "
      >
        <span class="material-icons text-xs">{{
          item.type === 'hotel' ? 'hotel' : 'location_on'
        }}</span>
        {{ item.name }}
        <button class="hover:text-red-500 ml-1" @click="removeItem(item)">
          <span class="material-icons text-xs">close</span>
        </button>
      </span>
    </div>

    <!-- Dropdown -->
    <Teleport to="body">
      <transition name="dropdown-fade">
        <div
          v-if="showDropdown"
          ref="dropdownRef"
          class="fixed z-[9999] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-600 overflow-hidden"
          :style="dropdownStyle"
        >
          <!-- Recent Searches Section -->
          <div
            v-if="!searchQuery && recentItems.length > 0"
            class="border-b border-gray-200 dark:border-slate-700"
          >
            <div class="px-3 py-2 bg-gray-50 dark:bg-slate-700/50">
              <span
                class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
              >
                {{ $t('booking.recentSearches') }}
              </span>
            </div>
            <div class="max-h-48 overflow-y-auto">
              <button
                v-for="(item, index) in recentItems"
                :key="`recent-${item.id}`"
                type="button"
                class="w-full px-3 py-2.5 text-left flex items-center gap-3 transition-colors"
                :class="
                  highlightedIndex === index
                    ? 'bg-purple-50 dark:bg-purple-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                "
                @click="selectItem(item)"
                @mouseenter="highlightedIndex = index"
              >
                <span
                  class="material-icons text-lg"
                  :class="item.type === 'hotel' ? 'text-purple-500' : 'text-blue-500'"
                >
                  {{ item.type === 'hotel' ? 'hotel' : 'location_on' }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ item.name }}
                  </p>
                  <p
                    v-if="item.subtitle"
                    class="text-xs text-gray-500 dark:text-slate-400 truncate"
                  >
                    {{ item.subtitle }}
                  </p>
                </div>
                <span v-if="item.stars" class="text-xs text-yellow-500">
                  {{ '★'.repeat(item.stars) }}
                </span>
              </button>
            </div>
          </div>

          <!-- Search Results Section -->
          <div v-if="searchQuery">
            <!-- Loading State -->
            <div v-if="isLoading" class="px-4 py-8 text-center">
              <span class="material-icons text-3xl text-purple-500 animate-spin">refresh</span>
              <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
                {{ $t('common.loading') }}
              </p>
            </div>

            <!-- No Results -->
            <div v-else-if="filteredResults.length === 0" class="px-4 py-8 text-center">
              <span class="material-icons text-3xl text-gray-300 dark:text-slate-600"
                >search_off</span
              >
              <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
                {{ $t('booking.noResultsFound') }}
              </p>
            </div>

            <!-- Results List -->
            <div v-else class="max-h-80 overflow-y-auto">
              <!-- Hotels Group -->
              <template v-if="searchMode === 'hotel' && groupedResults.hotels.length > 0">
                <div class="px-3 py-2 bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                  <span
                    class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
                  >
                    {{ $t('booking.hotels') }} ({{ groupedResults.hotels.length }})
                  </span>
                </div>
                <button
                  v-for="(hotel, index) in groupedResults.hotels"
                  :key="`hotel-${hotel._id}`"
                  type="button"
                  class="w-full px-3 py-2.5 text-left flex items-center gap-3 transition-colors"
                  :class="
                    highlightedIndex === index
                      ? 'bg-purple-50 dark:bg-purple-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                  "
                  @click="
                    selectItem({
                      id: hotel._id,
                      type: 'hotel',
                      name: hotel.name,
                      stars: hotel.stars,
                      subtitle: hotel.city,
                      data: hotel
                    })
                  "
                  @mouseenter="highlightedIndex = index"
                >
                  <!-- Hotel Image -->
                  <div
                    class="w-12 h-12 rounded-lg bg-gray-200 dark:bg-slate-600 overflow-hidden flex-shrink-0"
                  >
                    <img
                      v-if="hotel.images && hotel.images[0]"
                      :src="hotel.images[0].url"
                      :alt="hotel.name"
                      class="w-full h-full object-cover"
                    />
                    <span
                      v-else
                      class="material-icons text-2xl text-gray-400 dark:text-slate-500 flex items-center justify-center h-full"
                      >hotel</span
                    >
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ hotel.name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-slate-400 truncate">
                      {{ hotel.city
                      }}{{
                        hotel.tourismRegion
                          ? ` • ${getLocalizedName(hotel.tourismRegion.name)}`
                          : ''
                      }}
                    </p>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <span v-if="hotel.stars" class="text-xs text-yellow-500">
                      {{ '★'.repeat(hotel.stars) }}
                    </span>
                    <span
                      v-if="isItemSelected({ id: hotel._id, type: 'hotel' })"
                      class="material-icons text-green-500 text-lg"
                      >check_circle</span
                    >
                  </div>
                </button>
              </template>

              <!-- Regions Group -->
              <template v-if="searchMode === 'region'">
                <!-- Provinces -->
                <template v-if="groupedResults.provinces.length > 0">
                  <div class="px-3 py-2 bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                    <span
                      class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
                    >
                      {{ $t('booking.provinces') }} ({{ groupedResults.provinces.length }})
                    </span>
                  </div>
                  <button
                    v-for="(province, index) in groupedResults.provinces"
                    :key="`province-${province._id}`"
                    type="button"
                    class="w-full px-3 py-2.5 text-left flex items-center gap-3 transition-colors"
                    :class="
                      highlightedIndex === index
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                    "
                    @click="
                      selectItem({
                        id: province._id,
                        type: 'province',
                        name: getLocalizedName(province.name),
                        subtitle: `${province.hotelCount} ${$t('booking.hotels').toLowerCase()}`,
                        data: province
                      })
                    "
                    @mouseenter="highlightedIndex = index"
                  >
                    <span class="material-icons text-lg text-blue-500">location_city</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ getLocalizedName(province.name) }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">
                        {{ province.hotelCount }} {{ $t('booking.hotels').toLowerCase() }}
                      </p>
                    </div>
                    <span
                      v-if="isItemSelected({ id: province._id, type: 'province' })"
                      class="material-icons text-green-500 text-lg"
                      >check_circle</span
                    >
                  </button>
                </template>

                <!-- Tourism Regions -->
                <template v-if="groupedResults.regions.length > 0">
                  <div class="px-3 py-2 bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                    <span
                      class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
                    >
                      {{ $t('booking.tourismRegions') }} ({{ groupedResults.regions.length }})
                    </span>
                  </div>
                  <button
                    v-for="(region, index) in groupedResults.regions"
                    :key="`region-${region._id}`"
                    type="button"
                    class="w-full px-3 py-2.5 text-left flex items-center gap-3 transition-colors"
                    :class="
                      highlightedIndex === groupedResults.provinces.length + index
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                    "
                    @click="
                      selectItem({
                        id: region._id,
                        type: 'region',
                        name: getLocalizedName(region.name),
                        subtitle: `${region.hotelCount} ${$t('booking.hotels').toLowerCase()}`,
                        data: region
                      })
                    "
                    @mouseenter="highlightedIndex = groupedResults.provinces.length + index"
                  >
                    <span class="material-icons text-lg text-green-500">beach_access</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ getLocalizedName(region.name) }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">
                        {{ region.provinceName }} • {{ region.hotelCount }}
                        {{ $t('booking.hotels').toLowerCase() }}
                      </p>
                    </div>
                    <span
                      v-if="isItemSelected({ id: region._id, type: 'region' })"
                      class="material-icons text-green-500 text-lg"
                      >check_circle</span
                    >
                  </button>
                </template>
              </template>
            </div>
          </div>

          <!-- All Hotels Quick Access (when no search, hotel mode) -->
          <div v-if="!searchQuery && searchMode === 'hotel' && allHotels.length > 0">
            <div class="px-3 py-2 bg-gray-50 dark:bg-slate-700/50">
              <span
                class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
              >
                {{ $t('booking.allHotels') }} ({{ allHotels.length }})
              </span>
            </div>
            <div class="max-h-64 overflow-y-auto">
              <button
                v-for="(hotel, index) in allHotels"
                :key="`all-${hotel._id}`"
                type="button"
                class="w-full px-3 py-2.5 text-left flex items-center gap-3 transition-colors"
                :class="
                  highlightedIndex === recentItems.length + index
                    ? 'bg-purple-50 dark:bg-purple-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                "
                @click="
                  selectItem({
                    id: hotel._id,
                    type: 'hotel',
                    name: hotel.name,
                    stars: hotel.stars,
                    subtitle: hotel.city,
                    data: hotel
                  })
                "
                @mouseenter="highlightedIndex = recentItems.length + index"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-600 overflow-hidden flex-shrink-0"
                >
                  <img
                    v-if="hotel.images && hotel.images[0]"
                    :src="hotel.images[0].url"
                    :alt="hotel.name"
                    class="w-full h-full object-cover"
                  />
                  <span
                    v-else
                    class="material-icons text-xl text-gray-400 dark:text-slate-500 flex items-center justify-center h-full"
                    >hotel</span
                  >
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ hotel.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-slate-400 truncate">{{ hotel.city }}</p>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <span v-if="hotel.stars" class="text-xs text-yellow-500">{{
                    '★'.repeat(hotel.stars)
                  }}</span>
                  <span
                    v-if="isItemSelected({ id: hotel._id, type: 'hotel' })"
                    class="material-icons text-green-500 text-lg"
                    >check_circle</span
                  >
                </div>
              </button>
            </div>
          </div>

          <!-- All Regions Quick Access (when no search, region mode) -->
          <div v-if="!searchQuery && searchMode === 'region'">
            <!-- Provinces -->
            <div v-if="allProvinces.length > 0">
              <div class="px-3 py-2 bg-gray-50 dark:bg-slate-700/50">
                <span
                  class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
                >
                  {{ $t('booking.provinces') }} ({{ allProvinces.length }})
                </span>
              </div>
              <div class="max-h-40 overflow-y-auto">
                <button
                  v-for="(province, index) in allProvinces"
                  :key="`all-province-${province._id}`"
                  type="button"
                  class="w-full px-3 py-2.5 text-left flex items-center gap-3 transition-colors"
                  :class="
                    highlightedIndex === recentItems.length + index
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                  "
                  @click="
                    selectItem({
                      id: province._id,
                      type: 'province',
                      name: getLocalizedName(province.name),
                      subtitle: `${province.hotelCount} ${$t('booking.hotels').toLowerCase()}`,
                      data: province
                    })
                  "
                  @mouseenter="highlightedIndex = recentItems.length + index"
                >
                  <span class="material-icons text-lg text-blue-500">location_city</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ getLocalizedName(province.name) }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-slate-400">
                      {{ province.hotelCount }} {{ $t('booking.hotels').toLowerCase() }}
                    </p>
                  </div>
                  <span
                    v-if="isItemSelected({ id: province._id, type: 'province' })"
                    class="material-icons text-green-500 text-lg"
                    >check_circle</span
                  >
                </button>
              </div>
            </div>

            <!-- Tourism Regions -->
            <div v-if="allRegions.length > 0">
              <div class="px-3 py-2 bg-gray-50 dark:bg-slate-700/50">
                <span
                  class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
                >
                  {{ $t('booking.tourismRegions') }} ({{ allRegions.length }})
                </span>
              </div>
              <div class="max-h-40 overflow-y-auto">
                <button
                  v-for="(region, index) in allRegions"
                  :key="`all-region-${region._id}`"
                  type="button"
                  class="w-full px-3 py-2.5 text-left flex items-center gap-3 transition-colors"
                  :class="
                    highlightedIndex === recentItems.length + allProvinces.length + index
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                  "
                  @click="
                    selectItem({
                      id: region._id,
                      type: 'region',
                      name: getLocalizedName(region.name),
                      subtitle: `${region.hotelCount} ${$t('booking.hotels').toLowerCase()}`,
                      data: region
                    })
                  "
                  @mouseenter="highlightedIndex = recentItems.length + allProvinces.length + index"
                >
                  <span class="material-icons text-lg text-green-500">beach_access</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ getLocalizedName(region.name) }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-slate-400">
                      {{ region.provinceName }} • {{ region.hotelCount }}
                      {{ $t('booking.hotels').toLowerCase() }}
                    </p>
                  </div>
                  <span
                    v-if="isItemSelected({ id: region._id, type: 'region' })"
                    class="material-icons text-green-500 text-lg"
                    >check_circle</span
                  >
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import bookingService from '@/services/bookingService'
import { usePartnerStore } from '@/stores/partner'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ hotels: [], regions: [], provinces: [] })
  },
  multiple: {
    type: Boolean,
    default: false
  },
  hasError: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'hotel-selected'])

const { locale } = useI18n()
const partnerStore = usePartnerStore()
const authStore = useAuthStore()

// Get current partner ID for partner-specific storage
const getCurrentPartnerId = () => {
  // Platform admin viewing as partner
  if (partnerStore.selectedPartner?._id) {
    return partnerStore.selectedPartner._id
  }
  // Normal partner user
  if (authStore.user?.partner?._id) {
    return authStore.user.partner._id
  }
  if (authStore.user?.partner) {
    return authStore.user.partner
  }
  return 'default'
}

// Get storage key for recent searches (partner-specific)
const getRecentSearchesKey = () => {
  return `booking_recent_searches_${getCurrentPartnerId()}`
}

// Refs
const containerRef = ref(null)
const inputRef = ref(null)
const dropdownRef = ref(null)

// State
const searchMode = ref('hotel')
const searchQuery = ref('')
const showDropdown = ref(false)
const isLoading = ref(false)
const highlightedIndex = ref(-1)
const dropdownPosition = ref({ top: 0, left: 0, width: 0 })

// Data
const allHotels = ref([])
const allRegions = ref([])
const allProvinces = ref([])
const searchResults = ref({ hotels: [], regions: [], provinces: [] })
const recentSearches = ref([])

// Selected items
const selectedItems = computed(() => {
  const items = []
  if (props.modelValue.hotels) {
    props.modelValue.hotels.forEach(h => {
      const hotel = allHotels.value.find(ah => ah._id === h)
      if (hotel) {
        items.push({
          id: h,
          type: 'hotel',
          name: hotel.name,
          stars: hotel.stars,
          subtitle: hotel.city
        })
      }
    })
  }
  if (props.modelValue.regions) {
    props.modelValue.regions.forEach(r => {
      const region = allRegions.value.find(ar => ar._id === r)
      if (region) {
        items.push({
          id: r,
          type: 'region',
          name: getLocalizedName(region.name),
          subtitle: region.provinceName
        })
      }
    })
  }
  if (props.modelValue.provinces) {
    props.modelValue.provinces.forEach(p => {
      const province = allProvinces.value.find(ap => ap._id === p)
      if (province) {
        items.push({ id: p, type: 'province', name: getLocalizedName(province.name) })
      }
    })
  }
  return items
})

// Recent items (from localStorage)
const recentItems = computed(() => {
  return recentSearches.value.slice(0, 10)
})

// Grouped results for display
const groupedResults = computed(() => {
  return {
    hotels: searchResults.value.hotels || [],
    regions: searchResults.value.regions || [],
    provinces: searchResults.value.provinces || []
  }
})

// Filtered results (all combined)
const filteredResults = computed(() => {
  return [
    ...groupedResults.value.hotels,
    ...groupedResults.value.provinces,
    ...groupedResults.value.regions
  ]
})

// Dropdown style
const dropdownStyle = computed(() => ({
  top: `${dropdownPosition.value.top}px`,
  left: `${dropdownPosition.value.left}px`,
  width: `${Math.max(dropdownPosition.value.width, 400)}px`,
  maxWidth: '500px'
}))

// Update dropdown position
const updateDropdownPosition = () => {
  if (inputRef.value) {
    const rect = inputRef.value.getBoundingClientRect()
    const popupHeight = 400
    const margin = 8

    // Default: open below the input
    let top = rect.bottom + margin

    // Check if there's enough space below
    const spaceBelow = window.innerHeight - rect.bottom - margin
    const spaceAbove = rect.top - margin

    if (spaceBelow < popupHeight && spaceAbove > spaceBelow) {
      // Open above if more space there
      top = Math.max(margin, rect.top - popupHeight - margin)
    }

    // Ensure top is never negative or too close to viewport edge
    top = Math.max(margin, Math.min(top, window.innerHeight - popupHeight - margin))

    // Calculate left position and ensure it stays within viewport
    let left = rect.left
    const maxWidth = Math.max(rect.width, 400)
    if (left + maxWidth > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - maxWidth - margin)
    }

    dropdownPosition.value = {
      top,
      left,
      width: rect.width
    }
  }
}

// Get localized name
const getLocalizedName = name => {
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
}

// Check if item is selected
const isItemSelected = item => {
  if (item.type === 'hotel') {
    return props.modelValue.hotels?.includes(item.id)
  } else if (item.type === 'region') {
    return props.modelValue.regions?.includes(item.id)
  } else if (item.type === 'province') {
    return props.modelValue.provinces?.includes(item.id)
  }
  return false
}

// Handle focus
const handleFocus = () => {
  showDropdown.value = true
  updateDropdownPosition()
  highlightedIndex.value = -1
}

// Handle input
let searchTimeout = null
const handleInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (searchQuery.value.length >= 2) {
    isLoading.value = true
    searchTimeout = setTimeout(async () => {
      await performSearch()
    }, 300)
  } else {
    searchResults.value = { hotels: [], regions: [], provinces: [] }
  }
}

// Perform search
const performSearch = async () => {
  try {
    const response = await bookingService.searchHotelsAndRegions({
      query: searchQuery.value,
      mode: searchMode.value
    })

    if (response.success) {
      searchResults.value = response.data
    }
  } catch (err) {
    console.error('Search failed:', err)
  } finally {
    isLoading.value = false
  }
}

// Select item
const selectItem = item => {
  // Add to recent searches
  addToRecent(item)

  if (props.multiple) {
    // Multi-select mode
    const newValue = { ...props.modelValue }

    if (item.type === 'hotel') {
      if (!newValue.hotels) newValue.hotels = []
      if (!newValue.hotels.includes(item.id)) {
        newValue.hotels = [...newValue.hotels, item.id]
      }
      // Clear regions/provinces when selecting hotel
      newValue.regions = []
      newValue.provinces = []
    } else if (item.type === 'region') {
      if (!newValue.regions) newValue.regions = []
      if (!newValue.regions.includes(item.id)) {
        newValue.regions = [...newValue.regions, item.id]
      }
      newValue.hotels = []
    } else if (item.type === 'province') {
      if (!newValue.provinces) newValue.provinces = []
      if (!newValue.provinces.includes(item.id)) {
        newValue.provinces = [...newValue.provinces, item.id]
      }
      newValue.hotels = []
    }

    emit('update:modelValue', newValue)
  } else {
    // Single select mode
    const newValue = { hotels: [], regions: [], provinces: [] }

    if (item.type === 'hotel') {
      newValue.hotels = [item.id]
      // Emit hotel data for child age handling
      emit('hotel-selected', item.data)
    } else if (item.type === 'region') {
      newValue.regions = [item.id]
    } else if (item.type === 'province') {
      newValue.provinces = [item.id]
    }

    emit('update:modelValue', newValue)
    showDropdown.value = false
  }

  searchQuery.value = ''
}

// Remove item
const removeItem = item => {
  const newValue = { ...props.modelValue }

  if (item.type === 'hotel') {
    newValue.hotels = newValue.hotels.filter(id => id !== item.id)
  } else if (item.type === 'region') {
    newValue.regions = newValue.regions.filter(id => id !== item.id)
  } else if (item.type === 'province') {
    newValue.provinces = newValue.provinces.filter(id => id !== item.id)
  }

  emit('update:modelValue', newValue)
}

// Clear selection
const clearSelection = () => {
  searchQuery.value = ''
  emit('update:modelValue', { hotels: [], regions: [], provinces: [] })
}

// Add to recent searches (partner-specific)
const addToRecent = item => {
  const existing = recentSearches.value.findIndex(r => r.id === item.id && r.type === item.type)
  if (existing > -1) {
    recentSearches.value.splice(existing, 1)
  }
  recentSearches.value.unshift(item)
  recentSearches.value = recentSearches.value.slice(0, 10)

  // Save to localStorage with partner-specific key
  try {
    localStorage.setItem(getRecentSearchesKey(), JSON.stringify(recentSearches.value))
  } catch (e) {
    console.warn('Failed to save recent searches:', e)
  }
}

// Load recent searches from localStorage (partner-specific)
const loadRecentSearches = () => {
  try {
    const saved = localStorage.getItem(getRecentSearchesKey())
    if (saved) {
      recentSearches.value = JSON.parse(saved)
    } else {
      recentSearches.value = []
    }
  } catch (e) {
    console.warn('Failed to load recent searches:', e)
    recentSearches.value = []
  }
}

// Keyboard navigation
const navigateDown = () => {
  const maxIndex = filteredResults.value.length - 1
  if (highlightedIndex.value < maxIndex) {
    highlightedIndex.value++
  }
}

const navigateUp = () => {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredResults.value.length) {
    const item = filteredResults.value[highlightedIndex.value]
    if (item._id) {
      selectItem({
        id: item._id,
        type:
          searchMode.value === 'hotel'
            ? 'hotel'
            : item.hotelCount !== undefined
              ? 'region'
              : 'province',
        name: item.name || getLocalizedName(item.name),
        data: item
      })
    }
  }
}

const closeDropdown = () => {
  showDropdown.value = false
}

// Handle click outside
const handleClickOutside = event => {
  const isInsideContainer = containerRef.value?.contains(event.target)
  const isInsideDropdown = dropdownRef.value?.contains(event.target)
  if (!isInsideContainer && !isInsideDropdown) {
    showDropdown.value = false
  }
}

// Load initial data
const loadInitialData = async () => {
  try {
    const response = await bookingService.getPartnerHotelsWithRegions()
    if (response.success) {
      allHotels.value = response.data.hotels || []
      allRegions.value = response.data.regions || []
      allProvinces.value = response.data.provinces || []
    }
  } catch (err) {
    console.error('Failed to load initial data:', err)
  }
}

// Watch search mode changes
watch(searchMode, () => {
  searchQuery.value = ''
  searchResults.value = { hotels: [], regions: [], provinces: [] }
  highlightedIndex.value = -1
})

// Watch for partner changes (platform admin switching partners)
watch(
  () => partnerStore.selectedPartner?._id,
  () => {
    // Reload recent searches and initial data when partner changes
    loadRecentSearches()
    loadInitialData()
  }
)

// Handle scroll - update position or close dropdown
const handleScroll = () => {
  if (showDropdown.value) {
    updateDropdownPosition()
  }
}

// Handle resize
const handleResize = () => {
  if (showDropdown.value) {
    updateDropdownPosition()
  }
}

// Watch dropdown visibility to add/remove scroll listeners
watch(showDropdown, isOpen => {
  if (isOpen) {
    // Add scroll listeners to window and any scrollable parent
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    // Update position immediately when opening
    updateDropdownPosition()
  } else {
    window.removeEventListener('scroll', handleScroll, true)
    window.removeEventListener('resize', handleResize)
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadRecentSearches()
  loadInitialData()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease;
}

.dropdown-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
