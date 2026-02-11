<template>
  <Drawer
    :model-value="modelValue"
    position="right"
    size="xl"
    :title="$t('emailLogs.detail.title')"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ $t('emailLogs.detail.title') }}
        </h3>
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="getStatusClass(log?.status)"
        >
          <span
            class="w-1.5 h-1.5 rounded-full mr-1.5"
            :class="getStatusDotClass(log?.status)"
          ></span>
          {{ $t(`emailLogs.status${capitalize(log?.status)}`) }}
        </span>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>

    <!-- Content -->
    <div v-else-if="detail" class="space-y-6">
      <!-- Retry Button (for failed booking emails) -->
      <div v-if="canRetry" class="flex justify-end">
        <button
          class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          :disabled="retrying"
          @click="handleRetry"
        >
          <span v-if="retrying" class="animate-spin material-icons text-sm">refresh</span>
          <span v-else class="material-icons text-sm">replay</span>
          {{ $t('emailLogs.detail.retry') }}
        </button>
      </div>

      <!-- Metadata Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Recipient -->
        <div>
          <label
            class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{ $t('emailLogs.detail.recipient') }}
          </label>
          <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ detail.to }}</p>
        </div>

        <!-- Subject -->
        <div>
          <label
            class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{ $t('emailLogs.detail.subject') }}
          </label>
          <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ detail.subject }}</p>
        </div>

        <!-- Type -->
        <div>
          <label
            class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{ $t('emailLogs.detail.type') }}
          </label>
          <p class="mt-1">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="getTypeClass(detail.type)"
            >
              {{ $t(`emailLogs.type${capitalize(detail.type)}`) }}
            </span>
          </p>
        </div>

        <!-- Status -->
        <div>
          <label
            class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{ $t('emailLogs.detail.status') }}
          </label>
          <p class="mt-1">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="getStatusClass(detail.status)"
            >
              <span
                class="w-1.5 h-1.5 rounded-full mr-1.5"
                :class="getStatusDotClass(detail.status)"
              ></span>
              {{ $t(`emailLogs.status${capitalize(detail.status)}`) }}
            </span>
          </p>
        </div>

        <!-- Partner -->
        <div v-if="detail.partnerId">
          <label
            class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{ $t('emailLogs.detail.partner') }}
          </label>
          <p class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ detail.partnerId?.companyName || detail.partnerId }}
          </p>
        </div>

        <!-- User -->
        <div v-if="detail.userId">
          <label
            class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{ $t('emailLogs.detail.user') }}
          </label>
          <p class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ detail.userId?.name || detail.userId?.email || detail.userId }}
          </p>
        </div>

        <!-- Message ID -->
        <div v-if="detail.messageId">
          <label
            class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{ $t('emailLogs.detail.messageId') }}
          </label>
          <p class="mt-1 text-xs text-gray-500 dark:text-slate-400 font-mono break-all">
            {{ detail.messageId }}
          </p>
        </div>

        <!-- Created At -->
        <div>
          <label
            class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{ $t('emailLogs.date') }}
          </label>
          <p class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ formatDate(detail.createdAt) }}
          </p>
        </div>

        <!-- Sent At -->
        <div v-if="detail.sentAt">
          <label
            class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{ $t('emailLogs.detail.sentAt') }}
          </label>
          <p class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ formatDate(detail.sentAt) }}
          </p>
        </div>

        <!-- Delivered At -->
        <div v-if="detail.deliveredAt">
          <label
            class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{ $t('emailLogs.detail.deliveredAt') }}
          </label>
          <p class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ formatDate(detail.deliveredAt) }}
          </p>
        </div>

        <!-- Opened At -->
        <div v-if="detail.openedAt">
          <label
            class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{ $t('emailLogs.detail.openedAt') }}
          </label>
          <p class="mt-1 text-sm text-gray-900 dark:text-white">
            {{ formatDate(detail.openedAt) }}
          </p>
        </div>
      </div>

      <!-- Error Section -->
      <div
        v-if="detail.error?.message"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
      >
        <div class="flex items-start gap-3">
          <span class="material-icons text-red-500 flex-shrink-0">error_outline</span>
          <div class="min-w-0">
            <h4 class="text-sm font-medium text-red-800 dark:text-red-300">
              {{ $t('emailLogs.error') }}
            </h4>
            <p class="mt-1 text-sm text-red-700 dark:text-red-400 break-all">
              {{ detail.error.message }}
            </p>
            <p v-if="detail.error.code" class="mt-1 text-xs text-red-500 dark:text-red-500">
              Code: {{ detail.error.code }}
            </p>
          </div>
        </div>
      </div>

      <!-- SES Events Timeline -->
      <div v-if="detail.sesEvents?.length">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {{ $t('emailLogs.detail.sesEvents') }}
        </h4>
        <Timeline :items="timelineItems" size="sm" color="indigo" />
      </div>

      <!-- HTML Preview -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {{ $t('emailLogs.detail.emailContent') }}
        </h4>
        <div
          v-if="detail.html"
          class="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
        >
          <iframe
            :srcdoc="detail.html"
            sandbox="allow-same-origin"
            class="w-full bg-white"
            style="height: 500px; border: none"
          ></iframe>
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-gray-300 dark:border-slate-600"
        >
          <span class="material-icons text-3xl mb-2">mail_outline</span>
          <p class="text-sm">{{ $t('emailLogs.detail.noContent') }}</p>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Drawer, Timeline, Spinner } from '@/components/ui'
