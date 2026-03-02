<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-1 py-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ $t('deployments.title') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
          {{ $t('deployments.description') }}
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        :disabled="syncing"
        @click="handleSync"
      >
        <span class="material-icons text-lg" :class="{ 'animate-spin': syncing }">sync</span>
        {{ syncing ? $t('deployments.syncing') : $t('deployments.sync') }}
      </button>
    </div>

    <div class="flex-1 overflow-y-auto py-2">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          v-for="stat in statCards"
          :key="stat.key"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
              :class="stat.bgClass"
            >
              <span class="material-icons" :class="stat.iconClass">{{ stat.icon }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-2xl font-bold text-gray-900 dark:text-white truncate">
                {{ stat.value }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400 truncate">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Auto-refresh indicator -->
      <div
        v-if="hasInProgress"
        class="flex items-center gap-2 mb-4 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-300"
      >
        <span class="material-icons text-lg animate-spin">sync</span>
        {{ $t('deployments.autoRefresh') }}
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3 mb-4">
        <select
          v-model="filters.status"
          class="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
        >
          <option value="">{{ $t('deployments.filters.allStatuses') }}</option>
          <option value="queued">{{ $t('deployments.status.queued') }}</option>
          <option value="in_progress">{{ $t('deployments.status.in_progress') }}</option>
          <option value="completed">
            {{ $t('deployments.status.success') }} / {{ $t('deployments.status.failure') }}
          </option>
        </select>

        <select
          v-model="filters.branch"
          class="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
        >
          <option value="">{{ $t('deployments.filters.allBranches') }}</option>
          <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
        </select>

        <input
          v-model="filters.startDate"
          type="date"
          class="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
          :placeholder="$t('deployments.filters.startDate')"
        />
        <input
          v-model="filters.endDate"
          type="date"
          class="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
          :placeholder="$t('deployments.filters.endDate')"
        />

        <button
          v-if="filters.status || filters.branch || filters.startDate || filters.endDate"
          class="px-3 py-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
          @click="clearFilters"
        >
          {{ $t('deployments.filters.clearAll') }}
        </button>
      </div>

      <!-- Table -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <!-- Loading -->
        <div
          v-if="loading && !deployments.length"
          class="p-12 text-center text-gray-500 dark:text-slate-400"
        >
          <span class="material-icons text-4xl animate-spin mb-2">sync</span>
          <p>{{ $t('misc.loading') }}</p>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!deployments.length"
          class="p-12 text-center text-gray-500 dark:text-slate-400"
        >
          <span class="material-icons text-4xl mb-2">rocket_launch</span>
          <p>{{ $t('deployments.noDeployments') }}</p>
        </div>

        <!-- Table content -->
        <table v-else class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400">
                {{ $t('deployments.table.status') }}
              </th>
              <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400">
                {{ $t('deployments.table.commit') }}
              </th>
              <th
                class="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400 hidden md:table-cell"
              >
                {{ $t('deployments.table.branch') }}
              </th>
              <th
                class="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400 hidden lg:table-cell"
              >
                {{ $t('deployments.table.message') }}
              </th>
              <th
                class="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400 hidden md:table-cell"
              >
                {{ $t('deployments.table.author') }}
              </th>
              <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400">
                {{ $t('deployments.table.duration') }}
              </th>
              <th
                class="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400 hidden sm:table-cell"
              >
                {{ $t('deployments.table.date') }}
              </th>
              <th class="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
            <template v-for="dep in deployments" :key="dep._id">
              <!-- Main row -->
              <tr
                class="hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                @click="toggleExpand(dep._id)"
              >
                <!-- Status -->
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    :class="statusBadgeClass(dep.status, dep.conclusion)"
                  >
                    <span
                      class="material-icons text-sm"
                      :class="{ 'animate-spin': dep.status === 'in_progress' }"
                      >{{ statusIcon(dep.status, dep.conclusion) }}</span
                    >
                    {{ statusLabel(dep.status, dep.conclusion) }}
                  </span>
                </td>

                <!-- Commit SHA -->
                <td class="px-4 py-3">
                  <code
                    class="text-xs bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono"
                    >{{ shortSha(dep.headSha) }}</code
                  >
                </td>

                <!-- Branch -->
                <td class="px-4 py-3 hidden md:table-cell">
                  <span
                    class="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300"
                  >
                    <span class="material-icons text-sm">alt_route</span>
                    {{ dep.headBranch }}
                  </span>
                </td>

                <!-- Commit message -->
                <td class="px-4 py-3 hidden lg:table-cell max-w-xs">
                  <span
                    class="text-gray-700 dark:text-slate-300 truncate block"
                    :title="dep.commitMessage"
                  >
                    {{ truncateMessage(dep.commitMessage) }}
                  </span>
                </td>

                <!-- Author -->
                <td class="px-4 py-3 hidden md:table-cell">
                  <div class="flex items-center gap-2">
                    <img
                      v-if="dep.actor?.avatarUrl"
                      :src="dep.actor.avatarUrl"
                      :alt="dep.actor.login"
                      class="w-5 h-5 rounded-full"
                    />
                    <span class="text-gray-600 dark:text-slate-400 text-xs">{{
                      dep.actor?.login || dep.commitAuthor
                    }}</span>
                  </div>
                </td>

                <!-- Duration -->
                <td class="px-4 py-3">
                  <span class="text-gray-600 dark:text-slate-400">{{
                    formatDuration(dep.duration)
                  }}</span>
                </td>

                <!-- Date -->
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span class="text-gray-500 dark:text-slate-400 text-xs">{{
                    formatDate(dep.startedAt || dep.createdAt)
                  }}</span>
                </td>

                <!-- Expand icon -->
                <td class="px-4 py-3 text-center">
                  <span
                    class="material-icons text-gray-400 text-lg transition-transform"
                    :class="{ 'rotate-180': expandedRow === dep._id }"
                  >
                    expand_more
                  </span>
                </td>
              </tr>

              <!-- Expanded detail row -->
              <tr v-if="expandedRow === dep._id">
                <td :colspan="8" class="px-4 py-4 bg-gray-50 dark:bg-slate-700/20">
                  <div class="flex flex-col gap-4">
                    <!-- Actions bar -->
                    <div class="flex items-center gap-3">
                      <button
                        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                        :disabled="syncingJobs === dep._id"
                        @click.stop="handleSyncJobs(dep)"
                      >
                        <span
                          class="material-icons text-sm"
                          :class="{ 'animate-spin': syncingJobs === dep._id }"
                          >sync</span
                        >
                        {{ $t('deployments.detail.syncJobs') }}
                      </button>
                      <a
                        v-if="dep.htmlUrl"
                        :href="dep.htmlUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                        @click.stop
                      >
                        <span class="material-icons text-sm">open_in_new</span>
                        {{ $t('deployments.detail.viewOnGithub') }}
                      </a>
                    </div>

                    <!-- Jobs -->
                    <div v-if="dep.jobs?.length">
                      <h4
                        class="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide"
                      >
                        {{ $t('deployments.detail.jobs') }}
                      </h4>
                      <div class="space-y-2">
                        <div
                          v-for="job in dep.jobs"
                          :key="job.jobId"
                          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 p-3"
                        >
                          <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                              <span
                                class="material-icons text-sm"
                                :class="jobStatusColor(job.conclusion)"
                              >
                                {{
                                  job.conclusion === 'success'
                                    ? 'check_circle'
                                    : job.conclusion === 'failure'
                                      ? 'cancel'
                                      : 'pending'
                                }}
                              </span>
                              <span class="font-medium text-gray-800 dark:text-slate-200 text-sm">{{
                                job.name
                              }}</span>
                            </div>
                            <span class="text-xs text-gray-500 dark:text-slate-400">
                              {{
                                job.startedAt && job.completedAt
                                  ? formatDuration(
                                      Math.round(
                                        (new Date(job.completedAt) - new Date(job.startedAt)) / 1000
                                      )
                                    )
                                  : '-'
                              }}
                            </span>
                          </div>

                          <!-- Steps -->
                          <div v-if="job.steps?.length" class="ml-6 space-y-1">
                            <div
                              v-for="step in job.steps"
                              :key="step.number"
                              class="flex items-center gap-2 text-xs"
                            >
                              <span
                                class="material-icons text-xs"
                                :class="jobStatusColor(step.conclusion)"
                              >
                                {{
                                  step.conclusion === 'success'
                                    ? 'check'
                                    : step.conclusion === 'failure'
                                      ? 'close'
                                      : step.conclusion === 'skipped'
                                        ? 'skip_next'
                                        : 'radio_button_unchecked'
                                }}
                              </span>
                              <span class="text-gray-600 dark:text-slate-400">{{ step.name }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-sm text-gray-500 dark:text-slate-400 italic">
                      {{ $t('deployments.detail.noJobs') }}
                    </div>

                    <!-- Extra info -->
                    <div
                      class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500 dark:text-slate-400"
                    >
                      <div><span class="font-medium">Workflow:</span> {{ dep.workflowName }}</div>
                      <div>
                        <span class="font-medium">SHA:</span>
                        <code class="ml-1">{{ dep.headSha }}</code>
                      </div>
                      <div v-if="dep.startedAt">
                        <span class="font-medium">Started:</span> {{ formatDate(dep.startedAt) }}
                      </div>
                      <div v-if="dep.completedAt">
                        <span class="font-medium">Completed:</span>
                        {{ formatDate(dep.completedAt) }}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="flex items-center justify-between mt-4 px-2">
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ (pagination.page - 1) * pagination.limit + 1 }}-{{
            Math.min(pagination.page * pagination.limit, pagination.total)
          }}
          / {{ pagination.total }}
        </p>
        <div class="flex gap-1">
          <button
            v-for="p in pagination.pages"
            :key="p"
            class="px-3 py-1 text-sm rounded-lg transition-colors"
            :class="
              p === pagination.page
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
            "
            @click="setPage(p)"
          >
            {{ p }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import {
  getDeployments,
  getDeploymentStats,
  syncDeployments,
  syncDeploymentJobs
} from '@/services/deploymentService'

const { t } = useI18n()
const toast = useToast()

// State
const deployments = ref([])
const stats = ref({})
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })
const loading = ref(false)
const syncing = ref(false)
const expandedRow = ref(null)
const syncingJobs = ref(null)

