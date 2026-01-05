<template>
  <div class="space-y-6">
    <!-- Action Button -->
    <div class="flex justify-end">
      <button
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        @click="showWalkInModal = true"
      >
        <span class="material-icons text-lg">person_add</span>
        Walk-in
      </button>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div
        v-for="stat in statsCards"
        :key="stat.key"
        class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="material-icons text-xl" :class="stat.iconColor">{{ stat.icon }}</span>
          <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</span>
        </div>
        <p class="text-xs text-gray-500 dark:text-slate-400">{{ stat.label }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- No Hotel Selected -->
    <div
      v-else-if="!hotelId"
      class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center"
    >
      <span class="material-icons text-4xl text-amber-500 mb-2">hotel</span>
      <p class="text-amber-700 dark:text-amber-300">Lutfen ust bardaki seciciden bir otel secin.</p>
    </div>

    <template v-else>
      <!-- Today's Activity Tabs -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700"
      >
        <!-- Tabs -->
        <div class="border-b border-gray-200 dark:border-slate-700">
          <nav class="flex -mb-px">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="px-6 py-3 text-sm font-medium border-b-2 transition-colors"
              :class="
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              "
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
              <span
                v-if="tab.count > 0"
                class="ml-2 px-2 py-0.5 rounded-full text-xs"
                :class="
                  activeTab === tab.key
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                "
              >
                {{ tab.count }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-4">
          <!-- Expected Arrivals -->
          <div v-if="activeTab === 'arrivals'">
            <div v-if="todayActivity.expectedArrivals?.length === 0" class="text-center py-8">
              <span class="material-icons text-4xl text-gray-300 dark:text-gray-600"
                >flight_land</span
              >
              <p class="mt-2 text-gray-500 dark:text-slate-400">Bugun beklenen giris yok</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="item in todayActivity.expectedArrivals"
                :key="item._id"
                class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
                  >
                    <span class="material-icons text-blue-600 dark:text-blue-400">person</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ getGuestName(item) }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-slate-400">
                      {{ item.bookingNumber || item.stayNumber }} - Oda
                      {{ item.room?.roomNumber || 'Atanmadi' }} -
                      {{ item.roomType?.name?.tr || item.roomType?.code }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500 dark:text-slate-400">
                    {{ item.nights }} gece
                  </span>
                  <button
                    class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    @click="openCheckInModal(item)"
                  >
                    Check-in
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pending Checkouts -->
          <div v-if="activeTab === 'departures'">
            <div v-if="todayActivity.pendingCheckOuts?.length === 0" class="text-center py-8">
              <span class="material-icons text-4xl text-gray-300 dark:text-gray-600"
                >flight_takeoff</span
              >
              <p class="mt-2 text-gray-500 dark:text-slate-400">Bugun beklenen cikis yok</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="stay in todayActivity.pendingCheckOuts"
                :key="stay._id"
                class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center"
                  >
                    <span class="material-icons text-orange-600 dark:text-orange-400">logout</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ stay.guests?.[0]?.firstName }} {{ stay.guests?.[0]?.lastName }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-slate-400">
                      Oda {{ stay.room?.roomNumber }} - {{ stay.stayNumber }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-right">
                    <p
                      class="text-sm font-medium"
                      :class="stay.balance > 0 ? 'text-red-600' : 'text-green-600'"
                    >
                      {{ formatCurrency(stay.balance) }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-slate-400">Bakiye</p>
                  </div>
                  <button
                    class="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                    @click="openCheckOutModal(stay)"
                  >
                    Check-out
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Stays -->
          <div v-if="activeTab === 'inhouse'">
            <DataTable
              :data="activeStays"
              :columns="activeStaysColumns"
              :loading="false"
              :show-header="false"
              :show-pagination="false"
              responsive
              card-title-key="stayNumber"
              empty-icon="hotel"
              empty-text="Aktif konaklama yok"
            >
              <template #cell-room="{ row }">
                <span class="font-medium text-gray-900 dark:text-white">{{
                  row.room?.roomNumber
                }}</span>
                <span class="text-xs text-gray-500 dark:text-slate-400 ml-1">{{
                  row.roomType?.code
                }}</span>
              </template>

              <template #cell-guest="{ row }">
                <p class="text-gray-900 dark:text-white">
                  {{ row.guests?.[0]?.firstName }} {{ row.guests?.[0]?.lastName }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">{{ row.stayNumber }}</p>
              </template>

              <template #cell-checkInDate="{ row }">
                <span class="text-sm text-gray-600 dark:text-slate-300">
                  {{ formatDate(row.checkInDate) }}
                </span>
              </template>

              <template #cell-checkOutDate="{ row }">
                <span class="text-sm text-gray-600 dark:text-slate-300">
                  {{ formatDate(row.checkOutDate) }}
                </span>
              </template>

              <template #cell-nights="{ row }">
                <span class="text-sm text-gray-600 dark:text-slate-300">
                  {{ row.nights }}
                </span>
              </template>

              <template #cell-balance="{ row }">
                <span
                  class="text-sm font-medium"
                  :class="row.balance > 0 ? 'text-red-600' : 'text-green-600'"
                >
                  {{ formatCurrency(row.balance) }}
                </span>
              </template>

              <template #row-actions="{ row }">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                    title="Detay"
                    @click="openStayDetail(row)"
                  >
                    <span class="material-icons text-lg">visibility</span>
                  </button>
                  <button
                    class="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded transition-colors"
                    title="Check-out"
                    @click="openCheckOutModal(row)"
                  >
                    <span class="material-icons text-lg">logout</span>
                  </button>
                </div>
              </template>
            </DataTable>
          </div>

          <!-- Today's Check-ins -->
          <div v-if="activeTab === 'today_checkins'">
            <div v-if="todayActivity.todayCheckIns?.length === 0" class="text-center py-8">
              <span class="material-icons text-4xl text-gray-300 dark:text-gray-600">login</span>
              <p class="mt-2 text-gray-500 dark:text-slate-400">Bugun yapilan check-in yok</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="stay in todayActivity.todayCheckIns"
                :key="stay._id"
                class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
                  >
                    <span class="material-icons text-green-600 dark:text-green-400"
                      >check_circle</span
                    >
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ stay.guests?.[0]?.firstName }} {{ stay.guests?.[0]?.lastName }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-slate-400">
                      Oda {{ stay.room?.roomNumber }} - {{ formatTime(stay.actualCheckIn) }}
                    </p>
                  </div>
                </div>
                <span
                  class="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs font-medium rounded"
                >
                  Check-in Yapildi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Walk-in Modal -->
    <WalkInModal v-model="showWalkInModal" :hotel-id="hotelId" @created="handleCheckInComplete" />

    <!-- Check-in Modal -->
    <CheckInModal
      v-model="showCheckInModal"
      :hotel-id="hotelId"
      :booking="selectedBooking"
      @completed="handleCheckInComplete"
    />

    <!-- Check-out Modal -->
    <CheckOutModal
      v-model="showCheckOutModal"
      :hotel-id="hotelId"
      :stay="selectedStay"
      @completed="handleCheckOutComplete"
    />

    <!-- Stay Detail Modal -->
    <StayDetailModal
      v-model="showStayDetailModal"
      :hotel-id="hotelId"
      :stay="selectedStay"
      @updated="fetchData"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useToast } from 'vue-toastification'
import stayService from '@/services/pms/stayService'
import { usePMSSocket } from '@/composables/usePMSSocket'
import { useAccessibility } from '@/composables/useAccessibility'
import { usePmsContextInjection } from '@/composables/usePmsContext'
import DataTable from '@/components/ui/data/DataTable.vue'
import WalkInModal from '@/modules/frontdesk/components/WalkInModal.vue'
import CheckInModal from '@/modules/frontdesk/components/CheckInModal.vue'
import CheckOutModal from '@/modules/frontdesk/components/CheckOutModal.vue'
import StayDetailModal from '@/modules/frontdesk/components/StayDetailModal.vue'

const toast = useToast()
const { hotelId } = usePmsContextInjection()
const { announce } = useAccessibility()

// State
const loading = ref(false)
const activeTab = ref('arrivals')
const statistics = ref({})
const todayActivity = ref({})
const activeStays = ref([])

// Modals
const showWalkInModal = ref(false)
const showCheckInModal = ref(false)
const showCheckOutModal = ref(false)
const showStayDetailModal = ref(false)
const selectedBooking = ref(null)
const selectedStay = ref(null)

// Computed
const tabs = computed(() => [
  {
    key: 'arrivals',
    label: 'Beklenen Girisler',
    count: todayActivity.value.expectedArrivals?.length || 0
  },
  {
    key: 'departures',
    label: 'Beklenen Cikislar',
    count: todayActivity.value.pendingCheckOuts?.length || 0
  },
  { key: 'inhouse', label: 'Aktif Konaklamalar', count: activeStays.value.length },
  {
    key: 'today_checkins',
    label: 'Bugun Check-in',
    count: todayActivity.value.todayCheckIns?.length || 0
  }
])

const activeStaysColumns = computed(() => [
  { key: 'room', label: 'Oda', sortable: false },
  { key: 'guest', label: 'Misafir', sortable: false },
  { key: 'checkInDate', label: 'Giris', sortable: false },
  { key: 'checkOutDate', label: 'Cikis', sortable: false },
  { key: 'nights', label: 'Gece', sortable: false },
  { key: 'balance', label: 'Bakiye', sortable: false }
])

const statsCards = computed(() => [
  {
    key: 'active',
    label: 'Aktif',
    value: statistics.value.activeStays || 0,
    icon: 'hotel',
    iconColor: 'text-blue-500'
  },
  {
    key: 'arrivals',
    label: 'Beklenen Giris',
    value: todayActivity.value.expectedArrivals?.length || 0,
    icon: 'flight_land',
    iconColor: 'text-green-500'
  },
  {
    key: 'departures',
    label: 'Beklenen Cikis',
    value: todayActivity.value.pendingCheckOuts?.length || 0,
    icon: 'flight_takeoff',
    iconColor: 'text-orange-500'
  },
  {
    key: 'available',
    label: 'Musait Oda',
    value: statistics.value.vacantClean || 0,
    icon: 'check_circle',
    iconColor: 'text-emerald-500'
  },
  {
    key: 'dirty',
    label: 'Temizlik Bekliyor',
    value: (statistics.value.vacantDirty || 0) + (statistics.value.checkout || 0),
    icon: 'cleaning_services',
    iconColor: 'text-amber-500'
  },
  {
    key: 'total',
    label: 'Toplam Oda',
    value: statistics.value.total || 0,
    icon: 'meeting_room',
    iconColor: 'text-gray-500'
  }
])

// Helper to get guest name from Booking or Stay object
const getGuestName = item => {
  // If it's a Stay, use guests array
  if (item.guests && item.guests.length > 0) {
    const mainGuest = item.guests.find(g => g.isMainGuest) || item.guests[0]
    if (mainGuest?.firstName) {
      return `${mainGuest.firstName} ${mainGuest.lastName || ''}`.trim()
    }
  }
  // If it's a Booking, use leadGuest
  if (item.leadGuest?.firstName) {
    return `${item.leadGuest.firstName} ${item.leadGuest.lastName || ''}`.trim()
  }
  // Fallback to customerName (legacy)
  if (item.customerName) {
    return item.customerName
  }
  return 'Misafir bilgisi yok'
}

// Methods
const fetchData = async () => {
  if (!hotelId.value) return

  loading.value = true
  try {
    const [statsRes, activityRes, staysRes] = await Promise.all([
      stayService.getFrontDeskStats(hotelId.value),
      stayService.getTodayActivity(hotelId.value),
      stayService.getActiveStays(hotelId.value)
    ])

    statistics.value = statsRes.data || {}
    todayActivity.value = activityRes.data || {}
    activeStays.value = staysRes.data || []
  } catch (error) {
    console.error('Failed to fetch front desk data:', error)
    toast.error('Veriler yuklenemedi')
  } finally {
    loading.value = false
  }
}

const openCheckInModal = booking => {
  selectedBooking.value = booking
  showCheckInModal.value = true
}

const openCheckOutModal = stay => {
  selectedStay.value = stay
  showCheckOutModal.value = true
}

const openStayDetail = stay => {
  selectedStay.value = stay
  showStayDetailModal.value = true
}

const handleCheckInComplete = async () => {
  await fetchData()
}

const handleCheckOutComplete = async () => {
  await fetchData()
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit'
  })
}

