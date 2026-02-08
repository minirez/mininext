<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('reports.totalRooms') }}</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ data?.summary?.totalRooms || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('reports.occupancy.averageOccupancy') }}
        </p>
        <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          %{{ data?.summary?.averageOccupancy || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('reports.occupancy.totalArrivals') }}
        </p>
        <p class="text-2xl font-bold text-green-600 dark:text-green-400">
          {{ data?.summary?.totalArrivals || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('reports.occupancy.totalDepartures') }}
        </p>
        <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {{ data?.summary?.totalDepartures || 0 }}
        </p>
      </div>
    </div>

    <!-- Daily Data Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <h3 class="font-medium text-gray-900 dark:text-white">
          {{ $t('reports.occupancy.dailyOccupancy') }}
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.occupancy.date') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.occupancy.occupied') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.occupancy.vacant') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.occupiedRooms') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.occupancy.arrivals') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.occupancy.departures') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="day in data?.daily || []" :key="day.date">
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                {{ formatDate(day.date) }}
              </td>
              <td class="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                {{ day.occupiedRooms }}
              </td>
              <td class="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                {{ day.availableRooms }}
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <div class="w-16 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-indigo-500 rounded-full"
                      :style="{ width: `${day.occupancyRate}%` }"
                    ></div>
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white"
                    >%{{ day.occupancyRate }}</span
                  >
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400">
                {{ day.arrivals }}
              </td>
              <td class="px-4 py-3 text-sm text-center text-orange-600 dark:text-orange-400">
                {{ day.departures }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  data: Object,
  filters: Object
})

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  })
}
</script>
