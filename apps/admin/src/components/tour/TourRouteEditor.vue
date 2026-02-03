<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ $t('tour.route.title') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ $t('tour.route.subtitle') }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn-outline btn-sm"
          :class="{ 'bg-primary-50 dark:bg-primary-900/20 border-primary-500': showMap }"
          @click="showMap = !showMap"
        >
          <span class="material-icons text-sm mr-1">map</span>
          {{ $t('tour.route.map') }}
        </button>
        <button type="button" class="btn-primary btn-sm" @click="addDestination">
          <span class="material-icons text-sm mr-1">add_location_alt</span>
          {{ $t('tour.route.addDestination') }}
        </button>
      </div>
    </div>

    <!-- Map (collapsible) -->
    <div
      v-show="showMap"
      class="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div :id="mapId" class="h-[300px] bg-gray-100 dark:bg-slate-900"></div>
    </div>

    <!-- Empty State -->
    <div
      v-if="destinations.length === 0"
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center"
      >
        <span class="material-icons text-3xl text-primary-500">route</span>
      </div>
      <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ $t('tour.route.emptyTitle') }}
      </h4>
      <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {{ $t('tour.route.emptyDescription') }}
      </p>
      <button type="button" class="btn-primary" @click="addDestination">
        <span class="material-icons mr-2">add_location_alt</span>
        {{ $t('tour.route.addFirstDestination') }}
      </button>
    </div>

    <!-- Route Timeline -->
    <div v-else class="relative">
      <!-- Timeline line -->
      <div
        class="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary-400 via-primary-300 to-primary-200 dark:from-primary-600 dark:via-primary-700 dark:to-primary-800"
      ></div>

      <div class="space-y-4">
        <div v-for="(dest, idx) in destinations" :key="dest._id || idx" class="relative flex gap-4">
          <!-- Timeline marker -->
          <div class="flex-shrink-0 relative z-10">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
              :class="
                idx === 0
                  ? 'bg-green-500 text-white'
                  : idx === destinations.length - 1
                    ? 'bg-red-500 text-white'
                    : 'bg-primary-500 text-white'
              "
            >
              {{ idx + 1 }}
            </div>
          </div>

          <!-- Content card -->
          <div
            class="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
          >
            <!-- Card header -->
            <div
              class="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-700/40 border-b border-gray-200 dark:border-slate-700 cursor-pointer"
              @click="toggleExpand(idx)"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span
                  class="material-icons text-primary-500"
                  :class="{
                    'text-green-500': idx === 0,
                    'text-red-500': idx === destinations.length - 1
                  }"
                >
                  {{
                    idx === 0
                      ? 'flight_takeoff'
                      : idx === destinations.length - 1
                        ? 'flag'
                        : 'place'
                  }}
                </span>
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">
                    {{ dest.locationSnapshot?.name || $t('tour.route.newDestination') }}
                  </p>
                  <p v-if="dest.stay?.value" class="text-xs text-gray-500 dark:text-gray-400">
                    {{ dest.stay.value }}
                    {{
                      dest.stay.unit === 'hours'
                        ? $t('tour.route.units.hours')
                        : $t('tour.route.units.days')
                    }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-1">
                <!-- Reorder buttons -->
                <button
                  type="button"
                  class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                  :disabled="idx === 0"
                  :title="$t('common.moveUp')"
                  @click.stop="moveDestination(idx, -1)"
                >
                  <span class="material-icons text-lg">arrow_upward</span>
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                  :disabled="idx === destinations.length - 1"
                  :title="$t('common.moveDown')"
                  @click.stop="moveDestination(idx, 1)"
                >
                  <span class="material-icons text-lg">arrow_downward</span>
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400 hover:text-red-500"
                  :title="$t('common.delete')"
                  @click.stop="removeDestination(idx)"
                >
                  <span class="material-icons text-lg">delete</span>
                </button>
                <span
                  class="material-icons text-gray-400 ml-2 transition-transform"
                  :class="{ 'rotate-180': expandedIdx === idx }"
                >
                  expand_more
                </span>
              </div>
            </div>

            <!-- Expandable content -->
            <div v-show="expandedIdx === idx" class="p-4 space-y-4">
              <!-- Location Picker -->
              <div>
                <label class="form-label flex items-center gap-2">
                  <span class="material-icons text-sm text-gray-400">location_on</span>
                  {{ $t('tour.route.destination') }}
                </label>
                <LocationPicker
                  v-model="dest.location"
                  :placeholder="$t('tour.route.searchDestination')"
                  @select="val => applyLocation(dest, val)"
                />
              </div>

              <!-- Duration -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label class="form-label text-xs">{{ $t('tour.route.duration') }}</label>
                  <input
                    v-model.number="dest.stay.value"
                    type="number"
                    min="0"
                    class="form-input"
                  />
                </div>
                <div>
                  <label class="form-label text-xs">{{ $t('tour.route.unit') }}</label>
                  <select v-model="dest.stay.unit" class="form-input">
                    <option value="hours">{{ $t('tour.route.units.hours') }}</option>
                    <option value="days">{{ $t('tour.route.units.days') }}</option>
                  </select>
                </div>
                <div v-if="dest.stay.unit === 'hours'">
                  <label class="form-label text-xs">{{ $t('tour.route.arrivalTime') }}</label>
                  <input v-model="dest.stay.timeWindow.start" type="time" class="form-input" />
                </div>
                <div v-if="dest.stay.unit === 'hours'">
                  <label class="form-label text-xs">{{ $t('tour.route.departureTime') }}</label>
                  <input v-model="dest.stay.timeWindow.end" type="time" class="form-input" />
                </div>
              </div>

              <!-- Title & Description (collapsed by default) -->
              <details class="group border-t border-gray-100 dark:border-slate-700/50 pt-3">
                <summary
                  class="flex items-center gap-2 cursor-pointer select-none list-none text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors [&::-webkit-details-marker]:hidden"
                >
                  <span
                    class="material-icons text-sm text-gray-400 dark:text-gray-500 transition-transform group-open:rotate-90"
                    >chevron_right</span
                  >
                  {{ $t('tour.route.additionalDetails') }}
                </summary>
                <div class="mt-3 space-y-3 pl-6">
                  <div>
                    <label class="form-label text-xs">{{
                      $t('tour.route.destinationTitle')
                    }}</label>
                    <MultiLangInput v-model="dest.title" :languages="B2C_LANGUAGES" />
                  </div>
                  <div>
                    <label class="form-label text-xs">{{
                      $t('tour.route.destinationDescription')
                    }}</label>
                    <MultiLangInput
                      v-model="dest.description"
                      :languages="B2C_LANGUAGES"
                      type="textarea"
                      :rows="2"
                    />
                  </div>
                </div>
              </details>

              <!-- Photo (collapsed by default) -->
              <details class="group border-t border-gray-100 dark:border-slate-700/50 pt-3">
                <summary
                  class="flex items-center gap-2 cursor-pointer select-none list-none text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors [&::-webkit-details-marker]:hidden"
                >
                  <span
                    class="material-icons text-sm text-gray-400 dark:text-gray-500 transition-transform group-open:rotate-90"
                    >chevron_right</span
                  >
                  {{ $t('tour.route.photo') }}
                </summary>
                <div class="mt-3 pl-6">
                  <div class="flex items-start gap-4">
                    <div
                      class="w-24 h-16 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 overflow-hidden flex items-center justify-center"
                    >
                      <img
                        v-if="dest.photo?.url"
                        :src="getFileUrl(dest.photo.url)"
                        class="w-full h-full object-cover"
                        :alt="dest.locationSnapshot?.name || ''"
                      />
                      <span v-else class="material-icons text-gray-300 dark:text-gray-600"
                        >image</span
                      >
                    </div>
                    <div class="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        class="block w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white hover:file:bg-primary-700 file:text-xs"
                        :disabled="!canUpload(dest)"
                        @change="e => onPhotoSelected(e, dest)"
                      />
                      <p v-if="!tourId" class="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        {{ $t('tour.route.saveTourToUpload') }}
                      </p>
                    </div>
                    <button
                      v-if="dest.photo?.url"
                      type="button"
                      class="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                      :disabled="!tourId || uploadingDestId === dest._id"
                      @click="removePhoto(dest)"
                    >
                      <span class="material-icons text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import LocationPicker from '@/components/tour/LocationPicker.vue'
import { B2C_LANGUAGES } from '@/constants/languages'
import { useTourRouteMap } from '@/composables/useTourRouteMap'
import { getFileUrl } from '@/utils/imageUrl'
import * as tourService from '@/services/tourService'

const { locale } = useI18n()

const props = defineProps({
  modelValue: { type: Object, default: () => ({ mode: 'sequence', stops: [] }) },
  tourId: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const mapId = `tour-route-map-${Math.random().toString(36).slice(2)}`
const uploadingDestId = ref('')
const expandedIdx = ref(0) // First item expanded by default
const showMap = ref(false)

const routePlan = computed({
  get: () => props.modelValue || { mode: 'sequence', stops: [] },
  set: val => emit('update:modelValue', val)
})

const destinations = computed({
  get: () => routePlan.value.stops || [],
  set: val => {
    const next = { ...(routePlan.value || {}), stops: val }
    routePlan.value = next
  }
})

function createEmptyDestination() {
  return {
    sequence: (destinations.value?.length || 0) + 1,
    locationRef: { type: 'city', refId: null },
    locationSnapshot: { name: '', countryCode: '', coordinates: null, zoom: null },
    stay: { unit: 'days', value: 1, timeWindow: { start: '', end: '' } },
    title: { tr: '', en: '' },
    description: { tr: '', en: '' },
    photo: null,
    tags: []
  }
}

function addDestination() {
  destinations.value = [...destinations.value, createEmptyDestination()]
  expandedIdx.value = destinations.value.length - 1
}

function removeDestination(index) {
  const next = [...destinations.value]
  next.splice(index, 1)
  next.forEach((s, i) => (s.sequence = i + 1))
  destinations.value = next
  if (expandedIdx.value >= next.length) {
    expandedIdx.value = Math.max(0, next.length - 1)
  }
}

function moveDestination(index, dir) {
  const next = [...destinations.value]
  const target = index + dir
  if (target < 0 || target >= next.length) return
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  next.forEach((s, i) => (s.sequence = i + 1))
  destinations.value = next
  expandedIdx.value = target
}

function toggleExpand(idx) {
  expandedIdx.value = expandedIdx.value === idx ? -1 : idx
}

function applyLocation(dest, val) {
  if (!val) return
  dest.locationRef = val.locationRef
  dest.locationSnapshot = val.locationSnapshot
  dest.location = val
}

const { initMap, setStops, focusOnStop } = useTourRouteMap()

async function refreshMap() {
  if (!showMap.value) return
  await nextTick()
  initMap(mapId, [39.0, 35.0], 6)
  setStops(destinations.value, s => s.locationSnapshot?.name)
}

watch(
  () => destinations.value,
  () => {
    if (showMap.value) refreshMap()
  },
  { deep: true }
)

watch(showMap, val => {
  if (val) refreshMap()
})

// Ensure picker is prefilled for existing stops loaded from API
watch(
  () => destinations.value,
  val => {
    for (const s of val || []) {
      if (!s.location && (s.locationRef?.refId || s.locationSnapshot?.name)) {
        s.location = { locationRef: s.locationRef, locationSnapshot: s.locationSnapshot }
      }
      if (!s.stay) {
        s.stay = { unit: 'days', value: 1, timeWindow: { start: '', end: '' } }
      }
      if (!s.stay.timeWindow) s.stay.timeWindow = { start: '', end: '' }
    }
  },
  { immediate: true, deep: true }
)

function canUpload(dest) {
  return Boolean(props.tourId && dest?._id)
}

async function onPhotoSelected(e, dest) {
  const file = e.target?.files?.[0]
  if (!file) return
  if (!canUpload(dest)) return

  uploadingDestId.value = dest._id
  try {
    const resp = await tourService.uploadRouteStopPhoto(props.tourId, dest._id, file)
    dest.photo = resp.data?.photo || null
  } finally {
    uploadingDestId.value = ''
    if (e.target) e.target.value = ''
  }
}

async function removePhoto(dest) {
  if (!canUpload(dest)) return
  uploadingDestId.value = dest._id
  try {
    const resp = await tourService.deleteRouteStopPhoto(props.tourId, dest._id)
    dest.photo = resp.data?.photo || null
  } finally {
    uploadingDestId.value = ''
  }
}

onMounted(() => {
  if (showMap.value) refreshMap()
})
</script>
