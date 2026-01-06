<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-slate-700"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-slate-400">
            {{ $t('agencies.totalAgencies') }}
          </p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stats.total }}</p>
        </div>
        <div
          class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"
        >
          <span class="material-icons text-purple-600 dark:text-purple-400">storefront</span>
        </div>
      </div>
    </div>
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-slate-700"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-slate-400">
            {{ $t('agencies.activeAgencies') }}
          </p>
          <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {{ stats.active }}
          </p>
        </div>
        <div
          class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center"
        >
          <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
        </div>
      </div>
    </div>
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-slate-700"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-slate-400">
            {{ $t('agencies.pendingAgencies') }}
          </p>
          <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
            {{ stats.pending }}
          </p>
        </div>
        <div
          class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center"
        >
          <span class="material-icons text-yellow-600 dark:text-yellow-400">pending</span>
        </div>
      </div>
    </div>
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-slate-700"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-slate-400">
            {{ $t('agencies.totalCredit') }}
          </p>
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {{ formatCurrency(stats.totalCredit, 'TRY', locale) }}
          </p>
        </div>
        <div
          class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"
        >
          <span class="material-icons text-blue-600 dark:text-blue-400"
            >account_balance_wallet</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency } from '@/utils/formatters'

defineProps({
  stats: { type: Object, required: true },
  locale: { type: String, default: 'tr' }
})
</script>
