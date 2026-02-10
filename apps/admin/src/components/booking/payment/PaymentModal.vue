<template>
  <Modal
    v-model="show"
    size="lg"
    :title="$t('payment.title') + ' - ' + booking?.bookingNumber"
    @close="$emit('close')"
  >
    <!-- Summary Header -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400 uppercase">
              {{ $t('payment.total') }}
            </p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ formatPrice(summary.grandTotal, summary.currency) }}
            </p>
          </div>
          <div class="h-8 w-px bg-gray-300 dark:bg-slate-600"></div>
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400 uppercase">
              {{ $t('payment.paid') }}
            </p>
            <p class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ formatPrice(summary.paidAmount, summary.currency) }}
            </p>
          </div>
          <div class="h-8 w-px bg-gray-300 dark:bg-slate-600"></div>
          <div>
            <p class="text-xs text-gray-500 dark:text-slate-400 uppercase">
              {{ $t('payment.remaining') }}
            </p>
            <p
              class="text-lg font-bold"
              :class="
                summary.remainingAmount > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-slate-300'
              "
            >
              {{ formatPrice(summary.remainingAmount, summary.currency) }}
            </p>
          </div>
        </div>
        <PaymentStatusBadge :status="booking?.payment?.status || 'pending'" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="material-icons text-4xl text-purple-500 animate-spin">refresh</span>
    </div>

    <!-- Payments List -->
    <div v-else-if="payments.length > 0" class="space-y-3 mb-6">
      <div
        v-for="payment in payments"
        :key="payment._id"
        class="border border-gray-200 dark:border-slate-700 rounded-lg p-4"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3">
            <!-- Type Icon -->
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="getTypeIconClass(payment.type)"
            >
              <span class="material-icons text-xl">{{ getTypeIcon(payment.type) }}</span>
            </div>
            <!-- Details -->
            <div>
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ $t(`payment.type.${payment.type}`) }}
                </p>
                <PaymentStatusBadge :status="payment.status" />
              </div>
              <p class="text-lg font-bold text-gray-900 dark:text-white mt-1">
                <template v-if="payment.cardDetails?.currencyConversion">
                  {{
                    formatPrice(
                      payment.cardDetails.currencyConversion.originalAmount,
                      payment.cardDetails.currencyConversion.originalCurrency
                    )
                  }}
                </template>
                <template v-else>
                  {{ formatPrice(payment.amount, payment.currency) }}
                </template>
              </p>
              <!-- Currency conversion info (DCC) -->
              <p
                v-if="payment.cardDetails?.currencyConversion"
                class="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1"
              >
                <span class="material-icons text-xs">currency_exchange</span>
                {{
                  formatPrice(payment.cardDetails.currencyConversion.convertedAmount, 'TRY')
                }}
                olarak ödendi
                <span class="text-gray-400 dark:text-slate-500"
                  >(1 {{ payment.cardDetails.currencyConversion.originalCurrency }} =
                  {{ payment.cardDetails.currencyConversion.exchangeRate }} ₺)</span
                >
              </p>
              <!-- Bank Transfer Details -->
              <div
                v-if="payment.type === 'bank_transfer' && payment.bankTransfer"
                class="text-sm text-gray-500 dark:text-slate-400 mt-1"
              >
                <span v-if="payment.bankTransfer.bankName">{{
                  payment.bankTransfer.bankName
                }}</span>
                <span v-if="payment.bankTransfer.reference">
                  | Ref: {{ payment.bankTransfer.reference }}</span
                >
              </div>
              <!-- Notes -->
              <p v-if="payment.notes" class="text-sm text-gray-500 dark:text-slate-400 mt-1">
                {{ payment.notes }}
              </p>
              <!-- Date -->
              <p class="text-xs text-gray-400 dark:text-slate-500 mt-2 flex items-center">
                <span class="material-icons text-xs mr-1">schedule</span>
                {{ formatDateTime(payment.completedAt || payment.createdAt) }}
                <span v-if="payment.createdBy" class="ml-2">
                  - {{ payment.createdBy.firstName }} {{ payment.createdBy.lastName }}
                </span>
              </p>
            </div>
          </div>
          <!-- Actions -->
          <div class="flex items-center gap-2">
            <!-- Send Payment Link (for pending credit card payments) -->
            <button
              v-if="payment.type === 'credit_card' && payment.status === 'pending'"
              class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
              :title="$t('payment.sendLink.tooltip')"
              @click="handleSendPaymentLink(payment)"
            >
              <span class="material-icons text-sm mr-1">link</span>
              {{ $t('payment.sendLink.button') }}
            </button>
            <!-- Confirm Button (for pending bank transfers, pay at check-in, and cash payments) -->
            <button
              v-if="
                (payment.type === 'bank_transfer' ||
                  payment.type === 'pay_at_checkin' ||
                  payment.type === 'cash') &&
                payment.status === 'pending'
              "
              class="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors"
              @click="handleConfirm(payment)"
            >
              <span class="material-icons text-sm mr-1">check</span>
              {{ $t('payment.confirm.button') }}
            </button>
            <!-- Refund Button (for completed payments) -->
            <button
              v-if="payment.status === 'completed'"
              class="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors"
              @click="handleRefund(payment)"
            >
              <span class="material-icons text-sm mr-1">undo</span>
              {{ $t('payment.refund.button') }}
            </button>
            <!-- View Receipt -->
            <button
              v-if="payment.bankTransfer?.receiptUrl"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              :title="$t('payment.bankTransfer.receipt')"
              @click="viewReceipt(payment)"
            >
              <span class="material-icons text-sm">receipt_long</span>
            </button>
            <!-- Edit (only pending) -->
            <button
              v-if="payment.status === 'pending'"
              class="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              :title="$t('common.edit')"
              @click="handleEdit(payment)"
            >
              <span class="material-icons text-sm">edit</span>
            </button>
            <!-- Delete (only pending) -->
            <button
              v-if="payment.status === 'pending'"
              class="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              :title="$t('common.delete')"
              @click="handleDelete(payment)"
            >
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <span class="material-icons text-5xl text-gray-300 dark:text-slate-600">payments</span>
      <p class="mt-4 text-gray-500 dark:text-slate-400">{{ $t('payment.noPayments') }}</p>
    </div>

    <!-- Add Payment Button -->
    <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
      <button
        class="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        @click="showAddForm = true"
      >
        <span class="material-icons">add</span>
        {{ $t('payment.addNew') }}
      </button>
    </div>

    <!-- Add Payment Form Modal -->
    <PaymentForm
      v-if="showAddForm"
      :booking="booking"
      :remaining-amount="summary.remainingAmount"
      :currency="summary.currency"
      @close="showAddForm = false"
      @saved="handlePaymentSaved"
    />

    <!-- Confirm Modal -->
    <Modal v-model="showConfirmModal" size="sm" :title="$t('payment.confirm.title')">
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('payment.confirm.description') }}
      </p>
      <div class="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
        <p class="font-medium text-gray-900 dark:text-white">
          {{ formatPrice(selectedPayment?.amount, selectedPayment?.currency) }}
        </p>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t(`payment.type.${selectedPayment?.type}`) }}
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn-secondary px-4 py-2" @click="showConfirmModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button class="btn-primary px-4 py-2" :disabled="confirming" @click="confirmPayment">
            <span v-if="confirming" class="flex items-center">
              <span class="material-icons text-sm animate-spin mr-2">refresh</span>
              {{ $t('common.loading') }}
            </span>
            <span v-else>{{ $t('common.confirm') }}</span>
          </button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" size="sm" :title="$t('payment.delete.title')">
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('payment.delete.description') }}
      </p>
      <div
        class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
      >
        <p class="font-medium text-gray-900 dark:text-white">
          {{ formatPrice(selectedPayment?.amount, selectedPayment?.currency) }}
        </p>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t(`payment.type.${selectedPayment?.type}`) }}
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn-secondary px-4 py-2" @click="showDeleteModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button class="btn-danger px-4 py-2" :disabled="deleting" @click="deletePayment">
            <span v-if="deleting" class="flex items-center">
              <span class="material-icons text-sm animate-spin mr-2">refresh</span>
              {{ $t('common.loading') }}
            </span>
            <span v-else>{{ $t('common.delete') }}</span>
          </button>
        </div>
      </template>
    </Modal>

    <!-- Refund Modal -->
    <Modal v-model="showRefundModal" size="sm" :title="$t('payment.refund.title')">
      <div class="space-y-4">
        <div class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('payment.refund.originalAmount') }}
          </p>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ formatPrice(selectedPayment?.amount, selectedPayment?.currency) }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('payment.refund.amount') }} *
          </label>
          <div class="relative">
            <input
              v-model.number="refundForm.amount"
              type="number"
              step="0.01"
              min="0"
              :max="selectedPayment?.amount"
              class="form-input w-full pr-16"
              required
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span class="text-gray-500 dark:text-slate-400">{{ selectedPayment?.currency }}</span>
            </div>
          </div>
          <div class="flex gap-2 mt-2">
            <button
              type="button"
              class="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
              @click="refundForm.amount = selectedPayment?.amount"
            >
              {{ $t('payment.refund.fullRefund') }}
            </button>
            <button
              type="button"
              class="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
              @click="refundForm.amount = (selectedPayment?.amount || 0) / 2"
            >
              50%
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('payment.refund.reason') }} *
          </label>
          <textarea
            v-model="refundForm.reason"
            rows="3"
            class="form-input w-full"
            :placeholder="$t('payment.refund.reasonPlaceholder')"
            required
          ></textarea>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn-secondary px-4 py-2" @click="showRefundModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button
            class="btn-danger px-4 py-2"
            :disabled="refunding || !refundForm.amount || !refundForm.reason"
            @click="processRefund"
          >
            <span v-if="refunding" class="flex items-center">
              <span class="material-icons text-sm animate-spin mr-2">refresh</span>
              {{ $t('common.loading') }}
            </span>
            <span v-else>{{ $t('payment.refund.process') }}</span>
          </button>
        </div>
      </template>
    </Modal>

    <!-- Edit Payment Modal -->
    <Modal v-model="showEditModal" size="md" :title="$t('payment.edit.title')">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('payment.amount') }} *
          </label>
          <div class="relative">
            <input
              v-model.number="editForm.amount"
              type="number"
              step="0.01"
              min="0"
              class="form-input w-full pr-16"
              required
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span class="text-gray-500 dark:text-slate-400">{{ selectedPayment?.currency }}</span>
            </div>
          </div>
        </div>

        <!-- Bank Transfer Details (if applicable) -->
        <div
          v-if="selectedPayment?.type === 'bank_transfer'"
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
                v-model="editForm.bankTransfer.bankName"
                type="text"
                class="form-input w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('payment.bankTransfer.reference') }}
              </label>
              <input
                v-model="editForm.bankTransfer.reference"
                type="text"
                class="form-input w-full"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('payment.bankTransfer.iban') }}
            </label>
            <input
              v-model="editForm.bankTransfer.iban"
              type="text"
              class="form-input w-full font-mono"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('payment.notes') }}
          </label>
          <textarea
            v-model="editForm.notes"
            rows="2"
            class="form-input w-full"
            :placeholder="$t('payment.notesPlaceholder')"
          ></textarea>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn-secondary px-4 py-2" @click="showEditModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button
            class="btn-primary px-4 py-2"
            :disabled="editing || !editForm.amount"
            @click="updatePayment"
          >
            <span v-if="editing" class="flex items-center">
              <span class="material-icons text-sm animate-spin mr-2">refresh</span>
              {{ $t('common.saving') }}
            </span>
            <span v-else>{{ $t('common.save') }}</span>
          </button>
        </div>
      </template>
    </Modal>

    <!-- Receipt Lightbox -->
    <Lightbox v-model="showReceiptLightbox" :url="receiptUrl" :title="receiptTitle" />

    <!-- Send Payment Link Modal -->
    <Modal v-model="showPaymentLinkModal" size="md" :title="$t('payment.sendLink.title')">
      <div class="space-y-4">
        <!-- Payment Info -->
        <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('payment.amount') }}
          </p>
          <p class="font-bold text-lg text-gray-900 dark:text-white">
            {{ formatPrice(selectedPayment?.amount, selectedPayment?.currency) }}
          </p>
        </div>

        <!-- Options -->
        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="paymentLinkForm.sendEmail" type="checkbox" class="form-checkbox" />
            <span class="text-gray-700 dark:text-slate-300">
              <span class="material-icons text-sm mr-1 align-middle">email</span>
              {{ $t('payment.sendLink.sendEmail') }}
            </span>
          </label>
          <!-- Email input when email is checked -->
          <div v-if="paymentLinkForm.sendEmail" class="ml-8">
            <input
              v-model="paymentLinkForm.email"
              type="email"
              class="form-input w-full text-sm"
              :placeholder="$t('payment.sendLink.emailPlaceholder')"
            />
          </div>
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="paymentLinkForm.sendSms" type="checkbox" class="form-checkbox" />
            <span class="text-gray-700 dark:text-slate-300">
              <span class="material-icons text-sm mr-1 align-middle">sms</span>
              {{ $t('payment.sendLink.sendSms') }}
            </span>
          </label>
          <!-- Phone input when SMS is checked -->
          <div v-if="paymentLinkForm.sendSms" class="ml-8">
            <PhoneInput
              v-model="paymentLinkForm.phone"
              :placeholder="$t('payment.sendLink.phonePlaceholder')"
              class="text-sm"
            />
          </div>
        </div>

        <!-- Expiry -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('payment.sendLink.expiresIn') }}
          </label>
          <select v-model="paymentLinkForm.expiresInDays" class="form-select w-full">
            <option :value="1">1 {{ $t('common.day') }}</option>
            <option :value="3">3 {{ $t('common.days') }}</option>
            <option :value="7">7 {{ $t('common.days') }}</option>
            <option :value="14">14 {{ $t('common.days') }}</option>
            <option :value="30">30 {{ $t('common.days') }}</option>
          </select>
        </div>

        <!-- Generated Link (if created) -->
        <div
          v-if="generatedPaymentLink"
          class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <p class="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
            {{ $t('payment.sendLink.linkCreated') }}
          </p>
          <div class="flex items-center gap-2">
            <input
              type="text"
              :value="generatedPaymentLink"
              readonly
              class="form-input flex-1 text-sm font-mono"
            />
            <button
              class="btn-secondary px-3 py-2"
              :title="$t('common.copy')"
              @click="copyPaymentLink"
            >
              <span class="material-icons text-sm">content_copy</span>
            </button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn-secondary px-4 py-2" @click="showPaymentLinkModal = false">
            {{ generatedPaymentLink ? $t('common.close') : $t('common.cancel') }}
          </button>
          <button
            v-if="!generatedPaymentLink"
            class="btn-primary px-4 py-2"
            :disabled="creatingPaymentLink"
            @click="createPaymentLink"
          >
            <span v-if="creatingPaymentLink" class="flex items-center">
              <span class="material-icons text-sm animate-spin mr-2">refresh</span>
              {{ $t('common.loading') }}
            </span>
            <span v-else>{{ $t('payment.sendLink.create') }}</span>
          </button>
        </div>
      </template>
    </Modal>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import Lightbox from '@/components/common/Lightbox.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import PaymentStatusBadge from './PaymentStatusBadge.vue'
