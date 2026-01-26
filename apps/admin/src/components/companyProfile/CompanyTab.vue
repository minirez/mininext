<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Company Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('companyProfile.fields.companyName') }}
          <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          v-model="localData.companyName"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                 focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                 dark:bg-gray-700 dark:text-white"
          :placeholder="$t('partners.companyNamePlaceholder')"
        />
      </div>

      <!-- Trade Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('companyProfile.fields.tradeName') }}
        </label>
        <input
          type="text"
          v-model="localData.tradeName"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                 focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                 dark:bg-gray-700 dark:text-white"
          :placeholder="$t('partners.tradeNamePlaceholder')"
        />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ $t('partners.tradeNameHint') }}
        </p>
      </div>

      <!-- Phone -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('companyProfile.fields.phone') }}
        </label>
        <input
          type="tel"
          v-model="localData.phone"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                 focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                 dark:bg-gray-700 dark:text-white"
          placeholder="+90 XXX XXX XX XX"
        />
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        @click="handleSave"
        :disabled="saving || !isValid"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700
               disabled:opacity-50 disabled:cursor-not-allowed transition-colors
               flex items-center gap-2"
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

const isValid = computed(() => {
  return localData.value.companyName?.trim()?.length > 0
})

const handleSave = () => {
  if (isValid.value) {
    emit('save')
  }
}
</script>
