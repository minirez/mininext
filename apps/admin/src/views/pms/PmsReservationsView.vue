<template>
  <div class="space-y-6">
    <!-- No Hotel Selected Warning -->
    <div
      v-if="!hotelId"
      class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center"
    >
      <span class="material-icons text-4xl text-amber-500 mb-2">domain_disabled</span>
      <p class="font-medium text-amber-800 dark:text-amber-200">{{ $t('pms.noHotelSelected') }}</p>
      <p class="text-sm text-amber-600 dark:text-amber-400 mt-1">
        {{ $t('pms.selectHotelDesc') }}
      </p>
    </div>

    <template v-else>
      <!-- Action Button -->
      <div class="flex justify-end">
        <button
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          @click="showNewReservationModal = true"
        >
          <span class="material-icons text-lg">add</span>
          {{ t('reservations.newReservation') }}
        </button>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-blue-600 dark:text-blue-400">flight_land</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.todayArrivals }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ t('reservations.stats.todayArrivals') }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-orange-600 dark:text-orange-400"
                >flight_takeoff</span
              >
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.todayDepartures }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ t('reservations.stats.todayDepartures') }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-yellow-600 dark:text-yellow-400">pending</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.pendingReservations }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ t('reservations.stats.pending') }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-green-600 dark:text-green-400">event_available</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.upcomingReservations }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ t('reservations.stats.upcoming') }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-indigo-600 dark:text-indigo-400">check_circle</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.confirmedThisMonth }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ t('reservations.stats.confirmedThisMonth') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <div class="flex flex-wrap gap-4">
          <!-- Search -->
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400"
                >search</span
              >
              <input
                v-model="filters.search"
                type="text"
                :placeholder="t('reservations.searchPlaceholder')"
                class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                @input="debouncedFetch"
              />
            </div>
          </div>
          <!-- Status Filter -->
          <div class="w-40">
            <select
              v-model="filters.status"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              @change="fetchReservations"
            >
              <option value="all">{{ t('reservations.status.all') }}</option>
              <option value="pending">{{ t('reservations.status.pending') }}</option>
              <option value="confirmed">{{ t('reservations.status.confirmed') }}</option>
              <option value="cancelled">{{ t('reservations.status.cancelled') }}</option>
              <option value="completed">{{ t('reservations.status.completed') }}</option>
              <option value="no_show">{{ t('reservations.status.noShow') }}</option>
            </select>
          </div>
          <!-- Date Range -->
          <div class="w-40">
            <input
              v-model="filters.startDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              @change="fetchReservations"
            />
          </div>
          <div class="w-40">
            <input
              v-model="filters.endDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              @change="fetchReservations"
            />
          </div>
          <!-- Reset -->
          <button
            class="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
            @click="resetFilters"
          >
            <span class="material-icons">refresh</span>
          </button>
        </div>
      </div>

      <!-- Reservations Table -->
      <DataTable
        :data="reservations"
        :columns="columns"
        :loading="loading"
        :total="pagination.total"
        :page="pagination.page"
        :per-page="pagination.limit"
        :show-header="false"
        responsive
        card-title-key="bookingNumber"
        empty-icon="event_busy"
        :empty-text="t('reservations.noReservations')"
        @page-change="handlePageChange"
        @row-click="openDetail"
      >
        <template #cell-bookingNumber="{ row }">
          <div>
            <span class="font-medium text-indigo-600 dark:text-indigo-400">{{
              row.bookingNumber
            }}</span>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {{ getSourceInfo(row.source).label }}
            </p>
          </div>
        </template>

        <template #cell-createdAt="{ row }">
          <div>
            <p class="text-gray-900 dark:text-white text-sm">
              {{ formatDate(row.createdAt) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ formatTime(row.createdAt) }}
            </p>
          </div>
        </template>

        <template #cell-guest="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ getMainGuestName(row) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ getMainGuestEmail(row) }}
            </p>
          </div>
        </template>

        <template #cell-roomType="{ row }">
          <div>
            <p class="text-gray-900 dark:text-white">
              {{ row.roomTypeName || '-' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ row.adults || 1 }} {{ t('reservations.adults') }}
              <span v-if="row.children">, {{ row.children }} {{ t('reservations.children') }}</span>
            </p>
          </div>
        </template>

        <template #cell-dates="{ row }">
          <div>
            <p class="text-gray-900 dark:text-white">
              {{ formatDate(row.checkIn) }} - {{ formatDate(row.checkOut) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ calculateNights(row.checkIn, row.checkOut) }} {{ t('reservations.nights') }}
            </p>
          </div>
        </template>

        <template #cell-status="{ row }">
          <span
            class="px-2 py-1 rounded-full text-xs font-medium"
            :class="getStatusClasses(row.status)"
          >
            {{ getStatusLabel(row.status) }}
          </span>
        </template>

        <template #cell-paymentStatus="{ row }">
          <div class="text-center">
            <span class="text-xs text-gray-500 dark:text-slate-400">
              {{ getSourceLabel(row) }}
            </span>
          </div>
        </template>

        <template #cell-amount="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(getGrandTotal(row), row.currency) }}
            </p>
            <p
              class="text-xs font-medium"
              :class="
                getRemainingBalance(row) > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              "
            >
              <span v-if="getRemainingBalance(row) > 0">
                {{ t('reservations.remaining') }}:
                {{ formatCurrency(getRemainingBalance(row), row.currency) }}
              </span>
              <span v-else-if="getPaidAmount(row) > 0">
                {{ t('reservations.paid') }}
              </span>
              <span v-else class="text-gray-500 dark:text-slate-400">
                {{ t('reservations.unpaid') }}
              </span>
            </p>
          </div>
        </template>

        <template #row-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <button
              v-if="row.status === 'pending'"
              class="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
              :title="t('reservations.confirm')"
              @click.stop="confirmReservation(row)"
            >
              <span class="material-icons text-lg">check_circle</span>
            </button>
            <button
              v-if="['pending', 'confirmed'].includes(row.status)"
              class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              :title="t('reservations.cancelAction')"
              @click.stop="openCancelModal(row)"
            >
              <span class="material-icons text-lg">cancel</span>
            </button>
            <button
              class="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
              :title="t('reservations.detail')"
              @click.stop="openDetail(row)"
            >
              <span class="material-icons text-lg">visibility</span>
            </button>
          </div>
        </template>

        <template #empty-action>
          <button
            class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            @click="showNewReservationModal = true"
          >
            {{ t('reservations.createReservation') }}
          </button>
        </template>
      </DataTable>

      <!-- Modals -->
      <NewReservationModal
        v-model="showNewReservationModal"
        :hotel-id="hotelId"
        @created="onReservationCreated"
      />

      <ReservationDetailModal
        v-model="showDetailModal"
        :hotel-id="hotelId"
        :reservation="selectedReservation"
        @updated="onReservationUpdated"
      />

      <CancelReservationModal
        v-model="showCancelModal"
        :hotel-id="hotelId"
        :reservation="selectedReservation"
        @cancelled="onReservationCancelled"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import reservationService, {
  RESERVATION_STATUS_INFO,
  PAYMENT_STATUS_INFO,
  BOOKING_SOURCES
} from '@/services/pms/reservationService'
import { usePmsStore } from '@/stores/pms'
import { usePmsSocket } from '@/composables/usePmsSocket'
import DataTable from '@/components/ui/data/DataTable.vue'
import NewReservationModal from '@/components/pms/reservations/NewReservationModal.vue'
import ReservationDetailModal from '@/components/pms/reservations/ReservationDetailModal.vue'
import CancelReservationModal from '@/components/pms/reservations/CancelReservationModal.vue'

