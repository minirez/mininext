<template>
  <div class="date-picker" ref="pickerContainer">
    <!-- Input Field -->
    <div class="relative">
      <span class="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm z-10">event</span>
      <input
        ref="inputElement"
        type="text"
        :value="displayValue"
        @click="toggleCalendar"
        class="form-input pl-10 pr-10 text-sm cursor-pointer"
        :placeholder="placeholder || $t('datePicker.placeholder')"
        readonly
      />
      <button
        v-if="selectedDate"
        @click.stop="clearDate"
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
          <!-- Calendar Header -->
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
            <button
              @click="nextMonthAction"
              class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <span class="material-icons text-gray-600 dark:text-slate-400">chevron_right</span>
            </button>
          </div>

          <!-- Calendar Grid -->
          <div class="calendar-grid">
            <div v-for="day in weekDays" :key="day" class="calendar-header">
              {{ day }}
            </div>
            <div
              v-for="(date, index) in getMonthDates(currentMonth)"
              :key="index"
              :class="getDateClass(date)"
              @click="selectDate(date)"
            >
              <span v-if="date">{{ date.getDate() }}</span>
            </div>
          </div>

          <!-- Today Button -->
          <div class="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600 flex justify-center">
            <button
              @click="selectToday"
              class="text-xs px-4 py-1.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 transition-colors"
            >
              {{ $t('datePicker.today') }}
            </button>
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
    type: String,
    default: null
  },
  placeholder: {
    type: String,
    default: null
  },
  minDate: {
    type: [Date, String],
    default: null
  },
  maxDate: {
    type: [Date, String],
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
const selectedDate = ref(props.modelValue ? new Date(props.modelValue) : null)
const popupPosition = ref({ top: 0, left: 0 })

// Calculate popup position based on input element
const popupStyle = computed(() => {
  return {
    top: `${popupPosition.value.top}px`,
    left: `${popupPosition.value.left}px`,
    minWidth: '280px'
  }
})

const updatePopupPosition = () => {
  if (inputElement.value) {
    const rect = inputElement.value.getBoundingClientRect()
    const popupWidth = 280
    const popupHeight = 340

    let left = rect.left
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 20
    }

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

const displayValue = computed(() => {
  if (selectedDate.value) {
    return formatDate(selectedDate.value)
  }
  return ''
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

  // Check min date
  const minDateValue = props.minDate
    ? new Date(props.minDate)
    : (props.allowPast ? null : today)

  if (minDateValue) {
    minDateValue.setHours(0, 0, 0, 0)
    if (dateClone < minDateValue) {
      classes.push('calendar-day-disabled')
      return classes.join(' ')
    }
  }

  // Check max date
  if (props.maxDate) {
    const maxDateValue = new Date(props.maxDate)
    maxDateValue.setHours(0, 0, 0, 0)
    if (dateClone > maxDateValue) {
      classes.push('calendar-day-disabled')
      return classes.join(' ')
    }
  }

  if (dateClone.getTime() === today.getTime()) {
    classes.push('calendar-day-today')
  }

  const dayOfWeek = date.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    classes.push('calendar-day-weekend')
  }

  if (selectedDate.value) {
    const selected = new Date(selectedDate.value)
    selected.setHours(0, 0, 0, 0)
    if (dateClone.getTime() === selected.getTime()) {
      classes.push('calendar-day-selected')
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

  // Check min date
  const minDateValue = props.minDate
    ? new Date(props.minDate)
    : (props.allowPast ? null : today)

  if (minDateValue) {
    minDateValue.setHours(0, 0, 0, 0)
    if (dateClone < minDateValue) return
  }

  // Check max date
  if (props.maxDate) {
    const maxDateValue = new Date(props.maxDate)
    maxDateValue.setHours(0, 0, 0, 0)
    if (dateClone > maxDateValue) return
  }

  selectedDate.value = dateClone
  emitValue()

  setTimeout(() => {
    isOpen.value = false
  }, 150)
}

function selectToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  selectedDate.value = today
  emitValue()

  setTimeout(() => {
    isOpen.value = false
  }, 150)
}

function emitValue() {
  if (selectedDate.value) {
    const year = selectedDate.value.getFullYear()
    const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.value.getDate()).padStart(2, '0')
    emit('update:modelValue', `${year}-${month}-${day}`)
  }
}

function clearDate() {
  selectedDate.value = null
  emit('update:modelValue', null)
}

function toggleCalendar() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    // Priority: selected date > minDate > today
    if (selectedDate.value) {
      currentMonth.value = new Date(selectedDate.value)
    } else if (props.minDate) {
      currentMonth.value = new Date(props.minDate)
    } else {
      currentMonth.value = new Date()
    }
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
  selectedDate.value = newVal ? new Date(newVal) : null
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.date-picker {
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
