<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-1 py-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ $t('platformBookings.title') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
          {{ $t('platformBookings.description') }}
        </p>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto py-2">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div
          v-for="stat in statCards"
          :key="stat.key"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 cursor-pointer transition-all hover:shadow-md"
          :class="{ 'ring-2 ring-purple-500': filters.status === stat.filterValue }"
          @click="stat.filterValue !== null && setStatusFilter(stat.filterValue)"
        >
          <div class="flex items-center">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
              :class="stat.bgClass"
            >
              <span class="material-icons" :class="stat.iconClass">{{ stat.icon }}</span>
            </div>
            <div class="min-w-0">
              <!-- Currency-grouped stats (revenue, paid) -->
              <template v-if="stat.currencyField">
                <div v-if="stats[stat.currencyField]?.length" class="flex flex-col gap-0.5">
                  <p
                    v-for="rev in stats[stat.currencyField]"
                    :key="rev.currency"
                    class="text-lg font-bold text-gray-900 dark:text-white leading-tight"
                  >
                    {{ formatPrice(rev.amount, rev.currency) }}
                  </p>
                </div>
                <p v-else class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ formatPrice(0, 'TRY') }}
                </p>
              </template>
              <!-- Normal stat card -->
              <template v-else>
                <p class="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {{ stat.value }}
                </p>
              </template>
              <p class="text-xs text-gray-500 dark:text-slate-400 truncate">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Partners Revenue Card -->
      <div
        v-if="stats.topPartners?.length > 0"
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6"
      >
        <h3 class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center">
          <span class="material-icons text-lg mr-2 text-purple-500">leaderboard</span>
          {{ $t('platformBookings.topPartners') }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div
            v-for="(p, idx) in stats.topPartners"
            :key="p.partnerId"
            class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            @click="setPartnerFilter(p.partnerId)"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              :class="
                idx < 3
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                  : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'
              "
            >
              {{ idx + 1 }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ p.companyName || '-' }}
              </p>
              <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                <span>{{ formatPrice(p.revenue, 'TRY') }}</span>
                <span class="text-gray-300 dark:text-slate-600">|</span>
                <span>{{ p.bookingCount }} {{ $t('platformBookings.reservation') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Actions Bar -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6"
      >
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <!-- Search -->
          <div class="flex-1">
            <div class="relative">
              <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >search</span
              >
              <input
                v-model="filters.search"
                type="text"
                :placeholder="$t('platformBookings.searchPlaceholder')"
                class="form-input w-full pl-10"
                @input="debouncedSearch"
              />
            </div>
          </div>

          <!-- Status Tabs -->
          <div
            class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1 overflow-x-auto"
          >
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              :class="
                filters.status === tab.value
                  ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              "
              @click="setStatusFilter(tab.value)"
            >
              {{ tab.label }}
              <span
                v-if="tab.count > 0"
                class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                :class="
                  filters.status === tab.value
                    ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                    : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-400'
                "
              >
                {{ tab.count }}
              </span>
            </button>
          </div>

          <!-- Toggle Advanced Filters -->
          <button
            class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="
              showAdvancedFilters
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            "
            @click="showAdvancedFilters = !showAdvancedFilters"
          >
            <span class="material-icons text-lg">tune</span>
            <span
              v-if="activeFilterCount > 0"
              class="px-1.5 py-0.5 text-xs rounded-full bg-purple-500 text-white"
            >
              {{ activeFilterCount }}
            </span>
          </button>
        </div>

        <!-- Advanced Filters Row -->
        <div
          v-if="showAdvancedFilters"
          class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <!-- Guest Name -->
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
              {{ $t('platformBookings.filters.guestName') }}
            </label>
            <input
              v-model="filters.guestName"
              type="text"
              :placeholder="$t('platformBookings.filters.guestNamePlaceholder')"
              class="form-input w-full text-sm"
              @input="debouncedSearch"
            />
          </div>

          <!-- Booking Number -->
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
              {{ $t('platformBookings.filters.bookingNumber') }}
            </label>
            <input
              v-model="filters.bookingNumber"
              type="text"
              :placeholder="$t('platformBookings.filters.bookingNumberPlaceholder')"
              class="form-input w-full text-sm"
              @input="debouncedSearch"
            />
          </div>

          <!-- Check-in Date Range -->
          <div>
            <DateRangePicker
              v-model="checkInRange"
              :label="$t('platformBookings.filters.checkInDate')"
              :start-placeholder="$t('platformBookings.filters.startDate')"
              :end-placeholder="$t('platformBookings.filters.endDate')"
              :show-presets="false"
              :clearable="true"
              @change="applyFilters"
            />
          </div>

          <!-- Check-out Date Range -->
          <div>
            <DateRangePicker
              v-model="checkOutRange"
              :label="$t('platformBookings.filters.checkOutDate')"
              :start-placeholder="$t('platformBookings.filters.startDate')"
              :end-placeholder="$t('platformBookings.filters.endDate')"
              :show-presets="false"
              :clearable="true"
              @change="applyFilters"
            />
          </div>

          <!-- Reservation (Created) Date Range -->
          <div>
            <DateRangePicker
              v-model="createdRange"
              :label="$t('platformBookings.filters.reservationDate')"
              :start-placeholder="$t('platformBookings.filters.startDate')"
              :end-placeholder="$t('platformBookings.filters.endDate')"
              :show-presets="false"
              :clearable="true"
              @change="applyFilters"
            />
          </div>

          <!-- Clear Filters -->
          <div class="flex items-end">
            <button
              v-if="activeFilterCount > 0"
              class="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              @click="clearAllFilters"
            >
              <span class="material-icons text-lg">filter_alt_off</span>
              {{ $t('platformBookings.filters.clearAll') }}
            </button>
          </div>
        </div>

        <!-- Active Filters Tags -->
        <div
          v-if="filters.partnerId || activeFilterCount > 0"
          class="mt-3 flex flex-wrap items-center gap-2"
        >
          <!-- Partner filter tag -->
          <span
            v-if="filters.partnerId"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
          >
            {{ $t('platformBookings.partner') }}: {{ activePartnerName }}
            <button
              class="ml-1.5 hover:text-purple-900 dark:hover:text-purple-100"
              @click="clearPartnerFilter"
            >
              <span class="material-icons text-xs">close</span>
            </button>
          </span>

          <!-- Check-in date filter tag -->
          <span
            v-if="filters.checkInFrom || filters.checkInTo"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          >
            {{ $t('platformBookings.filters.checkInDate') }}: {{ filters.checkInFrom || '...' }} -
            {{ filters.checkInTo || '...' }}
            <button
              class="ml-1.5 hover:text-blue-900 dark:hover:text-blue-100"
              @click="clearCheckInFilter"
            >
              <span class="material-icons text-xs">close</span>
            </button>
          </span>

          <!-- Check-out date filter tag -->
          <span
            v-if="filters.checkOutFrom || filters.checkOutTo"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          >
            {{ $t('platformBookings.filters.checkOutDate') }}: {{ filters.checkOutFrom || '...' }} -
            {{ filters.checkOutTo || '...' }}
            <button
              class="ml-1.5 hover:text-green-900 dark:hover:text-green-100"
              @click="clearCheckOutFilter"
            >
              <span class="material-icons text-xs">close</span>
            </button>
          </span>

          <!-- Created date filter tag -->
          <span
            v-if="filters.createdFrom || filters.createdTo"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          >
            {{ $t('platformBookings.filters.reservationDate') }}:
            {{ filters.createdFrom || '...' }} - {{ filters.createdTo || '...' }}
            <button
              class="ml-1.5 hover:text-amber-900 dark:hover:text-amber-100"
              @click="clearCreatedFilter"
            >
              <span class="material-icons text-xs">close</span>
            </button>
          </span>
        </div>
      </div>

      <!-- Bookings DataTable -->
      <DataTable
        :data="bookings"
        :columns="columns"
        :loading="isLoading"
        :total="totalItems"
        :page="currentPage"
        :per-page="perPage"
        :sort-key="sortKey"
        :sort-order="sortOrder"
        :show-header="false"
        :responsive="false"
        :card-title-key="'bookingNumber'"
        :empty-icon="'event_busy'"
        :empty-text="$t('platformBookings.noBookings')"
        @page-change="handlePageChange"
        @sort="handleSort"
      >
        <!-- Booking Number Cell -->
        <template #cell-bookingNumber="{ row }">
          <div>
            <div class="flex items-center">
              <span
                class="material-icons mr-2 text-sm"
                :class="row.status === 'draft' ? 'text-purple-500' : 'text-gray-400'"
              >
                {{ row.status === 'draft' ? 'edit_note' : 'confirmation_number' }}
              </span>
              <span class="font-medium text-gray-900 dark:text-white">
                {{ row.bookingNumber }}
              </span>
            </div>
            <div class="mt-1 flex items-center gap-1.5">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(row.status)"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full mr-1"
                  :class="getStatusDotClass(row.status)"
                ></span>
                {{ getBookingStatusLabel(row.status) }}
              </span>
              <span
                v-if="row.source?.type"
                class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
                :class="getSourceClass(row.source.type)"
              >
                {{ row.source.type }}
              </span>
            </div>
          </div>
        </template>

        <!-- Partner Cell -->
        <template #cell-partner="{ row }">
          <div v-if="row.partner" class="max-w-[160px]">
            <p class="font-medium text-gray-900 dark:text-white truncate">
              {{ row.partner.companyName }}
            </p>
          </div>
          <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">-</span>
        </template>

        <!-- Hotel Cell -->
        <template #cell-hotelName="{ row }">
          <div class="max-w-[200px]">
            <p class="font-medium text-gray-900 dark:text-white truncate">
              {{ row.hotelName || '-' }}
            </p>
            <div v-if="row.rooms?.length" class="flex flex-wrap items-center gap-1 mt-1">
              <span
                class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
              >
                {{ row.rooms[0].roomTypeCode }}
              </span>
              <span
                class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              >
                {{ row.rooms[0].mealPlanCode }}
              </span>
              <span
                v-if="row.rooms[0].rateType === 'non_refundable'"
                class="px-1 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
              >
                NR
              </span>
              <span
                v-if="row.rooms.length > 1"
                class="px-1 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded"
              >
                +{{ row.rooms.length - 1 }}
              </span>
            </div>
          </div>
        </template>

        <!-- Guest Cell -->
        <template #cell-leadGuest="{ row }">
          <div v-if="row.leadGuest" class="max-w-[140px]">
            <p class="font-medium text-gray-900 dark:text-white truncate">
              {{ row.leadGuest.firstName }} {{ row.leadGuest.lastName }}
            </p>
            <p v-if="row.contact?.email" class="text-xs text-gray-500 dark:text-slate-400 truncate">
              {{ row.contact.email }}
            </p>
          </div>
          <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">-</span>
        </template>

        <!-- Dates Cell -->
        <template #cell-checkIn="{ row }">
          <div v-if="row.checkIn" class="flex items-center gap-2">
            <div class="text-sm">
              <p class="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                {{ formatShortDate(row.checkIn) }}
              </p>
              <p class="text-gray-500 dark:text-slate-400 whitespace-nowrap">
                {{ formatShortDate(row.checkOut) }}
              </p>
            </div>
            <span
              class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium"
            >
              <span class="material-icons text-xs">nightlight</span>
              {{ row.nights }}
            </span>
          </div>
          <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">-</span>
        </template>

        <!-- Price Cell -->
        <template #cell-pricing="{ row }">
          <div v-if="row.pricing?.grandTotal">
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ formatPrice(row.pricing.grandTotal, row.pricing.currency) }}
            </span>
          </div>
          <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">-</span>
        </template>

        <!-- Payment Cell -->
        <template #cell-payment="{ row }">
          <div v-if="row.pricing?.grandTotal" class="flex flex-col">
            <div class="flex items-center gap-1">
              <span class="font-medium text-gray-900 dark:text-white text-sm">
                {{ formatPrice(row.payment?.paidAmount || 0, row.pricing.currency) }}
              </span>
              <span class="text-gray-400 dark:text-slate-500">/</span>
              <span class="text-gray-500 dark:text-slate-400 text-xs">
                {{ formatPrice(row.pricing.grandTotal, row.pricing.currency) }}
              </span>
            </div>
            <span
              class="inline-flex items-center self-start px-2 py-0.5 rounded-full text-xs font-medium mt-1"
              :class="getPaymentStatusClass(row.payment?.status)"
            >
              {{ getPaymentStatusLabel(row.payment?.status) }}
            </span>
          </div>
          <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">-</span>
        </template>

        <!-- Created At Cell -->
        <template #cell-createdAt="{ row }">
          <div v-if="row.createdAt" class="text-sm whitespace-nowrap">
            <p class="text-gray-900 dark:text-white">{{ formatShortDate(row.createdAt) }}</p>
            <p class="text-gray-500 dark:text-slate-400 text-xs">{{ formatTime(row.createdAt) }}</p>
          </div>
          <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">-</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useStatusHelpers } from '@/composables/useStatusHelpers'
