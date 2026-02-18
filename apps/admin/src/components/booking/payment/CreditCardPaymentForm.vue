<template>
  <div class="credit-card-payment-form">
    <!-- 3D Secure Modal - Teleport to body so it's independent of parent -->
    <Teleport to="body">
      <div v-if="showPaymentIframe" class="fixed inset-0 z-[9999] flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click.self="cancelPayment"></div>

        <!-- Modal Content -->
        <div
          class="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons text-yellow-600 dark:text-yellow-400">security</span>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ $t('payment.card.3dSecure') }}
                </p>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('payment.card.3dSecureInfo') }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              @click="cancelPayment"
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Iframe Container -->
          <div class="relative" style="min-height: 500px">
            <iframe
              ref="paymentIframe"
              :src="paymentFormUrl"
              class="w-full h-[500px] border-0"
              allow="payment"
              @load="onIframeLoad"
            ></iframe>
            <div
              v-if="iframeLoading"
              class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80"
            >
              <span class="material-icons text-4xl text-purple-500 animate-spin">refresh</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-gray-200 dark:border-slate-700 text-center">
            <button
              type="button"
              class="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              @click="cancelPayment"
            >
              {{ $t('payment.card.cancel3D') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Card Form -->
    <form v-show="!showPaymentIframe" class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Amount Display -->
      <div v-if="showAmountDisplay" class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-purple-600 dark:text-purple-300">{{ $t('payment.amount') }}</p>
            <p class="text-2xl font-bold text-purple-700 dark:text-purple-200">
              {{ formatPrice(effectiveAmount, effectiveCurrency) }}
            </p>
            <!-- DCC conversion notice -->
            <p v-if="dccConversion" class="text-xs text-purple-500 dark:text-purple-400 mt-1">
              {{ formatPrice(dccConversion.originalAmount, dccConversion.originalCurrency) }}
              &rarr;
              {{ formatPrice(dccConversion.convertedAmount, dccConversion.convertedCurrency) }} ({{
                $t('payment.card.exchangeRate')
              }}: {{ dccConversion.exchangeRate.toFixed(4) }})
            </p>
          </div>
          <span class="material-icons text-5xl text-purple-300 dark:text-purple-700"
            >credit_card</span
          >
        </div>
      </div>

      <!-- Card Number -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('payment.card.cardNumber') }} *
        </label>
        <div class="relative">
          <input
            v-model="form.cardNumber"
            type="text"
            inputmode="numeric"
            autocomplete="cc-number"
            class="form-input w-full pl-12 pr-24 font-mono tracking-wider"
            :placeholder="$t('payment.card.cardNumberPlaceholder')"
            maxlength="19"
            @input="onCardNumberInput"
            required
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400"
            >credit_card</span
          >
          <!-- Card Logo -->
          <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <img
              v-if="cardBrand"
              :src="getCardLogo(cardBrand)"
              :alt="cardBrand"
              class="h-6 w-auto"
              @error="onCardLogoError"
            />
            <span v-if="queryingBin" class="material-icons text-gray-400 animate-spin text-sm"
              >refresh</span
            >
          </div>
        </div>
        <!-- BIN Info -->
        <div v-if="binInfo" class="mt-2 text-sm">
          <div class="flex items-center gap-2 text-gray-600 dark:text-slate-400">
            <span class="material-icons text-sm">account_balance</span>
            <span>{{ binInfo.bankName }}</span>
            <span
              v-if="binInfo.cardFamily"
              class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs"
            >
              {{ binInfo.cardFamily }}
            </span>
          </div>
        </div>
      </div>

      <!-- Card Holder -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('payment.card.cardHolder') }} *
        </label>
        <input
          v-model="form.cardHolder"
          type="text"
          autocomplete="cc-name"
          class="form-input w-full uppercase"
          :placeholder="$t('payment.card.cardHolderPlaceholder')"
          required
        />
      </div>

      <!-- Expiry & CVV -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('payment.card.expiry') }} *
          </label>
          <input
            v-model="form.expiry"
            type="text"
            inputmode="numeric"
            autocomplete="cc-exp"
            class="form-input w-full font-mono"
            placeholder="MM/YY"
            maxlength="5"
            @input="onExpiryInput"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('payment.card.cvv') }} *
          </label>
          <div class="relative">
            <input
              v-model="form.cvv"
              :type="showCvv ? 'text' : 'password'"
              inputmode="numeric"
              autocomplete="cc-csc"
              class="form-input w-full font-mono pr-10"
              placeholder="***"
              maxlength="4"
              required
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              @click="showCvv = !showCvv"
            >
              <span class="material-icons text-sm">{{
                showCvv ? 'visibility_off' : 'visibility'
              }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Installments (hide when DCC conversion is active - no installments for currency-converted payments) -->
      <div v-if="installmentOptions.length > 1 && !dccConversion">
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          {{ $t('payment.card.installment') }}
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            v-for="opt in installmentOptions"
            :key="opt.count"
            type="button"
            class="p-3 rounded-lg border-2 text-center transition-all"
            :class="
              form.installment === opt.count
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
            "
            @click="form.installment = opt.count"
          >
            <p class="font-medium text-gray-900 dark:text-white">
              {{
                opt.count === 1
                  ? $t('payment.card.singlePayment')
                  : opt.count + ' ' + $t('payment.card.installments')
              }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ formatPrice(opt.monthlyAmount, effectiveCurrency) }}/{{ $t('payment.card.month') }}
            </p>
            <p
              v-if="opt.totalAmount > effectiveAmount"
              class="text-xs text-orange-600 dark:text-orange-400"
            >
              {{ $t('payment.card.total') }}: {{ formatPrice(opt.totalAmount, effectiveCurrency) }}
            </p>
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
      >
        <div class="flex items-center gap-2 text-red-700 dark:text-red-300">
          <span class="material-icons">error</span>
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Submit Section (only show when card is valid) -->
      <div
        v-if="showSubmitButton && isValid"
        class="pt-4 border-t border-gray-100 dark:border-slate-700"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <span class="material-icons text-green-500">lock</span>
            <span>{{ $t('payment.card.securePayment') }}</span>
            <span class="text-xs">• 3D Secure</span>
          </div>
        </div>
        <button
          type="submit"
          class="w-full btn-primary py-3 text-lg"
          :disabled="!isValid || processing"
        >
          <span v-if="processing" class="flex items-center justify-center">
            <span class="material-icons text-sm animate-spin mr-2">refresh</span>
            {{ $t('payment.card.processing') }}
          </span>
          <span v-else class="flex items-center justify-center">
            <span class="material-icons mr-2">payment</span>
            {{ submitButtonText || $t('payment.card.pay') }}
            {{ formatPrice(selectedTotal, effectiveCurrency) }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import paymentService from '@/services/paymentService'

const props = defineProps({
  // Booking/Payment - Modal modunda zorunlu, inline modunda opsiyonel
  bookingId: String,
  paymentId: String,

  // Tutar - BIN sorgusu için gerekli
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'TRY'
  },

  // Müşteri bilgileri
  customerName: String,
  customerEmail: String,
  customerPhone: String,

  // UI ayarları
  showAmountDisplay: {
    type: Boolean,
    default: true
  },
  showSubmitButton: {
    type: Boolean,
    default: true
  },
  submitButtonText: String,

  // Mode: 'modal' (default) veya 'inline'
  // inline modda "Ödeme Yap" tıklandığında önce booking/payment oluşturulur
  mode: {
    type: String,
    default: 'modal'
  }
})

