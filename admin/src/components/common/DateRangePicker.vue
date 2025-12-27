<template>
  <div class="date-range-picker" ref="pickerContainer">
    <!-- Input Field -->
    <div class="relative">
      <span class="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm z-10">event</span>
      <input
        ref="inputElement"
        type="text"
        :value="displayValue"
        @click="toggleCalendar"
        class="form-input pl-10 pr-10 text-sm cursor-pointer"
        :placeholder="placeholder || $t('dateRangePicker.placeholder')"
        readonly
      />
      <button
        v-if="startDate && endDate"
        @click.stop="clearDates"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
      >
        <span class="material-icons text-sm">close</span>
      </button>
    </div>

    <!-- Calendar Popup -->
    <Teleport to="body">
      <transition name="calendar-fade">
        <div
          v-if="isOpen"
          ref="calendarPopup"
          class="fixed z-[9999] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-600 p-4"
          :style="popupStyle"
        >
        <div class="flex space-x-4">
          <!-- Left Calendar -->
          <div class="flex-1">
            <div class="flex items-center justify-between mb-3">
              <button
                @click="previousMonth"
                class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
              >
                <span class="material-icons text-gray-600 dark:text-slate-400">chevron_left</span>
              </button>
              <div class="font-semibold text-gray-800 dark:text-white">
                {{ formatMonthYear(currentMonth) }}
              </div>
              <div class="w-8"></div>
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
              >
                <span v-if="date">{{ date.getDate() }}</span>
              </div>
            </div>
          </div>

          <!-- Right Calendar -->
          <div class="flex-1">
            <div class="flex items-center justify-between mb-3">
              <div class="w-8"></div>
              <div class="font-semibold text-gray-800 dark:text-white">
                {{ formatMonthYear(nextMonth) }}
              </div>
              <button
                @click="nextMonthAction"
                class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
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
              >
                <span v-if="date">{{ date.getDate() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Select Buttons -->
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
          <div class="flex items-center space-x-2">
            <button
              v-for="option in quickOptions"
              :key="option.days"
              @click="selectQuickRange(option.days)"
              class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              :class="option.highlight
                ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300'"
            >
              {{ option.label }}
            </button>
          </div>
          <div v-if="startDate && endDate" class="text-sm text-gray-600 dark:text-slate-400">
            {{ $t('dateRangePicker.daysSelected', { count: dayCount }) }}
          </div>
        </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ start: null, end: null })
  },
  placeholder: {
    type: String,
    default: null
  },
  minDate: {
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

const pickerContainer = ref(null)
const inputElement = ref(null)
const calendarPopup = ref(null)
const isOpen = ref(false)
const currentMonth = ref(new Date())
const startDate = ref(props.modelValue?.start ? new Date(props.modelValue.start) : null)
const endDate = ref(props.modelValue?.end ? new Date(props.modelValue.end) : null)
const hoverDate = ref(null)
const popupPosition = ref({ top: 0, left: 0 })

// Calculate popup position based on input element
const popupStyle = computed(() => {
  return {
    top: `${popupPosition.value.top}px`,
    left: `${popupPosition.value.left}px`,
    minWidth: '600px'
  }
})

const updatePopupPosition = () => {
  if (inputElement.value) {
    const rect = inputElement.value.getBoundingClientRect()
    const popupWidth = 600
    const popupHeight = 400 // approximate

    // Check if popup would overflow right edge
    let left = rect.left
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 20
    }

    // Check if popup would overflow bottom edge
    let top = rect.bottom + 8
    if (top + popupHeight > window.innerHeight) {
      top = rect.top - popupHeight - 8
    }

    popupPosition.value = { top, left }
  }
}

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
  { days: 7, label: t('dateRangePicker.days7'), highlight: false },
  { days: 14, label: t('dateRangePicker.days14'), highlight: true },
  { days: 30, label: t('dateRangePicker.days30'), highlight: false },
  { days: 60, label: t('dateRangePicker.days60'), highlight: false },
  { days: 90, label: t('dateRangePicker.days90'), highlight: false }
])

const nextMonth = computed(() => {
  const date = new Date(currentMonth.value)
  date.setMonth(date.getMonth() + 1)
  return date
})

const displayValue = computed(() => {
  if (startDate.value && endDate.value) {
    return `${formatDate(startDate.value)} - ${formatDate(endDate.value)}`
  }
  return ''
})

const dayCount = computed(() => {
  if (startDate.value && endDate.value) {
    const diff = Math.ceil((endDate.value - startDate.value) / (1000 * 60 * 60 * 24)) + 1
    return diff
  }
  return 0
})

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return locale.value === 'tr' ? `${day}.${month}.${year}` : `${month}/${day}/${year}`
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

  const minDateValue = props.minDate || (props.allowPast ? null : today)

  if (minDateValue && dateClone < minDateValue) {
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

    if (dateClone.getTime() === start.getTime() || dateClone.getTime() === end.getTime()) {
      classes.push('calendar-day-selected')
    } else if (dateClone > start && dateClone < end) {
      classes.push('calendar-day-in-range')
    }
  }

  if (startDate.value && !endDate.value && hoverDate.value) {
    const start = new Date(startDate.value)
    const hover = new Date(hoverDate.value)
    start.setHours(0, 0, 0, 0)
    hover.setHours(0, 0, 0, 0)

    if (hover > start && dateClone > start && dateClone <= hover) {
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

  const minDateValue = props.minDate || (props.allowPast ? null : today)
  if (minDateValue && dateClone < minDateValue) return

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

    setTimeout(() => {
      isOpen.value = false
    }, 300)
  }
}

function selectQuickRange(days) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setDate(end.getDate() + days - 1)

  startDate.value = today
  endDate.value = end

  emitValue()

  setTimeout(() => {
    isOpen.value = false
  }, 300)
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

function toggleCalendar() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    currentMonth.value = startDate.value ? new Date(startDate.value) : new Date()
    updatePopupPosition()
  }
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

function handleClickOutside(event) {
  const isInsideContainer = pickerContainer.value?.contains(event.target)
  const isInsidePopup = calendarPopup.value?.contains(event.target)
  if (!isInsideContainer && !isInsidePopup) {
    isOpen.value = false
  }
}

// Sync with props
watch(() => props.modelValue, (newVal) => {
  startDate.value = newVal?.start ? new Date(newVal.start) : null
  endDate.value = newVal?.end ? new Date(newVal.end) : null
}, { deep: true })

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.date-range-picker {
  position: relative;
}

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
  color: #7c3aed;
  font-weight: 700;
}

.dark .calendar-day-today {
  color: #a78bfa;
}

.calendar-day-weekend {
  color: #ef4444;
}

.dark .calendar-day-weekend {
  color: #f87171;
}

.calendar-day-selected {
  background-color: #7c3aed !important;
  color: white !important;
  font-weight: 700;
}

.calendar-day-in-range {
  background-color: #ede9fe;
  color: #5b21b6;
}

.dark .calendar-day-in-range {
  background-color: rgba(124, 58, 237, 0.2);
  color: #c4b5fd;
}

.calendar-day-hover-range {
  background-color: #f3e8ff;
  color: #6b21a8;
}

.dark .calendar-day-hover-range {
  background-color: rgba(124, 58, 237, 0.1);
  color: #c4b5fd;
}

.calendar-fade-enter-active,
.calendar-fade-leave-active {
  transition: all 0.2s ease;
}

.calendar-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.calendar-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
