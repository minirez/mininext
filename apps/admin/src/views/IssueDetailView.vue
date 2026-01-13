<template>
  <div v-if="loading" class="flex items-center justify-center h-64">
    <div class="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
  </div>

  <div v-else-if="issue" class="space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-sm text-gray-500 dark:text-slate-400 font-mono">{{ issue.issueNumber }}</span>
            <span
              class="badge"
              :class="statusClass"
            >
              {{ $t(`issues.status.${issue.status}`) }}
            </span>
            <span
              class="inline-flex items-center gap-1 text-sm"
              :class="priorityClass"
            >
              <span class="w-2 h-2 rounded-full" :class="priorityDotClass" />
              {{ $t(`issues.priority.${issue.priority}`) }}
            </span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{{ issue.title }}</h1>
          <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
            <span>{{ $t('issues.fields.category') }}: {{ $t(`issues.category.${issue.category}`) }}</span>
            <span>{{ formatDate(issue.createdAt) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            class="btn-secondary flex items-center gap-2"
            :class="{ 'text-yellow-600': isWatching }"
            @click="toggleWatch"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="isWatching" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {{ isWatching ? $t('issues.actions.unwatch') : $t('issues.actions.watch') }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Description -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{{ $t('issues.fields.description') }}</h2>
          <div class="prose dark:prose-invert max-w-none" v-html="renderedDescription" />
        </div>

        <!-- Attachments -->
        <div v-if="issue.attachments?.length > 0" class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ $t('issues.attachments') }} ({{ issue.attachments.length }})
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="attachment in issue.attachments"
              :key="attachment._id"
              class="group relative bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden"
            >
              <img
                v-if="isImage(attachment.mimeType)"
                :src="getFileUrl(attachment.url)"
                :alt="attachment.originalName"
                class="w-full h-24 object-cover cursor-pointer"
                @click="openImage(getFileUrl(attachment.url))"
              />
              <div
                v-else
                class="w-full h-24 flex items-center justify-center cursor-pointer"
                @click="downloadFile(getFileUrl(attachment.url), attachment.originalName)"
              >
                <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-xs text-gray-600 dark:text-slate-300 p-2 truncate">{{ attachment.originalName }}</p>
              <button
                class="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                @click="confirmDeleteAttachment(attachment)"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Upload More -->
          <div class="mt-4">
            <label
              class="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-purple-400 transition-colors"
            >
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span class="text-sm text-gray-500 dark:text-slate-400">{{ $t('issues.actions.uploadFile') }}</span>
              <input type="file" class="hidden" accept="image/*,.pdf" @change="handleFileUpload" />
            </label>
          </div>
        </div>

        <!-- Comments -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ $t('issues.comments.title') }} ({{ issue.comments?.length || 0 }})
          </h2>

          <!-- Comment List -->
          <div class="space-y-4 mb-6">
            <div
              v-for="comment in issue.comments"
              :key="comment._id"
              class="flex gap-3"
            >
              <div v-if="getUserAvatarUrl(comment.author)" class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <img :src="getUserAvatarUrl(comment.author)" :alt="comment.author?.name" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-8 h-8 rounded-full bg-purple-200 dark:bg-purple-900/50 flex items-center justify-center text-sm font-medium text-purple-700 dark:text-purple-300 flex-shrink-0">
                {{ comment.author?.name?.charAt(0)?.toUpperCase() }}
              </div>
              <div class="flex-1 bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900 dark:text-white">{{ comment.author?.name }}</span>
                    <span class="text-xs text-gray-500 dark:text-slate-400">{{ formatDateTime(comment.createdAt) }}</span>
                    <span v-if="comment.isEdited" class="text-xs text-gray-400 dark:text-slate-500">({{ $t('issues.comments.edited') }})</span>
                  </div>
                  <div v-if="canEditComment(comment)" class="flex items-center gap-1">
                    <button
                      class="p-1 text-gray-400 hover:text-blue-500"
                      @click="startEditComment(comment)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      class="p-1 text-gray-400 hover:text-red-500"
                      @click="confirmDeleteComment(comment)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{{ comment.content }}</div>
              </div>
            </div>

            <p v-if="!issue.comments?.length" class="text-center text-gray-500 dark:text-slate-400 py-4">
              {{ $t('issues.comments.noComments') }}
            </p>
          </div>

          <!-- New Comment -->
          <div class="flex gap-3">
            <div v-if="getUserAvatarUrl(currentUser)" class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <img :src="getUserAvatarUrl(currentUser)" :alt="currentUser?.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
              {{ currentUser?.name?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="flex-1">
              <textarea
                v-model="newComment"
                class="form-input w-full min-h-[80px]"
                :placeholder="$t('issues.comments.placeholder')"
                @keydown.ctrl.enter="submitComment"
              />
              <div class="flex justify-end mt-2">
                <button
                  class="btn-primary"
                  :disabled="!newComment.trim() || submittingComment"
                  @click="submitComment"
                >
                  {{ $t('issues.actions.addComment') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity Timeline -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{{ $t('issues.activity.title') }}</h2>
          <div class="space-y-4">
            <div
              v-for="activity in issue.activity"
              :key="activity._id"
              class="flex gap-3"
            >
              <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-700 dark:text-slate-300">
                  <span class="font-medium">{{ activity.user?.name }}</span>
                  {{ $t(`issues.activity.${activity.action}`) }}
                  <span v-if="activity.details?.from && activity.details?.to" class="text-gray-500 dark:text-slate-400">
                    ({{ activity.details.from }} → {{ activity.details.to }})
                  </span>
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">{{ formatDateTime(activity.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Status Change -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">{{ $t('issues.fields.status') }}</h3>
          <select
            v-model="issue.status"
            class="form-input w-full mb-3"
            @change="handleStatusChange"
          >
            <option value="open">{{ $t('issues.status.open') }}</option>
            <option value="in_progress">{{ $t('issues.status.in_progress') }}</option>
            <option value="resolved">{{ $t('issues.status.resolved') }}</option>
            <option value="closed">{{ $t('issues.status.closed') }}</option>
            <option value="reopened">{{ $t('issues.status.reopened') }}</option>
          </select>

          <!-- Quick Actions -->
          <div class="flex flex-col gap-2">
            <button
              v-if="issue.status !== 'resolved'"
              class="btn-success w-full text-sm"
              @click="quickResolve"
            >
              {{ $t('issues.actions.resolve') }}
            </button>
            <button
              v-if="issue.status !== 'closed'"
              class="btn-secondary w-full text-sm"
              @click="quickClose"
            >
              {{ $t('issues.actions.close') }}
            </button>
            <button
              v-if="issue.status === 'closed' || issue.status === 'resolved'"
              class="btn-warning w-full text-sm"
              @click="quickReopen"
            >
              {{ $t('issues.actions.reopen') }}
            </button>
          </div>
        </div>

        <!-- Assignee -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">{{ $t('issues.fields.assignee') }}</h3>
          <select
            v-model="selectedAssignee"
            class="form-input w-full"
            @change="handleAssigneeChange"
          >
            <option value="">{{ $t('issues.placeholders.selectAssignee') }}</option>
            <option v-for="user in platformUsers" :key="user._id" :value="user._id">
              {{ user.name }}
            </option>
          </select>
          <div v-if="issue.assignee" class="flex items-center gap-2 mt-3">
            <div v-if="getUserAvatarUrl(issue.assignee)" class="w-8 h-8 rounded-full overflow-hidden">
              <img :src="getUserAvatarUrl(issue.assignee)" :alt="issue.assignee?.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-8 h-8 rounded-full bg-purple-200 dark:bg-purple-900/50 flex items-center justify-center text-sm font-medium text-purple-700 dark:text-purple-300">
              {{ issue.assignee?.name?.charAt(0)?.toUpperCase() }}
            </div>
            <span class="text-sm text-gray-700 dark:text-slate-300">{{ issue.assignee?.name }}</span>
          </div>
        </div>

        <!-- Reporter -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">{{ $t('issues.fields.reporter') }}</h3>
          <div class="flex items-center gap-2">
            <div v-if="getUserAvatarUrl(issue.reporter)" class="w-8 h-8 rounded-full overflow-hidden">
              <img :src="getUserAvatarUrl(issue.reporter)" :alt="issue.reporter?.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-sm font-medium">
              {{ issue.reporter?.name?.charAt(0)?.toUpperCase() }}
            </div>
            <span class="text-sm text-gray-700 dark:text-slate-300">{{ issue.reporter?.name }}</span>
          </div>
        </div>

        <!-- Labels -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">{{ $t('issues.fields.labels') }}</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="label in issue.labels"
              :key="label"
              class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs"
            >
              {{ label }}
            </span>
            <span v-if="!issue.labels?.length" class="text-sm text-gray-400 dark:text-slate-500">-</span>
          </div>
        </div>

        <!-- Due Date -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">{{ $t('issues.fields.dueDate') }}</h3>
          <p class="text-sm text-gray-700 dark:text-slate-300">
            {{ issue.dueDate ? formatDate(issue.dueDate) : '-' }}
          </p>
        </div>

        <!-- Watchers -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">{{ $t('issues.fields.watchers') }}</h3>
          <div class="flex flex-wrap gap-2">
            <template v-for="watcher in issue.watchers" :key="watcher._id">
              <div
                v-if="getUserAvatarUrl(watcher)"
                class="w-8 h-8 rounded-full overflow-hidden"
                :title="watcher.name"
              >
                <img :src="getUserAvatarUrl(watcher)" :alt="watcher.name" class="w-full h-full object-cover" />
              </div>
              <div
                v-else
                class="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-xs font-medium"
                :title="watcher.name"
              >
                {{ watcher.name?.charAt(0)?.toUpperCase() }}
              </div>
            </template>
            <span v-if="!issue.watchers?.length" class="text-sm text-gray-400 dark:text-slate-500">-</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Lightbox -->
    <div
      v-if="lightboxImage"
      class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
      @click="lightboxImage = null"
    >
      <img :src="lightboxImage" class="max-w-full max-h-full object-contain" />
      <button class="absolute top-4 right-4 text-white p-2" @click="lightboxImage = null">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>

  <div v-else class="text-center py-12">
    <p class="text-gray-500 dark:text-slate-400">Issue not found</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import issueService from '@/services/issueService'

// API base URL for file access
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
const fileBaseUrl = apiBaseUrl.replace('/api', '')

// Get full URL for attachment
const getFileUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${fileBaseUrl}${url}`
}

// Simple markdown renderer (basic formatting without external dependency)
const simpleMarkdown = (text) => {
  if (!text) return ''
  return text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code `text`
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-slate-700 px-1 rounded text-sm">$1</code>')
    // Links [text](url)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br>')
}

const route = useRoute()
const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

// State
const loading = ref(true)
const issue = ref(null)
const platformUsers = ref([])
const newComment = ref('')
const submittingComment = ref(false)
const selectedAssignee = ref('')
const lightboxImage = ref(null)

// Current user
const currentUser = computed(() => authStore.user)

// Avatar URL helper (reuses fileBaseUrl already defined above)
const getUserAvatarUrl = (user) => {
  if (!user?.avatar?.url) return null
  if (user.avatar.url.startsWith('http')) return user.avatar.url
  return `${fileBaseUrl}${user.avatar.url}`
}

// Is watching
const isWatching = computed(() => {
  const userId = currentUser.value?.id || currentUser.value?._id
  if (!issue.value?.watchers || !userId) return false
  return issue.value.watchers.some(w => {
    const watcherId = w._id?.toString() || w.toString()
    return watcherId === userId.toString()
  })
})

// Status class
const statusClass = computed(() => ({
  'badge-info': issue.value?.status === 'open',
  'badge-primary': issue.value?.status === 'in_progress',
  'badge-success': issue.value?.status === 'resolved',
  'badge-secondary': issue.value?.status === 'closed',
  'badge-warning': issue.value?.status === 'reopened'
}))

// Priority class
const priorityClass = computed(() => ({
  'text-gray-500 dark:text-slate-400': issue.value?.priority === 'low',
  'text-blue-600 dark:text-blue-400': issue.value?.priority === 'medium',
  'text-orange-600 dark:text-orange-400': issue.value?.priority === 'high',
  'text-red-600 dark:text-red-400': issue.value?.priority === 'critical'
}))

// Priority dot class
const priorityDotClass = computed(() => ({
  'bg-gray-400': issue.value?.priority === 'low',
  'bg-blue-500': issue.value?.priority === 'medium',
  'bg-orange-500': issue.value?.priority === 'high',
  'bg-red-500': issue.value?.priority === 'critical'
}))

// Rendered description
const renderedDescription = computed(() => {
  if (!issue.value?.description) return ''
  return simpleMarkdown(issue.value.description)
})

// Load issue
const loadIssue = async () => {
  loading.value = true
  try {
    const { data } = await issueService.getIssue(route.params.id)
    issue.value = data
    selectedAssignee.value = data.assignee?._id || ''
  } catch (error) {
    toast.error(t('common.error'))
    console.error('Failed to load issue:', error)
  } finally {
    loading.value = false
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

// Toggle watch
const toggleWatch = async () => {
  try {
    const wasWatching = isWatching.value
    await issueService.toggleWatch(issue.value._id)
    await loadIssue()
    toast.success(wasWatching ? t('issues.messages.watchingDisabled') : t('issues.messages.watchingEnabled'))
  } catch (error) {
    toast.error(t('common.error'))
  }
}

// Handle status change
const handleStatusChange = async () => {
  try {
    await issueService.changeStatus(issue.value._id, issue.value.status)
    await loadIssue()
    toast.success(t('issues.messages.statusChanged'))
  } catch (error) {
    toast.error(t('common.error'))
    await loadIssue() // Revert
  }
}

// Quick actions
const quickResolve = async () => {
  try {
    await issueService.changeStatus(issue.value._id, 'resolved')
    await loadIssue()
    toast.success(t('issues.messages.statusChanged'))
  } catch (error) {
    toast.error(t('common.error'))
  }
}

const quickClose = async () => {
  try {
    await issueService.changeStatus(issue.value._id, 'closed')
    await loadIssue()
    toast.success(t('issues.messages.statusChanged'))
  } catch (error) {
    toast.error(t('common.error'))
  }
}

const quickReopen = async () => {
  try {
    await issueService.changeStatus(issue.value._id, 'reopened')
    await loadIssue()
    toast.success(t('issues.messages.statusChanged'))
  } catch (error) {
    toast.error(t('common.error'))
  }
}

// Handle assignee change
const handleAssigneeChange = async () => {
  try {
    await issueService.assignIssue(issue.value._id, selectedAssignee.value || null)
    await loadIssue()
    toast.success(t('issues.messages.assigned'))
  } catch (error) {
    toast.error(t('common.error'))
  }
}

// Submit comment
const submitComment = async () => {
  if (!newComment.value.trim()) return

  submittingComment.value = true
  try {
    await issueService.addComment(issue.value._id, newComment.value)
    newComment.value = ''
    await loadIssue()
    toast.success(t('issues.messages.commentAdded'))
  } catch (error) {
    toast.error(t('common.error'))
  } finally {
    submittingComment.value = false
  }
}

// Can edit comment
const canEditComment = (comment) => {
  const userId = currentUser.value?.id || currentUser.value?._id
  return comment.author?._id === userId || currentUser.value?.role === 'admin'
}

// Start edit comment
const startEditComment = (comment) => {
  // TODO: Implement inline editing
  console.log('Edit comment:', comment)
}

// Confirm delete comment
const confirmDeleteComment = async (comment) => {
  if (!confirm(t('issues.confirmations.deleteComment'))) return

  try {
    await issueService.deleteComment(issue.value._id, comment._id)
    await loadIssue()
    toast.success(t('issues.messages.commentDeleted'))
  } catch (error) {
    toast.error(t('common.error'))
  }
}

// Handle file upload
const handleFileUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  try {
    await issueService.uploadAttachment(issue.value._id, file)
    await loadIssue()
    toast.success(t('issues.messages.fileUploaded'))
  } catch (error) {
    toast.error(t('common.error'))
  }
}

// Confirm delete attachment
const confirmDeleteAttachment = async (attachment) => {
  if (!confirm(t('common.confirmDelete'))) return

  try {
    await issueService.deleteAttachment(issue.value._id, attachment._id)
    await loadIssue()
    toast.success(t('issues.messages.fileDeleted'))
  } catch (error) {
    toast.error(t('common.error'))
  }
}

// Is image
const isImage = (mimeType) => {
  return mimeType?.startsWith('image/')
}

// Open image
const openImage = (url) => {
  lightboxImage.value = url
}

// Download file
const downloadFile = (url, filename) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
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

// Format datetime
const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Init
onMounted(() => {
  loadIssue()
  loadPlatformUsers()
})
</script>
