<template>
  <div class="space-y-6">
    <!-- Welcome Section -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold mb-2">
            Hosgeldiniz, {{ authStore.user?.firstName }}!
          </h1>
          <p class="text-indigo-100">
            {{ hotelName }} - {{ currentDate }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <router-link
            to="/pms/front-desk"
            class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span class="material-icons text-lg">login</span>
            Hizli Check-in
          </router-link>
          <router-link
            to="/pms/reservations"
            class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span class="material-icons text-lg">add</span>
            Yeni Rezervasyon
          </router-link>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="material-icons animate-spin text-4xl text-indigo-600">refresh</span>
    </div>

    <!-- No Hotel Selected -->
    <div v-else-if="!hotelId" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
      <span class="material-icons text-4xl text-amber-500 mb-2">warning</span>
      <p class="text-amber-700 dark:text-amber-300">Lutfen bir otel secin</p>
    </div>

    <template v-else>
      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Today's Arrivals -->
        <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <span class="material-icons text-green-500 text-2xl">flight_land</span>
            <span class="text-xs font-medium text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">Bugun</span>
          </div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ dashboardData.todayArrivals || 0 }}</p>
          <p class="text-sm text-gray-500 dark:text-slate-400">Giris Yapacak</p>
        </div>

        <!-- Today's Departures -->
        <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <span class="material-icons text-red-500 text-2xl">flight_takeoff</span>
            <span class="text-xs font-medium text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">Bugun</span>
          </div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ dashboardData.todayDepartures || 0 }}</p>
          <p class="text-sm text-gray-500 dark:text-slate-400">Cikis Yapacak</p>
        </div>

        <!-- In House -->
        <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <span class="material-icons text-indigo-500 text-2xl">people</span>
            <span class="text-xs font-medium text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded">Su An</span>
          </div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ dashboardData.inHouseGuests || 0 }}</p>
          <p class="text-sm text-gray-500 dark:text-slate-400">Konaklayan Misafir</p>
        </div>

        <!-- Occupancy -->
        <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <span class="material-icons text-amber-500 text-2xl">bed</span>
            <span class="text-xs font-medium text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">Doluluk</span>
          </div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ dashboardData.occupancyRate || 0 }}%</p>
          <p class="text-sm text-gray-500 dark:text-slate-400">Oda Dolulugu</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Revenue Stats -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div class="p-4 border-b border-gray-200 dark:border-slate-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Gelir Ozeti</h2>
          </div>
          <div class="p-6">
            <div class="grid sm:grid-cols-2 gap-6">
              <!-- Today's Revenue -->
              <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <p class="text-sm text-green-600 dark:text-green-400 mb-1">Bugunun Geliri</p>
                <p class="text-2xl font-bold text-green-700 dark:text-green-300">{{ formatCurrency(dashboardData.todayRevenue) }}</p>
              </div>

              <!-- Monthly Revenue -->
              <div class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                <p class="text-sm text-indigo-600 dark:text-indigo-400 mb-1">Aylik Gelir</p>
                <p class="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{{ formatCurrency(dashboardData.monthlyRevenue) }}</p>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ dashboardData.totalRooms || 0 }}</p>
                <p class="text-xs text-gray-500 dark:text-slate-400">Toplam Oda</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ dashboardData.occupiedRooms || 0 }}</p>
                <p class="text-xs text-gray-500 dark:text-slate-400">Dolu Oda</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ availableRooms }}</p>
                <p class="text-xs text-gray-500 dark:text-slate-400">Bos Oda</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Room Status -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div class="p-4 border-b border-gray-200 dark:border-slate-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Oda Durumu</h2>
          </div>
          <div class="p-4 space-y-4">
            <!-- Occupied -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span class="text-sm text-gray-700 dark:text-slate-300">Dolu</span>
              </div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ dashboardData.occupiedRooms || 0 }}</span>
            </div>

            <!-- Available (Clean) -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="text-sm text-gray-700 dark:text-slate-300">Bos (Temiz)</span>
              </div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ housekeepingData.clean || 0 }}</span>
            </div>

            <!-- Dirty -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                <span class="text-sm text-gray-700 dark:text-slate-300">Kirli</span>
              </div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ housekeepingData.dirty || 0 }}</span>
            </div>

            <!-- Out of Order -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                <span class="text-sm text-gray-700 dark:text-slate-300">Arizali</span>
              </div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ housekeepingData.outOfOrder || 0 }}</span>
            </div>

            <!-- Progress Bar -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div class="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden flex" v-if="dashboardData.totalRooms > 0">
                <div class="bg-indigo-500" :style="{ width: `${(dashboardData.occupiedRooms / dashboardData.totalRooms) * 100}%` }"></div>
                <div class="bg-green-500" :style="{ width: `${(housekeepingData.clean / dashboardData.totalRooms) * 100}%` }"></div>
                <div class="bg-amber-500" :style="{ width: `${(housekeepingData.dirty / dashboardData.totalRooms) * 100}%` }"></div>
                <div class="bg-red-500" :style="{ width: `${(housekeepingData.outOfOrder / dashboardData.totalRooms) * 100}%` }"></div>
              </div>
              <p class="text-xs text-gray-500 dark:text-slate-400 text-center mt-2">
                Toplam {{ dashboardData.totalRooms || 0 }} oda
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Today's Arrivals & Departures Lists -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Today's Arrivals Card -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-icons text-green-500">flight_land</span>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Bugun Giris Yapacaklar</h2>
            </div>
            <span class="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
              {{ todayArrivalsList.length }} misafir
            </span>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
            <!-- Loading -->
            <div v-if="arrivalsLoading" class="p-6 text-center">
              <span class="material-icons animate-spin text-2xl text-green-500">refresh</span>
            </div>
            <!-- Empty State -->
            <div v-else-if="todayArrivalsList.length === 0" class="p-6 text-center text-gray-500 dark:text-slate-400">
              <span class="material-icons text-3xl text-gray-300 dark:text-slate-600 mb-2">event_available</span>
              <p class="text-sm">Bugun giris yapacak misafir yok</p>
            </div>
            <!-- Arrivals List -->
            <router-link
              v-else
              v-for="reservation in todayArrivalsList"
              :key="reservation._id"
              :to="`/pms/reservations`"
              class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <span class="material-icons text-green-600 dark:text-green-400 text-lg">person</span>
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">
                    {{ reservation.leadGuest?.firstName }} {{ reservation.leadGuest?.lastName }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-slate-400">
                    {{ reservation.rooms?.[0]?.roomTypeName?.tr || reservation.rooms?.[0]?.roomTypeCode }} •
                    {{ reservation.nights }} gece
                  </p>
                </div>
              </div>
              <div class="text-right flex-shrink-0 ml-3">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ reservation.bookingNumber }}</p>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ reservation.totalAdults }} yetiskin<span v-if="reservation.totalChildren">, {{ reservation.totalChildren }} cocuk</span>
                </p>
              </div>
            </router-link>
          </div>
          <div v-if="todayArrivalsList.length > 0" class="p-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30">
            <router-link to="/pms/front-desk" class="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center justify-center gap-1">
              <span class="material-icons text-sm">login</span>
              Check-in Yap
            </router-link>
          </div>
        </div>

        <!-- Today's Departures Card -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-icons text-red-500">flight_takeoff</span>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Bugun Cikis Yapacaklar</h2>
            </div>
            <span class="text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
              {{ todayDeparturesList.length }} misafir
            </span>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
            <!-- Loading -->
            <div v-if="departuresLoading" class="p-6 text-center">
              <span class="material-icons animate-spin text-2xl text-red-500">refresh</span>
            </div>
            <!-- Empty State -->
            <div v-else-if="todayDeparturesList.length === 0" class="p-6 text-center text-gray-500 dark:text-slate-400">
              <span class="material-icons text-3xl text-gray-300 dark:text-slate-600 mb-2">event_busy</span>
              <p class="text-sm">Bugun cikis yapacak misafir yok</p>
            </div>
            <!-- Departures List -->
            <router-link
              v-else
              v-for="reservation in todayDeparturesList"
              :key="reservation._id"
              :to="`/pms/reservations`"
              class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <span class="material-icons text-red-600 dark:text-red-400 text-lg">person</span>
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">
                    {{ reservation.leadGuest?.firstName }} {{ reservation.leadGuest?.lastName }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-slate-400">
                    {{ reservation.rooms?.[0]?.roomTypeName?.tr || reservation.rooms?.[0]?.roomTypeCode }} •
                    {{ formatDate(reservation.checkIn) }} - {{ formatDate(reservation.checkOut) }}
                  </p>
                </div>
              </div>
              <div class="text-right flex-shrink-0 ml-3">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ reservation.bookingNumber }}</p>
                <span
                  class="inline-block px-2 py-0.5 text-xs rounded-full"
                  :class="reservation.payment?.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'"
                >
                  {{ reservation.payment?.status === 'paid' ? 'Odendi' : 'Odeme Bekliyor' }}
                </span>
              </div>
            </router-link>
          </div>
          <div v-if="todayDeparturesList.length > 0" class="p-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30">
            <router-link to="/pms/front-desk" class="text-sm text-red-600 dark:text-red-400 hover:underline flex items-center justify-center gap-1">
              <span class="material-icons text-sm">logout</span>
              Check-out Yap
            </router-link>
          </div>
        </div>
      </div>

      <!-- Pending Tasks -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
        <div class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Bekleyen Islemler</h2>
          <span class="text-xs font-medium text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
            {{ totalPending }} bekleyen
          </span>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-slate-700">
          <!-- Pending Check-ins -->
          <router-link to="/pms/front-desk" class="p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ dashboardData.todayArrivals || 0 }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Bekleyen Check-in</p>
          </router-link>

          <!-- Pending Check-outs -->
          <router-link to="/pms/front-desk" class="p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <p class="text-3xl font-bold text-red-600 dark:text-red-400">{{ dashboardData.todayDepartures || 0 }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Bekleyen Check-out</p>
          </router-link>

          <!-- Housekeeping -->
          <router-link to="/pms/housekeeping" class="p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <p class="text-3xl font-bold text-amber-600 dark:text-amber-400">{{ housekeepingData.dirty || 0 }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Temizlik Bekleyen</p>
          </router-link>

          <!-- Reserved -->
          <router-link to="/pms/reservations" class="p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{{ dashboardData.pendingReservations || 0 }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Onay Bekleyen</p>
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { getDashboardReport } from '@/services/pms/reportsService'
import reservationService from '@/services/pms/reservationService'
import { usePMSSocket } from '@/composables/usePMSSocket'
import { usePmsContextInjection } from '@/composables/usePmsContext'

