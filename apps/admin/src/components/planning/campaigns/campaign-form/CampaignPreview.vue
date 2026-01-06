<template>
  <div
    class="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
  >
    <div class="flex items-center gap-2 mb-3">
      <span class="material-icons text-amber-500">preview</span>
      <h4 class="font-medium text-gray-800 dark:text-white">
        {{ $t('planning.campaigns.impactPreview') }}
      </h4>
    </div>

    <!-- Sample Price Input -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div>
        <label class="text-xs text-gray-600 dark:text-slate-400 mb-1 block">{{
          $t('planning.campaigns.samplePrice')
        }}</label>
        <div class="relative">
          <input
            :value="previewPrice"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 pr-12"
            placeholder="1000"
            @input="$emit('update:preview-price', Number($event.target.value))"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
        </div>
      </div>

      <div>
        <label class="text-xs text-gray-600 dark:text-slate-400 mb-1 block">{{
          $t('planning.campaigns.sampleNights')
        }}</label>
        <input
          :value="previewNights"
          type="number"
          min="1"
          max="30"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
          placeholder="7"
          @input="$emit('update:preview-nights', Number($event.target.value))"
        />
      </div>

      <div class="flex items-end">
        <button
          type="button"
          class="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          @click="$emit('calculate')"
        >
          <span class="material-icons text-sm">calculate</span>
          {{ $t('planning.campaigns.calculatePreview') }}
        </button>
      </div>
    </div>

    <!-- Preview Results -->
    <div v-if="previewResult" class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <!-- Original Price -->
      <div
        class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
      >
        <div class="text-xs text-gray-500 dark:text-slate-400 mb-1">
          {{ $t('planning.campaigns.originalPrice') }}
        </div>
        <div class="text-lg font-bold text-gray-700 dark:text-slate-300 line-through">
          {{ formatPrice(previewResult.originalPrice) }}
        </div>
      </div>

      <!-- Discount Amount -->
      <div
        class="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800"
      >
        <div class="text-xs text-green-600 dark:text-green-400 mb-1">
          {{ $t('planning.campaigns.discountAmount') }}
        </div>
        <div class="text-lg font-bold text-green-600 dark:text-green-400">
          -{{ formatPrice(previewResult.discountAmount) }}
        </div>
        <div class="text-xs text-green-500">{{ previewResult.discountText }}</div>
      </div>

      <!-- Final Price -->
      <div
        class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800"
      >
        <div class="text-xs text-blue-600 dark:text-blue-400 mb-1">
          {{ $t('planning.campaigns.finalPrice') }}
        </div>
        <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
          {{ formatPrice(previewResult.finalPrice) }}
        </div>
      </div>

      <!-- Savings Percentage -->
      <div
        class="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800"
      >
        <div class="text-xs text-purple-600 dark:text-purple-400 mb-1">
          {{ $t('planning.campaigns.savings') }}
        </div>
        <div class="text-lg font-bold text-purple-600 dark:text-purple-400">
          {{ previewResult.savingsPercent }}%
        </div>
        <div class="text-xs text-purple-500">{{ $t('planning.campaigns.offOriginal') }}</div>
      </div>
    </div>

    <!-- Free Nights Preview -->
    <div
      v-if="previewResult && previewResult.freeNights > 0"
      class="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800"
    >
      <div class="flex items-center gap-2">
        <span class="material-icons text-yellow-500">celebration</span>
        <span class="text-sm font-medium text-yellow-700 dark:text-yellow-400">
          {{ previewResult.freeNights }} {{ $t('planning.campaigns.freeNightsIncluded') }}
        </span>
      </div>
      <div class="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
        {{
          $t('planning.campaigns.payForNights', {
            pay: previewNights - previewResult.freeNights,
            stay: previewNights
          })
        }}
      </div>
    </div>

    <!-- No Discount Warning -->
    <div
      v-if="previewResult && previewResult.discountAmount === 0"
      class="mt-3 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg"
    >
      <div class="flex items-center gap-2 text-gray-600 dark:text-slate-400">
        <span class="material-icons text-sm">info</span>
        <span class="text-sm">{{ $t('planning.campaigns.noDiscountApplied') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  previewPrice: { type: Number, default: 1000 },
  previewNights: { type: Number, default: 7 },
  previewResult: { type: Object, default: null },
  formatPrice: { type: Function, required: true }
})

defineEmits(['update:preview-price', 'update:preview-nights', 'calculate'])
</script>
