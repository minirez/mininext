<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 dark:border-slate-700 pb-4 mb-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{{ $t('hotels.pricing.title') }}</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">{{ $t('hotels.pricing.description') }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Fiyat Modeli -->
      <div class="md:col-span-2">
        <label class="form-label">{{ $t('hotels.pricing.model') }}</label>
        <div class="flex gap-4 mt-2">
          <label class="flex items-center cursor-pointer p-4 border rounded-lg transition-all"
                 :class="form.model === 'net' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-slate-700'">
            <input type="radio" v-model="form.model" value="net" class="form-radio mr-3" />
            <div>
              <div class="font-medium text-gray-800 dark:text-white">{{ $t('hotels.pricing.netPrice') }}</div>
              <div class="text-sm text-gray-500 dark:text-slate-400">{{ $t('hotels.pricing.netPriceDesc') }}</div>
            </div>
          </label>
          <label class="flex items-center cursor-pointer p-4 border rounded-lg transition-all"
                 :class="form.model === 'rack' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-slate-700'">
            <input type="radio" v-model="form.model" value="rack" class="form-radio mr-3" />
            <div>
              <div class="font-medium text-gray-800 dark:text-white">{{ $t('hotels.pricing.rackRate') }}</div>
              <div class="text-sm text-gray-500 dark:text-slate-400">{{ $t('hotels.pricing.rackRateDesc') }}</div>
            </div>
          </label>
        </div>
      </div>

      <!-- Net Price Model Settings -->
      <div v-if="form.model === 'net'" class="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div class="flex items-start gap-3">
          <span class="material-icons text-blue-500">info</span>
          <div>
            <h4 class="font-medium text-blue-800 dark:text-blue-300">{{ $t('hotels.pricing.netPriceInfo') }}</h4>
            <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">{{ $t('hotels.pricing.netPriceExample') }}</p>
          </div>
        </div>
        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('hotels.pricing.defaultMarkup') }} (%)</label>
            <input v-model.number="form.defaultMarkup" type="number" min="0" max="100" step="0.1" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Rack Rate Model Settings -->
      <div v-if="form.model === 'rack'" class="md:col-span-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <div class="flex items-start gap-3">
          <span class="material-icons text-amber-500">info</span>
          <div>
            <h4 class="font-medium text-amber-800 dark:text-amber-300">{{ $t('hotels.pricing.rackRateInfo') }}</h4>
            <p class="text-sm text-amber-600 dark:text-amber-400 mt-1">{{ $t('hotels.pricing.rackRateExample') }}</p>
          </div>
        </div>
        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('hotels.pricing.defaultCommission') }} (%)</label>
            <input v-model.number="form.defaultCommission" type="number" min="0" max="100" step="0.1" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Para Birimi -->
      <div>
        <label class="form-label">{{ $t('hotels.pricing.currency') }}</label>
        <select v-model="form.currency" class="form-input">
          <option value="EUR">EUR - Euro</option>
          <option value="USD">USD - US Dollar</option>
          <option value="TRY">TRY - Turkish Lira</option>
          <option value="GBP">GBP - British Pound</option>
        </select>
      </div>

      <!-- KDV Dahil -->
      <div>
        <label class="form-label">{{ $t('hotels.pricing.taxSettings') }}</label>
        <div class="flex items-center gap-4 mt-2">
          <label class="flex items-center cursor-pointer">
            <input type="checkbox" v-model="form.taxIncluded" class="form-checkbox mr-2" />
            <span class="text-gray-700 dark:text-slate-300">{{ $t('hotels.pricing.taxIncluded') }}</span>
          </label>
        </div>
      </div>

      <!-- KDV Oranı -->
      <div v-if="!form.taxIncluded">
        <label class="form-label">{{ $t('hotels.pricing.taxRate') }} (%)</label>
        <input v-model.number="form.taxRate" type="number" min="0" max="100" step="0.1" class="form-input" />
      </div>
    </div>

    <!-- Fiyat Akışı Gösterimi -->
    <div class="mt-8 p-6 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <h4 class="font-medium text-gray-800 dark:text-white mb-4">{{ $t('hotels.pricing.priceFlow') }}</h4>
      <div class="flex items-center justify-center gap-2 flex-wrap">
        <div class="text-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow">
          <span class="material-icons text-2xl text-gray-400">hotel</span>
          <div class="text-xs mt-1 text-gray-600 dark:text-slate-400">{{ $t('hotels.pricing.hotelPrice') }}</div>
          <div class="font-medium">{{ form.model === 'net' ? $t('hotels.pricing.netPrice') : $t('hotels.pricing.rackRate') }}</div>
        </div>
        <span class="material-icons text-gray-400">arrow_forward</span>
        <div class="text-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow">
          <span class="material-icons text-2xl text-purple-500">business</span>
          <div class="text-xs mt-1 text-gray-600 dark:text-slate-400">{{ $t('hotels.pricing.partner') }}</div>
          <div class="font-medium text-purple-600">
            {{ form.model === 'net' ? `+${form.defaultMarkup || 0}%` : `-${form.defaultCommission || 0}%` }}
          </div>
        </div>
        <span class="material-icons text-gray-400">arrow_forward</span>
        <div class="text-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow">
          <span class="material-icons text-2xl text-blue-500">storefront</span>
          <div class="text-xs mt-1 text-gray-600 dark:text-slate-400">{{ $t('hotels.pricing.agency') }}</div>
          <div class="font-medium text-blue-600">+{{ $t('hotels.pricing.agencyMarkup') }}</div>
        </div>
        <span class="material-icons text-gray-400">arrow_forward</span>
        <div class="text-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow">
          <span class="material-icons text-2xl text-green-500">person</span>
          <div class="text-xs mt-1 text-gray-600 dark:text-slate-400">{{ $t('hotels.pricing.customer') }}</div>
          <div class="font-medium text-green-600">{{ $t('hotels.pricing.finalPrice') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const form = ref({
  model: 'net',
  defaultMarkup: 20,
  defaultCommission: 15,
  currency: 'EUR',
  taxIncluded: true,
  taxRate: 10
})

// Initialize form from hotel data
watch(() => props.hotel, (newHotel) => {
  if (newHotel?.pricingSettings) {
    form.value = {
      model: newHotel.pricingSettings.model || 'net',
      defaultMarkup: newHotel.pricingSettings.defaultMarkup ?? 20,
      defaultCommission: newHotel.pricingSettings.defaultCommission ?? 15,
      currency: newHotel.pricingSettings.currency || 'EUR',
      taxIncluded: newHotel.pricingSettings.taxIncluded ?? true,
      taxRate: newHotel.pricingSettings.taxRate ?? 10
    }
  }
}, { immediate: true, deep: true })

// Expose methods for parent component
const getFormData = () => {
  return {
    pricingSettings: { ...form.value }
  }
}

const validateAll = () => {
  return true // No required validation for now
}

defineExpose({
  getFormData,
  validateAll
})
</script>
