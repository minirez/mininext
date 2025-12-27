<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      @click="toggleDropdown"
      class="form-input w-full pl-10 pr-10 text-left cursor-pointer flex items-center gap-2"
      :class="modelValue ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20' : ''"
      :disabled="disabled"
    >
      <template v-if="selectedCountry">
        <img :src="`/flags/${selectedCountry.code.toLowerCase()}.svg`" :alt="selectedCountry.code" class="w-5 h-4 object-contain" />
        <span class="truncate">{{ getCountryDisplayName(selectedCountry) }}</span>
      </template>
      <span v-else class="text-gray-400 dark:text-slate-500">{{ placeholder || $t('locations.selectCountry') }}</span>
    </button>
    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
      <span class="material-icons text-lg">public</span>
    </span>
    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
      <span class="material-icons text-lg transition-transform" :class="showDropdown ? 'rotate-180' : ''">expand_more</span>
    </span>

    <!-- Dropdown -->
    <div
      v-if="showDropdown"
      class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden"
    >
      <!-- Search Input -->
      <div class="p-2 border-b border-gray-200 dark:border-slate-700">
        <div class="relative">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            :placeholder="$t('common.search')"
            class="form-input w-full pl-8 py-1.5 text-sm"
            @keydown.enter.prevent="selectFirst"
            @keydown.esc="showDropdown = false"
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
          :class="country.code === modelValue ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-slate-300'"
        >
          <img :src="`/flags/${country.code.toLowerCase()}.svg`" :alt="country.code" class="w-5 h-4 object-contain" />
          <span class="truncate">{{ getCountryDisplayName(country) }}</span>
        </button>
        <div v-if="filteredCountries.length === 0" class="px-3 py-4 text-center text-sm text-gray-500 dark:text-slate-400">
          {{ $t('common.noData') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { COUNTRIES } from '@/data/countries'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const { locale } = useI18n()

const showDropdown = ref(false)
const searchQuery = ref('')
const dropdownRef = ref(null)
const searchInput = ref(null)

// Countries sorted by name
const countries = computed(() => {
  return [...COUNTRIES].sort((a, b) => {
    const nameA = getCountryDisplayName(a)
    const nameB = getCountryDisplayName(b)
    return nameA.localeCompare(nameB, locale.value)
  })
})

// Filtered countries based on search
const filteredCountries = computed(() => {
  if (!searchQuery.value) return countries.value
  const search = searchQuery.value.toLowerCase()
  return countries.value.filter(c => {
    const name = getCountryDisplayName(c).toLowerCase()
    return name.includes(search) || c.code.toLowerCase().includes(search)
  })
})

// Selected country object
const selectedCountry = computed(() => {
  if (!props.modelValue) return null
  return countries.value.find(c => c.code === props.modelValue)
})

// Get country display name
const getCountryDisplayName = (country) => {
  return country.name[locale.value] || country.name.tr || country.name.en || country.code
}

// Toggle dropdown
const toggleDropdown = () => {
  if (props.disabled) return
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    searchQuery.value = ''
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
}

// Select country
const selectCountry = (country) => {
  emit('update:modelValue', country.code)
  showDropdown.value = false
  searchQuery.value = ''
}

// Select first filtered country on Enter
const selectFirst = () => {
  if (filteredCountries.value.length > 0) {
    selectCountry(filteredCountries.value[0])
  }
}

// Handle click outside to close dropdown
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