import { formatPrice } from '@/utils/formatters'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import platformBookingService from '@/services/platformBookingService'
import DataTable from '@/components/ui/data/DataTable.vue'
import DateRangePicker from '@/components/ui/date/DateRangePicker.vue'

const { locale, t } = useI18n()

// Status helpers
const { getStatusClass, getStatusDotClass, getBookingStatusLabel } = useStatusHelpers()

// Columns
const columns = computed(() => [
  { key: 'bookingNumber', label: t('platformBookings.bookingNumber'), sortable: true },
  { key: 'partner', label: t('platformBookings.partner'), sortable: false },
  { key: 'hotelName', label: t('platformBookings.hotel'), sortable: true },
  { key: 'leadGuest', label: t('platformBookings.guest'), sortable: false },
  { key: 'checkIn', label: t('platformBookings.dates'), sortable: true },
  { key: 'pricing', label: t('platformBookings.totalPrice'), sortable: true },
  { key: 'payment', label: t('platformBookings.payment'), sortable: false },
  { key: 'createdAt', label: t('platformBookings.createdAt'), sortable: true }
])

// Async actions
const { isLoading, execute: executeLoad } = useAsyncAction({
  showSuccessToast: false,
  showErrorToast: false
})
const { execute: executeStats } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })

// State
const bookings = ref([])
const stats = ref({})
const currentPage = ref(1)
const totalItems = ref(0)
const perPage = DEFAULT_PAGE_SIZE
const sortKey = ref('createdAt')
const sortOrder = ref('desc')

