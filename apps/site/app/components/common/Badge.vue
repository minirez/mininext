<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
    :class="variantClasses"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-green-100 text-green-700'
    case 'warning':
      return 'bg-amber-100 text-amber-700'
    case 'danger':
      return 'bg-red-100 text-red-700'
    case 'info':
      return 'bg-blue-100 text-blue-700'
    case 'neutral':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-site-primary/10 text-site-primary'
  }
})
</script>
