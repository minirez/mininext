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
            <svg
              class="w-6 h-6 text-gray-600 dark:text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
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
            <svg
              class="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('issues.stats.critical') }}
            </p>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">
              {{ stats.criticalOpen }}
            </p>
          </div>
          <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <svg
              class="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('issues.stats.assignedToMe') }}
            </p>
            <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {{ stats.myAssigned }}
            </p>
          </div>
          <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <svg
              class="w-6 h-6 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
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
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div class="flex items-center gap-3">
            <!-- Filters -->
            <select v-model="filters.status" class="form-input text-sm" @change="loadIssues(1)">
              <option value="">{{ $t('issues.fields.status') }}</option>
              <option v-for="status in statusOptions" :key="status" :value="status">
                {{ $t(`issues.status.${status}`) }}
              </option>
            </select>

            <select v-model="filters.priority" class="form-input text-sm" @change="loadIssues(1)">
              <option value="">{{ $t('issues.fields.priority') }}</option>
              <option v-for="priority in priorityOptions" :key="priority" :value="priority">
                {{ $t(`issues.priority.${priority}`) }}
              </option>
            </select>

            <select v-model="filters.category" class="form-input text-sm" @change="loadIssues(1)">
              <option value="">{{ $t('issues.fields.category') }}</option>
              <option v-for="category in categoryOptions" :key="category" :value="category">
                {{ $t(`issues.category.${category}`) }}
              </option>
            </select>

            <!-- Show Resolved Toggle -->
            <button
              type="button"
              class="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors whitespace-nowrap"
              :class="
                showResolved
                  ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600'
                  : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              "
              @click="toggleShowResolved"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  v-if="showResolved"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  v-if="showResolved"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
                <path
                  v-else
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
              {{
                showResolved ? $t('issues.filters.hideResolved') : $t('issues.filters.showResolved')
              }}
            </button>

            <!-- Show Deleted Toggle -->
            <button
              type="button"
              class="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors whitespace-nowrap"
              :class="
                showDeleted
                  ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-600'
                  : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              "
              @click="toggleShowDeleted"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {{ $t('issues.filters.showDeleted') }}
            </button>

            <!-- New Issue Button -->
            <button
              class="btn-primary flex items-center whitespace-nowrap"
              @click="openCreateModal"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
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
          :data="sortedIssues"
          :loading="loading"
          :page="pagination.page"
          :per-page="pagination.limit"
          :total="pagination.total"
          :sort-key="sortState.key"
          :sort-order="sortState.order"
          @page-change="handlePageChange"
          @sort="handleSort"
        >
          <!-- Issue Number & Title -->
          <template #cell-title="{ row }">
            <router-link
              :to="`/issues/${row._id}`"
              class="block hover:text-purple-600 dark:hover:text-purple-400"
            >
              <span class="text-xs text-gray-500 dark:text-slate-400 font-mono">{{
                row.issueNumber
              }}</span>
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
              <span class="text-sm text-gray-600 dark:text-slate-300">{{
                row.reporter?.name
              }}</span>
            </div>
          </template>

          <!-- Assignees (Multi) -->
          <template #cell-assignees="{ row }">
            <div v-if="row.assignees?.length > 0" class="flex items-center -space-x-1">
              <div
                v-for="assignee in row.assignees.slice(0, 3)"
                :key="assignee._id"
                class="w-6 h-6 rounded-full bg-purple-200 dark:bg-purple-900/50 flex items-center justify-center text-xs font-medium text-purple-700 dark:text-purple-300 ring-2 ring-white dark:ring-slate-800"
                :title="assignee.name"
              >
                {{ assignee.name?.charAt(0)?.toUpperCase() }}
              </div>
              <div
                v-if="row.assignees.length > 3"
                class="w-6 h-6 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-800"
                :title="`+${row.assignees.length - 3} more`"
              >
                +{{ row.assignees.length - 3 }}
              </div>
            </div>
            <span v-else class="text-sm text-gray-400 dark:text-slate-500">-</span>
          </template>

          <!-- Last Comment -->
          <template #cell-lastComment="{ row }">
            <div v-if="row.lastComment?.user" class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-900/50 flex items-center justify-center text-xs font-medium text-blue-700 dark:text-blue-300"
              >
                {{ row.lastComment.user?.name?.charAt(0)?.toUpperCase() || '?' }}
              </div>
              <span class="text-sm text-gray-600 dark:text-slate-300">{{
                row.lastComment.user?.name
              }}</span>
            </div>
            <span v-else class="text-sm text-gray-400 dark:text-slate-500">-</span>
          </template>

          <!-- Attachments -->
          <template #cell-attachments="{ row }">
            <span
              class="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400"
              :title="$t('issues.attachments')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              {{ row.attachments?.length || 0 }}
            </span>
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
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </router-link>
              <!-- Pin button -->
              <button
                v-if="!row.isDeleted"
                class="p-2 rounded-lg transition-colors"
                :class="
                  row.isPinned
                    ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-600 dark:hover:text-gray-300'
                "
                :title="row.isPinned ? $t('issues.actions.unpin') : $t('issues.actions.pin')"
                @click="handleTogglePin(row)"
              >
                <svg
                  class="w-4 h-4"
                  :fill="row.isPinned ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>
              <!-- Delete button (only for reporter) -->
              <button
                v-if="canDeleteIssue(row) && !row.isDeleted"
                class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                :title="$t('common.delete')"
                @click="confirmDeleteIssue(row)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <!-- Deleted badge + Restore button -->
              <template v-if="row.isDeleted">
                <span
                  class="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded"
                >
                  {{ $t('issues.status.deleted') }}
                </span>
                <button
                  v-if="isAdmin"
                  class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  :title="$t('issues.actions.restore')"
                  @click="handleRestoreIssue(row)"
                >
                  <span class="material-icons text-base">restore</span>
                </button>
              </template>
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

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      :title="$t('issues.actions.delete')"
      :message="$t('issues.messages.deleteConfirm')"
      variant="danger"
      @confirm="handleDeleteIssue"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { usePermissions } from '@/composables/usePermissions'