const authStore = useAuthStore()
const { hotelId, currentHotel } = usePmsContextInjection()
const toast = useToast()

// Socket.io real-time updates (socket room managed by PMSLayout)
const { onReservation, onCheckIn, onCheckOut } = usePMSSocket()

// Handle real-time events
let unsubscribers = []
const setupSocketListeners = () => {
  // Reservation events
  unsubscribers.push(onReservation((data) => {
    if (data.action === 'created') {
      toast.info(`Yeni rezervasyon: ${data.bookingNumber}`, { timeout: 5000 })
    }
    fetchAllData() // Refresh all data
  }))

  // Check-in events
  unsubscribers.push(onCheckIn((data) => {
    toast.success(`Check-in: Oda ${data.roomNumber} - ${data.guestName}`, { timeout: 4000 })
    fetchAllData()
  }))

  // Check-out events
  unsubscribers.push(onCheckOut((data) => {
    toast.info(`Check-out: Oda ${data.roomNumber}`, { timeout: 4000 })
    fetchAllData()
  }))
}

onUnmounted(() => {
  unsubscribers.forEach(unsub => unsub && unsub())
})

// State
const loading = ref(false)
const dashboardData = ref({
  totalRooms: 0,
  occupiedRooms: 0,
  todayArrivals: 0,
  todayDepartures: 0,
  inHouseGuests: 0,
  occupancyRate: 0,
  todayRevenue: 0,
  monthlyRevenue: 0,
  pendingReservations: 0
})

