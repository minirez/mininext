<template>
  <div class="space-y-6">
    <!-- No Hotel Selected Warning -->
    <div
      v-if="!hotelId"
      class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center"
    >
      <span class="material-icons text-4xl text-amber-500 mb-2">domain_disabled</span>
      <p class="font-medium text-amber-800 dark:text-amber-200">{{ $t('pms.noHotelSelected') }}</p>
      <p class="text-sm text-amber-600 dark:text-amber-400 mt-1">
        {{ $t('pms.selectHotelDesc') }}
      </p>
    </div>

    <template v-else>
      <!-- Date Filter -->
      <div class="flex justify-end">
        <div class="flex items-center gap-2">
          <select
            v-model="dateRangeType"
            class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300"
            @change="onDateRangeChange"
          >
            <option v-for="opt in dateRangeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <template v-if="dateRangeType === 'custom'">
            <input
              v-model="filters.startDate"
              type="date"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300"
            />
            <input
              v-model="filters.endDate"
              type="date"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300"
            />
          </template>
          <button
            class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
            :title="$t('reports.refresh')"
            @click="refreshReport"
          >
            <span class="material-icons">refresh</span>
          </button>
        </div>
      </div>

      <!-- Report Selection (when no report selected) -->
      <div v-if="!selectedReport" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="category in reportCategories"
          :key="category.id"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center"
              :class="`bg-${category.color}-100 dark:bg-${category.color}-900/30`"
            >
              <span
                class="material-icons"
                :class="`text-${category.color}-600 dark:text-${category.color}-400`"
                >{{ category.icon }}</span
              >
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ category.label }}
            </h3>
          </div>
          <ul class="space-y-2">
            <li
              v-for="report in category.reports"
              :key="report.type"
              class="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              @click="selectReport(report)"
            >
              <span class="material-icons text-lg">{{ report.icon }}</span>
              <div class="flex-1">
                <p class="text-sm font-medium">{{ report.label }}</p>
                <p class="text-xs text-gray-400">{{ report.description }}</p>
              </div>
              <span class="material-icons text-gray-400">chevron_right</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Selected Report View -->
      <div v-else>
        <!-- Back Button & Title -->
        <div class="flex items-center gap-4 mb-6">
          <button
            class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
            @click="selectedReport = null"
          >
            <span class="material-icons">arrow_back</span>
          </button>
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ selectedReport.label }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ selectedReport.description }}
            </p>
          </div>
        </div>

        <!-- Loading State -->
        <div
          v-if="loading"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center"
        >
          <div
            class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"
          ></div>
          <p class="mt-4 text-gray-500 dark:text-slate-400">{{ $t('reports.loading') }}</p>
        </div>

        <!-- Report Content -->
        <div v-else>
          <!-- Occupancy Report -->
          <OccupancyReport
            v-if="selectedReport.type === 'occupancy'"
            :data="reportData"
            :filters="filters"
          />

          <!-- Arrivals Report -->
          <ArrivalsReport
            v-else-if="selectedReport.type === 'arrivals'"
            :data="reportData"
            :filters="filters"
          />

          <!-- Departures Report -->
          <DeparturesReport
            v-else-if="selectedReport.type === 'departures'"
            :data="reportData"
            :filters="filters"
          />

          <!-- In-House Report -->
          <InHouseReport v-else-if="selectedReport.type === 'in_house'" :data="reportData" />

          <!-- Housekeeping Report -->
          <HousekeepingReport
            v-else-if="selectedReport.type === 'housekeeping'"
            :data="reportData"
          />

          <!-- Revenue Report -->
          <RevenueReport
            v-else-if="selectedReport.type === 'revenue'"
            :data="reportData"
            :filters="filters"
          />

          <!-- Shift Report -->
          <ShiftReport
            v-else-if="selectedReport.type === 'shifts'"
            :data="reportData"
            :filters="filters"
          />

          <!-- Nationality Report -->
          <NationalityReport
            v-else-if="selectedReport.type === 'nationality'"
            :data="reportData"
            :filters="filters"
          />

          <!-- VIP Guests Report -->
          <VipGuestsReport v-else-if="selectedReport.type === 'vip_guests'" :data="reportData" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import reportsService, {
  REPORT_CATEGORIES,
  REPORT_TYPES,
  DATE_RANGE_OPTIONS,
  getDateRange
} from '@/services/pms/reportsService'

