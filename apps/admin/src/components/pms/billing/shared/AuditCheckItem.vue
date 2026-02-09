<template>
  <div class="p-4 rounded-xl border transition-all duration-300" :class="containerClass">
    <div class="flex items-start gap-3">
      <!-- Icon -->
      <div
        class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
        :class="iconContainerClass"
      >
        <span class="material-icons text-lg" :class="{ 'animate-spin': status === 'loading' }">
          {{ iconName }}
        </span>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h4 class="font-medium text-gray-900 dark:text-white">{{ title }}</h4>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
          <slot name="description">{{ description }}</slot>
        </p>

        <!-- Action slot -->
        <slot name="action"></slot>
      </div>

      <!-- Badge -->
      <div v-if="badge" class="flex-shrink-0">
        <span class="px-2 py-1 text-xs font-medium rounded-full" :class="badgeClass">
          {{ badge }}
        </span>
      </div>
    </div>

    <!-- Details slot -->
    <slot name="details"></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'pending',
    validator: value =>
      ['loading', 'success', 'warning', 'error', 'pending', 'info'].includes(value)
  },
  icon: {
    type: String,
    default: ''
  },
  badge: {
    type: [String, Number],
    default: null
  }
})

const containerClass = computed(() => {
  switch (props.status) {
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    case 'error':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    case 'info':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    case 'loading':
    case 'pending':
    default:
      return 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700'
  }
})

const iconContainerClass = computed(() => {
  switch (props.status) {
    case 'success':
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
    case 'warning':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
    case 'error':
      return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    case 'info':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
    case 'loading':
    case 'pending':
    default:
      return 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400'
  }
})

const iconName = computed(() => {
  if (props.icon) return props.icon
  switch (props.status) {
    case 'success':
      return 'check_circle'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    case 'info':
      return 'info'
    case 'loading':
      return 'refresh'
    default:
      return 'pending'
  }
})

const badgeClass = computed(() => {
  switch (props.status) {
    case 'success':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'warning':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'error':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'info':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-400'
  }
})
</script>
