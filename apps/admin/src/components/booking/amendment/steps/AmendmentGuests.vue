<template>
  <div class="space-y-6">
    <div class="text-center mb-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ $t('booking.amendment.guestsTitle') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ $t('booking.amendment.guestsDescription') }}
      </p>
    </div>

    <!-- Room Guests -->
    <div
      v-for="(room, roomIndex) in localRooms"
      :key="roomIndex"
      class="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
    >
      <h4 class="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-indigo-500">bed</span>
        {{ $t('booking.room') }} {{ roomIndex + 1 }}
        <span class="text-sm text-gray-500 dark:text-gray-400">
          ({{ room.adults }} {{ $t('booking.adults') }}<span v-if="room.children?.length">, {{ room.children.length }} {{ $t('booking.children') }}</span>)
        </span>
      </h4>

      <!-- Adult Guests -->
      <div class="space-y-4">
        <div
          v-for="adultIndex in room.adults"
          :key="`adult-${adultIndex}`"
          class="border dark:border-gray-600 rounded-lg p-4"
        >
          <div class="flex items-center gap-2 mb-3">
            <span class="material-icons text-gray-400 text-sm">person</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ $t('booking.adult') }} {{ adultIndex }}
              <span v-if="roomIndex === 0 && adultIndex === 1" class="text-indigo-600 dark:text-indigo-400 text-sm">
                ({{ $t('booking.leadGuest') }})
              </span>
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('common.title') }}
              </label>
              <select
                :value="getGuestField(roomIndex, adultIndex - 1, 'adult', 'title')"
                class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
                @change="updateGuestField(roomIndex, adultIndex - 1, 'adult', 'title', $event.target.value)"
              >
                <option value="mr">{{ $t('titles.mr') }}</option>
                <option value="mrs">{{ $t('titles.mrs') }}</option>
                <option value="ms">{{ $t('titles.ms') }}</option>
                <option value="miss">{{ $t('titles.miss') }}</option>
              </select>
            </div>

            <!-- First Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('common.firstName') }} <span class="text-red-500">*</span>
              </label>
              <input
                :value="getGuestField(roomIndex, adultIndex - 1, 'adult', 'firstName')"
                type="text"
                class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
                @input="updateGuestField(roomIndex, adultIndex - 1, 'adult', 'firstName', $event.target.value)"
              />
            </div>

            <!-- Last Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('common.lastName') }} <span class="text-red-500">*</span>
              </label>
              <input
                :value="getGuestField(roomIndex, adultIndex - 1, 'adult', 'lastName')"
                type="text"
                class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
                @input="updateGuestField(roomIndex, adultIndex - 1, 'adult', 'lastName', $event.target.value)"
              />
            </div>

            <!-- Nationality (only for lead guest) -->
            <div v-if="roomIndex === 0 && adultIndex === 1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('booking.nationality') }}
              </label>
              <select
                v-model="localLeadGuest.nationality"
                class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
                @change="emitUpdate"
              >
                <option value="">{{ $t('common.select') }}</option>
                <option value="TR">{{ $t('countries.TR') }}</option>
                <option value="DE">{{ $t('countries.DE') }}</option>
                <option value="RU">{{ $t('countries.RU') }}</option>
                <option value="GB">{{ $t('countries.GB') }}</option>
                <option value="FR">{{ $t('countries.FR') }}</option>
                <option value="NL">{{ $t('countries.NL') }}</option>
                <option value="BE">{{ $t('countries.BE') }}</option>
                <option value="OTHER">{{ $t('countries.OTHER') }}</option>
              </select>
            </div>

            <!-- TC/Passport (only for lead guest) -->
            <template v-if="roomIndex === 0 && adultIndex === 1">
              <div v-if="localLeadGuest.nationality === 'TR' || !localLeadGuest.nationality">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ $t('booking.tcNumber') }}
                </label>
                <input
                  v-model="localLeadGuest.tcNumber"
                  type="text"
                  maxlength="11"
                  class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="11 haneli TC kimlik numarası"
                  @input="emitUpdate"
                />
              </div>
              <div v-else>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ $t('booking.passportNumber') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="localLeadGuest.passportNumber"
                  type="text"
                  class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  @input="emitUpdate"
                />
              </div>
            </template>
          </div>
        </div>

        <!-- Child Guests -->
        <div
          v-for="(childAge, childIndex) in room.children"
          :key="`child-${childIndex}`"
          class="border dark:border-gray-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20"
        >
          <div class="flex items-center gap-2 mb-3">
            <span class="material-icons text-blue-400 text-sm">child_care</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ $t('booking.child') }} {{ childIndex + 1 }}
              <span class="text-sm text-gray-500 dark:text-gray-400">({{ childAge }} {{ $t('common.yearsOld') }})</span>
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- First Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('common.firstName') }}
              </label>
              <input
                :value="getGuestField(roomIndex, childIndex, 'child', 'firstName')"
                type="text"
                class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
                @input="updateGuestField(roomIndex, childIndex, 'child', 'firstName', $event.target.value)"
              />
            </div>

            <!-- Last Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('common.lastName') }}
              </label>
              <input
                :value="getGuestField(roomIndex, childIndex, 'child', 'lastName')"
                type="text"
                class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
                @input="updateGuestField(roomIndex, childIndex, 'child', 'lastName', $event.target.value)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Information -->
    <div
      class="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
    >
      <h4 class="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-indigo-500">contact_phone</span>
        {{ $t('booking.contactInfo') }}
      </h4>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('common.email') }} <span class="text-red-500">*</span>
          </label>
          <input
            v-model="localContact.email"
            type="email"
            class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
            :class="{ 'border-red-500': !isValidEmail }"
            @input="emitUpdate"
          />
        </div>

        <!-- Phone -->
        <div>
          <PhoneInput
            v-model="localContact.phone"
            :label="$t('common.phone')"
            :required="true"
            country="TR"
            :error="!localContact.phone ? $t('validation.required') : ''"
            @update:model-value="emitUpdate"
          />
        </div>
      </div>
    </div>

    <!-- Special Requests -->
    <div
      class="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
    >
      <h4 class="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-indigo-500">note_add</span>
        {{ $t('booking.specialRequests') }}
      </h4>

      <textarea
        v-model="localSpecialRequests"
        rows="3"
        class="w-full px-4 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
        :placeholder="$t('booking.specialRequestsPlaceholder')"
        @input="emitUpdate"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import { validateEmail } from '@/composables/useBookingValidation'

