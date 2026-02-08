<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        class="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4"
      >
        <p class="text-sm text-green-600 dark:text-green-400">
          {{ $t('reports.revenue.grossRevenue') }}
        </p>
        <p class="text-2xl font-bold text-green-700 dark:text-green-300">
          {{ formatCurrency(data?.summary?.grossRevenue) }}
        </p>
      </div>
      <div
        class="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4"
      >
        <p class="text-sm text-red-600 dark:text-red-400">{{ $t('reports.revenue.refunds') }}</p>
        <p class="text-2xl font-bold text-red-700 dark:text-red-300">
          {{ formatCurrency(data?.summary?.refunds) }}
        </p>
      </div>
      <div
        class="bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-4"
      >
        <p class="text-sm text-orange-600 dark:text-orange-400">
          {{ $t('reports.revenue.discounts') }}
        </p>
        <p class="text-2xl font-bold text-orange-700 dark:text-orange-300">
          {{ formatCurrency(data?.summary?.discounts) }}
        </p>
      </div>
      <div
        class="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4"
      >
        <p class="text-sm text-indigo-600 dark:text-indigo-400">
          {{ $t('reports.revenue.netRevenue') }}
        </p>
        <p class="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
          {{ formatCurrency(data?.summary?.netRevenue) }}
        </p>
      </div>
    </div>

    <!-- Payment Methods -->
    <div class="grid md:grid-cols-2 gap-6">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <h3 class="font-medium text-gray-900 dark:text-white mb-4">
          {{ $t('reports.revenue.byPaymentMethod') }}
        </h3>
        <div class="space-y-3">
          <div
            v-for="pm in data?.byPaymentMethod || []"
            :key="pm.method"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <span class="material-icons text-gray-400 text-lg">{{
                getPaymentIcon(pm.method)
              }}</span>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{
                getPaymentLabel(pm.method)
              }}</span>
            </div>
            <div class="text-right">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(pm.total) }}
              </p>
              <p class="text-xs text-gray-500">
                {{ pm.count }} {{ $t('reports.revenue.transaction') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <h3 class="font-medium text-gray-900 dark:text-white mb-4">
          {{ $t('reports.revenue.byCategory') }}
        </h3>
        <div class="space-y-3">
          <div
            v-for="(catData, catKey) in data?.byCategory || {}"
            :key="catKey"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-700 dark:text-gray-300">{{
              getCategoryLabel(catKey)
            }}</span>
            <div class="text-right">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(catData.total) }}
              </p>
              <p class="text-xs text-gray-500">
                {{ catData.count }} {{ $t('reports.revenue.transaction') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily Revenue -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <h3 class="font-medium text-gray-900 dark:text-white">
          {{ $t('reports.revenue.dailyRevenue') }}
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
                {{ $t('reports.revenue.transactionCount') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.revenue.total') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="day in data?.daily || []" :key="day.date">
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                {{ formatDate(day.date) }}
              </td>
              <td class="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                {{ day.count }}
              </td>
              <td
                class="px-4 py-3 text-sm text-right font-medium text-green-600 dark:text-green-400"
              >
                {{ formatCurrency(day.total) }}
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {{ $t('reports.revenue.total') }}
              </td>
              <td class="px-4 py-3 text-sm text-center font-medium text-gray-900 dark:text-white">
                {{ data?.summary?.transactionCount || 0 }}
              </td>
              <td class="px-4 py-3 text-sm text-right font-bold text-green-600 dark:text-green-400">
                {{ formatCurrency(data?.summary?.grossRevenue) }}
              </td>
            </tr>
          </tfoot>
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

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  })
}

const getPaymentLabel = method => {
  const methodMap = {
    cash: 'reports.revenue.paymentMethod.cash',
    credit_card: 'reports.revenue.paymentMethod.creditCard',
    debit_card: 'reports.revenue.paymentMethod.debitCard',
    bank_transfer: 'reports.revenue.paymentMethod.bankTransfer',
    room_charge: 'reports.revenue.paymentMethod.roomCharge',
    other: 'reports.revenue.paymentMethod.other'
  }
  return methodMap[method]
    ? t(methodMap[method])
    : method || t('reports.revenue.paymentMethod.unknown')
}

const getPaymentIcon = method => {
  const icons = {
    cash: 'payments',
    credit_card: 'credit_card',
    debit_card: 'credit_card',
    bank_transfer: 'account_balance',
    room_charge: 'hotel',
    other: 'more_horiz'
  }
  return icons[method] || 'help'
}

const getCategoryLabel = cat => {
  const catMap = {
    accommodation: 'reports.revenue.category.accommodation',
    food_beverage: 'reports.revenue.category.foodBeverage',
    spa_wellness: 'reports.revenue.category.spaWellness',
    other_services: 'reports.revenue.category.otherServices',
    payments: 'reports.revenue.category.payments',
    adjustments: 'reports.revenue.category.adjustments'
  }
  return catMap[cat] ? t(catMap[cat]) : cat
}
</script>
