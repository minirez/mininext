<template>
  <div class="h-full flex flex-col">
    <!-- Navigation (hidden in print) -->
    <ModuleNavigation :items="navItems" color="purple" class="print:hidden" />

    <div class="flex-1 overflow-y-auto py-6 max-w-5xl mx-auto w-full print:py-0 print:max-w-none">
      <!-- Print Header (only visible in print) -->
      <div class="hidden print:block print-header mb-6 pb-4 border-b-2 border-gray-300">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">REZERVASYON FORMU</h1>
            <p class="text-sm text-gray-600 mt-1">Reservation Confirmation</p>
          </div>
          <div class="text-right">
            <p class="text-lg font-bold text-gray-900">
              {{ booking?.bookingNumber || booking?.confirmationNumber }}
            </p>
            <p class="text-sm text-gray-600">{{ formatDate(new Date()) }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <span class="material-icons text-4xl text-purple-500 animate-spin">refresh</span>
          <p class="mt-4 text-gray-500 dark:text-slate-400">{{ $t('common.loading') }}</p>
        </div>
      </div>

      <!-- Not Found -->
      <div v-else-if="!booking" class="text-center py-20">
        <span class="material-icons text-5xl text-gray-300 dark:text-slate-600">error_outline</span>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          {{ $t('booking.notFound') }}
        </h3>
        <router-link to="/bookings" class="mt-4 btn-primary inline-flex items-center">
          <span class="material-icons mr-2">arrow_back</span>
          {{ $t('booking.backToBookings') }}
        </router-link>
      </div>

      <!-- Booking Details -->
      <template v-else>
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center space-x-3">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ booking.confirmationNumber }}
              </h1>
              <BookingStatusBadge :status="booking.status" />
            </div>
            <p class="text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('booking.createdAt') }}: {{ formatDateTime(booking.createdAt) }}
            </p>
          </div>

          <!-- Actions (hidden in print) -->
          <div class="flex flex-wrap gap-2 print:hidden">
            <button
              v-if="canAmend"
              class="btn-primary bg-indigo-600 hover:bg-indigo-700"
              @click="openAmendment"
            >
              <span class="material-icons mr-1">edit</span>
              {{ $t('booking.amend') }}
            </button>
            <button
              v-if="booking.status === 'pending'"
              class="btn-primary"
              :disabled="isUpdating"
              @click="handleConfirm"
            >
              <span class="material-icons mr-1">check_circle</span>
              {{ $t('booking.confirmBooking') }}
            </button>
            <button
              v-if="canCancel"
              class="btn-secondary text-red-600 hover:text-red-700"
              :disabled="isUpdating"
              @click="showCancelModal = true"
            >
              <span class="material-icons mr-1">cancel</span>
              {{ $t('booking.cancelBooking') }}
            </button>
            <button class="btn-secondary" @click="printBooking">
              <span class="material-icons mr-1">print</span>
              {{ $t('common.print') }}
            </button>
          </div>
        </div>

        <!-- Main Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block print:space-y-4">
          <!-- Left Column -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Hotel Info -->
            <div
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
            >
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span class="material-icons text-purple-500 mr-2">hotel</span>
                {{ $t('booking.hotelDetails') }}
              </h3>
              <div class="flex items-start space-x-4">
                <div
                  class="w-20 h-20 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0"
                >
                  <span class="material-icons text-gray-400 text-2xl">hotel</span>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white text-lg">
                    {{ booking.hotel?.name }}
                  </p>
                  <p class="text-gray-500 dark:text-slate-400">
                    {{ booking.hotel?.city }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Stay Info -->
            <div
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
            >
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span class="material-icons text-purple-500 mr-2">calendar_today</span>
                {{ $t('booking.stayDetails') }}
              </h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div class="flex">
                  <span class="text-gray-500 dark:text-slate-400 min-w-[70px]"
                    >{{ $t('booking.checkIn') }}:</span
                  >
                  <span class="font-medium text-gray-900 dark:text-white">{{
                    formatDate(booking.checkIn)
                  }}</span>
                </div>
                <div class="flex">
                  <span class="text-gray-500 dark:text-slate-400 min-w-[70px]"
                    >{{ $t('booking.checkOut') }}:</span
                  >
                  <span class="font-medium text-gray-900 dark:text-white">{{
                    formatDate(booking.checkOut)
                  }}</span>
                </div>
                <div class="flex">
                  <span class="text-gray-500 dark:text-slate-400 min-w-[70px]"
                    >{{ $t('booking.nights') }}:</span
                  >
                  <span class="font-medium text-gray-900 dark:text-white"
                    >{{ booking.nights || nights }} {{ $t('booking.nightsUnit') }}</span
                  >
                </div>
                <div class="flex">
                  <span class="text-gray-500 dark:text-slate-400 min-w-[70px]"
                    >{{ $t('booking.rooms') }}:</span
                  >
                  <span class="font-medium text-gray-900 dark:text-white"
                    >{{ booking.rooms?.length || 1 }} {{ $t('booking.roomUnit') }}</span
                  >
                </div>
              </div>
            </div>

            <!-- Rooms -->
            <div
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <div
                class="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
              >
                <h3 class="font-semibold text-gray-900 dark:text-white flex items-center">
                  <span class="material-icons text-purple-500 mr-2">bed</span>
                  {{ $t('booking.roomDetails') }}
                </h3>
              </div>
              <div class="divide-y divide-gray-200 dark:divide-slate-700">
                <div v-for="(room, index) in booking.rooms" :key="index" class="p-4">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">
                        {{ getRoomName(room.roomType) }}
                      </p>
                      <div class="flex items-center gap-2 mt-0.5">
                        <p class="text-sm text-gray-500 dark:text-slate-400">
                          {{ getMealPlanName(room.mealPlan) }}
                        </p>
                        <!-- Non-refundable badge -->
                        <span
                          v-if="room.rateType === 'non_refundable'"
                          class="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
                        >
                          İade Edilmez
                        </span>
                      </div>
                      <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        {{
                          room.adults || room.guests?.filter(g => g.type === 'adult').length || 2
                        }}
                        {{ $t('booking.adults') }}
                        <span
                          v-if="
                            (room.children?.length ||
                              room.guests?.filter(g => g.type === 'child').length) > 0
                          "
                        >
                          +
                          {{
                            room.children?.length ||
                            room.guests?.filter(g => g.type === 'child').length
                          }}
                          {{ $t('booking.children') }}
                        </span>
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="font-medium text-purple-600 dark:text-purple-400">
                        {{ formatPrice(room.pricing?.finalTotal, room.pricing?.currency) }}
                      </p>
                      <!-- Discount info if non-refundable -->
                      <p
                        v-if="room.nonRefundableDiscount > 0"
                        class="text-xs text-green-600 dark:text-green-400"
                      >
                        -%{{ room.nonRefundableDiscount }} indirimli
                      </p>
                    </div>
                  </div>
                  <!-- Room Guests -->
                  <div
                    v-if="room.guests?.length > 0"
                    class="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700"
                  >
                    <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">
                      {{ $t('booking.roomGuests') }}:
                    </p>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="(guest, gIndex) in room.guests"
                        :key="gIndex"
                        class="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-sm text-gray-700 dark:text-slate-300"
                      >
                        <span class="material-icons text-xs mr-1">person</span>
                        {{ guest.firstName }} {{ guest.lastName }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Lead Guest -->
            <div
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
            >
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span class="material-icons text-purple-500 mr-2">person</span>
                {{ $t('booking.leadGuest') }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div class="flex">
                  <span class="text-gray-500 dark:text-slate-400 min-w-[80px]"
                    >{{ $t('booking.name') }}:</span
                  >
                  <span class="font-medium text-gray-900 dark:text-white">{{
                    formatGuestName(booking.leadGuest)
                  }}</span>
                </div>
                <div class="flex">
                  <span class="text-gray-500 dark:text-slate-400 min-w-[80px]"
                    >{{ $t('booking.email') }}:</span
                  >
                  <span class="font-medium text-gray-900 dark:text-white">{{
                    booking.leadGuest?.email || '-'
                  }}</span>
                </div>
                <div class="flex">
                  <span class="text-gray-500 dark:text-slate-400 min-w-[80px]"
                    >{{ $t('booking.phone') }}:</span
                  >
                  <span class="font-medium text-gray-900 dark:text-white">{{
                    booking.leadGuest?.phone || '-'
                  }}</span>
                </div>
                <div class="flex">
                  <span class="text-gray-500 dark:text-slate-400 min-w-[80px]"
                    >{{ $t('booking.nationality') }}:</span
                  >
                  <span class="font-medium text-gray-900 dark:text-white">{{
                    booking.leadGuest?.nationality || '-'
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Special Requests -->
            <div
              v-if="booking.specialRequests"
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
            >
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span class="material-icons text-purple-500 mr-2">note</span>
                {{ $t('booking.specialRequests') }}
              </h3>
              <p class="text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                {{ booking.specialRequests }}
              </p>
            </div>

            <!-- Notes (hidden in print - internal only) -->
            <div
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 print:hidden"
            >
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span class="material-icons text-purple-500 mr-2">notes</span>
                {{ $t('booking.internalNotes') }}
              </h3>

              <!-- Existing Notes -->
              <div v-if="booking.notes?.length > 0" class="space-y-3 mb-4">
                <div
                  v-for="(note, index) in booking.notes"
                  :key="index"
                  class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3"
                >
                  <p class="text-gray-700 dark:text-slate-300">{{ note.content }}</p>
                  <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">
                    {{ note.createdBy?.name || note.createdBy?.email }} -
                    {{ formatDateTime(note.createdAt) }}
                  </p>
                </div>
              </div>

              <!-- Add Note -->
              <div class="flex space-x-2">
                <textarea
                  v-model="newNote"
                  :placeholder="$t('booking.addNotePlaceholder')"
                  rows="2"
                  class="form-input flex-1 resize-none"
                ></textarea>
                <button
                  :disabled="!newNote.trim() || isAddingNote"
                  class="btn-primary px-4"
                  @click="handleAddNote"
                >
                  <span v-if="isAddingNote" class="material-icons animate-spin">refresh</span>
                  <span v-else class="material-icons">send</span>
                </button>
              </div>
            </div>

            <!-- Amendment History (hidden in print) -->
            <div
              v-if="amendmentHistory.length > 0 || isLoadingHistory"
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 print:hidden"
            >
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span class="material-icons text-purple-500 mr-2">history</span>
                {{ $t('booking.amendmentHistory') }}
                <span
                  v-if="amendmentHistory.length > 0"
                  class="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                >
                  {{ amendmentHistory.length }}
                </span>
              </h3>
              <AmendmentHistoryTimeline
                :amendments="amendmentHistory"
                :loading="isLoadingHistory"
              />
            </div>
          </div>

          <!-- Right Column - Price Summary -->
          <div class="space-y-6">
            <!-- Price Card -->
            <div
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 sticky top-6"
            >
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4">
                {{ $t('booking.priceSummary') }}
              </h3>

              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500 dark:text-slate-400">{{
                    $t('booking.subtotal')
                  }}</span>
                  <span class="text-gray-900 dark:text-white">
                    {{
                      formatPrice(
                        booking.pricing?.originalTotal || booking.pricing?.subtotal,
                        booking.pricing?.currency
                      )
                    }}
                  </span>
                </div>

                <div v-if="booking.pricing?.totalDiscount > 0" class="flex justify-between text-sm">
                  <span class="text-green-600 dark:text-green-400">{{
                    $t('booking.discount')
                  }}</span>
                  <span class="text-green-600 dark:text-green-400">
                    -{{ formatPrice(booking.pricing.totalDiscount, booking.pricing?.currency) }}
                  </span>
                </div>

                <!-- Applied Campaigns -->
                <div v-if="booking.pricing?.campaigns?.length > 0" class="pt-2">
                  <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    {{ $t('booking.appliedCampaigns') }}:
                  </p>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="campaign in booking.pricing.campaigns"
                      :key="campaign.code"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    >
                      {{ campaign.name || campaign.code }}
                    </span>
                  </div>
                </div>

                <div class="border-t border-gray-200 dark:border-slate-700 my-3"></div>

                <div class="flex justify-between">
                  <span class="font-semibold text-gray-900 dark:text-white">{{
                    $t('booking.total')
                  }}</span>
                  <span class="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {{
                      formatPrice(
                        booking.pricing?.grandTotal ||
                          booking.pricing?.finalTotal ||
                          booking.pricing?.total,
                        booking.pricing?.currency
                      )
                    }}
                  </span>
                </div>

                <div
                  v-if="booking.nights > 0"
                  class="text-right text-xs text-gray-500 dark:text-slate-400"
                >
                  ~{{
                    formatPrice(
                      (booking.pricing?.grandTotal || booking.pricing?.finalTotal) / booking.nights,
                      booking.pricing?.currency
                    )
                  }}
                  / {{ $t('booking.perNight') }}
                </div>
              </div>

              <!-- Source Info -->
              <div
                v-if="booking.source"
                class="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 print:hidden"
              >
                <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('booking.source') }}</p>
                <p class="text-sm text-gray-900 dark:text-white">
                  {{ getSourceText(booking.source) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Print Footer (only visible in print) -->
      <div class="print-footer hidden print:block mt-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-600 mb-8">{{ $t('booking.guestSignature') }}</p>
            <div class="border-t border-gray-400 pt-1">
              <p class="text-xs text-gray-500">{{ $t('booking.date') }}: _______________</p>
            </div>
          </div>
          <div>
            <p class="text-xs text-gray-600 mb-8">{{ $t('booking.agentSignature') }}</p>
            <div class="border-t border-gray-400 pt-1">
              <p class="text-xs text-gray-500">{{ $t('booking.stamp') }}</p>
            </div>
          </div>
        </div>
        <p class="text-xs text-gray-400 text-center mt-3">
          {{ $t('booking.documentGenerated') }}
        </p>
      </div>

      <!-- Cancel Modal -->
      <Modal v-model="showCancelModal" :title="$t('booking.cancelBooking')">
        <p class="text-gray-600 dark:text-slate-400 mb-4">
          {{ $t('booking.cancelConfirmMessage') }}
        </p>
        <textarea
          v-model="cancelReason"
          :placeholder="$t('booking.cancelReasonPlaceholder')"
          rows="3"
          class="form-input w-full resize-none"
        ></textarea>
        <template #footer>
          <div class="flex space-x-3">
            <button class="btn-secondary flex-1" @click="showCancelModal = false">
              {{ $t('common.cancel') }}
            </button>
            <button
              class="btn-primary bg-red-600 hover:bg-red-700 flex-1"
              :disabled="isCancelling"
              @click="handleCancel"
            >
              <span v-if="isCancelling" class="material-icons animate-spin mr-2">refresh</span>
              {{ $t('booking.confirmCancel') }}
            </button>
          </div>
        </template>
      </Modal>

      <!-- Booking Amendment Modal -->
      <BookingAmendmentModal
        v-if="showAmendmentModal"
        :show="true"
        :booking-id="booking?._id"
        @close="showAmendmentModal = false"
        @updated="handleAmendmentComplete"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAsyncAction } from '@/composables/useAsyncAction'
import bookingService, { getAmendmentHistory } from '@/services/bookingService'
import BookingStatusBadge from '@/components/booking/BookingStatusBadge.vue'
import Modal from '@/components/common/Modal.vue'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'
import BookingAmendmentModal from '@/components/booking/amendment/BookingAmendmentModal.vue'
import AmendmentHistoryTimeline from '@/components/booking/amendment/AmendmentHistoryTimeline.vue'

const { t, locale } = useI18n()
const route = useRoute()
const toast = useToast()

// Navigation items
const navItems = computed(() => [
  {
    name: 'bookings',
    to: '/bookings',
    icon: 'event_note',
    label: t('booking.bookings'),
    matchPattern: '^/bookings(/[a-f0-9]+)?$'
  },
  {
    name: 'new-booking',
    to: '/bookings/new',
    icon: 'add',
    label: t('booking.newBooking'),
    exact: true
  }
])

// Async action composables
const { isLoading, execute: executeLoad } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const { isLoading: isUpdating, execute: executeUpdate } = useAsyncAction({ showErrorToast: false })
const { isLoading: isAddingNote, execute: executeAddNote } = useAsyncAction({ showErrorToast: false })
const { isLoading: isCancelling, execute: executeCancel } = useAsyncAction({ showErrorToast: false })
const { isLoading: isLoadingHistory, execute: executeHistory } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })

