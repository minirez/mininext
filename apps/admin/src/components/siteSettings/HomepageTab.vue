<template>
  <div class="space-y-6">
    <!-- Active Services -->
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        {{ $t('siteSettings.homepage.activeServices') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
        {{ $t('siteSettings.homepage.activeServicesDescription') }}
      </p>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label
          v-for="service in services"
          :key="service.key"
          class="relative flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all border-2"
          :class="form.activeServices[service.key]
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 hover:border-gray-300'"
        >
          <input
            type="checkbox"
            v-model="form.activeServices[service.key]"
            class="sr-only"
          />
          <span class="material-icons text-3xl mb-2" :class="form.activeServices[service.key] ? 'text-purple-600' : 'text-gray-400'">
            {{ service.icon }}
          </span>
          <span class="text-sm font-medium" :class="form.activeServices[service.key] ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-slate-400'">
            {{ service.label }}
          </span>
          <span
            v-if="form.activeServices[service.key]"
            class="absolute top-2 right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center"
          >
            <span class="material-icons text-white text-sm">check</span>
          </span>
        </label>
      </div>
    </div>

    <!-- Slider -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ $t('siteSettings.homepage.slider') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('siteSettings.homepage.sliderDescription') }}
          </p>
        </div>
      </div>

      <!-- Slider Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Existing Slides -->
        <div
          v-for="(slide, index) in form.slider"
          :key="slide._id || index"
          class="relative group"
        >
          <div class="aspect-video bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
            <img
              v-if="slide.image"
              :src="getImageUrl(slide.image)"
              :alt="'Slider ' + (index + 1)"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="material-icons text-4xl text-gray-300 dark:text-slate-600">image</span>
            </div>
          </div>

          <!-- Overlay Actions -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              @click="confirmDeleteSlider(slide)"
              class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              :title="$t('common.delete')"
            >
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>

          <!-- Status Badge -->
          <div class="absolute top-2 left-2">
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :class="slide.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'"
            >
              {{ slide.isActive ? $t('common.active') : $t('common.inactive') }}
            </span>
          </div>

          <!-- Order Number -->
          <div class="absolute top-2 right-2">
            <span class="w-6 h-6 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 dark:text-slate-300 shadow">
              {{ index + 1 }}
            </span>
          </div>
        </div>

        <!-- Add New Slide Button -->
        <label
          class="aspect-video bg-gray-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          :class="{ 'opacity-50 cursor-not-allowed': uploading }"
        >
          <input
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleSliderUpload"
            :disabled="uploading"
          />
          <span v-if="uploading" class="animate-spin material-icons text-3xl text-purple-600 mb-2">refresh</span>
          <span v-else class="material-icons text-3xl text-gray-400 dark:text-slate-500 mb-2">add_photo_alternate</span>
          <span class="text-sm text-gray-500 dark:text-slate-400">
            {{ uploading ? $t('common.loading') : $t('siteSettings.homepage.addSlider') }}
          </span>
        </label>
      </div>

      <p v-if="form.slider.length === 0" class="text-center text-gray-500 dark:text-slate-400 py-4">
        {{ $t('siteSettings.homepage.noSliders') }}
      </p>
    </div>

    <!-- Save Button for Active Services -->
    <div class="flex justify-end">
      <button
        @click="handleSave"
        class="btn-primary"
        :disabled="saving"
      >
        <span v-if="saving" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ $t('common.loading') }}
        </span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      :title="$t('siteSettings.homepage.deleteSlider')"
      size="sm"
    >
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('siteSettings.homepage.deleteSliderConfirm') }}
      </p>

      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">
          {{ $t('common.no') }}
        </button>
        <button @click="handleDeleteSlider" class="btn-danger" :disabled="saving">
          {{ $t('common.yes') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import siteSettingsService from '@/services/siteSettingsService'
import { getImageUrl } from '@/utils/imageUrl'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  settings: Object,
  saving: Boolean
})

const emit = defineEmits(['save', 'add-slider', 'delete-slider', 'refresh'])

const uploading = ref(false)
const showDeleteModal = ref(false)
const sliderToDelete = ref(null)

const services = computed(() => [
  { key: 'hotel', icon: 'hotel', label: t('siteSettings.homepage.hotel') },
  { key: 'tour', icon: 'tour', label: t('siteSettings.homepage.tour') },
  { key: 'flight', icon: 'flight', label: t('siteSettings.homepage.flight') },
  { key: 'transfer', icon: 'airport_shuttle', label: t('siteSettings.homepage.transfer') }
])

const form = ref({
  slider: [],
  activeServices: {
    hotel: true,
    tour: true,
    flight: false,
    transfer: true
  }
})

watch(() => props.settings, (newSettings) => {
  if (newSettings) {
    form.value = {
      slider: newSettings.slider || [],
      activeServices: newSettings.activeServices || {
        hotel: true,
        tour: true,
        flight: false,
        transfer: true
      }
    }
  }
}, { immediate: true, deep: true })

// getImageUrl imported from @/utils/imageUrl

const handleSliderUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = true
  try {
    // First upload the image
    const uploadResponse = await siteSettingsService.uploadImage(file, 'slider')
    if (uploadResponse.success) {
      // Then add slider with the image URL
      emit('add-slider', {
        image: uploadResponse.data.url,
        title: { tr: '', en: '' },
        subtitle: { tr: '', en: '' },
        link: '',
        isActive: true
      })
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.uploadFailed'))
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

const confirmDeleteSlider = (slider) => {
  sliderToDelete.value = slider
  showDeleteModal.value = true
}

const handleDeleteSlider = () => {
  if (sliderToDelete.value) {
    emit('delete-slider', sliderToDelete.value._id)
    showDeleteModal.value = false
  }
}

const handleSave = () => {
  emit('save', { activeServices: form.value.activeServices })
}
</script>
