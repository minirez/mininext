<template>
  <Modal
    v-model="show"
    :title="
      mode === 'bulk' ? t('housekeeping.addRoom.bulkTitle') : t('housekeeping.addRoom.singleTitle')
    "
    size="lg"
    @close="close"
  >
    <!-- Mode Tabs -->
    <div class="flex gap-2 mb-6">
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="
          mode === 'single'
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
        "
        @click="mode = 'single'"
      >
        {{ t('housekeeping.addRoom.singleMode') }}
      </button>
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="
          mode === 'bulk'
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
        "
        @click="mode = 'bulk'"
      >
        {{ t('housekeeping.addRoom.bulkMode') }}
      </button>
    </div>

    <!-- Single Room Form -->
    <div v-if="mode === 'single'" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ t('housekeeping.addRoom.roomNumber') }} *
          </label>
          <input
            v-model="singleRoom.roomNumber"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="101"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ t('housekeeping.addRoom.floor') }} *
          </label>
          <input
            v-model.number="singleRoom.floor"
            type="number"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="1"
            min="-5"
            max="100"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('housekeeping.addRoom.roomType') }} *
        </label>
        <select
          v-model="singleRoom.roomType"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        >
          <option value="">{{ t('housekeeping.addRoom.selectType') }}</option>
          <option v-for="rt in roomTypes" :key="rt._id" :value="rt._id">
            {{ rt.name?.[locale] || rt.name?.tr || rt.code }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('housekeeping.addRoom.features') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="feature in availableFeatures"
            :key="feature.key"
            class="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700"
            :class="
              singleRoom.features.includes(feature.key)
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-600'
                : ''
            "
          >
            <input
              v-model="singleRoom.features"
              type="checkbox"
              :value="feature.key"
              class="hidden"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ feature.label }}</span>
          </label>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('housekeeping.addRoom.notes') }}
        </label>
        <textarea
          v-model="singleRoom.notes"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          :placeholder="t('housekeeping.addRoom.notesPlaceholder')"
        ></textarea>
      </div>
    </div>

    <!-- Bulk Room Form -->
    <div v-else class="space-y-4">
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p class="text-sm text-blue-700 dark:text-blue-300">
          {{ t('housekeeping.addRoom.bulkInfo') }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ t('housekeeping.addRoom.floor') }} *
          </label>
          <input
            v-model.number="bulkRooms.floor"
            type="number"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="1"
            min="-5"
            max="100"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ t('housekeeping.addRoom.roomType') }} *
          </label>
          <select
            v-model="bulkRooms.roomType"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{{ t('housekeeping.addRoom.selectType') }}</option>
            <option v-for="rt in roomTypes" :key="rt._id" :value="rt._id">
              {{ rt.name?.[locale] || rt.name?.tr || rt.code }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ t('housekeeping.addRoom.startNumber') }} *
          </label>
          <input
            v-model="bulkRooms.startNumber"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="101"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ t('housekeeping.addRoom.endNumber') }} *
          </label>
          <input
            v-model="bulkRooms.endNumber"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="110"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('housekeeping.addRoom.numberFormat') }}
        </label>
        <select
          v-model="bulkRooms.format"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        >
          <option value="number">{{ t('housekeeping.addRoom.formatNumber') }}</option>
          <option value="floor-number">{{ t('housekeeping.addRoom.formatFloorNumber') }}</option>
        </select>
      </div>

      <!-- Preview -->
      <div
        v-if="previewRooms.length > 0"
        class="border border-gray-200 dark:border-slate-600 rounded-lg p-4"
      >
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ t('housekeeping.addRoom.previewTitle', { count: previewRooms.length }) }}
        </h4>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="room in previewRooms.slice(0, 20)"
            :key="room"
            class="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-sm text-gray-600 dark:text-gray-400"
          >
            {{ room }}
          </span>
          <span v-if="previewRooms.length > 20" class="px-2 py-1 text-sm text-gray-500">
            {{ t('housekeeping.addRoom.moreRooms', { count: previewRooms.length - 20 }) }}
          </span>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('housekeeping.addRoom.features') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="feature in availableFeatures"
            :key="feature.key"
            class="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700"
            :class="
              bulkRooms.features.includes(feature.key)
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-600'
                : ''
            "
          >
            <input
              v-model="bulkRooms.features"
              type="checkbox"
              :value="feature.key"
              class="hidden"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ feature.label }}</span>
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        :disabled="loading"
        @click="close"
      >
        {{ t('common.cancel') }}
      </button>
      <button
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        :disabled="loading || !isValid"
        @click="save"
      >
        <span v-if="loading">{{ t('housekeeping.addRoom.saving') }}</span>
        <span v-else>{{
          mode === 'bulk'
            ? t('housekeeping.addRoom.addBulkButton', { count: previewRooms.length })
            : t('common.save')
        }}</span>
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import { createRoom, createRoomsBulk } from '@/services/pms/roomService'