import { getEmailLog, retryEmail } from '@/services/emailLogService'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  log: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'retried'])

const loading = ref(false)
const retrying = ref(false)
const detail = ref(null)

const BOOKING_EMAIL_TYPES = new Set([
  'booking-confirmation',
  'booking-cancelled',
  'booking-modified'
])

const canRetry = computed(() => {
  return detail.value?.status === 'failed' && BOOKING_EMAIL_TYPES.has(detail.value?.type)
})

const timelineItems = computed(() => {
  if (!detail.value?.sesEvents?.length) return []

  return detail.value.sesEvents.map(event => {
    const eventConfig = {
      Delivery: {
        icon: 'check_circle',
        color: 'green',
        label: t('emailLogs.detail.eventDelivery')
      },
      Bounce: { icon: 'error', color: 'red', label: t('emailLogs.detail.eventBounce') },
      Complaint: { icon: 'report', color: 'amber', label: t('emailLogs.detail.eventComplaint') },
      Open: { icon: 'visibility', color: 'blue', label: t('emailLogs.detail.eventOpen') }
    }

    const config = eventConfig[event.eventType] || {
      icon: 'info',
      color: 'gray',
      label: event.eventType
    }

    let description = ''
    if (event.detail) {
      if (event.eventType === 'Bounce') {
        description = `${event.detail.bounceType || ''} - ${event.detail.bounceSubType || ''}`
      } else if (event.eventType === 'Complaint') {
        description = event.detail.complaintFeedbackType || ''
      } else if (event.eventType === 'Delivery') {
        description = event.detail.smtpResponse || ''
      }
    }

    return {
      title: config.label,
      icon: config.icon,
      color: config.color,
      time: formatDate(event.timestamp),
      description: description || undefined
    }
  })
})

// Load detail when drawer opens
watch(
  () => props.modelValue,
  async isOpen => {
    if (isOpen && props.log?._id) {
      await loadDetail(props.log._id)
    } else if (!isOpen) {
      detail.value = null
    }
  }
)

async function loadDetail(id) {
  loading.value = true
  try {
    const response = await getEmailLog(id)
    detail.value = response.data
  } catch (error) {
    console.error('Failed to load email log detail:', error)
    toast.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function handleRetry() {
  if (!detail.value?._id) return
  retrying.value = true
  try {
    await retryEmail(detail.value._id)
    toast.success(t('emailLogs.detail.retrySuccess'))
    emit('retried')
  } catch (error) {
    console.error('Failed to retry email:', error)
    toast.error(error.response?.data?.error || t('common.error'))
  } finally {
    retrying.value = false
  }
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function capitalize(str) {
  if (!str) return ''
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

function getStatusClass(status) {
  const classes = {
    sent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    delivered: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    opened: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    bounced: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    complained: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
  }
  return classes[status] || 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
}

function getStatusDotClass(status) {
  const classes = {
    sent: 'bg-green-500',
    delivered: 'bg-teal-500',
    opened: 'bg-blue-500',
    failed: 'bg-red-500',
    pending: 'bg-yellow-500',
    bounced: 'bg-orange-500',
    complained: 'bg-rose-500'
  }
  return classes[status] || 'bg-gray-500'
}

function getTypeClass(type) {
  const classes = {
    activation: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'password-reset': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    welcome: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'booking-confirmation':
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    'booking-cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    '2fa-setup': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
  }
  return classes[type] || 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
}
</script>
