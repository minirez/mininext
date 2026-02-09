<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ $t('settings.frontDesk.title') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">
        {{ $t('settings.frontDesk.description') }}
      </p>
    </div>

    <!-- Check-in/Check-out Times -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('settings.frontDesk.checkInOutTimes') }}
      </h4>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('settings.frontDesk.defaultCheckInTime') }}
          </label>
          <input
            v-model="localSettings.defaultCheckInTime"
            type="time"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @change="emitChange"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('settings.frontDesk.defaultCheckOutTime') }}
          </label>
          <input
            v-model="localSettings.defaultCheckOutTime"
            type="time"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @change="emitChange"
          />
        </div>
      </div>
    </div>

    <!-- Early/Late Options -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('settings.frontDesk.earlyLateSection') }}
      </h4>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ $t('settings.frontDesk.allowEarlyCheckIn') }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('settings.frontDesk.allowEarlyCheckInDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localSettings.allowEarlyCheckIn"
              type="checkbox"
              class="sr-only peer"
              @change="emitChange"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
            ></div>
          </label>
        </div>

        <div v-if="localSettings.allowEarlyCheckIn">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('settings.frontDesk.earlyCheckInFee') }}
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="localSettings.earlyCheckInFee"
              type="number"
              min="0"
              class="w-32 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              @input="emitChange"
            />
            <span class="text-gray-500 dark:text-slate-400">{{
              $t('settings.frontDesk.perHour')
            }}</span>
          </div>
        </div>

        <div
          class="border-t border-gray-200 dark:border-slate-600 pt-4 flex items-center justify-between"
        >
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ $t('settings.frontDesk.allowLateCheckOut') }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('settings.frontDesk.allowLateCheckOutDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localSettings.allowLateCheckOut"
              type="checkbox"
              class="sr-only peer"
              @change="emitChange"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
            ></div>
          </label>
        </div>

        <div v-if="localSettings.allowLateCheckOut">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('settings.frontDesk.lateCheckOutFee') }}
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="localSettings.lateCheckOutFee"
              type="number"
              min="0"
              class="w-32 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              @input="emitChange"
            />
            <span class="text-gray-500 dark:text-slate-400">{{
              $t('settings.frontDesk.perHour')
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Settings -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('settings.frontDesk.paymentSettings') }}
      </h4>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('settings.frontDesk.defaultPaymentMethod') }}
          </label>
          <select
            v-model="localSettings.defaultPaymentMethod"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @change="emitChange"
          >
            <option value="cash">{{ $t('settings.frontDesk.paymentMethods.cash') }}</option>
            <option value="credit_card">
              {{ $t('settings.frontDesk.paymentMethods.creditCard') }}
            </option>
            <option value="debit_card">
              {{ $t('settings.frontDesk.paymentMethods.debitCard') }}
            </option>
            <option value="bank_transfer">
              {{ $t('settings.frontDesk.paymentMethods.bankTransfer') }}
            </option>
          </select>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ $t('settings.frontDesk.requireDepositWalkIn') }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('settings.frontDesk.requireDepositWalkInDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localSettings.requireDepositForWalkIn"
              type="checkbox"
              class="sr-only peer"
              @change="emitChange"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
            ></div>
          </label>
        </div>

        <div v-if="localSettings.requireDepositForWalkIn">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('settings.frontDesk.minDepositPercent') }}
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="localSettings.minimumDepositPercent"
              type="number"
              min="0"
              max="100"
              class="w-24 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              @input="emitChange"
            />
            <span class="text-gray-500 dark:text-slate-400">%</span>
          </div>
        </div>

        <div
          class="border-t border-gray-200 dark:border-slate-600 pt-4 flex items-center justify-between"
        >
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ $t('settings.frontDesk.requireZeroBalance') }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('settings.frontDesk.requireZeroBalanceDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localSettings.requireZeroBalanceCheckOut"
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
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const localSettings = ref({
  defaultCheckInTime: '14:00',
  defaultCheckOutTime: '12:00',
  allowEarlyCheckIn: true,
  allowLateCheckOut: true,
  earlyCheckInFee: 0,
  lateCheckOutFee: 0,
  defaultPaymentMethod: 'cash',
  requireDepositForWalkIn: true,
  minimumDepositPercent: 50,
  requireZeroBalanceCheckOut: true,
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
</script>
