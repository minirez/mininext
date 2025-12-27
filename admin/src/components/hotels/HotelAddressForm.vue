<template>
  <div class="space-y-6">
    <!-- Hierarchical Location Selection - TOP -->
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">{{ $t('locations.hierarchicalLocation') }}</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">{{ $t('locations.hierarchicalLocationHelp') }}</p>

      <CascadingLocationSelect
        v-model:country-code="location.countryCode"
        v-model:city-id="location.cityId"
        v-model:region-ids="location.regionIds"
        @city-selected="handleCitySelected"
      />
    </div>

    <!-- Address & Map Section -->
    <div class="pt-6 border-t border-gray-200 dark:border-slate-700">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">{{ $t('hotels.address.title') }}</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">{{ $t('hotels.address.mapHelp') }}</p>

      <!-- Address Search -->
      <div class="mb-6">
        <label class="form-label">{{ $t('hotels.address.searchLocation') }}</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <span class="material-icons text-lg">search</span>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            class="form-input pl-10 pr-20"
            :placeholder="$t('hotels.address.searchLocation')"
            @keydown.enter.prevent="searchAddress"
          />
          <button
            type="button"
            @click="searchAddress"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
            :disabled="searching"
          >
            <span v-if="searching" class="material-icons text-sm animate-spin">sync</span>
            <span v-else>{{ $t('common.search') }}</span>
          </button>
        </div>
      </div>

      <!-- Interactive Map Container -->
      <div class="mb-6 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div class="h-96 relative" ref="mapContainer">
          <div id="hotel-map" class="w-full h-full z-0"></div>

          <!-- Map overlay instructions -->
          <div
            v-if="!form.coordinates.lat || !form.coordinates.lng"
            class="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-10"
          >
            <div class="bg-white dark:bg-slate-800 rounded-lg px-4 py-3 shadow-lg text-center">
              <span class="material-icons text-3xl text-purple-600 mb-2">touch_app</span>
              <p class="text-sm text-gray-700 dark:text-slate-300">{{ $t('hotels.address.clickToSelect') }}</p>
            </div>
          </div>
        </div>

        <!-- Map Actions -->
        <div class="bg-white dark:bg-slate-800 p-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-700">
          <div class="flex items-center gap-4">
            <!-- Current Location Button -->
            <button
              type="button"
              @click="getCurrentLocation"
              class="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              :disabled="gettingLocation"
            >
              <span class="material-icons text-lg" :class="{ 'animate-pulse': gettingLocation }">my_location</span>
              {{ $t('hotels.address.currentLocation') }}
            </button>

            <!-- Center on marker -->
            <button
              v-if="form.coordinates.lat && form.coordinates.lng"
              type="button"
              @click="centerOnMarker"
              class="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <span class="material-icons text-lg">center_focus_strong</span>
              {{ $t('hotels.address.centerMap') }}
            </button>
          </div>
          <div v-if="form.coordinates.lat && form.coordinates.lng" class="text-sm text-gray-500 dark:text-slate-400 font-mono">
            {{ form.coordinates.lat.toFixed(6) }}, {{ form.coordinates.lng.toFixed(6) }}
          </div>
        </div>
      </div>

      <!-- Street Address Only -->
      <div>
        <label class="form-label">{{ $t('hotels.address.street') }}</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <span class="material-icons text-lg">home</span>
          </span>
          <input
            v-model="form.street"
            type="text"
            class="form-input pl-10"
            :placeholder="$t('hotels.address.streetPlaceholder')"
          />
        </div>
      </div>
    </div>

    <!-- Manual Coordinates -->
    <div class="pt-6 border-t border-gray-200 dark:border-slate-700">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">{{ $t('hotels.address.coordinates') }}</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">{{ $t('hotels.address.coordinatesHelp') }}</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Latitude -->
        <div>
          <label class="form-label">{{ $t('hotels.address.latitude') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">north</span>
            </span>
            <input
              v-model.number="form.coordinates.lat"
              type="number"
              step="any"
              class="form-input pl-10"
              placeholder="41.0082"
              @change="updateMarkerFromInput"
            />
          </div>
        </div>

        <!-- Longitude -->
        <div>
          <label class="form-label">{{ $t('hotels.address.longitude') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">east</span>
            </span>
            <input
              v-model.number="form.coordinates.lng"
              type="number"
              step="any"
              class="form-input pl-10"
              placeholder="28.9784"
              @change="updateMarkerFromInput"
            />
          </div>
        </div>

        <!-- Formatted Address -->
        <div class="md:col-span-2">
          <label class="form-label">{{ $t('hotels.address.formattedAddress') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span class="material-icons text-lg">place</span>
            </span>
            <input
              v-model="form.formattedAddress"
              type="text"
              class="form-input pl-10"
              :placeholder="$t('hotels.address.formattedAddress')"
            />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon paths issue with bundlers (Vite/Webpack)
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
})

import CascadingLocationSelect from '@/components/common/CascadingLocationSelect.vue'

const toast = useToast()
const { t } = useI18n()

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['validation-change'])

const searchQuery = ref('')
const searching = ref(false)
const gettingLocation = ref(false)
const mapContainer = ref(null)

// Leaflet map and marker references
let map = null
let marker = null

// Default center (Istanbul)
const defaultCenter = [41.0082, 28.9784]
const defaultZoom = 13

const form = ref({
  street: '',
  coordinates: {
    lat: null,
    lng: null
  },
  formattedAddress: ''
})

// Hierarchical location state
const location = ref({
  countryCode: '',
  cityId: '',
  regionIds: []
})

// Handle city selection - focus map on city coordinates
const handleCitySelected = (city) => {
  if (city?.coordinates?.lat && city?.coordinates?.lng) {
    // Focus map on city coordinates
    if (map) {
      map.setView([city.coordinates.lat, city.coordinates.lng], city.zoom || 12)
    }
  }
}

// Custom marker icon
const createMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 16px;
          font-weight: bold;
        ">🏨</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  })
}

// Initialize Leaflet map
const initMap = () => {
  if (map) return

  const center = form.value.coordinates.lat && form.value.coordinates.lng
    ? [form.value.coordinates.lat, form.value.coordinates.lng]
    : defaultCenter

  map = L.map('hotel-map', {
    center: center,
    zoom: form.value.coordinates.lat ? 16 : defaultZoom,
    zoomControl: true
  })

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  // Add initial marker if coordinates exist
  if (form.value.coordinates.lat && form.value.coordinates.lng) {
    addMarker(form.value.coordinates.lat, form.value.coordinates.lng)
  }

  // Click event to place marker
  map.on('click', (e) => {
    const { lat, lng } = e.latlng
    setLocation(lat, lng, true)
  })
}

// Add or update marker
const addMarker = (lat, lng) => {
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng], {
      icon: createMarkerIcon(),
      draggable: true
    }).addTo(map)

    // Marker drag event
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng()
      setLocation(lat, lng, true)
    })

    // Popup with coordinates
    marker.bindPopup(() => {
      return `<div class="text-center">
        <strong>📍 ${t('hotels.address.selectedLocation')}</strong><br>
        <small>${form.value.coordinates.lat?.toFixed(6)}, ${form.value.coordinates.lng?.toFixed(6)}</small>
      </div>`
    })
  }
}

