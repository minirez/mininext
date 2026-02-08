<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
      >
        <span class="material-icons text-2xl text-purple-600 dark:text-purple-400"
          >point_of_sale</span
        >
      </div>
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ $t('billing.nightAudit.cashier.title') }}
        </h2>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('billing.nightAudit.cashier.description') }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 2" :key="i" class="animate-pulse">
        <div class="h-64 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
    </div>

    <!-- No Open Shifts -->
    <div
      v-else-if="shifts.length === 0"
      class="text-center py-12 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
      >
        <span class="material-icons text-3xl text-green-600 dark:text-green-400">check_circle</span>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
        {{ $t('billing.nightAudit.cashier.allClosed') }}
      </h3>
      <p class="text-gray-500 dark:text-slate-400">
        {{ $t('billing.nightAudit.cashier.noOpenCashiers') }}
      </p>
    </div>

    <!-- Shifts List -->
    <div v-else class="space-y-6">
      <div
        v-for="shift in shifts"
        :key="shift._id"
        class="bg-white dark:bg-slate-800 rounded-xl border transition-all duration-300"
        :class="
          shift.closed
            ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10'
            : 'border-gray-200 dark:border-slate-700'
        "
      >
        <!-- Shift Header -->
        <div class="p-4 border-b border-gray-100 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
              >
                <span class="material-icons text-purple-600 dark:text-purple-400"
                  >account_circle</span
                >
              </div>
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">{{ shift.cashierName }}</h3>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ shift.shiftNumber }} - {{ $t('billing.nightAudit.cashier.opened') }}:
                  {{ formatTime(shift.openedAt) }}
                </p>
              </div>
            </div>
            <span
              v-if="shift.closed"
              class="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-medium rounded-full"
            >
              {{ $t('billing.nightAudit.cashier.closed') }}
            </span>
            <span
              v-else
              class="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-sm font-medium rounded-full"
            >
              {{ $t('billing.nightAudit.cashier.open') }}
            </span>
          </div>
        </div>

        <!-- Shift Summary -->
        <div class="p-4">
          <div class="space-y-3">
            <!-- Opening Balance -->
            <div
              class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700"
            >
              <span class="text-gray-600 dark:text-gray-400">{{
                $t('billing.nightAudit.cashier.openingBalance')
              }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                formatCurrency(shift.openingBalance)
              }}</span>
            </div>

            <!-- Cash In -->
            <div
              class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700"
            >
              <span class="text-gray-600 dark:text-gray-400"
                >+ {{ $t('billing.nightAudit.cashier.cashIn') }}</span
              >
              <span class="font-medium text-green-600 dark:text-green-400">{{
                formatCurrency(shift.cashIn)
              }}</span>
            </div>

            <!-- Cash Out -->
            <div
              class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700"
            >
              <span class="text-gray-600 dark:text-gray-400"
                >- {{ $t('billing.nightAudit.cashier.cashOut') }}</span
              >
              <span class="font-medium text-red-600 dark:text-red-400"
                >-{{ formatCurrency(shift.cashOut) }}</span
              >
            </div>

            <!-- Expected Cash -->
            <div
              class="flex items-center justify-between py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3"
            >
              <span class="font-medium text-gray-900 dark:text-white">{{
                $t('billing.nightAudit.cashier.expectedCash')
              }}</span>
              <span class="font-bold text-lg text-gray-900 dark:text-white">{{
                formatCurrency(shift.expectedCash)
              }}</span>
            </div>

            <!-- Card Payments -->
            <div class="flex items-center justify-between py-2 text-sm">
              <span class="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                <span class="material-icons text-lg">credit_card</span>
                {{ $t('billing.nightAudit.cashier.cardPayments') }}
              </span>
              <span class="text-gray-600 dark:text-gray-400">
                {{ formatCurrency(shift.cardPayments) }} ({{ shift.cardTransactions }}
                {{ $t('billing.nightAudit.cashier.transactions') }})
              </span>
            </div>
          </div>

          <!-- Close Shift Form -->
          <div
            v-if="!shift.closed"
            class="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700"
          >
            <div class="space-y-4">
              <!-- Actual Cash Input -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('billing.nightAudit.cashier.actualCash') }}
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">TRY</span>
                  <input
                    v-model.number="shiftInputs[shift._id].actualCash"
                    type="number"
                    step="0.01"
                    class="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    :placeholder="shift.expectedCash.toString()"
                  />
                </div>
              </div>

              <!-- Discrepancy Display -->
              <div
                v-if="getDiscrepancy(shift) !== 0"
                class="p-3 rounded-lg"
                :class="
                  getDiscrepancy(shift) > 0
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                "
              >
                <div class="flex items-center justify-between">
                  <span
                    class="font-medium"
                    :class="
                      getDiscrepancy(shift) > 0
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    "
                  >
                    {{
                      getDiscrepancy(shift) > 0
                        ? $t('billing.nightAudit.cashier.surplus')
                        : $t('billing.nightAudit.cashier.shortage')
                    }}
                  </span>
                  <span
                    class="font-bold"
                    :class="
                      getDiscrepancy(shift) > 0
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    "
                  >
                    {{ formatCurrency(Math.abs(getDiscrepancy(shift))) }}
                  </span>
                </div>
              </div>

              <!-- Note for discrepancy -->
              <div v-if="getDiscrepancy(shift) !== 0">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ $t('billing.nightAudit.cashier.discrepancyExplanation') }}
                </label>
                <textarea
                  v-model="shiftInputs[shift._id].note"
                  rows="2"
                  class="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  :placeholder="$t('billing.nightAudit.cashier.discrepancyPlaceholder')"
                ></textarea>
              </div>

              <!-- Close Button -->
              <button
                :disabled="
                  closingShift === shift._id ||
                  (getDiscrepancy(shift) !== 0 && !shiftInputs[shift._id].note)
                "
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors"
                @click="closeShift(shift)"
              >
                <span v-if="closingShift === shift._id" class="material-icons animate-spin"
                  >refresh</span
                >
                <span v-else class="material-icons">lock</span>
                {{
                  closingShift === shift._id
                    ? $t('billing.nightAudit.cashier.closing')
                    : $t('billing.nightAudit.cashier.closeCashier')
                }}
              </button>
            </div>
          </div>

          <!-- Closed Shift Summary -->
          <div v-else class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-green-700 dark:text-green-400">
                <span class="material-icons">check_circle</span>
                <span
                  >{{ $t('billing.nightAudit.cashier.closedAt') }}:
                  {{ formatTime(shift.closedAt) }}</span
                >
              </div>
              <span class="font-medium text-green-700 dark:text-green-400">
                {{ formatCurrency(shift.actualCash || shift.expectedCash) }}
              </span>
            </div>
            <div
              v-if="shift.discrepancy && shift.discrepancy !== 0"
              class="mt-2 text-sm text-gray-600 dark:text-gray-400"
            >
              {{ $t('billing.nightAudit.cashier.difference') }}:
              {{ formatCurrency(shift.discrepancy) }}
              <span v-if="shift.discrepancyNote">- {{ shift.discrepancyNote }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500 dark:text-slate-400">
          <template v-if="shifts.length > 0">
            {{ closedCount }} / {{ shifts.length }}
            {{ $t('billing.nightAudit.cashier.cashiersClosed') }}
          </template>
          <template v-else> {{ $t('billing.nightAudit.cashier.noCashiersToProcess') }} </template>
        </p>

        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            @click="emit('back')"
          >
            <span class="material-icons">arrow_back</span>
            {{ $t('common.back') }}
          </button>

          <button
            :disabled="loading || completing || (shifts.length > 0 && !allClosed)"
            class="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
            @click="handleContinue"
          >
            <span v-if="completing" class="material-icons animate-spin">refresh</span>
            {{ completing ? $t('common.saving') : $t('common.continue') }}
            <span v-if="!completing" class="material-icons">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import * as nightAuditService from '@/services/pms/nightAuditService'

const { t, locale } = useI18n()

const props = defineProps({
  audit: {
    type: Object,
    required: true
  },
  hotelId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['complete', 'back', 'refresh'])

const toast = useToast()

// State
const loading = ref(true)
const completing = ref(false)
const closingShift = ref(null)
const shifts = ref([])
const shiftInputs = reactive({})

// Computed
const closedCount = computed(() => {
  return shifts.value.filter(s => s.closed).length
})

const allClosed = computed(() => {
  return shifts.value.length === 0 || shifts.value.every(s => s.closed)
})

// Methods
const formatCurrency = amount => {
  return nightAuditService.formatCurrency(amount)
}

const formatTime = date => {
  if (!date) return ''
  const loc = locale.value === 'tr' ? 'tr-TR' : 'en-US'
  return new Date(date).toLocaleTimeString(loc, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getDiscrepancy = shift => {
  const input = shiftInputs[shift._id]
  if (
    !input ||
    input.actualCash === null ||
    input.actualCash === undefined ||
    input.actualCash === ''
  ) {
    return 0
  }
  return input.actualCash - shift.expectedCash
}

const fetchCashierData = async () => {
  if (!props.hotelId) return

  try {
    loading.value = true
    const response = await nightAuditService.getCashierData(props.hotelId)
    const rawShifts = response.data?.shifts || []

    // Map backend data to frontend format
    // Backend returns "shift" as ID, frontend expects "_id"
    shifts.value = rawShifts.map(s => ({
      _id: s.shift || s._id, // Backend uses "shift" for ID
      shiftNumber: s.shiftNumber,
      cashierName: s.cashierName,
      openedAt: s.openedAt,
      status: s.status,
      expectedCash: s.expectedCash || 0,
      openingBalance: s.openingBalance || 0,
      cashIn: s.expectedCash - s.openingBalance || 0, // Calculate from expected - opening
      cashOut: 0, // Not provided by backend
      cardPayments: s.cardTotal || 0,
      cardTransactions: s.transactionCount || 0,
      closed: s.status === 'closed',
      closedAt: s.closedAt,
      actualCash: s.actualCash,
      discrepancy: s.discrepancy,
      discrepancyNote: s.discrepancyNote
    }))

    // Initialize inputs for each shift
    shifts.value.forEach(shift => {
      if (!shiftInputs[shift._id]) {
        shiftInputs[shift._id] = {
          actualCash: shift.expectedCash,
          note: ''
        }
      }
    })
  } catch (error) {
    console.error('Failed to fetch cashier data:', error)
    toast.error(t('billing.nightAudit.cashier.messages.loadFailed'))
  } finally {
    loading.value = false
  }
}

const closeShift = async shift => {
  const input = shiftInputs[shift._id]
  const discrepancy = getDiscrepancy(shift)

  if (discrepancy !== 0 && !input.note) {
    toast.warning(t('billing.nightAudit.cashier.messages.noteRequired'))
    return
  }

  try {
    closingShift.value = shift._id

    await nightAuditService.closeCashierShifts(props.hotelId, [
      {
        shiftId: shift._id,
        actualCash: input.actualCash,
        discrepancy: discrepancy,
        note: input.note || null
      }
    ])

    // Update local state
    shift.closed = true
    shift.closedAt = new Date()
    shift.actualCash = input.actualCash
    shift.discrepancy = discrepancy
    shift.discrepancyNote = input.note

    toast.success(t('billing.nightAudit.cashier.messages.closed'))
  } catch (error) {
    console.error('Failed to close shift:', error)
    toast.error(
      error.response?.data?.message || t('billing.nightAudit.cashier.messages.closeFailed')
    )
  } finally {
    closingShift.value = null
  }
}

const handleContinue = async () => {
  if (shifts.value.length > 0 && !allClosed.value) {
    toast.warning(t('billing.nightAudit.cashier.messages.closeAll'))
    return
  }

  try {
    completing.value = true

    // Call the backend to complete the cashier step
    // Even if all shifts are already closed individually, we need to ensure
    // the audit step is marked complete on the backend
    const shiftsData = shifts.value.map(shift => ({
      shiftId: shift._id || shift.shift,
      actualCash: shift.actualCash || shiftInputs[shift._id]?.actualCash || shift.expectedCash,
      discrepancy: shift.discrepancy || 0,
      discrepancyNote: shift.discrepancyNote || shiftInputs[shift._id]?.note || null
    }))

    await nightAuditService.closeCashierShifts(props.hotelId, shiftsData)

    emit('complete')
  } catch (error) {
    console.error('Failed to complete cashier step:', error)
    toast.error(error.response?.data?.message || t('billing.nightAudit.messages.stepFailed'))
  } finally {
    completing.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchCashierData()
})
</script>
