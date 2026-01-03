<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-slate-900">
    <!-- Header -->
    <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Oda Plani</h1>
          <p class="text-sm text-gray-500 dark:text-slate-400">Timeline gorunumu ile oda doluluk yonetimi</p>
        </div>

        <div class="flex items-center gap-4">
          <!-- Date Navigation -->
          <div class="flex items-center gap-2">
            <button
              @click="navigateDays(-7)"
              class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="1 hafta geri"
            >
              <span class="material-icons text-gray-600 dark:text-gray-400">chevron_left</span>
            </button>

            <button
              @click="goToToday"
              class="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
            >
              Bugun
            </button>

            <button
              @click="navigateDays(7)"
              class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="1 hafta ileri"
            >
              <span class="material-icons text-gray-600 dark:text-gray-400">chevron_right</span>
            </button>
          </div>

          <!-- Current Date Range -->
          <div class="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {{ formatDateRange }}
          </div>

          <!-- Zoom Controls -->
          <div class="flex items-center border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
            <button
              v-for="level in zoomLevels"
              :key="level.name"
              @click="setZoomLevel(level)"
              class="px-3 py-1.5 text-sm font-medium transition-colors"
              :class="currentZoom.name === level.name
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'"
            >
              {{ level.label }}
            </button>
          </div>

          <!-- Refresh -->
          <button
            @click="fetchData"
            :disabled="loading"
            class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Yenile"
          >
            <span class="material-icons text-gray-600 dark:text-gray-400" :class="{ 'animate-spin': loading }">refresh</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics Bar -->
    <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-2">
      <div class="flex items-center gap-6 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded bg-green-500"></div>
          <span class="text-gray-600 dark:text-gray-400">Aktif: {{ statistics.activeStays }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded bg-blue-400"></div>
          <span class="text-gray-600 dark:text-gray-400">Rezervasyon: {{ statistics.pendingReservations }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded bg-amber-500"></div>
          <span class="text-gray-600 dark:text-gray-400">VIP</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded bg-red-400"></div>
          <span class="text-gray-600 dark:text-gray-400">Odeme Bekliyor</span>
        </div>
        <div class="ml-auto text-gray-500 dark:text-slate-400">
          Toplam Oda: {{ statistics.totalRooms }}
        </div>
      </div>
    </div>

    <!-- Timeline Container -->
    <div class="flex-1 overflow-hidden flex">
      <!-- Room Labels (Fixed Left Column) -->
      <div class="w-48 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 z-10">
        <!-- Header spacer -->
        <div class="h-16 border-b border-gray-200 dark:border-slate-700 flex items-center justify-center">
          <span class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Odalar</span>
        </div>

        <!-- Room labels -->
        <div class="overflow-y-auto" :style="{ height: 'calc(100% - 64px)' }" ref="roomLabelsRef">
          <div v-for="group in roomTypeGroups" :key="group.roomTypeId" class="border-b border-gray-100 dark:border-slate-700">
            <!-- Room Type header (collapsible) -->
            <div
              @click="toggleGroup(group.roomTypeId)"
              class="px-3 py-2 bg-gray-50 dark:bg-slate-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 sticky top-0 z-10"
            >
              <span class="material-icons text-gray-500 dark:text-slate-400 text-sm transition-transform" :class="{ '-rotate-90': collapsedGroups.has(group.roomTypeId) }">
                expand_more
              </span>
              <span class="text-xs font-semibold text-gray-600 dark:text-slate-300 truncate flex-1">
                {{ group.roomTypeName }}
              </span>
            </div>

            <!-- Room rows -->
            <template v-if="!collapsedGroups.has(group.roomTypeId)">
              <div
                v-for="room in group.rooms"
                :key="room._id"
                class="h-10 px-3 flex items-center border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <!-- Room status indicator -->
                  <span
                    class="w-4 h-4 rounded flex-shrink-0"
                    :class="getRoomStatusColor(room)"
                  ></span>
                  <span class="font-medium text-gray-900 dark:text-white text-sm">{{ room.roomNumber }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Timeline Grid (Scrollable) -->
      <div class="flex-1 overflow-auto" ref="timelineRef" @scroll="handleScroll">
        <!-- Date Header -->
        <div class="sticky top-0 bg-white dark:bg-slate-800 z-10 border-b border-gray-200 dark:border-slate-700">
          <!-- Month row -->
          <div class="h-6 flex border-b border-gray-100 dark:border-slate-700/50">
            <div
              v-for="monthGroup in monthGroups"
              :key="`month-${monthGroup.month}-${monthGroup.year}`"
              class="flex-shrink-0 px-2 flex items-center text-xs font-medium text-gray-500 dark:text-slate-400"
              :style="{ width: `${monthGroup.days * currentZoom.cellWidth}px` }"
            >
              {{ getMonthName(monthGroup.month) }} {{ monthGroup.year }}
            </div>
          </div>

          <!-- Day row -->
          <div class="h-10 flex">
            <div
              v-for="(day, index) in dateHeaders"
              :key="index"
              class="flex-shrink-0 flex flex-col items-center justify-center text-xs border-r border-gray-100 dark:border-slate-700/50"
              :class="{
                'bg-indigo-50 dark:bg-indigo-900/20': day.isToday,
                'bg-gray-50 dark:bg-slate-700/30': day.isWeekend && !day.isToday
              }"
              :style="{ width: `${currentZoom.cellWidth}px` }"
            >
              <span class="font-medium" :class="day.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'">
                {{ day.dayOfMonth }}
              </span>
              <span class="text-gray-400 dark:text-slate-500">{{ getDayName(day.dayOfWeek) }}</span>
            </div>
          </div>
        </div>

        <!-- Room Type Groups with Rooms -->
        <div>
          <div v-for="group in roomTypeGroups" :key="group.roomTypeId">
            <!-- Room Type header row with availability counters -->
            <div
              class="h-8 flex bg-gray-50 dark:bg-slate-700/50"
              :style="{ width: `${dateHeaders.length * currentZoom.cellWidth}px` }"
            >
              <div
                v-for="(day, dayIndex) in dateHeaders"
                :key="dayIndex"
                class="flex-shrink-0 flex items-center justify-center text-xs border-r border-gray-100 dark:border-slate-700/50"
                :class="{
                  'bg-indigo-50/50 dark:bg-indigo-900/10': day.isToday
                }"
                :style="{ width: `${currentZoom.cellWidth}px` }"
              >
                <span
                  class="text-xs font-medium"
                  :class="getAvailabilityColor(group, day.date)"
                >
                  {{ getAvailabilityText(group, day.date) }}
                </span>
              </div>
            </div>

            <!-- Room rows -->
            <template v-if="!collapsedGroups.has(group.roomTypeId)">
              <div
                v-for="room in group.rooms"
                :key="room._id"
                class="h-10 relative border-b border-gray-100 dark:border-slate-700/50 transition-colors"
                :class="{
                  'bg-indigo-100/50 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-400': dropTarget?.roomId === room._id,
                  'bg-red-100/50 dark:bg-red-900/30': dropTarget?.roomId === room._id && !dropTarget?.isAvailable
                }"
                :style="{ width: `${dateHeaders.length * currentZoom.cellWidth}px` }"
                @click="handleCellClick($event, room)"
                @dragover="handleDragOver($event, room)"
                @dragleave="handleDragLeave"
                @drop="handleDrop($event, room)"
              >
                <!-- Grid lines (for each day) -->
                <div class="absolute inset-0 flex pointer-events-none">
                  <div
                    v-for="(day, index) in dateHeaders"
                    :key="index"
                    class="flex-shrink-0 border-r border-gray-100 dark:border-slate-700/30 h-full"
                    :class="{
                      'bg-indigo-50/50 dark:bg-indigo-900/10': day.isToday,
                      'bg-gray-50/50 dark:bg-slate-700/10': day.isWeekend && !day.isToday
                    }"
                    :style="{ width: `${currentZoom.cellWidth}px` }"
                  ></div>
                </div>

                <!-- Stay/Reservation bars (parallelogram style) -->
                <div
                  v-for="stay in room.stays"
                  :key="stay._id"
                  class="absolute top-1 h-8 cursor-pointer transition-all hover:z-20 flex items-center overflow-hidden room-bar"
                  :class="[
                    getBarColorClass(stay),
                    { 'opacity-50': draggingStay && draggingStay._id !== stay._id }
                  ]"
                  :style="getBarStyle(stay)"
                  :title="`${stay.guestName} (${formatDate(stay.checkInDate)} - ${formatDate(stay.checkOutDate)})`"
                  :draggable="stay.type === 'stay'"
                  @dragstart="handleDragStart($event, stay, room)"
                  @dragend="handleDragEnd"
                  @click.stop="showStayDetails(stay)"
                >
                  <!-- Guest name -->
                  <span class="text-xs font-medium text-white truncate px-2 relative z-10">
                    {{ stay.guestName }}
                  </span>

                  <!-- VIP indicator dot -->
                  <span v-if="stay.isVip" class="absolute top-0 right-1 w-2 h-2 bg-black rounded-full"></span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Stay Details Popup -->
    <div
      v-if="selectedStay"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="selectedStay = null"
    >
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black/30" @click="selectedStay = null"></div>
        <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <span v-if="selectedStay.isVip" class="material-icons text-amber-500">star</span>
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ selectedStay.guestName }}</h3>
            </div>
            <button @click="selectedStay = null" class="text-gray-400 hover:text-gray-500">
              <span class="material-icons text-lg">close</span>
            </button>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-slate-400">Numara</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ selectedStay.stayNumber || selectedStay.bookingNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-slate-400">Giris</span>
              <span class="text-gray-900 dark:text-white">{{ formatDate(selectedStay.checkInDate, 'long') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-slate-400">Cikis</span>
              <span class="text-gray-900 dark:text-white">{{ formatDate(selectedStay.checkOutDate, 'long') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-slate-400">Durum</span>
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="selectedStay.type === 'reservation' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'"
              >
                {{ selectedStay.type === 'reservation' ? 'Rezervasyon' : 'Aktif Konaklama' }}
              </span>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <button
              v-if="selectedStay.type === 'stay'"
              @click="navigateToStay(selectedStay)"
              class="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Detaylara Git
            </button>
            <button
              @click="selectedStay = null"
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Move Confirmation Modal -->
    <div
      v-if="moveConfirmation"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="cancelMove"
    >
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black/30" @click="cancelMove"></div>
        <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <span class="material-icons text-indigo-600 dark:text-indigo-400">swap_horiz</span>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Konaklama Tasima</h3>
              <p class="text-sm text-gray-500 dark:text-slate-400">{{ moveConfirmation.stay?.guestName }}</p>
            </div>
          </div>

          <div class="space-y-3 mb-4">
            <div class="flex items-center gap-3 text-sm">
              <div class="flex-1 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div class="text-gray-500 dark:text-slate-400 text-xs mb-1">Mevcut Oda</div>
                <div class="font-medium text-gray-900 dark:text-white">{{ moveConfirmation.sourceRoom?.roomNumber }}</div>
              </div>
              <span class="material-icons text-gray-400">arrow_forward</span>
              <div class="flex-1 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div class="text-indigo-600 dark:text-indigo-400 text-xs mb-1">Hedef Oda</div>
                <div class="font-medium text-indigo-700 dark:text-indigo-300">{{ moveConfirmation.targetRoom?.roomNumber }}</div>
              </div>
            </div>

            <div v-if="moveConfirmation.newCheckIn" class="flex items-center gap-3 text-sm">
              <div class="flex-1 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div class="text-gray-500 dark:text-slate-400 text-xs mb-1">Mevcut Tarih</div>
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ formatDate(moveConfirmation.stay.checkInDate, 'short') }} - {{ formatDate(moveConfirmation.stay.checkOutDate, 'short') }}
                </div>
              </div>
              <span class="material-icons text-gray-400">arrow_forward</span>
              <div class="flex-1 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div class="text-indigo-600 dark:text-indigo-400 text-xs mb-1">Yeni Tarih</div>
                <div class="font-medium text-indigo-700 dark:text-indigo-300">
                  {{ formatDate(moveConfirmation.newCheckIn, 'short') }} - {{ formatDate(moveConfirmation.newCheckOut, 'short') }}
                </div>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tasima Nedeni</label>
            <input
              v-model="moveReason"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ornek: Misafir istegi, teknik ariza..."
            />
          </div>

          <div class="flex gap-3">
            <button
              @click="cancelMove"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Iptal
            </button>
            <button
              @click="confirmMove"
              :disabled="moveLoading"
              class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span v-if="moveLoading" class="material-icons animate-spin text-sm">refresh</span>
              {{ moveLoading ? 'Taşınıyor...' : 'Onayla' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading && !roomTypeGroups.length" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80">
      <div class="text-center">
        <span class="material-icons animate-spin text-4xl text-indigo-500">refresh</span>
        <p class="mt-2 text-gray-500 dark:text-slate-400">Yukleniyor...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { usePMSSocket } from '@/composables/usePMSSocket'
import { usePmsContextInjection } from '@/composables/usePmsContext'
import * as roomPlanService from '@/services/pms/roomPlanService'

const router = useRouter()
const toast = useToast()
const { hotelId } = usePmsContextInjection()

// State
const loading = ref(false)
const floors = ref([])
const statistics = ref({ totalRooms: 0, activeStays: 0, pendingReservations: 0 })

// Collapsed groups state
const collapsedGroups = ref(new Set())

// View state
const viewStartDate = ref(new Date())
const currentZoom = ref(roomPlanService.ZOOM_LEVELS.DAY)
const zoomLevels = Object.values(roomPlanService.ZOOM_LEVELS)

// Selection
const selectedStay = ref(null)

// Drag state
const draggingStay = ref(null)
const dragSourceRoom = ref(null)
const dropTarget = ref(null)

// Move confirmation
const moveConfirmation = ref(null)
const moveReason = ref('')
const moveLoading = ref(false)

// Refs
const timelineRef = ref(null)
const roomLabelsRef = ref(null)

// Helper to get string from multilang field
const getLocalizedName = (field) => {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object') {
    // Try common locale keys
    return field.tr || field.en || field.default || Object.values(field)[0] || ''
  }
  return String(field)
}

// Transform floor-based data to room type groups
const roomTypeGroups = computed(() => {
  const groupMap = new Map()

  for (const floor of floors.value) {
    for (const room of floor.rooms) {
      const roomTypeId = room.roomType?._id || 'unknown'
      const roomTypeName = getLocalizedName(room.roomType?.name) || 'Diger'

      if (!groupMap.has(roomTypeId)) {
        groupMap.set(roomTypeId, {
          roomTypeId,
          roomTypeName,
          roomTypeCode: room.roomType?.code || '',
          rooms: []
        })
      }

      groupMap.get(roomTypeId).rooms.push(room)
    }
  }

  // Sort groups by name and rooms by roomNumber
  const groups = Array.from(groupMap.values())
  groups.sort((a, b) => String(a.roomTypeName).localeCompare(String(b.roomTypeName)))
  groups.forEach(g => g.rooms.sort((a, b) => String(a.roomNumber || '').localeCompare(String(b.roomNumber || ''))))

  return groups
})

// Computed
const dateHeaders = computed(() => {
  return roomPlanService.generateDateArray(viewStartDate.value, currentZoom.value.daysVisible)
})

const monthGroups = computed(() => {
  const groups = []
  let currentMonth = null

  for (const day of dateHeaders.value) {
    if (!currentMonth || currentMonth.month !== day.month || currentMonth.year !== day.year) {
      currentMonth = { month: day.month, year: day.year, days: 1 }
      groups.push(currentMonth)
    } else {
      currentMonth.days++
    }
  }

  return groups
})

const formatDateRange = computed(() => {
  const start = viewStartDate.value
  const end = new Date(start)
  end.setDate(end.getDate() + currentZoom.value.daysVisible - 1)

  return `${roomPlanService.formatDate(start, 'short')} - ${roomPlanService.formatDate(end, 'short')}`
})

// Methods
const fetchData = async () => {
  if (!hotelId.value) return

  loading.value = true
  try {
    const endDate = new Date(viewStartDate.value)
    endDate.setDate(endDate.getDate() + currentZoom.value.daysVisible)

    const response = await roomPlanService.getRoomsWithOccupancy(hotelId.value, {
      start: viewStartDate.value.toISOString(),
      end: endDate.toISOString()
    })

    floors.value = response.data?.floors || []
    statistics.value = response.data?.statistics || { totalRooms: 0, activeStays: 0, pendingReservations: 0 }
  } catch (error) {
    console.error('Failed to fetch room plan:', error)
    toast.error('Oda plani yuklenemedi')
  } finally {
    loading.value = false
  }
}

const toggleGroup = (groupId) => {
  if (collapsedGroups.value.has(groupId)) {
    collapsedGroups.value.delete(groupId)
  } else {
    collapsedGroups.value.add(groupId)
  }
  // Trigger reactivity
  collapsedGroups.value = new Set(collapsedGroups.value)
}

const navigateDays = (days) => {
  const newDate = new Date(viewStartDate.value)
  newDate.setDate(newDate.getDate() + days)
  viewStartDate.value = newDate
}

const goToToday = () => {
  const today = new Date()
  today.setDate(today.getDate() - 3) // Start 3 days before today for context
  viewStartDate.value = today
}

const setZoomLevel = (level) => {
  currentZoom.value = level
}

const handleScroll = () => {
  // Sync room labels scroll with timeline scroll
  if (timelineRef.value && roomLabelsRef.value) {
    roomLabelsRef.value.scrollTop = timelineRef.value.scrollTop
  }
}

const getBarColorClass = (item) => {
  // Status based colors matching reference
  if (item.type === 'reservation') {
    return 'bar-blue' // Blue for reservations
  }

  if (item.isVip) {
    return 'bar-amber' // Amber/orange for VIP
  }

  if (item.paymentStatus === 'pending') {
    return 'bar-yellow' // Yellow for payment pending
  }

  return 'bar-green' // Green for active stays
}

// Get bar style with half-day positioning and parallelogram shape
const getBarStyle = (stay) => {
  const checkIn = new Date(stay.checkInDate)
  const checkOut = new Date(stay.checkOutDate)
  const startDate = new Date(viewStartDate.value)
  startDate.setHours(0, 0, 0, 0)

  // Calculate days from view start
  const checkInDays = Math.floor((checkIn - startDate) / (1000 * 60 * 60 * 24))
  const checkOutDays = Math.floor((checkOut - startDate) / (1000 * 60 * 60 * 24))

  const cellWidth = currentZoom.value.cellWidth

  // Half-day positioning: start at 50% of check-in cell, end at 50% of check-out cell
  const left = (checkInDays * cellWidth) + (cellWidth / 2)
  const right = (checkOutDays * cellWidth) + (cellWidth / 2)
  const width = right - left

  return {
    left: `${left}px`,
    width: `${Math.max(width, 20)}px`
  }
}

const getRoomStatusColor = (room) => {
  // Room status colors matching reference image
  if (room.status === 'occupied') {
    return 'bg-red-500' // Red/orange for occupied
  }
  if (room.status === 'maintenance') {
    return 'bg-gray-400'
  }
  if (room.housekeepingStatus === 'dirty') {
    return 'bg-amber-500' // Orange for dirty
  }
  if (room.housekeepingStatus === 'inspecting') {
    return 'bg-yellow-400'
  }
  return 'bg-blue-400' // Blue for available/clean
}

// Calculate availability for a room type on a specific date
const getAvailability = (group, date) => {
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  let occupied = 0
  const total = group.rooms.length

  for (const room of group.rooms) {
    for (const stay of (room.stays || [])) {
      const checkIn = new Date(stay.checkInDate)
      const checkOut = new Date(stay.checkOutDate)
      checkIn.setHours(0, 0, 0, 0)
      checkOut.setHours(0, 0, 0, 0)

      // Room is occupied if date is between check-in (inclusive) and check-out (exclusive)
      if (targetDate >= checkIn && targetDate < checkOut) {
        occupied++
        break
      }
    }
  }

  return { occupied, total, available: total - occupied }
}

const getAvailabilityText = (group, date) => {
  const { occupied, total } = getAvailability(group, date)
  return `${occupied}/${total}`
}

const getAvailabilityColor = (group, date) => {
  const { occupied, total } = getAvailability(group, date)
  const ratio = occupied / total

  if (ratio >= 1) return 'text-red-600 dark:text-red-400' // Full
  if (ratio >= 0.8) return 'text-amber-600 dark:text-amber-400' // Almost full
  if (ratio >= 0.5) return 'text-yellow-600 dark:text-yellow-400' // Half full
  return 'text-green-600 dark:text-green-400' // Mostly available
}

const getMonthName = (month) => {
  return roomPlanService.getMonthName(month)
}

const getDayName = (dayOfWeek) => {
  return roomPlanService.getDayName(dayOfWeek)
}

const formatDate = (date, format = 'short') => {
  return roomPlanService.formatDate(date, format)
}

const showStayDetails = (stay) => {
  selectedStay.value = stay
}

const navigateToStay = (stay) => {
  // Navigate to front desk or reservation detail
  if (stay.type === 'stay') {
    router.push('/pms/front-desk')
  } else {
    router.push('/pms/reservations')
  }
  selectedStay.value = null
}

const handleCellClick = (event, room) => {
  // Calculate clicked date from x position
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left + (timelineRef.value?.scrollLeft || 0)
  const clickedDate = roomPlanService.pixelToDate(x, viewStartDate.value, currentZoom.value.cellWidth)

  console.log('Clicked:', room.roomNumber, 'Date:', clickedDate)
  // TODO: Open new reservation modal with pre-filled room and date
}

// Drag handlers
const handleDragStart = (event, stay, room) => {
  if (stay.type !== 'stay') {
    event.preventDefault()
    return
  }

  draggingStay.value = stay
  dragSourceRoom.value = room
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', stay._id)

  // Set drag image
  event.dataTransfer.setDragImage(event.target, 10, 10)
}

const handleDragEnd = () => {
  draggingStay.value = null
  dragSourceRoom.value = null
  dropTarget.value = null
}

const handleDragOver = async (event, room) => {
  if (!draggingStay.value) return

  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'

  // Calculate the date from mouse position
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const dropDate = roomPlanService.pixelToDate(x, viewStartDate.value, currentZoom.value.cellWidth)

  // Check if target room is different or date is different
  const isSameRoom = room._id === dragSourceRoom.value?._id
  const stay = draggingStay.value
  const originalCheckIn = new Date(stay.checkInDate)
  originalCheckIn.setHours(0, 0, 0, 0)
  dropDate.setHours(0, 0, 0, 0)
  const isSameDate = dropDate.getTime() === originalCheckIn.getTime()

  if (isSameRoom && isSameDate) {
    dropTarget.value = null
    return
  }

  // Calculate new checkout based on original stay duration
  const stayDuration = Math.ceil(
    (new Date(stay.checkOutDate) - new Date(stay.checkInDate)) / (1000 * 60 * 60 * 24)
  )
  const newCheckOut = new Date(dropDate)
  newCheckOut.setDate(newCheckOut.getDate() + stayDuration)

  // Check availability (debounced)
  let isAvailable = true
  if (!isSameRoom) {
    // Quick client-side check for conflicts
    const conflicts = room.stays?.filter(s => {
      if (s._id === stay._id) return false
      const existingIn = new Date(s.checkInDate)
      const existingOut = new Date(s.checkOutDate)
      return dropDate < existingOut && newCheckOut > existingIn
    })
    isAvailable = !conflicts?.length
  }

  dropTarget.value = {
    roomId: room._id,
    room,
    date: dropDate,
    newCheckOut,
    isAvailable
  }
}

const handleDragLeave = (event) => {
  // Only clear if leaving the room row entirely
  if (!event.currentTarget.contains(event.relatedTarget)) {
    dropTarget.value = null
  }
}

const handleDrop = async (event, room) => {
  event.preventDefault()

  if (!draggingStay.value || !dropTarget.value) {
    handleDragEnd()
    return
  }

  if (!dropTarget.value.isAvailable) {
    toast.warning('Bu oda seçilen tarihler için müsait değil')
    handleDragEnd()
    return
  }

  const stay = draggingStay.value
  const sourceRoom = dragSourceRoom.value
  const targetRoom = dropTarget.value.room
  const newCheckIn = dropTarget.value.date
  const newCheckOut = dropTarget.value.newCheckOut

  // Check if anything changed
  const isSameRoom = sourceRoom._id === targetRoom._id
  const originalCheckIn = new Date(stay.checkInDate)
  originalCheckIn.setHours(0, 0, 0, 0)
  newCheckIn.setHours(0, 0, 0, 0)
  const isSameDate = originalCheckIn.getTime() === newCheckIn.getTime()

  if (isSameRoom && isSameDate) {
    handleDragEnd()
    return
  }

  // Show confirmation modal
  moveConfirmation.value = {
    stay,
    sourceRoom,
    targetRoom,
    newCheckIn: !isSameDate ? newCheckIn : null,
    newCheckOut: !isSameDate ? newCheckOut : null,
    isSameRoom
  }
  moveReason.value = ''

  handleDragEnd()
}

const cancelMove = () => {
  moveConfirmation.value = null
  moveReason.value = ''
}

const confirmMove = async () => {
  if (!moveConfirmation.value) return

  moveLoading.value = true

  try {
    const { stay, targetRoom, newCheckIn, newCheckOut, isSameRoom } = moveConfirmation.value

    if (isSameRoom && newCheckIn) {
      // Only date change - use changeStayDates
      await roomPlanService.changeStayDates(hotelId.value, stay._id, {
        newCheckIn: newCheckIn.toISOString(),
        newCheckOut: newCheckOut.toISOString(),
        reason: moveReason.value || 'Oda planından tarih değişikliği'
      })
      toast.success('Konaklama tarihleri güncellendi')
    } else {
      // Room change (with optional date change) - use moveStayToRoom
      const data = {
        newRoomId: targetRoom._id,
        reason: moveReason.value || 'Oda planından taşındı'
      }

      if (newCheckIn) {
        data.newCheckIn = newCheckIn.toISOString()
        data.newCheckOut = newCheckOut.toISOString()
      }

      await roomPlanService.moveStayToRoom(hotelId.value, stay._id, data)
      toast.success(`Konaklama ${targetRoom.roomNumber} numaralı odaya taşındı`)
    }

    // Refresh data
    await fetchData()

    cancelMove()
  } catch (error) {
    console.error('Move failed:', error)
    const message = error.response?.data?.message || 'Taşıma işlemi başarısız'
    toast.error(message)

    // Show conflict details if available
    if (error.response?.data?.conflict) {
      const conflict = error.response.data.conflict
      toast.warning(`Çakışan konaklama: ${conflict.stayNumber}`)
    }
  } finally {
    moveLoading.value = false
  }
}

// Socket.io integration for real-time updates
const { onCheckIn, onCheckOut, onRoomStatusChange, onReservation } = usePMSSocket()

// Store unregister functions for cleanup
let unsubscribes = []

const setupSocketListeners = () => {
  // Refresh when check-in happens
  unsubscribes.push(
    onCheckIn((data) => {
      console.log('[RoomPlan] Check-in event:', data)
      fetchData()
    })
  )

  // Refresh when check-out happens
  unsubscribes.push(
    onCheckOut((data) => {
      console.log('[RoomPlan] Check-out event:', data)
      fetchData()
    })
  )

  // Refresh when room status changes
  unsubscribes.push(
    onRoomStatusChange((data) => {
      console.log('[RoomPlan] Room status change:', data)
      // Update room status locally without full refresh
      updateRoomStatus(data)
    })
  )

  // Refresh when reservation changes
  unsubscribes.push(
    onReservation((data) => {
      console.log('[RoomPlan] Reservation event:', data)
      fetchData()
    })
  )
}

const cleanupSocketListeners = () => {
  unsubscribes.forEach(unsub => unsub && unsub())
  unsubscribes = []
}

// Update room status locally (optimistic update)
const updateRoomStatus = (data) => {
  if (!data.roomId) return

  for (const floor of floors.value) {
    const room = floor.rooms.find(r => r._id === data.roomId)
    if (room) {
      if (data.status) room.status = data.status
      if (data.housekeepingStatus) room.housekeepingStatus = data.housekeepingStatus
      break
    }
  }
}

// Watch for view changes
watch([viewStartDate, currentZoom], () => {
  fetchData()
})

watch(hotelId, (newVal) => {
  if (newVal) {
    goToToday()
    fetchData()
  }
})

// Lifecycle
onMounted(() => {
  goToToday()
  if (hotelId.value) {
    fetchData()
  }
  setupSocketListeners()
})

onUnmounted(() => {
  cleanupSocketListeners()
})
</script>

<style scoped>
/* Custom scrollbar for timeline */
.overflow-auto::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.dark .overflow-auto::-webkit-scrollbar-thumb {
  background: #475569;
}

/* Parallelogram bar styles */
.room-bar {
  /* Skew for parallelogram effect */
  transform: skewX(-15deg);
  border-radius: 2px;
}

.room-bar > * {
  /* Counter-skew text so it remains readable */
  transform: skewX(15deg);
}

/* Color classes for bars */
.bar-green {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.bar-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.bar-amber {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.bar-yellow {
  background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
}

.bar-red {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

/* Hover effect for bars */
.room-bar:hover {
  filter: brightness(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 20;
}
</style>
