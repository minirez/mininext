<template>
  <div class="rate-form">
    <!-- Step Indicator -->
    <div class="flex items-center justify-center mb-6">
      <div class="flex items-center gap-2">
        <div v-for="(step, idx) in steps" :key="idx" class="flex items-center">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
            :class="
              currentStep >= idx
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400'
            "
          >
            {{ idx + 1 }}
          </div>
          <div
            v-if="idx < steps.length - 1"
            class="w-12 h-0.5 mx-1"
            :class="currentStep > idx ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-600'"
          ></div>
        </div>
      </div>
    </div>

    <!-- Step 1: Period Selection -->
    <RateFormStepPeriod
      v-show="currentStep === 0"
      v-model:date-range="dateRange"
      :market="market"
      :meal-plans="mealPlans"
      :seasons="seasons"
      :detected-season="detectedSeason"
      :all-seasons-min-date="allSeasonsMinDate"
      :all-seasons-max-date="allSeasonsMaxDate"
      :disabled-dates="disabledDates"
      :currency="currency"
    />

    <!-- Step 2: Pricing by Room Type Tabs -->
    <RateFormStepPricing
      v-show="currentStep === 1"
      v-model:selected-room-tab="selectedRoomTab"
      :room-prices="roomPrices"
      :room-restrictions="roomRestrictions"
      v-model:allow-edit-calculated="allowEditCalculated"
      @update:room-prices="handleRoomPricesUpdate"
      @update:room-restrictions="handleRoomRestrictionsUpdate"
      :date-range="dateRange"
      :currency="currency"
      :filtered-room-types="filteredRoomTypes"
      :filtered-meal-plans="filteredMealPlans"
      :current-room-type="currentRoomType"
      :current-room-pricing-type="currentRoomPricingType"
      :current-room-uses-multipliers="currentRoomUsesMultipliers"
      :current-room-combinations="currentRoomCombinations"
      :max-children-for-current-room="maxChildrenForCurrentRoom"
      :max-adults-for-current-room="maxAdultsForCurrentRoom"
      :min-adults-for-current-room="minAdultsForCurrentRoom"
      :adults-range-for-current-room="adultsRangeForCurrentRoom"
      :age-settings="ageSettings"
      :has-explicit-base-room="hasExplicitBaseRoom"
      :is-current-room-base="isCurrentRoomBase"
      :base-room="baseRoom"
      :base-meal-plan="baseMealPlan"
      :rooms-missing-prices="roomsMissingPrices"
      :has-room-prices="hasRoomPrices"
      :is-base-cell="isBaseCell"
      :is-calculated-cell="isCalculatedCell"
      :format-combination-key="formatCombinationKey"
      @edit-period="currentStep = 0"
      @copy-to-meal-plans="copyFirstPriceToAllMealPlans"
      @copy-to-rooms="copyCurrentRoomToAll"
    />

    <!-- Navigation Buttons -->
    <div
      class="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-slate-700"
    >
      <button
        v-if="currentStep > 0"
        type="button"
        class="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition-colors"
        @click="currentStep--"
      >
        <span class="material-icons">arrow_back</span>
        {{ $t('common.back') }}
      </button>
      <div v-else></div>

      <div class="flex gap-3">
        <button type="button" class="btn-secondary" @click="$emit('cancel')">
          {{ $t('common.cancel') }}
        </button>

        <button
          v-if="currentStep < steps.length - 1"
          type="button"
          class="btn-primary flex items-center gap-2"
          :disabled="!canProceed"
          @click="nextStep"
        >
          {{ $t('common.next') }}
          <span class="material-icons">arrow_forward</span>
        </button>

        <button
          v-else
          type="button"
          class="btn-primary flex items-center gap-2"
          :disabled="saving"
          @click="handleSave"
        >
          <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
          <span v-else class="material-icons">check</span>
          {{ saving ? $t('common.saving') : $t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import RateFormStepPeriod from './RateFormStepPeriod.vue'
import RateFormStepPricing from './RateFormStepPricing.vue'
import { useRateFormLogic } from './composables/useRateFormLogic'

const props = defineProps({
  hotel: { type: Object, required: true },
  rate: { type: Object, default: null },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  market: { type: Object, default: null },
  seasons: { type: Array, default: () => [] },
  selectedCells: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

// Use the composable for all form logic
const {
  // State
  saving,
  currentStep,
  selectedRoomTab,
  allowEditCalculated,
  steps,
  dateRange,
  roomPrices,
  roomRestrictions,
  currency,

  // Computed - filtering
  filteredRoomTypes,
  filteredMealPlans,

  // Computed - relative pricing
  baseRoom,
  baseMealPlan,
  hasExplicitBaseRoom,
  isCurrentRoomBase,

  // Computed - room type info
  currentRoomType,
  currentRoomPricingType,
  currentRoomUsesMultipliers,
  currentRoomCombinations,
  maxChildrenForCurrentRoom,
  maxAdultsForCurrentRoom,
  minAdultsForCurrentRoom,
  adultsRangeForCurrentRoom,
  ageSettings,

  // Computed - dates & seasons
  allSeasonsMinDate,
  allSeasonsMaxDate,
  disabledDates,
  detectedSeason,

  // Computed - validation
  canProceed,
  roomsMissingPrices,

  // Methods - helpers
  isBaseCell,
  isCalculatedCell,
  hasRoomPrices,
  formatCombinationKey,

  // Methods - actions
  initializeRoomData,
  updateRoomPricesForRoom,
  updateRoomRestrictionsForRoom,
  copyFirstPriceToAllMealPlans,
  copyCurrentRoomToAll,
  nextStep,
  handleSave,
  fetchLastRateAndSetDates,
  setupWatchers
} = useRateFormLogic(props, emit)

// Handle room prices update from child component (reactive object update)
const handleRoomPricesUpdate = (newPrices) => {
  // newPrices contains all rooms, update only the changed ones
  for (const roomId of Object.keys(newPrices)) {
    updateRoomPricesForRoom(roomId, newPrices[roomId])
  }
}

// Handle room restrictions update from child component (reactive object update)
const handleRoomRestrictionsUpdate = (newRestrictions) => {
  for (const roomId of Object.keys(newRestrictions)) {
    updateRoomRestrictionsForRoom(roomId, newRestrictions[roomId])
  }
}

// Setup watchers
setupWatchers()

// Initialize
onMounted(async () => {
  initializeRoomData()

  // If bulk creating from selected cells
  if (props.selectedCells?.length > 0) {
    const dates = props.selectedCells.map(c => c.date).sort()
    dateRange.value.start = dates[0]
    dateRange.value.end = dates[dates.length - 1]

    // Get room type from first cell
    const firstCell = props.selectedCells[0]
    if (firstCell.roomTypeId) {
      selectedRoomTab.value = firstCell.roomTypeId
    }
  } else {
    // Fetch last rate and set suggested dates
    await fetchLastRateAndSetDates()
  }
})
</script>

<style scoped>
/* Modal handles scrolling */
</style>
