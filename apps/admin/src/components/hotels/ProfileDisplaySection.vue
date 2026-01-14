<template>
  <div class="p-6">
    <div class="flex items-center gap-2 mb-4">
      <span class="material-icons text-purple-600">{{ icon }}</span>
      <h4 class="font-medium text-gray-800 dark:text-white">{{ title }}</h4>
    </div>

    <!-- Extra slot (for custom fields like years, etc) -->
    <slot name="extra"></slot>

    <!-- Features -->
    <div v-if="features.length" class="flex flex-wrap gap-2 mb-4">
      <span
        v-for="feature in features"
        :key="feature"
        class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
      >
        {{ $t(`hotels.profile.features.${feature}`) }}
      </span>
    </div>

    <!-- Content - sanitized for XSS protection -->
    <div
      v-if="content"
      class="text-gray-700 dark:text-slate-300 prose dark:prose-invert max-w-none"
      v-html="sanitizedContent"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { sanitizeHtml } from '@/utils/sanitize'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  features: {
    type: Array,
    default: () => []
  }
})

// Sanitize content for XSS protection
const sanitizedContent = computed(() => {
  if (!props.content) return ''
  return sanitizeHtml(props.content)
})
</script>
