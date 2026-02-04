<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ $t('tour.schedule.title') }}
      </h3>
      <button type="button" class="btn-outline btn-sm" :disabled="!tourId" @click="loadExisting">
        <span class="material-icons text-sm mr-1">sync</span>
        {{ $t('common.refresh') }}
      </button>
    </div>

    <div
      v-if="!tourId"
      class="p-4 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm"
    >
      {{ $t('tour.schedule.saveTourFirst') }}
    </div>

    <!-- Schedule Type Selection - Compact Inline Toggle -->
    <div class="flex items-center gap-3">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ $t('tour.schedule.scheduleType') }}
      </span>
      <div
        class="inline-flex rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-0.5"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
          :class="
            scheduleType === 'recurring'
              ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          "
          @click="scheduleType = 'recurring'"
        >
          <span class="material-icons text-base">repeat</span>
          {{ $t('tour.schedule.recurring') }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
          :class="
            scheduleType === 'onetime'
              ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          "
          @click="switchToOnetime"
        >
          <span class="material-icons text-base">event</span>
          {{ $t('tour.schedule.onetime') }}
        </button>
      </div>
    </div>

    <!-- Recurring Schedule Builder -->
    <div
      v-if="scheduleType === 'recurring'"
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-5"
    >
      <!-- Date Range -->
      <div v-if="form.preset !== 'custom_dates'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('tour.schedule.fromDate') }}</label>
          <DatePicker v-model="form.from" :allow-past="false" />
        </div>
        <div>
          <label class="form-label">{{ $t('tour.schedule.toDate') }}</label>
          <DatePicker v-model="form.to" :min-date="form.from" :allow-past="false" />
        </div>
      </div>

      <!-- Preset Selection -->
      <div>
        <label class="form-label mb-2">{{ $t('tour.schedule.repeatPattern') }}</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in presetButtons"
            :key="opt.value"
            type="button"
            class="px-3 py-2 rounded-lg border text-sm font-medium transition-all"
            :class="
              form.preset === opt.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            "
            @click="form.preset = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Weekdays selection (if weekdays preset) -->
      <div v-if="form.preset === 'weekdays'" class="flex flex-wrap gap-2">
        <label
          v-for="d in weekdayOptions"
          :key="d.value"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all"
          :class="
            form.weekdays.includes(d.value)
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
          "
        >
          <input type="checkbox" class="hidden" :value="d.value" v-model="form.weekdays" />
          {{ d.label }}
        </label>
      </div>

      <!-- Every N days input -->
      <div v-if="form.preset === 'every_n_days'" class="w-32">
        <label class="form-label">{{ $t('tour.schedule.everyNDays') }}</label>
        <input v-model.number="form.everyN" type="number" min="2" class="form-input" />
      </div>

      <!-- Custom dates calendar (for recurring - multi-select) -->
      <div v-if="form.preset === 'custom_dates'" class="pt-2">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Calendar -->
          <div>
            <!-- Calendar header -->
            <div class="flex items-center justify-between mb-4">
              <button
                type="button"
                class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                @click="previousMonth"
              >
                <span class="material-icons text-gray-600 dark:text-gray-400">chevron_left</span>
              </button>
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ formatMonthYear(currentMonth) }}
              </span>
              <button
                type="button"
                class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                @click="nextMonthAction"
              >
                <span class="material-icons text-gray-600 dark:text-gray-400">chevron_right</span>
              </button>
            </div>

            <!-- Calendar grid -->
            <div class="grid grid-cols-7 gap-0.5 mb-3">
              <div
                v-for="day in weekDays"
                :key="day"
                class="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2"
              >
                {{ day }}
              </div>
              <button
                v-for="(date, index) in calendarDates"
                :key="index"
                type="button"
                :disabled="!date || isDateDisabled(date)"
                :class="getDateClassEnhanced(date)"
                @click="toggleDateMulti(date)"
                @mouseenter="handleDateHover(date)"
                @mouseleave="hoveredDate = null"
              >
                <span v-if="date" class="relative z-10">{{ date.getDate() }}</span>
              </button>
            </div>

            <!-- Quick weekday selection -->
            <div class="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-slate-700">
              <span class="text-xs text-gray-500 dark:text-gray-400 self-center mr-1">
                {{ $t('tour.schedule.quickAdd') }}:
              </span>
              <button
                v-for="day in weekDaysFull"
                :key="day.idx"
                type="button"
                class="px-2 py-1 text-xs rounded border transition-colors"
                :class="
                  hasAllOfWeekday(day.idx)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                    : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-gray-300'
                "
                :title="$t('tour.schedule.selectAllWeekday') + ' ' + day.label"
                @click="toggleWeekday(day.idx)"
              >
                {{ day.label }}
              </button>
            </div>
          </div>

          <!-- Selected departures list -->
          <div class="space-y-4">
            <!-- Duration row (instead of showing under calendar) -->
            <div
              class="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-700"
            >
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ $t('tour.schedule.durationDays') }}
              </span>
              <input
                v-model.number="form.durationDays"
                type="number"
                min="1"
                class="form-input w-28"
              />
            </div>

            <div class="flex items-center justify-between">
              <h4 class="font-medium text-gray-900 dark:text-white">
                {{ $t('tour.schedule.selectedDepartures') }}
              </h4>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ form.customDates.length }} {{ $t('tour.schedule.departures') }}
              </span>
            </div>

            <!-- Selected departures list with date ranges -->
            <div v-if="form.customDates.length > 0" class="max-h-64 overflow-y-auto space-y-2 pr-1">
              <div
                v-for="(dates, year) in customDatesGroupedByYear"
                :key="year"
                class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div class="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {{ year }}
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="d in dates"
                    :key="d"
                    class="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                  >
                    <span class="material-icons text-xs opacity-60">flight_takeoff</span>
                    {{ formatDateRange(d, form.durationDays) }}
                    <button
                      type="button"
                      class="opacity-0 group-hover:opacity-100 text-primary-400 hover:text-red-500 transition-opacity"
                      @click="removeCustomDate(d)"
                    >
                      <span class="material-icons text-xs">close</span>
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div v-else class="flex flex-col items-center justify-center py-8 text-center">
              <span class="material-icons text-4xl text-gray-300 dark:text-gray-600 mb-2">
                calendar_month
              </span>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('tour.schedule.noSelectedDates') }}
              </p>
            </div>

            <!-- Actions -->
            <div v-if="form.customDates.length > 0" class="flex items-center justify-between pt-2">
              <button
                type="button"
                class="text-sm text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                @click="form.customDates = []"
              >
                <span class="material-icons text-sm">delete_sweep</span>
                {{ $t('common.clearAll') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- One-time Schedule Builder (Single date selection) -->
    <div
      v-if="scheduleType === 'onetime'"
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
    >
      <!-- Duration hint for multi-day tours -->
      <div
        v-if="form.durationDays > 1"
        class="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
      >
        <div class="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <span class="material-icons text-base">info</span>
          <span>
            {{ $t('tour.schedule.onetimeMultiDayHint', { days: form.durationDays }) }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left: Calendar -->
        <div>
          <!-- Calendar header -->
          <div class="flex items-center justify-between mb-4">
            <button
              type="button"
              class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              @click="previousMonth"
            >
              <span class="material-icons text-gray-600 dark:text-gray-400">chevron_left</span>
            </button>
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ formatMonthYear(currentMonth) }}
            </span>
            <button
              type="button"
              class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              @click="nextMonthAction"
            >
              <span class="material-icons text-gray-600 dark:text-gray-400">chevron_right</span>
            </button>
          </div>

          <!-- Calendar grid -->
          <div class="grid grid-cols-7 gap-0.5 mb-3">
            <div
              v-for="day in weekDays"
              :key="day"
              class="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2"
            >
              {{ day }}
            </div>
            <button
              v-for="(date, index) in calendarDates"
              :key="index"
              type="button"
              :disabled="!date || isDateDisabled(date)"
              :class="getDateClassEnhanced(date)"
              @click="selectSingleDate(date)"
              @mouseenter="handleDateHover(date)"
              @mouseleave="hoveredDate = null"
            >
              <span v-if="date" class="relative z-10">{{ date.getDate() }}</span>
            </button>
          </div>
        </div>

        <!-- Right: Selected departure info -->
        <div class="space-y-4">
          <!-- Duration row -->
          <div
            class="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-700"
          >
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('tour.schedule.durationDays') }}
            </span>
            <input
              v-model.number="form.durationDays"
              type="number"
              min="1"
              class="form-input w-28"
            />
          </div>

          <h4 class="font-medium text-gray-900 dark:text-white">
            {{ $t('tour.schedule.selectedDeparture') }}
          </h4>

          <div
            v-if="form.customDates.length > 0"
            class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
              >
                <span class="material-icons text-primary-600 dark:text-primary-400"
                  >flight_takeoff</span
                >
              </div>
              <div>
                <div class="font-semibold text-gray-900 dark:text-white">
                  {{ formatDateRange(form.customDates[0], form.durationDays) }}
                </div>
              </div>
              <button
                type="button"
                class="ml-auto p-2 text-gray-400 hover:text-red-500 transition-colors"
                @click="form.customDates = []"
              >
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="flex flex-col items-center justify-center py-12 text-center">
            <span class="material-icons text-5xl text-gray-300 dark:text-gray-600 mb-3">
              event
            </span>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ $t('tour.schedule.selectOnetimeDate') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Common Settings (Duration, Time, Pricing) -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-5"
    >
      <h4 class="font-medium text-gray-900 dark:text-white">
        {{ $t('tour.schedule.departureSettings') }}
      </h4>

      <div
        :class="[
          'grid gap-4',
          showDurationInSettings ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'
        ]"
      >
        <div v-if="showDurationInSettings">
          <label class="form-label">{{ $t('tour.schedule.durationDays') }}</label>
          <input v-model.number="form.durationDays" type="number" min="1" class="form-input" />
        </div>
        <div>
          <label class="form-label">{{ $t('tour.schedule.timeStart') }}</label>
          <input v-model="form.time.start" type="time" class="form-input" />
        </div>
        <div>
          <label class="form-label">{{ $t('tour.schedule.timeEnd') }}</label>
          <input v-model="form.time.end" type="time" class="form-input" />
        </div>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700"
      >
        <div>
          <label class="form-label">{{ $t('departure.capacity.total') }}</label>
          <input v-model.number="form.capacityTotal" type="number" min="1" class="form-input" />
        </div>
        <div>
          <label class="form-label">{{ $t('departure.pricing.double') }}</label>
          <input
            v-model.number="form.priceAdultDouble"
            type="number"
            min="0"
            step="0.01"
            class="form-input"
          />
        </div>
        <div>
          <Dropdown
            v-model="form.currency"
            :label="$t('common.currency')"
            :options="currencyOptions"
          />
        </div>
      </div>
    </div>

    <!-- Preview -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
    >
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">{{ $t('tour.schedule.preview') }}</h4>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ generated.length }} {{ $t('tour.schedule.dates') }}
        </span>
      </div>

      <div v-if="generated.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
        {{ $t('tour.schedule.noPreview') }}
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="(dates, year) in generatedGroupedByYear"
          :key="year"
          class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
        >
          <div class="flex items-center gap-2 mb-3">
            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ year }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">({{ dates.length }})</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="d in dates.slice(0, 100)"
              :key="d"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="
                existingDateSet.has(d)
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              "
            >
              {{ formatDateRange(d, form.durationDays) }}
            </span>
            <span
              v-if="dates.length > 100"
              class="text-xs text-gray-500 dark:text-gray-400 self-center"
            >
              +{{ dates.length - 100 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div
        v-if="generated.length > 0"
        class="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700"
      >
        <div class="flex items-center gap-1.5 text-xs">
          <span class="w-3 h-3 rounded bg-primary-100 dark:bg-primary-900/30"></span>
          <span class="text-gray-600 dark:text-gray-400">{{ $t('tour.schedule.newDates') }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs">
          <span class="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30"></span>
          <span class="text-gray-600 dark:text-gray-400">{{
            $t('tour.schedule.existingDates')
          }}</span>
        </div>
      </div>

      <div class="flex justify-end mt-6">
        <button
          type="button"
          class="btn-primary"
          :disabled="!tourId || saving || generated.length === 0"
          @click="createDepartures"
        >
          <span v-if="saving" class="material-icons animate-spin mr-2">refresh</span>
          <span v-else class="material-icons mr-2">playlist_add</span>
          {{ $t('tour.schedule.create') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as tourService from '@/services/tourService'
import DatePicker from '@/components/common/DatePicker.vue'
import Dropdown from '@/components/ui/form/Dropdown.vue'

const { t, locale } = useI18n()

const props = defineProps({
  tourId: { type: String, default: '' }
})
const emit = defineEmits(['created', 'schedule-changed'])

const saving = ref(false)
const loadingExisting = ref(false)
const existingDates = ref([]) // YYYY-MM-DD
const scheduleType = ref('recurring') // 'recurring' or 'onetime'
const currentMonth = ref(new Date())
const hoveredDate = ref(null) // For multi-day preview on hover

const presetButtons = computed(() => [
  { value: 'every_day', label: t('tour.schedule.presets.everyDay') },
  { value: 'weekend', label: t('tour.schedule.presets.weekend') },
  { value: 'weekdays', label: t('tour.schedule.presets.weekdays') },
  { value: 'every_n_days', label: t('tour.schedule.presets.everyNDays') },
  { value: 'custom_dates', label: t('tour.schedule.presets.customDates') }
])

const currencyOptions = [
  { value: 'TRY', label: 'TRY - Turkish Lira' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' }
]

const weekdayOptions = computed(() => {
  if (locale.value === 'tr') {
    return [
      { value: 1, label: 'Pzt' },
      { value: 2, label: 'Sal' },
      { value: 3, label: 'Çar' },
      { value: 4, label: 'Per' },
      { value: 5, label: 'Cum' },
      { value: 6, label: 'Cmt' },
      { value: 0, label: 'Paz' }
    ]
  }
  return [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 0, label: 'Sun' }
  ]
})

const weekDays = computed(() => {
  if (locale.value === 'tr') {
    return ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  }
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
})

const weekDaysFull = computed(() => {
  const days =
    locale.value === 'tr'
      ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map((label, idx) => ({ label, idx }))
})

const months = computed(() => {
  if (locale.value === 'tr') {
    return [
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
  }
  return [
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

const form = ref({
  from: '',
  to: '',
  preset: 'every_day',
  everyN: 2,
  weekdays: [1, 2, 3, 4, 5],
  customDates: [],
  durationDays: 1,
  time: { start: '', end: '' },
  capacityTotal: 30,
  priceAdultDouble: 0,
  currency: 'TRY'
})

const existingDateSet = computed(() => new Set(existingDates.value))

const showDurationInSettings = computed(
  () => scheduleType.value !== 'onetime' && form.value.preset !== 'custom_dates'
)

const calendarDates = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startDay = firstDay.getDay()
  startDay = startDay === 0 ? 6 : startDay - 1

  const dates = []
  for (let i = 0; i < startDay; i++) dates.push(null)
  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, month, day))
  }
  return dates
})

const customDatesGroupedByYear = computed(() => groupByYear(form.value.customDates || []))

function toYmd(date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  // Use local date components to avoid timezone issues
  // toISOString() converts to UTC which can shift the date by -1 day in positive timezone offsets
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Format YYYY-MM-DD to DD/MM
function formatDDMM(ymd) {
  if (!ymd) return ''
  const parts = ymd.split('-')
  if (parts.length !== 3) return ymd
  return `${parts[2]}/${parts[1]}`
}

// Format date range showing departure and return dates (e.g., "16-19 Feb" for 4-day tour starting Feb 16)
// Duration represents total days including departure and return day.
// Example: duration 4 starting Feb 16 => Feb 16 - Feb 19 (Day 1: 16, Day 2: 17, Day 3: 18, Day 4: 19)
function formatDateRange(ymd, durationDays) {
  if (!ymd) return ''
  const duration = Math.max(1, Number(durationDays || 1))
  const depDate = new Date(ymd)
  if (Number.isNaN(depDate.getTime())) return formatDDMM(ymd)

  if (duration === 1) {
    return formatDDMM(ymd)
  }

  // For multi-day tours: return date = start date + (duration - 1) days
  const retDate = addDays(depDate, duration - 1)

  const depDay = depDate.getDate()
  const retDay = retDate.getDate()
  const depMonth = depDate.getMonth()
  const retMonth = retDate.getMonth()

  const monthNamesShort =
    locale.value === 'tr'
      ? ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (depMonth === retMonth) {
    return `${depDay}-${retDay} ${monthNamesShort[depMonth]}`
  }

  return `${depDay} ${monthNamesShort[depMonth]} - ${retDay} ${monthNamesShort[retMonth]}`
}

function formatMonthYear(date) {
  return `${months.value[date.getMonth()]} ${date.getFullYear()}`
}

function groupByYear(dates) {
  const groups = {}
  for (const d of dates) {
    const year = d.substring(0, 4)
    if (!groups[year]) groups[year] = []
    groups[year].push(d)
  }
  return groups
}

const generatedGroupedByYear = computed(() => groupByYear(generated.value))

const generated = computed(() => {
  // One-time mode: just return custom dates
  if (scheduleType.value === 'onetime') {
    return [...new Set((form.value.customDates || []).filter(Boolean))].sort()
  }

  // Recurring mode with custom dates preset
  if (form.value.preset === 'custom_dates') {
    return [...new Set((form.value.customDates || []).filter(Boolean))].sort()
  }

  // Recurring mode with date range presets
  if (!form.value.from || !form.value.to) return []
  const start = new Date(form.value.from)
  const end = new Date(form.value.to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return []

  const out = []
  let cursor = new Date(start)
  let idx = 0
  const preset = form.value.preset

  while (cursor <= end && out.length < 2000) {
    const day = cursor.getDay()
    const ymd = toYmd(cursor)
    if (!ymd) break

    if (preset === 'every_day') {
      out.push(ymd)
    } else if (preset === 'every_n_days') {
      if (idx % Math.max(2, form.value.everyN || 2) === 0) out.push(ymd)
    } else if (preset === 'weekend') {
      if (day === 6 || day === 0) out.push(ymd)
    } else if (preset === 'weekdays') {
      if ((form.value.weekdays || []).includes(day)) out.push(ymd)
    }

    cursor = addDays(cursor, 1)
    idx += 1
  }
  return out
})

// Switch to one-time mode and clear custom dates
function switchToOnetime() {
  scheduleType.value = 'onetime'
  form.value.customDates = []
}

// Calendar functions for custom dates
function isDateDisabled(date) {
  if (!date) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateClone = new Date(date)
  dateClone.setHours(0, 0, 0, 0)
  return dateClone < today
}

function isDateSelected(date) {
  if (!date) return false
  const ymd = toYmd(date)
  return form.value.customDates.includes(ymd)
}

// Enhanced date class for custom dates with multi-day range visualization
function getDateClassEnhanced(date) {
  if (!date) return 'w-9 h-9'

  const duration = Math.max(1, Number(form.value.durationDays || 1))

  const classes = [
    'w-9',
    'h-9',
    'flex',
    'items-center',
    'justify-center',
    'text-sm',
    'font-medium',
    'transition-all',
    'relative'
  ]

  if (isDateDisabled(date)) {
    classes.push('text-gray-300', 'dark:text-gray-600', 'cursor-not-allowed', 'rounded-lg')
    return classes.join(' ')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateClone = new Date(date)
  dateClone.setHours(0, 0, 0, 0)

  // Check if this date is a departure date (start of a range)
  const isDepartureDate = isDateSelected(date)

  // Check if this date falls within any selected range
  const isInSelectedRange = isDateInAnyRange(date)

  // Check if this date is in a hovered preview range
  const isInHoverRange = isDateInHoverRange(date)

  // Determine position in range for styling
  const rangePosition = getDateRangePosition(date)

  if (isDepartureDate) {
    // Start of a selected departure range
    if (duration > 1) {
      classes.push('bg-primary-500', 'text-white', 'rounded-l-lg', 'rounded-r-none')
    } else {
      classes.push('bg-primary-500', 'text-white', 'rounded-lg')
    }
  } else if (isInSelectedRange) {
    // Part of a selected range (not the start)
    if (rangePosition === 'end') {
      classes.push(
        'bg-primary-200',
        'dark:bg-primary-800',
        'text-primary-800',
        'dark:text-primary-200',
        'rounded-r-lg',
        'rounded-l-none'
      )
    } else {
      classes.push(
        'bg-primary-100',
        'dark:bg-primary-900/50',
        'text-primary-700',
        'dark:text-primary-300',
        'rounded-none'
      )
    }
  } else if (isInHoverRange && !isDateDisabled(date)) {
    // Hover preview for multi-day range
    if (hoveredDate.value && toYmd(date) === toYmd(hoveredDate.value)) {
      classes.push(
        'bg-primary-300',
        'dark:bg-primary-700',
        'text-white',
        'rounded-l-lg',
        'rounded-r-none'
      )
    } else {
      const hoverPos = getHoverRangePosition(date)
      if (hoverPos === 'end') {
        classes.push(
          'bg-primary-100',
          'dark:bg-primary-900/30',
          'text-primary-600',
          'dark:text-primary-400',
          'rounded-r-lg',
          'rounded-l-none'
        )
      } else {
        classes.push(
          'bg-primary-50',
          'dark:bg-primary-900/20',
          'text-primary-600',
          'dark:text-primary-400',
          'rounded-none'
        )
      }
    }
  } else {
    // Normal unselected date
    classes.push('rounded-lg')
    if (dateClone.getTime() === today.getTime()) {
      classes.push('ring-2', 'ring-primary-400', 'ring-inset')
    }
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      classes.push('text-red-500', 'dark:text-red-400')
    } else {
      classes.push('text-gray-700', 'dark:text-gray-300')
    }
    classes.push('hover:bg-gray-100', 'dark:hover:bg-slate-700', 'cursor-pointer')
  }

  return classes.join(' ')
}

// Check if a date falls within any selected departure range
function isDateInAnyRange(date) {
  if (!date) return false
  const duration = Math.max(1, Number(form.value.durationDays || 1))
  if (duration <= 1) return false

  const dateTime = new Date(date).setHours(0, 0, 0, 0)

  for (const depDateStr of form.value.customDates) {
    const depDate = new Date(depDateStr)
    depDate.setHours(0, 0, 0, 0)
    // End date is departure + (duration - 1) days
    // Duration 4 = Day 1 (departure) + Day 2 + Day 3 + Day 4 (return)
    const endDate = addDays(depDate, duration - 1)
    endDate.setHours(0, 0, 0, 0)

    if (dateTime > depDate.getTime() && dateTime <= endDate.getTime()) {
      return true
    }
  }
  return false
}

// Get position within range (middle or end)
function getDateRangePosition(date) {
  if (!date) return null
  const duration = Math.max(1, Number(form.value.durationDays || 1))
  if (duration <= 1) return null

  const dateTime = new Date(date).setHours(0, 0, 0, 0)

  for (const depDateStr of form.value.customDates) {
    const depDate = new Date(depDateStr)
    depDate.setHours(0, 0, 0, 0)
    // End date is departure + (duration - 1) days
    const endDate = addDays(depDate, duration - 1)
    endDate.setHours(0, 0, 0, 0)

    if (dateTime === endDate.getTime()) {
      return 'end'
    }
    if (dateTime > depDate.getTime() && dateTime < endDate.getTime()) {
      return 'middle'
    }
  }
  return null
}

// Check if date is in hover preview range
function isDateInHoverRange(date) {
  if (!date || !hoveredDate.value) return false
  const duration = Math.max(1, Number(form.value.durationDays || 1))
  if (duration <= 1) return false

  // Don't show hover preview if hovering over a disabled date
  if (isDateDisabled(hoveredDate.value)) return false

  const dateTime = new Date(date).setHours(0, 0, 0, 0)
  const hoverTime = new Date(hoveredDate.value).setHours(0, 0, 0, 0)
  // End date for hover is hover date + (duration - 1) days
  // Duration 4 means: Day 1 (departure) + Day 2 + Day 3 + Day 4 (return) = 4 days total
  const endDate = addDays(new Date(hoveredDate.value), duration - 1)
  endDate.setHours(0, 0, 0, 0)

  return dateTime >= hoverTime && dateTime <= endDate.getTime()
}

// Get position within hover range
function getHoverRangePosition(date) {
  if (!date || !hoveredDate.value) return null
  const duration = Math.max(1, Number(form.value.durationDays || 1))
  if (duration <= 1) return null

  const dateTime = new Date(date).setHours(0, 0, 0, 0)
  // End date is departure + (duration - 1) days
  const endDate = addDays(new Date(hoveredDate.value), duration - 1)
  endDate.setHours(0, 0, 0, 0)

  if (dateTime === endDate.getTime()) {
    return 'end'
  }
  return 'middle'
}

// Handle date hover for multi-day preview
function handleDateHover(date) {
  if (date && !isDateDisabled(date) && form.value.durationDays > 1) {
    hoveredDate.value = date
  }
}

// Toggle date for multi-select (recurring with custom dates)
function toggleDateMulti(date) {
  if (!date || isDateDisabled(date)) return

  const ymd = toYmd(date)
  if (!ymd) return

  const idx = form.value.customDates.indexOf(ymd)
  if (idx >= 0) {
    form.value.customDates.splice(idx, 1)
  } else {
    form.value.customDates.push(ymd)
  }
  form.value.customDates = form.value.customDates.sort()
}

// Select single date (one-time mode)
function selectSingleDate(date) {
  if (!date || isDateDisabled(date)) return

  const ymd = toYmd(date)
  if (!ymd) return

  // Replace with single date
  form.value.customDates = [ymd]
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

function removeCustomDate(d) {
  form.value.customDates = form.value.customDates.filter(x => x !== d)
}

function hasAllOfWeekday(weekdayIndex) {
  const jsDay = weekdayIndex === 6 ? 0 : weekdayIndex + 1

  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()

  let count = 0
  let selected = 0

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month, day)
    if (date.getDay() === jsDay && !isDateDisabled(date)) {
      count++
      if (isDateSelected(date)) selected++
    }
  }

  return count > 0 && selected === count
}

function toggleWeekday(weekdayIndex) {
  const jsDay = weekdayIndex === 6 ? 0 : weekdayIndex + 1

  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()

  const hasAll = hasAllOfWeekday(weekdayIndex)
  const newDates = [...form.value.customDates]

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month, day)
    if (date.getDay() === jsDay && !isDateDisabled(date)) {
      const ymd = toYmd(date)
      if (!ymd) continue

      const idx = newDates.indexOf(ymd)
      if (hasAll) {
        if (idx >= 0) newDates.splice(idx, 1)
      } else {
        if (idx < 0) newDates.push(ymd)
      }
    }
  }

  form.value.customDates = newDates.sort()
}

async function loadExisting() {
  if (!props.tourId) return
  loadingExisting.value = true
  try {
    const resp = await tourService.getDepartures(props.tourId)
    const deps = resp.data || []
    existingDates.value = deps.map(d => toYmd(d.departureDate)).filter(Boolean)
  } finally {
    loadingExisting.value = false
  }
}

async function createDepartures() {
  if (!props.tourId) return
  saving.value = true
  try {
    const duration = Math.max(1, Number(form.value.durationDays || 1))

    const departures = generated.value.map(d => {
      const depDate = new Date(d)
      // Single-day tours: return date is same as departure date
      // Multi-day tours: return date = departure + (duration - 1) days
      // Duration 4: Day 1 (dep) + Day 2 + Day 3 + Day 4 (return) = departure + 3 days
      const retDate = duration === 1 ? depDate : addDays(depDate, duration - 1)

      return {
        departureDate: depDate.toISOString(),
        returnDate: retDate.toISOString(),
        time: form.value.time?.start || form.value.time?.end ? { ...form.value.time } : undefined,
        currency: form.value.currency,
        capacity: { total: Number(form.value.capacityTotal || 30) },
        pricing: { adult: { double: Number(form.value.priceAdultDouble || 0) } },
        status: 'scheduled'
      }
    })

    const resp = await tourService.bulkCreateDepartures(props.tourId, { departures })
    emit('created', resp.data)
    await loadExisting()
  } finally {
    saving.value = false
  }
}

watch(
  () => props.tourId,
  () => loadExisting(),
  { immediate: true }
)

// Emit schedule data whenever generated departures or settings change
// This allows parent components to capture pending departures for auto-creation
watch(
  [generated, () => form.value.durationDays, () => form.value.time, () => form.value.currency, () => form.value.capacityTotal, () => form.value.priceAdultDouble],
  () => {
    if (!props.tourId && generated.value.length > 0) {
      const duration = Math.max(1, Number(form.value.durationDays || 1))
      const departures = generated.value.map(d => {
        const depDate = new Date(d)
        const retDate = duration === 1 ? depDate : addDays(depDate, duration - 1)
        return {
          departureDate: depDate.toISOString(),
          returnDate: retDate.toISOString(),
          time: form.value.time?.start || form.value.time?.end ? { ...form.value.time } : undefined,
          currency: form.value.currency,
          capacity: { total: Number(form.value.capacityTotal || 30) },
          pricing: { adult: { double: Number(form.value.priceAdultDouble || 0) } },
          status: 'scheduled'
        }
      })
      emit('schedule-changed', departures)
    } else {
      emit('schedule-changed', [])
    }
  },
  { deep: true }
)

/**
 * Set schedule from AI import data
 * @param {Object} aiSchedule - Schedule data from AI extraction
 * @param {boolean} aiSchedule.isOneTime - Whether this is a one-time tour
 * @param {string} aiSchedule.departureDate - ISO date string (YYYY-MM-DD)
 * @param {string} aiSchedule.returnDate - ISO date string (YYYY-MM-DD)
 * @param {string} aiSchedule.departureTime - Time string (HH:mm)
 * @param {string} aiSchedule.returnTime - Time string (HH:mm)
 * @param {number} durationDays - Tour duration in days
 * @param {Object} pricing - Optional pricing info
 */
function setFromAI(aiSchedule, durationDays = 1, pricing = null) {
  if (!aiSchedule) return
  
  // Set schedule type
  if (aiSchedule.isOneTime) {
    scheduleType.value = 'onetime'
  } else {
    scheduleType.value = 'recurring'
    form.value.preset = 'custom_dates'
  }
  
  // Set duration
  if (durationDays && durationDays >= 1) {
    form.value.durationDays = durationDays
  }
  
  // Set departure date
  if (aiSchedule.departureDate) {
    form.value.customDates = [aiSchedule.departureDate]
    
    // Navigate calendar to the departure month
    const depDate = new Date(aiSchedule.departureDate)
    if (!isNaN(depDate.getTime())) {
      currentMonth.value = new Date(depDate.getFullYear(), depDate.getMonth(), 1)
    }
  }
  
  // Set times
  if (aiSchedule.departureTime) {
    form.value.time.start = aiSchedule.departureTime
  }
  if (aiSchedule.returnTime) {
    form.value.time.end = aiSchedule.returnTime
  }
  
  // Set pricing if provided
  if (pricing) {
    if (pricing.currency) form.value.currency = pricing.currency
    if (pricing.startingPrice) form.value.priceAdultDouble = pricing.startingPrice
    if (pricing.adult?.double) form.value.priceAdultDouble = pricing.adult.double
  }
}

// Expose methods for parent component
defineExpose({ setFromAI, loadExisting })

onMounted(() => {
  const now = new Date()
  const to = addDays(now, 30)
  form.value.from = toYmd(now) || ''
  form.value.to = toYmd(to) || ''
})
</script>
