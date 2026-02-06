<template>
  <Modal
    :model-value="true"
    :title="$t('planning.roomTemplates.importTitle')"
    size="lg"
    @close="$emit('close')"
  >
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <span class="material-icons text-4xl text-red-500">error_outline</span>
      <p class="mt-2 text-gray-600 dark:text-slate-400">{{ error }}</p>
      <button class="mt-4 btn-secondary" @click="fetchTemplates">
        {{ $t('common.tryAgain') }}
      </button>
    </div>

    <!-- No Templates -->
    <div v-else-if="templates.length === 0" class="text-center py-8">
      <span class="material-icons text-4xl text-gray-400">bedroom_parent</span>
      <p class="mt-2 text-gray-600 dark:text-slate-400">
        {{ $t('planning.roomTemplates.noTemplates') }}
      </p>
    </div>

    <!-- Templates List -->
    <div v-else class="space-y-4">
      <!-- Base Hotel Info -->
      <div class="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <span class="material-icons text-indigo-600 dark:text-indigo-400">business</span>
        <div>
          <p class="font-medium text-indigo-800 dark:text-indigo-300">{{ baseHotelName }}</p>
          <p class="text-sm text-indigo-600 dark:text-indigo-400">
            {{ $t('planning.roomTemplates.baseHotelTemplates') }}
          </p>
        </div>
      </div>

      <!-- Select All -->
      <div
        class="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-700"
      >
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            :checked="allSelected"
            class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            @change="toggleSelectAll"
          />
          <span class="text-sm text-gray-700 dark:text-slate-300">{{
            $t('common.selectAll')
          }}</span>
        </label>
        <span class="text-sm text-gray-500 dark:text-slate-400">
          {{ selectedTemplates.length }} / {{ templates.length }} {{ $t('common.selected') }}
        </span>
      </div>

      <!-- Template Cards -->
      <div class="space-y-2 max-h-80 overflow-y-auto">
        <label
          v-for="template in templates"
          :key="template.code"
          class="flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors"
          :class="{
            'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20': isSelected(template.code),
            'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50':
              !isSelected(template.code),
            'opacity-50 cursor-not-allowed': isAlreadyImported(template.code)
          }"
        >
          <input
            v-model="selectedTemplates"
            type="checkbox"
            :value="template.code"
            :disabled="isAlreadyImported(template.code)"
            class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />

          <!-- Room Image -->
          <div
            class="w-20 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-slate-600"
          >
            <img
              v-if="getMainImage(template)"
              :src="getMainImage(template)"
              :alt="getTemplateName(template)"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="material-icons text-gray-400 dark:text-slate-500">bedroom_parent</span>
            </div>
          </div>

          <!-- Room Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{{
                template.code
              }}</span>
              <span class="font-medium text-gray-800 dark:text-white truncate">{{
                getTemplateName(template)
              }}</span>
              <span
                v-if="isAlreadyImported(template.code)"
                class="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded"
              >
                {{ $t('planning.roomTemplates.alreadyExists') }}
              </span>
            </div>
            <div class="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
              <span v-if="template.size" class="flex items-center gap-1">
                <span class="material-icons text-sm">square_foot</span>
                {{ template.size }}m²
              </span>
              <span v-if="template.occupancy" class="flex items-center gap-1">
                <span class="material-icons text-sm">people</span>
                {{ template.occupancy.maxAdults }}+{{ template.occupancy.maxChildren }}
              </span>
              <span v-if="template.amenities?.length" class="flex items-center gap-1">
                <span class="material-icons text-sm">check_circle</span>
                {{ template.amenities.length }} {{ $t('hotels.roomTemplates.amenities') }}
              </span>
            </div>
          </div>
        </label>
      </div>

      <!-- Info Box -->
      <div
        class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm text-gray-600 dark:text-slate-400"
      >
        <div class="flex items-start gap-2">
          <span class="material-icons text-gray-400">info</span>
          <p>{{ $t('planning.roomTemplates.importInfo') }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button class="btn-secondary" @click="$emit('close')">
          {{ $t('common.cancel') }}
        </button>
        <button
          class="btn-primary flex items-center gap-2"
          :disabled="importing || selectedTemplates.length === 0"
          @click="importTemplates"
        >
          <span v-if="importing" class="animate-spin material-icons text-lg">refresh</span>
          <span v-else class="material-icons text-lg">download</span>
          {{ $t('planning.roomTemplates.import') }} ({{ selectedTemplates.length }})
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import hotelService from '@/services/hotelService'
import planningService from '@/services/planningService'

const props = defineProps({
  hotelId: {
    type: String,
    required: true
  },
  existingRoomTypes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'imported'])

const { t, locale } = useI18n()
const toast = useToast()

const loading = ref(false)
const importing = ref(false)
const error = ref(null)
const templates = ref([])
const baseHotelName = ref('')
const selectedTemplates = ref([])

const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://api.maxirez.com'

const allSelected = computed(() => {
  const selectableCount = templates.value.filter(t => !isAlreadyImported(t.code)).length
  return selectableCount > 0 && selectedTemplates.value.length === selectableCount
})

const getTemplateName = template => {
  if (!template.name) return template.code
  return template.name[locale.value] || template.name.tr || template.name.en || template.code
}

const getMainImage = template => {
  if (!template.images?.length) return null
  const mainImage = template.images.find(img => img.isMain) || template.images[0]
  if (!mainImage?.url) return null
  if (mainImage.url.startsWith('http')) return mainImage.url
  return `${apiBaseUrl}${mainImage.url}`
}

const isSelected = code => {
  return selectedTemplates.value.includes(code)
}

const isAlreadyImported = code => {
  return props.existingRoomTypes.some(rt => rt.code === code)
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedTemplates.value = []
  } else {
    selectedTemplates.value = templates.value
      .filter(t => !isAlreadyImported(t.code))
      .map(t => t.code)
  }
}

const fetchTemplates = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await hotelService.getImportableRooms(props.hotelId)
    if (response.success) {
      templates.value = response.data.roomTemplates || []
      baseHotelName.value =
        response.data.baseHotel?.name?.tr || response.data.baseHotel?.name?.en || ''
    } else {
      throw new Error(response.message || 'Failed to fetch templates')
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || t('common.operationFailed')
  } finally {
    loading.value = false
  }
}

const importTemplates = async () => {
  if (selectedTemplates.value.length === 0) return

  importing.value = true

  try {
    const response = await planningService.importRoomTypesFromBase(
      props.hotelId,
      selectedTemplates.value
    )

    if (response.success) {
      toast.success(
        t('planning.roomTemplates.importSuccess', {
          count: response.data?.imported || selectedTemplates.value.length
        })
      )
      emit('imported')
      emit('close')
    }
  } catch (err) {
    toast.error(err.response?.data?.message || t('common.operationFailed'))
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  fetchTemplates()
})
</script>
