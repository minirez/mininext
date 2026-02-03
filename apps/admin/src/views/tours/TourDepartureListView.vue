<template>
  <div class="h-full flex flex-col">
    <!-- Navigation -->
    <ModuleNavigation :items="navItems" color="primary">
      <template #actions>
        <BaseButton size="sm" @click="openDepartureModal()">
          <span class="material-icons mr-1 text-sm">add</span>
          {{ $t('departure.newDeparture') }}
        </BaseButton>
      </template>
    </ModuleNavigation>

    <div class="flex-1 overflow-y-auto py-6 space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span class="material-icons text-blue-600 dark:text-blue-400">event</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('stats.upcomingDepartures') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.upcoming }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('departure.departureStatuses.confirmed') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.confirmed }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <span class="material-icons text-yellow-600 dark:text-yellow-400"
                >hourglass_empty</span
              >
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('departure.departureStatuses.scheduled') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.scheduled }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <span class="material-icons text-red-600 dark:text-red-400">block</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('departure.departureStatuses.sold_out') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.soldOut }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- View Toggle & Filters -->
      <div
        class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4"
      >
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <!-- View Toggle -->
          <div class="flex items-center space-x-2">
            <button
              @click="viewMode = 'calendar'"
              class="px-4 py-2 rounded-lg flex items-center transition-colors"
              :class="
                viewMode === 'calendar'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
              "
            >
              <span class="material-icons mr-2">calendar_month</span>
              {{ $t('departure.calendar') }}
            </button>
            <button
              @click="viewMode = 'list'"
              class="px-4 py-2 rounded-lg flex items-center transition-colors"
              :class="
                viewMode === 'list'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
              "
            >
              <span class="material-icons mr-2">view_list</span>
              {{ $t('common.list') }}
            </button>
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Tour Filter -->
            <select
              v-model="filters.tourId"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{{ $t('filters.allDestinations') }}</option>
              <option v-for="tour in tours" :key="tour._id" :value="tour._id">
                {{ tour.name?.tr || tour.name?.en || tour.code }}
              </option>
            </select>

            <!-- Status Filter -->
            <select
              v-model="filters.status"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{{ $t('filters.allStatuses') }}</option>
              <option value="scheduled">{{ $t('departure.departureStatuses.scheduled') }}</option>
              <option value="confirmed">{{ $t('departure.departureStatuses.confirmed') }}</option>
              <option value="cancelled">{{ $t('departure.departureStatuses.cancelled') }}</option>
              <option value="completed">{{ $t('departure.departureStatuses.completed') }}</option>
              <option value="sold_out">{{ $t('departure.departureStatuses.sold_out') }}</option>
            </select>

            <!-- Month Navigation -->
            <div class="flex items-center space-x-2">
              <button
                @click="previousMonth"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <span class="material-icons">chevron_left</span>
              </button>
              <span
                class="text-sm font-medium text-gray-900 dark:text-white min-w-[120px] text-center"
              >
                {{ currentMonthLabel }}
              </span>
              <button
                @click="nextMonth"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <span class="material-icons">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar View -->
      <div
        v-if="viewMode === 'calendar'"
        class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <!-- Calendar Header -->
        <div class="grid grid-cols-7 bg-gray-50 dark:bg-slate-700/50">
          <div
            v-for="day in weekDays"
            :key="day"
            class="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
          >
            {{ day }}
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 divide-x divide-y divide-gray-200 dark:divide-slate-700">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="min-h-[120px] p-2"
            :class="{
              'bg-gray-50 dark:bg-slate-800/50': !day.isCurrentMonth,
              'bg-white dark:bg-slate-800': day.isCurrentMonth,
              'ring-2 ring-purple-500 ring-inset': day.isToday
            }"
          >
            <div class="flex items-center justify-between mb-1">
              <span
                class="text-sm font-medium"
                :class="{
                  'text-gray-400 dark:text-gray-600': !day.isCurrentMonth,
                  'text-gray-900 dark:text-white': day.isCurrentMonth,
                  'text-purple-600 dark:text-purple-400': day.isToday
                }"
              >
                {{ day.date }}
              </span>
              <button
                v-if="day.isCurrentMonth"
                @click="openDepartureModal(day.fullDate)"
                class="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-purple-600"
              >
                <span class="material-icons text-sm">add</span>
              </button>
            </div>

            <!-- Departures for this day -->
            <div class="space-y-1">
              <div
                v-for="departure in day.departures"
                :key="departure._id"
                @click="openDepartureModal(null, departure)"
                class="px-2 py-1 rounded text-xs cursor-pointer truncate"
                :class="getDepartureColor(departure.status)"
                :title="`${getLocalizedName(departure.tour?.name) || $t('tour.title')} - ${departure.capacity?.available || 0} ${$t('departure.capacity.available')}`"
              >
                <span class="font-medium">{{
                  getLocalizedName(departure.tour?.name) || $t('tour.title')
                }}</span>
                <span class="ml-1 opacity-75">({{ departure.capacity?.available || 0 }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div
        v-else
        class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
      >
        <div v-if="loading" class="p-8 text-center">
          <Spinner />
        </div>
        <div v-else-if="filteredDepartures.length === 0" class="p-8 text-center">
          <span class="material-icons text-6xl text-gray-300 dark:text-gray-600 mb-4"
            >event_busy</span
          >
          <p class="text-gray-500 dark:text-gray-400">{{ $t('departure.noDepartures') }}</p>
          <BaseButton class="mt-4" @click="openDepartureModal()">
            {{ $t('departure.createFirst') }}
          </BaseButton>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('departure.fields.tour') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('departure.fields.departureDate') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('departure.fields.returnDate') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('departure.capacity.title') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('departure.pricing.adult') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('departure.fields.status') }}
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
              <tr
                v-for="departure in filteredDepartures"
                :key="departure._id"
                class="hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center">
                    <div
                      class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3"
                    >
                      <span class="material-icons text-purple-600 dark:text-purple-400">tour</span>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">
                        {{ getLocalizedName(departure.tour?.name) || '-' }}
                      </p>
                      <p class="text-sm text-gray-500">{{ departure.tour?.code || '-' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-900 dark:text-white">
                  {{ formatDate(departure.departureDate) }}
                </td>
                <td class="px-4 py-3 text-gray-900 dark:text-white">
                  {{ formatDate(departure.returnDate) }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center space-x-2">
                    <div class="w-24 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                      <div
                        class="h-2 rounded-full"
                        :class="getCapacityBarColor(departure.capacity)"
                        :style="{ width: getCapacityPercentage(departure.capacity) + '%' }"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      {{ departure.capacity?.available || 0 }}/{{ departure.capacity?.total || 0 }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-900 dark:text-white">
                  {{
                    formatCurrency(
                      departure.pricing?.adult?.double || 0,
                      departure.currency || 'TRY'
                    )
                  }}
                </td>
                <td class="px-4 py-3">
                  <StatusBadge :status="departure.status" :statusMap="departureStatusMap" />
                </td>
                <td class="px-4 py-3 text-right">
                  <ActionMenu :items="getRowActions(departure)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Departure Modal -->
      <Modal
        v-model="showModal"
        :title="editingDeparture ? $t('departure.editDeparture') : $t('departure.newDeparture')"
        size="lg"
      >
        <form @submit.prevent="saveDeparture" class="space-y-6">
          <!-- Tour Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('departure.fields.tour') }} *
            </label>
            <select
              v-model="departureForm.tour"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="">{{ $t('wizard.selectTour') }}</option>
              <option v-for="tour in tours" :key="tour._id" :value="tour._id">
                {{ tour.name?.tr || tour.name?.en || tour.code }} ({{ tour.code }})
              </option>
            </select>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('departure.fields.departureDate') }} *
              </label>
              <input
                type="date"
                v-model="departureForm.departureDate"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('departure.fields.returnDate') }} *
              </label>
              <input
                type="date"
                v-model="departureForm.returnDate"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <!-- Capacity -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('departure.capacity.total') }} *
            </label>
            <input
              type="number"
              v-model.number="departureForm.capacity.total"
              min="1"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>

          <!-- Pricing -->
          <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {{ $t('departure.pricing.title') }}
            </h4>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {{ $t('departure.pricing.single') }}
                </label>
                <input
                  type="number"
                  v-model.number="departureForm.pricing.adult.single"
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {{ $t('departure.pricing.double') }}
                </label>
                <input
                  type="number"
                  v-model.number="departureForm.pricing.adult.double"
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {{ $t('departure.pricing.triple') }}
                </label>
                <input
                  type="number"
                  v-model.number="departureForm.pricing.adult.triple"
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('departure.fields.status') }}
            </label>
            <select
              v-model="departureForm.status"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="scheduled">{{ $t('departure.departureStatuses.scheduled') }}</option>
              <option value="confirmed">{{ $t('departure.departureStatuses.confirmed') }}</option>
              <option value="cancelled">{{ $t('departure.departureStatuses.cancelled') }}</option>
              <option value="completed">{{ $t('departure.departureStatuses.completed') }}</option>
              <option value="sold_out">{{ $t('departure.departureStatuses.sold_out') }}</option>
            </select>
          </div>

          <!-- Guaranteed Departure -->
          <div class="flex items-center">
            <input
              type="checkbox"
              id="guaranteedDeparture"
              v-model="departureForm.guaranteedDeparture"
              class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label for="guaranteedDeparture" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {{ $t('departure.labels.guaranteed') }}
            </label>
          </div>

          <!-- Actions -->
          <div
            class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700"
          >
            <BaseButton variant="secondary" @click="showModal = false">
              {{ $t('common.cancel') }}
            </BaseButton>
            <BaseButton type="submit" :loading="saving">
              {{ $t('common.save') }}
            </BaseButton>
          </div>
        </form>
      </Modal>

      <!-- Delete Confirmation -->
      <ConfirmDialog
        v-model="showDeleteConfirm"
        :title="$t('common.delete')"
        :message="$t('tour.deleteConfirm')"
        variant="danger"
        @confirm="confirmDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTourStore } from '@/stores/tour'
