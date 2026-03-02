<template>
  <div class="relative" ref="pickerRef">
    <!-- Trigger -->
    <button type="button" @click="toggleCalendar" class="w-full text-left focus:outline-none">
      <div class="flex items-center gap-2">
        <div class="flex-1 min-w-0">
          <span
            class="block text-[11px] font-semibold uppercase tracking-wide"
            style="color: #6b7280"
            >{{ $t('search.checkIn') }}</span
          >
          <span class="block text-sm font-medium mt-1" style="color: #1f2937">{{
            formatDisplay(modelCheckIn)
          }}</span>
        </div>
        <svg
          class="w-4 h-4 shrink-0"
          style="color: #9ca3af"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round" />
          <polyline
            points="12 5 19 12 12 19"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <div class="flex-1 min-w-0">
          <span
            class="block text-[11px] font-semibold uppercase tracking-wide"
            style="color: #6b7280"
            >{{ $t('search.checkOut') }}</span
          >
          <span class="block text-sm font-medium mt-1" style="color: #1f2937">{{
            formatDisplay(modelCheckOut)
          }}</span>
        </div>
      </div>
      <div
        v-if="nights > 0"
        class="mt-1 flex items-center gap-1 text-xs font-medium"
        style="color: var(--color-site-primary, #3b82f6)"
      >
        <svg
          class="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        {{ nights }} {{ $t('search.nights') }}
      </div>
    </button>

    <!-- Calendar Panel -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute left-0 top-full mt-2 z-50 dropdown-panel p-4 w-[320px] sm:w-[340px]"
      >
        <!-- Quick Presets -->
        <div class="flex gap-1.5 mb-3 flex-wrap">
          <button
            v-for="n in [1, 2, 3, 5, 7]"
            :key="n"
            type="button"
            @click="selectPreset(n)"
            class="px-2.5 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:border-site-primary hover:text-site-primary transition-colors"
          >
            {{ n }} {{ $t('search.nights') }}
          </button>
        </div>

        <!-- Selection Status -->
        <div class="text-xs text-center text-gray-500 mb-3 h-4">
          <span v-if="selecting === 'checkIn'">{{ $t('search.selectCheckIn') }}</span>
          <span v-else>{{ $t('search.selectCheckOut') }}</span>
        </div>

        <!-- Month Navigation -->
        <div class="flex items-center justify-between mb-3">
          <button
            type="button"
            @click="prevMonth"
            :disabled="!canGoPrev"
            class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-30"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span class="text-sm font-semibold text-gray-800">{{ monthTitle }}</span>
          <button
            type="button"
            @click="nextMonth"
            class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <!-- Day Names -->
        <div class="grid grid-cols-7 mb-1">
          <span
            v-for="day in dayNames"
            :key="day"
            class="text-center text-xs font-medium text-gray-400 py-1"
          >
            {{ day }}
          </span>
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7">
          <button
            v-for="(dayObj, idx) in calendarDays"
            :key="idx"
            type="button"
            @click="selectDay(dayObj)"
            @mouseenter="onDayHover(dayObj)"
            @mouseleave="hoveredDate = null"
            :disabled="dayObj.isDisabled || dayObj.isOtherMonth"
            class="relative h-9 text-sm transition-colors"
            :class="[
              dayObj.isOtherMonth ? 'text-gray-200 cursor-default' : '',
              dayObj.isDisabled && !dayObj.isOtherMonth ? 'text-gray-300 cursor-not-allowed' : '',
              !dayObj.isDisabled && !dayObj.isOtherMonth ? 'hover:bg-gray-100 cursor-pointer' : '',
              dayObj.isToday && !dayObj.isSelected ? 'font-bold text-site-primary' : '',
              dayObj.isSelected ? 'bg-site-primary text-white rounded-full font-semibold z-10' : '',
              dayObj.isInRange ? 'bg-site-primary/10' : '',
              dayObj.isHoverRange && !dayObj.isInRange ? 'bg-site-primary/5' : '',
              dayObj.isCheckIn ? 'rounded-l-full' : '',
              dayObj.isCheckOut ? 'rounded-r-full' : ''
            ]"
          >
            {{ dayObj.day }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { locale } = useI18n()

const props = defineProps<{
  modelCheckIn?: string
  modelCheckOut?: string
}>()

const emit = defineEmits<{
  'update:modelCheckIn': [value: string]
  'update:modelCheckOut': [value: string]
}>()

const isOpen = ref(false)
const selecting = ref<'checkIn' | 'checkOut'>('checkIn')
const hoveredDate = ref<Date | null>(null)
const pickerRef = ref<HTMLElement>()
const currentMonth = ref(new Date())

const today = new Date()
today.setHours(0, 0, 0, 0)

if (props.modelCheckIn) {
  currentMonth.value = new Date(props.modelCheckIn)
}

const nights = computed(() => {
  if (!props.modelCheckIn || !props.modelCheckOut) return 0
  const start = new Date(props.modelCheckIn)
  const end = new Date(props.modelCheckOut)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
})

const dayNames = computed(() => {
  const loc = locale.value === 'tr' ? 'tr-TR' : 'en-US'
  const days = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date(2024, 0, i) // Mon Jan 1, 2024
    days.push(d.toLocaleDateString(loc, { weekday: 'narrow' }))
  }
  return days
})

