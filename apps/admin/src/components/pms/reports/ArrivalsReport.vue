<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('reports.arrivals.totalArrivals') }}
        </p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ data?.summary?.total || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('reports.arrivals.expected') }}
        </p>
        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {{ data?.summary?.expected || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('reports.arrivals.checkedIn') }}
        </p>
        <p class="text-2xl font-bold text-green-600 dark:text-green-400">
          {{ data?.summary?.checkedIn || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('reports.arrivals.noShow') }}</p>
        <p class="text-2xl font-bold text-red-600 dark:text-red-400">
          {{ data?.summary?.noShow || 0 }}
        </p>
      </div>
    </div>

    <!-- Arrivals Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <h3 class="font-medium text-gray-900 dark:text-white">
          {{ data?.date }} {{ $t('reports.arrivals.arrivalsList') }}
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.guest') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.room') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.persons') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.nights') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.status') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.balance') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="arrival in data?.arrivals || []" :key="arrival.stayNumber">
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ arrival.guestName }}
                </p>
                <p class="text-xs text-gray-500">{{ arrival.phone }} - {{ arrival.nationality }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="text-sm text-gray-900 dark:text-white">{{ arrival.roomNumber }}</p>
                <p class="text-xs text-gray-500">{{ arrival.roomType }}</p>
              </td>
              <td class="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                {{ arrival.adults }}+{{ arrival.children }}
              </td>
              <td class="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                {{ arrival.nights }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="getStatusClass(arrival.status)"
                  >{{ getStatusLabel(arrival.status) }}</span
                >
              </td>
              <td class="px-4 py-3 text-right">
                <span :class="arrival.balance > 0 ? 'text-red-600' : 'text-green-600'">
                  {{ formatCurrency(arrival.balance) }}
                </span>
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

const formatCurrency = amount => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0)
}

const getStatusLabel = status => {
  const statusMap = {
    reserved: 'reports.arrivals.status.reserved',
    confirmed: 'reports.arrivals.status.confirmed',
    checked_in: 'reports.arrivals.status.checkedIn',
    no_show: 'reports.arrivals.status.noShow',
    cancelled: 'reports.arrivals.status.cancelled'
  }
  return statusMap[status] ? t(statusMap[status]) : status
}

const getStatusClass = status => {
  const classes = {
    reserved: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-indigo-100 text-indigo-800',
    checked_in: 'bg-green-100 text-green-800',
    no_show: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}
</script>
