<template>
  <div class="space-y-6">
    <!-- Info Card -->
    <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div class="flex items-start gap-3">
        <span class="material-icons text-blue-600 dark:text-blue-400">info</span>
        <div>
          <p class="text-sm text-blue-800 dark:text-blue-200">
            {{ $t('planning.markets.countriesInfo') }}
          </p>
          <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {{ $t('planning.markets.countriesHint') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1 relative">
        <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
        <input
          v-model="searchQuery"
          type="text"
          class="form-input w-full pl-10"
          :placeholder="$t('planning.markets.searchCountries')"
        />
      </div>
      <div class="flex gap-2">
        <select v-model="selectedRegion" class="form-select">
          <option value="">{{ $t('planning.markets.allRegions') }}</option>
          <option v-for="region in REGIONS" :key="region.code" :value="region.code">
            {{ getRegionLabel(region.code) }}
          </option>
        </select>
        <button
          type="button"
          @click="showOnlySelected = !showOnlySelected"
          class="px-3 py-2 rounded-lg border transition-colors"
          :class="showOnlySelected
            ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
            : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300'"
        >
          <span class="material-icons text-sm">{{ showOnlySelected ? 'visibility' : 'visibility_off' }}</span>
        </button>
      </div>
    </div>

    <!-- Selected Count -->
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-600 dark:text-slate-400">
        {{ $t('planning.markets.selectedCountries') }}:
        <strong class="text-purple-600 dark:text-purple-400">{{ selectedCountries.length }}</strong>
        / {{ COUNTRIES.length }}
      </span>
      <div class="flex gap-2">
        <button
          type="button"
          @click="selectAllVisible"
          class="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
        >
          {{ $t('planning.markets.selectAllVisible') }}
        </button>
        <span class="text-gray-300 dark:text-slate-600">|</span>
        <button
          type="button"
          @click="clearSelection"
          class="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
        >
          {{ $t('planning.markets.clearSelection') }}
        </button>
      </div>
    </div>

    <!-- Popular Countries Quick Select -->
    <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <p class="text-xs font-medium text-gray-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
        {{ $t('planning.markets.popularCountries') }}
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="country in popularCountries"
          :key="country.code"
          type="button"
          @click="toggleCountry(country.code)"
          :disabled="isAssigned(country.code)"
          class="px-3 py-1.5 text-sm rounded-full border transition-all flex items-center gap-1"
          :class="getCountryButtonClass(country.code)"
        >
          <img :src="`/flags/${country.code.toLowerCase()}.svg`" :alt="country.code" class="w-5 h-4 object-contain" />
          {{ getCountryLabel(country.code) }}
          <span v-if="isAssigned(country.code)" class="ml-1 text-xs opacity-70">
            ({{ getAssignedMarketCode(country.code) }})
          </span>
        </button>
      </div>
    </div>

    <!-- Countries Grid -->
    <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
      <div class="max-h-96 overflow-y-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 dark:bg-slate-600">
          <div
            v-for="country in filteredCountries"
            :key="country.code"
            class="bg-white dark:bg-slate-800 p-3"
          >
            <label
              class="flex items-center gap-3 cursor-pointer"
              :class="{ 'opacity-50 cursor-not-allowed': isAssigned(country.code) }"
            >
              <input
                type="checkbox"
                :checked="isSelected(country.code)"
                @change="toggleCountry(country.code)"
                :disabled="isAssigned(country.code)"
                class="form-checkbox h-4 w-4 text-purple-600"
              />
              <img :src="`/flags/${country.code.toLowerCase()}.svg`" :alt="country.code" class="w-6 h-5 object-contain" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {{ getCountryLabel(country.code) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-500">
                  {{ country.code }}
                  <span v-if="isAssigned(country.code)" class="ml-2 text-amber-600 dark:text-amber-400">
                    {{ $t('planning.markets.usedBy') }}: {{ getAssignedMarketCode(country.code) }}
                  </span>
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredCountries.length === 0" class="p-8 text-center text-gray-500 dark:text-slate-500">
        <span class="material-icons text-4xl mb-2">search_off</span>
        <p>{{ $t('planning.markets.noCountriesFound') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { COUNTRIES, REGIONS, getPopularCountries, getCountryName, getRegionName } from '@/data/countries'

const props = defineProps({
  market: { type: Object, required: true },
  assignedCountries: { type: Object, default: () => ({}) },
  saving: { type: Boolean, default: false }
})

const { t, locale } = useI18n()

const selectedCountries = ref([])
const searchQuery = ref('')
const selectedRegion = ref('')
const showOnlySelected = ref(false)

// Get popular countries based on selected region
const popularCountries = computed(() => getPopularCountries(selectedRegion.value || null))

// Sync with props
watch(() => props.market.countries, (newVal) => {
  if (newVal) {
    selectedCountries.value = [...newVal]
  }
}, { immediate: true, deep: true })

const getCountryLabel = (code) => {
  return getCountryName(code, locale.value)
}

const getRegionLabel = (code) => {
  return getRegionName(code, locale.value)
}

const isSelected = (code) => {
  return selectedCountries.value.includes(code)
}

const isAssigned = (code) => {
  return !!props.assignedCountries[code]
}

const getAssignedMarketCode = (code) => {
  return props.assignedCountries[code]?.marketCode || ''
}

const toggleCountry = (code) => {
  if (isAssigned(code)) return

  const index = selectedCountries.value.indexOf(code)
  if (index === -1) {
    selectedCountries.value.push(code)
  } else {
    selectedCountries.value.splice(index, 1)
  }
}

const getCountryButtonClass = (code) => {
  if (isAssigned(code)) {
    return 'bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500 cursor-not-allowed'
  }
  if (isSelected(code)) {
    return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
  }
  return 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
}

const filteredCountries = computed(() => {
  let result = [...COUNTRIES]

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c =>
      c.code.toLowerCase().includes(query) ||
      c.name.en.toLowerCase().includes(query) ||
      c.name.tr.toLowerCase().includes(query)
    )
  }

  // Filter by region
  if (selectedRegion.value) {
    result = result.filter(c => c.region === selectedRegion.value)
  }

  // Filter by selected only
  if (showOnlySelected.value) {
    result = result.filter(c => isSelected(c.code))
  }

  // Sort: selected countries first, then alphabetically by locale name
  result.sort((a, b) => {
    const aSelected = isSelected(a.code) ? 0 : 1
    const bSelected = isSelected(b.code) ? 0 : 1
    if (aSelected !== bSelected) return aSelected - bSelected
    // Then sort alphabetically
    return getCountryLabel(a.code).localeCompare(getCountryLabel(b.code), locale.value)
  })

  return result
})

const selectAllVisible = () => {
  filteredCountries.value.forEach(country => {
    if (!isAssigned(country.code) && !isSelected(country.code)) {
      selectedCountries.value.push(country.code)
    }
  })
}

const clearSelection = () => {
  selectedCountries.value = []
}

const getFormData = () => {
  return {
    countries: selectedCountries.value
  }
}

defineExpose({ getFormData })
</script>
