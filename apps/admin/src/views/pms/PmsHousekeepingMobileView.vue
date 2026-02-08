<template>
  <div class="min-h-screen bg-gray-100 dark:bg-slate-900 pb-24">
    <!-- Fixed Header -->
    <header class="sticky top-0 z-10 bg-white dark:bg-slate-800 shadow-sm px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="material-icons text-indigo-600 dark:text-indigo-400">cleaning_services</span>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white">
            {{ $t('housekeeping.mobile.title') }}
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-slate-400">{{ userName }}</span>
          <button
            class="p-2 text-gray-500 hover:text-red-500 transition-colors"
            :title="$t('auth.logout')"
            @click="handleLogout"
          >
            <span class="material-icons">logout</span>
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          v-for="filter in filters"
          :key="filter.value"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1"
          :class="
            activeFilter === filter.value
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
          "
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
          <span
            v-if="filter.count > 0"
            class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
            :class="activeFilter === filter.value ? 'bg-white/20' : 'bg-gray-300 dark:bg-slate-600'"
          >
            {{ filter.count }}
          </span>
        </button>
      </div>

      <!-- Hotel Selector (if no hotel selected) -->
      <div v-if="!hotelId" class="mt-3">
        <select
          v-model="selectedHotelId"
          class="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white"
        >
          <option value="">{{ $t('housekeeping.mobile.selectHotel') }}</option>
          <option v-for="hotel in hotels" :key="hotel._id" :value="hotel._id">
            {{ hotel.name?.tr || hotel.name?.en || hotel.name }}
          </option>
        </select>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>

    <!-- No Hotel Selected -->
    <div v-else-if="!hotelId" class="p-4">
      <div
        class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center"
      >
        <span class="material-icons text-5xl text-amber-500 mb-3">hotel</span>
        <p class="text-amber-700 dark:text-amber-300">{{ $t('housekeeping.mobile.noHotel') }}</p>
      </div>
    </div>

    <!-- Room Cards -->
    <div v-else class="p-4 space-y-3">
      <!-- Pull to refresh indicator -->
      <div
        v-if="isRefreshing"
        class="flex items-center justify-center py-2 text-indigo-600 dark:text-indigo-400"
      >
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
        <span class="text-sm">{{ $t('housekeeping.mobile.refreshing') }}</span>
      </div>

      <TransitionGroup name="room-list" tag="div" class="space-y-3">
        <div
          v-for="room in filteredRooms"
          :key="room._id"
          class="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden"
        >
          <!-- Room Header -->
          <div
            class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700"
          >
            <div class="flex items-center gap-3">
              <!-- Room Number Badge -->
              <div
                class="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
                :class="getStatusBgClass(room.housekeepingStatus)"
              >
                {{ room.roomNumber }}
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ room.roomType?.name?.tr || room.roomType?.name?.en || room.roomType?.code }}
                </p>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('housekeeping.mobile.floor') }} {{ room.floor }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <!-- Status Badge -->
              <span
                class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                :class="getStatusBadgeClass(room.status)"
              >
                <span class="material-icons text-sm">{{ getStatusIcon(room.status) }}</span>
                {{ getStatusLabel(room.status) }}
              </span>
              <!-- Priority Indicator -->
              <p
                v-if="
                  room.housekeepingPriority === 'urgent' || room.housekeepingPriority === 'high'
                "
                class="text-xs mt-1 flex items-center justify-end gap-1"
                :class="room.housekeepingPriority === 'urgent' ? 'text-red-500' : 'text-amber-500'"
              >
                <span class="material-icons text-sm">priority_high</span>
                {{ $t('housekeeping.mobile.priority') }}
              </p>
            </div>
          </div>

          <!-- Room Info (if has guest or notes) -->
          <div
            v-if="room.currentGuests?.length || room.housekeepingNotes"
            class="px-4 py-2 bg-gray-50 dark:bg-slate-700/50"
          >
            <p
              v-if="room.currentGuests?.length"
              class="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1"
            >
              <span class="material-icons text-sm">person</span>
              {{ room.currentGuests[0]?.firstName }} {{ room.currentGuests[0]?.lastName }}
            </p>
            <p
              v-if="room.housekeepingNotes"
              class="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1"
            >
              <span class="material-icons text-sm">note</span>
              {{ room.housekeepingNotes }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-2 p-3">
            <!-- Start Cleaning (for dirty rooms) -->
            <button
              v-if="room.housekeepingStatus === 'dirty'"
              :disabled="actionLoading === room._id"
              class="flex items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-lg transition-colors disabled:opacity-50"
              @click="startCleaning(room)"
            >
              <span class="material-icons">cleaning_services</span>
              {{ $t('housekeeping.mobile.startCleaning') }}
            </button>

            <!-- Mark as Clean (for in-progress rooms) -->
            <button
              v-if="
                room.housekeepingStatus === 'cleaning' || room.housekeepingStatus === 'in_progress'
              "
              :disabled="actionLoading === room._id"
              class="flex items-center justify-center gap-2 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium text-lg transition-colors disabled:opacity-50"
              @click="markAsClean(room)"
            >
              <span class="material-icons">check_circle</span>
              {{ $t('housekeeping.mobile.markClean') }}
            </button>

            <!-- Add Note Button -->
            <button
              class="flex items-center justify-center gap-2 py-4 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors hover:bg-gray-300 dark:hover:bg-slate-500"
              :class="{
                'col-span-2':
                  room.housekeepingStatus === 'clean' || room.housekeepingStatus === 'inspected'
              }"
              @click="openNotes(room)"
            >
              <span class="material-icons">edit_note</span>
              {{ $t('housekeeping.mobile.addNote') }}
            </button>

            <!-- Report Issue Button -->
            <button
              v-if="room.housekeepingStatus !== 'out_of_service'"
              class="flex items-center justify-center gap-2 py-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-medium transition-colors hover:bg-red-200 dark:hover:bg-red-900/50"
              @click="reportIssue(room)"
            >
              <span class="material-icons">report_problem</span>
              {{ $t('housekeeping.mobile.reportIssue') }}
            </button>

            <!-- Mark as Dirty (for clean rooms) -->
            <button
              v-if="room.housekeepingStatus === 'clean' || room.housekeepingStatus === 'inspected'"
              :disabled="actionLoading === room._id"
              class="flex items-center justify-center gap-2 py-4 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl font-medium transition-colors hover:bg-amber-200 dark:hover:bg-amber-900/50 col-span-2"
              @click="markAsDirty(room)"
            >
              <span class="material-icons">cleaning_services</span>
              {{ $t('housekeeping.mobile.markDirty') }}
            </button>
          </div>
        </div>
      </TransitionGroup>

      <!-- Empty State -->
      <div v-if="filteredRooms.length === 0 && !loading" class="text-center py-12">
        <span class="material-icons text-6xl text-gray-300 dark:text-slate-600 mb-4"
          >check_circle</span
        >
        <p class="text-gray-500 dark:text-slate-400 text-lg">
          {{ $t('housekeeping.mobile.allClean') }}
        </p>
      </div>
    </div>

    <!-- Notes Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showNotesModal"
          class="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          @click.self="closeNotesModal"
        >
          <div
            class="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-2xl shadow-xl animate-slide-up"
          >
            <div
              class="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
            >
              <h3 class="font-semibold text-gray-900 dark:text-white">
                {{ $t('housekeeping.mobile.notesFor') }} {{ selectedRoom?.roomNumber }}
              </h3>
              <button class="p-2 text-gray-500 hover:text-gray-700" @click="closeNotesModal">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="p-4">
              <textarea
                v-model="notesText"
                :placeholder="$t('housekeeping.mobile.notesPlaceholder')"
                class="w-full h-32 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              ></textarea>
              <div class="flex gap-3 mt-4">
                <button
                  class="flex-1 py-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium"
                  @click="closeNotesModal"
                >
                  {{ $t('common.cancel') }}
                </button>
                <button
                  :disabled="savingNotes"
                  class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50"
                  @click="saveNotes"
                >
                  {{ savingNotes ? $t('common.saving') : $t('common.save') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Issue Report Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showIssueModal"
          class="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          @click.self="closeIssueModal"
        >
          <div
            class="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-2xl shadow-xl animate-slide-up"
          >
            <div
              class="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
            >
              <h3 class="font-semibold text-gray-900 dark:text-white">
                {{ $t('housekeeping.mobile.issueFor') }} {{ selectedRoom?.roomNumber }}
              </h3>
              <button class="p-2 text-gray-500 hover:text-gray-700" @click="closeIssueModal">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="p-4 space-y-4">
              <!-- Issue Type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {{ $t('housekeeping.mobile.issueType') }}
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="issue in issueTypes"
                    :key="issue.value"
                    class="py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors"
                    :class="
                      issueType === issue.value
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300'
                    "
                    @click="issueType = issue.value"
                  >
                    {{ issue.label }}
                  </button>
                </div>
              </div>

              <!-- Issue Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {{ $t('housekeeping.mobile.issueDescription') }}
                </label>
                <textarea
                  v-model="issueDescription"
                  :placeholder="$t('housekeeping.mobile.issueDescPlaceholder')"
                  class="w-full h-24 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                ></textarea>
              </div>

              <div class="flex gap-3">
                <button
                  class="flex-1 py-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium"
                  @click="closeIssueModal"
                >
                  {{ $t('common.cancel') }}
                </button>
                <button
                  :disabled="!issueType || savingIssue"
                  class="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-50"
                  @click="submitIssue"
                >
                  {{ savingIssue ? $t('common.saving') : $t('housekeeping.mobile.submitIssue') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import roomService, { ROOM_STATUS_INFO } from '@/services/pms/roomService'
import { useToast } from 'vue-toastification'
import { usePmsStore } from '@/stores/pms'
import { usePmsSocket } from '@/composables/usePmsSocket'

const { t, locale } = useI18n()
const localeMap = { tr: 'tr-TR', en: 'en-US' }
const router = useRouter()
const toast = useToast()
const pmsStore = usePmsStore()
const hotelId = computed(() => pmsStore.hotelId)
const authStore = useAuthStore()

// State
const loading = ref(false)
const isRefreshing = ref(false)
const rooms = ref([])
const hotels = ref([])
const selectedHotelId = ref('')
const activeFilter = ref('all')
const actionLoading = ref(null)

// Notes Modal
const showNotesModal = ref(false)
const selectedRoom = ref(null)
const notesText = ref('')
const savingNotes = ref(false)

// Issue Modal
const showIssueModal = ref(false)
const issueType = ref('')
const issueDescription = ref('')
const savingIssue = ref(false)

const issueTypes = computed(() => [
  { value: 'maintenance', label: t('housekeeping.mobile.issues.maintenance') },
  { value: 'plumbing', label: t('housekeeping.mobile.issues.plumbing') },
  { value: 'electrical', label: t('housekeeping.mobile.issues.electrical') },
  { value: 'furniture', label: t('housekeeping.mobile.issues.furniture') },
  { value: 'cleaning', label: t('housekeeping.mobile.issues.cleaning') },
  { value: 'other', label: t('housekeeping.mobile.issues.other') }
])

const userName = computed(() => {
  const user = authStore.user
  return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''
})

const summary = computed(() => {
  const dirty = rooms.value.filter(r => r.housekeepingStatus === 'dirty').length
  const cleaning = rooms.value.filter(
    r => r.housekeepingStatus === 'cleaning' || r.housekeepingStatus === 'in_progress'
  ).length
  const clean = rooms.value.filter(
    r => r.housekeepingStatus === 'clean' || r.housekeepingStatus === 'inspected'
  ).length
  return { dirty, cleaning, clean, total: rooms.value.length }
})

const filters = computed(() => [
  { value: 'all', label: t('housekeeping.mobile.all'), count: summary.value.total },
  { value: 'dirty', label: t('housekeeping.mobile.dirty'), count: summary.value.dirty },
  { value: 'cleaning', label: t('housekeeping.mobile.cleaning'), count: summary.value.cleaning },
  { value: 'clean', label: t('housekeeping.mobile.clean'), count: summary.value.clean }
])

const filteredRooms = computed(() => {
  let result = rooms.value

  if (activeFilter.value === 'dirty') {
    result = result.filter(r => r.housekeepingStatus === 'dirty')
  } else if (activeFilter.value === 'cleaning') {
    result = result.filter(
      r => r.housekeepingStatus === 'cleaning' || r.housekeepingStatus === 'in_progress'
    )
  } else if (activeFilter.value === 'clean') {
    result = result.filter(
      r => r.housekeepingStatus === 'clean' || r.housekeepingStatus === 'inspected'
    )
  }

  // Sort by priority first, then by floor and room number
  return result.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
    const aPriority = priorityOrder[a.housekeepingPriority] ?? 2
    const bPriority = priorityOrder[b.housekeepingPriority] ?? 2
    if (aPriority !== bPriority) return aPriority - bPriority
    if (a.floor !== b.floor) return a.floor - b.floor
    return String(a.roomNumber || '').localeCompare(String(b.roomNumber || ''), undefined, {
      numeric: true
    })
  })
})

// Methods
const getStatusBgClass = status => {
  const classes = {
    dirty: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    cleaning: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    in_progress: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    clean: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    inspected: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
    out_of_service: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
  }
  return classes[status] || 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
}

const getStatusBadgeClass = status => {
  const info = ROOM_STATUS_INFO[status]
  return info ? `${info.bgColor} ${info.textColor}` : 'bg-gray-100 text-gray-700'
}

const getStatusIcon = status => {
  return ROOM_STATUS_INFO[status]?.icon || 'meeting_room'
}

const getStatusLabel = status => {
  return t(`housekeeping.roomStatus.${status}`, ROOM_STATUS_INFO[status]?.label || status)
}

const fetchRooms = async () => {
  if (!hotelId.value) return

  loading.value = true
  try {
    const response = await roomService.getHousekeeping(hotelId.value)
    rooms.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch rooms:', error)
    toast.error(t('housekeeping.mobile.fetchError'))
  } finally {
    loading.value = false
    isRefreshing.value = false
  }
}

const startCleaning = async room => {
  actionLoading.value = room._id
  try {
    await roomService.updateHousekeepingStatus(hotelId.value, room._id, {
      housekeepingStatus: 'cleaning'
    })
    room.housekeepingStatus = 'cleaning'
    toast.success(t('housekeeping.mobile.cleaningStarted', { room: room.roomNumber }))
  } catch (error) {
    console.error('Failed to start cleaning:', error)
    toast.error(t('housekeeping.mobile.actionError'))
  } finally {
    actionLoading.value = null
  }
}

const markAsClean = async room => {
  actionLoading.value = room._id
  try {
    await roomService.updateHousekeepingStatus(hotelId.value, room._id, {
      housekeepingStatus: 'clean'
    })
    room.housekeepingStatus = 'clean'
    toast.success(t('housekeeping.mobile.markedClean', { room: room.roomNumber }))
  } catch (error) {
    console.error('Failed to mark as clean:', error)
    toast.error(t('housekeeping.mobile.actionError'))
  } finally {
    actionLoading.value = null
  }
}

const markAsDirty = async room => {
  actionLoading.value = room._id
  try {
    await roomService.updateHousekeepingStatus(hotelId.value, room._id, {
      housekeepingStatus: 'dirty'
    })
    room.housekeepingStatus = 'dirty'
    toast.info(t('housekeeping.mobile.markedDirty', { room: room.roomNumber }))
  } catch (error) {
    console.error('Failed to mark as dirty:', error)
    toast.error(t('housekeeping.mobile.actionError'))
  } finally {
    actionLoading.value = null
  }
}

const openNotes = room => {
  selectedRoom.value = room
  notesText.value = room.housekeepingNotes || ''
  showNotesModal.value = true
}

const closeNotesModal = () => {
  showNotesModal.value = false
  selectedRoom.value = null
  notesText.value = ''
}

const saveNotes = async () => {
  if (!selectedRoom.value) return

  savingNotes.value = true
  try {
    await roomService.updateRoom(hotelId.value, selectedRoom.value._id, {
      housekeepingNotes: notesText.value
    })
    selectedRoom.value.housekeepingNotes = notesText.value
    toast.success(t('housekeeping.mobile.notesSaved'))
    closeNotesModal()
  } catch (error) {
    console.error('Failed to save notes:', error)
    toast.error(t('housekeeping.mobile.actionError'))
  } finally {
    savingNotes.value = false
  }
}

const reportIssue = room => {
  selectedRoom.value = room
  issueType.value = ''
  issueDescription.value = ''
  showIssueModal.value = true
}

const closeIssueModal = () => {
  showIssueModal.value = false
  selectedRoom.value = null
  issueType.value = ''
  issueDescription.value = ''
}

const submitIssue = async () => {
  if (!selectedRoom.value || !issueType.value) return

  savingIssue.value = true
  try {
    // Mark room as out of order/maintenance
    await roomService.updateRoomStatus(
      hotelId.value,
      selectedRoom.value._id,
      'maintenance',
      issueDescription.value
    )

    // Update local state
    selectedRoom.value.status = 'maintenance'
    selectedRoom.value.housekeepingNotes = `${issueType.value}: ${issueDescription.value}`.trim()

    toast.success(t('housekeeping.mobile.issueReported'))
    closeIssueModal()
  } catch (error) {
    console.error('Failed to report issue:', error)
    toast.error(t('housekeeping.mobile.actionError'))
  } finally {
    savingIssue.value = false
  }
}

const handleLogout = async () => {
  authStore.logout()
}

// Watch hotel changes
watch(
  hotelId,
  newId => {
    if (newId) {
      fetchRooms()
    } else {
      rooms.value = []
    }
  },
  { immediate: true }
)

// Real-time socket updates
usePmsSocket(hotelId, {
  onHousekeeping: data => {
    const room = rooms.value.find(r => r._id === data.roomId)
    if (room) room.housekeepingStatus = data.status
  },
  onCheckOut: () => fetchRooms()
})

// Lifecycle
onMounted(() => {
  // Load hotels if user has access to multiple
  if (authStore.user?.hotels?.length > 1) {
    hotels.value = authStore.user.hotels
  }
})
</script>

<style scoped>
/* Slide up animation for modals */
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Room list transition */
.room-list-enter-active,
.room-list-leave-active {
  transition: all 0.3s ease;
}

.room-list-enter-from,
.room-list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.room-list-move {
  transition: transform 0.3s ease;
}
</style>
