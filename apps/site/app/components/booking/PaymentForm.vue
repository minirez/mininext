<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 mb-6">{{ $t('booking.payment') }}</h2>

    <form @submit.prevent="handlePayment" class="space-y-6">
      <!-- Payment method selection (card-style) -->
      <div class="bg-white border border-gray-200 rounded-xl p-6">
        <h3 class="font-semibold text-gray-800 mb-4">{{ $t('booking.paymentMethod') }}</h3>
        <div class="space-y-3">
          <!-- Credit Card -->
          <label
            class="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all"
            :class="
              bookingStore.paymentMethod === 'creditCard'
                ? 'border-site-primary bg-site-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            "
          >
            <input
              type="radio"
              v-model="bookingStore.paymentMethod"
              value="creditCard"
              class="sr-only"
            />
            <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <svg
                class="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
            </div>
            <div class="flex-1">
              <span class="font-medium text-sm text-gray-900">{{ $t('booking.creditCard') }}</span>
              <p class="text-xs text-gray-500">{{ $t('booking.paymentMethodDesc.creditCard') }}</p>
            </div>
            <div v-if="bookingStore.paymentMethod === 'creditCard'" class="text-site-primary">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </label>

          <!-- Pay at Hotel -->
          <label
            v-if="bookingStore.paymentTerms?.payAtHotel"
            class="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all"
            :class="
              bookingStore.paymentMethod === 'payAtHotel'
                ? 'border-site-primary bg-site-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            "
          >
            <input
              type="radio"
              v-model="bookingStore.paymentMethod"
              value="payAtHotel"
              class="sr-only"
            />
            <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <svg
                class="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0H21"
                />
              </svg>
            </div>
            <div class="flex-1">
              <span class="font-medium text-sm text-gray-900">{{ $t('booking.payAtHotel') }}</span>
              <p class="text-xs text-gray-500">{{ $t('booking.paymentMethodDesc.payAtHotel') }}</p>
            </div>
            <div v-if="bookingStore.paymentMethod === 'payAtHotel'" class="text-site-primary">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </label>

          <!-- Bank Transfer -->
          <label
            v-if="showBankTransfer"
            class="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all"
            :class="
              bookingStore.paymentMethod === 'bankTransfer'
                ? 'border-site-primary bg-site-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            "
          >
            <input
              type="radio"
              v-model="bookingStore.paymentMethod"
              value="bankTransfer"
              class="sr-only"
            />
            <div
              class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0"
            >
              <svg
                class="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
                />
              </svg>
            </div>
            <div class="flex-1">
              <span class="font-medium text-sm text-gray-900">{{
                $t('booking.bankTransfer')
              }}</span>
              <p class="text-xs text-gray-500">
                {{
                  bookingStore.bankTransferDiscount > 0
                    ? $t('booking.paymentMethodDesc.bankTransferDiscount', {
                        discount: bookingStore.bankTransferDiscount
                      })
                    : $t('booking.paymentMethodDesc.bankTransfer')
                }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="bookingStore.bankTransferDiscount > 0"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
              >
                %{{ bookingStore.bankTransferDiscount }}
              </span>
              <div v-if="bookingStore.paymentMethod === 'bankTransfer'" class="text-site-primary">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Credit card form -->
      <div
        v-if="bookingStore.paymentMethod === 'creditCard'"
        class="bg-white border border-gray-200 rounded-xl p-6"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Card holder -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.cardHolder') }} *</label
            >
            <input
              v-model="bookingStore.card.holder"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary text-sm"
            />
          </div>

          <!-- Card number with brand icon -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.cardNumber') }} *</label
            >
            <div class="relative">
              <input
                ref="cardNumberRef"
                :value="cardNumberFormatted"
                type="text"
                required
                inputmode="numeric"
                maxlength="19"
                placeholder="0000 0000 0000 0000"
                @input="onCardNumberInput"
                @keydown="numericKeydown"
                class="w-full px-3 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary font-mono text-sm"
                :class="{
                  'border-red-300': cardNumberError
                }"
              />
              <!-- Brand icon + BIN info -->
              <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span
                  v-if="binLoading"
                  class="w-4 h-4 border-2 border-gray-300 border-t-site-primary rounded-full animate-spin"
                />
                <span
                  v-if="bookingStore.binInfo?.bankName"
                  class="text-[10px] text-gray-400 max-w-20 truncate"
                >
                  {{ bookingStore.binInfo.bankName }}
                </span>
                <!-- Card brand SVG -->
                <component v-if="cardBrandComponent" :is="cardBrandComponent" class="h-6" />
              </div>
            </div>
            <p v-if="cardNumberError" class="text-xs text-red-500 mt-1">{{ cardNumberError }}</p>
          </div>

          <!-- Expiry -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.expiryDate') }} *</label
            >
            <input
              ref="expiryRef"
              :value="expiryFormatted"
              type="text"
              required
              inputmode="numeric"
              maxlength="5"
              placeholder="MM/YY"
              @input="onExpiryInput"
              @keydown="numericKeydown"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary font-mono text-sm"
              :class="{ 'border-red-300': isCardExpired }"
            />
            <p v-if="isCardExpired" class="text-xs text-red-500 mt-1">
              {{ $t('booking.cardExpired') }}
            </p>
          </div>

          <!-- CVV -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.cvv') }} *</label
            >
            <input
              ref="cvvRef"
              v-model="bookingStore.card.cvv"
              type="password"
              required
              inputmode="numeric"
              maxlength="4"
              placeholder="000"
              @keydown="numericKeydown"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary font-mono text-sm"
            />
          </div>
        </div>

        <!-- DCC info -->
        <div
          v-if="bookingStore.currencyConversion"
          class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100"
        >
          <div class="flex items-center gap-2 mb-2">
            <svg
              class="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
              />
            </svg>
            <span class="text-sm font-medium text-blue-800">{{
              $t('booking.currencyConversion')
            }}</span>
          </div>
          <div class="text-xs text-blue-700 space-y-1">
            <div class="flex justify-between">
              <span>{{ $t('booking.exchangeRate') }}</span>
              <span>{{ bookingStore.currencyConversion.rate }}</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>{{ $t('common.total') }}</span>
              <span>{{
                formatPrice(
                  bookingStore.currencyConversion.convertedAmount,
                  bookingStore.currencyConversion.currency
                )
              }}</span>
            </div>
          </div>
        </div>

        <!-- Installments -->
        <InstallmentSelector
          v-if="bookingStore.installmentOptions.length > 1 && !bookingStore.currencyConversion"
          class="mt-4"
          :installment-options="bookingStore.installmentOptions"
          :model-value="bookingStore.installment"
          :currency="bookingStore.cartTotal.currency"
          :total="effectiveAmount"
          @update:model-value="bookingStore.installment = $event"
        />
      </div>

      <!-- Terms & conditions -->
      <div class="bg-white border border-gray-200 rounded-xl p-4">
        <label class="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            v-model="bookingStore.termsAccepted"
            class="mt-0.5 w-4 h-4 text-site-primary border-gray-300 rounded focus:ring-site-primary"
          />
          <span class="text-sm text-gray-600">{{ $t('booking.termsAndConditions') }}</span>
        </label>
      </div>

      <!-- Error message -->
      <div
        v-if="bookingStore.bookingError"
        class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600"
      >
        {{ bookingStore.bookingError }}
      </div>

      <!-- Navigation -->
      <div class="flex justify-between items-center">
        <button
          type="button"
          @click="bookingStore.goToStep(2)"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {{ $t('common.back') }}
        </button>
        <button
          type="submit"
          :disabled="!isFormValid || bookingStore.processing"
          class="flex items-center gap-2 px-6 py-3 bg-site-primary text-white rounded-lg font-medium hover:bg-site-primary-dark disabled:opacity-50 transition-colors"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <template v-if="bookingStore.processing">
            {{ $t('booking.processing') }}
          </template>
          <template v-else>
            {{
              bookingStore.paymentMethod === 'creditCard'
                ? $t('booking.payAmount', {
                    amount: formatPrice(effectiveAmount, bookingStore.cartTotal.currency)
                  })
                : $t('booking.completeBooking')
            }}
          </template>
        </button>
      </div>

      <!-- Security badge -->
      <div class="flex items-center justify-center gap-2 text-gray-400 text-xs">
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
        {{ $t('booking.securityBadge') }}
      </div>
    </form>

    <!-- 3D Secure Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showSecureModal"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div class="flex items-center gap-2">
                <svg
                  class="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <h3 class="font-semibold text-gray-900">{{ $t('payment.securePayment') }}</h3>
              </div>
              <button
                @click="closeSecureModal"
                class="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  class="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div class="relative" style="height: 450px">
              <iframe
                v-if="secureUrl"
                :src="secureUrl"
                class="w-full h-full border-0"
                allow="payment"
              />
              <div
                v-if="pollingPayment"
                class="absolute inset-0 bg-white/80 flex flex-col items-center justify-center"
              >
                <div
                  class="w-8 h-8 border-3 border-site-primary border-t-transparent rounded-full animate-spin mb-3"
                />
                <p class="text-sm text-gray-600">{{ $t('payment.secureProcessing') }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ hotelCode: string }>()
