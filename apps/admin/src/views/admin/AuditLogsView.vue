<template>
  <div>
    <!-- Export Button -->
    <div class="mb-6 flex justify-end">
      <button
        class="btn-secondary flex items-center gap-2"
        :disabled="exporting"
        @click="exportLogs"
      >
        <span class="material-icons" :class="{ 'animate-spin': exporting }">{{
          exporting ? 'sync' : 'download'
        }}</span>
        {{ $t('audit.export') }}
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"
          >
            <span class="material-icons text-blue-600 dark:text-blue-400">history</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ stats.totalLogs || 0 }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('audit.stats.totalLogs') }}
            </p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center"
          >
            <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ stats.successCount || 0 }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('audit.stats.success') }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center"
          >
            <span class="material-icons text-red-600 dark:text-red-400">error</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ stats.failureCount || 0 }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('audit.stats.failure') }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center"
          >
            <span class="material-icons text-purple-600 dark:text-purple-400">people</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ stats.uniqueUsers || 0 }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('audit.stats.activeUsers') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
        <!-- Search -->
        <div class="md:col-span-2">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <span class="material-icons">search</span>
            </span>
            <input
              v-model="filters.search"
              type="text"
              :placeholder="$t('audit.searchPlaceholder')"
              class="form-input pl-10 w-full"
              @input="debouncedSearch"
            />
          </div>
        </div>

        <!-- Module Filter -->
        <div>
          <select v-model="filters.module" class="form-input w-full" @change="fetchLogs">
            <option value="">{{ $t('audit.allModules') }}</option>
            <option v-for="mod in modules" :key="mod" :value="mod">
              {{ $t(`audit.modules.${mod}`) }}
            </option>
          </select>
        </div>

        <!-- Action Filter -->
        <div>
          <select v-model="filters.action" class="form-input w-full" @change="fetchLogs">
            <option value="">{{ $t('audit.allActions') }}</option>
            <option v-for="act in actions" :key="act" :value="act">
              {{ $t(`audit.actions.${act}`) }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <select v-model="filters.status" class="form-input w-full" @change="fetchLogs">
            <option value="">{{ $t('audit.allStatuses') }}</option>
            <option value="success">{{ $t('audit.status.success') }}</option>
            <option value="failure">{{ $t('audit.status.failure') }}</option>
          </select>
        </div>

        <!-- Period Filter -->
        <div>
          <select v-model="filters.period" class="form-input w-full" @change="handlePeriodChange">
            <option value="day">{{ $t('audit.period.day') }}</option>
            <option value="week">{{ $t('audit.period.week') }}</option>
            <option value="month">{{ $t('audit.period.month') }}</option>
            <option value="custom">{{ $t('audit.period.custom') }}</option>
          </select>
        </div>
      </div>

      <!-- Custom Date Range -->
      <div v-if="filters.period === 'custom'" class="mt-4 flex gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('audit.startDate') }}
          </label>
          <input
            v-model="filters.startDate"
            type="date"
            class="form-input w-full"
            @change="fetchLogs"
          />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('audit.endDate') }}
          </label>
          <input
            v-model="filters.endDate"
            type="date"
            class="form-input w-full"
            @change="fetchLogs"
          />
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      <DataTable
        :data="logs"
        :columns="columns"
        :loading="loading"
        :total="pagination.total"
        :page="pagination.page"
        :per-page="pagination.limit"
        :show-header="false"
        responsive
        :card-title-key="'actor.name'"
        :empty-icon="'history'"
        :empty-text="$t('audit.noLogs')"
        @page-change="handlePageChange"
      >
        <!-- Timestamp Cell -->
        <template #cell-timestamp="{ row }">
          <div class="text-sm text-gray-900 dark:text-white">
            {{ formatDate(row.timestamp) }}
          </div>
          <div class="text-xs text-gray-500 dark:text-slate-400">
            {{ formatTime(row.timestamp) }}
          </div>
        </template>

        <!-- User Cell -->
        <template #cell-actor="{ row }">
          <div class="flex items-center">
            <div
              class="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-sm font-medium"
            >
              {{ getInitials(row.actor?.name || row.actor?.email) }}
            </div>
            <div class="ml-3">
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ row.actor?.name || row.actor?.email || 'System' }}
              </div>
              <div class="text-xs text-gray-500 dark:text-slate-400">
                {{ getRoleBadge(row.actor?.role) }}
              </div>
            </div>
          </div>
        </template>

        <!-- Module Cell -->
        <template #cell-module="{ row }">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="getModuleClass(row.module)"
          >
            {{ $t(`audit.modules.${row.module}`) }}
          </span>
          <div v-if="row.subModule" class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ row.subModule }}
          </div>
        </template>

        <!-- Action Cell -->
        <template #cell-action="{ row }">
          <span
            class="inline-flex items-center gap-1 text-sm"
            :class="getActionClass(row.action)"
          >
            <span class="material-icons text-base">{{ getActionIcon(row.action) }}</span>
            {{ $t(`audit.actions.${row.action}`) }}
          </span>
        </template>

        <!-- Target Cell -->
        <template #cell-target="{ row }">
          <div class="text-sm text-gray-900 dark:text-white max-w-xs truncate">
            {{ row.target?.documentName || row.target?.documentId || '-' }}
          </div>
          <div
            v-if="row.target?.collection"
            class="text-xs text-gray-500 dark:text-slate-400"
          >
            {{ row.target.collection }}
          </div>
        </template>

        <!-- Status Cell -->
        <template #cell-status="{ row }">
          <span
            v-if="row.status === 'success'"
            class="inline-flex items-center text-green-600 dark:text-green-400"
          >
            <span class="material-icons text-base">check_circle</span>
          </span>
          <span v-else class="inline-flex items-center text-red-600 dark:text-red-400">
            <span class="material-icons text-base">error</span>
          </span>
        </template>

        <!-- Row Actions -->
        <template #row-actions="{ row }">
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-white"
            @click="openDetail(row)"
          >
            <span class="material-icons">visibility</span>
          </button>
        </template>
      </DataTable>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div
        v-if="showDetail"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showDetail = false"
      >
        <div
          class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          <!-- Header -->
          <div
            class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t('audit.detail.title') }}
            </h3>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              @click="showDetail = false"
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div v-if="selectedLog" class="space-y-6">
              <!-- Basic Info -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">{{
                    $t('audit.timestamp')
                  }}</label>
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ formatDateTime(selectedLog.timestamp) }}
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">{{
                    $t('audit.status.label')
                  }}</label>
                  <p class="text-sm">
                    <span
                      :class="selectedLog.status === 'success' ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ $t(`audit.status.${selectedLog.status}`) }}
                    </span>
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">{{
                    $t('audit.module')
                  }}</label>
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ $t(`audit.modules.${selectedLog.module}`) }}
                    <span v-if="selectedLog.subModule" class="text-gray-500">
                      / {{ selectedLog.subModule }}</span
                    >
                  </p>
                </div>
                <div>
                  <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">{{
                    $t('audit.action')
                  }}</label>
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ $t(`audit.actions.${selectedLog.action}`) }}
                  </p>
                </div>
              </div>

              <!-- Actor -->
              <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  {{ $t('audit.detail.actor') }}
                </h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label class="text-xs text-gray-500 dark:text-slate-400">{{
                      $t('audit.detail.email')
                    }}</label>
                    <p class="text-gray-900 dark:text-white">
                      {{ selectedLog.actor?.email || '-' }}
                    </p>
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 dark:text-slate-400">{{
                      $t('audit.detail.name')
                    }}</label>
                    <p class="text-gray-900 dark:text-white">
                      {{ selectedLog.actor?.name || '-' }}
                    </p>
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 dark:text-slate-400">{{
                      $t('audit.detail.role')
                    }}</label>
                    <p class="text-gray-900 dark:text-white">
                      {{ getRoleBadge(selectedLog.actor?.role) }}
                    </p>
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 dark:text-slate-400">{{
                      $t('audit.detail.ip')
                    }}</label>
                    <p class="text-gray-900 dark:text-white font-mono text-xs">
                      {{ selectedLog.actor?.ip || '-' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Target -->
              <div
                v-if="selectedLog.target"
                class="border-t border-gray-200 dark:border-slate-700 pt-4"
              >
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  {{ $t('audit.detail.target') }}
                </h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label class="text-xs text-gray-500 dark:text-slate-400">{{
                      $t('audit.detail.collection')
                    }}</label>
                    <p class="text-gray-900 dark:text-white">
                      {{ selectedLog.target.collection || '-' }}
                    </p>
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 dark:text-slate-400">{{
                      $t('audit.detail.documentName')
                    }}</label>
                    <p class="text-gray-900 dark:text-white">
                      {{ selectedLog.target.documentName || '-' }}
                    </p>
                  </div>
                  <div class="col-span-2">
                    <label class="text-xs text-gray-500 dark:text-slate-400">{{
                      $t('audit.detail.documentId')
                    }}</label>
                    <p class="text-gray-900 dark:text-white font-mono text-xs">
                      {{ selectedLog.target.documentId || '-' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Changes -->
              <div
                v-if="selectedLog.changes?.diff?.length"
                class="border-t border-gray-200 dark:border-slate-700 pt-4"
              >
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  {{ $t('audit.detail.changes') }}
                </h4>
                <div class="bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-gray-200 dark:border-slate-700">
                        <th class="px-3 py-2 text-left text-xs text-gray-500 dark:text-slate-400">
                          {{ $t('audit.detail.field') }}
                        </th>
                        <th class="px-3 py-2 text-left text-xs text-gray-500 dark:text-slate-400">
                          {{ $t('audit.detail.oldValue') }}
                        </th>
                        <th class="px-3 py-2 text-left text-xs text-gray-500 dark:text-slate-400">
                          {{ $t('audit.detail.newValue') }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(change, idx) in selectedLog.changes.diff"
                        :key="idx"
                        class="border-b border-gray-200 dark:border-slate-700 last:border-0"
                      >
                        <td class="px-3 py-2 font-medium text-gray-900 dark:text-white">
                          {{ change.field }}
                        </td>
                        <td class="px-3 py-2 text-red-600 dark:text-red-400 max-w-xs truncate">
                          {{ formatValue(change.from) }}
                        </td>
                        <td class="px-3 py-2 text-green-600 dark:text-green-400 max-w-xs truncate">
                          {{ formatValue(change.to) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Request Info -->
              <div
                v-if="selectedLog.request"
                class="border-t border-gray-200 dark:border-slate-700 pt-4"
              >
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  {{ $t('audit.detail.request') }}
                </h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label class="text-xs text-gray-500 dark:text-slate-400">{{
                      $t('audit.detail.method')
                    }}</label>
                    <p class="text-gray-900 dark:text-white font-mono">
                      {{ selectedLog.request.method }}
                    </p>
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 dark:text-slate-400">{{
                      $t('audit.detail.statusCode')
                    }}</label>
                    <p
                      :class="
                        selectedLog.request.statusCode < 400 ? 'text-green-600' : 'text-red-600'
                      "
                    >
                      {{ selectedLog.request.statusCode }}
                    </p>
                  </div>
                  <div class="col-span-2">
                    <label class="text-xs text-gray-500 dark:text-slate-400">{{
                      $t('audit.detail.path')
                    }}</label>
                    <p class="text-gray-900 dark:text-white font-mono text-xs break-all">
                      {{ selectedLog.request.path }}
                    </p>
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 dark:text-slate-400">{{
                      $t('audit.detail.duration')
                    }}</label>
                    <p class="text-gray-900 dark:text-white">
                      {{ selectedLog.request.duration }}ms
                    </p>
                  </div>
                </div>
              </div>

              <!-- JSON Toggle -->
              <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
                <button
                  class="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  @click="showJson = !showJson"
                >
                  {{ showJson ? $t('audit.detail.hideJson') : $t('audit.detail.showJson') }}
                </button>
                <pre
                  v-if="showJson"
                  class="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto"
                  >{{ JSON.stringify(selectedLog, null, 2) }}</pre
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/ui/data/DataTable.vue'
import auditService from '@/services/auditService'

const { t } = useI18n()
const toast = useToast()

// State
const loading = ref(false)
const exporting = ref(false)
const logs = ref([])
const stats = ref({})
const pagination = ref({ page: 1, limit: 50, total: 0, pages: 0 })

const filters = reactive({
  search: '',
  module: '',
  action: '',
  status: '',
  period: 'day',
  startDate: '',
  endDate: ''
})

// Detail modal
const showDetail = ref(false)
const selectedLog = ref(null)
const showJson = ref(false)

// DataTable columns
const columns = computed(() => [
  { key: 'timestamp', label: t('audit.timestamp'), sortable: true },
  { key: 'actor', label: t('audit.user'), sortable: false },
  { key: 'module', label: t('audit.module'), sortable: true },
  { key: 'action', label: t('audit.action'), sortable: true },
  { key: 'target', label: t('audit.target'), sortable: false },
  { key: 'status', label: t('audit.status.label'), sortable: true }
])

// Filter options
const modules = [
  'auth',
  'user',
  'partner',
  'hotel',
  'planning',
  'booking',
  'content',
  'settings',
  'agency',
  'location',
  'tag'
]
const actions = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'upload',
  'import',
  'export',
  'approve',
  'reject',
  'activate',
  'deactivate',
  'link'
]