const emit = defineEmits([
  'success', // { transactionId, status, booking, payment }
  'error', // { message, code }
  'cancel', // 3D iptal edildi
  'processing', // true/false - İşlem başladı/bitti
  'request-payment' // inline modda: { cardData, installment } - Parent booking/payment oluşturmalı
])

const { t, locale } = useI18n()
const toast = useToast()

// Form state
const form = ref({
  cardNumber: '',
  cardHolder: props.customerName || '',
  expiry: '',
  cvv: '',
  installment: 1
})

const showCvv = ref(false)
const processing = ref(false)
const errorMessage = ref('')

// BIN query
const queryingBin = ref(false)
const binInfo = ref(null)
const cardBrand = ref('')
const dccConversion = ref(null) // DCC: currency conversion info from BIN query
const installmentOptions = ref([
  { count: 1, monthlyAmount: props.amount, totalAmount: props.amount }
])

// DCC: effective amount/currency (converted if TR card + foreign currency)
const effectiveAmount = computed(() => dccConversion.value?.convertedAmount || props.amount)
const effectiveCurrency = computed(() => dccConversion.value?.convertedCurrency || props.currency)

// 3D Secure
const showPaymentIframe = ref(false)
const paymentFormUrl = ref('')
const iframeLoading = ref(true)
const paymentIframe = ref(null)
const transactionId = ref('')
let statusCheckInterval = null

