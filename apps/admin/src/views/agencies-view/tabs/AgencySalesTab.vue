<template>
  <div class="space-y-8">
    <!-- Allowed Countries -->
    <div>
      <div class="flex items-center gap-2 mb-4">
        <span class="material-icons text-blue-600">public</span>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
          {{ $t('agencies.allowedCountries') }}
        </h3>
      </div>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-3">
        {{ $t('agencies.allowedCountriesDesc') }}
      </p>
      <div
        v-if="form.salesRestrictions.allowedCountries.length"
        class="flex flex-wrap gap-2 mb-3"
      >
        <span
          v-for="code in form.salesRestrictions.allowedCountries"
          :key="code"
          class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
        >
          <img
            :src="`/flags/${code.toLowerCase()}.svg`"
            :alt="code"
            class="w-5 h-3.5 object-contain"
          />
          {{ getCountryLabel(code) }}
          <button
            type="button"
            class="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
            @click="$emit('remove-country', code)"
          >
            <span class="material-icons text-sm">close</span>
          </button>
        </span>
      </div>
      <CountrySelect
        :model-value="selectedCountryToAdd"
        :placeholder="$t('agencies.selectCountryToAdd')"
        @update:model-value="$emit('add-country', $event)"
      />
    </div>

    <!-- Allowed Hotels -->
    <div>
      <div class="flex items-center gap-2 mb-4">
        <span class="material-icons text-green-600">hotel</span>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
          {{ $t('agencies.allowedHotels') }}
        </h3>
      </div>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-3">
        {{ $t('agencies.allowedHotelsDesc') }}
      </p>
      <HotelAutocomplete
        v-model="form.salesRestrictions.allowedHotels"
        :hotels="hotels"
        :placeholder="$t('agencies.searchHotelToAdd')"
        variant="green"
      />
    </div>

    <!-- Blocked Hotels -->
    <div>
      <div class="flex items-center gap-2 mb-4">
        <span class="material-icons text-red-600">block</span>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
          {{ $t('agencies.blockedHotels') }}
        </h3>
      </div>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-3">
        {{ $t('agencies.blockedHotelsDesc') }}
      </p>
      <HotelAutocomplete
        v-model="form.salesRestrictions.blockedHotels"
        :hotels="hotels"
        :placeholder="$t('agencies.searchHotelToBlock')"
        variant="red"
      />
    </div>
  </div>
</template>

<script setup>
import CountrySelect from '@/components/common/CountrySelect.vue'
import HotelAutocomplete from '@/components/common/HotelAutocomplete.vue'

defineProps({
  form: { type: Object, required: true },
  hotels: { type: Array, default: () => [] },
  selectedCountryToAdd: { type: String, default: '' },
  getCountryLabel: { type: Function, required: true }
})

defineEmits(['add-country', 'remove-country'])
</script>
