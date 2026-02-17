<template>
  <div class="space-y-4">
    <!-- Campaign Name (Multi-language) -->
    <div :class="{ 'has-validation-error': validationErrors.name }">
      <MultiLangInput
        v-model="form.name"
        :languages="supportedLanguages"
        :label="$t('planning.campaigns.name') + ' *'"
        :placeholder="$t('planning.campaigns.namePlaceholder')"
        @update:model-value="validationErrors.name = false"
      />
      <p v-if="validationErrors.name" class="form-error mt-1">
        <span class="material-icons text-sm">error_outline</span>
        {{ $t('validation.required') }}
      </p>
    </div>

    <!-- Campaign Type -->
    <div>
      <label class="form-label"
        >{{ $t('planning.campaigns.type') }} <span class="text-red-500">*</span></label
      >
      <select
        v-model="form.type"
        class="form-input w-full"
        :class="{ 'has-error': validationErrors.type }"
        @change="validationErrors.type = false"
      >
        <option value="" disabled>{{ $t('planning.campaigns.selectType') }}</option>
        <option v-for="ctype in campaignTypes" :key="ctype" :value="ctype">
          {{ $t(`planning.campaigns.types.${ctype}`) }}
        </option>
      </select>
      <p v-if="validationErrors.type" class="form-error">
        <span class="material-icons text-sm">error_outline</span>
        {{ $t('validation.required') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import MultiLangInput from '@/components/common/MultiLangInput.vue'

defineProps({
  form: { type: Object, required: true },
  validationErrors: { type: Object, required: true },
  supportedLanguages: { type: Array, required: true },
  campaignTypes: { type: Array, required: true }
})
</script>
