<template>
  <div class="widget-sidebar-content">
    <div class="widget-sidebar-sticky">
      <!-- Hotel Info -->
      <div class="sidebar-hotel">
        <h3 class="sidebar-hotel-name">{{ hotelName }}</h3>
        <div v-if="hotel?.stars" class="sidebar-stars">
          <WidgetIcon
            v-for="i in hotel.stars"
            :key="i"
            name="star-filled"
            :size="14"
            class="star-icon"
          />
        </div>
      </div>

      <!-- Booking Summary -->
      <div class="sidebar-section">
        <h4 class="sidebar-section-title">{{ $t('widget.bookingSummary') }}</h4>

        <div class="sidebar-summary-grid">
          <!-- Dates -->
          <div class="summary-item">
            <div class="summary-icon">
              <WidgetIcon name="calendar" :size="16" />
            </div>
            <div class="summary-content">
              <span class="summary-label">{{ $t('widget.dates') }}</span>
              <span class="summary-value">{{ formatDateRange }}</span>
            </div>
          </div>

          <!-- Nights -->
          <div class="summary-item">
            <div class="summary-icon">
              <WidgetIcon name="moon" :size="16" />
            </div>
            <div class="summary-content">
              <span class="summary-label">{{ $t('widget.nights') }}</span>
              <span class="summary-value">{{ nights }}</span>
            </div>
          </div>

          <!-- Guests -->
          <div class="summary-item">
            <div class="summary-icon">
              <WidgetIcon name="users" :size="16" />
            </div>
            <div class="summary-content">
              <span class="summary-label">{{ $t('widget.guests') }}</span>
              <span class="summary-value">
                {{ totalAdults }} {{ $t('widget.adults') }}
                <template v-if="totalChildren > 0">
                  , {{ totalChildren }} {{ $t('widget.children') }}
                </template>
              </span>
            </div>
          </div>

          <!-- Rooms Count -->
          <div class="summary-item">
            <div class="summary-icon">
              <WidgetIcon name="bed" :size="16" />
            </div>
            <div class="summary-content">
              <span class="summary-label">{{ $t('widget.rooms') }}</span>
              <span class="summary-value">{{ totalRooms }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Rooms -->
      <div v-if="selectedRoomsFiltered.length > 0" class="sidebar-section">
        <h4 class="sidebar-section-title">{{ $t('widget.selectedRooms') }}</h4>

        <div class="selected-rooms-list">
          <div
            v-for="(room, index) in selectedRoomsFiltered"
            :key="index"
            class="selected-room-card"
          >
            <!-- Room Header -->
            <div class="selected-room-header">
              <span class="selected-room-number">{{ $t('widget.room') }} {{ room.originalIndex + 1 }}</span>
              <button
                class="selected-room-remove"
                :title="$t('widget.removeRoom')"
                @click="removeRoom(room.originalIndex)"
              >
                <WidgetIcon name="x" :size="14" />
              </button>
            </div>

            <!-- Room Details -->
            <div class="selected-room-body">
              <div class="selected-room-type">
                <WidgetIcon name="bed" :size="14" class="room-type-icon" />
                <span>{{ getRoomTypeName(room) }}</span>
              </div>
              <div class="selected-room-meal">
                <WidgetIcon name="utensils" :size="14" class="meal-icon" />
                <span>{{ getMealPlanName(room) }}</span>
              </div>
            </div>

            <!-- Room Price -->
            <div class="selected-room-footer">
              <div class="selected-room-guests">
                {{ room.adults }} {{ $t('widget.adults') }}
                <template v-if="room.children?.length">
                  , {{ room.children.length }} {{ $t('widget.children') }}
                </template>
              </div>
              <div class="selected-room-price">
                {{ formatPrice(room.pricing?.finalTotal) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Applied Campaigns -->
      <div v-if="appliedCampaigns.length > 0" class="sidebar-section sidebar-campaigns">
        <h4 class="sidebar-section-title">{{ $t('widget.appliedDiscounts') }}</h4>
        <div class="campaigns-list">
          <div
            v-for="campaign in appliedCampaigns"
            :key="campaign.code"
            class="campaign-item"
          >
            <WidgetIcon name="percent" :size="14" class="campaign-icon" />
            <span>{{ campaign.name || campaign.code }}</span>
          </div>
        </div>
      </div>

      <!-- Price Summary -->
      <div v-if="selectedRoomsFiltered.length > 0" class="sidebar-pricing">
        <!-- Subtotal (if discount) -->
        <div v-if="totalDiscount > 0" class="pricing-row">
          <span class="pricing-label">{{ $t('widget.subtotal') }}</span>
          <span class="pricing-value pricing-strikethrough">{{ formatPrice(subtotal) }}</span>
        </div>

        <!-- Discount -->
        <div v-if="totalDiscount > 0" class="pricing-row pricing-discount">
          <span class="pricing-label">{{ $t('widget.discount') }}</span>
          <span class="pricing-value">-{{ formatPrice(totalDiscount) }}</span>
        </div>

        <!-- Total -->
        <div class="pricing-total">
          <span class="pricing-total-label">{{ $t('widget.total') }}</span>
          <div class="pricing-total-amount-wrapper">
            <span class="pricing-total-amount">{{ formatPrice(grandTotal) }}</span>
            <span class="pricing-per-night">~{{ formatPrice(avgPerNight) }} / {{ $t('widget.perNight') }}</span>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <button
        v-if="showCta"
        class="sidebar-cta"
        :disabled="!canProceed"
        @click="handleCta"
      >
        <span>{{ ctaText }}</span>
        <WidgetIcon name="arrow-right" :size="18" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import WidgetIcon from './WidgetIcon.vue'

const store = inject('widgetStore')
const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()

// Hotel
const hotel = computed(() => store.hotel)
const hotelName = computed(() => {
  const name = hotel.value?.name
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
})

// Booking data
const nights = computed(() => store.nights)
const totalAdults = computed(() => store.totalAdults)
const totalChildren = computed(() => store.totalChildren)
const totalRooms = computed(() => store.totalRooms)
const selectedRoomsFiltered = computed(() => {
  return store.selectedRooms
    .map((room, index) => room ? { ...room, originalIndex: index } : null)
    .filter(r => r)
})
const appliedCampaigns = computed(() => store.appliedCampaigns)
const subtotal = computed(() => store.subtotal)
const totalDiscount = computed(() => store.totalDiscount)
const grandTotal = computed(() => store.grandTotal)
const avgPerNight = computed(() => store.avgPerNight)
const currency = computed(() => store.currency)

// Format date range
const formatDateRange = computed(() => {
  if (!store.search.checkIn || !store.search.checkOut) return '-'
  const options = { day: 'numeric', month: 'short' }
  const checkIn = new Date(store.search.checkIn).toLocaleDateString(locale.value, options)
  const checkOut = new Date(store.search.checkOut).toLocaleDateString(locale.value, options)
  return `${checkIn} - ${checkOut}`
})

// Get room type name
function getRoomTypeName(room) {
  const name = room.roomType?.name
  if (!name) return room.roomType?.code || '-'
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || room.roomType?.code || '-'
  }
  return name
}

// Get meal plan name
function getMealPlanName(room) {
  const name = room.mealPlan?.name
  if (!name) return room.mealPlan?.code || '-'
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || room.mealPlan?.code || '-'
  }
  return name
}

// Format price
function formatPrice(amount) {
  if (!amount && amount !== 0) return ''
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: currency.value,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Remove selected room
function removeRoom(index) {
  store.unselectRoom(index)
}

// CTA Logic
const currentStep = computed(() => route.meta?.step || 1)

const showCta = computed(() => currentStep.value >= 2 && currentStep.value < 5)

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 2: return store.canProceedToGuests
    case 3: return store.canProceedToPayment
    case 4: return store.canCreateBooking
    default: return false
  }
})

