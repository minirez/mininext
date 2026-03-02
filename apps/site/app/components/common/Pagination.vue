<template>
  <nav v-if="totalPages > 1" class="flex items-center justify-center gap-1">
    <button
      @click="$emit('update:page', currentPage - 1)"
      :disabled="currentPage <= 1"
      class="px-3 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {{ $t('common.previous') }}
    </button>

    <button
      v-for="page in visiblePages"
      :key="page"
      @click="$emit('update:page', page)"
      class="w-10 h-10 rounded-lg text-sm font-medium transition-colors"
      :class="
        page === currentPage
          ? 'bg-site-primary text-white'
          : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
      "
    >
      {{ page }}
    </button>

    <button
      @click="$emit('update:page', currentPage + 1)"
      :disabled="currentPage >= totalPages"
      class="px-3 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {{ $t('common.next') }}
    </button>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

defineEmits<{ 'update:page': [page: number] }>()

const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(props.totalPages, props.currentPage + 2)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})
</script>
