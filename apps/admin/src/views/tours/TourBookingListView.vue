<template>
  <div class="h-full flex flex-col">
    <!-- Navigation -->
    <ModuleNavigation :items="navItems" color="primary">
      <template #actions>
        <div class="flex items-center space-x-2">
          <BaseButton size="sm" variant="secondary" @click="exportToExcel">
            <span class="material-icons mr-1 text-sm">download</span>
            {{ $t('tourBooking.actions.export') }}
          </BaseButton>
          <BaseButton size="sm" @click="$router.push('/tours/bookings/new')">
            <span class="material-icons mr-1 text-sm">add</span>
            {{ $t('tourBooking.newBooking') }}
          </BaseButton>
        </div>
      </template>
    </ModuleNavigation>

    <div class="flex-1 overflow-y-auto py-6 space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <span class="material-icons text-purple-600 dark:text-purple-400">book_online</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('stats.totalBookings') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.total }}</p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <span class="material-icons text-yellow-600 dark:text-yellow-400"
                >hourglass_empty</span
              >
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('stats.pendingBookings') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.pending }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('stats.confirmedBookings') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.confirmed }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span class="material-icons text-blue-600 dark:text-blue-400">people</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('tourBooking.fields.passengers') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.passengers }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <span class="material-icons text-indigo-600 dark:text-indigo-400">payments</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t('stats.totalRevenue') }}
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(stats.revenue, 'TRY') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4"
      >
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <div class="flex-1">
            <input
              type="text"
              v-model="searchQuery"
              :placeholder="$t('tourBooking.search')"
              class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <!-- Tour Filter -->
            <select
              v-model="filters.tourId"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{{ $t('tourBooking.fields.tour') }}</option>
              <option v-for="tour in tours" :key="tour._id" :value="tour._id">
                {{ tour.name?.tr || tour.name?.en || tour.code }}
              </option>
            </select>

            <!-- Status Filter -->
            <select
              v-model="filters.status"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{{ $t('filters.allStatuses') }}</option>
              <option value="draft">{{ $t('tourBooking.bookingStatuses.draft') }}</option>
              <option value="pending">{{ $t('tourBooking.bookingStatuses.pending') }}</option>
              <option value="confirmed">{{ $t('tourBooking.bookingStatuses.confirmed') }}</option>
              <option value="cancelled">{{ $t('tourBooking.bookingStatuses.cancelled') }}</option>
              <option value="completed">{{ $t('tourBooking.bookingStatuses.completed') }}</option>
            </select>

            <!-- Sales Channel Filter -->
            <select
              v-model="filters.salesChannel"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{{ $t('tourBooking.fields.salesChannel') }}</option>
              <option value="b2c">{{ $t('tourBooking.salesChannels.b2c') }}</option>
              <option value="b2b">{{ $t('tourBooking.salesChannels.b2b') }}</option>
            </select>

            <!-- Date Range -->
            <input
              type="date"
              v-model="filters.startDate"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
            />
            <span class="text-gray-500">-</span>
            <input
              type="date"
              v-model="filters.endDate"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      <!-- Bookings Table -->
      <div
        class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
      >
        <div v-if="loading" class="p-8 text-center">
          <Spinner />
        </div>
        <div v-else-if="filteredBookings.length === 0" class="p-8 text-center">
          <span class="material-icons text-6xl text-gray-300 dark:text-gray-600 mb-4"
            >book_online</span
          >
          <p class="text-gray-500 dark:text-gray-400 mb-4">{{ $t('tourBooking.noBookings') }}</p>
          <BaseButton @click="$router.push('/tours/bookings/new')">
            {{ $t('tourBooking.createFirst') }}
          </BaseButton>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('tourBooking.fields.bookingNumber') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('tourBooking.fields.tour') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('tourBooking.fields.departure') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('tourBooking.passenger.lead') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('tourBooking.fields.passengers') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('tourBooking.fields.totalPrice') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('tourBooking.fields.status') }}
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {{ $t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
              <tr
                v-for="booking in filteredBookings"
                :key="booking._id"
                class="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                @click="viewBooking(booking)"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center">
                    <span class="font-mono font-medium text-purple-600 dark:text-purple-400">
                      {{ booking.bookingNumber }}
                    </span>
                    <span
                      v-if="booking.salesChannel === 'b2b'"
                      class="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded"
                    >
                      B2B
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ booking.tour?.name || '-' }}
                    </p>
                    <p class="text-sm text-gray-500">{{ booking.tour?.code || '' }}</p>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-900 dark:text-white">
                  {{ formatDate(booking.departure?.departureDate) }}
                </td>
                <td class="px-4 py-3">
                  <div v-if="getLeadPassenger(booking)">
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ getLeadPassenger(booking).firstName }}
                      {{ getLeadPassenger(booking).lastName }}
                    </p>
                    <p class="text-sm text-gray-500">{{ booking.contact?.phone || '' }}</p>
                  </div>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center space-x-2">
                    <span class="text-gray-900 dark:text-white">{{
                      booking.passengers?.length || 0
                    }}</span>
                    <span class="text-sm text-gray-500"> ({{ getPassengerCounts(booking) }}) </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{
                        formatCurrency(
                          booking.pricing?.grandTotal || 0,
                          booking.pricing?.currency || 'TRY'
                        )
                      }}
                    </p>
                    <p v-if="booking.payment?.dueAmount > 0" class="text-sm text-red-500">
                      {{ $t('tourBooking.fields.dueAmount') }}:
                      {{
                        formatCurrency(
                          booking.payment.dueAmount,
                          booking.pricing?.currency || 'TRY'
                        )
                      }}
                    </p>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <StatusBadge :status="booking.status" :statusMap="bookingStatusMap" />
                </td>
                <td class="px-4 py-3 text-right" @click.stop>
                  <ActionMenu :items="getRowActions(booking)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="filteredBookings.length > 0"
          class="px-4 py-3 border-t border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ filteredBookings.length }} {{ $t('tourBooking.bookings').toLowerCase() }}
            </p>
          </div>
        </div>
      </div>

      <!-- Cancel Modal -->
      <Modal v-model="showCancelModal" :title="$t('tourBooking.cancelReason.title')">
        <form @submit.prevent="confirmCancel" class="space-y-4">
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

      <!-- Confirm Dialog -->
      <ConfirmDialog
        v-model="showConfirmDialog"
        :title="confirmDialogTitle"
        :message="confirmDialogMessage"
        :variant="confirmDialogVariant"
        @confirm="confirmDialogAction"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTourStore } from '@/stores/tour'
