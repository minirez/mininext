<template>
  <div
    class="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 px-6 py-4"
  >
    <!-- Sepet Özeti -->
    <div class="flex items-start justify-between mb-3">
      <div>
        <div class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          {{ $t('partners.subscription.cartSummary') }}
        </div>

        <!-- Paket -->
        <div v-if="selectedPackage" class="text-sm text-gray-900 dark:text-white">
          {{ selectedPackage.name?.tr || selectedPackage.name?.en || selectedPackage.code }}
        </div>

        <!-- Ek hizmetler -->
        <div
          v-if="selectedServices.length > 0"
          class="text-xs text-gray-500 dark:text-slate-400 mt-0.5"
        >
          + {{ selectedServices.length }} {{ $t('partners.subscription.additionalServices') }}
        </div>

        <!-- Boş sepet -->
        <div
          v-if="!selectedPackage && selectedServices.length === 0"
          class="text-sm text-gray-400 dark:text-slate-500 italic"
        >
          {{ $t('partners.subscription.noPackageSelected') }}
        </div>
      </div>

      <div class="text-right">
        <!-- Dönem + Para birimi seçiciler -->
        <div class="flex items-center gap-2 mb-1">
          <select
            :value="interval"
            class="text-xs border border-gray-200 dark:border-slate-600 rounded px-1.5 py-0.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300"
            @change="$emit('interval-change', $event.target.value)"
          >
            <option value="monthly">{{ $t('partners.subscription.monthly') }}</option>
            <option value="yearly">{{ $t('partners.subscription.yearly') }}</option>
          </select>
          <select
            :value="currency"
            class="text-xs border border-gray-200 dark:border-slate-600 rounded px-1.5 py-0.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300"
            @change="$emit('currency-change', $event.target.value)"
          >
            <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <!-- Toplam -->
        <div class="text-lg font-bold text-gray-900 dark:text-white">
          {{ formattedTotal }}
        </div>
      </div>
    </div>

    <!-- Aksiyon butonları -->
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-1.5"
        :disabled="!hasSelection || loading"
        @click="$emit('send-payment-link')"
      >
        <span class="material-icons text-sm">send</span>
        {{ $t('partners.subscription.sendPaymentLink') }}
      </button>
      <button
        type="button"
        class="btn-secondary text-sm py-2 flex items-center justify-center gap-1.5"
        :disabled="!hasSelection || loading"
        @click="$emit('save-pending')"
      >
        <span class="material-icons text-sm">save</span>
        {{ $t('partners.subscription.saveAsPending') }}
      </button>
      <button
        type="button"
        class="btn text-sm py-2 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white"
        :disabled="!hasSelection || loading"
        @click="$emit('mark-paid')"
      >
        <span class="material-icons text-sm">check_circle</span>
        {{ $t('partners.subscription.markAsPaidNow') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatCurrency } from '@booking-engine/utils'

const props = defineProps({
  selectedPackage: { type: Object, default: null },
  selectedServices: { type: Array, default: () => [] },
  currency: { type: String, default: 'TRY' },
  interval: { type: String, default: 'yearly' },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false }
})

defineEmits([
  'send-payment-link',
  'save-pending',
  'mark-paid',
  'currency-change',
  'interval-change'
])

const currencies = ['TRY', 'USD', 'EUR', 'GBP']

const hasSelection = computed(() => props.selectedPackage || props.selectedServices.length > 0)

const formattedTotal = computed(() => formatCurrency(props.total, props.currency))
</script>
