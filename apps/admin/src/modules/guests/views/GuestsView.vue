<template>
  <div class="space-y-6">
    <!-- Action Button -->
    <div class="flex justify-end">
      <button
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        @click="showAddModal = true"
      >
        <span class="material-icons text-lg">person_add</span>
        Yeni Misafir
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
            <span class="material-icons text-blue-600 dark:text-blue-400">people</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalGuests }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Toplam Misafir</p>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-purple-600 dark:text-purple-400"
              >workspace_premium</span
            >
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.vipGuests }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">VIP Misafir</p>
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
            <span class="material-icons text-green-600 dark:text-green-400">schedule</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.recentGuests }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Son 30 Gun</p>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-red-600 dark:text-red-400">block</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ stats.blacklistedGuests }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Kara Liste</p>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 col-span-2 md:col-span-1"
      >
        <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-2">
          En Cok Harcayan
        </h4>
        <div v-if="stats.topSpenders?.length > 0" class="space-y-1">
          <div
            v-for="(guest, i) in stats.topSpenders.slice(0, 3)"
            :key="i"
            class="flex justify-between text-sm"
          >
            <span class="text-gray-700 dark:text-gray-300 truncate"
              >{{ guest.firstName }} {{ guest.lastName }}</span
            >
            <span class="text-gray-900 dark:text-white font-medium">{{
              formatCurrency(guest.statistics?.totalSpent)
            }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400">-</p>
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
              placeholder="Ad, soyad, e-posta, telefon, kimlik no..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              @input="debouncedFetch"
            />
          </div>
        </div>
        <!-- VIP Filter -->
        <div class="w-36">
          <select
            v-model="filters.vipLevel"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            @change="fetchGuests"
          >
            <option value="all">Tum VIP</option>
            <option value="none">Standart</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
        <!-- Blacklist Filter -->
        <div class="w-36">
          <select
            v-model="filters.isBlacklisted"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            @change="fetchGuests"
          >
            <option value="">Tum Misafirler</option>
            <option value="false">Normal</option>
            <option value="true">Kara Liste</option>
          </select>
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

    <!-- Guests Table -->
    <DataTable
      :data="guests"
      :columns="columns"
      :loading="loading"
      :total="pagination.total"
      :page="pagination.page"
      :per-page="pagination.limit"
      :show-header="false"
      responsive
      card-title-key="firstName"
      empty-icon="person_off"
      empty-text="Misafir bulunamadi"
      @page-change="handlePageChange"
      @row-click="openDetail"
    >
      <template #cell-guest="{ row }">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
            :class="row.isBlacklisted ? 'bg-red-500' : 'bg-indigo-500'"
          >
            {{ getInitials(row) }}
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ row.firstName }} {{ row.lastName }}
              <span v-if="row.isBlacklisted" class="ml-1 text-red-500">
                <span class="material-icons text-sm align-middle">block</span>
              </span>
            </p>
            <p v-if="row.nationality" class="text-xs text-gray-500 dark:text-slate-400">
              {{ row.nationality }}
            </p>
          </div>
        </div>
      </template>

      <template #cell-contact="{ row }">
        <div>
          <p class="text-sm text-gray-900 dark:text-white">{{ row.phone || '-' }}</p>
          <p class="text-xs text-gray-500 dark:text-slate-400">{{ row.email || '-' }}</p>
        </div>
      </template>

      <template #cell-identity="{ row }">
        <div>
          <p class="text-sm text-gray-900 dark:text-white">{{ row.idNumber || '-' }}</p>
          <p class="text-xs text-gray-500 dark:text-slate-400">
            {{ getIdTypeLabel(row.idType) }}
          </p>
        </div>
      </template>

      <template #cell-vipLevel="{ row }">
        <span
          class="px-2 py-1 rounded-full text-xs font-medium"
          :class="getVipClasses(row.vipLevel)"
        >
          {{ getVipLabel(row.vipLevel) }}
        </span>
      </template>

      <template #cell-statistics="{ row }">
        <div>
          <p class="text-sm text-gray-900 dark:text-white">
            {{ row.statistics?.totalStays || 0 }} konaklama
          </p>
          <p class="text-xs text-gray-500 dark:text-slate-400">
            {{ formatCurrency(row.statistics?.totalSpent) }}
          </p>
        </div>
      </template>

      <template #cell-lastStay="{ row }">
        <p class="text-sm text-gray-900 dark:text-white">
          {{ row.statistics?.lastStayDate ? formatDate(row.statistics.lastStayDate) : '-' }}
        </p>
      </template>

      <template #row-actions="{ row }">
        <button
          class="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
          title="Detay"
          @click.stop="openDetail(row)"
        >
          <span class="material-icons text-lg">visibility</span>
        </button>
      </template>

      <template #empty-action>
        <button
          class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          @click="showAddModal = true"
        >
          Yeni Misafir Ekle
        </button>
      </template>
    </DataTable>

    <!-- Modals -->
    <AddGuestModal v-model="showAddModal" :hotel-id="hotelId" @created="onGuestCreated" />

    <GuestDetailModal
      v-model="showDetailModal"
      :hotel-id="hotelId"
      :guest="selectedGuest"
      @updated="onGuestUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import guestService, { VIP_LEVEL_INFO, ID_TYPES } from '@/services/pms/guestService'
