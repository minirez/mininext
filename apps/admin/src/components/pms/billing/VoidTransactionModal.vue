<template>
  <Modal v-model="show" :title="$t('billing.voidTransaction.title')" size="md" @close="close">
    <div class="space-y-4">
      <div
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="material-icons text-red-600 dark:text-red-400">warning</span>
          <p class="font-medium text-red-800 dark:text-red-200">{{ $t('common.warning') }}!</p>
        </div>
        <p class="text-sm text-red-700 dark:text-red-300">
          {{ $t('billing.voidTransaction.warningMessage') }}
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
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('common.amount') }}</p>
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
          >{{ $t('billing.voidTransaction.reason') }} *</label
        >
        <textarea
          v-model="reason"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          :placeholder="$t('billing.voidTransaction.reasonPlaceholder')"
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
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading || !reason"
        @click="submit"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span v-else class="material-icons text-sm">cancel</span>
        {{ $t('billing.voidTransaction.voidButton') }}
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

const emit = defineEmits(['update:modelValue', 'voided'])

const toast = useToast()
const loading = ref(false)
const reason = ref('')

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const submit = async () => {
  if (!reason.value || !props.transaction?._id) return

  loading.value = true
  try {
    await cashierService.voidTransaction(props.hotelId, props.transaction._id, reason.value)
    toast.success(t('billing.voidTransaction.messages.success'))
    emit('voided')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || t('billing.voidTransaction.messages.error'))
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  reason.value = ''
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      reason.value = ''
    }
  }
)
</script>
