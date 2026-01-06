<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2 mb-4">
      <span class="material-icons text-purple-600">payment</span>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
        {{ $t('agencies.paymentSettingsTab') }}
      </h3>
    </div>

    <div class="space-y-4">
      <!-- Credit Card -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
        <label class="flex items-center gap-3 cursor-pointer">
          <div class="relative">
            <input
              type="checkbox"
              :checked="form.paymentSettings.allowedMethods.includes('creditCard')"
              class="sr-only peer"
              @change="$emit('toggle-payment', 'creditCard')"
            />
            <div
              class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"
            ></div>
          </div>
          <div class="flex items-center gap-2">
            <span class="material-icons text-purple-600">credit_card</span>
            <span class="font-medium text-gray-700 dark:text-slate-300">{{
              $t('agencies.paymentMethods.creditCard')
            }}</span>
          </div>
        </label>
        <div
          v-if="form.paymentSettings.allowedMethods.includes('creditCard')"
          class="mt-4 pl-14"
        >
          <FormField :label="$t('agencies.maxInstallments')">
            <div class="flex items-center gap-3">
              <input
                v-model.number="form.paymentSettings.maxInstallments"
                type="number"
                min="1"
                max="12"
                class="form-input w-24 text-center"
              />
              <span class="text-sm text-gray-500 dark:text-slate-400">
                {{
                  form.paymentSettings.maxInstallments === 1
                    ? $t('agencies.singlePayment')
                    : $t('agencies.installments')
                }}
              </span>
            </div>
            <p class="text-xs text-gray-400 dark:text-slate-500 mt-1">
              {{ $t('agencies.installmentsHint') }}
            </p>
          </FormField>
        </div>
      </div>

      <!-- Bank Transfer -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
        <label class="flex items-center gap-3 cursor-pointer">
          <div class="relative">
            <input
              type="checkbox"
              :checked="form.paymentSettings.allowedMethods.includes('bankTransfer')"
              class="sr-only peer"
              @change="$emit('toggle-payment', 'bankTransfer')"
            />
            <div
              class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
            ></div>
          </div>
          <div class="flex items-center gap-2">
            <span class="material-icons text-blue-600">account_balance</span>
            <span class="font-medium text-gray-700 dark:text-slate-300">{{
              $t('agencies.paymentMethods.bankTransfer')
            }}</span>
          </div>
        </label>
      </div>

      <!-- Cash -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
        <label class="flex items-center gap-3 cursor-pointer">
          <div class="relative">
            <input
              type="checkbox"
              :checked="form.paymentSettings.allowedMethods.includes('cash')"
              class="sr-only peer"
              @change="$emit('toggle-payment', 'cash')"
            />
            <div
              class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"
            ></div>
          </div>
          <div class="flex items-center gap-2">
            <span class="material-icons text-green-600">payments</span>
            <span class="font-medium text-gray-700 dark:text-slate-300">{{
              $t('agencies.paymentMethods.cash')
            }}</span>
          </div>
        </label>
      </div>

      <!-- Pay at Property -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
        <label class="flex items-center gap-3 cursor-pointer">
          <div class="relative">
            <input
              type="checkbox"
              :checked="form.paymentSettings.allowedMethods.includes('payAtProperty')"
              class="sr-only peer"
              @change="$emit('toggle-payment', 'payAtProperty')"
            />
            <div
              class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"
            ></div>
          </div>
          <div class="flex items-center gap-2">
            <span class="material-icons text-orange-600">hotel</span>
            <span class="font-medium text-gray-700 dark:text-slate-300">{{
              $t('agencies.paymentMethods.payAtProperty')
            }}</span>
          </div>
        </label>
        <p class="text-xs text-gray-400 dark:text-slate-500 mt-2 pl-14">
          {{ $t('agencies.payAtPropertyDesc') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import FormField from '@/components/common/FormField.vue'

defineProps({
  form: { type: Object, required: true }
})

defineEmits(['toggle-payment'])
</script>