const ctaText = computed(() => {
  switch (currentStep.value) {
    case 2: return t('widget.continueToGuests')
    case 3: return t('widget.continueToPayment')
    case 4: return t('widget.completeBooking')
    default: return t('widget.continue')
  }
})

function handleCta() {
  switch (currentStep.value) {
    case 2:
      router.push({ name: 'widget-guests' })
      break
    case 3:
      router.push({ name: 'widget-payment' })
      break
    case 4:
      // Will be handled by PaymentView
      break
  }
}
</script>

<style scoped>
.widget-sidebar-content {
  padding: 1.25rem;
}

.widget-sidebar-sticky {
  position: sticky;
  top: 1rem;
}

/* Hotel Info */
.sidebar-hotel {
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.dark .sidebar-hotel {
  border-bottom-color: #374151;
}

.sidebar-hotel-name {
  font-size: 1.0625rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
  line-height: 1.3;
}

.dark .sidebar-hotel-name {
  color: white;
}

.sidebar-stars {
  display: flex;
  gap: 0.125rem;
}

.star-icon {
  color: #fbbf24;
}

/* Section */
.sidebar-section {
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.dark .sidebar-section {
  border-bottom-color: #374151;
}

.sidebar-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.sidebar-section-title {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

/* Summary Grid */
.sidebar-summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;
}

.summary-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.summary-icon {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 0.375rem;
  color: #6b7280;
  flex-shrink: 0;
}

.dark .summary-icon {
  background: #374151;
  color: #9ca3af;
}

.summary-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.summary-label {
  font-size: 0.6875rem;
  color: #9ca3af;
}

.summary-value {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #111827;
}

.dark .summary-value {
  color: #f3f4f6;
}

/* Selected Rooms */
.selected-rooms-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.selected-room-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.625rem;
  overflow: hidden;
}

.dark .selected-room-card {
  background: #1f2937;
  border-color: #374151;
}

.selected-room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.dark .selected-room-header {
  background: #374151;
  border-bottom-color: #4b5563;
}

.selected-room-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
}

