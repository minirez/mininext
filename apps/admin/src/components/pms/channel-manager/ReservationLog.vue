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

    <!-- Logs Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr
            class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700"
          >
            <th class="py-2 px-3 font-medium">{{ $t('pms.channelManager.logs.date') }}</th>
            <th class="py-2 px-3 font-medium">{{ $t('pms.channelManager.logs.type') }}</th>
            <th class="py-2 px-3 font-medium">{{ $t('pms.channelManager.logs.direction') }}</th>
            <th class="py-2 px-3 font-medium">{{ $t('pms.channelManager.logs.status') }}</th>
            <th class="py-2 px-3 font-medium">{{ $t('pms.channelManager.logs.duration') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log._id"
            class="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer"
            @click="$emit('viewLog', log._id)"
          >
            <td class="py-2 px-3 text-gray-900 dark:text-white">
              {{ new Date(log.createdAt).toLocaleString('tr-TR') }}
            </td>
            <td class="py-2 px-3">
              <span
                class="px-2 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
              >
                {{ log.type }}
              </span>
            </td>
            <td class="py-2 px-3">
              <span
                class="material-icons text-sm"
                :class="log.direction === 'inbound' ? 'text-green-500' : 'text-blue-500'"
              >
                {{ log.direction === 'inbound' ? 'call_received' : 'call_made' }}
              </span>
            </td>
            <td class="py-2 px-3">
              <span
                class="px-2 py-0.5 text-xs rounded-full"
                :class="{
                  'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300':
                    log.status === 'success',
                  'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300':
                    log.status === 'error',
                  'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300':
                    log.status === 'partial'
                }"
              >
                {{ log.status }}
              </span>
            </td>
            <td class="py-2 px-3 text-gray-500 dark:text-gray-400">
              {{ log.metadata?.duration ? `${log.metadata.duration}ms` : '-' }}
            </td>
          </tr>
          <tr v-if="!logs || logs.length === 0">
            <td colspan="5" class="py-8 text-center text-gray-500 dark:text-gray-400">
              {{ $t('pms.channelManager.logs.noLogs') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  logs: { type: Array, default: () => [] },
  syncStatus: { type: Object, default: null },
  lastResults: { type: Object, default: null },
  syncing: { type: Boolean, default: false }
})

defineEmits(['sync', 'viewLog'])
</script>