import { formatCurrency } from '@booking-engine/utils'
import { BaseButton, ActionMenu, StatusBadge, Modal, ConfirmDialog, Spinner } from '@/components/ui'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'

const router = useRouter()
const { t, locale } = useI18n()
const tourStore = useTourStore()

// State
const loading = ref(false)
const cancelling = ref(false)
const searchQuery = ref('')
const showCancelModal = ref(false)
const cancelReason = ref('')
const cancellingBooking = ref(null)

// Confirm dialog state
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogVariant = ref('danger')
const confirmDialogAction = ref(() => {})

// Filters
const filters = ref({
  tourId: '',
  status: '',
  salesChannel: '',
  startDate: '',
  endDate: ''
})

// Computed
const bookings = computed(() => tourStore.bookings)
const tours = computed(() => tourStore.tours)

const navItems = computed(() => [
  { label: t('tour.tourList'), icon: 'tour', to: '/tours' },
  { label: t('departure.calendar'), icon: 'calendar_month', to: '/tours/departures' },
  { label: t('extra.extras'), icon: 'add_circle', to: '/tours/extras' },
  { label: t('tourBooking.bookings'), icon: 'book_online', to: '/tours/bookings' }
])

const stats = computed(() => {
  const bks = bookings.value
  return {
    total: bks.length,
    pending: bks.filter(b => b.status === 'pending').length,
    confirmed: bks.filter(b => b.status === 'confirmed').length,
    passengers: bks.reduce((sum, b) => sum + (b.passengers?.length || 0), 0),
    revenue: bks.reduce((sum, b) => sum + (b.pricing?.grandTotal || 0), 0)
  }
})

const filteredBookings = computed(() => {
  let result = [...bookings.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(b => {
      const bookingNo = (b.bookingNumber || '').toLowerCase()
      const tourName = (b.tour?.name || '').toLowerCase()
      const leadPassenger = getLeadPassenger(b)
      const passengerName = leadPassenger
        ? `${leadPassenger.firstName} ${leadPassenger.lastName}`.toLowerCase()
        : ''
      const phone = (b.contact?.phone || '').toLowerCase()

      return (
        bookingNo.includes(query) ||
        tourName.includes(query) ||
        passengerName.includes(query) ||
        phone.includes(query)
      )
    })
  }

  if (filters.value.tourId) {
    result = result.filter(b => b.tour?._id === filters.value.tourId)
  }

  if (filters.value.status) {
    result = result.filter(b => b.status === filters.value.status)
  }

  if (filters.value.salesChannel) {
    result = result.filter(b => b.salesChannel === filters.value.salesChannel)
  }

  if (filters.value.startDate) {
    const startDate = new Date(filters.value.startDate)
    result = result.filter(b => new Date(b.createdAt) >= startDate)
  }

  if (filters.value.endDate) {
    const endDate = new Date(filters.value.endDate)
    endDate.setHours(23, 59, 59, 999)
    result = result.filter(b => new Date(b.createdAt) <= endDate)
  }

  // Sort by created date (newest first)
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return result
})