const housekeepingData = ref({
  clean: 0,
  dirty: 0,
  inspected: 0,
  inProgress: 0,
  outOfOrder: 0
})

// Today's arrivals and departures lists
const todayArrivalsList = ref([])
const todayDeparturesList = ref([])
const arrivalsLoading = ref(false)
const departuresLoading = ref(false)

// Hotel name
const hotelName = computed(() => {
  const hotel = currentHotel.value
  if (!hotel) return 'PMS'
  return hotel.name?.tr || hotel.name?.en || hotel.name || 'Isimsiz Otel'
})

// Current date
const currentDate = computed(() => {
  return new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Available rooms
const availableRooms = computed(() => {
  return (dashboardData.value.totalRooms || 0) - (dashboardData.value.occupiedRooms || 0)
})

// Total pending
const totalPending = computed(() => {
  return (dashboardData.value.todayArrivals || 0) +
    (dashboardData.value.todayDepartures || 0) +
    (housekeepingData.value.dirty || 0) +
    (dashboardData.value.pendingReservations || 0)
})

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount || 0)
}

// Format date
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit'
  })
}

// Fetch dashboard data
const fetchDashboard = async () => {
  if (!hotelId.value) return

  loading.value = true
  try {
    const response = await getDashboardReport(hotelId.value)
    if (response.success && response.data) {
      const data = response.data

      // Map nested API response to flat structure
      dashboardData.value = {
        totalRooms: data.occupancy?.totalRooms || 0,
        occupiedRooms: data.occupancy?.occupiedRooms || 0,
        todayArrivals: data.movements?.todayArrivals || 0,
        todayDepartures: data.movements?.todayDepartures || 0,
        inHouseGuests: data.guests?.total || 0,
        occupancyRate: data.occupancy?.occupancyRate || 0,
        todayRevenue: data.revenue?.today || 0,
        monthlyRevenue: data.revenue?.monthly || 0,
        pendingReservations: data.pendingReservations || 0
      }

      // Map housekeeping data
      if (data.housekeeping) {
        housekeepingData.value = {
          clean: data.housekeeping.clean || 0,
          dirty: data.housekeeping.dirty || 0,
          inspected: data.housekeeping.inspected || 0,
          inProgress: data.housekeeping.inProgress || 0,
          outOfOrder: data.housekeeping.outOfOrder || 0
        }
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard:', error)
  } finally {
    loading.value = false
  }
}

// Fetch today's arrivals
const fetchTodayArrivals = async () => {
  if (!hotelId.value) return

  arrivalsLoading.value = true
  try {
    const response = await reservationService.getTodayArrivals(hotelId.value)
    todayArrivalsList.value = response.data || []
  } catch (error) {
    console.error('Error fetching arrivals:', error)
  } finally {
    arrivalsLoading.value = false
  }
}

// Fetch today's departures
const fetchTodayDepartures = async () => {
  if (!hotelId.value) return

  departuresLoading.value = true
  try {
    const response = await reservationService.getTodayDepartures(hotelId.value)
    todayDeparturesList.value = response.data || []
  } catch (error) {
    console.error('Error fetching departures:', error)
  } finally {
    departuresLoading.value = false
  }
}

// Fetch all data
const fetchAllData = () => {
  fetchDashboard()
  fetchTodayArrivals()
  fetchTodayDepartures()
}

// Watch hotel changes
watch(hotelId, (newId) => {
  if (newId) {
    fetchAllData()
  }
}, { immediate: true })

onMounted(() => {
  // Setup real-time socket listeners
  setupSocketListeners()

  if (hotelId.value) {
    fetchAllData()
  }
})
</script>
