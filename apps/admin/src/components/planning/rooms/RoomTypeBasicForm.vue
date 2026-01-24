<template>
  <div class="space-y-6">
    <!-- Status Toggle - Prominent at Top -->
    <div
      class="flex items-center justify-between p-4 bg-gradient-to-r rounded-xl"
      :class="
        formData.status === 'active'
          ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800'
          : formData.status === 'draft'
            ? 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800'
            : 'from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200 dark:border-slate-700'
      "
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center"
          :class="
            formData.status === 'active'
              ? 'bg-green-500'
              : formData.status === 'draft'
                ? 'bg-amber-500'
                : 'bg-gray-400'
          "
        >
          <span class="material-icons text-white text-xl">
            {{
              formData.status === 'active'
                ? 'check'
                : formData.status === 'draft'
                  ? 'edit'
                  : 'pause'
            }}
          </span>
        </div>
        <div>
          <p
            class="font-semibold"
            :class="
              formData.status === 'active'
                ? 'text-green-700 dark:text-green-400'
                : formData.status === 'draft'
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-gray-600 dark:text-slate-400'
            "
          >
            {{ $t(`planning.roomTypes.status.${formData.status}`) }}
          </p>
          <p
            class="text-xs"
            :class="
              formData.status === 'active'
                ? 'text-green-600 dark:text-green-500'
                : formData.status === 'draft'
                  ? 'text-amber-600 dark:text-amber-500'
                  : 'text-gray-500 dark:text-slate-500'
            "
          >
            {{ $t(`planning.roomTypes.status.${formData.status}Hint`) }}
          </p>
        </div>
      </div>
      <!-- Status Buttons -->
      <div class="flex gap-2">
        <button
          v-for="status in ['draft', 'active', 'inactive']"
          :key="status"
          type="button"
          class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
          :class="
            formData.status === status
              ? status === 'active'
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                : status === 'draft'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-gray-500 text-white shadow-lg shadow-gray-500/30'
              : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:border-gray-400'
          "
          @click="formData.status = status"
        >
          {{ $t(`common.status.${status}`) }}
        </button>
      </div>
    </div>

    <!-- Basic Info Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Code with Autocomplete -->
      <div class="relative">
        <label class="form-label">
          {{ $t('planning.roomTypes.code') }}
          <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            ref="codeInputRef"
            v-model="codeInput"
            type="text"
            class="form-input uppercase pr-10"
            :class="{ 'border-red-500': codeError }"
            :placeholder="$t('planning.roomTypes.codePlaceholder')"
            :disabled="!isNew"
            maxlength="10"
            @input="handleCodeInput"
            @focus="handleCodeFocus"
            @blur="handleCodeBlur"
            @keydown.down.prevent="navigateSuggestion(1)"
            @keydown.up.prevent="navigateSuggestion(-1)"
            @keydown.enter.prevent="selectHighlightedSuggestion"
            @keydown.escape="showCodeSuggestions = false"
          />
          <button
            v-if="codeInput && isNew"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="clearCode"
          >
            <span class="material-icons text-sm">close</span>
          </button>
        </div>

        <!-- Error Message -->
        <p v-if="codeError" class="mt-1 text-xs text-red-500">{{ codeError }}</p>

        <!-- Selected Code Badge -->
        <div v-if="selectedCodeDef && isNew" class="mt-2 flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs"
          >
            <span class="material-icons text-xs">check_circle</span>
            {{ $t('planning.roomTypes.autoFilled') }}
          </span>
        </div>

        <!-- Suggestions Dropdown (Teleported to body) -->
        <Teleport to="body">
          <Transition name="dropdown">
            <div
              v-if="showCodeSuggestions && isNew && filteredCodeSuggestions.length > 0"
              class="fixed z-[9999] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-2xl max-h-72 overflow-y-auto"
              :style="dropdownStyle"
            >
              <div
                v-for="(suggestion, idx) in filteredCodeSuggestions"
                :key="suggestion.code"
                class="px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-700 last:border-0"
                :class="
                  highlightedIndex === idx
                    ? 'bg-purple-50 dark:bg-purple-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                "
                @mousedown.prevent="selectCodeSuggestion(suggestion)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span
                      class="w-12 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold"
                    >
                      {{ suggestion.code }}
                    </span>
                    <div>
                      <div class="font-medium text-gray-800 dark:text-white">
                        {{ suggestion.names[currentLang] || suggestion.names.en }}
                      </div>
                      <div
                        class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2"
                      >
                        <span class="material-icons text-xs">person</span>
                        {{ suggestion.occupancy.baseOccupancy }}
                        {{ $t('planning.pricing.standardOccupancy') }}
                      </div>
                    </div>
                  </div>
                  <span class="material-icons text-gray-400 text-sm">arrow_forward</span>
                </div>
              </div>

              <!-- Custom Code Option -->
              <div
                v-if="codeInput && !exactCodeMatch"
                class="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 border-t-2 border-gray-200 dark:border-slate-600"
                @mousedown.prevent="useCustomCode"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="w-12 h-10 rounded-lg bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300 flex items-center justify-center text-sm font-bold"
                  >
                    {{ codeInput.toUpperCase() }}
                  </span>
                  <div>
                    <div class="font-medium text-gray-700 dark:text-slate-300">
                      {{ $t('planning.roomTypes.useCustomCode') }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-slate-400">
                      {{ $t('planning.roomTypes.customCodeHint') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </Teleport>
      </div>

      <!-- Size -->
      <FormField
        v-model="formData.size"
        name="size"
        type="number"
        :label="$t('planning.roomTypes.size')"
        placeholder="m²"
        :min="0"
      />
    </div>

    <!-- Name (Multilingual) -->
    <MultiLangInput
      ref="nameFieldRef"
      v-model="formData.name"
      :languages="languages"
      :label="$t('planning.roomTypes.name')"
      :placeholder="$t('planning.roomTypes.namePlaceholder')"
      :show-translate="true"
      :required="true"
      @validation-change="handleFieldValidation"
    />

    <!-- Description (Multilingual) -->
    <MultiLangInput
      v-model="formData.description"
      :languages="languages"
      :label="$t('planning.roomTypes.descriptionLabel')"
      type="textarea"
      :rows="4"
      :show-translate="true"
    />

    <!-- Amenities -->
    <div class="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
      <h4 class="font-medium text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-indigo-600">room_service</span>
        {{ $t('planning.roomTypes.amenities.title') }}
      </h4>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <label
          v-for="amenity in amenitiesList"
          :key="amenity.key"
          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors"
          :class="
            formData.amenities.includes(amenity.key)
              ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'
              : 'bg-gray-50 dark:bg-slate-700/50 border border-transparent hover:bg-gray-100 dark:hover:bg-slate-700'
          "
        >
          <input
            type="checkbox"
            :checked="formData.amenities.includes(amenity.key)"
            class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            @change="toggleAmenity(amenity.key)"
          />
          <span class="material-icons text-sm text-gray-600 dark:text-slate-400">{{
            amenity.icon
          }}</span>
          <span class="text-sm text-gray-700 dark:text-slate-300">{{ amenity.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import FormField from '@/components/common/FormField.vue'
import {
  ROOM_CODE_DEFINITIONS,
  searchRoomCodes,
  getRoomCodeDefinition
} from '@/data/roomCodeDefinitions'

const props = defineProps({
  roomType: { type: Object, default: null },
  hotel: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false }
})

const emit = defineEmits(['validation-change'])

const { t, locale } = useI18n()
const toast = useToast()

const currentLang = computed(() => locale.value)

// 20 supported languages
const languages = [
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

// Helper to create empty multilingual object
const createMultiLangObject = () => {
  const obj = {}
  languages.forEach(lang => {
    obj[lang] = ''
  })
  return obj
}

// Code autocomplete state
const codeInput = ref('')
const codeInputRef = ref(null)
const showCodeSuggestions = ref(false)
const highlightedIndex = ref(-1)
const selectedCodeDef = ref(null)
const codeError = ref('')
const dropdownPosition = reactive({ top: 0, left: 0, width: 0 })
const blurTimeoutId = ref(null)

// Dropdown style for fixed positioning
const dropdownStyle = computed(() => ({
  top: `${dropdownPosition.top}px`,
  left: `${dropdownPosition.left}px`,
  width: `${dropdownPosition.width}px`
}))

// Filtered suggestions based on input
const filteredCodeSuggestions = computed(() => {
  if (!codeInput.value) {
    return ROOM_CODE_DEFINITIONS.slice(0, 8)
  }
  return searchRoomCodes(codeInput.value, currentLang.value).slice(0, 10)
})

// Check if current input matches an existing code exactly
const exactCodeMatch = computed(() => {
  return ROOM_CODE_DEFINITIONS.some(def => def.code === codeInput.value.toUpperCase())
})

// Update dropdown position
const updateDropdownPosition = () => {
  if (codeInputRef.value) {
    const rect = codeInputRef.value.getBoundingClientRect()
    dropdownPosition.top = rect.bottom + 4
    dropdownPosition.left = rect.left
    dropdownPosition.width = rect.width
  }
}

// Handle code input changes
const handleCodeInput = () => {
  formData.value.code = codeInput.value.toUpperCase()
  highlightedIndex.value = -1
  showCodeSuggestions.value = true
  codeError.value = ''
  updateDropdownPosition()

  if (selectedCodeDef.value && selectedCodeDef.value.code !== codeInput.value.toUpperCase()) {
    selectedCodeDef.value = null
  }
}

// Handle focus
const handleCodeFocus = () => {
  updateDropdownPosition()
  showCodeSuggestions.value = true
}

// Handle blur
const handleCodeBlur = () => {
  // Clear any existing timeout to prevent memory leaks
  if (blurTimeoutId.value) {
    clearTimeout(blurTimeoutId.value)
  }
  blurTimeoutId.value = setTimeout(() => {
    showCodeSuggestions.value = false
  }, 200)
}

// Cleanup timeout on unmount
onUnmounted(() => {
  if (blurTimeoutId.value) {
    clearTimeout(blurTimeoutId.value)
  }
})

// Navigate suggestions
const navigateSuggestion = direction => {
  const maxIndex =
    filteredCodeSuggestions.value.length - 1 + (codeInput.value && !exactCodeMatch.value ? 1 : 0)
  highlightedIndex.value = Math.max(-1, Math.min(maxIndex, highlightedIndex.value + direction))
}

// Select highlighted suggestion
const selectHighlightedSuggestion = () => {
  if (
    highlightedIndex.value >= 0 &&
    highlightedIndex.value < filteredCodeSuggestions.value.length
  ) {
    selectCodeSuggestion(filteredCodeSuggestions.value[highlightedIndex.value])
  } else if (
    highlightedIndex.value === filteredCodeSuggestions.value.length &&
    codeInput.value &&
    !exactCodeMatch.value
  ) {
    useCustomCode()
  }
}

// Select a predefined code suggestion
const selectCodeSuggestion = suggestion => {
  codeInput.value = suggestion.code
  formData.value.code = suggestion.code
  selectedCodeDef.value = suggestion
  showCodeSuggestions.value = false
  highlightedIndex.value = -1
  codeError.value = ''

  // Auto-fill all language names
  languages.forEach(lang => {
    if (suggestion.names[lang]) {
      formData.value.name[lang] = suggestion.names[lang]
    }
  })

  toast.success(t('planning.roomTypes.autoFillSuccess'))
}

// Use custom code
const useCustomCode = () => {
  formData.value.code = codeInput.value.toUpperCase()
  codeInput.value = codeInput.value.toUpperCase()
  selectedCodeDef.value = null
  showCodeSuggestions.value = false
  highlightedIndex.value = -1
}

// Clear code
const clearCode = () => {
  codeInput.value = ''
  formData.value.code = ''
  selectedCodeDef.value = null
  languages.forEach(lang => {
    formData.value.name[lang] = ''
  })
}

// Form field refs
const nameFieldRef = ref(null)

// Track field errors
const fieldErrors = ref({})

// Form data (only basic info - capacity/pricing moved to separate tab)
const formData = ref({
  code: '',
  name: createMultiLangObject(),
  description: createMultiLangObject(),
  size: null,
  amenities: [],
  status: 'draft'
})

// Handle field validation
const handleFieldValidation = ({ field, error }) => {
  if (error) {
    fieldErrors.value[field] = error
  } else {
    delete fieldErrors.value[field]
  }
  emit('validation-change', { ...fieldErrors.value })
}

// Amenities list with icons - must match roomType.model.js enum values
const amenitiesList = computed(() => [
  // Climate
  {
    key: 'airConditioning',
    icon: 'ac_unit',
    label: t('planning.roomTypes.amenities.airConditioning')
  },
  { key: 'heating', icon: 'whatshot', label: t('planning.roomTypes.amenities.heating') },
  { key: 'fan', icon: 'mode_fan', label: t('planning.roomTypes.amenities.fan') },
  // Entertainment
  { key: 'tv', icon: 'tv', label: t('planning.roomTypes.amenities.tv') },
  {
    key: 'satelliteTV',
    icon: 'satellite_alt',
    label: t('planning.roomTypes.amenities.satelliteTV')
  },
  // Connectivity
  { key: 'wifi', icon: 'wifi', label: t('planning.roomTypes.amenities.wifi') },
  { key: 'telephone', icon: 'phone', label: t('planning.roomTypes.amenities.telephone') },
  // Mini Bar & Kitchen
  { key: 'minibar', icon: 'kitchen', label: t('planning.roomTypes.amenities.minibar') },
  { key: 'refrigerator', icon: 'kitchen', label: t('planning.roomTypes.amenities.refrigerator') },
  { key: 'kettle', icon: 'coffee', label: t('planning.roomTypes.amenities.kettle') },
  {
    key: 'coffeeMachine',
    icon: 'coffee_maker',
    label: t('planning.roomTypes.amenities.coffeeMachine')
  },
  { key: 'kitchenette', icon: 'microwave', label: t('planning.roomTypes.amenities.kitchenette') },
  // Bathroom
  {
    key: 'privateBathroom',
    icon: 'bathroom',
    label: t('planning.roomTypes.amenities.privateBathroom')
  },
  { key: 'bathtub', icon: 'bathtub', label: t('planning.roomTypes.amenities.bathtub') },
  { key: 'shower', icon: 'shower', label: t('planning.roomTypes.amenities.shower') },
  { key: 'hairdryer', icon: 'air', label: t('planning.roomTypes.amenities.hairdryer') },
  { key: 'toiletries', icon: 'soap', label: t('planning.roomTypes.amenities.toiletries') },
  { key: 'bathrobes', icon: 'checkroom', label: t('planning.roomTypes.amenities.bathrobes') },
  { key: 'slippers', icon: 'spa', label: t('planning.roomTypes.amenities.slippers') },
  // View
  { key: 'seaView', icon: 'waves', label: t('planning.roomTypes.amenities.seaView') },
  { key: 'poolView', icon: 'pool', label: t('planning.roomTypes.amenities.poolView') },
  { key: 'gardenView', icon: 'local_florist', label: t('planning.roomTypes.amenities.gardenView') },
  { key: 'cityView', icon: 'location_city', label: t('planning.roomTypes.amenities.cityView') },
  { key: 'mountainView', icon: 'landscape', label: t('planning.roomTypes.amenities.mountainView') },
  // Outdoor
  { key: 'balcony', icon: 'balcony', label: t('planning.roomTypes.amenities.balcony') },
  { key: 'terrace', icon: 'deck', label: t('planning.roomTypes.amenities.terrace') },
  { key: 'privatePool', icon: 'pool', label: t('planning.roomTypes.amenities.privatePool') },
  { key: 'jacuzzi', icon: 'hot_tub', label: t('planning.roomTypes.amenities.jacuzzi') },
  // Comfort
  { key: 'safe', icon: 'lock', label: t('planning.roomTypes.amenities.safe') },
  { key: 'desk', icon: 'desk', label: t('planning.roomTypes.amenities.desk') },
  { key: 'sofa', icon: 'chair', label: t('planning.roomTypes.amenities.sofa') },
  { key: 'wardrobe', icon: 'checkroom', label: t('planning.roomTypes.amenities.wardrobe') },
  {
    key: 'ironingEquipment',
    icon: 'iron',
    label: t('planning.roomTypes.amenities.ironingEquipment')
  },
  // Services
  {
    key: 'roomService',
    icon: 'room_service',
    label: t('planning.roomTypes.amenities.roomService')
  },
  {
    key: 'dailyHousekeeping',
    icon: 'cleaning_services',
    label: t('planning.roomTypes.amenities.dailyHousekeeping')
  },
  {
    key: 'laundryService',
    icon: 'local_laundry_service',
    label: t('planning.roomTypes.amenities.laundryService')
  },
  // Special
  { key: 'nonSmoking', icon: 'smoke_free', label: t('planning.roomTypes.amenities.nonSmoking') },
  { key: 'petFriendly', icon: 'pets', label: t('planning.roomTypes.amenities.petFriendly') },
  {
    key: 'wheelchairAccessible',
    icon: 'accessible',
    label: t('planning.roomTypes.amenities.wheelchairAccessible')
  },
  {
    key: 'connectedRooms',
    icon: 'meeting_room',
    label: t('planning.roomTypes.amenities.connectedRooms')
  }
])

const toggleAmenity = key => {
  const idx = formData.value.amenities.indexOf(key)
  if (idx > -1) {
    formData.value.amenities.splice(idx, 1)
  } else {
    formData.value.amenities.push(key)
  }
}

// Track which roomType ID has been initialized to detect changes
const initializedRoomTypeId = ref(null)

// Watch for roomType prop changes (only reference changes, not deep)
watch(
  () => props.roomType,
  newVal => {
    // Initialize when roomType changes (different ID or new room)
    const currentId = newVal?._id || null
    if (newVal && initializedRoomTypeId.value !== currentId) {
      formData.value = {
        code: newVal.code || '',
        name: { ...createMultiLangObject(), ...newVal.name },
        description: { ...createMultiLangObject(), ...newVal.description },
        size: newVal.size || null,
        amenities: [...(newVal.amenities || [])],
        status: newVal.status || 'draft'
      }
      // Sync codeInput with formData
      codeInput.value = newVal.code || ''

      // Check if existing code matches a predefined definition
      if (newVal.code) {
        const existingDef = getRoomCodeDefinition(newVal.code)
        if (existingDef) {
          selectedCodeDef.value = existingDef
        }
      } else {
        selectedCodeDef.value = null
      }

      initializedRoomTypeId.value = currentId
    }
  },
  { immediate: true }
)

// Validate all fields
const validateAll = () => {
  let isValid = true
  const errors = []

  // Validate code field
  if (!formData.value.code || !formData.value.code.trim()) {
    isValid = false
    errors.push(t('planning.roomTypes.code'))
    codeError.value = t('validation.required')
  } else if (!/^[A-Z0-9]+$/i.test(formData.value.code)) {
    isValid = false
    errors.push(t('planning.roomTypes.code'))
    codeError.value = t('planning.roomTypes.codePattern')
  } else {
    codeError.value = ''
  }

  // Validate name field - check if at least one language has value
  const hasName = Object.values(formData.value.name).some(v => v && v.trim())
  if (!hasName) {
    isValid = false
    errors.push(t('planning.roomTypes.name'))
    fieldErrors.value['name'] = t('validation.required')
    emit('validation-change', { ...fieldErrors.value })
  }

  return { valid: isValid, errors }
}

// Expose form data getter for parent component (only basic info)
const getFormData = () => {
  return {
    code: formData.value.code.toUpperCase(),
    name: formData.value.name,
    description: formData.value.description,
    size: formData.value.size,
    amenities: formData.value.amenities,
    status: formData.value.status
  }
}

defineExpose({ getFormData, validateAll })
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
