<template>
  <Modal
    :model-value="modelValue"
    :title="$t('issues.nudge.title')"
    size="md"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="space-y-5">
      <!-- Recipients -->
      <div>
        <label class="form-label">{{ $t('issues.nudge.recipients') }}</label>
        <div class="space-y-2 mt-2">
          <label
            v-if="issue?.assignee"
            class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            :class="{ 'border-purple-500 bg-purple-50 dark:bg-purple-900/20': recipients === 'assignee' }"
          >
            <input
              v-model="recipients"
              type="radio"
              value="assignee"
              class="text-purple-600 focus:ring-purple-500"
            />
            <div class="flex items-center gap-2 flex-1">
              <div
                v-if="issue.assignee.avatar"
                class="w-8 h-8 rounded-full overflow-hidden"
              >
                <img :src="getAvatarUrl(issue.assignee)" :alt="issue.assignee.name" class="w-full h-full object-cover" />
              </div>
              <div
                v-else
                class="w-8 h-8 rounded-full bg-purple-200 dark:bg-purple-900/50 flex items-center justify-center text-sm font-medium text-purple-700 dark:text-purple-300"
              >
                {{ issue.assignee.name?.charAt(0)?.toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ issue.assignee.name }}</p>
                <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('issues.nudge.assigneeOnly') }}</p>
              </div>
            </div>
          </label>

          <label
            v-if="issue?.watchers?.length > 0"
            class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            :class="{ 'border-purple-500 bg-purple-50 dark:bg-purple-900/20': recipients === 'watchers' }"
          >
            <input
              v-model="recipients"
              type="radio"
              value="watchers"
              class="text-purple-600 focus:ring-purple-500"
            />
            <div class="flex items-center gap-2 flex-1">
              <div class="flex -space-x-2">
                <template v-for="(watcher, i) in issue.watchers.slice(0, 3)" :key="watcher._id">
                  <div
                    v-if="watcher.avatar"
                    class="w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-slate-700"
                  >
                    <img :src="getAvatarUrl(watcher)" :alt="watcher.name" class="w-full h-full object-cover" />
                  </div>
                  <div
                    v-else
                    class="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-slate-700"
                  >
                    {{ watcher.name?.charAt(0)?.toUpperCase() }}
                  </div>
                </template>
                <div
                  v-if="issue.watchers.length > 3"
                  class="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-600 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-slate-700"
                >
                  +{{ issue.watchers.length - 3 }}
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ $t('issues.nudge.watchersLabel') }}</p>
                <p class="text-xs text-gray-500 dark:text-slate-400">{{ issue.watchers.length }} {{ $t('issues.nudge.people') }}</p>
              </div>
            </div>
          </label>

          <label
            v-if="issue?.assignee || issue?.watchers?.length > 0"
            class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            :class="{ 'border-purple-500 bg-purple-50 dark:bg-purple-900/20': recipients === 'all' }"
          >
            <input
              v-model="recipients"
              type="radio"
              value="all"
              class="text-purple-600 focus:ring-purple-500"
            />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ $t('issues.nudge.allLabel') }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('issues.nudge.allDescription') }}</p>
            </div>
          </label>

          <p v-if="!issue?.assignee && !issue?.watchers?.length" class="text-sm text-gray-500 dark:text-slate-400 text-center py-4">
            {{ $t('issues.nudge.noRecipients') }}
          </p>
        </div>
      </div>

      <!-- Channels -->
      <div>
        <label class="form-label">{{ $t('issues.nudge.channels') }}</label>
        <div class="flex flex-wrap gap-3 mt-2">
          <label class="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 cursor-not-allowed opacity-60">
            <input
              type="checkbox"
              checked
              disabled
              class="text-purple-600"
            />
            <span class="material-icons text-lg">notifications</span>
            <span class="text-sm">{{ $t('issues.nudge.channelNotification') }}</span>
          </label>

          <label
            class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors"
            :class="channels.includes('email')
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'"
          >
            <input
              v-model="channels"
              type="checkbox"
              value="email"
              class="text-purple-600 focus:ring-purple-500"
            />
            <span class="material-icons text-lg">email</span>
            <span class="text-sm">{{ $t('issues.nudge.channelEmail') }}</span>
          </label>
        </div>
      </div>

      <!-- Message -->
      <div>
        <label class="form-label">{{ $t('issues.nudge.message') }}</label>
        <textarea
          v-model="message"
          class="form-input w-full min-h-[100px]"
          :placeholder="$t('issues.nudge.messagePlaceholder')"
          maxlength="500"
        />
        <p class="text-xs text-gray-400 dark:text-slate-500 mt-1 text-right">
          {{ message.length }}/500
        </p>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
        <button
          type="button"
          class="btn-secondary"
          @click="$emit('update:modelValue', false)"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          class="btn-primary flex items-center gap-2"
          :disabled="!canSend || sending"
          @click="handleSend"
        >
          <span v-if="sending" class="animate-spin">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
          <span class="material-icons text-lg" v-else>send</span>
          {{ $t('issues.nudge.send') }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/ui/overlay/Modal.vue'
import issueService from '@/services/issueService'
import { getAvatarUrl } from '@/utils/imageUrl'

const props = defineProps({
  modelValue: Boolean,
  issue: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'sent'])

const { t } = useI18n()
const toast = useToast()

// State
const recipients = ref('assignee')
const channels = ref(['notification'])
const message = ref('')
const sending = ref(false)

// Reset when modal opens
watch(() => props.modelValue, (val) => {
  if (val) {
    // Set default recipient based on what's available
    if (props.issue?.assignee) {
      recipients.value = 'assignee'
    } else if (props.issue?.watchers?.length > 0) {
      recipients.value = 'watchers'
    } else {
      recipients.value = ''
    }
    channels.value = ['notification']
    message.value = ''
  }
})

// Can send
const canSend = computed(() => {
  return recipients.value && (props.issue?.assignee || props.issue?.watchers?.length > 0)
})

// Handle send
const handleSend = async () => {
  if (!canSend.value) return

  sending.value = true
  try {
    const result = await issueService.nudgeIssue(props.issue._id, {
      recipients: recipients.value,
      message: message.value || undefined,
      channels: ['notification', ...channels.value.filter(c => c !== 'notification')]
    })

    toast.success(t('issues.nudge.sent', { count: result.data.recipientsCount }))
    emit('sent', result.data)
    emit('update:modelValue', false)
  } catch (error) {
    const errorCode = error.response?.data?.error
    if (errorCode === 'NO_RECIPIENTS') {
      toast.error(t('issues.nudge.noRecipients'))
    } else if (errorCode === 'CANNOT_NUDGE_SELF') {
      toast.error(t('issues.nudge.cannotNudgeSelf'))
    } else {
      toast.error(t('common.error'))
    }
    console.error('Failed to send nudge:', error)
  } finally {
    sending.value = false
  }
}
</script>