import { formatCurrency } from '@booking-engine/utils'
import { BaseButton, ActionMenu, StatusBadge, Modal, ConfirmDialog, Spinner } from '@/components/ui'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'

const { t, locale } = useI18n()
const tourStore = useTourStore()

function getLocalizedName(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[locale.value] || obj.tr || obj.en || ''
}

// State
const loading = ref(false)
const saving = ref(false)
const viewMode = ref('calendar')
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingDeparture = ref(null)
const deletingId = ref(null)
const currentDate = ref(new Date())

// Filters
const filters = ref({
  tourId: '',
  status: ''
})

// Form
const departureForm = ref(getEmptyForm())

function getEmptyForm() {
  return {
    tour: '',
    departureDate: '',
    returnDate: '',
    capacity: {
      total: 30,
      available: 30,
      reserved: 0,
      sold: 0
    },
    pricing: {
      adult: { single: 0, double: 0, triple: 0 },
      child: { withBed: 0, withoutBed: 0 },
      infant: { price: 0 },
      singleSupplement: 0
    },
    status: 'scheduled',
    guaranteedDeparture: false,
    currency: 'TRY'
  }
}

// Computed
const tours = computed(() => tourStore.tours)
const departures = computed(() => tourStore.departures)

const navItems = computed(() => [
  { label: t('tour.tourList'), icon: 'tour', to: '/tours' },
  { label: t('departure.calendar'), icon: 'calendar_month', to: '/tours/departures' },
  { label: t('extra.extras'), icon: 'add_circle', to: '/tours/extras' },
  { label: t('tourBooking.bookings'), icon: 'book_online', to: '/tours/bookings' }
])

