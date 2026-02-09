<template>
  <div class="relative" :class="{ 'inline-flex': inline }">
    <!-- Simple Select Mode -->
    <div v-if="!showRate" class="flex items-center gap-2">
      <label v-if="label" class="text-sm font-medium text-gray-700 dark:text-slate-300">
        {{ label }}
      </label>
      <select
        :value="modelValue"
        :disabled="disabled"
        class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        :class="selectClass"
        @change="handleChange($event.target.value)"
      >
        <option v-for="currency in availableCurrencies" :key="currency" :value="currency">
          {{ getCurrencyLabel(currency) }}
        </option>
      </select>
    </div>

    <!-- With Rate Display Mode -->
    <div v-else class="space-y-2">
      <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-slate-300">
        {{ label }}
      </label>
      <div class="flex items-center gap-3">
        <select
          :value="modelValue"
          :disabled="disabled"
          class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          @change="handleChange($event.target.value)"
        >
          <option v-for="currency in availableCurrencies" :key="currency" :value="currency">
            {{ getCurrencyLabel(currency) }}
          </option>
        </select>

        <!-- Exchange Rate Display -->
        <div
          v-if="modelValue !== baseCurrency && currentRate"
          class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg"
        >
          <span class="text-xs text-gray-500 dark:text-slate-400"
            >{{ $t('currency.exchangeRate') }}:</span
          >
          <span class="text-sm font-medium text-gray-700 dark:text-slate-300">
            1 {{ modelValue }} = {{ formatRate(currentRate) }} {{ baseCurrency }}
          </span>
        </div>
      </div>

      <!-- TRY Equivalent Preview -->
      <div
        v-if="amount && modelValue !== baseCurrency && currentRate"
        class="flex items-center gap-2 text-sm"
      >
        <span class="text-gray-500 dark:text-slate-400">{{ $t('currency.equivalentInTRY') }}:</span>
        <span class="font-medium text-indigo-600 dark:text-indigo-400">
          {{ formatCurrency(amount * currentRate, baseCurrency) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'TRY'
  },
  available: {
    type: Array,
    default: () => ['TRY', 'USD', 'EUR', 'GBP']
  },
  showRate: {
    type: Boolean,
    default: false
  },
  rates: {
    type: Object,
    default: () => ({})
  },
  baseCurrency: {
    type: String,
    default: 'TRY'
  },
  amount: {
    type: Number,
    default: null
  },
  label: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  },
  selectClass: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'rate-change'])

// Currency labels with symbols
const currencyLabels = {
  TRY: '₺ TRY - Türk Lirası',
  USD: '$ USD - US Dollar',
  EUR: '€ EUR - Euro',
  GBP: '£ GBP - British Pound',
  RUB: '₽ RUB - Russian Ruble',
  SAR: '﷼ SAR - Saudi Riyal',
  AED: 'AED - UAE Dirham',
  CHF: 'CHF - Swiss Franc',
  JPY: '¥ JPY - Japanese Yen',
  CNY: '¥ CNY - Chinese Yuan'
}

const shortLabels = {
  TRY: '₺ TRY',
  USD: '$ USD',
  EUR: '€ EUR',
  GBP: '£ GBP',
  RUB: '₽ RUB',
  SAR: '﷼ SAR',
  AED: 'AED',
  CHF: 'CHF',
  JPY: '¥ JPY',
  CNY: '¥ CNY'
}

// Available currencies (filtered by props.available)
const availableCurrencies = computed(() => {
  return props.available
})

// Get current exchange rate
const currentRate = computed(() => {
  if (props.modelValue === props.baseCurrency) return 1
  return props.rates[props.modelValue] || null
})

// Get currency label
const getCurrencyLabel = currency => {
  if (props.inline) {
    return shortLabels[currency] || currency
  }
  return currencyLabels[currency] || currency
}

// Handle currency change
const handleChange = currency => {
  emit('update:modelValue', currency)
  emit('change', {
    currency,
    rate: props.rates[currency] || 1
  })
  emit('rate-change', props.rates[currency] || 1)
}

// Format exchange rate
const formatRate = rate => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(rate)
}

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
</script>
