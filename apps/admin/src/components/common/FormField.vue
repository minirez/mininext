<template>
  <div class="form-field">
    <label v-if="label" class="form-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <!-- Icon Prefix -->
      <span
        v-if="icon"
        class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10"
      >
        <span class="material-icons text-lg">{{ icon }}</span>
      </span>

      <!-- Slot Mode: custom content passed via default slot (not for select which uses slot for options) -->
      <div v-if="$slots.default && type !== 'select'">
        <slot></slot>
      </div>

      <!-- Input -->
      <input
        v-else-if="type !== 'textarea' && type !== 'select'"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :min="min"
        :max="max"
        :step="step"
        class="form-input w-full"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- Textarea -->
      <textarea
        v-else-if="type === 'textarea'"
        ref="inputRef"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :rows="rows"
        class="form-input w-full"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      ></textarea>

      <!-- Select -->
      <select
        v-else-if="type === 'select'"
        ref="inputRef"
        :value="modelValue"
        :disabled="disabled"
        class="form-input w-full"
        :class="inputClasses"
        @change="handleSelect"
        @blur="handleBlur"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <slot></slot>
      </select>

      <!-- Suffix Slot (for buttons, icons, etc.) -->
      <div v-if="$slots.suffix" class="absolute right-2 top-1/2 transform -translate-y-1/2">
        <slot name="suffix"></slot>
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="hasError" class="form-error">
      <span class="material-icons text-sm">error_outline</span>
      {{ errorMessage }}
    </p>

    <!-- Help Text -->
    <p v-else-if="help" class="mt-1 text-xs text-gray-500 dark:text-slate-400">
      {{ help }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  // Unique field name for tracking
  name: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  help: {
    type: String,
    default: ''
  },
  rows: {
    type: Number,
    default: 3
  },
  min: {
    type: [Number, String],
    default: undefined
  },
  max: {
    type: [Number, String],
    default: undefined
  },
  step: {
    type: [Number, String],
    default: undefined
  },
  // Validation rules
  rules: {
    type: Array,
    default: () => []
  },
  // Validate on input change (not just blur)
  validateOnInput: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'validation-change'])

const inputRef = ref(null)
const localError = ref('')
const touched = ref(false)

// Combined error (external or local)
const errorMessage = computed(() => props.error || localError.value)
const hasError = computed(() => !!errorMessage.value)

// Input CSS classes
const inputClasses = computed(() => [props.icon ? 'pl-10' : '', hasError.value ? 'has-error' : ''])

// Validate value against rules
const validateValue = value => {
  if (!props.rules || props.rules.length === 0) return null

  for (const rule of props.rules) {
    // Required check
    if (rule.required) {
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      if (isEmpty) {
        return rule.message || 'Bu alan zorunludur'
      }
    }

    // Skip other validations if value is empty and not required
    if (!value && value !== 0) continue

    // Email validation
    if (rule.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return rule.message || 'Geçerli bir e-posta giriniz'
      }
    }

    // Phone validation
    if (rule.phone) {
      const phoneRegex = /^[+]?[\d\s()-]{7,20}$/
      if (!phoneRegex.test(value)) {
        return rule.message || 'Geçerli bir telefon numarası giriniz'
      }
    }

    // URL validation
    if (rule.url) {
      try {
        new URL(value)
      } catch {
        return rule.message || 'Geçerli bir URL giriniz'
      }
    }

    // Min length
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message || `En az ${rule.minLength} karakter olmalıdır`
    }

    // Max length
    if (rule.maxLength && value.length > rule.maxLength) {
      return rule.message || `En fazla ${rule.maxLength} karakter olabilir`
    }

    // Pattern (regex)
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || 'Geçersiz format'
    }

    // Custom validator
    if (rule.validator && typeof rule.validator === 'function') {
      const result = rule.validator(value)
      if (result !== true) {
        return result || rule.message || 'Geçersiz değer'
      }
    }
  }

  return null
}

// Run validation - returns { valid, error } object
const validate = () => {
  const error = validateValue(props.modelValue)
  localError.value = error || ''
  touched.value = true

  // IMPORTANT: Emit validation change so parent can update immediately
  emit('validation-change', {
    field: props.name,
    error: localError.value,
    valid: !localError.value
  })

  return { valid: !error, error: error || '' }
}

// Clear validation error and notify parent
const clearError = () => {
  localError.value = ''
  emit('validation-change', {
    field: props.name,
    error: '',
    valid: true
  })
}

// Reset field state
const reset = () => {
  localError.value = ''
  touched.value = false
}

// Handle input event
const handleInput = event => {
  const value = event.target.value
  emit('update:modelValue', value)

  // Validate on input if enabled and field was touched
  if (props.validateOnInput && touched.value) {
    // Debounced validation for better UX
    clearTimeout(handleInput.timeout)
    handleInput.timeout = setTimeout(() => {
      validate()
    }, 300)
  } else if (localError.value) {
    // Clear error immediately when user starts typing
    clearError()
  }
}

// Handle select change
const handleSelect = event => {
  const value = event.target.value
  emit('update:modelValue', value)

  if (touched.value) {
    validate()
  } else if (localError.value) {
    clearError()
  }
}

// Handle blur event
const handleBlur = event => {
  touched.value = true
  validate()
  emit('blur', event)
}

// Handle focus event
const handleFocus = event => {
  emit('focus', event)
}

// Watch for external value changes (e.g., form reset or data load)
watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    // If value was set externally (not empty), clear any existing error
    if (newValue && newValue !== oldValue && localError.value) {
      clearError()
    }
  }
)

// Watch for external error prop changes
watch(
  () => props.error,
  newError => {
    if (newError) {
      touched.value = true
    }
  }
)

// Expose methods for parent component
defineExpose({
  validate,
  clearError,
  reset,
  focus: () => inputRef.value?.focus()
})
</script>

<style scoped>
.form-field {
  @apply mb-4;
}

.form-error {
  @apply mt-1 text-sm text-red-500 flex items-center gap-1;
}
</style>
