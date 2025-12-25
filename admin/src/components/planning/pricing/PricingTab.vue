<template>
  <div class="pricing-tab">
    <!-- Top Bar: Market Selector & Actions -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <!-- Left: Title & Market -->
      <div class="flex items-center gap-4">
        <div>
          <h3 class="text-xl font-bold text-gray-800 dark:text-white">{{ $t('planning.pricing.title') }}</h3>
          <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.description') }}</p>
        </div>

        <!-- Market Selector Tabs -->
        <div v-if="markets.length > 0" class="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1 ml-4">
          <button
            v-for="market in markets"
            :key="market._id"
            @click="selectedMarket = market"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="selectedMarket?._id === market._id
              ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'"
          >
            <div class="flex items-center gap-2">
              <span class="font-bold">{{ market.currency }}</span>
              <span class="text-xs opacity-75">{{ market.code }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-3">
        <!-- View Toggle -->
        <div class="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            @click="viewMode = 'calendar'"
            class="px-3 py-2 rounded-md transition-colors flex items-center gap-1.5"
            :class="viewMode === 'calendar' ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm' : 'text-gray-500'"
            :title="$t('planning.pricing.calendarView')"
          >
            <span class="material-icons text-lg">calendar_view_month</span>
            <span class="text-xs font-medium hidden sm:inline">{{ $t('planning.pricing.calendarView') }}</span>
          </button>
          <button
            @click="viewMode = 'period'"
            class="px-3 py-2 rounded-md transition-colors flex items-center gap-1.5"
            :class="viewMode === 'period' ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm' : 'text-gray-500'"
            :title="$t('planning.pricing.periodView')"
          >
            <span class="material-icons text-lg">date_range</span>
            <span class="text-xs font-medium hidden sm:inline">{{ $t('planning.pricing.periodView') }}</span>
          </button>
        </div>

        <!-- Season Manager Button -->
        <button
          @click="showSeasonPanel = !showSeasonPanel"
          class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          :class="showSeasonPanel
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200'"
        >
          <span class="material-icons text-lg">wb_sunny</span>
          <span class="hidden sm:inline">{{ $t('planning.pricing.seasons') }}</span>
        </button>

        <!-- Add Rate Button -->
        <button @click="openBulkModal" class="btn-primary flex items-center gap-2">
          <span class="material-icons text-lg">add</span>
          <span class="hidden sm:inline">{{ $t('planning.pricing.addRate') }}</span>
        </button>
      </div>
    </div>

    <!-- AI Pricing Assistant Panel -->
    <div class="mb-6">
      <AIPricingAssistant
        :hotel-id="hotel._id"
        :current-month="currentMonth"
        @executed="handleAIExecuted"
      />
    </div>

    <!-- Season Panel (Collapsible) -->
    <Transition name="slide">
      <div v-if="showSeasonPanel" class="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <span class="material-icons text-amber-600">date_range</span>
            {{ $t('planning.pricing.seasonManager') }}
          </h4>
          <button
            @click="showSeasonForm = true; editingSeason = null"
            class="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium"
          >
            <span class="material-icons text-sm">add_circle</span>
            {{ $t('planning.pricing.addSeason') }}
          </button>
        </div>

        <div v-if="loadingSeasons" class="flex justify-center py-6">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        </div>

        <div v-else-if="seasons.length > 0" class="flex flex-wrap gap-3">
          <div
            v-for="season in seasons"
            :key="season._id"
            class="group relative rounded-xl p-3 min-w-[140px] text-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
            :style="{ backgroundColor: season.color || '#6366f1' }"
            @click="editSeason(season)"
          >
            <div class="flex items-start justify-between">
              <div>
                <div class="font-bold text-sm">{{ season.code }}</div>
                <div class="text-xs opacity-90 mt-0.5">{{ getSeasonName(season) }}</div>
              </div>
              <button
                @click.stop="confirmDeleteSeason(season)"
                class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded"
              >
                <span class="material-icons text-sm">close</span>
              </button>
            </div>
            <div class="text-xs mt-2 opacity-75 flex items-center gap-1">
              <span class="material-icons text-xs">event</span>
              {{ formatSeasonDates(season) }}
            </div>
          </div>
        </div>

        <div v-else class="text-center py-6 text-gray-500 dark:text-slate-400">
          <span class="material-icons text-4xl opacity-30">event_busy</span>
          <p class="mt-2 text-sm">{{ $t('planning.pricing.noSeasons') }}</p>
        </div>
      </div>
    </Transition>

    <!-- Beautiful Filters (for period view) -->
    <div v-if="viewMode === 'period'" class="mb-6">
      <div class="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl p-5 border border-gray-200/50 dark:border-slate-600/50">
        <!-- Room Type Filter (Required) -->
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <span class="material-icons text-purple-600 dark:text-purple-400 text-lg">hotel</span>
          </div>
          <span class="font-semibold text-gray-700 dark:text-slate-300">{{ $t('planning.pricing.selectRoomType') }}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="rt in roomTypes"
            :key="rt._id"
            @click="filters.roomType = rt._id"
            class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
            :class="filters.roomType === rt._id
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105'
              : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-slate-600'"
          >
            <span class="font-bold">{{ rt.code }}</span>
            <span class="text-xs opacity-75">{{ getRoomTypeName(rt) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="content-area">
      <!-- Calendar View -->
      <template v-if="viewMode === 'calendar'">
        <MonthlyCalendar
          :hotel-id="hotel._id"
          :room-types="roomTypes"
          :meal-plans="mealPlans"
          :market="selectedMarket"
          :rates="rates"
          :overrides="overrides"
          :loading="loadingRates"
          :initial-month="currentMonth"
          @refresh="handleCalendarRefresh"
          @bulk-edit="openBulkEditModal"
        />
      </template>

      <!-- Period View - Period Based Price List -->
      <template v-else-if="viewMode === 'period'">
        <!-- No Room Type Selected -->
        <div v-if="!filters.roomType" class="text-center py-16 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <div class="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-4">
            <span class="material-icons text-3xl text-purple-600 dark:text-purple-400">hotel</span>
          </div>
          <p class="text-gray-600 dark:text-slate-400 text-lg font-medium">{{ $t('planning.pricing.selectRoomTypeFirst') }}</p>
          <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">{{ $t('planning.pricing.selectRoomTypeHint') }}</p>
        </div>

        <!-- Loading -->
        <div v-else-if="loadingPriceList" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>

        <!-- Price List Table -->
        <div v-else-if="priceListData.length > 0" class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <!-- Period Header -->
                  <th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase border-r border-gray-200 dark:border-slate-600 w-[140px] sticky left-0 bg-gray-50 dark:bg-slate-700 z-10">
                    {{ $t('planning.pricing.period') }}
                  </th>
                  <!-- Meal Plan Price Headers -->
                  <th
                    v-for="mp in activeMealPlans"
                    :key="mp._id"
                    class="px-3 py-3 text-center text-xs font-bold border-r border-gray-200 dark:border-slate-600 min-w-[80px]"
                    :class="getMealPlanHeaderClass(mp.code)"
                  >
                    <div>{{ mp.code }}</div>
                    <div class="text-[10px] font-normal opacity-75">{{ selectedMarket?.currency }}</div>
                  </th>
                  <!-- Min Stay Header -->
                  <th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase border-r border-gray-200 dark:border-slate-600 min-w-[60px]">
                    <div class="flex flex-col items-center">
                      <span class="material-icons text-sm text-blue-500">hotel</span>
                      <span class="text-[10px]">Min</span>
                    </div>
                  </th>
                  <!-- Release Header -->
                  <th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase min-w-[60px]">
                    <div class="flex flex-col items-center">
                      <span class="material-icons text-sm text-amber-500">schedule</span>
                      <span class="text-[10px]">Release</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
                <tr
                  v-for="(period, periodIndex) in unifiedPeriods"
                  :key="periodIndex"
                  class="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors"
                >
                  <!-- Period Column -->
                  <td class="px-3 py-2.5 border-r border-gray-200 dark:border-slate-600 bg-gray-50/50 dark:bg-slate-800/50 sticky left-0 z-10">
                    <div class="text-xs font-semibold text-gray-800 dark:text-white">
                      {{ formatShortDate(period.startDate) }} - {{ formatShortDate(period.endDate) }}
                    </div>
                    <div class="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                      {{ getPeriodDays(period.startDate, period.endDate) }} {{ $t('planning.pricing.days') }}
                    </div>
                  </td>

                  <!-- Meal Plan Price Cells with Tooltip -->
                  <td
                    v-for="mp in activeMealPlans"
                    :key="mp._id"
                    class="px-2 py-2 text-center border-r border-gray-100 dark:border-slate-700 relative group"
                  >
                    <template v-if="getPeriodPrice(period, mp._id)">
                      <div class="cursor-pointer">
                        <span class="font-bold text-green-600 dark:text-green-400 text-sm">
                          {{ getPeriodPrice(period, mp._id).pricePerNight.toLocaleString() }}
                        </span>
                        <!-- Tooltip -->
                        <div
                          v-if="hasExtraPricing(getPeriodPrice(period, mp._id))"
                          class="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 dark:bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                        >
                          <div class="space-y-1">
                            <div v-if="getPeriodPrice(period, mp._id).extraAdult" class="flex items-center gap-2">
                              <span class="material-icons text-amber-400 text-xs">person_add</span>
                              <span>+{{ $t('planning.pricing.adult') }}: {{ getPeriodPrice(period, mp._id).extraAdult.toLocaleString() }}</span>
                            </div>
                            <div v-if="getPeriodPrice(period, mp._id).extraChild" class="flex items-center gap-2">
                              <span class="material-icons text-pink-400 text-xs">child_care</span>
                              <span>+{{ $t('planning.pricing.child') }}: {{ getPeriodPrice(period, mp._id).extraChild.toLocaleString() }}</span>
                            </div>
                            <div v-if="getPeriodPrice(period, mp._id).extraInfant" class="flex items-center gap-2">
                              <span class="material-icons text-purple-400 text-xs">baby_changing_station</span>
                              <span>+{{ $t('planning.pricing.infant') }}: {{ getPeriodPrice(period, mp._id).extraInfant.toLocaleString() }}</span>
                            </div>
                            <div v-if="getPeriodPrice(period, mp._id).singleSupplement" class="flex items-center gap-2 pt-1 border-t border-slate-600">
                              <span class="material-icons text-blue-400 text-xs">person</span>
                              <span>{{ $t('planning.pricing.singleOccupancy') }}: -{{ getPeriodPrice(period, mp._id).singleSupplement.toLocaleString() }}</span>
                            </div>
                          </div>
                          <!-- Tooltip Arrow -->
                          <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-900"></div>
                        </div>
                      </div>
                      <!-- Extra pricing indicator -->
                      <div v-if="hasExtraPricing(getPeriodPrice(period, mp._id))" class="text-[9px] text-purple-500 dark:text-purple-400 mt-0.5">
                        +{{ $t('planning.pricing.extras') }}
                      </div>
                    </template>
                    <span v-else class="text-gray-300 dark:text-slate-600">-</span>
                  </td>

                  <!-- Min Stay Column -->
                  <td class="px-2 py-2 text-center border-r border-gray-100 dark:border-slate-700">
                    <span
                      v-if="getFirstPeriodRate(period)?.minStay"
                      class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium"
                      :class="getFirstPeriodRate(period).minStay > 1 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-slate-400'"
                    >
                      {{ getFirstPeriodRate(period).minStay }}
                    </span>
                    <span v-else class="text-gray-300 dark:text-slate-600">-</span>
                  </td>

                  <!-- Release Days Column -->
                  <td class="px-2 py-2 text-center">
                    <span
                      v-if="getFirstPeriodRate(period)?.releaseDays"
                      class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    >
                      {{ getFirstPeriodRate(period).releaseDays }}
                    </span>
                    <span v-else class="text-gray-300 dark:text-slate-600">0</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="px-4 py-2 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-600 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
            <div class="flex items-center gap-4">
              <span>{{ selectedMarket?.currency }}</span>
              <span>•</span>
              <span>{{ unifiedPeriods.length }} {{ $t('planning.pricing.periods') }}</span>
            </div>
            <div class="flex items-center gap-2 text-[10px]">
              <span class="flex items-center gap-1">
                <span class="material-icons text-xs text-purple-500">info</span>
                {{ $t('planning.pricing.hoverForExtras') }}
              </span>
            </div>
          </div>
        </div>

        <!-- No Rates -->
        <div v-else class="text-center py-16 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <span class="material-icons text-6xl text-gray-300 dark:text-slate-600">payments</span>
          <p class="mt-4 text-gray-500 dark:text-slate-400 text-lg">{{ $t('planning.pricing.noRates') }}</p>
          <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">{{ $t('planning.pricing.noRatesHint') }}</p>
          <button @click="openBulkModal" class="btn-primary mt-4">
            <span class="material-icons mr-2">add</span>
            {{ $t('planning.pricing.addRate') }}
          </button>
        </div>
      </template>
    </div>

    <!-- Season Form Modal -->
    <Modal v-model="showSeasonForm" :title="editingSeason ? $t('planning.pricing.editSeason') : $t('planning.pricing.addSeason')" size="md">
      <SeasonForm
        :hotel="hotel"
        :season="editingSeason"
        @saved="handleSeasonSaved"
        @cancel="showSeasonForm = false"
      />
    </Modal>

    <!-- Rate Form Modal -->
    <Modal v-model="showRateModal" :title="editingRate ? $t('planning.pricing.editRate') : $t('planning.pricing.addRate')" size="xl" :close-on-overlay="false">
      <RateForm
        :hotel="hotel"
        :rate="editingRate"
        :room-types="roomTypes"
        :meal-plans="mealPlans"
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
        <button @click="showDeleteModal = false" class="btn-secondary">{{ $t('common.no') }}</button>
        <button @click="executeDelete" class="btn-danger" :disabled="deleting">
          {{ deleting ? $t('common.loading') : $t('common.yes') }}
        </button>
      </template>
    </Modal>

    <!-- Bulk Edit Modal -->
    <BulkEditModal
      v-model="showBulkEditModal"
      :hotel-id="hotel._id"
      :selected-cells="bulkEditCells"
      :room-types="roomTypes"
      :meal-plans="mealPlans"
      :rates="rates"
      :market="selectedMarket"
      @saved="handleBulkEditSaved"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import MonthlyCalendar from './MonthlyCalendar.vue'
import SeasonForm from './SeasonForm.vue'
import RateForm from './RateForm.vue'
import BulkEditModal from './BulkEditModal.vue'
import AIPricingAssistant from './AIPricingAssistant.vue'
import planningService from '@/services/planningService'

const props = defineProps({
  hotel: { type: Object, required: true }
})

const { t, locale } = useI18n()
const toast = useToast()

// Data
const rates = ref([])
const overrides = ref([]) // RateOverride records (daily exceptions)
const seasons = ref([])
const roomTypes = ref([])
const mealPlans = ref([])
const markets = ref([])

// Loading
const loadingRates = ref(false)
const loadingSeasons = ref(false)
const loadingPriceList = ref(false)

// Price List Data (for list view)
const priceListData = ref([])

// UI State
const viewMode = ref('calendar')
const showSeasonPanel = ref(false)
const showSeasonForm = ref(false)
const showRateModal = ref(false)
const showDeleteModal = ref(false)
const selectedMarket = ref(null)
const editingSeason = ref(null)
const editingRate = ref(null)
const deleteTarget = ref(null)
const deleteType = ref(null)
const deleting = ref(false)
const bulkEditCells = ref([])
const showBulkEditModal = ref(false)

// Current calendar month - load from localStorage if available
const getStoredMonth = () => {
  try {
    const stored = localStorage.getItem('planning_calendar_month')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.year && parsed.month) {
        return parsed
      }
    }
  } catch (e) {
    // ignore
  }
  return {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  }
}

const currentMonth = ref(getStoredMonth())

// Watch for month changes and save to localStorage
watch(currentMonth, (newVal) => {
  try {
    localStorage.setItem('planning_calendar_month', JSON.stringify(newVal))
  } catch (e) {
    // ignore
  }
}, { deep: true })

// Filters
const filters = reactive({
  roomType: '',
  mealPlan: ''
})

// Computed
const filteredRates = computed(() => {
  let result = rates.value

  if (selectedMarket.value) {
    result = result.filter(r => {
      const marketId = r.market?._id || r.market
      return marketId === selectedMarket.value._id
    })
  }

  if (filters.roomType) {
    result = result.filter(r => {
      const rtId = r.roomType?._id || r.roomType
      return rtId === filters.roomType
    })
  }

  if (filters.mealPlan) {
    result = result.filter(r => {
      const mpId = r.mealPlan?._id || r.mealPlan
      return mpId === filters.mealPlan
    })
  }

  return result
})

// Price List Computed - Get all meal plans from price list data
const priceListMealPlans = computed(() => {
  const mpMap = {}
  priceListData.value.forEach(item => {
    if (item.mealPlan) {
      mpMap[item.mealPlan._id] = item.mealPlan
    }
  })
  return Object.values(mpMap)
})

// Active meal plans only (filter out inactive ones, default to active if status not set)
const activeMealPlans = computed(() => {
  return priceListMealPlans.value.filter(mp => mp.status !== 'inactive')
})

// Unified periods across all meal plans
const unifiedPeriods = computed(() => {
  const allPeriods = []
  const periodMap = {}

  priceListData.value.forEach(mpData => {
    mpData.periods.forEach(period => {
      const key = `${period.startDate}_${period.endDate}`
      if (!periodMap[key]) {
        periodMap[key] = {
          startDate: period.startDate,
          endDate: period.endDate,
          prices: {}
        }
      }
      periodMap[key].prices[mpData.mealPlan._id] = period
    })
  })

  // Sort by start date
  return Object.values(periodMap).sort((a, b) =>
    new Date(a.startDate) - new Date(b.startDate)
  )
})

// Get price for a specific period and meal plan
const getPeriodPrice = (period, mealPlanId) => {
  return period.prices[mealPlanId] || null
}

// Get first available rate for a period (for min stay, release days)
const getFirstPeriodRate = (period) => {
  const mealPlanIds = Object.keys(period.prices)
  if (mealPlanIds.length === 0) return null
  return period.prices[mealPlanIds[0]]
}

// Helpers
const getSeasonName = (season) => {
  return season.name?.[locale.value] || season.name?.tr || season.name?.en || season.code
}

const getRoomTypeName = (roomType) => {
  if (!roomType) return ''
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || roomType.code || ''
}

const formatSeasonDates = (season) => {
  if (!season.dateRanges?.length) return '-'
  const range = season.dateRanges[0]
  return `${formatDate(range.startDate)} - ${formatDate(range.endDate)}`
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}

const formatPrice = (price, currency) => {
  return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency || 'EUR'
  }).format(price)
}

