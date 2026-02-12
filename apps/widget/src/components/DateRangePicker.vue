<script setup>
import { ref, computed, watch } from 'vue'
import { useTranslation } from '../composables/useTranslation'

const { t, getLocale } = useTranslation()

const props = defineProps({
  checkIn: String,
  checkOut: String,
  minDate: String,
  maxDate: String
})

const emit = defineEmits(['update:checkIn', 'update:checkOut'])

const isOpen = ref(false)
const selecting = ref('checkIn') // 'checkIn' or 'checkOut'
const hoveredDate = ref(null)

// Current displayed month
const currentMonth = ref(new Date())

// Initialize currentMonth based on checkIn
if (props.checkIn) {
  currentMonth.value = new Date(props.checkIn)
}

const today = new Date()
today.setHours(0, 0, 0, 0)

// Reactive day/month names from translations
const DAYS = computed(() => t('datePicker.days'))
const MONTHS = computed(() => t('datePicker.months'))

// Night count
const nights = computed(() => {
  if (!props.checkIn || !props.checkOut) return 0
  const start = new Date(props.checkIn)
  const end = new Date(props.checkOut)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
})

// Calendar grid for current month
const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday = 0, Sunday = 6
  let startDay = firstDay.getDay() - 1
  if (startDay < 0) startDay = 6

  const days = []

  // Previous month padding
  const prevMonthLast = new Date(year, month, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLast - i),
      day: prevMonthLast - i,
      isOtherMonth: true,
      isDisabled: true
    })
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    date.setHours(0, 0, 0, 0)

    const dateStr = formatISO(date)
    const minDateObj = props.minDate ? new Date(props.minDate) : today
    minDateObj.setHours(0, 0, 0, 0)

    let isDisabled = date < minDateObj
    if (!isDisabled && props.maxDate) {
      const maxDateObj = new Date(props.maxDate)
      maxDateObj.setHours(0, 0, 0, 0)
      isDisabled = date > maxDateObj
    }
    const isToday = date.getTime() === today.getTime()
    const isCheckIn = dateStr === props.checkIn
    const isCheckOut = dateStr === props.checkOut
    const isInRange = isDateInRange(date)
    const isRangeStart = isCheckIn
    const isRangeEnd = isCheckOut
    const isHoverRange = isDateInHoverRange(date)

    days.push({
      date,
      day: d,
      dateStr,
      isOtherMonth: false,
      isDisabled,
      isToday,
      isCheckIn,
      isCheckOut,
      isInRange,
      isRangeStart,
      isRangeEnd,
      isHoverRange,
      isSelected: isCheckIn || isCheckOut
    })
  }

  // Next month padding (fill to 42 = 6 rows)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      day: i,
      isOtherMonth: true,
      isDisabled: true
    })
  }

  return days
})

// Month title
const monthTitle = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  return `${MONTHS.value[month]} ${year}`
})

// Can navigate to previous month?
const canGoPrev = computed(() => {
  const prevMonth = new Date(currentMonth.value)
  prevMonth.setMonth(prevMonth.getMonth() - 1)
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return prevMonth >= thisMonth
})

// Can navigate to next month?
const canGoNext = computed(() => {
  if (!props.maxDate) return true
  const nextMonthStart = new Date(currentMonth.value)
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1)
  const maxMonth = new Date(props.maxDate)
  return nextMonthStart <= new Date(maxMonth.getFullYear(), maxMonth.getMonth() + 1, 0)
})

// Format date as YYYY-MM-DD
function formatISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Check if date is in selected range
function isDateInRange(date) {
  if (!props.checkIn || !props.checkOut) return false
  const start = new Date(props.checkIn)
  const end = new Date(props.checkOut)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return date > start && date < end
}

// Check if date is in hover range (when selecting checkout)
function isDateInHoverRange(date) {
  if (selecting.value !== 'checkOut' || !props.checkIn || !hoveredDate.value) return false
  const start = new Date(props.checkIn)
  const hovered = hoveredDate.value
  start.setHours(0, 0, 0, 0)
  return date > start && date <= hovered
}

// Navigate months
function prevMonth() {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() - 1)
  currentMonth.value = d
}

function nextMonth() {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() + 1)
  currentMonth.value = d
}

// Select a day
function selectDay(dayObj) {
  if (dayObj.isDisabled || dayObj.isOtherMonth) return

  const dateStr = dayObj.dateStr

  if (selecting.value === 'checkIn') {
    emit('update:checkIn', dateStr)
    // If current checkOut is before or equal to new checkIn, clear it
    if (props.checkOut && props.checkOut <= dateStr) {
      emit('update:checkOut', '')
    }
    selecting.value = 'checkOut'
  } else {
    // checkOut selection
    if (dateStr <= props.checkIn) {
      // If selected date is before checkIn, restart selection
      emit('update:checkIn', dateStr)
      emit('update:checkOut', '')
      selecting.value = 'checkOut'
    } else {
      emit('update:checkOut', dateStr)
      selecting.value = 'checkIn'
      // Close after complete selection
      setTimeout(() => {
        isOpen.value = false
      }, 300)
    }
  }
}

// Hover handler
function onDayHover(dayObj) {
  if (dayObj.isDisabled || dayObj.isOtherMonth) return
  hoveredDate.value = dayObj.date
}

function onDayLeave() {
  hoveredDate.value = null
}