import { useAuthStore } from '@/stores/auth'
import DataTable from '@/components/ui/data/DataTable.vue'
import { ConfirmDialog } from '@/components/ui'
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
const { executeWithPermission } = usePermissions()
const authStore = useAuthStore()

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
const showResolved = ref(false)
const showDeleted = ref(false)
const showDeleteConfirm = ref(false)
const selectedIssue = ref(null)

// Filters
const filters = reactive({
  search: '',
  status: '',
  priority: '',
  category: ''
})

// Toggle show resolved
const toggleShowResolved = () => {
  showResolved.value = !showResolved.value
  loadIssues(1)
}

// Toggle show deleted
const toggleShowDeleted = () => {
  showDeleted.value = !showDeleted.value
  loadIssues(1)
}

// Admin check for restore functionality
const isAdmin = computed(() => authStore.user?.role === 'admin')

// Check if current user can delete issue (reporter or admin)
const canDeleteIssue = issue => {
  const currentUserId = authStore.user?._id
  const isReporter = issue.reporter?._id === currentUserId
  return isReporter || isAdmin.value
}

// Confirm delete issue
const confirmDeleteIssue = issue => {
  selectedIssue.value = issue
  showDeleteConfirm.value = true
}

// Handle delete issue
const handleDeleteIssue = async () => {
  if (!selectedIssue.value) return

  try {
    await issueService.deleteIssue(selectedIssue.value._id)
    toast.success(t('issues.messages.deleted'))
    loadIssues()
    loadStats()
  } catch (error) {
    toast.error(t('common.error'))
    console.error('Failed to delete issue:', error)
  } finally {
    selectedIssue.value = null
  }
}

// Handle restore issue (admin only)
const handleRestoreIssue = async issue => {
  try {
    await issueService.restoreIssue(issue._id)
    toast.success(t('issues.messages.restored'))
    loadIssues()
    loadStats()
  } catch (error) {
    toast.error(t('common.error'))
    console.error('Failed to restore issue:', error)
  }
}

