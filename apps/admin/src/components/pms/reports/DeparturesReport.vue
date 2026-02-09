<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('reports.departures.totalDepartures') }}
        </p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ data?.summary?.total || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('reports.departures.expected') }}
        </p>
        <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {{ data?.summary?.expected || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('reports.departures.checkedOut') }}
        </p>
        <p class="text-2xl font-bold text-green-600 dark:text-green-400">
          {{ data?.summary?.checkedOut || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('reports.departures.withBalance') }}
        </p>
        <p class="text-2xl font-bold text-red-600 dark:text-red-400">
          {{ data?.summary?.withBalance || 0 }}
        </p>
      </div>
    </div>

    <!-- Departures Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <h3 class="font-medium text-gray-900 dark:text-white">
          {{ data?.date }} {{ $t('reports.departures.departuresList') }}
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
                {{ $t('reports.nights') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.status') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.revenue.total') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.balance') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="dep in data?.departures || []" :key="dep.stayNumber">
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ dep.guestName }}</p>
                <p class="text-xs text-gray-500">{{ dep.phone }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="text-sm text-gray-900 dark:text-white">{{ dep.roomNumber }}</p>
                <p class="text-xs text-gray-500">{{ dep.roomType }}</p>
              </td>
              <td class="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                {{ dep.nights }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="
                    dep.status === 'checked_out'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  "
                  >{{
                    dep.status === 'checked_out'
                      ? $t('reports.departures.departed')
                      : $t('reports.departures.waiting')
                  }}</span
                >
              </td>
              <td class="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                {{ formatCurrency(dep.totalAmount) }}
              </td>
              <td class="px-4 py-3 text-right">
                <span
                  class="font-medium"
                  :class="dep.balance > 0 ? 'text-red-600' : 'text-green-600'"
                  >{{ formatCurrency(dep.balance) }}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: Object,
  filters: Object
})

const formatCurrency = amount => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0)
}
</script>