import PaymentForm from './PaymentForm.vue'
import paymentService from '@/services/paymentService'

const props = defineProps({
  modelValue: Boolean,
  booking: Object
})

const emit = defineEmits(['update:modelValue', 'close', 'updated'])

const { t, locale } = useI18n()
const toast = useToast()

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const loading = ref(false)
const payments = ref([])
const summary = ref({
  grandTotal: 0,
  paidAmount: 0,
  pendingAmount: 0,
  remainingAmount: 0,
  currency: 'TRY'
})

const showAddForm = ref(false)
const showConfirmModal = ref(false)
const showDeleteModal = ref(false)
const showRefundModal = ref(false)
const showEditModal = ref(false)
const showReceiptLightbox = ref(false)
const showPaymentLinkModal = ref(false)
const receiptUrl = ref('')
const receiptTitle = ref('')
const selectedPayment = ref(null)
const confirming = ref(false)
const deleting = ref(false)
const refunding = ref(false)
const editing = ref(false)
const creatingPaymentLink = ref(false)
const generatedPaymentLink = ref('')

// Refund form
const refundForm = reactive({
  amount: 0,
  reason: ''
})

// Payment link form
const paymentLinkForm = reactive({
  sendEmail: false,
  sendSms: false,
  email: '',
  phone: '',
  expiresInDays: 7
})

