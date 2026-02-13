<template>
  <Modal
    :model-value="modelValue"
    :title="$t('planning.pricing.forecast.title')"
    size="xl"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="space-y-6">
      <!-- Filter Bar -->
      <div class="flex flex-wrap items-end gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
        <div class="flex-1 min-w-[140px]">
          <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
            {{ $t('planning.pricing.forecast.dateRange') }}
          </label>
          <div class="flex gap-2">
            <input
              v-model="startDate"
              type="date"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
            />
            <input
              v-model="endDate"
              type="date"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
            />
          </div>
        </div>
        <div class="min-w-[160px]">
          <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
            {{ $t('planning.pricing.roomType') }}
          </label>
          <select
            v-model="selectedRoomType"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
          >
            <option value="">{{ $t('planning.pricing.forecast.allRoomTypes') }}</option>
            <option v-for="rt in roomTypes" :key="rt._id" :value="rt._id">
              {{ rt.code }} - {{ getRoomTypeName(rt) }}
            </option>
          </select>
        </div>
        <button
          class="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          :disabled="loading"
          @click="fetchForecast"
        >
          <span v-if="loading" class="material-icons text-sm animate-spin">refresh</span>
          <span v-else class="material-icons text-sm">search</span>
          {{ $t('planning.pricing.forecast.search') }}
        </button>
      </div>

      <!-- Summary Cards -->
      <div v-if="summary.length > 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="s in summary"
          :key="s.roomType?._id || s.roomType"
          class="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          <div class="text-sm font-bold text-gray-800 dark:text-white mb-2">
            {{ s.roomType?.code || '-' }}
          </div>
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="text-gray-500 dark:text-slate-400">{{
                $t('planning.pricing.forecast.totalAllotment')
              }}</span>
              <span class="font-semibold text-gray-800 dark:text-white">{{
                s.totalAllotment
              }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500 dark:text-slate-400">{{
                $t('planning.pricing.forecast.sold')
              }}</span>
              <span class="font-semibold text-blue-600 dark:text-blue-400">{{
                s.totalBooked
              }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500 dark:text-slate-400">{{
                $t('planning.pricing.forecast.available')
              }}</span>
              <span
                class="font-semibold"
                :class="s.available <= 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'"
                >{{ s.available }}</span
              >
            </div>
            <!-- Occupancy Bar -->
            <div class="mt-2">
              <div class="flex justify-between text-[10px] mb-0.5">
                <span class="text-gray-400 dark:text-slate-500">{{
                  $t('planning.pricing.forecast.occupancy')
                }}</span>
                <span class="font-bold" :class="getOccupancyColor(s.avgOccupancy)"
                  >{{ s.avgOccupancy }}%</span
                >
              </div>
              <div class="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="getOccupancyBarColor(s.avgOccupancy)"
                  :style="{ width: `${Math.min(100, s.avgOccupancy)}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- View Toggle -->
      <div v-if="daily.length > 0" class="flex items-center gap-2">
        <button
          class="px-3 py-1.5 text-xs rounded-lg transition-colors"
          :class="
            viewMode === 'table'
              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
          "
          @click="viewMode = 'table'"
        >
          <span class="material-icons text-sm align-middle mr-1">table_rows</span>
          {{ $t('planning.pricing.forecast.tableView') }}
        </button>
        <button
          class="px-3 py-1.5 text-xs rounded-lg transition-colors"
          :class="
            viewMode === 'heatmap'
              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
          "
          @click="viewMode = 'heatmap'"
        >
          <span class="material-icons text-sm align-middle mr-1">grid_on</span>
          {{ $t('planning.pricing.forecast.heatmapView') }}
        </button>
      </div>

      <!-- Table View -->
      <div
        v-if="daily.length > 0 && viewMode === 'table'"
        class="overflow-auto max-h-[400px] rounded-lg border border-gray-200 dark:border-slate-700"
      >
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-slate-800 sticky top-0 z-10">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400">
                {{ $t('planning.pricing.forecast.dateRange') }}
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400">
                {{ $t('planning.pricing.roomType') }}
              </th>
              <th
                class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400"
              >
                {{ $t('planning.pricing.forecast.totalAllotment') }}
              </th>
              <th
                class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400"
              >
                {{ $t('planning.pricing.forecast.sold') }}
              </th>
              <th
                class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400"
              >
                {{ $t('planning.pricing.forecast.available') }}
              </th>
              <th
                class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400"
              >
                {{ $t('planning.pricing.forecast.occupancy') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
            <tr
              v-for="(row, idx) in daily"
              :key="idx"
              class="hover:bg-gray-50 dark:hover:bg-slate-800/50"
              :class="{ 'bg-red-50/50 dark:bg-red-900/10': row.stopSale }"
            >
              <td class="px-3 py-2 text-gray-800 dark:text-white font-mono text-xs">
                {{ formatDate(row.date) }}
              </td>
              <td class="px-3 py-2">
                <span class="text-xs font-medium text-purple-600 dark:text-purple-400">{{
                  row.roomType?.code || '-'
                }}</span>
              </td>
              <td class="px-3 py-2 text-center text-gray-600 dark:text-slate-400">
                {{ row.totalAllotment }}
              </td>
              <td class="px-3 py-2 text-center font-semibold text-blue-600 dark:text-blue-400">
                {{ row.booked }}
              </td>
              <td
                class="px-3 py-2 text-center font-semibold"
                :class="row.available <= 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'"
              >
                {{ row.available }}
              </td>
              <td class="px-3 py-2 text-center">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                  :class="getOccupancyBadgeClass(row.occupancyPercent)"
                >
                  {{ row.occupancyPercent }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Heatmap View -->
      <div v-if="daily.length > 0 && viewMode === 'heatmap'" class="overflow-auto rounded-lg">
        <div
          class="grid gap-1"
          :style="{ gridTemplateColumns: `repeat(${heatmapCols}, minmax(32px, 1fr))` }"
        >
          <div
            v-for="(row, idx) in daily"
            :key="idx"
            class="p-1.5 rounded text-center text-[9px] font-bold cursor-default transition-colors"
            :class="getHeatmapCellClass(row.occupancyPercent)"
            :title="`${formatDate(row.date)} - ${row.roomType?.code}: ${row.booked}/${row.totalAllotment} (${row.occupancyPercent}%)`"
          >
            <div class="text-[8px] opacity-70">{{ row.date.slice(8) }}</div>
            <div>{{ row.occupancyPercent }}%</div>
          </div>
        </div>
      </div>

      <!-- No Data -->
      <div
        v-if="!loading && daily.length === 0 && hasFetched"
        class="text-center py-12 text-gray-500 dark:text-slate-400"
      >
        <span class="material-icons text-4xl mb-2 block">bar_chart</span>
        {{ $t('planning.pricing.forecast.noData') }}
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import rateService from '@/services/planning/rateService'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  hotelId: { type: String, required: true },
  hotelName: { type: String, default: '' },
  roomTypes: { type: Array, default: () => [] },
  initialMonth: { type: Object, default: null }
})

defineEmits(['update:modelValue'])

const { t, locale } = useI18n()

const loading = ref(false)
const hasFetched = ref(false)
const daily = ref([])
const summary = ref([])
const viewMode = ref('table')
const selectedRoomType = ref('')

// Default dates from initialMonth
const getDefaultDates = () => {
  const year = props.initialMonth?.year || new Date().getFullYear()
  const month = props.initialMonth?.month || new Date().getMonth() + 1
  const lastDay = new Date(year, month, 0).getDate()
  return {
    start: `${year}-${String(month).padStart(2, '0')}-01`,
    end: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  }
}

const defaults = getDefaultDates()
const startDate = ref(defaults.start)
const endDate = ref(defaults.end)

// Reset on modal open
watch(
  () => props.modelValue,
  val => {
    if (val) {
      const d = getDefaultDates()
      startDate.value = d.start
      endDate.value = d.end
      selectedRoomType.value = ''
      daily.value = []
      summary.value = []
      hasFetched.value = false
      // Auto-fetch
      fetchForecast()
    }
  }
)

const heatmapCols = computed(() => {
  if (daily.value.length === 0) return 7
  const dates = new Set(daily.value.map(d => d.date))
  return Math.min(dates.size, 31)
})

const getRoomTypeName = rt => {
  return rt.name?.[locale.value] || rt.name?.tr || rt.name?.en || rt.code
}

const formatDate = dateStr => {
  const [y, m, d] = dateStr.split('-')
  return locale.value === 'tr' ? `${d}.${m}.${y}` : `${m}/${d}/${y}`
}

const fetchForecast = async () => {
  if (!startDate.value || !endDate.value) return

  loading.value = true
  hasFetched.value = true
  try {
    const params = {
      startDate: startDate.value,
      endDate: endDate.value
    }
    if (selectedRoomType.value) {
      params.roomType = selectedRoomType.value
    }

    const result = await rateService.getForecast(props.hotelId, params)
    if (result.success) {
      daily.value = result.data.daily || []
      summary.value = result.data.summary || []
    }
  } catch (err) {
    console.error('Forecast fetch error:', err)
    daily.value = []
    summary.value = []
  } finally {
    loading.value = false
  }
}

const getOccupancyColor = pct => {
  if (pct >= 90) return 'text-red-600 dark:text-red-400'
  if (pct >= 70) return 'text-amber-600 dark:text-amber-400'
  if (pct >= 40) return 'text-green-600 dark:text-green-400'
  return 'text-blue-600 dark:text-blue-400'
}

const getOccupancyBarColor = pct => {
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-amber-500'
  if (pct >= 40) return 'bg-green-500'
  return 'bg-blue-500'
}

const getOccupancyBadgeClass = pct => {
  if (pct >= 90) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  if (pct >= 70) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
  if (pct >= 40) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
}

const getHeatmapCellClass = pct => {
  if (pct >= 90) return 'bg-red-500 text-white'
  if (pct >= 70) return 'bg-amber-400 text-amber-900'
  if (pct >= 40) return 'bg-green-400 text-green-900'
  if (pct > 0) return 'bg-blue-300 text-blue-900'
  return 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
}
</script>