// Report components
import OccupancyReport from '@/components/pms/reports/OccupancyReport.vue'
import ArrivalsReport from '@/components/pms/reports/ArrivalsReport.vue'
import DeparturesReport from '@/components/pms/reports/DeparturesReport.vue'
import InHouseReport from '@/components/pms/reports/InHouseReport.vue'
import HousekeepingReport from '@/components/pms/reports/HousekeepingReport.vue'
import RevenueReport from '@/components/pms/reports/RevenueReport.vue'
import ShiftReport from '@/components/pms/reports/ShiftReport.vue'
import NationalityReport from '@/components/pms/reports/NationalityReport.vue'
import VipGuestsReport from '@/components/pms/reports/VipGuestsReport.vue'
import { usePmsStore } from '@/stores/pms'

const pmsStore = usePmsStore()
const hotelId = computed(() => pmsStore.hotelId)
const toast = useToast()
const { t } = useI18n()

import { computed } from 'vue'

const loading = ref(false)
const selectedReport = ref(null)
const reportData = ref(null)
const dateRangeType = ref('this_month')
const dateRangeOptions = DATE_RANGE_OPTIONS
const reportCategories = REPORT_CATEGORIES

const filters = ref({
  startDate: '',
  endDate: ''
})

// Initialize date range
const initDateRange = () => {
  const range = getDateRange(dateRangeType.value)
  filters.value.startDate = range.startDate
  filters.value.endDate = range.endDate
}

const onDateRangeChange = () => {
  if (dateRangeType.value !== 'custom') {
    initDateRange()
    if (selectedReport.value) {
      fetchReport()
    }
  }
}

const selectReport = async report => {
  selectedReport.value = report
  await fetchReport()
}

const fetchReport = async () => {
  if (!hotelId.value || !selectedReport.value) return

  loading.value = true
  reportData.value = null

  try {
    const params = {
      startDate: filters.value.startDate,
      endDate: filters.value.endDate
    }

    let response
    switch (selectedReport.value.type) {
      case REPORT_TYPES.OCCUPANCY:
        response = await reportsService.getOccupancyReport(hotelId.value, params)
        break
      case REPORT_TYPES.ARRIVALS:
        response = await reportsService.getArrivalsReport(hotelId.value, {
          date: filters.value.startDate
        })
        break
      case REPORT_TYPES.DEPARTURES:
        response = await reportsService.getDeparturesReport(hotelId.value, {
          date: filters.value.startDate
        })
        break
      case REPORT_TYPES.IN_HOUSE:
        response = await reportsService.getInHouseReport(hotelId.value)
        break
      case REPORT_TYPES.HOUSEKEEPING:
        response = await reportsService.getHousekeepingReport(hotelId.value)
        break
      case REPORT_TYPES.REVENUE:
        response = await reportsService.getRevenueReport(hotelId.value, params)
        break
      case REPORT_TYPES.SHIFTS:
        response = await reportsService.getShiftReport(hotelId.value, params)
        break
      case REPORT_TYPES.NATIONALITY:
        response = await reportsService.getNationalityReport(hotelId.value, params)
        break
      case REPORT_TYPES.VIP_GUESTS:
        response = await reportsService.getVipGuestsReport(hotelId.value)
        break
      default:
        toast.error(t('reports.unknownType'))
        return
    }

    reportData.value = response.data
  } catch (error) {
    toast.error(t('reports.loadError'))
    console.error(error)
  } finally {
    loading.value = false
  }
}

const refreshReport = () => {
  if (selectedReport.value) {
    fetchReport()
  }
}

watch(
  () => hotelId.value,
  () => {
    if (hotelId.value && selectedReport.value) {
      fetchReport()
    }
  }
)

watch(
  () => [filters.value.startDate, filters.value.endDate],
  () => {
    if (dateRangeType.value === 'custom' && selectedReport.value) {
      fetchReport()
    }
  },
  { deep: true }
)

onMounted(() => {
  initDateRange()
})
</script>