const stats = computed(() => {
  const deps = departures.value
  const now = new Date()
  return {
    upcoming: deps.filter(d => new Date(d.departureDate) >= now).length,
    confirmed: deps.filter(d => d.status === 'confirmed').length,
    scheduled: deps.filter(d => d.status === 'scheduled').length,
    soldOut: deps.filter(d => d.status === 'sold_out').length
  }
})

const filteredDepartures = computed(() => {
  let result = [...departures.value]

  if (filters.value.tourId) {
    result = result.filter(d => d.tour?._id === filters.value.tourId)
  }

  if (filters.value.status) {
    result = result.filter(d => d.status === filters.value.status)
  }

  // Sort by departure date
  result.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate))

  return result
})

const weekDays = computed(() => {
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  if (locale.value === 'en') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }
  return days
})

const currentMonthLabel = computed(() => {
  return currentDate.value.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    month: 'long',
    year: 'numeric'
  })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const days = []

  // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
  let startDayOfWeek = firstDay.getDay()
  if (startDayOfWeek === 0) startDayOfWeek = 7
  startDayOfWeek -= 1 // Convert to 0-indexed Monday start

  // Add days from previous month
  const prevMonth = new Date(year, month, 0)
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = prevMonth.getDate() - i
    days.push({
      date,
      fullDate: new Date(year, month - 1, date),
      isCurrentMonth: false,
      isToday: false,
      departures: getDeparturesForDate(new Date(year, month - 1, date))
    })
  }

  // Add days from current month
  const today = new Date()
  for (let date = 1; date <= lastDay.getDate(); date++) {
    const fullDate = new Date(year, month, date)
    days.push({
      date,
      fullDate,
      isCurrentMonth: true,
      isToday: fullDate.toDateString() === today.toDateString(),
      departures: getDeparturesForDate(fullDate)
    })
  }

  // Add days from next month to complete the grid
  const remainingDays = 42 - days.length // 6 rows x 7 days
  for (let date = 1; date <= remainingDays; date++) {
    days.push({
      date,
      fullDate: new Date(year, month + 1, date),
      isCurrentMonth: false,
      isToday: false,
      departures: getDeparturesForDate(new Date(year, month + 1, date))
    })
  }

  return days
})

