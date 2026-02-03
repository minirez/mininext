<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ $t('tour.route.title') }}
      </h3>
      <button type="button" class="btn-outline btn-sm" @click="addStop">
        <span class="material-icons mr-1">add</span>
        {{ $t('tour.route.addStop') }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <!-- Stops -->
      <div class="lg:col-span-7 space-y-3">
        <div
          v-if="stops.length === 0"
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-8 text-center text-gray-500 dark:text-gray-400"
        >
          <span class="material-icons text-4xl mb-2">route</span>
          <p>{{ $t('tour.route.empty') }}</p>
          <button type="button" class="btn-primary mt-4" @click="addStop">
            {{ $t('tour.route.addFirstStop') }}
          </button>
        </div>

        <div
          v-for="(stop, idx) in stops"
          :key="stop._id || idx"
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-700/40 border-b border-gray-200 dark:border-slate-700"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span
                class="w-8 h-8 flex items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-semibold"
              >
                {{ idx + 1 }}
              </span>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ stop.locationSnapshot?.name || $t('tour.route.stop') }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ getLocalized(stop.title) || '-' }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button
                type="button"
                class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
                :disabled="idx === 0"
                :title="$t('common.moveUp')"
                @click="moveStop(idx, -1)"
              >
                <span class="material-icons text-base">arrow_upward</span>
              </button>
              <button
                type="button"
                class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
                :disabled="idx === stops.length - 1"
                :title="$t('common.moveDown')"
                @click="moveStop(idx, 1)"
              >
                <span class="material-icons text-base">arrow_downward</span>
              </button>
              <button
                type="button"
                class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
                :title="$t('common.focus')"
                @click="focusStop(stop)"
              >
                <span class="material-icons text-base">my_location</span>
              </button>
              <button
                type="button"
                class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-red-500"
                :title="$t('common.delete')"
                @click="removeStop(idx)"
              >
                <span class="material-icons text-base">delete</span>
              </button>
            </div>
          </div>

          <div class="p-4 space-y-4">
            <!-- Location -->
            <LocationPicker
              v-model="stop.location"
              :label="$t('tour.route.location')"
              :placeholder="$t('tour.route.locationPlaceholder')"
              @select="val => applyLocation(stop, val)"
            />

            <!-- Stay -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="form-label">{{ $t('tour.route.stayUnit') }}</label>
                <select v-model="stop.stay.unit" class="form-input">
                  <option value="hours">{{ $t('tour.route.units.hours') }}</option>
                  <option value="days">{{ $t('tour.route.units.days') }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">{{ $t('tour.route.stayValue') }}</label>
                <input v-model.number="stop.stay.value" type="number" min="0" class="form-input" />
              </div>
              <div v-if="stop.stay.unit === 'hours'" class="grid grid-cols-2 gap-2">
                <div>
                  <label class="form-label">{{ $t('tour.route.timeStart') }}</label>
                  <input v-model="stop.stay.timeWindow.start" type="time" class="form-input" />
                </div>
                <div>
                  <label class="form-label">{{ $t('tour.route.timeEnd') }}</label>
                  <input v-model="stop.stay.timeWindow.end" type="time" class="form-input" />
                </div>
              </div>
            </div>

            <!-- Title / Description -->
            <div>
              <label class="form-label">{{ $t('tour.route.stopTitle') }}</label>
              <MultiLangInput v-model="stop.title" :languages="B2C_LANGUAGES" />
            </div>
            <div>
              <label class="form-label">{{ $t('tour.route.stopDescription') }}</label>
              <MultiLangInput
                v-model="stop.description"
                :languages="B2C_LANGUAGES"
                type="textarea"
                :rows="3"
              />
            </div>

            <!-- Photo -->
            <div>
              <label class="form-label">{{ $t('tour.route.stopPhoto') }}</label>
              <div class="flex items-start gap-4">
                <div
                  class="w-32 h-20 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 overflow-hidden flex items-center justify-center"
                >
                  <img
                    v-if="stop.photo?.url"
                    :src="getFileUrl(stop.photo.url)"
                    class="w-full h-full object-cover"
                    :alt="stop.locationSnapshot?.name || ''"
                  />
                  <span v-else class="material-icons text-gray-300 dark:text-gray-600">image</span>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      class="block w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-teal-600 file:text-white hover:file:bg-teal-700"
                      :disabled="!canUpload(stop)"
                      @change="e => onPhotoSelected(e, stop)"
                    />
                    <button
                      v-if="stop.photo?.url"
                      type="button"
                      class="btn-outline btn-sm text-red-600"
                      :disabled="!tourId || uploadingStopId === stop._id"
                      @click="removePhoto(stop)"
                    >
                      {{ $t('common.remove') }}
                    </button>
                  </div>
                  <p v-if="!tourId" class="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    {{ $t('tour.route.saveTourToUpload') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Map -->
      <div class="lg:col-span-5">
        <div
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
          >
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ $t('tour.route.map') }}
            </h4>
            <button type="button" class="btn-outline btn-sm" @click="refreshMap">
              <span class="material-icons text-sm mr-1">refresh</span>
              {{ $t('common.refresh') }}
            </button>
          </div>
          <div :id="mapId" class="h-[520px]"></div>
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
const uploadingStopId = ref('')