// Internal booking/payment refs (set by parent via processPayment method)
const internalBookingId = ref(props.bookingId)
const internalPaymentId = ref(props.paymentId)

// Computed
const isValid = computed(() => {
  const cardNum = form.value.cardNumber.replace(/\s/g, '')
  return (
    cardNum.length >= 15 &&
    form.value.cardHolder.trim().length >= 3 &&
    /^\d{2}\/\d{2}$/.test(form.value.expiry) &&
    form.value.cvv.length >= 3
  )
})

const selectedTotal = computed(() => {
  const opt = installmentOptions.value.find(o => o.count === form.value.installment)
  return opt?.totalAmount || effectiveAmount.value
})

// Methods
const formatPrice = (amount, currency = 'TRY') => {
  if (!amount && amount !== 0) return '-'
  return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

const formatCardNumber = value => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
  const matches = v.match(/\d{4,16}/g)
  const match = (matches && matches[0]) || ''
  const parts = []
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4))
  }
  return parts.length ? parts.join(' ') : v
}

const lastQueriedBin = ref('')

const onCardNumberInput = async e => {
  form.value.cardNumber = formatCardNumber(e.target.value)

  const cleanNumber = form.value.cardNumber.replace(/\s/g, '')
  const bin = cleanNumber.slice(0, 8)

  if (cleanNumber.length >= 6 && bin !== lastQueriedBin.value) {
    // Query BIN when 6+ digits and BIN changed (works for both typing and autocomplete)
    lastQueriedBin.value = bin
    await queryBin(bin)
  } else if (cleanNumber.length < 6) {
    binInfo.value = null
    cardBrand.value = ''
    dccConversion.value = null
    lastQueriedBin.value = ''
    installmentOptions.value = [
      { count: 1, monthlyAmount: props.amount, totalAmount: props.amount }
    ]
  }
}

const onExpiryInput = e => {
  let v = e.target.value.replace(/[^0-9]/g, '')
  if (v.length > 2) {
    v = v.slice(0, 2) + '/' + v.slice(2, 4)
  }
  form.value.expiry = v
}

const queryBin = async bin => {
  // Use partner-based BIN query (no booking/payment required)
  queryingBin.value = true
  try {
    const result = await paymentService.queryBin(bin, props.amount, props.currency)
    if (result.success && result.data) {
      const data = result.data
      if (data.card) {
        binInfo.value = {
          bankName: data.card.bankName || data.card.bank,
          cardFamily: data.card.cardFamily || data.card.family,
          brand: data.card.brand
        }
        cardBrand.value = data.card.brand
      }
      // DCC: check if currency conversion was applied
      if (data.currencyConversion) {
        dccConversion.value = data.currencyConversion
        // DCC active: force single payment (no installments for currency-converted payments)
        form.value.installment = 1
      } else {
        dccConversion.value = null
      }
      if (data.installments?.length > 0) {
        installmentOptions.value = data.installments.map(inst => ({
          count: inst.count,
          monthlyAmount:
            inst.monthlyAmount ||
            (inst.amount ? Math.round((inst.amount / inst.count) * 100) / 100 : null),
          totalAmount: inst.totalAmount || inst.amount
        }))
      }
    }
  } catch (error) {
    console.error('BIN query failed:', error)
  } finally {
    queryingBin.value = false
  }
}

