<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ $t('booking.guestInformation') }}
      </h2>
      <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
        {{ $t('booking.guestInformationDescription') }}
      </p>
    </div>

    <!-- Lead Guest Form -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
        <span class="material-icons text-purple-500 mr-2">person</span>
        {{ $t('booking.leadGuestTitle') }}
      </h3>
      <GuestForm
        v-model="leadGuest"
        :title="$t('booking.leadGuest')"
        :subtitle="$t('booking.leadGuestDescription')"
        :is-lead-guest="true"
        :errors="leadGuestErrors"
      />
    </div>

    <!-- Room Guests -->
    <div v-if="bookingStore.cart.length > 0 && isInitialized" class="space-y-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
        <span class="material-icons text-purple-500 mr-2">groups</span>
        {{ $t('booking.roomGuestsTitle') }}
      </h3>

      <!-- Each Room -->
      <div
        v-for="(room, roomIndex) in bookingStore.cart"
        :key="`room-${roomIndex}-${room.roomType?._id}`"
        class="space-y-4"
      >
        <!-- Room Header -->
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div
                class="w-8 h-8 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center"
              >
                <span class="text-sm font-bold text-purple-700 dark:text-purple-300">
                  {{ roomIndex + 1 }}
                </span>
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ getRoomName(room.roomType) }}
                </p>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ room.adults }} {{ $t('booking.adults') }}
                  <span v-if="room.children?.length > 0">
                    + {{ room.children.length }} {{ $t('booking.children') }}
                  </span>
                </p>
              </div>
            </div>
            <span class="text-sm text-purple-600 dark:text-purple-400 font-medium">
              {{ getMealPlanName(room.mealPlan) }}
            </span>
          </div>
        </div>

        <!-- Use Lead Guest as First Guest Option -->
        <div v-if="roomIndex === 0 && room.adults > 0" class="flex items-center space-x-2">
          <input
            id="useLeadGuest"
            v-model="useLeadAsFirstGuest"
            type="checkbox"
            class="form-checkbox h-4 w-4 text-purple-600 rounded"
          />
          <label for="useLeadGuest" class="text-sm text-gray-600 dark:text-slate-400">
            {{ $t('booking.useLeadAsFirstGuest') }}
          </label>
        </div>

        <!-- Adult Guests - Not using lead guest OR not first room -->
        <div
          v-if="(!useLeadAsFirstGuest || roomIndex > 0) && getAdultsForRoom(roomIndex).length > 0"
          class="space-y-4"
        >
          <div
            v-for="(guest, guestIndex) in getAdultsForRoom(roomIndex)"
            :key="`adult-${roomIndex}-${guestIndex}`"
          >
            <GuestForm
              :model-value="guest"
              :title="$t('booking.adultGuest', { n: guestIndex + 1 })"
              :errors="getGuestErrors(roomIndex, 'adult', guestIndex)"
              @update:model-value="updateAdultGuest(roomIndex, guestIndex, $event)"
            />
          </div>
        </div>

        <!-- First room with useLeadAsFirstGuest - show message and remaining adults -->
        <div v-else-if="useLeadAsFirstGuest && roomIndex === 0" class="space-y-4">
          <div
            class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm text-green-700 dark:text-green-400 flex items-center"
          >
            <span class="material-icons text-sm mr-2">check_circle</span>
            {{ $t('booking.leadGuestWillStayInRoom', { room: 1 }) }}
          </div>
          <!-- Show remaining adults (skip first one) -->
          <div
            v-for="(guest, guestIndex) in getAdultsForRoom(roomIndex).slice(1)"
            :key="`adult-${roomIndex}-${guestIndex + 1}`"
          >
            <GuestForm
              :model-value="guest"
              :title="$t('booking.adultGuest', { n: guestIndex + 2 })"
              :errors="getGuestErrors(roomIndex, 'adult', guestIndex + 1)"
              @update:model-value="updateAdultGuest(roomIndex, guestIndex + 1, $event)"
            />
          </div>
        </div>

        <!-- Children -->
        <div v-if="getChildrenForRoom(roomIndex).length > 0" class="space-y-4">
          <div
            v-for="(guest, childIndex) in getChildrenForRoom(roomIndex)"
            :key="`child-${roomIndex}-${childIndex}`"
          >
            <GuestForm
              :model-value="guest"
              :title="$t('booking.childGuest', { n: childIndex + 1 })"
              :is-child="true"
              :child-age="bookingStore.cart[roomIndex]?.children?.[childIndex]"
              :show-birth-date="true"
              :errors="getGuestErrors(roomIndex, 'child', childIndex)"
              @update:model-value="updateChildGuest(roomIndex, childIndex, $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Validation Summary -->
    <div v-if="hasValidationErrors" class="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
      <div class="flex items-start">
        <span class="material-icons text-red-500 mr-2">warning</span>
        <div>
          <p class="font-medium text-red-700 dark:text-red-400">
            {{ $t('booking.pleaseFixErrors') }}
          </p>
          <p class="text-sm text-red-600 dark:text-red-400 mt-1">
            {{ $t('booking.requiredFieldsMissing') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
      <button class="btn-secondary px-6 py-2.5" @click="$emit('go-back')">
        <span class="material-icons mr-2">arrow_back</span>
        {{ $t('common.back') }}
      </button>
      <button class="btn-primary px-8 py-2.5" @click="handleContinue">
        {{ $t('booking.continueToSummary') }}
        <span class="material-icons ml-2">arrow_forward</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookingStore } from '@/stores/booking'
import GuestForm from '@/components/booking/GuestForm.vue'

const { t, locale } = useI18n()
const bookingStore = useBookingStore()

const emit = defineEmits(['go-back', 'proceed'])

// Initialization flag
const isInitialized = ref(false)

// Lead guest - varsayılan title: 'mr'
const leadGuest = ref({
  title: 'mr',
  firstName: '',
  lastName: '',
  nationality: '',
  email: '',
  phone: ''
})

// Use lead guest as first guest in first room
const useLeadAsFirstGuest = ref(true)

// Validation errors
const leadGuestErrors = ref({})
const roomGuestErrors = ref([])
const hasValidationErrors = ref(false)

// Room guests data - { adults: [], children: [] } formatında
const roomGuests = ref([])

// Varsayılan title'lar: 1. yetişkin = mr, 2. yetişkin = mrs
const getDefaultTitle = index => {
  if (index === 0) return 'mr'
  if (index === 1) return 'mrs'
  return ''
}

// Cart'a göre roomGuests yapısını oluştur/güncelle
const buildRoomGuestsFromCart = () => {
  const cart = bookingStore.cart
  const result = []
  const errors = []

  cart.forEach((room, roomIndex) => {
    const adultsCount = room.adults || 0
    const childrenCount = room.children?.length || 0
    const existingRoom = roomGuests.value[roomIndex]

    // Adults
    const adults = []
    for (let i = 0; i < adultsCount; i++) {
      const existing = existingRoom?.adults?.[i]
      adults.push({
        title: existing?.title || getDefaultTitle(i),
        firstName: existing?.firstName || '',
        lastName: existing?.lastName || '',
        nationality: existing?.nationality || ''
      })
    }

    // Children
    const children = []
    for (let i = 0; i < childrenCount; i++) {
      const existing = existingRoom?.children?.[i]
      children.push({
        title: existing?.title || '',
        firstName: existing?.firstName || '',
        lastName: existing?.lastName || '',
        nationality: existing?.nationality || '',
        birthDate: existing?.birthDate || ''
      })
    }

    result.push({ adults, children })
    errors.push({
      adults: adults.map(() => ({})),
      children: children.map(() => ({}))
    })
  })

  roomGuests.value = result
  roomGuestErrors.value = errors
}

// Template için getter - her zaman doğru title ile döndür
const getAdultsForRoom = roomIndex => {
  const adults = roomGuests.value[roomIndex]?.adults || []
  // Title boşsa varsayılanı uygula
  return adults.map((adult, i) => ({
    ...adult,
    title: adult.title || getDefaultTitle(i)
  }))
}

const getChildrenForRoom = roomIndex => {
  return roomGuests.value[roomIndex]?.children || []
}

// Update handlers
const updateAdultGuest = (roomIndex, guestIndex, value) => {
  if (roomGuests.value[roomIndex]?.adults) {
    roomGuests.value[roomIndex].adults[guestIndex] = value
  }
}

const updateChildGuest = (roomIndex, childIndex, value) => {
  if (roomGuests.value[roomIndex]?.children) {
    roomGuests.value[roomIndex].children[childIndex] = value
  }
}

// Initialize on mount
onMounted(async () => {
  // Lead guest - store'dan yükle, title yoksa varsayılan kullan
  const stored = bookingStore.guests.leadGuest
  if (stored) {
    leadGuest.value = {
      title: stored.title || 'mr',
      firstName: stored.firstName || '',
      lastName: stored.lastName || '',
      nationality: stored.nationality || '',
      email: stored.email || '',
      phone: stored.phone || ''
    }
  }

  // Room guests - cart'a göre oluştur
  buildRoomGuestsFromCart()

  await nextTick()
  isInitialized.value = true
})

// Cart değişince room guests'i yeniden oluştur
watch(
  () => bookingStore.cart,
  () => {
    buildRoomGuestsFromCart()
  },
  { deep: true }
)

// Lead guest değişince store'a sync et
watch(
  leadGuest,
  value => {
    bookingStore.updateLeadGuest(value)
  },
  { deep: true }
)

// Room guests değişince store'a sync et
watch(
  roomGuests,
  value => {
    bookingStore.updateRoomGuests(value)
  },
  { deep: true }
)

// Get room name
const getRoomName = roomType => {
  if (!roomType?.name) return ''
  const name = roomType.name
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name || ''
}

// Get meal plan name
const getMealPlanName = mealPlan => {
  if (!mealPlan?.name) return mealPlan?.code || ''
  const name = mealPlan.name
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || mealPlan.code
  }
  return name || mealPlan.code
}