const routePlan = computed({
  get: () => props.modelValue || { mode: 'sequence', stops: [] },
  set: val => emit('update:modelValue', val)
})

const stops = computed({
  get: () => routePlan.value.stops || [],
  set: val => {
    const next = { ...(routePlan.value || {}), stops: val }
    routePlan.value = next
  }
})

function getLocalized(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[locale.value] || obj.tr || obj.en || ''
}

function createEmptyStop() {
  return {
    sequence: (stops.value?.length || 0) + 1,
    locationRef: { type: 'city', refId: null },
    locationSnapshot: { name: '', countryCode: '', coordinates: null, zoom: null },
    stay: { unit: 'days', value: 1, timeWindow: { start: '', end: '' } },
    title: { tr: '', en: '' },
    description: { tr: '', en: '' },
    photo: null,
    tags: []
  }
}

function addStop() {
  stops.value = [...stops.value, createEmptyStop()]
}

function removeStop(index) {
  const next = [...stops.value]
  next.splice(index, 1)
  next.forEach((s, i) => (s.sequence = i + 1))
  stops.value = next
}

function moveStop(index, dir) {
  const next = [...stops.value]
  const target = index + dir
  if (target < 0 || target >= next.length) return
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  next.forEach((s, i) => (s.sequence = i + 1))
  stops.value = next
}

function applyLocation(stop, val) {
  if (!val) return
  stop.locationRef = val.locationRef
  stop.locationSnapshot = val.locationSnapshot
  // Keep picker value in sync (UI-only helper)
  stop.location = val
}

const { initMap, setStops, focusOnStop } = useTourRouteMap()

async function refreshMap() {
  await nextTick()
  initMap(mapId, [39.0, 35.0], 6)
  setStops(stops.value, s => s.locationSnapshot?.name)
}

function focusStop(stop) {
  focusOnStop(stop)
}

watch(
  () => stops.value,
  () => {
    refreshMap()
  },
  { deep: true }
)

// Ensure picker is prefilled for existing stops loaded from API
watch(
  () => stops.value,
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

function canUpload(stop) {
  return Boolean(props.tourId && stop?._id)
}

async function onPhotoSelected(e, stop) {
  const file = e.target?.files?.[0]
  if (!file) return
  if (!canUpload(stop)) return

  uploadingStopId.value = stop._id
  try {
    const resp = await tourService.uploadRouteStopPhoto(props.tourId, stop._id, file)
    stop.photo = resp.data?.photo || null
  } finally {
    uploadingStopId.value = ''
    if (e.target) e.target.value = ''
  }
}

async function removePhoto(stop) {
  if (!canUpload(stop)) return
  uploadingStopId.value = stop._id
  try {
    const resp = await tourService.deleteRouteStopPhoto(props.tourId, stop._id)
    stop.photo = resp.data?.photo || null
  } finally {
    uploadingStopId.value = ''
  }
}

onMounted(() => refreshMap())
</script>
