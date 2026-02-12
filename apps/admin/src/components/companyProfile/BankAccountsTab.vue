<template>
  <div class="space-y-6">
    <!-- Bank Transfer Toggle -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-700 dark:text-slate-300">
          {{ $t('partners.paymentSettings.bankTransferEnabled') }}
        </p>
        <p class="text-xs text-gray-500 dark:text-slate-400">
          {{ $t('companyProfile.bankAccountsDescription') }}
        </p>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          v-model="localData.paymentSettings.bankTransferEnabled"
          type="checkbox"
          class="sr-only peer"
        />
        <div
          class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"
        ></div>
      </label>
    </div>

    <!-- Bank Accounts -->
    <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
      <BankAccountManager v-model="localData.paymentSettings.bankAccounts" />
    </div>

    <!-- Save Button -->
    <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        :disabled="saving"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        @click="handleSave"
      >
        <span v-if="saving" class="material-icons animate-spin text-lg">refresh</span>
        <span v-else class="material-icons text-lg">save</span>
        {{ $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BankAccountManager from '@/components/common/BankAccountManager.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const localData = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const handleSave = () => {
  emit('save')
}
</script>
