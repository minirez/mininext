<template>
  <Modal
    :model-value="show"
    size="xl"
    :title="$t('planning.pricing.contractImport.title')"
    @close="$emit('close')"
  >
    <!-- Progress Steps -->
    <div class="flex items-center justify-center mb-6">
      <div class="flex items-center gap-2">
        <template v-for="(step, index) in steps" :key="step.id">
          <div
            class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            :class="{
              'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400':
                currentStep === index,
              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                currentStep > index,
              'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400': currentStep < index
            }"
          >
            <span class="material-icons text-sm">
              {{ currentStep > index ? 'check_circle' : step.icon }}
            </span>
            <span class="hidden sm:inline">{{ step.label }}</span>
          </div>
          <span
            v-if="index < steps.length - 1"
            class="material-icons text-gray-300 dark:text-gray-600"
            >chevron_right</span
          >
        </template>
      </div>
    </div>

    <!-- Step Components -->
    <ContractUploadStep
      v-if="currentStep === 0"
      :selected-file="selectedFile"
      :is-dragging="isDragging"
      :format-file-size="formatFileSize"
      @file-select="handleFileSelect"
      @file-drop="handleFileDrop"
      @clear-file="selectedFile = null"
      @update:is-dragging="isDragging = $event"
    />

    <ContractParsingStep
      v-if="currentStep === 1"
      :is-loading="isLoading"
      :parse-error="parseError"
      :parsed-data="parsedData"
      :pricing-completeness="pricingCompleteness"
      :format-date="formatDate"
      :get-confidence-color="getConfidenceColor"
      @retry="currentStep = 0"
    />

    <ContractMappingStep
      v-if="currentStep === 2"
      :parsed-data="parsedData"
      :room-mappings="roomMappings"
      :meal-plan-mappings="mealPlanMappings"
      :import-options="importOptions"
      :existing-room-types="existingRoomTypes"
      :existing-meal-plans="existingMealPlans"
      :has-o-b-p-pricing="hasOBPPricing"
      :has-multiplier-pricing="hasMultiplierPricing"
      :obp-occupancy-range="obpOccupancyRange"
      :season-year="seasonYear"
      :season-start-date="seasonStartDate"
      :season-end-date="seasonEndDate"
      :season-days="seasonDays"
      :new-room-count="newRoomCount"
      :existing-room-count="existingRoomCount"
      :new-meal-plan-count="newMealPlanCount"
      :existing-meal-plan-count="existingMealPlanCount"
      :room-mapping-percentage="roomMappingPercentage"
      :meal-plan-mapping-percentage="mealPlanMappingPercentage"
      :format-date="formatDate"
      :get-localized-name="getLocalizedName"
      :get-confidence-badge-class="getConfidenceBadgeClass"
      :get-room-pricing-details="getRoomPricingDetails"
      :format-price="formatPrice"
      @update-room-mapping="(name, value) => (roomMappings[name] = value)"
      @update-meal-plan-mapping="(name, value) => (mealPlanMappings[name] = value)"
      @update-option="(key, value) => (importOptions[key] = value)"
    />

    <ContractConfirmStep
      v-if="currentStep === 3"
      v-model:selected-room-tab="selectedRoomTab"
      :is-importing="isImporting"
      :import-result="importResult"
      :parsed-data="parsedData"
      :mapped-room-count="mappedRoomCount"
      :mapped-meal-plan-count="mappedMealPlanCount"
      :valid-pricing-count="validPricingCount"
      :missing-prices-count="missingPricesCount"
      :format-date="formatDate"
      :get-room-pricing-count="getRoomPricingCount"
      :get-price-for-cell="getPriceForCell"
    />

    <template #footer>
      <div class="flex items-center justify-between">
        <button
          v-if="currentStep > 0 && !importResult"
          class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          @click="currentStep--"
        >
          <span class="material-icons text-sm align-middle mr-1">arrow_back</span>
          {{ $t('common.back') }}
        </button>
        <div v-else></div>

        <div class="flex items-center gap-3">
          <button
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            @click="$emit('close')"
          >
            {{ importResult ? $t('common.close') : $t('common.cancel') }}
          </button>

          <button
            v-if="currentStep === 0"
            :disabled="!selectedFile"
            class="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            @click="startParsing"
          >
            <span class="material-icons text-sm">auto_awesome</span>
            {{ $t('planning.pricing.contractImport.analyzeContract') }}
          </button>

          <button
            v-else-if="currentStep === 1 && parsedData"
            class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
            @click="currentStep = 2"
          >
            {{ $t('common.next') }}
            <span class="material-icons text-sm">arrow_forward</span>
          </button>

          <button
            v-else-if="currentStep === 2"
            :disabled="mappedRoomCount === 0 || mappedMealPlanCount === 0"
            class="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            @click="currentStep = 3"
          >
            {{ $t('common.next') }}
            <span class="material-icons text-sm">arrow_forward</span>
          </button>

          <button
            v-else-if="currentStep === 3 && !importResult"
            :disabled="isImporting"
            class="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            @click="executeImport"
          >
            <span class="material-icons text-sm">download</span>
            {{ $t('planning.pricing.contractImport.startImport') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import Modal from '@/components/common/Modal.vue'
import {
  ContractUploadStep,
  ContractParsingStep,
  ContractMappingStep,
  ContractConfirmStep,
  useContractImport
} from './contract-import'

const props = defineProps({
  show: { type: Boolean, default: false },
  hotelId: { type: String, required: true }
})

const emit = defineEmits(['close', 'imported'])

// Use the composable for all logic
const {
  // Config
  steps,

  // State
  currentStep,
  selectedFile,
  isDragging,
  isLoading,
  isImporting,
  parseError,
  parsedData,
  importResult,
  selectedRoomTab,
  roomMappings,
  mealPlanMappings,
  importOptions,

  // Computed
  existingRoomTypes,
  existingMealPlans,
  mappedRoomCount,
  mappedMealPlanCount,
  newRoomCount,
  existingRoomCount,
  newMealPlanCount,
  existingMealPlanCount,
  seasonStartDate,
  seasonEndDate,
  seasonYear,
  seasonDays,
  validPricingCount,
  roomMappingPercentage,
  mealPlanMappingPercentage,
  missingPricesCount,
  hasOBPPricing,
  hasMultiplierPricing,
  pricingCompleteness,
  obpOccupancyRange,

  // Methods
  getLocalizedName,
  handleFileSelect,
  handleFileDrop,
  formatFileSize,
  formatDate,
  getConfidenceColor,
  getConfidenceBadgeClass,
  getRoomPricingCount,
  getRoomPricingDetails,
  getPriceForCell,
  formatPrice,
  startParsing,
  executeImport
} = useContractImport(props, emit)
</script>
