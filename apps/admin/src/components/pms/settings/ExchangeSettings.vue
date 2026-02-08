<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ $t('settings.exchange.title') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('settings.exchange.description') }}
        </p>
      </div>
      <button
        :disabled="refreshing"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        @click="refreshRates"
      >
        <span class="material-icons text-sm" :class="{ 'animate-spin': refreshing }">refresh</span>
        {{ $t('settings.exchange.refreshRates') }}
      </button>
    </div>

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
            <strong>{{ $t('settings.exchange.source') }}:</strong>
            {{
              rateInfo.source === 'tcmb'
                ? 'TCMB'
                : rateInfo.source === 'manual'
                  ? $t('settings.exchange.manual')
                  : $t('settings.exchange.backup')
            }}
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

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
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
            <th class="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {{ $t('settings.exchange.rate') }} (TRY)
            </th>
            <th class="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {{ $t('settings.exchange.manualRate') }}
            </th>
            <th class="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {{ $t('common.action') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(rate, currency) in rates"
            :key="currency"
            class="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
          >
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <span class="text-lg font-medium text-gray-600 dark:text-gray-400">{{
                  getCurrencySymbol(currency)
                }}</span>
                <span class="text-gray-900 dark:text-white font-medium">{{ currency }}</span>
              </div>
            </td>
            <td class="py-3 px-4 text-right">
              <span class="text-gray-900 dark:text-white font-mono">{{ formatRate(rate) }}</span>
            </td>
            <td class="py-3 px-4 text-right">
              <input
                v-if="editingCurrency === currency"
                v-model.number="editValue"
                type="number"
                step="0.0001"
                min="0"
                class="w-32 px-2 py-1 text-right border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                @keyup.enter="saveManualRate(currency)"
                @keyup.escape="cancelEdit"
              />
              <span
                v-else-if="manualRates[currency]"
                class="text-indigo-600 dark:text-indigo-400 font-mono"
              >
                {{ formatRate(manualRates[currency]) }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="py-3 px-4 text-center">
              <div class="flex items-center justify-center gap-2">
                <template v-if="editingCurrency === currency">
                  <button
                    :disabled="saving"
                    class="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                    @click="saveManualRate(currency)"
                  >
                    <span class="material-icons text-sm">check</span>
                  </button>
                  <button
                    class="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    @click="cancelEdit"
                  >
                    <span class="material-icons text-sm">close</span>
                  </button>
                </template>
                <template v-else>
                  <button
                    class="p-1 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded"
                    :title="$t('settings.exchange.enterManualRate')"
                    @click="startEdit(currency, rate)"
                  >
                    <span class="material-icons text-sm">edit</span>
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
            <option v-for="curr in Object.keys(rates)" :key="curr" :value="curr">{{ curr }}</option>
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
            <option v-for="curr in Object.keys(rates)" :key="curr" :value="curr">{{ curr }}</option>
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
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import * as exchangeService from '@/services/pms/exchangeService'

const toast = useToast()
const { t } = useI18n()

// State
const loading = ref(true)
const refreshing = ref(false)
const saving = ref(false)
const rates = ref({})
const manualRates = ref({})
const rateInfo = ref(null)
const schedulerStatus = ref(null)
const editingCurrency = ref(null)
const editValue = ref(0)

// Converter state
const convertAmount = ref(100)
const convertFrom = ref('USD')
const convertTo = ref('TRY')

// Methods
const loadRates = async () => {
  loading.value = true
  try {
    const [ratesRes, statusRes] = await Promise.all([
      exchangeService.getExchangeRates(),
      exchangeService.getSchedulerStatus()
    ])

    if (ratesRes.success) {
      rates.value = ratesRes.data.rates || {}
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
    loading.value = false
  }
}

const refreshRates = async () => {
  refreshing.value = true
  try {
    const response = await exchangeService.refreshRates()
    if (response.success) {
      toast.success(t('settings.exchange.success.refreshed'))
      await loadRates()
    }
  } catch (error) {
    console.error('Error refreshing rates:', error)
    toast.error(t('settings.exchange.errors.refreshError'))
  } finally {
    refreshing.value = false
  }
}

const startEdit = (currency, currentRate) => {
  editingCurrency.value = currency
  editValue.value = manualRates.value[currency] || currentRate
}

const cancelEdit = () => {
  editingCurrency.value = null
  editValue.value = 0
}

const saveManualRate = async currency => {
  if (!editValue.value || editValue.value <= 0) {
    toast.error(t('settings.exchange.errors.invalidRate'))
    return
  }

  saving.value = true
  try {
    const response = await exchangeService.setManualRate(currency, editValue.value)
    if (response.success) {
      manualRates.value[currency] = editValue.value
      rates.value[currency] = editValue.value
      toast.success(t('settings.exchange.success.manualRateSet', { currency }))
      cancelEdit()
    }
  } catch (error) {
    console.error('Error setting manual rate:', error)
    toast.error(t('settings.exchange.errors.manualRateError'))
  } finally {
    saving.value = false
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

// Computed
const convertedResult = computed(() => {
  if (!convertAmount.value || !rates.value[convertFrom.value] || !rates.value[convertTo.value]) {
    return 0
  }

  const fromRate = rates.value[convertFrom.value]
  const toRate = rates.value[convertTo.value]
  const amountInTRY = convertAmount.value * fromRate
  return amountInTRY / toRate
})

// Lifecycle
onMounted(() => {
  loadRates()
})
</script>
