<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('issues.stats.total') }}</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</p>
          </div>
          <div class="p-3 bg-gray-100 dark:bg-slate-700 rounded-full">
            <svg class="w-6 h-6 text-gray-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('issues.stats.open') }}</p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats.open }}</p>
          </div>
          <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('issues.stats.critical') }}</p>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ stats.criticalOpen }}</p>
          </div>
          <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('issues.stats.assignedToMe') }}</p>
            <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ stats.myAssigned }}</p>
          </div>
          <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters & Actions -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="p-4 border-b border-gray-200 dark:border-slate-700">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <!-- Search -->
          <div class="relative flex-1 max-w-md">
            <input
              v-model="filters.search"
              type="text"
              :placeholder="$t('issues.placeholders.searchIssues')"
              class="form-input pl-10"
              @input="debouncedSearch"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div class="flex items-center gap-3">
            <!-- Filters -->
            <select v-model="filters.status" class="form-input text-sm" @change="loadIssues">
              <option value="">{{ $t('issues.fields.status') }}</option>
              <option v-for="status in statusOptions" :key="status" :value="status">
                {{ $t(`issues.status.${status}`) }}
              </option>
            </select>

            <select v-model="filters.priority" class="form-input text-sm" @change="loadIssues">
              <option value="">{{ $t('issues.fields.priority') }}</option>
              <option v-for="priority in priorityOptions" :key="priority" :value="priority">
                {{ $t(`issues.priority.${priority}`) }}
              </option>
            </select>

            <select v-model="filters.category" class="form-input text-sm" @change="loadIssues">
              <option value="">{{ $t('issues.fields.category') }}</option>
              <option v-for="category in categoryOptions" :key="category" :value="category">
                {{ $t(`issues.category.${category}`) }}
              </option>
            </select>

            <!-- New Issue Button -->
            <button class="btn-primary flex items-center whitespace-nowrap" @click="showCreateModal = true">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {{ $t('issues.newIssue') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Issues Table -->
      <div class="p-6">
        <DataTable
          :columns="columns"
          :data="issues"
          :loading="loading"
          :pagination="pagination"
          @page-change="handlePageChange"
        >
          <!-- Issue Number & Title -->
          <template #cell-title="{ row }">
            <router-link
              :to="`/issues/${row._id}`"
              class="block hover:text-purple-600 dark:hover:text-purple-400"
            >
              <span class="text-xs text-gray-500 dark:text-slate-400 font-mono">{{ row.issueNumber }}</span>
              <p class="font-medium text-gray-900 dark:text-white line-clamp-1">{{ row.title }}</p>
            </router-link>
          </template>

          <!-- Status -->
          <template #cell-status="{ value }">
            <span
              class="badge"
              :class="{
                'badge-info': value === 'open',
                'badge-primary': value === 'in_progress',
                'badge-success': value === 'resolved',
                'badge-secondary': value === 'closed',
                'badge-warning': value === 'reopened'
              }"
            >
              {{ $t(`issues.status.${value}`) }}
            </span>
          </template>

          <!-- Priority -->
          <template #cell-priority="{ value }">
            <span
              class="inline-flex items-center gap-1 text-sm"
              :class="{
                'text-gray-500 dark:text-slate-400': value === 'low',
                'text-blue-600 dark:text-blue-400': value === 'medium',
                'text-orange-600 dark:text-orange-400': value === 'high',
                'text-red-600 dark:text-red-400': value === 'critical'
              }"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-gray-400': value === 'low',
                  'bg-blue-500': value === 'medium',
                  'bg-orange-500': value === 'high',
                  'bg-red-500': value === 'critical'
                }"
              />
              {{ $t(`issues.priority.${value}`) }}
            </span>
          </template>

          <!-- Category -->
          <template #cell-category="{ value }">
            <span class="text-sm text-gray-600 dark:text-slate-300">
              {{ $t(`issues.category.${value}`) }}
            </span>
          </template>

          <!-- Reporter -->
          <template #cell-reporter="{ row }">
            <div class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-xs font-medium"
              >
                {{ row.reporter?.name?.charAt(0)?.toUpperCase() || '?' }}
              </div>
              <span class="text-sm text-gray-600 dark:text-slate-300">{{ row.reporter?.name }}</span>
            </div>
          </template>

          <!-- Assignee -->
          <template #cell-assignee="{ row }">
            <div v-if="row.assignee" class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full bg-purple-200 dark:bg-purple-900/50 flex items-center justify-center text-xs font-medium text-purple-700 dark:text-purple-300"
              >
                {{ row.assignee?.name?.charAt(0)?.toUpperCase() }}
              </div>
              <span class="text-sm text-gray-600 dark:text-slate-300">{{ row.assignee?.name }}</span>
            </div>
            <span v-else class="text-sm text-gray-400 dark:text-slate-500">-</span>
          </template>

          <!-- Meta -->
          <template #cell-meta="{ row }">
            <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
              <span class="flex items-center gap-1" :title="$t('issues.comments.title')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {{ row.commentCount || 0 }}
              </span>
              <span class="flex items-center gap-1" :title="$t('issues.attachments')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {{ row.attachmentCount || 0 }}
              </span>
            </div>
          </template>

          <!-- Date -->
          <template #cell-createdAt="{ value }">
            <span class="text-sm text-gray-500 dark:text-slate-400">
              {{ formatDate(value) }}
            </span>
          </template>

          <!-- Row Actions -->
          <template #row-actions="{ row }">
            <div class="flex items-center justify-end gap-2">
              <router-link
                :to="`/issues/${row._id}`"
                class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                :title="$t('common.view')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </router-link>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Create Issue Modal -->
    <IssueCreateModal
      v-model="showCreateModal"
      :platform-users="platformUsers"
      @created="handleIssueCreated"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import DataTable from '@/components/ui/data/DataTable.vue'
