<template>
  <Modal v-model="show" :title="$t('billing.transaction.newTransaction')" size="lg" @close="close">
    <div class="space-y-6">
      <!-- Quick Charge Buttons -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {{ $t('billing.transaction.quickActions') }}
        </h4>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="item in quickChargeItems"
            :key="item.description"
            class="p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 text-center transition-colors"
            :class="{
              'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20':
                form.type === item.type && form.description === item.description
            }"
            @click="selectQuickCharge(item)"
          >
            <span class="material-icons text-gray-600 dark:text-gray-400 block mb-1">{{
              item.icon
            }}</span>
            <span class="text-xs text-gray-700 dark:text-gray-300">{{ item.description }}</span>
          </button>
        </div>
      </div>

      <hr class="border-gray-200 dark:border-slate-700" />

      <!-- Transaction Type -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
            >{{ $t('billing.transaction.transactionType') }} *</label
          >
          <select
            v-model="form.type"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{{ $t('common.select') }}...</option>
            <optgroup :label="$t('billing.transaction.groups.income')">
              <option value="room_charge">{{ $t('billing.transaction.types.roomCharge') }}</option>
              <option value="extra_charge">
                {{ $t('billing.transaction.types.extraCharge') }}
              </option>
              <option value="restaurant">{{ $t('billing.transaction.types.restaurant') }}</option>
              <option value="bar">{{ $t('billing.transaction.types.bar') }}</option>
              <option value="minibar">{{ $t('billing.transaction.types.minibar') }}</option>
              <option value="spa">{{ $t('billing.transaction.types.spa') }}</option>
              <option value="laundry">{{ $t('billing.transaction.types.laundry') }}</option>
              <option value="parking">{{ $t('billing.transaction.types.parking') }}</option>
              <option value="phone">{{ $t('billing.transaction.types.phone') }}</option>
              <option value="other_income">
                {{ $t('billing.transaction.types.otherIncome') }}
              </option>
            </optgroup>
            <optgroup :label="$t('billing.transaction.groups.payments')">
              <option value="payment">{{ $t('billing.transaction.types.payment') }}</option>
              <option value="deposit">{{ $t('billing.transaction.types.deposit') }}</option>
              <option value="advance">{{ $t('billing.transaction.types.advance') }}</option>
            </optgroup>
            <optgroup :label="$t('billing.transaction.groups.expenses')">
              <option value="expense">{{ $t('billing.transaction.types.expense') }}</option>
              <option value="payout">{{ $t('billing.transaction.types.payout') }}</option>
            </optgroup>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
            >{{ $t('billing.transaction.paymentMethod') }} *</label
          >
          <select
            v-model="form.paymentMethod"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="cash">{{ $t('billing.paymentMethods.cash') }}</option>
            <option value="credit_card">{{ $t('billing.paymentMethods.credit_card') }}</option>
            <option value="debit_card">{{ $t('billing.paymentMethods.debit_card') }}</option>
            <option value="bank_transfer">{{ $t('billing.paymentMethods.bank_transfer') }}</option>
            <option value="room_charge">{{ $t('billing.paymentMethods.room_charge') }}</option>
            <option value="city_ledger">{{ $t('billing.paymentMethods.city_ledger') }}</option>
            <option value="voucher">{{ $t('billing.paymentMethods.voucher') }}</option>
            <option value="online">{{ $t('billing.paymentMethods.online') }}</option>
            <option value="other">{{ $t('billing.paymentMethods.other') }}</option>
          </select>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
          >{{ $t('common.description') }} *</label
        >
        <input
          v-model="form.description"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          :placeholder="$t('billing.transaction.descriptionPlaceholder')"
        />
      </div>

      <!-- Amount -->
      <div class="grid grid-cols-4 gap-4">
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
            >{{ $t('billing.transaction.currency') }} *</label
          >
          <select
            v-model="form.currency"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option v-for="curr in availableCurrencies" :key="curr" :value="curr">
              {{ getCurrencySymbol(curr) }} {{ curr }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
            $t('common.quantity')
          }}</label>
          <input
            v-model.number="form.quantity"
            type="number"
            min="1"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
            >{{ $t('billing.transaction.unitPrice') }} *</label
          >
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{{
              getCurrencySymbol(form.currency)
            }}</span>
            <input
              v-model.number="form.unitPrice"
              type="number"
              min="0"
              step="0.01"
              class="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
            $t('billing.transaction.totalAmount')
          }}</label>
          <div class="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ getCurrencySymbol(form.currency) }}{{ formatAmount(totalAmount) }}
            </p>
          </div>
        </div>
      </div>

      <!-- TRY Equivalent (for foreign currencies) -->
      <div
        v-if="form.currency !== 'TRY' && exchangeRates[form.currency]"
        class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm text-blue-700 dark:text-blue-300">
            <span class="material-icons text-sm align-middle mr-1">currency_exchange</span>
            {{ $t('billing.transaction.tryEquivalent') }} ({{ $t('billing.transaction.rate') }}:
            {{ exchangeRates[form.currency] }})
          </span>
          <span class="font-medium text-blue-800 dark:text-blue-200">
            {{ formatAmount(totalAmount * exchangeRates[form.currency]) }}
          </span>
        </div>
      </div>

      <!-- Reference & Notes -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
            $t('billing.transaction.referenceNo')
          }}</label>
          <input
            v-model="form.reference"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            :placeholder="$t('billing.transaction.referencePlaceholder')"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
            $t('common.notes')
          }}</label>
          <input
            v-model="form.notes"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            :placeholder="$t('billing.transaction.notesPlaceholder')"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        :disabled="loading"
        @click="close"
      >
        {{ $t('common.cancel') }}
      </button>
      <button
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading || !isValid"
        @click="submit"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span v-else class="material-icons text-sm">add_card</span>
        {{ $t('billing.transaction.saveTransaction') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import cashierService, { QUICK_CHARGE_ITEMS } from '@/services/pms/cashierService'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'created'])

