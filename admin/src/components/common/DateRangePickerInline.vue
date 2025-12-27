<template>
  <div class="date-range-picker-inline">
    <!-- Selected Range Summary -->
    <div class="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
      <div class="flex items-center gap-4">
        <!-- Start Date -->
        <div class="text-center">
          <div class="text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('common.startDate') }}</div>
          <div
            class="px-4 py-2 rounded-lg font-semibold transition-colors"
            :class="startDate
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-700 text-gray-400 dark:text-slate-500 border-2 border-dashed border-gray-300 dark:border-slate-600'"
          >
            {{ startDate ? formatDisplayDate(startDate) : '--' }}
          </div>
        </div>

        <!-- Arrow -->
        <div class="flex flex-col items-center">
          <span class="material-icons text-gray-400">arrow_forward</span>
        </div>

        <!-- End Date -->
        <div class="text-center">
          <div class="text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('common.endDate') }}</div>
          <div
            class="px-4 py-2 rounded-lg font-semibold transition-colors"
            :class="endDate
              ? 'bg-purple-600 text-white'
              : 'bg-white dark:bg-slate-700 text-gray-400 dark:text-slate-500 border-2 border-dashed border-gray-300 dark:border-slate-600'"
          >
            {{ endDate ? formatDisplayDate(endDate) : '--' }}
          </div>
        </div>
      </div>

      <!-- Day Count Badge -->
      <div v-if="dayCount > 0" class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
        <span class="material-icons text-indigo-600 dark:text-indigo-400">nights_stay</span>
        <div>
          <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ dayCount }}</div>
          <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.nights') }}</div>
        </div>
      </div>
    </div>

    <!-- Quick Select Buttons -->
    <div class="flex items-center gap-2 mb-4">
      <span class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.quickFill') }}:</span>
      <button
        v-for="option in quickOptions"
        :key="option.days"
        type="button"
        @click="selectQuickRange(option.days)"
        class="px-3 py-1.5 text-sm rounded-lg font-medium transition-all"
        :class="isQuickOptionActive(option.days)
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300'"
      >
        {{ option.label }}
      </button>
      <button
        v-if="startDate || endDate"
        type="button"
        @click="clearDates"
        class="ml-auto text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
      >
        <span class="material-icons text-sm">close</span>
        {{ $t('common.clear') }}
      </button>
    </div>

    <!-- Calendars -->
    <div class="flex gap-4">
      <!-- Left Calendar -->
      <div class="flex-1 bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
        <div class="flex items-center justify-between mb-3">
          <button
            type="button"
            @click="previousMonth"
            class="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span class="material-icons text-gray-600 dark:text-slate-400">chevron_left</span>
          </button>
          <div class="font-semibold text-gray-800 dark:text-white">
            {{ formatMonthYear(currentMonth) }}
          </div>
          <div class="w-9"></div>
        </div>
        <div class="calendar-grid">
          <div v-for="day in weekDays" :key="day" class="calendar-header">
            {{ day }}
          </div>
          <div
            v-for="(date, index) in getMonthDates(currentMonth)"
            :key="`left-${index}`"
            :class="getDateClass(date)"
            @click="selectDate(date)"
            @mouseenter="hoverDate = date"
            @mouseleave="hoverDate = null"
          >
            <span v-if="date">{{ date.getDate() }}</span>
          </div>
        </div>
      </div>

      <!-- Right Calendar -->
      <div class="flex-1 bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9"></div>
          <div class="font-semibold text-gray-800 dark:text-white">
            {{ formatMonthYear(nextMonth) }}
          </div>
          <button
            type="button"
            @click="nextMonthAction"
            class="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span class="material-icons text-gray-600 dark:text-slate-400">chevron_right</span>
          </button>
        </div>
        <div class="calendar-grid">
          <div v-for="day in weekDays" :key="day" class="calendar-header">
            {{ day }}
          </div>
          <div
            v-for="(date, index) in getMonthDates(nextMonth)"
            :key="`right-${index}`"
            :class="getDateClass(date)"
            @click="selectDate(date)"
            @mouseenter="hoverDate = date"
            @mouseleave="hoverDate = null"
          >
            <span v-if="date">{{ date.getDate() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Helper Text -->
    <div class="mt-3 text-center text-xs text-gray-500 dark:text-slate-400">
      <span v-if="!startDate">{{ $t('dateRangePicker.selectStart') }}</span>
      <span v-else-if="!endDate">{{ $t('dateRangePicker.selectEnd') }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ start: null, end: null })
  },
  minDate: {
    type: Date,
    default: null
  },
  maxDate: {
    type: Date,
    default: null
  },
  allowPast: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const { t, locale } = useI18n()

