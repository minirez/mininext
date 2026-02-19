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

    <div v-else class="grid grid-cols-2 gap-3">
      <div
        v-for="pkg in packages"
        :key="pkg._id"
        class="relative border rounded-xl p-4 cursor-pointer transition-all duration-200"
        :class="[
          selectedPackageId === pkg._id
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500/20 shadow-md'
            : currentPackageId === pkg._id
              ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
              : 'border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md'
        ]"
        @click="$emit('select', pkg._id)"
      >
        <!-- Secili ikon -->
        <span
          v-if="selectedPackageId === pkg._id"
          class="absolute top-2.5 right-2.5 text-purple-600 dark:text-purple-400"
        >
          <span class="material-icons text-lg">check_circle</span>
        </span>

        <!-- Mevcut badge -->
        <span
          v-if="currentPackageId === pkg._id"
          class="absolute -top-2 right-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
        >
          {{ $t('partners.subscription.currentPackageLabel') }}
        </span>

        <!-- Paket Ikon + Isim -->
        <div class="flex items-center gap-2.5 mb-3">
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm"
            :style="{
              backgroundColor: pkg.color || (selectedPackageId === pkg._id ? '#9333ea' : '#9ca3af')
            }"
          >
            <span class="material-icons text-sm">{{ pkg.icon || 'star' }}</span>
          </div>
          <div>
            <div class="font-semibold text-sm text-gray-900 dark:text-white">
              {{ pkg.name?.tr || pkg.name?.en || pkg.slug }}
            </div>
            <div class="text-[11px] text-gray-500 dark:text-slate-400">
              {{ pkg.services?.length || 0 }} {{ $t('partners.subscription.packageServices') }}
            </div>
          </div>
        </div>

        <!-- Fiyat -->
        <div class="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
          <span class="text-xl font-bold text-gray-900 dark:text-white">
            {{ getPackagePrice(pkg) }}
          </span>
          <span class="text-xs text-gray-500 dark:text-slate-400 ml-0.5">
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
  currency: { type: String, default: 'EUR' },
  interval: { type: String, default: 'yearly' }
})

defineEmits(['select'])

const getPackagePrice = pkg => {
  const amount = pkg.price ?? pkg.overridePrice ?? pkg.calculatedPrice ?? 0
  return formatCurrency(amount, props.currency)
}
</script>
