<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('reports.vip.totalVip') }}</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ data?.summary?.total || 0 }}
        </p>
      </div>
      <div
        class="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4"
      >
        <p class="text-sm text-purple-600 dark:text-purple-400">Platinum</p>
        <p class="text-2xl font-bold text-purple-700 dark:text-purple-300">
          {{ data?.summary?.platinum || 0 }}
        </p>
      </div>
      <div
        class="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-4"
      >
        <p class="text-sm text-yellow-600 dark:text-yellow-400">Gold</p>
        <p class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
          {{ data?.summary?.gold || 0 }}
        </p>
      </div>
      <div
        class="bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-4"
      >
        <p class="text-sm text-gray-600 dark:text-gray-400">Silver</p>
        <p class="text-2xl font-bold text-gray-700 dark:text-gray-300">
          {{ data?.summary?.silver || 0 }}
        </p>
      </div>
    </div>

    <!-- Total Spent -->
    <div class="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-6 text-white">
      <p class="text-sm opacity-80">{{ $t('reports.vip.totalSpent') }}</p>
      <p class="text-3xl font-bold">{{ formatCurrency(data?.summary?.totalSpent) }}</p>
    </div>

    <!-- VIP Guests Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <h3 class="font-medium text-gray-900 dark:text-white">{{ $t('reports.vip.guestList') }}</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.guest') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.vip.contact') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">VIP</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.vip.stays') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.nights') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.vip.totalSpent') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.vip.lastStay') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="guest in data?.guests || []" :key="guest.email">
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ guest.name }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ guest.email }}</p>
                <p class="text-xs text-gray-500">{{ guest.phone }}</p>
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="getVipClass(guest.vipLevel)"
                  >{{ guest.vipLevel?.toUpperCase() }}</span
                >
              </td>
              <td class="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                {{ guest.totalStays }}
              </td>
              <td class="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                {{ guest.totalNights }}
              </td>
              <td
                class="px-4 py-3 text-right text-sm font-medium text-green-600 dark:text-green-400"
              >
                {{ formatCurrency(guest.totalSpent) }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(guest.lastStayDate) }}
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

const { t, locale } = useI18n()

defineProps({
  data: Object
})

// Locale mapping for Intl API
const localeMap = { tr: 'tr-TR', en: 'en-US' }

const formatCurrency = amount => {
  return new Intl.NumberFormat(localeMap[locale.value] || 'tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount || 0)
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(localeMap[locale.value] || 'tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getVipClass = level => {
  const classes = {
    platinum: 'bg-purple-100 text-purple-800',
    gold: 'bg-yellow-100 text-yellow-800',
    silver: 'bg-gray-100 text-gray-800'
  }
  return classes[level] || 'bg-gray-100 text-gray-800'
}
</script>