const toast = useToast()
const loading = ref(false)

const quickChargeItems = QUICK_CHARGE_ITEMS

// Currency data
const availableCurrencies = ref(['TRY'])
const exchangeRates = ref({})

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

const getCurrencySymbol = currency => currencySymbols[currency] || currency

const formatAmount = amount => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

const fetchCurrencies = async () => {
  if (!props.hotelId) return
  try {
    const response = await cashierService.getCurrencies(props.hotelId)
    if (response.data) {
      availableCurrencies.value = response.data.availableCurrencies || ['TRY']
      exchangeRates.value = response.data.exchangeRates || {}
    }
  } catch (error) {
    console.error('Currency fetch error:', error)
    availableCurrencies.value = ['TRY']
  }
}

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const defaultForm = () => ({
  type: '',
  description: '',
  paymentMethod: 'cash',
  currency: 'TRY',
  quantity: 1,
  unitPrice: 0,
  reference: '',
  notes: ''
})

const form = ref(defaultForm())

const totalAmount = computed(() => {
  return (form.value.quantity || 1) * (form.value.unitPrice || 0)
})

const isValid = computed(() => {
  return form.value.type && form.value.description && form.value.unitPrice > 0
})

const selectQuickCharge = item => {
  form.value.type = item.type
  form.value.description = item.description
  if (item.amount > 0) {
    form.value.unitPrice = item.amount
  }
}

const submit = async () => {
  if (!isValid.value) return

  loading.value = true
  try {
    const data = {
      ...form.value,
      amount: totalAmount.value
    }

    // Calculate TRY equivalent for foreign currencies
    if (form.value.currency !== 'TRY' && exchangeRates.value[form.value.currency]) {
      data.amountInTRY = totalAmount.value * exchangeRates.value[form.value.currency]
      data.exchangeRate = exchangeRates.value[form.value.currency]
    }

    await cashierService.createTransaction(props.hotelId, data)
    toast.success(t('billing.transaction.messages.success'))
    emit('created')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || t('billing.transaction.messages.error'))
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  form.value = defaultForm()
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      form.value = defaultForm()
      fetchCurrencies()
    }
  }
)

// Set default currency to first available
watch(availableCurrencies, currencies => {
  if (currencies.length > 0 && !currencies.includes(form.value.currency)) {
    form.value.currency = currencies[0]
  }
})
</script>
