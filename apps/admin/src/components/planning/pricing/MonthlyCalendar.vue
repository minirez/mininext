<template>
  <div class="monthly-calendar">
    <!-- Calendar Header - Month Navigation & Quick Actions -->
    <CalendarHeader
      :month-year-label="monthYearLabel"
      :current-seasons="currentSeasons"
      :selected-count="selectedCells.length"
      :copied-week="copiedWeek"
      :inline-edit-mode="inlineEditMode"
      @previous-month="previousMonth"
      @next-month="nextMonth"
      @go-to-today="goToToday"
      @copy-week="copyWeek"
      @paste-week="pasteWeek"
      @clear-selection="clearSelection"
      @bulk-edit="bulkEdit"
      @toggle-inline-edit="toggleInlineEditMode"
      @cancel-inline-edit="cancelInlineEdit"
    />

    <!-- Inline Edit Mode Banner -->
    <div
      v-if="inlineEditMode"
      class="mb-3 p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
    >
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div class="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
          <span class="material-icons text-lg">edit_note</span>
          <span>{{ $t('planning.pricing.inlineEditHint') }}</span>
        </div>
        <!-- Relative Pricing Toggle -->
        <div v-if="hasBaseRoom" class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="inlineRelativePricing"
              type="checkbox"
              class="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
            />
            <span class="text-xs text-amber-700 dark:text-amber-300">
              {{ $t('planning.pricing.useRelativePricing') }}
            </span>
          </label>
          <label v-if="inlineRelativePricing" class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="inlineAllowEditCalculated"
              type="checkbox"
              class="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
            />
            <span class="text-xs text-amber-700 dark:text-amber-300">
              {{ $t('planning.pricing.allowEditCalculated') }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Selection Summary -->
    <div
      v-if="selectedCells.length > 0"
      class="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4 text-sm">
          <span class="text-purple-700 dark:text-purple-300">
            <span class="font-semibold">{{ selectedCells.length }}</span>
            {{ $t('planning.pricing.cellsSelected') }}
          </span>
          <span class="text-gray-500 dark:text-slate-400">|</span>
          <span class="text-gray-600 dark:text-slate-400">
            {{ getSelectionDateRange }}
          </span>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button
            class="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 transition-colors"
            @click="quickAction('stopSale', true)"
          >
            <span class="material-icons text-xs align-middle">block</span>
            Stop Sale
          </button>
          <button
            class="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-200 transition-colors"
            @click="quickAction('stopSale', false)"
          >
            <span class="material-icons text-xs align-middle">check_circle</span>
            Open Sale
          </button>
          <button
            class="px-2 py-1 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded hover:bg-pink-200 transition-colors"
            @click="quickAction('singleStop', true)"
          >
            <span class="material-icons text-xs align-middle">person_off</span>
            1P Stop
          </button>
          <button
            class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 transition-colors"
            @click="quickAction('singleStop', false)"
          >
            <span class="material-icons text-xs align-middle">person</span>
            1P Open
          </button>
        </div>
      </div>
    </div>

    <!-- Compact Allotment Status Bar -->
    <CalendarAllotmentBar
      :stats="allotmentStats"
      @highlight-level="highlightAllotmentLevel"
      @show-details="showAllotmentModal = true"
    />

    <!-- Allotment Details Modal -->
    <CalendarAllotmentModal
      :visible="showAllotmentModal"
      :stats="allotmentStats"
      :details="allotmentDetails"
      @close="showAllotmentModal = false"
    />

    <!-- Loading State -->
    <div v-if="loading" class="py-12 text-center">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-slate-400">{{ $t('common.loading') }}</p>
    </div>

    <!-- Calendar Grid -->
    <CalendarGrid
      v-else
      :room-types="roomTypes"
      :filtered-meal-plans="filteredMealPlans"
      :calendar-days="calendarDays"
      :days-in-month="daysInMonth"
      :currency="currency"
      :selected-cells="selectedCells"
      :occupancy="occupancy"
      :inline-edit-mode="inlineEditMode"
      :inline-edit-prices="inlineEditPrices"
      :allow-edit-calculated="inlineAllowEditCalculated"
      :has-base-room="hasBaseRoom"
      :base-room-id="baseRoom?._id"
      :base-meal-plan-id="baseMealPlan?._id"
      :inline-relative-pricing="inlineRelativePricing"
      :get-rate-for-cell="getRateForCell"
      @select-date-column="selectDateColumn"
      @select-room-row="selectRoomRow"
      @cell-click="handleCellClick"
      @cell-dblclick="handleCellDblClick"
      @cell-contextmenu="handleCellContextMenu"
      @inline-change="handleInlineChange"
      @navigate-cell="navigateCell"
    />

    <!-- Legend & Keyboard Shortcuts -->
    <CalendarLegend />

    <!-- Clipboard Indicator -->
    <CalendarClipboardIndicator :copied-week="copiedWeek" @clear="copiedWeek = null" />

    <!-- Inline Edit Popover -->
    <QuickEditPopover
      ref="quickEditPopoverRef"
      :visible="!!editingCell"
      :cell-label="editingCellLabel"
      :form="inlineForm"
      :currency="currency"
      :position="popoverStyle"
      :saving="savingInline"
      :room-type="editingRoomType"
      :child-age-groups="childAgeGroups"
      @close="closeInlineEdit"
      @save="saveInlineEdit"
      @copy-to-days="copyPopoverToNextDays"
    />

    <!-- Context Menu for Inline Edit -->
    <CalendarContextMenu
      ref="contextMenuRef"
      :visible="showContextMenu"
      :position="contextMenuPosition"
      :cell="contextMenuCell"
      :copy-days-count="copyDaysCount"
      @close="closeContextMenu"
      @copy-to-days="copyToRightDays"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'

// Sub-components
import CalendarHeader from './CalendarHeader.vue'
import CalendarAllotmentBar from './CalendarAllotmentBar.vue'
import CalendarAllotmentModal from './CalendarAllotmentModal.vue'
import CalendarGrid from './CalendarGrid.vue'
import CalendarLegend from './CalendarLegend.vue'
import CalendarClipboardIndicator from './CalendarClipboardIndicator.vue'
import CalendarContextMenu from './CalendarContextMenu.vue'
import QuickEditPopover from './QuickEditPopover.vue'

// Composable
import { useCalendarLogic } from './composables/useCalendarLogic'

// Service
import planningService from '@/services/planningService'

const props = defineProps({
  hotelId: { type: String, required: true },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  market: { type: Object, default: null },
  rates: { type: Array, default: () => [] },
  overrides: { type: Array, default: () => [] },
  occupancy: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  initialMonth: { type: Object, default: null },
  currentSeasons: { type: Array, default: () => [] },
  childAgeGroups: { type: Array, default: () => [] }
})

const emit = defineEmits(['update', 'bulk-edit', 'refresh', 'selection-change'])

const { t, locale } = useI18n()
const toast = useToast()

// Use the calendar logic composable
const {
  // State
  currentDate,
  selectedCells,
  copiedWeek,
  inlineEditMode,
  inlineEditPrices,
  inlineRelativePricing,
  inlineAllowEditCalculated,
  showAllotmentModal,
  highlightedAllotmentLevel,

  // Computed
  currency,
  filteredMealPlans,
  baseRoom,
  baseMealPlan,
  hasBaseRoom,
  monthYearLabel,
  daysInMonth,
  calendarDays,
  getSelectionDateRange,
  allotmentStats,
  allotmentDetails,

  // Methods
  formatDateToString,
  formatDateKey,
  parseDateString,
  getRateForCell,
  isBaseCellFn,
  isCalculatedCell,
  previousMonth,
  nextMonth,
  goToToday,
  clearSelection,
  selectRange,
  highlightAllotmentLevel,
  copyWeek,
  pasteWeek,
  quickAction,
  toggleInlineEditMode,
  getInlineEditPrice,
  setInlineEditPrice,
  handleInlineChange,
  cancelInlineEdit
} = useCalendarLogic(props, emit)

// ============================================
// Additional State for Components Not in Composable
// ============================================

// Inline edit popover state
const editingCell = ref(null)
const quickEditPopoverRef = ref(null)
const popoverStyle = ref({})
const savingInline = ref(false)
const inlineForm = reactive({
  pricePerNight: 0,
  allotment: 0,
  minStay: 1,
  stopSale: false,
  singleStop: false,
  closedToArrival: false,
  closedToDeparture: false,
  extraAdult: '',
  extraInfant: '',
  childOrderPricing: [],
  singleSupplement: '',
  pricingType: 'unit',
  occupancyPricing: {}
})

// Context menu state
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuCell = ref(null)
const copyDaysCount = ref(7)
const contextMenuRef = ref(null)

// ============================================
// Additional Computed
// ============================================

const editingCellLabel = computed(() => {
  if (!editingCell.value) return ''
  const { roomTypeId, mealPlanId, date } = editingCell.value
  const room = props.roomTypes.find(r => r._id === roomTypeId)
  const meal = props.mealPlans.find(m => m._id === mealPlanId)
  const [, month, day] = date.split('-')
  return `${room?.code || ''},${meal?.code || ''} ${day}.${month}`
})

const editingRoomType = computed(() => {
  if (!editingCell.value) return null
  return props.roomTypes.find(rt => rt._id === editingCell.value.roomTypeId) || null
})

// ============================================
// Methods
// ============================================

const bulkEdit = () => {
  if (selectedCells.value.length > 0) {
    emit('bulk-edit', selectedCells.value)
  }
}

// Cell click handlers
const handleCellClick = (event, roomTypeId, mealPlanId, date) => {
  const rate = getRateForCell(roomTypeId, mealPlanId, date)
  const cellKey = { roomTypeId, mealPlanId, date, rateId: rate?._id || null }

  if (event.shiftKey && selectedCells.value.length > 0) {
    const lastSelected = selectedCells.value[selectedCells.value.length - 1]
    selectRange(lastSelected, cellKey)
  } else if (event.ctrlKey || event.metaKey) {
    const idx = selectedCells.value.findIndex(
      c => c.roomTypeId === roomTypeId && c.mealPlanId === mealPlanId && c.date === date
    )
    if (idx > -1) {
      selectedCells.value.splice(idx, 1)
    } else {
      selectedCells.value.push(cellKey)
    }
  } else {
    selectedCells.value = [cellKey]
  }
}

const handleCellDblClick = (roomTypeId, mealPlanId, date) => {
  const rate = getRateForCell(roomTypeId, mealPlanId, date)
  openInlineEdit(roomTypeId, mealPlanId, date, rate)
}

const handleCellContextMenu = (event, roomTypeId, mealPlanId, date) => {
  if (!inlineEditMode.value) return

  event.preventDefault()

  const key = `${roomTypeId}-${mealPlanId}-${date}`
  const currentValue = inlineEditPrices[key]

  if (currentValue === '' || currentValue === null || currentValue === undefined) return

  contextMenuCell.value = { roomTypeId, mealPlanId, date, value: currentValue }
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  showContextMenu.value = true
}

const closeContextMenu = () => {
  showContextMenu.value = false
  contextMenuCell.value = null
}

const copyToRightDays = count => {
  if (!contextMenuCell.value || !count) return

  const { roomTypeId, mealPlanId, date, value } = contextMenuCell.value
  const startDate = parseDateString(date)
  const dayCount = Math.min(count, 31)

  for (let i = 1; i <= dayCount; i++) {
    const targetDate = new Date(startDate)
    targetDate.setDate(targetDate.getDate() + i)
    const targetDateStr = formatDateToString(targetDate)

    const targetMonth = targetDate.getMonth()
    const currentMonth = currentDate.value.getMonth()
    if (targetMonth !== currentMonth) continue

    const targetKey = `${roomTypeId}-${mealPlanId}-${targetDateStr}`
    inlineEditPrices[targetKey] = value

    if (inlineRelativePricing.value && hasBaseRoom.value && isBaseCellFn(roomTypeId, mealPlanId)) {
      const basePrice = parseFloat(value) || 0
      if (basePrice > 0) {
        props.roomTypes.forEach(room => {
          props.mealPlans.forEach(meal => {
            if (isBaseCellFn(room._id, meal._id)) return

            const roomAdj = room.priceAdjustment || 0
            const mealAdj = meal.priceAdjustment || 0
            const afterRoom = basePrice * (1 + roomAdj / 100)
            const afterMeal = afterRoom * (1 + mealAdj / 100)
            const calculatedPrice = Math.round(afterMeal * 100) / 100

            const calcKey = `${room._id}-${meal._id}-${targetDateStr}`
            inlineEditPrices[calcKey] = calculatedPrice
          })
        })
      }
    }
  }

  toast.success(t('planning.pricing.copiedToDays', { count: dayCount }))
  closeContextMenu()
}

// Select date column
const selectDateColumn = (date, event) => {
  const newCells = []

  for (const roomType of props.roomTypes) {
    for (const mealPlan of filteredMealPlans.value) {
      const rate = getRateForCell(roomType._id, mealPlan._id, date)
      newCells.push({
        roomTypeId: roomType._id,
        mealPlanId: mealPlan._id,
        date,
        rateId: rate?._id || null
      })
    }
  }

  if (event.shiftKey && selectedCells.value.length > 0) {
    const existingDates = [...new Set(selectedCells.value.map(c => c.date))].sort()
    const lastDate = existingDates[existingDates.length - 1]
    const startDateObj = parseDateString(lastDate < date ? lastDate : date)
    const endDateObj = parseDateString(lastDate > date ? lastDate : date)

    const rangeCells = []
    const current = new Date(startDateObj)
    while (current <= endDateObj) {
      const dateStr = formatDateToString(current)
      for (const roomType of props.roomTypes) {
        for (const mealPlan of filteredMealPlans.value) {
          const rate = getRateForCell(roomType._id, mealPlan._id, dateStr)
          rangeCells.push({
            roomTypeId: roomType._id,
            mealPlanId: mealPlan._id,
            date: dateStr,
            rateId: rate?._id || null
          })
        }
      }
      current.setDate(current.getDate() + 1)
    }
    selectedCells.value = rangeCells
  } else if (event.ctrlKey || event.metaKey) {
    const dateSelected = selectedCells.value.some(c => c.date === date)
    if (dateSelected) {
      selectedCells.value = selectedCells.value.filter(c => c.date !== date)
    } else {
      selectedCells.value = [...selectedCells.value, ...newCells]
    }
  } else {
    selectedCells.value = newCells
  }
}

// Select room row
const selectRoomRow = (roomTypeId, mealPlanId, event) => {
  const newCells = calendarDays.value.map(day => {
    const rate = getRateForCell(roomTypeId, mealPlanId, day.date)
    return {
      roomTypeId,
      mealPlanId,
      date: day.date,
      rateId: rate?._id || null
    }
  })

  if (event.ctrlKey || event.metaKey) {
    const rowSelected = selectedCells.value.some(
      c => c.roomTypeId === roomTypeId && c.mealPlanId === mealPlanId
    )
    if (rowSelected) {
      selectedCells.value = selectedCells.value.filter(
        c => !(c.roomTypeId === roomTypeId && c.mealPlanId === mealPlanId)
      )
    } else {
      selectedCells.value = [...selectedCells.value, ...newCells]
    }
  } else {
    selectedCells.value = newCells
  }
}

// Navigate between cells
const navigateCell = (currentRoomId, currentMealPlanId, currentDate, direction) => {
  const meals = filteredMealPlans.value
  const rooms = props.roomTypes

  const roomIndex = rooms.findIndex(r => r._id === currentRoomId)
  const mealIndex = meals.findIndex(m => m._id === currentMealPlanId)

  if (roomIndex === -1 || mealIndex === -1) return

  let newRoomIndex = roomIndex
  let newMealIndex = mealIndex

  if (direction === 'up') {
    if (mealIndex > 0) {
      newMealIndex = mealIndex - 1
    } else if (roomIndex > 0) {
      newRoomIndex = roomIndex - 1
      newMealIndex = meals.length - 1
    } else {
      return
    }
  } else if (direction === 'down') {
    if (mealIndex < meals.length - 1) {
      newMealIndex = mealIndex + 1
    } else if (roomIndex < rooms.length - 1) {
      newRoomIndex = roomIndex + 1
      newMealIndex = 0
    } else {
      return
    }
  }

  const newRoomId = rooms[newRoomIndex]._id
  const newMealPlanId = meals[newMealIndex]._id

  nextTick(() => {
    const selector = `[data-cell="${newRoomId}-${newMealPlanId}-${currentDate}"] input`
    const input = document.querySelector(selector)
    if (input) {
      input.focus()
    }
  })
}

// Inline edit popover
const openInlineEdit = async (roomTypeId, mealPlanId, date, rate) => {
  editingCell.value = { roomTypeId, mealPlanId, date, rate }

  const roomType = props.roomTypes.find(rt => rt._id === roomTypeId)
  const maxChildren = roomType?.occupancy?.maxChildren ?? 2
  const maxAdults = roomType?.occupancy?.maxAdults ?? 4
  const pricingType = roomType?.pricingType || 'unit'

  inlineForm.pricingType = pricingType
  inlineForm.pricePerNight = rate?.pricePerNight || 0
  inlineForm.allotment = rate?.allotment || 0
  inlineForm.minStay = rate?.minStay || 1
  inlineForm.stopSale = rate?.stopSale || false
  inlineForm.singleStop = rate?.singleStop || false
  inlineForm.closedToArrival = rate?.closedToArrival || false
  inlineForm.closedToDeparture = rate?.closedToDeparture || false
  inlineForm.extraAdult = rate?.extraAdult ?? ''
  inlineForm.extraInfant = rate?.extraInfant ?? ''
  inlineForm.singleSupplement = rate?.singleSupplement ?? ''

  inlineForm.occupancyPricing = {}
  for (let i = 1; i <= maxAdults; i++) {
    inlineForm.occupancyPricing[i] = rate?.occupancyPricing?.[i] ?? ''
  }

  inlineForm.childOrderPricing = Array(maxChildren)
    .fill('')
    .map((_, i) => {
      const existing = rate?.childOrderPricing?.[i]
      return typeof existing === 'number' ? existing : ''
    })

  await nextTick()
  const cellEl = document.querySelector(`[data-cell="${roomTypeId}-${mealPlanId}-${date}"]`)
  if (cellEl) {
    const rect = cellEl.getBoundingClientRect()
    const popoverHeight = 480
    const popoverWidth = 300
    const margin = 8

    const spaceBelow = window.innerHeight - rect.bottom - margin
    const spaceAbove = rect.top - margin

    let top
    if (spaceBelow >= popoverHeight) {
      top = rect.bottom + margin
    } else if (spaceAbove >= popoverHeight) {
      top = rect.top - popoverHeight - margin
    } else {
      top = Math.max(margin, Math.min(rect.top, window.innerHeight - popoverHeight - margin))
    }

    let left = rect.left
    if (left + popoverWidth > window.innerWidth - margin) {
      left = window.innerWidth - popoverWidth - margin
    }
    if (left < margin) {
      left = margin
    }

    popoverStyle.value = {
      top: `${top}px`,
      left: `${left}px`
    }
  } else {
    popoverStyle.value = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }
}

const closeInlineEdit = () => {
  editingCell.value = null
}

const saveInlineEdit = async () => {
  if (!editingCell.value) return

  savingInline.value = true
  try {
    const { roomTypeId, mealPlanId, date, rate } = editingCell.value

    const data = {
      roomType: roomTypeId,
      mealPlan: mealPlanId,
      market: props.market?._id,
      startDate: date,
      endDate: date,
      allotment: inlineForm.allotment,
      minStay: inlineForm.minStay,
      stopSale: inlineForm.stopSale,
      singleStop: inlineForm.singleStop,
      closedToArrival: inlineForm.closedToArrival,
      closedToDeparture: inlineForm.closedToDeparture,
      currency: currency.value,
      pricingType: inlineForm.pricingType
    }

    const roomType = props.roomTypes.find(rt => rt._id === roomTypeId)
    const usesMultipliers =
      roomType?.pricingType === 'per_person' && roomType?.useMultipliers === true

    if (inlineForm.pricingType === 'per_person' && usesMultipliers) {
      data.pricePerNight = inlineForm.pricePerNight || 0
      data.occupancyPricing = {}
      data.childOrderPricing = []
      data.extraInfant = 0
      data.extraAdult = 0
      data.singleSupplement = 0
    } else if (inlineForm.pricingType === 'per_person') {
      const occupancyPricing = {}
      for (const [pax, price] of Object.entries(inlineForm.occupancyPricing)) {
        if (price !== '' && price !== null) {
          occupancyPricing[pax] = Number(price)
        }
      }
      data.occupancyPricing = occupancyPricing
      data.pricePerNight = 0
      data.extraAdult = 0
      data.singleSupplement = 0

      if (inlineForm.extraInfant !== '' && inlineForm.extraInfant !== null) {
        data.extraInfant = Number(inlineForm.extraInfant)
      }
      if (inlineForm.childOrderPricing?.length > 0) {
        data.childOrderPricing = inlineForm.childOrderPricing.map(p =>
          p !== '' && p !== null ? Number(p) : null
        )
      }
    } else {
      data.pricePerNight = inlineForm.pricePerNight

      if (inlineForm.extraAdult !== '' && inlineForm.extraAdult !== null) {
        data.extraAdult = Number(inlineForm.extraAdult)
      }
      if (inlineForm.singleSupplement !== '' && inlineForm.singleSupplement !== null) {
        data.singleSupplement = Number(inlineForm.singleSupplement)
      }

      if (inlineForm.extraInfant !== '' && inlineForm.extraInfant !== null) {
        data.extraInfant = Number(inlineForm.extraInfant)
      }
      if (inlineForm.childOrderPricing?.length > 0) {
        data.childOrderPricing = inlineForm.childOrderPricing.map(p =>
          p !== '' && p !== null ? Number(p) : null
        )
      }
    }

    if (rate?._id) {
      await planningService.updateRate(props.hotelId, rate._id, data)
    } else {
      await planningService.createRate(props.hotelId, data)
    }

    toast.success(t('planning.pricing.rateSaved'))
    closeInlineEdit()
    emit('refresh')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    savingInline.value = false
  }
}

const copyPopoverToNextDays = async days => {
  const copyCount = days || 7
  if (!editingCell.value || !copyCount) return

  const { roomTypeId, mealPlanId, date } = editingCell.value
  const startDate = parseDateString(date)
  const count = Math.min(copyCount, 31)

  savingInline.value = true
  try {
    const promises = []

    const baseData = {
      roomType: roomTypeId,
      mealPlan: mealPlanId,
      market: props.market?._id,
      minStay: inlineForm.minStay,
      stopSale: inlineForm.stopSale,
      singleStop: inlineForm.singleStop,
      closedToArrival: inlineForm.closedToArrival,
      closedToDeparture: inlineForm.closedToDeparture,
      currency: currency.value,
      pricingType: inlineForm.pricingType
    }

    const roomType = props.roomTypes.find(rt => rt._id === roomTypeId)
    const usesMultipliers =
      roomType?.pricingType === 'per_person' && roomType?.useMultipliers === true

    if (inlineForm.pricingType === 'per_person' && usesMultipliers) {
      baseData.pricePerNight = inlineForm.pricePerNight || 0
      baseData.occupancyPricing = {}
      baseData.childOrderPricing = []
      baseData.extraInfant = 0
      baseData.extraAdult = 0
      baseData.singleSupplement = 0
    } else if (inlineForm.pricingType === 'per_person') {
      const occupancyPricing = {}
      for (const [pax, price] of Object.entries(inlineForm.occupancyPricing)) {
        if (price !== '' && price !== null) {
          occupancyPricing[pax] = Number(price)
        }
      }
      baseData.occupancyPricing = occupancyPricing
      baseData.pricePerNight = 0
      baseData.extraAdult = 0
      baseData.singleSupplement = 0

      if (inlineForm.extraInfant !== '' && inlineForm.extraInfant !== null) {
        baseData.extraInfant = Number(inlineForm.extraInfant)
      }
      if (inlineForm.childOrderPricing?.length > 0) {
        baseData.childOrderPricing = inlineForm.childOrderPricing.map(p =>
          p !== '' && p !== null ? Number(p) : null
        )
      }
    } else {
      baseData.pricePerNight = inlineForm.pricePerNight
      if (inlineForm.extraAdult !== '' && inlineForm.extraAdult !== null) {
        baseData.extraAdult = Number(inlineForm.extraAdult)
      }
      if (inlineForm.singleSupplement !== '' && inlineForm.singleSupplement !== null) {
        baseData.singleSupplement = Number(inlineForm.singleSupplement)
      }

      if (inlineForm.extraInfant !== '' && inlineForm.extraInfant !== null) {
        baseData.extraInfant = Number(inlineForm.extraInfant)
      }
      if (inlineForm.childOrderPricing?.length > 0) {
        baseData.childOrderPricing = inlineForm.childOrderPricing.map(p =>
          p !== '' && p !== null ? Number(p) : null
        )
      }
    }

    for (let i = 1; i <= count; i++) {
      const targetDate = new Date(startDate)
      targetDate.setDate(targetDate.getDate() + i)
      const targetDateStr = formatDateToString(targetDate)

      if (targetDate.getMonth() !== currentDate.value.getMonth()) continue

      const existingRate = getRateForCell(roomTypeId, mealPlanId, targetDateStr)
      const data = {
        ...baseData,
        startDate: targetDateStr,
        endDate: targetDateStr
      }

      if (existingRate?._id) {
        data.allotment = existingRate.allotment ?? 10
        promises.push(planningService.updateRate(props.hotelId, existingRate._id, data))
      } else {
        data.allotment = 10
        promises.push(planningService.createRate(props.hotelId, data))
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises)
      toast.success(t('planning.pricing.copiedToDays', { count: promises.length }))
      emit('refresh')
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    savingInline.value = false
  }
}

// Keyboard shortcuts
const handleKeyDown = e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !editingCell.value) {
    e.preventDefault()
    copyWeek()
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !editingCell.value) {
    e.preventDefault()
    pasteWeek()
  }

  if (e.key === 'Escape') {
    if (editingCell.value) {
      closeInlineEdit()
    } else {
      clearSelection()
    }
  }

  if (e.key === 'Delete' && selectedCells.value.length > 0 && !editingCell.value) {
    e.preventDefault()
    quickAction('stopSale', true)
  }
}

// Click outside handlers
const handleClickOutside = e => {
  const popoverEl = quickEditPopoverRef.value?.popoverRef
  if (popoverEl && !popoverEl.contains(e.target)) {
    closeInlineEdit()
  }
  if (
    showContextMenu.value &&
    contextMenuRef.value?.menuRef &&
    !contextMenuRef.value.menuRef.contains(e.target)
  ) {
    closeContextMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})

// Watch for month changes
watch(currentDate, () => {
  clearSelection()
})

// Expose clearSelection for parent component
defineExpose({
  clearSelection
})
</script>

<style scoped>
/* Slide down transition for details */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 500px;
}
</style>
