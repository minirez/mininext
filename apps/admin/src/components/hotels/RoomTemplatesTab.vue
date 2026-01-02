<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{{ $t('hotels.roomTemplates.title') }}</h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">{{ $t('hotels.roomTemplates.description') }}</p>
      </div>
      <button @click="openCreateModal" class="btn-primary flex items-center gap-2">
        <span class="material-icons text-lg">add</span>
        {{ $t('hotels.roomTemplates.addRoom') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="roomTemplates.length === 0" class="text-center py-12 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <span class="material-icons text-5xl text-gray-400 dark:text-slate-500">bedroom_parent</span>
      <p class="mt-3 text-gray-600 dark:text-slate-400">{{ $t('hotels.roomTemplates.noRooms') }}</p>
      <button @click="openCreateModal" class="mt-4 btn-secondary">
        {{ $t('hotels.roomTemplates.addFirstRoom') }}
      </button>
    </div>

    <!-- Room Templates List -->
    <div v-else class="space-y-3">
      <div
        v-for="template in roomTemplates"
        :key="template._id"
        class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
      >
        <div class="flex flex-col sm:flex-row">
          <!-- Room Image (Left) -->
          <div
            class="w-full sm:w-48 h-32 sm:h-auto sm:min-h-[120px] bg-gray-100 dark:bg-slate-700 relative flex-shrink-0 cursor-pointer group"
            @click="openGallery(template)"
          >
            <img
              v-if="getMainImage(template)"
              :src="getImageUrl(getMainImage(template).url)"
              :alt="getRoomName(template)"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="material-icons text-4xl text-gray-400 dark:text-slate-500">bedroom_parent</span>
            </div>

            <!-- Room Code Badge -->
            <div class="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded shadow">
              {{ template.code }}
            </div>

            <!-- Image Count Badge -->
            <div
              v-if="template.images?.length > 1"
              class="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm"
            >
              <span class="material-icons text-sm">photo_library</span>
              {{ template.images.length }}
            </div>

            <!-- Hover Overlay -->
            <div
              v-if="template.images?.length"
              class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"
            >
              <span class="material-icons text-white opacity-0 group-hover:opacity-100 transition-opacity text-3xl drop-shadow-lg">
                zoom_in
              </span>
            </div>
          </div>

          <!-- Room Info (Right) -->
          <div class="flex-1 p-4 flex flex-col justify-between min-w-0">
            <div>
              <!-- Header -->
              <div class="flex items-start justify-between gap-2">
                <h4 class="font-semibold text-gray-800 dark:text-white truncate">{{ getRoomName(template) }}</h4>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button
                    @click="openEditModal(template)"
                    class="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    :title="$t('common.edit')"
                  >
                    <span class="material-icons text-lg">edit</span>
                  </button>
                  <button
                    @click="confirmDelete(template)"
                    class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    :title="$t('common.delete')"
                  >
                    <span class="material-icons text-lg">delete</span>
                  </button>
                </div>
              </div>

              <!-- Meta Info -->
              <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-slate-400">
                <span v-if="template.size" class="flex items-center gap-1">
                  <span class="material-icons text-sm">square_foot</span>
                  {{ template.size }}m²
                </span>
                <span v-if="template.occupancy" class="flex items-center gap-1">
                  <span class="material-icons text-sm">people</span>
                  {{ template.occupancy.maxAdults }}+{{ template.occupancy.maxChildren }}
                </span>
                <span v-if="template.bedConfiguration?.length" class="flex items-center gap-1">
                  <span class="material-icons text-sm">bed</span>
                  {{ formatBeds(template.bedConfiguration) }}
                </span>
              </div>

              <!-- Amenities Preview -->
              <div v-if="template.amenities?.length" class="mt-3 flex flex-wrap gap-1.5">
                <span
                  v-for="amenity in template.amenities.slice(0, 5)"
                  :key="amenity"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                >
                  {{ $t(`hotels.roomAmenities.${amenity}`) }}
                </span>
                <span
                  v-if="template.amenities.length > 5"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                >
                  +{{ template.amenities.length - 5 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Room Template Form Modal -->
    <RoomTemplateForm
      v-if="showFormModal"
      :hotel-id="hotelId"
      :template="selectedTemplate"
      :is-edit="isEditMode"
      @close="closeFormModal"
      @saved="handleSaved"
    />

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('common.confirmDelete')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('hotels.roomTemplates.confirmDelete', { code: templateToDelete?.code }) }}
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="showDeleteModal = false" class="btn-secondary">
            {{ $t('common.cancel') }}
          </button>
          <button @click="deleteTemplate" class="btn-danger" :disabled="deleting">
            <span v-if="deleting" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ $t('common.deleting') }}
            </span>
            <span v-else>{{ $t('common.delete') }}</span>
          </button>
        </div>
      </template>
    </Modal>

    <!-- Gallery Lightbox -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showGallery"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          @click.self="closeGallery"
        >
          <!-- Close Button -->
          <button
            @click="closeGallery"
            class="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors z-10"
          >
            <span class="material-icons text-2xl">close</span>
          </button>

          <!-- Previous Button -->
          <button
            v-if="galleryImages.length > 1"
            @click="prevImage"
            class="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <span class="material-icons text-3xl">chevron_left</span>
          </button>

          <!-- Next Button -->
          <button
            v-if="galleryImages.length > 1"
            @click="nextImage"
            class="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <span class="material-icons text-3xl">chevron_right</span>
          </button>

          <!-- Main Image -->
          <div class="max-w-6xl max-h-[85vh] w-full h-full flex items-center justify-center px-16">
            <img
              v-if="currentGalleryImage"
              :src="getImageUrl(currentGalleryImage.url)"
              :alt="getImageCaption(currentGalleryImage)"
              class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              @error="handleImageError"
            />
          </div>

          <!-- Bottom Info Bar -->
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div class="max-w-4xl mx-auto flex items-center justify-between">
              <!-- Room & Caption Info -->
              <div class="text-white">
                <h4 class="font-semibold text-lg">{{ galleryRoomName }}</h4>
                <p v-if="getImageCaption(currentGalleryImage)" class="text-white/70 text-sm mt-1">
                  {{ getImageCaption(currentGalleryImage) }}
                </p>
              </div>

              <!-- Image Counter -->
              <div v-if="galleryImages.length > 1" class="text-white/80 text-sm bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                {{ currentImageIndex + 1 }} / {{ galleryImages.length }}
              </div>
            </div>

            <!-- Thumbnail Strip -->
            <div v-if="galleryImages.length > 1" class="mt-4 flex justify-center gap-2 overflow-x-auto pb-2">
              <button
                v-for="(img, index) in galleryImages"
                :key="index"
                @click="selectImage(index)"
                :class="[
                  'w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all border-2',
                  index === currentImageIndex
                    ? 'border-white ring-2 ring-white/30 scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                ]"
              >
                <img
                  :src="getImageUrl(img.url)"
                  :alt="`Thumbnail ${index + 1}`"
                  class="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import hotelService from '@/services/hotelService'
