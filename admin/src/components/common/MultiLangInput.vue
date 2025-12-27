<template>
  <div>
    <!-- Header with label and translate button -->
    <div class="flex items-center justify-between mb-2">
      <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-slate-300">{{ label }}</label>
      <button
        v-if="showTranslate && languages.length > 1"
        type="button"
        @click="handleTranslate"
        :disabled="translating || !modelValue[selectedLang]"
        class="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 disabled:opacity-50"
      >
        <span v-if="translating" class="material-icons text-sm animate-spin">sync</span>
        <span v-else class="material-icons text-sm">translate</span>
        {{ translating ? $t('common.translating') : $t('common.translateAll') }}
      </button>
    </div>

    <!-- Language tabs -->
    <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
      <div class="flex border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 overflow-x-auto">
        <button
          v-for="lang in visibleLanguages"
          :key="lang"
          type="button"
          @click="selectedLang = lang"
          :title="getLanguageName(lang)"
          class="relative px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
          :class="[
            selectedLang === lang
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
              : modelValue[lang] && modelValue[lang].trim()
                ? 'text-green-600 dark:text-green-400 font-semibold'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          ]"
        >
          <span v-if="modelValue[lang] && modelValue[lang].trim() && selectedLang !== lang"
                class="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></span>
          {{ lang.toUpperCase() }}
        </button>
        <button
          v-if="!showAllLanguages && languages.length > 5"
          type="button"
          @click="showAllLanguages = true"
          class="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-500"
        >
          +{{ languages.length - 5 }}
        </button>
      </div>

      <!-- Input area -->
      <div class="p-3">
        <template v-if="type === 'textarea'">
          <textarea
            :value="modelValue[selectedLang] || ''"
            @input="updateValue($event.target.value)"
            :rows="rows"
            :placeholder="placeholder || `${label} (${selectedLang.toUpperCase()})`"
            :maxlength="maxlength"
            class="form-input w-full"
          ></textarea>
        </template>
        <template v-else>
          <input
            :type="type"
            :value="modelValue[selectedLang] || ''"
            @input="updateValue($event.target.value)"
            :placeholder="placeholder || `${label} (${selectedLang.toUpperCase()})`"
            :maxlength="maxlength"
            class="form-input w-full"
          />
        </template>
        <p v-if="maxlength" class="mt-1 text-xs text-gray-500 dark:text-slate-400 text-right">
          {{ (modelValue[selectedLang] || '').length }}/{{ maxlength }}
        </p>
      </div>
    </div>

    <!-- Helper text -->
    <p v-if="help" class="mt-1 text-xs text-gray-500 dark:text-slate-400">{{ help }}</p>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import translationService from '@/services/translationService'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  languages: {
    type: Array,
    default: () => ['tr', 'en']
  },
  label: {
    type: String,
    default: ''
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
  maxlength: {
    type: Number,
    default: null
  },
  help: {
    type: String,
    default: ''
  },
  showTranslate: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const toast = useToast()
const { t } = useI18n()

const selectedLang = ref(props.languages[0] || 'tr')
const translating = ref(false)
const showAllLanguages = ref(false)

// Preferred language order (TR, EN, DE, RU, ES first)
const preferredOrder = ['tr', 'en', 'de', 'ru', 'es']

// Sort languages: preferred ones first, then rest alphabetically
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

// Show first 5 languages or all if expanded
const visibleLanguages = computed(() => {
  if (showAllLanguages.value || sortedLanguages.value.length <= 5) {
    return sortedLanguages.value
  }
  return sortedLanguages.value.slice(0, 5)
})

const availableLanguages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'bg', name: 'Български', flag: '🇧🇬' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
  { code: 'sq', name: 'Shqip', flag: '🇦🇱' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'az', name: 'Azərbaycanca', flag: '🇦🇿' }
]

const getLanguageName = (code) => {
  // Use translated language name from locale
  const translatedName = t(`common.languages.${code}`)
  // If translation exists and is different from the key, use it
  if (translatedName && !translatedName.includes('common.languages.')) {
    return translatedName
  }
  // Fallback to native name
  return availableLanguages.find(l => l.code === code)?.name || code.toUpperCase()
}

const getLanguageFlag = (code) => {
  return availableLanguages.find(l => l.code === code)?.flag || ''
}

// Watch languages prop and reset selectedLang if needed
watch(() => props.languages, (newLangs) => {
  if (!newLangs.includes(selectedLang.value)) {
    selectedLang.value = newLangs[0] || 'tr'
  }
}, { immediate: true })

const updateValue = (value) => {
  const newValue = { ...props.modelValue }
  newValue[selectedLang.value] = value
  emit('update:modelValue', newValue)
}

const handleTranslate = async () => {
  const sourceText = props.modelValue[selectedLang.value]

  if (!sourceText || !sourceText.trim()) {
    toast.warning(t('siteSettings.general.noContentToTranslate'))
    return
  }

  translating.value = true
  try {
    // Get target languages (all except source)
    const targetLangs = props.languages.filter(l => l !== selectedLang.value)

    const response = await translationService.batchTranslate(
      props.modelValue,
      selectedLang.value,
      props.languages
    )

    if (response.success) {
      emit('update:modelValue', { ...props.modelValue, ...response.data })
      toast.success(t('siteSettings.general.translationSuccess'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('siteSettings.general.translationFailed'))
  } finally {
    translating.value = false
  }
}
</script>
