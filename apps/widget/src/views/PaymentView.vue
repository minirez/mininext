<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useWidgetStore } from '../stores/widget'
import { useFormatters } from '../composables/useFormatters'
import { useTranslation } from '../composables/useTranslation'
import { widgetApi } from '../services/api'
import ViewHeader from '../components/ViewHeader.vue'

const widgetStore = useWidgetStore()
const { formatCurrency } = useFormatters()
const { t } = useTranslation()

// Template refs
const cardNumberRef = ref(null)
const expiryRef = ref(null)
const cvvRef = ref(null)

// Card form data
const cardData = ref({
  holder: '',
  number: '',
  expiry: '',
  cvv: ''
})

// Installment selection
const selectedInstallment = ref(1)
const installmentOptions = ref([])
const selectedPosId = ref(null)

// BIN query state
const binQueryLoading = ref(false)
const binInfo = ref(null)
const currencyConversion = ref(null)

// 3D Secure modal
const show3DModal = ref(false)
const payment3DUrl = ref('')
const iframeLoading = ref(true)
const paymentId = ref(null)
let statusCheckInterval = null

// Form validation
const errors = ref({})

// Computed
const booking = computed(() => widgetStore.booking)
const isLoading = computed(() => widgetStore.isLoading)
const errorMessage = computed(() => widgetStore.error)
const totalAmount = computed(() => booking.value?.pricing?.grandTotal || 0)
const currency = computed(() => booking.value?.pricing?.currency || 'TRY')

// Effective amount/currency (after possible DCC conversion)
const effectiveAmount = computed(() =>
  currencyConversion.value ? currencyConversion.value.convertedAmount : totalAmount.value
)
const effectiveCurrency = computed(() =>
  currencyConversion.value ? 'TRY' : currency.value
)

const cardNumberFormatted = computed({
  get: () => cardData.value.number,
  set: (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    cardData.value.number = digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  }
})

const expiryFormatted = computed({
  get: () => cardData.value.expiry,
  set: (val) => {
    let digits = val.replace(/\D/g, '').slice(0, 4)

    if (digits.length >= 1) {
      const first = parseInt(digits[0], 10)
      if (first >= 2) {
        digits = '0' + digits
        digits = digits.slice(0, 4)
      }
    }

    if (digits.length >= 2) {
      let month = parseInt(digits.slice(0, 2), 10)
      if (month === 0) {
        digits = '01' + digits.slice(2)
      }
      if (month > 12) {
        digits = '12' + digits.slice(2)
      }
      cardData.value.expiry = digits.slice(0, 2) + '/' + digits.slice(2)
    } else {
      cardData.value.expiry = digits
    }
  }
})

const isFormValid = computed(() => {
  const expiryOk = cardData.value.expiry.length === 5 && !isCardExpired(cardData.value.expiry)
  return cardData.value.holder.trim().length >= 3 &&
    cardData.value.number.replace(/\s/g, '').length === 16 &&
    expiryOk &&
    cardData.value.cvv.length >= 3
})

// Get card type
const cardType = computed(() => {
  const number = cardData.value.number.replace(/\s/g, '')
  if (number.startsWith('4')) return 'visa'
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard'
  if (number.startsWith('9')) return 'troy'
  if (/^3[47]/.test(number)) return 'amex'
  return null
})

// Luhn validasyonu
function luhnCheck(number) {
  let sum = 0
  let isEven = false
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10)
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }
  return sum % 10 === 0
}

// Suresi dolmus kart kontrolu
function isCardExpired(expiry) {
  const [monthStr, yearStr] = expiry.split('/')
  if (!monthStr || !yearStr) return false
  const month = parseInt(monthStr, 10)
  const year = parseInt('20' + yearStr, 10)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  return year < currentYear || (year === currentYear && month < currentMonth)
}

// Sadece rakam keydown handler
function numericKeydown(event) {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End']
  if (allowedKeys.includes(event.key)) return
  if (event.ctrlKey || event.metaKey) return
  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}

// Auto-focus: 16 hane kart numarasi yazilinca expiry'ye gec
watch(() => cardData.value.number, (newVal) => {
  const digits = newVal.replace(/\s/g, '')
  if (digits.length === 16) {
    nextTick(() => expiryRef.value?.focus())
  }
})

// Auto-focus: MM/YY tamamlaninca real-time validate + CVV'ye gec
watch(() => cardData.value.expiry, (newVal) => {
  if (errors.value.expiry) {
    errors.value.expiry = ''
  }

  if (newVal.length === 5) {
    if (isCardExpired(newVal)) {
      errors.value.expiry = t('payment.errors.cardExpired')
      return
    }
    nextTick(() => cvvRef.value?.focus())
  }
})