const currentMonth = ref(new Date())
const startDate = ref(null)
const endDate = ref(null)
const hoverDate = ref(null)

// Initialize from props
const initFromProps = () => {
  if (props.modelValue?.start) {
    const [y, m, d] = props.modelValue.start.split('-').map(Number)
    startDate.value = new Date(y, m - 1, d)
    currentMonth.value = new Date(y, m - 1, 1)
  } else {
    startDate.value = null
  }

  if (props.modelValue?.end) {
    const [y, m, d] = props.modelValue.end.split('-').map(Number)
    endDate.value = new Date(y, m - 1, d)
  } else {
    endDate.value = null
  }
}

// Call on mount
initFromProps()

const weekDays = computed(() => {
  if (locale.value === 'tr') {
    return ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  }
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
})

const months = computed(() => {
  if (locale.value === 'tr') {
    return ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
  }
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
})

const quickOptions = computed(() => [
  { days: 7, label: t('dateRangePicker.days7') },
  { days: 14, label: t('dateRangePicker.days14') },
  { days: 30, label: t('dateRangePicker.days30') },
  { days: 90, label: t('dateRangePicker.days90') }
])

const nextMonth = computed(() => {
  const date = new Date(currentMonth.value)
  date.setMonth(date.getMonth() + 1)
  return date
})

const dayCount = computed(() => {
  if (startDate.value && endDate.value) {
    const diff = Math.ceil((endDate.value - startDate.value) / (1000 * 60 * 60 * 24)) + 1
    return diff
  }
  return 0
})

function formatDisplayDate(date) {
  if (!date) return ''
  const day = date.getDate()
  const month = months.value[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

function formatMonthYear(date) {
  return `${months.value[date.getMonth()]} ${date.getFullYear()}`
}

function getMonthDates(month) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1)
  const lastDay = new Date(year, monthIndex + 1, 0)

  let startDay = firstDay.getDay()
  startDay = startDay === 0 ? 6 : startDay - 1

  const dates = []

  for (let i = 0; i < startDay; i++) {
    dates.push(null)
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, monthIndex, day))
  }

  return dates
}

function getDateClass(date) {
  if (!date) return 'calendar-day-empty'

  const classes = ['calendar-day']
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateClone = new Date(date)
  dateClone.setHours(0, 0, 0, 0)

  let minDateValue = props.minDate || (props.allowPast ? null : today)
  let maxDateValue = props.maxDate || null

  // Normalize minDate and maxDate to midnight
  if (minDateValue) {
    minDateValue = new Date(minDateValue)
    minDateValue.setHours(0, 0, 0, 0)
  }
  if (maxDateValue) {
    maxDateValue = new Date(maxDateValue)
    maxDateValue.setHours(0, 0, 0, 0)
  }

  if (minDateValue && dateClone < minDateValue) {
    classes.push('calendar-day-disabled')
    return classes.join(' ')
  }

  if (maxDateValue && dateClone > maxDateValue) {
    classes.push('calendar-day-disabled')
    return classes.join(' ')
  }

  if (dateClone.getTime() === today.getTime()) {
    classes.push('calendar-day-today')
  }

  const dayOfWeek = date.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    classes.push('calendar-day-weekend')
  }

  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value)
    const end = new Date(endDate.value)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    if (dateClone.getTime() === start.getTime()) {
      classes.push('calendar-day-start')
    } else if (dateClone.getTime() === end.getTime()) {
      classes.push('calendar-day-end')
    } else if (dateClone > start && dateClone < end) {
      classes.push('calendar-day-in-range')
    }
  } else if (startDate.value && dateClone.getTime() === new Date(startDate.value).setHours(0,0,0,0)) {
    classes.push('calendar-day-start')
  }

  // Hover range preview
  if (startDate.value && !endDate.value && hoverDate.value) {
    const start = new Date(startDate.value)
    const hover = new Date(hoverDate.value)
    start.setHours(0, 0, 0, 0)
    hover.setHours(0, 0, 0, 0)

    if (hover > start && dateClone > start && dateClone <= hover) {
      classes.push('calendar-day-hover-range')
    }
    if (hover < start && dateClone < start && dateClone >= hover) {
      classes.push('calendar-day-hover-range')
    }
  }

  return classes.join(' ')
}

