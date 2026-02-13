<template>
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
    <!-- Left: Title & Market -->
    <div class="flex items-center gap-4">
      <div>
        <h3 class="text-xl font-bold text-gray-800 dark:text-white">
          {{ $t('planning.pricing.title') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('planning.pricing.description') }}
        </p>
      </div>

      <!-- Market Selector Tabs -->
      <div v-if="markets.length > 0" class="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1 ml-4">
        <button
          v-for="market in markets"
          :key="market._id"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
          :class="
            selectedMarket?._id === market._id
              ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          "
          @click="$emit('update:selectedMarket', market)"
        >
          <div class="flex items-center gap-2">
            <span class="font-bold">{{ market.currency }}</span>
            <span class="text-xs opacity-75">{{ market.code }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-3">
      <!-- View Toggle -->
      <div class="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
        <button
          class="px-3 py-2 rounded-md transition-colors flex items-center gap-1.5"
          :class="
            viewMode === 'calendar'
              ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm'
              : 'text-gray-500'
          "
          :title="$t('planning.pricing.calendarView')"
          @click="$emit('update:viewMode', 'calendar')"
        >
          <span class="material-icons text-lg">calendar_view_month</span>
          <span class="text-xs font-medium hidden sm:inline">{{
            $t('planning.pricing.calendarView')
          }}</span>
        </button>
        <button
          class="px-3 py-2 rounded-md transition-colors flex items-center gap-1.5"
          :class="
            viewMode === 'period'
              ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm'
              : 'text-gray-500'
          "
          :title="$t('planning.pricing.periodView')"
          @click="$emit('update:viewMode', 'period')"
        >
          <span class="material-icons text-lg">date_range</span>
          <span class="text-xs font-medium hidden sm:inline">{{
            $t('planning.pricing.periodView')
          }}</span>
        </button>
      </div>

      <!-- Season Manager Button -->
      <button
        class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
        :class="
          showSeasonPanel
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200'
        "
        @click="$emit('update:showSeasonPanel', !showSeasonPanel)"
      >
        <span class="material-icons text-lg">wb_sunny</span>
        <span class="hidden sm:inline">{{ $t('planning.pricing.seasons') }}</span>
      </button>

      <!-- Price Query Button -->
      <button
        class="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        :title="$t('planning.pricing.priceQuery') || 'Fiyat Sorgula'"
        @click="$emit('openPriceQuery')"
      >
        <span class="material-icons text-lg">calculate</span>
        <span class="hidden sm:inline">{{ $t('planning.pricing.priceQuery') || 'Sorgula' }}</span>
      </button>

      <!-- Forecast Button -->
      <button
        class="flex items-center gap-2 px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
        :title="$t('planning.pricing.forecast.button')"
        @click="$emit('openForecast')"
      >
        <span class="material-icons text-lg">bar_chart</span>
        <span class="hidden sm:inline">{{ $t('planning.pricing.forecast.button') }}</span>
      </button>

      <!-- Contract Import Button -->
      <button
        class="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
        :title="$t('planning.pricing.contractImport.button')"
        @click="$emit('openContractImport')"
      >
        <span class="material-icons text-lg">description</span>
        <span class="hidden sm:inline">{{ $t('planning.pricing.contractImport.button') }}</span>
      </button>

      <!-- Add Rate Button -->
      <button class="btn-primary flex items-center gap-2" @click="$emit('openBulkModal')">
        <span class="material-icons text-lg">add</span>
        <span class="hidden sm:inline">{{ $t('planning.pricing.addRate') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  markets: { type: Array, default: () => [] },
  selectedMarket: { type: Object, default: null },
  viewMode: { type: String, default: 'calendar' },
  showSeasonPanel: { type: Boolean, default: false }
})

defineEmits([
  'update:selectedMarket',
  'update:viewMode',
  'update:showSeasonPanel',
  'openPriceQuery',
  'openForecast',
  'openContractImport',
  'openBulkModal'
])
</script>
