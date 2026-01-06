<template>
  <div
    class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
  >
    <div class="flex items-center gap-2 mb-3">
      <span class="material-icons text-amber-500 text-sm">discount</span>
      <h4 class="font-medium text-sm text-gray-800 dark:text-white">
        {{ $t('planning.campaigns.discount') }}
      </h4>
    </div>

    <!-- Discount Type Toggle -->
    <div class="flex gap-2 mb-3">
      <button
        type="button"
        class="flex-1 p-2 rounded-lg border text-center text-sm font-medium transition-all"
        :class="
          !form.freeNightsEnabled
            ? 'bg-amber-500 border-amber-500 text-white'
            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-amber-400'
        "
        @click="form.freeNightsEnabled = false"
      >
        <span
          class="material-icons text-base"
          :class="!form.freeNightsEnabled ? 'text-white' : 'text-amber-500'"
          >percent</span
        >
        <span class="ml-1">{{ $t('planning.campaigns.discountTypes.percentage') }}</span>
      </button>
      <button
        type="button"
        class="flex-1 p-2 rounded-lg border text-center text-sm font-medium transition-all"
        :class="
          form.freeNightsEnabled
            ? 'bg-indigo-500 border-indigo-500 text-white'
            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-indigo-400'
        "
        @click="form.freeNightsEnabled = true"
      >
        <span
          class="material-icons text-base"
          :class="form.freeNightsEnabled ? 'text-white' : 'text-indigo-500'"
          >card_giftcard</span
        >
        <span class="ml-1">{{ $t('planning.campaigns.freeNightsFeature') }}</span>
      </button>
    </div>

    <!-- Percentage Discount Input -->
    <div
      v-if="!form.freeNightsEnabled"
      class="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg"
    >
      <div
        class="flex items-center border border-amber-200 dark:border-amber-700 rounded-lg overflow-hidden"
      >
        <span class="px-2 py-1.5 bg-amber-500 text-white font-bold text-sm">%</span>
        <input
          v-model.number="form.discount.value"
          type="number"
          min="0"
          max="100"
          class="w-16 px-2 py-1.5 border-0 focus:ring-0 text-lg font-bold text-center bg-transparent text-amber-700 dark:text-amber-400"
        />
      </div>
      <span class="text-xs text-gray-500">{{ $t('planning.campaigns.discountHint') }}</span>
    </div>

    <!-- Free Nights Input -->
    <div
      v-else
      class="flex items-center justify-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg"
    >
      <div class="text-center">
        <input
          v-model.number="form.discount.freeNights.stayNights"
          type="number"
          min="2"
          class="w-14 px-2 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-center text-lg font-bold text-indigo-700 dark:text-indigo-400"
        />
        <p class="text-xs text-gray-500 mt-0.5">{{ $t('planning.campaigns.stayNights') }}</p>
      </div>
      <span class="text-xl font-bold text-indigo-500">=</span>
      <div class="text-center">
        <input
          v-model.number="form.discount.freeNights.freeNights"
          type="number"
          min="1"
          class="w-14 px-2 py-1.5 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 text-center text-lg font-bold text-green-700 dark:text-green-400"
        />
        <p class="text-xs text-gray-500 mt-0.5">{{ $t('planning.campaigns.freeNights') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true }
})
</script>