const getCardLogo = brand => {
  const logos = {
    visa: '/card-logos/visa.svg',
    mastercard: '/card-logos/mastercard.svg',
    amex: '/card-logos/amex.svg',
    troy: '/card-logos/troy.svg'
  }
  return logos[brand?.toLowerCase()] || null
}

const onCardLogoError = e => {
  e.target.style.display = 'none'
}

const handleSubmit = async () => {
  console.log('[CreditCardPaymentForm] handleSubmit called', {
    isValid: isValid.value,
    processing: processing.value,
    mode: props.mode,
    internalBookingId: internalBookingId.value,
    internalPaymentId: internalPaymentId.value
  })

  if (!isValid.value || processing.value) return

  processing.value = true
  emit('processing', true)
  errorMessage.value = ''

  // If in inline mode and no bookingId/paymentId yet, emit request-payment
  if (props.mode === 'inline' && (!internalBookingId.value || !internalPaymentId.value)) {
    console.log('[CreditCardPaymentForm] Emitting request-payment (inline mode, no booking yet)')
    emit('request-payment', {
      card: {
        holder: form.value.cardHolder.toUpperCase(),
        number: form.value.cardNumber.replace(/\s/g, ''),
        expiry: form.value.expiry,
        cvv: form.value.cvv
      },
      installment: form.value.installment
    })
    // Parent will call processPayment with bookingId and paymentId
    return
  }

  // Process payment directly (modal mode or after parent sets bookingId/paymentId)
  console.log('[CreditCardPaymentForm] Calling doProcessPayment directly')
  await doProcessPayment()
}

// Called by parent after booking/payment is created (inline mode)
const processPayment = async (bookingId, paymentId) => {
  console.log('[CreditCardPaymentForm] processPayment called by parent', { bookingId, paymentId })
  internalBookingId.value = bookingId
  internalPaymentId.value = paymentId
  await doProcessPayment()
}

const doProcessPayment = async () => {
  console.log('[CreditCardPaymentForm] doProcessPayment called', {
    bookingId: internalBookingId.value,
    paymentId: internalPaymentId.value
  })

  try {
    const result = await paymentService.processCardPayment(
      internalBookingId.value,
      internalPaymentId.value,
      {
        installment: form.value.installment,
        card: {
          holder: form.value.cardHolder.toUpperCase(),
          number: form.value.cardNumber.replace(/\s/g, ''),
          expiry: form.value.expiry,
          cvv: form.value.cvv
        },
        customer: {
          name: props.customerName,
          email: props.customerEmail,
          phone: props.customerPhone
        }
      }
    )

    console.log('[CreditCardPaymentForm] API result:', result)

    if (result.success && result.data) {
      transactionId.value = result.data.transactionId

      console.log('[CreditCardPaymentForm] requires3D:', result.data.requires3D)
      console.log('[CreditCardPaymentForm] formUrl:', result.data.formUrl)

      if (result.data.requires3D && result.data.formUrl) {
        // Show 3D Secure iframe
        console.log('[CreditCardPaymentForm] Setting showPaymentIframe = true')
        paymentFormUrl.value = result.data.formUrl
        showPaymentIframe.value = true
        iframeLoading.value = true
        startStatusCheck()
        console.log('[CreditCardPaymentForm] showPaymentIframe is now:', showPaymentIframe.value)
        // Don't reset processing here - keep it true while 3D is showing
        return
      } else {
        // Direct success (rare, usually requires 3D)
        toast.success(t('payment.card.success'))
        emit('success', result.data)
      }
    } else {
      throw new Error(result.error || t('payment.card.failed'))
    }
  } catch (error) {
    console.error('[CreditCardPaymentForm] Payment failed:', error)
    errorMessage.value =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      t('payment.card.failed')
    emit('error', { message: errorMessage.value })
  } finally {
    // Only reset processing if we're not showing 3D iframe
    if (!showPaymentIframe.value) {
      processing.value = false
      emit('processing', false)
    }
  }
}

const onIframeLoad = () => {
  iframeLoading.value = false
}

