<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ $t('pms.channelManager.ota.description') }}
        </p>
        <p v-if="lastFetchedAt" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {{ $t('pms.channelManager.mapping.lastFetched') }}:
          {{ formatDateTime(lastFetchedAt) }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          :disabled="loading || loadingProducts"
          class="px-4 py-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 flex items-center gap-2"
          @click="$emit('refresh')"
        >
          <span v-if="loading" class="material-icons animate-spin text-sm">refresh</span>
          <span v-else class="material-icons text-sm">sync</span>
          {{ $t('pms.channelManager.ota.refreshChannels') }}
        </button>
        <button
          :disabled="loading || loadingProducts"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          @click="$emit('fetchProducts')"
        >
          <span v-if="loadingProducts" class="material-icons animate-spin text-sm">refresh</span>
          <span v-else class="material-icons text-sm">account_tree</span>
          {{ $t('pms.channelManager.ota.fetchProductMappings') }}
        </button>
      </div>
    </div>

    <!-- Info Banner -->
    <div
      class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
    >
      <span class="material-icons text-blue-500 mt-0.5">info</span>
      <p class="text-sm text-blue-700 dark:text-blue-300">
        {{ $t('pms.channelManager.ota.infoText') }}
      </p>
    </div>

    <!-- No OTA data -->
    <div v-if="!otaList" class="text-center py-8 text-gray-500 dark:text-gray-400">
      <span class="material-icons text-4xl mb-2">share</span>
      <p>{{ $t('pms.channelManager.ota.noData') }}</p>
    </div>

    <template v-else>
      <!-- Connected OTAs -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('pms.channelManager.ota.connected') }} ({{ otaList.connected?.length || 0 }})
        </h4>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="ota in otaList.connected"
            :key="ota"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm"
          >
            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
            {{ ota }}
          </span>
          <span
            v-if="!otaList.connected || otaList.connected.length === 0"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ $t('pms.channelManager.ota.noConnected') }}
          </span>
        </div>
      </div>

      <!-- Not Connected OTAs -->
      <div v-if="otaList.notConnected?.length">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('pms.channelManager.ota.notConnected') }} ({{ otaList.notConnected.length }})
        </h4>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="ota in otaList.notConnected"
            :key="ota"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 rounded-full text-sm"
          >
            <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
            {{ ota }}
          </span>
        </div>
      </div>
    </template>

    <!-- OTA Product Mappings -->
    <div v-if="otaProducts && otaProducts.roomTypes?.length" class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-medium text-gray-900 dark:text-white">
          {{ $t('pms.channelManager.ota.productMappings') }}
        </h4>
        <p v-if="otaProductsFetchedAt" class="text-xs text-gray-400 dark:text-gray-500">
          {{ $t('pms.channelManager.mapping.lastFetched') }}:
          {{ formatDateTime(otaProductsFetchedAt) }}
        </p>
      </div>

      <!-- Room Type Cards -->
      <div
        v-for="rt in otaProducts.roomTypes"
        :key="rt.id"
        class="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
      >
        <!-- Room Type Header -->
        <div
          class="px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center gap-2">
            <span class="material-icons text-sm text-gray-500">hotel</span>
            <h5 class="font-medium text-gray-900 dark:text-white">{{ rt.name }}</h5>
            <span class="text-xs text-gray-400">ID: {{ rt.id }}</span>
          </div>
        </div>

        <!-- Rate Plans -->
        <div class="divide-y divide-gray-100 dark:divide-slate-800">
          <div v-for="rp in rt.ratePlans" :key="rp.id" class="px-4 py-3">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
                rp.name
              }}</span>
              <span
                v-if="rp.boardType"
                class="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
              >
                {{ rp.boardType }}
              </span>
            </div>

            <!-- OTA Mappings for this rate plan -->
            <div v-if="rp.otaRatePlans?.length" class="ml-4 space-y-1">
              <div
                v-for="ota in rp.otaRatePlans"
                :key="ota.id"
                class="flex items-center gap-2 text-sm"
              >
                <span class="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                <span class="font-medium text-green-700 dark:text-green-300">{{
                  ota.channel
                }}</span>
                <span class="text-gray-400">→</span>
                <span class="text-gray-600 dark:text-gray-400">{{ ota.name }}</span>
                <span v-if="ota.otaRoomTypeName" class="text-xs text-gray-400"
                  >({{ ota.otaRoomTypeName }})</span
                >
              </div>
            </div>

            <!-- Non-Reseliva Mappings -->
            <div v-if="rp.nonReselivaRatePlans?.length" class="ml-4 space-y-1 mt-1">
              <div
                v-for="ota in rp.nonReselivaRatePlans"
                :key="ota.id"
                class="flex items-center gap-2 text-sm"
              >
                <span class="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></span>
                <span class="font-medium text-amber-700 dark:text-amber-300">{{
                  ota.channel
                }}</span>
                <span class="text-gray-400">→</span>
                <span class="text-gray-600 dark:text-gray-400">{{ ota.name }}</span>
                <span class="text-xs text-gray-400"
                  >({{ $t('pms.channelManager.ota.directConnection') }})</span
                >
              </div>
            </div>

            <!-- No OTA mapping -->
            <div
              v-if="!rp.otaRatePlans?.length && !rp.nonReselivaRatePlans?.length"
              class="ml-4 text-sm text-gray-400 dark:text-gray-500 italic"
            >
              {{ $t('pms.channelManager.ota.noOtaMapped') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Unmapped Room Types -->
      <div
        v-if="otaProducts.unmappedRoomTypes?.length"
        class="border border-amber-200 dark:border-amber-800 rounded-lg p-4"
      >
        <h5
          class="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-1"
        >
          <span class="material-icons text-sm">warning</span>
          {{ $t('pms.channelManager.ota.unmappedProducts') }}
        </h5>
        <div class="space-y-1">
          <div
            v-for="ota in otaProducts.unmappedRoomTypes"
            :key="ota.id"
            class="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300"
          >
            <span class="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></span>
            <span class="font-medium">{{ ota.channel }}</span>
            <span class="text-amber-400">→</span>
            <span>{{ ota.name }}</span>
            <span v-if="ota.otaRoomTypeName" class="text-xs text-amber-500"
              >({{ ota.otaRoomTypeName }})</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- No OTA Products yet (but have OTA list) -->
    <div
      v-else-if="otaList && !otaProducts"
      class="text-center py-6 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg"
    >
      <span class="material-icons text-3xl mb-2">account_tree</span>
      <p>{{ $t('pms.channelManager.ota.noProductMappings') }}</p>
      <p class="text-xs mt-1">{{ $t('pms.channelManager.ota.noProductMappingsDesc') }}</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

defineProps({
  otaList: { type: Object, default: null },
  otaProducts: { type: Object, default: null },
  otaProductsFetchedAt: { type: [String, Date], default: null },
  loading: { type: Boolean, default: false },
  loadingProducts: { type: Boolean, default: false },
  lastFetchedAt: { type: [String, Date], default: null }
})

defineEmits(['refresh', 'fetchProducts'])

const localeMap = { tr: 'tr-TR', en: 'en-US' }

function formatDateTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleString(localeMap[locale.value] || 'tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