// Filters
const filters = ref({
  search: '',
  status: '',
  partnerId: '',
  guestName: '',
  bookingNumber: '',
  checkInFrom: '',
  checkInTo: '',
  checkOutFrom: '',
  checkOutTo: '',
  createdFrom: '',
  createdTo: ''
})

// Advanced filters toggle
const showAdvancedFilters = ref(false)

// DateRangePicker computed v-models
const checkInRange = computed({
  get: () => ({
    start: filters.value.checkInFrom || null,
    end: filters.value.checkInTo || null
  }),
  set: val => {
    filters.value.checkInFrom = val?.start || ''
    filters.value.checkInTo = val?.end || ''
  }
})

const checkOutRange = computed({
  get: () => ({
    start: filters.value.checkOutFrom || null,
    end: filters.value.checkOutTo || null
  }),
  set: val => {
    filters.value.checkOutFrom = val?.start || ''
    filters.value.checkOutTo = val?.end || ''
  }
})

const createdRange = computed({
  get: () => ({
    start: filters.value.createdFrom || null,
    end: filters.value.createdTo || null
  }),
  set: val => {
    filters.value.createdFrom = val?.start || ''
    filters.value.createdTo = val?.end || ''
  }
})

// Count active advanced filters
const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.guestName) count++
  if (filters.value.bookingNumber) count++
  if (filters.value.checkInFrom || filters.value.checkInTo) count++
  if (filters.value.checkOutFrom || filters.value.checkOutTo) count++
  if (filters.value.createdFrom || filters.value.createdTo) count++
  return count
})

