<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

        <!-- Modal -->
        <div class="relative w-full max-w-4xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
          <!-- Header -->
          <div
            class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons text-xl text-purple-500">confirmation_number</span>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ booking?.bookingNumber }}
                  </h2>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="statusClass"
                  >
                    {{ statusLabel }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Email Actions -->
              <BookingEmailActions
                v-if="bookingDetails?._id"
                :booking-id="bookingDetails._id"
                :guest-email="bookingDetails.contact?.email"
                :hotel-email="bookingDetails.hotel?.contact?.email"
                :guest-language="bookingDetails.guestLanguage || 'tr'"
                @email-sent="handleEmailSent"
              />
              <button
                class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                @click="close"
              >
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-16">
            <div
              class="animate-spin rounded-full h-8 w-8 border-3 border-purple-500 border-t-transparent"
            ></div>
          </div>

          <!-- Content -->
          <div v-else-if="bookingDetails" class="p-4 max-h-[calc(100vh-180px)] overflow-y-auto">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <!-- Left Column -->
              <div class="space-y-4">
                <!-- Hotel & Dates (Compact) -->
                <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <p class="font-semibold text-gray-900 dark:text-white">
                        {{ bookingDetails.hotelName }}
                      </p>
                      <p
                        v-if="bookingDetails.hotelCode"
                        class="text-xs text-gray-500 dark:text-slate-400"
                      >
                        {{ bookingDetails.hotelCode }}
                      </p>
                    </div>
                    <span class="material-icons text-gray-400">hotel</span>
                  </div>
                  <!-- Compact Dates -->
                  <div class="flex items-center gap-2 text-sm">
                    <span class="font-medium text-gray-700 dark:text-gray-300">
                      {{ formatDateCompact(bookingDetails.checkIn) }}
                    </span>
                    <span class="material-icons text-xs text-gray-400">arrow_forward</span>
                    <span class="font-medium text-gray-700 dark:text-gray-300">
                      {{ formatDateCompact(bookingDetails.checkOut) }}
                    </span>
                    <span
                      class="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium"
                    >
                      {{ bookingDetails.nights }} {{ $t('booking.nights') }}
                    </span>
                  </div>
                </div>

                <!-- Guest Info with Inline Edit -->
                <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-2">
                    <h3
                      class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide flex items-center"
                    >
                      <span class="material-icons text-sm mr-1">person</span>
                      {{ $t('booking.guest') }}
                    </h3>
                    <button
                      v-if="canEdit"
                      class="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
                      @click="toggleGuestEdit"
                    >
                      <span class="material-icons text-sm">{{
                        isEditingGuest ? 'close' : 'edit'
                      }}</span>
                      {{ isEditingGuest ? $t('common.cancel') : $t('booking.email.edit') }}
                    </button>
                  </div>

                  <!-- View Mode -->
                  <div v-if="!isEditingGuest && bookingDetails.leadGuest">
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ bookingDetails.leadGuest.firstName }}
                      {{ bookingDetails.leadGuest.lastName }}
                    </p>
                    <div
                      class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600 dark:text-slate-300"
                    >
                      <span v-if="bookingDetails.contact?.email" class="flex items-center gap-1">
                        <span class="material-icons text-xs">email</span>
                        {{ bookingDetails.contact.email }}
                      </span>
                      <span v-if="bookingDetails.contact?.phone" class="flex items-center gap-1">
                        <span class="material-icons text-xs">phone</span>
                        {{ bookingDetails.contact.phone }}
                      </span>
                    </div>
                  </div>

                  <!-- Edit Mode -->
                  <div v-else-if="isEditingGuest" class="space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                      <input
                        v-model="editForm.leadGuest.firstName"
                        type="text"
                        class="px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                        :placeholder="$t('booking.firstName')"
                      />
                      <input
                        v-model="editForm.leadGuest.lastName"
                        type="text"
                        class="px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                        :placeholder="$t('booking.lastName')"
                      />
                    </div>
                    <input
                      v-model="editForm.contact.email"
                      type="email"
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                      :placeholder="$t('common.email')"
                    />
                    <input
                      v-model="editForm.contact.phone"
                      type="tel"
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                      :placeholder="$t('booking.phone')"
                    />
                    <!-- Guest Language -->
                    <div class="flex items-center gap-2">
                      <label class="text-xs text-gray-500 dark:text-slate-400">
                        {{ $t('booking.email.guestLanguage') }}:
                      </label>
                      <select
                        v-model="editForm.guestLanguage"
                        class="px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                      >
                        <option value="tr">Türkçe</option>
                        <option value="en">English</option>
                        <option value="ru">Русский</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>
                    <button
                      class="w-full btn-primary px-3 py-1.5 text-sm"
                      :disabled="savingGuest"
                      @click="saveGuestInfo"
                    >
                      {{ savingGuest ? $t('common.saving') : $t('booking.email.saveChanges') }}
                    </button>
                  </div>

                  <p v-else class="text-gray-400 dark:text-slate-500 italic text-sm">
                    {{ $t('booking.noGuestInfo') }}
                  </p>
                </div>
              </div>

              <!-- Right Column -->
              <div class="space-y-4">
                <!-- Rooms -->
                <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <h3
                    class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center"
                  >
                    <span class="material-icons text-sm mr-1">king_bed</span>
                    {{ $t('booking.rooms') }}
                  </h3>
                  <div class="space-y-2">
                    <div
                      v-for="(room, idx) in bookingDetails.rooms"
                      :key="idx"
                      class="p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600"
                    >
                      <div class="flex items-start justify-between">
                        <div>
                          <p class="font-medium text-sm text-gray-900 dark:text-white">
                            {{ getLocalizedName(room.roomTypeName) }}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-slate-400">
                            {{ getLocalizedName(room.mealPlanName) }}
                          </p>
                        </div>
                        <div class="text-right">
                          <span class="text-sm font-semibold text-gray-900 dark:text-white">
                            {{
                              formatPrice(
                                room.pricing?.finalTotal,
                                bookingDetails.pricing?.currency
                              )
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Pricing -->
                <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <h3
                    class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center"
                  >
                    <span class="material-icons text-sm mr-1">payments</span>
                    {{ $t('booking.pricing') }}
                  </h3>
                  <div class="space-y-1">
                    <!-- Cancellation Guarantee -->
                    <div
                      v-if="bookingDetails.cancellationGuarantee?.purchased"
                      class="flex justify-between items-center"
                    >
                      <span
                        class="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1"
                      >
                        <span class="material-icons" style="font-size: 14px">verified_user</span>
                        {{ $t('booking.cancellationGuarantee') }}
                        ({{ bookingDetails.cancellationGuarantee.rate }}%)
                      </span>
                      <span class="text-sm font-medium text-blue-600 dark:text-blue-400">
                        +{{
                          formatPrice(
                            bookingDetails.cancellationGuarantee.amount,
                            bookingDetails.pricing?.currency
                          )
                        }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600 dark:text-slate-300">{{
                        $t('payment.total')
                      }}</span>
                      <span class="text-lg font-bold text-gray-900 dark:text-white">
                        {{
                          formatPrice(
                            bookingDetails.pricing?.grandTotal,
                            bookingDetails.pricing?.currency
                          )
                        }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600 dark:text-slate-300">{{
                        $t('payment.paid')
                      }}</span>
                      <span class="font-medium text-green-600 dark:text-green-400">
                        {{
                          formatPrice(
                            bookingDetails.payment?.paidAmount || 0,
                            bookingDetails.pricing?.currency
                          )
                        }}
                      </span>
                    </div>
                    <div
                      class="flex justify-between items-center pt-1 border-t border-gray-200 dark:border-slate-600"
                    >
                      <span class="text-sm text-gray-600 dark:text-slate-300">{{
                        $t('payment.remaining')
                      }}</span>
                      <span
                        class="font-semibold"
                        :class="remainingAmount > 0 ? 'text-orange-500' : 'text-green-500'"
                      >
                        {{ formatPrice(remainingAmount, bookingDetails.pricing?.currency) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl"
          >
            <button class="btn-secondary px-3 py-1.5 text-sm" @click="close">
              {{ $t('common.close') }}
            </button>
            <div class="flex items-center gap-2">
              <button
                v-if="canAmend"
                class="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1"
                @click="$emit('amend', bookingDetails)"
              >
                <span class="material-icons text-base">edit</span>
                {{ $t('booking.amend') }}
              </button>
              <button
                class="btn-primary px-3 py-1.5 text-sm flex items-center gap-1"
                @click="goToDetail"
              >
                <span class="material-icons text-base">open_in_new</span>
                {{ $t('booking.viewFullDetails') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useStatusHelpers } from '@/composables/useStatusHelpers'
import { useToast } from '@/composables/useToast'
import { formatPrice } from '@/utils/formatters'
import bookingService from '@/services/bookingService'
import BookingEmailActions from './BookingEmailActions.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  booking: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'amend', 'close', 'updated'])

const { locale, t } = useI18n()
const router = useRouter()
const { getStatusClass: getStatusClassHelper, getBookingStatusLabel } = useStatusHelpers()
const { success: showSuccess, error: showError } = useToast()

// State
const loading = ref(false)
const bookingDetails = ref(null)
const isEditingGuest = ref(false)
const savingGuest = ref(false)

const editForm = reactive({
  leadGuest: {
    firstName: '',
    lastName: ''
  },
  contact: {
    email: '',
    phone: ''
  },
  guestLanguage: 'tr'
})

// Computed
const statusClass = computed(() => {
  if (!bookingDetails.value) return ''
  return getStatusClassHelper(bookingDetails.value.status)
})

const statusLabel = computed(() => {
  if (!bookingDetails.value) return ''
  return getBookingStatusLabel(bookingDetails.value.status)
})

const remainingAmount = computed(() => {
  if (!bookingDetails.value?.pricing?.grandTotal) return 0
  return bookingDetails.value.pricing.grandTotal - (bookingDetails.value.payment?.paidAmount || 0)
})

const canAmend = computed(() => {
  if (!bookingDetails.value) return false
  return ['pending', 'confirmed', 'checked_in'].includes(bookingDetails.value.status)
})

const canEdit = computed(() => {
  if (!bookingDetails.value) return false
  return !['cancelled', 'completed', 'no_show'].includes(bookingDetails.value.status)
})

// Methods
const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const goToDetail = () => {
  if (bookingDetails.value) {
    router.push(`/bookings/${bookingDetails.value._id}`)
  }
}

const formatDateCompact = date => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getLocalizedName = name => {
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
}

const toggleGuestEdit = () => {
  if (isEditingGuest.value) {
    isEditingGuest.value = false
  } else {
    // Populate edit form with current values
    editForm.leadGuest.firstName = bookingDetails.value?.leadGuest?.firstName || ''
    editForm.leadGuest.lastName = bookingDetails.value?.leadGuest?.lastName || ''
    editForm.contact.email = bookingDetails.value?.contact?.email || ''
    editForm.contact.phone = bookingDetails.value?.contact?.phone || ''
    editForm.guestLanguage = bookingDetails.value?.guestLanguage || 'tr'
    isEditingGuest.value = true
  }
}

const saveGuestInfo = async () => {
  if (!bookingDetails.value?._id) return

  savingGuest.value = true

  try {
    const response = await bookingService.updateGuestInfo(bookingDetails.value._id, {
      leadGuest: editForm.leadGuest,
      contact: editForm.contact,
      guestLanguage: editForm.guestLanguage
    })

    if (response.success) {
      showSuccess(t('booking.email.guestUpdated'))
      // Update local data
      if (response.data.booking) {
        bookingDetails.value = response.data.booking
      }
      isEditingGuest.value = false
      emit('updated', bookingDetails.value)
    } else {
      showError(response.message || t('booking.email.updateError'))
    }
  } catch (err) {
    showError(err.message || t('booking.email.updateError'))
  } finally {
    savingGuest.value = false
  }
}

const handleEmailSent = () => {
  showSuccess(t('booking.email.sent'))
}

const loadBookingDetails = async () => {
  if (!props.booking?._id) return

  loading.value = true
  try {
    const response = await bookingService.getBooking(props.booking._id)
    if (response.success) {
      bookingDetails.value = response.data
    }
  } catch (error) {
    console.error('Failed to load booking details:', error)
    // Fallback to passed booking data
    bookingDetails.value = props.booking
  } finally {
    loading.value = false
  }
}

// Watch for modal open
watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen && props.booking) {
      // Reset edit state
      isEditingGuest.value = false
      // First show basic data from list
      bookingDetails.value = props.booking
      // Then load full details
      loadBookingDetails()
    } else {
      bookingDetails.value = null
      isEditingGuest.value = false
    }
  }
)
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(-20px);
}
</style>
