<script setup lang="ts">
import { countries, getFlagUrl } from '~/data/countries'
import type { Country } from '~/data/countries'

const props = defineProps<{
  modelValue?: string
  country?: string
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const wrapperRef = ref<HTMLDivElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const showDropdown = ref(false)
const searchQuery = ref('')

const selectedCountryCode = ref(props.country || 'TR')

const selectedCountry = computed((): Country => {
  return countries.find(c => c.code === selectedCountryCode.value) || countries[0]!
})

const filteredCountries = computed(() => {
  if (!searchQuery.value) return countries
  const q = searchQuery.value.toLowerCase()
  return countries.filter(
    c =>
      c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q)
  )
})

const rawValue = ref('')

const formattedValue = computed(() => {
  if (!rawValue.value) return ''
  return formatPhone(rawValue.value, selectedCountry.value)
})

const e164Value = computed(() => {
  if (!rawValue.value) return ''
  const dialCode = selectedCountry.value.dialCode.replace('+', '')
  return `+${dialCode}${rawValue.value}`
})

function formatPhone(value: string, country: Country): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  let formatted = ''

  if (country.code === 'TR') {
    if (digits.length > 0) formatted += digits.substr(0, 3)
    if (digits.length > 3) formatted += ' ' + digits.substr(3, 3)
    if (digits.length > 6) formatted += ' ' + digits.substr(6, 2)
    if (digits.length > 8) formatted += ' ' + digits.substr(8, 2)
    return formatted
  }

  if (country.code === 'US' || (country.code === 'CA' && country.dialCode === '+1')) {
    if (digits.length > 0) formatted += '(' + digits.substr(0, 3)
    if (digits.length > 3) formatted += ') ' + digits.substr(3, 3)
    if (digits.length > 6) formatted += '-' + digits.substr(6, 4)
    return formatted
  }

  const groups = country.format?.split(' ') || ['XXX', 'XXX', 'XXXX']
  let pos = 0
  const parts: string[] = []
  for (const group of groups) {
    const len = group.replace(/[^X]/g, '').length
    if (pos >= digits.length) break
    parts.push(digits.substr(pos, len))
    pos += len
  }
  return parts.join(' ')
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    searchQuery.value = ''
    nextTick(() => searchRef.value?.focus())
  }
}

function selectCountry(country: Country) {
  selectedCountryCode.value = country.code
  showDropdown.value = false
  searchQuery.value = ''
  if (rawValue.value) {
    emit('update:modelValue', e164Value.value)
  }
  nextTick(() => inputRef.value?.focus())
}

function selectFirst() {
  if (filteredCountries.value.length > 0) selectCountry(filteredCountries.value[0])
}

function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  const cursorPos = input.selectionStart || 0
  const oldLength = formattedValue.value.length

  let digits = input.value.replace(/\D/g, '')
  if (digits.length > selectedCountry.value.maxLength) {
    digits = digits.substr(0, selectedCountry.value.maxLength)
  }

  rawValue.value = digits
  emit('update:modelValue', digits ? e164Value.value : '')

  nextTick(() => {
    const newLength = formattedValue.value.length
    const diff = newLength - oldLength
    const newPos = Math.max(0, cursorPos + diff)
    input.setSelectionRange(newPos, newPos)
  })
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const pastedText = event.clipboardData?.getData('text') || ''
  let digits = pastedText.replace(/\D/g, '')

  if (pastedText.startsWith('+')) {
    const dialCode = selectedCountry.value.dialCode.replace('+', '')
    if (digits.startsWith(dialCode)) {
      digits = digits.substr(dialCode.length)
    }
  }

  if (selectedCountry.value.code === 'TR' && digits.startsWith('0')) {
    digits = digits.substr(1)
  }

  if (digits.length > selectedCountry.value.maxLength) {
    digits = digits.substr(0, selectedCountry.value.maxLength)
  }

  rawValue.value = digits
  emit('update:modelValue', digits ? e164Value.value : '')
}

function handleKeydown(event: KeyboardEvent) {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End']
  if (allowedKeys.includes(event.key)) return
  if (event.ctrlKey || event.metaKey) return
  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}

function handleClickOutside(event: MouseEvent) {
  if (!wrapperRef.value) return
  if (!wrapperRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

// Parse incoming modelValue
watch(
  () => props.modelValue,
  newValue => {
    if (!newValue) {
      rawValue.value = ''
      return
    }
    let digits = newValue.replace(/\D/g, '')
    if (newValue.startsWith('+')) {
      const dialCode = selectedCountry.value.dialCode.replace('+', '')
      if (digits.startsWith(dialCode)) {
        digits = digits.substr(dialCode.length)
      }
    }
    rawValue.value = digits
  },
  { immediate: true }
)

watch(
  () => props.country,
  newCountry => {
    if (newCountry && newCountry !== selectedCountryCode.value) {
      selectedCountryCode.value = newCountry
    }
  }
)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="wrapperRef" class="relative">
    <div class="flex">
      <!-- Country Button -->
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 text-sm shrink-0 transition-colors"
        :class="{ 'border-site-primary': showDropdown }"
        @click.stop="toggleDropdown"
      >
        <img
          class="w-5 h-auto rounded-sm"
          :src="getFlagUrl(selectedCountry.code)"
          :alt="selectedCountry.code"
        />
        <span class="text-gray-600 text-xs">{{ selectedCountry.dialCode }}</span>
        <svg
          class="w-3 h-3 text-gray-400 transition-transform"
          :class="{ 'rotate-180': showDropdown }"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <!-- Phone Input -->
      <input
        ref="inputRef"
        type="tel"
        inputmode="numeric"
        :value="formattedValue"
        :placeholder="selectedCountry.placeholder"
        class="flex-1 px-3 py-2 border border-gray-300 border-l-0 rounded-r-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary text-sm"
        :class="{ 'border-red-300 focus:ring-red-500': error }"
        autocomplete="tel"
        @input="handleInput"
        @paste="handlePaste"
        @keydown="handleKeydown"
      />
    </div>

    <!-- Dropdown -->
    <div
      v-if="showDropdown"
      class="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
      @click.stop
    >
      <div class="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <svg
          class="w-3.5 h-3.5 text-gray-400 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref="searchRef"
          v-model="searchQuery"
          type="text"
          class="flex-1 text-sm outline-none bg-transparent"
          autocomplete="off"
          @keydown.enter.prevent="selectFirst"
          @keydown.esc="showDropdown = false"
        />
      </div>
      <div class="max-h-48 overflow-y-auto">
        <button
          v-for="c in filteredCountries"
          :key="c.code"
          type="button"
          class="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
          :class="{ 'bg-site-primary/5': c.code === selectedCountryCode }"
          @click="selectCountry(c)"
        >
          <img class="w-5 h-auto rounded-sm" :src="getFlagUrl(c.code)" :alt="c.code" />
          <span class="flex-1 text-sm text-gray-700 truncate">{{ c.name }}</span>
          <span class="text-xs text-gray-400">{{ c.dialCode }}</span>
        </button>
        <div
          v-if="filteredCountries.length === 0"
          class="px-3 py-4 text-center text-sm text-gray-400"
        >
          -
        </div>
      </div>
    </div>

    <!-- Error -->
    <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
  </div>
</template>
