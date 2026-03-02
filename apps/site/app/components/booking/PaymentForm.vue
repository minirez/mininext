<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 mb-6">{{ $t('booking.payment') }}</h2>

    <form @submit.prevent="handlePayment" class="space-y-6">
      <!-- Payment method selection -->
      <div class="bg-white border border-gray-200 rounded-xl p-6">
        <h3 class="font-semibold text-gray-800 mb-4">{{ $t('booking.paymentMethod') }}</h3>
        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="bookingStore.paymentMethod"
              type="radio"
              value="creditCard"
              class="text-site-primary"
            />
            <span class="text-sm">{{ $t('booking.creditCard') }}</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="bookingStore.paymentMethod"
              type="radio"
              value="payAtHotel"
              class="text-site-primary"
            />
            <span class="text-sm">{{ $t('booking.payAtHotel') }}</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="bookingStore.paymentMethod"
              type="radio"
              value="bankTransfer"
              class="text-site-primary"
            />
            <span class="text-sm">{{ $t('booking.bankTransfer') }}</span>
          </label>
        </div>
      </div>

      <!-- Credit card form -->
      <div
        v-if="bookingStore.paymentMethod === 'creditCard'"
        class="bg-white border border-gray-200 rounded-xl p-6"
      >
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span class="text-sm text-gray-600">{{ $t('payment.ssl') }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.cardHolder') }} *</label
            >
            <input
              v-model="bookingStore.card.holder"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.cardNumber') }} *</label
            >
            <input
              v-model="bookingStore.card.number"
              type="text"
              required
              maxlength="19"
              placeholder="0000 0000 0000 0000"
              @input="formatCardNumber"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary font-mono"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.expiryDate') }} *</label
            >
            <input
              v-model="bookingStore.card.expiry"
              type="text"
              required
              maxlength="5"
              placeholder="MM/YY"
              @input="formatExpiry"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary font-mono"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.cvv') }} *</label
            >
            <input
              v-model="bookingStore.card.cvv"
              type="text"
              required
              maxlength="4"
              placeholder="000"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary font-mono"
            />
          </div>
        </div>

        <!-- Installments -->
        <InstallmentSelector v-if="bookingStore.installmentOptions.length > 1" class="mt-4" />
      </div>

      <!-- Promo code -->
      <PromoCodeInput :hotel-code="hotelCode" />

      <!-- Navigation -->
      <div class="flex justify-between">
        <button
          type="button"
          @click="bookingStore.goToStep(2)"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {{ $t('common.back') }}
        </button>
        <button
          type="submit"
          :disabled="bookingStore.processing"
          class="px-6 py-3 bg-site-primary text-white rounded-lg font-medium hover:bg-site-primary-dark disabled:opacity-50 transition-colors"
        >
          {{ bookingStore.processing ? $t('booking.processing') : $t('booking.completeBooking') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ hotelCode: string }>()
const bookingStore = useBookingStore()
const { createBooking } = useBookingApi()
const { initiatePayment } = usePaymentApi()
const { locale } = useI18n()

// BIN lookup for installments
const { queryBin } = usePaymentApi()

watch(
  () => bookingStore.card.number,
  async val => {
    const clean = val.replace(/\s/g, '')
    if (clean.length >= 6) {
      try {
        const result = await queryBin(
          props.hotelCode,
          clean.slice(0, 6),
          bookingStore.selectedRoom?.price?.total || 0,
          bookingStore.selectedRoom?.price?.currency || 'TRY'
        )
        if (result?.installmentOptions) {
          bookingStore.installmentOptions = result.installmentOptions
        }
      } catch {
        /* ignore */
      }
    }
  }
)

function formatCardNumber(e: Event) {
  const input = e.target as HTMLInputElement
  let val = input.value.replace(/\D/g, '')
  val = val.replace(/(.{4})/g, '$1 ').trim()
  bookingStore.card.number = val
}

function formatExpiry(e: Event) {
  const input = e.target as HTMLInputElement
  let val = input.value.replace(/\D/g, '')
  if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2)
  bookingStore.card.expiry = val
}

async function handlePayment() {
  bookingStore.processing = true
  bookingStore.bookingError = ''

  try {
    // Create booking
    const booking = await createBooking({
      hotelCode: props.hotelCode,
      checkIn: bookingStore.searchParams.checkIn,
      checkOut: bookingStore.searchParams.checkOut,
      rooms: [
        {
          roomTypeCode: bookingStore.selectedRoom?.roomTypeCode,
          mealPlanCode: bookingStore.selectedRoom?.mealPlanCode,
          adults: bookingStore.searchParams.adults,
          children: bookingStore.searchParams.children,
          guests: [
            {
              firstName: bookingStore.contact.firstName,
              lastName: bookingStore.contact.lastName,
              type: 'adult'
            }
          ]
        }
      ],
      contact: {
        firstName: bookingStore.contact.firstName,
        lastName: bookingStore.contact.lastName,
        email: bookingStore.contact.email,
        phone: bookingStore.contact.phone
      },
      specialRequests: bookingStore.specialRequests,
      paymentMethod: bookingStore.paymentMethod,
      guestLanguage: locale.value
    })

    bookingStore.bookingResult = booking

    if (bookingStore.paymentMethod === 'creditCard') {
      // Initiate payment
      const payment = await initiatePayment(booking.bookingNumber, {
        email: bookingStore.contact.email,
        installment: bookingStore.installment,
        card: {
          holder: bookingStore.card.holder,
          number: bookingStore.card.number.replace(/\s/g, ''),
          expiry: bookingStore.card.expiry,
          cvv: bookingStore.card.cvv
        }
      })

      if (payment.requires3D && payment.formUrl) {
        // Redirect to 3D Secure
        window.location.href = payment.formUrl
        return
      }
    }

    // Success - go to confirmation
    bookingStore.goToStep(4)
  } catch (err: any) {
    bookingStore.bookingError = err?.message || 'Booking failed'
  } finally {
    bookingStore.processing = false
  }
}
</script>
