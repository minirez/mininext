<template>
  <div class="space-y-4">
    <!-- Two-way check -->
    <div
      v-if="integrationType !== 'two_way'"
      class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center"
    >
      <span class="material-icons text-3xl text-amber-500 mb-2">info</span>
      <p class="text-sm text-amber-800 dark:text-amber-200">
        {{ $t('pms.channelManager.inventory.twoWayRequired') }}
      </p>
      <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">
        {{ $t('pms.channelManager.inventory.twoWayRequiredDesc') }}
      </p>
    </div>

    <template v-else>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('pms.channelManager.inventory.description') }}
      </p>

      <!-- Sync Status -->
      <div class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg text-sm">
        <div class="flex items-center gap-2">
          <span class="material-icons text-sm text-gray-500">schedule</span>
          <span class="text-gray-600 dark:text-gray-400">
            {{ $t('pms.channelManager.inventory.lastSync') }}:
          </span>
          <span class="text-gray-900 dark:text-white font-medium">
            {{
              syncStatus?.lastSync?.inventory
                ? new Date(syncStatus.lastSync.inventory).toLocaleString('tr-TR')
                : $t('pms.channelManager.inventory.neverSynced')
            }}
          </span>
        </div>
      </div>

      <!-- Full Sync Button -->
      <div class="flex gap-3">
        <button
          :disabled="syncing"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          @click="confirmFullSync"
        >
          <span v-if="syncing" class="material-icons animate-spin text-sm">refresh</span>
          <span v-else class="material-icons text-sm">cloud_upload</span>
          {{ $t('pms.channelManager.inventory.fullSync') }}
        </button>
      </div>

      <!-- Sync Results -->
      <div v-if="lastResults" class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
        <p class="text-green-700 dark:text-green-300">
          {{ lastResults.roomsSynced }} {{ $t('pms.channelManager.inventory.roomsSynced') }}
        </p>
        <div v-if="lastResults.errors?.length" class="mt-2 text-amber-700 dark:text-amber-300">
          <span v-for="(err, i) in lastResults.errors" :key="i" class="block text-xs">
            Room {{ err.roomId }}: {{ err.error }}
          </span>
        </div>
      </div>
    </template>

    <!-- Confirm Modal -->
    <div
      v-if="showConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showConfirm = false"
    >
      <div class="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {{ $t('pms.channelManager.inventory.confirmTitle') }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          {{ $t('pms.channelManager.inventory.confirmDesc') }}
        </p>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
            @click="showConfirm = false"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            @click="startFullSync"
          >
            {{ $t('pms.channelManager.inventory.startSync') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  integrationType: { type: String, default: 'one_way' },
  syncStatus: { type: Object, default: null },
  lastResults: { type: Object, default: null },
  syncing: { type: Boolean, default: false }
})

const emit = defineEmits(['sync'])

const showConfirm = ref(false)

function confirmFullSync() {
  showConfirm.value = true
}

function startFullSync() {
  showConfirm.value = false
  emit('sync')
}
</script>
