<template>
  <div class="space-y-4">
    <!-- Country & City Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Country Select with Search -->
      <div class="relative" ref="countryDropdownRef">
        <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
          <span class="material-icons text-sm text-indigo-500">flag</span>
          {{ $t('locations.country') }}
        </label>
        <div class="relative">
          <button
            type="button"
            @click="toggleCountryDropdown"
            class="form-input w-full pl-10 pr-10 text-left cursor-pointer flex items-center gap-2"
            :class="localCountryCode ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20' : ''"
            :disabled="disabled"
          >
            <template v-if="selectedCountry">
              <img :src="`/flags/${selectedCountry.code.toLowerCase()}.svg`" :alt="selectedCountry.code" class="w-5 h-4 object-contain" />
              <span class="truncate">{{ getCountryName(selectedCountry) }}</span>
            </template>
            <span v-else class="text-gray-400 dark:text-slate-500">{{ $t('locations.selectCountry') }}</span>
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
                :class="country.code === localCountryCode ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-slate-300'"
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

      <!-- City Select with Search -->
      <div class="relative" ref="cityDropdownRef">
        <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
          <span class="material-icons text-sm text-purple-500">location_city</span>
          {{ $t('locations.city') }}
        </label>
        <div class="relative">
          <button
            type="button"
            @click="toggleCityDropdown"
            class="form-input w-full pl-10 pr-10 text-left cursor-pointer flex items-center"
            :class="[
              localCityId ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/20' : '',
              (!localCountryCode || loadingCities) ? 'opacity-60 cursor-not-allowed' : ''
            ]"
            :disabled="disabled || !localCountryCode || loadingCities"
          >
            <span v-if="loadingCities" class="text-gray-400 dark:text-slate-500">{{ $t('common.loading') }}</span>
            <span v-else-if="selectedCity" class="truncate">{{ getCityName(selectedCity) }}</span>
            <span v-else class="text-gray-400 dark:text-slate-500">{{ $t('locations.selectCity') }}</span>
          </button>
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <span v-if="loadingCities" class="material-icons text-lg animate-spin">sync</span>
            <span v-else class="material-icons text-lg">apartment</span>
          </span>
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <span class="material-icons text-lg transition-transform" :class="showCityDropdown ? 'rotate-180' : ''">expand_more</span>
          </span>

          <!-- City Dropdown -->
          <div
            v-if="showCityDropdown && !loadingCities"
            class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden"
          >
            <!-- Search Input -->
            <div class="p-2 border-b border-gray-200 dark:border-slate-700">
              <div class="relative">
                <input
                  ref="citySearchInput"
                  v-model="citySearch"
                  type="text"
                  :placeholder="$t('common.search')"
                  class="form-input w-full pl-8 py-1.5 text-sm"
                  @keydown.enter.prevent="selectFirstCity"
                  @keydown.esc="showCityDropdown = false"
                />
                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <span class="material-icons text-sm">search</span>
                </span>
              </div>
            </div>
            <!-- Options List -->
            <div class="max-h-60 overflow-y-auto">
              <button
                v-for="city in filteredCities"
                :key="city._id"
                type="button"
                @click="selectCity(city)"
                class="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-2 transition-colors"
                :class="city._id === localCityId ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-slate-300'"
              >
                <span class="material-icons text-sm text-purple-400">place</span>
                <span class="truncate">{{ getCityName(city) }}</span>
              </button>
              <div v-if="filteredCities.length === 0" class="px-3 py-4 text-center text-sm text-gray-500 dark:text-slate-400">
                {{ $t('common.noData') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- District Select (İlçe) - Hidden by default -->
    <div v-if="showDistrict" class="relative">
      <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
        <span class="material-icons text-sm text-blue-500">domain</span>
        {{ $t('locations.district') }}
      </label>
      <div class="relative">
        <select
          v-model="localDistrictId"
          @change="handleDistrictChange"
          class="form-input w-full pl-10 appearance-none cursor-pointer"
          :class="localDistrictId ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20' : ''"
          :disabled="disabled || !localCityId || loadingDistricts"
        >
          <option value="">{{ loadingDistricts ? $t('common.loading') : $t('locations.selectDistrict') }}</option>
          <option v-for="district in districts" :key="district._id" :value="district._id">
            {{ getDistrictName(district) }}
          </option>
        </select>
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <span v-if="loadingDistricts" class="material-icons text-lg animate-spin">sync</span>
          <span v-else class="material-icons text-lg">domain</span>
        </span>
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <span class="material-icons text-lg">expand_more</span>
        </span>
      </div>
    </div>

    <!-- Tourism Regions -->
    <div v-if="localCityId" class="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
      <div class="flex items-center justify-between mb-3">
        <label class="text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <span class="material-icons text-lg">travel_explore</span>
          {{ $t('locations.tourismRegions') }}
        </label>
        <span v-if="regions.length > 0 && !loadingRegions" class="text-xs text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {{ selectedRegions.length }} / {{ regions.length }}
        </span>
      </div>

      <!-- Selected Regions as Chips -->
      <div class="flex flex-wrap gap-2 mb-3" v-if="selectedRegions.length > 0">
        <span
          v-for="region in selectedRegions"
          :key="region._id"
          class="group inline-flex items-center gap-1.5 pl-2 pr-1 py-1 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm shadow-sm border border-emerald-200 dark:border-emerald-700 hover:shadow transition-shadow"
        >
          <span class="material-icons text-sm text-emerald-500">place</span>
          <span class="font-medium">{{ getRegionName(region) }}</span>
          <button
            v-if="!disabled"
            type="button"
            @click="removeRegion(region._id)"
            class="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <span class="material-icons text-sm">close</span>
          </button>
        </span>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loadingRegions && regions.length > 0" class="text-center py-2 text-sm text-emerald-600 dark:text-emerald-400">
        <span class="material-icons text-lg align-middle mr-1">info</span>
        {{ $t('locations.noRegionsSelected') }}
      </div>

      <!-- Add Region Dropdown -->
      <div class="relative" v-if="availableRegions.length > 0 || loadingRegions">
        <select
          v-model="regionToAdd"
          @change="addRegion"
          class="form-input w-full pl-10 pr-10 appearance-none cursor-pointer bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700"
          :disabled="disabled || loadingRegions"
        >
          <option value="">
            {{ loadingRegions ? $t('common.loading') : $t('locations.addRegion') }}
          </option>
          <option v-for="region in availableRegions" :key="region._id" :value="region._id">
            {{ getRegionName(region) }}
          </option>
        </select>
        <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <span v-if="loadingRegions" class="material-icons text-lg text-emerald-500 animate-spin">sync</span>
          <span v-else class="material-icons text-lg text-emerald-500">add_circle</span>
        </span>
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <span class="material-icons text-lg">expand_more</span>
        </span>
      </div>

      <!-- All Regions Selected -->
      <div v-else-if="!loadingRegions && regions.length > 0" class="text-center py-2 text-sm text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 rounded-lg">
        <span class="material-icons text-lg align-middle mr-1">check_circle</span>
        {{ $t('locations.allRegionsSelected') }}
      </div>

      <!-- No Regions Available -->
      <div v-else-if="!loadingRegions && regions.length === 0" class="text-center py-3 text-sm text-gray-500 dark:text-slate-400">
        <span class="material-icons text-lg align-middle mr-1">info</span>
        {{ $t('locations.noRegionsAvailable') }}
      </div>
    </div>

    <!-- Waiting for City Selection -->
    <div v-else-if="localCountryCode && !localCityId" class="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 text-center">
      <span class="material-icons text-2xl text-gray-400 dark:text-slate-500 mb-1">travel_explore</span>
      <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('locations.selectCityForRegions') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCities, getDistricts, getRegions } from '@/services/locationService'
import { COUNTRIES } from '@/data/countries'

const props = defineProps({
  countryCode: {
    type: String,
    default: ''
  },
  cityId: {
    type: String,
    default: ''
  },
  districtId: {
    type: String,
    default: ''
  },
  // Array of region IDs
  regionIds: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showDistrict: {
    type: Boolean,
    default: false
  },
  lang: {
    type: String,
    default: 'tr'
  }
})

const emit = defineEmits([
  'update:countryCode',
  'update:cityId',
  'update:districtId',
  'update:regionIds',
  'change',
  'city-selected'
])

const { locale } = useI18n()

// Local state
const localCountryCode = ref(props.countryCode)
const localCityId = ref(props.cityId)
const localDistrictId = ref(props.districtId)
const localRegionIds = ref([...props.regionIds])
const regionToAdd = ref('')

// Dropdown states
const showCountryDropdown = ref(false)
const showCityDropdown = ref(false)
const countrySearch = ref('')
const citySearch = ref('')

// Template refs
const countryDropdownRef = ref(null)
const cityDropdownRef = ref(null)
const countrySearchInput = ref(null)
const citySearchInput = ref(null)

// Data
const cities = ref([])
const districts = ref([])
const regions = ref([])
const loadingCities = ref(false)
const loadingDistricts = ref(false)
const loadingRegions = ref(false)

// Countries sorted by name (COUNTRIES already has flag property from countries.js)
const countries = computed(() => {
  return [...COUNTRIES].sort((a, b) => {
    const nameA = getCountryName(a)
    const nameB = getCountryName(b)
    return nameA.localeCompare(nameB, props.lang)
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

// Filtered cities based on search
const filteredCities = computed(() => {
  if (!citySearch.value) return cities.value
  const search = citySearch.value.toLowerCase()
  return cities.value.filter(c => {
    const name = getCityName(c).toLowerCase()
    return name.includes(search)
  })
})

// Selected country object (from countries computed which has flags)
const selectedCountry = computed(() => {
  if (!localCountryCode.value) return null
  return countries.value.find(c => c.code === localCountryCode.value)
})

// Selected city object
const selectedCity = computed(() => {
  if (!localCityId.value) return null
  return cities.value.find(c => c._id === localCityId.value)
})

// Toggle country dropdown
const toggleCountryDropdown = () => {
  if (props.disabled) return
  showCountryDropdown.value = !showCountryDropdown.value
  showCityDropdown.value = false
  if (showCountryDropdown.value) {
    countrySearch.value = ''
    nextTick(() => {
      countrySearchInput.value?.focus()
    })
  }
}

// Toggle city dropdown
const toggleCityDropdown = () => {
  if (props.disabled || !localCountryCode.value || loadingCities.value) return
  showCityDropdown.value = !showCityDropdown.value
  showCountryDropdown.value = false
  if (showCityDropdown.value) {
    citySearch.value = ''
    nextTick(() => {
      citySearchInput.value?.focus()
    })
  }
}

// Select country
const selectCountry = (country) => {
  localCountryCode.value = country.code
  showCountryDropdown.value = false
  countrySearch.value = ''
  handleCountryChange()
}

// Select city
const selectCity = (city) => {
  localCityId.value = city._id
  showCityDropdown.value = false
  citySearch.value = ''
  handleCityChange()
}

// Select first filtered country on Enter
const selectFirstCountry = () => {
  if (filteredCountries.value.length > 0) {
    selectCountry(filteredCountries.value[0])
  }
}

// Select first filtered city on Enter
const selectFirstCity = () => {
  if (filteredCities.value.length > 0) {
    selectCity(filteredCities.value[0])
  }
}

// Handle click outside to close dropdowns
const handleClickOutside = (event) => {
  if (countryDropdownRef.value && !countryDropdownRef.value.contains(event.target)) {
    showCountryDropdown.value = false
  }
  if (cityDropdownRef.value && !cityDropdownRef.value.contains(event.target)) {
    showCityDropdown.value = false
  }
}

// Selected regions (full objects)
const selectedRegions = computed(() => {
  return regions.value.filter(r => localRegionIds.value.includes(r._id))
})

// Available regions (not yet selected)
const availableRegions = computed(() => {
  return regions.value.filter(r => !localRegionIds.value.includes(r._id))
})

// Get country display name
const getCountryName = (country) => {
  return country.name[props.lang] || country.name.tr || country.name.en || country.code
}

// Get city display name (name is now a simple string)
const getCityName = (city) => {
  if (!city) return ''
  return city.name || ''
}

// Get district display name (name is now a simple string)
const getDistrictName = (district) => {
  if (!district) return ''
  return district.name || ''
}

// Get region display name (name is now a simple string)
const getRegionName = (region) => {
  if (!region) return ''
  return region.name || ''
}

// Load cities for selected country
const loadCities = async (countryCode) => {
  if (!countryCode) {
    cities.value = []
    return
  }

  loadingCities.value = true
  try {
    const result = await getCities(countryCode)
    if (result.success) {
      cities.value = result.data
    }
  } catch (error) {
    console.error('Failed to load cities:', error)
    cities.value = []
  } finally {
    loadingCities.value = false
  }
}

// Load districts for selected city
const loadDistrictsData = async (cityId) => {
  if (!cityId) {
    districts.value = []
    return
  }

  loadingDistricts.value = true
  try {
    const result = await getDistricts(cityId)
    if (result.success) {
      districts.value = result.data
    }
  } catch (error) {
    console.error('Failed to load districts:', error)
    districts.value = []
  } finally {
    loadingDistricts.value = false
  }
}

// Load regions for selected city
const loadRegions = async (cityId) => {
  if (!cityId) {
    regions.value = []
    return
  }

  loadingRegions.value = true
  try {
    const result = await getRegions(cityId)
    if (result.success) {
      regions.value = result.data
    }
  } catch (error) {
    console.error('Failed to load regions:', error)
    regions.value = []
  } finally {
    loadingRegions.value = false
  }
}

// Handle country change
const handleCountryChange = () => {
  // Reset all child selections
  localCityId.value = ''
  localDistrictId.value = ''
  localRegionIds.value = []
  cities.value = []
  districts.value = []
  regions.value = []

  emit('update:countryCode', localCountryCode.value)
  emit('update:cityId', '')
  emit('update:districtId', '')
  emit('update:regionIds', [])

  // Load cities for new country
  if (localCountryCode.value) {
    loadCities(localCountryCode.value)
  }

  emitChange()
}

// Handle city change
const handleCityChange = () => {
  // Reset district and regions
  localDistrictId.value = ''
  localRegionIds.value = []
  districts.value = []
  regions.value = []

  emit('update:cityId', localCityId.value)
  emit('update:districtId', '')
  emit('update:regionIds', [])

  // Load districts and regions for new city
  if (localCityId.value) {
    loadDistrictsData(localCityId.value)
    loadRegions(localCityId.value)

    // Emit selected city object with coordinates
    const cityObj = cities.value.find(c => c._id === localCityId.value)
    if (cityObj) {
      emit('city-selected', cityObj)
    }
  }

  emitChange()
}

// Handle district change
const handleDistrictChange = () => {
  emit('update:districtId', localDistrictId.value)
  emitChange()
}

// Add region to selection
const addRegion = () => {
  if (!regionToAdd.value || localRegionIds.value.includes(regionToAdd.value)) {
    regionToAdd.value = ''
    return
  }

  localRegionIds.value.push(regionToAdd.value)
  emit('update:regionIds', [...localRegionIds.value])
  regionToAdd.value = ''
  emitChange()
}

// Remove region from selection
const removeRegion = (regionId) => {
  localRegionIds.value = localRegionIds.value.filter(id => id !== regionId)
  emit('update:regionIds', [...localRegionIds.value])
  emitChange()
}

// Emit change event with all values
const emitChange = () => {
  emit('change', {
    countryCode: localCountryCode.value,
    cityId: localCityId.value,
    districtId: localDistrictId.value,
    regionIds: localRegionIds.value
  })
}

// Watch prop changes
watch(() => props.countryCode, (newVal) => {
  if (newVal !== localCountryCode.value) {
    localCountryCode.value = newVal
    if (newVal) {
      loadCities(newVal)
    }
  }
})

watch(() => props.cityId, (newVal) => {
  if (newVal !== localCityId.value) {
    localCityId.value = newVal
    if (newVal) {
      loadDistrictsData(newVal)
      loadRegions(newVal)
    }
  }
})

watch(() => props.districtId, (newVal) => {
  if (newVal !== localDistrictId.value) {
    localDistrictId.value = newVal
  }
})

watch(() => props.regionIds, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(localRegionIds.value)) {
    localRegionIds.value = [...newVal]
  }
}, { deep: true })

// Initial load
onMounted(() => {
  if (props.countryCode) {
    loadCities(props.countryCode)
  }
  if (props.cityId) {
    loadDistrictsData(props.cityId)
    loadRegions(props.cityId)
  }

  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

// Cleanup
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
