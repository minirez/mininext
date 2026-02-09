<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 transition-opacity"></div>

        <!-- Modal Container -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all"
            :class="sizeClasses"
            @click.stop
          >
            <!-- Loading Overlay -->
            <div
              v-if="loading"
              class="absolute inset-0 bg-white/80 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center z-10"
            >
              <div class="flex flex-col items-center gap-3">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <span class="text-sm text-gray-500 dark:text-slate-400">{{
                  t('common.loading')
                }}</span>
              </div>
            </div>

            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-4">
                  <!-- Guest Avatar -->
                  <div
                    class="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                    :class="
                      stay?.isVip
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    "
                  >
                    {{ mainGuest?.firstName?.[0] || '?' }}{{ mainGuest?.lastName?.[0] || '' }}
                  </div>

                  <div>
                    <div class="flex items-center gap-2">
                      <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                        {{ mainGuest?.firstName }} {{ mainGuest?.lastName }}
                      </h2>
                      <span
                        v-if="stay?.isVip"
                        class="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full flex items-center gap-1"
                      >
                        <span class="material-icons text-xs">star</span>
                        VIP{{ stay.vipLevel ? ` ${stay.vipLevel}` : '' }}
                      </span>
                      <span
                        class="px-2 py-0.5 rounded-full text-xs font-medium"
                        :class="`bg-${stayStatusInfo.color}-100 dark:bg-${stayStatusInfo.color}-900/30 text-${stayStatusInfo.color}-700 dark:text-${stayStatusInfo.color}-400`"
                      >
                        {{ stayStatusInfo.label }}
                      </span>
                    </div>
                    <div
                      class="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-slate-400"
                    >
                      <span class="flex items-center gap-1">
                        <span class="material-icons text-sm">confirmation_number</span>
                        {{ stay?.stayNumber }}
                      </span>
                      <span class="flex items-center gap-1">
                        <span class="material-icons text-sm">meeting_room</span>
                        {{ stay?.room?.roomNumber || '-' }}
                        <span v-if="stay?.roomType?.code" class="text-gray-400"
                          >({{ stay.roomType.code }})</span
                        >
                      </span>
                      <span class="flex items-center gap-1">
                        <span class="material-icons text-sm">nights_stay</span>
                        {{ nights }} {{ t('stayCard.nightSuffix') }}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  @click="handleClose"
                >
                  <span class="material-icons">close</span>
                </button>
              </div>
            </div>

            <!-- Quick Info Bar -->
            <div
              class="px-6 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700"
            >
              <div class="grid grid-cols-4 gap-4">
                <div class="text-center">
                  <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    {{ t('stayCard.total') }}
                  </p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ formatCurrency(totalAmount) }}
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    {{ t('stayCard.paid') }}
                  </p>
                  <p class="text-lg font-bold text-green-600 dark:text-green-400">
                    {{ formatCurrency(paidAmount) }}
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    {{ t('stayCard.balance') }}
                  </p>
                  <p
                    class="text-lg font-bold"
                    :class="
                      balance > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-900 dark:text-white'
                    "
                  >
                    {{ formatCurrency(balance) }}
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    {{ t('stayCard.paymentStatus') }}
                  </p>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    :class="`bg-${paymentStatusInfo.color}-100 dark:bg-${paymentStatusInfo.color}-900/30 text-${paymentStatusInfo.color}-700 dark:text-${paymentStatusInfo.color}-400`"
                  >
                    <span class="material-icons text-xs">{{ paymentStatusInfo.icon }}</span>
                    {{ getPaymentStatusLabel(paymentStatusInfo) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="border-b border-gray-200 dark:border-slate-700">
              <nav class="flex px-6 -mb-px">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  class="px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2"
                  :class="
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  "
                  @click="activeTab = tab.id"
                >
                  <span class="material-icons text-lg">{{ tab.icon }}</span>
                  {{ tab.label }}
                  <span
                    v-if="tab.badge"
                    class="px-1.5 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-slate-600"
                  >
                    {{ tab.badge }}
                  </span>
                </button>
              </nav>
            </div>

            <!-- Tab Content -->
            <div class="p-6 max-h-[400px] overflow-y-auto">
              <!-- Overview Tab -->
              <OverviewTab v-if="activeTab === 'overview'" :stay="stay" />

              <!-- Charges Tab -->
              <ChargesTab
                v-else-if="activeTab === 'charges'"
                :stay="stay"
                :saving="saving"
                @add-charge="handleAddCharge"
              />

              <!-- Payments Tab -->
              <PaymentsTab
                v-else-if="activeTab === 'payments'"
                :stay="stay"
                :saving="saving"
                :available-currencies="availableCurrencies"
                :exchange-rates="exchangeRates"
                @add-payment="handleAddPayment"
              />

              <!-- Notes Tab -->
              <NotesTab
                v-else-if="activeTab === 'notes'"
                :stay="stay"
                :saving="saving"
                @update-notes="handleUpdateNotes"
              />

              <!-- Guests Tab -->
              <GuestsTab
                v-else-if="activeTab === 'guests'"
                :stay="stay"
                :saving="saving"
                @add-guest="handleAddGuest"
                @update-guest="handleUpdateGuest"
                @remove-guest="handleRemoveGuest"
                @set-main-guest="handleSetMainGuest"
              />
            </div>

            <!-- Quick Payment Panel -->
            <div
              v-if="stay?.status === 'checked_in'"
              class="border-t border-gray-200 dark:border-slate-700"
            >
              <!-- Toggle Button -->
              <button
                class="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                @click="quickPaymentOpen = !quickPaymentOpen"
              >
                <span class="flex items-center gap-2">
                  <span class="material-icons text-indigo-600">payments</span>
                  {{ t('stayCard.quickPayment') }}
                  <span v-if="balance > 0" class="text-red-600 dark:text-red-400">
                    ({{ t('stayCard.balance') }}: {{ formatCurrency(balance) }})
                  </span>
                </span>
                <span
                  class="material-icons transition-transform"
                  :class="{ 'rotate-180': quickPaymentOpen }"
                >
                  expand_more
                </span>
              </button>

              <!-- Payment Form -->
              <Transition name="slide">
                <div v-if="quickPaymentOpen" class="px-6 pb-4 space-y-4">
                  <!-- Quick Amount Buttons -->
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-if="balance > 0"
                      class="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                      @click="quickPaymentAmount = balance"
                    >
                      {{ t('stayCard.payments.payBalance') }} {{ formatCurrency(balance) }}
                    </button>
                    <button
                      v-for="amount in [100, 500, 1000, 2000]"
                      :key="amount"
                      class="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                      @click="quickPaymentAmount = amount"
                    >
                      {{ formatCurrency(amount) }}
                    </button>
                  </div>

                  <div class="grid grid-cols-4 gap-4">
                    <!-- Amount -->
                    <div>
                      <label
                        class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1"
                        >{{ t('common.amount') }}</label
                      >
                      <input
                        v-model.number="quickPaymentAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                      />
                    </div>

                    <!-- Currency -->
                    <div>
                      <label
                        class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1"
                        >{{ t('currency.currency') }}</label
                      >
                      <select
                        v-model="quickPaymentCurrency"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option v-for="curr in availableCurrencies" :key="curr" :value="curr">
                          {{ getCurrencySymbol(curr) }} {{ curr }}
                        </option>
                      </select>
                    </div>

                    <!-- Payment Method -->
                    <div>
                      <label
                        class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1"
                        >{{ t('stayCard.payments.method') }}</label
                      >
                      <select
                        v-model="quickPaymentMethod"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option
                          v-for="method in paymentMethodsList"
                          :key="method.value"
                          :value="method.value"
                        >
                          {{ method.label }}
                        </option>
                      </select>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex items-end">
                      <button
                        :disabled="!quickPaymentAmount || quickPaymentAmount <= 0 || saving"
                        class="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        @click="handleQuickPayment"
                      >
                        <span v-if="saving" class="animate-spin material-icons text-sm">sync</span>
                        <span class="material-icons text-sm" v-else>credit_card</span>
                        {{ t('stayCard.payments.record') }}
                      </button>
                    </div>
                  </div>

                  <!-- Currency Conversion Info -->
                  <div
                    v-if="showQuickConversionInfo"
                    class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <div class="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                      <span class="material-icons text-base">currency_exchange</span>
                      <span>
                        {{ formatCurrency(quickPaymentAmount, quickPaymentCurrency) }} ≈
                        {{ formatCurrency(quickConvertedAmount, stay?.currency || 'TRY') }}
                      </span>
                      <span class="text-xs text-blue-500 dark:text-blue-400">
                        ({{ t('currency.rate') }}: 1 {{ quickPaymentCurrency }} =
                        {{ exchangeRates[quickPaymentCurrency] || 1 }} TRY)
                      </span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Actions Bar -->
            <div
              class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 rounded-b-2xl"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <button
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                    @click="activeTab = 'charges'"
                  >
                    <span class="material-icons text-sm">add</span>
                    {{ t('stayCard.addCharge') }}
                  </button>
                  <button
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                    @click="$emit('change-room', stay)"
                  >
                    <span class="material-icons text-sm">swap_horiz</span>
                    {{ t('stayCard.changeRoom') }}
                  </button>
                  <button
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                    @click="$emit('extend-stay', stay)"
                  >
                    <span class="material-icons text-sm">event</span>
                    {{ t('stayCard.extend') }}
                  </button>
                </div>

                <button
                  v-if="stay?.status === 'checked_in'"
                  class="px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors flex items-center gap-2"
                  @click="$emit('check-out', stay)"
                >
                  <span class="material-icons text-sm">logout</span>
                  {{ t('stayCard.checkout') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStayCard, PAYMENT_METHODS } from './composables/useStayCard'
import OverviewTab from './tabs/OverviewTab.vue'
import ChargesTab from './tabs/ChargesTab.vue'
import PaymentsTab from './tabs/PaymentsTab.vue'
import NotesTab from './tabs/NotesTab.vue'
import GuestsTab from './tabs/GuestsTab.vue'

const { t, locale } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  stayId: {
    type: String,
    required: true
  },
  hotelId: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'lg',
    validator: v => ['md', 'lg', 'xl'].includes(v)
  }
})

