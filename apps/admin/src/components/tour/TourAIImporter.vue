<template>
  <Modal :modelValue="modelValue" size="xl" :title="$t('tour.aiImport.title')" @update:modelValue="$emit('update:modelValue', $event)" @close="handleClose">
    <div class="space-y-6">
      <!-- Step 1: Input -->
      <div v-if="step === 'input'">
        <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">
          {{ $t('tour.aiImport.description') }}
        </p>

        <div class="space-y-4">
          <div>
            <label class="form-label">{{ $t('tour.aiImport.contentLabel') }}</label>
            <textarea
              v-model="content"
              class="form-input min-h-[300px] font-mono text-sm"
              :placeholder="$t('tour.aiImport.placeholder')"
            ></textarea>
            <p class="text-xs text-gray-500 dark:text-slate-500 mt-1">
              {{ $t('tour.aiImport.hint') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Step 2: Processing -->
      <div v-else-if="step === 'processing'" class="text-center py-12">
        <span class="material-icons animate-spin text-5xl text-teal-500 mb-4">refresh</span>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ $t('tour.aiImport.processing') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('tour.aiImport.processingDescription') }}
        </p>
      </div>

      <!-- Step 3: Preview -->
      <div v-else-if="step === 'preview' && extractedData">
        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
          <div class="flex items-center">
            <span class="material-icons text-green-600 dark:text-green-400 mr-2">check_circle</span>
            <span class="text-sm text-green-800 dark:text-green-300">
              {{ $t('tour.aiImport.success') }}
            </span>
          </div>
        </div>

        <!-- Preview Tabs -->
        <div class="border-b border-gray-200 dark:border-slate-700 mb-4">
          <nav class="flex space-x-4">
            <button
              v-for="tab in previewTabs"
              :key="tab.key"
              class="px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
              :class="activeTab === tab.key
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Basic Info -->
        <div v-show="activeTab === 'basic'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-500">{{ $t('tour.fields.code') }}</label>
              <p class="font-medium text-gray-900 dark:text-white">{{ extractedData.code || '-' }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-500">{{ $t('tour.fields.tourType') }}</label>
              <p class="font-medium text-gray-900 dark:text-white">{{ extractedData.tourType || '-' }}</p>
            </div>
            <div class="col-span-2">
              <label class="text-xs text-gray-500 dark:text-slate-500">{{ $t('tour.fields.name') }}</label>
              <p class="font-medium text-gray-900 dark:text-white">{{ extractedData.name?.tr || '-' }}</p>
            </div>
            <div class="col-span-2">
              <label class="text-xs text-gray-500 dark:text-slate-500">{{ $t('tour.fields.shortDescription') }}</label>
              <p class="text-sm text-gray-700 dark:text-slate-300">{{ extractedData.shortDescription?.tr || '-' }}</p>
            </div>
          </div>

          <!-- Destination & Duration -->
          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-500">{{ $t('tour.fields.destination') }}</label>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ extractedData.destination?.city || '-' }}, {{ extractedData.destination?.country || '-' }}
              </p>
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-500">{{ $t('tour.fields.duration') }}</label>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ extractedData.duration?.nights || 0 }} {{ $t('tour.nights') }} / {{ extractedData.duration?.days || 0 }} {{ $t('tour.days') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Accommodations -->
        <div v-show="activeTab === 'accommodations'" class="space-y-3">
          <div
            v-for="(acc, index) in extractedData.accommodations"
            :key="index"
            class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-medium text-gray-900 dark:text-white">{{ acc.hotelName || '-' }}</h4>
              <span v-if="acc.starRating" class="flex items-center text-yellow-500">
                <span v-for="n in acc.starRating" :key="n" class="material-icons text-sm">star</span>
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span class="text-gray-500 dark:text-slate-500">{{ $t('tour.nights') }}:</span>
                <span class="ml-1 text-gray-900 dark:text-white">{{ acc.nights || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-slate-500">{{ $t('tour.fields.mealPlan') }}:</span>
                <span class="ml-1 text-gray-900 dark:text-white">{{ acc.mealPlanCode || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-slate-500">{{ $t('tour.fields.roomType') }}:</span>
                <span class="ml-1 text-gray-900 dark:text-white">{{ acc.roomType || '-' }}</span>
              </div>
            </div>
          </div>
          <div v-if="!extractedData.accommodations?.length" class="text-center py-8 text-gray-500 dark:text-slate-400">
            {{ $t('tour.aiImport.noAccommodations') }}
          </div>
        </div>

        <!-- Itinerary -->
        <div v-show="activeTab === 'itinerary'" class="space-y-3 max-h-[400px] overflow-y-auto">
          <div
            v-for="(day, index) in extractedData.itinerary"
            :key="index"
            class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4"
          >
            <div class="flex items-center mb-2">
              <span class="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                {{ day.day }}
              </span>
              <h4 class="font-medium text-gray-900 dark:text-white">{{ day.title?.tr || '-' }}</h4>
            </div>
            <p class="text-sm text-gray-600 dark:text-slate-400 ml-11">{{ day.description?.tr || '-' }}</p>
            <div v-if="day.meals?.length" class="flex items-center gap-2 mt-2 ml-11">
              <span
                v-for="meal in day.meals"
                :key="meal"
                class="px-2 py-0.5 bg-gray-200 dark:bg-slate-700 text-xs rounded text-gray-600 dark:text-slate-300"
              >
                {{ $t(`tour.meals.${meal}`) }}
              </span>
            </div>
          </div>
          <div v-if="!extractedData.itinerary?.length" class="text-center py-8 text-gray-500 dark:text-slate-400">
            {{ $t('tour.aiImport.noItinerary') }}
          </div>
        </div>

        <!-- Inclusions/Exclusions -->
        <div v-show="activeTab === 'details'" class="space-y-6">
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">{{ $t('tour.fields.inclusions') }}</h4>
            <ul class="space-y-1">
              <li
                v-for="(item, index) in extractedData.inclusions"
                :key="index"
                class="flex items-start text-sm"
              >
                <span class="material-icons text-green-500 text-lg mr-2">check</span>
                <span class="text-gray-700 dark:text-slate-300">{{ item?.tr || item }}</span>
              </li>
            </ul>
            <div v-if="!extractedData.inclusions?.length" class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('tour.aiImport.noInclusions') }}
            </div>
          </div>

          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">{{ $t('tour.fields.exclusions') }}</h4>
            <ul class="space-y-1">
              <li
                v-for="(item, index) in extractedData.exclusions"
                :key="index"
                class="flex items-start text-sm"
              >
                <span class="material-icons text-red-500 text-lg mr-2">close</span>
                <span class="text-gray-700 dark:text-slate-300">{{ item?.tr || item }}</span>
              </li>
            </ul>
            <div v-if="!extractedData.exclusions?.length" class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('tour.aiImport.noExclusions') }}
            </div>
          </div>
        </div>

        <!-- Confidence Scores -->
        <div v-if="extractedData.confidence" class="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
          <h4 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            {{ $t('tour.aiImport.confidenceScores') }}
          </h4>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(score, key) in extractedData.confidence"
              :key="key"
              class="px-2 py-1 rounded text-xs font-medium"
              :class="getConfidenceClass(score)"
            >
              {{ key }}: {{ score }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="step === 'error'" class="text-center py-12">
        <span class="material-icons text-5xl text-red-500 mb-4">error</span>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ $t('tour.aiImport.error') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {{ errorMessage }}
        </p>
        <button class="btn-outline" @click="step = 'input'">
          {{ $t('common.tryAgain') }}
        </button>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button class="btn-outline" @click="handleClose">
          {{ $t('common.cancel') }}
        </button>
        <button
          v-if="step === 'input'"
          class="btn-primary bg-teal-600 hover:bg-teal-700"
          :disabled="!content.trim() || content.trim().length < 50"
          @click="extractData"
        >
          <span class="material-icons mr-2">auto_awesome</span>
          {{ $t('tour.aiImport.extract') }}
        </button>
        <button
          v-if="step === 'preview'"
          class="btn-primary bg-teal-600 hover:bg-teal-700"
          @click="applyData"
        >
          <span class="material-icons mr-2">check</span>
          {{ $t('tour.aiImport.apply') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/ui/Modal.vue'
import * as tourService from '@/services/tourService'

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'apply'])

const { t } = useI18n()
const toast = useToast()

// State
const step = ref('input')
const content = ref('')
const extractedData = ref(null)
const errorMessage = ref('')
const activeTab = ref('basic')

// Preview tabs
const previewTabs = computed(() => [
  { key: 'basic', label: t('tour.tabs.basic') },
  { key: 'accommodations', label: t('tour.tabs.accommodation') },
  { key: 'itinerary', label: t('tour.tabs.itinerary') },
  { key: 'details', label: t('tour.tabs.details') }
])

// Methods
const handleClose = () => {
  emit('update:modelValue', false)
  // Reset state after animation
  setTimeout(() => {
    step.value = 'input'
    content.value = ''
    extractedData.value = null
    errorMessage.value = ''
    activeTab.value = 'basic'
  }, 300)
}

const extractData = async () => {
  step.value = 'processing'

  try {
    const result = await tourService.aiExtractTour(content.value)

    if (result.success && result.data) {
      extractedData.value = result.data
      step.value = 'preview'
      toast.success(t('tour.aiImport.extractionSuccess'))
    } else {
      throw new Error(result.message || 'Extraction failed')
    }
  } catch (error) {
    console.error('AI extraction error:', error)
    errorMessage.value = error.response?.data?.message || error.message || t('tour.aiImport.extractionError')
    step.value = 'error'
    toast.error(errorMessage.value)
  }
}

const applyData = () => {
  emit('apply', extractedData.value)
  handleClose()
}

const getConfidenceClass = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (score >= 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}
</script>
