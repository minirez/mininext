<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useWidgetStore } from '../stores/widget'
import { useFormatters } from '../composables/useFormatters'
import { useTranslation } from '../composables/useTranslation'
import ViewHeader from '../components/ViewHeader.vue'
import PhoneInput from '../components/PhoneInput.vue'
import { countries } from '../data/countries'

const widgetStore = useWidgetStore()
const { formatCurrency, formatDateMedium } = useFormatters()
const { t } = useTranslation()

const selectedRoom = computed(() => widgetStore.selectedRoom)
const selectedOption = computed(() => widgetStore.selectedOption)
const nights = computed(() => widgetStore.nights)
const searchParams = computed(() => widgetStore.searchParams)
const isLoading = computed(() => widgetStore.isLoading)
const errorMessage = computed(() => widgetStore.error)
const widgetConfig = computed(() => widgetStore.widgetConfig)
const paymentMethods = computed(() => widgetConfig.value?.paymentMethods || {})
const paymentTerms = computed(() => widgetStore.paymentTerms)
const bankTransferDiscount = computed(() => widgetStore.bankTransferDiscount)

// Ön ödeme hesaplamaları
const totalAmount = computed(() => selectedOption.value?.pricing?.finalTotal || 0)

const prepaymentAmount = computed(() => {
  if (!paymentTerms.value?.prepaymentRequired) return 0
  return Math.round((totalAmount.value * (paymentTerms.value.prepaymentPercentage || 30)) / 100)
})

const remainingAmount = computed(() => {
  if (!paymentTerms.value?.prepaymentRequired) return totalAmount.value
  return totalAmount.value - prepaymentAmount.value
})

const remainingPaymentText = computed(() => {
  if (!paymentTerms.value?.remainingPayment) return ''
  const rp = paymentTerms.value.remainingPayment
  if (rp.type === 'at_checkin') return t('booking.payment.remainingAtCheckin')
  if (rp.type === 'days_before_checkin')
    return t('booking.payment.remainingBeforeCheckin', { days: rp.days })
  if (rp.type === 'days_after_booking')
    return t('booking.payment.remainingAfterBooking', { days: rp.days })
  return ''
})

// Havale indirimi hesaplamaları
const bankTransferDiscountedTotal = computed(() => {
  if (!bankTransferDiscount.value || bankTransferDiscount.value <= 0) return totalAmount.value
  return Math.round(totalAmount.value * (1 - bankTransferDiscount.value / 100))
})

// Resolve multilang name objects
function resolveName(name) {
  if (!name) return ''
  if (typeof name === 'string') return name
  if (typeof name === 'object') {
    const lang = widgetStore.config.language || 'en'
    return name[lang] || name.en || name.tr || Object.values(name).find(v => v) || ''
  }
  return String(name)
}

const roomName = computed(() => resolveName(selectedRoom.value?.roomType?.name))
const mealPlanName = computed(() => resolveName(selectedOption.value?.mealPlan?.name))

// Form data
const contact = ref({ ...widgetStore.bookingData.contact })
const specialRequests = ref(widgetStore.bookingData.specialRequests || '')
const selectedPaymentMethod = ref(widgetStore.paymentMethod)

// Guest data
const roomGuests = ref([])

function initGuests() {
  const guests = []
  const adults = searchParams.value.adults || 1
  const children = searchParams.value.children || []

  for (let i = 0; i < adults; i++) {
    guests.push({
      type: 'adult',
      title: '',
      firstName: i === 0 ? contact.value.firstName || '' : '',
      lastName: i === 0 ? contact.value.lastName || '' : '',
      nationality: '',
      isLead: i === 0
    })
  }

  for (const childAge of children) {
    guests.push({
      type: 'child',
      title: '',
      firstName: '',
      lastName: '',
      nationality: '',
      birthDate: '',
      age: childAge
    })
  }

  roomGuests.value = guests
}

// Sync lead guest with contact info
watch(
  () => [contact.value.firstName, contact.value.lastName],
  ([firstName, lastName]) => {
    if (roomGuests.value.length > 0 && roomGuests.value[0].isLead) {
      roomGuests.value[0].firstName = firstName || ''
      roomGuests.value[0].lastName = lastName || ''
    }
  }
)

// Form validation
const errors = ref({})