const emit = defineEmits([
  'update:modelValue',
  'close',
  'updated',
  'check-out',
  'change-room',
  'extend-stay'
])

// Use composable
const stayIdRef = toRef(props, 'stayId')
const hotelIdRef = toRef(props, 'hotelId')

const {
  stay,
  loading,
  saving,
  activeTab,
  quickPaymentOpen,
  balance,
  totalAmount,
  paidAmount,
  mainGuest,
  nights,
  paymentStatusInfo,
  stayStatusInfo,
  availableCurrencies,
  exchangeRates,
  addPayment,
  addCharge,
  updateNotes,
  addGuest,
  updateGuest,
  removeGuest,
  setMainGuest,
  formatCurrency
} = useStayCard(stayIdRef, hotelIdRef)

// Quick payment form
const quickPaymentAmount = ref(0)
const quickPaymentCurrency = ref('TRY')
const quickPaymentMethod = ref('cash')
const previousCurrency = ref('TRY')

// Watch currency change and auto-convert amount
watch(quickPaymentCurrency, (newCurrency, oldCurrency) => {
  if (quickPaymentAmount.value > 0 && oldCurrency && newCurrency !== oldCurrency) {
    const oldRate = exchangeRates.value[oldCurrency] || 1
    const newRate = exchangeRates.value[newCurrency] || 1
    // Convert: first to TRY, then to new currency
    const amountInTRY = quickPaymentAmount.value * oldRate
    quickPaymentAmount.value = Math.round((amountInTRY / newRate) * 100) / 100
  }
})

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
const showQuickConversionInfo = computed(() => {
  return (
    quickPaymentAmount.value > 0 && quickPaymentCurrency.value !== (stay.value?.currency || 'TRY')
  )
})

