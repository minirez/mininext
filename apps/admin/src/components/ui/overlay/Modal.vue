<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="ui-modal fixed inset-0 z-50 flex items-center justify-center p-4"
        :class="{ 'items-start pt-16': position === 'top' }"
        @click.self="handleBackdropClick"
        @keydown.esc="handleEscape"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 dark:bg-black/70"
          :class="{ 'backdrop-blur-sm': blur }"
        ></div>

        <!-- Modal Content -->
        <div
          ref="modalRef"
          class="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full overflow-hidden transform transition-all"
          :class="[sizeClasses, contentClasses]"
          role="dialog"
          :aria-modal="true"
          :aria-labelledby="title ? 'modal-title' : undefined"
        >
          <!-- Header -->
          <div
            v-if="title || $slots.header || closable"
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700"
          >
            <slot name="header">
              <h3
                v-if="title"
                id="modal-title"
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
          <div
            class="px-6 py-4"
            :class="[
              scrollable ? 'overflow-y-auto' : '',
              maxHeight ? `max-h-[${maxHeight}]` : scrollable ? 'max-h-[60vh]' : ''
            ]"
          >
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
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  // Size
  size: {
    type: String,
    default: 'md',
    validator: v => ['xs', 'sm', 'md', 'lg', 'xl', 'full'].includes(v)
  },
  // Position
  position: {
    type: String,
    default: 'center',
    validator: v => ['center', 'top'].includes(v)
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
  scrollable: {
    type: Boolean,
    default: true
  },
  maxHeight: {
    type: String,
    default: ''
  },
  // Prevent body scroll
  preventScroll: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close', 'open'])

const modalRef = ref(null)
const previousActiveElement = ref(null)

// Size classes
const sizeClasses = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4'
}[props.size]

const contentClasses = props.size === 'full' ? 'min-h-[80vh]' : ''

// Close modal
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

    // Focus trap
    if (isOpen) {
      nextTick(() => {
        // Store the element that triggered the modal for focus restoration
        if (!previousActiveElement.value) {
          previousActiveElement.value = document.activeElement
        }
        modalRef.value?.focus()
      })
    } else {
      // Restore focus to trigger element on close
      nextTick(() => {
        if (previousActiveElement.value) {
          previousActiveElement.value.focus?.()
          previousActiveElement.value = null
        }
      })
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
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>
