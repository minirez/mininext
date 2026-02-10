<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ $t('settings.exchange.title') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">
        {{ $t('settings.exchange.description') }}
      </p>
    </div>

    <!-- Mode Selection -->
    <div
      class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5"
    >
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
        {{ $t('settings.exchange.rateSource') }}
      </h4>
      <div class="grid sm:grid-cols-2 gap-4">
        <!-- TCMB Option -->
        <button
          class="p-4 rounded-xl border-2 text-left transition-all"
          :class="
            exchangeMode === 'tcmb'
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
          "
          @click="setMode('tcmb')"
        >
          <div class="flex items-center gap-3 mb-2">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="
                exchangeMode === 'tcmb'
                  ? 'bg-indigo-100 dark:bg-indigo-800'
                  : 'bg-gray-100 dark:bg-slate-700'
              "
            >
              <span
                class="material-icons"
                :class="
                  exchangeMode === 'tcmb'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-slate-400'
                "
                >public</span
              >
            </div>
            <div>
              <p
                class="font-medium"
                :class="
                  exchangeMode === 'tcmb'
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-900 dark:text-white'
                "
              >
                TCMB
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('settings.exchange.tcmbDesc') }}
              </p>
            </div>
          </div>
          <div
            v-if="exchangeMode === 'tcmb'"
            class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-2"
          >
            <span class="material-icons text-sm">check_circle</span>
            {{ $t('settings.exchange.autoUpdating') }}
          </div>
        </button>

        <!-- Manual Option -->
        <button
          class="p-4 rounded-xl border-2 text-left transition-all"
          :class="
            exchangeMode === 'manual'
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
          "
          @click="setMode('manual')"
        >
          <div class="flex items-center gap-3 mb-2">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="
                exchangeMode === 'manual'
                  ? 'bg-indigo-100 dark:bg-indigo-800'
                  : 'bg-gray-100 dark:bg-slate-700'
              "
            >
              <span
                class="material-icons"
                :class="
                  exchangeMode === 'manual'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-slate-400'
                "
                >edit</span
              >
            </div>
            <div>
              <p
                class="font-medium"
                :class="
                  exchangeMode === 'manual'
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-900 dark:text-white'
                "
              >
                {{ $t('settings.exchange.manualMode') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('settings.exchange.manualDesc') }}
              </p>
            </div>
          </div>
          <div
            v-if="exchangeMode === 'manual'"
            class="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-2"
          >
            <span class="material-icons text-sm">info</span>
            {{ $t('settings.exchange.manualWarning') }}
          </div>
        </button>
      </div>
    </div>

    <!-- TCMB Info (only in TCMB mode) -->
    <div v-if="exchangeMode === 'tcmb'" class="space-y-4">
      <!-- Scheduler Status -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('settings.exchange.autoUpdate') }}
          </h4>
          <span
            class="px-2 py-1 text-xs rounded-full"
            :class="
              schedulerStatus?.isRunning
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            "
          >
            {{ schedulerStatus?.isRunning ? $t('common.active') : $t('common.inactive') }}
          </span>
        </div>
        <div class="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-gray-500 dark:text-slate-400"
              >{{ $t('settings.exchange.interval') }}:</span
            >
            <span class="ml-2 text-gray-900 dark:text-white"
              >{{ schedulerStatus?.checkInterval }} {{ $t('common.minutes') }}</span
            >
          </div>
          <div>
            <span class="text-gray-500 dark:text-slate-400"
              >{{ $t('settings.exchange.workingHours') }}:</span
            >
            <span class="ml-2 text-gray-900 dark:text-white">
              {{ schedulerStatus?.workingHours?.start }}:00 -
              {{ schedulerStatus?.workingHours?.end }}:00
            </span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-slate-400"
              >{{ $t('settings.exchange.turkeyTime') }}:</span
            >
            <span class="ml-2 text-gray-900 dark:text-white"
              >{{ schedulerStatus?.currentTurkeyHour }}:00</span
            >
          </div>
        </div>
      </div>

      <!-- Rate Info -->
      <div
        v-if="rateInfo"
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
      >
        <div class="flex items-start gap-3">
          <span class="material-icons text-blue-600 dark:text-blue-400">info</span>
          <div>
            <p class="text-sm text-blue-800 dark:text-blue-300">
              <strong>{{ $t('settings.exchange.source') }}:</strong> TCMB
              <span v-if="rateInfo.bulletin" class="ml-2"
                >| <strong>{{ $t('settings.exchange.bulletin') }}:</strong>
                {{ rateInfo.bulletin }}</span
              >
            </p>
            <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {{ $t('settings.exchange.lastUpdate') }}: {{ formatDate(rateInfo.lastUpdated) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingRates" class="flex items-center justify-center py-8">
      <span class="material-icons animate-spin text-2xl text-indigo-600">refresh</span>
    </div>

    <!-- Rates Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-slate-600">
            <th class="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {{ $t('settings.exchange.currency') }}
            </th>
            <th
              v-if="exchangeMode === 'tcmb'"
              class="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300"
            >
              {{ $t('settings.exchange.rate') }}
            </th>
            <th
              v-if="exchangeMode === 'manual'"
              class="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300"
            >
              {{ $t('settings.exchange.manualRate') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="currency in displayCurrencies"
            :key="currency.code"
            class="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
          >
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <span class="text-lg font-medium text-gray-600 dark:text-gray-400">{{
                  getCurrencySymbol(currency.code)
                }}</span>
                <span class="text-gray-900 dark:text-white font-medium">{{ currency.code }}</span>
              </div>
            </td>
            <!-- TCMB Mode: Read-only rates -->
            <td v-if="exchangeMode === 'tcmb'" class="py-3 px-4 text-right">
              <span class="text-gray-900 dark:text-white font-mono">{{
                formatRate(currency.rate)
              }}</span>
            </td>
            <!-- Manual Mode: Editable inputs -->
            <td v-if="exchangeMode === 'manual'" class="py-3 px-4 text-right">
              <input
                :value="getManualRate(currency.code)"
                type="number"
                step="0.0001"
                min="0"
                :placeholder="formatRate(currency.rate)"
                class="w-36 px-3 py-1.5 text-right border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                @input="onManualRateInput(currency.code, $event)"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <p
        v-if="exchangeMode === 'manual'"
        class="text-xs text-gray-400 dark:text-slate-500 mt-2 px-4"
      >
        {{ $t('settings.exchange.manualHint') }}
      </p>
    </div>

    <!-- Currency Converter -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
        {{ $t('settings.exchange.calculator') }}
      </h4>
      <div class="grid sm:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
            $t('settings.exchange.amount')
          }}</label>
          <input
            v-model.number="convertAmount"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
            $t('settings.exchange.sourceCurrency')
          }}</label>
          <select
            v-model="convertFrom"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="curr in Object.keys(tcmbRates)" :key="curr" :value="curr">
              {{ curr }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
            $t('settings.exchange.targetCurrency')
          }}</label>
          <select
            v-model="convertTo"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="curr in Object.keys(tcmbRates)" :key="curr" :value="curr">
              {{ curr }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
            $t('settings.exchange.result')
          }}</label>
          <div
            class="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-800 dark:text-indigo-300 font-medium"
          >
            {{ formatCurrencyResult(convertedResult, convertTo) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import * as exchangeService from '@/services/pms/exchangeService'

const toast = useToast()
const { t } = useI18n()

const emit = defineEmits(['update:modelValue', 'change'])

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ mode: 'tcmb', manualRates: {} })
  },
  hotelId: {
    type: String,
    default: null
  }
})

