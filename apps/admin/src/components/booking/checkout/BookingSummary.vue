<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden sticky top-4"
  >
    <!-- Header -->
    <div class="bg-purple-600 text-white p-4">
      <h3 class="font-semibold text-lg flex items-center">
        <span class="material-icons mr-2">receipt_long</span>
        {{ $t('booking.bookingSummary') }}
      </h3>
    </div>

    <!-- Hotel & Dates -->
    <div class="p-4 border-b border-gray-200 dark:border-slate-700">
      <div class="flex items-center gap-3 mb-3">
        <span class="material-icons text-purple-500">hotel</span>
        <div>
          <div class="font-medium text-gray-900 dark:text-white">
            {{ getLocalizedName(cart[0]?.hotelName) }}
          </div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-gray-500 dark:text-slate-400">{{ $t('booking.checkIn') }}</span>
          <div class="font-medium text-gray-900 dark:text-white">
            {{ formatDate(search.dateRange.start) }}
          </div>
        </div>
        <div>
          <span class="text-gray-500 dark:text-slate-400">{{ $t('booking.checkOut') }}</span>
          <div class="font-medium text-gray-900 dark:text-white">
            {{ formatDate(search.dateRange.end) }}
          </div>
        </div>
      </div>
      <div class="mt-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
        {{ nights }} {{ $t('booking.nights') }}
      </div>
    </div>

    <!-- Rooms -->
    <div class="p-4 border-b border-gray-200 dark:border-slate-700 space-y-3">
      <div v-for="(item, index) in cart" :key="index" class="flex justify-between text-sm">
        <div>
          <div class="font-medium text-gray-900 dark:text-white">
            {{ getLocalizedName(item.roomType?.name) }}
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-gray-500 dark:text-slate-400">
              {{ getLocalizedName(item.mealPlan?.name) }}
            </span>
            <!-- Rate Type Badge -->
            <span
              v-if="item.isNonRefundable"
              class="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
            >
              İade Edilmez
            </span>
          </div>
          <div class="text-xs text-gray-400 dark:text-slate-500">
            {{ item.adults }} {{ $t('booking.adults') }}
            <span v-if="item.children?.length"
              >+ {{ item.children.length }} {{ $t('booking.children') }}</span
            >
          </div>
        </div>
        <div class="text-right">
          <div v-if="item.pricing?.totalDiscount > 0" class="text-xs text-gray-400 line-through">
            {{ formatPrice(item.pricing?.originalTotal, currency) }}
          </div>
          <div class="font-medium text-gray-900 dark:text-white">
            {{ formatPrice(item.pricing?.finalTotal, currency) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Price Breakdown -->
    <div class="p-4 space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-500 dark:text-slate-400">{{ $t('booking.subtotal') }}</span>
        <span class="text-gray-900 dark:text-white">{{ formatPrice(subtotal, currency) }}</span>
      </div>
      <div v-if="discount > 0" class="flex justify-between text-green-600 dark:text-green-400">
        <span>{{ $t('booking.discount') }}</span>
        <span>-{{ formatPrice(discount, currency) }}</span>
      </div>
      <div
        v-if="cancellationGuarantee?.purchased"
        class="flex justify-between text-blue-600 dark:text-blue-400"
      >
        <span class="flex items-center gap-1">
          <span class="material-icons" style="font-size: 14px">verified_user</span>
          {{ $t('booking.cancellationGuarantee') }} ({{ cancellationGuarantee.rate }}%)
        </span>
        <span>+{{ formatPrice(cancellationGuarantee.amount, currency) }}</span>
      </div>
      <div
        class="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-slate-700"
      >
        <span class="text-gray-900 dark:text-white">{{ $t('booking.total') }}</span>
        <span class="text-purple-600 dark:text-purple-400">{{ formatPrice(total, currency) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

defineProps({
  cart: {
    type: Array,
    required: true
  },
  search: {
    type: Object,
    required: true
  },
  nights: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'TRY'
  },
  subtotal: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  cancellationGuarantee: {
    type: Object,
    default: null
  }
})

// Get localized name
const getLocalizedName = name => {
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
}

// Format price
const formatPrice = (price, currency = 'TRY') => {
  if (!price) return '-'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Format date
const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
</script>