// Filters
const filters = ref({
  status: '',
  branch: '',
  startDate: '',
  endDate: ''
})

// Auto-refresh
let refreshInterval = null
const hasInProgress = computed(() =>
  deployments.value.some(d => d.status === 'in_progress' || d.status === 'queued')
)

// Stats cards
const statCards = computed(() => [
  {
    key: 'total',
    label: t('deployments.stats.total'),
    value: stats.value.total || 0,
    icon: 'rocket_launch',
    bgClass: 'bg-blue-100 dark:bg-blue-900/50',
    iconClass: 'text-blue-600 dark:text-blue-400'
  },
  {
    key: 'successRate',
    label: t('deployments.stats.successRate'),
    value: `${stats.value.successRate || 0}%`,
    icon: 'check_circle',
    bgClass: 'bg-green-100 dark:bg-green-900/50',
    iconClass: 'text-green-600 dark:text-green-400'
  },
  {
    key: 'avgDuration',
    label: t('deployments.stats.avgDuration'),
    value: formatDuration(stats.value.avgDuration),
    icon: 'timer',
    bgClass: 'bg-orange-100 dark:bg-orange-900/50',
    iconClass: 'text-orange-600 dark:text-orange-400'
  },
  {
    key: 'lastDeploy',
    label: t('deployments.stats.lastDeploy'),
    value: stats.value.lastDeploy ? timeAgo(stats.value.lastDeploy.completedAt) : '-',
    icon: 'schedule',
    bgClass: 'bg-purple-100 dark:bg-purple-900/50',
    iconClass: 'text-purple-600 dark:text-purple-400'
  }
])

