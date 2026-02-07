import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useAsyncAction } from '@/composables/useAsyncAction'
import exchangeService from '@/services/exchangeService'

// Main currencies to show by default
const MAIN_CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'CHF', 'SAR', 'AED', 'RUB']

// Currency names
const CURRENCY_NAMES = {
  TRY: 'Turk Lirasi',
  USD: 'ABD Dolari',
  EUR: 'Euro',
  GBP: 'Ingiliz Sterlini',
  CHF: 'Isvicre Frangi',
  JPY: 'Japon Yeni',
  CNY: 'Cin Yuani',
  AUD: 'Avustralya Dolari',
  CAD: 'Kanada Dolari',
  DKK: 'Danimarka Kronu',
  SEK: 'Isvec Kronu',
  NOK: 'Norvec Kronu',
  SAR: 'Suudi Riyali',
  KWD: 'Kuveyt Dinari',
  AED: 'BAE Dirhemi',
  BGN: 'Bulgar Levasi',
  RON: 'Romen Leyi',
  RUB: 'Rus Rublesi'
}

export function useExchangeRates() {
  const { t } = useI18n()
  const toast = useToast()

  // Async actions
  const { isLoading: refreshingRates, execute: executeRefreshRates } = useAsyncAction({ showErrorToast: false })
  const { isLoading: settingManualRate, execute: executeSetManualRate } = useAsyncAction({ showErrorToast: false })

  // State
  const exchangeRates = ref(null)
  const schedulerStatus = ref({
    isRunning: false,
    checkInterval: 5,
    workingHours: { start: 9, end: 17 },
    isWithinWorkingHours: false
  })
  const showAllCurrencies = ref(false)
  const manualRateModal = ref({
    show: false,
    currency: '',
    value: 0
  })

  // Computed: Main currencies
  const mainCurrencies = computed(() => {
    if (!exchangeRates.value?.rates) return {}
    const result = {}
    for (const code of MAIN_CURRENCIES) {
      if (exchangeRates.value.rates[code] !== undefined) {
        result[code] = exchangeRates.value.rates[code]
      }
    }
    return result
  })

  // Computed: Other currencies
  const otherCurrencies = computed(() => {
    if (!exchangeRates.value?.rates) return {}
    const result = {}
    for (const [code, rate] of Object.entries(exchangeRates.value.rates)) {
      if (!MAIN_CURRENCIES.includes(code)) {
        result[code] = rate
      }
    }
    return result
  })

  // Helpers
  const getCurrencyName = code => CURRENCY_NAMES[code] || ''

  const formatRate = rate => {
    if (rate === null || rate === undefined) return '-'
    if (rate >= 1) return rate.toFixed(4)
    return rate.toFixed(6)
  }

  const formatDateTime = date => {
    if (!date) return '-'
    return new Date(date).toLocaleString('tr-TR')
  }

  // Actions
  const loadExchangeRates = async () => {
    try {
      const [ratesResponse, statusResponse] = await Promise.all([
        exchangeService.getRates(),
        exchangeService.getSchedulerStatus()
      ])
      exchangeRates.value = ratesResponse.data
      schedulerStatus.value = statusResponse.data
    } catch (error) {
      console.error('Failed to load exchange rates:', error)
    }
  }

  const refreshExchangeRates = async () => {
    await executeRefreshRates(
      () => exchangeService.refreshRates(),
      {
        successMessage: 'platformSettings.exchange.refreshed',
        onSuccess: async () => {
          await loadExchangeRates()
        },
        onError: error => {
          toast.error(error.response?.data?.error || error.message)
        }
      }
    )
  }

  const openManualRateModal = (currency, currentRate) => {
    manualRateModal.value = {
      show: true,
      currency,
      value: currentRate
    }
  }

  const saveManualRate = async () => {
    await executeSetManualRate(
      () => exchangeService.setManualRate(manualRateModal.value.currency, manualRateModal.value.value),
      {
        successMessage: 'platformSettings.exchange.manualRateSaved',
        onSuccess: async () => {
          manualRateModal.value.show = false
          await loadExchangeRates()
        },
        onError: error => {
          toast.error(error.response?.data?.error || error.message)
        }
      }
    )
  }

  return {
    // State
    exchangeRates,
    schedulerStatus,
    showAllCurrencies,
    manualRateModal,
    refreshingRates,
    settingManualRate,

    // Constants
    MAIN_CURRENCIES,
    CURRENCY_NAMES,

    // Computed
    mainCurrencies,
    otherCurrencies,

    // Helpers
    getCurrencyName,
    formatRate,
    formatDateTime,

    // Actions
    loadExchangeRates,
    refreshExchangeRates,
    openManualRateModal,
    saveManualRate
  }
}

export default useExchangeRates
