<template>
  <div class="space-y-8">
    <!-- Basic Info Section -->
    <div>
      <div class="flex items-center gap-2 mb-4">
        <span class="material-icons text-purple-600">business</span>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
          {{ $t('agencies.basicInfo') }}
        </h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField :label="$t('agencies.companyName')" :error="errors.companyName" required>
          <input
            v-model="form.companyName"
            type="text"
            class="form-input"
            :class="{ 'has-error': errors.companyName }"
            :placeholder="$t('agencies.companyNamePlaceholder')"
            @input="errors.companyName = ''"
          />
        </FormField>

        <FormField :label="$t('agencies.tradeName')">
          <input
            v-model="form.tradeName"
            type="text"
            class="form-input"
            :placeholder="$t('agencies.tradeNamePlaceholder')"
          />
        </FormField>

        <FormField :label="$t('agencies.email')" :error="errors.email" required>
          <div class="relative">
            <span
              class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
              >email</span
            >
            <input
              v-model="form.email"
              type="email"
              class="form-input pl-10"
              :class="{ 'has-error': errors.email }"
              placeholder="ornek@acente.com"
              @input="errors.email = ''"
            />
          </div>
        </FormField>

        <FormField :label="$t('agencies.phone')">
          <div class="relative">
            <span
              class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
              >phone</span
            >
            <input
              v-model="form.phone"
              type="text"
              class="form-input pl-10"
              placeholder="+90 555 123 45 67"
            />
          </div>
        </FormField>

        <FormField :label="$t('agencies.taxOffice')">
          <input
            v-model="form.taxOffice"
            type="text"
            class="form-input"
            :placeholder="$t('agencies.taxOfficePlaceholder')"
          />
        </FormField>

        <FormField :label="$t('agencies.taxNumber')">
          <input
            v-model="form.taxNumber"
            type="text"
            class="form-input"
            placeholder="1234567890"
          />
        </FormField>

        <FormField :label="$t('common.status.label')">
          <select v-model="form.status" class="form-input">
            <option value="active">{{ $t('common.active') }}</option>
            <option value="inactive">{{ $t('common.inactive') }}</option>
            <option value="pending">{{ $t('common.pending') }}</option>
          </select>
        </FormField>
      </div>
    </div>

    <!-- Address Section -->
    <div>
      <div class="flex items-center gap-2 mb-4">
        <span class="material-icons text-purple-600">location_on</span>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
          {{ $t('agencies.addressTitle') }}
        </h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="md:col-span-2">
          <FormField :label="$t('agencies.street')">
            <input
              v-model="form.address.street"
              type="text"
              class="form-input"
              :placeholder="$t('agencies.streetPlaceholder')"
            />
          </FormField>
        </div>
        <FormField :label="$t('agencies.city')">
          <input v-model="form.address.city" type="text" class="form-input" />
        </FormField>
        <FormField :label="$t('agencies.country')">
          <CountrySelect v-model="form.address.country" />
        </FormField>
        <FormField :label="$t('agencies.postalCode')">
          <input v-model="form.address.postalCode" type="text" class="form-input" />
        </FormField>
      </div>
    </div>
  </div>
</template>

<script setup>
import FormField from '@/components/common/FormField.vue'
import CountrySelect from '@/components/common/CountrySelect.vue'

defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, required: true }
})
</script>
