<template>
  <Modal
    v-model="show"
    :title="$t('billing.shiftDetail.title', { number: shift?.shiftNumber || '' })"
    size="xl"
    :close-on-overlay="false"
    @close="close"
  >
    <div v-if="loading" class="p-8 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
    </div>

    <div v-else-if="shiftDetail" class="space-y-6">
      <!-- Shift Info -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('billing.shiftDetail.cashier') }}
            </p>
            <p class="font-medium text-gray-900 dark:text-white">{{ shiftDetail.cashierName }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('common.status') }}</p>
            <span
              class="px-2 py-1 rounded-full text-xs font-medium"
              :class="
                shiftDetail.status === 'open'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              "
            >
              {{
                shiftDetail.status === 'open'
                  ? $t('billing.shiftDetail.statusOpen')
                  : $t('billing.shiftDetail.statusClosed')
              }}
            </span>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('billing.shiftDetail.opening') }}
            </p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDateTime(shiftDetail.openedAt) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('billing.shiftDetail.closing') }}
            </p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ shiftDetail.closedAt ? formatDateTime(shiftDetail.closedAt) : '-' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
        >
          <p class="text-xs text-green-600 dark:text-green-400">
            {{ $t('billing.shiftDetail.openingCash') }}
          </p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300">
            {{ formatCurrency(shiftDetail.openingBalance?.cash) }}
          </p>
        </div>
        <div
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
        >
          <p class="text-xs text-blue-600 dark:text-blue-400">
            {{ $t('billing.shiftDetail.cashCollection') }}
          </p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">
            {{ formatCurrency(shiftDetail.totals?.cashReceived) }}
          </p>
        </div>
        <div
          class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3"
        >
          <p class="text-xs text-purple-600 dark:text-purple-400">
            {{ $t('billing.shiftDetail.cardCollection') }}
          </p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">
            {{ formatCurrency(shiftDetail.totals?.cardReceived) }}
          </p>
        </div>
        <div
          class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3"
        >
          <p class="text-xs text-indigo-600 dark:text-indigo-400">
            {{ $t('billing.shiftDetail.netSales') }}
          </p>
          <p class="text-xl font-bold text-indigo-700 dark:text-indigo-300">
            {{ formatCurrency(shiftDetail.totals?.netSales) }}
          </p>
        </div>
      </div>

      <!-- Discrepancy (if closed) -->
      <div
        v-if="shiftDetail.status === 'closed' && shiftDetail.discrepancy !== 0"
        class="p-4 rounded-lg"
        :class="
          shiftDetail.discrepancy > 0
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-red-50 dark:bg-red-900/20'
        "
      >
        <div class="flex items-center justify-between">
          <div>
            <p
              class="text-sm font-medium"
              :class="shiftDetail.discrepancy > 0 ? 'text-green-700' : 'text-red-700'"
            >
              {{
                shiftDetail.discrepancy > 0
                  ? $t('billing.shiftDetail.cashSurplus')
                  : $t('billing.shiftDetail.cashShortage')
              }}
            </p>
            <p v-if="shiftDetail.discrepancyNote" class="text-xs text-gray-600 dark:text-gray-400">
              {{ shiftDetail.discrepancyNote }}
            </p>
          </div>
          <p
            class="text-xl font-bold"
            :class="shiftDetail.discrepancy > 0 ? 'text-green-700' : 'text-red-700'"
          >
            {{ formatCurrency(Math.abs(shiftDetail.discrepancy)) }}
          </p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-slate-700">
        <nav class="flex -mb-px">
          <button
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              detailTab === 'transactions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]"
            @click="detailTab = 'transactions'"
          >
            {{ $t('billing.shiftDetail.transactions') }} ({{
              shiftDetail.transactions?.length || 0
            }})
          </button>
          <button
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              detailTab === 'movements'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]"
            @click="detailTab = 'movements'"
          >
            {{ $t('billing.shiftDetail.cashMovements') }} ({{
              shiftDetail.cashMovements?.length || 0
            }})
          </button>
        </nav>
      </div>

      <!-- Transactions List -->
      <div v-if="detailTab === 'transactions'" class="max-h-64 overflow-y-auto">
        <div v-if="!shiftDetail.transactions?.length" class="text-center py-8 text-gray-500">
          {{ $t('billing.shiftDetail.noTransactions') }}
        </div>
        <table v-else class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('common.no') }}
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('common.description') }}
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('billing.shiftDetail.payment') }}
              </th>
              <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                {{ $t('common.amount') }}
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('billing.shiftDetail.time') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="txn in shiftDetail.transactions" :key="txn._id">
              <td class="px-3 py-2 font-mono text-xs">{{ txn.transactionNumber }}</td>
              <td class="px-3 py-2">{{ txn.description }}</td>
              <td class="px-3 py-2 text-xs text-gray-500">
                {{ getPaymentMethodLabel(txn.paymentMethod) }}
              </td>
              <td
                class="px-3 py-2 text-right font-medium"
                :class="txn.amount >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ formatCurrency(txn.amount) }}
              </td>
              <td class="px-3 py-2 text-xs text-gray-500">{{ formatTime(txn.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cash Movements List -->
      <div v-if="detailTab === 'movements'" class="max-h-64 overflow-y-auto">
        <div v-if="!shiftDetail.cashMovements?.length" class="text-center py-8 text-gray-500">
          {{ $t('billing.shiftDetail.noMovements') }}
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="(movement, index) in shiftDetail.cashMovements"
            :key="index"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons" :class="getMovementColor(movement.type)">{{
                getMovementIcon(movement.type)
              }}</span>
              <div>
                <p class="font-medium text-gray-900 dark:text-white text-sm">
                  {{ getMovementLabel(movement.type) }}
                </p>
                <p class="text-xs text-gray-500">{{ movement.description || '-' }}</p>
              </div>
            </div>
            <div class="text-right">
              <p
                class="font-medium"
                :class="isPositiveMovement(movement.type) ? 'text-green-600' : 'text-red-600'"
              >
                {{ isPositiveMovement(movement.type) ? '+' : '-'
                }}{{ formatCurrency(Math.abs(movement.amount)) }}
              </p>
              <p class="text-xs text-gray-500">{{ formatTime(movement.createdAt) }}</p>
            </div>
          </div>
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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import cashierService, {
  formatCurrency,
  PAYMENT_METHOD_INFO,
  CASH_MOVEMENT_INFO
} from '@/services/pms/cashierService'

const { t, locale } = useI18n()

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

const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const shiftDetail = ref(null)
const detailTab = ref('transactions')

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const fetchShiftDetail = async () => {
  if (!props.shift?._id) return

  loading.value = true
  try {
    const response = await cashierService.getShift(props.hotelId, props.shift._id)
    shiftDetail.value = response.data
  } catch (error) {
    console.error('Shift detail error:', error)
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  shiftDetail.value = null
  detailTab.value = 'transactions'
}

const formatDateTime = date => {
  if (!date) return '-'
  const loc = locale.value === 'tr' ? 'tr-TR' : 'en-US'
  return new Date(date).toLocaleString(loc, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = date => {
  if (!date) return '-'
  const loc = locale.value === 'tr' ? 'tr-TR' : 'en-US'
  return new Date(date).toLocaleTimeString(loc, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPaymentMethodLabel = method => {
  const key = PAYMENT_METHOD_INFO[method]?.label
  return key ? t(key) : method || '-'
}

const getMovementLabel = type => {
  const key = CASH_MOVEMENT_INFO[type]?.label
  return key ? t(key) : type
}

const getMovementIcon = type => CASH_MOVEMENT_INFO[type]?.icon || 'swap_horiz'
const getMovementColor = type => {
  const info = CASH_MOVEMENT_INFO[type]
  if (!info) return 'text-gray-500'
  return `text-${info.color}-600`
}

const isPositiveMovement = type => {
  return ['opening', 'sale', 'deposit'].includes(type)
}

watch(
  () => props.modelValue,
  val => {
    if (val && props.shift) {
      fetchShiftDetail()
    }
  }
)
</script>