// Active partner name (for filter badge)
const activePartnerName = computed(() => {
  if (!filters.value.partnerId || !stats.value.topPartners) return ''
  const partner = stats.value.topPartners.find(p => p.partnerId === filters.value.partnerId)
  return partner?.companyName || filters.value.partnerId
})

// Status tabs
const statusTabs = computed(() => [
  { value: '', label: t('common.all'), count: stats.value.total || 0 },
  { value: 'pending', label: t('booking.status.pending'), count: stats.value.pending || 0 },
  { value: 'confirmed', label: t('booking.status.confirmed'), count: stats.value.confirmed || 0 },
  {
    value: 'checked_in',
    label: t('booking.status.checked_in'),
    count: stats.value.checked_in || 0
  },
  { value: 'completed', label: t('booking.status.completed'), count: stats.value.completed || 0 },
  { value: 'cancelled', label: t('booking.status.cancelled'), count: stats.value.cancelled || 0 }
])

// Stat cards
const statCards = computed(() => [
  {
    key: 'total',
    value: stats.value.total || 0,
    label: t('platformBookings.stats.total'),
    icon: 'calendar_today',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    iconClass: 'text-purple-500',
    filterValue: ''
  },
  {
    key: 'pending',
    value: stats.value.pending || 0,
    label: t('platformBookings.stats.pending'),
    icon: 'schedule',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconClass: 'text-yellow-500',
    filterValue: 'pending'
  },
  {
    key: 'confirmed',
    value: stats.value.confirmed || 0,
    label: t('platformBookings.stats.confirmed'),
    icon: 'check_circle',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    iconClass: 'text-green-500',
    filterValue: 'confirmed'
  },
  {
    key: 'checkedIn',
    value: stats.value.checked_in || 0,
    label: t('platformBookings.stats.checkedIn'),
    icon: 'login',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    iconClass: 'text-blue-500',
    filterValue: 'checked_in'
  },
  {
    key: 'completed',
    value: stats.value.completed || 0,
    label: t('platformBookings.stats.completed'),
    icon: 'task_alt',
    bgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconClass: 'text-indigo-500',
    filterValue: 'completed'
  },
  {
    key: 'revenue',
    value: null,
    label: t('platformBookings.stats.revenue'),
    icon: 'payments',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconClass: 'text-emerald-500',
    filterValue: null,
    currencyField: 'revenueByCurrency'
  },
  {
    key: 'paid',
    value: null,
    label: t('platformBookings.stats.paid'),
    icon: 'price_check',
    bgClass: 'bg-teal-100 dark:bg-teal-900/30',
    iconClass: 'text-teal-500',
    filterValue: null,
    currencyField: 'paidByCurrency'
  }
])

