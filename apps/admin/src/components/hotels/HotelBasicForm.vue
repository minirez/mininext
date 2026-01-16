<template>
  <div class="space-y-8">
    <!-- Readonly Notice (for linked hotels) -->
    <div
      v-if="readonly"
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3"
    >
      <span class="material-icons text-blue-500 dark:text-blue-400 mt-0.5">info</span>
      <div>
        <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200">
          {{ $t('hotels.linkedHotel.notice') }}
        </h4>
        <p class="text-sm text-blue-600 dark:text-blue-300 mt-1">
          {{ $t('hotels.linkedHotel.description') }}
        </p>
      </div>
    </div>

    <!-- Basic Information -->
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {{ $t('hotels.basic.title') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-6">
        {{ $t('hotels.basic.hotelName') }}
      </p>

      <!-- Hotel Name and Tags Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Hotel Name -->
        <FormField
          ref="nameFieldRef"
          v-model="form.name"
          name="name"
          :label="$t('hotels.basic.hotelName')"
          :placeholder="$t('hotels.basic.hotelName')"
          :required="!readonly"
          :disabled="readonly"
          :rules="readonly ? [] : [{ required: true, message: $t('validation.required') }]"
          @validation-change="({ field, error }) => handleFieldValidation(field || 'name', error)"
        />

        <!-- Hotel Tags -->
        <TagInput
          v-model="form.tags"
          :label="$t('hotels.basic.tags')"
          :placeholder="$t('hotels.basic.tagsPlaceholder')"
          :help="$t('hotels.basic.tagsHelp')"
          :allow-create="true"
          :disabled="readonly"
        />
      </div>

      <!-- Hotel Description (Multilingual - All 20 languages) -->
      <div class="mb-6">
        <MultiLangInput
          v-model="form.description"
          :languages="SUPPORTED_LANGUAGES"
          :label="$t('hotels.basic.description')"
          type="textarea"
          :rows="4"
          :placeholder="$t('hotels.basic.description')"
          :disabled="readonly"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Slug with Generate Button -->
        <div>
          <label class="form-label"
            >{{ $t('hotels.basic.slug') }} <span v-if="!readonly">*</span></label
          >
          <div class="flex gap-2">
            <FormField
              ref="slugFieldRef"
              v-model="form.slug"
              name="slug"
              icon="link"
              :required="!readonly"
              :disabled="readonly"
              :rules="
                readonly
                  ? []
                  : [
                      { required: true, message: $t('validation.required') },
                      { pattern: /^[a-z0-9-]+$/, message: $t('validation.slugPattern') }
                    ]
              "
              :help="$t('hotels.basic.slugHelp')"
              class="flex-1 mb-0"
              @validation-change="
                ({ field, error }) => handleFieldValidation(field || 'slug', error)
              "
              @blur="normalizeSlug"
            />
            <button
              v-if="!readonly"
              type="button"
              class="px-3 py-2 h-[42px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              :title="$t('hotels.basic.generateSlug')"
              @click="generateSlugFromName"
            >
              <span class="material-icons text-lg">auto_fix_high</span>
            </button>
          </div>
        </div>

        <!-- Stars -->
        <div>
          <StarSelector
            v-model="form.stars"
            :label="$t('hotels.stars')"
            :required="!readonly"
            :disabled="readonly"
          />
        </div>

        <!-- Type -->
        <div>
          <label class="form-label">{{ $t('hotels.type') }} <span v-if="!readonly">*</span></label>
          <select v-model="form.type" class="form-input" :required="!readonly" :disabled="readonly">
            <option v-for="type in hotelTypes" :key="type" :value="type">
              {{ $t(`hotels.types.${type}`) }}
            </option>
          </select>
        </div>

        <!-- Category -->
        <div>
          <label class="form-label">{{ $t('hotels.basic.category') }}</label>
          <select v-model="form.category" class="form-input" :disabled="readonly">
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ $t(`hotels.categories.${cat}`) }}
            </option>
          </select>
        </div>

        <!-- Status (not readonly - partner can change this) -->
        <div v-if="!readonly">
          <label class="form-label">{{ $t('common.status.label') }}</label>
          <select v-model="form.status" class="form-input">
            <option value="draft">{{ $t('hotels.statuses.draft') }}</option>
            <option value="active">{{ $t('hotels.statuses.active') }}</option>
            <option value="inactive">{{ $t('hotels.statuses.inactive') }}</option>
          </select>
        </div>

        <!-- Featured (not readonly - partner can change this) -->
        <div v-if="!readonly" class="flex items-center">
          <label class="flex items-center cursor-pointer">
            <input
              v-model="form.featured"
              type="checkbox"
              class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-slate-300">{{
              $t('hotels.basic.featured')
            }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Visibility Settings (Partner settings only - not for base hotels) -->
    <div
      v-if="!readonly && !isBaseHotel"
      class="pt-6 border-t border-gray-200 dark:border-slate-700"
    >
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {{ $t('hotels.basic.visibility') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
        {{ $t('hotels.basic.visibility') }}
      </p>

      <div class="flex flex-wrap gap-6">
        <!-- B2C Visibility -->
        <label class="flex items-center cursor-pointer">
          <input
            v-model="form.visibility.b2c"
            type="checkbox"
            class="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
          />
          <span class="ml-3 text-sm text-gray-700 dark:text-slate-300">
            <span class="font-medium">{{ $t('hotels.basic.b2cVisible') }}</span>
          </span>
        </label>

        <!-- B2B Visibility -->
        <label class="flex items-center cursor-pointer">
          <input
            v-model="form.visibility.b2b"
            type="checkbox"
            class="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
          />
          <span class="ml-3 text-sm text-gray-700 dark:text-slate-300">
            <span class="font-medium">{{ $t('hotels.basic.b2bVisible') }}</span>
          </span>
        </label>
      </div>
    </div>

    <!-- Room Configuration -->
    <div class="pt-6 border-t border-gray-200 dark:border-slate-700">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {{ $t('hotels.basic.roomConfig') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
        {{ $t('hotels.basic.roomConfig') }}
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Total Rooms -->
        <div>
          <label class="form-label">{{ $t('hotels.basic.totalRooms') }}</label>
          <input
            v-model.number="form.roomConfig.totalRooms"
            type="number"
            min="0"
            class="form-input"
            :disabled="readonly"
          />
        </div>

        <!-- Floors -->
        <div>
          <label class="form-label">{{ $t('hotels.basic.floors') }}</label>
          <input
            v-model.number="form.roomConfig.floors"
            type="number"
            min="1"
            class="form-input"
            :disabled="readonly"
          />
        </div>

        <!-- Has Elevator -->
        <div class="flex items-center pt-6">
          <label class="flex items-center" :class="{ 'cursor-pointer': !readonly }">
            <input
              v-model="form.roomConfig.hasElevator"
              type="checkbox"
              :disabled="readonly"
              class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-slate-300">{{
              $t('hotels.basic.hasElevator')
            }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Logo Section -->
    <div class="pt-6 border-t border-gray-200 dark:border-slate-700">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {{ $t('hotels.basic.logo') }}
      </h3>
      <p v-if="!readonly" class="text-sm text-gray-500 dark:text-slate-400 mb-4">
        {{ $t('hotels.basic.logoHelp') }}
      </p>

      <!-- Readonly mode: Just show logo preview -->
      <div v-if="readonly">
        <div v-if="form.logo" class="w-32 h-32">
          <img
            :src="getLogoUrl(form.logo)"
            alt="Hotel Logo"
            class="w-32 h-32 object-contain bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600"
          />
        </div>
        <div
          v-else
          class="w-32 h-32 bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 flex items-center justify-center"
        >
          <span class="material-icons text-4xl text-gray-400 dark:text-slate-500">image</span>
        </div>
      </div>

      <!-- Edit mode: Full upload functionality -->
      <div v-else class="flex items-start gap-6">
        <!-- Logo Preview -->
        <div class="flex-shrink-0">
          <div v-if="logoPreview || form.logo" class="relative">
            <img
              :src="logoPreview || getLogoUrl(form.logo)"
              alt="Hotel Logo"
              class="w-32 h-32 object-contain bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600"
            />
            <button
              type="button"
              class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              @click="removeLogo"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </div>
          <div
            v-else
            class="w-32 h-32 bg-gray-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center"
          >
            <span class="material-icons text-4xl text-gray-400 dark:text-slate-500">image</span>
          </div>
        </div>

        <!-- Upload Area -->
        <div class="flex-1">
          <div
            class="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer"
            :class="{ 'border-purple-500 bg-purple-50 dark:bg-purple-900/20': dragOver }"
            @click="triggerLogoInput"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="handleLogoDrop"
          >
            <input
              ref="logoInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              class="hidden"
              @change="handleLogoSelect"
            />
            <span class="material-icons text-3xl text-gray-400 dark:text-slate-500 mb-2"
              >cloud_upload</span
            >
            <p class="text-sm text-gray-600 dark:text-slate-400">
              {{ $t('hotels.basic.dropLogoHere') }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-500 mt-1">
              PNG, JPG, WebP, SVG (max 2MB)
            </p>
          </div>

          <!-- Uploading indicator -->
          <div
            v-if="logoUploading"
            class="mt-3 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400"
          >
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
            {{ $t('common.uploading') }}
          </div>

          <!-- New hotel warning -->
          <p
            v-if="isNew && pendingLogoFile"
            class="mt-3 text-xs text-amber-600 dark:text-amber-400"
          >
            <span class="material-icons text-xs align-middle mr-1">info</span>
            {{ $t('hotels.basic.logoSaveHint') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import FormField from '@/components/common/FormField.vue'
import StarSelector from '@/components/common/StarSelector.vue'
import TagInput from '@/components/common/TagInput.vue'
import hotelService from '@/services/hotelService'
import { getFileUrl } from '@/utils/imageUrl'

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  isBaseHotel: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['validation-change'])

const route = useRoute()
const toast = useToast()
const { t } = useI18n()

// All supported languages (20 languages for B2B)
const SUPPORTED_LANGUAGES = [
  'tr',
  'en',
  'ru',
  'el',
  'de',
  'es',
  'it',
  'fr',
  'ro',
  'bg',
  'pt',
  'da',
  'zh',
  'ar',
  'fa',
  'he',
  'sq',
  'uk',
  'pl',
  'az'
]

// Create empty multilingual object
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => {
    obj[lang] = ''
  })
  return obj
}

// Hotel types
const hotelTypes = [
  'hotel',
  'apart',
  'boutique',
  'resort',
  'hostel',
  'villa',
  'guesthouse',
  'motel',
  'pension',
  'camping'
]

// Categories
const categories = ['economy', 'standard', 'superior', 'deluxe', 'luxury', 'ultra-luxury']

// Logo upload state
const logoInput = ref(null)
const logoPreview = ref(null)
const pendingLogoFile = ref(null)
const logoUploading = ref(false)
const dragOver = ref(false)

const form = ref({
  name: '',
  description: createMultiLangObject(),
  slug: '',
  logo: '',
  tags: [],
  stars: 3,
  type: 'hotel',
  category: 'standard',
  status: 'draft',
  featured: false,
  visibility: {
    b2c: true,
    b2b: true
  },
  roomConfig: {
    totalRooms: 0,
    floors: 1,
    hasElevator: false
  }
})

// Form field refs for validation
const nameFieldRef = ref(null)
const slugFieldRef = ref(null)

// Track field errors
const fieldErrors = ref({})

const handleFieldValidation = (fieldName, error) => {
  if (error) {
    fieldErrors.value[fieldName] = error
  } else {
    delete fieldErrors.value[fieldName]
  }
  emit('validation-change', { ...fieldErrors.value })
}

// Watch for hotel changes and update form
watch(
  () => props.hotel,
  newHotel => {
    if (newHotel) {
      form.value = {
        name: newHotel.name || '',
        description: { ...createMultiLangObject(), ...newHotel.description },
        slug: newHotel.slug || '',
        logo: newHotel.logo || '',
        tags: newHotel.tags || [],
        stars: newHotel.stars || 3,
        type: newHotel.type || 'hotel',
        category: newHotel.category || 'standard',
        status: newHotel.status || 'draft',
        featured: newHotel.featured || false,
        visibility: {
          b2c: newHotel.visibility?.b2c ?? true,
          b2b: newHotel.visibility?.b2b ?? true
        },
        roomConfig: {
          totalRooms: newHotel.roomConfig?.totalRooms || 0,
          floors: newHotel.roomConfig?.floors || 1,
          hasElevator: newHotel.roomConfig?.hasElevator || false
        }
      }
      // Reset logo preview when hotel changes
      logoPreview.value = null
      pendingLogoFile.value = null

      // Clear any existing validation errors when data loads
      if (Object.keys(fieldErrors.value).length > 0) {
        fieldErrors.value = {}
        emit('validation-change', {})
      }
    }
  },
  { immediate: true, deep: true }
)

// Generate URL-friendly slug
const generateSlug = text => {
  if (!text) return ''

  // Turkish character replacements
  const turkishMap = {
    ç: 'c',
    ğ: 'g',
    ı: 'i',
    ö: 'o',
    ş: 's',
    ü: 'u',
    Ç: 'c',
    Ğ: 'g',
    İ: 'i',
    Ö: 'o',
    Ş: 's',
    Ü: 'u'
  }

  let slug = text.toLowerCase()

  // Replace Turkish characters
  for (const [from, to] of Object.entries(turkishMap)) {
    slug = slug.replace(new RegExp(from, 'g'), to)
  }

  return slug
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Generate slug from name button click
const generateSlugFromName = () => {
  if (form.value.name) {
    form.value.slug = generateSlug(form.value.name)
  }
}

// Normalize slug on blur
const normalizeSlug = () => {
  if (form.value.slug) {
    form.value.slug = generateSlug(form.value.slug)
  }
}

// Get logo URL using centralized helper
const getLogoUrl = logo => {
  if (!logo) return ''
  return getFileUrl(logo) || ''
}

// Trigger file input
const triggerLogoInput = () => {
  logoInput.value?.click()
}

// Handle logo file select
const handleLogoSelect = event => {
  const file = event.target.files?.[0]
  if (file) {
    processLogoFile(file)
  }
}

// Handle drag and drop
const handleLogoDrop = event => {
  dragOver.value = false
  const file = event.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processLogoFile(file)
  }
}

// Process logo file
const processLogoFile = async file => {
  // Validate file size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast.error(t('hotels.basic.logoSizeError'))
    return
  }

  // Create preview
  const reader = new FileReader()
  reader.onload = e => {
    logoPreview.value = e.target.result
  }
  reader.readAsDataURL(file)

  // If existing hotel, upload immediately
  if (!props.isNew && route.params.id) {
    await uploadLogo(file)
  } else {
    // For new hotel, store file to upload after creation
    pendingLogoFile.value = file
  }
}

// Upload logo to server
const uploadLogo = async file => {
  logoUploading.value = true
  try {
    const response = await hotelService.uploadLogo(route.params.id, file)
    if (response.success) {
      form.value.logo = response.data.logo
      logoPreview.value = null
      pendingLogoFile.value = null
      toast.success(t('hotels.basic.logoUploaded'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('hotels.basic.logoUploadError'))
    logoPreview.value = null
  } finally {
    logoUploading.value = false
  }
}

// Remove logo
const removeLogo = async () => {
  // If there's a pending file (not uploaded yet), just clear it
  if (pendingLogoFile.value) {
    pendingLogoFile.value = null
    logoPreview.value = null
    return
  }

  // If there's an existing logo on server, delete it
  if (form.value.logo && !props.isNew && route.params.id) {
    try {
      await hotelService.deleteLogo(route.params.id)
      form.value.logo = ''
      toast.success(t('hotels.basic.logoDeleted'))
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.operationFailed'))
    }
  } else {
    form.value.logo = ''
    logoPreview.value = null
  }
}

// Validate all fields by calling each FormField's validate method
const validateAll = () => {
  let isValid = true

  // Validate name field
  if (nameFieldRef.value) {
    const result = nameFieldRef.value.validate()
    if (!result.valid) isValid = false
  }

  // Validate slug field
  if (slugFieldRef.value) {
    const result = slugFieldRef.value.validate()
    if (!result.valid) isValid = false
  }

  return isValid
}

// Get current form data (called by parent)
const getFormData = () => {
  return {
    ...form.value,
    _pendingLogoFile: pendingLogoFile.value
  }
}

// Expose methods for parent component
defineExpose({
  validateAll,
  getFormData
})
</script>