const { t: $t } = useI18n()
const bookingStore = useBookingStore()
const { createBooking } = useBookingApi()
const { initiatePayment, getPaymentStatus } = usePaymentApi()
const { locale } = useI18n()
const { formatPrice } = useCurrency()

// Refs
const cardNumberRef = ref<HTMLInputElement | null>(null)
const expiryRef = ref<HTMLInputElement | null>(null)
const cvvRef = ref<HTMLInputElement | null>(null)

// 3D Secure
const showSecureModal = ref(false)
const secureUrl = ref('')
const pollingPayment = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

// BIN loading
const binLoading = ref(false)
const { queryBin } = usePaymentApi()

// Card brand detection
const cardType = computed(() => {
  const num = bookingStore.card.number.replace(/\s/g, '')
  if (!num) return ''
  const first = num[0]
  const firstTwo = num.substring(0, 2)
  if (first === '4') return 'visa'
  if (/^5[1-5]/.test(num)) return 'mastercard'
  if (first === '9') return 'troy'
  if (firstTwo === '34' || firstTwo === '37') return 'amex'
  return ''
})

// Card brand SVG components (inline)
const cardBrandComponent = computed(() => {
  if (!cardType.value) return null
  return (
    {
      visa: VisaSvg,
      mastercard: MastercardSvg,
      troy: TroySvg,
      amex: AmexSvg
    }[cardType.value] || null
  )
})

