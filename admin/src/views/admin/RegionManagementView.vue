<template>
  <div class="p-6">
    <!-- Country Filter -->
    <div class="mb-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {{ $t('locations.selectCountry') }}
      </label>
      <div class="relative w-full md:w-80" ref="countryDropdownRef">
        <button
          type="button"
          @click="toggleCountryDropdown"
          class="form-input w-full pl-10 pr-10 text-left cursor-pointer flex items-center gap-2"
          :class="selectedCountryCode ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20' : ''"
        >
          <template v-if="selectedCountry">
            <img :src="`/flags/${selectedCountry.code.toLowerCase()}.svg`" :alt="selectedCountry.code" class="w-5 h-4 object-contain" />
            <span class="truncate">{{ getCountryName(selectedCountry) }}</span>
          </template>
          <span v-else class="text-gray-400 dark:text-slate-500">-- {{ $t('locations.selectCountry') }} --</span>
        </button>
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <span class="material-icons text-lg">public</span>
        </span>
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <span class="material-icons text-lg transition-transform" :class="showCountryDropdown ? 'rotate-180' : ''">expand_more</span>
        </span>

        <!-- Country Dropdown -->
        <div
          v-if="showCountryDropdown"
          class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden"
        >
          <!-- Search Input -->
          <div class="p-2 border-b border-gray-200 dark:border-slate-700">
            <div class="relative">
              <input
                ref="countrySearchInput"
                v-model="countrySearch"
                type="text"
                :placeholder="$t('common.search')"
                class="form-input w-full pl-8 py-1.5 text-sm"
                @keydown.enter.prevent="selectFirstCountry"
                @keydown.esc="showCountryDropdown = false"
              />
              <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <span class="material-icons text-sm">search</span>
              </span>
            </div>
          </div>
          <!-- Options List -->
          <div class="max-h-60 overflow-y-auto">
            <button
              v-for="country in filteredCountries"
              :key="country.code"
              type="button"
              @click="selectCountry(country)"
              class="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2 transition-colors"
              :class="country.code === selectedCountryCode ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-slate-300'"
            >
              <img :src="`/flags/${country.code.toLowerCase()}.svg`" :alt="country.code" class="w-5 h-4 object-contain" />
              <span class="truncate">{{ getCountryName(country) }}</span>
            </button>
            <div v-if="filteredCountries.length === 0" class="px-3 py-4 text-center text-sm text-gray-500 dark:text-slate-400">
              {{ $t('common.noData') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="selectedCountryCode" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Cities Panel (Left) -->
      <div class="lg:col-span-4">
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-700/50">
            <h2 class="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span class="material-icons text-purple-500">location_city</span>
              {{ $t('locations.cities') }}
            </h2>
            <button
              type="button"
              @click="openCityModal()"
              class="btn btn-sm btn-primary"
            >
              <span class="material-icons text-sm">add</span>
              {{ $t('locations.addCity') }}
            </button>
          </div>

          <div class="max-h-[600px] overflow-y-auto">
            <div v-if="loadingCities" class="p-8 text-center text-gray-500">
              <span class="material-icons text-3xl animate-spin">sync</span>
              <p class="mt-2">{{ $t('common.loading') }}</p>
            </div>

            <div v-else-if="cities.length === 0" class="p-8 text-center text-gray-400 dark:text-slate-500">
              <span class="material-icons text-4xl mb-2">location_city</span>
              <p>{{ $t('locations.noCities') }}</p>
            </div>

            <div v-else>
              <div
                v-for="city in cities"
                :key="city._id"
                @click="selectCity(city)"
                class="px-4 py-3 cursor-pointer flex items-center justify-between border-b border-gray-100 dark:border-slate-700 last:border-b-0 transition-colors"
                :class="selectedCity?._id === city._id
                  ? 'bg-purple-50 dark:bg-purple-900/30 border-l-4 border-l-purple-500'
                  : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-sm" :class="city.coordinates?.lat ? 'text-green-500' : 'text-orange-400'">
                      {{ city.coordinates?.lat ? 'check_circle' : 'warning' }}
                    </span>
                    <span class="font-medium text-gray-800 dark:text-slate-200 truncate">{{ getCityName(city) }}</span>
                  </div>
                  <div v-if="city.coordinates?.lat" class="text-xs text-gray-400 font-mono mt-0.5 ml-6">
                    {{ city.coordinates.lat.toFixed(4) }}, {{ city.coordinates.lng.toFixed(4) }} (z:{{ city.zoom || 10 }})
                  </div>
                </div>
                <div class="flex items-center gap-1 ml-2">
                  <span class="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {{ city.regionCount || 0 }}
                  </span>
                  <button
                    type="button"
                    @click.stop="openCityModal(city)"
                    class="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded"
                  >
                    <span class="material-icons text-sm">edit</span>
                  </button>
                  <button
                    type="button"
                    @click.stop="confirmDeleteCity(city)"
                    class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                  >
                    <span class="material-icons text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Map + Regions -->
      <div class="lg:col-span-8 space-y-6">
        <!-- Map Section (Always visible when city selected) -->
        <div v-if="selectedCity" class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-700/50">
            <h2 class="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span class="material-icons text-blue-500">map</span>
              {{ getCityName(selectedCity) }} - {{ $t('locations.mapView') }}
            </h2>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 dark:text-slate-400">{{ $t('locations.clickToSetCoordinates') }}</span>
            </div>
          </div>

          <!-- Main Map -->
          <div class="relative">
            <div class="h-80" ref="mainMapContainer">
              <div id="region-main-map" class="w-full h-full"></div>
            </div>
            <!-- Map Legend -->
            <div class="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-800/90 px-3 py-2 rounded shadow text-xs space-y-1">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-purple-500"></span>
                <span>{{ $t('locations.city') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-green-500"></span>
                <span>{{ $t('locations.tourismRegion') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Regions Panel -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-700/50">
            <h2 class="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <span class="material-icons text-green-500">place</span>
              <template v-if="selectedCity">
                {{ getCityName(selectedCity) }} - {{ $t('locations.tourismRegions') }}
              </template>
              <template v-else>
                {{ $t('locations.tourismRegions') }}
              </template>
            </h2>
            <button
              v-if="selectedCity"
              type="button"
              @click="openRegionModal()"
              class="btn btn-sm btn-primary"
            >
              <span class="material-icons text-sm">add</span>
              {{ $t('locations.addRegion') }}
            </button>
          </div>

          <!-- No city selected state -->
          <div v-if="!selectedCity" class="p-12 text-center text-gray-400 dark:text-slate-500">
            <span class="material-icons text-6xl mb-4 text-gray-300 dark:text-slate-600">touch_app</span>
            <p class="text-lg">{{ $t('locations.selectCityFirst') }}</p>
            <p class="text-sm mt-1">{{ $t('locations.selectCityToViewRegions') }}</p>
          </div>

          <!-- Regions List -->
          <div v-else class="max-h-[400px] overflow-y-auto">
            <div v-if="loadingRegions" class="p-8 text-center text-gray-500">
              <span class="material-icons text-3xl animate-spin">sync</span>
            </div>

            <div v-else-if="regions.length === 0" class="p-8 text-center text-gray-400 dark:text-slate-500">
              <span class="material-icons text-4xl mb-2">place</span>
              <p>{{ $t('locations.noRegions') }}</p>
            </div>

            <div v-else>
              <div
                v-for="region in regions"
                :key="region._id"
                class="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-slate-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-700/30"
              >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <span class="material-icons" :class="region.coordinates?.lat ? 'text-green-500' : 'text-orange-400'">
                    {{ region.coordinates?.lat ? 'place' : 'location_off' }}
                  </span>
                  <div class="min-w-0">
                    <span class="font-medium text-gray-800 dark:text-slate-200 truncate block">{{ getRegionName(region) }}</span>
                    <div v-if="region.coordinates?.lat" class="text-xs text-gray-400 font-mono mt-0.5">
                      {{ region.coordinates.lat.toFixed(5) }}, {{ region.coordinates.lng.toFixed(5) }} (z:{{ region.zoom || 14 }})
                    </div>
                    <div v-else class="text-xs text-orange-500 mt-0.5">
                      {{ $t('locations.noCoordinates') }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    @click="focusOnMap(region)"
                    :disabled="!region.coordinates?.lat"
                    class="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded disabled:opacity-30"
                    :title="$t('locations.showOnMap')"
                  >
                    <span class="material-icons text-lg">my_location</span>
                  </button>
                  <button
                    type="button"
                    @click="openRegionModal(region)"
                    class="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded"
                  >
                    <span class="material-icons text-lg">edit</span>
                  </button>
                  <button
                    type="button"
                    @click="confirmDeleteRegion(region)"
                    class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                  >
                    <span class="material-icons text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state when no country selected -->
    <div v-else class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
      <span class="material-icons text-6xl text-gray-300 dark:text-slate-600 mb-4">public</span>
      <h3 class="text-lg font-medium text-gray-600 dark:text-slate-400">{{ $t('locations.selectCountryPrompt') }}</h3>
      <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">{{ $t('locations.selectCountryPromptDesc') }}</p>
    </div>

    <!-- City Modal -->
    <Modal
      v-model="showCityModal"
      :title="editingCity ? $t('locations.editCity') : $t('locations.addCity')"
      size="xl"
    >
      <div class="space-y-6">
        <!-- City Name (simple string, not multilingual) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('locations.cityName') }}
          </label>
          <input
            v-model="cityForm.name"
            type="text"
            class="form-input w-full"
            :placeholder="$t('locations.cityName')"
            required
          />
        </div>

        <!-- Coordinates Section -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('locations.coordinates') }}
          </label>

          <div class="grid grid-cols-3 gap-4 mb-3">
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('locations.latitude') }}</label>
              <input
                v-model.number="cityForm.coordinates.lat"
                type="number"
                step="any"
                class="form-input font-mono"
                placeholder="39.925533"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('locations.longitude') }}</label>
              <input
                v-model.number="cityForm.coordinates.lng"
                type="number"
                step="any"
                class="form-input font-mono"
                placeholder="32.866287"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('locations.zoomLevel') }}</label>
              <input
                v-model.number="cityForm.zoom"
                type="number"
                min="1"
                max="20"
                class="form-input font-mono"
                placeholder="10"
              />
            </div>
          </div>

          <!-- Map for coordinate selection -->
          <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
            <div class="h-64 relative" style="z-index: 1;">
              <div id="city-modal-map" class="w-full h-full"></div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700/50 px-3 py-2 text-xs text-gray-500 dark:text-slate-400 text-center flex items-center justify-center gap-2">
              <span class="material-icons text-sm">touch_app</span>
              {{ $t('locations.clickMapToSelect') }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" @click="showCityModal = false" class="btn btn-secondary">
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          @click="saveCity"
          class="btn btn-primary"
          :disabled="savingCity || !cityForm.name"
        >
          <span v-if="savingCity" class="material-icons text-sm animate-spin mr-1">sync</span>
          {{ $t('common.save') }}
        </button>
      </template>
    </Modal>

    <!-- Region Modal -->
    <Modal
      v-model="showRegionModal"
      :title="editingRegion ? $t('locations.editRegion') : $t('locations.addRegion')"
      size="xl"
    >
      <div class="space-y-6">
        <!-- Region Name (simple string, not multilingual) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('locations.regionName') }}
          </label>
          <input
            v-model="regionForm.name"
            type="text"
            class="form-input w-full"
            :placeholder="$t('locations.regionName')"
            required
          />
        </div>

        <!-- Coordinates Section -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('locations.coordinates') }}
          </label>

          <div class="grid grid-cols-3 gap-4 mb-3">
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('locations.latitude') }}</label>
              <input
                v-model.number="regionForm.coordinates.lat"
                type="number"
                step="any"
                class="form-input font-mono"
                placeholder="36.850000"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('locations.longitude') }}</label>
              <input
                v-model.number="regionForm.coordinates.lng"
                type="number"
                step="any"
                class="form-input font-mono"
                placeholder="31.050000"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('locations.zoomLevel') }}</label>
              <input
                v-model.number="regionForm.zoom"
                type="number"
                min="1"
                max="20"
                class="form-input font-mono"
                placeholder="14"
              />
            </div>
          </div>

          <!-- Map for coordinate selection -->
          <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
            <div class="h-64 relative" style="z-index: 1;">
              <div id="region-modal-map" class="w-full h-full"></div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700/50 px-3 py-2 text-xs text-gray-500 dark:text-slate-400 text-center flex items-center justify-center gap-2">
              <span class="material-icons text-sm">touch_app</span>
              {{ $t('locations.clickMapToSelect') }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" @click="showRegionModal = false" class="btn btn-secondary">
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          @click="saveRegion"
          class="btn btn-primary"
          :disabled="savingRegion || !regionForm.name"
        >
          <span v-if="savingRegion" class="material-icons text-sm animate-spin mr-1">sync</span>
          {{ $t('common.save') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Components
import Modal from '@/components/common/Modal.vue'

// Data & Services
import { COUNTRIES } from '@/data/countries'
import {
  getCities,
  createCity,
  updateCity,
  deleteCity as deleteCityApi,
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion as deleteRegionApi
} from '@/services/locationService'

// Fix Leaflet default icon paths
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
})

// Custom icons
const cityIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background-color: #a855f7; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

const regionIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background-color: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const { t, locale } = useI18n()
const toast = useToast()

// LocalStorage key
const STORAGE_KEY = 'regionManagement_selectedCountry'

// State - load from localStorage if available
const selectedCountryCode = ref(localStorage.getItem(STORAGE_KEY) || '')
const cities = ref([])
const regions = ref([])
const selectedCity = ref(null)
const loadingCities = ref(false)
const loadingRegions = ref(false)

// Country dropdown state
const showCountryDropdown = ref(false)
const countrySearch = ref('')
const countryDropdownRef = ref(null)
const countrySearchInput = ref(null)

// Watch country change and save to localStorage
watch(selectedCountryCode, (newVal) => {
  if (newVal) {
    localStorage.setItem(STORAGE_KEY, newVal)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
})

// City Modal
const showCityModal = ref(false)
const editingCity = ref(null)
const savingCity = ref(false)
const cityForm = ref({
  name: '',
  coordinates: { lat: null, lng: null },
  zoom: 10
})

// Region Modal
const showRegionModal = ref(false)
const editingRegion = ref(null)
const savingRegion = ref(false)
const regionForm = ref({
  name: '',
  coordinates: { lat: null, lng: null },
  zoom: 14
})

// Map refs
const mainMapContainer = ref(null)
let mainMap = null
let cityModalMap = null
let regionModalMap = null
let cityModalMarker = null
let regionModalMarker = null
let mainMapMarkers = []
let mainCityMarker = null

// Countries sorted by name
const countries = computed(() => {
  return [...COUNTRIES].sort((a, b) => {
    const nameA = getCountryName(a)
    const nameB = getCountryName(b)
    return nameA.localeCompare(nameB, locale.value)
  })
})

// Filtered countries based on search
const filteredCountries = computed(() => {
  if (!countrySearch.value) return countries.value
  const search = countrySearch.value.toLowerCase()
  return countries.value.filter(c => {
    const name = getCountryName(c).toLowerCase()
    return name.includes(search) || c.code.toLowerCase().includes(search)
  })
})

// Selected country object
const selectedCountry = computed(() => {
  if (!selectedCountryCode.value) return null
  return countries.value.find(c => c.code === selectedCountryCode.value)
})

// Toggle country dropdown
const toggleCountryDropdown = () => {
  showCountryDropdown.value = !showCountryDropdown.value
  if (showCountryDropdown.value) {
    countrySearch.value = ''
    nextTick(() => {
      countrySearchInput.value?.focus()
    })
  }
}

// Select country from dropdown
const selectCountry = (country) => {
  selectedCountryCode.value = country.code
  showCountryDropdown.value = false
  countrySearch.value = ''
  loadCities()
}

// Select first filtered country on Enter
const selectFirstCountry = () => {
  if (filteredCountries.value.length > 0) {
    selectCountry(filteredCountries.value[0])
  }
}

// Handle click outside to close dropdown
const handleClickOutside = (event) => {
  if (countryDropdownRef.value && !countryDropdownRef.value.contains(event.target)) {
    showCountryDropdown.value = false
  }
}

// Helpers
const getCountryName = (country) => {
  return country.name[locale.value] || country.name.tr || country.name.en || country.code
}

// City and region names are now simple strings (not multilingual)
const getCityName = (city) => {
  if (!city) return ''
  return city.name || ''
}

const getRegionName = (region) => {
  if (!region) return ''
  return region.name || ''
}

// Load cities for selected country
const loadCities = async () => {
  if (!selectedCountryCode.value) {
    cities.value = []
    selectedCity.value = null
    regions.value = []
    return
  }

  loadingCities.value = true
  try {
    const result = await getCities(selectedCountryCode.value)
    if (result.success) {
      // Ensure coordinates object exists
      cities.value = result.data.map(city => ({
        ...city,
        coordinates: city.coordinates || { lat: null, lng: null },
        zoom: city.zoom || 10
      }))
    }
  } catch (error) {
    console.error('Failed to load cities:', error)
    toast.error(t('common.fetchError'))
  } finally {
    loadingCities.value = false
  }

  // Reset selection
  selectedCity.value = null
  regions.value = []
  destroyMainMap()
}

// Select a city
const selectCity = async (city) => {
  // Ensure coordinates object exists
  selectedCity.value = {
    ...city,
    coordinates: city.coordinates || { lat: null, lng: null },
    zoom: city.zoom || 10
  }
  await loadRegionsForCity(city._id)
}

// Load regions for a city
const loadRegionsForCity = async (cityId) => {
  loadingRegions.value = true
  try {
    const result = await getRegions(cityId)
    if (result.success) {
      regions.value = result.data.map(region => ({
        ...region,
        coordinates: region.coordinates || { lat: null, lng: null },
        zoom: region.zoom || 14
      }))
      nextTick(() => {
        initMainMap()
        updateMainMapMarkers()
      })
    }
  } catch (error) {
    console.error('Failed to load regions:', error)
    regions.value = []
  } finally {
    loadingRegions.value = false
  }
}

// ============= City Modal =============
const openCityModal = (city = null) => {
  editingCity.value = city
  if (city) {
    cityForm.value = {
      name: city.name || '',
      coordinates: city.coordinates ? { ...city.coordinates } : { lat: null, lng: null },
      zoom: city.zoom || 10
    }
  } else {
    cityForm.value = {
      name: '',
      coordinates: { lat: null, lng: null },
      zoom: 10
    }
  }
  showCityModal.value = true

  nextTick(() => {
    setTimeout(() => initCityModalMap(), 200)
  })
}

const saveCity = async () => {
  if (!cityForm.value.name) {
    toast.error(t('validation.required'))
    return
  }

  savingCity.value = true
  try {
    const data = {
      name: cityForm.value.name,
      coordinates: cityForm.value.coordinates.lat ? cityForm.value.coordinates : null,
      zoom: cityForm.value.zoom
    }

    if (editingCity.value) {
      await updateCity(editingCity.value._id, data)
      toast.success(t('locations.cityUpdated'))
    } else {
      await createCity({
        ...data,
        countryCode: selectedCountryCode.value
      })
      toast.success(t('locations.cityCreated'))
    }
    showCityModal.value = false
    await loadCities()
  } catch (error) {
    console.error('Failed to save city:', error)
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    savingCity.value = false
  }
}

const confirmDeleteCity = async (city) => {
  if (!confirm(t('locations.deleteCityConfirm'))) return

  try {
    await deleteCityApi(city._id)
    toast.success(t('locations.cityDeleted'))

    if (selectedCity.value?._id === city._id) {
      selectedCity.value = null
      regions.value = []
    }

    await loadCities()
  } catch (error) {
    console.error('Failed to delete city:', error)
    toast.error(t('common.operationFailed'))
  }
}

// ============= Region Modal =============
const openRegionModal = (region = null) => {
  editingRegion.value = region
  if (region) {
    regionForm.value = {
      name: region.name || '',
      coordinates: region.coordinates ? { ...region.coordinates } : { lat: null, lng: null },
      zoom: region.zoom || 14
    }
  } else {
    // Default to city coordinates if available
    regionForm.value = {
      name: '',
      coordinates: selectedCity.value?.coordinates?.lat
        ? { ...selectedCity.value.coordinates }
        : { lat: null, lng: null },
      zoom: 14
    }
  }
  showRegionModal.value = true

  nextTick(() => {
    setTimeout(() => initRegionModalMap(), 200)
  })
}

const saveRegion = async () => {
  if (!regionForm.value.name) {
    toast.error(t('validation.required'))
    return
  }

  savingRegion.value = true
  try {
    const data = {
      name: regionForm.value.name,
      coordinates: regionForm.value.coordinates.lat ? regionForm.value.coordinates : null,
      zoom: regionForm.value.zoom
    }

    if (editingRegion.value) {
      await updateRegion(editingRegion.value._id, data)
      toast.success(t('locations.regionUpdated'))
    } else {
      await createRegion({
        ...data,
        city: selectedCity.value._id
      })
      toast.success(t('locations.regionCreated'))
    }
    showRegionModal.value = false
    await loadRegionsForCity(selectedCity.value._id)
  } catch (error) {
    console.error('Failed to save region:', error)
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    savingRegion.value = false
  }
}

const confirmDeleteRegion = async (region) => {
  if (!confirm(t('locations.deleteRegionConfirm'))) return

  try {
    await deleteRegionApi(region._id)
    toast.success(t('locations.regionDeleted'))
    await loadRegionsForCity(selectedCity.value._id)
  } catch (error) {
    console.error('Failed to delete region:', error)
    toast.error(t('common.operationFailed'))
  }
}

// ============= Main Map Functions =============
const initMainMap = () => {
  if (mainMap) return

  const mapElement = document.getElementById('region-main-map')
  if (!mapElement) return

  // Default center or city coordinates
  const center = selectedCity.value?.coordinates?.lat
    ? [selectedCity.value.coordinates.lat, selectedCity.value.coordinates.lng]
    : [39.0, 35.0]
  const zoom = selectedCity.value?.zoom || 6

  mainMap = L.map('region-main-map', {
    center: center,
    zoom: zoom,
    zoomControl: true
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(mainMap)

  setTimeout(() => mainMap.invalidateSize(), 100)
}

const destroyMainMap = () => {
  if (mainMap) {
    mainMap.remove()
    mainMap = null
    mainMapMarkers = []
    mainCityMarker = null
  }
}

const updateMainMapMarkers = () => {
  if (!mainMap) return

  // Clear existing markers
  mainMapMarkers.forEach(marker => mainMap.removeLayer(marker))
  mainMapMarkers = []
  if (mainCityMarker) {
    mainMap.removeLayer(mainCityMarker)
    mainCityMarker = null
  }

  const bounds = []

  // Add city marker
  if (selectedCity.value?.coordinates?.lat) {
    mainCityMarker = L.marker(
      [selectedCity.value.coordinates.lat, selectedCity.value.coordinates.lng],
      { icon: cityIcon }
    )
      .addTo(mainMap)
      .bindPopup(`<strong>${getCityName(selectedCity.value)}</strong><br><small>Şehir Merkezi</small>`)

    bounds.push([selectedCity.value.coordinates.lat, selectedCity.value.coordinates.lng])
  }

  // Add region markers
  regions.value.forEach(region => {
    if (region.coordinates?.lat && region.coordinates?.lng) {
      const marker = L.marker(
        [region.coordinates.lat, region.coordinates.lng],
        { icon: regionIcon }
      )
        .addTo(mainMap)
        .bindPopup(`<strong>${getRegionName(region)}</strong><br><small>${region.coordinates.lat.toFixed(5)}, ${region.coordinates.lng.toFixed(5)}</small>`)

      mainMapMarkers.push(marker)
      bounds.push([region.coordinates.lat, region.coordinates.lng])
    }
  })

  // Fit bounds
  if (bounds.length > 0) {
    mainMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
  } else if (selectedCity.value?.coordinates?.lat) {
    mainMap.setView(
      [selectedCity.value.coordinates.lat, selectedCity.value.coordinates.lng],
      selectedCity.value.zoom || 10
    )
  }
}

const focusOnMap = (region) => {
  if (!mainMap || !region.coordinates?.lat) return
  mainMap.setView([region.coordinates.lat, region.coordinates.lng], region.zoom || 14)

  const marker = mainMapMarkers.find(m => {
    const latlng = m.getLatLng()
    return Math.abs(latlng.lat - region.coordinates.lat) < 0.0001 &&
           Math.abs(latlng.lng - region.coordinates.lng) < 0.0001
  })
  if (marker) marker.openPopup()
}

// ============= City Modal Map =============
const initCityModalMap = () => {
  if (cityModalMap) {
    cityModalMap.remove()
    cityModalMap = null
    cityModalMarker = null
  }

  const mapElement = document.getElementById('city-modal-map')
  if (!mapElement) return

  const hasCoords = cityForm.value.coordinates?.lat && cityForm.value.coordinates?.lng
  const center = hasCoords
    ? [cityForm.value.coordinates.lat, cityForm.value.coordinates.lng]
    : [39.0, 35.0]

  cityModalMap = L.map('city-modal-map', {
    center: center,
    zoom: hasCoords ? (cityForm.value.zoom || 10) : 6,
    zoomControl: true
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(cityModalMap)

  if (hasCoords) {
    cityModalMarker = L.marker(center, { icon: cityIcon }).addTo(cityModalMap)
  }

  cityModalMap.on('click', (e) => {
    const { lat, lng } = e.latlng
    cityForm.value.coordinates.lat = parseFloat(lat.toFixed(6))
    cityForm.value.coordinates.lng = parseFloat(lng.toFixed(6))
    cityForm.value.zoom = cityModalMap.getZoom()

    if (cityModalMarker) {
      cityModalMarker.setLatLng([lat, lng])
    } else {
      cityModalMarker = L.marker([lat, lng], { icon: cityIcon }).addTo(cityModalMap)
    }
  })

  setTimeout(() => cityModalMap.invalidateSize(), 100)
}

// ============= Region Modal Map =============
const initRegionModalMap = () => {
  if (regionModalMap) {
    regionModalMap.remove()
    regionModalMap = null
    regionModalMarker = null
  }

  const mapElement = document.getElementById('region-modal-map')
  if (!mapElement) return

  const hasCoords = regionForm.value.coordinates?.lat && regionForm.value.coordinates?.lng
  const center = hasCoords
    ? [regionForm.value.coordinates.lat, regionForm.value.coordinates.lng]
    : selectedCity.value?.coordinates?.lat
      ? [selectedCity.value.coordinates.lat, selectedCity.value.coordinates.lng]
      : [39.0, 35.0]

  regionModalMap = L.map('region-modal-map', {
    center: center,
    zoom: hasCoords ? (regionForm.value.zoom || 14) : (selectedCity.value?.zoom || 10),
    zoomControl: true
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(regionModalMap)

  if (hasCoords) {
    regionModalMarker = L.marker(center, { icon: regionIcon }).addTo(regionModalMap)
  }

  regionModalMap.on('click', (e) => {
    const { lat, lng } = e.latlng
    regionForm.value.coordinates.lat = parseFloat(lat.toFixed(6))
    regionForm.value.coordinates.lng = parseFloat(lng.toFixed(6))
    regionForm.value.zoom = regionModalMap.getZoom()

    if (regionModalMarker) {
      regionModalMarker.setLatLng([lat, lng])
    } else {
      regionModalMarker = L.marker([lat, lng], { icon: regionIcon }).addTo(regionModalMap)
    }
  })

  // Zoom change handler - update zoom input in real-time
  regionModalMap.on('zoomend', () => {
    regionForm.value.zoom = regionModalMap.getZoom()
  })

  setTimeout(() => regionModalMap.invalidateSize(), 100)
}

// Watch for modal close to cleanup
watch(showCityModal, (val) => {
  if (!val && cityModalMap) {
    cityModalMap.remove()
    cityModalMap = null
    cityModalMarker = null
  }
})

watch(showRegionModal, (val) => {
  if (!val && regionModalMap) {
    regionModalMap.remove()
    regionModalMap = null
    regionModalMarker = null
  }
})

// Lifecycle
onMounted(() => {
  // Load cities if country was saved in localStorage
  if (selectedCountryCode.value) {
    loadCities()
  }

  // Add click outside listener for dropdown
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  destroyMainMap()
  if (cityModalMap) cityModalMap.remove()
  if (regionModalMap) regionModalMap.remove()

  // Remove click outside listener
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Ensure Leaflet map controls are visible */
:deep(.leaflet-control-container) {
  z-index: 1 !important;
}

:deep(.leaflet-pane) {
  z-index: 1 !important;
}

:deep(.leaflet-top),
:deep(.leaflet-bottom) {
  z-index: 1 !important;
}

:deep(.leaflet-popup) {
  z-index: 2 !important;
}
</style>
