<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
      <div
        class="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"
      ></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">
        {{ $t('planning.pricing.contractImport.parsing') }}
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
        {{ $t('planning.pricing.contractImport.aiAnalyzingMultiPass') }}
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="parseError" class="text-center py-8">
      <div
        class="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
      >
        <span class="material-icons text-3xl text-red-600 dark:text-red-400">error</span>
      </div>
      <p class="mt-4 text-red-600 dark:text-red-400 font-medium">
        {{ $t('planning.pricing.contractImport.parseFailed') }}
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ parseError }}</p>
      <button
        class="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
        @click="$emit('retry')"
      >
        {{ $t('common.tryAgain') }}
      </button>
    </div>

    <!-- Success State -->
    <div v-else-if="parsedData" class="space-y-4">
      <!-- Contract Info -->
      <div
        class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4"
      >
        <div class="flex items-center gap-3 mb-3">
          <span class="material-icons text-purple-600 dark:text-purple-400">info</span>
          <h4 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('planning.pricing.contractImport.contractInfo') }}
          </h4>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400">{{
              $t('planning.pricing.contractImport.hotelName')
            }}</span>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ parsedData.contractInfo?.hotelName || '-' }}
            </p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">{{
              $t('planning.pricing.contractImport.validPeriod')
            }}</span>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDate(parsedData.contractInfo?.validFrom) }} -
              {{ formatDate(parsedData.contractInfo?.validTo) }}
            </p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">{{
              $t('planning.pricing.contractImport.currency')
            }}</span>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ parsedData.contractInfo?.currency || 'EUR' }}
            </p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">{{
              $t('planning.pricing.contractImport.confidence')
            }}</span>
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :class="getConfidenceColor(parsedData.confidence?.overall)"
                  :style="{ width: `${parsedData.confidence?.overall || 0}%` }"
                ></div>
              </div>
              <span class="text-xs font-medium">{{ parsedData.confidence?.overall || 0 }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ parsedData.periods?.length || 0 }}
          </p>
          <p class="text-xs text-blue-600/70 dark:text-blue-400/70">
            {{ $t('planning.pricing.contractImport.periods') }}
          </p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ parsedData.roomTypes?.length || 0 }}
          </p>
          <p class="text-xs text-green-600/70 dark:text-green-400/70">
            {{ $t('planning.pricing.contractImport.roomTypes') }}
          </p>
        </div>
        <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {{ parsedData.mealPlans?.length || 0 }}
          </p>
          <p class="text-xs text-amber-600/70 dark:text-amber-400/70">
            {{ $t('planning.pricing.contractImport.mealPlans') }}
          </p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {{ parsedData.pricing?.length || 0 }}
          </p>
          <p class="text-xs text-purple-600/70 dark:text-purple-400/70">
            {{ $t('planning.pricing.contractImport.priceEntries') }}
          </p>
        </div>
      </div>

      <!-- Pricing Completeness -->
      <div
        v-if="pricingCompleteness !== null"
        class="rounded-xl p-4 border"
        :class="
          pricingCompleteness >= 95
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : pricingCompleteness >= 70
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        "
      >
        <div class="flex items-center gap-3">
          <span
            class="material-icons"
            :class="
              pricingCompleteness >= 95
                ? 'text-green-600 dark:text-green-400'
                : pricingCompleteness >= 70
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
            "
          >
            {{ pricingCompleteness >= 95 ? 'check_circle' : 'pie_chart' }}
          </span>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ $t('planning.pricing.contractImport.completeness') }}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <div class="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="
                    pricingCompleteness >= 95
                      ? 'bg-green-500'
                      : pricingCompleteness >= 70
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  "
                  :style="{ width: `${pricingCompleteness}%` }"
                ></div>
              </div>
              <span
                class="text-xs font-bold"
                :class="
                  pricingCompleteness >= 95
                    ? 'text-green-600 dark:text-green-400'
                    : pricingCompleteness >= 70
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                "
                >%{{ pricingCompleteness }}</span
              >
            </div>
            <p v-if="parsedData.validation" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ parsedData.validation.totalFound }} / {{ parsedData.validation.totalExpected }}
              {{ $t('planning.pricing.contractImport.priceEntries') }}
              <span
                v-if="parsedData.validation.missingCount > 0"
                class="text-amber-600 dark:text-amber-400"
              >
                ({{ parsedData.validation.missingCount }}
                {{ $t('planning.pricing.contractImport.missing') }})
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Warnings -->
      <div
        v-if="parsedData.warnings?.length"
        class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="material-icons text-amber-600 dark:text-amber-400">warning</span>
          <h4 class="font-semibold text-amber-800 dark:text-amber-300">
            {{ $t('planning.pricing.contractImport.warnings') }}
          </h4>
        </div>
        <ul class="list-disc list-inside text-sm text-amber-700 dark:text-amber-400 space-y-1">
          <li v-for="(warning, index) in parsedData.warnings" :key="index">{{ warning }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isLoading: { type: Boolean, default: false },
  parseError: { type: String, default: null },
  parsedData: { type: Object, default: null },
  pricingCompleteness: { type: Number, default: null },
  formatDate: { type: Function, required: true },
  getConfidenceColor: { type: Function, required: true }
})

defineEmits(['retry'])
</script>