// Calculate converted amount (with NaN/Infinity protection)
const quickConvertedAmount = computed(() => {
  if (!quickPaymentAmount.value || quickPaymentAmount.value <= 0) return 0

  const rate = exchangeRates.value[quickPaymentCurrency.value] || 1
  const stayRate = exchangeRates.value[stay.value?.currency] || 1

  // Protect against division by zero or invalid rates
  if (!stayRate || stayRate <= 0) return quickPaymentAmount.value * rate

  const result = (quickPaymentAmount.value * rate) / stayRate

  // Protect against NaN or Infinity
  if (!Number.isFinite(result)) return 0

  return result
})

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }
  return sizes[props.size] || sizes.lg
})

// Tabs configuration
const tabs = computed(() => [
  { id: 'overview', label: t('stayCard.tabs.overview'), icon: 'dashboard' },
  {
    id: 'guests',
    label: t('stayCard.tabs.guests'),
    icon: 'group',
    badge: stay.value?.guests?.length
  },
  {
    id: 'charges',
    label: t('stayCard.tabs.charges'),
    icon: 'receipt_long',
    badge: stay.value?.extras?.length
  },
  {
    id: 'payments',
    label: t('stayCard.tabs.payments'),
    icon: 'payments',
    badge: stay.value?.payments?.length
  },
  { id: 'notes', label: t('stayCard.tabs.notes'), icon: 'notes' }
])