// Unique branches for filter dropdown
const branches = computed(() => {
  const set = new Set(deployments.value.map(d => d.headBranch).filter(Boolean))
  return [...set].sort()
})

// Helpers
function formatDuration(seconds) {
  if (!seconds) return '-'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  return `${hours}h ${remainMins}m`
}

function timeAgo(dateStr) {
  if (!dateStr) return '-'
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return t('deployments.time.justNow')
  if (diff < 3600)
    return `${Math.floor(diff / 60)}${t('deployments.time.minutes', { n: '' })} ${t('deployments.time.ago')}`
  if (diff < 86400)
    return `${Math.floor(diff / 3600)}${t('deployments.time.hours', { n: '' })} ${t('deployments.time.ago')}`
  return new Date(dateStr).toLocaleDateString()
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function shortSha(sha) {
  return sha ? sha.substring(0, 7) : ''
}

function truncateMessage(msg, len = 60) {
  if (!msg) return ''
  const firstLine = msg.split('\n')[0]
  return firstLine.length > len ? firstLine.substring(0, len) + '...' : firstLine
}

function statusBadgeClass(status, conclusion) {
  if (status === 'in_progress')
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
  if (status === 'queued') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
  if (conclusion === 'success')
    return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  if (conclusion === 'failure')
    return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  if (conclusion === 'cancelled')
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
}

function statusIcon(status, conclusion) {
  if (status === 'in_progress') return 'sync'
  if (status === 'queued') return 'hourglass_empty'
  if (conclusion === 'success') return 'check_circle'
  if (conclusion === 'failure') return 'cancel'
  if (conclusion === 'cancelled') return 'block'
  if (conclusion === 'timed_out') return 'timer_off'
  return 'help_outline'
}

function statusLabel(status, conclusion) {
  if (status === 'in_progress') return t('deployments.status.in_progress')
  if (status === 'queued') return t('deployments.status.queued')
  if (conclusion) return t(`deployments.status.${conclusion}`)
  return status
}

function jobStatusColor(conclusion) {
  if (conclusion === 'success') return 'text-green-500'
  if (conclusion === 'failure') return 'text-red-500'
  if (conclusion === 'cancelled') return 'text-gray-400'
  if (conclusion === 'skipped') return 'text-gray-400'
  return 'text-yellow-500'
}

// Data fetching
async function fetchDeployments() {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...(filters.value.status && { status: filters.value.status }),
      ...(filters.value.branch && { branch: filters.value.branch }),
      ...(filters.value.startDate && { startDate: filters.value.startDate }),
      ...(filters.value.endDate && { endDate: filters.value.endDate })
    }
    const result = await getDeployments(params)
    deployments.value = result.data
    pagination.value = result.pagination
  } catch (err) {
    console.error('Failed to load deployments:', err)
  } finally {
    loading.value = false
  }
}

