<template>
  <Teleport to="body">
    <Transition name="drawer-backdrop">
      <div v-if="modelValue" class="ui-drawer fixed inset-0 z-50" @keydown.esc="handleEscape">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 dark:bg-black/70"
          :class="{ 'backdrop-blur-sm': blur }"
          @click="handleBackdropClick"
        ></div>

        <!-- Drawer panel -->
        <Transition :name="transitionName">
          <div
            v-if="modelValue"
            ref="drawerRef"
            class="absolute bg-white dark:bg-slate-800 shadow-2xl flex flex-col"
            :class="[positionClasses, sizeClasses]"
            role="dialog"
            :aria-modal="true"
            :aria-labelledby="title ? 'drawer-title' : undefined"
          >
            <!-- Header -->
            <div
              v-if="title || $slots.header || closable"
              class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700"
            >
              <slot name="header">
                <h3
                  v-if="title"
                  id="drawer-title"
                  class="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {{ title }}
                </h3>
              </slot>

              <button
                v-if="closable"
                type="button"
                class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Close"
                @click="close"
              >
                <span class="material-icons" aria-hidden="true">close</span>
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-4" :class="bodyClasses">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
            >
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  // Position
  position: {
    type: String,
    default: 'right',
    validator: v => ['left', 'right', 'top', 'bottom'].includes(v)
  },
  // Size
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg', 'xl', 'full'].includes(v)
  },
  // Behavior
  closable: {
    type: Boolean,
    default: true
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  closeOnEscape: {
    type: Boolean,
    default: true
  },
  // Appearance
  blur: {
    type: Boolean,
    default: false
  },
  // Prevent body scroll
  preventScroll: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close', 'open'])

const drawerRef = ref(null)

// Position classes
const positionClasses = computed(() => {
  const positions = {
    left: 'left-0 top-0 bottom-0',
    right: 'right-0 top-0 bottom-0',
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0'
  }
  return positions[props.position]
})

// Size classes
const sizeClasses = computed(() => {
  const isHorizontal = ['left', 'right'].includes(props.position)

  if (isHorizontal) {
    const widths = {
      sm: 'w-72',
      md: 'w-96',
      lg: 'w-[480px]',
      xl: 'w-[640px]',
      full: 'w-full'
    }
    return widths[props.size]
  } else {
    const heights = {
      sm: 'h-48',
      md: 'h-72',
      lg: 'h-96',
      xl: 'h-[480px]',
      full: 'h-full'
    }
    return heights[props.size]
  }
})

// Body classes
const bodyClasses = computed(() => {
  return ''
})

// Transition name
const transitionName = computed(() => {
  return `drawer-${props.position}`
})

// Close drawer
const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

// Handle backdrop click
const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

// Handle escape key
const handleEscape = () => {
  if (props.closeOnEscape) {
    close()
  }
}

// Manage body scroll
const originalOverflow = ref('')

watch(
  () => props.modelValue,
  isOpen => {
    if (props.preventScroll) {
      if (isOpen) {
        originalOverflow.value = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        emit('open')
      } else {
        document.body.style.overflow = originalOverflow.value
      }
    }
  }
)

// Cleanup on unmount
onUnmounted(() => {
  if (props.preventScroll && props.modelValue) {
    document.body.style.overflow = originalOverflow.value
  }
})

// Expose
defineExpose({ close })
</script>

<style scoped>
/* Backdrop */
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}

/* Left */
.drawer-left-enter-active,
.drawer-left-leave-active {
  transition: transform 0.3s ease;
}

.drawer-left-enter-from,
.drawer-left-leave-to {
  transform: translateX(-100%);
}

/* Right */
.drawer-right-enter-active,
.drawer-right-leave-active {
  transition: transform 0.3s ease;
}

.drawer-right-enter-from,
.drawer-right-leave-to {
  transform: translateX(100%);
}

/* Top */
.drawer-top-enter-active,
.drawer-top-leave-active {
  transition: transform 0.3s ease;
}

.drawer-top-enter-from,
.drawer-top-leave-to {
  transform: translateY(-100%);
}

/* Bottom */
.drawer-bottom-enter-active,
.drawer-bottom-leave-active {
  transition: transform 0.3s ease;
}

.drawer-bottom-enter-from,
.drawer-bottom-leave-to {
  transform: translateY(100%);
}
</style>