// Set location and optionally reverse geocode
const setLocation = async (lat, lng, reverseGeocode = false) => {
  form.value.coordinates.lat = lat
  form.value.coordinates.lng = lng

  addMarker(lat, lng)

  if (reverseGeocode) {
    await reverseGeocodeLocation(lat, lng)
  }
}

// Reverse geocode to get address from coordinates
const reverseGeocodeLocation = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'tr,en'
        }
      }
    )

    const data = await response.json()

    if (data && data.address) {
      form.value.formattedAddress = data.display_name
      form.value.street = data.address.road || data.address.street || ''
    }
  } catch (error) {
    console.error('Reverse geocode error:', error)
  }
}

// Update marker from manual input
const updateMarkerFromInput = () => {
  if (form.value.coordinates.lat && form.value.coordinates.lng && map) {
    addMarker(form.value.coordinates.lat, form.value.coordinates.lng)
    map.setView([form.value.coordinates.lat, form.value.coordinates.lng], 16)
  }
}

// Center map on marker
const centerOnMarker = () => {
  if (map && form.value.coordinates.lat && form.value.coordinates.lng) {
    map.setView([form.value.coordinates.lat, form.value.coordinates.lng], 16)
  }
}

// Watch for hotel changes and update form
watch(() => props.hotel, (newHotel) => {
  if (newHotel?.address) {
    form.value = {
      street: newHotel.address.street || '',
      coordinates: {
        lat: newHotel.address.coordinates?.lat || null,
        lng: newHotel.address.coordinates?.lng || null
      },
      formattedAddress: newHotel.address.formattedAddress || ''
    }

    // Update hierarchical location
    if (newHotel.location) {
      location.value = {
        countryCode: newHotel.location.countryCode || '',
        cityId: newHotel.location.city || '',
        regionIds: newHotel.location.tourismRegions || []
      }
    }

    // Update map if it exists
    nextTick(() => {
      if (map && form.value.coordinates.lat && form.value.coordinates.lng) {
        addMarker(form.value.coordinates.lat, form.value.coordinates.lng)
        map.setView([form.value.coordinates.lat, form.value.coordinates.lng], 16)
      }
    })
  }
}, { immediate: true, deep: true })

