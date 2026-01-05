<template>
  <div class="space-y-6">
    <!-- Action Button -->
    <div class="flex justify-end">
      <button
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        @click="showNewReservationModal = true"
      >
        <span class="material-icons text-lg">add</span>
        Yeni Rezervasyon
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
            <p class="text-xs text-gray-500 dark:text-slate-400">Bugun Gelis</p>
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
            <span class="material-icons text-orange-600 dark:text-orange-400">flight_takeoff</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ stats.todayDepartures }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Bugun Cikis</p>
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
            <p class="text-xs text-gray-500 dark:text-slate-400">Bekleyen</p>
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
            <p class="text-xs text-gray-500 dark:text-slate-400">Yaklasan (7 gun)</p>
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
            <p class="text-xs text-gray-500 dark:text-slate-400">Bu Ay Onaylanan</p>
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
              placeholder="Rez. no, misafir adi, e-posta..."
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
            <option value="all">Tum Durumlar</option>
            <option value="pending">Bekleyen</option>
            <option value="confirmed">Onaylandi</option>
            <option value="cancelled">Iptal</option>
            <option value="completed">Tamamlandi</option>
            <option value="no_show">Gelmedi</option>
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
      empty-text="Rezervasyon bulunamadi"
      @page-change="handlePageChange"
      @row-click="openDetail"
    >
      <template #cell-bookingNumber="{ row }">
        <div>
          <span class="font-medium text-indigo-600 dark:text-indigo-400">{{
            row.bookingNumber
          }}</span>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {{ getSourceInfo(row.source?.type).label }}
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
            {{ row.leadGuest?.firstName }} {{ row.leadGuest?.lastName }}
          </p>
          <p class="text-xs text-gray-500 dark:text-slate-400">
            {{ row.contact?.email }}
          </p>
        </div>
      </template>

      <template #cell-roomType="{ row }">
        <div>
          <p class="text-gray-900 dark:text-white">
            {{ row.rooms?.[0]?.roomTypeName?.tr || row.rooms?.[0]?.roomTypeCode }}
          </p>
          <p class="text-xs text-gray-500 dark:text-slate-400">
            {{ row.totalAdults }} yetiskin
            <span v-if="row.totalChildren">, {{ row.totalChildren }} cocuk</span>
          </p>
        </div>
      </template>

      <template #cell-dates="{ row }">
        <div>
          <p class="text-gray-900 dark:text-white">
            {{ formatDate(row.checkIn) }} - {{ formatDate(row.checkOut) }}
          </p>
          <p class="text-xs text-gray-500 dark:text-slate-400">
            {{ row.nights }} gece
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
        <span
          class="px-2 py-1 rounded-full text-xs font-medium"
          :class="getPaymentStatusClasses(row.payment?.status)"
        >
          {{ getPaymentStatusLabel(row.payment?.status) }}
        </span>
      </template>

      <template #cell-amount="{ row }">
        <div>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ formatCurrency(row.pricing?.grandTotal) }}
          </p>
          <p v-if="row.payment?.paidAmount > 0" class="text-xs text-green-600">
            {{ formatCurrency(row.payment?.paidAmount) }} odendi
          </p>
        </div>
      </template>

      <template #row-actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <button
            v-if="row.status === 'pending'"
            class="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
            title="Onayla"
            @click.stop="confirmReservation(row)"
          >
            <span class="material-icons text-lg">check_circle</span>
          </button>
          <button
            v-if="['pending', 'confirmed'].includes(row.status)"
            class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Iptal Et"
            @click.stop="openCancelModal(row)"
          >
            <span class="material-icons text-lg">cancel</span>
          </button>
          <button
            class="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
            title="Detay"
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
          Yeni Rezervasyon Olustur
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useToast } from 'vue-toastification'
import reservationService, {
  RESERVATION_STATUS_INFO,
  PAYMENT_STATUS_INFO,
  BOOKING_SOURCES
} from '@/services/pms/reservationService'
import { usePMSSocket } from '@/composables/usePMSSocket'
import { useAccessibility } from '@/composables/useAccessibility'
import { usePmsContextInjection } from '@/composables/usePmsContext'
import DataTable from '@/components/ui/data/DataTable.vue'
import NewReservationModal from '@/modules/reservations/components/NewReservationModal.vue'
import ReservationDetailModal from '@/modules/reservations/components/ReservationDetailModal.vue'
import CancelReservationModal from '@/modules/reservations/components/CancelReservationModal.vue'

const { hotelId } = usePmsContextInjection()
const toast = useToast()
const { announce } = useAccessibility()

// Socket.io real-time updates (socket room managed by PMSLayout)
const { onReservation } = usePMSSocket()

// Handle real-time reservation events from Booking Engine
let unsubscribeReservation = null
const setupReservationListener = () => {
  unsubscribeReservation = onReservation(data => {
    console.log('[Reservations] Real-time update:', data)

    if (data.action === 'created') {
      toast.success(`Yeni rezervasyon: ${data.bookingNumber} - ${data.guestName}`)
      announce(`Yeni rezervasyon alindi. ${data.bookingNumber}, misafir ${data.guestName}`)
    } else if (data.action === 'confirmed') {
      toast.success(`Rezervasyon onaylandi: ${data.bookingNumber}`)
      announce(`Rezervasyon onaylandi. ${data.bookingNumber}`)
    } else if (data.action === 'cancelled') {
      toast.warning(`Rezervasyon iptal edildi: ${data.bookingNumber}`)
      announce(`Rezervasyon iptal edildi. ${data.bookingNumber}`)
    } else if (data.action === 'updated') {
      toast.info(`Rezervasyon guncellendi: ${data.bookingNumber}`)
    }

    // Refresh data
    fetchReservations()
    fetchStats()
  })
}

onUnmounted(() => {
  if (unsubscribeReservation) {
    unsubscribeReservation()
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
  { key: 'bookingNumber', label: 'Rez. No', sortable: false },
  { key: 'createdAt', label: 'Olusturma', sortable: false },
  { key: 'guest', label: 'Misafir', sortable: false },
  { key: 'roomType', label: 'Oda Tipi', sortable: false },
  { key: 'dates', label: 'Tarihler', sortable: false },
  { key: 'status', label: 'Durum', sortable: false },
  { key: 'paymentStatus', label: 'Odeme', sortable: false },
  { key: 'amount', label: 'Tutar', sortable: false }
])

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
    toast.error('Rezervasyonlar yuklenemedi')
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
    toast.success('Rezervasyon onaylandi')
    fetchReservations()
    fetchStats()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Onaylama basarisiz')
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
  return RESERVATION_STATUS_INFO[status]?.label || status
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
  return BOOKING_SOURCES[source] || { label: source || 'Bilinmiyor', icon: 'help' }
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatTime = date => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = amount => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
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
  // Setup real-time socket listener
  setupReservationListener()

  if (hotelId.value) {
    fetchReservations()
    fetchStats()
  }
})
</script>
