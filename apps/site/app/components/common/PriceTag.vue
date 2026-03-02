<template>
  <div class="flex items-baseline gap-1">
    <span v-if="originalPrice && originalPrice > amount" class="text-sm text-gray-400 line-through">
      {{ formatPrice(originalPrice, currency) }}
    </span>
    <span class="font-bold" :class="sizeClass">
      {{ formatPrice(amount, currency) }}
    </span>
    <span v-if="showPerNight" class="text-xs text-gray-500">{{ $t('common.perNight') }}</span>
  </div>
</template>

<script setup lang="ts">
const { formatPrice } = useCurrency()

defineProps<{
  amount: number
  currency?: string
  originalPrice?: number
  showPerNight?: boolean
  size?: 'sm' | 'md' | 'lg'
}>()

const sizeClass = computed(() => {
  const props = getCurrentInstance()?.props as any
  switch (props?.size) {
    case 'sm':
      return 'text-sm'
    case 'lg':
      return 'text-2xl'
    default:
      return 'text-lg'
  }
})
</script>
