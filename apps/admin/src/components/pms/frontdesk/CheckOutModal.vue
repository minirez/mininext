<template>
  <Modal
    v-model="show"
    :title="$t('frontDesk.checkOutModal.title')"
    size="lg"
    :z-index="60"
    @close="close"
  >
    <div v-if="stay" class="space-y-6">
      <!-- Stay Summary -->
      <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
        <div class="flex items-start justify-between">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ stay.guests?.[0]?.firstName }} {{ stay.guests?.[0]?.lastName }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('frontDesk.checkOutModal.room') }} {{ stay.room?.roomNumber }} -
              {{ stay.stayNumber }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600 dark:text-slate-300">
              {{ formatDate(stay.checkInDate) }} - {{ formatDate(stay.checkOutDate) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ stay.nights }} {{ $t('common.nights') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
        <div class="bg-gray-50 dark:bg-slate-700 px-4 py-2">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('frontDesk.checkOutModal.accountSummary') }}
          </h4>
        </div>
        <div class="p-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-slate-400">{{
              $t('frontDesk.checkOutModal.roomRate')
            }}</span>
            <span class="text-gray-900 dark:text-white">{{ formatCurrency(stay.roomRate) }}</span>
          </div>
          <div v-if="extrasTotal > 0" class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-slate-400">{{
              $t('frontDesk.checkOutModal.extras')
            }}</span>
            <span class="text-gray-900 dark:text-white">{{ formatCurrency(extrasTotal) }}</span>
          </div>
          <div class="border-t border-gray-200 dark:border-slate-600 pt-2 flex justify-between">
            <span class="font-medium text-gray-900 dark:text-white">{{ $t('common.total') }}</span>
            <span class="font-medium text-gray-900 dark:text-white">{{
              formatCurrency(stay.totalAmount)
            }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-slate-400">{{
              $t('frontDesk.checkOutModal.paid')
            }}</span>
            <span class="text-green-600">{{ formatCurrency(stay.paidAmount) }}</span>
          </div>
          <div class="border-t border-gray-200 dark:border-slate-600 pt-2 flex justify-between">
            <span class="font-medium" :class="stay.balance > 0 ? 'text-red-600' : 'text-green-600'">
              {{
                stay.balance > 0
                  ? $t('frontDesk.checkOutModal.remainingDebt')
                  : $t('frontDesk.checkOutModal.overpayment')
              }}
            </span>
            <span
              class="font-bold text-lg"
              :class="stay.balance > 0 ? 'text-red-600' : 'text-green-600'"
            >
              {{ formatCurrency(Math.abs(stay.balance)) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Extras List -->
      <div v-if="stay.extras?.length > 0">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('frontDesk.checkOutModal.extras') }}
        </h4>
        <div class="space-y-1">
          <div
            v-for="(extra, index) in stay.extras"
            :key="index"
            class="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-slate-700 last:border-0"
          >
            <span class="text-gray-600 dark:text-slate-400">
              {{ extra.description }}
              <span v-if="extra.quantity > 1" class="text-xs">(x{{ extra.quantity }})</span>
            </span>
            <span class="text-gray-900 dark:text-white">{{
              formatCurrency(extra.amount * extra.quantity)
            }}</span>
          </div>
        </div>
      </div>

      <!-- Balance Settlement -->
      <div v-if="stay.balance > 0" class="space-y-4">
        <!-- Warning -->
        <div
          class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
        >
          <div class="flex items-start gap-3">
            <span class="material-icons text-amber-600 dark:text-amber-400"
              >account_balance_wallet</span
            >
            <div>
              <p class="font-medium text-amber-800 dark:text-amber-200">
                {{ $t('frontDesk.checkOutModal.outstandingBalance') }}
              </p>
              <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {{ $t('frontDesk.checkOutModal.balanceWarning') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Option 1: Settle Balance -->
        <div
          class="border-2 rounded-lg p-4 cursor-pointer transition-all"
          :class="
            balanceOption === 'settle'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
          "
          @click="balanceOption = 'settle'"
        >
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="balanceOption"
              type="radio"
              value="settle"
              class="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
            />
            <div class="flex-1">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ $t('frontDesk.checkOutModal.settleBalance') }}
              </span>
              <span class="ml-2 text-green-600 font-bold">{{ formatCurrency(stay.balance) }}</span>
            </div>
          </label>

          <div v-if="balanceOption === 'settle'" class="mt-3 ml-7 flex flex-wrap gap-2">
            <label
              v-for="method in paymentMethods"
              :key="method.value"
              class="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer"
              :class="
                paymentMethod === method.value
                  ? 'border-green-500 bg-green-100 dark:bg-green-900/30'
                  : 'border-gray-200 dark:border-slate-600'
              "
            >
              <input v-model="paymentMethod" type="radio" :value="method.value" class="hidden" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ method.label }}</span>
            </label>
          </div>
        </div>

        <!-- Option 2: Checkout with Balance -->
        <div
          class="border-2 rounded-lg p-4 cursor-pointer transition-all"
          :class="
            balanceOption === 'withBalance'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
          "
          @click="balanceOption = 'withBalance'"
        >
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="balanceOption"
              type="radio"
              value="withBalance"
              class="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
            />
            <div class="flex-1">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ $t('frontDesk.checkOutModal.checkoutWithBalance') }}
              </span>
              <span class="text-sm text-gray-500 dark:text-slate-400 ml-2">
                ({{ $t('frontDesk.checkOutModal.requiresReason') }})
              </span>
            </div>
          </label>

          <div v-if="balanceOption === 'withBalance'" class="mt-3 ml-7 space-y-3">
            <div class="flex flex-wrap gap-2">
              <label
                v-for="reason in balanceReasons"
                :key="reason.value"
                class="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer"
                :class="
                  balanceReason === reason.value
                    ? 'border-orange-500 bg-orange-100 dark:bg-orange-900/30'
                    : 'border-gray-200 dark:border-slate-600'
                "
              >
                <input v-model="balanceReason" type="radio" :value="reason.value" class="hidden" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ reason.label }}</span>
              </label>
            </div>

            <div v-if="balanceReason === 'other'">
              <input
                v-model="balanceReasonNote"
                type="text"
                :placeholder="$t('frontDesk.checkOutModal.specifyReason')"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmation -->
      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
        <p class="text-sm text-red-700 dark:text-red-300">
          <span class="material-icons text-sm align-middle mr-1">warning</span>
          {{ $t('frontDesk.checkOutModal.warningMessage') }}
        </p>
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
        :disabled="loading || !canCheckout"
        @click="submit"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span v-else class="material-icons text-sm">logout</span>
        {{ $t('frontDesk.checkOutModal.doCheckOut') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import stayService, { PAYMENT_METHODS } from '@/services/pms/stayService'

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

const emit = defineEmits(['update:modelValue', 'completed'])

const toast = useToast()
const loading = ref(false)
const balanceOption = ref(null) // 'settle' or 'withBalance'
const paymentMethod = ref('cash')
const balanceReason = ref(null)
const balanceReasonNote = ref('')

const paymentMethods = PAYMENT_METHODS

// Reasons for checkout with outstanding balance
const balanceReasons = computed(() => [
  { value: 'company_invoice', label: t('frontDesk.checkOutModal.reasons.companyInvoice') },
  { value: 'agency_payment', label: t('frontDesk.checkOutModal.reasons.agencyPayment') },
  { value: 'credit_arrangement', label: t('frontDesk.checkOutModal.reasons.creditArrangement') },
  { value: 'dispute', label: t('frontDesk.checkOutModal.reasons.dispute') },
  { value: 'other', label: t('frontDesk.checkOutModal.reasons.other') }
])

// Check if checkout is allowed
const canCheckout = computed(() => {
  // No balance - can checkout
  if (!props.stay?.balance || props.stay.balance <= 0) {
    return true
  }

  // Has balance - need to select an option
  if (!balanceOption.value) {
    return false
  }

  // Settle balance option - always allowed
  if (balanceOption.value === 'settle') {
    return true
  }

  // Checkout with balance - need a reason
  if (balanceOption.value === 'withBalance') {
    if (!balanceReason.value) {
      return false
    }
    // If 'other' selected, need to provide note
    if (balanceReason.value === 'other' && !balanceReasonNote.value.trim()) {
      return false
    }
    return true
  }

  return false
})

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const extrasTotal = computed(() => {
  if (!props.stay?.extras) return 0
  return props.stay.extras.reduce((sum, e) => sum + e.amount * e.quantity, 0)
})

const submit = async () => {
  loading.value = true
  try {
    const checkoutData = {
      settleBalance: balanceOption.value === 'settle',
      paymentMethod: paymentMethod.value
    }

    // If checking out with balance, include reason
    if (balanceOption.value === 'withBalance') {
      checkoutData.balanceReason = balanceReason.value
      if (balanceReason.value === 'other') {
        checkoutData.balanceReasonNote = balanceReasonNote.value
      }
    }

    await stayService.checkOut(props.hotelId, props.stay._id, checkoutData)

    toast.success(t('frontDesk.checkOutModal.success'))
    emit('completed')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || t('frontDesk.checkOutModal.error'))
  } finally {
    loading.value = false
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

const formatCurrency = amount => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount || 0)
}

const close = () => {
  show.value = false
  balanceOption.value = null
  paymentMethod.value = 'cash'
  balanceReason.value = null
  balanceReasonNote.value = ''
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      balanceOption.value = null
      paymentMethod.value = 'cash'
      balanceReason.value = null
      balanceReasonNote.value = ''
    }
  }
)
</script>
