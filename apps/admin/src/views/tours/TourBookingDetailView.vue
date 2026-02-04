<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-4">
        <button
          @click="$router.push('/tours/bookings')"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          <span class="material-icons">arrow_back</span>
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ booking?.bookingNo || $t('tourBooking.bookingDetails') }}
            </h1>
            <StatusBadge v-if="booking" :status="booking.status" :statusMap="bookingStatusMap" />
          </div>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ getLocalizedName(booking?.tour?.name) || '' }}
          </p>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <BaseButton variant="secondary" @click="printVoucher">
          <span class="material-icons mr-2">print</span>
          {{ $t('tourBooking.actions.print') }}
        </BaseButton>
        <BaseButton
          v-if="booking?.status === 'pending'"
          @click="confirmBooking"
          :loading="confirming"
        >
          <span class="material-icons mr-2">check_circle</span>
          {{ $t('tourBooking.actions.confirm') }}
        </BaseButton>
        <BaseButton
          v-if="['pending', 'confirmed'].includes(booking?.status)"
          variant="danger"
          @click="showCancelModal = true"
        >
          <span class="material-icons mr-2">cancel</span>
          {{ $t('tourBooking.actions.cancel') }}
        </BaseButton>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <Spinner />
    </div>

    <div v-else-if="booking" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Tour & Departure Info -->
        <div
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ $t('tourBooking.fields.tour') }}
          </h3>
          <div class="flex items-start gap-4">
            <div
              class="w-24 h-16 bg-gray-200 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0"
            >
              <img
                v-if="getTourImage(booking.tour)"
                :src="getTourImage(booking.tour)"
                :alt="getLocalizedName(booking.tour?.name)"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="material-icons text-gray-400">tour</span>
              </div>
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900 dark:text-white">
                {{ getLocalizedName(booking.tour?.name) }}
              </h4>
              <p class="text-sm text-gray-500">{{ booking.tour?.code }}</p>
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span class="flex items-center">
                  <span class="material-icons text-sm mr-1">calendar_today</span>
                  {{ formatDate(booking.departure?.departureDate) }} -
                  {{ formatDate(booking.departure?.returnDate) }}
                </span>
                <span v-if="booking.tour?.primaryLocation?.name" class="flex items-center">
                  <span class="material-icons text-sm mr-1">place</span>
                  {{ booking.tour.primaryLocation.name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Passengers -->
        <div
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ $t('tourBooking.passenger.title') }} ({{ booking.passengers?.length || 0 }})
            </h3>
            <BaseButton variant="secondary" size="sm" @click="showPassengerModal = true">
              <span class="material-icons mr-1">edit</span>
              {{ $t('common.edit') }}
            </BaseButton>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th
                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                  >
                    {{ $t('tourBooking.passenger.name') }}
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                  >
                    {{ $t('tourBooking.passenger.type') }}
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                  >
                    {{ $t('tourBooking.passenger.tcNumber') }}
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                  >
                    {{ $t('tourBooking.passenger.dateOfBirth') }}
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                  >
                    {{ $t('tourBooking.visa.status') }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
                <tr v-for="(passenger, index) in booking.passengers" :key="index">
                  <td class="px-3 py-2">
                    <div class="flex items-center">
                      <span class="font-medium text-gray-900 dark:text-white">
                        {{ passenger.firstName }} {{ passenger.lastName }}
                      </span>
                      <span
                        v-if="passenger.isLead"
                        class="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded"
                      >
                        {{ $t('tourBooking.passenger.lead') }}
                      </span>
                    </div>
                  </td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                    {{ $t(`tourBooking.passenger.${passenger.type}`) }}
                  </td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono">
                    {{ passenger.tcNumber || '-' }}
                  </td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                    {{ formatDate(passenger.dateOfBirth) || '-' }}
                  </td>
                  <td class="px-3 py-2">
                    <StatusBadge
                      :status="getPassengerVisaStatus(passenger)"
                      :statusMap="visaStatusMap"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Contact Information -->
        <div
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ $t('tourBooking.contact.title') }}
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                {{ $t('tourBooking.contact.email') }}
              </label>
              <p class="text-gray-900 dark:text-white">{{ booking.contact?.email || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                {{ $t('tourBooking.contact.phone') }}
              </label>
              <p class="text-gray-900 dark:text-white">{{ booking.contact?.phone || '-' }}</p>
            </div>
          </div>
        </div>

        <!-- Extras -->
        <div
          v-if="booking.extras?.length > 0"
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ $t('tourBooking.extras.title') }}
          </h3>
          <div class="space-y-2">
            <div
              v-for="(extra, index) in booking.extras"
              :key="index"
              class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-0"
            >
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ getLocalizedName(extra.name) }}
                </p>
                <p class="text-sm text-gray-500">x {{ extra.quantity }}</p>
              </div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(extra.totalPrice, booking.pricing?.currency || 'TRY') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Special Requests -->
        <div
          v-if="booking.specialRequests"
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ $t('tourBooking.notes.specialRequests') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400">{{ booking.specialRequests }}</p>
        </div>

        <!-- Payment History -->
        <div
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ $t('tourBooking.payment.title') }}
            </h3>
            <BaseButton variant="secondary" size="sm" @click="showPaymentModal = true">
              <span class="material-icons mr-1">add</span>
              {{ $t('tourBooking.payment.addPayment') }}
            </BaseButton>
          </div>

          <div class="space-y-3">
            <div
              v-for="(transaction, index) in booking.payment?.transactions || []"
              :key="index"
              class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-0"
            >
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{
                    formatCurrency(
                      transaction.amount,
                      transaction.currency || booking.pricing?.currency || 'TRY'
                    )
                  }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatDate(transaction.paidAt) }} -
                  {{ getPaymentMethodLabel(transaction.method) }}
                </p>
                <p v-if="transaction.note" class="text-xs text-gray-400 mt-1">
                  {{ transaction.note }}
                </p>
              </div>
            </div>
            <div
              v-if="!booking.payment?.transactions?.length"
              class="text-center py-4 text-gray-500 dark:text-gray-400"
            >
              {{ $t('payment.noPayments') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Price Summary -->
        <div
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ $t('tourBooking.pricing.title') }}
          </h3>

          <div class="space-y-3 text-sm">
            <div v-if="booking.pricing?.adults" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">{{
                $t('tourBooking.pricing.adults')
              }}</span>
              <span class="text-gray-900 dark:text-white">{{
                formatCurrency(booking.pricing.adults, booking.pricing.currency)
              }}</span>
            </div>
            <div v-if="booking.pricing?.children" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">{{
                $t('tourBooking.pricing.children')
              }}</span>
              <span class="text-gray-900 dark:text-white">{{
                formatCurrency(booking.pricing.children, booking.pricing.currency)
              }}</span>
            </div>
            <div v-if="booking.pricing?.extras" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">{{
                $t('tourBooking.pricing.extras')
              }}</span>
              <span class="text-gray-900 dark:text-white">{{
                formatCurrency(booking.pricing.extras, booking.pricing.currency)
              }}</span>
            </div>
            <div v-if="booking.pricing?.discount" class="flex justify-between text-green-600">
              <span>{{ $t('tourBooking.pricing.discount') }}</span>
              <span>-{{ formatCurrency(booking.pricing.discount, booking.pricing.currency) }}</span>
            </div>
            <div class="pt-3 border-t border-gray-200 dark:border-slate-700 flex justify-between">
              <span class="font-medium text-gray-900 dark:text-white">{{
                $t('tourBooking.pricing.grandTotal')
              }}</span>
              <span class="font-bold text-purple-600 dark:text-purple-400">
                {{
                  formatCurrency(
                    booking.pricing?.grandTotal || 0,
                    booking.pricing?.currency || 'TRY'
                  )
                }}
              </span>
            </div>
          </div>

          <!-- Payment Status -->
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-600 dark:text-gray-400">{{
                $t('tourBooking.payment.paidAmount')
              }}</span>
              <span class="text-green-600">{{
                formatCurrency(booking.payment?.paidAmount || 0, booking.pricing?.currency || 'TRY')
              }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">{{
                $t('tourBooking.payment.dueAmount')
              }}</span>
              <span class="text-red-600 font-medium">{{
                formatCurrency(booking.payment?.dueAmount || 0, booking.pricing?.currency || 'TRY')
              }}</span>
            </div>
          </div>
        </div>

        <!-- Booking Info -->
        <div
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ $t('tourBooking.bookingDetails') }}
          </h3>

          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">{{
                $t('tourBooking.fields.bookingNumber')
              }}</span>
              <span class="font-mono text-gray-900 dark:text-white">{{
                booking.bookingNo
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">{{
                $t('tourBooking.fields.salesChannel')
              }}</span>
              <span class="text-gray-900 dark:text-white">{{
                $t(`tourBooking.salesChannels.${booking.salesChannel}`)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">{{
                $t('tourBooking.fields.createdAt')
              }}</span>
              <span class="text-gray-900 dark:text-white">{{
                formatDateTime(booking.createdAt)
              }}</span>
            </div>
            <div v-if="booking.source?.agencyName" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">{{ $t('agencies.agency') }}</span>
              <span class="text-gray-900 dark:text-white">{{ booking.source.agencyName }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div
          class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ $t('common.actions') }}
          </h3>

          <div class="space-y-2">
            <BaseButton
              variant="secondary"
              class="w-full justify-start"
              @click="sendConfirmationEmail"
            >
              <span class="material-icons mr-2">email</span>
              {{ $t('tourBooking.actions.sendConfirmation') }}
            </BaseButton>
            <BaseButton variant="secondary" class="w-full justify-start" @click="printVoucher">
              <span class="material-icons mr-2">print</span>
              {{ $t('tourBooking.actions.print') }}
            </BaseButton>
            <BaseButton variant="secondary" class="w-full justify-start" @click="exportBooking">
              <span class="material-icons mr-2">download</span>
              {{ $t('tourBooking.actions.export') }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Modal -->
    <Modal v-model="showCancelModal" :title="$t('tourBooking.cancelReason.title')">
      <form @submit.prevent="cancelBooking" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('tourBooking.cancelReason.title') }}
          </label>
          <textarea
            v-model="cancelReason"
            rows="4"
            required
            :placeholder="$t('tourBooking.cancelReason.placeholder')"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          ></textarea>
        </div>
        <div class="flex justify-end space-x-3">
          <BaseButton variant="secondary" @click="showCancelModal = false">
            {{ $t('common.cancel') }}
          </BaseButton>
          <BaseButton type="submit" variant="danger" :loading="cancelling">
            {{ $t('tourBooking.actions.cancel') }}
          </BaseButton>
        </div>
      </form>
    </Modal>

    <!-- Payment Modal -->
    <Modal v-model="showPaymentModal" :title="$t('tourBooking.payment.addPayment')">
      <form @submit.prevent="addPayment" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('tourBooking.pricing.grandTotal') }}
          </label>
          <input
            type="number"
            v-model.number="paymentForm.amount"
            min="0"
            step="0.01"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('tourBooking.payment.method') }}
          </label>
          <select
            v-model="paymentForm.method"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          >
            <option value="credit_card">{{ $t('agencies.paymentMethods.creditCard') }}</option>
            <option value="bank_transfer">{{ $t('agencies.paymentMethods.bankTransfer') }}</option>
            <option value="cash">{{ $t('agencies.paymentMethods.cash') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('tourBooking.notes.title') }}
          </label>
          <textarea
            v-model="paymentForm.notes"
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          ></textarea>
        </div>
        <div class="flex justify-end space-x-3">
          <BaseButton variant="secondary" @click="showPaymentModal = false">
            {{ $t('common.cancel') }}
          </BaseButton>
          <BaseButton type="submit" :loading="addingPayment">
            {{ $t('common.save') }}
          </BaseButton>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTourStore } from '@/stores/tour'