const { t, locale } = useI18n()
const localeMap = { tr: 'tr-TR', en: 'en-US' }

const pmsStore = usePmsStore()
const hotelId = computed(() => pmsStore.hotelId)
const toast = useToast()

// Real-time socket updates
usePmsSocket(hotelId, {
  onReservation: () => {
    fetchReservations()
    fetchStats()
  }
})

const loading = ref(false)
const reservations = ref([])
const selectedReservation = ref(null)

const showNewReservationModal = ref(false)
const showDetailModal = ref(false)
const showCancelModal = ref(false)

const stats = ref({
  todayArrivals: 0,
  todayDepartures: 0,
  pendingReservations: 0,
  upcomingReservations: 0,
  confirmedThisMonth: 0
})

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

const filters = ref({
  search: '',
  status: 'all',
  startDate: '',
  endDate: ''
})

const columns = computed(() => [
  { key: 'bookingNumber', label: t('reservations.columns.bookingNumber'), sortable: false },
  { key: 'createdAt', label: t('reservations.columns.createdAt'), sortable: false },
  { key: 'guest', label: t('reservations.columns.guest'), sortable: false },
  { key: 'roomType', label: t('reservations.columns.roomType'), sortable: false },
  { key: 'dates', label: t('reservations.columns.dates'), sortable: false },
  { key: 'status', label: t('reservations.columns.status'), sortable: false },
  { key: 'paymentStatus', label: t('reservations.columns.source'), sortable: false },
  { key: 'amount', label: t('reservations.columns.amountBalance'), sortable: false }
])

// Helper functions for guest data
const getMainGuestName = row => {
  // Find main guest from guests array
  const mainGuest = row.guests?.find(g => g.isMainGuest) || row.guests?.[0]
  if (mainGuest) {
    return `${mainGuest.firstName || ''} ${mainGuest.lastName || ''}`.trim() || '-'
  }
  return '-'
}

