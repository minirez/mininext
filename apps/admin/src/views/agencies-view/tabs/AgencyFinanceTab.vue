<template>
  <div class="space-y-8">
    <!-- Working Mode Section -->
    <div>
      <div class="flex items-center gap-2 mb-4">
        <span class="material-icons text-green-600">settings</span>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
          {{ $t('agencies.workingMode') }}
        </h3>
      </div>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
        {{ $t('agencies.workingModeDesc') }}
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Net Option -->
        <label
          class="relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all"
          :class="
            form.commission.mode === 'net'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
          "
        >
          <input v-model="form.commission.mode" type="radio" value="net" class="sr-only" />
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="
                form.commission.mode === 'net'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
              "
            >
              <span class="material-icons">monetization_on</span>
            </div>
            <div>
              <p class="font-semibold text-gray-800 dark:text-white">
                {{ $t('agencies.workingModes.net') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('agencies.workingModes.netDesc') }}
              </p>
            </div>
          </div>
          <span
            v-if="form.commission.mode === 'net'"
            class="absolute top-3 right-3 material-icons text-blue-500"
            >check_circle</span
          >
        </label>

        <!-- Commission Option -->
        <label
          class="relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all"
          :class="
            form.commission.mode === 'commission'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
          "
        >
          <input
            v-model="form.commission.mode"
            type="radio"
            value="commission"
            class="sr-only"
          />
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="
                form.commission.mode === 'commission'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
              "
            >
              <span class="material-icons">percent</span>
            </div>
            <div>
              <p class="font-semibold text-gray-800 dark:text-white">
                {{ $t('agencies.workingModes.commission') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('agencies.workingModes.commissionDesc') }}
              </p>
            </div>
          </div>
          <span
            v-if="form.commission.mode === 'commission'"
            class="absolute top-3 right-3 material-icons text-green-500"
            >check_circle</span
          >
        </label>
      </div>

      <!-- Commission Rate (only shown when commission mode is selected) -->
      <div
        v-if="form.commission.mode === 'commission'"
        class="mt-6 bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800"
      >
        <div class="flex items-center gap-2 mb-4">
          <span class="material-icons text-green-600">percent</span>
          <h4 class="font-semibold text-gray-800 dark:text-white">
            {{ $t('agencies.commissionRate') }}
          </h4>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField :label="$t('agencies.hotelCommission')">
            <div class="relative">
              <input
                v-model.number="form.commission.hotel"
                type="number"
                min="0"
                max="100"
                step="0.5"
                class="form-input pr-10"
              />
              <span
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium"
                >%</span
              >
            </div>
          </FormField>
          <FormField :label="$t('agencies.tourCommission')">
            <div class="relative">
              <input
                v-model.number="form.commission.tour"
                type="number"
                min="0"
                max="100"
                step="0.5"
                class="form-input pr-10"
              />
              <span
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium"
                >%</span
              >
            </div>
          </FormField>
          <FormField :label="$t('agencies.transferCommission')">
            <div class="relative">
              <input
                v-model.number="form.commission.transfer"
                type="number"
                min="0"
                max="100"
                step="0.5"
                class="form-input pr-10"
              />
              <span
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium"
                >%</span
              >
            </div>
          </FormField>
        </div>
      </div>
    </div>

    <!-- Credit Limit Section -->
    <div>
      <div class="flex items-center gap-2 mb-4">
        <span class="material-icons text-blue-600">account_balance_wallet</span>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
          {{ $t('agencies.creditLimit') }}
        </h3>
      </div>
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
        <label class="flex items-center gap-3 cursor-pointer mb-5">
          <div class="relative">
            <input
              v-model="form.creditLimit.enabled"
              type="checkbox"
              class="sr-only peer"
            />
            <div
              class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"
            ></div>
          </div>
          <span class="font-medium text-gray-700 dark:text-slate-300">{{
            $t('agencies.enableCreditLimit')
          }}</span>
        </label>

        <div
          v-if="form.creditLimit.enabled"
          class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-200 dark:border-slate-600"
        >
          <FormField :label="$t('agencies.creditAmount')">
            <div class="relative">
              <input
                v-model.number="form.creditLimit.amount"
                type="number"
                min="0"
                class="form-input"
              />
            </div>
          </FormField>
          <FormField :label="$t('agencies.currency')">
            <select v-model="form.creditLimit.currency" class="form-input">
              <option v-for="currency in currencies" :key="currency" :value="currency">
                {{ currency }}
              </option>
            </select>
          </FormField>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import FormField from '@/components/common/FormField.vue'
import { CURRENCIES } from '@/constants'

defineProps({
  form: { type: Object, required: true }
})

const currencies = CURRENCIES
</script>