import { usePmsContextInjection } from '@/composables/usePmsContext'
import DataTable from '@/components/ui/data/DataTable.vue'
import AddGuestModal from '@/modules/guests/components/AddGuestModal.vue'
import GuestDetailModal from '@/modules/guests/components/GuestDetailModal.vue'

const { hotelId } = usePmsContextInjection()
const toast = useToast()

const loading = ref(false)
const guests = ref([])
const selectedGuest = ref(null)

const showAddModal = ref(false)
const showDetailModal = ref(false)

const stats = ref({
  totalGuests: 0,
  vipGuests: 0,
  blacklistedGuests: 0,
  recentGuests: 0,
  topSpenders: []
})

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

const filters = ref({
  search: '',
  vipLevel: 'all',
  isBlacklisted: ''
})

const columns = computed(() => [
  { key: 'guest', label: 'Misafir', sortable: false },
  { key: 'contact', label: 'Iletisim', sortable: false },
  { key: 'identity', label: 'Kimlik', sortable: false },
  { key: 'vipLevel', label: 'VIP', sortable: false },
  { key: 'statistics', label: 'Istatistik', sortable: false },
  { key: 'lastStay', label: 'Son Konaklama', sortable: false }
])

let debounceTimer = null
const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchGuests()
  }, 300)
}

const fetchGuests = async () => {
  if (!hotelId.value) return

  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...filters.value
    }
    if (params.vipLevel === 'all') delete params.vipLevel
    if (!params.isBlacklisted) delete params.isBlacklisted

    const response = await guestService.getGuests(hotelId.value, params)
    guests.value = response.data || []
    pagination.value = response.pagination || pagination.value
  } catch (error) {
    toast.error('Misafirler yuklenemedi')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  if (!hotelId.value) return

  try {
    const response = await guestService.getStats(hotelId.value)
    stats.value = response.data || stats.value
  } catch (error) {
    console.error('Stats fetch failed:', error)
  }
}

const openDetail = guest => {
  selectedGuest.value = guest
  showDetailModal.value = true
}

const handlePageChange = ({ page, perPage }) => {
  pagination.value.page = page
  if (perPage) pagination.value.limit = perPage
  fetchGuests()
}

const resetFilters = () => {
  filters.value = {
    search: '',
    vipLevel: 'all',
    isBlacklisted: ''
  }
  pagination.value.page = 1
  fetchGuests()
}

const onGuestCreated = () => {
  fetchGuests()
  fetchStats()
}

const onGuestUpdated = () => {
  fetchGuests()
  fetchStats()
}

const getInitials = guest => {
  const first = guest.firstName?.charAt(0) || ''
  const last = guest.lastName?.charAt(0) || ''
  return (first + last).toUpperCase()
}

const getVipLabel = level => {
  return VIP_LEVEL_INFO[level]?.label || 'Standart'
}

const getVipClasses = level => {
  const info = VIP_LEVEL_INFO[level]
  if (!info) return 'bg-gray-100 text-gray-600'
  return `${info.bgColor} ${info.textColor}`
}

const getIdTypeLabel = type => {
  return ID_TYPES.find(t => t.value === type)?.label || type || '-'
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
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
      fetchGuests()
      fetchStats()
    }
  }
)

onMounted(() => {
  if (hotelId.value) {
    fetchGuests()
    fetchStats()
  }
})
</script>
