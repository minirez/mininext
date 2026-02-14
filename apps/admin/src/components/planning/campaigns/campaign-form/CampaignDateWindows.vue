<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
    <!-- Stay Window -->
    <div
      class="p-3 rounded-lg border-2 transition-colors"
      :class="
        validationErrors.stayDates
          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
          : 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
      "
    >
      <div class="flex items-center gap-2 mb-2">
        <span
          class="material-icons text-sm"
          :class="validationErrors.stayDates ? 'text-red-500' : 'text-teal-500'"
          >date_range</span
        >
        <span class="font-medium text-sm text-gray-800 dark:text-white"
          >{{ $t('planning.campaigns.stayWindow') }} <span class="text-red-500">*</span></span
        >
      </div>
      <DateRangeDual
        :model-value="stayDateRange"
        :allow-past="true"
        @update:model-value="onStayDateChange"
      />
      <div class="mt-2 flex flex-wrap gap-1">
        <button
          v-for="(day, key) in weekdays"
          :key="key"
          type="button"
          class="px-2 py-0.5 text-xs rounded font-medium transition-all"
          :class="
            stayDays.includes(key)
              ? 'bg-teal-500 text-white'
              : 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400'
          "
          @click="$emit('toggle-stay-day', key)"
        >
          {{ $t(`planning.campaigns.weekdays.${key}`) }}
        </button>
      </div>
      <p v-if="validationErrors.stayDates" class="form-error mt-2">
        <span class="material-icons text-sm">error_outline</span>
        {{ $t('planning.campaigns.selectStayDates') }}
      </p>
    </div>

    <!-- Booking Window -->
    <div
      class="p-3 rounded-lg border-2 transition-colors"
      :class="
        validationErrors.bookingDates
          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
          : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
      "
    >
      <div class="flex items-center gap-2 mb-2">
        <span
          class="material-icons text-sm"
          :class="validationErrors.bookingDates ? 'text-red-500' : 'text-rose-500'"
          >event_available</span
        >
        <span class="font-medium text-sm text-gray-800 dark:text-white"
          >{{ $t('planning.campaigns.bookingWindow') }} <span class="text-red-500">*</span></span
        >
      </div>
      <DateRangeDual
        :model-value="bookingDateRange"
        :allow-past="true"
        @update:model-value="onBookingDateChange"
      />
      <div class="mt-2 flex flex-wrap gap-1">
        <button
          v-for="(day, key) in weekdays"
          :key="key"
          type="button"
          class="px-2 py-0.5 text-xs rounded font-medium transition-all"
          :class="
            bookingDays.includes(key)
              ? 'bg-rose-500 text-white'
              : 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400'
          "
          @click="$emit('toggle-booking-day', key)"
        >
          {{ $t(`planning.campaigns.weekdays.${key}`) }}
        </button>
      </div>
      <p v-if="validationErrors.bookingDates" class="form-error mt-2">
        <span class="material-icons text-sm">error_outline</span>
        {{ $t('planning.campaigns.selectBookingDates') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import DateRangeDual from '@/components/common/DateRangeDual.vue'

const props = defineProps({
  stayDateRange: { type: Object, required: true },
  bookingDateRange: { type: Object, required: true },
  stayDays: { type: Array, required: true },
  bookingDays: { type: Array, required: true },
  weekdays: { type: Object, required: true },
  validationErrors: { type: Object, required: true }
})

const emit = defineEmits([
  'update:stay-date-range',
  'update:booking-date-range',
  'toggle-stay-day',
  'toggle-booking-day'
])

const onStayDateChange = val => {
  emit('update:stay-date-range', val)
  props.validationErrors.stayDates = false
}

const onBookingDateChange = val => {
  emit('update:booking-date-range', val)
  props.validationErrors.bookingDates = false
}
</script>
