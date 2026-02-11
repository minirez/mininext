<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ $t('emailLogs.title') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {{ $t('emailLogs.description') }}
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        @click="loadData"
      >
        <span class="material-icons text-lg">refresh</span>
        {{ $t('common.refresh') }}
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-blue-600 dark:text-blue-400">email</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total || 0 }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('emailLogs.totalEmails') }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.sent || 0 }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('emailLogs.sent') }}</p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-red-600 dark:text-red-400">error</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.failed || 0 }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('emailLogs.failed') }}</p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-purple-600 dark:text-purple-400">percent</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ stats.successRate || 0 }}%
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('emailLogs.successRate') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700"
    >
      <div class="flex flex-wrap gap-4">
        <!-- Status Filter -->
        <div class="flex-1 min-w-[150px]">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('emailLogs.status') }}
          </label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            @change="loadLogs"
          >
            <option value="">{{ $t('common.all') }}</option>
            <option value="sent">{{ $t('emailLogs.statusSent') }}</option>
            <option value="delivered">{{ $t('emailLogs.statusDelivered') }}</option>
            <option value="opened">{{ $t('emailLogs.statusOpened') }}</option>
            <option value="failed">{{ $t('emailLogs.statusFailed') }}</option>
            <option value="pending">{{ $t('emailLogs.statusPending') }}</option>
            <option value="bounced">{{ $t('emailLogs.statusBounced') }}</option>
            <option value="complained">{{ $t('emailLogs.statusComplained') }}</option>
          </select>
        </div>

        <!-- Type Filter -->
        <div class="flex-1 min-w-[150px]">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('emailLogs.type') }}
          </label>
          <select
            v-model="filters.type"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            @change="loadLogs"
          >
            <option value="">{{ $t('common.all') }}</option>
            <option value="activation">{{ $t('emailLogs.typeActivation') }}</option>
            <option value="password-reset">{{ $t('emailLogs.typePasswordReset') }}</option>
            <option value="welcome">{{ $t('emailLogs.typeWelcome') }}</option>
            <option value="booking-confirmation">
              {{ $t('emailLogs.typeBookingConfirmation') }}
            </option>
            <option value="booking-cancelled">{{ $t('emailLogs.typeBookingCancelled') }}</option>
            <option value="2fa-setup">{{ $t('emailLogs.type2FA') }}</option>
          </select>
        </div>

        <!-- Email Search -->
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('emailLogs.searchEmail') }}
          </label>
          <input
            v-model="filters.to"
            type="text"
            :placeholder="$t('emailLogs.searchEmailPlaceholder')"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            @keyup.enter="loadLogs"
          />
        </div>

        <!-- Search Button -->
        <div class="flex items-end">
          <button
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            @click="loadLogs"
          >
            <span class="material-icons">search</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>

      <div
        v-else-if="logs.length === 0"
        class="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-slate-400"
      >
        <span class="material-icons text-4xl mb-2">inbox</span>
        <p>{{ $t('emailLogs.noLogs') }}</p>
      </div>

      <table v-else class="w-full">
        <thead class="bg-gray-50 dark:bg-slate-700/50">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            >
              {{ $t('emailLogs.recipient') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            >
              {{ $t('emailLogs.subject') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            >
              {{ $t('emailLogs.type') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            >
              {{ $t('emailLogs.status') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            >
              {{ $t('emailLogs.date') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
            >
              {{ $t('emailLogs.error') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
          <tr
            v-for="log in logs"
            :key="log._id"
            class="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
            @click="openDetail(log)"
          >
            <td class="px-4 py-3">
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ log.to }}</div>
              <div v-if="log.partnerId" class="text-xs text-gray-500 dark:text-slate-400">
                {{ log.partnerId?.companyName }}
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                {{ log.subject }}
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getTypeClass(log.type)"
              >
                {{ $t(`emailLogs.type${capitalize(log.type)}`) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(log.status)"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full mr-1.5"
                  :class="getStatusDotClass(log.status)"
                ></span>
                {{ $t(`emailLogs.status${capitalize(log.status)}`) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
              {{ formatDate(log.createdAt) }}
            </td>
            <td class="px-4 py-3">
              <div
                v-if="log.error?.message"
                class="text-sm text-red-600 dark:text-red-400 max-w-xs truncate"
                :title="log.error.message"
              >
                {{ log.error.message }}
              </div>
              <span v-else class="text-gray-400">-</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div
        v-if="pagination.pages > 1"
        class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700"
      >
        <div class="text-sm text-gray-500 dark:text-slate-400">
          {{
            $t('common.showingOf', {
              from: (pagination.page - 1) * pagination.limit + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total
            })
          }}
        </div>
        <div class="flex gap-2">
          <button
            :disabled="pagination.page <= 1"
            class="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
            @click="goToPage(pagination.page - 1)"
          >
            {{ $t('common.previous') }}
          </button>
          <button
            :disabled="pagination.page >= pagination.pages"
            class="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
            @click="goToPage(pagination.page + 1)"
          >
            {{ $t('common.next') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Drawer -->
    <EmailLogDetailDrawer v-model="showDetailDrawer" :log="selectedLog" @retried="loadData" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getEmailLogs, getEmailStats } from '@/services/emailLogService'
import EmailLogDetailDrawer from '@/components/admin/EmailLogDetailDrawer.vue'

const loading = ref(false)
const logs = ref([])
const stats = ref({})
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  pages: 0
})

const showDetailDrawer = ref(false)
const selectedLog = ref(null)

const filters = reactive({
  status: '',
  type: '',
  to: ''
})

const openDetail = log => {
  selectedLog.value = log
  showDetailDrawer.value = true
}

const loadData = async () => {
  await Promise.all([loadLogs(), loadStats()])
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...filters
    }
    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (params[key] === '') delete params[key]
    })

    const response = await getEmailLogs(params)
    logs.value = response.data.logs
    pagination.value = response.data.pagination
  } catch (error) {
    console.error('Failed to load email logs:', error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await getEmailStats()
    stats.value = response.data
  } catch (error) {
    console.error('Failed to load email stats:', error)
  }
}

const goToPage = page => {
  pagination.value.page = page
  loadLogs()
}

const formatDate = date => {
  return new Date(date).toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const capitalize = str => {
  if (!str) return ''
  // Handle kebab-case
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

const getStatusClass = status => {
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

const getStatusDotClass = status => {
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

const getTypeClass = type => {
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

onMounted(() => {
  loadData()
})
</script>