import Modal from '@/components/common/Modal.vue'
import RoomTemplateForm from './RoomTemplateForm.vue'
import { getImageUrl } from '@/utils/imageUrl'

const props = defineProps({
  hotelId: {
    type: String,
    required: true
  }
})

const { t, locale } = useI18n()
const toast = useToast()

const loading = ref(false)
const deleting = ref(false)
const roomTemplates = ref([])
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const selectedTemplate = ref(null)
const templateToDelete = ref(null)
const isEditMode = ref(false)

// Gallery state
const showGallery = ref(false)
const galleryImages = ref([])
const galleryRoomName = ref('')
const currentImageIndex = ref(0)

// getImageUrl imported from @/utils/imageUrl

const getMainImage = (template) => {
  if (!template.images?.length) return null
  return template.images.find(img => img.isMain) || template.images[0]
}

const getRoomName = (template) => {
  if (!template.name) return template.code
  return template.name[locale.value] || template.name.tr || template.name.en || template.code
}

const getImageCaption = (image) => {
  if (!image?.caption) return ''
  return image.caption[locale.value] || image.caption.tr || image.caption.en || ''
}

const formatBeds = (beds) => {
  if (!beds?.length) return ''
  return beds.map(bed => {
    const bedName = t(`hotels.bedTypes.${bed.type}`)
    return bed.count > 1 ? `${bed.count}x ${bedName}` : bedName
  }).join(', ')
}

const currentGalleryImage = ref(null)

// Watch for currentImageIndex changes
const updateCurrentImage = () => {
  if (galleryImages.value.length > 0 && currentImageIndex.value >= 0) {
    currentGalleryImage.value = galleryImages.value[currentImageIndex.value]
  }
}

// Gallery functions
const openGallery = (template) => {
  if (!template.images?.length) return

  galleryImages.value = [...template.images].sort((a, b) => {
    if (a.isMain) return -1
    if (b.isMain) return 1
    return (a.order || 0) - (b.order || 0)
  })
  galleryRoomName.value = getRoomName(template)
  currentImageIndex.value = 0
  currentGalleryImage.value = galleryImages.value[0]
  showGallery.value = true
  document.body.style.overflow = 'hidden'
}

const closeGallery = () => {
  showGallery.value = false
  document.body.style.overflow = ''
}

const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  } else {
    currentImageIndex.value = galleryImages.value.length - 1
  }
  updateCurrentImage()
}

const nextImage = () => {
  if (currentImageIndex.value < galleryImages.value.length - 1) {
    currentImageIndex.value++
  } else {
    currentImageIndex.value = 0
  }
  updateCurrentImage()
}

const selectImage = (index) => {
  currentImageIndex.value = index
  updateCurrentImage()
}

const handleImageError = (e) => {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>'
}

// Keyboard navigation
const handleKeydown = (e) => {
  if (!showGallery.value) return

  if (e.key === 'Escape') {
    closeGallery()
  } else if (e.key === 'ArrowLeft') {
    prevImage()
  } else if (e.key === 'ArrowRight') {
    nextImage()
  }
}

const fetchRoomTemplates = async () => {
  loading.value = true
  try {
    const response = await hotelService.getRoomTemplates(props.hotelId)
    if (response.success) {
      roomTemplates.value = response.data || []
    }
  } catch (error) {
    toast.error(t('common.operationFailed'))
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  selectedTemplate.value = null
  isEditMode.value = false
  showFormModal.value = true
}

const openEditModal = (template) => {
  selectedTemplate.value = { ...template }
  isEditMode.value = true
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  selectedTemplate.value = null
}

const handleSaved = () => {
  closeFormModal()
  fetchRoomTemplates()
}

const confirmDelete = (template) => {
  templateToDelete.value = template
  showDeleteModal.value = true
}

const deleteTemplate = async () => {
  if (!templateToDelete.value) return

  deleting.value = true
  try {
    await hotelService.deleteRoomTemplate(props.hotelId, templateToDelete.value.code)
    toast.success(t('hotels.roomTemplates.deleted'))
    showDeleteModal.value = false
    templateToDelete.value = null
    fetchRoomTemplates()
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchRoomTemplates()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
