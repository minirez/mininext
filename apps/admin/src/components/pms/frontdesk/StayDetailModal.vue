<template>
  <Modal
    v-model="show"
    :title="`${$t('frontDesk.stayDetail.title')} - ${stay?.stayNumber || ''}`"
    size="xl"
    :close-on-overlay="false"
    @close="close"
  >
    <div v-if="stay" class="space-y-6">
      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-slate-700">
        <nav class="flex -mb-px">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            :class="
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            "
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-4">
        <!-- Guest & Room Info -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-2">
              {{ $t('frontDesk.stayDetail.guest') }}
            </h4>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ stay.guests?.[0]?.firstName }} {{ stay.guests?.[0]?.lastName }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ stay.guests?.[0]?.phone }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ stay.guests?.[0]?.email }}</p>
          </div>
          <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-2">
              {{ $t('frontDesk.stayDetail.room') }}
            </h4>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ $t('frontDesk.stayDetail.room') }} {{ stay.room?.roomNumber }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ stay.roomType?.name?.tr || stay.roomType?.code }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('frontDesk.stayDetail.floor') }} {{ stay.room?.floor }}
            </p>
          </div>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('frontDesk.stayDetail.checkIn') }}
            </p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDate(stay.checkInDate) }}
            </p>
          </div>
          <div class="text-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('frontDesk.stayDetail.checkOut') }}
            </p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDate(stay.checkOutDate) }}
            </p>
          </div>
          <div class="text-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('common.nights') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ stay.nights }}</p>
          </div>
        </div>

        <!-- Financial Summary -->
        <div class="border border-gray-200 dark:border-slate-600 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ $t('frontDesk.stayDetail.accountStatus') }}
          </h4>
          <div class="grid grid-cols-4 gap-4 text-center">
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('common.total') }}</p>
              <p class="font-bold text-gray-900 dark:text-white">
                {{ formatMoney(stay.totalAmount, stay.currency) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('frontDesk.stayDetail.paid') }}
              </p>
              <p class="font-bold text-green-600">
                {{ formatMoney(stay.paidAmount, stay.currency) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('frontDesk.stayDetail.balance') }}
              </p>
              <p class="font-bold" :class="stay.balance > 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatMoney(stay.balance, stay.currency) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('common.status') }}</p>
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="paymentStatusInfo?.bgColor + ' ' + paymentStatusInfo?.textColor"
              >
                {{ paymentStatusInfo?.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="stay.specialRequests || stay.internalNotes">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ $t('common.notes') }}
          </h4>
          <div
            v-if="stay.specialRequests"
            class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-2"
          >
            <p class="text-xs text-blue-600 dark:text-blue-400 mb-1">
              {{ $t('frontDesk.stayDetail.guestRequests') }}
            </p>
            <p class="text-sm text-blue-700 dark:text-blue-300">{{ stay.specialRequests }}</p>
          </div>
          <div v-if="stay.internalNotes" class="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
            <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
              {{ $t('frontDesk.stayDetail.internalNotes') }}
            </p>
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ stay.internalNotes }}</p>
          </div>
        </div>
      </div>

      <!-- Extras Tab -->
      <div v-if="activeTab === 'extras'" class="space-y-4">
        <!-- Add Extra Form -->
        <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ $t('frontDesk.stayDetail.addExtra') }}
          </h4>
          <div class="grid grid-cols-4 gap-3">
            <div class="col-span-2">
              <input
                v-model="extraForm.description"
                type="text"
                :placeholder="$t('common.description')"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <input
                v-model.number="extraForm.amount"
                type="number"
                :placeholder="$t('common.amount')"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <button
                :disabled="!extraForm.description || !extraForm.amount"
                class="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
                @click="addExtra"
              >
                {{ $t('common.add') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Extras List -->
        <div v-if="stay.extras?.length > 0" class="divide-y divide-gray-200 dark:divide-slate-700">
          <div
            v-for="(extra, index) in stay.extras"
            :key="index"
            class="flex items-center justify-between py-3"
          >
            <div>
              <p class="text-gray-900 dark:text-white">{{ extra.description }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ formatDateTime(extra.date) }}
                <span v-if="extra.quantity > 1"> - x{{ extra.quantity }}</span>
              </p>
            </div>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ formatMoney(extra.amount * (extra.quantity || 1), stay.currency) }}
            </span>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
          {{ $t('frontDesk.stayDetail.noExtras') }}
        </div>
      </div>

      <!-- Payments Tab -->
      <div v-if="activeTab === 'payments'" class="space-y-4">
        <!-- Add Payment Form -->
        <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ $t('frontDesk.stayDetail.receivePayment') }}
          </h4>

          <!-- Balance Info -->
          <div
            v-if="stay.balance > 0"
            class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-yellow-700 dark:text-yellow-300">
                {{ $t('frontDesk.stayDetail.remainingBalance') }}:
              </span>
              <span class="font-bold text-yellow-800 dark:text-yellow-200">
                {{ formatMoney(stay.balance, stay.currency) }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-5 gap-3">
            <!-- Amount -->
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                $t('common.amount')
              }}</label>
              <input
                v-model.number="paymentForm.amount"
                type="number"
                :placeholder="$t('common.amount')"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <!-- Currency -->
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                $t('currency.currency')
              }}</label>
              <select
                v-model="paymentForm.currency"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              >
                <option v-for="curr in availableCurrencies" :key="curr" :value="curr">
                  {{ getCurrencySymbol(curr) }} {{ curr }}
                </option>
              </select>
            </div>

            <!-- Payment Method -->
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                $t('frontDesk.stayDetail.paymentMethod')
              }}</label>
              <select
                v-model="paymentForm.method"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              >
                <option v-for="m in paymentMethods" :key="m.value" :value="m.value">
                  {{ m.label }}
                </option>
              </select>
            </div>

            <!-- Reference -->
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                $t('frontDesk.stayDetail.reference')
              }}</label>
              <input
                v-model="paymentForm.reference"
                type="text"
                :placeholder="$t('frontDesk.stayDetail.referenceOptional')"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <!-- Submit -->
            <div>
              <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">&nbsp;</label>
              <button
                :disabled="!paymentForm.amount || paymentForm.amount <= 0"
                class="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                @click="addPayment"
              >
                {{ $t('common.receive') }}
              </button>
            </div>
          </div>

          <!-- Currency Conversion Info -->
          <div v-if="showConversionInfo" class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <span class="material-icons text-base">currency_exchange</span>
              <span>
                {{ formatMoney(paymentForm.amount, paymentForm.currency) }} =
                {{ formatMoney(convertedAmount, stay.currency) }}
              </span>
              <span class="text-xs text-blue-500 dark:text-blue-400">
                ({{ $t('currency.rate') }}: 1 {{ paymentForm.currency }} =
                {{ exchangeRates[paymentForm.currency] || 1 }} TRY)
              </span>
            </div>
          </div>
        </div>

        <!-- Payments List -->
        <div
          v-if="stay.payments?.length > 0"
          class="divide-y divide-gray-200 dark:divide-slate-700"
        >
          <div
            v-for="(payment, index) in stay.payments"
            :key="index"
            class="flex items-center justify-between py-3"
          >
            <div>
              <p class="text-gray-900 dark:text-white">
                {{ paymentMethods.find(m => m.value === payment.method)?.label || payment.method }}
                <span
                  v-if="payment.currency && payment.currency !== stay.currency"
                  class="text-xs text-gray-500 ml-1"
                >
                  ({{ payment.currency }})
                </span>
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ formatDateTime(payment.date) }}
                <span v-if="payment.reference"> - {{ payment.reference }}</span>
              </p>
            </div>
            <div class="text-right">
              <span class="font-medium text-green-600">
                {{ formatMoney(payment.amount, payment.currency || stay.currency) }}
              </span>
              <p
                v-if="
                  payment.currency &&
                  payment.currency !== stay.currency &&
                  payment.amountInBaseCurrency
                "
                class="text-xs text-gray-500"
              >
                ≈ {{ formatMoney(payment.amountInBaseCurrency, stay.currency) }}
              </p>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
          {{ $t('frontDesk.stayDetail.noPayments') }}
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        @click="close"
      >
        {{ $t('common.close') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import stayService, { PAYMENT_METHODS, PAYMENT_STATUS_INFO } from '@/services/pms/stayService'
import cashierService from '@/services/pms/cashierService'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  },
  stay: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const toast = useToast()
const activeTab = ref('overview')

const paymentMethods = PAYMENT_METHODS

// Currency data
const availableCurrencies = ref(['TRY', 'USD', 'EUR', 'GBP'])
const exchangeRates = ref({})

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

const extraForm = ref({
  description: '',
  amount: null,
  category: 'other'
})

const paymentForm = ref({
  amount: null,
  currency: 'TRY',
  method: 'cash',
  reference: ''
})

// Watch currency change and auto-convert amount
watch(
  () => paymentForm.value.currency,
  (newCurrency, oldCurrency) => {
    if (paymentForm.value.amount > 0 && oldCurrency && newCurrency !== oldCurrency) {
      const oldRate = exchangeRates.value[oldCurrency] || 1
      const newRate = exchangeRates.value[newCurrency] || 1
      // Convert: first to TRY, then to new currency
      const amountInTRY = paymentForm.value.amount * oldRate
      paymentForm.value.amount = Math.round((amountInTRY / newRate) * 100) / 100
    }
  }
)

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const tabs = computed(() => [
  { key: 'overview', label: t('frontDesk.stayDetail.tabs.overview') },
  { key: 'extras', label: t('frontDesk.stayDetail.tabs.extras') },
  { key: 'payments', label: t('frontDesk.stayDetail.tabs.payments') }
])

const paymentStatusInfo = computed(() => {
  if (!props.stay?.paymentStatus) return null
  return PAYMENT_STATUS_INFO[props.stay.paymentStatus]
})

// Show conversion info when payment currency differs from stay currency
const showConversionInfo = computed(() => {
  return (
    paymentForm.value.amount > 0 && paymentForm.value.currency !== (props.stay?.currency || 'TRY')
  )
})

// Calculate converted amount
const convertedAmount = computed(() => {
  if (!paymentForm.value.amount) return 0
  const rate = exchangeRates.value[paymentForm.value.currency] || 1
  const stayRate = exchangeRates.value[props.stay?.currency] || 1
  // Convert payment currency to TRY, then to stay currency
  return (paymentForm.value.amount * rate) / stayRate
})

const getCurrencySymbol = currency => currencySymbols[currency] || currency

const fetchCurrencies = async () => {
  if (!props.hotelId) return
  try {
    const response = await cashierService.getCurrencies(props.hotelId)
    if (response.data) {
      availableCurrencies.value = response.data.availableCurrencies || ['TRY', 'USD', 'EUR', 'GBP']
      exchangeRates.value = response.data.exchangeRates || {}
    }
  } catch (error) {
    console.error('Currency fetch error:', error)
  }
}

const addExtra = async () => {
  if (!extraForm.value.description || !extraForm.value.amount) return

  try {
    await stayService.addExtra(props.hotelId, props.stay._id, extraForm.value)
    toast.success(t('frontDesk.stayDetail.extraAdded'))
    extraForm.value = { description: '', amount: null, category: 'other' }
    emit('updated')
  } catch (error) {
    toast.error(error.response?.data?.message || t('frontDesk.stayDetail.extraError'))
  }
}

const addPayment = async () => {
  if (!paymentForm.value.amount) return

  try {
    const paymentData = {
      amount: paymentForm.value.amount,
      currency: paymentForm.value.currency,
      method: paymentForm.value.method,
      reference: paymentForm.value.reference,
      exchangeRate: exchangeRates.value[paymentForm.value.currency] || 1
    }

    await stayService.addPayment(props.hotelId, props.stay._id, paymentData)
    toast.success(t('frontDesk.stayDetail.paymentReceived'))
    paymentForm.value = { amount: null, currency: 'TRY', method: 'cash', reference: '' }
    emit('updated')
  } catch (error) {
    toast.error(error.response?.data?.message || t('frontDesk.stayDetail.paymentError'))
  }
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateTime = date => {
  if (!date) return '-'
  return new Date(date).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMoney = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency
  }).format(amount || 0)
}

const close = () => {
  show.value = false
  activeTab.value = 'overview'
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      activeTab.value = 'overview'
      extraForm.value = { description: '', amount: null, category: 'other' }
      paymentForm.value = {
        amount: null,
        currency: props.stay?.currency || 'TRY',
        method: 'cash',
        reference: ''
      }
      fetchCurrencies()
    }
  }
)

onMounted(() => {
  if (props.hotelId) {
    fetchCurrencies()
  }
})
</script>
