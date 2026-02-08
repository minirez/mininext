<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4"
    :class="{ 'border-l-4 border-l-indigo-500': highlighted }"
  >
    <!-- Currency Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-2xl font-bold" :class="currencyColor">{{ currency }}</span>
        <span v-if="currencySymbol" class="text-sm text-gray-500 dark:text-slate-400">{{
          currencySymbol
        }}</span>
      </div>
      <span
        v-if="exchangeRate && currency !== 'TRY'"
        class="text-xs text-gray-400 dark:text-slate-500"
      >
        1 {{ currency }} = {{ formatNumber(exchangeRate) }} TRY
      </span>
    </div>

    <!-- Balance Grid -->
    <div class="grid grid-cols-3 gap-3 mb-3">
      <!-- Cash -->
      <div class="text-center">
        <div class="text-xs text-gray-500 dark:text-slate-400 mb-1">
          {{ $t('currency.cash') }}
        </div>
        <div class="text-lg font-semibold text-green-600 dark:text-green-400">
          {{ formatCurrency(balances.cash, currency) }}
        </div>
      </div>
      <!-- Card -->
      <div class="text-center">
        <div class="text-xs text-gray-500 dark:text-slate-400 mb-1">
          {{ $t('currency.card') }}
        </div>
        <div class="text-lg font-semibold text-blue-600 dark:text-blue-400">
          {{ formatCurrency(balances.card, currency) }}
        </div>
      </div>
      <!-- Other -->
      <div class="text-center">
        <div class="text-xs text-gray-500 dark:text-slate-400 mb-1">
          {{ $t('currency.other') }}
        </div>
        <div class="text-lg font-semibold text-purple-600 dark:text-purple-400">
          {{ formatCurrency(balances.other, currency) }}
        </div>
      </div>
    </div>

    <!-- Total -->
    <div class="border-t border-gray-200 dark:border-slate-700 pt-3">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600 dark:text-slate-400">{{ $t('currency.total') }}</span>
        <span class="text-xl font-bold" :class="totalColor">
          {{ formatCurrency(total, currency) }}
        </span>
      </div>
      <!-- TRY Equivalent -->
      <div
        v-if="showTryEquivalent && currency !== 'TRY' && tryEquivalent"
        class="flex items-center justify-between mt-1"
      >
        <span class="text-xs text-gray-400 dark:text-slate-500">{{
          $t('currency.equivalentInTRY')
        }}</span>
        <span class="text-sm text-gray-500 dark:text-slate-400">
          {{ formatCurrency(tryEquivalent, 'TRY') }}
        </span>
      </div>
    </div>

    <!-- Transaction Count (optional) -->
    <div
      v-if="transactionCount !== undefined"
      class="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700"
    >
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-500 dark:text-slate-400">{{ $t('currency.transactions') }}</span>
        <span class="font-medium text-gray-700 dark:text-slate-300">{{ transactionCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currency: {
    type: String,
    required: true
  },
  balances: {
    type: Object,
    default: () => ({ cash: 0, card: 0, other: 0 })
  },
  exchangeRate: {
    type: Number,
    default: null
  },
  transactionCount: {
    type: Number,
    default: undefined
  },
  highlighted: {
    type: Boolean,
    default: false
  },
  showTryEquivalent: {
    type: Boolean,
    default: true
  }
})

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

const currencySymbol = computed(() => currencySymbols[props.currency] || '')

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

const currencyColor = computed(
  () => currencyColors[props.currency] || 'text-gray-700 dark:text-gray-300'
)

// Calculate total
const total = computed(() => {
  return (props.balances.cash || 0) + (props.balances.card || 0) + (props.balances.other || 0)
})

// Calculate TRY equivalent
const tryEquivalent = computed(() => {
  if (!props.exchangeRate || props.currency === 'TRY') return null
  return total.value * props.exchangeRate
})

// Total color based on value
const totalColor = computed(() => {
  if (total.value > 0) return 'text-green-600 dark:text-green-400'
  if (total.value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
})

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

// Format number
const formatNumber = num => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(num)
}
</script>