// Handle toggle pin
const handleTogglePin = async issue => {
  try {
    const { data } = await issueService.togglePin(issue._id)
    issue.isPinned = data.isPinned
    toast.success(t(data.isPinned ? 'issues.messages.pinned' : 'issues.messages.unpinned'))
    loadIssues()
  } catch (error) {
    toast.error(t('common.error'))
    console.error('Failed to toggle pin:', error)
  }
}

// Open create modal with permission check
const openCreateModal = () => {
  executeWithPermission('issues', 'create', () => {
    showCreateModal.value = true
  })
}

// Options
const statusOptions = ['open', 'in_progress', 'resolved', 'closed', 'reopened']
const priorityOptions = ['low', 'medium', 'high', 'critical']
const categoryOptions = ['bug', 'feature', 'improvement', 'question', 'task', 'other']

// Sort state
const sortState = ref({
  key: '',
  order: 'asc'
})

// Table columns
const columns = computed(() => [
  { key: 'title', label: t('issues.fields.title'), sortable: true },
  { key: 'status', label: t('issues.fields.status'), sortable: true },
  { key: 'priority', label: t('issues.fields.priority'), sortable: true },
  { key: 'category', label: t('issues.fields.category'), sortable: true },
  { key: 'reporter', label: t('issues.fields.reporter') },
  { key: 'assignees', label: t('issues.fields.assignees') },
  {
    key: 'lastComment',
    label: t('issues.fields.lastComment'),
    sortable: true,
    sortKey: 'lastCommentTime'
  },
  { key: 'attachments', label: '', width: '60px' },
  { key: 'createdAt', label: t('issues.fields.createdAt'), sortable: true }
])

// Load issues
const loadIssues = async (page = 1) => {
  loading.value = true
  try {
    const params = {
      page,
      limit: pagination.value.limit
    }

    // Add filters explicitly (reactive proxy spread issue)
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.priority) params.priority = filters.priority
    if (filters.category) params.category = filters.category

    // Hide resolved issues by default
    if (!showResolved.value) {
      params.hideResolved = true
    }

    // Show deleted issues
    if (showDeleted.value) {
      params.showDeleted = true
    }

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
const handlePageChange = ({ page }) => {
  loadIssues(page)
}

// Handle sort - for lastComment we sort by createdAt timestamp, not by user name
const handleSort = ({ key, order }) => {
  // Find the column to get its sortKey if it has one
  const column = columns.value.find(col => col.key === key)
  const actualSortKey = column?.sortKey || key

  sortState.value = { key, order }

  // For now, we do frontend sorting since backend might not support all sort keys
  // If backend supports sorting, uncomment and modify loadIssues to pass sort params
}

// Sorted issues - applies frontend sorting when needed
const sortedIssues = computed(() => {
  if (!sortState.value.key || !issues.value.length) {
    return issues.value
  }

  const column = columns.value.find(col => col.key === sortState.value.key)
  const sortKey = column?.sortKey || sortState.value.key
  const order = sortState.value.order

  // Create a copy to avoid mutating original
  const sorted = [...issues.value]

  sorted.sort((a, b) => {
    let aVal, bVal

    // Handle special sort keys
    if (sortKey === 'lastCommentTime') {
      // Sort by the last comment's createdAt timestamp
      aVal = a.lastComment?.createdAt ? new Date(a.lastComment.createdAt).getTime() : 0
      bVal = b.lastComment?.createdAt ? new Date(b.lastComment.createdAt).getTime() : 0
    } else if (sortKey.includes('.')) {
      // Handle nested keys like 'reporter.name'
      aVal = sortKey.split('.').reduce((obj, k) => obj?.[k], a)
      bVal = sortKey.split('.').reduce((obj, k) => obj?.[k], b)
    } else {
      aVal = a[sortKey]
      bVal = b[sortKey]
    }

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return order === 'asc' ? 1 : -1
    if (bVal == null) return order === 'asc' ? -1 : 1

    // Compare
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const comparison = aVal.localeCompare(bVal, 'tr')
      return order === 'asc' ? comparison : -comparison
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })

  return sorted
})

// Handle issue created
const handleIssueCreated = issue => {
  toast.success(t('issues.messages.created'))
  loadIssues(1)
  loadStats()
}

// Format date
const formatDate = date => {
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