const startStatusCheck = () => {
  console.log('[CreditCardPaymentForm] Starting status check interval')
  // Check status periodically
  statusCheckInterval = setInterval(async () => {
    try {
      console.log('[CreditCardPaymentForm] Checking payment status...')
      const result = await paymentService.getCardPaymentStatus(
        internalBookingId.value,
        internalPaymentId.value
      )
      console.log('[CreditCardPaymentForm] Status check result:', result)
      if (result.success && result.data) {
        const status = result.data.gatewayStatus || result.data.status
        console.log('[CreditCardPaymentForm] Payment status:', status)
        if (status === 'completed') {
          console.log('[CreditCardPaymentForm] Payment COMPLETED - emitting success')
          stopStatusCheck()
          showPaymentIframe.value = false // Close modal
          processing.value = false
          emit('processing', false)
          toast.success(t('payment.card.success'))
          emit('success', result.data)
        } else if (status === 'failed') {
          console.log('[CreditCardPaymentForm] Payment FAILED - emitting error')
          stopStatusCheck()
          showPaymentIframe.value = false // Close modal
          processing.value = false
          emit('processing', false)
          errorMessage.value = t('payment.card.failed')
          emit('error', { message: errorMessage.value })
        }
      }
    } catch (error) {
      console.error('[CreditCardPaymentForm] Status check error:', error)
    }
  }, 3000)
}

const stopStatusCheck = () => {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval)
    statusCheckInterval = null
  }
}

const cancelPayment = () => {
  stopStatusCheck()
  showPaymentIframe.value = false
  paymentFormUrl.value = ''
  processing.value = false
  emit('processing', false)
  emit('cancel')
}

// Reset form state
const resetForm = () => {
  form.value = {
    cardNumber: '',
    cardHolder: props.customerName || '',
    expiry: '',
    cvv: '',
    installment: 1
  }
  errorMessage.value = ''
  binInfo.value = null
  cardBrand.value = ''
  dccConversion.value = null
  lastQueriedBin.value = ''
  installmentOptions.value = [{ count: 1, monthlyAmount: props.amount, totalAmount: props.amount }]
}

// Reset processing state (called by parent when validation fails)
const resetProcessing = () => {
  processing.value = false
  emit('processing', false)
}

// Listen for postMessage from 3D callback
const handleMessage = event => {
  console.log('[CreditCardPaymentForm] Received postMessage:', event.data)
  if (event.data?.type === 'payment_result') {
    console.log('[CreditCardPaymentForm] Payment result via postMessage:', event.data.data)
    stopStatusCheck()
    showPaymentIframe.value = false // Close modal immediately
    processing.value = false
    emit('processing', false)

    const result = event.data.data
    if (result.success) {
      console.log('[CreditCardPaymentForm] postMessage SUCCESS - emitting success')
      toast.success(t('payment.card.success'))
      emit('success', result)
    } else {
      console.log('[CreditCardPaymentForm] postMessage FAILED - emitting error')
      errorMessage.value = result.message || t('payment.card.failed')
      emit('error', { message: errorMessage.value })
    }
  }
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
  // Pre-fill card holder from customer name
  if (props.customerName) {
    form.value.cardHolder = props.customerName.toUpperCase()
  }
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
  stopStatusCheck()
})

// Watch for amount changes
watch(
  () => props.amount,
  newAmount => {
    installmentOptions.value = [{ count: 1, monthlyAmount: newAmount, totalAmount: newAmount }]
  }
)

// Watch for customer name changes
watch(
  () => props.customerName,
  newName => {
    if (newName && !form.value.cardHolder) {
      form.value.cardHolder = newName.toUpperCase()
    }
  }
)

// Watch for prop changes (bookingId/paymentId)
watch(
  () => props.bookingId,
  newVal => {
    internalBookingId.value = newVal
  }
)

watch(
  () => props.paymentId,
  newVal => {
    internalPaymentId.value = newVal
  }
)

// Expose methods and state for parent
defineExpose({
  processPayment,
  resetForm,
  resetProcessing,
  isValid,
  processing,
  getCardData: () => ({
    holder: form.value.cardHolder.toUpperCase(),
    number: form.value.cardNumber.replace(/\s/g, ''),
    expiry: form.value.expiry,
    cvv: form.value.cvv,
    installment: form.value.installment
  })
})
</script>
