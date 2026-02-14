<template>
  <div ref="pickerContainer" class="date-range-dual">
    <!-- Input Field -->
    <div class="relative">
      <span
        class="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm z-10"
        >event</span
      >
      <input
        ref="inputElement"
        type="text"
        :value="displayValue"
        class="form-input pl-10 pr-10 text-sm cursor-pointer"
        :placeholder="placeholder || $t('dateRangePicker.placeholder')"
        readonly
        @click="toggleCalendar"
      />
      <button
        v-if="startDate && endDate"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
        @click.stop="clearDates"
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
          <!-- Two Independent Calendars -->
          <div class="flex gap-6">
            <!-- Left Calendar: Start Date -->
            <div class="flex-1" style="min-width: 260px">
              <div class="text-center mb-2">
                <span
                  class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider"
                >
                  {{ $t('common.startDate') }}
                </span>
              </div>
              <div class="flex items-center justify-between mb-3">
                <button
                  type="button"
                  class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                  @click="prevStartMonth"
                >
                  <span class="material-icons text-gray-600 dark:text-slate-400">chevron_left</span>
                </button>
                <div class="font-semibold text-gray-800 dark:text-white">
                  {{ formatMonthYear(startMonth) }}
                </div>
                <button
                  type="button"
                  class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                  @click="nextStartMonth"
                >
                  <span class="material-icons text-gray-600 dark:text-slate-400"
                    >chevron_right</span
                  >
                </button>
              </div>
              <div class="calendar-grid">
                <div v-for="day in weekDays" :key="`sh-${day}`" class="calendar-header">
                  {{ day }}
                </div>
                <div
                  v-for="(date, index) in getMonthDates(startMonth)"
                  :key="`s-${index}`"
                  :class="getStartDateClass(date)"
                  @click="selectStartDate(date)"
                >
                  <span v-if="date">{{ date.getDate() }}</span>
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="w-px bg-gray-200 dark:bg-slate-600 self-stretch"></div>

            <!-- Right Calendar: End Date -->
            <div class="flex-1" style="min-width: 260px">
              <div class="text-center mb-2">
                <span
                  class="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider"
                >
                  {{ $t('common.endDate') }}
                </span>
              </div>
              <div class="flex items-center justify-between mb-3">
                <button
                  type="button"
                  class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                  @click="prevEndMonth"
                >
                  <span class="material-icons text-gray-600 dark:text-slate-400">chevron_left</span>
                </button>
                <div class="font-semibold text-gray-800 dark:text-white">
                  {{ formatMonthYear(endMonth) }}
                </div>
                <button
                  type="button"
                  class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                  @click="nextEndMonth"
                >
                  <span class="material-icons text-gray-600 dark:text-slate-400"
                    >chevron_right</span
                  >
                </button>
              </div>
              <div class="calendar-grid">
                <div v-for="day in weekDays" :key="`eh-${day}`" class="calendar-header">
                  {{ day }}
                </div>
                <div
                  v-for="(date, index) in getMonthDates(endMonth)"
                  :key="`e-${index}`"
                  :class="getEndDateClass(date)"
                  @click="selectEndDate(date)"
                >
                  <span v-if="date">{{ date.getDate() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-slate-600"
          >
            <div class="flex items-center gap-3 text-sm">
              <!-- Start badge -->
              <div
                class="px-2.5 py-1 rounded-lg font-medium"
                :class="
                  startDate
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                "
              >
                {{ startDate ? formatDate(startDate) : '--' }}
              </div>
              <span class="material-icons text-gray-400 text-xs">arrow_forward</span>
              <!-- End badge -->
              <div
                class="px-2.5 py-1 rounded-lg font-medium"
                :class="
                  endDate
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                "
              >
                {{ endDate ? formatDate(endDate) : '--' }}
              </div>
            </div>
            <div v-if="dayCount > 0" class="text-sm text-gray-600 dark:text-slate-400">
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
const popupPosition = ref({ top: 0, left: 0 })

const startDate = ref(null)
const endDate = ref(null)
const startMonth = ref(new Date())
const endMonth = ref(new Date())

// --- Helpers ---

function parseDate(val) {
  if (!val) return null
  if (val instanceof Date) return new Date(val.getFullYear(), val.getMonth(), val.getDate())
  if (typeof val === 'string') {
    const [y, m, d] = val.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return null
}

function normalize(date) {
  if (!date) return null
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a, b) {
  if (!a || !b) return false
  return normalize(a).getTime() === normalize(b).getTime()
}

function isInRange(date) {
  if (!startDate.value || !endDate.value || !date) return false
  const d = normalize(date)
  return d > normalize(startDate.value) && d < normalize(endDate.value)
}

function isDisabled(date) {
  if (!date) return true
  if (props.allowPast) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return normalize(date) < today
}

// --- Init ---

function initFromProps() {
  const s = parseDate(props.modelValue?.start)
  const e = parseDate(props.modelValue?.end)
  startDate.value = s
  endDate.value = e

  const now = new Date()
  if (s) {
    startMonth.value = new Date(s.getFullYear(), s.getMonth(), 1)
  } else {
    startMonth.value = new Date(now.getFullYear(), now.getMonth(), 1)
  }
  if (e) {
    endMonth.value = new Date(e.getFullYear(), e.getMonth(), 1)
  } else if (s) {
    endMonth.value = new Date(s.getFullYear(), s.getMonth() + 1, 1)
  } else {
    endMonth.value = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }
}

initFromProps()

// --- Computed ---

const weekDays = computed(() => {
  return locale.value === 'tr'
    ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
})

const monthNames = computed(() => {
  return locale.value === 'tr'
    ? [
        'Ocak',
        'Şubat',
        'Mart',
        'Nisan',
        'Mayıs',
        'Haziran',
        'Temmuz',
        'Ağustos',
        'Eylül',
        'Ekim',
        'Kasım',
        'Aralık'
      ]
    : [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ]
})

const displayValue = computed(() => {
  if (startDate.value && endDate.value) {
    return `${formatDate(startDate.value)} - ${formatDate(endDate.value)}`
  }
  return ''
})

const dayCount = computed(() => {
  if (startDate.value && endDate.value) {
    return Math.ceil((endDate.value - startDate.value) / (1000 * 60 * 60 * 24)) + 1
  }
  return 0
})

const popupStyle = computed(() => ({
  top: `${popupPosition.value.top}px`,
  left: `${popupPosition.value.left}px`
}))

// --- Formatting ---

function formatDate(date) {
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return locale.value === 'tr' ? `${day}.${month}.${year}` : `${month}/${day}/${year}`
}

function formatMonthYear(date) {
  return `${monthNames.value[date.getMonth()]} ${date.getFullYear()}`
}

// --- Calendar grid ---

function getMonthDates(month) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1)
  const lastDay = new Date(year, monthIndex + 1, 0)

  let startDay = firstDay.getDay()
  startDay = startDay === 0 ? 6 : startDay - 1

  const dates = []
  for (let i = 0; i < startDay; i++) dates.push(null)
  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, monthIndex, day))
  }
  return dates
}

