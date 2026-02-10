<template>
  <Modal
    v-model="show"
    :title="$t('billing.closeShift.title')"
    size="lg"
    :close-on-overlay="false"
    @close="close"
  >
    <div class="space-y-6">
      <!-- Shift Summary -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ $t('billing.closeShift.shiftSummary') }}
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('billing.closeShift.shiftNumber') }}
            </p>
            <p class="font-medium text-gray-900 dark:text-white">{{ shift?.shiftNumber }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('billing.closeShift.cashier') }}
            </p>
            <p class="font-medium text-gray-900 dark:text-white">{{ shift?.cashierName }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('billing.closeShift.openingCash') }}
            </p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(shift?.openingBalance?.cash) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('billing.closeShift.duration') }}
            </p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatShiftDuration(shift?.openedAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Transaction Summary -->
      <div
        class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4"
      >
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ $t('billing.closeShift.transactionSummary') }}
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
          >
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('billing.closeShift.totalTransactions') }}
              </p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{ shift?.transactionCounts?.total || 0 }}
              </p>
            </div>
            <span class="material-icons text-gray-400">receipt_long</span>
          </div>
          <div
            class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
          >
            <div>
              <p class="text-xs text-green-600 dark:text-green-400">
                {{ $t('billing.closeShift.cashCollection') }}
              </p>
              <p class="text-lg font-bold text-green-700 dark:text-green-300">
                {{ formatCurrency(shift?.totals?.cashReceived) }}
              </p>
            </div>
            <span class="material-icons text-green-500">payments</span>
          </div>
          <div
            class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
          >
            <div>
              <p class="text-xs text-blue-600 dark:text-blue-400">
                {{ $t('billing.closeShift.cardCollection') }}
              </p>
              <p class="text-lg font-bold text-blue-700 dark:text-blue-300">
                {{ formatCurrency(shift?.totals?.cardReceived) }}
              </p>
            </div>
            <span class="material-icons text-blue-500">credit_card</span>
          </div>
          <div
            class="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
          >
            <div>
              <p class="text-xs text-purple-600 dark:text-purple-400">
                {{ $t('billing.closeShift.grossSales') }}
              </p>
              <p class="text-lg font-bold text-purple-700 dark:text-purple-300">
                {{ formatCurrency(shift?.totals?.grossSales) }}
              </p>
            </div>
            <span class="material-icons text-purple-500">trending_up</span>
          </div>
          <div
            class="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
          >
            <div>
              <p class="text-xs text-orange-600 dark:text-orange-400">
                {{ $t('billing.closeShift.refunds') }}
              </p>
              <p class="text-lg font-bold text-orange-700 dark:text-orange-300">
                {{ formatCurrency(shift?.totals?.refunds) }}
              </p>
            </div>
            <span class="material-icons text-orange-500">replay</span>
          </div>
          <div
            class="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg"
          >
            <div>
              <p class="text-xs text-indigo-600 dark:text-indigo-400">
                {{ $t('billing.closeShift.netSales') }}
              </p>
              <p class="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                {{ formatCurrency(shift?.totals?.netSales) }}
              </p>
            </div>
            <span class="material-icons text-indigo-500">account_balance</span>
          </div>
        </div>
      </div>

      <!-- Cash Count -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {{ $t('billing.closeShift.cashCount') }}
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
              $t('billing.closeShift.expectedCash')
            }}</label>
            <div class="px-4 py-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
              <p class="text-xl font-bold text-gray-900 dark:text-white">
                {{ formatCurrency(expectedCash) }}
              </p>
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
              >{{ $t('billing.closeShift.actualCash') }} *</label
            >
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">TRY</span>
              <input
                v-model.number="form.actualCash"
                type="number"
                min="0"
                step="0.01"
                class="w-full pl-14 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <!-- Discrepancy -->
        <div
          v-if="discrepancy !== 0"
          class="mt-3 p-3 rounded-lg"
          :class="
            discrepancy > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
          "
        >
          <div class="flex items-center justify-between">
            <span
              :class="
                discrepancy > 0
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              "
            >
              {{
                discrepancy > 0
                  ? $t('billing.closeShift.surplus') + ':'
                  : $t('billing.closeShift.shortage') + ':'
              }}
            </span>
            <span
              class="font-bold"
              :class="
                discrepancy > 0
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              "
            >
              {{ formatCurrency(Math.abs(discrepancy)) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Discrepancy Note (if any) -->
      <div v-if="discrepancy !== 0">
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
          >{{ $t('billing.closeShift.discrepancyNote') }} *</label
        >
        <textarea
          v-model="form.discrepancyNote"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          :placeholder="$t('billing.closeShift.discrepancyNotePlaceholder')"
          required
        ></textarea>
      </div>

      <!-- Closing Notes -->
      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">{{
          $t('billing.closeShift.closingNotes')
        }}</label>
        <textarea
          v-model="form.closingNotes"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          :placeholder="$t('billing.closeShift.closingNotesPlaceholder')"
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
        :disabled="loading || !isValid"
        @click="submit"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span v-else class="material-icons text-sm">logout</span>
        {{ $t('billing.closeShift.title') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import cashierService, { formatCurrency, formatShiftDuration } from '@/services/pms/cashierService'

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
  shift: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'closed'])

const toast = useToast()
const loading = ref(false)

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const form = ref({
  actualCash: 0,
  discrepancyNote: '',
  closingNotes: ''
})

const expectedCash = computed(() => {
  if (!props.shift) return 0
  const opening = props.shift.openingBalance?.cash || 0
  const cashReceived = props.shift.totals?.cashReceived || 0
  const payouts = props.shift.totals?.payouts || 0
  return opening + cashReceived - payouts
})

const discrepancy = computed(() => {
  return (form.value.actualCash || 0) - expectedCash.value
})

const isValid = computed(() => {
  if (discrepancy.value !== 0 && !form.value.discrepancyNote) {
    return false
  }
  return form.value.actualCash !== undefined
})

const submit = async () => {
  if (!isValid.value) return

  loading.value = true
  try {
    await cashierService.closeShift(props.hotelId, props.shift._id, form.value)
    toast.success(t('billing.closeShift.messages.success'))
    emit('closed')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || t('billing.closeShift.messages.error'))
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  form.value = {
    actualCash: 0,
    discrepancyNote: '',
    closingNotes: ''
  }
}

watch(
  () => props.modelValue,
  val => {
    if (val && props.shift) {
      form.value.actualCash = expectedCash.value
    }
  }
)
</script>
