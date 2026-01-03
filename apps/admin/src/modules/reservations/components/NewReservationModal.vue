<template>
  <Modal
    v-model="show"
    :title="$t('pms.reservation.newReservation')"
    size="lg"
    :close-on-overlay="false"
    @close="close"
  >
    <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <!-- Agency Selector (for PMS only if applicable) -->
      <div v-if="showAgencySelector" class="pb-4 border-b border-gray-200 dark:border-slate-700">
        <AgencySelector
          v-model="form.agencyId"
          :label="$t('pms.reservation.agency')"
          :error="getError('agencyId')"
          @created="handleAgencyCreated"
        />
      </div>

      <!-- Dates Section -->
      <div>
        <h4 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-4">
          <span class="material-icons text-indigo-500 text-lg">event</span>
          {{ $t('pms.reservation.dates') }}
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DatePicker
            v-model="form.checkIn"
            :label="$t('pms.reservation.checkIn')"
            :min-date="today"
            :required="true"
            :error="getError('checkIn')"
            @change="handleCheckInChange"
          />

          <DatePicker
            v-model="form.checkOut"
            :label="$t('pms.reservation.checkOut')"
            :min-date="minCheckOutDate"
            :required="true"
            :error="getError('checkOut')"
          />

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('pms.reservation.nights') }}
            </label>
            <div class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <span class="material-icons text-indigo-600 dark:text-indigo-400">nightlight</span>
              <span class="text-lg font-bold text-indigo-700 dark:text-indigo-300">{{ nights }}</span>
              <span class="text-sm text-indigo-600 dark:text-indigo-400">{{ $t('pms.reservation.nightsLabel') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Room Type & Meal Plan Section -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PMSRoomTypeSelector
          v-model="form.roomTypeId"
          :hotel-id="hotelId"
          :check-in="form.checkIn"
          :check-out="form.checkOut"
          :required="true"
          :error="getError('roomTypeId')"
          @select="handleRoomTypeSelect"
        />

        <MealPlanSelector
          v-model="form.mealPlanId"
          :hotel-id="hotelId"
          :required="true"
          :error="getError('mealPlanId')"
        />
      </div>

      <!-- Guest Info Section -->
      <div>
        <h4 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-4">
          <span class="material-icons text-indigo-500 text-lg">person</span>
          {{ $t('pms.reservation.guestInfo') }}
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- First Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('pms.reservation.firstName') }} *
            </label>
            <div class="relative">
              <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">badge</span>
              <input
                v-model="form.leadGuest.firstName"
                type="text"
                class="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
                :class="getInputClass('firstName')"
                :placeholder="$t('pms.reservation.firstNamePlaceholder')"
                @blur="touchField('firstName')"
              />
            </div>
            <p v-if="getError('firstName')" class="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span class="material-icons text-xs">error</span>
              {{ getError('firstName') }}
            </p>
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('pms.reservation.lastName') }} *
            </label>
            <div class="relative">
              <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">badge</span>
              <input
                v-model="form.leadGuest.lastName"
                type="text"
                class="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
                :class="getInputClass('lastName')"
                :placeholder="$t('pms.reservation.lastNamePlaceholder')"
                @blur="touchField('lastName')"
              />
            </div>
            <p v-if="getError('lastName')" class="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span class="material-icons text-xs">error</span>
              {{ getError('lastName') }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('common.email') }}
            </label>
            <div class="relative">
              <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">email</span>
              <input
                v-model="form.contact.email"
                type="email"
                class="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
                :class="getInputClass('email')"
                placeholder="ornek@email.com"
                @blur="touchField('email')"
              />
            </div>
            <p v-if="getError('email')" class="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span class="material-icons text-xs">error</span>
              {{ getError('email') }}
            </p>
          </div>

          <!-- Phone -->
          <div>
            <PhoneInput
              v-model="form.contact.phone"
              :label="$t('common.phone')"
              country="TR"
              :required="false"
            />
          </div>

          <!-- ID Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('pms.reservation.idNumber') }}
            </label>
            <div class="relative">
              <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">credit_card</span>
              <input
                v-model="form.leadGuest.idNumber"
                type="text"
                class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                :placeholder="$t('pms.reservation.idNumberPlaceholder')"
              />
            </div>
          </div>

          <!-- Nationality -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('pms.reservation.nationality') }}
            </label>
            <CountrySelect
              v-model="form.leadGuest.nationality"
              :placeholder="$t('pms.reservation.selectNationality')"
            />
          </div>
        </div>
      </div>

      <!-- Occupancy Section -->
      <div>
        <h4 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
          <span class="material-icons text-indigo-500 text-lg">groups</span>
          {{ $t('pms.reservation.occupancy') }}
        </h4>

        <GuestCountSelector
          :adults="form.adults"
          :children="form.childrenAges"
          :max-adults="10"
          :max-children="6"
          child-input-mode="age"
          @update:adults="form.adults = $event"
          @update:children="form.childrenAges = $event"
        />
      </div>

      <!-- Pricing Section -->
      <div>
        <h4 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-4">
          <span class="material-icons text-indigo-500 text-lg">payments</span>
          {{ $t('pms.reservation.pricing') }}
        </h4>

        <div class="grid grid-cols-2 gap-4">
          <!-- Total Amount with Currency -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('pms.reservation.totalAmount') }} *
            </label>
            <div class="flex">
              <select
                v-model="form.pricing.currency"
                class="w-20 px-2 py-2 border border-r-0 rounded-l-lg bg-gray-50 dark:bg-slate-600 text-gray-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                :class="getError('total') ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'"
              >
                <option value="TRY">₺</option>
                <option value="USD">$</option>
                <option value="EUR">€</option>
                <option value="GBP">£</option>
              </select>
              <input
                v-model.number="form.pricing.total"
                type="number"
                min="0"
                step="0.01"
                class="flex-1 min-w-0 px-3 py-2 border rounded-r-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                :class="getError('total') ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-slate-600'"
                @blur="touchField('total')"
              />
            </div>
            <p v-if="getError('total')" class="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span class="material-icons text-xs">error</span>
              {{ getError('total') }}
            </p>
          </div>

          <!-- Deposit with Payment Method -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('pms.reservation.deposit') }}
            </label>
            <div class="flex">
              <span class="w-10 flex items-center justify-center border border-r-0 border-gray-300 dark:border-slate-600 rounded-l-lg bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-slate-400 text-sm">
                {{ getCurrencySymbol(form.pricing.currency) }}
              </span>
              <input
                v-model.number="form.paymentAmount"
                type="number"
                min="0"
                step="0.01"
                class="flex-1 min-w-0 px-3 py-2 border-y border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <select
                v-model="form.paymentMethod"
                class="w-24 px-2 py-2 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg bg-gray-50 dark:bg-slate-600 text-gray-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option v-for="method in paymentMethods" :key="method.value" :value="method.value">
                  {{ method.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Special Requests -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('pms.reservation.specialRequests') }}
        </label>
        <div class="relative">
          <span class="material-icons absolute left-3 top-3 text-gray-400">notes</span>
          <textarea
            v-model="form.specialRequests"
            rows="2"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            :placeholder="$t('pms.reservation.specialRequestsPlaceholder')"
          ></textarea>
        </div>
      </div>

      <!-- Validation Summary -->
      <div
        v-if="showValidationSummary && Object.keys(errors).length > 0"
        class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
      >
        <div class="flex items-start gap-3">
          <span class="material-icons text-red-500">warning</span>
          <div>
            <h5 class="font-medium text-red-700 dark:text-red-400">{{ $t('pms.reservation.validationErrors') }}</h5>
            <ul class="mt-2 space-y-1 text-sm text-red-600 dark:text-red-400">
              <li v-for="(error, key) in errors" :key="key" class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <!-- Summary -->
        <div class="text-sm text-gray-500 dark:text-slate-400">
          <span v-if="form.pricing.total > 0">
            {{ $t('pms.reservation.total') }}:
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ getCurrencySymbol(form.pricing.currency) }}{{ form.pricing.total.toLocaleString() }}
            </span>
          </span>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="close"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            :disabled="loading"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            @click="submit"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            :disabled="loading"
          >
            <span v-if="loading" class="material-icons animate-spin text-sm">refresh</span>
            <span class="material-icons text-sm" v-else>add</span>
            {{ $t('pms.reservation.createReservation') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import DatePicker from '@/components/ui/date/DatePicker.vue'
import CountrySelect from '@/components/common/CountrySelect.vue'
import GuestCountSelector from '@/components/common/GuestCountSelector.vue'
import PMSRoomTypeSelector from './PMSRoomTypeSelector.vue'
import MealPlanSelector from './MealPlanSelector.vue'
import AgencySelector from './AgencySelector.vue'
import reservationService, { PAYMENT_METHODS } from '@/services/pms/reservationService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  },
  showAgencySelector: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'created'])

