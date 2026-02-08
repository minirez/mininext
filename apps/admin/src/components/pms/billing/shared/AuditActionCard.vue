<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-xl border transition-all duration-300"
    :class="cardClass"
  >
    <div class="p-4">
      <div class="flex items-start justify-between gap-4">
        <!-- Avatar & Info -->
        <div class="flex items-start gap-3 min-w-0">
          <div
            class="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0"
          >
            <span v-if="avatarIcon" class="material-icons text-gray-600 dark:text-gray-400">{{
              avatarIcon
            }}</span>
            <span v-else class="text-lg font-medium text-gray-600 dark:text-gray-400">
              {{ initials }}
            </span>
          </div>
          <div class="min-w-0">
            <h4 class="font-medium text-gray-900 dark:text-white truncate">{{ title }}</h4>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ subtitle }}</p>
            <div v-if="$slots.tags" class="flex flex-wrap items-center gap-2 mt-2">
              <slot name="tags"></slot>
            </div>
          </div>
        </div>

        <!-- Status Badge -->
        <div v-if="status" class="flex-shrink-0">
          <span class="px-2 py-1 text-xs font-medium rounded-full" :class="statusBadgeClass">
            {{ status }}
          </span>
        </div>
      </div>

      <!-- Extra info slot -->
      <slot name="info"></slot>

      <!-- Actions -->
      <div
        v-if="$slots.actions && !selectedAction"
        class="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700"
      >
        <slot name="actions"></slot>
      </div>

      <!-- Undo Button -->
      <div
        v-if="selectedAction"
        class="flex items-center justify-end mt-4 pt-4 border-t border-gray-100 dark:border-slate-700"
      >
        <button
          class="flex items-center gap-1 px-3 py-1 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          @click="$emit('undo')"
        >
          <span class="material-icons text-lg">undo</span>
          {{ $t('common.undo') }}
        </button>
      </div>
    </div>

    <!-- Footer slot -->
    <slot name="footer"></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  avatarIcon: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: ''
  },
  selectedAction: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'default',
    validator: value => ['default', 'danger', 'warning', 'success', 'muted'].includes(value)
  }
})

defineEmits(['undo'])

const initials = computed(() => {
  if (!props.title) return '?'
  return props.title
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const cardClass = computed(() => {
  if (props.selectedAction) {
    switch (props.selectedAction) {
      case 'no_show':
        return 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
      case 'cancelled':
        return 'border-gray-300 dark:border-slate-600 bg-gray-50/50 dark:bg-slate-700/30 opacity-75'
      case 'extended':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
      case 'skipped':
        return 'border-gray-200 dark:border-slate-700 opacity-60'
    }
  }

  switch (props.variant) {
    case 'danger':
      return 'border-red-200 dark:border-red-800'
    case 'warning':
      return 'border-amber-200 dark:border-amber-800'
    case 'success':
      return 'border-green-200 dark:border-green-800'
    case 'muted':
      return 'border-gray-200 dark:border-slate-700 opacity-75'
    default:
      return 'border-gray-200 dark:border-slate-700'
  }
})

const statusBadgeClass = computed(() => {
  const action = props.selectedAction
  switch (action) {
    case 'no_show':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'cancelled':
      return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-400'
    case 'extended':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'skipped':
      return 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-500'
    default:
      switch (props.variant) {
        case 'danger':
          return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        case 'warning':
          return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        case 'success':
          return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        default:
          return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-400'
      }
  }
})
</script>
