<template>
  <Modal
    v-model="show"
    size="lg"
    :title="$t('payment.card.title')"
    :closeable="!processing && !showPaymentIframe"
    @close="handleClose"
  >
    <!-- 3D Secure Iframe -->
    <div v-if="showPaymentIframe" class="relative">
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
        <div class="flex items-center gap-3">
          <span class="material-icons text-yellow-600 dark:text-yellow-400">security</span>
          <div>
            <p class="font-medium text-yellow-800 dark:text-yellow-200">{{ $t('payment.card.3dSecure') }}</p>
            <p class="text-sm text-yellow-700 dark:text-yellow-300">{{ $t('payment.card.3dSecureInfo') }}</p>
          </div>
        </div>
      </div>
      <div class="relative bg-white dark:bg-slate-800 rounded-lg overflow-hidden" style="min-height: 500px">
        <iframe
          ref="paymentIframe"
          :src="paymentFormUrl"
          class="w-full h-[500px] border-0"
          @load="onIframeLoad"
        ></iframe>
        <div v-if="iframeLoading" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80">
          <span class="material-icons text-4xl text-purple-500 animate-spin">refresh</span>
        </div>
      </div>
      <div class="mt-4 text-center">
        <button
          class="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
          @click="cancelPayment"
        >
          {{ $t('payment.card.cancel3D') }}
        </button>
      </div>
    </div>

    <!-- Card Form -->
    <form v-else class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Amount Display -->
      <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-purple-600 dark:text-purple-300">{{ $t('payment.amount') }}</p>
            <p class="text-2xl font-bold text-purple-700 dark:text-purple-200">
              {{ formatPrice(amount, currency) }}
            </p>
          </div>
          <span class="material-icons text-5xl text-purple-300 dark:text-purple-700">credit_card</span>
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
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400">credit_card</span>
          <!-- Card Logo -->
          <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <img
              v-if="cardBrand"
              :src="getCardLogo(cardBrand)"
              :alt="cardBrand"
              class="h-6 w-auto"
              @error="onCardLogoError"
            />
            <span v-if="queryingBin" class="material-icons text-gray-400 animate-spin text-sm">refresh</span>
          </div>
        </div>
        <!-- BIN Info -->
        <div v-if="binInfo" class="mt-2 text-sm">
          <div class="flex items-center gap-2 text-gray-600 dark:text-slate-400">
            <span class="material-icons text-sm">account_balance</span>
            <span>{{ binInfo.bankName }}</span>
            <span v-if="binInfo.cardFamily" class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">
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
              <span class="material-icons text-sm">{{ showCvv ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Installments -->
      <div v-if="installmentOptions.length > 1">
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          {{ $t('payment.card.installment') }}
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            v-for="opt in installmentOptions"
            :key="opt.count"
            type="button"
            class="p-3 rounded-lg border-2 text-center transition-all"
            :class="form.installment === opt.count
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'"
            @click="form.installment = opt.count"
          >
            <p class="font-medium text-gray-900 dark:text-white">
              {{ opt.count === 1 ? $t('payment.card.singlePayment') : opt.count + ' ' + $t('payment.card.installments') }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ formatPrice(opt.monthlyAmount, currency) }}/{{ $t('payment.card.month') }}
            </p>
            <p v-if="opt.totalAmount > amount" class="text-xs text-orange-600 dark:text-orange-400">
              {{ $t('payment.card.total') }}: {{ formatPrice(opt.totalAmount, currency) }}
            </p>
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center gap-2 text-red-700 dark:text-red-300">
          <span class="material-icons">error</span>
          <p>{{ errorMessage }}</p>
        </div>
      </div>
    </form>

    <template v-if="!showPaymentIframe" #footer>
      <div class="flex justify-between items-center">
        <!-- Secure Payment Badge -->
        <div class="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-sm">
          <span class="material-icons text-green-500">lock</span>
          <span>{{ $t('payment.card.securePayment') }}</span>
        </div>
        <div class="flex gap-3">
          <button class="btn-secondary px-4 py-2" @click="handleClose">
            {{ $t('common.cancel') }}
          </button>
          <button
            class="btn-primary px-6 py-2"
            :disabled="!isValid || processing"
            @click="handleSubmit"
          >
            <span v-if="processing" class="flex items-center">
              <span class="material-icons text-sm animate-spin mr-2">refresh</span>
              {{ $t('payment.card.processing') }}
            </span>
            <span v-else class="flex items-center">
              <span class="material-icons mr-2">payment</span>
              {{ $t('payment.card.pay') }} {{ formatPrice(selectedTotal, currency) }}
            </span>
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import paymentService from '@/services/paymentService'

const props = defineProps({
  modelValue: Boolean,
  bookingId: String,
  paymentId: String,
  amount: Number,
  currency: {
    type: String,
    default: 'TRY'
  },
  customerName: String,
  customerEmail: String,
  customerPhone: String
})

const emit = defineEmits(['update:modelValue', 'close', 'success', 'error'])

const { t, locale } = useI18n()
const toast = useToast()

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

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
const installmentOptions = ref([{ count: 1, monthlyAmount: props.amount, totalAmount: props.amount }])

// 3D Secure
const showPaymentIframe = ref(false)
const paymentFormUrl = ref('')
const iframeLoading = ref(true)
const paymentIframe = ref(null)
const transactionId = ref('')
let statusCheckInterval = null

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
  return opt?.totalAmount || props.amount
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

const onCardNumberInput = async e => {
  form.value.cardNumber = formatCardNumber(e.target.value)

  // Query BIN when 6+ digits
  const cleanNumber = form.value.cardNumber.replace(/\s/g, '')
  if (cleanNumber.length >= 6 && cleanNumber.length <= 8) {
    await queryBin(cleanNumber.slice(0, 8))
  } else if (cleanNumber.length < 6) {
    binInfo.value = null
    cardBrand.value = ''
    installmentOptions.value = [{ count: 1, monthlyAmount: props.amount, totalAmount: props.amount }]
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
  if (!props.bookingId || !props.paymentId) return

  queryingBin.value = true
  try {
    const result = await paymentService.queryCardBin(props.bookingId, props.paymentId, bin)
    if (result.success && result.data) {
      const data = result.data
      if (data.card) {
        binInfo.value = {
          bankName: data.card.bankName,
          cardFamily: data.card.cardFamily,
          brand: data.card.brand
        }
        cardBrand.value = data.card.brand
      }
      if (data.installments?.length > 0) {
        installmentOptions.value = data.installments.map(inst => ({
          count: inst.count,
          monthlyAmount: inst.monthlyAmount,
          totalAmount: inst.totalAmount
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
  if (!isValid.value || processing.value) return

  processing.value = true
  errorMessage.value = ''

  try {
    const result = await paymentService.processCardPayment(props.bookingId, props.paymentId, {
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
    })

    if (result.success && result.data) {
      transactionId.value = result.data.transactionId

      if (result.data.requires3D && result.data.formUrl) {
        // Show 3D Secure iframe
        paymentFormUrl.value = result.data.formUrl
        showPaymentIframe.value = true
        iframeLoading.value = true
        startStatusCheck()
      } else {
        // Direct success (rare, usually requires 3D)
        toast.success(t('payment.card.success'))
        emit('success', result.data)
      }
    } else {
      throw new Error(result.error || t('payment.card.failed'))
    }
  } catch (error) {
    console.error('Payment failed:', error)
    errorMessage.value = error.response?.data?.error || error.message || t('payment.card.failed')
  } finally {
    processing.value = false
  }
}

const onIframeLoad = () => {
  iframeLoading.value = false
}

const startStatusCheck = () => {
  // Check status periodically
  statusCheckInterval = setInterval(async () => {
    try {
      const result = await paymentService.getCardPaymentStatus(props.bookingId, props.paymentId)
      if (result.success && result.data) {
        const status = result.data.gatewayStatus || result.data.status
        if (status === 'completed') {
          stopStatusCheck()
          toast.success(t('payment.card.success'))
          emit('success', result.data)
        } else if (status === 'failed') {
          stopStatusCheck()
          errorMessage.value = t('payment.card.failed')
          showPaymentIframe.value = false
        }
      }
    } catch (error) {
      console.error('Status check error:', error)
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
}

const handleClose = () => {
  if (processing.value || showPaymentIframe.value) return
  stopStatusCheck()
  emit('close')
}

// Listen for postMessage from 3D callback
const handleMessage = event => {
  if (event.data?.type === 'payment_result') {
    stopStatusCheck()
    const result = event.data.data
    if (result.success) {
      toast.success(t('payment.card.success'))
      emit('success', result)
    } else {
      errorMessage.value = result.message || t('payment.card.failed')
      showPaymentIframe.value = false
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
watch(() => props.amount, newAmount => {
  installmentOptions.value = [{ count: 1, monthlyAmount: newAmount, totalAmount: newAmount }]
})
</script>
