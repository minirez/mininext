<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('reports.shift.totalShifts') }}
        </p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ data?.summary?.totalShifts || 0 }}
        </p>
      </div>
      <div
        class="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4"
      >
        <p class="text-sm text-green-600 dark:text-green-400">
          {{ $t('reports.shift.cashReceived') }}
        </p>
        <p class="text-2xl font-bold text-green-700 dark:text-green-300">
          {{ formatCurrency(data?.summary?.cashReceived) }}
        </p>
      </div>
      <div
        class="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4"
      >
        <p class="text-sm text-blue-600 dark:text-blue-400">
          {{ $t('reports.shift.cardReceived') }}
        </p>
        <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">
          {{ formatCurrency(data?.summary?.cardReceived) }}
        </p>
      </div>
      <div
        class="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4"
      >
        <p class="text-sm text-indigo-600 dark:text-indigo-400">
          {{ $t('reports.shift.netSales') }}
        </p>
        <p class="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
          {{ formatCurrency(data?.summary?.netSales) }}
        </p>
      </div>
    </div>

    <!-- Discrepancy Alert -->
    <div
      v-if="data?.summary?.totalDiscrepancy !== 0"
      class="p-4 rounded-lg"
      :class="
        data?.summary?.totalDiscrepancy > 0
          ? 'bg-green-50 dark:bg-green-900/20'
          : 'bg-red-50 dark:bg-red-900/20'
      "
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span
            class="material-icons"
            :class="data?.summary?.totalDiscrepancy > 0 ? 'text-green-600' : 'text-red-600'"
          >
            {{ data?.summary?.totalDiscrepancy > 0 ? 'trending_up' : 'trending_down' }}
          </span>
          <span :class="data?.summary?.totalDiscrepancy > 0 ? 'text-green-700' : 'text-red-700'">
            {{
              data?.summary?.totalDiscrepancy > 0
                ? $t('reports.shift.cashSurplus')
                : $t('reports.shift.cashShortage')
            }}
          </span>
        </div>
        <span
          class="font-bold"
          :class="data?.summary?.totalDiscrepancy > 0 ? 'text-green-700' : 'text-red-700'"
        >
          {{ formatCurrency(Math.abs(data?.summary?.totalDiscrepancy)) }}
        </span>
      </div>
    </div>

    <!-- Shifts Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <h3 class="font-medium text-gray-900 dark:text-white">
          {{ $t('reports.shift.shiftList') }}
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.shift.shift') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.shift.cashier') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.shift.dateTime') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.shift.transactions') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.shift.cash') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.shift.card') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.shift.net') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.shift.discrepancy') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="shift in data?.shifts || []" :key="shift.shiftNumber">
              <td class="px-4 py-3">
                <p class="text-sm font-mono text-gray-900 dark:text-white">
                  {{ shift.shiftNumber }}
                </p>
                <span
                  class="px-1.5 py-0.5 rounded text-xs"
                  :class="
                    shift.status === 'open'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  "
                  >{{
                    shift.status === 'open' ? $t('reports.shift.open') : $t('reports.shift.closed')
                  }}</span
                >
              </td>
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                {{ shift.cashierName }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                <p>{{ formatDateTime(shift.openedAt) }}</p>
                <p v-if="shift.closedAt" class="text-xs">{{ formatDateTime(shift.closedAt) }}</p>
              </td>
              <td class="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                {{ shift.transactionCount }}
              </td>
              <td class="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                {{ formatCurrency(shift.cashReceived) }}
              </td>
              <td class="px-4 py-3 text-right text-sm text-blue-600 dark:text-blue-400">
                {{ formatCurrency(shift.cardReceived) }}
              </td>
              <td class="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(shift.netSales) }}
              </td>
              <td class="px-4 py-3 text-right text-sm">
                <span
                  v-if="shift.discrepancy !== 0"
                  :class="shift.discrepancy > 0 ? 'text-green-600' : 'text-red-600'"
                >
                  {{ shift.discrepancy > 0 ? '+' : '' }}{{ formatCurrency(shift.discrepancy) }}
                </span>
                <span v-else class="text-gray-400">-</span>
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

const formatDateTime = date => {
  if (!date) return '-'
  return new Date(date).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
