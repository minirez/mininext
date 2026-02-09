<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('pms.channelManager.ota.description') }}
      </p>
      <button
        :disabled="loading"
        class="px-4 py-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 flex items-center gap-2"
        @click="$emit('refresh')"
      >
        <span v-if="loading" class="material-icons animate-spin text-sm">refresh</span>
        <span v-else class="material-icons text-sm">refresh</span>
        {{ $t('common.refresh') }}
      </button>
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
      <div>
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('pms.channelManager.ota.notConnected') }} ({{ otaList.notConnected?.length || 0 }})
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
  </div>
</template>

<script setup>
defineProps({
  otaList: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})

defineEmits(['refresh'])
</script>