// Query BIN when card number changes
watch(() => cardData.value.number, async (newVal) => {
  const digits = newVal.replace(/\s/g, '')

  if (digits.length >= 6) {
    await queryBin(digits.slice(0, 8))
  } else {
    binInfo.value = null
    currencyConversion.value = null
    installmentOptions.value = []
    selectedInstallment.value = 1
  }
})

async function queryBin(bin) {
  try {
    binQueryLoading.value = true

    const result = await widgetApi.queryBin(
      widgetStore.config.hotelCode,
      bin,
      totalAmount.value,
      currency.value,
      widgetStore.config.apiUrl
    )

    binInfo.value = result.card || null
    selectedPosId.value = result.pos?.id || null
    currencyConversion.value = result.currencyConversion || null

    // Use converted amount if currency conversion is active
    const amt = currencyConversion.value
      ? currencyConversion.value.convertedAmount
      : totalAmount.value

    // Currency conversion active → only tek çekim (no installments for DCC)
    if (currencyConversion.value || !result.installments || result.installments.length <= 1) {
      installmentOptions.value = [{
        count: 1,
        monthlyAmount: amt,
        totalAmount: amt,
        interestRate: 0,
        label: t('payment.installment.single')
      }]
    } else {
      installmentOptions.value = result.installments.map(inst => ({
        count: inst.count,
        monthlyAmount: inst.amount ? Math.round((inst.amount / inst.count) * 100) / 100 : (inst.monthlyAmount || 0),
        totalAmount: inst.amount || inst.totalAmount || 0,
        interestRate: inst.interestRate || 0,
        label: inst.count === 1
          ? t('payment.installment.single')
          : t('payment.installment.count', { count: inst.count })
      }))
    }

    selectedInstallment.value = 1
  } catch (err) {
    console.error('[PaymentView] BIN query failed:', err)
    currencyConversion.value = null
    installmentOptions.value = [{
      count: 1,
      monthlyAmount: totalAmount.value,
      totalAmount: totalAmount.value,
      interestRate: 0,
      label: t('payment.installment.single')
    }]
  } finally {
    binQueryLoading.value = false
  }
}

function validateForm() {
  errors.value = {}

  if (!cardData.value.holder.trim()) {
    errors.value.holder = t('payment.errors.holderRequired')
  }

  const cardNumber = cardData.value.number.replace(/\s/g, '')
  if (cardNumber.length !== 16) {
    errors.value.number = t('payment.errors.numberInvalid')
  } else if (!luhnCheck(cardNumber)) {
    errors.value.number = t('payment.errors.numberLuhn')
  }

  const [month, year] = cardData.value.expiry.split('/')
  if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
    errors.value.expiry = t('payment.errors.expiryInvalid')
  } else if (isCardExpired(cardData.value.expiry)) {
    errors.value.expiry = t('payment.errors.cardExpired')
  }

  if (cardData.value.cvv.length < 3) {
    errors.value.cvv = t('payment.errors.cvvInvalid')
  }

  return Object.keys(errors.value).length === 0
}

async function submitPayment() {
  if (!validateForm()) return

  const result = await widgetStore.processPayment({
    card: {
      holder: cardData.value.holder.trim(),
      number: cardData.value.number.replace(/\s/g, ''),
      expiry: cardData.value.expiry,
      cvv: cardData.value.cvv
    },
    posId: selectedPosId.value,
    installment: selectedInstallment.value
  })

  // 3D Secure gerekiyorsa modal aç
  if (result?.requires3D && result?.formUrl) {
    paymentId.value = result.paymentId
    payment3DUrl.value = result.formUrl
    show3DModal.value = true
    iframeLoading.value = true
    startStatusCheck()
  }
}

// 3D Secure postMessage dinleyici
function handlePaymentMessage(event) {
  if (event.data?.type === 'payment_result') {
    stopStatusCheck()
    show3DModal.value = false
    payment3DUrl.value = ''

    if (event.data.data?.success) {
      widgetStore.currentStep = 'confirmation'
    } else {
      widgetStore.error = event.data.data?.message || t('payment.errors.paymentFailed')
    }
  }
}

// Status polling fallback (postMessage çalışmazsa)
function startStatusCheck() {
  statusCheckInterval = setInterval(async () => {
    try {
      const status = await widgetStore.checkPaymentStatus()
      if (status?.payment?.status === 'completed') {
        stopStatusCheck()
        show3DModal.value = false
        payment3DUrl.value = ''
        widgetStore.currentStep = 'confirmation'
      } else if (status?.payment?.status === 'failed') {
        stopStatusCheck()
        show3DModal.value = false
        payment3DUrl.value = ''
        widgetStore.error = t('payment.errors.paymentFailed')
      }
    } catch (err) {
      console.error('[PaymentView] Status check failed:', err)
    }
  }, 3000)
}

