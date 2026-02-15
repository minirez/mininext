<template>
  <div>
    <h4
      class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2"
    >
      <span class="material-icons text-base">inventory_2</span>
      {{ $t('partners.subscription.selectPackage') }}
    </h4>

    <div
      v-if="packages.length === 0"
      class="text-sm text-gray-400 dark:text-slate-500 text-center py-6"
    >
      {{ $t('partners.subscription.noPackagesAvailable') }}
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="pkg in packages"
        :key="pkg._id"
        class="relative border rounded-xl p-4 cursor-pointer transition-all duration-200"
        :class="[
          selectedPackageId === pkg._id
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500/30 scale-[1.02] shadow-lg'
            : currentPackageId === pkg._id
              ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
              : 'border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md'
        ]"
        @click="$emit('select', pkg._id)"
      >
        <!-- Mevcut badge -->
        <span
          v-if="currentPackageId === pkg._id"
          class="absolute -top-2 right-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
        >
          {{ $t('partners.subscription.currentPackageLabel') }}
        </span>

        <!-- Seçili badge -->
        <span
          v-if="selectedPackageId === pkg._id && selectedPackageId !== currentPackageId"
          class="absolute -top-2 right-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
        >
          {{ $t('common.selected') }}
        </span>

        <!-- Paket İkon + İsim -->
        <div class="flex items-center gap-2 mb-2">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
            :class="
              selectedPackageId === pkg._id ? 'bg-purple-600' : 'bg-gray-400 dark:bg-slate-500'
            "
          >
            <span class="material-icons text-sm">{{ pkg.icon || 'star' }}</span>
          </div>
          <div>
            <div class="font-semibold text-sm text-gray-900 dark:text-white">
              {{ pkg.name?.tr || pkg.name?.en || pkg.code }}
            </div>
            <div class="text-[11px] text-gray-500 dark:text-slate-400">
              {{ pkg.services?.length || 0 }} {{ $t('partners.subscription.packageServices') }}
            </div>
          </div>
        </div>

        <!-- Fiyat -->
        <div class="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
          <span class="text-lg font-bold text-gray-900 dark:text-white">
            {{ getPackagePrice(pkg) }}
          </span>
          <span class="text-xs text-gray-500 dark:text-slate-400">
            /{{
              interval === 'monthly'
                ? $t('partners.subscription.monthly')
                : $t('partners.subscription.yearly')
            }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency } from '@booking-engine/utils'

const props = defineProps({
  packages: { type: Array, default: () => [] },
  selectedPackageId: { type: String, default: null },
  currentPackageId: { type: String, default: null },
  currency: { type: String, default: 'TRY' },
  interval: { type: String, default: 'yearly' }
})

defineEmits(['select'])

const getPackagePrice = pkg => {
  const priceObj = pkg.pricing?.prices?.find(p => p.currency === props.currency)
  const amount = priceObj?.amount ?? 0
  return formatCurrency(amount, props.currency)
}
</script>