const departureStatusMap = {
  scheduled: { label: t('departure.departureStatuses.scheduled'), color: 'yellow' },
  confirmed: { label: t('departure.departureStatuses.confirmed'), color: 'green' },
  cancelled: { label: t('departure.departureStatuses.cancelled'), color: 'red' },
  completed: { label: t('departure.departureStatuses.completed'), color: 'gray' },
  sold_out: { label: t('departure.departureStatuses.sold_out'), color: 'purple' }
}

// Methods
function getDeparturesForDate(date) {
  const dateStr = date.toISOString().split('T')[0]
  return departures.value.filter(d => {
    const depDate = new Date(d.departureDate).toISOString().split('T')[0]
    return depDate === dateStr
  })
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function getDepartureColor(status) {
  const colors = {
    scheduled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    sold_out: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  }
  return colors[status] || colors.scheduled
}

function getCapacityBarColor(capacity) {
  if (!capacity) return 'bg-gray-400'
  const percentage = (capacity.available / capacity.total) * 100
  if (percentage > 50) return 'bg-green-500'
  if (percentage > 20) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getCapacityPercentage(capacity) {
  if (!capacity || !capacity.total) return 0
  return ((capacity.total - capacity.available) / capacity.total) * 100
}

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

function openDepartureModal(date = null, departure = null) {
  if (departure) {
    editingDeparture.value = departure
    departureForm.value = {
      tour: departure.tour?._id || departure.tour || '',
      departureDate: departure.departureDate ? departure.departureDate.split('T')[0] : '',
      returnDate: departure.returnDate ? departure.returnDate.split('T')[0] : '',
      capacity: { ...departure.capacity },
      pricing: JSON.parse(JSON.stringify(departure.pricing || getEmptyForm().pricing)),
      status: departure.status || 'scheduled',
      guaranteedDeparture: departure.guaranteedDeparture || false,
      currency: departure.currency || 'TRY'
    }
  } else {
    editingDeparture.value = null
    departureForm.value = getEmptyForm()
    if (date) {
      departureForm.value.departureDate = date.toISOString().split('T')[0]
    }
  }
  showModal.value = true
}

async function saveDeparture() {
  saving.value = true
  try {
    const data = {
      ...departureForm.value,
      capacity: {
        ...departureForm.value.capacity,
        available:
          departureForm.value.capacity.total -
          (departureForm.value.capacity.sold || 0) -
          (departureForm.value.capacity.reserved || 0)
      }
    }

    if (editingDeparture.value) {
      await tourStore.updateDeparture(editingDeparture.value._id, data)
    } else {
      await tourStore.createDeparture(data.tour, data)
    }
    showModal.value = false
  } finally {
    saving.value = false
  }
}

function getRowActions(departure) {
  return [
    {
      label: t('common.edit'),
      icon: 'edit',
      action: () => openDepartureModal(null, departure)
    },
    {
      label: t('common.delete'),
      icon: 'delete',
      variant: 'danger',
      action: () => {
        deletingId.value = departure._id
        showDeleteConfirm.value = true
      }
    }
  ]
}

async function confirmDelete() {
  if (deletingId.value) {
    await tourStore.deleteDeparture(deletingId.value)
    deletingId.value = null
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([tourStore.fetchTours(), tourStore.fetchAllDepartures()])
  } finally {
    loading.value = false
  }
})
</script>