// Simple brand badge components
const VisaSvg = defineComponent({
  render: () =>
    h(
      'span',
      { class: 'text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded' },
      'VISA'
    )
})
const MastercardSvg = defineComponent({
  render: () =>
    h(
      'span',
      { class: 'text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded' },
      'MC'
    )
})
const TroySvg = defineComponent({
  render: () =>
    h(
      'span',
      { class: 'text-[10px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded' },
      'TROY'
    )
})
const AmexSvg = defineComponent({
  render: () =>
    h(
      'span',
      { class: 'text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' },
      'AMEX'
    )
})

// Card number formatting
const cardNumberFormatted = computed(() => {
  return bookingStore.card.number
})

function onCardNumberInput(e: Event) {
  const input = e.target as HTMLInputElement
  let val = input.value.replace(/\D/g, '')
  if (val.length > 16) val = val.slice(0, 16)
  val = val.replace(/(.{4})/g, '$1 ').trim()
  bookingStore.card.number = val
}

// Expiry formatting with auto-correction
const expiryFormatted = computed(() => {
  return bookingStore.card.expiry
})

function onExpiryInput(e: Event) {
  const input = e.target as HTMLInputElement
  let val = input.value.replace(/\D/g, '')

  if (val.length >= 1) {
    const firstDigit = parseInt(val[0]!)
    if (firstDigit > 1) {
      val = '0' + val
    }
  }
  if (val.length >= 2) {
    let month = parseInt(val.substring(0, 2))
    if (month > 12) month = 12
    if (month < 1) month = 1
    val = String(month).padStart(2, '0') + val.substring(2)
  }
  if (val.length > 4) val = val.slice(0, 4)
  if (val.length >= 2) {
    val = val.slice(0, 2) + '/' + val.slice(2)
  }

  bookingStore.card.expiry = val
}