import { formatCurrency } from '@booking-engine/utils'
import { BaseButton, StatusBadge, Modal, Spinner } from '@/components/ui'
import { getFileUrl } from '@/utils/imageUrl'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const tourStore = useTourStore()

// State
const loading = ref(false)
const confirming = ref(false)
const cancelling = ref(false)
const addingPayment = ref(false)
const booking = ref(null)

const showCancelModal = ref(false)
const showPaymentModal = ref(false)
const showPassengerModal = ref(false)
const cancelReason = ref('')

const paymentForm = ref({
  amount: 0,
  method: 'credit_card',
  notes: ''
})

// Status maps
const bookingStatusMap = {
  draft: { label: t('tourBooking.bookingStatuses.draft'), color: 'gray' },
  pending: { label: t('tourBooking.bookingStatuses.pending'), color: 'yellow' },
  confirmed: { label: t('tourBooking.bookingStatuses.confirmed'), color: 'green' },
  cancelled: { label: t('tourBooking.bookingStatuses.cancelled'), color: 'red' },
  completed: { label: t('tourBooking.bookingStatuses.completed'), color: 'blue' },
  no_show: { label: t('tourBooking.bookingStatuses.no_show'), color: 'orange' }
}

const visaStatusMap = {
  not_required: { label: t('tourBooking.visa.visaStatuses.not_required'), color: 'gray' },
  pending_documents: {
    label: t('tourBooking.visa.visaStatuses.pending_documents'),
    color: 'yellow'
  },
  documents_received: {
    label: t('tourBooking.visa.visaStatuses.documents_received'),
    color: 'blue'
  },
  submitted: { label: t('tourBooking.visa.visaStatuses.submitted'), color: 'purple' },
  approved: { label: t('tourBooking.visa.visaStatuses.approved'), color: 'green' },
  rejected: { label: t('tourBooking.visa.visaStatuses.rejected'), color: 'red' }
}

