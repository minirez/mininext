<template>
  <div
    class="w-72 border-l border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 flex flex-col flex-shrink-0"
  >
    <!-- Baslik -->
    <div class="px-4 pt-4 pb-3">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
        <span class="material-icons text-base">shopping_cart</span>
        {{ $t('partners.subscription.cartSummary') }}
      </h4>
    </div>

    <!-- Sepet icerigi (scrollable) -->
    <div class="flex-1 overflow-y-auto px-4 space-y-2">
      <!-- Secili paket -->
      <div
        v-if="selectedPackage"
        class="p-3 bg-white dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600"
      >
        <div class="flex items-center gap-2 mb-1">
          <span class="material-icons text-sm text-purple-500">inventory_2</span>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ selectedPackage.name?.tr || selectedPackage.name?.en || selectedPackage.slug }}
          </span>
        </div>
        <div class="text-xs text-gray-500 dark:text-slate-400">
          {{ getPackagePrice(selectedPackage) }}
          /{{
            interval === 'monthly'
              ? $t('partners.subscription.monthly')
              : $t('partners.subscription.yearly')
          }}
        </div>
      </div>

      <!-- Ek hizmetler -->
      <div
        v-for="svc in selectedServices"
        :key="svc._id"
        class="p-2.5 bg-white dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <span class="material-icons text-xs text-purple-400">add_circle</span>
            <span class="text-xs font-medium text-gray-800 dark:text-slate-200 truncate">
              {{ svc.name?.tr || svc.name?.en || svc.slug }}
            </span>
          </div>
          <span class="text-xs text-gray-500 dark:text-slate-400 flex-shrink-0 ml-2">
            {{ getServicePrice(svc) }}
          </span>
        </div>
      </div>

      <!-- Bos sepet -->
      <div
        v-if="!selectedPackage && selectedServices.length === 0"
        class="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-slate-500"
      >
        <span class="material-icons text-4xl mb-2">remove_shopping_cart</span>
        <span class="text-sm">{{ $t('partners.subscription.noPackageSelected') }}</span>
      </div>
    </div>

    <!-- Alt kisim (sticky footer) -->
    <div class="border-t border-gray-200 dark:border-slate-700 p-4 space-y-3">
      <!-- Donem + Para birimi -->
      <div class="flex items-center gap-2">
        <select
          :value="interval"
          class="flex-1 text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300"
          @change="$emit('interval-change', $event.target.value)"
        >
          <option value="monthly">{{ $t('partners.subscription.monthly') }}</option>
          <option value="yearly">{{ $t('partners.subscription.yearly') }}</option>
        </select>
        <span
          class="w-16 text-xs text-center font-medium text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700"
        >
          EUR
        </span>
      </div>

      <!-- Toplam -->
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider">{{
          $t('common.total')
        }}</span>
        <span class="text-xl font-bold text-gray-900 dark:text-white">
          {{ formattedTotal }}
        </span>
      </div>

      <!-- Aksiyon butonlari -->
      <div class="space-y-2">
        <button
          type="button"
          class="w-full btn-primary text-sm py-2 flex items-center justify-center gap-1.5"
          :disabled="!hasSelection || loading"
          @click="$emit('send-payment-link')"
        >
          <span class="material-icons text-sm">send</span>
          {{ $t('partners.subscription.sendPaymentLink') }}
        </button>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="btn-secondary text-xs py-2 flex items-center justify-center gap-1"
            :disabled="!hasSelection || loading"
            @click="$emit('save-pending')"
          >
            <span class="material-icons text-xs">save</span>
            {{ $t('partners.subscription.saveAsPending') }}
          </button>
          <button
            type="button"
            class="btn text-xs py-2 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white"
            :disabled="!hasSelection || loading"
            @click="$emit('mark-paid')"
          >
            <span class="material-icons text-xs">check_circle</span>
            {{ $t('partners.subscription.markAsPaidNow') }}
          </button>
        </div>
        <button
          v-if="trialAvailable"
          type="button"
          class="w-full btn text-xs py-2 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          :disabled="!hasSelection || loading"
          @click="$emit('activate-trial')"
        >
          <span class="material-icons text-xs">play_circle</span>
          {{ $t('partners.subscription.activateTrial') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatCurrency } from '@booking-engine/utils'

const props = defineProps({
  selectedPackage: { type: Object, default: null },
  selectedServices: { type: Array, default: () => [] },
  currency: { type: String, default: 'EUR' },
  interval: { type: String, default: 'yearly' },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  trialAvailable: { type: Boolean, default: false }
})

defineEmits([
  'send-payment-link',
  'save-pending',
  'mark-paid',
  'activate-trial',
  'currency-change',
  'interval-change'
])

const hasSelection = computed(() => props.selectedPackage || props.selectedServices.length > 0)

const formattedTotal = computed(() => formatCurrency(props.total, 'EUR'))

const getPackagePrice = pkg => {
  const amount = pkg.price ?? pkg.overridePrice ?? pkg.calculatedPrice ?? 0
  return formatCurrency(amount, 'EUR')
}

const getServicePrice = svc => {
  return formatCurrency(svc.price ?? 0, 'EUR')
}
</script>
