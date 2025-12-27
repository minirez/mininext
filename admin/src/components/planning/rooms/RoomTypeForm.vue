<template>
  <div class="space-y-6">
    <!-- Code & Name -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Room Code with Autocomplete -->
      <div class="relative">
        <label class="form-label">{{ $t('planning.roomTypes.code') }} <span class="text-red-500">*</span></label>
        <div class="relative">
          <input
            ref="codeInputRef"
            v-model="codeInput"
            type="text"
            class="form-input uppercase pr-10"
            :placeholder="$t('planning.roomTypes.codePlaceholder')"
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
            v-if="codeInput"
            type="button"
            @click="clearCode"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <span class="material-icons text-sm">close</span>
          </button>
        </div>

        <!-- Suggestions Dropdown (Teleported to body to avoid modal overflow clipping) -->
        <Teleport to="body">
          <Transition name="dropdown">
            <div
              v-if="showCodeSuggestions && filteredCodeSuggestions.length > 0"
              class="fixed z-[9999] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-2xl max-h-72 overflow-y-auto"
              :style="dropdownStyle"
            >
              <div
                v-for="(suggestion, idx) in filteredCodeSuggestions"
                :key="suggestion.code"
                @mousedown.prevent="selectCodeSuggestion(suggestion)"
                class="px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-700 last:border-0"
                :class="highlightedIndex === idx
                  ? 'bg-purple-50 dark:bg-purple-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-12 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                      {{ suggestion.code }}
                    </span>
                    <div>
                      <div class="font-medium text-gray-800 dark:text-white">{{ suggestion.names[currentLang] || suggestion.names.en }}</div>
                      <div class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
                        <span class="material-icons text-xs">person</span>
                        {{ suggestion.occupancy.baseOccupancy }} {{ $t('planning.pricing.standardOccupancy') }}
                      </div>
                    </div>
                  </div>
                  <span class="material-icons text-gray-400 text-sm">arrow_forward</span>
                </div>
              </div>

              <!-- Custom Code Option -->
              <div
                v-if="codeInput && !exactCodeMatch"
                @mousedown.prevent="useCustomCode"
                class="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 border-t-2 border-gray-200 dark:border-slate-600"
              >
                <div class="flex items-center gap-3">
                  <span class="w-12 h-10 rounded-lg bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300 flex items-center justify-center text-sm font-bold">
                    {{ codeInput.toUpperCase() }}
                  </span>
                  <div>
                    <div class="font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.roomTypes.useCustomCode') }}</div>
                    <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.roomTypes.customCodeHint') }}</div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </Teleport>

        <!-- Selected Code Badge -->
        <div v-if="selectedCodeDef" class="mt-2 flex items-center gap-2">
          <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
            <span class="material-icons text-xs">check_circle</span>
            {{ $t('planning.roomTypes.autoFilled') }}
          </span>
        </div>
      </div>

    </div>

    <!-- Name (Multilingual) -->
    <MultiLangInput
      v-model="form.name"
      :languages="SUPPORTED_LANGUAGES"
      :label="$t('planning.roomTypes.name') + ' *'"
    />

    <!-- Occupancy -->
    <div>
      <label class="form-label">{{ $t('planning.roomTypes.occupancy') }}</label>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <div>
          <label class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.roomTypes.maxAdults') }}</label>
          <input v-model.number="form.occupancy.maxAdults" type="number" min="1" max="10" class="form-input mt-1" />
        </div>
        <div>
          <label class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.roomTypes.maxChildren') }}</label>
          <input v-model.number="form.occupancy.maxChildren" type="number" min="0" max="6" class="form-input mt-1" />
        </div>
        <div>
          <label class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.roomTypes.maxInfants') }}</label>
          <input v-model.number="form.occupancy.maxInfants" type="number" min="0" max="2" class="form-input mt-1" />
        </div>
        <div>
          <label class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.roomTypes.totalMax') }}</label>
          <input v-model.number="form.occupancy.totalMaxGuests" type="number" min="1" max="12" class="form-input mt-1" />
        </div>
      </div>
    </div>

    <!-- Size -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="form-label">{{ $t('planning.roomTypes.size') }} (m²)</label>
        <input v-model.number="form.size" type="number" min="0" class="form-input" />
      </div>
      <div>
        <label class="form-label">{{ $t('common.status.label') }}</label>
        <select v-model="form.status" class="form-select">
          <option value="draft">{{ $t('common.status.draft') }}</option>
          <option value="active">{{ $t('common.status.active') }}</option>
          <option value="inactive">{{ $t('common.status.inactive') }}</option>
        </select>
      </div>
    </div>

    <!-- Amenities -->
    <div>
      <label class="form-label">{{ $t('planning.roomTypes.amenities') }}</label>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <label
          v-for="amenity in availableAmenities"
          :key="amenity"
          class="flex items-center gap-2 text-sm cursor-pointer"
        >
          <input
            type="checkbox"
            :value="amenity"
            v-model="form.amenities"
            class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span class="text-gray-700 dark:text-slate-300">{{ $t(`planning.roomTypes.amenities.${amenity}`) }}</span>
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">
        {{ $t('common.cancel') }}
      </button>
      <button type="button" @click="handleSave" class="btn-primary" :disabled="saving">
        <span v-if="saving">{{ $t('common.loading') }}</span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'
