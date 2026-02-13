<template>
  <div
    class="calendar-grid-wrapper overflow-auto rounded-xl border border-gray-200 dark:border-slate-600 shadow-sm"
  >
    <table class="calendar-table w-full" :style="{ minWidth: `${100 + daysInMonth * 44}px` }">
      <!-- Days Header -->
      <thead>
        <!-- Day Numbers -->
        <tr class="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <th
            class="sticky left-0 z-30 bg-gray-50 dark:bg-slate-800 px-2 sm:px-3 py-2 text-left min-w-[120px] sm:min-w-[180px] border-r border-gray-200 dark:border-slate-700"
          >
            <span
              class="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
            >
              {{ $t('planning.pricing.roomType') }}
            </span>
          </th>
          <th
            v-for="day in calendarDays"
            :key="day.date"
            class="px-0.5 sm:px-1 py-1.5 sm:py-2 text-center min-w-[36px] sm:min-w-[48px] border-r border-gray-100 dark:border-slate-700 last:border-r-0 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            :class="{
              'bg-blue-50 dark:bg-blue-900/20': day.isToday,
              'bg-amber-50/50 dark:bg-amber-900/10': day.isWeekend && !day.isToday,
              'bg-purple-100 dark:bg-purple-900/30': isDateColumnSelected(day.date)
            }"
            :title="$t('planning.pricing.clickToSelectDate')"
            @click="$emit('select-date-column', day.date, $event)"
          >
            <div
              class="text-[10px] sm:text-xs font-medium"
              :class="
                day.isToday
                  ? 'text-blue-600 dark:text-blue-400'
                  : day.isWeekend
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-500 dark:text-slate-400'
              "
            >
              {{ day.weekday }}
            </div>
            <div
              class="text-xs sm:text-sm font-bold mt-0.5"
              :class="
                day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-white'
              "
            >
              {{ day.dayNumber }}
            </div>
          </th>
        </tr>
      </thead>

      <!-- Room Type Rows -->
      <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
        <template v-for="roomType in roomTypes" :key="roomType._id">
          <!-- Main Room Row (with meal plan if only one) -->
          <tr
            v-for="(mealPlan, mpIndex) in filteredMealPlans"
            :key="`${roomType._id}-${mealPlan._id}`"
          >
            <!-- Room Type / Meal Plan Label -->
            <td
              class="sticky left-0 z-20 bg-white dark:bg-slate-800 px-2 sm:px-3 py-1.5 sm:py-2 border-r border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              :class="{
                'border-t border-gray-200 dark:border-slate-700': mpIndex === 0,
                'bg-purple-50 dark:bg-purple-900/20': isRoomMealPlanSelected(
                  roomType._id,
                  mealPlan._id
                )
              }"
              :title="$t('planning.pricing.clickToSelectRow')"
              @click="$emit('select-room-row', roomType._id, mealPlan._id, $event)"
            >
              <div
                v-if="mpIndex === 0"
                class="font-semibold text-gray-800 dark:text-white text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[160px]"
              >
                <span class="text-purple-600 dark:text-purple-400">{{ roomType.code }}</span>
                <span class="text-gray-400 mx-0.5">.</span>
                {{ getRoomTypeName(roomType) }}
                <span
                  v-if="roomType.status === 'inactive'"
                  class="ml-1 px-1 py-0.5 text-[9px] font-medium rounded bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400"
                >
                  {{ $t('common.status.inactive') }}
                </span>
              </div>
              <div class="flex items-center gap-1 sm:gap-2 mt-0.5">
                <span
                  class="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium"
                  :class="getMealPlanColor(mealPlan.code)"
                >
                  {{ mealPlan.code }}
                </span>
                <span
                  class="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 hidden sm:inline truncate max-w-[80px]"
                >
                  {{ getMealPlanName(mealPlan) }}
                </span>
              </div>
            </td>

            <!-- Day Cells -->
            <td
              v-for="day in calendarDays"
              :key="`${roomType._id}-${mealPlan._id}-${day.date}`"
              class="relative border-r border-gray-100 dark:border-slate-700 last:border-r-0 p-0"
              :class="{
                'bg-blue-50/30 dark:bg-blue-900/10': day.isToday,
                'bg-amber-50/30 dark:bg-amber-900/5': day.isWeekend && !day.isToday
              }"
            >
              <RateCell
                :rate="getRateForCell(roomType._id, mealPlan._id, day.date)"
                :date="day.date"
                :room-type-id="roomType._id"
                :meal-plan-id="mealPlan._id"
                :room-type="roomType"
                :currency="currency"
                :booked-count="getBookedCount(roomType._id, day.date)"
                :is-selected="isCellSelected(roomType._id, mealPlan._id, day.date)"
                :is-past="day.isPast"
                :inline-edit-mode="inlineEditMode"
                :inline-edit-value="getInlineEditPrice(roomType._id, mealPlan._id, day.date)"
                :is-base-cell="isBaseCell(roomType._id, mealPlan._id)"
                :is-calculated="isCalculatedCell(roomType._id, mealPlan._id)"
                :allow-edit-calculated="allowEditCalculated"
                @click="$emit('cell-click', $event, roomType._id, mealPlan._id, day.date)"
                @dblclick="$emit('cell-dblclick', roomType._id, mealPlan._id, day.date)"
                @contextmenu="
                  $emit('cell-contextmenu', $event, roomType._id, mealPlan._id, day.date)
                "
                @inline-change="
                  $emit('inline-change', roomType._id, mealPlan._id, day.date, $event)
                "
                @inline-up="$emit('navigate-cell', roomType._id, mealPlan._id, day.date, 'up')"
                @inline-down="$emit('navigate-cell', roomType._id, mealPlan._id, day.date, 'down')"
              />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import RateCell from './RateCell.vue'

