<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('reports.occupiedRooms') }}</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ data?.summary?.totalRooms || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('reports.totalGuests') }}</p>
        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {{ data?.summary?.totalGuests || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('reports.adults') }}</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ data?.guests?.reduce((sum, g) => sum + g.adults, 0) || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('common.vipGuest') }}</p>
        <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {{ data?.summary?.vipGuests || 0 }}
        </p>
      </div>
    </div>

    <!-- In-House Guests Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <h3 class="font-medium text-gray-900 dark:text-white">{{ $t('reports.inHouseGuests') }}</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.room') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.guest') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.persons') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.checkIn') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.checkOut') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.remainingNights') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.balance') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="guest in data?.guests || []" :key="guest.stayNumber">
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ guest.roomNumber }}
                </p>
                <p class="text-xs text-gray-500">{{ $t('reports.floor') }} {{ guest.floor }}</p>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ guest.guestName }}
                  </p>
                  <span
                    v-if="guest.vipLevel && guest.vipLevel !== 'none'"
                    class="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                    >{{ guest.vipLevel.toUpperCase() }}</span
                  >
                </div>
                <p class="text-xs text-gray-500">{{ guest.nationality }}</p>
              </td>
              <td class="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                {{ guest.adults }}+{{ guest.children }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(guest.checkInDate) }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(guest.checkOutDate) }}
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="
                    guest.remainingNights <= 1
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  "
                  >{{ guest.remainingNights }} {{ $t('reports.night') }}</span
                >
              </td>
              <td class="px-4 py-3 text-right">
                <span :class="guest.balance > 0 ? 'text-red-600' : 'text-green-600'">
                  {{ formatCurrency(guest.balance) }}
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
  data: Object
})

const formatCurrency = amount => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0)
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}
</script>
