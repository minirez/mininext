<template>
  <div class="guests-view">
    <div class="guests-view-header">
      <h2 class="guests-view-title">{{ $t('widget.guestDetails') }}</h2>
      <p class="guests-view-subtitle">{{ $t('widget.guestDetailsDescription') }}</p>
    </div>

    <!-- Contact Information -->
    <div class="guest-section">
      <h3 class="guest-section-title">
        <WidgetIcon name="mail" :size="20" class="section-icon" />
        {{ $t('widget.contactInfo') }}
      </h3>

      <div class="guest-form-grid">
        <div class="form-group">
          <label class="form-label">{{ $t('widget.firstName') }} *</label>
          <input
            v-model="contact.firstName"
            type="text"
            class="form-input"
            :placeholder="$t('widget.firstNamePlaceholder')"
          />
        </div>

        <div class="form-group">
          <label class="form-label">{{ $t('widget.lastName') }} *</label>
          <input
            v-model="contact.lastName"
            type="text"
            class="form-input"
            :placeholder="$t('widget.lastNamePlaceholder')"
          />
        </div>

        <div class="form-group">
          <label class="form-label">{{ $t('widget.email') }} *</label>
          <input
            v-model="contact.email"
            type="email"
            class="form-input"
            :placeholder="$t('widget.emailPlaceholder')"
          />
        </div>

        <div class="form-group">
          <label class="form-label">{{ $t('widget.phone') }} *</label>
          <PhoneInput
            v-model="contact.phone"
            :country="market.countryCode || 'TR'"
          />
        </div>
      </div>
    </div>

    <!-- Room Guests -->
    <div
      v-for="(room, roomIndex) in selectedRooms"
      :key="roomIndex"
      class="guest-section"
    >
      <h3 class="guest-section-title">
        <WidgetIcon name="bed" :size="20" class="section-icon" />
        {{ $t('widget.room') }} {{ roomIndex + 1 }}: {{ getRoomName(room) }}
      </h3>

      <div class="room-guests">
        <div
          v-for="(guest, guestIndex) in roomGuests[roomIndex]"
          :key="guestIndex"
          class="guest-card"
        >
          <div class="guest-card-header">
            <span class="guest-type-badge" :class="guest.type">
              <WidgetIcon :name="guest.type === 'adult' ? 'user' : 'baby'" :size="14" />
              {{ guest.type === 'adult' ? $t('widget.adult') : $t('widget.child') }}
              {{ guest.age !== undefined ? `(${guest.age})` : '' }}
            </span>
            <span v-if="roomIndex === 0 && guestIndex === 0" class="lead-badge">
              {{ $t('widget.leadGuest') }}
            </span>
          </div>

          <div class="guest-form-grid">
            <div class="form-group form-group-sm">
              <label class="form-label">{{ $t('widget.title') }} *</label>
              <select
                v-model="guest.title"
                class="form-input"
              >
                <option value="">{{ $t('widget.selectTitle') }}</option>
                <option value="mr">{{ $t('widget.titleMr') }}</option>
                <option value="mrs">{{ $t('widget.titleMrs') }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">{{ $t('widget.firstName') }} *</label>
              <input
                v-model="guest.firstName"
                type="text"
                class="form-input"
                :placeholder="$t('widget.firstNamePlaceholder')"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ $t('widget.lastName') }} *</label>
              <input
                v-model="guest.lastName"
                type="text"
                class="form-input"
                :placeholder="$t('widget.lastNamePlaceholder')"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ $t('widget.nationality') }} *</label>
              <CountrySelect
                v-model="guest.nationality"
                :placeholder="$t('widget.selectNationality')"
              />
            </div>

            <div v-if="guest.type === 'child'" class="form-group">
              <label class="form-label">{{ $t('widget.birthDate') }} *</label>
              <input
                v-model="guest.birthDate"
                type="date"
                class="form-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Special Requests -->
    <div class="guest-section">
      <h3 class="guest-section-title">
        <WidgetIcon name="note" :size="20" class="section-icon" />
        {{ $t('widget.specialRequests') }}
      </h3>

      <textarea
        v-model="specialRequests"
        class="form-textarea"
        rows="3"
        :placeholder="$t('widget.specialRequestsPlaceholder')"
      />
    </div>

    <!-- Continue Button (Desktop) -->
    <div class="guests-action lg-visible">
      <button
        class="continue-btn"
        :disabled="!canProceed"
        @click="goToPayment"
      >
        {{ $t('widget.continueToPayment') }}
        <WidgetIcon name="arrow-right" :size="20" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import CountrySelect from '@/components/common/CountrySelect.vue'
import WidgetIcon from '../components/WidgetIcon.vue'

const store = inject('widgetStore')
const router = useRouter()
const { locale } = useI18n()

// Reactive references to store state
const contact = computed({
  get: () => store.contact,
  set: (val) => store.updateContact(val)
})

const roomGuests = computed(() => store.roomGuests)
const selectedRooms = computed(() => store.selectedRooms.filter(r => r))
const market = computed(() => store.market)
const canProceed = computed(() => store.canProceedToPayment)

const specialRequests = computed({
  get: () => store.specialRequests,
  set: (val) => { store.specialRequests = val }
})

function getRoomName(room) {
  const name = room?.roomType?.name
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
}

function goToPayment() {
  if (canProceed.value) {
    router.push({ name: 'widget-payment' })
  }
}

// Sync guest data changes back to store
watch(roomGuests, (newVal) => {
  // Data is reactive, no need to manually sync
}, { deep: true })
</script>

<style scoped>
.guests-view {
  max-width: 700px;
  margin: 0 auto;
}

.guests-view-header {
  margin-bottom: 1.5rem;
}

.guests-view-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

:deep(.dark) .guests-view-title {
  color: white;
}

.guests-view-subtitle {
  color: #6b7280;
  font-size: 0.9375rem;
}

/* Section */
.guest-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

:deep(.dark) .guest-section {
  background: #1f2937;
  border-color: #374151;
}

.guest-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

:deep(.dark) .guest-section-title {
  color: white;
}

.section-icon {
  color: var(--widget-primary, #7c3aed);
}

/* Form Grid */
.guest-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .guest-form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group-sm {
  max-width: 120px;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.375rem;
}

.form-input {
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  background: white;
  color: #111827;
  transition: border-color 150ms ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--widget-primary, #7c3aed);
  box-shadow: 0 0 0 3px var(--widget-primary-100, #f3e8ff);
}

:deep(.dark) .form-input {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.form-textarea {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  background: white;
  color: #111827;
  resize: vertical;
  min-height: 80px;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--widget-primary, #7c3aed);
}

:deep(.dark) .form-textarea {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

/* Guest Card */
.room-guests {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.guest-card {
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
}

:deep(.dark) .guest-card {
  background: #374151;
  border-color: #4b5563;
}

.guest-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.guest-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  background: #e5e7eb;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.guest-type-badge.adult {
  background: #dbeafe;
  color: #1e40af;
}

.guest-type-badge.child {
  background: #fef3c7;
  color: #92400e;
}

.lead-badge {
  padding: 0.25rem 0.5rem;
  background: var(--widget-primary-100, #f3e8ff);
  color: var(--widget-primary, #7c3aed);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Action */
.guests-action {
  margin-top: 1.5rem;
  display: none;
}

@media (min-width: 1024px) {
  .guests-action.lg-visible {
    display: block;
  }
}

.continue-btn {
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

.continue-btn:hover:not(:disabled) {
  background: var(--widget-primary-600, #9333ea);
}

.continue-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