const paymentStatusMap = {
  pending: { label: t('tourBooking.payment.paymentStatuses.pending'), color: 'yellow' },
  partial: { label: t('tourBooking.payment.paymentStatuses.partial'), color: 'blue' },
  paid: { label: t('tourBooking.payment.paymentStatuses.paid'), color: 'green' },
  refunded: { label: t('tourBooking.payment.paymentStatuses.refunded'), color: 'gray' }
}

// Methods
function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatDateTime(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getLocalizedName(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[locale.value] || obj.tr || obj.en || ''
}

function getTourImage(tour) {
  const main = tour?.mainImage || tour?.gallery?.find(i => i.isMain)?.url || tour?.gallery?.[0]?.url
  return main ? getFileUrl(main) : ''
}

function getPassengerVisaStatus(passenger) {
  return passenger?.visa?.status || 'not_required'
}

function getPaymentMethodLabel(method) {
  const methodMap = {
    credit_card: t('payment.type.credit_card'),
    bank_transfer: t('payment.type.bank_transfer'),
    cash: t('payment.type.cash'),
    agency_credit: t('payment.type.agency_credit')
  }
  return methodMap[method] || method
}

async function loadBooking() {
  loading.value = true
  try {
    booking.value = await tourStore.fetchBooking(route.params.id)
    paymentForm.value.amount = booking.value.payment?.dueAmount || 0
  } finally {
    loading.value = false
  }
}

async function confirmBooking() {
  confirming.value = true
  try {
    await tourStore.updateBookingStatus(booking.value._id, 'confirmed')
    booking.value.status = 'confirmed'
  } finally {
    confirming.value = false
  }
}

async function cancelBooking() {
  cancelling.value = true
  try {
    await tourStore.cancelBooking(booking.value._id, { reason: cancelReason.value })
    booking.value.status = 'cancelled'
    showCancelModal.value = false
  } finally {
    cancelling.value = false
  }
}

async function addPayment() {
  addingPayment.value = true
  try {
    await tourStore.addPayment(booking.value._id, {
      amount: paymentForm.value.amount,
      method: paymentForm.value.method,
      note: paymentForm.value.notes,
      currency: booking.value.pricing?.currency || 'TRY'
    })
    await loadBooking()
    showPaymentModal.value = false
    paymentForm.value = { amount: 0, method: 'credit_card', notes: '' }
  } finally {
    addingPayment.value = false
  }
}

function printVoucher() {
  window.open(`/api/tour-bookings/${booking.value._id}/voucher`, '_blank')
}

function sendConfirmationEmail() {
  // TODO: Implement send confirmation email
  alert('Onay e-postası gönderildi')
}

function exportBooking() {
  window.open(`/api/tour-bookings/${booking.value._id}/export`, '_blank')
}

// Lifecycle
onMounted(() => {
  loadBooking()
})
</script>
