<template>
  <div class="space-y-6">
    <!-- No Hotel Selected Warning -->
    <div
      v-if="!hotelId"
      class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center"
    >
      <span class="material-icons text-4xl text-amber-500 mb-2">domain_disabled</span>
      <p class="font-medium text-amber-800 dark:text-amber-200">{{ $t('pms.noHotelSelected') }}</p>
      <p class="text-sm text-amber-600 dark:text-amber-400 mt-1">
        {{ $t('pms.selectHotelDesc') }}
      </p>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="material-icons text-2xl text-indigo-600 dark:text-indigo-400"
            >nightlight</span
          >
          <span class="text-sm text-gray-500 dark:text-slate-400">
            {{ formatDate(auditDate) }} - {{ $t('nightAudit.dayEndOperations') }}
          </span>
        </div>

        <div class="flex items-center gap-3">
          <!-- Real-time connection indicator -->
          <div
            class="hidden sm:flex items-center gap-1.5 text-xs"
            :class="isConnected ? 'text-green-500' : 'text-gray-400'"
            :title="
              isConnected ? $t('nightAudit.liveConnection') : $t('nightAudit.waitingConnection')
            "
          >
            <span class="relative flex h-2 w-2">
              <span
                v-if="isConnected"
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2"
                :class="isConnected ? 'bg-green-500' : 'bg-gray-400'"
              ></span>
            </span>
            <span>{{ isConnected ? $t('nightAudit.live') : $t('nightAudit.connecting') }}</span>
          </div>

          <!-- Keyboard shortcuts hint -->
          <div class="hidden lg:flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
            <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded">Enter</kbd>
            <span>{{ $t('nightAudit.forward') }}</span>
            <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded ml-2">Esc</kbd>
            <span>{{ $t('nightAudit.back') }}</span>
          </div>

          <!-- History button -->
          <button
            class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            @click="showHistory = true"
          >
            <span class="material-icons text-lg">history</span>
            <span class="hidden sm:inline">{{ $t('nightAudit.history') }}</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <span class="material-icons text-4xl text-indigo-600 animate-spin">refresh</span>
          <p class="mt-4 text-gray-500 dark:text-slate-400">{{ $t('nightAudit.loading') }}</p>
        </div>
      </div>

      <!-- No Active Audit - Start Button -->
      <div
        v-else-if="!audit"
        class="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 md:p-12 text-center"
      >
        <div
          class="w-20 h-20 mx-auto mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"
        >
          <span class="material-icons text-4xl text-indigo-600 dark:text-indigo-400"
            >nightlight</span
          >
        </div>

        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {{ $t('nightAudit.startAuditTitle') }}
        </h2>
        <p class="text-gray-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          {{ $t('nightAudit.startAuditDescription') }}
        </p>

        <button
          :disabled="starting"
          class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-colors"
          @click="handleStartAudit"
        >
          <span v-if="starting" class="material-icons animate-spin">refresh</span>
          <span v-else class="material-icons">play_arrow</span>
          {{ starting ? $t('nightAudit.starting') : $t('nightAudit.startAudit') }}
        </button>

        <!-- Quick stats preview -->
        <div class="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
          <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
            {{ $t('nightAudit.todaySummary') }}
          </p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">--</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('nightAudit.occupiedRooms') }}
              </p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">--</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('nightAudit.arrivals') }}
              </p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">--</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('nightAudit.departures') }}
              </p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">--</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('nightAudit.revenue') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Audit - Wizard -->
      <div v-else class="space-y-6">
        <!-- Progress Bar -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
              $t('nightAudit.progress')
            }}</span>
            <span class="text-sm text-indigo-600 dark:text-indigo-400 font-medium"
              >{{ progress }}%</span
            >
          </div>
          <div class="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>

        <!-- Step Indicator -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            <template v-for="(step, index) in steps" :key="step.number">
              <!-- Step Circle -->
              <button
                :disabled="!canGoToStep(step.number)"
                class="flex-shrink-0 flex flex-col items-center gap-2 group"
                :class="{ 'cursor-not-allowed opacity-50': !canGoToStep(step.number) }"
                @click="goToStep(step.number)"
              >
                <!-- Circle -->
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                  :class="{
                    'bg-green-500 text-white': step.status === 'completed',
                    'bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-900':
                      step.status === 'current',
                    'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400':
                      step.status === 'pending'
                  }"
                >
                  <span v-if="step.status === 'completed'" class="material-icons text-lg"
                    >check</span
                  >
                  <span v-else class="material-icons text-lg">{{ step.icon }}</span>
                </div>
                <!-- Label -->
                <span
                  class="text-xs font-medium whitespace-nowrap"
                  :class="{
                    'text-green-600 dark:text-green-400': step.status === 'completed',
                    'text-indigo-600 dark:text-indigo-400': step.status === 'current',
                    'text-gray-500 dark:text-slate-400': step.status === 'pending'
                  }"
                >
                  {{ step.label }}
                </span>
              </button>

              <!-- Connector Line -->
              <div
                v-if="index < steps.length - 1"
                class="flex-shrink-0 w-8 md:w-12 h-1 rounded transition-colors duration-500"
                :class="
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'
                "
              ></div>
            </template>
          </div>
        </div>

        <!-- Step Content -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <Transition
            mode="out-in"
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-4"
          >
            <component
              :is="currentStepComponent"
              :key="audit.currentStep"
              :audit="audit"
              :hotel-id="hotelId"
              @complete="handleStepComplete"
              @back="handleStepBack"
              @refresh="fetchAudit"
            />
          </Transition>
        </div>
      </div>

      <!-- History Modal -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showHistory"
            class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            @click.self="showHistory = false"
          >
            <div
              class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div
                class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700"
              >
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ $t('nightAudit.auditHistory') }}
                </h3>
                <button
                  class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                  @click="showHistory = false"
                >
                  <span class="material-icons">close</span>
                </button>
              </div>
              <div class="p-4 overflow-y-auto max-h-[60vh]">
                <div v-if="historyLoading" class="text-center py-8">
                  <span class="material-icons animate-spin text-2xl text-indigo-600">refresh</span>
                </div>
                <div
                  v-else-if="history.length === 0"
                  class="text-center py-8 text-gray-500 dark:text-slate-400"
                >
                  {{ $t('nightAudit.noAuditHistory') }}
                </div>
                <div v-else class="space-y-3">
                  <button
                    v-for="item in history"
                    :key="item._id"
                    class="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-left"
                    @click="goToAuditDetail(item._id)"
                  >
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">
                        {{ item.auditNumber }}
                      </p>
                      <p class="text-sm text-gray-500 dark:text-slate-400">
                        {{ formatDate(item.auditDate) }}
                      </p>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="text-right">
                        <p class="text-sm font-medium text-green-600 dark:text-green-400">
                          %{{ item.summary?.occupancyRate || 0 }}
                          {{ $t('nightAudit.summary.occupancy') }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-slate-400">
                          {{ formatCurrency(item.summary?.totalRevenue || 0) }}
                        </p>
                      </div>
                      <span class="material-icons text-gray-400">chevron_right</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as nightAuditService from '@/services/pms/nightAuditService'
import { useNightAuditSocket } from '@/composables/useNightAuditSocket'
import { usePmsStore } from '@/stores/pms'

// Lazy load step components
const PreAuditCheck = defineAsyncComponent(
  () => import('@/components/pms/billing/steps/PreAuditCheck.vue')
)
const NoShowProcessing = defineAsyncComponent(
  () => import('@/components/pms/billing/steps/NoShowProcessing.vue')
)
const RoomChargePosting = defineAsyncComponent(
  () => import('@/components/pms/billing/steps/RoomChargePosting.vue')
)
const CashierReconciliation = defineAsyncComponent(
  () => import('@/components/pms/billing/steps/CashierReconciliation.vue')
)
const ReportsAndClose = defineAsyncComponent(
  () => import('@/components/pms/billing/steps/ReportsAndClose.vue')
)

const toast = useToast()
const router = useRouter()
const { t } = useI18n()
const pmsStore = usePmsStore()
const hotelId = computed(() => pmsStore.hotelId)

// State
const loading = ref(true)
const starting = ref(false)
const audit = ref(null)
const showHistory = ref(false)
const history = ref([])
const historyLoading = ref(false)

// WebSocket for real-time updates
const { isConnected } = useNightAuditSocket(hotelId, {
  onStarted: data => {
    console.log('[NightAudit] Audit started via WebSocket:', data)
    // Refresh if we don't have the audit yet
    if (!audit.value) {
      fetchAudit()
    }
  },
  onStepComplete: data => {
    console.log('[NightAudit] Step completed via WebSocket:', data)
    // Refresh audit data to get the latest step
    fetchAudit()
    // Show toast for step completion
    const stepInfo = nightAuditService.STEP_INFO[data.step]
    if (stepInfo) {
      toast.info(t('nightAudit.stepCompletedBy', { step: stepInfo.label }))
    }
  },
  onCompleted: data => {
    console.log('[NightAudit] Audit completed via WebSocket:', data)
    // Refresh to show completion
    fetchAudit()
    toast.success(t('nightAudit.auditCompleted'))
  }
})

// Computed
const auditDate = computed(() => audit.value?.auditDate || new Date())

const progress = computed(() => {
  return nightAuditService.calculateProgress(audit.value)
})

const steps = computed(() => {
  return nightAuditService.getStepsWithStatus(audit.value)
})

const currentStepComponent = computed(() => {
  if (!audit.value) return null
  const stepComponents = {
    1: PreAuditCheck,
    2: NoShowProcessing,
    3: RoomChargePosting,
    4: CashierReconciliation,
    5: ReportsAndClose
  }
  return stepComponents[audit.value.currentStep] || PreAuditCheck
})

// Methods
const formatDate = date => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatCurrency = amount => {
  return nightAuditService.formatCurrency(amount)
}

const canGoToStep = stepNumber => {
  if (!audit.value) return false
  // Can go to completed steps or current step
  const step = steps.value.find(s => s.number === stepNumber)
  return step?.status === 'completed' || step?.status === 'current'
}

const goToStep = stepNumber => {
  if (!canGoToStep(stepNumber)) return
  // Only allow going back to completed steps for review
  // Current step stays as is
}

const fetchAudit = async () => {
  console.log('[NightAudit] fetchAudit called, hotelId:', hotelId.value)

  if (!hotelId.value) {
    console.warn('[NightAudit] No hotelId, skipping fetch')
    loading.value = false
    return
  }

  try {
    loading.value = true
    console.log('[NightAudit] Fetching current audit...')
    const response = await nightAuditService.getCurrentAudit(hotelId.value)
    console.log('[NightAudit] Current audit response:', response)
    audit.value = response.data
  } catch (error) {
    console.error('Failed to fetch audit:', error)
    toast.error(t('nightAudit.auditFetchError'))
  } finally {
    loading.value = false
  }
}

const handleStartAudit = async () => {
  console.log('[NightAudit] handleStartAudit called, hotelId:', hotelId.value)

  if (!hotelId.value) {
    console.warn('[NightAudit] No hotelId, cannot start audit')
    toast.warning(t('nightAudit.selectHotelFirst'))
    return
  }

  try {
    starting.value = true
    console.log('[NightAudit] Starting audit for hotel:', hotelId.value)
    const response = await nightAuditService.startAudit(hotelId.value)
    console.log('[NightAudit] Audit started:', response)
    audit.value = response.data
    toast.success(t('nightAudit.auditStarted'))
  } catch (error) {
    console.error('Failed to start audit:', error)
    toast.error(error.response?.data?.message || t('nightAudit.auditStartError'))
  } finally {
    starting.value = false
  }
}

const handleStepComplete = async () => {
  // Refresh audit data after step completion
  await fetchAudit()

  // Show success message
  const stepInfo = nightAuditService.STEP_INFO[audit.value?.currentStep - 1]
  if (stepInfo) {
    toast.success(t('nightAudit.messages.stepCompleted'))
  }
}

const handleStepBack = () => {
  // Handle going back (if needed for review)
}

const fetchHistory = async () => {
  if (!hotelId.value) return

  try {
    historyLoading.value = true
    const response = await nightAuditService.getAuditHistory(hotelId.value)
    history.value = response.data?.audits || []
  } catch (error) {
    console.error('Failed to fetch history:', error)
  } finally {
    historyLoading.value = false
  }
}

const goToAuditDetail = auditId => {
  showHistory.value = false
  router.push({ name: 'pms-night-audit-detail', params: { auditId } })
}

// Watch for history modal
watch(showHistory, show => {
  if (show && history.value.length === 0) {
    fetchHistory()
  }
})

// Keyboard shortcuts
const handleKeydown = e => {
  if (!audit.value) return

  // Ignore if typing in input
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return

  if (e.key === 'Enter') {
    // Handled by step components
  } else if (e.key === 'Escape') {
    if (showHistory.value) {
      showHistory.value = false
    }
  } else if (e.key >= '1' && e.key <= '5') {
    const stepNum = parseInt(e.key)
    if (canGoToStep(stepNum)) {
      goToStep(stepNum)
    }
  }
}

// Lifecycle
onMounted(() => {
  fetchAudit()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Watch for hotel change
watch(hotelId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchAudit()
  }
})
</script>

<style scoped>
/* Custom scrollbar for step indicator */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.3);
  border-radius: 2px;
}

/* Keyboard hint styling */
kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
}
</style>
