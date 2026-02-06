<template>
  <div class="payment-view">
    <div class="payment-view-header">
      <h2 class="payment-view-title">{{ $t('widget.payment') }}</h2>
      <p class="payment-view-subtitle">{{ $t('widget.paymentDescription') }}</p>
    </div>

    <!-- Payment Summary -->
    <div class="payment-summary">
      <div class="payment-summary-row">
        <span>{{ $t('widget.subtotal') }}</span>
        <span>{{ formatPrice(subtotal) }}</span>
      </div>
      <div v-if="totalDiscount > 0" class="payment-summary-row discount">
        <span>{{ $t('widget.discount') }}</span>
        <span>-{{ formatPrice(totalDiscount) }}</span>
      </div>
      <div class="payment-summary-total">
        <span>{{ $t('widget.totalToPay') }}</span>
        <span class="total-amount">{{ formatPrice(grandTotal) }}</span>
      </div>
    </div>

    <!-- Payment Methods -->
    <div class="payment-methods">
      <h3 class="payment-section-title">{{ $t('widget.selectPaymentMethod') }}</h3>

      <!-- Credit Card -->
      <label class="payment-method" :class="{ 'is-selected': paymentMethod === 'card' }">
        <input
          v-model="paymentMethod"
          type="radio"
          name="payment"
          value="card"
          class="payment-radio"
        />
        <div class="payment-method-content">
          <div class="payment-method-icon">
            <WidgetIcon name="credit-card" :size="24" />
          </div>
          <div class="payment-method-info">
            <span class="payment-method-name">{{ $t('widget.payWithCard') }}</span>
            <span class="payment-method-desc">{{ $t('widget.payWithCardDesc') }}</span>
          </div>
        </div>
      </label>

      <!-- Pay at Hotel -->
      <label
        v-if="hotelConfig?.allowPayAtHotel"
        class="payment-method"
        :class="{ 'is-selected': paymentMethod === 'atHotel' }"
      >
        <input
          v-model="paymentMethod"
          type="radio"
          name="payment"
          value="atHotel"
          class="payment-radio"
        />
        <div class="payment-method-content">
          <div class="payment-method-icon">
            <WidgetIcon name="hotel" :size="24" />
          </div>
          <div class="payment-method-info">
            <span class="payment-method-name">{{ $t('widget.payAtHotel') }}</span>
            <span class="payment-method-desc">{{ $t('widget.payAtHotelDesc') }}</span>
          </div>
        </div>
      </label>

      <!-- Bank Transfer -->
      <label
        v-if="hotelConfig?.allowBankTransfer"
        class="payment-method"
        :class="{ 'is-selected': paymentMethod === 'transfer' }"
      >
        <input
          v-model="paymentMethod"
          type="radio"
          name="payment"
          value="transfer"
          class="payment-radio"
        />
        <div class="payment-method-content">
          <div class="payment-method-icon">
            <WidgetIcon name="bank" :size="24" />
          </div>
          <div class="payment-method-info">
            <span class="payment-method-name">{{ $t('widget.bankTransfer') }}</span>
            <span class="payment-method-desc">{{ $t('widget.bankTransferDesc') }}</span>
          </div>
        </div>
      </label>
    </div>

    <!-- Terms and Conditions -->
    <div class="terms-section">
      <label class="terms-checkbox">
        <input
          v-model="termsAccepted"
          type="checkbox"
          class="checkbox"
        />
        <span class="terms-text">
          {{ $t('widget.termsPrefix') }}
          <a href="#" @click.prevent="showTerms">{{ $t('widget.termsLink') }}</a>
          {{ $t('widget.termsSuffix') }}
        </span>
      </label>
    </div>

    <!-- Complete Booking Button -->
    <div class="payment-action">
      <button
        class="complete-btn"
        :disabled="!canComplete || isLoading"
        @click="completeBooking"
      >
        <Spinner v-if="isLoading" size="sm" color="white" />
        <template v-else>
          <WidgetIcon name="lock" :size="20" />
          {{ $t('widget.completeBooking') }}
        </template>
      </button>
      <p class="secure-note">
        <WidgetIcon name="shield-check" :size="16" class="secure-icon" />
        {{ $t('widget.securePayment') }}
      </p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="payment-error">
      <WidgetIcon name="alert-circle" :size="20" />
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Spinner from '@/components/ui/feedback/Spinner.vue'
import WidgetIcon from '../components/WidgetIcon.vue'

const store = inject('widgetStore')
const api = inject('widgetApi')
const router = useRouter()
const { t, locale } = useI18n()

const isLoading = ref(false)
const error = ref(null)

