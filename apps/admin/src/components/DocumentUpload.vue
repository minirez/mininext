<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">
      {{ title || $t('partners.documentUpload') }}
    </h3>

    <!-- Lightbox -->
    <Lightbox v-model="showLightbox" :url="lightboxUrl" :title="lightboxTitle" />

    <!-- Upload Area -->
    <div
      class="border-2 border-dashed rounded-lg p-6 mb-4 transition-colors"
      :class="
        dragOver
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-slate-600'
      "
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="handleDrop"
    >
      <div class="text-center">
        <span class="material-icons text-4xl text-gray-400 mb-2">cloud_upload</span>
        <p class="text-sm text-gray-600 dark:text-slate-300 mb-1">
          {{ description || $t('partners.uploadDescription') }}
        </p>
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-3">
          PDF, JPG, PNG, DOC, DOCX ({{ $t('partners.maxSize') }})
        </p>
        <div class="flex items-center justify-center gap-3">
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            :accept="accept"
            @change="handleFileSelect"
          />
          <button
            type="button"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            @click="$refs.fileInput.click()"
          >
            <span class="flex items-center gap-2">
              <span class="material-icons text-sm">attach_file</span>
              {{ $t('partners.selectFile') }}
            </span>
          </button>
          <button
            v-if="selectedFile"
            type="button"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            :disabled="uploading"
            @click="handleUpload"
          >
            <span v-if="uploading" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {{ $t('common.loading') }}
            </span>
            <span v-else class="flex items-center gap-2">
              <span class="material-icons text-sm">upload</span>
              {{ $t('common.upload') }}
            </span>
          </button>
        </div>
        <p v-if="selectedFile" class="text-xs text-green-600 dark:text-green-400 mt-2">
          {{ selectedFile.name }}
        </p>
      </div>
    </div>

    <!-- Documents List -->
    <div v-if="documents?.length" class="space-y-2">
      <h4 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {{ $t('partners.uploadedDocuments') }}
      </h4>
      <div
        v-for="doc in documents"
        :key="doc._id"
        class="flex items-center justify-between p-4 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:shadow-md transition-shadow"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span class="material-icons text-blue-600 dark:text-blue-400">description</span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-white">{{ doc.name }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ new Date(doc.uploadedAt).toLocaleDateString() }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            :title="$t('common.view')"
            @click="openLightbox(doc)"
          >
            <span class="material-icons text-sm">visibility</span>
          </button>
          <button
            type="button"
            class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            :title="$t('common.delete')"
            @click="handleDelete(doc._id)"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>
    <div
      v-else
      class="text-center py-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-dashed border-gray-300 dark:border-slate-600"
    >
      <span class="material-icons text-gray-400 text-3xl mb-2">folder_open</span>
      <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('partners.noDocuments') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import Lightbox from '@/components/common/Lightbox.vue'

const props = defineProps({
  title: String,
  description: String,
  documents: {
    type: Array,
    default: () => []
  },
  accept: {
    type: String,
    default: '.jpg,.jpeg,.png,.pdf,.doc,.docx'
  },
  uploading: {
    type: Boolean,
    default: false
  },
  partnerId: {
    type: String,
    required: true
  },
  baseUrl: {
    type: String,
    default: '/partners'
  }
})

const emit = defineEmits(['upload', 'delete'])

const toast = useToast()
const { t } = useI18n()

const selectedFile = ref(null)
const dragOver = ref(false)
const fileInput = ref(null)
const showLightbox = ref(false)
const lightboxUrl = ref('')
const lightboxTitle = ref('')

const handleFileSelect = event => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

const handleDrop = event => {
  dragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (allowedTypes.includes(file.type)) {
      selectedFile.value = file
    } else {
      toast.error('Geçersiz dosya tipi. Sadece JPG, PNG, PDF, DOC ve DOCX dosyaları yüklenebilir.')
    }
  }
}

const handleUpload = () => {
  if (selectedFile.value) {
    emit('upload', selectedFile.value)
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const handleDelete = documentId => {
  if (confirm(t('common.confirm'))) {
    emit('delete', documentId)
  }
}

const openLightbox = doc => {
  // Use authenticated endpoint instead of static file serving
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.maxirez.com/api'
  lightboxUrl.value = `${apiBaseUrl}${props.baseUrl}/${props.partnerId}/documents/${doc._id}/file`
  lightboxTitle.value = doc.name
  showLightbox.value = true
}
</script>
