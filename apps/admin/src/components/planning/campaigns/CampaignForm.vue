<template>
  <div class="space-y-4">
    <!-- Status & Visibility Toggles -->
    <CampaignStatusSection :form="form" @toggle-status="toggleStatus" />

    <!-- Campaign Name & Type -->
    <CampaignBasicInfo
      :form="form"
      :validation-errors="validationErrors"
      :supported-languages="supportedLanguages"
      :campaign-types="campaignTypes"
    />

    <!-- Discount Configuration -->
    <CampaignDiscountSection :form="form" />

    <!-- Markets, Meal Plans, Room Types Selection -->
    <CampaignConditions
      :form="form"
      :validation-errors="validationErrors"
      :markets="markets"
      :meal-plans="mealPlans"
      :room-types="roomTypes"
      @toggle-market="toggleMarket"
      @toggle-all-markets="toggleAllMarkets"
      @toggle-meal-plan="toggleMealPlan"
      @toggle-all-meal-plans="toggleAllMealPlans"
      @toggle-room-type="toggleRoomType"
      @toggle-all-room-types="toggleAllRoomTypes"
    />

    <!-- Calculation Settings & Application Type -->
    <CampaignCalculation :form="form" />

    <!-- Date Windows (Stay & Booking) -->
    <CampaignDateWindows
      :stay-date-range="stayDateRange"
      :booking-date-range="bookingDateRange"
      :stay-days="form.stayDays"
      :booking-days="form.bookingDays"
      :weekdays="weekdays"
      :validation-errors="validationErrors"
      @update:stay-date-range="stayDateRange = $event"
      @update:booking-date-range="bookingDateRange = $event"
      @toggle-stay-day="toggleStayDay"
      @toggle-booking-day="toggleBookingDay"
    />

    <!-- Campaign Conflict Detection -->
    <CampaignConflicts :has-conflicts="hasConflicts" :conflicting-campaigns="conflictingCampaigns" />

    <!-- Campaign Impact Preview -->
    <CampaignPreview
      :preview-price="previewPrice"
      :preview-nights="previewNights"
      :preview-result="previewResult"
      :format-price="formatPrice"
      @update:preview-price="previewPrice = $event"
      @update:preview-nights="previewNights = $event"
      @calculate="calculatePreview"
    />

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-slate-700">
      <button type="button" class="btn-secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </button>
      <button type="button" class="btn-primary" :disabled="saving" @click="handleSave">
        {{ saving ? $t('common.loading') : $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import {
  CampaignStatusSection,
  CampaignBasicInfo,
  CampaignDiscountSection,
  CampaignConditions,
  CampaignCalculation,
  CampaignDateWindows,
  CampaignConflicts,
  CampaignPreview,
  useCampaignForm
} from './campaign-form'

const props = defineProps({
  hotel: { type: Object, required: true },
  campaign: { type: Object, default: null },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  markets: { type: Array, default: () => [] },
  allCampaigns: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

// Use the composable for all logic
const {
  // State
  saving,
  form,
  validationErrors,
  stayDateRange,
  bookingDateRange,
  previewPrice,
  previewNights,
  previewResult,

  // Computed
  conflictingCampaigns,
  hasConflicts,

  // Constants
  weekdays,
  campaignTypes,
  supportedLanguages,

  // Methods
  toggleStatus,
  toggleMarket,
  toggleAllMarkets,
  toggleMealPlan,
  toggleAllMealPlans,
  toggleRoomType,
  toggleAllRoomTypes,
  toggleStayDay,
  toggleBookingDay,
  calculatePreview,
  formatPrice,
  handleSave,
  initialize
} = useCampaignForm(props, emit)

// Initialize on mount
onMounted(() => {
  initialize()
})
</script>