const { t } = useI18n()
const toast = useToast()

const loading = ref(false)
const showValidationSummary = ref(false)
const touchedFields = reactive({})

const paymentMethods = PAYMENT_METHODS

const today = new Date().toISOString().split('T')[0]

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const defaultForm = () => ({
  agencyId: '',
  roomTypeId: '',
  mealPlanId: '',
  checkIn: today,
  checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  leadGuest: {
    firstName: '',
    lastName: '',
    idNumber: '',
    nationality: 'TR'
  },
  contact: {
    email: '',
    phone: ''
  },
  adults: 2,
  childrenAges: [],
  pricing: {
    total: 0,
    currency: 'TRY'
  },
  paymentAmount: 0,
  paymentMethod: 'cash',
  specialRequests: ''
})

const form = ref(defaultForm())

// Computed
const nights = computed(() => {
  if (!form.value.checkIn || !form.value.checkOut) return 0
  const checkIn = new Date(form.value.checkIn)
  const checkOut = new Date(form.value.checkOut)
  const diff = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
})

const minCheckOutDate = computed(() => {
  if (!form.value.checkIn) return today
  const checkIn = new Date(form.value.checkIn)
  checkIn.setDate(checkIn.getDate() + 1)
  return checkIn.toISOString().split('T')[0]
})