// Edit form
const editForm = reactive({
  amount: 0,
  notes: '',
  bankTransfer: {
    bankName: '',
    iban: '',
    reference: ''
  }
})

// Fetch payments
const fetchPayments = async () => {
  if (!props.booking?._id) return

  loading.value = true
  try {
    const response = await paymentService.getPayments(props.booking._id)
    if (response.success) {
      payments.value = response.data.payments
      summary.value = response.data.summary
    }
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    toast.error(t('common.fetchError'))
  } finally {
    loading.value = false
  }
}

// Handle payment saved
const handlePaymentSaved = () => {
  showAddForm.value = false
  fetchPayments()
  emit('updated')
}

// Handle confirm
const handleConfirm = payment => {
  selectedPayment.value = payment
  showConfirmModal.value = true
}

// Confirm payment
const confirmPayment = async () => {
  if (!selectedPayment.value) return

  confirming.value = true
  try {
    await paymentService.confirmPayment(props.booking._id, selectedPayment.value._id)
    toast.success(t('payment.confirmed'))
    showConfirmModal.value = false
    fetchPayments()
    emit('updated')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    confirming.value = false
  }
}

// Handle delete
const handleDelete = payment => {
  selectedPayment.value = payment
  showDeleteModal.value = true
}

// Delete payment
const deletePayment = async () => {
  if (!selectedPayment.value) return

  deleting.value = true
  try {
    await paymentService.cancelPayment(props.booking._id, selectedPayment.value._id)
    toast.success(t('common.deleted'))
    showDeleteModal.value = false
    fetchPayments()
    emit('updated')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    deleting.value = false
  }
}