function validateForm() {
  errors.value = {}

  if (!contact.value.firstName?.trim()) {
    errors.value.firstName = t('booking.errors.firstNameRequired')
  }
  if (!contact.value.lastName?.trim()) {
    errors.value.lastName = t('booking.errors.lastNameRequired')
  }
  if (!contact.value.email?.trim() || !contact.value.email.includes('@')) {
    errors.value.email = t('booking.errors.emailInvalid')
  }
  if (widgetConfig.value?.guestOptions?.requirePhone !== false) {
    if (!contact.value.phone?.trim()) {
      errors.value.phone = t('booking.errors.phoneRequired')
    } else if (contact.value.phone.replace(/\D/g, '').length < 10) {
      errors.value.phone = t('booking.errors.phoneInvalid')
    }
  }

  // Validate guests
  const requireNationality = widgetConfig.value?.guestOptions?.requireNationality
  const requireBirthDate = widgetConfig.value?.guestOptions?.requireBirthDate

  roomGuests.value.forEach((guest, index) => {
    if (!guest.firstName?.trim()) {
      errors.value[`guest_${index}_firstName`] = t('booking.errors.firstNameRequired')
    }
    if (!guest.lastName?.trim()) {
      errors.value[`guest_${index}_lastName`] = t('booking.errors.lastNameRequired')
    }
    if (requireNationality && !guest.nationality?.trim()) {
      errors.value[`guest_${index}_nationality`] = t('booking.errors.nationalityRequired')
    }
    if (requireBirthDate && guest.type === 'child' && !guest.birthDate) {
      errors.value[`guest_${index}_birthDate`] = t('booking.errors.birthDateRequired')
    }
  })

  return Object.keys(errors.value).length === 0
}

async function submit() {
  if (!validateForm()) return

  // Update store
  widgetStore.bookingData.contact = { ...contact.value }
  widgetStore.bookingData.specialRequests = specialRequests.value
  widgetStore.paymentMethod = selectedPaymentMethod.value

  // Set guests data
  widgetStore.bookingData.rooms[0].guests = roomGuests.value.map(g => ({
    type: g.type,
    title: g.title || (g.type === 'adult' ? 'mr' : undefined),
    firstName: g.firstName,
    lastName: g.lastName,
    age: g.age,
    isLead: g.isLead || false,
    ...(g.nationality ? { nationality: g.nationality } : {}),
    ...(g.birthDate ? { birthDate: g.birthDate } : {})
  }))

  // Create booking
  await widgetStore.createBooking()
}

onMounted(() => {
  // Pre-fill contact if available
  if (widgetStore.bookingData.contact?.email) {
    contact.value = { ...widgetStore.bookingData.contact }
  }

  // Set default payment method
  if (paymentMethods.value.creditCard) {
    selectedPaymentMethod.value = 'credit_card'
  } else if (paymentMethods.value.payAtHotel) {
    selectedPaymentMethod.value = 'pay_at_checkin'
  }

  // Initialize guest list from search params
  initGuests()
})
</script>

