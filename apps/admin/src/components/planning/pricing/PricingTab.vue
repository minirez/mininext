<template>
  <div class="pricing-tab">
    <!-- Top Bar: Market Selector & Actions -->
    <PricingTopBar
      :markets="markets"
      :selected-market="selectedMarket"
      :view-mode="viewMode"
      :show-season-panel="showSeasonPanel"
      @update:selected-market="selectedMarket = $event"
      @update:view-mode="viewMode = $event"
      @update:show-season-panel="showSeasonPanel = $event"
      @open-price-query="showPriceQueryModal = true"
      @open-contract-import="showContractImport = true"
      @open-bulk-modal="openBulkModal"
    />

    <!-- AI Pricing Assistant Panel -->
    <div class="mb-6">
      <AIPricingAssistant
        :hotel-id="hotel._id"
        :current-month="currentMonth"
        :selected-cells="bulkEditCells"
        :room-types="filteredRoomTypes"
        :meal-plans="filteredMealPlans"
        @executed="handleAIExecuted"
        @clear-selection="clearCalendarSelection"
      />
    </div>

    <!-- Season Panel (Collapsible) -->
    <SeasonPanel
      :show-season-panel="showSeasonPanel"
      :selected-market="selectedMarket"
      :seasons="seasons"
      :loading-seasons="loadingSeasons"
      :timeline-year="timelineYear"
      :all-season-ranges="allSeasonRanges"
      :today-position="todayPosition"
      :get-season-name="getSeasonName"
      :format-season-dates="formatSeasonDates"
      :get-month-short-name="getMonthShortName"
      @add-season="showSeasonForm = true; editingSeason = null"
      @edit-season="editSeason"
      @delete-season="confirmDeleteSeason"
      @update:timeline-year="timelineYear = $event"
    />

    <!-- Beautiful Filters (for period view) -->
    <PeriodFilters
      v-if="viewMode === 'period'"
      :filters="filters"
      :filtered-room-types="filteredRoomTypes"
      :filtered-meal-plans="filteredMealPlans"
      :get-room-type-name="getRoomTypeName"
      :get-meal-plan-active-color="getMealPlanActiveColor"
      @update:room-type="filters.roomType = $event"
      @update:meal-plan="filters.mealPlan = $event"
    />

    <!-- Main Content Area -->
    <div class="content-area">
      <!-- Calendar View -->
      <template v-if="viewMode === 'calendar'">
        <MonthlyCalendar
          ref="calendarRef"
          :key="`calendar-${calendarKey}`"
          :hotel-id="hotel._id"
          :room-types="filteredRoomTypes"
          :meal-plans="filteredMealPlans"
          :market="selectedMarket"
          :rates="rates"
          :overrides="overrides"
          :loading="loadingRates"
          :initial-month="currentMonth"
          :current-seasons="currentMonthSeasons"
          :child-age-groups="hotel.childAgeGroups || []"
          @refresh="handleCalendarRefresh"
          @bulk-edit="openBulkEditModal"
          @selection-change="handleSelectionChange"
        />
      </template>

      <!-- Period View - Period Based Price List -->
      <template v-else-if="viewMode === 'period'">
        <PeriodList
          :filters="filters"
          :period-list-data="periodListData"
          :loading-price-list="loadingPriceList"
          :selected-market="selectedMarket"
          :get-selected-room-type-name="getSelectedRoomTypeName"
          :get-selected-meal-plan-code="getSelectedMealPlanCode"
          :format-period-date="formatPeriodDate"
          :get-period-days="getPeriodDays"
          @edit-period="openPeriodEdit"
          @add-rate="openBulkModal"
        />
      </template>
    </div>

    <!-- Season Form Modal -->
    <Modal
      v-model="showSeasonForm"
      :title="editingSeason ? $t('planning.pricing.editSeason') : $t('planning.pricing.addSeason')"
      size="xl"
      :close-on-overlay="false"
      content-class="!h-[70vh]"
    >
      <SeasonForm
        :hotel="hotel"
        :season="editingSeason"
        :market="selectedMarket"
        :room-types="filteredRoomTypes"
        :meal-plans="filteredMealPlans"
        :existing-seasons="seasons"
        @saved="handleSeasonSaved"
        @cancel="showSeasonForm = false"
      />
    </Modal>

    <!-- Rate Form Modal -->
    <Modal
      v-model="showRateModal"
      :title="editingRate ? $t('planning.pricing.editRate') : $t('planning.pricing.addRate')"
      size="xl"
      :close-on-overlay="false"
    >
      <RateForm
        :hotel="hotel"
        :rate="editingRate"
        :room-types="filteredRoomTypes"
        :meal-plans="filteredMealPlans"
        :market="selectedMarket"
        :seasons="seasons"
        :selected-cells="bulkEditCells"
        @saved="handleRateSaved"
        @cancel="showRateModal = false"
      />
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('common.delete')" size="sm">
      <div class="text-center py-4">
        <span class="material-icons text-5xl text-red-500 mb-4">warning</span>
        <p class="text-gray-600 dark:text-slate-400">{{ $t('common.confirm') }}?</p>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showDeleteModal = false">
          {{ $t('common.no') }}
        </button>
        <button class="btn-danger" :disabled="deleting" @click="executeDelete">
          {{ deleting ? $t('common.loading') : $t('common.yes') }}
        </button>
      </template>
    </Modal>

    <!-- Bulk Edit Modal -->
    <BulkEditModal
      v-model="showBulkEditModal"
      :hotel-id="hotel._id"
      :selected-cells="bulkEditCells"
      :room-types="filteredRoomTypes"
      :meal-plans="filteredMealPlans"
      :rates="rates"
      :market="selectedMarket"
      :child-age-groups="hotel.childAgeGroups || []"
      @saved="handleBulkEditSaved"
    />

    <!-- Price Query Modal -->
    <PriceQueryModal
      v-model="showPriceQueryModal"
      :hotel-id="hotel._id"
      :hotel-name="hotel.name?.tr || hotel.name?.en || hotel.code"
      :room-types="filteredRoomTypes"
      :meal-plans="filteredMealPlans"
      :markets="markets"
      :initial-month="currentMonth"
    />

    <!-- Contract Import Wizard -->
    <ContractImportWizard
      :show="showContractImport"
      :hotel-id="hotel._id"
      @close="showContractImport = false"
      @imported="handleContractImported"
    />

    <!-- Period Edit Modal -->
    <Modal
      v-model="showPeriodEditModal"
      :title="$t('planning.pricing.editPeriod')"
      size="xl"
      content-class="!h-[75vh] !overflow-y-auto"
    >
      <PeriodEditForm
        v-if="editingPeriod"
        :hotel-id="hotel._id"
        :period="editingPeriod"
        :room-types="filteredRoomTypes"
        :meal-plans="filteredMealPlans"
        :market="selectedMarket"
        :child-age-groups="hotel.childAgeGroups || []"
        :selected-room-type="filters.roomType"
        @saved="handlePeriodEditSaved"
        @cancel="showPeriodEditModal = false"
      />
    </Modal>

    <!-- Platform Admin: Delete All Pricing Data -->
    <div
      v-if="authStore.isPlatformAdmin && selectedMarket"
      class="mt-8 pt-4 border-t border-gray-200 dark:border-slate-700"
    >
      <div class="flex justify-end">
        <button
          class="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
          @click="showDeleteConfirm = true"
        >
          <span class="material-icons text-sm">delete_forever</span>
          Sezonları ve Fiyatları Sil
        </button>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <Modal v-model="showDeleteConfirm" title="Fiyat Verilerini Sil" size="sm">
      <div class="text-center py-4">
        <div
          class="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4"
        >
          <span class="material-icons text-3xl text-red-600 dark:text-red-400">warning</span>
        </div>
        <p class="text-gray-700 dark:text-gray-300 mb-2">
          <strong>{{ selectedMarket?.code }}</strong> pazarındaki tüm sezonlar ve fiyatlar
          silinecek.
        </p>
        <p class="text-sm text-red-600 dark:text-red-400 font-medium">Bu işlem geri alınamaz!</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            @click="showDeleteConfirm = false"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            :disabled="isDeleting"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg flex items-center gap-2"
            @click="deleteAllPricingData"
          >
            <span v-if="isDeleting" class="material-icons animate-spin text-sm">refresh</span>
            <span v-else class="material-icons text-sm">delete_forever</span>
            {{ $t('common.yes') }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import Modal from '@/components/common/Modal.vue'
import MonthlyCalendar from './MonthlyCalendar.vue'
import SeasonForm from './SeasonForm.vue'
import RateForm from './RateForm.vue'
import BulkEditModal from './BulkEditModal.vue'
import AIPricingAssistant from './AIPricingAssistant.vue'
import PriceQueryModal from './PriceQueryModal.vue'
import PeriodEditForm from './PeriodEditForm.vue'
import ContractImportWizard from './ContractImportWizard.vue'
import {
  PricingTopBar,
  SeasonPanel,
  PeriodFilters,
  PeriodList,
  usePricingTab
} from './pricing-tab'

const props = defineProps({
  hotel: { type: Object, required: true },
  active: { type: Boolean, default: true },
  refreshTrigger: { type: Number, default: 0 }
})

// Use the composable for all logic
const {
  // State
  rates,
  overrides,
  seasons,
  markets,
  loadingRates,
  loadingSeasons,
  loadingPriceList,
  calendarKey,
  viewMode,
  showSeasonPanel,
  timelineYear,
  showSeasonForm,
  showRateModal,
  showDeleteModal,
  selectedMarket,
  editingSeason,
  editingRate,
  deleting,
  bulkEditCells,
  showBulkEditModal,
  showPriceQueryModal,
  showPeriodEditModal,
  showContractImport,
  editingPeriod,
  calendarRef,
  showDeleteConfirm,
  isDeleting,
  currentMonth,
  filters,

  // Computed
  currentMonthSeasons,
  filteredRoomTypes,
  filteredMealPlans,
  periodListData,
  todayPosition,
  allSeasonRanges,

  // Helpers
  getSeasonName,
  getRoomTypeName,
  formatSeasonDates,
  getMonthShortName,
  getSelectedRoomTypeName,
  getSelectedMealPlanCode,
  getMealPlanActiveColor,
  formatPeriodDate,
  getPeriodDays,

  // Event Handlers
  handleCalendarRefresh,
  openBulkModal,
  openBulkEditModal,
  handleBulkEditSaved,
  openPeriodEdit,
  handlePeriodEditSaved,
  handleAIExecuted,
  handleContractImported,
  deleteAllPricingData,
  handleSelectionChange,
  clearCalendarSelection,
  editSeason,
  handleSeasonSaved,
  confirmDeleteSeason,
  handleRateSaved,
  executeDelete,

  // Watchers
  setupWatchers,

  // Stores
  authStore
} = usePricingTab(props)

// Setup watchers
setupWatchers()
</script>
