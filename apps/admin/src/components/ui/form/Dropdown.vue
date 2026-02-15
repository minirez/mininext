<template>
  <div ref="containerRef" class="ui-dropdown">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <!-- Trigger -->
    <button
      :id="inputId"
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      :class="triggerClasses"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggle"
      @keydown.down.prevent="openAndFocusFirst"
      @keydown.up.prevent="openAndFocusLast"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <!-- Selected Value -->
      <span class="flex-1 text-left truncate">
        <template v-if="selectedOption">
          <span v-if="selectedOption.icon" class="material-icons text-lg mr-2 align-middle">
            {{ selectedOption.icon }}
          </span>
          {{ selectedOption.label }}
        </template>
        <span v-else class="text-gray-400 dark:text-gray-500">
          {{ placeholder }}
        </span>
      </span>

      <!-- Clear Button -->
      <button
        v-if="clearable && modelValue && !disabled"
        type="button"
        class="p-0.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"
        aria-label="Clear selection"
        @click.stop="clear"
      >
        <span class="material-icons text-sm text-gray-400" aria-hidden="true">close</span>
      </button>

      <!-- Dropdown Arrow -->
      <span
        class="material-icons text-gray-400 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      >
        expand_more
      </span>
    </button>

    <!-- Dropdown Menu -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="menuRef"
          :style="menuStyle"
          class="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <!-- Search -->
          <div v-if="searchable" class="p-2 border-b border-gray-200 dark:border-slate-700">
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder"
              :aria-label="searchPlaceholder"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              @keydown.down.prevent="focusNext"
              @keydown.up.prevent="focusPrev"
              @keydown.enter.prevent="selectFocused"
              @keydown.esc.prevent="close"
            />
          </div>

          <!-- Options List -->
          <div class="max-h-60 overflow-y-auto py-1" role="listbox">
            <template v-if="filteredOptions.length > 0">
              <button
                v-for="(option, index) in filteredOptions"
                :key="option.value"
                type="button"
                role="option"
                :aria-selected="isSelected(option)"
                :class="optionClasses(option, index)"
                @click="select(option)"
                @mouseenter="focusedIndex = index"
              >
                <span v-if="option.icon" class="material-icons text-lg">{{ option.icon }}</span>
                <span class="flex-1 text-left">{{ option.label }}</span>
                <span
                  v-if="isSelected(option)"
                  class="material-icons text-indigo-600 dark:text-indigo-400 text-lg"
                >
                  check
                </span>
              </button>
            </template>

            <!-- No Results -->
            <div v-else class="px-3 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              {{ noResultsText }}
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="close"></div>

    <!-- Error Message -->
    <p v-if="error" class="mt-1 text-sm text-red-500 flex items-center gap-1">
      <span class="material-icons text-sm">error</span>
      {{ error }}
    </p>

    <!-- Help Text -->
    <p v-else-if="help" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ help }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, null],
    default: null
  },
  options: {
    type: Array,
    required: true
    // [{ value, label, icon, disabled }]
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Seciniz...'
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  },
  searchable: {
    type: Boolean,
    default: false
  },
  searchPlaceholder: {
    type: String,
    default: 'Ara...'
  },
  noResultsText: {
    type: String,
    default: 'Sonuc bulunamadi'
  },
  error: {
    type: String,
    default: ''
  },
  help: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v)
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'open', 'close'])

// Refs
const containerRef = ref(null)
const triggerRef = ref(null)
const menuRef = ref(null)
const searchInputRef = ref(null)

// State
const isOpen = ref(false)
const searchQuery = ref('')
const focusedIndex = ref(-1)
const menuPosition = ref({ top: 0, left: 0, width: 0 })

// Unique ID
const inputId = `dropdown-${Math.random().toString(36).substr(2, 9)}`

// Selected option
const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)
})

// Filtered options
const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options

  const query = searchQuery.value.toLowerCase()
  return props.options.filter(opt => opt.label.toLowerCase().includes(query))
})

// Trigger classes
const triggerClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base'
  }

  return [
    'w-full flex items-center gap-2 rounded-lg border transition-colors',
    'bg-white dark:bg-slate-700 text-gray-900 dark:text-white',
    'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800',
    props.error
      ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
      : 'border-gray-300 dark:border-slate-600',
    sizes[props.size]
  ]
})

// Option classes
const optionClasses = (option, index) => [
  'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
  option.disabled
    ? 'opacity-50 cursor-not-allowed'
    : focusedIndex.value === index
      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
]

// Menu style
const menuStyle = computed(() => ({
  top: `${menuPosition.value.top}px`,
  left: `${menuPosition.value.left}px`,
  width: `${menuPosition.value.width}px`
}))

// Calculate menu position
const calculatePosition = async () => {
  await nextTick()

  if (!triggerRef.value || !menuRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const menuRect = menuRef.value.getBoundingClientRect()
  const padding = 8

  let top = triggerRect.bottom + 4

  // Check if overflows bottom
  if (top + menuRect.height > window.innerHeight - padding) {
    top = triggerRect.top - menuRect.height - 4
  }

  menuPosition.value = {
    top,
    left: triggerRect.left,
    width: triggerRect.width
  }
}

// Is option selected
const isSelected = option => option.value === props.modelValue

// Toggle dropdown
const toggle = () => {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

// Open dropdown
const open = async () => {
  if (props.disabled) return

  isOpen.value = true
  focusedIndex.value = -1
  searchQuery.value = ''
  emit('open')

  await calculatePosition()

  if (props.searchable && searchInputRef.value) {
    await nextTick()
    searchInputRef.value.focus()
  }
}

// Close dropdown
const close = () => {
  isOpen.value = false
  emit('close')
}

// Open and focus first option
const openAndFocusFirst = async () => {
  if (!isOpen.value) {
    await open()
  }
  focusedIndex.value = 0
}

// Open and focus last option
const openAndFocusLast = async () => {
  if (!isOpen.value) {
    await open()
  }
  focusedIndex.value = filteredOptions.value.length - 1
}

// Focus next option
const focusNext = () => {
  if (focusedIndex.value < filteredOptions.value.length - 1) {
    focusedIndex.value++
  } else {
    focusedIndex.value = 0
  }
}

// Focus previous option
const focusPrev = () => {
  if (focusedIndex.value > 0) {
    focusedIndex.value--
  } else {
    focusedIndex.value = filteredOptions.value.length - 1
  }
}

// Select focused option
const selectFocused = () => {
  if (focusedIndex.value >= 0 && focusedIndex.value < filteredOptions.value.length) {
    select(filteredOptions.value[focusedIndex.value])
  }
}

// Select option
const select = option => {
  if (option.disabled) return

  emit('update:modelValue', option.value)
  emit('change', option)
  close()
}

// Clear selection
const clear = () => {
  emit('update:modelValue', null)
  emit('change', null)
}

// Handle escape key
const handleKeydown = e => {
  if (e.key === 'Escape' && isOpen.value) {
    close()
    triggerRef.value?.focus()
  }
}

// Handle window resize
const handleResize = () => {
  if (isOpen.value) {
    calculatePosition()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
})

// Expose
defineExpose({ open, close, toggle })
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
