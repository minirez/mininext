<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { countries, getFlagUrl } from '../data/countries'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: 'TR'
  },
  error: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// Refs
const inputRef = ref(null)
const wrapperRef = ref(null)
const searchRef = ref(null)
const showDropdown = ref(false)
const searchQuery = ref('')

// Selected country
const selectedCountryCode = ref(props.country)

const selectedCountry = computed(() => {
  return countries.find(c => c.code === selectedCountryCode.value) || countries[0]
})

// Filtered countries for search
const filteredCountries = computed(() => {
  if (!searchQuery.value) return countries
  const q = searchQuery.value.toLowerCase()
  return countries.filter(
    c =>
      c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q)
  )
})

// Internal value (sadece rakamlar)
const rawValue = ref('')

// Formatli goruntu
const formattedValue = computed(() => {
  if (!rawValue.value) return ''
  return formatPhone(rawValue.value, selectedCountry.value)
})

// E.164 format (output)
const e164Value = computed(() => {
  if (!rawValue.value) return ''
  const dialCode = selectedCountry.value.dialCode.replace('+', '')
  return `+${dialCode}${rawValue.value}`
})

// Telefon formatla
function formatPhone(value, country) {
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

  // Genel format
  const groups = country.format?.split(' ') || ['XXX', 'XXX', 'XXXX']
  let pos = 0
  const parts = []
  for (const group of groups) {
    const len = group.replace(/[^X]/g, '').length
    if (pos >= digits.length) break
    parts.push(digits.substr(pos, len))
    pos += len
  }
  return parts.join(' ')
}

// Toggle dropdown
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    searchQuery.value = ''
    nextTick(() => searchRef.value?.focus())
  }
}

// Select country
function selectCountry(country) {
  selectedCountryCode.value = country.code
  showDropdown.value = false
  searchQuery.value = ''

  // Mevcut deger varsa yeni ulke koduyla emit et
  if (rawValue.value) {
    emit('update:modelValue', e164Value.value)
  }

  nextTick(() => inputRef.value?.focus())
}

// Select first filtered country on Enter
function selectFirst() {
  if (filteredCountries.value.length > 0) selectCountry(filteredCountries.value[0])
}

// Input handler
function handleInput(event) {
  const input = event.target
  const cursorPos = input.selectionStart
  const oldLength = formattedValue.value.length

  let digits = event.target.value.replace(/\D/g, '')

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

// Paste handler
function handlePaste(event) {
  event.preventDefault()
  const pastedText = event.clipboardData.getData('text')
  let digits = pastedText.replace(/\D/g, '')

  // + ile basliyorsa ulke kodunu cikar
  if (pastedText.startsWith('+')) {
    const dialCode = selectedCountry.value.dialCode.replace('+', '')
    if (digits.startsWith(dialCode)) {
      digits = digits.substr(dialCode.length)
    }
  }

  // TR icin 0 ile basliyorsa cikar
  if (selectedCountry.value.code === 'TR' && digits.startsWith('0')) {
    digits = digits.substr(1)
  }

  if (digits.length > selectedCountry.value.maxLength) {
    digits = digits.substr(0, selectedCountry.value.maxLength)
  }

  rawValue.value = digits
  emit('update:modelValue', digits ? e164Value.value : '')
}

// Keydown handler - sadece rakam ve kontrol tuslari
function handleKeydown(event) {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End']
  if (allowedKeys.includes(event.key)) return
  if (event.ctrlKey || event.metaKey) return
  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}

// Click outside - Shadow DOM uyumlu
function handleClickOutside(event) {
  if (!wrapperRef.value) return
  if (!wrapperRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

// Props'tan gelen degeri parse et
watch(
  () => props.modelValue,
  newValue => {
    if (!newValue) {
      rawValue.value = ''
      return
    }

    let digits = newValue.replace(/\D/g, '')

    // E.164 format ise ulke kodunu cikar
    if (newValue.startsWith('+')) {
      // Tum ulkelere bak, en uzun eslesen kodu cikar
      for (const c of countries) {
        const dialCode = c.dialCode.replace('+', '')
        if (digits.startsWith(dialCode)) {
          if (c.code === selectedCountryCode.value) {
            digits = digits.substr(dialCode.length)
            break
          }
        }
      }
      // Secili ulkenin kodunu dene
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
  // Shadow DOM uyumlu: getRootNode ile dinle
  const root = wrapperRef.value?.getRootNode?.() || document
  root.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  const root = wrapperRef.value?.getRootNode?.() || document
  root.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="wrapperRef" class="phone-input-wrapper">
    <!-- Country Button -->
    <button
      type="button"
      class="phone-country-btn"
      :class="{ open: showDropdown }"
      @click.stop="toggleDropdown"
    >
      <img class="phone-flag" :src="getFlagUrl(selectedCountry.code)" :alt="selectedCountry.code" />
      <span class="phone-dial-code">{{ selectedCountry.dialCode }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <!-- Phone Input -->
    <input
      ref="inputRef"
      type="tel"
      inputmode="numeric"
      :value="formattedValue"
      :placeholder="selectedCountry.placeholder"
      class="form-input phone-number-input"
      :class="{ error: error }"
      autocomplete="tel"
      @input="handleInput"
      @paste="handlePaste"
      @keydown="handleKeydown"
    />

    <!-- Dropdown -->
    <div v-if="showDropdown" class="phone-dropdown" @click.stop>
      <div class="phone-search-box">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          ref="searchRef"
          v-model="searchQuery"
          type="text"
          class="phone-search-input"
          autocomplete="off"
          @keydown.enter.prevent="selectFirst"
          @keydown.esc="showDropdown = false"
        />
      </div>
      <div class="phone-dropdown-list">
        <button
          v-for="c in filteredCountries"
          :key="c.code"
          type="button"
          class="phone-dropdown-item"
          :class="{ active: c.code === selectedCountryCode }"
          @click="selectCountry(c)"
        >
          <img class="phone-flag" :src="getFlagUrl(c.code)" :alt="c.code" />
          <span class="phone-country-name">{{ c.name }}</span>
          <span class="phone-country-dial">{{ c.dialCode }}</span>
        </button>
        <div v-if="filteredCountries.length === 0" class="phone-dropdown-empty">-</div>
      </div>
    </div>

    <!-- Error Message -->
    <span v-if="error" class="form-error">{{ error }}</span>
  </div>
</template>

<!-- All styles in widget.css for Shadow DOM compatibility -->