const getMainGuestEmail = row => {
  const mainGuest = row.guests?.find(g => g.isMainGuest) || row.guests?.[0]
  return mainGuest?.email || mainGuest?.phone || '-'
}

const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0
  const diff = new Date(checkOut) - new Date(checkIn)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Payment helper functions
const getGrandTotal = row => {
  return row.pricing?.grandTotal || row.pricing?.totalAmount || row.totalAmount || 0
}

const getPaidAmount = row => {
  return row.payment?.paidAmount || 0
}

const getRemainingBalance = row => {
  return getGrandTotal(row) - getPaidAmount(row)
}

const getSourceLabel = row => {
  // Check salesChannel first
  if (row.salesChannel === 'b2b') {
    return row.agencyName || t('reservations.sources.agency')
  }
  if (row.salesChannel === 'direct') {
    return t('reservations.sources.walkIn')
  }
  // Use BOOKING_SOURCES mapping for source
  const sourceInfo = getSourceInfo(row.source)
  return sourceInfo.label
}

let debounceTimer = null
const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchReservations()
  }, 300)
}

const fetchReservations = async () => {
  if (!hotelId.value) return

  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...filters.value
    }
    if (params.status === 'all') delete params.status

    const response = await reservationService.getReservations(hotelId.value, params)
    reservations.value = response.data || []
    pagination.value = response.pagination || pagination.value
  } catch (error) {
    toast.error(t('reservations.messages.loadError'))
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  if (!hotelId.value) return

  try {
    const response = await reservationService.getStats(hotelId.value)
    stats.value = response.data || stats.value
  } catch (error) {
    console.error('Stats fetch failed:', error)
  }
}

const confirmReservation = async reservation => {
  try {
    await reservationService.confirm(hotelId.value, reservation._id)
    toast.success(t('reservations.messages.reservationConfirmed'))
    fetchReservations()
    fetchStats()
  } catch (error) {
    toast.error(error.response?.data?.message || t('reservations.messages.confirmError'))
  }
}

const openDetail = reservation => {
  selectedReservation.value = reservation
  showDetailModal.value = true
}

const openCancelModal = reservation => {
  selectedReservation.value = reservation
  showCancelModal.value = true
}

const handlePageChange = ({ page, perPage }) => {
  pagination.value.page = page
  if (perPage) pagination.value.limit = perPage
  fetchReservations()
}

const resetFilters = () => {
  filters.value = {
    search: '',
    status: 'all',
    startDate: '',
    endDate: ''
  }
  pagination.value.page = 1
  fetchReservations()
}

const onReservationCreated = () => {
  fetchReservations()
  fetchStats()
}

const onReservationUpdated = updatedReservation => {
  // If we received updated reservation data, update local state immediately
  if (updatedReservation) {
    selectedReservation.value = updatedReservation
    // Also update in the list
    const index = reservations.value.findIndex(r => r._id === updatedReservation._id)
    if (index !== -1) {
      reservations.value[index] = updatedReservation
    }
  }
  fetchReservations()
  fetchStats()
}

const onReservationCancelled = () => {
  fetchReservations()
  fetchStats()
}

const getStatusLabel = status => {
  const statusMap = {
    pending: t('reservations.status.pending'),
    confirmed: t('reservations.status.confirmed'),
    cancelled: t('reservations.status.cancelled'),
    completed: t('reservations.status.completed'),
    no_show: t('reservations.status.noShow')
  }
  return statusMap[status] || status
}

const getStatusClasses = status => {
  const info = RESERVATION_STATUS_INFO[status]
  if (!info) return 'bg-gray-100 text-gray-800'
  return `${info.bgColor} ${info.textColor} ${info.darkBgColor} ${info.darkTextColor}`
}

const getPaymentStatusLabel = status => {
  return PAYMENT_STATUS_INFO[status]?.label || status
}

const getPaymentStatusClasses = status => {
  const info = PAYMENT_STATUS_INFO[status]
  if (!info) return 'bg-gray-100 text-gray-800'
  return `${info.bgColor} ${info.textColor}`
}

const getSourceInfo = source => {
  // source can be a string ('walk_in') or an object ({ type: 'admin', channel: 'PMS' })
  const key = typeof source === 'object' && source !== null ? source.type || source.channel : source
  return BOOKING_SOURCES[key] || { label: key || t('reservations.sources.unknown'), icon: 'help' }
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(localeMap[locale.value] || 'tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatTime = date => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString(localeMap[locale.value] || 'tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat(localeMap[locale.value] || 'tr-TR', {
    style: 'currency',
    currency: currency || 'TRY'
  }).format(amount || 0)
}

watch(
  () => hotelId.value,
  () => {
    if (hotelId.value) {
      fetchReservations()
      fetchStats()
    }
  }
)

onMounted(() => {
  if (hotelId.value) {
    fetchReservations()
    fetchStats()
  }
})
</script>