// Debounced search
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchLogs()
  }, 500)
}

// Period change
const handlePeriodChange = () => {
  if (filters.period !== 'custom') {
    filters.startDate = ''
    filters.endDate = ''
    fetchLogs()
    fetchStats()
  }
}

// Fetch logs
const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }

    if (filters.search) params.search = filters.search
    if (filters.module) params.module = filters.module
    if (filters.action) params.action = filters.action
    if (filters.status) params.status = filters.status

    // Date filter based on period
    if (filters.period === 'custom' && filters.startDate) {
      params.startDate = filters.startDate
      params.endDate = filters.endDate || new Date().toISOString().split('T')[0]
    } else {
      const now = new Date()
      let startDate
      switch (filters.period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default: // day
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }
      params.startDate = startDate.toISOString().split('T')[0]
    }

    const response = await auditService.getAuditLogs(params)
    logs.value = response.data.logs
    pagination.value = response.data.pagination
  } catch {
    toast.error(t('audit.error.loadFailed'))
  } finally {
    loading.value = false
  }
}

// Fetch stats
const fetchStats = async () => {
  try {
    const response = await auditService.getAuditStats(filters.period)
    stats.value = response.data.summary
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

// Handle DataTable page change
const handlePageChange = ({ page, perPage }) => {
  pagination.value.page = page
  if (perPage) pagination.value.limit = perPage
  fetchLogs()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Open detail modal
const openDetail = log => {
  selectedLog.value = log
  showJson.value = false
  showDetail.value = true
}

// Export logs
const exportLogs = async () => {
  exporting.value = true
  try {
    const blob = await auditService.exportAuditLogs({
      module: filters.module,
      action: filters.action,
      startDate: filters.startDate,
      endDate: filters.endDate
    })

    // Download file
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success(t('audit.exportSuccess'))
  } catch {
    toast.error(t('audit.error.exportFailed'))
  } finally {
    exporting.value = false
  }
}

// Helpers
const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR')
}

const formatTime = date => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDateTime = date => {
  if (!date) return '-'
  return new Date(date).toLocaleString('tr-TR')
}

const getInitials = name => {
  if (!name) return 'S'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getRoleBadge = role => {
  const roles = {
    superadmin: 'SuperAdmin',
    admin: 'Admin',
    partner: 'Partner',
    user: 'User',
    system: 'System'
  }
  return roles[role] || role || 'Unknown'
}

const getModuleClass = module => {
  const classes = {
    auth: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    user: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    partner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    hotel: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    planning: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    booking: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    settings: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    agency: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    location: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    tag: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
  }
  return classes[module] || 'bg-gray-100 text-gray-800'
}

const getActionClass = action => {
  const classes = {
    create: 'text-green-600 dark:text-green-400',
    update: 'text-blue-600 dark:text-blue-400',
    delete: 'text-red-600 dark:text-red-400',
    login: 'text-yellow-600 dark:text-yellow-400',
    logout: 'text-gray-600 dark:text-gray-400',
    upload: 'text-purple-600 dark:text-purple-400',
    import: 'text-indigo-600 dark:text-indigo-400',
    export: 'text-cyan-600 dark:text-cyan-400',
    approve: 'text-green-600 dark:text-green-400',
    reject: 'text-red-600 dark:text-red-400'
  }
  return classes[action] || 'text-gray-600'
}

const getActionIcon = action => {
  const icons = {
    create: 'add_circle',
    update: 'edit',
    delete: 'delete',
    login: 'login',
    logout: 'logout',
    upload: 'upload',
    import: 'download',
    export: 'upload_file',
    approve: 'check_circle',
    reject: 'cancel',
    activate: 'toggle_on',
    deactivate: 'toggle_off',
    link: 'link'
  }
  return icons[action] || 'radio_button_checked'
}

const formatValue = value => {
  if (value === undefined || value === null) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// Initial load
onMounted(() => {
  fetchLogs()
  fetchStats()
})
</script>