import IssueCreateModal from '@/components/issues/IssueCreateModal.vue'
import issueService from '@/services/issueService'

// Simple debounce utility
const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const { t } = useI18n()
const router = useRouter()
const toast = useToast()

// State
const loading = ref(false)
const issues = ref([])
const stats = ref({
  total: 0,
  open: 0,
  criticalOpen: 0,
  myAssigned: 0
})
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})
const platformUsers = ref([])
const showCreateModal = ref(false)

// Filters
const filters = reactive({
  search: '',
  status: '',
  priority: '',
  category: ''
})

// Options
const statusOptions = ['open', 'in_progress', 'resolved', 'closed', 'reopened']
const priorityOptions = ['low', 'medium', 'high', 'critical']
const categoryOptions = ['bug', 'feature', 'improvement', 'question', 'task', 'other']

// Table columns
const columns = computed(() => [
  { key: 'title', label: t('issues.fields.title'), sortable: true },
  { key: 'status', label: t('issues.fields.status'), sortable: true },
  { key: 'priority', label: t('issues.fields.priority'), sortable: true },
  { key: 'category', label: t('issues.fields.category'), sortable: true },
  { key: 'reporter', label: t('issues.fields.reporter') },
  { key: 'assignee', label: t('issues.fields.assignee') },
  { key: 'meta', label: '' },
  { key: 'createdAt', label: t('issues.fields.createdAt'), sortable: true }
])

// Load issues
const loadIssues = async (page = 1) => {
  loading.value = true
  try {
    const params = {
      page,
      limit: pagination.value.limit,
      ...filters
    }

    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (!params[key]) delete params[key]
    })

    const { data } = await issueService.getIssues(params)
    issues.value = data.issues
    pagination.value = data.pagination
  } catch (error) {
    toast.error(t('common.error'))
    console.error('Failed to load issues:', error)
  } finally {
    loading.value = false
  }
}

// Load stats
const loadStats = async () => {
  try {
    const { data } = await issueService.getStats()
    stats.value = {
      total: data.total,
      open: data.open,
      criticalOpen: data.criticalOpen,
      myAssigned: data.myAssigned
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

// Load platform users
const loadPlatformUsers = async () => {
  try {
    const { data } = await issueService.getPlatformUsers()
    platformUsers.value = data
  } catch (error) {
    console.error('Failed to load platform users:', error)
  }
}

// Debounced search
const debouncedSearch = debounce(() => {
  loadIssues(1)
}, 300)

// Handle page change
const handlePageChange = (page) => {
  loadIssues(page)
}

// Handle issue created
const handleIssueCreated = (issue) => {
  toast.success(t('issues.messages.created'))
  loadIssues(1)
  loadStats()
}

// Format date
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Init
onMounted(() => {
  loadIssues()
  loadStats()
  loadPlatformUsers()
})
</script>
