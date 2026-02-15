<template>
  <!-- Loading State -->
  <div v-if="loading" :class="containerClasses" role="status" aria-busy="true">
    <slot name="loading">
      <div class="flex flex-col items-center justify-center py-12 gap-4">
        <div v-if="skeleton">
          <!-- Skeleton preset -->
          <div class="space-y-3 w-full max-w-md">
            <Skeleton type="text" width="60%" />
            <Skeleton type="text" width="100%" />
            <Skeleton type="text" width="80%" />
            <Skeleton type="text" width="90%" />
          </div>
        </div>
        <div v-else class="flex flex-col items-center gap-3">
          <span class="material-icons text-4xl text-gray-300 dark:text-gray-600 animate-spin">
            progress_activity
          </span>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ loadingText || $t('common.loading') }}
          </p>
        </div>
      </div>
    </slot>
  </div>

  <!-- Error State -->
  <div v-else-if="error" :class="containerClasses" role="alert">
    <slot name="error" :error="error" :retry="handleRetry">
      <div class="flex flex-col items-center justify-center py-12 gap-4">
        <span class="material-icons text-5xl text-red-300 dark:text-red-400"> error_outline </span>
        <div class="text-center">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ errorTitle || $t('common.error') }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md">
            {{ typeof error === 'string' ? error : error?.message || $t('common.errorOccurred') }}
          </p>
        </div>
        <button
          v-if="retryable"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          @click="handleRetry"
        >
          {{ retryText || $t('common.retry') }}
        </button>
      </div>
    </slot>
  </div>

  <!-- Empty State -->
  <div v-else-if="empty" :class="containerClasses">
    <slot name="empty">
      <div class="flex flex-col items-center justify-center py-12 gap-4">
        <span class="material-icons text-5xl text-gray-300 dark:text-gray-600">
          {{ emptyIcon || 'inbox' }}
        </span>
        <div class="text-center">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ emptyTitle || $t('common.noData') }}
          </p>
          <p v-if="emptyDescription" class="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md">
            {{ emptyDescription }}
          </p>
        </div>
        <slot name="empty-action"></slot>
      </div>
    </slot>
  </div>

  <!-- Content State -->
  <div v-else :class="containerClasses">
    <slot></slot>
  </div>
</template>

<script setup>
import Skeleton from './Skeleton.vue'

defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: [String, Object, Boolean],
    default: null
  },
  empty: {
    type: Boolean,
    default: false
  },
  // Loading options
  skeleton: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: ''
  },
  // Error options
  errorTitle: {
    type: String,
    default: ''
  },
  retryable: {
    type: Boolean,
    default: true
  },
  retryText: {
    type: String,
    default: ''
  },
  // Empty options
  emptyTitle: {
    type: String,
    default: ''
  },
  emptyDescription: {
    type: String,
    default: ''
  },
  emptyIcon: {
    type: String,
    default: ''
  },
  // Container styling
  containerClasses: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['retry'])

function handleRetry() {
  emit('retry')
}
</script>