const getMealPlanBadgeClass = (code) => {
  const colors = {
    'RO': 'px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium',
    'BB': 'px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs font-medium',
    'HB': 'px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs font-medium',
    'FB': 'px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium',
    'AI': 'px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium',
    'UAI': 'px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium'
  }
  return colors[code] || 'px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium'
}

const getAllotmentClass = (allotment) => {
  if (allotment === 0) return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
  if (allotment <= 2) return 'bg-red-50 dark:bg-red-900/20 text-red-500'
  if (allotment <= 5) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
  return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
}

const getMealPlanActiveColor = (code) => {
  const colors = {
    'RO': 'bg-gray-600 shadow-gray-600/30',
    'BB': 'bg-amber-500 shadow-amber-500/30',
    'HB': 'bg-orange-500 shadow-orange-500/30',
    'FB': 'bg-blue-500 shadow-blue-500/30',
    'AI': 'bg-purple-500 shadow-purple-500/30',
    'UAI': 'bg-indigo-600 shadow-indigo-600/30'
  }
  return colors[code] || 'bg-amber-500 shadow-amber-500/30'
}

const getMealPlanHeaderClass = (code) => {
  const colors = {
    'RO': 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200',
    'BB': 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    'HB': 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
    'FB': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    'AI': 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    'UAI': 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
  }
  return colors[code] || 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
}

const formatShortDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  const day = d.getUTCDate()
  const month = d.getUTCMonth() + 1
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`
}

const formatPeriodDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getPeriodDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

const hasExtraPricing = (rate) => {
  if (!rate) return false
  const hasAdult = typeof rate.extraAdult === 'number' && rate.extraAdult >= 0
  const hasInfant = typeof rate.extraInfant === 'number' && rate.extraInfant >= 0
  const hasChild = rate.childOrderPricing?.some(p => typeof p === 'number' && p >= 0)
  const hasSingle = typeof rate.singleSupplement === 'number' && rate.singleSupplement > 0
  return hasAdult || hasInfant || hasChild || hasSingle
}

// API Calls
const fetchSeasons = async () => {
  loadingSeasons.value = true
  try {
    const response = await planningService.getSeasons(props.hotel._id)
    if (response.success) seasons.value = response.data
  } catch (error) {
    console.error('Error fetching seasons:', error)
  } finally {
    loadingSeasons.value = false
  }
}

const fetchRates = async (params = {}) => {
  loadingRates.value = true
  try {
    const queryParams = {
      ...params
    }

    if (selectedMarket.value) {
      queryParams.market = selectedMarket.value._id
    }

    // For calendar view, fetch entire month
    if (viewMode.value === 'calendar') {
      const year = currentMonth.value.year
      const month = currentMonth.value.month

      // Format dates as YYYY-MM-DD without timezone conversion
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate() // Last day of month
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      queryParams.startDate = startDate
      queryParams.endDate = endDate
    }

    console.log('fetchRates queryParams:', queryParams)
    const response = await planningService.getRates(props.hotel._id, queryParams)

    // Handle both old format (array) and new format ({ rates, overrides })
    if (response.success) {
      if (Array.isArray(response.data)) {
        // Old format - data is an array of rates
        rates.value = response.data
        overrides.value = []
      } else if (response.data && typeof response.data === 'object') {
        // New format - data has rates and overrides
        rates.value = response.data.rates || []
        overrides.value = response.data.overrides || []
      }
      console.log('fetchRates response:', rates.value.length, 'rates,', overrides.value.length, 'overrides')
    }
  } catch (error) {
    toast.error(t('common.fetchError'))
  } finally {
    loadingRates.value = false
  }
}

const fetchPriceList = async () => {
  if (!filters.roomType || !selectedMarket.value) {
    priceListData.value = []
    return
  }

  loadingPriceList.value = true
  try {
    const params = {
      roomType: filters.roomType,
      market: selectedMarket.value._id
    }

    const response = await planningService.getRatesPriceList(props.hotel._id, params)
    if (response.success) {
      priceListData.value = response.data
    }
  } catch (error) {
    console.error('Error fetching price list:', error)
    priceListData.value = []
  } finally {
    loadingPriceList.value = false
  }
}

const fetchDependencies = async () => {
  try {
    const [rtRes, mpRes, mRes] = await Promise.all([
      planningService.getRoomTypes(props.hotel._id),
      planningService.getMealPlans(props.hotel._id),
      planningService.getMarkets(props.hotel._id)
    ])

    if (rtRes.success) roomTypes.value = rtRes.data
    if (mpRes.success) mealPlans.value = mpRes.data
    if (mRes.success) {
      markets.value = mRes.data
      // Auto-select first market
      if (mRes.data.length > 0 && !selectedMarket.value) {
        selectedMarket.value = mRes.data[0]
      }
    }
  } catch (error) {
    console.error('Error fetching dependencies:', error)
  }
}

// Event Handlers
const handleCalendarRefresh = (params) => {
  if (params?.year && params?.month) {
    currentMonth.value = { year: params.year, month: params.month }
  }
  fetchRates()
}

const openBulkModal = () => {
  if (!selectedMarket.value) {
    toast.error(t('planning.pricing.selectMarket'))
    return
  }
  editingRate.value = null
  bulkEditCells.value = []
  showRateModal.value = true
}

const openBulkEditModal = (cells) => {
  bulkEditCells.value = cells
  showBulkEditModal.value = true
}

const handleBulkEditSaved = () => {
  showBulkEditModal.value = false
  bulkEditCells.value = []
  fetchRates()
}

const handleAIExecuted = () => {
  fetchRates()
  if (viewMode.value === 'period') {
    fetchPriceList()
  }
}

const editSeason = (season) => {
  editingSeason.value = season
  showSeasonForm.value = true
}

const handleSeasonSaved = () => {
  showSeasonForm.value = false
  editingSeason.value = null
  fetchSeasons()
}

const confirmDeleteSeason = (season) => {
  deleteTarget.value = season
  deleteType.value = 'season'
  showDeleteModal.value = true
}

const editRate = (rate) => {
  editingRate.value = rate
  bulkEditCells.value = []
  showRateModal.value = true
}

const handleRateSaved = () => {
  showRateModal.value = false
  editingRate.value = null
  bulkEditCells.value = []
  fetchRates()
}

const confirmDeleteRate = (rate) => {
  deleteTarget.value = rate
  deleteType.value = 'rate'
  showDeleteModal.value = true
}

const executeDelete = async () => {
  deleting.value = true
  try {
    if (deleteType.value === 'season') {
      await planningService.deleteSeason(props.hotel._id, deleteTarget.value._id)
      toast.success(t('planning.pricing.seasonDeleted'))
      fetchSeasons()
    } else if (deleteType.value === 'rate') {
      await planningService.deleteRate(props.hotel._id, deleteTarget.value._id)
      toast.success(t('planning.pricing.rateDeleted'))
      fetchRates()
    }
    showDeleteModal.value = false
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

// Watchers
watch(selectedMarket, () => {
  fetchRates()
  if (viewMode.value === 'period') {
    fetchPriceList()
  }
})

watch(viewMode, (newMode) => {
  if (newMode === 'period') {
    // Auto-select first room type if none selected
    if (!filters.roomType && roomTypes.value.length > 0) {
      filters.roomType = roomTypes.value[0]._id
    }
    fetchPriceList()
  }
})

watch(() => filters.roomType, () => {
  if (viewMode.value === 'period') {
    fetchPriceList()
  }
})

watch(() => props.hotel?._id, (newId) => {
  if (newId) {
    fetchDependencies()
    fetchSeasons()
    fetchRates()
  }
}, { immediate: true })
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
