<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex items-center gap-3">
      <select
        v-model="filterType"
        class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
        @change="$emit('filter', { type: filterType, status: filterStatus })"
      >
        <option value="">{{ $t('pms.channelManager.logs.allTypes') }}</option>
        <option value="reservation_fetch">
          {{ $t('pms.channelManager.logs.types.reservation_fetch') }}
        </option>
        <option value="reservation_confirm">
          {{ $t('pms.channelManager.logs.types.reservation_confirm') }}
        </option>
        <option value="inventory_update">
          {{ $t('pms.channelManager.logs.types.inventory_update') }}
        </option>
        <option value="product_sync">{{ $t('pms.channelManager.logs.types.product_sync') }}</option>
        <option value="ota_sync">{{ $t('pms.channelManager.logs.types.ota_sync') }}</option>
        <option value="error_report">{{ $t('pms.channelManager.logs.types.error_report') }}</option>
        <option value="connection_test">
          {{ $t('pms.channelManager.logs.types.connection_test') }}
        </option>
      </select>
      <select
        v-model="filterStatus"
        class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
        @change="$emit('filter', { type: filterType, status: filterStatus })"
      >
        <option value="">{{ $t('pms.channelManager.logs.allStatuses') }}</option>
        <option value="success">{{ $t('pms.channelManager.logs.statusValues.success') }}</option>
        <option value="error">{{ $t('pms.channelManager.logs.statusValues.error') }}</option>
        <option value="partial">{{ $t('pms.channelManager.logs.statusValues.partial') }}</option>
      </select>
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
            <th class="py-2 px-3 font-medium">{{ $t('pms.channelManager.logs.error') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log._id"
            class="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer"
            @click="viewDetail(log._id)"
          >
            <td class="py-2 px-3 text-gray-900 dark:text-white whitespace-nowrap">
              {{ new Date(log.createdAt).toLocaleString('tr-TR') }}
            </td>
            <td class="py-2 px-3">
              <span
                class="px-2 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
              >
                {{ log.type.replace(/_/g, ' ') }}
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
            <td class="py-2 px-3 text-red-600 dark:text-red-400 text-xs max-w-xs truncate">
              {{ log.errorMessage || '-' }}
            </td>
          </tr>
          <tr v-if="!logs || logs.length === 0">
            <td colspan="6" class="py-8 text-center text-gray-500 dark:text-gray-400">
              {{ $t('pms.channelManager.logs.noLogs') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Log Detail Modal -->
    <div
      v-if="showDetail"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showDetail = false"
    >
      <div
        class="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ $t('pms.channelManager.logs.detail') }}
          </h3>
          <button
            class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
            @click="showDetail = false"
          >
            <span class="material-icons">close</span>
          </button>
        </div>

        <div v-if="detailLoading" class="flex justify-center py-8">
          <span class="material-icons animate-spin text-3xl text-indigo-600">refresh</span>
        </div>

        <div v-else-if="logDetail" class="space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400"
                >{{ $t('pms.channelManager.logs.type') }}:</span
              >
              <span class="ml-2 text-gray-900 dark:text-white">{{ logDetail.type }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400"
                >{{ $t('pms.channelManager.logs.status') }}:</span
              >
              <span class="ml-2 text-gray-900 dark:text-white">{{ logDetail.status }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400"
                >{{ $t('pms.channelManager.logs.direction') }}:</span
              >
              <span class="ml-2 text-gray-900 dark:text-white">{{ logDetail.direction }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400"
                >{{ $t('pms.channelManager.logs.duration') }}:</span
              >
              <span class="ml-2 text-gray-900 dark:text-white"
                >{{ logDetail.metadata?.duration || '-' }}ms</span
              >
            </div>
          </div>

          <div
            v-if="logDetail.errorMessage"
            class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300"
          >
            {{ logDetail.errorMessage }}
          </div>

          <div v-if="logDetail.request">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Request</h4>
            <pre
              class="p-3 bg-gray-100 dark:bg-slate-900 rounded-lg text-xs overflow-x-auto max-h-48"
              >{{ logDetail.request }}</pre
            >
          </div>

          <div v-if="logDetail.response">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Response</h4>
            <pre
              class="p-3 bg-gray-100 dark:bg-slate-900 rounded-lg text-xs overflow-x-auto max-h-48"
              >{{ logDetail.response }}</pre
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  logs: { type: Array, default: () => [] },
  logDetail: { type: Object, default: null },
  detailLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['filter', 'viewLog'])

const filterType = ref('')
const filterStatus = ref('')
const showDetail = ref(false)

function viewDetail(logId) {
  showDetail.value = true
  emit('viewLog', logId)
}
</script>
