<template>
  <div class="space-y-6">
    <div class="text-center mb-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ $t('booking.amendment.currentBooking') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ $t('booking.amendment.currentBookingDesc') }}
      </p>
    </div>

    <!-- Loading / No Data State -->
    <div v-if="!booking" class="text-center py-8">
      <span class="material-icons text-4xl text-gray-300 dark:text-gray-600">hourglass_empty</span>
      <p class="mt-2 text-gray-500 dark:text-gray-400">{{ $t('common.loading') }}</p>
    </div>

    <template v-else>
      <!-- Hotel Info -->
      <div
        class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-6"
      >
        <div class="flex items-start gap-4">
          <div
            class="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0"
          >
            <img
              v-if="booking?.hotel?.images?.[0]?.url"
              :src="booking.hotel.images[0].url"
              :alt="hotelName"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="material-icons text-gray-400 text-3xl">hotel</span>
            </div>
          </div>
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ hotelName }}
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ booking?.hotel?.address?.city }}
            </p>
            <div class="flex items-center gap-2 mt-2">
              <span
                class="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full"
              >
                {{ booking?.bookingNumber }}
              </span>
              <span :class="statusClass" class="px-2 py-1 text-xs rounded-full">
                {{ $t(`booking.status.${booking?.status}`) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Booking Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Dates -->
        <div
          class="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600"
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
            >
              <span class="material-icons text-blue-600 dark:text-blue-400">calendar_today</span>
            </div>
            <h5 class="font-medium text-gray-900 dark:text-white">
              {{ $t('booking.dates') }}
            </h5>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('booking.checkIn') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                formatDate(booking?.checkIn)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('booking.checkOut') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                formatDate(booking?.checkOut)
              }}</span>
            </div>
            <div class="flex justify-between pt-2 border-t dark:border-gray-600">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('booking.nights') }}</span>
              <span class="font-semibold text-indigo-600 dark:text-indigo-400"
                >{{ booking?.nights }} {{ $t('booking.nightsUnit') }}</span
              >
            </div>
          </div>
        </div>

        <!-- Room & Guests -->
        <div
          class="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600"
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center"
            >
              <span class="material-icons text-green-600 dark:text-green-400">bed</span>
            </div>
            <h5 class="font-medium text-gray-900 dark:text-white">
              {{ $t('booking.roomsAndGuests') }}
            </h5>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('booking.totalRooms') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                booking?.totalRooms
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('booking.adults') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                booking?.totalAdults
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('booking.children') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                booking?.totalChildren || 0
              }}</span>
            </div>
          </div>
        </div>

        <!-- Lead Guest -->
        <div
          class="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600"
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center"
            >
              <span class="material-icons text-amber-600 dark:text-amber-400">person</span>
            </div>
            <h5 class="font-medium text-gray-900 dark:text-white">
              {{ $t('booking.leadGuest') }}
            </h5>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('common.name') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {{ booking?.leadGuest?.firstName }} {{ booking?.leadGuest?.lastName }}
              </span>
            </div>
            <div v-if="booking?.leadGuest?.tcNumber" class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('booking.tcNumber') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                booking?.leadGuest?.tcNumber
              }}</span>
            </div>
            <div v-if="booking?.contact?.email" class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('common.email') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                booking?.contact?.email
              }}</span>
            </div>
            <div v-if="booking?.contact?.phone" class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('common.phone') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                booking?.contact?.phone
              }}</span>
            </div>
          </div>
        </div>

        <!-- Pricing -->
        <div
          class="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600"
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center"
            >
              <span class="material-icons text-emerald-600 dark:text-emerald-400">payments</span>
            </div>
            <h5 class="font-medium text-gray-900 dark:text-white">
              {{ $t('booking.pricing') }}
            </h5>
          </div>
          <div class="space-y-2 text-sm">
            <div v-if="booking?.pricing?.subtotal" class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('booking.subtotal') }}</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(booking?.pricing?.subtotal, booking?.pricing?.currency) }}
              </span>
            </div>
            <div
              v-if="booking?.pricing?.totalDiscount > 0"
              class="flex justify-between text-green-600 dark:text-green-400"
            >
              <span>{{ $t('booking.discount') }}</span>
              <span
                >-{{
                  formatCurrency(booking?.pricing?.totalDiscount, booking?.pricing?.currency)
                }}</span
              >
            </div>
            <div
              v-if="booking?.cancellationGuarantee?.purchased"
              class="flex justify-between text-blue-600 dark:text-blue-400"
            >
              <span class="flex items-center gap-1">
                <span class="material-icons" style="font-size: 14px">verified_user</span>
                {{ $t('booking.cancellationGuarantee') }}
                ({{ booking.cancellationGuarantee.rate }}%)
              </span>
              <span>
                +{{
                  formatCurrency(booking.cancellationGuarantee.amount, booking?.pricing?.currency)
                }}
              </span>
            </div>
            <div class="flex justify-between pt-2 border-t dark:border-gray-600">
              <span class="font-medium text-gray-900 dark:text-white">{{
                $t('booking.grandTotal')
              }}</span>
              <span class="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                {{ formatCurrency(booking?.pricing?.grandTotal, booking?.pricing?.currency) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Rooms List -->
      <div
        class="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600"
      >
        <h5 class="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-gray-400">meeting_room</span>
          {{ $t('booking.roomDetails') }}
        </h5>
        <div class="space-y-3">
          <div
            v-for="(room, index) in booking?.rooms"
            :key="index"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400"
              >
                {{ index + 1 }}
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ getRoomTypeName(room) }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ getMealPlanName(room) }}
                  <span
                    v-if="room.rateType === 'non_refundable'"
                    class="ml-2 text-amber-600 dark:text-amber-400"
                  >
                    ({{ $t('booking.nonRefundable') }})
                  </span>
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(room.pricing?.finalTotal, booking?.pricing?.currency) }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ room.guests?.length || 0 }} {{ $t('booking.guests') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  booking: { type: Object, default: null },
  originalData: { type: Object, default: null }
})

const { locale } = useI18n()

const hotelName = computed(() => {
  const name = props.booking?.hotel?.name
  if (!name) return props.booking?.hotelName || ''
  return typeof name === 'object' ? name[locale.value] || name.tr || name.en : name
})

const statusClass = computed(() => {
  const status = props.booking?.status
  const classes = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    checked_in: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  }
  return classes[status] || classes.pending
})

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const formatCurrency = (amount, currency = 'TRY') => {
  if (amount === undefined || amount === null) return '-'
  return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency || 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

const getRoomTypeName = room => {
  const name = room.roomTypeName || room.roomType?.name
  if (!name) return room.roomTypeCode || '-'
  return typeof name === 'object' ? name[locale.value] || name.tr || name.en : name
}

const getMealPlanName = room => {
  const name = room.mealPlanName || room.mealPlan?.name
  if (!name) return room.mealPlanCode || '-'
  return typeof name === 'object' ? name[locale.value] || name.tr || name.en : name
}
</script>
