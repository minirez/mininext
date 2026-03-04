<template>
  <div>
    <h4 class="text-sm font-medium text-gray-700 mb-3">{{ $t('booking.installments') }}</h4>
    <div class="space-y-2">
      <label
        v-for="opt in options"
        :key="opt.count"
        class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all"
        :class="
          modelValue === opt.count
            ? 'border-site-primary bg-site-primary/5'
            : 'border-gray-200 hover:border-gray-300'
        "
      >
        <input
          type="radio"
          :value="opt.count"
          :checked="modelValue === opt.count"
          @change="$emit('update:modelValue', opt.count)"
          class="sr-only"
        />
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-900">
              {{
                opt.count === 1
                  ? $t('booking.singlePayment')
                  : $t('booking.installmentCount', { n: opt.count })
              }}
            </span>
            <span
              v-if="opt.count === 1 || !opt.hasInterest"
              class="text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded"
            >
              {{ $t('booking.interestFree') }}
            </span>
            <span
              v-else-if="opt.hasInterest"
              class="text-[10px] font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded"
            >
              {{ $t('booking.withInterest') }}
            </span>
          </div>
          <div v-if="opt.count > 1" class="text-xs text-gray-500 mt-0.5">
            {{ $t('booking.perMonth', { amount: formatPrice(opt.monthly, currency) }) }}
            <span v-if="opt.hasInterest" class="ml-1">
              · {{ $t('booking.totalWithInterest', { amount: formatPrice(opt.total, currency) }) }}
            </span>
          </div>
        </div>
        <div v-if="modelValue === opt.count" class="text-site-primary shrink-0">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  installmentOptions: any[]
  modelValue: number
  currency: string
  total: number
}>()

defineEmits<{
  'update:modelValue': [value: number]
}>()

const { t: $t } = useI18n()
const { formatPrice } = useCurrency()

const options = computed(() => {
  return props.installmentOptions.map(opt => {
    // opt can be a number or an object { count, rate, total }
    const count = typeof opt === 'number' ? opt : opt.count || opt
    const rate = typeof opt === 'object' ? opt.rate || opt.interestRate || 0 : 0
    const optTotal =
      typeof opt === 'object' && opt.totalAmount ? opt.totalAmount : props.total * (1 + rate / 100)
    const monthly = count > 1 ? Math.round((optTotal / count) * 100) / 100 : optTotal

    return {
      count,
      monthly,
      total: Math.round(optTotal * 100) / 100,
      hasInterest: rate > 0
    }
  })
})
</script>