// Get guest errors
const getGuestErrors = (roomIndex, guestType, guestIndex) => {
  if (!roomGuestErrors.value[roomIndex]) return {}
  if (guestType === 'adult') {
    return roomGuestErrors.value[roomIndex]?.adults?.[guestIndex] || {}
  }
  return roomGuestErrors.value[roomIndex]?.children?.[guestIndex] || {}
}

// Validate lead guest
const validateLeadGuest = () => {
  const errors = {}
  const guest = leadGuest.value

  if (!guest.title) errors.title = t('validation.required')
  if (!guest.firstName?.trim()) errors.firstName = t('validation.required')
  if (!guest.lastName?.trim()) errors.lastName = t('validation.required')
  if (!guest.nationality) errors.nationality = t('validation.required')
  if (!guest.email?.trim()) {
    errors.email = t('validation.required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
    errors.email = t('validation.invalidEmail')
  }
  if (!guest.phone?.trim()) errors.phone = t('validation.required')

  leadGuestErrors.value = errors
  return Object.keys(errors).length === 0
}

// Validate room guests
const validateRoomGuests = () => {
  let isValid = true
  const newErrors = []

  roomGuests.value.forEach((room, roomIndex) => {
    const roomErrors = { adults: [], children: [] }

    // Validate adults
    ;(room.adults || []).forEach((guest, guestIndex) => {
      // Skip first guest in first room if using lead guest
      if (roomIndex === 0 && guestIndex === 0 && useLeadAsFirstGuest.value) {
        roomErrors.adults.push({})
        return
      }

      const errors = {}
      if (!guest?.title) errors.title = t('validation.required')
      if (!guest?.firstName?.trim()) errors.firstName = t('validation.required')
      if (!guest?.lastName?.trim()) errors.lastName = t('validation.required')
      if (!guest?.nationality) errors.nationality = t('validation.required')

      roomErrors.adults.push(errors)
      if (Object.keys(errors).length > 0) isValid = false
    })

    // Validate children
    ;(room.children || []).forEach(guest => {
      const errors = {}
      if (!guest?.title) errors.title = t('validation.required')
      if (!guest?.firstName?.trim()) errors.firstName = t('validation.required')
      if (!guest?.lastName?.trim()) errors.lastName = t('validation.required')
      if (!guest?.nationality) errors.nationality = t('validation.required')
      if (!guest?.birthDate) errors.birthDate = t('validation.required')

      roomErrors.children.push(errors)
      if (Object.keys(errors).length > 0) isValid = false
    })

    newErrors.push(roomErrors)
  })

  roomGuestErrors.value = newErrors
  return isValid
}

// Handle continue
const handleContinue = () => {
  const leadValid = validateLeadGuest()
  const roomValid = validateRoomGuests()

  hasValidationErrors.value = !leadValid || !roomValid

  if (leadValid && roomValid) {
    // Sync useLeadAsFirstGuest preference
    if (useLeadAsFirstGuest.value && roomGuests.value[0]?.adults?.length > 0) {
      // Copy lead guest data to first room's first adult
      roomGuests.value[0].adults[0] = {
        title: leadGuest.value.title,
        firstName: leadGuest.value.firstName,
        lastName: leadGuest.value.lastName,
        nationality: leadGuest.value.nationality
      }
      bookingStore.updateRoomGuests(roomGuests.value)
    }

    emit('proceed')
  } else {
    // Scroll to first error
    setTimeout(() => {
      const errorElement = document.querySelector('.border-red-500')
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }
}
</script>
