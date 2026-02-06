<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

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
const showDropdown = ref(false)

// Countries data
const countries = [
  { code: 'TR', name: 'Türkiye', dialCode: '+90', flag: '\u{1F1F9}\u{1F1F7}', placeholder: '5XX XXX XX XX', format: 'XXX XXX XX XX', maxLength: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '\u{1F1FA}\u{1F1F8}', placeholder: '(XXX) XXX-XXXX', format: '(XXX) XXX-XXXX', maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '\u{1F1EC}\u{1F1E7}', placeholder: 'XXXX XXXXXX', format: 'XXXX XXXXXX', maxLength: 10 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '\u{1F1E9}\u{1F1EA}', placeholder: 'XXX XXXXXXXX', format: 'XXX XXXXXXXX', maxLength: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '\u{1F1EB}\u{1F1F7}', placeholder: 'X XX XX XX XX', format: 'X XX XX XX XX', maxLength: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '\u{1F1EE}\u{1F1F9}', placeholder: 'XXX XXX XXXX', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '\u{1F1EA}\u{1F1F8}', placeholder: 'XXX XXX XXX', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '\u{1F1F3}\u{1F1F1}', placeholder: 'X XXXXXXXX', format: 'X XXXXXXXX', maxLength: 9 },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '\u{1F1F7}\u{1F1FA}', placeholder: 'XXX XXX-XX-XX', format: 'XXX XXX-XX-XX', maxLength: 10 },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '\u{1F1FA}\u{1F1E6}', placeholder: 'XX XXX XX XX', format: 'XX XXX XX XX', maxLength: 9 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '\u{1F1F8}\u{1F1E6}', placeholder: 'XX XXX XXXX', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '\u{1F1E6}\u{1F1EA}', placeholder: 'XX XXX XXXX', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '\u{1F1EA}\u{1F1EC}', placeholder: 'XX XXXX XXXX', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '\u{1F1EC}\u{1F1F7}', placeholder: 'XXX XXX XXXX', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '\u{1F1EE}\u{1F1F1}', placeholder: 'XX-XXX-XXXX', format: 'XX-XXX-XXXX', maxLength: 9 },
  { code: 'IR', name: 'Iran', dialCode: '+98', flag: '\u{1F1EE}\u{1F1F7}', placeholder: 'XXX XXX XXXX', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', flag: '\u{1F1E6}\u{1F1FF}', placeholder: 'XX XXX XX XX', format: 'XX XXX XX XX', maxLength: 9 },
  { code: 'GE', name: 'Georgia', dialCode: '+995', flag: '\u{1F1EC}\u{1F1EA}', placeholder: 'XXX XX XX XX', format: 'XXX XX XX XX', maxLength: 9 }
]

// Selected country
const selectedCountryCode = ref(props.country)

const selectedCountry = computed(() => {
  return countries.find(c => c.code === selectedCountryCode.value) || countries[0]
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

  if (country.code === 'US') {
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
}

// Select country
function selectCountry(country) {
  selectedCountryCode.value = country.code
  showDropdown.value = false

  // Mevcut deger varsa yeni ulke koduyla emit et
  if (rawValue.value) {
    emit('update:modelValue', e164Value.value)
  }

  nextTick(() => inputRef.value?.focus())
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
  (newValue) => {
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
  (newCountry) => {
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
      <span class="phone-flag">{{ selectedCountry.flag }}</span>
      <span class="phone-dial-code">{{ selectedCountry.dialCode }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
      <button
        v-for="c in countries"
        :key="c.code"
        type="button"
        class="phone-dropdown-item"
        :class="{ active: c.code === selectedCountryCode }"
        @click="selectCountry(c)"
      >
        <span class="phone-flag">{{ c.flag }}</span>
        <span class="phone-country-name">{{ c.name }}</span>
        <span class="phone-country-dial">{{ c.dialCode }}</span>
      </button>
    </div>

    <!-- Error Message -->
    <span v-if="error" class="form-error">{{ error }}</span>
  </div>
</template>

<!-- All styles in widget.css for Shadow DOM compatibility -->
