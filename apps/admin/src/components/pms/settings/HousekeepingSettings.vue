<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ $t('settings.housekeeping.title') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">
        {{ $t('settings.housekeeping.description') }}
      </p>
    </div>

    <!-- Room Management Section -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white">
            {{ $t('settings.housekeeping.roomManagement') }}
          </h4>
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('settings.housekeeping.roomManagementDesc') }}
          </p>
        </div>
        <button
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
          @click="showAddRoomModal = true"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('settings.housekeeping.addRoom') }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loadingRooms" class="flex items-center justify-center py-8">
        <span class="material-icons animate-spin text-2xl text-indigo-600">refresh</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="rooms.length === 0" class="text-center py-8">
        <span class="material-icons text-4xl text-gray-400 dark:text-slate-500">meeting_room</span>
        <p class="mt-2 text-gray-500 dark:text-slate-400">
          {{ $t('settings.housekeeping.noRooms') }}
        </p>
        <button
          class="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          @click="showAddRoomModal = true"
        >
          {{ $t('settings.housekeeping.addFirstRoom') }}
        </button>
      </div>

      <!-- Rooms by Floor -->
      <div v-else class="space-y-4">
        <div
          v-for="(floorRooms, floor) in roomsByFloor"
          :key="floor"
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden"
        >
          <div
            class="px-4 py-2 bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600"
          >
            <span class="font-medium text-gray-900 dark:text-white">
              {{
                floor === '0'
                  ? $t('settings.housekeeping.groundFloor')
                  : floor + '. ' + $t('settings.housekeeping.floor')
              }}
            </span>
            <span class="ml-2 text-sm text-gray-500 dark:text-slate-400"
              >({{ floorRooms.length }} {{ $t('settings.housekeeping.room') }})</span
            >
          </div>
          <div class="p-3 flex flex-wrap gap-2">
            <div
              v-for="room in floorRooms"
              :key="room._id"
              class="group relative inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm"
            >
              <span class="font-medium text-gray-700 dark:text-gray-300">{{
                room.roomNumber
              }}</span>
              <span v-if="room.roomType?.code" class="text-xs text-gray-500 dark:text-slate-400">
                ({{ room.roomType.code }})
              </span>
              <button
                class="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                :title="$t('settings.housekeeping.deleteRoom')"
                @click="confirmDeleteRoom(room)"
              >
                <span class="material-icons text-sm">close</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Room Count Summary -->
      <div v-if="rooms.length > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
        <p class="text-sm text-gray-600 dark:text-slate-400">
          {{ $t('settings.housekeeping.total') }}
          <span class="font-semibold text-gray-900 dark:text-white">{{ rooms.length }}</span>
          {{ $t('settings.housekeeping.room') }}
        </p>
      </div>
    </div>

    <!-- General Housekeeping Settings -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('settings.housekeeping.generalSettings') }}
      </h4>
      <div class="space-y-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('settings.housekeeping.dailyCleaningTime') }}
            </label>
            <input
              v-model="localSettings.dailyCleaningTime"
              type="time"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              @change="emitChange"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('settings.housekeeping.cleaningPriority') }}
            </label>
            <select
              v-model="localSettings.cleaningPriority"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              @change="emitChange"
            >
              <option value="checkout_first">
                {{ $t('settings.housekeeping.priorityOptions.checkoutFirst') }}
              </option>
              <option value="vip_first">
                {{ $t('settings.housekeeping.priorityOptions.vipFirst') }}
              </option>
              <option value="floor_order">
                {{ $t('settings.housekeeping.priorityOptions.byFloor') }}
              </option>
            </select>
          </div>
        </div>

        <div
          class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-600"
        >
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ $t('settings.housekeeping.autoMarkDirty') }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('settings.housekeeping.autoMarkDirtyDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localSettings.autoMarkDirtyOnCheckout"
              type="checkbox"
              class="sr-only peer"
              @change="emitChange"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
            ></div>
          </label>
        </div>
      </div>
    </div>

    <!-- Cleaning Statuses -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">
          {{ $t('settings.housekeeping.cleaningStatuses') }}
        </h4>
        <button
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
          @click="addCleaningStatus"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('settings.housekeeping.newStatus') }}
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(status, index) in localSettings.cleaningStatuses"
          :key="status._id || index"
          class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600 flex items-center gap-3"
        >
          <input
            v-model="status.color"
            type="color"
            class="w-8 h-8 rounded cursor-pointer"
            @input="emitChange"
          />
          <input
            v-model="status.code"
            type="text"
            :placeholder="$t('settings.housekeeping.code')"
            class="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <input
            v-model="status.name"
            type="text"
            :placeholder="$t('settings.housekeeping.statusName')"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <input
            v-model.number="status.order"
            type="number"
            min="0"
            :placeholder="$t('settings.housekeeping.order')"
            class="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <button
            class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            @click="removeCleaningStatus(index)"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Task Types -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">
          {{ $t('settings.housekeeping.taskTypes') }}
        </h4>
        <button
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
          @click="addTaskType"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('settings.housekeeping.newTask') }}
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(task, index) in localSettings.taskTypes"
          :key="task._id || index"
          class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600 flex items-center gap-3"
        >
          <input
            v-model="task.code"
            type="text"
            :placeholder="$t('settings.housekeeping.code')"
            class="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <input
            v-model="task.name"
            type="text"
            :placeholder="$t('settings.housekeeping.taskName')"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <div class="flex items-center gap-1">
            <input
              v-model.number="task.estimatedMinutes"
              type="number"
              min="1"
              class="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              @input="emitChange"
            />
            <span class="text-xs text-gray-500">{{ $t('settings.housekeeping.duration') }}</span>
          </div>
          <label class="flex items-center">
            <input
              v-model="task.isActive"
              type="checkbox"
              class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              @change="emitChange"
            />
          </label>
          <button
            class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            @click="removeTaskType(index)"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showDeleteModal = false"
    >
      <div class="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {{ $t('settings.housekeeping.deleteRoom') }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{
            $t('settings.housekeeping.deleteRoomConfirm', { roomNumber: roomToDelete?.roomNumber })
          }}
        </p>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
            :disabled="deletingRoom"
            @click="showDeleteModal = false"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            :disabled="deletingRoom"
            @click="deleteRoomConfirmed"
          >
            <span v-if="deletingRoom" class="material-icons animate-spin text-sm">refresh</span>
            {{ $t('common.delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Room Modal -->
    <AddRoomModal
      v-model="showAddRoomModal"
      :hotel-id="hotelId"
      :room-types="roomTypes"
      @created="onRoomCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { usePmsStore } from '@/stores/pms'
import { getRooms, getRoomTypes, deleteRoom } from '@/services/pms/roomService'
import AddRoomModal from '@/components/pms/housekeeping/AddRoomModal.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const { t } = useI18n()
const toast = useToast()
const pmsStore = usePmsStore()
const hotelId = computed(() => pmsStore.hotelId)

// Room management state
const rooms = ref([])
const roomTypes = ref([])
const loadingRooms = ref(false)
const showAddRoomModal = ref(false)
const showDeleteModal = ref(false)
const roomToDelete = ref(null)
const deletingRoom = ref(false)

// Computed: Group rooms by floor
const roomsByFloor = computed(() => {
  const grouped = {}
  rooms.value.forEach(room => {
    const floor = String(room.floor)
    if (!grouped[floor]) {
      grouped[floor] = []
    }
    grouped[floor].push(room)
  })
  // Sort floors numerically
  const sortedFloors = Object.keys(grouped).sort((a, b) => Number(a) - Number(b))
  const result = {}
  sortedFloors.forEach(floor => {
    result[floor] = grouped[floor].sort((a, b) => {
      // Sort rooms by roomNumber naturally
      return String(a.roomNumber || '').localeCompare(String(b.roomNumber || ''), undefined, {
        numeric: true
      })
    })
  })
  return result
})

// Load rooms
const loadRooms = async () => {
  if (!hotelId.value) return

  loadingRooms.value = true
  try {
    const [roomsRes, typesRes] = await Promise.all([
      getRooms(hotelId.value),
      getRoomTypes(hotelId.value)
    ])
    rooms.value = roomsRes.data || []
    roomTypes.value = typesRes.data || []
  } catch (error) {
    console.error('Error loading rooms:', error)
    toast.error(t('settings.housekeeping.roomsLoadError'))
  } finally {
    loadingRooms.value = false
  }
}

// Confirm delete room
const confirmDeleteRoom = room => {
  roomToDelete.value = room
  showDeleteModal.value = true
}

// Delete room confirmed
const deleteRoomConfirmed = async () => {
  if (!roomToDelete.value || !hotelId.value) return

  deletingRoom.value = true
  try {
    await deleteRoom(hotelId.value, roomToDelete.value._id)
    toast.success(
      t('settings.housekeeping.roomDeleted', { roomNumber: roomToDelete.value.roomNumber })
    )
    rooms.value = rooms.value.filter(r => r._id !== roomToDelete.value._id)
    showDeleteModal.value = false
    roomToDelete.value = null
  } catch (error) {
    console.error('Error deleting room:', error)
    toast.error(error.response?.data?.message || t('settings.housekeeping.roomDeleteError'))
  } finally {
    deletingRoom.value = false
  }
}

// On room created
const onRoomCreated = () => {
  loadRooms()
}

// Load rooms on mount
onMounted(() => {
  loadRooms()
})

const localSettings = ref({
  dailyCleaningTime: '10:00',
  autoMarkDirtyOnCheckout: true,
  cleaningPriority: 'checkout_first',
  cleaningStatuses: [],
  taskTypes: [],
  ...props.modelValue
})

watch(
  () => props.modelValue,
  newVal => {
    localSettings.value = { ...localSettings.value, ...newVal }
  },
  { deep: true }
)

const emitChange = () => {
  emit('update:modelValue', localSettings.value)
  emit('change')
}

const addCleaningStatus = () => {
  if (!localSettings.value.cleaningStatuses) {
    localSettings.value.cleaningStatuses = []
  }
  localSettings.value.cleaningStatuses.push({
    code: '',
    name: '',
    color: '#6b7280',
    order: localSettings.value.cleaningStatuses.length
  })
  emitChange()
}

const removeCleaningStatus = index => {
  localSettings.value.cleaningStatuses.splice(index, 1)
  emitChange()
}

const addTaskType = () => {
  if (!localSettings.value.taskTypes) {
    localSettings.value.taskTypes = []
  }
  localSettings.value.taskTypes.push({
    code: '',
    name: '',
    estimatedMinutes: 30,
    isActive: true
  })
  emitChange()
}

const removeTaskType = index => {
  localSettings.value.taskTypes.splice(index, 1)
  emitChange()
}
</script>