// State
const booking = ref(null)
const newNote = ref('')
const showCancelModal = ref(false)
const cancelReason = ref('')

// Amendment state
const showAmendmentModal = ref(false)
const amendmentHistory = ref([])

// Can cancel
const canCancel = computed(() => {
  return ['pending', 'confirmed', 'on_request'].includes(booking.value?.status)
})

// Can amend (modify booking)
const canAmend = computed(() => {
  return ['pending', 'confirmed', 'checked_in'].includes(booking.value?.status)
})

// Calculate nights
const nights = computed(() => {
  if (!booking.value?.checkIn || !booking.value?.checkOut) return 0
  const checkIn = new Date(booking.value.checkIn)
  const checkOut = new Date(booking.value.checkOut)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

// Fetch booking
const fetchBooking = async () => {
  await executeLoad(
    () => bookingService.getBooking(route.params.id),
    {
      onSuccess: response => {
        if (response.success) {
          booking.value = response.data
        }
      },
      onError: error => {
        console.error('Failed to fetch booking:', error)
        toast.error(t('booking.fetchFailed'))
      }
    }
  )
}

// Format date
const formatDate = dateStr => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Format datetime
const formatDateTime = dateStr => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format price
const formatPrice = (amount, currency) => {
  if (!amount) return '-'
  const formatter = new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency || 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
  return formatter.format(amount)
}

// Format guest name
const formatGuestName = guest => {
  if (!guest) return '-'
  const titleMap = {
    mr: t('booking.titleMr'),
    mrs: t('booking.titleMrs'),
    ms: t('booking.titleMs')
  }
  const title = titleMap[guest.title] || ''
  return `${title} ${guest.firstName} ${guest.lastName}`.trim()
}

// Get room name
const getRoomName = roomType => {
  if (!roomType) return '-'
  const name = roomType.name
  if (typeof name === 'object') {
    return (
      name[locale.value] || name.en || name.tr || Object.values(name)[0] || roomType.code || '-'
    )
  }
  return name || roomType.code || '-'
}

// Get meal plan name
const getMealPlanName = mealPlan => {
  if (!mealPlan) return '-'
  const name = mealPlan.name
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || mealPlan.code
  }
  return name || mealPlan.code
}

// Handle confirm
const handleConfirm = async () => {
  await executeUpdate(
    () => bookingService.updateBookingStatus(booking.value._id, 'confirmed'),
    {
      successMessage: 'booking.confirmSuccess',
      onSuccess: () => {
        booking.value.status = 'confirmed'
      },
      onError: error => {
        toast.error(error.message || t('booking.confirmFailed'))
      }
    }
  )
}

// Handle cancel
const handleCancel = async () => {
  await executeCancel(
    () => bookingService.cancelBooking(booking.value._id, cancelReason.value),
    {
      successMessage: 'booking.cancelSuccess',
      onSuccess: () => {
        booking.value.status = 'cancelled'
        showCancelModal.value = false
        cancelReason.value = ''
      },
      onError: error => {
        toast.error(error.message || t('booking.cancelFailed'))
      }
    }
  )
}

// Handle add note
const handleAddNote = async () => {
  if (!newNote.value.trim()) return

  const noteContent = newNote.value
  await executeAddNote(
    () => bookingService.addBookingNote(booking.value._id, noteContent),
    {
      successMessage: 'booking.noteAdded',
      onSuccess: response => {
        if (!booking.value.notes) booking.value.notes = []
        booking.value.notes.push(
          response.data.note || {
            content: noteContent,
            createdAt: new Date().toISOString()
          }
        )
        newNote.value = ''
      },
      onError: error => {
        toast.error(error.message || t('booking.noteAddFailed'))
      }
    }
  )
}

// Print booking
const printBooking = () => {
  window.print()
}

// Open amendment modal
const openAmendment = () => {
  showAmendmentModal.value = true
}

// Handle amendment complete
const handleAmendmentComplete = () => {
  showAmendmentModal.value = false
  fetchBooking()
  fetchAmendmentHistory()
}

// Fetch amendment history
const fetchAmendmentHistory = async () => {
  if (!booking.value?._id) return

  await executeHistory(
    () => getAmendmentHistory(booking.value._id),
    {
      onSuccess: response => {
        if (response.success) {
          amendmentHistory.value = response.data.amendments || []
        }
      },
      onError: error => {
        console.error('Failed to fetch amendment history:', error)
      }
    }
  )
}

// Get source display text
const getSourceText = source => {
  if (!source) return '-'
  if (typeof source === 'string') return source
  // Handle object source
  if (source.type) {
    const typeMap = {
      admin: 'Admin Panel',
      b2b: 'B2B / Acente',
      b2c: 'Web Site',
      api: 'API'
    }
    let text = typeMap[source.type] || source.type
    if (source.agencyName) {
      text += ` (${source.agencyName})`
    }
    return text
  }
  return JSON.stringify(source)
}

onMounted(async () => {
  await fetchBooking()
  fetchAmendmentHistory()
})
</script>

<style scoped>
/* Print Styles */
@media print {
  /* Hide browser chrome */
  @page {
    margin: 15mm;
    size: A4;
  }

  /* Force light background */
  :deep(*) {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Clean card styles for print */
  :deep(.bg-white),
  :deep(.dark\:bg-slate-800) {
    background-color: white !important;
    box-shadow: none !important;
    border: 1px solid #e5e7eb !important;
  }

  /* Ensure text is black */
  :deep(.text-gray-900),
  :deep(.dark\:text-white),
  :deep(.text-gray-700),
  :deep(.dark\:text-slate-300) {
    color: #111827 !important;
  }

  :deep(.text-gray-500),
  :deep(.dark\:text-slate-400),
  :deep(.text-gray-600) {
    color: #6b7280 !important;
  }

  /* Purple accents to gray for print */
  :deep(.text-purple-600),
  :deep(.dark\:text-purple-400),
  :deep(.text-purple-500) {
    color: #1f2937 !important;
  }

  /* Hide material icons in print (optional - keep some) */
  :deep(.material-icons) {
    display: none !important;
  }

  /* But show status badge */
  :deep(.booking-status-badge) .material-icons {
    display: inline-block !important;
  }

  /* Page break control */
  :deep(.bg-white) {
    page-break-inside: avoid;
  }

  /* Signature area at bottom */
  .print-footer {
    display: block !important;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
  }
}

/* Print footer - hidden on screen */
.print-footer {
  display: none;
}
</style>