function stopStatusCheck() {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval)
    statusCheckInterval = null
  }
}

function cancel3DPayment() {
  stopStatusCheck()
  show3DModal.value = false
  payment3DUrl.value = ''
  paymentId.value = null
}

onMounted(() => {
  window.addEventListener('message', handlePaymentMessage)

  // Check for 3D Secure return (legacy fallback)
  const urlParams = new URLSearchParams(window.location.search)
  const paymentStatus = urlParams.get('paymentStatus')

  if (paymentStatus === 'success') {
    widgetStore.currentStep = 'confirmation'
  } else if (paymentStatus === 'failed') {
    widgetStore.error = t('payment.errors.paymentFailedRetry')
  }
})

onUnmounted(() => {
  window.removeEventListener('message', handlePaymentMessage)
  stopStatusCheck()
})
</script>

<template>
  <div class="payment-view">
    <ViewHeader :title="t('payment.title')" />

    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-error">
      <svg class="alert-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Order Summary -->
    <div class="order-summary">
      <div class="order-summary-row">
        <span class="order-summary-label">{{ t('payment.bookingNumber') }}</span>
        <span class="order-summary-value booking-number">{{ booking?.bookingNumber }}</span>
      </div>
      <div v-if="currencyConversion" class="order-summary-row">
        <span class="order-summary-label">{{ t('payment.amount') }} ({{ currencyConversion.originalCurrency }})</span>
        <span class="order-summary-value">{{ formatCurrency(currencyConversion.originalAmount, currencyConversion.originalCurrency) }}</span>
      </div>
      <div v-if="currencyConversion" class="order-summary-row">
        <span class="order-summary-label">{{ t('payment.exchangeRate') }}</span>
        <span class="order-summary-value">1 {{ currencyConversion.originalCurrency }} = {{ currencyConversion.exchangeRate }} TRY</span>
      </div>
      <div class="order-summary-row total">
        <span class="order-summary-label">{{ t('payment.amountToPay') }}</span>
        <span class="order-summary-value price">{{ formatCurrency(effectiveAmount, effectiveCurrency) }}</span>
      </div>
    </div>

    <!-- Card Form -->
    <form @submit.prevent="submitPayment" class="payment-form">
      <!-- Card Holder -->
      <div class="form-group">
        <label class="form-label">{{ t('payment.card.holder') }}</label>
        <input
          v-model="cardData.holder"
          type="text"
          class="form-input"
          :class="{ error: errors.holder }"
          :placeholder="t('payment.card.holderPlaceholder')"
          autocomplete="cc-name"
          style="text-transform: uppercase;"
        />
        <span v-if="errors.holder" class="form-error">{{ errors.holder }}</span>
      </div>

      <!-- Card Number -->
      <div class="form-group">
        <label class="form-label">{{ t('payment.card.number') }}</label>
        <div class="card-input-wrapper">
          <input
            ref="cardNumberRef"
            v-model="cardNumberFormatted"
            type="text"
            class="form-input card-number-input"
            :class="{ error: errors.number }"
            :placeholder="t('payment.card.numberPlaceholder')"
            autocomplete="cc-number"
            inputmode="numeric"
            @keydown="numericKeydown"
          />
          <div class="card-icons">
            <span v-if="binQueryLoading" class="card-loading">
              <span class="spinner small"></span>
            </span>
            <span v-else-if="cardType" class="card-brand-icon">
              <!-- Visa SVG -->
              <svg v-if="cardType === 'visa'" xmlns="http://www.w3.org/2000/svg" width="40" height="24" viewBox="0 0 40 24" fill="none">
                <rect width="40" height="24" rx="3" fill="#1A1F71"/>
                <text x="20" y="15.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="bold" font-style="italic" fill="white">VISA</text>
              </svg>
              <!-- Mastercard SVG -->
              <svg v-else-if="cardType === 'mastercard'" xmlns="http://www.w3.org/2000/svg" width="40" height="24" viewBox="0 0 40 24" fill="none">
                <rect width="40" height="24" rx="3" fill="#252525"/>
                <circle cx="16" cy="12" r="7.5" fill="#EB001B"/>
                <circle cx="24" cy="12" r="7.5" fill="#F79E1B"/>
                <path d="M20 6.2a7.5 7.5 0 0 1 0 11.6 7.5 7.5 0 0 1 0-11.6z" fill="#FF5F00"/>
              </svg>
              <!-- Troy SVG -->
              <svg v-else-if="cardType === 'troy'" xmlns="http://www.w3.org/2000/svg" width="40" height="24" viewBox="0 0 40 24" fill="none">
                <rect width="40" height="24" rx="3" fill="#00529B"/>
                <text x="20" y="15.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="white">TROY</text>
              </svg>
              <!-- Amex SVG -->
              <svg v-else-if="cardType === 'amex'" xmlns="http://www.w3.org/2000/svg" width="40" height="24" viewBox="0 0 40 24" fill="none">
                <rect width="40" height="24" rx="3" fill="#006FCF"/>
                <text x="20" y="15.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="8" font-weight="bold" fill="white">AMEX</text>
              </svg>
            </span>
          </div>
        </div>
        <span v-if="errors.number" class="form-error">{{ errors.number }}</span>
        <span v-if="binInfo?.bankName" class="form-hint bank-name">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          {{ binInfo.bankName }}
        </span>
      </div>

      <!-- Expiry & CVV Row -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">{{ t('payment.card.expiry') }}</label>
          <input
            ref="expiryRef"
            v-model="expiryFormatted"
            type="text"
            class="form-input"
            :class="{ error: errors.expiry }"
            :placeholder="t('payment.card.expiryPlaceholder')"
            autocomplete="cc-exp"
            inputmode="numeric"
            maxlength="5"
            @keydown="numericKeydown"
          />
          <span v-if="errors.expiry" class="form-error">{{ errors.expiry }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('payment.card.cvv') }}</label>
          <div class="cvv-input-wrapper">
            <input
              ref="cvvRef"
              v-model="cardData.cvv"
              type="password"
              class="form-input"
              :class="{ error: errors.cvv }"
              placeholder="&bull;&bull;&bull;"
              autocomplete="cc-csc"
              inputmode="numeric"
              maxlength="4"
              @keydown="numericKeydown"
            />
            <div class="cvv-hint">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
          </div>
          <span v-if="errors.cvv" class="form-error">{{ errors.cvv }}</span>
        </div>
      </div>

      <!-- Installment Selection -->
      <div v-if="installmentOptions.length > 1" class="form-group">
        <label class="form-label">{{ t('payment.installment.title') }}</label>
        <div class="installment-options">
          <label
            v-for="option in installmentOptions"
            :key="option.count"
            class="installment-option"
            :class="{ selected: selectedInstallment === option.count }"
          >
            <input
              v-model="selectedInstallment"
              type="radio"
              :value="option.count"
              class="sr-only"
            />
            <span class="installment-radio">
              <span class="installment-radio-dot"></span>
            </span>
            <div class="installment-info">
              <span class="installment-label">{{ option.label }}</span>
              <span v-if="option.count > 1" class="installment-monthly">
                {{ formatCurrency(option.monthlyAmount, effectiveCurrency) }} x {{ option.count }} ay
              </span>
            </div>
            <div class="installment-total">
              <span v-if="option.interestRate > 0" class="installment-rate">
                +%{{ option.interestRate }}
              </span>
              <span class="installment-amount">{{ formatCurrency(option.totalAmount, effectiveCurrency) }}</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="btn btn-primary btn-block btn-lg"
        :disabled="!isFormValid || isLoading"
      >
        <span v-if="isLoading" class="spinner"></span>
        <template v-else>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          {{ t('payment.submit.pay', { amount: formatCurrency(effectiveAmount, effectiveCurrency) }) }}
        </template>
      </button>

      <!-- Security Badge -->
      <div class="security-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>{{ t('payment.submit.securityBadge') }}</span>
      </div>
    </form>

    <!-- 3D Secure Modal -->
    <div v-if="show3DModal" class="secure-modal-overlay">
      <div class="secure-modal">
        <div class="secure-modal-header">
          <div class="secure-modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>{{ t('payment.secure3D.title') }}</span>
          </div>
          <button class="secure-modal-close" @click="cancel3DPayment">&#10005;</button>
        </div>
        <div class="secure-modal-body">
          <iframe
            :src="payment3DUrl"
            class="secure-iframe"
            allow="payment"
            @load="iframeLoading = false"
          />
          <div v-if="iframeLoading" class="secure-iframe-loading">
            <div class="spinner"></div>
            <span>{{ t('payment.secure3D.loading') }}</span>
          </div>
        </div>
        <div class="secure-modal-footer">
          <button class="btn-text" @click="cancel3DPayment">{{ t('payment.secure3D.cancel') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- All styles in widget.css for Shadow DOM compatibility -->
