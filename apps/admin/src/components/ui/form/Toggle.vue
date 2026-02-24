<template>
  <label
    class="ui-toggle relative inline-flex items-center gap-3"
    :class="{ 'cursor-not-allowed opacity-50': disabled, 'cursor-pointer': !disabled }"
  >
    <!-- Hidden input for form compatibility -->
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      :name="name"
      class="sr-only"
      @change="toggle"
    />

    <!-- Toggle Track -->
    <span
      class="relative inline-flex items-center shrink-0 rounded-full transition-colors duration-200"
      :class="[trackSizeClasses, modelValue ? activeColorClasses : 'bg-gray-300 dark:bg-slate-600']"
    >
      <!-- Toggle Thumb -->
      <span
        class="absolute bg-white rounded-full shadow-sm transition-transform duration-200"
        :class="[thumbSizeClasses, modelValue ? thumbTranslateClasses : 'translate-x-0.5']"
      >
        <!-- Icons inside thumb -->
        <span
          v-if="checkedIcon || uncheckedIcon"
          class="absolute inset-0 flex items-center justify-center"
        >
          <span
            v-if="modelValue && checkedIcon"
            class="material-icons transition-opacity"
            :class="iconSizeClasses"
            :style="{ color: activeColor }"
          >
            {{ checkedIcon }}
          </span>
          <span
            v-else-if="!modelValue && uncheckedIcon"
            class="material-icons text-gray-400 transition-opacity"
            :class="iconSizeClasses"
          >
            {{ uncheckedIcon }}
          </span>
        </span>
      </span>

      <!-- Track Icons (inside track, not thumb) -->
      <span v-if="showTrackIcons" class="flex items-center justify-between w-full px-1">
        <span
          class="material-icons text-white transition-opacity"
          :class="[trackIconSizeClasses, modelValue ? 'opacity-100' : 'opacity-0']"
        >
          check
        </span>
        <span
          class="material-icons text-gray-400 transition-opacity"
          :class="[trackIconSizeClasses, modelValue ? 'opacity-0' : 'opacity-100']"
        >
          close
        </span>
      </span>
    </span>

    <!-- Label -->
    <span v-if="label || $slots.default" class="select-none" :class="labelClasses">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    default: ''
  },
  // Sizes
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v)
  },
  // Colors
  color: {
    type: String,
    default: 'indigo',
    validator: v =>
      ['indigo', 'green', 'blue', 'red', 'amber', 'purple', 'pink', 'teal'].includes(v)
  },
  // Icons
  checkedIcon: {
    type: String,
    default: ''
  },
  uncheckedIcon: {
    type: String,
    default: ''
  },
  showTrackIcons: {
    type: Boolean,
    default: false
  },
  // Label position
  labelPosition: {
    type: String,
    default: 'right',
    validator: v => ['left', 'right'].includes(v)
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// Color classes
const colorMap = {
  indigo: 'bg-indigo-600 dark:bg-indigo-500',
  green: 'bg-green-600 dark:bg-green-500',
  blue: 'bg-blue-600 dark:bg-blue-500',
  red: 'bg-red-600 dark:bg-red-500',
  amber: 'bg-amber-500 dark:bg-amber-400',
  purple: 'bg-purple-600 dark:bg-purple-500',
  pink: 'bg-pink-600 dark:bg-pink-500',
  teal: 'bg-teal-600 dark:bg-teal-500'
}

const activeColorClasses = computed(() => colorMap[props.color])

const activeColor = computed(() => {
  const colors = {
    indigo: '#6366f1',
    green: '#22c55e',
    blue: '#3b82f6',
    red: '#ef4444',
    amber: '#f59e0b',
    purple: '#a855f7',
    pink: '#ec4899',
    teal: '#14b8a6'
  }
  return colors[props.color]
})

// Size classes
const trackSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-8 h-5',
    md: 'w-11 h-6',
    lg: 'w-14 h-8'
  }
  return sizes[props.size]
})

const thumbSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  }
  return sizes[props.size]
})

const thumbTranslateClasses = computed(() => {
  const translates = {
    sm: 'translate-x-3.5',
    md: 'translate-x-5',
    lg: 'translate-x-6'
  }
  return translates[props.size]
})

const iconSizeClasses = computed(() => {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  return sizes[props.size]
})

const trackIconSizeClasses = computed(() => {
  const sizes = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm'
  }
  return sizes[props.size]
})

const labelClasses = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base'
  }
  return [
    sizes[props.size],
    'text-gray-700 dark:text-gray-300',
    props.labelPosition === 'left' ? 'order-first' : ''
  ]
})

// Toggle handler
const toggle = () => {
  if (props.disabled) return
  const newValue = !props.modelValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
}
</script>