// Toggle calendar
function toggleCalendar() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    if (props.checkIn) {
      currentMonth.value = new Date(props.checkIn)
    }
    // If both dates are selected, keep selecting as checkIn for next interaction
    if (props.checkIn && props.checkOut) {
      selecting.value = 'checkIn'
    }
  }
}

// Format display date
function formatDisplay(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const locale = getLocale()
  const localeStr = locale === 'tr' ? 'tr-TR' : 'en-US'
  return d.toLocaleDateString(localeStr, { day: 'numeric', month: 'short' })
}

function formatDisplayLong(dateStr) {
  if (!dateStr) return t('datePicker.status.selectDate')
  const d = new Date(dateStr)
  const locale = getLocale()
  const localeStr = locale === 'tr' ? 'tr-TR' : 'en-US'
  return d.toLocaleDateString(localeStr, { day: 'numeric', month: 'long', year: 'numeric' })
}

// Quick select presets
function selectPreset(nightCount) {
  const start = props.minDate ? new Date(props.minDate) : new Date()
  if (!props.minDate) start.setDate(start.getDate() + 1)
  const end = new Date(start)
  end.setDate(end.getDate() + nightCount)
  // Don't allow preset beyond maxDate
  if (props.maxDate && end > new Date(props.maxDate)) return
  emit('update:checkIn', formatISO(start))
  emit('update:checkOut', formatISO(end))
  selecting.value = 'checkIn'
  setTimeout(() => {
    isOpen.value = false
  }, 300)
}

// Watch for external changes
watch(
  () => props.checkIn,
  val => {
    if (val) {
      currentMonth.value = new Date(val)
    }
  }
)
</script>

<template>
  <div class="drp">
    <!-- Trigger -->
    <div class="drp-trigger" @click="toggleCalendar" :class="{ active: isOpen }">
      <div class="drp-dates">
        <div class="drp-date-col" :class="{ selecting: isOpen && selecting === 'checkIn' }">
          <span class="drp-date-label">{{ t('common.checkIn') }}</span>
          <span class="drp-date-value">{{ formatDisplay(checkIn) }}</span>
        </div>
        <div class="drp-arrow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
        <div class="drp-date-col" :class="{ selecting: isOpen && selecting === 'checkOut' }">
          <span class="drp-date-label">{{ t('common.checkOut') }}</span>
          <span class="drp-date-value">{{ formatDisplay(checkOut) }}</span>
        </div>
      </div>
      <div v-if="nights > 0" class="drp-nights">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        {{ nights }} {{ t('common.night') }}
      </div>
    </div>

    <!-- Calendar Panel -->
    <div v-if="isOpen" class="drp-panel">
      <!-- Quick Presets -->
      <div class="drp-presets">
        <button type="button" class="drp-preset" @click="selectPreset(1)">
          {{ t('datePicker.presets.oneNight') }}
        </button>
        <button type="button" class="drp-preset" @click="selectPreset(2)">
          {{ t('datePicker.presets.twoNights') }}
        </button>
        <button type="button" class="drp-preset" @click="selectPreset(3)">
          {{ t('datePicker.presets.threeNights') }}
        </button>
        <button type="button" class="drp-preset" @click="selectPreset(5)">
          {{ t('datePicker.presets.fiveNights') }}
        </button>
        <button type="button" class="drp-preset" @click="selectPreset(7)">
          {{ t('datePicker.presets.sevenNights') }}
        </button>
      </div>

      <!-- Selection Status -->
      <div class="drp-status">
        <span v-if="checkIn && checkOut && selecting === 'checkIn'">
          {{ formatDisplayLong(checkIn) }} — {{ formatDisplayLong(checkOut) }}
          <small class="drp-status-hint">{{ t('datePicker.status.canSelectNew') }}</small>
        </span>
        <span v-else-if="selecting === 'checkIn'">{{ t('datePicker.status.selectCheckIn') }}</span>
        <span v-else-if="!checkOut">{{ t('datePicker.status.selectCheckOut') }}</span>
        <span v-else> {{ formatDisplayLong(checkIn) }} — {{ formatDisplayLong(checkOut) }} </span>
      </div>

      <!-- Month Navigation -->
      <div class="drp-month-nav">
        <button type="button" class="drp-nav-btn" @click="prevMonth" :disabled="!canGoPrev">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span class="drp-month-title">{{ monthTitle }}</span>
        <button type="button" class="drp-nav-btn" @click="nextMonth" :disabled="!canGoNext">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <!-- Day Names -->
      <div class="drp-weekdays">
        <span v-for="day in DAYS" :key="day" class="drp-weekday">{{ day }}</span>
      </div>

      <!-- Calendar Grid -->
      <div class="drp-grid">
        <button
          v-for="(dayObj, idx) in calendarDays"
          :key="idx"
          type="button"
          :class="[
            'drp-day',
            {
              'other-month': dayObj.isOtherMonth,
              disabled: dayObj.isDisabled,
              today: dayObj.isToday,
              selected: dayObj.isSelected,
              'check-in': dayObj.isCheckIn,
              'check-out': dayObj.isCheckOut,
              'in-range': dayObj.isInRange,
              'hover-range': dayObj.isHoverRange && !dayObj.isInRange
            }
          ]"
          @click="selectDay(dayObj)"
          @mouseenter="onDayHover(dayObj)"
          @mouseleave="onDayLeave"
          :disabled="dayObj.isDisabled || dayObj.isOtherMonth"
        >
          <span class="drp-day-num">{{ dayObj.day }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
