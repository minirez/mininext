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

      <!-- Credit Card Payment - Opens Card Modal -->
      <div v-if="form.type === 'credit_card'" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div class="flex items-start gap-3">
          <span class="material-icons text-blue-500">credit_card</span>
          <div class="flex-1">
            <p class="text-sm text-blue-700 dark:text-blue-300">
              {{ $t('payment.creditCard.processOnline') }}
            </p>
            <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {{ $t('payment.creditCard.3dSecureRequired') }}
            </p>
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
      // For credit card payments, open the card modal
      if (form.type === 'credit_card') {
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
</script>