const formatTime = date => {
  if (!date) return '-'
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

// Watch hotel changes
watch(
  hotelId,
  newId => {
    if (newId) {
      fetchData()
    } else {
      statistics.value = {}
      todayActivity.value = {}
      activeStays.value = []
    }
  },
  { immediate: true }
)

// Socket.io real-time updates (socket room managed by PMSLayout)
const { onCheckIn, onCheckOut, onRoomStatusChange } = usePMSSocket()

// Store unregister functions for cleanup
const unregisterCallbacks = []

// Handle real-time check-in events
const handleCheckInEvent = data => {
  console.log('[FrontDesk] Real-time check-in:', data)
  toast.success(`Check-in: Oda ${data.roomNumber} - ${data.guestName}`)
  announce(`Check-in yapildi. Oda ${data.roomNumber}, misafir ${data.guestName}`)
  fetchData() // Refresh data
}
unregisterCallbacks.push(onCheckIn(handleCheckInEvent))

// Handle real-time check-out events
const handleCheckOutEvent = data => {
  console.log('[FrontDesk] Real-time check-out:', data)
  toast.info(`Check-out: Oda ${data.roomNumber} - ${data.guestName}`)
  announce(`Check-out yapildi. Oda ${data.roomNumber}, misafir ${data.guestName}`)
  fetchData() // Refresh data
}
unregisterCallbacks.push(onCheckOut(handleCheckOutEvent))

// Handle room status changes
const handleRoomStatusChange = data => {
  console.log('[FrontDesk] Room status change:', data)
  // Refresh stats to update room counts
  fetchData()
}
unregisterCallbacks.push(onRoomStatusChange(handleRoomStatusChange))

// Cleanup callbacks on unmount to prevent duplicates
onUnmounted(() => {
  unregisterCallbacks.forEach(unregister => unregister())
})
</script>
