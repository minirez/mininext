<template>
  <Modal
    v-model="show"
    :title="$t('frontDesk.walkInModal.title')"
    size="xl"
    :close-on-overlay="false"
    @close="close"
  >
    <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <!-- Validation Errors -->
      <div
        v-if="submitted && Object.keys(errors).length > 0"
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
      >
        <div class="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm font-medium">
          <span class="material-icons text-sm">error</span>
          {{ $t('frontDesk.walkInModal.validationErrors') }}
        </div>
        <ul class="mt-1 ml-6 list-disc text-xs text-red-600 dark:text-red-400">
          <li v-for="(msg, key) in errors" :key="key">{{ msg }}</li>
        </ul>
      </div>

      <!-- Dates Section -->
      <div>
        <h4
          class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-4"
        >
          <span class="material-icons text-indigo-500 text-lg">event</span>
          {{ $t('frontDesk.walkInModal.dates') }}
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DatePicker
            v-model="form.checkInDate"
            :label="$t('frontDesk.walkInModal.checkIn')"
            :min-date="today"
            :required="true"
            :error="submitted ? errors.checkIn : ''"
            @change="handleCheckInChange"
          />

          <DatePicker
            v-model="form.checkOutDate"
            :label="$t('frontDesk.walkInModal.checkOut')"
            :min-date="minCheckOutDate"
            :required="true"
            :error="submitted ? errors.checkOut : ''"
          />

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('common.nights') }}
            </label>
            <div
              class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg"
            >
              <span class="material-icons text-indigo-600 dark:text-indigo-400">nightlight</span>
              <span class="text-lg font-bold text-indigo-700 dark:text-indigo-300">{{
                nights
              }}</span>
              <span class="text-sm text-indigo-600 dark:text-indigo-400">{{
                $t('common.nights')
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Room Type & Meal Plan Section -->
      <div>
        <h4
          class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-4"
        >
          <span class="material-icons text-indigo-500 text-lg">hotel</span>
          {{ $t('frontDesk.walkInModal.roomSelection') }}
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RoomTypeSelector
            v-model="form.roomTypeId"
            :hotel-id="hotelId"
            :error="submitted ? errors.roomTypeId : ''"
            @select="handleRoomTypeSelect"
          />

          <MealPlanSelector v-model="form.mealPlanId" :hotel-id="hotelId" />
        </div>

        <!-- Available Room Selection -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            <span class="inline-flex items-center gap-1">
              <span class="material-icons text-indigo-500 text-base">meeting_room</span>
              {{ $t('frontDesk.walkInModal.availableRoom') }} *
            </span>
          </label>
          <select
            v-model="form.roomId"
            class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            :class="
              submitted && errors.roomId
                ? 'border-red-300 dark:border-red-600'
                : 'border-gray-300 dark:border-slate-600'
            "
          >
            <option value="">{{ $t('frontDesk.walkInModal.selectRoom') }}</option>
            <option v-for="room in filteredRooms" :key="room._id" :value="room._id">
              {{ room.roomNumber }} - {{ room.roomType?.name?.tr || room.roomType?.code }}
              <template v-if="room.floor">
                ({{ room.floor }}. {{ $t('frontDesk.walkInModal.floor') }})</template
              >
            </option>
          </select>
          <p
            v-if="submitted && errors.roomId"
            class="mt-1 text-xs text-red-500 flex items-center gap-1"
          >
            <span class="material-icons text-xs">error</span>
            {{ errors.roomId }}
          </p>
        </div>
      </div>

      <!-- Guest Count Section -->
      <div>
        <h4
          class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-4"
        >
          <span class="material-icons text-indigo-500 text-lg">groups</span>
          {{ $t('frontDesk.walkInModal.occupancy') }}
        </h4>

        <GuestCountSelector
          :adults="form.adultsCount"
          :children="childrenAges"
          :max-adults="selectedRoomType?.maxAdults || 10"
          :max-children="selectedRoomType?.maxChildren || 6"
          child-input-mode="age"
          @update:adults="handleAdultsChange"
          @update:children="handleChildrenChange"
        />
      </div>

      <!-- Dynamic Guest Forms -->
      <div>
        <h4
          class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-4"
        >
          <span class="material-icons text-indigo-500 text-lg">person</span>
          {{ $t('frontDesk.walkInModal.guestInfo') }}
        </h4>

        <div class="space-y-4">
          <div
            v-for="(guest, i) in form.guests"
            :key="'guest-' + i"
            class="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50/50 dark:bg-slate-800/50"
          >
            <!-- Guest Header -->
            <div class="flex items-center gap-2 mb-3">
              <span
                class="material-icons text-sm"
                :class="guest.type === 'adult' ? 'text-indigo-500' : 'text-orange-500'"
              >
                {{ guest.type === 'adult' ? 'person' : 'child_care' }}
              </span>
              <span class="font-medium text-sm text-gray-900 dark:text-white">
                {{
                  guest.type === 'adult'
                    ? $t('frontDesk.walkInModal.adultN', { n: guest._adultIndex })
                    : $t('frontDesk.walkInModal.childN', { n: guest._childIndex })
                }}
              </span>
              <span
                v-if="i === 0"
                class="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full"
              >
                {{ $t('frontDesk.walkInModal.mainGuest') }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- First Name -->
              <div>
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                  {{ $t('frontDesk.walkInModal.firstName') }}
                  <span v-if="i === 0" class="text-red-500">*</span>
                </label>
                <input
                  v-model="guest.firstName"
                  type="text"
                  class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  :class="
                    submitted && i === 0 && errors.firstName
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-slate-600'
                  "
                />
              </div>

              <!-- Last Name -->
              <div>
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                  {{ $t('frontDesk.walkInModal.lastName') }}
                  <span v-if="i === 0" class="text-red-500">*</span>
                </label>
                <input
                  v-model="guest.lastName"
                  type="text"
                  class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  :class="
                    submitted && i === 0 && errors.lastName
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-slate-600'
                  "
                />
              </div>

              <!-- ID Type -->
              <div v-if="guest.type === 'adult'">
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                  {{ $t('frontDesk.walkInModal.idType') }}
                </label>
                <select
                  v-model="guest.idType"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="tc_kimlik">
                    {{ $t('frontDesk.walkInModal.idTypes.tcKimlik') }}
                  </option>
                  <option value="passport">
                    {{ $t('frontDesk.walkInModal.idTypes.passport') }}
                  </option>
                  <option value="driving_license">
                    {{ $t('frontDesk.walkInModal.idTypes.drivingLicense') }}
                  </option>
                  <option value="other">{{ $t('frontDesk.walkInModal.idTypes.other') }}</option>
                </select>
              </div>

              <!-- ID Number -->
              <div v-if="guest.type === 'adult'">
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                  {{ $t('frontDesk.walkInModal.idNumber') }}
                </label>
                <input
                  v-model="guest.idNumber"
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <!-- Nationality -->
              <div>
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                  {{ $t('frontDesk.walkInModal.nationality') }}
                </label>
                <CountrySelect v-model="guest.nationality" />
              </div>

              <!-- Phone (main guest only) -->
              <div v-if="i === 0">
                <PhoneInput
                  v-model="guest.phone"
                  :label="$t('common.phone')"
                  country="TR"
                  size="sm"
                />
              </div>

              <!-- Email (main guest only) -->
              <div v-if="i === 0">
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                  {{ $t('common.email') }}
                </label>
                <input
                  v-model="guest.email"
                  type="email"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <!-- Age (children only) -->
              <div
                v-if="guest.type === 'child'"
                class="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
              >
                <span class="material-icons text-orange-500 text-sm">cake</span>
                <span class="text-sm text-orange-700 dark:text-orange-400">
                  {{ $t('frontDesk.walkInModal.age') }}: {{ guest.age }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing Section -->
      <div>
        <h4
          class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-4"
        >
          <span class="material-icons text-indigo-500 text-lg">payments</span>
          {{ $t('frontDesk.walkInModal.pricing') }}
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Total Rate + Currency -->
          <div>
            <label
              class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
            >
              {{ $t('frontDesk.walkInModal.totalRate') }} *
              <span
                v-if="pricingLoading"
                class="animate-spin material-icons text-xs text-indigo-500"
                >refresh</span
              >
              <span
                v-else-if="pricingResult && autoPrice"
                class="text-xs text-green-600 dark:text-green-400 font-normal"
              >
                {{ $t('frontDesk.walkInModal.autoCalculated') }}
              </span>
            </label>
            <div class="flex">
              <select
                v-model="form.currency"
                class="w-20 px-2 py-2 text-sm border border-r-0 border-gray-300 dark:border-slate-600 rounded-l-lg bg-gray-50 dark:bg-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="TRY">&#8378;</option>
                <option value="USD">$</option>
                <option value="EUR">&euro;</option>
                <option value="GBP">&pound;</option>
              </select>
              <input
                v-model.number="form.roomRate"
                type="number"
                min="0"
                step="0.01"
                class="flex-1 px-3 py-2 text-sm border rounded-r-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                :class="
                  submitted && errors.roomRate
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-slate-600'
                "
                @input="autoPrice = false"
              />
            </div>
            <p
              v-if="submitted && errors.roomRate"
              class="mt-1 text-xs text-red-500 flex items-center gap-1"
            >
              <span class="material-icons text-xs">error</span>
              {{ errors.roomRate }}
            </p>
            <!-- Price breakdown -->
            <div
              v-if="pricingResult && autoPrice && pricingResult.breakdown?.length"
              class="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5"
            >
              <div
                v-for="(item, idx) in pricingResult.breakdown"
                :key="idx"
                class="flex justify-between"
              >
                <span>{{ item.description }}</span>
                <span>{{ getCurrencySymbol(pricingResult.currency) }}{{ item.amount }}</span>
              </div>
            </div>
          </div>

          <!-- Deposit + Payment Method -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('frontDesk.walkInModal.deposit') }}
            </label>
            <div class="flex">
              <span
                class="w-10 flex items-center justify-center px-2 py-2 text-sm border border-r-0 border-gray-300 dark:border-slate-600 rounded-l-lg bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-gray-400"
              >
                {{ getCurrencySymbol(form.currency) }}
              </span>
              <input
                v-model.number="form.paymentAmount"
                type="number"
                min="0"
                step="0.01"
                class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <select
                v-model="form.paymentMethod"
                class="w-28 px-2 py-2 text-sm border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg bg-gray-50 dark:bg-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
        <h4
          class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-4"
        >
          <span class="material-icons text-indigo-500 text-lg">notes</span>
          {{ $t('frontDesk.walkInModal.specialRequests') }}
        </h4>
        <textarea
          v-model="form.specialRequests"
          rows="2"
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          :placeholder="$t('frontDesk.walkInModal.specialRequestsPlaceholder')"
        ></textarea>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <!-- Left: Summary -->
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <span v-if="form.roomRate > 0" class="font-semibold text-gray-900 dark:text-white">
            {{ getCurrencySymbol(form.currency) }}{{ form.roomRate }}
          </span>
          <span v-if="nights > 0" class="ml-1 text-xs">
            / {{ nights }} {{ $t('common.nights') }}
          </span>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-3">
          <button
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            :disabled="loading"
            @click="close"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            class="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            :disabled="loading"
            @click="submit"
          >
            <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
            <span v-else class="material-icons text-sm">login</span>
            {{ $t('frontDesk.walkInModal.doCheckIn') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import DatePicker from '@/components/ui/date/DatePicker.vue'
import CountrySelect from '@/components/common/CountrySelect.vue'
import GuestCountSelector from '@/components/common/GuestCountSelector.vue'
import RoomTypeSelector from '@/components/pms/reservations/RoomTypeSelector.vue'
import MealPlanSelector from '@/components/pms/reservations/MealPlanSelector.vue'
import stayService, { PAYMENT_METHODS } from '@/services/pms/stayService'
import roomService from '@/services/pms/roomService'
import { calculatePriceByQuery } from '@/services/planning/pricingCalculationService'
import { getMarkets } from '@/services/planning/marketService'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'created'])

const toast = useToast()
const loading = ref(false)
const submitted = ref(false)
const availableRooms = ref([])
const selectedRoomType = ref(null)
const childrenAges = ref([])

// Auto-pricing state
const countryMarketMap = ref({})
const defaultMarketId = ref(null)
const pricingLoading = ref(false)
const pricingResult = ref(null)
const autoPrice = ref(true)

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const paymentMethods = PAYMENT_METHODS

const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

const createGuestObj = (type = 'adult', isMainGuest = false) => ({
  firstName: '',
  lastName: '',
  type,
  age: type === 'child' ? 0 : null,
  nationality: 'TR',
  idType: 'tc_kimlik',
  idNumber: '',
  phone: '',
  email: '',
  isMainGuest
})

const defaultForm = () => ({
  roomId: '',
  roomTypeId: '',
  mealPlanId: '',
  checkInDate: today,
  checkOutDate: tomorrow,
  guests: [createGuestObj('adult', true)],
  adultsCount: 1,
  childrenCount: 0,
  currency: 'TRY',
  roomRate: 0,
  paymentAmount: 0,
  paymentMethod: 'cash',
  specialRequests: ''
})

const form = ref(defaultForm())

// Computed
const nights = computed(() => {
  if (!form.value.checkInDate || !form.value.checkOutDate) return 0
  const checkIn = new Date(form.value.checkInDate)
  const checkOut = new Date(form.value.checkOutDate)
  const diff = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
})

const resolvedMarketId = computed(() => {
  const nat = form.value.guests[0]?.nationality || 'TR'
  return countryMarketMap.value[nat] || defaultMarketId.value || null
})

const minCheckOutDate = computed(() => {
  if (!form.value.checkInDate) return today
  const d = new Date(form.value.checkInDate)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
})

const filteredRooms = computed(() => {
  if (!form.value.roomTypeId) return availableRooms.value
  return availableRooms.value.filter(r => {
    const rtId = r.roomType?._id || r.roomType
    return rtId === form.value.roomTypeId
  })
})

const errors = computed(() => {
  const errs = {}
  if (!form.value.roomId) errs.roomId = t('frontDesk.walkInModal.errors.roomRequired')
  if (!form.value.checkInDate) errs.checkIn = t('frontDesk.walkInModal.errors.checkInRequired')
  if (!form.value.checkOutDate) errs.checkOut = t('frontDesk.walkInModal.errors.checkOutRequired')
  if (form.value.checkInDate && form.value.checkOutDate && nights.value <= 0) {
    errs.checkOut = t('frontDesk.walkInModal.errors.invalidDates')
  }
  if (!form.value.guests[0]?.firstName?.trim()) {
    errs.firstName = t('frontDesk.walkInModal.errors.firstNameRequired')
  }
  if (!form.value.guests[0]?.lastName?.trim()) {
    errs.lastName = t('frontDesk.walkInModal.errors.lastNameRequired')
  }
  if (!form.value.roomRate || form.value.roomRate <= 0) {
    errs.roomRate = t('frontDesk.walkInModal.errors.rateRequired')
  }
  return errs
})

// Add indices for display
const guestsWithIndices = computed(() => {
  let adultIdx = 0
  let childIdx = 0
  return form.value.guests.map(g => {
    if (g.type === 'child') {
      childIdx++
      return { ...g, _childIndex: childIdx }
    } else {
      adultIdx++
      return { ...g, _adultIndex: adultIdx }
    }
  })
})

// Keep form.guests reactive with display indices
watch(
  () => [form.value.adultsCount, form.value.childrenCount],
  () => {
    let adultIdx = 0
    let childIdx = 0
    form.value.guests.forEach(g => {
      if (g.type === 'child') {
        childIdx++
        g._childIndex = childIdx
      } else {
        adultIdx++
        g._adultIndex = adultIdx
      }
    })
  },
  { immediate: true }
)

// Methods
const getCurrencySymbol = code => {
  const map = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }
  return map[code] || code
}

const handleCheckInChange = dateObj => {
  if (!dateObj) return
  const checkIn = new Date(form.value.checkInDate)
  const checkOut = new Date(form.value.checkOutDate)
  if (checkOut <= checkIn) {
    const next = new Date(checkIn)
    next.setDate(next.getDate() + 1)
    form.value.checkOutDate = next.toISOString().split('T')[0]
  }
}

const handleRoomTypeSelect = roomType => {
  selectedRoomType.value = roomType
  form.value.roomId = ''
}

const handleAdultsChange = newCount => {
  form.value.adultsCount = newCount
  syncGuests()
}

const handleChildrenChange = ages => {
  childrenAges.value = ages
  form.value.childrenCount = ages.length
  syncGuests()
}

const syncGuests = () => {
  const currentAdults = form.value.guests.filter(g => g.type === 'adult')
  const currentChildren = form.value.guests.filter(g => g.type === 'child')

  const adults = []
  for (let i = 0; i < form.value.adultsCount; i++) {
    adults.push(currentAdults[i] || createGuestObj('adult', i === 0))
  }
  adults[0].isMainGuest = true

  const children = []
  for (let i = 0; i < childrenAges.value.length; i++) {
    const existing = currentChildren[i] || createGuestObj('child')
    existing.age = childrenAges.value[i]
    existing.type = 'child'
    children.push(existing)
  }

  form.value.guests = [...adults, ...children]
}

const fetchRooms = async () => {
  if (!props.hotelId) return
  try {
    const res = await stayService.getAvailableRooms(props.hotelId)
    availableRooms.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch rooms:', error)
  }
}

const fetchMarketData = async () => {
  if (!props.hotelId) return
  try {
    const res = await getMarkets(props.hotelId)
    const markets = res.data || []
    const map = {}
    let defId = null
    for (const m of markets) {
      if (m.status !== 'active') continue
      if (m.isDefault) defId = m._id
      for (const c of m.countries || []) {
        map[c] = m._id
      }
    }
    countryMarketMap.value = map
    defaultMarketId.value = defId
  } catch (e) {
    console.error('Market data fetch failed:', e)
  }
}

const calculatePrice = async () => {
  if (
    !form.value.roomTypeId ||
    !form.value.mealPlanId ||
    !form.value.checkInDate ||
    !form.value.checkOutDate ||
    !resolvedMarketId.value ||
    nights.value <= 0
  ) {
    return
  }

  pricingLoading.value = true
  try {
    const res = await calculatePriceByQuery(props.hotelId, {
      roomTypeId: form.value.roomTypeId,
      mealPlanId: form.value.mealPlanId,
      marketId: resolvedMarketId.value,
      date: form.value.checkInDate,
      adults: form.value.adultsCount,
      children: childrenAges.value.map(age => ({ age })),
      nights: nights.value
    })

    if (res.data && autoPrice.value) {
      form.value.roomRate = res.data.totalPrice
      form.value.currency = res.data.currency || 'TRY'
      pricingResult.value = res.data
    }
  } catch (e) {
    console.warn('Auto-pricing failed:', e.message)
    pricingResult.value = null
  } finally {
    pricingLoading.value = false
  }
}

// Debounced price watcher
let priceTimeout = null
watch(
  () => [
    form.value.roomTypeId,
    form.value.mealPlanId,
    form.value.checkInDate,
    form.value.checkOutDate,
    form.value.adultsCount,
    childrenAges.value,
    form.value.guests[0]?.nationality
  ],
  () => {
    clearTimeout(priceTimeout)
    priceTimeout = setTimeout(calculatePrice, 500)
  },
  { deep: true }
)

// Reset autoPrice when room type or meal plan changes
watch([() => form.value.roomTypeId, () => form.value.mealPlanId], () => {
  autoPrice.value = true
})

const submit = async () => {
  submitted.value = true
  if (Object.keys(errors.value).length > 0) return

  loading.value = true
  try {
    await stayService.walkInCheckIn(props.hotelId, {
      roomId: form.value.roomId,
      checkInDate: form.value.checkInDate,
      checkOutDate: form.value.checkOutDate,
      guests: form.value.guests
        .filter((g, i) => i === 0 || g.firstName?.trim())
        .map(g => ({
          firstName: g.firstName?.trim() || '-',
          lastName: g.lastName?.trim() || '-',
          type: g.type,
          age: g.type === 'child' ? g.age : undefined,
          nationality: g.nationality,
          idType: g.type === 'adult' ? g.idType : undefined,
          idNumber: g.type === 'adult' && g.idNumber ? g.idNumber : undefined,
          phone: g.phone || undefined,
          email: g.email || undefined,
          isMainGuest: g.isMainGuest
        })),
      adultsCount: form.value.adultsCount,
      childrenCount: form.value.childrenCount,
      mealPlan: form.value.mealPlanId || undefined,
      roomRate: form.value.roomRate,
      currency: form.value.currency,
      paymentAmount: form.value.paymentAmount,
      paymentMethod: form.value.paymentMethod,
      specialRequests: form.value.specialRequests
    })

    toast.success(t('frontDesk.walkInModal.success'))
    emit('created')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || t('frontDesk.walkInModal.error'))
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  form.value = defaultForm()
  submitted.value = false
  selectedRoomType.value = null
  childrenAges.value = []
  pricingResult.value = null
  autoPrice.value = true
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      form.value = defaultForm()
      submitted.value = false
      selectedRoomType.value = null
      childrenAges.value = []
      fetchRooms()
      fetchMarketData()
    }
  }
)
</script>
