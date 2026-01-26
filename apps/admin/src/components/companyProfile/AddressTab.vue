<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 gap-6">
      <!-- Street -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('companyProfile.fields.street') }}
        </label>
        <textarea
          v-model="localAddress.street"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                 focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                 dark:bg-gray-700 dark:text-white resize-none"
          :placeholder="$t('partners.streetPlaceholder')"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- City -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('companyProfile.fields.city') }}
          </label>
          <input
            type="text"
            v-model="localAddress.city"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   dark:bg-gray-700 dark:text-white"
            placeholder="Istanbul"
          />
        </div>

        <!-- Country -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('companyProfile.fields.country') }}
          </label>
          <input
            type="text"
            v-model="localAddress.country"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   dark:bg-gray-700 dark:text-white"
            placeholder="Turkey"
          />
        </div>

        <!-- Postal Code -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ $t('companyProfile.fields.postalCode') }}
          </label>
          <input
            type="text"
            v-model="localAddress.postalCode"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   dark:bg-gray-700 dark:text-white"
            placeholder="34000"
          />
        </div>
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

const localAddress = computed({
  get: () => props.modelValue.address || {},
  set: value => {
    emit('update:modelValue', {
      ...props.modelValue,
      address: value
    })
  }
})

const handleSave = () => {
  emit('save')
}
</script>
