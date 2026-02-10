<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
        :class="zIndex ? '' : 'z-50'"
        :style="zIndex ? { zIndex } : {}"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="handleOverlayClick"
      >
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
          @after-enter="onAfterEnter"
        >
          <div
            v-if="modelValue"
            ref="modalContentRef"
            class="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full"
            :class="[sizeClass]"
            @keydown="handleTabKey"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700"
            >
              <h3 :id="titleId" class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ title }}
              </h3>
              <button
                ref="closeButtonRef"
                class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Kapat"
                @click="close"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div
              class="p-4 max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden"
              :class="contentClass"
            >
              <slot></slot>
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-slate-700"
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
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md',
    validator: value => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  closeOnOverlay: {
    type: Boolean,
    default: true
  },
  closeOnEsc: {
    type: Boolean,
    default: true
  },
  contentClass: {
    type: String,
    default: ''
  },
  autoFocus: {
    type: Boolean,
    default: true
  },
  trapFocus: {
    type: Boolean,
    default: true
  },
  restoreFocus: {
    type: Boolean,
    default: true
  },
  zIndex: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

// Refs
const modalContentRef = ref(null)
const closeButtonRef = ref(null)
const previouslyFocusedElement = ref(null)

// Generate unique ID for aria-labelledby
const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`

const sizeClass = computed(() => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }
  return sizes[props.size]
})

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close()
  }
}

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

// Get all focusable elements within modal
const getFocusableElements = () => {
  if (!modalContentRef.value) return []

  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ')

  return Array.from(modalContentRef.value.querySelectorAll(focusableSelectors))
}

// Focus first focusable element
const focusFirstElement = () => {
  const focusable = getFocusableElements()

  // Try to find an input or textarea first
  const inputElement = focusable.find(
    el => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT'
  )

  if (inputElement) {
    inputElement.focus()
  } else if (focusable.length > 0) {
    focusable[0].focus()
  }
}

// Handle tab key for focus trap
const handleTabKey = event => {
  if (!props.trapFocus || event.key !== 'Tab') return

  const focusable = getFocusableElements()
  if (focusable.length === 0) return

  const firstElement = focusable[0]
  const lastElement = focusable[focusable.length - 1]

  if (event.shiftKey) {
    // Shift+Tab: If on first element, go to last
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
  } else {
    // Tab: If on last element, go to first
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

// After modal enters, focus first element
const onAfterEnter = () => {
  if (props.autoFocus) {
    nextTick(() => {
      focusFirstElement()
    })
  }
}

// ESC key handler
const handleKeydown = e => {
  if (e.key === 'Escape' && props.closeOnEsc) {
    close()
  }
}

// Watch modelValue to manage focus and event listeners
watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      // Store currently focused element
      if (props.restoreFocus) {
        previouslyFocusedElement.value = document.activeElement
      }

      // Add keydown listener
      document.addEventListener('keydown', handleKeydown)

      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Remove keydown listener
      document.removeEventListener('keydown', handleKeydown)

      // Restore body scroll
      document.body.style.overflow = ''

      // Restore focus to previously focused element
      if (props.restoreFocus && previouslyFocusedElement.value) {
        nextTick(() => {
          previouslyFocusedElement.value?.focus()
        })
      }
    }
  },
  { immediate: true }
)

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// Expose methods for parent components
defineExpose({
  close,
  focusFirstElement
})
</script>
