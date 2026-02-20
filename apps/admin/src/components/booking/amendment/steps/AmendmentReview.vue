<template>
  <div class="space-y-6">
    <div class="text-center mb-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ $t('booking.amendment.reviewTitle') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ $t('booking.amendment.reviewDescription') }}
      </p>
    </div>

    <!-- Before / After Comparison -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Original (Before) -->
      <div
        class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
      >
        <div class="flex items-center gap-2 mb-4">
          <span class="material-icons text-gray-400">history</span>
          <h4 class="font-medium text-gray-700 dark:text-gray-300">
            {{ $t('booking.amendment.before') }}
          </h4>
        </div>

        <div class="space-y-4">
          <!-- Dates -->
          <div class="flex items-start gap-3">
            <span class="material-icons text-gray-400 text-sm mt-1">calendar_today</span>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('booking.dates') }}</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatDate(originalData?.checkIn) }} - {{ formatDate(originalData?.checkOut) }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ originalData?.nights }} {{ $t('booking.nightsUnit') }}
              </p>
            </div>
          </div>

          <!-- Rooms -->
          <div class="flex items-start gap-3">
            <span class="material-icons text-gray-400 text-sm mt-1">bed</span>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('booking.rooms') }}</p>
              <div
                v-for="(room, i) in originalData?.rooms"
                :key="i"
                class="font-medium text-gray-900 dark:text-white"
              >
                {{ getRoomTypeName(room) }} / {{ getMealPlanName(room) }}
              </div>
            </div>
          </div>

          <!-- Lead Guest -->
          <div class="flex items-start gap-3">
            <span class="material-icons text-gray-400 text-sm mt-1">person</span>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('booking.leadGuest') }}</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ originalData?.leadGuest?.firstName }} {{ originalData?.leadGuest?.lastName }}
              </p>
            </div>
          </div>

          <!-- Price -->
          <div class="flex items-start gap-3 pt-3 border-t dark:border-gray-600">
            <span class="material-icons text-gray-400 text-sm mt-1">payments</span>
            <div class="flex-1">
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('booking.grandTotal') }}</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{
                  formatCurrency(originalData?.pricing?.grandTotal, originalData?.pricing?.currency)
                }}
              </p>
              <p
                v-if="
                  originalData?.cancellationGuarantee?.purchased ||
                  booking?.cancellationGuarantee?.purchased
                "
                class="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1"
              >
                <span class="material-icons" style="font-size: 12px">verified_user</span>
                {{ $t('booking.cancellationGuarantee') }}
                ({{
                  booking?.cancellationGuarantee?.rate || originalData?.cancellationGuarantee?.rate
                }}%)
                {{
                  formatCurrency(
                    booking?.cancellationGuarantee?.amount ||
                      originalData?.cancellationGuarantee?.amount,
                    originalData?.pricing?.currency
                  )
                }}
                {{ $t('booking.amendment.included') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- New (After) -->
      <div
        class="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border-2 border-indigo-300 dark:border-indigo-700"
      >
        <div class="flex items-center gap-2 mb-4">
          <span class="material-icons text-indigo-500">update</span>
          <h4 class="font-medium text-indigo-700 dark:text-indigo-300">
            {{ $t('booking.amendment.after') }}
          </h4>
        </div>

        <div class="space-y-4">
          <!-- Dates -->
          <div class="flex items-start gap-3">
            <span class="material-icons text-indigo-400 text-sm mt-1">calendar_today</span>
            <div>
              <p class="text-sm text-indigo-500 dark:text-indigo-400">{{ $t('booking.dates') }}</p>
              <p class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                {{ formatDate(previewData?.preview?.checkIn || formData?.checkIn) }} -
                {{ formatDate(previewData?.preview?.checkOut || formData?.checkOut) }}
                <span v-if="hasDateChange" class="text-amber-500 material-icons text-sm">bolt</span>
              </p>
              <p class="text-xs text-indigo-500 dark:text-indigo-400">
                {{ previewData?.preview?.nights || calculatedNights }}
                {{ $t('booking.nightsUnit') }}
              </p>
            </div>
          </div>

          <!-- Rooms -->
          <div class="flex items-start gap-3">
            <span class="material-icons text-indigo-400 text-sm mt-1">bed</span>
            <div>
              <p class="text-sm text-indigo-500 dark:text-indigo-400">{{ $t('booking.rooms') }}</p>
              <div
                v-for="(room, i) in previewData?.preview?.rooms || formData?.rooms"
                :key="i"
                class="font-medium text-gray-900 dark:text-white flex items-center gap-2"
              >
                {{
                  room.roomTypeName?.[locale] ||
                  room.roomTypeName?.tr ||
                  getSelectedRoomTypeName(room.roomTypeId)
                }}
                /
                {{
                  room.mealPlanName?.[locale] ||
                  room.mealPlanName?.tr ||
                  getSelectedMealPlanName(room.mealPlanId)
                }}
                <span v-if="hasRoomChange(i)" class="text-amber-500 material-icons text-sm"
                  >bolt</span
                >
              </div>
            </div>
          </div>

          <!-- Lead Guest -->
          <div class="flex items-start gap-3">
            <span class="material-icons text-indigo-400 text-sm mt-1">person</span>
            <div>
              <p class="text-sm text-indigo-500 dark:text-indigo-400">
                {{ $t('booking.leadGuest') }}
              </p>
              <p class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                {{ formData?.leadGuest?.firstName }} {{ formData?.leadGuest?.lastName }}
                <span v-if="hasGuestChange" class="text-amber-500 material-icons text-sm"
                  >bolt</span
                >
              </p>
            </div>
          </div>

          <!-- Price -->
          <div
            class="flex items-start gap-3 pt-3 border-t border-indigo-200 dark:border-indigo-700"
          >
            <span class="material-icons text-indigo-400 text-sm mt-1">payments</span>
            <div class="flex-1">
              <p class="text-sm text-indigo-500 dark:text-indigo-400">
                {{ $t('booking.grandTotal') }}
              </p>
              <p class="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                {{ formatCurrency(newGrandTotal, originalData?.pricing?.currency) }}
              </p>
              <p
                v-if="
                  previewData?.preview?.cancellationGuarantee?.purchased ||
                  booking?.cancellationGuarantee?.purchased
                "
                class="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1"
              >
                <span class="material-icons" style="font-size: 12px">verified_user</span>
                {{ $t('booking.cancellationGuarantee') }}
                ({{ booking?.cancellationGuarantee?.rate }}%)
                {{
                  formatCurrency(
                    booking?.cancellationGuarantee?.amount,
                    originalData?.pricing?.currency
                  )
                }}
                {{ $t('booking.amendment.included') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Changes List -->
    <div
      v-if="previewData?.changes?.length > 0"
      class="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
    >
      <h4 class="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-amber-500">change_circle</span>
        {{ $t('booking.amendment.changesList') }}
      </h4>

      <div class="space-y-2">
        <div
          v-for="(change, index) in previewData.changes"
          :key="index"
          class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg"
        >
          <span class="material-icons text-amber-500 text-sm">arrow_forward</span>
          <div class="flex-1">
            <span class="font-medium text-gray-900 dark:text-white">{{ change.fieldLabel }}</span>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400 line-through">
            {{ formatChangeValue(change.from) }}
          </div>
          <span class="material-icons text-gray-400 text-sm">trending_flat</span>
          <div class="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {{ formatChangeValue(change.to) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Price Difference Card -->
    <div
      v-if="previewData?.priceDifference"
      class="rounded-xl p-6 border-2"
      :class="priceDifferenceCardClass"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center"
            :class="priceDifferenceIconClass"
          >
            <span class="material-icons text-2xl">{{ priceDifferenceIcon }}</span>
          </div>
          <div>
            <h4 class="font-medium" :class="priceDifferenceTextClass">
              {{ priceDifferenceTitle }}
            </h4>
            <p class="text-sm opacity-75" :class="priceDifferenceTextClass">
              {{ priceDifferenceDescription }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold" :class="priceDifferenceTextClass">
            {{ previewData.priceDifference.isIncrease ? '+' : ''
            }}{{
              formatCurrency(
                previewData.priceDifference.difference,
                previewData.priceDifference.currency
              )
            }}
          </p>
          <button
            v-if="previewData.priceDifference.difference !== 0"
            class="mt-2 text-sm underline hover:no-underline"
            :class="priceDifferenceTextClass"
            @click="$emit('adjust-price')"
          >
            {{ $t('booking.amendment.adjustPrice') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  booking: { type: Object, default: null },
  originalData: { type: Object, default: null },
  previewData: { type: Object, default: null },
  formData: { type: Object, default: null },
  availableRoomTypes: { type: Array, default: () => [] },
  availableMealPlans: { type: Array, default: () => [] }
})

defineEmits(['adjust-price'])

const { locale, t } = useI18n()

// Computed
const newGrandTotal = computed(() => {
  // Try to get grandTotal from different sources
  const fromPreview = props.previewData?.preview?.pricing?.grandTotal
  const fromPriceDiff = props.previewData?.priceDifference?.newTotal

  // Handle 0 properly (0 is a valid value, not falsy for our purposes)
  if (fromPreview !== undefined && fromPreview !== null) return fromPreview
  if (fromPriceDiff !== undefined && fromPriceDiff !== null) return fromPriceDiff

  return null
})
const calculatedNights = computed(() => {
  if (!props.formData?.checkIn || !props.formData?.checkOut) return 0
  const checkIn = new Date(props.formData.checkIn)
  const checkOut = new Date(props.formData.checkOut)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

const hasDateChange = computed(() => {
  return props.previewData?.changes?.some(c => c.field === 'checkIn' || c.field === 'checkOut')
})

const hasGuestChange = computed(() => {
  return props.previewData?.changes?.some(c => c.field.startsWith('leadGuest'))
})

const hasRoomChange = index => {
  return props.previewData?.changes?.some(c => c.field.includes(`rooms[${index}]`))
}

// Price difference styling
const priceDifferenceCardClass = computed(() => {
  const diff = props.previewData?.priceDifference?.difference || 0
  if (diff > 0) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
  if (diff < 0) return 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
  return 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600'
})

const priceDifferenceIconClass = computed(() => {
  const diff = props.previewData?.priceDifference?.difference || 0
  if (diff > 0) return 'bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400'
  if (diff < 0) return 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400'
  return 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
})

const priceDifferenceTextClass = computed(() => {
  const diff = props.previewData?.priceDifference?.difference || 0
  if (diff > 0) return 'text-amber-700 dark:text-amber-300'
  if (diff < 0) return 'text-green-700 dark:text-green-300'
  return 'text-gray-700 dark:text-gray-300'
})

const priceDifferenceIcon = computed(() => {
  const diff = props.previewData?.priceDifference?.difference || 0
  if (diff > 0) return 'add_circle'
  if (diff < 0) return 'remove_circle'
  return 'check_circle'
})

const priceDifferenceTitle = computed(() => {
  const diff = props.previewData?.priceDifference?.difference || 0
  if (diff > 0) return t('booking.amendment.additionalCharge')
  if (diff < 0) return t('booking.amendment.refundDue')
  return t('booking.amendment.noChange')
})

const priceDifferenceDescription = computed(() => {
  const diff = props.previewData?.priceDifference?.difference || 0
  if (diff > 0) return t('booking.amendment.additionalChargeDesc')
  if (diff < 0) return t('booking.amendment.refundDueDesc')
  return t('booking.amendment.noChangeDesc')
})

// Methods
const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
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

const getSelectedRoomTypeName = id => {
  if (!id) return '-'
  const roomType = props.availableRoomTypes.find(rt => rt._id === id || rt._id?.toString() === id)
  if (!roomType) return id
  const name = roomType.name
  return typeof name === 'object'
    ? name[locale.value] || name.tr || name.en
    : name || roomType.code || id
}

const getSelectedMealPlanName = id => {
  if (!id) return '-'
  const mealPlan = props.availableMealPlans.find(mp => mp._id === id || mp._id?.toString() === id)
  if (!mealPlan) return id
  const name = mealPlan.name
  return typeof name === 'object'
    ? name[locale.value] || name.tr || name.en
    : name || mealPlan.code || id
}

const formatChangeValue = value => {
  if (value === null || value === undefined) return '-'
  if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
    return formatDate(value)
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
</script>