// Store state
const subtotal = computed(() => store.subtotal)
const totalDiscount = computed(() => store.totalDiscount)
const grandTotal = computed(() => store.grandTotal)
const currency = computed(() => store.currency)
const hotelConfig = computed(() => store.hotelConfig)

const paymentMethod = computed({
  get: () => store.payment.method,
  set: (val) => store.setPaymentMethod(val)
})

const termsAccepted = computed({
  get: () => store.termsAccepted,
  set: (val) => { store.termsAccepted = val }
})

const canComplete = computed(() => store.canCreateBooking)

function formatPrice(amount) {
  if (!amount) return ''
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: currency.value,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

function showTerms() {
  // TODO: Show terms modal
  console.log('Show terms')
}

async function completeBooking() {
  if (!canComplete.value || isLoading.value) return

  isLoading.value = true
  error.value = null

  try {
    // Prepare booking data
    const bookingData = {
      hotelCode: store.config.hotelCode,
      checkIn: store.search.checkIn,
      checkOut: store.search.checkOut,
      rooms: store.selectedRooms.filter(r => r).map((room, index) => ({
        roomTypeId: room.roomTypeId,
        mealPlanId: room.mealPlanId,
        adults: room.adults,
        children: room.children,
        guests: store.roomGuests[index] || [],
        pricing: room.pricing
      })),
      contact: {
        ...store.contact,
        countryCode: store.market.countryCode
      },
      specialRequests: store.specialRequests,
      payment: {
        method: store.payment.method
      },
      currency: store.currency,
      salesChannel: 'b2c'
    }

    const result = await api.createBooking(bookingData)

    if (result.bookingNumber) {
      store.setBookingResult(result)
      router.push({
        name: 'widget-confirmation',
        params: { bookingNumber: result.bookingNumber }
      })
    } else {
      throw new Error(t('widget.bookingFailed'))
    }
  } catch (err) {
    error.value = err.message || t('widget.bookingFailed')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.payment-view {
  max-width: 600px;
  margin: 0 auto;
}

.payment-view-header {
  margin-bottom: 1.5rem;
}

.payment-view-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

:deep(.dark) .payment-view-title {
  color: white;
}

.payment-view-subtitle {
  color: #6b7280;
  font-size: 0.9375rem;
}

/* Payment Summary */
.payment-summary {
  background: #f9fafb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

:deep(.dark) .payment-summary {
  background: #1f2937;
}

.payment-summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.9375rem;
  color: #374151;
}

:deep(.dark) .payment-summary-row {
  color: #d1d5db;
}

.payment-summary-row.discount {
  color: #10b981;
}

.payment-summary-total {
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
  font-weight: 600;
}

:deep(.dark) .payment-summary-total {
  border-top-color: #374151;
}

.total-amount {
  font-size: 1.5rem;
  color: var(--widget-primary, #7c3aed);
}

/* Payment Methods */
.payment-methods {
  margin-bottom: 1.5rem;
}

.payment-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

:deep(.dark) .payment-section-title {
  color: white;
}

.payment-method {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 200ms ease;
}

.payment-method:hover {
  border-color: #d1d5db;
}

.payment-method.is-selected {
  border-color: var(--widget-primary, #7c3aed);
  background: var(--widget-primary-50, #f5f3ff);
}

:deep(.dark) .payment-method {
  background: #1f2937;
  border-color: #374151;
}

:deep(.dark) .payment-method.is-selected {
  background: #4c1d95;
}

.payment-radio {
  display: none;
}

.payment-method-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.payment-method-icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 0.5rem;
  color: #6b7280;
}

.payment-method.is-selected .payment-method-icon {
  background: var(--widget-primary, #7c3aed);
  color: white;
}

:deep(.dark) .payment-method-icon {
  background: #374151;
}

.payment-method-info {
  display: flex;
  flex-direction: column;
}

.payment-method-name {
  font-weight: 600;
  color: #111827;
}

:deep(.dark) .payment-method-name {
  color: white;
}

.payment-method-desc {
  font-size: 0.8125rem;
  color: #6b7280;
}

/* Terms */
.terms-section {
  margin-bottom: 1.5rem;
}

.terms-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.125rem;
  accent-color: var(--widget-primary, #7c3aed);
}

.terms-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.terms-text a {
  color: var(--widget-primary, #7c3aed);
  text-decoration: underline;
}

/* Action */
.payment-action {
  text-align: center;
}

.complete-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: var(--widget-primary, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1.0625rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.complete-btn:hover:not(:disabled) {
  background: var(--widget-primary-600, #9333ea);
}

.complete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secure-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.secure-icon {
  color: #10b981;
}

/* Error */
.payment-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.875rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.9375rem;
}
</style>