// --- Date classes ---

function getStartDateClass(date) {
  if (!date) return 'calendar-day-empty'
  const classes = ['calendar-day']

  if (isDisabled(date)) {
    classes.push('calendar-day-disabled')
    return classes.join(' ')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (isSameDay(date, today)) classes.push('calendar-day-today')

  const dow = date.getDay()
  if (dow === 0 || dow === 6) classes.push('calendar-day-weekend')

  if (isSameDay(date, startDate.value)) {
    classes.push('calendar-day-selected-start')
  } else if (isSameDay(date, endDate.value)) {
    classes.push('calendar-day-end-marker')
  } else if (isInRange(date)) {
    classes.push('calendar-day-in-range')
  }

  if (endDate.value && normalize(date) > normalize(endDate.value)) {
    classes.push('calendar-day-out-of-range')
  }

  return classes.join(' ')
}

function getEndDateClass(date) {
  if (!date) return 'calendar-day-empty'
  const classes = ['calendar-day']

  if (isDisabled(date)) {
    classes.push('calendar-day-disabled')
    return classes.join(' ')
  }

  if (startDate.value && normalize(date) < normalize(startDate.value)) {
    classes.push('calendar-day-disabled')
    return classes.join(' ')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (isSameDay(date, today)) classes.push('calendar-day-today')

  const dow = date.getDay()
  if (dow === 0 || dow === 6) classes.push('calendar-day-weekend')

  if (isSameDay(date, endDate.value)) {
    classes.push('calendar-day-selected-end')
  } else if (isSameDay(date, startDate.value)) {
    classes.push('calendar-day-start-marker')
  } else if (isInRange(date)) {
    classes.push('calendar-day-in-range')
  }

  return classes.join(' ')
}

// --- Selection ---

function selectStartDate(date) {
  if (!date || isDisabled(date)) return
  startDate.value = normalize(date)

  if (endDate.value && normalize(date) > normalize(endDate.value)) {
    endDate.value = null
  }

  emitIfComplete()
}

function selectEndDate(date) {
  if (!date || isDisabled(date)) return
  if (startDate.value && normalize(date) < normalize(startDate.value)) return

  endDate.value = normalize(date)
  emitIfComplete()
}

function emitIfComplete() {
  if (startDate.value && endDate.value) {
    const toIso = d => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    emit('update:modelValue', {
      start: toIso(startDate.value),
      end: toIso(endDate.value)
    })

    setTimeout(() => {
      isOpen.value = false
    }, 300)
  }
}

function clearDates() {
  startDate.value = null
  endDate.value = null
  emit('update:modelValue', { start: null, end: null })
}

// --- Popup positioning ---

function updatePopupPosition() {
  if (!inputElement.value) return
  const rect = inputElement.value.getBoundingClientRect()
  const popupWidth = 600
  const popupHeight = 420

  let left = rect.left
  if (left + popupWidth > window.innerWidth) {
    left = window.innerWidth - popupWidth - 20
  }
  if (left < 10) left = 10

  let top = rect.bottom + 8
  if (top + popupHeight > window.innerHeight) {
    top = rect.top - popupHeight - 8
  }

  popupPosition.value = { top, left }
}

function toggleCalendar() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    // Reset months to current selection or today
    const now = new Date()
    if (startDate.value) {
      startMonth.value = new Date(startDate.value.getFullYear(), startDate.value.getMonth(), 1)
    } else {
      startMonth.value = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    if (endDate.value) {
      endMonth.value = new Date(endDate.value.getFullYear(), endDate.value.getMonth(), 1)
    } else if (startDate.value) {
      endMonth.value = new Date(startDate.value.getFullYear(), startDate.value.getMonth() + 1, 1)
    } else {
      endMonth.value = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }
    updatePopupPosition()
  }
}

// --- Month navigation ---

function prevStartMonth() {
  const d = new Date(startMonth.value)
  d.setMonth(d.getMonth() - 1)
  startMonth.value = d
}
function nextStartMonth() {
  const d = new Date(startMonth.value)
  d.setMonth(d.getMonth() + 1)
  startMonth.value = d
}
function prevEndMonth() {
  const d = new Date(endMonth.value)
  d.setMonth(d.getMonth() - 1)
  endMonth.value = d
}
function nextEndMonth() {
  const d = new Date(endMonth.value)
  d.setMonth(d.getMonth() + 1)
  endMonth.value = d
}

// --- Click outside ---

function handleClickOutside(event) {
  const isInsideContainer = pickerContainer.value?.contains(event.target)
  const isInsidePopup = calendarPopup.value?.contains(event.target)
  if (!isInsideContainer && !isInsidePopup) {
    isOpen.value = false
  }
}

// --- Watch ---

watch(
  () => props.modelValue,
  newVal => {
    const s = parseDate(newVal?.start)
    const e = parseDate(newVal?.end)

    if (s && (!startDate.value || s.getTime() !== startDate.value.getTime())) {
      startDate.value = s
    }
    if (e && (!endDate.value || e.getTime() !== endDate.value.getTime())) {
      endDate.value = e
    }
    if (!newVal?.start && startDate.value) startDate.value = null
    if (!newVal?.end && endDate.value) endDate.value = null
  },
  { deep: true }
)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.date-range-dual {
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

.calendar-day-selected-start {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
  color: white !important;
  font-weight: 700;
}

.calendar-day-selected-end {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%) !important;
  color: white !important;
  font-weight: 700;
}

.calendar-day-start-marker {
  background-color: #e0e7ff;
  color: #4338ca;
  font-weight: 600;
}

.dark .calendar-day-start-marker {
  background-color: rgba(99, 102, 241, 0.25);
  color: #a5b4fc;
}

.calendar-day-end-marker {
  background-color: #ede9fe;
  color: #6d28d9;
  font-weight: 600;
}

.dark .calendar-day-end-marker {
  background-color: rgba(124, 58, 237, 0.25);
  color: #c4b5fd;
}

.calendar-day-in-range {
  background-color: #ede9fe;
  color: #5b21b6;
}

.dark .calendar-day-in-range {
  background-color: rgba(124, 58, 237, 0.2);
  color: #c4b5fd;
}

.calendar-day-out-of-range {
  opacity: 0.4;
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