import { ROOM_CODE_DEFINITIONS, searchRoomCodes, getRoomCodeDefinition } from '@/data/roomCodeDefinitions'
import MultiLangInput from '@/components/common/MultiLangInput.vue'

const props = defineProps({
  hotel: { type: Object, required: true },
  roomType: { type: Object, default: null }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()

const currentLang = computed(() => locale.value)
const saving = ref(false)

// Code autocomplete state
const codeInput = ref('')
const codeInputRef = ref(null)
const showCodeSuggestions = ref(false)
const highlightedIndex = ref(-1)
const selectedCodeDef = ref(null)
const dropdownPosition = reactive({ top: 0, left: 0, width: 0 })

// Dropdown style for fixed positioning
const dropdownStyle = computed(() => ({
  top: `${dropdownPosition.top}px`,
  left: `${dropdownPosition.left}px`,
  width: `${dropdownPosition.width}px`
}))

// Update dropdown position when showing
const updateDropdownPosition = () => {
  if (codeInputRef.value) {
    const rect = codeInputRef.value.getBoundingClientRect()
    dropdownPosition.top = rect.bottom + 4
    dropdownPosition.left = rect.left
    dropdownPosition.width = rect.width
  }
}

const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']

const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

const form = reactive({
  code: '',
  name: createMultiLangObject(),
  description: createMultiLangObject(),
  occupancy: {
    maxAdults: 2,
    maxChildren: 2,
    maxInfants: 1,
    totalMaxGuests: 4,
    baseOccupancy: 2
  },
  size: null,
  amenities: [],
  status: 'draft'
})

// Filtered suggestions based on input
const filteredCodeSuggestions = computed(() => {
  if (!codeInput.value) {
    return ROOM_CODE_DEFINITIONS.slice(0, 8) // Show first 8 when empty
  }
  return searchRoomCodes(codeInput.value, currentLang.value).slice(0, 10)
})

// Check if current input matches an existing code exactly
const exactCodeMatch = computed(() => {
  return ROOM_CODE_DEFINITIONS.some(def => def.code === codeInput.value.toUpperCase())
})

// Handle code input changes
const handleCodeInput = () => {
  form.code = codeInput.value.toUpperCase()
  highlightedIndex.value = -1
  showCodeSuggestions.value = true
  updateDropdownPosition()

  // Clear selected code def if input changed manually
  if (selectedCodeDef.value && selectedCodeDef.value.code !== codeInput.value.toUpperCase()) {
    selectedCodeDef.value = null
  }
}

// Handle focus - show suggestions and update position
const handleCodeFocus = () => {
  updateDropdownPosition()
  showCodeSuggestions.value = true
}

// Handle blur (delayed to allow click on suggestion)
const handleCodeBlur = () => {
  setTimeout(() => {
    showCodeSuggestions.value = false
  }, 200)
}

// Navigate suggestions with keyboard
const navigateSuggestion = (direction) => {
  const maxIndex = filteredCodeSuggestions.value.length - 1 + (codeInput.value && !exactCodeMatch.value ? 1 : 0)
  highlightedIndex.value = Math.max(-1, Math.min(maxIndex, highlightedIndex.value + direction))
}

// Select highlighted suggestion with Enter
const selectHighlightedSuggestion = () => {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredCodeSuggestions.value.length) {
    selectCodeSuggestion(filteredCodeSuggestions.value[highlightedIndex.value])
  } else if (highlightedIndex.value === filteredCodeSuggestions.value.length && codeInput.value && !exactCodeMatch.value) {
    useCustomCode()
  }
}

// Select a predefined code suggestion
const selectCodeSuggestion = (suggestion) => {
  codeInput.value = suggestion.code
  form.code = suggestion.code
  selectedCodeDef.value = suggestion
  showCodeSuggestions.value = false
  highlightedIndex.value = -1

  // Auto-fill all language names
  SUPPORTED_LANGUAGES.forEach(lang => {
    if (suggestion.names[lang]) {
      form.name[lang] = suggestion.names[lang]
    }
  })

  // Auto-fill occupancy
  if (suggestion.occupancy) {
    form.occupancy = { ...form.occupancy, ...suggestion.occupancy }
  }

  toast.success(t('planning.roomTypes.autoFillSuccess'))
}

// Use custom code (not from predefined list)
const useCustomCode = () => {
  form.code = codeInput.value.toUpperCase()
  codeInput.value = codeInput.value.toUpperCase()
  selectedCodeDef.value = null
  showCodeSuggestions.value = false
  highlightedIndex.value = -1
}

// Clear code input
const clearCode = () => {
  codeInput.value = ''
  form.code = ''
  selectedCodeDef.value = null
  // Clear all names
  SUPPORTED_LANGUAGES.forEach(lang => {
    form.name[lang] = ''
  })
}

const availableAmenities = [
  'airConditioning', 'heating', 'tv', 'wifi', 'minibar', 'refrigerator',
  'kettle', 'coffeeMachine', 'privateBathroom', 'bathtub', 'shower',
  'hairdryer', 'seaView', 'poolView', 'gardenView', 'balcony', 'terrace',
  'safe', 'desk', 'wardrobe', 'roomService', 'nonSmoking'
]

const handleSave = async () => {
  const hasName = SUPPORTED_LANGUAGES.some(l => form.name[l]?.trim())
  if (!form.code || !hasName) {
    toast.error(t('validation.required'))
    return
  }

  saving.value = true
  try {
    if (props.roomType) {
      await planningService.updateRoomType(props.hotel._id, props.roomType._id, form)
      toast.success(t('planning.roomTypes.updated'))
    } else {
      await planningService.createRoomType(props.hotel._id, form)
      toast.success(t('planning.roomTypes.created'))
    }
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (props.roomType) {
    form.code = props.roomType.code || ''
    codeInput.value = props.roomType.code || ''
    form.name = { ...createMultiLangObject(), ...props.roomType.name }
    form.description = { ...createMultiLangObject(), ...props.roomType.description }
    form.occupancy = { ...form.occupancy, ...props.roomType.occupancy }
    form.size = props.roomType.size || null
    form.amenities = [...(props.roomType.amenities || [])]
    form.status = props.roomType.status || 'draft'

    // Check if existing code matches a predefined definition
    const existingDef = getRoomCodeDefinition(form.code)
    if (existingDef) {
      selectedCodeDef.value = existingDef
    }
  }
})
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