// Payment methods with i18n labels
const paymentMethodsList = computed(() =>
  PAYMENT_METHODS.map(method => ({
    ...method,
    label: t(`stayCard.payments.methods.${method.value}`)
  }))
)

// Helper function for payment status label
const getPaymentStatusLabel = statusInfo => {
  const statusKey = stay.value?.paymentStatus || 'pending'
  const keyMap = {
    paid: 'paidStatus',
    partial: 'partialStatus',
    pending: 'unpaidStatus',
    refunded: 'refundedStatus'
  }
  return t(`stayCard.${keyMap[statusKey] || 'unpaidStatus'}`)
}

// Handlers
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleQuickPayment = async () => {
  if (quickPaymentAmount.value > 0) {
    const success = await addPayment(
      quickPaymentAmount.value,
      quickPaymentMethod.value,
      quickPaymentCurrency.value,
      '',
      '',
      exchangeRates.value[quickPaymentCurrency.value] || 1
    )
    if (success) {
      quickPaymentAmount.value = 0
      quickPaymentCurrency.value = stay.value?.currency || 'TRY'
      emit('updated', stay.value)
    }
  }
}

const handleAddCharge = async (category, amount, description) => {
  const success = await addCharge(category, amount, description)
  if (success) {
    emit('updated', stay.value)
  }
}

const handleAddPayment = async (amount, method, currency, reference, notes) => {
  const success = await addPayment(
    amount,
    method,
    currency || 'TRY',
    reference,
    notes,
    exchangeRates.value[currency] || 1
  )
  if (success) {
    emit('updated', stay.value)
  }
}

const handleUpdateNotes = async (specialRequests, internalNotes) => {
  const success = await updateNotes(specialRequests, internalNotes)
  if (success) {
    emit('updated', stay.value)
  }
}

const handleAddGuest = async guestData => {
  const success = await addGuest(guestData)
  if (success) {
    emit('updated', stay.value)
  }
}

const handleUpdateGuest = async (guestIndex, guestData) => {
  const success = await updateGuest(guestIndex, guestData)
  if (success) {
    emit('updated', stay.value)
  }
}

const handleRemoveGuest = async guestIndex => {
  const success = await removeGuest(guestIndex)
  if (success) {
    emit('updated', stay.value)
  }
}

const handleSetMainGuest = async guestIndex => {
  const success = await setMainGuest(guestIndex)
  if (success) {
    emit('updated', stay.value)
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  opacity: 0;
  transform: scale(0.95);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 200px;
}
</style>
