<template>
  <div class="h-[calc(100vh-64px)] flex flex-col">
    <!-- Toolbar -->
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0"
    >
      <div class="flex items-center gap-3 flex-1">
        <!-- Search -->
        <div class="relative flex-1 max-w-md">
          <span
            class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"
          >
            search
          </span>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('mailbox.search')"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @input="debouncedSearch"
          />
        </div>

        <!-- Status Filters -->
        <div class="flex items-center gap-1">
          <button
            v-for="f in statusFilters"
            :key="f.value"
            class="px-3 py-1.5 text-sm rounded-lg transition-colors"
            :class="
              activeFilter === f.value
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            "
            @click="setFilter(f.value)"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 ml-4">
        <!-- Stats -->
        <div
          v-if="stats"
          class="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400 mr-2"
        >
          <span v-if="stats.unread" class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            {{ stats.unread }} {{ $t('mailbox.unread') }}
          </span>
          <span>{{ stats.total }} {{ $t('mailbox.stats.total') }}</span>
        </div>

        <!-- Compose Button -->
        <button
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          @click="openCompose"
        >
          <span class="material-icons text-lg">edit</span>
          <span class="hidden sm:inline">{{ $t('mailbox.compose') }}</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Email List (Left Panel) -->
      <div
        class="border-r border-gray-200 dark:border-slate-700 overflow-y-auto flex-shrink-0 bg-white dark:bg-slate-800"
        :class="selectedEmail && isMobile ? 'hidden' : 'w-full lg:w-[380px]'"
      >
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <span class="material-icons animate-spin text-blue-500 text-3xl">autorenew</span>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!emails.length"
          class="flex flex-col items-center justify-center py-16 px-4 text-center"
        >
          <span class="material-icons text-5xl text-gray-300 dark:text-slate-600 mb-3">inbox</span>
          <p class="text-gray-500 dark:text-slate-400 font-medium">
            {{ emptyMessage }}
          </p>
        </div>

        <!-- Email Items -->
        <div v-else>
          <div
            v-for="email in emails"
            :key="email._id"
            class="flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 cursor-pointer transition-colors"
            :class="[
              selectedEmail?._id === email._id
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 border-l-2 border-l-transparent',
              email.status === 'unread' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
            ]"
            @click="selectEmail(email)"
          >
            <!-- Star -->
            <button class="flex-shrink-0 mt-0.5" @click.stop="handleToggleStar(email)">
              <span
                class="material-icons text-lg"
                :class="
                  email.isStarred
                    ? 'text-yellow-500'
                    : 'text-gray-300 dark:text-slate-600 hover:text-yellow-400'
                "
              >
                {{ email.isStarred ? 'star' : 'star_border' }}
              </span>
            </button>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <span
                  class="text-sm truncate"
                  :class="
                    email.status === 'unread'
                      ? 'font-semibold text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-slate-300'
                  "
                >
                  {{
                    email.direction === 'outbound'
                      ? `→ ${email.to?.[0] || ''}`
                      : email.from?.name || email.from?.address
                  }}
                </span>
                <span class="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0 ml-2">
                  {{ formatDate(email.receivedAt) }}
                </span>
              </div>
              <p
                class="text-sm truncate mb-0.5"
                :class="
                  email.status === 'unread'
                    ? 'font-medium text-gray-800 dark:text-slate-200'
                    : 'text-gray-600 dark:text-slate-400'
                "
              >
                {{ email.subject }}
              </p>
              <p class="text-xs text-gray-400 dark:text-slate-500 truncate">
                {{ email.snippet }}
              </p>

              <!-- Badges -->
              <div class="flex items-center gap-1.5 mt-1">
                <span
                  v-if="email.status === 'unread'"
                  class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"
                ></span>
                <span
                  v-if="email.direction === 'outbound'"
                  class="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded font-medium"
                >
                  {{ $t('mailbox.outbound') }}
                </span>
                <span v-if="email.attachments?.length" class="material-icons text-xs text-gray-400">
                  attach_file
                </span>
              </div>
            </div>
          </div>

          <!-- Load More -->
          <div v-if="pagination && pagination.page < pagination.pages" class="p-4 text-center">
            <button
              class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              @click="loadMore"
            >
              {{ $t('common.loadMore') || 'Daha Fazla' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Email Detail (Right Panel) -->
      <div
        class="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900"
        :class="!selectedEmail && isMobile ? 'hidden' : ''"
      >
        <!-- No Selection -->
        <div
          v-if="!selectedEmail"
          class="flex flex-col items-center justify-center h-full text-center"
        >
          <span class="material-icons text-6xl text-gray-200 dark:text-slate-700 mb-4">
            mail_outline
          </span>
          <p class="text-gray-500 dark:text-slate-400 font-medium">
            {{ $t('mailbox.noSelection') }}
          </p>
          <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">
            {{ $t('mailbox.noSelectionDesc') }}
          </p>
        </div>

        <!-- Email Detail Content -->
        <div v-else class="max-w-4xl mx-auto">
          <!-- Mobile Back Button -->
          <button
            v-if="isMobile"
            class="flex items-center gap-1 px-4 py-2 text-sm text-blue-600 dark:text-blue-400"
            @click="selectedEmail = null"
          >
            <span class="material-icons text-lg">arrow_back</span>
            {{ $t('mailbox.inbox') }}
          </button>

          <!-- Header -->
          <div
            class="px-6 py-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700"
          >
            <div class="flex items-start justify-between mb-3">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                {{ selectedEmail.subject }}
              </h2>
              <div class="flex items-center gap-1 flex-shrink-0 ml-4">
                <button
                  class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
                  :title="selectedEmail.isStarred ? $t('mailbox.unstar') : $t('mailbox.star')"
                  @click="handleToggleStar(selectedEmail)"
                >
                  <span
                    class="material-icons text-lg"
                    :class="selectedEmail.isStarred ? 'text-yellow-500' : ''"
                  >
                    {{ selectedEmail.isStarred ? 'star' : 'star_border' }}
                  </span>
                </button>
                <button
                  class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
                  :title="$t('mailbox.archive')"
                  @click="handleArchive(selectedEmail._id)"
                >
                  <span class="material-icons text-lg">archive</span>
                </button>
                <button
                  class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
                  :title="
                    selectedEmail.status === 'read'
                      ? $t('mailbox.markUnread')
                      : $t('mailbox.markRead')
                  "
                  @click="handleToggleReadStatus(selectedEmail)"
                >
                  <span class="material-icons text-lg">
                    {{
                      selectedEmail.status === 'unread' ? 'mark_email_read' : 'mark_email_unread'
                    }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Sender Info -->
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                :style="{ backgroundColor: getAvatarColor(selectedEmail.from?.address) }"
              >
                {{ getInitials(selectedEmail.from?.name || selectedEmail.from?.address) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900 dark:text-white text-sm">
                    {{ selectedEmail.from?.name || selectedEmail.from?.address }}
                  </span>
                  <span
                    v-if="selectedEmail.direction === 'outbound'"
                    class="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded font-medium"
                  >
                    {{ $t('mailbox.outbound') }}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                  <span>{{ selectedEmail.from?.address }}</span>
                  <span>·</span>
                  <span>{{ formatFullDate(selectedEmail.receivedAt) }}</span>
                </div>
                <div
                  v-if="selectedEmail.to?.length"
                  class="text-xs text-gray-400 dark:text-slate-500 mt-0.5"
                >
                  {{ $t('mailbox.to') }}: {{ selectedEmail.to.join(', ') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Thread Messages -->
          <div v-if="threadEmails.length > 1" class="px-6 py-2">
            <button
              class="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              @click="showThread = !showThread"
            >
              <span class="material-icons text-sm">
                {{ showThread ? 'expand_less' : 'expand_more' }}
              </span>
              {{ showThread ? $t('mailbox.hideThread') : $t('mailbox.showThread') }}
              ({{ threadEmails.length }})
            </button>

            <div v-if="showThread" class="mt-2 space-y-3">
              <div
                v-for="tEmail in threadEmails"
                :key="tEmail._id"
                class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
                :class="
                  tEmail._id === selectedEmail._id
                    ? 'ring-2 ring-blue-500'
                    : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-750'
                "
                @click="tEmail._id !== selectedEmail._id && selectEmailDirect(tEmail)"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ tEmail.from?.name || tEmail.from?.address }}
                    </span>
                    <span
                      v-if="tEmail.direction === 'outbound'"
                      class="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded font-medium"
                    >
                      {{ $t('mailbox.outbound') }}
                    </span>
                  </div>
                  <span class="text-xs text-gray-400 dark:text-slate-500">
                    {{ formatFullDate(tEmail.receivedAt) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-slate-400 line-clamp-2">
                  {{ tEmail.snippet }}
                </p>
              </div>
            </div>
          </div>

          <!-- Email Body -->
          <div class="px-6 py-4">
            <div
              class="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 shadow-sm"
            >
              <div
                v-if="selectedEmail.htmlBody"
                class="prose prose-sm dark:prose-invert max-w-none email-body"
                v-html="sanitizedHtml"
              ></div>
              <pre
                v-else-if="selectedEmail.textBody"
                class="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap font-sans"
                >{{ selectedEmail.textBody }}</pre
              >
            </div>

            <!-- Attachments -->
            <div
              v-if="selectedEmail.attachments?.length"
              class="mt-4 bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700 shadow-sm"
            >
              <h4
                class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-1"
              >
                <span class="material-icons text-lg">attach_file</span>
                {{ $t('mailbox.attachments') }} ({{ selectedEmail.attachments.length }})
              </h4>
              <div class="flex flex-wrap gap-2">
                <a
                  v-for="(att, idx) in selectedEmail.attachments"
                  :key="idx"
                  :href="`${apiBaseUrl}/mailbox/${selectedEmail._id}/attachments/${idx}`"
                  target="_blank"
                  class="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors text-sm border border-gray-200 dark:border-slate-600"
                >
                  <span class="material-icons text-base text-blue-500">insert_drive_file</span>
                  <span class="text-gray-700 dark:text-slate-300">{{ att.filename }}</span>
                  <span class="text-xs text-gray-400">({{ formatFileSize(att.size) }})</span>
                </a>
              </div>
            </div>

            <!-- Reply Box -->
            <div
              v-if="selectedEmail.direction === 'inbound'"
              class="mt-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden"
            >
              <div
                class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50"
              >
                <span class="material-icons text-blue-500 text-lg">reply</span>
                <span class="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {{ $t('mailbox.replyTitle') }}: {{ selectedEmail.from?.address }}
                </span>
              </div>
              <div class="p-4">
                <TinyMCE v-model="replyBody" :height="250" />
                <div class="flex items-center justify-end gap-2 mt-3">
                  <button
                    class="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    @click="replyBody = ''"
                  >
                    {{ $t('mailbox.cancel') }}
                  </button>
                  <button
                    class="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                    :disabled="!hasReplyContent || replySending"
                    @click="handleReply"
                  >
                    <span v-if="replySending" class="material-icons animate-spin text-sm"
                      >autorenew</span
                    >
                    <span class="material-icons text-sm" v-else>send</span>
                    {{ replySending ? $t('mailbox.sending') : $t('mailbox.send') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Compose Modal -->
    <div
      v-if="showCompose"
      class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      @click.self="showCompose = false"
    >
      <div
        class="bg-white dark:bg-slate-800 w-full sm:max-w-3xl sm:rounded-xl rounded-t-xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 sm:rounded-t-xl"
        >
          <div class="flex items-center gap-2">
            <span class="material-icons text-blue-500">edit</span>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t('mailbox.composeTitle') }}
            </h3>
          </div>
          <button
            class="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-500 transition-colors"
            @click="showCompose = false"
          >
            <span class="material-icons">close</span>
          </button>
        </div>

        <!-- Form -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('mailbox.to') }} *
              </label>
              <input
                v-model="composeForm.to"
                type="email"
                class="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('mailbox.cc') }}
              </label>
              <input
                v-model="composeForm.cc"
                type="text"
                class="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="cc1@example.com, cc2@example.com"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('mailbox.subject') }} *
            </label>
            <input
              v-model="composeForm.subject"
              type="text"
              class="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('mailbox.message') }} *
            </label>
            <TinyMCE v-model="composeForm.body" :height="350" />
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-slate-700"
        >
          <button
            class="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            @click="showCompose = false"
          >
            {{ $t('mailbox.cancel') }}
          </button>
          <button
            class="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
            :disabled="!canSendCompose || composeSending"
            @click="handleCompose"
          >
            <span v-if="composeSending" class="material-icons animate-spin text-sm">autorenew</span>
            <span class="material-icons text-sm" v-else>send</span>
            {{ composeSending ? $t('mailbox.sending') : $t('mailbox.send') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSocket } from '@/composables/useSocket'
import { useToast } from '@/composables/useToast'
import { sanitizeHtml } from '@/utils/sanitize'
import mailboxService from '@/services/mailboxService'
import TinyMCE from '@/components/TinyMCE.vue'

const { t } = useI18n()
const { on } = useSocket()
const { showToast } = useToast()

// ============================================================================
// STATE
// ============================================================================

const loading = ref(false)
const emails = ref([])
const selectedEmail = ref(null)
const threadEmails = ref([])
const showThread = ref(false)
const stats = ref(null)
const pagination = ref(null)
const searchQuery = ref('')
const activeFilter = ref('all')
const replyBody = ref('')
const replySending = ref(false)
const showCompose = ref(false)
const composeSending = ref(false)
const isMobile = ref(window.innerWidth < 1024)

const composeForm = ref({
  to: '',
  cc: '',
  subject: '',
  body: ''
})

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

// ============================================================================
// COMPUTED
// ============================================================================

const statusFilters = computed(() => [
  { value: 'all', label: t('mailbox.all') },
  { value: 'unread', label: t('mailbox.unread') },
  { value: 'starred', label: t('mailbox.starred') },
  { value: 'archived', label: t('mailbox.archived') }
])

const sanitizedHtml = computed(() => {
  if (!selectedEmail.value?.htmlBody) return ''
  return sanitizeHtml(selectedEmail.value.htmlBody)
})

const emptyMessage = computed(() => {
  if (searchQuery.value) return t('mailbox.empty.search')
  if (activeFilter.value === 'starred') return t('mailbox.empty.starred')
  if (activeFilter.value === 'archived') return t('mailbox.empty.archived')
  return t('mailbox.empty.inbox')
})

const hasReplyContent = computed(() => {
  // Strip HTML tags and check if there's actual text
  const text = replyBody.value.replace(/<[^>]*>/g, '').trim()
  return text.length > 0
})

const canSendCompose = computed(() => {
  const bodyText = composeForm.value.body.replace(/<[^>]*>/g, '').trim()
  return composeForm.value.to.trim() && composeForm.value.subject.trim() && bodyText.length > 0
})

// ============================================================================
// METHODS
// ============================================================================

let searchTimeout = null

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchEmails()
  }, 400)
}

const fetchEmails = async (append = false) => {
  loading.value = !append
  try {
    const params = {
      page: append ? (pagination.value?.page || 0) + 1 : 1,
      limit: 30
    }

    if (activeFilter.value === 'unread') params.status = 'unread'
    else if (activeFilter.value === 'archived') params.status = 'archived'
    else if (activeFilter.value === 'starred') params.starred = true

    if (searchQuery.value) params.search = searchQuery.value

    const response = await mailboxService.getEmails(params)
    if (response.success) {
      if (append) {
        emails.value.push(...response.data.items)
      } else {
        emails.value = response.data.items
      }
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('Failed to fetch emails:', error)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await mailboxService.getEmailStats()
    if (response.success) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

const selectEmail = async email => {
  try {
    const response = await mailboxService.getEmail(email._id)
    if (response.success) {
      selectedEmail.value = response.data
      replyBody.value = ''
      showThread.value = false

      // Update list item status
      const idx = emails.value.findIndex(e => e._id === email._id)
      if (idx !== -1) {
        emails.value[idx].status = 'read'
      }

      // Load thread if exists
      if (response.data.threadId) {
        await loadThread(response.data.threadId)
      }
    }
  } catch (error) {
    console.error('Failed to get email:', error)
  }
}

const selectEmailDirect = email => {
  selectedEmail.value = email
  replyBody.value = ''
}

const loadThread = async threadId => {
  try {
    const response = await mailboxService.getThread(threadId)
    if (response.success) {
      threadEmails.value = response.data
    }
  } catch {
    threadEmails.value = []
  }
}

const loadMore = () => {
  fetchEmails(true)
}

const setFilter = filter => {
  activeFilter.value = filter
  selectedEmail.value = null
  fetchEmails()
}

const openCompose = () => {
  composeForm.value = { to: '', cc: '', subject: '', body: '' }
  showCompose.value = true
}

const handleToggleStar = async email => {
  try {
    const response = await mailboxService.toggleStar(email._id)
    if (response.success) {
      const idx = emails.value.findIndex(e => e._id === email._id)
      if (idx !== -1) {
        emails.value[idx].isStarred = response.data.isStarred
      }
      if (selectedEmail.value?._id === email._id) {
        selectedEmail.value.isStarred = response.data.isStarred
      }
    }
  } catch (error) {
    console.error('Failed to toggle star:', error)
  }
}

const handleArchive = async id => {
  try {
    await mailboxService.archiveEmail(id)
    showToast(t('mailbox.emailArchived'), 'success')
    emails.value = emails.value.filter(e => e._id !== id)
    selectedEmail.value = null
    fetchStats()
  } catch (error) {
    console.error('Failed to archive:', error)
  }
}

const handleToggleReadStatus = async email => {
  try {
    if (email.status === 'unread') {
      await mailboxService.markAsRead(email._id)
      email.status = 'read'
      showToast(t('mailbox.markedAsRead'), 'info')
    } else {
      await mailboxService.markAsUnread(email._id)
      email.status = 'unread'
      showToast(t('mailbox.markedAsUnread'), 'info')
    }
    const idx = emails.value.findIndex(e => e._id === email._id)
    if (idx !== -1) {
      emails.value[idx].status = email.status
    }
    fetchStats()
  } catch (error) {
    console.error('Failed to toggle read status:', error)
  }
}

const handleReply = async () => {
  if (!hasReplyContent.value || !selectedEmail.value) return

  replySending.value = true
  try {
    const response = await mailboxService.replyToEmail(selectedEmail.value._id, {
      body: replyBody.value
    })
    if (response.success) {
      showToast(t('mailbox.emailSent'), 'success')
      replyBody.value = ''

      selectedEmail.value.status = 'replied'
      const idx = emails.value.findIndex(e => e._id === selectedEmail.value._id)
      if (idx !== -1) {
        emails.value[idx].status = 'replied'
      }

      if (selectedEmail.value.threadId) {
        await loadThread(selectedEmail.value.threadId)
      }
    }
  } catch (error) {
    console.error('Failed to send reply:', error)
    showToast(t('mailbox.replyFailed') || 'Yanıt gönderilemedi', 'error')
  } finally {
    replySending.value = false
  }
}

const handleCompose = async () => {
  composeSending.value = true
  try {
    const ccList = composeForm.value.cc
      ? composeForm.value.cc
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : []

    const response = await mailboxService.composeEmail({
      to: composeForm.value.to.trim(),
      cc: ccList,
      subject: composeForm.value.subject.trim(),
      body: composeForm.value.body
    })

    if (response.success) {
      showToast(t('mailbox.emailSent'), 'success')
      showCompose.value = false
      composeForm.value = { to: '', cc: '', subject: '', body: '' }
      fetchEmails()
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    showToast(t('mailbox.composeFailed') || 'E-posta gönderilemedi', 'error')
  } finally {
    composeSending.value = false
  }
}

// ============================================================================
// FORMATTERS
// ============================================================================

const formatDate = date => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()

  if (isToday) {
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) {
    return t('mailbox.yesterday') || 'Dün'
  }

  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

const formatFullDate = date => {
  if (!date) return ''
  return new Date(date).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFileSize = bytes => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getInitials = name => {
  if (!name) return '?'
  const parts = name.split(/[\s@]/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const getAvatarColor = email => {
  if (!email) return '#6b7280'
  const colors = [
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#f97316',
    '#14b8a6',
    '#ef4444',
    '#22c55e',
    '#a855f7',
    '#06b6d4',
    '#eab308'
  ]
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// ============================================================================
// RESPONSIVE
// ============================================================================

const handleResize = () => {
  isMobile.value = window.innerWidth < 1024
}

// ============================================================================
// SOCKET.IO REALTIME
// ============================================================================

let unsubscribeSocket = null

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  fetchEmails()
  fetchStats()

  window.addEventListener('resize', handleResize)

  unsubscribeSocket = on('mailbox:new', data => {
    if (data?.email) {
      emails.value.unshift(data.email)
      if (stats.value) {
        stats.value.unread = (stats.value.unread || 0) + 1
        stats.value.total = (stats.value.total || 0) + 1
      }
      showToast(`${t('mailbox.newEmail')}: ${data.email.subject}`, 'info')
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearTimeout(searchTimeout)
  if (unsubscribeSocket) unsubscribeSocket()
})
</script>

<style scoped>
/* Email body styling */
.email-body :deep(img) {
  max-width: 100%;
  height: auto;
}

.email-body :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

.email-body :deep(table) {
  max-width: 100%;
  overflow-x: auto;
}

.email-body :deep(pre) {
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Line clamp */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
