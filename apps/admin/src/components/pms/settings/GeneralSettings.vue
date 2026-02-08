<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ $t('settings.general.title') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('settings.general.description') }}
        </p>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Timezone -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('settings.general.timezone') }}
        </label>
        <select
          v-model="localSettings.timezone"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          @change="emitChange"
        >
          <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
            {{ tz.label }}
          </option>
        </select>
      </div>

      <!-- Currency -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('settings.general.currency') }}
        </label>
        <select
          v-model="localSettings.currency"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          @change="emitChange"
        >
          <option v-for="curr in currencies" :key="curr.value" :value="curr.value">
            {{ curr.label }}
          </option>
        </select>
      </div>

      <!-- Date Format -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('settings.general.dateFormat') }}
        </label>
        <select
          v-model="localSettings.dateFormat"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          @change="emitChange"
        >
          <option value="DD/MM/YYYY">{{ $t('settings.general.dateFormats.dmy') }}</option>
          <option value="MM/DD/YYYY">{{ $t('settings.general.dateFormats.mdy') }}</option>
          <option value="YYYY-MM-DD">{{ $t('settings.general.dateFormats.ymd') }}</option>
        </select>
      </div>

      <!-- Time Format -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('settings.general.timeFormat') }}
        </label>
        <select
          v-model="localSettings.timeFormat"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          @change="emitChange"
        >
          <option value="24h">{{ $t('settings.general.timeFormats.24h') }}</option>
          <option value="12h">{{ $t('settings.general.timeFormats.12h') }}</option>
        </select>
      </div>

      <!-- Language -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('settings.general.defaultLanguage') }}
        </label>
        <select
          v-model="localSettings.language"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          @change="emitChange"
        >
          <option value="tr">{{ $t('settings.general.languages.tr') }}</option>
          <option value="en">{{ $t('settings.general.languages.en') }}</option>
          <option value="de">{{ $t('settings.general.languages.de') }}</option>
          <option value="ru">{{ $t('settings.general.languages.ru') }}</option>
        </select>
      </div>
    </div>

    <!-- Preview -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('settings.general.preview') }}
      </h4>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-500 dark:text-slate-400">{{ $t('settings.general.date') }}:</span>
          <span class="ml-2 text-gray-900 dark:text-white">{{ previewDate }}</span>
        </div>
        <div>
          <span class="text-gray-500 dark:text-slate-400">{{ $t('settings.general.time') }}:</span>
          <span class="ml-2 text-gray-900 dark:text-white">{{ previewTime }}</span>
        </div>
        <div>
          <span class="text-gray-500 dark:text-slate-400">{{ $t('settings.general.money') }}:</span>
          <span class="ml-2 text-gray-900 dark:text-white">{{ previewCurrency }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  timezones: {
    type: Array,
    default: () => []
  },
  currencies: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const localSettings = ref({
  timezone: 'Europe/Istanbul',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  language: 'tr',
  currency: 'TRY',
  ...props.modelValue
})

watch(
  () => props.modelValue,
  newVal => {
    localSettings.value = { ...localSettings.value, ...newVal }
  },
  { deep: true }
)

const emitChange = () => {
  emit('update:modelValue', localSettings.value)
  emit('change')
}

// Preview computations
const previewDate = computed(() => {
  const now = new Date()
  const format = localSettings.value.dateFormat
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()

  if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`
  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`
  return `${year}-${month}-${day}`
})

const previewTime = computed(() => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = String(now.getMinutes()).padStart(2, '0')

  if (localSettings.value.timeFormat === '24h') {
    return `${String(hours).padStart(2, '0')}:${minutes}`
  }
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12}:${minutes} ${period}`
})

const previewCurrency = computed(() => {
  const curr = props.currencies.find(c => c.value === localSettings.value.currency)
  return curr ? `1.234,56 ${curr.symbol}` : '1.234,56 TL'
})
</script>
