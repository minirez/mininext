<template>
  <div class="my-booking-view">
    <h2 class="my-booking-title">{{ $t('widget.myBooking') }}</h2>
    <p class="my-booking-subtitle">{{ $t('widget.myBookingDescription') }}</p>

    <!-- Search Form -->
    <div v-if="!booking" class="booking-search-form">
      <div class="form-group">
        <label class="form-label">{{ $t('widget.bookingNumber') }}</label>
        <input
          v-model="bookingNumber"
          type="text"
          class="form-input"
          :placeholder="$t('widget.bookingNumberPlaceholder')"
        />
      </div>

      <div class="form-group">
        <label class="form-label">{{ $t('widget.email') }}</label>
        <input
          v-model="email"
          type="email"
          class="form-input"
          :placeholder="$t('widget.emailPlaceholder')"
        />
      </div>

      <button
        class="search-btn"
        :disabled="!canSearch || isLoading"
        @click="searchBooking"
      >
        <Spinner v-if="isLoading" size="sm" color="white" />
        <template v-else>
          <WidgetIcon name="search" :size="18" />
          {{ $t('widget.findBooking') }}
        </template>
      </button>

      <div v-if="error" class="search-error">
        <WidgetIcon name="alert-circle" :size="18" />
        {{ error }}
      </div>
    </div>

    <!-- Booking Details -->
    <div v-else class="booking-details">
      <!-- Status Badge -->
      <div class="booking-status" :class="booking.status">
        <WidgetIcon :name="getStatusIcon(booking.status)" :size="16" />
        {{ $t(`widget.status.${booking.status}`) }}
      </div>

      <!-- Booking Number -->
      <div class="booking-number-display">
        <span class="booking-number-label">{{ $t('widget.bookingNumber') }}</span>
        <span class="booking-number-value">{{ booking.bookingNumber }}</span>
      </div>

      <!-- Details Grid -->
      <div class="booking-info-grid">
        <div class="info-item">
          <span class="info-label">{{ $t('widget.hotel') }}</span>
          <span class="info-value">{{ booking.hotel?.name }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">{{ $t('widget.dates') }}</span>
          <span class="info-value">
            {{ formatDate(booking.checkIn) }} - {{ formatDate(booking.checkOut) }}
          </span>
        </div>

        <div class="info-item">
          <span class="info-label">{{ $t('widget.guests') }}</span>
          <span class="info-value">{{ booking.totalGuests }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">{{ $t('widget.total') }}</span>
          <span class="info-value total">
            {{ formatPrice(booking.pricing?.finalTotal, booking.pricing?.currency) }}
          </span>
        </div>
      </div>

      <!-- Rooms -->
      <div class="booking-rooms">
        <h4 class="rooms-title">{{ $t('widget.rooms') }}</h4>
        <div
          v-for="(room, index) in booking.rooms"
          :key="index"
          class="room-item"
        >
          <span class="room-name">{{ room.roomType?.name }}</span>
          <span class="room-meal">{{ room.mealPlan?.name }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="booking-actions">
        <button
          v-if="canCancel"
          class="cancel-btn"
          @click="showCancelConfirm = true"
        >
          <WidgetIcon name="x" :size="18" />
          {{ $t('widget.cancelBooking') }}
        </button>

        <button class="back-btn" @click="resetSearch">
          <WidgetIcon name="arrow-left" :size="18" />
          {{ $t('widget.searchAnother') }}
        </button>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div v-if="showCancelConfirm" class="cancel-modal-backdrop" @click.self="showCancelConfirm = false">
      <div class="cancel-modal">
        <h3>{{ $t('widget.cancelConfirmTitle') }}</h3>
        <p>{{ $t('widget.cancelConfirmMessage') }}</p>

        <div class="form-group">
          <label class="form-label">{{ $t('widget.cancelReason') }}</label>
          <textarea
            v-model="cancelReason"
            class="form-textarea"
            rows="3"
            :placeholder="$t('widget.cancelReasonPlaceholder')"
          />
        </div>

        <div class="cancel-modal-actions">
          <button class="btn-secondary" @click="showCancelConfirm = false">
            {{ $t('common.cancel') }}
          </button>
          <button
            class="btn-danger"
            :disabled="isCancelling"
            @click="confirmCancel"
          >
            <Spinner v-if="isCancelling" size="sm" color="white" />
            <span v-else>{{ $t('widget.confirmCancel') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import Spinner from '@/components/ui/feedback/Spinner.vue'
import WidgetIcon from '../components/WidgetIcon.vue'

const api = inject('widgetApi')
const { t, locale } = useI18n()

const bookingNumber = ref('')
const email = ref('')
const booking = ref(null)
const isLoading = ref(false)
const error = ref(null)
const showCancelConfirm = ref(false)
const cancelReason = ref('')
const isCancelling = ref(false)

const canSearch = computed(() => bookingNumber.value && email.value)

const canCancel = computed(() => {
  return booking.value && ['pending', 'confirmed'].includes(booking.value.status)
})

function getStatusIcon(status) {
  const icons = {
    pending: 'calendar',
    confirmed: 'check-circle',
    cancelled: 'x',
    completed: 'check'
  }
  return icons[status] || 'alert-circle'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatPrice(amount, currency) {
  if (!amount) return ''
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: currency || 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

async function searchBooking() {
  if (!canSearch.value) return

  isLoading.value = true
  error.value = null

  try {
    const result = await api.getBooking(bookingNumber.value, email.value)
    booking.value = result
  } catch (err) {
    error.value = err.message || t('widget.bookingNotFound')
  } finally {
    isLoading.value = false
  }
}

function resetSearch() {
  booking.value = null
  bookingNumber.value = ''
  email.value = ''
  error.value = null
}

async function confirmCancel() {
  isCancelling.value = true

  try {
    await api.cancelBooking(booking.value.bookingNumber, email.value, cancelReason.value)
    booking.value.status = 'cancelled'
    showCancelConfirm.value = false
    cancelReason.value = ''
  } catch (err) {
    error.value = err.message
  } finally {
    isCancelling.value = false
  }
}
</script>

<style scoped>
.my-booking-view {
  max-width: 500px;
  margin: 0 auto;
}

.my-booking-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
  text-align: center;
}

:deep(.dark) .my-booking-title {
  color: white;
}

.my-booking-subtitle {
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;
}

/* Search Form */
.booking-search-form {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

:deep(.dark) .booking-search-form {
  background: #1f2937;
  border-color: #374151;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.375rem;
}

:deep(.dark) .form-label {
  color: #d1d5db;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  background: white;
  color: #111827;
}

.form-input:focus {
  outline: none;
  border-color: var(--widget-primary, #7c3aed);
}

:deep(.dark) .form-input {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.search-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: var(--widget-primary, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
}

.search-btn:hover:not(:disabled) {
  background: var(--widget-primary-600, #9333ea);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
}

/* Booking Details */
.booking-details {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

:deep(.dark) .booking-details {
  background: #1f2937;
  border-color: #374151;
}

.booking-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.booking-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.booking-status.confirmed {
  background: #d1fae5;
  color: #065f46;
}

.booking-status.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.booking-status.completed {
  background: #dbeafe;
  color: #1e40af;
}

.booking-number-display {
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

:deep(.dark) .booking-number-display {
  background: #374151;
}

.booking-number-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.booking-number-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--widget-primary, #7c3aed);
}

.booking-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.info-value {
  font-weight: 500;
  color: #111827;
}

:deep(.dark) .info-value {
  color: white;
}

.info-value.total {
  color: var(--widget-primary, #7c3aed);
  font-weight: 700;
}

.booking-rooms {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  margin-bottom: 1rem;
}

:deep(.dark) .booking-rooms {
  border-top-color: #374151;
}

.rooms-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.room-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.room-name {
  font-weight: 500;
}

.room-meal {
  font-size: 0.875rem;
  color: #6b7280;
}

.booking-actions {
  display: flex;
  gap: 0.75rem;
}

.cancel-btn,
.back-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  background: #fee2e2;
  border: none;
  color: #991b1b;
}

.back-btn {
  background: #f3f4f6;
  border: none;
  color: #374151;
}

/* Cancel Modal */
.cancel-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.cancel-modal {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
}

:deep(.dark) .cancel-modal {
  background: #1f2937;
}

.cancel-modal h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.cancel-modal p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  resize: vertical;
}

:deep(.dark) .form-textarea {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.cancel-modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-secondary {
  flex: 1;
  padding: 0.75rem;
  background: #f3f4f6;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.btn-danger {
  flex: 1;
  padding: 0.75rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.btn-danger:disabled {
  opacity: 0.6;
}
</style>
