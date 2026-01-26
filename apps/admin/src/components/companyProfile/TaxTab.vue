<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Tax Office -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('companyProfile.fields.taxOffice') }}
        </label>
        <input
          type="text"
          v-model="localData.taxOffice"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                 focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                 dark:bg-gray-700 dark:text-white"
          :placeholder="$t('partners.taxOfficePlaceholder')"
        />
      </div>

      <!-- Tax Number -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('companyProfile.fields.taxNumber') }}
        </label>
        <input
          type="text"
          v-model="localData.taxNumber"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                 focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                 dark:bg-gray-700 dark:text-white"
          placeholder="1234567890"
        />
      </div>
    </div>

    <!-- Info Box -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div class="flex">
        <span class="material-icons text-blue-500 mr-3">info</span>
        <p class="text-sm text-blue-700 dark:text-blue-300">
          {{ $t('companyProfile.taxInfoNote') || 'Vergi bilgileri fatura ve resmi belgelerinizde kullanılacaktır.' }}
        </p>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        @click="handleSave"
        :disabled="saving"
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

const handleSave = () => {
  emit('save')
}
</script>