async function fetchStats() {
  try {
    stats.value = await getDeploymentStats(30)
  } catch (err) {
    console.error('Failed to load stats:', err)
  }
}

async function handleSync() {
  syncing.value = true
  try {
    const result = await syncDeployments()
    toast.success(t('deployments.synced', { count: result.count }))
    await Promise.all([fetchDeployments(), fetchStats()])
  } catch {
    toast.error(t('deployments.syncError'))
  } finally {
    syncing.value = false
  }
}

async function handleSyncJobs(deployment) {
  syncingJobs.value = deployment._id
  try {
    const result = await syncDeploymentJobs(deployment._id)
    // Update the deployment in list
    const idx = deployments.value.findIndex(d => d._id === deployment._id)
    if (idx !== -1) {
      deployments.value[idx] = result.data
    }
  } catch {
    toast.error('Failed to sync jobs')
  } finally {
    syncingJobs.value = null
  }
}

function toggleExpand(id) {
  expandedRow.value = expandedRow.value === id ? null : id
}

function setPage(page) {
  pagination.value.page = page
  fetchDeployments()
}

function clearFilters() {
  filters.value = { status: '', branch: '', startDate: '', endDate: '' }
}

// Auto-refresh when in_progress deployments exist
function startAutoRefresh() {
  stopAutoRefresh()
  refreshInterval = setInterval(() => {
    if (hasInProgress.value) {
      fetchDeployments()
      fetchStats()
    }
  }, 10000)
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Watch filters
watch(
  filters,
  () => {
    pagination.value.page = 1
    fetchDeployments()
  },
  { deep: true }
)

onMounted(() => {
  fetchDeployments()
  fetchStats()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>