const monthTitle = computed(() => {
  const loc = locale.value === 'tr' ? 'tr-TR' : locale.value
  return currentMonth.value.toLocaleDateString(loc, { month: 'long', year: 'numeric' })
})

const canGoPrev = computed(() => {
  const prev = new Date(currentMonth.value)
  prev.setMonth(prev.getMonth() - 1)
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return prev >= thisMonth
})

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startDay = firstDay.getDay() - 1
  if (startDay < 0) startDay = 6

  const days: any[] = []

  // Previous month padding
  const prevMonthLast = new Date(year, month, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthLast - i, isOtherMonth: true, isDisabled: true })
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    date.setHours(0, 0, 0, 0)
    const dateStr = formatISO(date)
    const isDisabled = date < today
    const isToday = date.getTime() === today.getTime()
    const isCheckIn = dateStr === props.modelCheckIn
    const isCheckOut = dateStr === props.modelCheckOut
    const isInRange = isDateInRange(date)
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
      isSelected: isCheckIn || isCheckOut,
      isInRange,
      isHoverRange
    })
  }

  // Fill to 42
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isOtherMonth: true, isDisabled: true })
  }

  return days
})

function formatISO(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isDateInRange(date: Date) {
  if (!props.modelCheckIn || !props.modelCheckOut) return false
  const start = new Date(props.modelCheckIn)
  const end = new Date(props.modelCheckOut)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return date > start && date < end
}

function isDateInHoverRange(date: Date) {
  if (selecting.value !== 'checkOut' || !props.modelCheckIn || !hoveredDate.value) return false
  const start = new Date(props.modelCheckIn)
  start.setHours(0, 0, 0, 0)
  return date > start && date <= hoveredDate.value
}

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

function selectDay(dayObj: any) {
  if (dayObj.isDisabled || dayObj.isOtherMonth) return

  if (selecting.value === 'checkIn') {
    emit('update:modelCheckIn', dayObj.dateStr)
    if (props.modelCheckOut && props.modelCheckOut <= dayObj.dateStr) {
      emit('update:modelCheckOut', '')
    }
    selecting.value = 'checkOut'
  } else {
    if (dayObj.dateStr <= (props.modelCheckIn || '')) {
      emit('update:modelCheckIn', dayObj.dateStr)
      emit('update:modelCheckOut', '')
      selecting.value = 'checkOut'
    } else {
      emit('update:modelCheckOut', dayObj.dateStr)
      selecting.value = 'checkIn'
      setTimeout(() => {
        isOpen.value = false
      }, 300)
    }
  }
}

function onDayHover(dayObj: any) {
  if (dayObj.isDisabled || dayObj.isOtherMonth) return
  hoveredDate.value = dayObj.date
}

function selectPreset(nightCount: number) {
  const start = new Date()
  start.setDate(start.getDate() + 1)
  const end = new Date(start)
  end.setDate(end.getDate() + nightCount)
  emit('update:modelCheckIn', formatISO(start))
  emit('update:modelCheckOut', formatISO(end))
  selecting.value = 'checkIn'
  setTimeout(() => {
    isOpen.value = false
  }, 300)
}

function toggleCalendar() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    if (props.modelCheckIn) currentMonth.value = new Date(props.modelCheckIn)
    if (props.modelCheckIn && props.modelCheckOut) selecting.value = 'checkIn'
  }
}

function formatDisplay(dateStr?: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const loc = locale.value === 'tr' ? 'tr-TR' : 'en-US'
  return d.toLocaleDateString(loc, { day: 'numeric', month: 'short' })
}

// Close on outside click
onMounted(() => {
  const handler = (e: Event) => {
    if (pickerRef.value && !pickerRef.value.contains(e.target as Node)) {
      isOpen.value = false
    }
  }
  document.addEventListener('click', handler)
  onUnmounted(() => document.removeEventListener('click', handler))
})

watch(
  () => props.modelCheckIn,
  val => {
    if (val) currentMonth.value = new Date(val)
  }
)
</script>
