<template>
  <Modal
    :model-value="true"
    :title="isEdit ? $t('hotels.roomTemplates.editRoom') : $t('hotels.roomTemplates.addRoom')"
    size="xl"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Room Code -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('hotels.roomTemplates.code') }} <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.code"
            type="text"
            class="form-input w-full uppercase"
            :class="{ 'border-red-500': errors.code }"
            :disabled="isEdit"
            maxlength="10"
            placeholder="STD, DLX, STE..."
            required
          />
          <p v-if="errors.code" class="text-red-500 text-xs mt-1">{{ errors.code }}</p>
          <p v-else class="text-gray-500 dark:text-slate-400 text-xs mt-1">{{ $t('hotels.roomTemplates.codeHint') }}</p>
        </div>

        <!-- Room Size -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('hotels.roomTemplates.size') }}
          </label>
          <div class="relative">
            <input
              v-model.number="form.size"
              type="number"
              class="form-input w-full pr-12"
              min="0"
              max="1000"
              placeholder="25"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400">m²</span>
          </div>
        </div>
      </div>

      <!-- Room Name (Multilingual) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('hotels.roomTemplates.name') }}
        </label>
        <MultiLangInput
          v-model="form.name"
          :languages="SUPPORTED_LANGUAGES"
          :placeholder="$t('hotels.roomTemplates.namePlaceholder')"
        />
      </div>

      <!-- Room Description (Multilingual) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('hotels.roomTemplates.roomDescription') }}
        </label>
        <MultiLangInput
          v-model="form.description"
          :languages="SUPPORTED_LANGUAGES"
          type="textarea"
          :rows="3"
          :placeholder="$t('hotels.roomTemplates.descriptionPlaceholder')"
        />
      </div>

      <!-- Occupancy -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          {{ $t('hotels.roomTemplates.occupancy') }}
        </label>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('hotels.roomTemplates.maxAdults') }}</label>
            <input v-model.number="form.occupancy.maxAdults" type="number" class="form-input w-full" min="1" max="10" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('hotels.roomTemplates.maxChildren') }}</label>
            <input v-model.number="form.occupancy.maxChildren" type="number" class="form-input w-full" min="0" max="6" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('hotels.roomTemplates.maxInfants') }}</label>
            <input v-model.number="form.occupancy.maxInfants" type="number" class="form-input w-full" min="0" max="2" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('hotels.roomTemplates.totalMax') }}</label>
            <input v-model.number="form.occupancy.totalMaxGuests" type="number" class="form-input w-full" min="1" max="12" />
          </div>
        </div>
      </div>

      <!-- Bed Configuration -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          {{ $t('hotels.roomTemplates.bedConfiguration') }}
        </label>
        <div class="space-y-2">
          <div
            v-for="(bed, index) in form.bedConfiguration"
            :key="index"
            class="flex items-center gap-3"
          >
            <select v-model="bed.type" class="form-input flex-1">
              <option value="">{{ $t('common.select') }}</option>
              <option v-for="type in bedTypes" :key="type" :value="type">
                {{ $t(`hotels.bedTypes.${type}`) }}
              </option>
            </select>
            <input
              v-model.number="bed.count"
              type="number"
              class="form-input w-20"
              min="1"
              max="10"
            />
            <button
              type="button"
              @click="removeBed(index)"
              class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              <span class="material-icons">remove_circle</span>
            </button>
          </div>
          <button
            type="button"
            @click="addBed"
            class="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm"
          >
            <span class="material-icons text-lg">add_circle</span>
            {{ $t('hotels.roomTemplates.addBed') }}
          </button>
        </div>
      </div>

      <!-- Amenities -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          {{ $t('hotels.roomTemplates.amenities') }}
        </label>
        <div class="max-h-80 overflow-y-auto p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-4">
          <div v-for="category in amenityCategories" :key="category.key">
            <!-- Category Header -->
            <div class="flex items-center gap-2 mb-2 pb-1 border-b border-gray-200 dark:border-slate-600">
              <span class="material-icons text-purple-500 text-lg">{{ category.icon }}</span>
              <span class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ category.label }}</span>
            </div>
            <!-- Amenities Grid -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
              <label
                v-for="amenity in category.amenities"
                :key="amenity.id"
                class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  v-model="form.amenities"
                  :value="amenity.id"
                  class="rounded border-gray-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
                />
                <span class="material-icons text-gray-400 dark:text-slate-500 text-base">{{ amenity.icon }}</span>
                <span class="text-sm text-gray-700 dark:text-slate-300">{{ $t(`hotels.roomAmenities.${amenity.id}`) }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Images (only for edit mode) -->
      <div v-if="isEdit">
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          {{ $t('hotels.roomTemplates.images') }}
        </label>

        <!-- Upload Area -->
        <div
          class="border-2 border-dashed rounded-lg p-4 text-center transition-colors mb-4"
          :class="isDragging
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-slate-600'"
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

          <div v-if="uploading" class="flex items-center justify-center gap-3">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span class="text-gray-600 dark:text-slate-400">{{ $t('common.uploading') }}</span>
          </div>
          <div v-else class="flex items-center justify-center gap-3">
            <span class="material-icons text-gray-400">cloud_upload</span>
            <span class="text-gray-600 dark:text-slate-400">{{ $t('hotels.gallery.dropImagesHere') }}</span>
            <button type="button" @click="$refs.fileInput.click()" class="btn-secondary text-sm">
              {{ $t('hotels.gallery.uploadImages') }}
            </button>
          </div>
        </div>

        <!-- Image Grid -->
        <div v-if="form.images?.length" class="grid grid-cols-4 gap-2">
          <div
            v-for="image in form.images"
            :key="image._id"
            class="relative group aspect-square bg-gray-100 dark:bg-slate-700 rounded overflow-hidden"
          >
            <img :src="getImageUrl(image.url)" class="w-full h-full object-cover" />
            <div v-if="image.isMain" class="absolute top-1 left-1 bg-purple-600 text-white text-xs px-1 rounded">
              {{ $t('hotels.gallery.isMain') }}
            </div>
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button
                v-if="!image.isMain"
                type="button"
                @click="setMainImage(image._id)"
                class="p-1 bg-white/20 hover:bg-white/30 rounded text-white text-sm"
              >
                <span class="material-icons text-sm">star</span>
              </button>
              <button
                type="button"
                @click="deleteImage(image._id)"
                class="p-1 bg-white/20 hover:bg-red-500/50 rounded text-white text-sm"
              >
                <span class="material-icons text-sm">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button type="button" @click="$emit('close')" class="btn-secondary">
          {{ $t('common.cancel') }}
        </button>
        <button type="button" @click="handleSubmit" class="btn-primary" :disabled="saving">
          <span v-if="saving" class="flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ $t('common.saving') }}
          </span>
          <span v-else>{{ $t('common.save') }}</span>
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import hotelService from '@/services/hotelService'
import { getImageUrl } from '@/utils/imageUrl'

const props = defineProps({
  hotelId: {
    type: String,
    required: true
  },
  template: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'saved'])

const { t } = useI18n()
const toast = useToast()

const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']

const bedTypes = ['single', 'double', 'queen', 'king', 'twin', 'sofa', 'bunk', 'extra']

// Room amenities with icons organized by category
const amenityCategories = computed(() => [
  {
    key: 'climateControl',
    label: t('hotels.roomAmenityCategories.climateControl'),
    icon: 'thermostat',
    amenities: [
      { id: 'airConditioning', icon: 'ac_unit' },
      { id: 'heating', icon: 'local_fire_department' },
      { id: 'fan', icon: 'mode_fan' },
      { id: 'centralHeating', icon: 'heat_pump' }
    ]
  },
  {
    key: 'entertainment',
    label: t('hotels.roomAmenityCategories.entertainment'),
    icon: 'tv',
    amenities: [
      { id: 'tv', icon: 'tv' },
      { id: 'satelliteTV', icon: 'satellite_alt' },
      { id: 'cableTV', icon: 'cable' },
      { id: 'smartTV', icon: 'connected_tv' },
      { id: 'radio', icon: 'radio' }
    ]
  },
  {
    key: 'connectivity',
    label: t('hotels.roomAmenityCategories.connectivity'),
    icon: 'wifi',
    amenities: [
      { id: 'wifi', icon: 'wifi' },
      { id: 'telephone', icon: 'phone' },
      { id: 'usbPorts', icon: 'usb' },
      { id: 'laptop', icon: 'laptop' }
    ]
  },
  {
    key: 'kitchen',
    label: t('hotels.roomAmenityCategories.kitchen'),
    icon: 'kitchen',
    amenities: [
      { id: 'minibar', icon: 'local_bar' },
      { id: 'refrigerator', icon: 'kitchen' },
      { id: 'kettle', icon: 'coffee' },
      { id: 'coffeeMachine', icon: 'coffee_maker' },
      { id: 'kitchenette', icon: 'countertops' },
      { id: 'microwave', icon: 'microwave' },
      { id: 'toaster', icon: 'breakfast_dining' }
    ]
  },
  {
    key: 'bathroom',
    label: t('hotels.roomAmenityCategories.bathroom'),
    icon: 'bathroom',
    amenities: [
      { id: 'privateBathroom', icon: 'bathroom' },
      { id: 'sharedBathroom', icon: 'wc' },
      { id: 'bathtub', icon: 'bathtub' },
      { id: 'shower', icon: 'shower' },
      { id: 'rainShower', icon: 'water_drop' },
      { id: 'jacuzzi', icon: 'hot_tub' },
      { id: 'hairdryer', icon: 'dry' },
      { id: 'toiletries', icon: 'soap' },
      { id: 'bathrobes', icon: 'checkroom' },
      { id: 'slippers', icon: 'steps' }
    ]
  },
  {
    key: 'view',
    label: t('hotels.roomAmenityCategories.view'),
    icon: 'panorama',
    amenities: [
      { id: 'seaView', icon: 'waves' },
      { id: 'poolView', icon: 'pool' },
      { id: 'gardenView', icon: 'local_florist' },
      { id: 'cityView', icon: 'location_city' },
      { id: 'mountainView', icon: 'terrain' },
      { id: 'landmarkView', icon: 'castle' }
    ]
  },
  {
    key: 'outdoor',
    label: t('hotels.roomAmenityCategories.outdoor'),
    icon: 'balcony',
    amenities: [
      { id: 'balcony', icon: 'balcony' },
      { id: 'terrace', icon: 'deck' },
      { id: 'privatePool', icon: 'pool' },
      { id: 'privateGarden', icon: 'yard' }
    ]
  },
  {
    key: 'comfort',
    label: t('hotels.roomAmenityCategories.comfort'),
    icon: 'chair',
    amenities: [
      { id: 'safe', icon: 'lock' },
      { id: 'desk', icon: 'desk' },
      { id: 'sofa', icon: 'chair' },
      { id: 'wardrobe', icon: 'door_sliding' },
      { id: 'ironingEquipment', icon: 'iron' },
      { id: 'soundproofing', icon: 'volume_off' }
    ]
  },
  {
    key: 'services',
    label: t('hotels.roomAmenityCategories.services'),
    icon: 'room_service',
    amenities: [
      { id: 'roomService', icon: 'room_service' },
      { id: 'dailyHousekeeping', icon: 'cleaning_services' },
      { id: 'laundryService', icon: 'local_laundry_service' },
      { id: 'turndownService', icon: 'bed' }
    ]
  },
  {
    key: 'accessibility',
    label: t('hotels.roomAmenityCategories.accessibility'),
    icon: 'accessible',
    amenities: [
      { id: 'wheelchairAccessible', icon: 'accessible' },
      { id: 'connectedRooms', icon: 'meeting_room' }
    ]
  },
  {
    key: 'special',
    label: t('hotels.roomAmenityCategories.special'),
    icon: 'stars',
    amenities: [
      { id: 'smokingAllowed', icon: 'smoking_rooms' },
      { id: 'nonSmoking', icon: 'smoke_free' },
      { id: 'petFriendly', icon: 'pets' },
      { id: 'hypoallergenic', icon: 'air' }
    ]
  }
])

const createEmptyMultiLang = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

const getEmptyForm = () => ({
  code: '',
  name: createEmptyMultiLang(),
  description: createEmptyMultiLang(),
  size: null,
  occupancy: {
    maxAdults: 2,
    maxChildren: 2,
    maxInfants: 1,
    totalMaxGuests: 4
  },
  bedConfiguration: [],
  amenities: [],
  images: []
})

const form = reactive(getEmptyForm())
const errors = reactive({})
const saving = ref(false)
const uploading = ref(false)
const isDragging = ref(false)
const fileInput = ref(null)

// getImageUrl imported from @/utils/imageUrl

const addBed = () => {
  form.bedConfiguration.push({ type: '', count: 1 })
}

const removeBed = (index) => {
  form.bedConfiguration.splice(index, 1)
}

const validate = () => {
  Object.keys(errors).forEach(key => delete errors[key])

  if (!form.code || form.code.trim() === '') {
    errors.code = t('validation.required')
    return false
  }

  if (form.code.length > 10) {
    errors.code = t('hotels.roomTemplates.codeTooLong')
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validate()) return

  saving.value = true
  try {
    // Prepare data
    const data = {
      code: form.code.toUpperCase().trim(),
      name: form.name,
      description: form.description,
      size: form.size,
      occupancy: form.occupancy,
      bedConfiguration: form.bedConfiguration.filter(b => b.type),
      amenities: form.amenities
    }

    if (props.isEdit) {
      await hotelService.updateRoomTemplate(props.hotelId, form.code, data)
      toast.success(t('hotels.roomTemplates.updated'))
    } else {
      await hotelService.createRoomTemplate(props.hotelId, data)
      toast.success(t('hotels.roomTemplates.created'))
    }

    emit('saved')
  } catch (error) {
    const message = error.response?.data?.message
    if (message === 'ROOM_TEMPLATE_CODE_EXISTS') {
      errors.code = t('hotels.roomTemplates.codeExists')
    } else {
      toast.error(message || t('common.operationFailed'))
    }
  } finally {
    saving.value = false
  }
}

// Image handling
const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length) {
    uploadImages(files)
  }
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files.length) {
    uploadImages(files)
  }
  e.target.value = ''
}

