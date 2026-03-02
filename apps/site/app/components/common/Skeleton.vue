<template>
  <div class="animate-pulse" :class="[rounded, className]" :style="{ width, height }">
    <div class="bg-gray-200 rounded w-full h-full" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  width?: string
  height?: string
  rounded?: string
  className?: string
}>()
</script>