// Auto-focus chain
watch(
  () => bookingStore.card.number,
  val => {
    const clean = val.replace(/\s/g, '')
    if (clean.length === 16) {
      nextTick(() => expiryRef.value?.focus())
    }
  }
)

watch(
  () => bookingStore.card.expiry,
  val => {
    if (val.length === 5) {
      nextTick(() => cvvRef.value?.focus())
    }
  }
)

// Numeric keydown filter
function numericKeydown(event: KeyboardEvent) {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End']
  if (allowedKeys.includes(event.key)) return
  if (event.ctrlKey || event.metaKey) return
  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}

// Luhn validation
function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '')
  if (digits.length < 13) return false
  let sum = 0
  let isDouble = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i]!)
    if (isDouble) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    isDouble = !isDouble
  }
  return sum % 10 === 0
}

// Card expired check
const isCardExpired = computed(() => {
  const exp = bookingStore.card.expiry
  if (exp.length !== 5) return false
  const [monthStr, yearStr] = exp.split('/') as [string, string]
  const month = parseInt(monthStr)
  const year = parseInt('20' + yearStr)
  if (!month || !year) return false
  const now = new Date()
  const expDate = new Date(year, month, 0)
  return expDate < now
})

// Card number error
const cardNumberError = computed(() => {
  const clean = bookingStore.card.number.replace(/\s/g, '')
  if (clean.length === 16 && !luhnCheck(clean)) {
    return $t('booking.cardInvalid')
  }
  return ''
})

// BIN lookup
watch(
  () => bookingStore.card.number,
  async val => {
    const clean = val.replace(/\s/g, '')
    if (clean.length >= 6) {
      binLoading.value = true
      try {
        const result = await queryBin(
          props.hotelCode,
          clean.slice(0, 6),
          bookingStore.cartTotal.amount || 0,
          bookingStore.cartTotal.currency || 'TRY'
        )
        if (result?.installmentOptions) {
          bookingStore.installmentOptions = result.installmentOptions
        }
        if (result?.binInfo) {
          bookingStore.binInfo = result.binInfo
        }
        if (result?.currencyConversion) {
          bookingStore.currencyConversion = result.currencyConversion
        }
        if (result?.posId) {
          bookingStore.posId = result.posId
        }
      } catch {
        /* ignore */
      } finally {
        binLoading.value = false
      }
    } else {
      bookingStore.binInfo = null
      bookingStore.currencyConversion = null
      bookingStore.installmentOptions = []
    }
  }
)

// Bank transfer visibility
const showBankTransfer = computed(() => {
  if (!bookingStore.paymentTerms?.bankTransfer) return false
  // Check if check-in is far enough
  const releaseDays = bookingStore.bankTransferReleaseDays
  const checkIn = bookingStore.searchParams.checkIn
  if (checkIn && releaseDays > 0) {
    const checkInDate = new Date(checkIn)
    const now = new Date()
    const diffDays = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= releaseDays
  }
  return true
})

// Effective amount
const effectiveAmount = computed(() => {
  let amount =
    bookingStore.cartTotal.amount - bookingStore.promoDiscount + bookingStore.guaranteeAmount
  if (bookingStore.paymentMethod === 'bankTransfer' && bookingStore.bankTransferDiscount > 0) {
    amount = amount * (1 - bookingStore.bankTransferDiscount / 100)
  }
  return Math.round(amount * 100) / 100
})