const props = defineProps({
  booking: { type: Object, default: null },
  formData: { type: Object, required: true }
})

const emit = defineEmits(['update:form-data'])

// Local copies
const localRooms = ref(JSON.parse(JSON.stringify(props.formData.rooms || [])))
const localLeadGuest = ref({ ...props.formData.leadGuest })
const localContact = ref({ ...props.formData.contact })
const localSpecialRequests = ref(props.formData.specialRequests || '')

// Initialize guests array for each room if needed
const initializeGuests = () => {
  localRooms.value.forEach((room, roomIndex) => {
    if (!room.guests) room.guests = []

    // Ensure we have entries for all adults
    const existingAdults = room.guests.filter(g => g.type === 'adult')
    for (let i = existingAdults.length; i < room.adults; i++) {
      // For lead guest, use leadGuest data
      if (roomIndex === 0 && i === 0 && localLeadGuest.value.firstName) {
        room.guests.push({
          type: 'adult',
          title: localLeadGuest.value.title || 'mr',
          firstName: localLeadGuest.value.firstName,
          lastName: localLeadGuest.value.lastName
        })
      } else {
        room.guests.push({
          type: 'adult',
          title: 'mr',
          firstName: '',
          lastName: ''
        })
      }
    }

    // Ensure we have entries for all children
    const existingChildren = room.guests.filter(g => g.type === 'child')
    const childAges = room.children || []
    for (let i = existingChildren.length; i < childAges.length; i++) {
      room.guests.push({
        type: 'child',
        age: childAges[i],
        firstName: '',
        lastName: ''
      })
    }
  })
}

initializeGuests()

// Watch for external changes (only rooms count changes)
watch(
  () => props.formData.rooms?.map(r => ({ adults: r.adults, children: r.children?.length })),
  () => {
    localRooms.value = JSON.parse(JSON.stringify(props.formData.rooms || []))
    initializeGuests()
  },
  { deep: true }
)

// Computed
const isValidEmail = computed(() => {
  return validateEmail(localContact.value.email)
})

// Get guest at specific index
const getGuest = (roomIndex, guestIndex, type) => {
  const room = localRooms.value[roomIndex]
  if (!room?.guests) return null

  const guestsOfType = room.guests.filter(g => g.type === type)
  return guestsOfType[guestIndex] || null
}

const getGuestField = (roomIndex, guestIndex, type, field) => {
  const guest = getGuest(roomIndex, guestIndex, type)
  return guest?.[field] || ''
}

const updateGuestField = (roomIndex, guestIndex, type, field, value) => {
  const room = localRooms.value[roomIndex]
  if (!room) return

  if (!room.guests) room.guests = []

  // Find or create guest
  const guestsOfType = room.guests.filter(g => g.type === type)
  let guest = guestsOfType[guestIndex]

  if (!guest) {
    guest = { type, title: 'mr', firstName: '', lastName: '' }
    if (type === 'child') {
      guest.age = room.children?.[guestIndex] || 0
    }
    room.guests.push(guest)
  }

  guest[field] = value

  // Sync lead guest with first adult of first room
  if (roomIndex === 0 && guestIndex === 0 && type === 'adult') {
    if (field === 'firstName') localLeadGuest.value.firstName = value
    if (field === 'lastName') localLeadGuest.value.lastName = value
    if (field === 'title') localLeadGuest.value.title = value
  }

  emitUpdate()
}

// Methods
const emitUpdate = () => {
  emit('update:form-data', {
    ...props.formData,
    rooms: localRooms.value,
    leadGuest: { ...localLeadGuest.value },
    contact: { ...localContact.value },
    specialRequests: localSpecialRequests.value
  })
}
</script>