const props = defineProps({
  roomTypes: { type: Array, default: () => [] },
  filteredMealPlans: { type: Array, default: () => [] },
  calendarDays: { type: Array, default: () => [] },
  daysInMonth: { type: Number, default: 31 },
  currency: { type: String, default: 'EUR' },
  selectedCells: { type: Array, default: () => [] },
  occupancy: { type: Object, default: () => ({}) },
  inlineEditMode: { type: Boolean, default: false },
  inlineEditPrices: { type: Object, default: () => ({}) },
  allowEditCalculated: { type: Boolean, default: false },
  hasBaseRoom: { type: Boolean, default: false },
  baseRoomId: { type: String, default: null },
  baseMealPlanId: { type: String, default: null },
  inlineRelativePricing: { type: Boolean, default: true },
  getRateForCell: { type: Function, required: true }
})

defineEmits([
  'select-date-column',
  'select-room-row',
  'cell-click',
  'cell-dblclick',
  'cell-contextmenu',
  'inline-change',
  'navigate-cell'
])

const { locale } = useI18n()

const getBookedCount = (roomTypeId, date) => {
  const key = `${date}_${roomTypeId}`
  return props.occupancy?.[key] || 0
}

const getRoomTypeName = roomType => {
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || roomType.code
}

const getMealPlanName = mealPlan => {
  return mealPlan.name?.[locale.value] || mealPlan.name?.tr || mealPlan.name?.en || ''
}

const getMealPlanColor = code => {
  const colors = {
    RO: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    BB: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    HB: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    FB: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    AI: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    UAI: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
  }
  return colors[code] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const isCellSelected = (roomTypeId, mealPlanId, date) => {
  return props.selectedCells.some(
    c => c.roomTypeId === roomTypeId && c.mealPlanId === mealPlanId && c.date === date
  )
}

const isDateColumnSelected = date => {
  const totalCells = props.roomTypes.length * props.filteredMealPlans.length
  const selectedCount = props.selectedCells.filter(c => c.date === date).length
  return selectedCount === totalCells && totalCells > 0
}

const isRoomMealPlanSelected = (roomTypeId, mealPlanId) => {
  const totalCells = props.calendarDays.length
  const selectedCount = props.selectedCells.filter(
    c => c.roomTypeId === roomTypeId && c.mealPlanId === mealPlanId
  ).length
  return selectedCount === totalCells && totalCells > 0
}

const getInlineEditPrice = (roomTypeId, mealPlanId, date) => {
  const key = `${roomTypeId}-${mealPlanId}-${date}`
  return props.inlineEditPrices[key]
}

const isBaseCell = (roomTypeId, mealPlanId) => {
  if (!props.hasBaseRoom || !props.inlineRelativePricing) return false
  return props.baseRoomId === roomTypeId && props.baseMealPlanId === mealPlanId
}

const isCalculatedCell = (roomTypeId, mealPlanId) => {
  if (!props.hasBaseRoom || !props.inlineRelativePricing) return false
  return !isBaseCell(roomTypeId, mealPlanId)
}
</script>

<style scoped>
.calendar-grid-wrapper {
  max-height: calc(100vh - 350px);
}

.calendar-table {
  border-collapse: separate;
  border-spacing: 0;
}

.calendar-table th,
.calendar-table td {
  white-space: nowrap;
}

.calendar-table tbody tr:hover td:not(.sticky) {
  background-color: rgba(147, 51, 234, 0.05);
}
</style>
