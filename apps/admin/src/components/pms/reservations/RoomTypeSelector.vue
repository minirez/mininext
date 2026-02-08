<template>
  <div ref="dropdownRef" class="relative">
    <button
      type="button"
      :disabled="disabled"
      class="flex items-center gap-2 px-3 py-2 w-full rounded-lg border transition-colors text-left"
      :class="buttonClasses"
      @click="toggleDropdown"
    >
      <span
        class="material-icons text-lg"
        :class="selectedRoomType ? 'text-indigo-500' : 'text-gray-400'"
        >hotel</span
      >
      <div class="flex-1 min-w-0">
        <div class="text-xs text-gray-500 dark:text-slate-400">
          {{ $t('reservation.roomInfo') }}
        </div>
        <div
          class="text-sm font-medium truncate"
          :class="selectedRoomType ? 'text-gray-900 dark:text-white' : 'text-gray-400'"
        >
          {{ selectedRoomType ? getLocalizedName(selectedRoomType.name) : $t('common.select') }}
        </div>
      </div>
      <!-- Availability Badge -->
      <span
        v-if="selectedRoomType"
        class="text-xs px-2 py-0.5 rounded-full"
        :class="getAvailabilityBadgeClass(selectedRoomType)"
      >
        {{ selectedRoomType.available }}/{{ selectedRoomType.total }}
      </span>
      <span
        class="material-icons text-gray-400 transition-transform"
        :class="isOpen ? 'rotate-180' : ''"
        >expand_more</span
      >
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-50 max-h-64 overflow-y-auto"
      >
        <!-- Loading -->
        <div v-if="loading" class="px-4 py-6 text-center text-gray-500">
          <span class="material-icons animate-spin">refresh</span>
        </div>

        <!-- Room Types List -->
        <div v-else>
          <button
            v-for="rt in roomTypesWithOccupancy"
            :key="rt._id"
            type="button"
            class="w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 last:border-b-0 transition-colors"
            :class="getItemClasses(rt)"
            @click="selectRoomType(rt)"
          >
            <!-- Icon -->
            <div
              class="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              :style="{ backgroundColor: rt.color ? `${rt.color}20` : '#e5e7eb' }"
            >
              <span class="material-icons text-base" :style="{ color: rt.color || '#6b7280' }">{{
                getRoomIcon(rt)
              }}</span>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{{ getLocalizedName(rt.name) }}</div>
              <div class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
                <span class="font-mono">{{ rt.code }}</span>
                <span class="flex items-center gap-0.5">
                  <span class="material-icons text-xs">person</span>
                  {{ rt.baseOccupancy || 2 }}
                </span>
              </div>
            </div>

            <!-- Availability -->
            <div class="text-right flex-shrink-0">
              <div
                class="text-xs font-semibold px-2 py-0.5 rounded-full"
                :class="getAvailabilityBadgeClass(rt)"
              >
                {{ rt.available }}/{{ rt.total }}
              </div>
            </div>

            <!-- Check -->
            <span v-if="modelValue === rt._id" class="material-icons text-indigo-500 text-lg"
              >check</span
            >
          </button>

          <!-- No Room Types -->
          <div
            v-if="roomTypesWithOccupancy.length === 0"
            class="px-4 py-6 text-center text-gray-500 text-sm"
          >
            {{ $t('reservation.noRoomTypes') }}
          </div>
        </div>
      </div>
    </Transition>

    <!-- Error -->
    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import * as roomService from '@/services/pms/roomService'

const props = defineProps({
  modelValue: { type: String, default: '' },
  hotelId: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'select'])
const { locale } = useI18n()

const dropdownRef = ref(null)
const isOpen = ref(false)
const loading = ref(false)
const roomTypes = ref([])
const rooms = ref([])

const getLocalizedName = nameObj => {
  if (!nameObj) return ''
  if (typeof nameObj === 'string') return nameObj
  return nameObj[locale.value] || nameObj.tr || nameObj.en || Object.values(nameObj)[0] || ''
}

const roomTypesWithOccupancy = computed(() => {
  return roomTypes.value.map(rt => {
    const roomsOfType = rooms.value.filter(r => r.roomType?._id === rt._id || r.roomType === rt._id)
    const total = roomsOfType.length
    const occupiedCount = roomsOfType.filter(
      r => r.status === 'occupied' || r.status === 'checkout'
    ).length
    return { ...rt, total, available: total - occupiedCount }
  })
})

const selectedRoomType = computed(() => {
  if (!props.modelValue) return null
  return roomTypesWithOccupancy.value.find(rt => rt._id === props.modelValue)
})

const buttonClasses = computed(() => {
  if (props.disabled)
    return 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 cursor-not-allowed opacity-60'
  if (props.error) return 'border-red-500 bg-red-50 dark:bg-red-900/10'
  if (selectedRoomType.value)
    return 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20'
  return 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-indigo-400'
})

const getRoomIcon = rt => {
  const code = (rt.code || '').toLowerCase()
  if (code.includes('suite')) return 'king_bed'
  if (code.includes('family')) return 'family_restroom'
  if (code.includes('double') || code.includes('dbl')) return 'bed'
  if (code.includes('single') || code.includes('sgl')) return 'single_bed'
  return 'hotel'
}

const getAvailabilityBadgeClass = rt => {
  if (rt.available === 0) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (rt.available <= 2)
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
}

const getItemClasses = rt => {
  if (props.modelValue === rt._id) return 'bg-indigo-50 dark:bg-indigo-900/20'
  return 'hover:bg-gray-50 dark:hover:bg-slate-700'
}

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

const selectRoomType = rt => {
  emit('update:modelValue', rt._id)
  emit('select', rt)
  isOpen.value = false
}

const fetchData = async () => {
  if (!props.hotelId) return
  loading.value = true
  try {
    const [rtRes, roomsRes] = await Promise.all([
      roomService.getRoomTypes(props.hotelId),
      roomService.getRooms(props.hotelId)
    ])
    roomTypes.value = rtRes.data || []
    rooms.value = roomsRes.data || []
  } catch (e) {
    console.error('Failed to fetch room types:', e)
  } finally {
    loading.value = false
  }
}

const handleClickOutside = e => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

watch(() => props.hotelId, fetchData)
onMounted(() => {
  fetchData()
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
