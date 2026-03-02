<template>
  <nav aria-label="Breadcrumb" class="text-sm text-gray-500">
    <ol class="flex items-center gap-1 flex-wrap">
      <li v-for="(item, i) in items" :key="i" class="flex items-center gap-1">
        <span v-if="i > 0" class="text-gray-300">/</span>
        <NuxtLink
          v-if="i < items.length - 1"
          :to="item.to"
          class="hover:text-site-primary transition-colors"
        >
          {{ item.label }}
        </NuxtLink>
        <span v-else class="text-gray-800 font-medium">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  items: Array<{ label: string; to: string }>
}>()
</script>
