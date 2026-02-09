<template>
  <div class="space-y-6">
    <!-- Statistics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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

    <!-- Filters -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
    >
      <div class="flex flex-wrap items-center gap-3">
        <!-- Floor Filter -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-slate-400"
            >{{ t('housekeeping.filters.floor') }}:</span
          >
          <select
            v-model="filters.floor"
            class="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-gray-700 dark:text-slate-300"
          >
            <option :value="null">{{ t('housekeeping.filters.allFloors') }}</option>
            <option v-for="floor in floors" :key="floor" :value="floor">
              {{ t('housekeeping.floorNumber', { floor }) }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-slate-400"
            >{{ t('housekeeping.filters.status') }}:</span
          >
          <select
            v-model="filters.status"
            class="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-gray-700 dark:text-slate-300"
          >
            <option :value="null">{{ t('housekeeping.filters.allStatuses') }}</option>
            <option v-for="(info, key) in ROOM_STATUS_INFO" :key="key" :value="key">
              {{ t(`housekeeping.roomStatus.${key}`) }}
            </option>
          </select>
        </div>

        <!-- Room Type Filter -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-slate-400"
            >{{ t('housekeeping.filters.roomType') }}:</span
          >
          <select
            v-model="filters.roomType"
            class="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-gray-700 dark:text-slate-300"
          >
            <option :value="null">{{ t('housekeeping.filters.allTypes') }}</option>
            <option v-for="rt in roomTypes" :key="rt._id" :value="rt._id">
              {{ rt.name?.[locale] || rt.name?.tr || rt.name?.en || rt.code }}
            </option>
          </select>
        </div>

        <!-- View Mode -->
        <div class="ml-auto flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            class="p-1.5 rounded transition-colors"
            :class="
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            "
            @click="viewMode = 'grid'"
          >
            <span class="material-icons text-lg">grid_view</span>
          </button>
          <button
            class="p-1.5 rounded transition-colors"
            :class="
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            "
            @click="viewMode = 'list'"
          >
            <span class="material-icons text-lg">view_list</span>
          </button>
        </div>
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
      <p class="text-amber-700 dark:text-amber-300">{{ t('housekeeping.selectHotelMessage') }}</p>
    </div>

    <!-- No Rooms -->
    <div
      v-else-if="filteredRooms.length === 0 && !loading"
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center"
    >
      <div
        class="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <span class="material-icons text-3xl text-gray-400">meeting_room</span>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('housekeeping.noRoomsFound') }}
      </h3>
      <p class="text-gray-500 dark:text-slate-400">
        {{
          rooms.length === 0 ? t('housekeeping.noRoomsAdded') : t('housekeeping.noMatchingRooms')
        }}
      </p>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="space-y-6">
      <div
        v-for="floor in sortedFloors"
        :key="floor"
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <!-- Floor Header -->
        <div
          class="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
        >
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ t('housekeeping.floorNumber', { floor }) }}
          </h3>
          <span class="text-sm text-gray-500 dark:text-slate-400">
            {{ t('housekeeping.roomCount', { count: getRoomsByFloor(floor).length }) }}
          </span>
        </div>

        <!-- Rooms Grid -->
        <div
          class="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3"
        >
          <div
            v-for="room in getRoomsByFloor(floor)"
            :key="room._id"
            class="relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-lg"
            :class="getRoomCardClasses(room)"
            @click="openRoomDetail(room)"
          >
            <!-- Room Number -->
            <div class="text-center">
              <span class="text-lg font-bold text-gray-900 dark:text-white">{{
                room.roomNumber
              }}</span>
            </div>

            <!-- Status Icon -->
            <div class="absolute top-1 right-1">
              <span
                class="material-icons text-sm"
                :class="ROOM_STATUS_INFO[room.status]?.textColor"
              >
                {{ ROOM_STATUS_INFO[room.status]?.icon }}
              </span>
            </div>

            <!-- Room Type Code -->
            <div class="text-center mt-1">
              <span class="text-xs text-gray-500 dark:text-slate-400">
                {{ room.roomType?.code }}
              </span>
            </div>

            <!-- Guest indicator for occupied rooms -->
            <div
              v-if="room.status === 'occupied' && room.currentGuests?.length"
              class="text-center mt-1"
            >
              <span class="text-xs text-blue-600 dark:text-blue-400 truncate block">
                {{ room.currentGuests[0]?.lastName }}
              </span>
            </div>

            <!-- Priority indicator -->
            <div v-if="room.housekeepingPriority === 'urgent'" class="absolute top-1 left-1">
              <span class="material-icons text-sm text-red-500 animate-pulse">priority_high</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div
      v-else
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-slate-700/50">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
            >
              {{ t('housekeeping.table.room') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
            >
              {{ t('housekeeping.table.type') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
            >
              {{ t('housekeeping.table.status') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
            >
              {{ t('housekeeping.table.housekeeping') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
            >
              {{ t('housekeeping.table.guest') }}
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
            >
              {{ t('housekeeping.table.assignee') }}
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
            >
              {{ t('housekeeping.table.actions') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
          <tr
            v-for="room in filteredRooms"
            :key="room._id"
            class="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
            @click="openRoomDetail(room)"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-white">{{ room.roomNumber }}</span>
                <span class="text-xs text-gray-500 dark:text-slate-400">{{
                  t('housekeeping.floorNumber', { floor: room.floor })
                }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
              {{ room.roomType?.name?.[locale] || room.roomType?.name?.tr || room.roomType?.code }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                :class="[
                  ROOM_STATUS_INFO[room.status]?.bgColor,
                  ROOM_STATUS_INFO[room.status]?.textColor
                ]"
              >
                <span class="material-icons text-sm">{{
                  ROOM_STATUS_INFO[room.status]?.icon
                }}</span>
                {{ t(`housekeeping.roomStatus.${room.status}`) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="[
                  HOUSEKEEPING_STATUS_INFO[room.housekeepingStatus]?.bgColor,
                  HOUSEKEEPING_STATUS_INFO[room.housekeepingStatus]?.textColor
                ]"
              >
                {{ t(`housekeeping.housekeepingStatus.${room.housekeepingStatus}`) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
              <template v-if="room.currentGuests?.length">
                {{ room.currentGuests[0]?.firstName }} {{ room.currentGuests[0]?.lastName }}
              </template>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
              <template v-if="room.assignedHousekeeper">
                {{ room.assignedHousekeeper.firstName }} {{ room.assignedHousekeeper.lastName }}
              </template>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                class="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                @click.stop="openStatusModal(room)"
              >
                <span class="material-icons text-lg">edit</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Room Detail/Status Modal -->
    <RoomStatusModal
      v-model="showStatusModal"
      :room="selectedRoom"
      :hotel-id="hotelId"
      @updated="handleRoomUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import roomService, {
  ROOM_STATUS,
  ROOM_STATUS_INFO,
  HOUSEKEEPING_STATUS_INFO
} from '@/services/pms/roomService'
import * as roomServiceModule from '@/services/pms/roomService'
import { useToast } from 'vue-toastification'
import { usePmsStore } from '@/stores/pms'
import { usePmsSocket } from '@/composables/usePmsSocket'
import RoomStatusModal from '@/components/pms/housekeeping/RoomStatusModal.vue'

const { t, locale } = useI18n()
const localeMap = { tr: 'tr-TR', en: 'en-US' }
const toast = useToast()
const pmsStore = usePmsStore()
const hotelId = computed(() => pmsStore.hotelId)

// State
const loading = ref(false)
const rooms = ref([])
const roomTypes = ref([])
const statistics = ref(null)
const viewMode = ref('grid')
const showStatusModal = ref(false)
const selectedRoom = ref(null)

// Filters
const filters = ref({
  floor: null,
  status: null,
  roomType: null
})

// Computed
const floors = computed(() => {
  const floorSet = new Set(rooms.value.map(r => r.floor))
  return Array.from(floorSet).sort((a, b) => a - b)
})

const sortedFloors = computed(() => {
  if (filters.value.floor !== null) {
    return [filters.value.floor]
  }
  return floors.value
})

const filteredRooms = computed(() => {
  let result = rooms.value

  if (filters.value.floor !== null) {
    result = result.filter(r => r.floor === filters.value.floor)
  }

  if (filters.value.status) {
    result = result.filter(r => r.status === filters.value.status)
  }

  if (filters.value.roomType) {
    result = result.filter(r => r.roomType?._id === filters.value.roomType)
  }

  return result.sort((a, b) => {
    if (a.floor !== b.floor) return a.floor - b.floor
    return String(a.roomNumber || '').localeCompare(String(b.roomNumber || ''), undefined, {
      numeric: true
    })
  })
})

const statsCards = computed(() => {
  const stats = statistics.value || {}
  return [
    {
      key: 'total',
      label: t('housekeeping.stats.total'),
      value: stats.total || 0,
      icon: 'meeting_room',
      iconColor: 'text-gray-500'
    },
    {
      key: 'occupied',
      label: t('housekeeping.stats.occupied'),
      value: stats.occupied || 0,
      icon: 'person',
      iconColor: 'text-blue-500'
    },
    {
      key: 'vacantClean',
      label: t('housekeeping.stats.vacantClean'),
      value: stats.vacantClean || 0,
      icon: 'check_circle',
      iconColor: 'text-green-500'
    },
    {
      key: 'vacantDirty',
      label: t('housekeeping.stats.vacantDirty'),
      value: stats.vacantDirty || 0,
      icon: 'cleaning_services',
      iconColor: 'text-amber-500'
    },
    {
      key: 'checkout',
      label: t('housekeeping.stats.checkout'),
      value: stats.checkout || 0,
      icon: 'logout',
      iconColor: 'text-orange-500'
    },
    {
      key: 'maintenance',
      label: t('housekeeping.stats.maintenance'),
      value: stats.maintenance || 0,
      icon: 'build',
      iconColor: 'text-purple-500'
    },
    {
      key: 'outOfOrder',
      label: t('housekeeping.stats.outOfOrder'),
      value: stats.outOfOrder || 0,
      icon: 'block',
      iconColor: 'text-red-500'
    }
  ]
})

// Methods
const getRoomsByFloor = floor => {
  return filteredRooms.value.filter(r => r.floor === floor)
}

const getRoomCardClasses = room => {
  const statusInfo = ROOM_STATUS_INFO[room.status]
  const baseClasses = statusInfo?.bgColor || 'bg-gray-100 dark:bg-slate-700'

  let borderColor = 'border-gray-200 dark:border-slate-600'
  if (room.status === ROOM_STATUS.OCCUPIED) {
    borderColor = 'border-blue-300 dark:border-blue-700'
  } else if (room.status === ROOM_STATUS.VACANT_CLEAN || room.status === ROOM_STATUS.INSPECTED) {
    borderColor = 'border-green-300 dark:border-green-700'
  } else if (room.status === ROOM_STATUS.VACANT_DIRTY || room.status === ROOM_STATUS.CHECKOUT) {
    borderColor = 'border-amber-300 dark:border-amber-700'
  } else if (room.status === ROOM_STATUS.MAINTENANCE) {
    borderColor = 'border-purple-300 dark:border-purple-700'
  } else if (room.status === ROOM_STATUS.OUT_OF_ORDER) {
    borderColor = 'border-red-300 dark:border-red-700'
  }

  return [baseClasses, borderColor]
}

const openRoomDetail = room => {
  selectedRoom.value = room
  showStatusModal.value = true
}

const openStatusModal = room => {
  selectedRoom.value = room
  showStatusModal.value = true
}

const fetchRooms = async () => {
  if (!hotelId.value) return

  loading.value = true
  try {
    const [roomsRes, statsRes] = await Promise.all([
      roomService.getRooms(hotelId.value),
      roomService.getRoomStatistics(hotelId.value)
    ])

    rooms.value = roomsRes.data || []
    statistics.value = statsRes.data?.summary || {}
  } catch (error) {
    console.error('Failed to fetch rooms:', error)
    toast.error(t('housekeeping.messages.loadError'))
  } finally {
    loading.value = false
  }
}

const fetchRoomTypes = async () => {
  if (!hotelId.value) return

  try {
    const response = await roomServiceModule.getRoomTypes(hotelId.value)
    roomTypes.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch room types:', error)
  }
}

// Helper to refresh data and update selected room
const refreshAndUpdateSelected = async () => {
  await fetchRooms()
  if (selectedRoom.value) {
    const updatedRoom = rooms.value.find(r => r._id === selectedRoom.value._id)
    if (updatedRoom) {
      selectedRoom.value = updatedRoom
    }
  }
}

const handleRoomUpdated = async () => {
  await refreshAndUpdateSelected()
}

// Watch hotel changes
watch(
  hotelId,
  newId => {
    if (newId) {
      fetchRooms()
      fetchRoomTypes()
    } else {
      rooms.value = []
      roomTypes.value = []
      statistics.value = null
    }
  },
  { immediate: true }
)

// Real-time socket updates
usePmsSocket(hotelId, {
  onRoomStatus: () => refreshAndUpdateSelected(),
  onHousekeeping: () => refreshAndUpdateSelected(),
  onCheckIn: () => refreshAndUpdateSelected(),
  onCheckOut: () => refreshAndUpdateSelected()
})
</script>
