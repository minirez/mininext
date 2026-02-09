<template>
  <Modal v-model="show" :title="$t('cashier.openShift')" size="lg" @close="close">
    <div class="space-y-4">
      <div
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
      >
        <div class="flex items-center gap-2">
          <span class="material-icons text-blue-600 dark:text-blue-400">info</span>
          <p class="text-sm text-blue-800 dark:text-blue-200">
            {{ $t('cashier.openShiftInfo') }}
          </p>
        </div>
      </div>

      <!-- Multi-Currency Opening Form -->
      <MultiCurrencyOpeningForm
        v-model:currencies="form.activeCurrencies"
        v-model:balances="form.openingBalances"
        :available-currencies="availableCurrencies"
        :exchange-rates="exchangeRates"
      />

      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">
          {{ $t('cashier.registerId') }}
        </label>
        <input
          v-model="form.registerId"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="MAIN"
        />
      </div>

      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">
          {{ $t('cashier.notes') }}
        </label>
        <textarea
          v-model="form.notes"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          :placeholder="$t('cashier.shiftNotesPlaceholder')"
        ></textarea>
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
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading"
        @click="submit"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span v-else class="material-icons text-sm">login</span>
        {{ $t('cashier.openShift') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import MultiCurrencyOpeningForm from './MultiCurrencyOpeningForm.vue'
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
  }
})

const emit = defineEmits(['update:modelValue', 'opened'])

const toast = useToast()
const loading = ref(false)

// Currency data
const availableCurrencies = ref(['TRY', 'USD', 'EUR', 'GBP'])
const exchangeRates = ref({})

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const defaultForm = () => ({
  registerId: 'MAIN',
  notes: '',
  activeCurrencies: ['TRY', 'USD', 'EUR', 'GBP'],
  openingBalances: [
    { currency: 'TRY', cash: 0, card: 0, other: 0 },
    { currency: 'USD', cash: 0, card: 0, other: 0 },
    { currency: 'EUR', cash: 0, card: 0, other: 0 },
    { currency: 'GBP', cash: 0, card: 0, other: 0 }
  ]
})

const form = ref(defaultForm())

const fetchCurrencies = async () => {
  if (!props.hotelId) return
  try {
    const response = await cashierService.getCurrencies(props.hotelId)
    if (response.data) {
      availableCurrencies.value = response.data.availableCurrencies || ['TRY', 'USD', 'EUR', 'GBP']
      exchangeRates.value = response.data.exchangeRates || {}

      // Initialize with all available currencies
      form.value.activeCurrencies = [...availableCurrencies.value]
      form.value.openingBalances = availableCurrencies.value.map(currency => ({
        currency,
        cash: 0,
        card: 0,
        other: 0
      }))
    }
  } catch (error) {
    console.error('Currency fetch error:', error)
  }
}

const submit = async () => {
  loading.value = true
  try {
    const submitData = {
      registerId: form.value.registerId,
      notes: form.value.notes,
      activeCurrencies: form.value.activeCurrencies,
      openingBalances: form.value.openingBalances
    }

    await cashierService.openShift(props.hotelId, submitData)
    toast.success(t('cashier.shiftOpened'))
    emit('opened')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || t('cashier.shiftOpenError'))
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

onMounted(() => {
  if (props.hotelId) {
    fetchCurrencies()
  }
})
</script>
