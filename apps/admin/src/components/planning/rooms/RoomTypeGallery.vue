<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">{{ $t('planning.roomTypes.gallery.title') }}</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.roomTypes.gallery.description') }}</p>
    </div>

    <!-- Upload Area -->
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
      :class="isDragging
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
        : 'border-gray-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />

      <div v-if="uploading" class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p class="mt-3 text-gray-600 dark:text-slate-400">
          {{ $t('common.uploading') }}
          <span v-if="uploadProgress.total > 1">
            ({{ uploadProgress.current }}/{{ uploadProgress.total }})
          </span>
        </p>
      </div>

      <div v-else class="flex flex-col items-center">
        <span class="material-icons text-4xl text-gray-400 dark:text-slate-500">cloud_upload</span>
        <p class="mt-2 text-gray-600 dark:text-slate-400">
          {{ $t('planning.roomTypes.gallery.dropImagesHere') }}
        </p>
        <p class="text-xs text-gray-500 dark:text-slate-500 mt-1">
          {{ $t('planning.roomTypes.gallery.multipleImagesHint') }}
        </p>
        <button
          type="button"
          @click="$refs.fileInput.click()"
          class="mt-4 btn-primary"
        >
          {{ $t('planning.roomTypes.gallery.uploadImages') }}
        </button>
      </div>
    </div>

    <!-- Image Grid -->
    <div v-if="images.length > 0">
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">{{ $t('planning.roomTypes.gallery.reorderHelp') }}</p>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        <div
          v-for="(image, index) in images"
          :key="image._id"
          class="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 aspect-[4/3]"
        >
          <img
            :src="getImageUrl(image.url)"
            :alt="getCaption(image)"
            class="w-full h-full object-cover"
          />

          <!-- Main Image Badge -->
          <div
            v-if="image.isMain"
            class="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded"
          >
            {{ $t('planning.roomTypes.gallery.isMain') }}
          </div>

          <!-- Image Actions Overlay -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              v-if="!image.isMain"
              @click="setMainImage(image._id)"
              class="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              :title="$t('planning.roomTypes.gallery.setMain')"
            >
              <span class="material-icons">star</span>
            </button>
            <button
              @click="confirmDeleteImage(image)"
              class="p-2 bg-white/20 hover:bg-red-500/50 rounded-full text-white transition-colors"
              :title="$t('common.delete')"
            >
              <span class="material-icons">delete</span>
            </button>
          </div>

          <!-- Order Number -->
          <div class="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {{ index + 1 }}
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <span class="material-icons text-4xl text-gray-300 dark:text-slate-600">photo_library</span>
      <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('planning.roomTypes.gallery.noImages') }}</p>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      :title="$t('common.delete')"
      size="sm"
    >
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('common.confirm') }}?
      </p>

      <template #footer>
        <button @click="showDeleteModal = false" type="button" class="btn-secondary">
          {{ $t('common.no') }}
        </button>
        <button @click="deleteImage" type="button" class="btn-danger" :disabled="deleting">
          <span v-if="deleting">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import planningService from '@/services/planningService'
import { getImageUrl } from '@/utils/imageUrl'

const props = defineProps({
  hotelId: {
    type: String,
    required: true
  },
  roomType: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['image-uploaded', 'image-deleted', 'images-reordered', 'main-image-set'])

const toast = useToast()
const { t, locale } = useI18n()

const fileInput = ref(null)
const isDragging = ref(false)
const uploading = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)
const selectedImage = ref(null)

const uploadProgress = reactive({
  current: 0,
  total: 0
})

const images = computed(() => props.roomType?.images || [])

// getImageUrl imported from @/utils/imageUrl

const getCaption = (image) => {
  const lang = locale.value
  return image.caption?.[lang] || image.caption?.tr || image.caption?.en || ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
  if (files.length > 0) {
    uploadImages(files)
  }
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
  if (files.length > 0) {
    uploadImages(files)
  }
  e.target.value = ''
}

// Upload multiple images
const uploadImages = async (files) => {
  if (files.length === 0) {
    toast.error(t('planning.roomTypes.gallery.selectImages'))
    return
  }

  uploading.value = true
  uploadProgress.current = 0
  uploadProgress.total = files.length

  let successCount = 0
  let errorCount = 0

  for (const file of files) {
    uploadProgress.current++
    try {
      const response = await planningService.uploadRoomTypeImage(props.hotelId, props.roomType._id, file)
      if (response.success) {
        emit('image-uploaded', response.data)
        successCount++
      }
    } catch (error) {
      console.error('Upload failed:', error)
      errorCount++
    }
  }

  uploading.value = false

  if (successCount > 0) {
    toast.success(t('planning.roomTypes.gallery.imagesUploaded', { count: successCount }))
  }
  if (errorCount > 0) {
    toast.error(t('planning.roomTypes.gallery.someUploadsFailed', { count: errorCount }))
  }
}

const confirmDeleteImage = (image) => {
  selectedImage.value = image
  showDeleteModal.value = true
}

const deleteImage = async () => {
  deleting.value = true
  try {
    const response = await planningService.deleteRoomTypeImage(props.hotelId, props.roomType._id, selectedImage.value._id)
    if (response.success) {
      emit('image-deleted', selectedImage.value._id)
      toast.success(t('planning.roomTypes.gallery.imageDeleted'))
      showDeleteModal.value = false
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

const setMainImage = async (imageId) => {
  try {
    const response = await planningService.setRoomTypeMainImage(props.hotelId, props.roomType._id, imageId)
    if (response.success) {
      emit('main-image-set', imageId)
      toast.success(t('planning.roomTypes.gallery.mainImageSet'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  }
}
</script>
