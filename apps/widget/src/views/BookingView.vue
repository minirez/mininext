<script setup>
import { computed, ref, onMounted } from 'vue'
import { useWidgetStore } from '../stores/widget'
import { useFormatters } from '../composables/useFormatters'
import ViewHeader from '../components/ViewHeader.vue'
import PhoneInput from '../components/PhoneInput.vue'

const widgetStore = useWidgetStore()
const { formatCurrency, formatDateMedium } = useFormatters()

const selectedRoom = computed(() => widgetStore.selectedRoom)
const selectedOption = computed(() => widgetStore.selectedOption)
const nights = computed(() => widgetStore.nights)
const searchParams = computed(() => widgetStore.searchParams)
const isLoading = computed(() => widgetStore.isLoading)
const errorMessage = computed(() => widgetStore.error)
const widgetConfig = computed(() => widgetStore.widgetConfig)
const paymentMethods = computed(() => widgetConfig.value?.paymentMethods || {})

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

const roomName = computed(() => resolveName(selectedRoom.value?.roomType?.name))
const mealPlanName = computed(() => resolveName(selectedOption.value?.mealPlan?.name))

// Form data
const contact = ref({ ...widgetStore.bookingData.contact })
const specialRequests = ref(widgetStore.bookingData.specialRequests || '')
const selectedPaymentMethod = ref(widgetStore.paymentMethod)

// Form validation
const errors = ref({})

function validateForm() {
  errors.value = {}

  if (!contact.value.firstName?.trim()) {
    errors.value.firstName = 'Ad gerekli'
  }
  if (!contact.value.lastName?.trim()) {
    errors.value.lastName = 'Soyad gerekli'
  }
  if (!contact.value.email?.trim() || !contact.value.email.includes('@')) {
    errors.value.email = 'Geçerli bir e-posta adresi giriniz'
  }
  if (widgetConfig.value?.guestOptions?.requirePhone !== false) {
    if (!contact.value.phone?.trim()) {
      errors.value.phone = 'Telefon numarası gerekli'
    } else if (contact.value.phone.replace(/\D/g, '').length < 10) {
      errors.value.phone = 'Geçerli bir telefon numarası giriniz'
    }
  }

  return Object.keys(errors.value).length === 0
}

async function submit() {
  if (!validateForm()) return

  // Update store
  widgetStore.bookingData.contact = { ...contact.value }
  widgetStore.bookingData.specialRequests = specialRequests.value
  widgetStore.paymentMethod = selectedPaymentMethod.value

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
    selectedPaymentMethod.value = 'pay_at_hotel'
  }
})
</script>

<template>
  <div class="booking-view">
    <ViewHeader title="Rezervasyon Bilgileri" />

    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-error">
      <svg class="alert-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
          <div class="summary-date-label">Giriş</div>
          <div class="summary-date-value">{{ formatDateMedium(searchParams.checkIn) }}</div>
        </div>
        <div class="summary-date-divider">→</div>
        <div class="summary-date">
          <div class="summary-date-label">Çıkış</div>
          <div class="summary-date-value">{{ formatDateMedium(searchParams.checkOut) }}</div>
        </div>
      </div>
      <div class="summary-card-footer">
        <div>
          <div class="summary-guests">
            {{ searchParams.adults }} yetişkin{{ searchParams.children.length > 0 ? `, ${searchParams.children.length} çocuk` : '' }}
          </div>
          <div class="summary-nights">{{ nights }} gece</div>
        </div>
        <div class="summary-card-total">
          <div class="summary-card-total-label">Toplam</div>
          <div class="summary-card-total-value">{{ formatCurrency(selectedOption?.pricing?.finalTotal || 0) }}</div>
        </div>
      </div>
    </div>

    <!-- Contact Form -->
    <form @submit.prevent="submit" class="booking-form">
      <div class="form-section">
        <h3 class="form-section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          İletişim Bilgileri
        </h3>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Ad *</label>
            <input
              v-model="contact.firstName"
              type="text"
              class="form-input"
              :class="{ error: errors.firstName }"
              placeholder="Adınız"
            />
            <span v-if="errors.firstName" class="form-error">{{ errors.firstName }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Soyad *</label>
            <input
              v-model="contact.lastName"
              type="text"
              class="form-input"
              :class="{ error: errors.lastName }"
              placeholder="Soyadınız"
            />
            <span v-if="errors.lastName" class="form-error">{{ errors.lastName }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">E-posta *</label>
          <div class="input-with-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <input
              v-model="contact.email"
              type="email"
              class="form-input"
              :class="{ error: errors.email }"
              placeholder="ornek@email.com"
            />
          </div>
          <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Telefon {{ widgetConfig?.guestOptions?.requirePhone !== false ? '*' : '' }}</label>
          <PhoneInput
            v-model="contact.phone"
            :country="widgetStore.detectedMarket?.countryCode || 'TR'"
            :error="errors.phone"
          />
        </div>
      </div>

      <!-- Special Requests -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          Özel İstekler
        </h3>
        <div class="form-group">
          <textarea
            v-model="specialRequests"
            class="form-input"
            rows="3"
            placeholder="Varsa özel isteklerinizi yazabilirsiniz..."
          ></textarea>
          <span class="form-hint">Erken giriş, geç çıkış, özel düzenleme vb. isteklerinizi belirtebilirsiniz.</span>
        </div>
      </div>

      <!-- Payment Method Selection -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          Ödeme Yöntemi
        </h3>

        <div class="payment-methods">
          <label v-if="paymentMethods.creditCard" class="payment-method" :class="{ selected: selectedPaymentMethod === 'credit_card' }">
            <input v-model="selectedPaymentMethod" type="radio" value="credit_card" class="sr-only" />
            <div class="payment-method-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <div class="payment-method-info">
              <span class="payment-method-name">Kredi Kartı</span>
              <span class="payment-method-desc">Güvenli online ödeme</span>
            </div>
            <div class="payment-method-check">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </label>

          <label v-if="paymentMethods.payAtHotel" class="payment-method" :class="{ selected: selectedPaymentMethod === 'pay_at_hotel' }">
            <input v-model="selectedPaymentMethod" type="radio" value="pay_at_hotel" class="sr-only" />
            <div class="payment-method-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div class="payment-method-info">
              <span class="payment-method-name">Otelde Ödeme</span>
              <span class="payment-method-desc">Giriş sırasında ödeyin</span>
            </div>
            <div class="payment-method-check">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </label>

          <label v-if="paymentMethods.bankTransfer" class="payment-method" :class="{ selected: selectedPaymentMethod === 'bank_transfer' }">
            <input v-model="selectedPaymentMethod" type="radio" value="bank_transfer" class="sr-only" />
            <div class="payment-method-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="payment-method-info">
              <span class="payment-method-name">Banka Transferi</span>
              <span class="payment-method-desc">Havale/EFT ile ödeyin</span>
            </div>
            <div class="payment-method-check">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </label>
        </div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="isLoading">
        <span v-if="isLoading" class="spinner"></span>
        <template v-else>
          {{ selectedPaymentMethod === 'credit_card' ? 'Ödemeye Geç' : 'Rezervasyonu Tamamla' }}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </template>
      </button>
    </form>
  </div>
</template>

<!-- All styles in widget.css for Shadow DOM compatibility -->
