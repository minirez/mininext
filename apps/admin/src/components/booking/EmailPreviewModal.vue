<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/60 backdrop-blur-sm"
          @click="close"
        ></div>

        <!-- Modal -->
        <div
          class="relative w-full max-w-3xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-h-[90vh] flex flex-col"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <div class="flex items-center gap-2">
              <span class="material-icons text-purple-500">email</span>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ $t('booking.email.preview') }}
              </h3>
              <span
                class="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
              >
                {{ emailTypeLabel }}
              </span>
            </div>
            <button
              class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              @click="close"
            >
              <span class="material-icons text-xl">close</span>
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-16">
            <div class="animate-spin rounded-full h-8 w-8 border-3 border-purple-500 border-t-transparent"></div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="p-6 text-center">
            <span class="material-icons text-4xl text-red-400 mb-2">error_outline</span>
            <p class="text-gray-600 dark:text-slate-400">{{ error }}</p>
            <button
              class="mt-4 btn-secondary px-4 py-2"
              @click="loadPreview"
            >
              {{ $t('common.retry') }}
            </button>
          </div>

          <!-- Content -->
          <div v-else class="flex-1 overflow-hidden flex flex-col">
            <!-- Email Options -->
            <div class="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
              <div class="flex flex-wrap items-center gap-4">
                <!-- Recipient -->
                <div class="flex items-center gap-2">
                  <label class="text-sm font-medium text-gray-600 dark:text-slate-400">
                    {{ $t('booking.email.recipient') }}:
                  </label>
                  <input
                    v-model="recipientEmail"
                    type="email"
                    class="px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white w-56"
                    :placeholder="$t('booking.email.enterEmail')"
                  />
                </div>

                <!-- Language (only for guest emails) -->
                <div v-if="recipientType === 'guest'" class="flex items-center gap-2">
                  <label class="text-sm font-medium text-gray-600 dark:text-slate-400">
                    {{ $t('booking.email.language') }}:
                  </label>
                  <select
                    v-model="selectedLanguage"
                    class="px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    @change="loadPreview"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <!-- Send Copy -->
                <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 cursor-pointer">
                  <input
                    v-model="sendCopy"
                    type="checkbox"
                    class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  {{ $t('booking.email.sendCopy') }}
                </label>
              </div>
            </div>

            <!-- Preview iframe -->
            <div class="flex-1 overflow-auto p-4">
              <div class="bg-white rounded border border-gray-200 dark:border-slate-600 overflow-hidden">
                <iframe
                  ref="previewFrame"
                  :srcdoc="emailHtml"
                  sandbox="allow-same-origin"
                  class="w-full h-96 border-0"
                  title="Email Preview"
                ></iframe>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <div class="text-sm text-gray-500 dark:text-slate-400">
              <span class="material-icons text-sm mr-1 align-middle">info</span>
              {{ $t('booking.email.previewNote') }}
            </div>
            <div class="flex items-center gap-2">
              <button
                class="btn-secondary px-4 py-2"
                @click="close"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                class="btn-primary px-4 py-2 flex items-center gap-2"
                :disabled="sending || !recipientEmail"
                @click="sendEmail"
              >
                <span v-if="sending" class="animate-spin material-icons text-lg">refresh</span>
                <span v-else class="material-icons text-lg">send</span>
                {{ sending ? $t('common.sending') : $t('booking.email.send') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import bookingService from '@/services/bookingService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  bookingId: {
    type: String,
    required: true
  },
  emailType: {
    type: String,
    required: true,
    validator: v => ['confirmation', 'payment_reminder', 'hotel_notification', 'checkin_reminder'].includes(v)
  },
  defaultRecipient: {
    type: Object,
    default: () => ({})
  },
  defaultLanguage: {
    type: String,
    default: 'tr'
  }
})

const emit = defineEmits(['update:modelValue', 'sent'])

const { t } = useI18n()
const { success: showSuccess, error: showError } = useToast()

// State
const loading = ref(false)
const sending = ref(false)
const error = ref(null)
const emailHtml = ref('')
const recipientEmail = ref('')
const selectedLanguage = ref('tr')
const sendCopy = ref(false)
const previewFrame = ref(null)

// Computed
const recipientType = computed(() => {
  return props.emailType === 'hotel_notification' ? 'hotel' : 'guest'
})

const emailTypeLabel = computed(() => {
  const labels = {
    confirmation: t('booking.email.confirmation'),
    payment_reminder: t('booking.email.paymentReminder'),
    hotel_notification: t('booking.email.hotelNotification'),
    checkin_reminder: t('booking.email.checkinReminder')
  }
  return labels[props.emailType] || props.emailType
})

// Methods
const close = () => {
  emit('update:modelValue', false)
}

const loadPreview = async () => {
  if (!props.bookingId || !props.emailType) return

  loading.value = true
  error.value = null

  try {
    const response = await bookingService.previewBookingEmail(
      props.bookingId,
      props.emailType,
      { language: selectedLanguage.value }
    )

    if (response.success) {
      emailHtml.value = response.data.html

      // Set default recipient if not already set
      if (!recipientEmail.value && response.data.recipient?.email) {
        recipientEmail.value = response.data.recipient.email
      }
    } else {
      error.value = response.message || t('booking.email.previewError')
    }
  } catch (err) {
    error.value = err.message || t('booking.email.previewError')
  } finally {
    loading.value = false
  }
}

const sendEmail = async () => {
  if (!recipientEmail.value) {
    showError(t('booking.email.recipientRequired'))
    return
  }

  sending.value = true

  try {
    const response = await bookingService.sendBookingEmail(props.bookingId, {
      type: props.emailType,
      recipient: recipientType.value,
      customEmail: recipientEmail.value,
      language: selectedLanguage.value,
      sendCopy: sendCopy.value
    })

    if (response.success) {
      showSuccess(t('booking.email.sent'))
      emit('sent', response.data)
      close()
    } else {
      showError(response.message || t('booking.email.sendError'))
    }
  } catch (err) {
    showError(err.message || t('booking.email.sendError'))
  } finally {
    sending.value = false
  }
}

// Watch for modal open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    // Reset state
    error.value = null
    emailHtml.value = ''
    sendCopy.value = false

    // Set defaults
    selectedLanguage.value = props.defaultLanguage || 'tr'
    recipientEmail.value = props.defaultRecipient?.email || ''

    // Load preview
    loadPreview()
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
