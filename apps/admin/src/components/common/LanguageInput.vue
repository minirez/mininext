<template>
  <div :class="containerClass">
    <!-- Language tabs -->
    <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
      <div
        class="flex border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 overflow-x-auto"
      >
        <button
          v-for="lang in sortedLanguages"
          :key="lang"
          type="button"
          :title="getLanguageName(lang)"
          class="relative px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
          :class="[
            selectedLang === lang
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
              : hasValue(lang)
                ? 'text-green-600 dark:text-green-400 font-semibold'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          ]"
          @click="selectedLang = lang"
        >
          <span
            v-if="hasValue(lang) && selectedLang !== lang"
            class="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"
          ></span>
          {{ lang.toUpperCase() }}
        </button>
      </div>

      <!-- Input area -->
      <div :class="inputContainerClass">
        <template v-if="type === 'textarea'">
          <textarea
            :value="getCurrentValue()"
            :rows="rows"
            :placeholder="placeholder || `(${selectedLang.toUpperCase()})`"
            :class="inputClass"
            @input="updateValue($event.target.value)"
          ></textarea>
        </template>
        <template v-else>
          <input
            :type="type"
            :value="getCurrentValue()"
            :placeholder="placeholder || `(${selectedLang.toUpperCase()})`"
            :class="inputClass"
            @input="updateValue($event.target.value)"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  languages: {
    type: Array,
    default: () => ['tr', 'en', 'de', 'ru']
  },
  type: {
    type: String,
    default: 'text'
  },
  rows: {
    type: Number,
    default: 3
  },
  placeholder: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md' // 'sm', 'md', 'lg'
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedLang = ref('tr')

// Preferred language order
const preferredOrder = ['tr', 'en', 'de', 'ru', 'es']

// Sort languages
const sortedLanguages = computed(() => {
  const sorted = [...props.languages].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a)
    const bIndex = preferredOrder.indexOf(b)
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return a.localeCompare(b)
  })
  return sorted
})

// Language names
const availableLanguages = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'it', name: 'Italiano' },
  { code: 'fr', name: 'Français' },
  { code: 'ro', name: 'Română' },
  { code: 'bg', name: 'Български' },
  { code: 'pt', name: 'Português' },
  { code: 'da', name: 'Dansk' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'fa', name: 'فارسی' },
  { code: 'he', name: 'עברית' },
  { code: 'sq', name: 'Shqip' },
  { code: 'uk', name: 'Українська' },
  { code: 'pl', name: 'Polski' },
  { code: 'az', name: 'Azərbaycanca' }
]

const getLanguageName = code => {
  const translatedName = t(`common.languages.${code}`)
  if (translatedName && !translatedName.includes('common.languages.')) {
    return translatedName
  }
  return availableLanguages.find(l => l.code === code)?.name || code.toUpperCase()
}

// Check if language has a value
const hasValue = lang => {
  if (!Array.isArray(props.modelValue)) return false
  const item = props.modelValue.find(v => v.lang === lang)
  return item && item.value && item.value.trim()
}

// Get current value for selected language
const getCurrentValue = () => {
  if (!Array.isArray(props.modelValue)) return ''
  const item = props.modelValue.find(v => v.lang === selectedLang.value)
  return item?.value || ''
}

// Update value for selected language
const updateValue = value => {
  let newArray = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  
  const existingIndex = newArray.findIndex(v => v.lang === selectedLang.value)
  if (existingIndex >= 0) {
    newArray[existingIndex] = { ...newArray[existingIndex], value }
  } else {
    newArray.push({ lang: selectedLang.value, value })
  }
  
  emit('update:modelValue', newArray)
}

// Watch languages prop and reset selectedLang if needed
watch(
  () => props.languages,
  newLangs => {
    if (!newLangs.includes(selectedLang.value)) {
      selectedLang.value = newLangs[0] || 'tr'
    }
  },
  { immediate: true }
)

// Size-based classes
const containerClass = computed(() => {
  return props.size === 'sm' ? '' : ''
})

const inputContainerClass = computed(() => {
  return props.size === 'sm' ? 'p-2' : 'p-3'
})

const inputClass = computed(() => {
  const base = 'form-input w-full'
  if (props.size === 'sm') {
    return `${base} text-sm py-1 px-2`
  }
  return base
})
</script>
