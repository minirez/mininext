<script setup>
import { computed } from 'vue'
import { useWidgetStore } from '../stores/widget'
import { useFormatters } from '../composables/useFormatters'
import { useTranslation } from '../composables/useTranslation'

const widgetStore = useWidgetStore()
const { formatCurrency, formatDateLong } = useFormatters()
const { t } = useTranslation()

const booking = computed(() => widgetStore.booking)
const hotelInfo = computed(() => widgetStore.hotelInfo)
const selectedRoom = computed(() => widgetStore.selectedRoom)
const selectedOption = computed(() => widgetStore.selectedOption)
const searchParams = computed(() => widgetStore.searchParams)
const paymentMethod = computed(() => widgetStore.paymentMethod)
const nights = computed(() => widgetStore.nights)

const isPaid = computed(() => booking.value?.payment?.status === 'paid')
const contactEmail = computed(() => booking.value?.contact?.email || widgetStore.bookingData.contact?.email)

// Resolve multilang name objects
function resolveName(name) {
  if (!name) return ''
  if (typeof name === 'string') return name
  if (typeof name === 'object') {
    const lang = widgetStore.config.language || 'tr'
    return name[lang] || name.tr || name.en || Object.values(name).find(v => v) || ''
  }
  return String(name)
}

const roomName = computed(() => resolveName(selectedRoom.value?.roomType?.name) || resolveName(booking.value?.roomType?.name))
const mealPlanName = computed(() => resolveName(selectedOption.value?.mealPlan?.name))

function newBooking() {
  widgetStore.reset()
  widgetStore.openWidget()
}

function closeWidget() {
  widgetStore.closeWidget()
}
</script>

<template>
  <div class="confirmation-view">
    <!-- Success Animation -->
    <div class="success-container">
      <div class="success-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <h2 class="success-title">{{ t('confirmation.title') }}</h2>

      <p class="success-subtitle">
        <template v-if="isPaid">
          {{ t('confirmation.messages.paid') }}
        </template>
        <template v-else-if="paymentMethod === 'pay_at_hotel'">
          {{ t('confirmation.messages.payAtHotel') }}
        </template>
        <template v-else>
          {{ t('confirmation.messages.default') }}
        </template>
      </p>

      <!-- Booking Reference -->
      <div class="booking-ref">
        <span class="booking-ref-label">{{ t('confirmation.bookingNumber') }}</span>
        <span class="booking-ref-value">{{ booking?.bookingNumber }}</span>
      </div>
    </div>

    <!-- Booking Details Card -->
    <div class="details-card">
      <!-- Hotel Info -->
      <div class="details-header">
        <div class="details-hotel">
          <img
            v-if="hotelInfo?.logo?.url || hotelInfo?.images?.[0]?.url"
            :src="hotelInfo.logo?.url || hotelInfo.images[0].url"
            :alt="hotelInfo?.name"
            class="details-hotel-logo"
          />
          <div class="details-hotel-info">
            <span class="details-hotel-name">{{ hotelInfo?.name || booking?.hotel?.name }}</span>
            <span class="details-room-name">{{ roomName }}</span>
          </div>
        </div>
      </div>

      <!-- Date & Guest Info -->
      <div class="details-dates">
        <div class="details-date">
          <span class="details-date-label">{{ t('common.checkIn') }}</span>
          <span class="details-date-value">{{ formatDateLong(searchParams.checkIn || booking?.checkIn) }}</span>
        </div>
        <div class="details-date-divider">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
        <div class="details-date">
          <span class="details-date-label">{{ t('common.checkOut') }}</span>
          <span class="details-date-value">{{ formatDateLong(searchParams.checkOut || booking?.checkOut) }}</span>
        </div>
      </div>

      <div class="details-row">
        <div class="details-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
          <span>
            {{ searchParams.adults || booking?.guests?.adults }} {{ t('common.adults') }}
            <template v-if="(searchParams.children?.length || booking?.guests?.children) > 0">
              , {{ searchParams.children?.length || booking?.guests?.children }} {{ t('common.children') }}
            </template>
          </span>
        </div>
        <div class="details-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>{{ nights || booking?.nights }} {{ t('common.night') }}</span>
        </div>
      </div>

      <!-- Meal Plan -->
      <div v-if="mealPlanName" class="details-meal">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          <line x1="6" y1="1" x2="6" y2="4"></line>
          <line x1="10" y1="1" x2="10" y2="4"></line>
          <line x1="14" y1="1" x2="14" y2="4"></line>
        </svg>
        <span>{{ mealPlanName }}</span>
      </div>

      <!-- Price & Status -->
      <div class="details-footer">
        <div class="details-price">
          <span class="details-price-label">{{ t('common.total') }}</span>
          <span class="details-price-value">{{ formatCurrency(booking?.pricing?.grandTotal || selectedOption?.pricing?.finalTotal || 0) }}</span>
        </div>
        <div class="details-status" :class="isPaid ? 'paid' : 'pending'">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <template v-if="isPaid">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </template>
            <template v-else>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </template>
          </svg>
          <span>{{ isPaid ? t('confirmation.status.paid') : t('confirmation.status.pending') }}</span>
        </div>
      </div>
    </div>

    <!-- Email Note -->
    <div class="email-note">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
      </svg>
      <div class="email-note-text">
        <span>{{ t('confirmation.emailSent') }}</span>
        <strong>{{ contactEmail }}</strong>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <button class="btn btn-primary btn-block" @click="newBooking">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        {{ t('confirmation.newBooking') }}
      </button>
      <button v-if="widgetStore.config.mode === 'floating'" class="btn btn-secondary btn-block" @click="closeWidget">
        {{ t('common.close') }}
      </button>
    </div>
  </div>
</template>

<!-- All styles in widget.css for Shadow DOM compatibility -->