// Form validity
const isFormValid = computed(() => {
  if (!bookingStore.termsAccepted) return false
  if (bookingStore.paymentMethod === 'creditCard') {
    const clean = bookingStore.card.number.replace(/\s/g, '')
    if (!bookingStore.card.holder) return false
    if (clean.length < 15) return false
    if (bookingStore.card.expiry.length !== 5) return false
    if (bookingStore.card.cvv.length < 3) return false
    if (isCardExpired.value) return false
    if (cardNumberError.value) return false
  }
  return true
})

// Payment handler
async function handlePayment() {
  bookingStore.processing = true
  bookingStore.bookingError = ''

  try {
    const booking = await createBooking({
      hotelCode: props.hotelCode,
      checkIn: bookingStore.searchParams.checkIn,
      checkOut: bookingStore.searchParams.checkOut,
      rooms: bookingStore.cart.map(item => ({
        roomTypeCode: item.roomTypeCode,
        mealPlanCode: item.mealPlanCode,
        adults: item.guests.adults,
        children: item.guests.children,
        guests: (bookingStore.roomGuests[item.id] || []).map(g => ({
          firstName: g.firstName,
          lastName: g.lastName,
          title: g.title,
          type: g.type,
          nationality: g.nationality,
          birthDate: g.birthDate,
          age: g.age,
          isLead: g.isLead
        }))
      })),
      contact: {
        firstName: bookingStore.contact.firstName,
        lastName: bookingStore.contact.lastName,
        email: bookingStore.contact.email,
        phone: bookingStore.contact.phone
      },
      specialRequests: bookingStore.specialRequests,
      paymentMethod: bookingStore.paymentMethod,
      guestLanguage: locale.value,
      cancellationGuarantee: bookingStore.cancellationGuarantee
    })

    bookingStore.bookingResult = booking

    if (bookingStore.paymentMethod === 'creditCard') {
      const payment = await initiatePayment(booking.bookingNumber, {
        email: bookingStore.contact.email,
        installment: bookingStore.installment,
        posId: bookingStore.posId || undefined,
        card: {
          holder: bookingStore.card.holder,
          number: bookingStore.card.number.replace(/\s/g, ''),
          expiry: bookingStore.card.expiry,
          cvv: bookingStore.card.cvv
        }
      })

      if (payment.requires3D && payment.formUrl) {
        secureUrl.value = payment.formUrl
        showSecureModal.value = true
        bookingStore.processing = false
        startPaymentPolling(booking.bookingNumber)
        return
      }
    }

    bookingStore.goToStep(4)
  } catch (err: any) {
    bookingStore.bookingError = err?.message || 'Booking failed'
  } finally {
    bookingStore.processing = false
  }
}

function startPaymentPolling(bookingNumber: string) {
  let attempts = 0
  const maxAttempts = 30

  pollTimer = setInterval(async () => {
    attempts++
    if (attempts > maxAttempts) {
      stopPolling()
      showSecureModal.value = false
      bookingStore.bookingError = 'Payment timeout'
      return
    }

    try {
      const status = await getPaymentStatus(bookingNumber, bookingStore.contact.email)
      if (status?.status === 'paid' || status?.status === 'success') {
        stopPolling()
        pollingPayment.value = true
        setTimeout(() => {
          showSecureModal.value = false
          pollingPayment.value = false
          bookingStore.goToStep(4)
        }, 1000)
      } else if (status?.status === 'failed' || status?.status === 'error') {
        stopPolling()
        showSecureModal.value = false
        bookingStore.bookingError = status?.message || 'Payment failed'
      }
    } catch {
      // Continue polling
    }
  }, 2000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function closeSecureModal() {
  stopPolling()
  showSecureModal.value = false
  secureUrl.value = ''
}

onUnmounted(() => {
  stopPolling()
})
</script>
