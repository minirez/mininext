<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
          {{ $t('website.photos.title') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('website.photos.description') }}
        </p>
      </div>
      <label
        class="btn-primary cursor-pointer"
        :class="{ 'opacity-50 cursor-not-allowed': uploading || photos.length >= 20 }"
      >
        <span v-if="uploading" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ $t('common.loading') }}
        </span>
        <span v-else class="flex items-center">
          <span class="material-icons text-sm mr-1">upload</span>
          {{ $t('website.photos.upload') }}
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          :disabled="uploading || photos.length >= 20"
          @change="handleUpload"
        />
      </label>
    </div>

    <!-- Usage Info -->
    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <div class="flex items-center gap-3">
        <span class="material-icons text-purple-600">photo_library</span>
        <span class="text-gray-600 dark:text-slate-300">
          {{ $t('website.photos.usage', { count: photos.length, max: 20 }) }}
        </span>
      </div>
      <div class="w-48 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div
          class="h-full bg-purple-600 transition-all"
          :style="{ width: `${(photos.length / 20) * 100}%` }"
        />
      </div>
    </div>

    <!-- Photos Grid -->
    <div v-if="photos.length > 0" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="relative group"
      >
        <div class="aspect-square bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
          <img
            :src="imageSrc(photo)"
            :alt="photo.id"
            class="w-full h-full object-cover"
          />

          <!-- Overlay -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              class="p-2 bg-white rounded-lg hover:bg-gray-100"
              :title="$t('website.photos.copyUrl')"
              @click="copyUrl(photo)"
            >
              <span class="material-icons text-gray-700">content_copy</span>
            </button>
            <button
              class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              :title="$t('common.delete')"
              @click="confirmDelete(photo)"
            >
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>

        <!-- Photo Info -->
        <div class="mt-2 text-xs text-gray-500 dark:text-slate-400 truncate">
          {{ photo.width }}x{{ photo.height }}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-16 bg-gray-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600"
    >
      <span class="material-icons text-6xl text-gray-400 dark:text-slate-500">photo_library</span>
      <h4 class="mt-4 text-lg font-medium text-gray-600 dark:text-slate-400">
        {{ $t('website.photos.empty') }}
      </h4>
      <p class="mt-1 text-gray-500 dark:text-slate-500">
        {{ $t('website.photos.emptyHint') }}
      </p>
      <label class="btn-primary mt-4 inline-flex cursor-pointer">
        <span class="material-icons text-sm mr-1">upload</span>
        {{ $t('website.photos.upload') }}
        <input
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handleUpload"
        />
      </label>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('website.photos.deletePhoto')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('website.photos.deleteConfirm') }}
      </p>

      <template #footer>
        <button class="btn-secondary" @click="showDeleteModal = false">
          {{ $t('common.no') }}
        </button>
        <button class="btn-danger" :disabled="saving" @click="deletePhoto">
          {{ $t('common.yes') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import { getImageUrl } from '@/utils/imageUrl'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  storefront: Object,
  saving: Boolean
})

const emit = defineEmits(['upload', 'delete'])

const uploading = ref(false)
const showDeleteModal = ref(false)
const photoToDelete = ref(null)

const photos = computed(() => props.storefront?.photos || [])

const imageSrc = photo => {
  return getImageUrl(photo)
}

const handleUpload = async event => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  uploading.value = true
  try {
    for (const file of files) {
      if (photos.value.length >= 20) {
        toast.warning(t('website.photos.maxReached'))
        break
      }
      emit('upload', file)
    }
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

const copyUrl = photo => {
  const url = getImageUrl(photo)
  navigator.clipboard.writeText(url)
  toast.success(t('website.photos.urlCopied'))
}

const confirmDelete = photo => {
  photoToDelete.value = photo
  showDeleteModal.value = true
}

const deletePhoto = () => {
  if (photoToDelete.value) {
    emit('delete', photoToDelete.value.id)
    showDeleteModal.value = false
  }
}
</script>