// Search address using Nominatim (OpenStreetMap)
const searchAddress = async () => {
  if (!searchQuery.value.trim()) return

  searching.value = true
  try {
    const query = encodeURIComponent(searchQuery.value)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=1`,
      {
        headers: {
          'Accept-Language': 'tr,en'
        }
      }
    )

    const data = await response.json()

    if (data && data.length > 0) {
      const result = data[0]
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)

      form.value.coordinates.lat = lat
      form.value.coordinates.lng = lng
      form.value.formattedAddress = result.display_name

      // Parse street address
      if (result.address) {
        form.value.street = result.address.road || result.address.street || ''
      }

      // Update map
      if (map) {
        addMarker(lat, lng)
        map.setView([lat, lng], 16)
      }

      toast.success(t('hotels.address.locationFound'))
    } else {
      toast.warning(t('common.noData'))
    }
  } catch (error) {
    console.error('Address search error:', error)
    toast.error(t('common.operationFailed'))
  } finally {
    searching.value = false
  }
}

// Get current location
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    toast.error('Geolocation is not supported by your browser')
    return
  }

  gettingLocation.value = true

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude

      await setLocation(lat, lng, true)

      if (map) {
        map.setView([lat, lng], 16)
      }

      gettingLocation.value = false
      toast.success(t('hotels.address.currentLocation'))
    },
    (error) => {
      gettingLocation.value = false
      console.error('Geolocation error:', error)
      toast.error('Could not get your location')
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  )
}

// Validate all fields
const validateAll = () => {
  // Location is selected via dropdowns, no validation needed
  return true
}

// Get current form data (called by parent)
const getFormData = () => {
  return {
    address: {
      street: form.value.street,
      coordinates: form.value.coordinates,
      formattedAddress: form.value.formattedAddress
    },
    location: {
      countryCode: location.value.countryCode,
      city: location.value.cityId || null,
      tourismRegions: location.value.regionIds || []
    }
  }
}

// Invalidate map size when component becomes visible (for tab switching)
const invalidateMapSize = () => {
  if (map) {
    nextTick(() => {
      map.invalidateSize()
    })
  }
}

// Expose methods for parent component
defineExpose({
  validateAll,
  getFormData,
  invalidateMapSize
})

// Lifecycle hooks
onMounted(() => {
  nextTick(() => {
    initMap()
    // Also invalidate size after a short delay (for initial load in tabs)
    setTimeout(() => {
      if (map) {
        map.invalidateSize()
      }
    }, 100)
  })
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
    marker = null
  }
})
</script>

<style>
/* Fix Leaflet default marker icon issue */
.leaflet-default-icon-path {
  background-image: url(https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png);
}

/* Custom marker styles */
.custom-marker {
  background: transparent !important;
  border: none !important;
}

/* Leaflet popup styles */
.leaflet-popup-content-wrapper {
  border-radius: 8px;
}

.leaflet-popup-content {
  margin: 12px;
}

/* Dark mode support for map */
.dark .leaflet-tile {
  filter: brightness(0.85) contrast(1.1);
}

.dark .leaflet-control-zoom a {
  background-color: #1e293b;
  color: #e2e8f0;
  border-color: #334155;
}

.dark .leaflet-control-zoom a:hover {
  background-color: #334155;
}

.dark .leaflet-control-attribution {
  background-color: rgba(30, 41, 59, 0.8);
  color: #94a3b8;
}

.dark .leaflet-popup-content-wrapper {
  background-color: #1e293b;
  color: #e2e8f0;
}

.dark .leaflet-popup-tip {
  background-color: #1e293b;
}
</style>
