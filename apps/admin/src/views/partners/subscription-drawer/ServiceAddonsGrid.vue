<template>
  <div>
    <h4
      class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2"
    >
      <span class="material-icons text-base">add_circle_outline</span>
      {{ $t('partners.subscription.addServices') }}
    </h4>

    <div
      v-if="services.length === 0"
      class="text-sm text-gray-400 dark:text-slate-500 text-center py-4"
    >
      {{ $t('partners.subscription.noServicesAvailable') }}
    </div>

    <div v-else class="space-y-3">
      <div v-for="[category, catServices] in groupedServices" :key="category">
        <!-- Kategori başlığı -->
        <div
          class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
        >
          <span class="material-icons text-xs">{{ categoryIcons[category] || 'category' }}</span>
          {{ $t(`partners.subscription.category_${category}`) }}
        </div>

        <!-- Hizmet kartları -->
        <div class="space-y-1.5">
          <div
            v-for="svc in catServices"
            :key="svc._id"
            class="flex items-center justify-between px-3 py-2 rounded-lg border transition-colors"
            :class="[
              isIncluded(svc)
                ? 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 opacity-60'
                : isSelected(svc)
                  ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-purple-200 dark:hover:border-purple-700'
            ]"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span
                class="material-icons text-sm"
                :class="
                  isIncluded(svc)
                    ? 'text-green-500'
                    : isSelected(svc)
                      ? 'text-purple-500'
                      : 'text-gray-400'
                "
              >
                {{
                  isIncluded(svc)
                    ? 'check_circle'
                    : isSelected(svc)
                      ? 'check_box'
                      : 'check_box_outline_blank'
                }}
              </span>
              <div class="min-w-0">
                <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ svc.name?.tr || svc.name?.en || svc.code }}
                </div>
                <div v-if="isIncluded(svc)" class="text-[10px] text-green-600 dark:text-green-400">
                  {{ $t('partners.subscription.includedInPackage') }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <span
                v-if="!isIncluded(svc)"
                class="text-sm font-medium text-gray-700 dark:text-slate-300"
              >
                {{ getServicePrice(svc) }}
              </span>
              <button
                v-if="!isIncluded(svc)"
                type="button"
                class="w-8 h-5 rounded-full transition-colors relative flex-shrink-0"
                :class="isSelected(svc) ? 'bg-purple-600' : 'bg-gray-300 dark:bg-slate-600'"
                @click="$emit('toggle', svc._id)"
              >
                <span
                  class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  :class="isSelected(svc) ? 'translate-x-3.5' : 'translate-x-0.5'"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatCurrency } from '@booking-engine/utils'

const props = defineProps({
  services: { type: Array, default: () => [] },
  selectedServiceIds: { type: Array, default: () => [] },
  packageServiceCodes: { type: Array, default: () => [] },
  currency: { type: String, default: 'TRY' },
  interval: { type: String, default: 'yearly' }
})

defineEmits(['toggle'])

const categoryIcons = {
  payment: 'payments',
  booking: 'book_online',
  pms: 'apartment',
  web: 'language',
  design: 'brush',
  support: 'support_agent',
  integration: 'hub',
  other: 'category'
}

const isIncluded = svc => props.packageServiceCodes.includes(svc.code)
const isSelected = svc => props.selectedServiceIds.includes(svc._id)

const getServicePrice = svc => {
  const priceObj = svc.pricing?.prices?.find(p => p.currency === props.currency)
  const amount = priceObj?.amount ?? 0
  return formatCurrency(amount, props.currency)
}

const groupedServices = computed(() => {
  const groups = new Map()
  for (const svc of props.services) {
    const cat = svc.category || 'other'
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat).push(svc)
  }
  return groups
})
</script>
