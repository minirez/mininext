<template>
  <div class="p-6">
    <!-- Success Animation Header -->
    <div class="text-center mb-8">
      <Transition
        enter-active-class="transition-all duration-700 ease-out"
        enter-from-class="opacity-0 scale-50"
        enter-to-class="opacity-100 scale-100"
      >
        <div v-if="!loading" class="relative inline-block">
          <!-- Confetti particles -->
          <div class="absolute inset-0 pointer-events-none">
            <div
              v-for="i in 12"
              :key="i"
              class="confetti-piece absolute"
              :style="{
                left: `${50 + (Math.random() - 0.5) * 100}%`,
                top: `${50 + (Math.random() - 0.5) * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: confettiColors[i % confettiColors.length]
              }"
            ></div>
          </div>

          <div
            class="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-bounce-once"
          >
            <span class="material-icons text-4xl text-green-600 dark:text-green-400"
              >celebration</span
            >
          </div>
        </div>
      </Transition>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ $t('nightAudit.reportsAndClose.auditCompleted') }}
      </h2>
      <p class="text-gray-500 dark:text-slate-400">
        {{ $t('nightAudit.reportsAndClose.auditCompletedDesc') }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div class="animate-pulse">
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
          <div class="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
          <div class="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
          <div class="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
        </div>
        <div class="h-48 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
    </div>

    <div v-else>
      <!-- Summary Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div
          class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-center"
        >
          <p class="text-4xl font-bold">%{{ summary.occupancyRate }}</p>
          <p class="text-sm opacity-80">{{ $t('nightAudit.summary.occupancy') }}</p>
        </div>
        <div
          class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white text-center"
        >
          <p class="text-2xl font-bold">{{ formatCurrency(summary.totalRevenue) }}</p>
          <p class="text-sm opacity-80">{{ $t('nightAudit.summary.totalRevenue') }}</p>
        </div>
        <div
          class="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 text-white text-center"
        >
          <p class="text-4xl font-bold">{{ summary.arrivals }} / {{ summary.departures }}</p>
          <p class="text-sm opacity-80">
            {{ $t('nightAudit.summary.arrivals') }} / {{ $t('nightAudit.summary.departures') }}
          </p>
        </div>
        <div
          class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white text-center"
        >
          <p class="text-4xl font-bold">{{ summary.inHouseGuests }}</p>
          <p class="text-sm opacity-80">{{ $t('nightAudit.summary.inHouseGuests') }}</p>
        </div>
      </div>

      <!-- Revenue Breakdown -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6"
      >
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-emerald-600">trending_up</span>
          {{ $t('nightAudit.reportsAndClose.revenueBreakdown') }}
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(summary.roomRevenue) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('nightAudit.summary.roomRevenue') }}
            </p>
          </div>
          <div class="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(summary.extraRevenue) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('nightAudit.summary.extraRevenue') }}
            </p>
          </div>
          <div class="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ summary.noShows }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('nightAudit.summary.noShows') }}
            </p>
          </div>
          <div class="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ summary.cancellations }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('nightAudit.summary.cancellations') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Reports Download -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6"
      >
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-indigo-600">description</span>
          {{ $t('nightAudit.steps.reportsAndClose.downloadReports') }}
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            v-for="report in reports"
            :key="report.type"
            :disabled="downloadingReport === report.type"
            class="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors group"
            @click="downloadReport(report)"
          >
            <div
              class="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow flex items-center justify-center group-hover:scale-110 transition-transform"
            >
              <span
                v-if="downloadingReport === report.type"
                class="material-icons text-indigo-600 animate-spin"
                >refresh</span
              >
              <span v-else class="material-icons text-2xl" :class="report.iconColor">{{
                report.icon
              }}</span>
            </div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
              report.label
            }}</span>
          </button>
        </div>

        <!-- Email Option -->
        <div class="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
          <label class="flex items-center gap-3 cursor-pointer mb-3">
            <input
              v-model="sendEmail"
              type="checkbox"
              class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('nightAudit.reportsAndClose.sendReportsViaEmail') }}
            </span>
          </label>

          <!-- Email Recipients Input -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-2 max-h-0"
            enter-to-class="opacity-100 translate-y-0 max-h-32"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 max-h-32"
            leave-to-class="opacity-0 -translate-y-2 max-h-0"
          >
            <div v-if="sendEmail" class="ml-7 space-y-2 overflow-hidden">
              <div class="flex items-center gap-2">
                <span class="material-icons text-gray-400 text-lg">mail</span>
                <input
                  v-model="emailInput"
                  type="text"
                  :placeholder="$t('nightAudit.reportsAndClose.emailPlaceholder')"
                  class="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  @keydown.enter="addEmail"
                />
                <button
                  class="px-3 py-2 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                  @click="addEmail"
                >
                  <span class="material-icons text-lg">add</span>
                </button>
              </div>

              <!-- Email Tags -->
              <div v-if="emailRecipients.length > 0" class="flex flex-wrap gap-2">
                <span
                  v-for="(email, index) in emailRecipients"
                  :key="index"
                  class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm rounded-lg"
                >
                  {{ email }}
                  <button class="hover:text-red-500 transition-colors" @click="removeEmail(index)">
                    <span class="material-icons text-sm">close</span>
                  </button>
                </span>
              </div>

              <p
                v-if="emailRecipients.length === 0"
                class="text-xs text-gray-400 dark:text-slate-500"
              >
                {{ $t('nightAudit.reportsAndClose.emailExample') }}
              </p>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Day Close Warning -->
      <div
        class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6"
      >
        <div class="flex items-start gap-3">
          <span class="material-icons text-amber-600 dark:text-amber-400">info</span>
          <div>
            <h4 class="font-medium text-amber-800 dark:text-amber-300">
              {{ $t('nightAudit.reportsAndClose.dayCloseWarningTitle') }}
            </h4>
            <p class="text-sm text-amber-700 dark:text-amber-400 mt-1">
              {{ $t('nightAudit.reportsAndClose.dayCloseWarningText', { date: getNextDay() }) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('nightAudit.reportsAndClose.dateToClose', { date: formatDate(audit.auditDate) }) }}
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
            :disabled="loading || completing"
            class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-400 disabled:to-purple-400 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl"
            @click="handleDayClose"
          >
            <span v-if="completing" class="material-icons animate-spin">refresh</span>
            <span v-else class="material-icons">wb_sunny</span>
            {{
              completing
                ? $t('nightAudit.reportsAndClose.closing')
                : $t('nightAudit.steps.reportsAndClose.closeDay')
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Completion Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showCompletionModal"
          class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        >
          <div
            class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md text-center p-8 transform animate-scale-in"
          >
            <div
              class="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-5xl text-green-600 dark:text-green-400 animate-pulse"
                >check_circle</span
              >
            </div>

            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {{ $t('nightAudit.reportsAndClose.dayClosedSuccess') }}
            </h3>
            <p class="text-gray-500 dark:text-slate-400 mb-6">
              {{
                $t('nightAudit.reportsAndClose.dayClosedDesc', {
                  date: formatDate(audit.auditDate)
                })
              }}
            </p>

            <button
              class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
              @click="finishAudit"
            >
              <span class="material-icons">home</span>
              {{ $t('nightAudit.reportsAndClose.returnToHome') }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'
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
const router = useRouter()

// State
const loading = ref(true)
const completing = ref(false)
const showCompletionModal = ref(false)
const downloadingReport = ref(null)
const sendEmail = ref(false)
const emailInput = ref('')
const emailRecipients = ref([])

const summary = ref({
  occupancyRate: 0,
  totalRevenue: 0,
  roomRevenue: 0,
  extraRevenue: 0,
  arrivals: 0,
  departures: 0,
  inHouseGuests: 0,
  noShows: 0,
  cancellations: 0
})

const confettiColors = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4']

const reports = computed(() => [
  {
    type: 'daily',
    label: t('nightAudit.steps.reportsAndClose.reports.daily'),
    icon: 'summarize',
    iconColor: 'text-indigo-600'
  },
  {
    type: 'revenue',
    label: t('nightAudit.steps.reportsAndClose.reports.revenue'),
    icon: 'payments',
    iconColor: 'text-emerald-600'
  },
  {
    type: 'occupancy',
    label: t('nightAudit.steps.reportsAndClose.reports.occupancy'),
    icon: 'hotel',
    iconColor: 'text-blue-600'
  },
  {
    type: 'cashier',
    label: t('nightAudit.steps.reportsAndClose.reports.cashier'),
    icon: 'point_of_sale',
    iconColor: 'text-purple-600'
  }
])

// Methods
const formatCurrency = amount => {
  return nightAuditService.formatCurrency(amount)
}

const formatDate = date => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getNextDay = () => {
  const auditDate = new Date(props.audit.auditDate)
  auditDate.setDate(auditDate.getDate() + 1)
  return auditDate.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchSummary = async () => {
  if (!props.hotelId) return

  try {
    loading.value = true
    const response = await nightAuditService.getAuditSummary(props.hotelId)
    const data = response.data

    summary.value = {
      occupancyRate: data.occupancyRate || 0,
      totalRevenue: data.totalRevenue || 0,
      roomRevenue: data.roomRevenue || 0,
      extraRevenue: data.extraRevenue || 0,
      arrivals: data.arrivals || 0,
      departures: data.departures || 0,
      inHouseGuests: data.inHouseGuests || 0,
      noShows: data.noShows || 0,
      cancellations: data.cancellations || 0
    }
  } catch (error) {
    console.error('Failed to fetch summary:', error)
    toast.error(t('nightAudit.reportsAndClose.messages.summaryLoadError'))
  } finally {
    loading.value = false
  }
}

const downloadReport = async report => {
  try {
    downloadingReport.value = report.type

    // Download the PDF report
    await nightAuditService.downloadReport(props.hotelId, props.audit._id, report.type)

    toast.success(
      t('nightAudit.reportsAndClose.messages.reportDownloaded', { report: report.label })
    )
  } catch (error) {
    console.error('Failed to download report:', error)
    toast.error(t('nightAudit.reportsAndClose.messages.reportDownloadError'))
  } finally {
    downloadingReport.value = null
  }
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const addEmail = () => {
  const input = emailInput.value.trim()
  if (!input) return

  // Split by comma and process each email
  const emails = input
    .split(',')
    .map(e => e.trim())
    .filter(e => e)

  for (const email of emails) {
    if (!emailRegex.test(email)) {
      toast.warning(t('nightAudit.reportsAndClose.messages.invalidEmail', { email }))
      continue
    }

    if (emailRecipients.value.includes(email)) {
      toast.warning(t('nightAudit.reportsAndClose.messages.emailAlreadyInList', { email }))
      continue
    }

    emailRecipients.value.push(email)
  }

  emailInput.value = ''
}

const removeEmail = index => {
  emailRecipients.value.splice(index, 1)
}

const handleDayClose = async () => {
  // Validate emails if checkbox is checked
  if (sendEmail.value && emailRecipients.value.length === 0) {
    toast.warning(t('nightAudit.reportsAndClose.messages.addAtLeastOneRecipient'))
    return
  }

  try {
    completing.value = true

    const data = {}

    // Only add emailRecipients if sendEmail is checked and has recipients
    if (sendEmail.value && emailRecipients.value.length > 0) {
      data.emailRecipients = emailRecipients.value
    }

    const response = await nightAuditService.completeAudit(props.hotelId, data)

    // Show success message based on email status
    if (response.message) {
      toast.success(response.message)
    }

    showCompletionModal.value = true
  } catch (error) {
    console.error('Failed to complete audit:', error)
    toast.error(
      error.response?.data?.message || t('nightAudit.reportsAndClose.messages.dayCloseError')
    )
  } finally {
    completing.value = false
  }
}

const finishAudit = () => {
  showCompletionModal.value = false
  emit('complete')
  emit('refresh')
  // Optionally navigate to dashboard
  router.push({ name: 'dashboard' })
}

// Lifecycle
onMounted(() => {
  fetchSummary()
})
</script>

<style scoped>
@keyframes confetti-pop {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: scale(0) rotate(360deg) translate(50px, 50px);
    opacity: 0;
  }
}

.confetti-piece {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confetti-pop 1s ease-out forwards;
}

@keyframes bounce-once {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.animate-bounce-once {
  animation: bounce-once 0.6s ease-out;
}

@keyframes scale-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-in {
  animation: scale-in 0.3s ease-out;
}
</style>