<template>
  <div class="booking-view">
    <ViewHeader :title="t('booking.title')" />

    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-error">
      <svg
        class="alert-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Booking Summary Card -->
    <div class="summary-card">
      <div class="summary-card-header">
        <div>
          <div class="summary-card-title">{{ roomName }}</div>
          <div class="summary-card-subtitle">{{ mealPlanName }}</div>
        </div>
      </div>
      <div class="summary-card-dates">
        <div class="summary-date">
          <div class="summary-date-label">{{ t('common.checkIn') }}</div>
          <div class="summary-date-value">{{ formatDateMedium(searchParams.checkIn) }}</div>
        </div>
        <div class="summary-date-divider">→</div>
        <div class="summary-date">
          <div class="summary-date-label">{{ t('common.checkOut') }}</div>
          <div class="summary-date-value">{{ formatDateMedium(searchParams.checkOut) }}</div>
        </div>
      </div>
      <div class="summary-card-footer">
        <div>
          <div class="summary-guests">
            {{ searchParams.adults }} {{ t('common.adults')
            }}{{
              searchParams.children.length > 0
                ? `, ${searchParams.children.length} ${t('common.children')}`
                : ''
            }}
          </div>
          <div class="summary-nights">{{ nights }} {{ t('common.night') }}</div>
        </div>
        <div class="summary-card-total">
          <div class="summary-card-total-label">{{ t('common.total') }}</div>
          <div class="summary-card-total-value">
            {{ formatCurrency(selectedOption?.pricing?.finalTotal || 0) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Form -->
    <form @submit.prevent="submit" class="booking-form">
      <div class="form-section">
        <h3 class="form-section-title">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          {{ t('booking.contactInfo') }}
        </h3>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label"
              >{{ t('booking.form.firstName') }} {{ t('common.required') }}</label
            >
            <input
              v-model="contact.firstName"
              type="text"
              class="form-input"
              :class="{ error: errors.firstName }"
              :placeholder="t('booking.form.firstNamePlaceholder')"
            />
            <span v-if="errors.firstName" class="form-error">{{ errors.firstName }}</span>
          </div>
          <div class="form-group">
            <label class="form-label"
              >{{ t('booking.form.lastName') }} {{ t('common.required') }}</label
            >
            <input
              v-model="contact.lastName"
              type="text"
              class="form-input"
              :class="{ error: errors.lastName }"
              :placeholder="t('booking.form.lastNamePlaceholder')"
            />
            <span v-if="errors.lastName" class="form-error">{{ errors.lastName }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('booking.form.email') }} {{ t('common.required') }}</label>
          <div class="input-with-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
              ></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <input
              v-model="contact.email"
              type="email"
              class="form-input"
              :class="{ error: errors.email }"
              :placeholder="t('booking.form.emailPlaceholder')"
            />
          </div>
          <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label class="form-label"
            >{{ t('booking.form.phone') }}
            {{
              widgetConfig?.guestOptions?.requirePhone !== false ? t('common.required') : ''
            }}</label
          >
          <PhoneInput
            v-model="contact.phone"
            :country="widgetStore.detectedMarket?.countryCode || 'TR'"
            :error="errors.phone"
          />
        </div>
      </div>

      <!-- Guest Details -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          {{ t('booking.guestInfo') }}
        </h3>

        <div v-for="(guest, index) in roomGuests" :key="index" class="guest-card">
          <div class="guest-card-header">
            <span class="guest-badge" :class="guest.type">
              {{
                guest.type === 'adult'
                  ? t('booking.guest.adult')
                  : t('booking.guest.childWithAge', { age: guest.age })
              }}
              {{
                guest.type === 'adult'
                  ? roomGuests.filter(g => g.type === 'adult').indexOf(guest) + 1
                  : roomGuests.filter(g => g.type === 'child').indexOf(guest) + 1
              }}
            </span>
            <span v-if="guest.isLead" class="lead-badge">{{ t('booking.guest.leadGuest') }}</span>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">{{ t('booking.form.title') }}</label>
              <select v-model="guest.title" class="form-input">
                <option value="">{{ t('booking.form.selectTitle') }}</option>
                <option value="mr">{{ t('booking.form.mr') }}</option>
                <option value="mrs">{{ t('booking.form.mrs') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label"
                >{{ t('booking.form.firstName') }} {{ t('common.required') }}</label
              >
              <input
                v-model="guest.firstName"
                type="text"
                class="form-input"
                :class="{ error: errors[`guest_${index}_firstName`] }"
                :placeholder="t('booking.form.firstName')"
                :disabled="guest.isLead"
              />
              <span v-if="errors[`guest_${index}_firstName`]" class="form-error">{{
                errors[`guest_${index}_firstName`]
              }}</span>
            </div>
            <div class="form-group">
              <label class="form-label"
                >{{ t('booking.form.lastName') }} {{ t('common.required') }}</label
              >
              <input
                v-model="guest.lastName"
                type="text"
                class="form-input"
                :class="{ error: errors[`guest_${index}_lastName`] }"
                :placeholder="t('booking.form.lastName')"
                :disabled="guest.isLead"
              />
              <span v-if="errors[`guest_${index}_lastName`]" class="form-error">{{
                errors[`guest_${index}_lastName`]
              }}</span>
            </div>
          </div>

          <!-- Nationality & Birth Date -->
          <div
            v-if="
              widgetConfig?.guestOptions?.requireNationality ||
              (widgetConfig?.guestOptions?.requireBirthDate && guest.type === 'child')
            "
            class="form-row"
          >
            <div v-if="widgetConfig?.guestOptions?.requireNationality" class="form-group">
              <label class="form-label">
                {{ t('booking.form.nationality') }} {{ t('common.required') }}
              </label>
              <select
                v-model="guest.nationality"
                class="form-input"
                :class="{ error: errors[`guest_${index}_nationality`] }"
              >
                <option value="">{{ t('booking.form.nationalityPlaceholder') }}</option>
                <option v-for="c in countries" :key="c.code" :value="c.code">
                  {{ c.flag }} {{ c.name }}
                </option>
              </select>
              <span v-if="errors[`guest_${index}_nationality`]" class="form-error">{{
                errors[`guest_${index}_nationality`]
              }}</span>
            </div>
            <div
              v-if="widgetConfig?.guestOptions?.requireBirthDate && guest.type === 'child'"
              class="form-group"
            >
              <label class="form-label">
                {{ t('booking.form.birthDate') }} {{ t('common.required') }}
              </label>
              <input
                v-model="guest.birthDate"
                type="date"
                class="form-input"
                :class="{ error: errors[`guest_${index}_birthDate`] }"
              />
              <span v-if="errors[`guest_${index}_birthDate`]" class="form-error">{{
                errors[`guest_${index}_birthDate`]
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Special Requests -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          {{ t('booking.specialRequests') }}
        </h3>
        <div class="form-group">
          <textarea
            v-model="specialRequests"
            class="form-input"
            rows="3"
            :placeholder="t('booking.form.specialRequestsPlaceholder')"
          ></textarea>
          <span class="form-hint">{{ t('booking.form.specialRequestsHint') }}</span>
        </div>
      </div>

      <!-- Payment Method Selection -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          {{ t('booking.paymentMethod') }}
        </h3>

        <div class="payment-methods">
          <label
            v-if="paymentMethods.creditCard"
            class="payment-method"
            :class="{ selected: selectedPaymentMethod === 'credit_card' }"
          >
            <input
              v-model="selectedPaymentMethod"
              type="radio"
              value="credit_card"
              class="sr-only"
            />
            <div class="payment-method-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <div class="payment-method-info">
              <span class="payment-method-name">{{ t('booking.payment.creditCard') }}</span>
              <span class="payment-method-desc">{{ t('booking.payment.creditCardDesc') }}</span>
            </div>
            <div class="payment-method-check">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </label>

          <label
            v-if="paymentMethods.payAtHotel"
            class="payment-method"
            :class="{ selected: selectedPaymentMethod === 'pay_at_checkin' }"
          >
            <input
              v-model="selectedPaymentMethod"
              type="radio"
              value="pay_at_checkin"
              class="sr-only"
            />
            <div class="payment-method-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div class="payment-method-info">
              <span class="payment-method-name">{{ t('booking.payment.payAtHotel') }}</span>
              <span class="payment-method-desc">{{ t('booking.payment.payAtHotelDesc') }}</span>
            </div>
            <div class="payment-method-check">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </label>

          <label
            v-if="paymentMethods.bankTransfer"
            class="payment-method"
            :class="{ selected: selectedPaymentMethod === 'bank_transfer' }"
          >
            <input
              v-model="selectedPaymentMethod"
              type="radio"
              value="bank_transfer"
              class="sr-only"
            />
            <div class="payment-method-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="payment-method-info">
              <span class="payment-method-name">{{ t('booking.payment.bankTransfer') }}</span>
              <span class="payment-method-desc">
                {{
                  bankTransferDiscount > 0
                    ? t('booking.payment.bankTransferDiscountDesc', {
                        discount: '%' + bankTransferDiscount
                      })
                    : t('booking.payment.bankTransferDesc')
                }}
              </span>
              <span v-if="bankTransferDiscount > 0" class="payment-discount-badge">
                {{
                  t('booking.payment.bankTransferDiscount', {
                    discount: '%' + bankTransferDiscount
                  })
                }}
              </span>
            </div>
            <div class="payment-method-check">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </label>
        </div>

        <!-- Havale İndirimi Bilgisi -->
        <div
          v-if="selectedPaymentMethod === 'bank_transfer' && bankTransferDiscount > 0"
          class="payment-info-box payment-info-discount"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
            ></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
          <div class="payment-info-content">
            <span class="payment-info-highlight">{{
              t('booking.payment.discountedTotal', {
                amount: formatCurrency(bankTransferDiscountedTotal)
              })
            }}</span>
          </div>
        </div>

        <!-- Ön Ödeme Bilgisi -->
        <div
          v-if="paymentTerms?.prepaymentRequired"
          class="payment-info-box payment-info-prepayment"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div class="payment-info-content">
            <span class="payment-info-highlight">{{
              t('booking.payment.prepaymentAmount', {
                amount: formatCurrency(prepaymentAmount),
                percent: '%' + paymentTerms.prepaymentPercentage
              })
            }}</span>
            <span class="payment-info-detail">{{
              t('booking.payment.remainingAmount', { amount: formatCurrency(remainingAmount) })
            }}</span>
            <span v-if="remainingPaymentText" class="payment-info-detail">{{
              remainingPaymentText
            }}</span>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="isLoading">
        <span v-if="isLoading" class="spinner"></span>
        <template v-else>
          {{
            selectedPaymentMethod === 'credit_card'
              ? t('booking.submit.goToPayment')
              : t('booking.submit.completeBooking')
          }}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </template>
      </button>
    </form>
  </div>
</template>

<!-- All styles in widget.css for Shadow DOM compatibility -->
