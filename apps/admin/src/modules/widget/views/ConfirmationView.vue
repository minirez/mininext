<template>
  <div class="confirmation-view">
    <!-- Success Icon -->
    <div class="confirmation-icon">
      <WidgetIcon name="check-circle" :size="80" />
    </div>

    <h2 class="confirmation-title">{{ $t('widget.bookingConfirmed') }}</h2>
    <p class="confirmation-subtitle">{{ $t('widget.bookingConfirmedDesc') }}</p>

    <!-- Booking Number -->
    <div class="booking-number-card">
      <span class="booking-number-label">{{ $t('widget.bookingNumber') }}</span>
      <span class="booking-number">{{ bookingNumber }}</span>
    </div>

    <!-- Email Sent Notice -->
    <div class="email-notice">
      <WidgetIcon name="mail" :size="20" />
      <span>{{ $t('widget.confirmationEmailSent', { email: contact.email }) }}</span>
    </div>

    <!-- Booking Details -->
    <div class="confirmation-details">
      <h3 class="details-title">{{ $t('widget.bookingDetails') }}</h3>

      <div class="details-grid">
        <div class="detail-item">
          <WidgetIcon name="hotel" :size="20" class="detail-icon" />
          <div class="detail-content">
            <span class="detail-label">{{ $t('widget.hotel') }}</span>
            <span class="detail-value">{{ hotelName }}</span>
          </div>
        </div>

        <div class="detail-item">
          <WidgetIcon name="calendar" :size="20" class="detail-icon" />
          <div class="detail-content">
            <span class="detail-label">{{ $t('widget.dates') }}</span>
            <span class="detail-value">{{ formatDateRange }}</span>
          </div>
        </div>

        <div class="detail-item">
          <WidgetIcon name="moon" :size="20" class="detail-icon" />
          <div class="detail-content">
            <span class="detail-label">{{ $t('widget.nights') }}</span>
            <span class="detail-value">{{ nights }}</span>
          </div>
        </div>

        <div class="detail-item">
          <WidgetIcon name="users" :size="20" class="detail-icon" />
          <div class="detail-content">
            <span class="detail-label">{{ $t('widget.guests') }}</span>
            <span class="detail-value">
              {{ totalAdults }} {{ $t('widget.adults') }}
              <template v-if="totalChildren > 0">
                , {{ totalChildren }} {{ $t('widget.children') }}
              </template>
            </span>
          </div>
        </div>

        <div class="detail-item">
          <WidgetIcon name="bed" :size="20" class="detail-icon" />
          <div class="detail-content">
            <span class="detail-label">{{ $t('widget.rooms') }}</span>
            <span class="detail-value">{{ roomsSummary }}</span>
          </div>
        </div>

        <div class="detail-item">
          <WidgetIcon name="credit-card" :size="20" class="detail-icon" />
          <div class="detail-content">
            <span class="detail-label">{{ $t('widget.totalPaid') }}</span>
            <span class="detail-value total">{{ formatPrice(grandTotal) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="confirmation-actions">
      <button class="action-btn" @click="downloadPdf">
        <WidgetIcon name="arrow-down" :size="18" />
        {{ $t('widget.downloadPdf') }}
      </button>

      <button class="action-btn" @click="addToCalendar">
        <WidgetIcon name="calendar" :size="18" />
        {{ $t('widget.addToCalendar') }}
      </button>

      <button class="action-btn" @click="getDirections">
        <WidgetIcon name="map-pin" :size="18" />
        {{ $t('widget.getDirections') }}
      </button>
    </div>

    <!-- WhatsApp Contact -->
    <div v-if="hotel?.contact?.whatsapp" class="whatsapp-contact">
      <a
        :href="`https://wa.me/${hotel.contact.whatsapp}`"
        target="_blank"
        class="whatsapp-btn"
      >
        <WidgetIcon name="message" :size="20" />
        {{ $t('widget.contactWhatsapp') }}
      </a>
    </div>

    <!-- New Booking -->
    <button class="new-booking-btn" @click="startNewBooking">
      {{ $t('widget.makeNewBooking') }}
    </button>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import WidgetIcon from '../components/WidgetIcon.vue'

const store = inject('widgetStore')
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

// Booking data
const bookingNumber = computed(() => route.params.bookingNumber || store.bookingResult?.bookingNumber)
const contact = computed(() => store.contact)
const hotel = computed(() => store.hotel)
const nights = computed(() => store.nights)
const totalAdults = computed(() => store.totalAdults)
const totalChildren = computed(() => store.totalChildren)
const grandTotal = computed(() => store.grandTotal)
const currency = computed(() => store.currency)
const selectedRooms = computed(() => store.selectedRooms.filter(r => r))

const hotelName = computed(() => {
  const name = hotel.value?.name
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
})

const formatDateRange = computed(() => {
  if (!store.search.checkIn || !store.search.checkOut) return '-'
  const options = { day: 'numeric', month: 'long', year: 'numeric' }
  const checkIn = new Date(store.search.checkIn).toLocaleDateString(locale.value, options)
  const checkOut = new Date(store.search.checkOut).toLocaleDateString(locale.value, options)
  return `${checkIn} - ${checkOut}`
})

const roomsSummary = computed(() => {
  return selectedRooms.value.map(room => {
    const name = room.roomType?.name
    if (typeof name === 'object') {
      return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
    }
    return name || ''
  }).join(', ')
})

function formatPrice(amount) {
  if (!amount) return ''
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: currency.value,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

function downloadPdf() {
  // TODO: Download booking PDF
  console.log('Download PDF')
}

function addToCalendar() {
  const checkIn = new Date(store.search.checkIn)
  const checkOut = new Date(store.search.checkOut)

  const event = {
    title: `${hotelName.value} - ${t('widget.booking')}`,
    start: checkIn.toISOString().replace(/-|:|\.\d\d\d/g, ''),
    end: checkOut.toISOString().replace(/-|:|\.\d\d\d/g, ''),
    details: `${t('widget.bookingNumber')}: ${bookingNumber.value}`
  }

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&details=${encodeURIComponent(event.details)}`
  window.open(url, '_blank')
}

function getDirections() {
  const address = hotel.value?.address
  if (address?.coordinates) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${address.coordinates.lat},${address.coordinates.lng}`
    window.open(url, '_blank')
  } else if (address) {
    const addressStr = [address.street, address.city, address.country].filter(Boolean).join(', ')
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`
    window.open(url, '_blank')
  }
}

function startNewBooking() {
  store.resetAll()
  router.push({ name: 'widget-search' })
}
</script>

<style scoped>
.confirmation-view {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.confirmation-icon {
  margin-bottom: 1rem;
  color: #10b981;
}

.confirmation-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

:deep(.dark) .confirmation-title {
  color: white;
}

.confirmation-subtitle {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

/* Booking Number */
.booking-number-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  background: var(--widget-primary-50, #f5f3ff);
  border: 2px solid var(--widget-primary, #7c3aed);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
}

.booking-number-label {
  font-size: 0.8125rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.booking-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--widget-primary, #7c3aed);
  letter-spacing: 0.05em;
}

/* Email Notice */
.email-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #d1fae5;
  border-radius: 0.5rem;
  color: #065f46;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

/* Details */
.confirmation-details {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

:deep(.dark) .confirmation-details {
  background: #1f2937;
  border-color: #374151;
}

.details-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

:deep(.dark) .details-title {
  color: white;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 480px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.detail-icon {
  color: var(--widget-primary, #7c3aed);
  flex-shrink: 0;
}

.detail-content {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.detail-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #111827;
}

:deep(.dark) .detail-value {
  color: white;
}

.detail-value.total {
  font-weight: 700;
  color: var(--widget-primary, #7c3aed);
}

/* Actions */
.confirmation-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.action-btn:hover {
  background: #e5e7eb;
}

:deep(.dark) .action-btn {
  background: #374151;
  color: #d1d5db;
}

/* WhatsApp */
.whatsapp-contact {
  margin-bottom: 1.5rem;
}

.whatsapp-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #25d366;
  color: white;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  transition: all 150ms ease;
}

.whatsapp-btn:hover {
  background: #128c7e;
}

/* New Booking */
.new-booking-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 2px solid var(--widget-primary, #7c3aed);
  color: var(--widget-primary, #7c3aed);
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
}

.new-booking-btn:hover {
  background: var(--widget-primary-50, #f5f3ff);
}
</style>