const bookingStatusMap = {
  draft: { label: t('tourBooking.bookingStatuses.draft'), color: 'gray' },
  pending: { label: t('tourBooking.bookingStatuses.pending'), color: 'yellow' },
  confirmed: { label: t('tourBooking.bookingStatuses.confirmed'), color: 'green' },
  cancelled: { label: t('tourBooking.bookingStatuses.cancelled'), color: 'red' },
  completed: { label: t('tourBooking.bookingStatuses.completed'), color: 'blue' },
  no_show: { label: t('tourBooking.bookingStatuses.no_show'), color: 'orange' }
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

function getLeadPassenger(booking) {
  if (!booking.passengers || booking.passengers.length === 0) return null
  return booking.passengers.find(p => p.isLead) || booking.passengers[0]
}

function getPassengerCounts(booking) {
  if (!booking.passengers || booking.passengers.length === 0) return '-'
  const adults = booking.passengers.filter(p => p.type === 'adult').length
  const children = booking.passengers.filter(p => p.type === 'child').length
  const infants = booking.passengers.filter(p => p.type === 'infant').length

  const parts = []
  if (adults > 0) parts.push(`${adults} Y`)
  if (children > 0) parts.push(`${children} Ç`)
  if (infants > 0) parts.push(`${infants} B`)
  return parts.join(', ')
}

function viewBooking(booking) {
  router.push(`/tours/bookings/${booking._id}`)
}

function getRowActions(booking) {
  const actions = [
    {
      label: t('common.view'),
      icon: 'visibility',
      action: () => viewBooking(booking)
    },
    {
      label: t('common.edit'),
      icon: 'edit',
      action: () => router.push(`/tours/bookings/${booking._id}`)
    }
  ]

  if (booking.status === 'pending') {
    actions.push({
      label: t('tourBooking.actions.confirm'),
      icon: 'check_circle',
      action: () => confirmBooking(booking)
    })
  }

  if (['pending', 'confirmed'].includes(booking.status)) {
    actions.push({
      label: t('tourBooking.actions.cancel'),
      icon: 'cancel',
      variant: 'danger',
      action: () => openCancelModal(booking)
    })
  }

  actions.push({
    label: t('tourBooking.actions.print'),
    icon: 'print',
    action: () => printBooking(booking)
  })

  return actions
}

function confirmBooking(booking) {
  confirmDialogTitle.value = t('tourBooking.actions.confirm')
  confirmDialogMessage.value = `${booking.bookingNumber} numaralı rezervasyonu onaylamak istediğinize emin misiniz?`
  confirmDialogVariant.value = 'primary'
  confirmDialogAction.value = async () => {
    await tourStore.updateBookingStatus(booking._id, 'confirmed')
  }
  showConfirmDialog.value = true
}

function openCancelModal(booking) {
  cancellingBooking.value = booking
  cancelReason.value = ''
  showCancelModal.value = true
}

async function confirmCancel() {
  if (!cancellingBooking.value) return

  cancelling.value = true
  try {
    await tourStore.cancelBooking(cancellingBooking.value._id, cancelReason.value)
    showCancelModal.value = false
    cancellingBooking.value = null
  } finally {
    cancelling.value = false
  }
}

function printBooking(booking) {
  // Print booking voucher
  window.open(`/api/tour-bookings/${booking._id}/voucher`, '_blank')
}

function exportToExcel() {
  // Export bookings to Excel
  const params = new URLSearchParams()
  if (filters.value.tourId) params.append('tour', filters.value.tourId)
  if (filters.value.status) params.append('status', filters.value.status)
  if (filters.value.salesChannel) params.append('salesChannel', filters.value.salesChannel)
  if (filters.value.startDate) params.append('startDate', filters.value.startDate)
  if (filters.value.endDate) params.append('endDate', filters.value.endDate)

  window.open(`/api/tour-bookings/export?${params.toString()}`, '_blank')
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([tourStore.fetchTours(), tourStore.fetchBookings()])
  } finally {
    loading.value = false
  }
})
</script>
