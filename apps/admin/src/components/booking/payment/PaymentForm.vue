<template>
  <Modal v-model="show" size="md" :title="$t('payment.addNew')" @close="$emit('close')">
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Payment Type Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
          {{ $t('payment.selectType') }}
        </label>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="type in paymentTypes"
            :key="type.value"
            type="button"
            class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all"
            :class="
              form.type === type.value
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
            "
            @click="form.type = type.value"
          >
            <span
              class="material-icons text-2xl"
              :class="
                form.type === type.value ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
              "
              >{{ type.icon }}</span
            >
            <span
              class="text-sm font-medium text-center"
              :class="
                form.type === type.value
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-gray-600 dark:text-slate-400'
              "
              >{{ $t(`payment.type.${type.value}`) }}</span
            >
          </button>
        </div>
      </div>

      <!-- Amount -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('payment.amount') }}
        </label>
        <div class="relative">
          <input
            v-model.number="form.amount"
            type="number"
            step="0.01"
            min="0"
            :max="remainingAmount"
            class="form-input w-full pr-20"
            :placeholder="formatPrice(remainingAmount, currency)"
            required
          />
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span class="text-gray-500 dark:text-slate-400">{{ currency }}</span>
          </div>
        </div>
        <p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {{ $t('payment.remainingLabel') }}: {{ formatPrice(remainingAmount, currency) }}
        </p>
      </div>

      <!-- Bank Transfer Details -->
      <div
        v-if="form.type === 'bank_transfer'"
        class="space-y-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
      >
        <h4 class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <span class="material-icons text-lg">account_balance</span>
          {{ $t('payment.bankTransfer.details') }}
        </h4>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('payment.bankTransfer.bankName') }}
            </label>
            <input
              v-model="form.bankTransfer.bankName"
              type="text"
              class="form-input w-full"
              :placeholder="$t('payment.bankTransfer.bankNamePlaceholder')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('payment.bankTransfer.reference') }}
            </label>
            <input
              v-model="form.bankTransfer.reference"
              type="text"
              class="form-input w-full"
              :placeholder="$t('payment.bankTransfer.referencePlaceholder')"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('payment.bankTransfer.iban') }}
          </label>
          <input
            v-model="form.bankTransfer.iban"
            type="text"
            class="form-input w-full font-mono"
            placeholder="TR00 0000 0000 0000 0000 0000 00"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('payment.bankTransfer.accountHolder') }}
          </label>
          <input
            v-model="form.bankTransfer.accountHolder"
            type="text"
            class="form-input w-full"
            :placeholder="$t('payment.bankTransfer.accountHolderPlaceholder')"
          />
        </div>

        <!-- Receipt Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('payment.bankTransfer.receipt') }}
          </label>
          <div
            class="border-2 border-dashed rounded-lg p-4 text-center transition-colors"
            :class="
              receiptFile
                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-slate-600 hover:border-purple-400'
            "
          >
            <input
              ref="receiptInput"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              class="hidden"
              @change="handleFileSelect"
            />
            <div v-if="receiptFile" class="flex items-center justify-center gap-2">
              <span class="material-icons text-green-500">check_circle</span>
              <span class="text-sm text-green-700 dark:text-green-300">{{ receiptFile.name }}</span>
              <button
                type="button"
                class="ml-2 text-gray-400 hover:text-red-500"
                @click="removeFile"
              >
                <span class="material-icons text-sm">close</span>
              </button>
            </div>
            <button
              v-else
              type="button"
              class="flex items-center justify-center gap-2 mx-auto text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
              @click="$refs.receiptInput.click()"
            >
              <span class="material-icons">upload_file</span>
              <span>{{ $t('payment.bankTransfer.uploadReceipt') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Credit Card Payment Options -->
      <div v-if="form.type === 'credit_card'" class="space-y-3">
        <!-- Inline Payment Option -->
        <label
          :class="[
            'flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors',
            creditCardOption === 'inline'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-slate-700 hover:border-blue-300'
          ]"
        >
          <input
            v-model="creditCardOption"
            type="radio"
            name="creditCardOption"
            value="inline"
            class="form-radio h-5 w-5 text-blue-600"
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
            creditCardOption === 'payment_link'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-slate-700 hover:border-blue-300'
          ]"
        >
          <input
            v-model="creditCardOption"
            type="radio"
            name="creditCardOption"
            value="payment_link"
            class="form-radio h-5 w-5 text-blue-600"
          />
          <div class="ml-4 flex-1">
            <div class="flex items-center">
              <span class="material-icons text-green-500 mr-2">link</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {{ $t('booking.creditCardOptions.paymentLink') }}
              </span>
              <span class="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                {{ $t('booking.creditCardOptions.recommended') }}
              </span>
            </div>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('booking.creditCardOptions.paymentLinkDescription') }}
            </p>
          </div>
        </label>

        <!-- Notification Options (only for payment_link) -->
        <div v-if="creditCardOption === 'payment_link'" class="ml-12 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
          <p class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            {{ $t('booking.creditCardOptions.sendVia') }}
          </p>
          <div class="flex flex-wrap gap-4">
            <label class="flex items-center cursor-pointer">
              <input
                v-model="sendPaymentLinkEmail"
                type="checkbox"
                class="form-checkbox h-4 w-4 text-blue-600 rounded"
              />
              <span class="ml-2 text-sm text-gray-600 dark:text-slate-400">
                <span class="material-icons text-base align-middle mr-1">email</span>
                {{ $t('booking.creditCardOptions.email') }}
              </span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                v-model="sendPaymentLinkSms"
                type="checkbox"
                class="form-checkbox h-4 w-4 text-blue-600 rounded"
              />
              <span class="ml-2 text-sm text-gray-600 dark:text-slate-400">
                <span class="material-icons text-base align-middle mr-1">sms</span>
                {{ $t('booking.creditCardOptions.sms') }}
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Pay at Check-in Info -->
      <div
        v-if="form.type === 'pay_at_checkin'"
        class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
      >
        <div class="flex items-start gap-3">
          <span class="material-icons text-orange-500">info</span>
          <div>
            <p class="text-sm text-orange-700 dark:text-orange-300">
              {{ $t('payment.payAtCheckin.info') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {{ $t('payment.notes') }}
        </label>
        <textarea
          v-model="form.notes"
          rows="2"
          class="form-input w-full"
          :placeholder="$t('payment.notesPlaceholder')"
        ></textarea>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button class="btn-secondary px-4 py-2" @click="$emit('close')">
          {{ $t('common.cancel') }}
        </button>
        <button class="btn-primary px-4 py-2" :disabled="saving || !isValid" @click="handleSubmit">
          <span v-if="saving" class="flex items-center">
            <span class="material-icons text-sm animate-spin mr-2">refresh</span>
            {{ $t('common.saving') }}
          </span>
          <span v-else>{{ $t('common.save') }}</span>
        </button>
      </div>
    </template>

    <!-- Credit Card Payment Modal -->
    <PaymentCardModal
      v-if="showCardModal"
      v-model="showCardModal"
      :booking-id="booking._id"
      :payment-id="cardPaymentId"
      :amount="form.amount"
      :currency="currency"
      :customer-name="booking.leadGuest?.firstName + ' ' + booking.leadGuest?.lastName"
      :customer-email="booking.leadGuest?.email"
      :customer-phone="booking.leadGuest?.phone"
      @success="handleCardPaymentSuccess"
      @close="handleCardModalClose"
    />
  </Modal>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import PaymentCardModal from './PaymentCardModal.vue'
import paymentService from '@/services/paymentService'
import paymentLinkService from '@/services/paymentLinkService'

const props = defineProps({
  booking: Object,
  remainingAmount: Number,
  currency: {
    type: String,
    default: 'TRY'
  }
})

const emit = defineEmits(['close', 'saved'])

const { t, locale } = useI18n()
const toast = useToast()

const show = ref(true)
const saving = ref(false)
const receiptFile = ref(null)
const receiptInput = ref(null)
const showCardModal = ref(false)
const cardPaymentId = ref(null)

// Credit card options
const creditCardOption = ref('payment_link') // 'inline' or 'payment_link'
const sendPaymentLinkEmail = ref(true)
const sendPaymentLinkSms = ref(false)

const paymentTypes = [
  { value: 'credit_card', icon: 'credit_card' },
  { value: 'bank_transfer', icon: 'account_balance' },
  { value: 'cash', icon: 'payments' },
  { value: 'agency_credit', icon: 'business' },
  { value: 'pay_at_checkin', icon: 'hotel' }
]

const form = reactive({
  type: 'bank_transfer',
  amount: props.remainingAmount || 0,
  notes: '',
  bankTransfer: {
    bankName: '',
    iban: '',
    accountHolder: '',
    reference: ''
  }
})

const isValid = computed(() => {
  if (!form.type || !form.amount || form.amount <= 0) return false
  return true
})

// Format price
const formatPrice = (amount, currency = 'TRY') => {
  if (!amount && amount !== 0) return '-'
  return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

// Handle file select
const handleFileSelect = event => {
  const file = event.target.files[0]
  if (file) {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('payment.bankTransfer.fileTooLarge'))
      return
    }
    receiptFile.value = file
  }
}

// Remove file
const removeFile = () => {
  receiptFile.value = null
  if (receiptInput.value) {
    receiptInput.value.value = ''
  }
}

// Handle submit
const handleSubmit = async () => {
  if (!isValid.value) return

  saving.value = true
  try {
    // Handle credit card with payment link option
    if (form.type === 'credit_card' && creditCardOption.value === 'payment_link') {
      await handlePaymentLinkSubmit()
      return
    }

    // Prepare data
    const data = {
      type: form.type,
      amount: form.amount,
      currency: props.currency,
      notes: form.notes
    }

    // Add bank transfer details
    if (form.type === 'bank_transfer') {
      data.bankTransfer = {
        bankName: form.bankTransfer.bankName,
        iban: form.bankTransfer.iban,
        accountHolder: form.bankTransfer.accountHolder,
        reference: form.bankTransfer.reference
      }
    }

    // Create payment
    const response = await paymentService.addPayment(props.booking._id, data)

    if (response.success) {
      // For credit card inline payments, open the card modal
      if (form.type === 'credit_card' && creditCardOption.value === 'inline') {
        cardPaymentId.value = response.data._id
        showCardModal.value = true
        saving.value = false
        return // Don't close the form yet
      }

      // Upload receipt if exists
      if (receiptFile.value && form.type === 'bank_transfer') {
        try {
          await paymentService.uploadReceipt(
            props.booking._id,
            response.data._id,
            receiptFile.value
          )
        } catch (uploadError) {
          console.error('Receipt upload failed:', uploadError)
          // Don't fail the whole operation, just notify
          toast.warning(t('payment.bankTransfer.receiptUploadFailed'))
        }
      }

      toast.success(t('payment.added'))
      emit('saved')
    }
  } catch (error) {
    console.error('Failed to add payment:', error)
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

// Handle card payment success
const handleCardPaymentSuccess = () => {
  showCardModal.value = false
  toast.success(t('payment.card.success'))
  emit('saved')
}

// Handle card modal close
const handleCardModalClose = () => {
  showCardModal.value = false
  // Keep the form open so user can try again or change payment type
}

// Handle payment link submit
const handlePaymentLinkSubmit = async () => {
  try {
    // Step 1: Create Payment record first (so it appears in payments list)
    const paymentData = {
      type: 'credit_card',
      amount: form.amount,
      currency: props.currency,
      notes: form.notes || 'Ödeme linki gönderildi'
    }

    const paymentResponse = await paymentService.addPayment(props.booking._id, paymentData)

    if (!paymentResponse.success) {
      throw new Error(paymentResponse.message || 'Payment creation failed')
    }

    const paymentId = paymentResponse.data._id

    // Step 2: Create payment link for this payment
    const linkResponse = await paymentService.createPaymentLinkForPayment(
      props.booking._id,
      paymentId,
      {
        sendEmail: sendPaymentLinkEmail.value,
        sendSms: sendPaymentLinkSms.value,
        expiresInDays: 7
      }
    )

    if (linkResponse.success) {
      toast.success(t('booking.creditCardOptions.paymentLinkSentDescription'))
      emit('saved')
    }
  } catch (error) {
    console.error('Failed to create payment link:', error)
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}
</script>