const { t, locale } = useI18n()
const localeMap = { tr: 'tr-TR', en: 'en-US' }

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  },
  roomTypes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'created'])

const toast = useToast()
const loading = ref(false)
const mode = ref('single')

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const availableFeatures = computed(() => [
  { key: 'balcony', label: t('housekeeping.addRoom.featuresList.balcony') },
  { key: 'sea_view', label: t('housekeeping.addRoom.featuresList.seaView') },
  { key: 'pool_view', label: t('housekeeping.addRoom.featuresList.poolView') },
  { key: 'garden_view', label: t('housekeeping.addRoom.featuresList.gardenView') },
  { key: 'jacuzzi', label: t('housekeeping.addRoom.featuresList.jacuzzi') },
  { key: 'accessible', label: t('housekeeping.addRoom.featuresList.accessible') },
  { key: 'connecting', label: t('housekeeping.addRoom.featuresList.connecting') },
  { key: 'corner', label: t('housekeeping.addRoom.featuresList.corner') }
])

const singleRoom = ref({
  roomNumber: '',
  floor: 1,
  roomType: '',
  features: [],
  notes: ''
})

const bulkRooms = ref({
  floor: 1,
  roomType: '',
  startNumber: '',
  endNumber: '',
  format: 'number',
  features: []
})

const previewRooms = computed(() => {
  if (!bulkRooms.value.startNumber || !bulkRooms.value.endNumber) return []

  const start = parseInt(bulkRooms.value.startNumber)
  const end = parseInt(bulkRooms.value.endNumber)

  if (isNaN(start) || isNaN(end) || start > end || end - start > 100) return []

  const rooms = []
  for (let i = start; i <= end; i++) {
    if (bulkRooms.value.format === 'floor-number') {
      const num = i.toString().slice(-2).padStart(2, '0')
      rooms.push(`${bulkRooms.value.floor}-${num}`)
    } else {
      rooms.push(i.toString())
    }
  }
  return rooms
})

const isValid = computed(() => {
  if (mode.value === 'single') {
    return singleRoom.value.roomNumber && singleRoom.value.floor !== '' && singleRoom.value.roomType
  } else {
    return bulkRooms.value.floor !== '' && bulkRooms.value.roomType && previewRooms.value.length > 0
  }
})

const save = async () => {
  loading.value = true
  try {
    if (mode.value === 'single') {
      await createRoom(props.hotelId, singleRoom.value)
      toast.success(t('housekeeping.addRoom.roomCreated'))
    } else {
      const rooms = previewRooms.value.map(roomNumber => ({
        roomNumber,
        floor: bulkRooms.value.floor,
        roomType: bulkRooms.value.roomType,
        features: bulkRooms.value.features
      }))
      await createRoomsBulk(props.hotelId, rooms)
      toast.success(t('housekeeping.addRoom.roomsCreated', { count: rooms.length }))
    }
    emit('created')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || t('housekeeping.addRoom.createError'))
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  resetForm()
}

const resetForm = () => {
  singleRoom.value = {
    roomNumber: '',
    floor: 1,
    roomType: '',
    features: [],
    notes: ''
  }
  bulkRooms.value = {
    floor: 1,
    roomType: '',
    startNumber: '',
    endNumber: '',
    format: 'number',
    features: []
  }
  mode.value = 'single'
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      resetForm()
    }
  }
)
</script>
