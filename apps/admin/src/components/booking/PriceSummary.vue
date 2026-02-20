<template>
  <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
    <h4 class="font-semibold text-gray-900 dark:text-white mb-4">
      {{ $t('booking.priceSummary') }}
    </h4>

    <div class="space-y-2">
      <!-- Subtotal -->
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-slate-400">
          {{ $t('booking.subtotal') }}
        </span>
        <span class="text-gray-900 dark:text-white">
          {{ formatPrice(subtotal, currency) }}
        </span>
      </div>

      <!-- Discount -->
      <div v-if="discount > 0" class="flex justify-between text-sm">
        <span class="text-green-600 dark:text-green-400">
          {{ $t('booking.discount') }}
        </span>
        <span class="text-green-600 dark:text-green-400">
          -{{ formatPrice(discount, currency) }}
        </span>
      </div>

      <!-- Applied Campaigns -->
      <div v-if="campaigns?.length > 0" class="pt-2">
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
          {{ $t('booking.appliedCampaigns') }}:
        </p>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="campaign in campaigns"
            :key="campaign.code"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
          >
            <span class="material-icons text-xs mr-1">local_offer</span>
            {{ campaign.discountText || campaign.name }}
          </span>
        </div>
      </div>

      <!-- Tax (if applicable) -->
      <div v-if="tax > 0" class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-slate-400">
          {{ $t('booking.tax') }} ({{ taxRate }}%)
        </span>
        <span class="text-gray-900 dark:text-white">
          {{ formatPrice(tax, currency) }}
        </span>
      </div>

      <!-- Cancellation Guarantee -->
      <div v-if="cancellationGuarantee?.purchased" class="flex justify-between text-sm">
        <span class="text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <span class="material-icons text-sm">verified_user</span>
          {{ $t('booking.cancellationGuarantee') }} ({{ cancellationGuarantee.rate }}%)
        </span>
        <span class="text-blue-600 dark:text-blue-400">
          +{{ formatPrice(cancellationGuarantee.amount, currency) }}
        </span>
      </div>

      <!-- Divider -->
      <div class="border-t border-gray-200 dark:border-slate-700 my-3"></div>

      <!-- Total -->
      <div class="flex justify-between">
        <span class="font-semibold text-gray-900 dark:text-white">
          {{ $t('booking.total') }}
        </span>
        <div class="text-right">
          <span class="text-xl font-bold text-purple-600 dark:text-purple-400">
            {{ formatPrice(total, currency) }}
          </span>
          <p v-if="nights > 0" class="text-xs text-gray-500 dark:text-slate-400">
            ~{{ formatPrice(total / nights, currency) }} / {{ $t('booking.perNight') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Daily Breakdown (collapsible) -->
    <div v-if="showBreakdown && dailyBreakdown?.length > 0" class="mt-4">
      <button
        class="flex items-center text-sm text-purple-600 dark:text-purple-400 hover:underline"
        @click="breakdownOpen = !breakdownOpen"
      >
        <span class="material-icons text-sm mr-1">
          {{ breakdownOpen ? 'expand_less' : 'expand_more' }}
        </span>
        {{ $t('booking.viewDailyBreakdown') }}
      </button>

      <div v-if="breakdownOpen" class="mt-3 bg-white dark:bg-slate-800 rounded-lg p-3 space-y-2">
        <div v-for="day in dailyBreakdown" :key="day.date" class="flex justify-between text-xs">
          <span class="text-gray-600 dark:text-slate-400">
            {{ formatDate(day.date) }}
          </span>
          <div class="text-right">
            <span v-if="day.discountAmount > 0" class="text-gray-400 line-through mr-2">
              {{ formatPrice(day.originalPrice, currency) }}
            </span>
            <span class="text-gray-900 dark:text-white">
              {{ formatPrice(day.price, currency) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

defineProps({
  subtotal: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'TRY'
  },
  nights: {
    type: Number,
    default: 0
  },
  campaigns: {
    type: Array,
    default: () => []
  },
  dailyBreakdown: {
    type: Array,
    default: () => []
  },
  showBreakdown: {
    type: Boolean,
    default: false
  },
  cancellationGuarantee: {
    type: Object,
    default: null
  }
})

const breakdownOpen = ref(false)

// Format price
const formatPrice = (amount, currency) => {
  if (!amount) return ''
  const formatter = new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency || 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
  return formatter.format(amount)
}

// Format date
const formatDate = dateStr => {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}
</script>