const uploadImages = async (files) => {
  uploading.value = true
  try {
    for (const file of files) {
      const response = await hotelService.uploadRoomTemplateImage(props.hotelId, form.code, file)
      if (response.success && response.data?.image) {
        form.images.push(response.data.image)
      }
    }
    toast.success(t('hotels.gallery.uploadSuccess'))
  } catch (error) {
    toast.error(t('common.operationFailed'))
  } finally {
    uploading.value = false
  }
}

const setMainImage = async (imageId) => {
  try {
    await hotelService.setRoomTemplateMainImage(props.hotelId, form.code, imageId)
    form.images.forEach(img => {
      img.isMain = img._id === imageId
    })
  } catch (error) {
    toast.error(t('common.operationFailed'))
  }
}

const deleteImage = async (imageId) => {
  try {
    await hotelService.deleteRoomTemplateImage(props.hotelId, form.code, imageId)
    form.images = form.images.filter(img => img._id !== imageId)
    toast.success(t('hotels.gallery.deleteSuccess'))
  } catch (error) {
    toast.error(t('common.operationFailed'))
  }
}

// Initialize form with template data if editing
watch(() => props.template, (template) => {
  if (template) {
    Object.assign(form, {
      code: template.code || '',
      name: { ...createEmptyMultiLang(), ...template.name },
      description: { ...createEmptyMultiLang(), ...template.description },
      size: template.size || null,
      occupancy: {
        maxAdults: template.occupancy?.maxAdults ?? 2,
        maxChildren: template.occupancy?.maxChildren ?? 2,
        maxInfants: template.occupancy?.maxInfants ?? 1,
        totalMaxGuests: template.occupancy?.totalMaxGuests ?? 4
      },
      bedConfiguration: template.bedConfiguration?.length
        ? template.bedConfiguration.map(b => ({ ...b }))
        : [],
      amenities: template.amenities ? [...template.amenities] : [],
      images: template.images ? [...template.images] : []
    })
  }
}, { immediate: true })
</script>
