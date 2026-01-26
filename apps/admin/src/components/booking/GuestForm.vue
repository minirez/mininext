<template>
  <div
    :class="
      compact
        ? ''
        : 'bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 md:p-6'
    "
  >
    <!-- Header (only if not compact) -->
    <div v-if="!compact" class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div
          class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
        >
          <span class="material-icons text-purple-600 dark:text-purple-400">person</span>
        </div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white">
            {{ title || $t('booking.guestDetails') }}
          </h4>
          <p v-if="subtitle" class="text-sm text-gray-500 dark:text-slate-400">
            {{ subtitle }}
          </p>
        </div>
      </div>
      <!-- Lead Guest Badge -->
      <span
        v-if="isLeadGuest"
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
      >
        <span class="material-icons text-xs mr-1">star</span>
        {{ $t('booking.leadGuest') }}
      </span>
    </div>

    <!-- Form Grid -->
    <div
      :class="
        compact ? 'grid grid-cols-2 md:grid-cols-4 gap-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4'
      "
    >
      <!-- Title -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('booking.title') }} <span class="text-red-500">*</span>
        </label>
        <select
          :value="modelValue.title"
          class="form-input w-full transition-colors"
          :class="getFieldClass('title')"
          autocomplete="off"
          @change="updateField('title', $event.target.value)"
        >
          <option value="">{{ $t('booking.selectTitle') }}</option>
          <option value="mr">{{ $t('booking.titleMr') }}</option>
          <option value="mrs">{{ $t('booking.titleMrs') }}</option>
        </select>
        <p v-if="showValidation && !modelValue.title" class="text-red-500 text-xs mt-1">
          {{ $t('validation.required') }}
        </p>
      </div>

      <!-- First Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('booking.firstName') }} <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          :value="modelValue.firstName"
          class="form-input w-full transition-colors"
          :class="getFieldClass('firstName')"
          :placeholder="$t('booking.firstNamePlaceholder')"
          autocomplete="off"
          @input="updateField('firstName', $event.target.value)"
        />
        <p v-if="showValidation && !modelValue.firstName" class="text-red-500 text-xs mt-1">
          {{ $t('validation.required') }}
        </p>
      </div>

      <!-- Last Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('booking.lastName') }} <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          :value="modelValue.lastName"
          class="form-input w-full transition-colors"
          :class="getFieldClass('lastName')"
          :placeholder="$t('booking.lastNamePlaceholder')"
          autocomplete="off"
          @input="updateField('lastName', $event.target.value)"
        />
        <p v-if="showValidation && !modelValue.lastName" class="text-red-500 text-xs mt-1">
          {{ $t('validation.required') }}
        </p>
      </div>

      <!-- Nationality -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('booking.nationality') }} <span class="text-red-500">*</span>
        </label>
        <CountrySelect
          :model-value="modelValue.nationality"
          :placeholder="$t('booking.selectNationality')"
          :input-class="getFieldClass('nationality')"
          @update:model-value="updateField('nationality', $event)"
        />
        <p v-if="showValidation && !modelValue.nationality" class="text-red-500 text-xs mt-1">
          {{ $t('validation.required') }}
        </p>
      </div>

      <!-- Birth Date -->
      <div v-if="showBirthDate || !isChild">
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('booking.birthDate') }}
          <span v-if="isChild" class="text-red-500">*</span>
        </label>
        <BirthDatePicker
          :model-value="modelValue.birthDate"
          :input-class="isChild ? getFieldClass('birthDate') : ''"
          :min-age="isChild ? 0 : 18"
          :max-age="isChild ? 17 : 100"
          :expected-age="isChild ? childAge : null"
          :check-in-date="checkInDate"
          @update:model-value="updateField('birthDate', $event)"
        />
        <p
          v-if="showValidation && isChild && !modelValue.birthDate"
          class="text-red-500 text-xs mt-1"
        >
          {{ $t('validation.required') }}
        </p>
      </div>

      <!-- TC Number (only for Turkish citizens - optional) -->
      <div v-if="isTurkishCitizen" :class="compact ? 'col-span-2' : ''">
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('booking.tcNumber') }}
        </label>
        <input
          type="text"
          :value="modelValue.tcNumber"
          class="form-input w-full transition-colors"
          :class="getFieldClass('tcNumber')"
          :placeholder="$t('booking.tcNumberPlaceholder')"
          maxlength="11"
          inputmode="numeric"
          autocomplete="off"
          @input="updateField('tcNumber', formatTcNumber($event.target.value))"
        />
        <p
          v-if="showValidation && modelValue.tcNumber && !isValidTcNumber(modelValue.tcNumber)"
          class="text-red-500 text-xs mt-1"
        >
          {{ $t('validation.invalidTcNumber') }}
        </p>
      </div>

      <!-- Email (Lead Guest Only) -->
      <div v-if="isLeadGuest">
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('common.email') }} <span class="text-red-500">*</span>
        </label>
        <input
          type="email"
          :value="modelValue.email"
          class="form-input w-full transition-colors"
          :class="getFieldClass('email')"
          :placeholder="$t('booking.emailPlaceholder')"
          autocomplete="off"
          @input="updateField('email', $event.target.value)"
        />
        <p v-if="showValidation && !modelValue.email" class="text-red-500 text-xs mt-1">
          {{ $t('validation.required') }}
        </p>
        <p
          v-else-if="showValidation && modelValue.email && !isValidEmail(modelValue.email)"
          class="text-red-500 text-xs mt-1"
        >
          {{ $t('validation.invalidEmail') }}
        </p>
      </div>

      <!-- Phone (Lead Guest Only) -->
      <div v-if="isLeadGuest">
        <PhoneInput
          :model-value="modelValue.phone"
          :label="$t('booking.phone')"
          :required="true"
          country="TR"
          :error="showValidation && !modelValue.phone ? $t('validation.required') : ''"
          @update:model-value="updateField('phone', $event)"
        />
      </div>
    </div>

    <!-- Child Age Display -->
    <div
      v-if="isChild && childAge !== null"
      class="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
    >
      <div class="flex items-center text-sm text-blue-700 dark:text-blue-400">
        <span class="material-icons text-sm mr-2">child_care</span>
        {{ $t('booking.childAge') }}: {{ childAge }} {{ $t('booking.yearsOld') }}
      </div>
    </div>

    <!-- Age Mismatch Warning -->
    <div
      v-if="hasAgeMismatch"
      class="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3"
    >
      <div class="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-300">
        <span class="material-icons text-yellow-600 dark:text-yellow-400 text-lg flex-shrink-0"
          >warning</span
        >
        <div>
          <p class="font-medium">{{ $t('booking.ageWarningTitle') }}</p>
          <p class="text-yellow-700 dark:text-yellow-400 mt-0.5">
            {{ $t('booking.ageWarningMessage', { searchAge: childAge, checkInAge: ageAtCheckIn }) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CountrySelect from '@/components/common/CountrySelect.vue'
import BirthDatePicker from '@/components/common/BirthDatePicker.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import {
  useBookingValidation,
  validateTcNumber,
  validateEmail,
  formatTcNumber
} from '@/composables/useBookingValidation'

const { getFieldClass: getValidationFieldClass } = useBookingValidation()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      title: '',
      firstName: '',
      lastName: '',
      nationality: '',
      email: '',
      phone: '',
      birthDate: '',
      tcNumber: ''
    })
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  isLeadGuest: {
    type: Boolean,
    default: false
  },
  isChild: {
    type: Boolean,
    default: false
  },
  childAge: {
    type: Number,
    default: null
  },
  checkInDate: {
    type: String,
    default: ''
  },
  showBirthDate: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  },
  showValidation: {
    type: Boolean,
    default: false
  },
  errors: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

