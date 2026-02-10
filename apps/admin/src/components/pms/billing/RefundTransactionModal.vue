<template>
  <Modal
    v-model="show"
    :title="$t('billing.refundTransaction.title')"
    size="md"
    :close-on-overlay="false"
    @close="close"
  >
    <div class="space-y-4">
      <div
        class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="material-icons text-orange-600 dark:text-orange-400">info</span>
          <p class="font-medium text-orange-800 dark:text-orange-200">
            {{ $t('billing.refundTransaction.infoTitle') }}
          </p>
        </div>
        <p class="text-sm text-orange-700 dark:text-orange-300">
          {{ $t('billing.refundTransaction.infoMessage') }}
        </p>
      </div>

      <!-- Transaction Info -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('billing.transaction.transactionNo') }}
            </p>
            <p class="font-mono font-medium text-gray-900 dark:text-white">
              {{ transaction?.transactionNumber }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('billing.refundTransaction.originalAmount') }}
            </p>
            <p class="font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(transaction?.amount) }}
            </p>
          </div>
          <div class="col-span-2">
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('common.description') }}</p>
            <p class="text-gray-900 dark:text-white">{{ transaction?.description }}</p>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
          >{{ $t('billing.refundTransaction.refundAmount') }} *</label
        >
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">TRY</span>
          <input
            v-model.number="form.amount"
            type="number"
            min="0"
            :max="transaction?.amount || 0"
            step="0.01"
            class="w-full pl-14 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div class="flex justify-between mt-1">
          <p class="text-xs text-gray-400">
            {{ $t('billing.refundTransaction.maximum') }}: {{ formatCurrency(transaction?.amount) }}
          </p>
          <button
            class="text-xs text-indigo-600 hover:underline"
            @click="form.amount = transaction?.amount || 0"
          >
            {{ $t('billing.refundTransaction.fullRefund') }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
          >{{ $t('billing.refundTransaction.reason') }} *</label
        >
        <textarea
          v-model="form.reason"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          :placeholder="$t('billing.refundTransaction.reasonPlaceholder')"
          required
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
        class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading || !isValid"
        @click="submit"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span v-else class="material-icons text-sm">replay</span>
        {{ $t('billing.refundTransaction.refundButton') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import cashierService, { formatCurrency } from '@/services/pms/cashierService'

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
  transaction: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'refunded'])

const toast = useToast()
const loading = ref(false)

const form = ref({
  amount: 0,
  reason: ''
})

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const isValid = computed(() => {
  return (
    form.value.amount > 0 &&
    form.value.amount <= (props.transaction?.amount || 0) &&
    form.value.reason
  )
})

const submit = async () => {
  if (!isValid.value || !props.transaction?._id) return

  loading.value = true
  try {
    await cashierService.refundTransaction(props.hotelId, props.transaction._id, form.value)
    toast.success(t('billing.refundTransaction.messages.success'))
    emit('refunded')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || t('billing.refundTransaction.messages.error'))
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  form.value = {
    amount: 0,
    reason: ''
  }
}

watch(
  () => props.modelValue,
  val => {
    if (val && props.transaction) {
      form.value.amount = props.transaction.amount
      form.value.reason = ''
    }
  }
)
</script>