// State
const loadingRates = ref(true)
const tcmbRates = ref({})
const rateInfo = ref(null)
const schedulerStatus = ref(null)

// Local exchange mode - synced with modelValue
const exchangeMode = computed(() => props.modelValue?.mode || 'tcmb')
const localManualRates = computed(() => props.modelValue?.manualRates || {})

// Main currencies to show
const MAIN_CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'SAR', 'AED', 'RUB', 'JPY', 'CAD', 'AUD']

// Converter state
const convertAmount = ref(100)
const convertFrom = ref('USD')
const convertTo = ref('TRY')

// Computed: currencies to display
const displayCurrencies = computed(() => {
  const currencies = []
  for (const code of MAIN_CURRENCIES) {
    if (tcmbRates.value[code]) {
      currencies.push({ code, rate: tcmbRates.value[code] })
    }
  }
  // Add any remaining currencies not in MAIN_CURRENCIES
  for (const [code, rate] of Object.entries(tcmbRates.value)) {
    if (code === 'TRY') continue
    if (!MAIN_CURRENCIES.includes(code)) {
      currencies.push({ code, rate })
    }
  }
  return currencies
})

// Methods
const setMode = mode => {
  emit('update:modelValue', { ...props.modelValue, mode })
  emit('change')
}

const getManualRate = code => {
  return localManualRates.value[code] || ''
}

const onManualRateInput = (code, event) => {
  const value = parseFloat(event.target.value)
  const newRates = { ...localManualRates.value }
  if (value && value > 0) {
    newRates[code] = value
  } else {
    delete newRates[code]
  }
  emit('update:modelValue', { ...props.modelValue, manualRates: newRates })
  emit('change')
}

const loadRates = async () => {
  loadingRates.value = true
  try {
    const [ratesRes, statusRes] = await Promise.all([
      exchangeService.getExchangeRates(),
      exchangeService.getSchedulerStatus().catch(() => ({ success: false }))
    ])

    if (ratesRes.success) {
      tcmbRates.value = ratesRes.data.rates || {}
      rateInfo.value = {
        source: ratesRes.data.source,
        bulletin: ratesRes.data.bulletin,
        lastUpdated: ratesRes.data.lastUpdated
      }
    }

    if (statusRes.success) {
      schedulerStatus.value = statusRes.data
    }
  } catch (error) {
    console.error('Error loading rates:', error)
    toast.error(t('settings.exchange.errors.loadError'))
  } finally {
    loadingRates.value = false
  }
}

const getCurrencySymbol = currency => {
  return exchangeService.getCurrencySymbol(currency)
}

const formatRate = rate => {
  if (!rate) return '-'
  return rate.toLocaleString('tr-TR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  })
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleString('tr-TR')
}

const formatCurrencyResult = (amount, currency) => {
  if (!amount || isNaN(amount)) return '-'
  return exchangeService.formatCurrency(amount, currency)
}

// Converter computed - uses active rates based on mode
const activeRates = computed(() => {
  if (exchangeMode.value === 'manual' && Object.keys(localManualRates.value).length > 0) {
    // Merge: manual rates override TCMB rates
    return { ...tcmbRates.value, ...localManualRates.value }
  }
  return tcmbRates.value
})

const convertedResult = computed(() => {
  if (
    !convertAmount.value ||
    !activeRates.value[convertFrom.value] ||
    !activeRates.value[convertTo.value]
  ) {
    return 0
  }

  const fromRate = activeRates.value[convertFrom.value]
  const toRate = activeRates.value[convertTo.value]
  const amountInTRY = convertAmount.value * fromRate
  return amountInTRY / toRate
})

// Lifecycle
onMounted(() => {
  loadRates()
})
</script>
