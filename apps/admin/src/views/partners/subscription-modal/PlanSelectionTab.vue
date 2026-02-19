<template>
  <div class="flex h-[520px]">
    <!-- Sol: Paketler + Hizmetler -->
    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
      <!-- Mevcut Durum Banneri -->
      <div
        v-if="subscriptionStatus"
        class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30"
      >
        <div class="grid grid-cols-3 gap-3 text-sm">
          <div>
            <span class="text-gray-500 dark:text-slate-400 text-xs">
              {{ $t('partners.subscription.currentPlan') }}
            </span>
            <div class="font-semibold text-gray-900 dark:text-white mt-0.5">
              {{ currentPackageName || '-' }}
            </div>
          </div>
          <div>
            <span class="text-gray-500 dark:text-slate-400 text-xs">
              {{ $t('partners.subscription.remainingDays') }}
            </span>
            <div class="font-semibold text-gray-900 dark:text-white mt-0.5">
              {{ subscriptionStatus.remainingDays ?? '-' }}
            </div>
          </div>
          <div v-if="subscriptionStatus.status === 'grace_period'">
            <span class="text-amber-600 text-xs">
              {{ $t('partners.subscription.gracePeriodRemaining') }}
            </span>
            <div class="font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
              {{ subscriptionStatus.gracePeriodRemainingDays }}
            </div>
          </div>
        </div>
      </div>

      <!-- Paket Secimi -->
      <PackageSelectionGrid
        v-if="packages.length > 0"
        :packages="packages"
        :selected-package-id="selectedPackageId"
        :current-package-id="subscriptionStatus?.currentPackageId || null"
        :currency="currency"
        :interval="interval"
        @select="$emit('package-select', $event)"
      />

      <!-- Ek Hizmetler -->
      <ServiceAddonsGrid
        v-if="services.length > 0"
        :services="services"
        :selected-service-ids="selectedServiceIds"
        :package-service-slugs="packageServiceSlugs"
        :currency="currency"
        :interval="interval"
        @toggle="$emit('service-toggle', $event)"
      />

      <!-- Loading -->
      <div v-if="loading" class="text-center py-8">
        <span class="material-icons animate-spin text-purple-500">refresh</span>
      </div>
    </div>

    <!-- Sag: Cart Sidebar -->
    <CartSidebar
      :selected-package="selectedPackage"
      :selected-services="selectedServices"
      :currency="currency"
      :interval="interval"
      :total="total"
      :loading="submitting"
      @send-payment-link="$emit('send-payment-link')"
      @save-pending="$emit('save-pending')"
      @mark-paid="$emit('mark-paid')"
      @currency-change="$emit('currency-change', $event)"
      @interval-change="$emit('interval-change', $event)"
    />
  </div>
</template>

<script setup>
import PackageSelectionGrid from './PackageSelectionGrid.vue'
import ServiceAddonsGrid from './ServiceAddonsGrid.vue'
import CartSidebar from './CartSidebar.vue'

defineProps({
  subscriptionStatus: { type: Object, default: null },
  currentPackageName: { type: String, default: null },
  packages: { type: Array, default: () => [] },
  services: { type: Array, default: () => [] },
  selectedPackageId: { type: String, default: null },
  selectedPackage: { type: Object, default: null },
  selectedServices: { type: Array, default: () => [] },
  selectedServiceIds: { type: Array, default: () => [] },
  packageServiceSlugs: { type: Array, default: () => [] },
  currency: { type: String, default: 'EUR' },
  interval: { type: String, default: 'yearly' },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false }
})

defineEmits([
  'package-select',
  'service-toggle',
  'send-payment-link',
  'save-pending',
  'mark-paid',
  'currency-change',
  'interval-change'
])
</script>
