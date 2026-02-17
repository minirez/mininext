<template>
  <div class="mt-4 space-y-4">
    <!-- Payment Option Selection -->
    <div class="space-y-3">
      <!-- Inline Payment Option -->
      <label
        :class="[
          'flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors',
          modelValue === 'inline'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-slate-700 hover:border-blue-300'
        ]"
      >
        <input
          type="radio"
          name="creditCardOption"
          value="inline"
          :checked="modelValue === 'inline'"
          class="form-radio h-5 w-5 text-blue-600"
          @change="$emit('update:modelValue', 'inline')"
        />
        <div class="ml-4 flex-1">
          <div class="flex items-center">
            <span class="material-icons text-blue-500 mr-2">credit_card</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ $t('booking.creditCardOptions.inline') }}
            </span>
          </div>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('booking.creditCardOptions.inlineDescription') }}
          </p>
        </div>
      </label>

      <!-- Payment Link Option -->
      <label
        :class="[
          'flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors',
          modelValue === 'payment_link'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-slate-700 hover:border-blue-300'
        ]"
      >
        <input
          type="radio"
          name="creditCardOption"
          value="payment_link"
          :checked="modelValue === 'payment_link'"
          class="form-radio h-5 w-5 text-blue-600"
          @change="$emit('update:modelValue', 'payment_link')"
        />
        <div class="ml-4 flex-1">
          <div class="flex items-center">
            <span class="material-icons text-green-500 mr-2">link</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ $t('booking.creditCardOptions.paymentLink') }}
            </span>
            <span
              class="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full"
            >
              {{ $t('booking.creditCardOptions.recommended') }}
            </span>
          </div>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('booking.creditCardOptions.paymentLinkDescription') }}
          </p>
        </div>
      </label>
    </div>

    <!-- Inline Card Form (when inline is selected) -->
    <div
      v-if="modelValue === 'inline'"
      class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden"
    >
      <div class="p-4">
        <CreditCardPaymentForm
          ref="paymentFormRef"
          :amount="amount"
          :currency="currency"
          :customer-name="customerName"
          :customer-email="customerEmail"
          :customer-phone="customerPhone"
          :show-amount-display="true"
          :show-submit-button="true"
          mode="inline"
          @request-payment="handleRequestPayment"
          @success="handlePaymentSuccess"
          @error="handlePaymentError"
          @cancel="handlePaymentCancel"
          @processing="handleProcessing"
        />
      </div>
    </div>

    <!-- Notification Options (only for payment_link) -->
    <div
      v-if="modelValue === 'payment_link'"
      class="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg"
    >
      <p class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
        {{ $t('booking.creditCardOptions.sendVia') }}
      </p>
      <div class="flex flex-wrap gap-4">
        <label class="flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="sendEmail"
            class="form-checkbox h-4 w-4 text-blue-600 rounded"
            @change="$emit('update:sendEmail', $event.target.checked)"
          />
          <span class="ml-2 text-sm text-gray-600 dark:text-slate-400">
            <span class="material-icons text-base align-middle mr-1">email</span>
            {{ $t('booking.creditCardOptions.email') }}
          </span>
        </label>
        <label class="flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="sendSms"
            class="form-checkbox h-4 w-4 text-blue-600 rounded"
            @change="$emit('update:sendSms', $event.target.checked)"
          />
          <span class="ml-2 text-sm text-gray-600 dark:text-slate-400">
            <span class="material-icons text-base align-middle mr-1">sms</span>
            {{ $t('booking.creditCardOptions.sms') }}
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CreditCardPaymentForm from '@/components/booking/payment/CreditCardPaymentForm.vue'

defineProps({
  modelValue: {
    type: String,
    default: 'payment_link'
  },
  sendEmail: {
    type: Boolean,
    default: true
  },
  sendSms: {
    type: Boolean,
    default: false
  },
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'TRY'
  },
  customerName: {
    type: String,
    default: ''
  },
  customerEmail: {
    type: String,
    default: ''
  },
  customerPhone: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'update:modelValue',
  'update:sendEmail',
  'update:sendSms',
  'payment-start',
  'payment-success',
  'payment-error'
])

const paymentFormRef = ref(null)

// Handle request-payment from CreditCardPaymentForm (inline mode)
// This is emitted when user clicks "Pay" but booking/payment doesn't exist yet
const handleRequestPayment = paymentData => {
  // Emit to parent (BookingLayout) to create booking + payment, then call processPayment
  emit('payment-start', paymentData)
}

const handlePaymentSuccess = result => {
  emit('payment-success', result)
}

const handlePaymentError = error => {
  emit('payment-error', error.message || error)
}

const handlePaymentCancel = () => {
  emit('payment-error', 'cancelled')
}

const handleProcessing = () => {
  // Parent may want to show loading state
}

// Called by parent after booking/payment is created
const processPayment = async (bookingId, paymentId) => {
  console.log('[CreditCardPaymentOptions] processPayment called', {
    bookingId,
    paymentId,
    hasRef: !!paymentFormRef.value
  })
  if (paymentFormRef.value) {
    await paymentFormRef.value.processPayment(bookingId, paymentId)
  } else {
    console.error('[CreditCardPaymentOptions] paymentFormRef is null!')
  }
}

// Reset processing state (called by parent when validation fails)
const resetProcessing = () => {
  if (paymentFormRef.value) {
    paymentFormRef.value.resetProcessing()
  }
}

// Expose methods and state for parent
defineExpose({
  processPayment,
  resetProcessing,
  isValid: () => paymentFormRef.value?.isValid ?? false,
  processing: () => paymentFormRef.value?.processing ?? false,
  getCardData: () => paymentFormRef.value?.getCardData?.() || null
})
</script>