// Check if Turkish citizen
const isTurkishCitizen = computed(() => {
  return props.modelValue.nationality === 'TR'
})

// Calculate age at check-in date
const ageAtCheckIn = computed(() => {
  if (!props.modelValue.birthDate || !props.checkInDate) return null

  const birthDate = new Date(props.modelValue.birthDate)
  const checkIn = new Date(props.checkInDate)

  let age = checkIn.getFullYear() - birthDate.getFullYear()
  const monthDiff = checkIn.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && checkIn.getDate() < birthDate.getDate())) {
    age--
  }
  return age >= 0 ? age : null
})

// Check if age at check-in differs from selected age during search
const hasAgeMismatch = computed(() => {
  if (!props.isChild || props.childAge === null || ageAtCheckIn.value === null) return false
  return ageAtCheckIn.value !== props.childAge
})

// Determine schema type based on guest type
const schemaName = computed(() => (props.isLeadGuest ? 'leadGuest' : 'roomGuest'))

// Build guest data for validation context
const guestData = computed(() => ({
  ...props.modelValue,
  type: props.isChild ? 'child' : 'adult'
}))

// Get field validation class using centralized validation
const getFieldClass = field => {
  return getValidationFieldClass(
    schemaName.value,
    field,
    props.modelValue[field],
    guestData.value,
    props.showValidation
  )
}

// Helper aliases for template
const isValidTcNumber = validateTcNumber
const isValidEmail = validateEmail

// Update field
const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}
</script>
