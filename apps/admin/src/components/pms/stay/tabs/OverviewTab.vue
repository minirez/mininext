<template>
  <div class="space-y-6">
    <!-- Guest & Room Info -->
    <div class="grid grid-cols-2 gap-6">
      <!-- Guest Info -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
        <h3
          class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"
        >
          <span class="material-icons text-sm text-indigo-600">person</span>
          {{ t('stayCard.guestInfo') }}
        </h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.fullName') }}</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ mainGuest?.firstName }} {{ mainGuest?.lastName }}
            </span>
          </div>
          <div v-if="mainGuest?.phone" class="flex justify-between">
            <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.phone') }}</span>
            <span class="text-gray-900 dark:text-white">{{ mainGuest.phone }}</span>
          </div>
          <div v-if="mainGuest?.email" class="flex justify-between">
            <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.email') }}</span>
            <span class="text-gray-900 dark:text-white truncate max-w-[180px]">{{
              mainGuest.email
            }}</span>
          </div>
          <div v-if="mainGuest?.nationality" class="flex justify-between">
            <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.nationality') }}</span>
            <span class="text-gray-900 dark:text-white">{{ mainGuest.nationality }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.guestCount') }}</span>
            <span class="text-gray-900 dark:text-white">
              {{ guestCount.adults }} {{ t('stayCard.adults') }}
              <span v-if="guestCount.children"
                >, {{ guestCount.children }} {{ t('stayCard.children') }}</span
              >
            </span>
          </div>
        </div>
      </div>

      <!-- Room Info -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
        <h3
          class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"
        >
          <span class="material-icons text-sm text-indigo-600">meeting_room</span>
          {{ t('stayCard.roomInfo') }}
        </h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.roomNo') }}</span>
            <span class="font-medium text-gray-900 dark:text-white">{{
              stay?.room?.roomNumber || '-'
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.roomType') }}</span>
            <span class="text-gray-900 dark:text-white">
              {{
                stay?.roomType?.name?.[locale] ||
                stay?.roomType?.name?.tr ||
                stay?.roomType?.code ||
                '-'
              }}
            </span>
          </div>
          <div v-if="stay?.room?.floor" class="flex justify-between">
            <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.floor') }}</span>
            <span class="text-gray-900 dark:text-white"
              >{{ stay.room.floor }}. {{ t('stayCard.floorSuffix') }}</span
            >
          </div>
          <div v-if="stay?.mealPlanCode" class="flex justify-between">
            <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.mealPlan') }}</span>
            <span class="text-gray-900 dark:text-white">{{ stay.mealPlanCode }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Dates -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span class="material-icons text-sm text-indigo-600">event</span>
        {{ t('stayCard.dates') }}
      </h3>
      <div class="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p class="text-gray-500 dark:text-slate-400 mb-1">{{ t('stayCard.checkInDate') }}</p>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ formatDate(stay?.checkInDate) }}
          </p>
          <p v-if="stay?.actualCheckIn" class="text-xs text-green-600 dark:text-green-400 mt-1">
            {{ t('stayCard.actual') }}: {{ formatTime(stay.actualCheckIn) }}
          </p>
        </div>
        <div>
          <p class="text-gray-500 dark:text-slate-400 mb-1">{{ t('stayCard.checkOutDate') }}</p>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ formatDate(stay?.checkOutDate) }}
          </p>
          <p v-if="stay?.actualCheckOut" class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ t('stayCard.actual') }}: {{ formatTime(stay.actualCheckOut) }}
          </p>
        </div>
        <div>
          <p class="text-gray-500 dark:text-slate-400 mb-1">{{ t('stayCard.nights') }}</p>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ nights }} {{ t('stayCard.nightSuffix') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Financial Summary -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span class="material-icons text-sm text-indigo-600">account_balance_wallet</span>
        {{ t('stayCard.financialSummary') }}
      </h3>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.roomRate') }}</span>
          <span class="text-gray-900 dark:text-white">{{ formatCurrency(stay?.roomRate) }}</span>
        </div>
        <div v-if="stay?.extras?.length" class="flex justify-between">
          <span class="text-gray-500 dark:text-slate-400"
            >{{ t('stayCard.extras') }} ({{ stay.extras.length }})</span
          >
          <span class="text-gray-900 dark:text-white">{{ formatCurrency(extrasTotal) }}</span>
        </div>
        <div class="flex justify-between border-t border-gray-200 dark:border-slate-600 pt-2 mt-2">
          <span class="font-medium text-gray-900 dark:text-white">{{ t('stayCard.total') }}</span>
          <span class="font-bold text-gray-900 dark:text-white">{{
            formatCurrency(stay?.totalAmount)
          }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500 dark:text-slate-400">{{ t('stayCard.paid') }}</span>
          <span class="text-green-600 dark:text-green-400">{{
            formatCurrency(stay?.paidAmount)
          }}</span>
        </div>
        <div class="flex justify-between border-t border-gray-200 dark:border-slate-600 pt-2 mt-2">
          <span class="font-medium text-gray-900 dark:text-white">{{ t('stayCard.balance') }}</span>
          <span
            class="font-bold"
            :class="
              (stay?.balance || 0) > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-white'
            "
          >
            {{ formatCurrency(stay?.balance) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Special Requests -->
    <div v-if="stay?.specialRequests" class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
      <h3
        class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2"
      >
        <span class="material-icons text-sm">star</span>
        {{ t('stayCard.specialRequests') }}
      </h3>
      <p class="text-sm text-amber-700 dark:text-amber-400">{{ stay.specialRequests }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const props = defineProps({
  stay: {
    type: Object,
    default: null
  }
})

const mainGuest = computed(() => {
  if (!props.stay?.guests?.length) return null
  return props.stay.guests.find(g => g.isMainGuest) || props.stay.guests[0]
})

const guestCount = computed(() => {
  if (!props.stay) return { adults: 0, children: 0 }
  return {
    adults:
      props.stay.adultsCount || props.stay.guests?.filter(g => g.type === 'adult').length || 0,
    children:
      props.stay.childrenCount || props.stay.guests?.filter(g => g.type !== 'adult').length || 0
  }
})

const nights = computed(() => {
  if (!props.stay?.checkInDate || !props.stay?.checkOutDate) return 0
  const checkIn = new Date(props.stay.checkInDate)
  const checkOut = new Date(props.stay.checkOutDate)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

const extrasTotal = computed(() => {
  if (!props.stay?.extras?.length) return 0
  return props.stay.extras.reduce((sum, e) => sum + e.amount * (e.quantity || 1), 0)
})

const localeMap = { tr: 'tr-TR', en: 'en-US' }

const formatCurrency = amount => {
  return new Intl.NumberFormat(localeMap[locale.value] || 'tr-TR', {
    style: 'currency',
    currency: props.stay?.currency || 'TRY'
  }).format(amount || 0)
}

const formatDate = dateStr => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString(localeMap[locale.value] || 'tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const formatTime = dateStr => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString(localeMap[locale.value] || 'tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