// Debounce timer
let searchTimer = null

onMounted(() => {
  fetchBookings()
  fetchStats()
})

onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
})

// Fetch bookings
const fetchBookings = async () => {
  const params = {
    page: currentPage.value,
    limit: perPage,
    sortBy: sortKey.value,
    sortOrder: sortOrder.value
  }

  if (filters.value.search) params.search = filters.value.search
  if (filters.value.status) params.status = filters.value.status
  if (filters.value.partnerId) params.partnerId = filters.value.partnerId
  if (filters.value.guestName) params.guestName = filters.value.guestName
  if (filters.value.bookingNumber) params.bookingNumber = filters.value.bookingNumber
  if (filters.value.checkInFrom) params.checkInFrom = filters.value.checkInFrom
  if (filters.value.checkInTo) params.checkInTo = filters.value.checkInTo
  if (filters.value.checkOutFrom) params.checkOutFrom = filters.value.checkOutFrom
  if (filters.value.checkOutTo) params.checkOutTo = filters.value.checkOutTo
  if (filters.value.createdFrom) params.createdFrom = filters.value.createdFrom
  if (filters.value.createdTo) params.createdTo = filters.value.createdTo

  await executeLoad(() => platformBookingService.getBookings(params), {
    onSuccess: response => {
      if (response.success) {
        bookings.value = response.data
        totalItems.value = response.pagination?.total || 0
      }
    }
  })
}

