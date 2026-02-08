<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ $t('settings.reservations.title') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">
        {{ $t('settings.reservations.description') }}
      </p>
    </div>

    <!-- Booking Rules -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('settings.reservations.rules') }}
      </h4>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('settings.reservations.minStay') }}
          </label>
          <input
            v-model.number="localSettings.minimumStay"
            type="number"
            min="1"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('settings.reservations.maxStay') }}
          </label>
          <input
            v-model.number="localSettings.maximumStay"
            type="number"
            min="1"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('settings.reservations.advanceBooking') }}
          </label>
          <input
            v-model.number="localSettings.advanceBookingDays"
            type="number"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('settings.reservations.advanceBookingHelp') }}
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('settings.reservations.autoCancel') }}
          </label>
          <input
            v-model.number="localSettings.autoCancelHours"
            type="number"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('settings.reservations.autoCancelHelp') }}
          </p>
        </div>
      </div>

      <div class="space-y-4 pt-4 mt-4 border-t border-gray-200 dark:border-slate-600">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ $t('settings.reservations.sameDayReservation') }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('settings.reservations.sameDayReservationDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localSettings.allowSameDayBooking"
              type="checkbox"
              class="sr-only peer"
              @change="emitChange"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
            ></div>
          </label>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ $t('settings.reservations.requireConfirmation') }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('settings.reservations.requireConfirmationDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localSettings.requireConfirmation"
              type="checkbox"
              class="sr-only peer"
              @change="emitChange"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
            ></div>
          </label>
        </div>
      </div>
    </div>

    <!-- Booking Sources -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">
          {{ $t('settings.reservations.sources') }}
        </h4>
        <button
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
          @click="addBookingSource"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('settings.reservations.newSource') }}
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(source, index) in localSettings.bookingSources"
          :key="source._id || index"
          class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600 flex items-center gap-3"
        >
          <input
            v-model="source.code"
            type="text"
            :placeholder="$t('settings.reservations.code')"
            class="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <input
            v-model="source.name"
            type="text"
            :placeholder="$t('settings.reservations.sourceName')"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <div class="flex items-center gap-1">
            <input
              v-model.number="source.commission"
              type="number"
              min="0"
              max="100"
              class="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              @input="emitChange"
            />
            <span class="text-xs text-gray-500">%</span>
          </div>
          <label class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <input
              v-model="source.isActive"
              type="checkbox"
              class="w-3 h-3 text-indigo-600 border-gray-300 rounded"
              @change="emitChange"
            />
            {{ $t('settings.reservations.active') }}
          </label>
          <button
            class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            @click="removeBookingSource(index)"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Cancellation Reasons -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">
          {{ $t('settings.reservations.cancelReasons') }}
        </h4>
        <button
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
          @click="addCancellationReason"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('settings.reservations.newReason') }}
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(reason, index) in localSettings.cancellationReasons"
          :key="reason._id || index"
          class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600 flex items-center gap-3"
        >
          <input
            v-model="reason.code"
            type="text"
            :placeholder="$t('settings.reservations.code')"
            class="w-28 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <input
            v-model="reason.name"
            type="text"
            :placeholder="$t('settings.reservations.reasonName')"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <label class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <input
              v-model="reason.isActive"
              type="checkbox"
              class="w-3 h-3 text-indigo-600 border-gray-300 rounded"
              @change="emitChange"
            />
            {{ $t('settings.reservations.active') }}
          </label>
          <button
            class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            @click="removeCancellationReason(index)"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const localSettings = ref({
  minimumStay: 1,
  maximumStay: 30,
  advanceBookingDays: 365,
  allowSameDayBooking: true,
  requireConfirmation: false,
  autoCancelHours: 24,
  bookingSources: [],
  cancellationReasons: [],
  ...props.modelValue
})

watch(
  () => props.modelValue,
  newVal => {
    localSettings.value = { ...localSettings.value, ...newVal }
  },
  { deep: true }
)

const emitChange = () => {
  emit('update:modelValue', localSettings.value)
  emit('change')
}

const addBookingSource = () => {
  if (!localSettings.value.bookingSources) {
    localSettings.value.bookingSources = []
  }
  localSettings.value.bookingSources.push({
    code: '',
    name: '',
    isActive: true,
    commission: 0
  })
  emitChange()
}

const removeBookingSource = index => {
  localSettings.value.bookingSources.splice(index, 1)
  emitChange()
}

const addCancellationReason = () => {
  if (!localSettings.value.cancellationReasons) {
    localSettings.value.cancellationReasons = []
  }
  localSettings.value.cancellationReasons.push({
    code: '',
    name: '',
    isActive: true
  })
  emitChange()
}

const removeCancellationReason = index => {
  localSettings.value.cancellationReasons.splice(index, 1)
  emitChange()
}
</script>
