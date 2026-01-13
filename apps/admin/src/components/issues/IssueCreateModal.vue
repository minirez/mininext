<template>
  <Modal
    :model-value="modelValue"
    :title="$t('issues.actions.create')"
    size="lg"
    :close-on-backdrop="false"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Title -->
      <div>
        <label class="form-label">{{ $t('issues.fields.title') }} *</label>
        <input
          v-model="form.title"
          type="text"
          class="form-input"
          :placeholder="$t('issues.placeholders.enterTitle')"
          maxlength="200"
          required
        />
      </div>

      <!-- Description -->
      <div>
        <label class="form-label">{{ $t('issues.fields.description') }} *</label>
        <textarea
          v-model="form.description"
          class="form-input min-h-[150px]"
          :placeholder="$t('issues.placeholders.enterDescription')"
          required
        />
        <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
          Markdown desteklenir
        </p>
      </div>

      <!-- Priority & Category -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('issues.fields.priority') }}</label>
          <select v-model="form.priority" class="form-input">
            <option value="low">{{ $t('issues.priority.low') }}</option>
            <option value="medium">{{ $t('issues.priority.medium') }}</option>
            <option value="high">{{ $t('issues.priority.high') }}</option>
            <option value="critical">{{ $t('issues.priority.critical') }}</option>
          </select>
        </div>

        <div>
          <label class="form-label">{{ $t('issues.fields.category') }}</label>
          <select v-model="form.category" class="form-input">
            <option value="bug">{{ $t('issues.category.bug') }}</option>
            <option value="feature">{{ $t('issues.category.feature') }}</option>
            <option value="improvement">{{ $t('issues.category.improvement') }}</option>
            <option value="question">{{ $t('issues.category.question') }}</option>
            <option value="task">{{ $t('issues.category.task') }}</option>
            <option value="other">{{ $t('issues.category.other') }}</option>
          </select>
        </div>
      </div>

      <!-- Assignee & Due Date -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('issues.fields.assignee') }}</label>
          <select v-model="form.assignee" class="form-input">
            <option value="">{{ $t('issues.placeholders.selectAssignee') }}</option>
            <option v-for="user in platformUsers" :key="user._id" :value="user._id">
              {{ user.name }} ({{ user.email }})
            </option>
          </select>
        </div>

        <div>
          <label class="form-label">{{ $t('issues.fields.dueDate') }}</label>
          <input
            v-model="form.dueDate"
            type="date"
            class="form-input"
            :min="today"
          />
        </div>
      </div>

      <!-- Labels -->
      <div>
        <label class="form-label">{{ $t('issues.fields.labels') }}</label>
        <div class="flex flex-wrap gap-2 mb-2">
          <span
            v-for="(label, index) in form.labels"
            :key="index"
            class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
          >
            {{ label }}
            <button
              type="button"
              class="text-purple-500 hover:text-purple-700"
              @click="removeLabel(index)"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
        <div class="flex gap-2">
          <input
            v-model="newLabel"
            type="text"
            class="form-input flex-1"
            placeholder="Etiket ekle..."
            @keydown.enter.prevent="addLabel"
          />
          <button type="button" class="btn-secondary" @click="addLabel">
            {{ $t('common.add') }}
          </button>
        </div>
      </div>

      <!-- File Upload Preview -->
      <div v-if="files.length > 0">
        <label class="form-label">{{ $t('issues.attachments') }}</label>
        <div class="space-y-2">
          <div
            v-for="(file, index) in files"
            :key="index"
            class="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded"
          >
            <span class="text-sm text-gray-600 dark:text-slate-300 truncate">{{ file.name }}</span>
            <button
              type="button"
              class="text-red-500 hover:text-red-700"
              @click="removeFile(index)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Drop Zone -->
      <div
        class="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
        @click="$refs.fileInput.click()"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <svg class="w-10 h-10 mx-auto text-gray-400 dark:text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('issues.actions.uploadFile') }}
        </p>
        <p class="text-xs text-gray-400 dark:text-slate-500 mt-1">
          JPEG, PNG, GIF, WEBP, PDF (max 10MB)
        </p>
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          accept="image/*,.pdf"
          multiple
          @change="handleFileSelect"
        />
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
        <button type="button" class="btn-secondary" @click="$emit('update:modelValue', false)">
          {{ $t('common.cancel') }}
        </button>
        <button type="submit" class="btn-primary" :disabled="submitting">
          <span v-if="submitting" class="flex items-center gap-2">
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {{ $t('common.saving') }}
          </span>
          <span v-else>{{ $t('issues.actions.create') }}</span>
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/ui/overlay/Modal.vue'
import issueService from '@/services/issueService'

const props = defineProps({
  modelValue: Boolean,
  platformUsers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'created'])

const { t } = useI18n()
const toast = useToast()

// State
const submitting = ref(false)
const files = ref([])
const newLabel = ref('')

const form = reactive({
  title: '',
  description: '',
  priority: 'medium',
  category: 'other',
  assignee: '',
  dueDate: '',
  labels: []
})

// Computed
const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Reset form when modal opens
watch(() => props.modelValue, (val) => {
  if (val) {
    form.title = ''
    form.description = ''
    form.priority = 'medium'
    form.category = 'other'
    form.assignee = ''
    form.dueDate = ''
    form.labels = []
    files.value = []
    newLabel.value = ''
  }
})

// Add label
const addLabel = () => {
  if (newLabel.value.trim() && !form.labels.includes(newLabel.value.trim())) {
    form.labels.push(newLabel.value.trim())
    newLabel.value = ''
  }
}

// Remove label
const removeLabel = (index) => {
  form.labels.splice(index, 1)
}

// Handle file select
const handleFileSelect = (e) => {
  const selectedFiles = Array.from(e.target.files)
  files.value = [...files.value, ...selectedFiles]
}

// Handle drop
const handleDrop = (e) => {
  const droppedFiles = Array.from(e.dataTransfer.files)
  files.value = [...files.value, ...droppedFiles]
}

// Remove file
const removeFile = (index) => {
  files.value.splice(index, 1)
}

// Submit
const handleSubmit = async () => {
  submitting.value = true

  try {
    // Create issue
    const issueData = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      category: form.category,
      labels: form.labels
    }

    if (form.assignee) {
      issueData.assignee = form.assignee
    }
    if (form.dueDate) {
      issueData.dueDate = form.dueDate
    }

    const { data: issue } = await issueService.createIssue(issueData)

    // Upload files if any
    if (files.value.length > 0) {
      for (const file of files.value) {
        try {
          await issueService.uploadAttachment(issue._id, file)
        } catch (err) {
          console.error('Failed to upload file:', err)
        }
      }
    }

    emit('created', issue)
    emit('update:modelValue', false)
  } catch (error) {
    toast.error(t('common.error'))
    console.error('Failed to create issue:', error)
  } finally {
    submitting.value = false
  }
}
</script>
