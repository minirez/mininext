<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-2 gap-4">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('reports.totalGuests') }}</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ data?.summary?.totalGuests || 0 }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('reports.nationalityReport.uniqueCountries') }}
        </p>
        <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {{ data?.summary?.uniqueNationalities || 0 }}
        </p>
      </div>
    </div>

    <!-- Nationality Chart -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
    >
      <h3 class="font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('reports.nationalityReport.countryDistribution') }}
      </h3>
      <div class="space-y-3">
        <div
          v-for="nat in (data?.nationalities || []).slice(0, 10)"
          :key="nat.nationality"
          class="flex items-center gap-4"
        >
          <div class="w-20 text-sm font-medium text-gray-900 dark:text-white">
            {{ nat.nationality }}
          </div>
          <div class="flex-1">
            <div class="w-full h-6 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
              <div
                class="h-full bg-indigo-500 rounded-full flex items-center justify-end pr-2"
                :style="{ width: `${Math.max(nat.percentage, 5)}%` }"
              >
                <span v-if="nat.percentage > 10" class="text-xs text-white font-medium"
                  >%{{ nat.percentage }}</span
                >
              </div>
            </div>
          </div>
          <div class="w-20 text-right text-sm text-gray-600 dark:text-gray-400">
            {{ nat.guestCount }} {{ $t('reports.guest').toLowerCase() }}
          </div>
        </div>
      </div>
    </div>

    <!-- Full Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <h3 class="font-medium text-gray-900 dark:text-white">
          {{ $t('reports.nationalityReport.detailedList') }}
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.nationalityReport.country') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.guest') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.nationalityReport.percentage') }}
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.nationalityReport.totalNights') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.nationalityReport.totalRevenue') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="nat in data?.nationalities || []" :key="nat.nationality">
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {{ nat.nationality }}
              </td>
              <td class="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                {{ nat.guestCount }}
              </td>
              <td class="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                %{{ nat.percentage }}
              </td>
              <td class="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                {{ nat.totalNights }}
              </td>
              <td class="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                {{ formatCurrency(nat.totalRevenue) }}
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
