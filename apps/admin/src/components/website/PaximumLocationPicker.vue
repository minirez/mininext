<template>
  <div ref="containerRef" class="relative">
    <input
      ref="inputRef"
      v-model="query"
      type="text"
      :placeholder="placeholder"
      class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      @input="handleSearch"
      @focus="openDropdown"
    />
    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
      <span v-if="loading" class="material-icons animate-spin text-sm">refresh</span>
      <span v-else class="material-icons text-sm">{{
        typeFilter === 2 ? 'hotel' : 'location_on'
      }}</span>
    </span>

    <!-- Suggestions Dropdown - Teleported to body for proper z-index -->
    <Teleport to="body">
      <div
        v-if="showSuggestions && suggestions.length > 0"
        ref="dropdownRef"
        :style="dropdownStyle"
        class="fixed z-[9999] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
      >
        <button
          v-for="loc in suggestions"
          :key="loc.id"
          class="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700 text-sm flex items-center gap-2"
          @click="selectLocation(loc)"
        >
          <span class="material-icons text-gray-400 text-sm">
            {{ getLocationIcon(loc.type) }}
          </span>
          <div class="flex-1 min-w-0">
            <span class="text-gray-900 dark:text-white">{{ loc.name }}</span>
            <span v-if="loc.city && loc.city !== loc.name" class="text-gray-400 text-xs ml-1">
              {{ loc.city }}
            </span>
            <span v-if="loc.country" class="text-gray-400 text-xs ml-1">({{ loc.country }})</span>
          </div>
          <span
            v-if="loc.hotelCount && typeFilter !== 2"
            class="text-xs text-purple-500 font-medium"
          >
            {{ loc.hotelCount }} {{ $t('common.hotels') || 'otel' }}
          </span>
        </button>
      </div>
    </Teleport>

    <!-- Selected Location Badge -->
    <div v-if="selectedLocation" class="mt-2">
      <span
        class="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs"
      >
        <span class="material-icons text-xs">{{ typeFilter === 2 ? 'hotel' : 'location_on' }}</span>
        <span class="font-medium">{{ selectedLocation.name }}</span>
        <span v-if="selectedLocation.country" class="text-purple-400">
          ({{ selectedLocation.country }})
        </span>
        <span v-if="selectedLocation.hotelCount && typeFilter !== 2" class="text-purple-400 ml-1">
          · {{ selectedLocation.hotelCount }} otel
        </span>
        <button class="ml-1 hover:text-red-500" @click="clearSelection">
          <span class="material-icons text-xs">close</span>
        </button>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import paximumService from '@/services/paximumService'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  // Filter by type: 1 = City/Location, 2 = Hotel
  typeFilter: {
    type: Number,
    default: null
  },
  placeholder: {
    type: String,
    default: 'Ara...'
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const containerRef = ref(null)
const inputRef = ref(null)
const dropdownRef = ref(null)
const query = ref('')
const suggestions = ref([])
const loading = ref(false)
const showSuggestions = ref(false)
const dropdownPosition = ref({ top: 0, left: 0, width: 0 })

// Computed selected location from model value
const selectedLocation = computed(() => props.modelValue)

// Dropdown style for positioning
const dropdownStyle = computed(() => ({
  top: `${dropdownPosition.value.top}px`,
  left: `${dropdownPosition.value.left}px`,
  width: `${dropdownPosition.value.width}px`
}))

// Location icon based on type
const getLocationIcon = type => {
  switch (type) {
    case 1:
      return 'location_city' // City/Location
    case 2:
      return 'hotel' // Hotel
    case 3:
      return 'beach_access' // Region
    default:
      return 'place'
  }
}

// Update dropdown position
const updateDropdownPosition = () => {
  if (!inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  dropdownPosition.value = {
    top: rect.bottom + 4,
    left: rect.left,
    width: rect.width
  }
}

// Open dropdown and update position
const openDropdown = () => {
  showSuggestions.value = true
  nextTick(() => {
    updateDropdownPosition()
  })
}

// Handle search with debounce
let searchTimeout = null
const handleSearch = () => {
  clearTimeout(searchTimeout)

  if (query.value.length < 2) {
    suggestions.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    loading.value = true
    try {
      const results = await paximumService.autocomplete(query.value)
      // Filter by type if specified
      if (props.typeFilter !== null) {
        suggestions.value = results.filter(loc => loc.type === props.typeFilter)
      } else {
        suggestions.value = results
      }
      // Update position after results
      nextTick(() => {
        updateDropdownPosition()
      })
    } catch (err) {
      console.error('Paximum autocomplete error:', err)
      suggestions.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

// Select location
const selectLocation = loc => {
  emit('update:modelValue', loc)
  emit('select', loc)
  query.value = ''
  suggestions.value = []
  showSuggestions.value = false
}

// Clear selection
const clearSelection = () => {
  emit('update:modelValue', null)
  emit('select', null)
}

// Close suggestions on click outside
const handleClickOutside = event => {
  const isClickInside =
    containerRef.value?.contains(event.target) || dropdownRef.value?.contains(event.target)
  if (!isClickInside) {
    showSuggestions.value = false
  }
}

// Handle scroll/resize to reposition dropdown
const handleScrollResize = () => {
  if (showSuggestions.value) {
    updateDropdownPosition()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScrollResize, true)
  window.addEventListener('resize', handleScrollResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScrollResize, true)
  window.removeEventListener('resize', handleScrollResize)
})
</script>