// Validation
const errors = computed(() => {
  const errs = {}

  if (!form.value.checkIn) errs.checkIn = t('pms.reservation.errors.checkInRequired')
  if (!form.value.checkOut) errs.checkOut = t('pms.reservation.errors.checkOutRequired')
  if (nights.value <= 0) errs.checkOut = t('pms.reservation.errors.invalidDates')
  if (!form.value.roomTypeId) errs.roomTypeId = t('pms.reservation.errors.roomTypeRequired')
  if (!form.value.mealPlanId) errs.mealPlanId = t('pms.reservation.errors.mealPlanRequired')
  if (!form.value.leadGuest.firstName?.trim()) errs.firstName = t('pms.reservation.errors.firstNameRequired')
  if (!form.value.leadGuest.lastName?.trim()) errs.lastName = t('pms.reservation.errors.lastNameRequired')
  // Email and phone are optional - only validate format if provided
  if (form.value.contact.email?.trim() && !isValidEmail(form.value.contact.email)) {
    errs.email = t('pms.reservation.errors.emailInvalid')
  }
  if (!form.value.pricing.total || form.value.pricing.total <= 0) errs.total = t('pms.reservation.errors.totalRequired')

  return errs
})

const isValid = computed(() => Object.keys(errors.value).length === 0)

// Helper functions
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const getCurrencySymbol = (currency) => {
  const symbols = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }
  return symbols[currency] || currency
}

const getError = (field) => {
  if (!touchedFields[field] && !showValidationSummary.value) return ''
  return errors.value[field] || ''
}

const getInputClass = (field) => {
  const hasError = getError(field)
  if (hasError) {
    return 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:ring-red-500 focus:border-red-500'
  }
  return 'border-gray-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500'
}

const touchField = (field) => {
  touchedFields[field] = true
}

// Handlers
const handleCheckInChange = () => {
  // If checkout is before or same as check-in, update it
  if (form.value.checkOut && form.value.checkIn >= form.value.checkOut) {
    const newCheckOut = new Date(form.value.checkIn)
    newCheckOut.setDate(newCheckOut.getDate() + 1)
    form.value.checkOut = newCheckOut.toISOString().split('T')[0]
  }
}

const handleRoomTypeSelect = (roomType) => {
  // Could update pricing suggestions based on room type
  console.log('Selected room type:', roomType)
}

const handleAgencyCreated = (agency) => {
  console.log('New agency created:', agency)
}

const submit = async () => {
  showValidationSummary.value = true
  // Touch all fields
  Object.keys(errors.value).forEach(key => touchedFields[key] = true)

  if (!isValid.value) return

  loading.value = true
  try {
    await reservationService.create(props.hotelId, form.value)
    toast.success(t('pms.reservation.created'))
    emit('created')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || t('pms.reservation.createError'))
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  form.value = defaultForm()
  showValidationSummary.value = false
  Object.keys(touchedFields).forEach(key => delete touchedFields[key])
}

// Reset form when modal opens
watch(() => props.modelValue, (val) => {
  if (val) {
    form.value = defaultForm()
    showValidationSummary.value = false
    Object.keys(touchedFields).forEach(key => delete touchedFields[key])
  }
})
</script>
