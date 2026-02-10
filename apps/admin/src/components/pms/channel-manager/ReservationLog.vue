<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('pms.channelManager.reservations.description') }}
      </p>
      <button
        :disabled="syncing"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        @click="$emit('sync')"
      >
        <span v-if="syncing" class="material-icons animate-spin text-sm">refresh</span>
        <span v-else class="material-icons text-sm">sync</span>
        {{ $t('pms.channelManager.reservations.manualSync') }}
      </button>
    </div>

    <!-- Sync Status -->
    <div
      v-if="syncStatus"
      class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg text-sm"
    >
      <div class="flex items-center gap-2">
        <span class="material-icons text-sm text-gray-500">schedule</span>
        <span class="text-gray-600 dark:text-gray-400">
          {{ $t('pms.channelManager.reservations.lastSync') }}:
        </span>
        <span class="text-gray-900 dark:text-white font-medium">
          {{
            syncStatus.lastSync?.reservations
              ? new Date(syncStatus.lastSync.reservations).toLocaleString('tr-TR')
              : $t('pms.channelManager.reservations.neverSynced')
          }}
        </span>
      </div>
    </div>

    <!-- Sync Results -->
    <div
      v-if="lastResults"
      class="p-3 rounded-lg text-sm"
      :class="
        lastResults.errors?.length
          ? 'bg-amber-50 dark:bg-amber-900/20'
          : 'bg-green-50 dark:bg-green-900/20'
      "
    >
      <div class="flex items-center gap-4">
        <span v-if="lastResults.created" class="text-green-700 dark:text-green-300">
          {{ lastResults.created }} {{ $t('pms.channelManager.reservations.created') }}
        </span>
        <span v-if="lastResults.cancelled" class="text-red-700 dark:text-red-300">
          {{ lastResults.cancelled }} {{ $t('pms.channelManager.reservations.cancelled') }}
        </span>
        <span v-if="lastResults.modified" class="text-blue-700 dark:text-blue-300">
          {{ lastResults.modified }} {{ $t('pms.channelManager.reservations.modified') }}
        </span>
        <span v-if="lastResults.confirmed" class="text-gray-700 dark:text-gray-300">
          {{ lastResults.confirmed }} {{ $t('pms.channelManager.reservations.confirmed') }}
        </span>
      </div>
      <div v-if="lastResults.errors?.length" class="mt-2 text-amber-700 dark:text-amber-300">
        <span v-for="(err, i) in lastResults.errors" :key="i" class="block">
          {{ err.reservno || err.type }}: {{ err.error }}
        </span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!lastResults" class="py-12 text-center">
      <span class="material-icons text-4xl text-gray-300 dark:text-gray-600 mb-3">book_online</span>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        {{ $t('pms.channelManager.reservations.noReservations') }}
      </p>
      <p class="text-gray-400 dark:text-gray-500 text-xs mt-1">
        {{ $t('pms.channelManager.reservations.noReservationsDesc') }}
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  syncStatus: { type: Object, default: null },
  lastResults: { type: Object, default: null },
  syncing: { type: Boolean, default: false }
})

defineEmits(['sync'])
</script>