.selected-room-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 150ms ease;
}

.selected-room-remove:hover {
  background: #fee2e2;
  color: #ef4444;
}

.selected-room-body {
  padding: 0.625rem 0.75rem;
}

.selected-room-type,
.selected-room-meal {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #374151;
}

.dark .selected-room-type,
.dark .selected-room-meal {
  color: #e5e7eb;
}

.selected-room-type {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.selected-room-meal {
  font-size: 0.75rem;
  color: #6b7280;
}

.room-type-icon {
  color: var(--widget-primary, #7c3aed);
}

.meal-icon {
  color: #9ca3af;
}

.selected-room-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-top: 1px dashed #e5e7eb;
}

.dark .selected-room-footer {
  border-top-color: #374151;
}

.selected-room-guests {
  font-size: 0.6875rem;
  color: #9ca3af;
}

.selected-room-price {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--widget-primary, #7c3aed);
}

/* Campaigns */
.sidebar-campaigns {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.campaigns-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.campaign-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #059669;
}

.campaign-icon {
  color: #10b981;
}

/* Pricing */
.sidebar-pricing {
  background: #f9fafb;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-top: 1rem;
}

.dark .sidebar-pricing {
  background: #1f2937;
}

.pricing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
  margin-bottom: 0.375rem;
}

.pricing-label {
  color: #6b7280;
}

.pricing-value {
  font-weight: 500;
  color: #374151;
}

.dark .pricing-value {
  color: #e5e7eb;
}

.pricing-strikethrough {
  text-decoration: line-through;
  color: #9ca3af;
}

.pricing-discount {
  color: #059669;
}

.pricing-discount .pricing-label,
.pricing-discount .pricing-value {
  color: #059669;
}

.pricing-total {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.dark .pricing-total {
  border-top-color: #374151;
}

.pricing-total-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.dark .pricing-total-label {
  color: white;
}

.pricing-total-amount-wrapper {
  text-align: right;
}

.pricing-total-amount {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--widget-primary, #7c3aed);
}

.pricing-per-night {
  font-size: 0.6875rem;
  color: #6b7280;
}

/* CTA Button */
.sidebar-cta {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  background: var(--widget-primary, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
  margin-top: 1rem;
}

.sidebar-cta:hover:not(:disabled) {
  background: var(--widget-primary-600, #6d28d9);
}

.sidebar-cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
