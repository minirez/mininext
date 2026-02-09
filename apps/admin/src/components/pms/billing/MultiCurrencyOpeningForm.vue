<template>
  <div class="space-y-4">
    <!-- Currency Selection -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {{ $t('currency.activeCurrencies') }}
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="currency in availableCurrencies"
          :key="currency"
          type="button"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="
            selectedCurrencies.includes(currency)
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          "
          @click="toggleCurrency(currency)"
        >
          {{ getCurrencySymbol(currency) }} {{ currency }}
        </button>
      </div>
      <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
        {{ $t('currency.selectCurrenciesHint') }}
      </p>
    </div>

    <!-- Opening Balances -->
    <div v-if="selectedCurrencies.length > 0" class="space-y-3">
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300">
        {{ $t('currency.openingBalances') }}
      </label>

      <div
        v-for="currency in selectedCurrencies"
        :key="currency"
        class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-lg font-semibold" :class="getCurrencyColor(currency)">
            {{ getCurrencySymbol(currency) }} {{ currency }}
          </span>
          <button
            v-if="currency !== 'TRY'"
            type="button"
            class="text-gray-400 hover:text-red-500"
            @click="removeCurrency(currency)"
          >
            <span class="material-icons text-sm">close</span>
          </button>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <!-- Cash -->
          <div>
            <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">
              {{ $t('currency.cash') }}
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {{ getCurrencySymbol(currency) }}
              </span>
              <input
                type="number"
                :value="getBalance(currency, 'cash')"
                min="0"
                step="0.01"
                class="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                placeholder="0.00"
                @input="updateBalance(currency, 'cash', $event.target.value)"
              />
            </div>
          </div>

          <!-- Card -->
          <div>
            <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">
              {{ $t('currency.card') }}
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {{ getCurrencySymbol(currency) }}
              </span>
              <input
                type="number"
                :value="getBalance(currency, 'card')"
                min="0"
                step="0.01"
                class="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                placeholder="0.00"
                @input="updateBalance(currency, 'card', $event.target.value)"
              />
            </div>
          </div>

          <!-- Other -->
          <div>
            <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">
              {{ $t('currency.other') }}
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {{ getCurrencySymbol(currency) }}
              </span>
              <input
                type="number"
                :value="getBalance(currency, 'other')"
                min="0"
                step="0.01"
                class="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                placeholder="0.00"
                @input="updateBalance(currency, 'other', $event.target.value)"
              />
            </div>
          </div>
        </div>

        <!-- Currency Total -->
        <div
          class="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600 flex justify-between items-center"
        >
          <span class="text-sm text-gray-500 dark:text-slate-400">{{ $t('currency.total') }}</span>
          <span class="text-lg font-bold" :class="getCurrencyColor(currency)">
            {{ formatCurrency(getCurrencyTotal(currency), currency) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Grand Total in TRY -->
    <div
      v-if="selectedCurrencies.length > 1 || !selectedCurrencies.includes('TRY')"
      class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg"
    >
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-indigo-700 dark:text-indigo-300">
          {{ $t('currency.totalInTRY') }}
        </span>
        <span class="text-xl font-bold text-indigo-600 dark:text-indigo-400">
          {{ formatCurrency(grandTotalInTRY, 'TRY') }}
        </span>
      </div>
      <p class="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
        {{ $t('currency.basedOnCurrentRates') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  currencies: {
    type: Array,
    default: () => ['TRY']
  },
  balances: {
    type: Array,
    default: () => []
  },
  availableCurrencies: {
    type: Array,
    default: () => ['TRY', 'USD', 'EUR', 'GBP']
  },
  exchangeRates: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:currencies', 'update:balances'])

// Local state
const selectedCurrencies = ref([...props.currencies])
const localBalances = ref([...props.balances])

// Currency symbols
const currencySymbols = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  RUB: '₽',
  SAR: '﷼',
  AED: 'د.إ',
  CHF: 'CHF',
  JPY: '¥',
  CNY: '¥'
}

// Currency colors
const currencyColors = {
  TRY: 'text-red-600 dark:text-red-400',
  USD: 'text-green-600 dark:text-green-400',
  EUR: 'text-blue-600 dark:text-blue-400',
  GBP: 'text-purple-600 dark:text-purple-400',
  RUB: 'text-orange-600 dark:text-orange-400',
  SAR: 'text-teal-600 dark:text-teal-400',
  AED: 'text-indigo-600 dark:text-indigo-400',
  CHF: 'text-rose-600 dark:text-rose-400',
  JPY: 'text-amber-600 dark:text-amber-400',
  CNY: 'text-pink-600 dark:text-pink-400'
}

// Watch for prop changes
watch(
  () => props.currencies,
  val => {
    selectedCurrencies.value = [...val]
  },
  { deep: true }
)

watch(
  () => props.balances,
  val => {
    localBalances.value = [...val]
  },
  { deep: true }
)

// Toggle currency selection
const toggleCurrency = currency => {
  const index = selectedCurrencies.value.indexOf(currency)
  if (index > -1) {
    // Don't allow removing TRY if it's the only currency
    if (currency === 'TRY' && selectedCurrencies.value.length === 1) return
    selectedCurrencies.value.splice(index, 1)
    // Remove balance for this currency
    const balanceIndex = localBalances.value.findIndex(b => b.currency === currency)
    if (balanceIndex > -1) {
      localBalances.value.splice(balanceIndex, 1)
    }
  } else {
    selectedCurrencies.value.push(currency)
    // Add default balance for this currency
    localBalances.value.push({
      currency,
      cash: 0,
      card: 0,
      other: 0
    })
  }
  emitChanges()
}

// Remove currency
const removeCurrency = currency => {
  const index = selectedCurrencies.value.indexOf(currency)
  if (index > -1) {
    selectedCurrencies.value.splice(index, 1)
    const balanceIndex = localBalances.value.findIndex(b => b.currency === currency)
    if (balanceIndex > -1) {
      localBalances.value.splice(balanceIndex, 1)
    }
    emitChanges()
  }
}

// Get balance for a currency
const getBalance = (currency, type) => {
  const balance = localBalances.value.find(b => b.currency === currency)
  return balance?.[type] || 0
}

// Update balance
const updateBalance = (currency, type, value) => {
  let balance = localBalances.value.find(b => b.currency === currency)
  if (!balance) {
    balance = { currency, cash: 0, card: 0, other: 0 }
    localBalances.value.push(balance)
  }
  balance[type] = parseFloat(value) || 0
  emitChanges()
}

// Get currency total
const getCurrencyTotal = currency => {
  const balance = localBalances.value.find(b => b.currency === currency)
  if (!balance) return 0
  return (balance.cash || 0) + (balance.card || 0) + (balance.other || 0)
}

// Calculate grand total in TRY
const grandTotalInTRY = computed(() => {
  let total = 0
  for (const currency of selectedCurrencies.value) {
    const currencyTotal = getCurrencyTotal(currency)
    if (currency === 'TRY') {
      total += currencyTotal
    } else if (props.exchangeRates[currency]) {
      total += currencyTotal * props.exchangeRates[currency]
    }
  }
  return total
})

// Get currency symbol
const getCurrencySymbol = currency => currencySymbols[currency] || currency

// Get currency color
const getCurrencyColor = currency => currencyColors[currency] || 'text-gray-700 dark:text-gray-300'

// Format currency
const formatCurrency = (amount, currency) => {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

// Emit changes
const emitChanges = () => {
  emit('update:currencies', [...selectedCurrencies.value])
  emit('update:balances', [...localBalances.value])
}
</script>