// Handle refund
const handleRefund = payment => {
  selectedPayment.value = payment
  refundForm.amount = payment.amount
  refundForm.reason = ''
  showRefundModal.value = true
}

// Process refund
const processRefund = async () => {
  if (!selectedPayment.value || !refundForm.amount || !refundForm.reason) return

  refunding.value = true
  try {
    await paymentService.refundPayment(props.booking._id, selectedPayment.value._id, {
      amount: refundForm.amount,
      reason: refundForm.reason
    })
    toast.success(t('payment.refund.success'))
    showRefundModal.value = false
    fetchPayments()
    emit('updated')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    refunding.value = false
  }
}

// Handle edit
const handleEdit = payment => {
  selectedPayment.value = payment
  editForm.amount = payment.amount
  editForm.notes = payment.notes || ''
  if (payment.type === 'bank_transfer' && payment.bankTransfer) {
    editForm.bankTransfer.bankName = payment.bankTransfer.bankName || ''
    editForm.bankTransfer.iban = payment.bankTransfer.iban || ''
    editForm.bankTransfer.reference = payment.bankTransfer.reference || ''
  }
  showEditModal.value = true
}

// Update payment
const updatePayment = async () => {
  if (!selectedPayment.value || !editForm.amount) return

  editing.value = true
  try {
    const data = {
      amount: editForm.amount,
      notes: editForm.notes
    }
    if (selectedPayment.value.type === 'bank_transfer') {
      data.bankTransfer = editForm.bankTransfer
    }
    await paymentService.updatePayment(props.booking._id, selectedPayment.value._id, data)
    toast.success(t('common.saved'))
    showEditModal.value = false
    fetchPayments()
    emit('updated')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    editing.value = false
  }
}

