<template>
  <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-4 mb-4">
    <label class="form-label">{{ $t('planning.markets.ratePolicy') }}</label>
    <div class="flex flex-wrap gap-3">
      <label
        v-for="policy in ratePolicies"
        :key="policy.value"
        class="relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all"
        :class="
          ratePolicy === policy.value
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
        "
      >
        <input
          type="radio"
          :checked="ratePolicy === policy.value"
          class="sr-only"
          @change="$emit('update:ratePolicy', policy.value)"
        />
        <span class="text-sm font-medium">{{ policy.label }}</span>
      </label>
    </div>

    <!-- Non-Refundable Discount -->
    <div
      v-if="ratePolicy !== 'refundable'"
      class="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-slate-600"
    >
      <label class="text-sm text-gray-600 dark:text-slate-400">{{
        $t('planning.markets.nonRefundableDiscount')
      }}</label>
      <div class="flex items-center gap-2">
        <input
          :value="nonRefundableDiscount"
          type="number"
          min="0"
          max="50"
          class="form-input w-20 text-center"
          @input="$emit('update:nonRefundableDiscount', parseInt($event.target.value) || 0)"
        />
        <span class="text-sm text-gray-500">%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  ratePolicy: { type: String, default: 'refundable' },
  nonRefundableDiscount: { type: Number, default: 10 },
  ratePolicies: { type: Array, required: true }
})

defineEmits(['update:ratePolicy', 'update:nonRefundableDiscount'])
</script>
