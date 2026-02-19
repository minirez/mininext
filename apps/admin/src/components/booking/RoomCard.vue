<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
  >
    <!-- Room Image -->
    <div class="relative h-48 bg-gray-100 dark:bg-slate-700">
      <img
        v-if="roomType.images?.[0]?.url"
        :src="roomType.images[0].url"
        :alt="roomName"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <span class="material-icons text-4xl text-gray-400">bed</span>
      </div>
      <!-- Capacity Badge -->
      <div
        class="absolute top-3 right-3 bg-white dark:bg-slate-800 rounded-full px-3 py-1 text-xs font-medium shadow"
      >
        <span class="text-gray-600 dark:text-slate-300">
          {{ roomType.occupancy?.maxAdults || 2 }}
          <span class="material-icons text-xs align-middle">person</span>
        </span>
      </div>
    </div>

    <!-- Room Info -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 dark:text-white text-lg">
        {{ roomName }}
      </h3>
      <p v-if="roomDescription" class="text-sm text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
        {{ roomDescription }}
      </p>

      <!-- Capacity Info -->
      <div v-if="capacityExceeded" class="mt-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
        <div class="flex items-start">
          <span class="material-icons text-yellow-500 mr-2 text-sm">warning</span>
          <p class="text-sm text-yellow-700 dark:text-yellow-400">
            {{ capacityMessage || $t('booking.capacityExceeded') }}
          </p>
        </div>
      </div>

      <!-- Meal Plan Options -->
      <div v-else class="mt-4 space-y-3">
        <div
          v-for="option in availableOptions"
          :key="option.mealPlan.code"
          class="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <!-- Meal Plan Name -->
              <h4 class="font-medium text-gray-900 dark:text-white">
                {{ getMealPlanName(option.mealPlan) }}
              </h4>

              <!-- Campaigns -->
              <div v-if="option.campaigns?.length" class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="campaign in option.campaigns"
                  :key="campaign.code"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                >
                  <span class="material-icons text-xs mr-1">local_offer</span>
                  {{ campaign.discountText || campaign.name }}
                </span>
              </div>
            </div>

            <!-- Price -->
            <div class="text-right ml-4">
              <!-- Original price if discounted -->
              <p v-if="option.pricing.totalDiscount > 0" class="text-sm text-gray-400 line-through">
                {{ formatPrice(option.pricing.originalTotal, option.pricing.currency) }}
              </p>
              <!-- Final price -->
              <p class="text-lg font-bold text-purple-600 dark:text-purple-400">
                {{ formatPrice(option.pricing.finalTotal, option.pricing.currency) }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ option.nights }} {{ $t('booking.nights') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                ~{{ formatPrice(option.pricing.avgPerNight, option.pricing.currency) }}/{{
                  $t('booking.perNight')
                }}
              </p>
            </div>
          </div>

          <!-- Add to Cart Button -->
          <button
            class="mt-3 w-full btn-primary py-2 flex items-center justify-center space-x-2"
            @click="$emit('add-to-cart', roomType, option.mealPlan, option)"
          >
            <span class="material-icons text-sm">add_shopping_cart</span>
            <span>{{ $t('booking.addToCart') }}</span>
          </button>
        </div>

        <!-- Unavailable Options -->
        <div
          v-for="option in unavailableOptions"
          :key="option.mealPlan.code"
          class="border border-gray-100 dark:border-slate-800 rounded-lg p-4 opacity-50"
        >
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-medium text-gray-500 dark:text-slate-400">
                {{ getMealPlanName(option.mealPlan) }}
              </h4>
              <p class="text-sm text-red-500 mt-1">
                {{ getUnavailableReason(option) }}
              </p>
            </div>
            <span class="text-gray-400">
              <span class="material-icons">block</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const props = defineProps({
  roomType: {
    type: Object,
    required: true
  },
  options: {
    type: Array,
    default: () => []
  },
  capacityExceeded: {
    type: Boolean,
    default: false
  },
  capacityMessage: {
    type: String,
    default: ''
  }
})

defineEmits(['add-to-cart'])

// Room name (multi-lang)
const roomName = computed(() => {
  const name = props.roomType.name
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name || ''
})

// Room description (multi-lang)
const roomDescription = computed(() => {
  const desc = props.roomType.description
  if (typeof desc === 'object') {
    return desc[locale.value] || desc.en || desc.tr || Object.values(desc)[0] || ''
  }
  return desc || ''
})

// Available options
const availableOptions = computed(() => {
  return props.options.filter(o => o.available !== false && o.pricing)
})

// Unavailable options
const unavailableOptions = computed(() => {
  return props.options.filter(o => o.available === false)
})

// Get meal plan name
const getMealPlanName = mealPlan => {
  const name = mealPlan.name
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || mealPlan.code
  }
  return name || mealPlan.code
}

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

// Get unavailable reason based on specific issue type
const getUnavailableReason = option => {
  const issues = option.issues || []
  for (const issue of issues) {
    if (issue.type === 'minStay') {
      return t('booking.minStayRequired', { nights: issue.required || 2 })
    }
    if (issue.type === 'releaseDays') {
      return t('booking.releaseDaysRequired', { days: issue.required || 2 })
    }
    if (issue.type === 'stopSale') {
      return t('booking.stopSale')
    }
    if (issue.type === 'noInventory') {
      return t('booking.noInventory')
    }
    if (issue.type === 'closedToArrival') {
      return t('booking.closedToArrival')
    }
    if (issue.type === 'closedToDeparture') {
      return t('booking.closedToDeparture')
    }
  }
  return t('booking.roomNotAvailable')
}
</script>
