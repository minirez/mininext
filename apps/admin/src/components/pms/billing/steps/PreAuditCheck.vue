<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"
      >
        <span class="material-icons text-2xl text-indigo-600 dark:text-indigo-400">checklist</span>
      </div>
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ $t('billing.nightAudit.preCheck.title') }}
        </h2>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('billing.nightAudit.preCheck.description') }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="h-20 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
    </div>

    <!-- Check Items -->
    <div v-else class="space-y-4">
      <!-- Arrivals Check -->
      <div
        class="p-4 rounded-xl border transition-all duration-300"
        :class="getCheckClass(checks.arrivals)"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
            :class="getIconClass(checks.arrivals)"
          >
            <span
              class="material-icons text-lg"
              :class="{ 'animate-spin': checks.arrivals?.status === 'loading' }"
            >
              {{ getCheckIcon(checks.arrivals) }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ $t('billing.nightAudit.preCheck.todayArrivals') }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
              <template v-if="checks.arrivals?.data">
                {{ checks.arrivals.data.total }}
                {{ $t('billing.nightAudit.preCheck.reservations') }} -
                <span class="text-green-600 dark:text-green-400"
                  >{{ checks.arrivals.data.checkedIn }}
                  {{ $t('billing.nightAudit.preCheck.checkedIn') }}</span
                >
                <span
                  v-if="checks.arrivals.data.pending > 0"
                  class="text-amber-600 dark:text-amber-400"
                >
                  , {{ checks.arrivals.data.pending }}
                  {{ $t('billing.nightAudit.preCheck.pending') }}
                </span>
              </template>
              <template v-else>{{ $t('billing.nightAudit.preCheck.checking') }}...</template>
            </p>
          </div>
          <div v-if="checks.arrivals?.data?.pending > 0" class="flex-shrink-0">
            <span
              class="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full"
            >
              {{ checks.arrivals.data.pending }} {{ $t('billing.nightAudit.preCheck.pending') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Departures Check -->
      <div
        class="p-4 rounded-xl border transition-all duration-300"
        :class="getCheckClass(checks.departures)"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
            :class="getIconClass(checks.departures)"
          >
            <span
              class="material-icons text-lg"
              :class="{ 'animate-spin': checks.departures?.status === 'loading' }"
            >
              {{ getCheckIcon(checks.departures) }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ $t('billing.nightAudit.preCheck.todayDepartures') }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
              <template v-if="checks.departures?.data">
                {{ checks.departures.data.total }}
                {{ $t('billing.nightAudit.preCheck.departures') }} -
                <span class="text-green-600 dark:text-green-400"
                  >{{ checks.departures.data.checkedOut }}
                  {{ $t('billing.nightAudit.preCheck.checkedOut') }}</span
                >
                <span
                  v-if="checks.departures.data.pending > 0"
                  class="text-amber-600 dark:text-amber-400"
                >
                  , {{ checks.departures.data.pending }}
                  {{ $t('billing.nightAudit.preCheck.pending') }}
                </span>
              </template>
              <template v-else>{{ $t('billing.nightAudit.preCheck.checking') }}...</template>
            </p>
          </div>
          <div v-if="checks.departures?.data?.pending > 0" class="flex-shrink-0">
            <span
              class="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full"
            >
              {{ checks.departures.data.pending }} {{ $t('billing.nightAudit.preCheck.pending') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Outstanding Balances Check -->
      <div
        class="p-4 rounded-xl border transition-all duration-300"
        :class="getCheckClass(checks.balances)"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
            :class="getIconClass(checks.balances)"
          >
            <span
              class="material-icons text-lg"
              :class="{ 'animate-spin': checks.balances?.status === 'loading' }"
            >
              {{ getCheckIcon(checks.balances) }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ $t('billing.nightAudit.preCheck.outstandingBalances') }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
              <template v-if="checks.balances?.data">
                <span
                  v-if="checks.balances.data.count === 0"
                  class="text-green-600 dark:text-green-400"
                >
                  {{ $t('billing.nightAudit.preCheck.allBalancesPaid') }}
                </span>
                <span v-else class="text-amber-600 dark:text-amber-400">
                  {{ checks.balances.data.count }}
                  {{ $t('billing.nightAudit.preCheck.roomsWithBalance') }}
                  {{ formatCurrency(checks.balances.data.total) }}
                </span>
              </template>
              <template v-else>{{ $t('billing.nightAudit.preCheck.checking') }}...</template>
            </p>
            <!-- Balance details -->
            <div v-if="checks.balances?.data?.items?.length > 0" class="mt-3 space-y-1">
              <div
                v-for="item in checks.balances.data.items.slice(0, 3)"
                :key="item.roomNumber"
                class="flex items-center justify-between text-sm py-1 px-2 bg-amber-50 dark:bg-amber-900/20 rounded"
              >
                <span class="text-gray-700 dark:text-gray-300"
                  >{{ $t('billing.nightAudit.preCheck.room') }} {{ item.roomNumber }} -
                  {{ item.guestName }}</span
                >
                <span class="font-medium text-amber-700 dark:text-amber-400">{{
                  formatCurrency(item.balance)
                }}</span>
              </div>
              <button
                v-if="checks.balances.data.items.length > 3"
                class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                @click="showAllBalances = true"
              >
                +{{ checks.balances.data.items.length - 3 }} {{ $t('common.more') }}
              </button>
            </div>
          </div>
          <div v-if="checks.balances?.data?.count > 0" class="flex-shrink-0">
            <span
              class="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full"
            >
              {{ formatCurrency(checks.balances.data.total) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Housekeeping Check -->
      <div
        class="p-4 rounded-xl border transition-all duration-300"
        :class="getCheckClass(checks.housekeeping)"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
            :class="getIconClass(checks.housekeeping)"
          >
            <span
              class="material-icons text-lg"
              :class="{ 'animate-spin': checks.housekeeping?.status === 'loading' }"
            >
              {{ getCheckIcon(checks.housekeeping) }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ $t('billing.nightAudit.preCheck.housekeepingStatus') }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
              <template v-if="checks.housekeeping?.data">
                <span
                  v-if="checks.housekeeping.data.dirty === 0"
                  class="text-green-600 dark:text-green-400"
                >
                  {{ $t('billing.nightAudit.preCheck.allRoomsClean') }}
                </span>
                <span v-else class="text-amber-600 dark:text-amber-400">
                  {{ checks.housekeeping.data.dirty }}
                  {{ $t('billing.nightAudit.preCheck.roomsNeedCleaning') }}
                </span>
              </template>
              <template v-else>{{ $t('billing.nightAudit.preCheck.checking') }}...</template>
            </p>
          </div>
          <div v-if="checks.housekeeping?.data?.dirty > 0" class="flex-shrink-0">
            <span
              class="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full"
            >
              {{ checks.housekeeping.data.dirty }} {{ $t('billing.nightAudit.preCheck.dirty') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Open Shifts Check -->
      <div
        class="p-4 rounded-xl border transition-all duration-300"
        :class="getCheckClass(checks.shifts)"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
            :class="getIconClass(checks.shifts)"
          >
            <span
              class="material-icons text-lg"
              :class="{ 'animate-spin': checks.shifts?.status === 'loading' }"
            >
              {{ getCheckIcon(checks.shifts) }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ $t('billing.nightAudit.preCheck.openCashiers') }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
              <template v-if="checks.shifts?.data">
                <span
                  v-if="checks.shifts.data.count === 0"
                  class="text-green-600 dark:text-green-400"
                >
                  {{ $t('billing.nightAudit.preCheck.allCashiersClosed') }}
                </span>
                <span v-else>
                  {{ checks.shifts.data.count }} {{ $t('billing.nightAudit.preCheck.openCashier') }}
                  <span v-if="checks.shifts.data.items?.length > 0" class="text-gray-400">
                    ({{ checks.shifts.data.items.map(s => s.cashierName).join(', ') }})
                  </span>
                </span>
              </template>
              <template v-else>{{ $t('billing.nightAudit.preCheck.checking') }}...</template>
            </p>
          </div>
          <div v-if="checks.shifts?.data?.count > 0" class="flex-shrink-0">
            <span
              class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full"
            >
              {{ checks.shifts.data.count }} {{ $t('billing.nightAudit.preCheck.open') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary & Actions -->
    <div class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
      <div class="flex items-center justify-between">
        <div>
          <p
            v-if="warningCount > 0"
            class="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1"
          >
            <span class="material-icons text-lg">warning</span>
            {{ warningCount }} {{ $t('billing.nightAudit.preCheck.warningsCanContinue') }}
          </p>
          <p
            v-else-if="errorCount > 0"
            class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          >
            <span class="material-icons text-lg">error</span>
            {{ errorCount }} {{ $t('billing.nightAudit.preCheck.errorsMustResolve') }}
          </p>
          <p v-else class="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <span class="material-icons text-lg">check_circle</span>
            {{ $t('billing.nightAudit.preCheck.allChecksSuccessful') }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            :disabled="loading"
            class="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            @click="runChecks"
          >
            <span class="material-icons text-lg" :class="{ 'animate-spin': loading }">refresh</span>
            {{ $t('common.refresh') }}
          </button>

          <button
            :disabled="loading || errorCount > 0 || completing"
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import * as nightAuditService from '@/services/pms/nightAuditService'

const { t } = useI18n()

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
const showAllBalances = ref(false)

const checks = ref({
  arrivals: null,
  departures: null,
  balances: null,
  housekeeping: null,
  shifts: null
})

// Computed
const warningCount = computed(() => {
  return Object.values(checks.value).filter(c => c?.status === 'warning').length
})

const errorCount = computed(() => {
  return Object.values(checks.value).filter(c => c?.status === 'error').length
})

// Methods
const formatCurrency = amount => {
  return nightAuditService.formatCurrency(amount)
}

const getCheckClass = check => {
  if (!check || check.status === 'loading') {
    return 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700'
  }
  switch (check.status) {
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    case 'error':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    default:
      return 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700'
  }
}

const getIconClass = check => {
  if (!check || check.status === 'loading') {
    return 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400'
  }
  switch (check.status) {
    case 'success':
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
    case 'warning':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
    case 'error':
      return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    default:
      return 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400'
  }
}

const getCheckIcon = check => {
  if (!check || check.status === 'loading') {
    return 'refresh'
  }
  switch (check.status) {
    case 'success':
      return 'check_circle'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return 'pending'
  }
}

const runChecks = async () => {
  if (!props.hotelId) return

  loading.value = true

  // Initialize all checks as loading
  checks.value = {
    arrivals: { status: 'loading' },
    departures: { status: 'loading' },
    balances: { status: 'loading' },
    housekeeping: { status: 'loading' },
    shifts: { status: 'loading' }
  }

  try {
    const response = await nightAuditService.getPreAuditChecks(props.hotelId)
    const data = response.data
    const summary = data.summary || {}
    const issues = data.issues || []

    // Process arrivals - map from backend summary structure
    checks.value.arrivals = {
      status: summary.pendingArrivals > 0 ? 'warning' : 'success',
      data: {
        total: summary.totalArrivals || 0,
        checkedIn: summary.checkedInArrivals || 0,
        pending: summary.pendingArrivals || 0
      }
    }

    // Process departures - map from backend summary structure
    checks.value.departures = {
      status: summary.pendingDepartures > 0 ? 'warning' : 'success',
      data: {
        total: summary.totalDepartures || 0,
        checkedOut: summary.checkedOutDepartures || 0,
        pending: summary.pendingDepartures || 0
      }
    }

    // Process balances - get details from issues if available
    const balanceIssue = issues.find(i => i.type === 'balances')
    checks.value.balances = {
      status: summary.outstandingBalances > 0 ? 'warning' : 'success',
      data: {
        count: summary.outstandingBalances || 0,
        total: summary.outstandingAmount || 0,
        items: balanceIssue?.details?.rooms || []
      }
    }

    // Process housekeeping
    checks.value.housekeeping = {
      status: summary.dirtyRooms > 0 ? 'warning' : 'success',
      data: {
        dirty: summary.dirtyRooms || 0
      }
    }

    // Process shifts - get details from issues if available
    const shiftIssue = issues.find(i => i.type === 'shifts')
    checks.value.shifts = {
      status: summary.openShifts > 0 ? 'info' : 'success',
      data: {
        count: summary.openShifts || 0,
        items: shiftIssue?.details?.shifts || []
      }
    }
  } catch (error) {
    console.error('Failed to run pre-audit checks:', error)
    toast.error(t('billing.nightAudit.preCheck.messages.checksFailed'))

    // Set all as error
    Object.keys(checks.value).forEach(key => {
      checks.value[key] = { status: 'error' }
    })
  } finally {
    loading.value = false
  }
}

const handleContinue = async () => {
  if (errorCount.value > 0) {
    toast.error(t('billing.nightAudit.preCheck.messages.resolveErrors'))
    return
  }

  try {
    completing.value = true

    // Collect issues for the audit record
    // Issue types must match model enum: arrivals, departures, balances, housekeeping, shifts, rates
    const issues = []

    if (checks.value.arrivals?.data?.pending > 0) {
      issues.push({
        type: 'arrivals',
        severity: 'warning',
        message: `${checks.value.arrivals.data.pending} ${t('billing.nightAudit.preCheck.pendingArrivals')}`,
        details: { count: checks.value.arrivals.data.pending }
      })
    }

    if (checks.value.departures?.data?.pending > 0) {
      issues.push({
        type: 'departures',
        severity: 'warning',
        message: `${checks.value.departures.data.pending} ${t('billing.nightAudit.preCheck.pendingDepartures')}`,
        details: { count: checks.value.departures.data.pending }
      })
    }

    if (checks.value.balances?.data?.count > 0) {
      issues.push({
        type: 'balances',
        severity: 'warning',
        message: `${checks.value.balances.data.count} ${t('billing.nightAudit.preCheck.roomsUnpaidBalance')}`,
        details: {
          count: checks.value.balances.data.count,
          total: checks.value.balances.data.total
        }
      })
    }

    if (checks.value.housekeeping?.data?.dirty > 0) {
      issues.push({
        type: 'housekeeping',
        severity: 'warning',
        message: `${checks.value.housekeeping.data.dirty} ${t('billing.nightAudit.preCheck.roomsNeedCleaning')}`,
        details: { count: checks.value.housekeeping.data.dirty }
      })
    }

    // Complete the step
    await nightAuditService.completePreAuditCheck(props.hotelId, { issues })

    emit('complete')
  } catch (error) {
    console.error('Failed to complete pre-audit check:', error)
    toast.error(error.response?.data?.message || t('billing.nightAudit.messages.stepFailed'))
  } finally {
    completing.value = false
  }
}

// Lifecycle
onMounted(() => {
  runChecks()
})
</script>
