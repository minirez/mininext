<template>
  <div class="relative" ref="dropdownRef">
    <!-- Trigger Button -->
    <button
      class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
      @click="isOpen = !isOpen"
    >
      <span class="material-icons text-lg">email</span>
      {{ $t('booking.email.send') }}
      <span class="material-icons text-lg" :class="{ 'rotate-180': isOpen }">expand_more</span>
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-1 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1"
      >
        <!-- Guest Emails -->
        <div class="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
          {{ $t('booking.email.toGuest') }}
        </div>

        <button
          class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
          @click="openEmailPreview('confirmation', 'guest')"
        >
          <span class="material-icons text-lg text-green-500">check_circle</span>
          <div class="text-left">
            <div class="font-medium">{{ $t('booking.email.confirmation') }}</div>
            <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('booking.email.confirmationDesc') }}</div>
          </div>
        </button>

        <button
          class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
          @click="openEmailPreview('payment_reminder', 'guest')"
        >
          <span class="material-icons text-lg text-orange-500">schedule</span>
          <div class="text-left">
            <div class="font-medium">{{ $t('booking.email.paymentReminder') }}</div>
            <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('booking.email.paymentReminderDesc') }}</div>
          </div>
        </button>

        <button
          class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
          @click="openEmailPreview('checkin_reminder', 'guest')"
        >
          <span class="material-icons text-lg text-blue-500">login</span>
          <div class="text-left">
            <div class="font-medium">{{ $t('booking.email.checkinReminder') }}</div>
            <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('booking.email.checkinReminderDesc') }}</div>
          </div>
        </button>

        <!-- Divider -->
        <div class="my-1 border-t border-gray-200 dark:border-slate-700"></div>

        <!-- Hotel Emails -->
        <div class="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
          {{ $t('booking.email.toHotel') }}
        </div>

        <button
          class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
          @click="openEmailPreview('hotel_notification', 'hotel')"
        >
          <span class="material-icons text-lg text-purple-500">apartment</span>
          <div class="text-left">
            <div class="font-medium">{{ $t('booking.email.hotelNotification') }}</div>
            <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('booking.email.hotelNotificationDesc') }}</div>
          </div>
        </button>
      </div>
    </Transition>

    <!-- Email Preview Modal -->
    <EmailPreviewModal
      v-model="showPreviewModal"
      :booking-id="bookingId"
      :email-type="selectedEmailType"
      :default-recipient="defaultRecipient"
      :default-language="guestLanguage"
      @sent="handleEmailSent"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import EmailPreviewModal from './EmailPreviewModal.vue'

const props = defineProps({
  bookingId: {
    type: String,
    required: true
  },
  guestEmail: {
    type: String,
    default: ''
  },
  hotelEmail: {
    type: String,
    default: ''
  },
  guestLanguage: {
    type: String,
    default: 'tr'
  }
})

const emit = defineEmits(['emailSent'])

// State
const isOpen = ref(false)
const showPreviewModal = ref(false)
const selectedEmailType = ref('confirmation')
const defaultRecipient = ref({})
const dropdownRef = ref(null)

// Methods
const openEmailPreview = (type, recipientType) => {
  selectedEmailType.value = type

  if (recipientType === 'guest') {
    defaultRecipient.value = { email: props.guestEmail }
  } else {
    defaultRecipient.value = { email: props.hotelEmail }
  }

  isOpen.value = false
  showPreviewModal.value = true
}

const handleEmailSent = (data) => {
  emit('emailSent', data)
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