// Fetch stats
const fetchStats = async () => {
  const params = {}
  if (filters.value.partnerId) params.partnerId = filters.value.partnerId

  await executeStats(() => platformBookingService.getStats(params), {
    onSuccess: response => {
      if (response.success) {
        stats.value = response.data
      }
    }
  })
}

// Debounced search
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchBookings()
  }, 300)
}

// Set status filter
const setStatusFilter = status => {
  filters.value.status = status
  applyFilters()
}

// Set partner filter
const setPartnerFilter = partnerId => {
  filters.value.partnerId = partnerId
  currentPage.value = 1
  fetchBookings()
  fetchStats()
}

// Clear partner filter
const clearPartnerFilter = () => {
  filters.value.partnerId = ''
  currentPage.value = 1
  fetchBookings()
  fetchStats()
}

// Clear individual filter groups
const clearCheckInFilter = () => {
  filters.value.checkInFrom = ''
  filters.value.checkInTo = ''
  applyFilters()
}

const clearCheckOutFilter = () => {
  filters.value.checkOutFrom = ''
  filters.value.checkOutTo = ''
  applyFilters()
}

const clearCreatedFilter = () => {
  filters.value.createdFrom = ''
  filters.value.createdTo = ''
  applyFilters()
}

// Clear all advanced filters
const clearAllFilters = () => {
  filters.value.guestName = ''
  filters.value.bookingNumber = ''
  filters.value.checkInFrom = ''
  filters.value.checkInTo = ''
  filters.value.checkOutFrom = ''
  filters.value.checkOutTo = ''
  filters.value.createdFrom = ''
  filters.value.createdTo = ''
  currentPage.value = 1
  fetchBookings()
}

// Apply filters
const applyFilters = () => {
  currentPage.value = 1
  fetchBookings()
}

// Handle page change
const handlePageChange = ({ page }) => {
  currentPage.value = page
  fetchBookings()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Handle sort
const handleSort = ({ key, order }) => {
  sortKey.value = key
  sortOrder.value = order
  currentPage.value = 1
  fetchBookings()
}

// Format short date
const formatShortDate = date => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  })
}

// Format time
const formatTime = date => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleTimeString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Source type class
const getSourceClass = type => {
  const classes = {
    b2c: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    b2b: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    pms: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    channel: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  }
  return classes[type] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
}

// Payment status helpers
const getPaymentStatusClass = status => {
  const classes = {
    paid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    partial: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    pending: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
  }
  return classes[status] || classes.pending
}

const getPaymentStatusLabel = status => {
  const labels = {
    paid: t('platformBookings.paymentStatus.paid'),
    partial: t('platformBookings.paymentStatus.partial'),
    pending: t('platformBookings.paymentStatus.pending')
  }
  return labels[status] || status
}
</script>