function selectDate(date) {
  if (!date) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateClone = new Date(date)
  dateClone.setHours(0, 0, 0, 0)

  let minDateValue = props.minDate || (props.allowPast ? null : today)
  if (minDateValue) {
    minDateValue = new Date(minDateValue)
    minDateValue.setHours(0, 0, 0, 0)
  }
  if (minDateValue && dateClone < minDateValue) return

  let maxDateValue = props.maxDate || null
  if (maxDateValue) {
    maxDateValue = new Date(maxDateValue)
    maxDateValue.setHours(0, 0, 0, 0)
  }
  if (maxDateValue && dateClone > maxDateValue) return

  if (!startDate.value || (startDate.value && endDate.value)) {
    startDate.value = dateClone
    endDate.value = null
  } else {
    if (dateClone < startDate.value) {
      endDate.value = startDate.value
      startDate.value = dateClone
    } else {
      endDate.value = dateClone
    }
    emitValue()
  }
}

function selectQuickRange(days) {
  // Use selected start date or today as base
  let baseDate
  if (startDate.value) {
    baseDate = new Date(startDate.value)
  } else {
    baseDate = new Date()
  }
  baseDate.setHours(0, 0, 0, 0)

  const end = new Date(baseDate)
  end.setDate(end.getDate() + days - 1)

  startDate.value = baseDate
  endDate.value = end
  currentMonth.value = new Date(baseDate)

  emitValue()
}

function isQuickOptionActive(days) {
  if (!startDate.value || !endDate.value) return false
  return dayCount.value === days
}

function emitValue() {
  if (startDate.value && endDate.value) {
    const toLocalIsoDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    emit('update:modelValue', {
      start: toLocalIsoDate(startDate.value),
      end: toLocalIsoDate(endDate.value)
    })
  }
}

function clearDates() {
  startDate.value = null
  endDate.value = null
  emit('update:modelValue', { start: null, end: null })
}

function previousMonth() {
  const date = new Date(currentMonth.value)
  date.setMonth(date.getMonth() - 1)
  currentMonth.value = date
}

function nextMonthAction() {
  const date = new Date(currentMonth.value)
  date.setMonth(date.getMonth() + 1)
  currentMonth.value = date
}

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  if (newVal?.start) {
    const [y, m, d] = newVal.start.split('-').map(Number)
    const newStart = new Date(y, m - 1, d)
    if (!startDate.value || startDate.value.getTime() !== newStart.getTime()) {
      startDate.value = newStart
      // Navigate calendar to show the start date's month
      currentMonth.value = new Date(y, m - 1, 1)
    }
  }
  if (newVal?.end) {
    const [y, m, d] = newVal.end.split('-').map(Number)
    const newEnd = new Date(y, m - 1, d)
    if (!endDate.value || endDate.value.getTime() !== newEnd.getTime()) {
      endDate.value = newEnd
    }
  }
}, { deep: true })

// Watch for minDate changes - navigate calendar to minDate's month
watch(() => props.minDate, (newMinDate) => {
  if (newMinDate) {
    const minDate = new Date(newMinDate)
    currentMonth.value = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    // Clear existing selection if it's outside new bounds
    if (startDate.value) {
      const start = new Date(startDate.value)
      start.setHours(0, 0, 0, 0)
      minDate.setHours(0, 0, 0, 0)
      if (start < minDate) {
        startDate.value = null
        endDate.value = null
        emitValue()
      }
    }
  }
})
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-header {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  padding: 0.5rem;
}

.dark .calendar-header {
  color: #9ca3af;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.15s ease;
  color: #1f2937;
  font-weight: 500;
}

.dark .calendar-day {
  color: #f3f4f6;
}

.calendar-day:hover {
  background-color: #f3f4f6;
}

.dark .calendar-day:hover {
  background-color: #374151;
}

.calendar-day-empty {
  aspect-ratio: 1;
}

.calendar-day-disabled {
  color: #d1d5db;
  cursor: not-allowed;
  pointer-events: none;
}

.dark .calendar-day-disabled {
  color: #4b5563;
}

.calendar-day-today {
  font-weight: 700;
  box-shadow: inset 0 0 0 2px #6366f1;
}

.calendar-day-weekend {
  color: #ef4444;
}

.dark .calendar-day-weekend {
  color: #f87171;
}

.calendar-day-start {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  color: white !important;
  font-weight: 700;
  border-radius: 0.5rem 0 0 0.5rem;
}

.calendar-day-end {
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%) !important;
  color: white !important;
  font-weight: 700;
  border-radius: 0 0.5rem 0.5rem 0;
}

.calendar-day-start.calendar-day-end {
  border-radius: 0.5rem;
}

.calendar-day-in-range {
  background-color: #e0e7ff;
  color: #4338ca;
  border-radius: 0;
}

.dark .calendar-day-in-range {
  background-color: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

.calendar-day-hover-range {
  background-color: #eef2ff;
  color: #4f46e5;
  border-radius: 0;
}

.dark .calendar-day-hover-range {
  background-color: rgba(99, 102, 241, 0.1);
  color: #a5b4fc;
}
</style>
