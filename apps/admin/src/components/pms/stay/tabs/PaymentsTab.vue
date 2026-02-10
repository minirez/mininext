<template>
  <div class="space-y-6">
    <!-- Shift Warning -->
    <div
      v-if="shiftWarning"
      class="flex items-center gap-2 p-3 rounded-lg text-sm"
      :class="
        shiftWarning.type === 'no_shift'
          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
      "
    >
      <span class="material-icons text-base">{{
        shiftWarning.type === 'no_shift' ? 'error' : 'warning'
      }}</span>
      {{
        shiftWarning.type === 'no_shift'
          ? t('stayCard.shiftWarning.noShift')
          : t('stayCard.shiftWarning.longShift', { hours: shiftWarning.hours })
      }}
    </div>

    <!-- Add Payment Form -->
    <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
      <h3
        class="text-sm font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2"
      >
        <span class="material-icons text-sm">add_card</span>
        {{ t('stayCard.payments.addNew') }}
      </h3>

      <div class="grid grid-cols-5 gap-3">
        <!-- Amount -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{{
            t('common.amount')
          }}</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
            placeholder="0.00"
          />
        </div>

        <!-- Currency -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{{
            t('currency.currency')
          }}</label>
          <select
            v-model="form.currency"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
          >
            <option v-for="curr in availableCurrencies" :key="curr" :value="curr">
              {{ getCurrencySymbol(curr) }} {{ curr }}
            </option>
          </select>
        </div>

        <!-- Method -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{{
            t('stayCard.payments.method')
          }}</label>
          <select
            v-model="form.method"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
          >
            <option v-for="method in paymentMethods" :key="method.value" :value="method.value">
              {{ method.label }}
            </option>
          </select>
        </div>

        <!-- Reference -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{{
            t('stayCard.payments.reference')
          }}</label>
          <input
            v-model="form.reference"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
            :placeholder="t('common.optional')"
          />
        </div>

        <!-- Submit -->
        <div class="flex items-end">
          <button
            :disabled="!form.amount || form.amount <= 0 || saving"
            class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            @click="handleAddPayment"
          >
            <span v-if="saving" class="animate-spin material-icons text-sm">sync</span>
            <span class="material-icons text-sm" v-else>payments</span>
            {{ t('stayCard.payments.record') }}
          </button>
        </div>
      </div>

      <!-- Currency Conversion Info -->
      <div v-if="showConversionInfo" class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div class="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <span class="material-icons text-base">currency_exchange</span>
          <span>
            {{ formatCurrencyWithSymbol(form.amount, form.currency) }} ≈
            {{ formatCurrencyWithSymbol(convertedAmount, stay?.currency || 'TRY') }}
          </span>
          <span class="text-xs text-blue-500 dark:text-blue-400">
            ({{ t('currency.rate') }}: 1 {{ form.currency }} =
            {{ exchangeRates[form.currency] || 1 }} TRY)
          </span>
        </div>
      </div>

      <!-- Notes -->
      <div class="mt-3">
        <input
          v-model="form.notes"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
          :placeholder="t('stayCard.payments.notesPlaceholder')"
        />
      </div>
    </div>

    <!-- Payments List -->
    <div>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span class="material-icons text-sm text-gray-500">history</span>
        {{ t('stayCard.payments.history') }}
      </h3>

      <div v-if="stay?.payments?.length" class="space-y-2">
        <div
          v-for="(payment, index) in stay.payments"
          :key="index"
          class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center"
                :class="getMethodBgClass(payment.method)"
              >
                <span class="material-icons text-sm" :class="getMethodTextClass(payment.method)">
                  {{ getMethodIcon(payment.method) }}
                </span>
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white text-sm">
                  {{ getMethodLabel(payment.method) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ formatDate(payment.date || payment.createdAt) }}
                  <span v-if="payment.reference"> - Ref: {{ payment.reference }}</span>
                </p>
                <p v-if="payment.notes" class="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  {{ payment.notes }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <span class="font-semibold text-green-600 dark:text-green-400">
                +{{
                  formatCurrencyWithSymbol(
                    payment.amount,
                    payment.currency || stay?.currency || 'TRY'
                  )
                }}
              </span>
              <p
                v-if="
                  payment.currency &&
                  payment.currency !== (stay?.currency || 'TRY') &&
                  payment.amountInBaseCurrency
                "
                class="text-xs text-gray-500"
              >
                ≈
                {{
                  formatCurrencyWithSymbol(payment.amountInBaseCurrency, stay?.currency || 'TRY')
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
        <span class="material-icons text-4xl mb-2 opacity-50">payments</span>
        <p class="text-sm">{{ t('stayCard.payments.noPayments') }}</p>
      </div>

      <!-- Summary -->
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
        <div class="flex justify-between items-center text-sm">
          <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.total') }}</span>
          <span class="font-medium text-gray-900 dark:text-white">{{
            formatCurrency(stay?.totalAmount)
          }}</span>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.paid') }}</span>
          <span class="font-medium text-green-600 dark:text-green-400">{{
            formatCurrency(stay?.paidAmount)
          }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="font-semibold text-gray-900 dark:text-white">{{
            t('stayCard.balance')
          }}</span>
          <span
            class="text-lg font-bold"
            :class="
              (stay?.balance || 0) > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-white'
            "
          >
            {{ formatCurrency(stay?.balance) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PAYMENT_METHODS } from '../composables/useStayCard'

const { t, locale } = useI18n()

const props = defineProps({
  stay: Object,
  saving: Boolean,
  availableCurrencies: {
    type: Array,
    default: () => ['TRY', 'USD', 'EUR', 'GBP']
  },
  exchangeRates: {
    type: Object,
    default: () => ({})
  },
  shiftWarning: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['add-payment'])

const form = ref({
  amount: null,
  currency: 'TRY',
  method: 'cash',
  reference: '',
  notes: ''
})

// Watch currency change and auto-convert amount
watch(
  () => form.value.currency,
  (newCurrency, oldCurrency) => {
    if (form.value.amount > 0 && oldCurrency && newCurrency !== oldCurrency) {
      const oldRate = props.exchangeRates[oldCurrency] || 1
      const newRate = props.exchangeRates[newCurrency] || 1
      // Convert: first to TRY, then to new currency
      const amountInTRY = form.value.amount * oldRate
      form.value.amount = Math.round((amountInTRY / newRate) * 100) / 100
    }
  }
)

// Currency symbols
const currencySymbols = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  RUB: '₽',
  SAR: '﷼',
  AED: 'د.إ',
  CHF: 'CHF'
}

const getCurrencySymbol = currency => currencySymbols[currency] || currency

// Show conversion info when payment currency differs from stay currency
const showConversionInfo = computed(() => {
  return form.value.amount > 0 && form.value.currency !== (props.stay?.currency || 'TRY')
})

// Calculate converted amount
const convertedAmount = computed(() => {
  if (!form.value.amount) return 0
  const rate = props.exchangeRates[form.value.currency] || 1
  const stayRate = props.exchangeRates[props.stay?.currency] || 1
  return (form.value.amount * rate) / stayRate
})

// Dynamic payment methods with i18n labels
const paymentMethods = computed(() =>
  PAYMENT_METHODS.map(method => ({
    ...method,
    label: t(`stayCard.payments.methods.${method.value}`)
  }))
)

const handleAddPayment = () => {
  if (form.value.amount > 0) {
    emit(
      'add-payment',
      form.value.amount,
      form.value.method,
      form.value.currency,
      form.value.reference,
      form.value.notes
    )
    form.value.amount = null
    form.value.currency = props.stay?.currency || 'TRY'
    form.value.reference = ''
    form.value.notes = ''
  }
}

const formatCurrencyWithSymbol = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency
  }).format(amount || 0)
}

const getMethodLabel = method => {
  return t(`stayCard.payments.methods.${method}`)
}

const getMethodIcon = method => {
  return PAYMENT_METHODS.find(m => m.value === method)?.icon || 'payments'
}

const getMethodBgClass = method => {
  const colors = {
    cash: 'bg-green-100 dark:bg-green-900/30',
    credit_card: 'bg-blue-100 dark:bg-blue-900/30',
    debit_card: 'bg-cyan-100 dark:bg-cyan-900/30',
    bank_transfer: 'bg-purple-100 dark:bg-purple-900/30',
    online: 'bg-indigo-100 dark:bg-indigo-900/30',
    other: 'bg-gray-100 dark:bg-gray-700'
  }
  return colors[method] || colors.other
}

const getMethodTextClass = method => {
  const colors = {
    cash: 'text-green-600 dark:text-green-400',
    credit_card: 'text-blue-600 dark:text-blue-400',
    debit_card: 'text-cyan-600 dark:text-cyan-400',
    bank_transfer: 'text-purple-600 dark:text-purple-400',
    online: 'text-indigo-600 dark:text-indigo-400',
    other: 'text-gray-600 dark:text-gray-400'
  }
  return colors[method] || colors.other
}

const localeMap = { tr: 'tr-TR', en: 'en-US' }

const formatCurrency = amount => {
  return new Intl.NumberFormat(localeMap[locale.value] || 'tr-TR', {
    style: 'currency',
    currency: props.stay?.currency || 'TRY'
  }).format(amount || 0)
}

const formatDate = dateStr => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(localeMap[locale.value] || 'tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