// View receipt
const viewReceipt = payment => {
  if (payment.bankTransfer?.receiptUrl) {
    // Use API endpoint for authenticated access (apiClient adds /api prefix)
    receiptUrl.value = `/bookings/${props.booking._id}/payments/${payment._id}/receipt`
    // Extract filename from receiptUrl for Lightbox to detect file type
    const filename = payment.bankTransfer.receiptUrl.split('/').pop()
    receiptTitle.value = filename || t('payment.bankTransfer.receipt')
    showReceiptLightbox.value = true
  }
}

// Handle send payment link
const handleSendPaymentLink = payment => {
  selectedPayment.value = payment
  generatedPaymentLink.value = ''
  paymentLinkForm.sendEmail = true
  paymentLinkForm.sendSms = false
  paymentLinkForm.email = props.booking?.contact?.email || ''
  paymentLinkForm.phone = props.booking?.contact?.phone || ''
  paymentLinkForm.expiresInDays = 7
  showPaymentLinkModal.value = true
}

// Create payment link
const createPaymentLink = async () => {
  if (!selectedPayment.value) return

  creatingPaymentLink.value = true
  try {
    const response = await paymentService.createPaymentLinkForPayment(
      props.booking._id,
      selectedPayment.value._id,
      {
        sendEmail: paymentLinkForm.sendEmail,
        sendSms: paymentLinkForm.sendSms,
        email: paymentLinkForm.email,
        phone: paymentLinkForm.phone,
        expiresInDays: paymentLinkForm.expiresInDays
      }
    )
    if (response.success) {
      generatedPaymentLink.value = response.data.paymentUrl
      toast.success(t('payment.sendLink.success'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    creatingPaymentLink.value = false
  }
}

// Copy payment link
const copyPaymentLink = async () => {
  if (!generatedPaymentLink.value) return

  try {
    await navigator.clipboard.writeText(generatedPaymentLink.value)
    toast.success(t('common.copied'))
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = generatedPaymentLink.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    toast.success(t('common.copied'))
  }
}

// Get type icon
const getTypeIcon = type => {
  const icons = {
    credit_card: 'credit_card',
    bank_transfer: 'account_balance',
    cash: 'payments',
    agency_credit: 'business',
    pay_at_checkin: 'hotel'
  }
  return icons[type] || 'payment'
}

// Get type icon class
const getTypeIconClass = type => {
  const classes = {
    credit_card: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    bank_transfer: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    cash: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    agency_credit: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    pay_at_checkin: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
  }
  return classes[type] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
}

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

// Format date time
const formatDateTime = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Watch for booking changes
watch(
  () => props.booking?._id,
  () => {
    if (props.modelValue && props.booking?._id) {
      fetchPayments()
    }
  },
  { immediate: true }
)

// Watch for modal open
watch(
  () => props.modelValue,
  val => {
    if (val && props.booking?._id) {
      fetchPayments()
    }
  }
)
</script>
