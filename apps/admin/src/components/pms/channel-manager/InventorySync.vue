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

      <!-- ============================================ -->
      <!-- Sync Queue Card                              -->
      <!-- ============================================ -->
      <div
        v-if="queueLoaded"
        class="border rounded-lg overflow-hidden transition-colors"
        :class="
          failedCount > 0
            ? 'border-red-200 dark:border-red-800'
            : totalCount > 0
              ? 'border-indigo-200 dark:border-indigo-800'
              : 'border-gray-200 dark:border-slate-700'
        "
      >
        <!-- Clickable Header -->
        <button
          class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/30"
          :class="
            failedCount > 0
              ? 'bg-red-50/50 dark:bg-red-900/10'
              : totalCount > 0
                ? 'bg-indigo-50/50 dark:bg-indigo-900/10'
                : 'bg-gray-50 dark:bg-slate-900/30'
          "
          @click="queueOpen = !queueOpen"
        >
          <span
            class="material-icons text-lg"
            :class="
              failedCount > 0
                ? 'text-red-500'
                : totalCount > 0
                  ? 'text-indigo-500'
                  : 'text-green-500'
            "
          >
            {{ failedCount > 0 ? 'error_outline' : totalCount > 0 ? 'sync' : 'check_circle' }}
          </span>

          <div class="flex-1 min-w-0">
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ $t('pms.channelManager.inventory.syncQueue') }}
            </span>
          </div>

          <!-- Badges -->
          <div class="flex items-center gap-2">
            <span
              v-if="pendingCount > 0"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            >
              <span class="material-icons text-[11px]">hourglass_empty</span>
              {{ pendingCount }}
            </span>

            <span
              v-if="processingCount > 0"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
            >
              <span class="material-icons text-[11px] animate-spin">sync</span>
              {{ processingCount }}
            </span>

            <span
              v-if="failedCount > 0"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
            >
              <span class="material-icons text-[11px]">error</span>
              {{ failedCount }}
            </span>

            <span
              v-if="totalCount === 0"
              class="text-xs text-green-600 dark:text-green-400 font-medium"
            >
              {{ $t('pms.channelManager.inventory.queueEmpty') }}
            </span>
          </div>

          <!-- Refresh -->
          <button
            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
            @click.stop="$emit('loadQueue')"
          >
            <span class="material-icons text-sm">refresh</span>
          </button>

          <!-- Chevron -->
          <span
            class="material-icons text-sm text-gray-400 transition-transform duration-200"
            :class="{ 'rotate-180': queueOpen }"
          >
            expand_more
          </span>
        </button>

        <!-- Expanded Detail Panel -->
        <div v-if="queueOpen" class="border-t border-gray-200 dark:border-slate-700">
          <!-- Empty state -->
          <div v-if="totalCount === 0" class="px-4 py-6 text-center">
            <span class="material-icons text-3xl text-gray-300 dark:text-gray-600">cloud_done</span>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {{ $t('pms.channelManager.inventory.allSynced') }}
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {{ $t('pms.channelManager.inventory.syncQueueInfo') }}
            </p>
          </div>

          <!-- Room type groups -->
          <div v-else>
            <!-- Toolbar -->
            <div
              v-if="failedCount > 0"
              class="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-slate-900/30 border-b border-gray-200 dark:border-slate-700"
            >
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ totalCount }} {{ $t('pms.channelManager.inventory.totalItems') }}
              </span>
              <button
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                :disabled="retrying"
                @click="handleRetryFailed"
              >
                <span v-if="retrying" class="material-icons text-xs animate-spin">refresh</span>
                <span v-else class="material-icons text-xs">replay</span>
                {{ $t('pms.channelManager.inventory.retryAllFailed') }}
              </button>
            </div>

            <!-- Groups List -->
            <div class="divide-y divide-gray-100 dark:divide-slate-700/50">
              <div
                v-for="group in sortedGroups"
                :key="`${group.roomTypeId}-${group.status}`"
                class="px-4 py-3"
              >
                <!-- Group Header -->
                <div class="flex items-center gap-3 mb-2">
                  <!-- Status icon -->
                  <span class="material-icons text-sm" :class="statusIconClass(group.status)">
                    {{ statusIcon(group.status) }}
                  </span>

                  <!-- Room type name -->
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ group.roomTypeName }}
                  </span>

                  <!-- Date range -->
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDateRange(group.minDate, group.maxDate) }}
                  </span>

                  <!-- Count -->
                  <span class="text-xs text-gray-400 dark:text-gray-500">
                    ({{ group.count }}
                    {{
                      group.count === 1
                        ? $t('pms.channelManager.inventory.day')
                        : $t('pms.channelManager.inventory.days')
                    }})
                  </span>

                  <!-- Status badge -->
                  <span
                    class="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                    :class="statusBadgeClass(group.status)"
                  >
                    {{ $t(`pms.channelManager.inventory.status_${group.status}`) }}
                  </span>
                </div>

                <!-- Sync fields -->
                <div class="flex items-center gap-2 ml-7">
                  <span
                    v-for="field in group.syncFields"
                    :key="field"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
                    :class="syncFieldClass(field)"
                  >
                    <span class="material-icons text-[11px]">{{ syncFieldIcon(field) }}</span>
                    {{ $t(`pms.channelManager.inventory.field_${field}`) }}
                  </span>
                </div>

                <!-- Error for failed groups -->
                <div v-if="group.status === 'failed' && group.lastError" class="mt-2 ml-7">
                  <div
                    class="flex items-start gap-2 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400"
                  >
                    <span class="material-icons text-xs mt-0.5 shrink-0">warning</span>
                    <div class="min-w-0">
                      <span class="break-all">{{ group.lastError }}</span>
                      <span class="text-red-400 dark:text-red-500 ml-2">
                        ({{ group.maxAttempts }}/5
                        {{ $t('pms.channelManager.inventory.attempts') }})
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Expandable date detail -->
                <button
                  v-if="group.count > 1"
                  class="mt-2 ml-7 text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
                  @click="toggleGroupDetail(group)"
                >
                  <span
                    class="material-icons text-[11px] transition-transform"
                    :class="{ 'rotate-90': expandedGroups.has(groupKey(group)) }"
                  >
                    chevron_right
                  </span>
                  {{ $t('pms.channelManager.inventory.showDates') }}
                </button>

                <!-- Date detail list -->
                <div
                  v-if="expandedGroups.has(groupKey(group))"
                  class="mt-1.5 ml-7 pl-3 border-l-2 border-gray-200 dark:border-slate-600 space-y-0.5"
                >
                  <div
                    v-for="item in group.items"
                    :key="item._id"
                    class="flex items-center gap-3 text-[11px] py-0.5"
                  >
                    <span class="text-gray-600 dark:text-gray-400 font-mono min-w-[72px]">
                      {{ formatSingleDate(item.date) }}
                    </span>
                    <span
                      v-for="f in item.syncFields"
                      :key="f"
                      class="w-1.5 h-1.5 rounded-full"
                      :class="syncFieldDotClass(f)"
                      :title="f"
                    />
                    <span
                      v-if="item.lastError"
                      class="text-red-500 truncate max-w-[200px]"
                      :title="item.lastError"
                    >
                      {{ item.lastError }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer info -->
            <div
              class="px-4 py-2 bg-gray-50 dark:bg-slate-900/30 border-t border-gray-200 dark:border-slate-700"
            >
              <p class="text-[11px] text-gray-400 dark:text-gray-500">
                {{ $t('pms.channelManager.inventory.syncQueueInfo') }}
              </p>
            </div>
          </div>
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
import { ref, computed, reactive } from 'vue'

const props = defineProps({
  integrationType: { type: String, default: 'one_way' },
  syncStatus: { type: Object, default: null },
  lastResults: { type: Object, default: null },
  syncing: { type: Boolean, default: false },
  queueData: { type: Object, default: null },
  retrying: { type: Boolean, default: false }
})

const emit = defineEmits(['sync', 'loadQueue', 'retryFailed'])

const showConfirm = ref(false)
const queueOpen = ref(false)
const expandedGroups = reactive(new Set())

// ── Computed ──

const queueLoaded = computed(() => props.queueData !== null)

const pendingCount = computed(() => {
  const entry = props.queueData?.counts?.find(c => c._id === 'pending')
  return entry?.count || 0
})

const processingCount = computed(() => {
  const entry = props.queueData?.counts?.find(c => c._id === 'processing')
  return entry?.count || 0
})

const failedCount = computed(() => {
  const entry = props.queueData?.counts?.find(c => c._id === 'failed')
  return entry?.count || 0
})

const totalCount = computed(() => pendingCount.value + processingCount.value + failedCount.value)

const sortedGroups = computed(() => {
  const groups = props.queueData?.groups || []
  const order = { failed: 0, processing: 1, pending: 2 }
  return [...groups].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
})

// ── Helpers ──

function groupKey(group) {
  return `${group.roomTypeId}-${group.status}`
}

function toggleGroupDetail(group) {
  const key = groupKey(group)
  if (expandedGroups.has(key)) {
    expandedGroups.delete(key)
  } else {
    expandedGroups.add(key)
  }
}

function formatSingleDate(d) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

function formatDateRange(min, max) {
  const a = new Date(min)
  const b = new Date(max)
  const fmt = d => d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
  if (a.toDateString() === b.toDateString()) return fmt(a)
  return `${fmt(a)} – ${fmt(b)}`
}

function statusIcon(status) {
  if (status === 'failed') return 'error'
  if (status === 'processing') return 'sync'
  return 'hourglass_empty'
}

function statusIconClass(status) {
  if (status === 'failed') return 'text-red-500'
  if (status === 'processing') return 'text-yellow-500 animate-spin'
  return 'text-blue-500'
}

function statusBadgeClass(status) {
  if (status === 'failed') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  if (status === 'processing')
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
}

function syncFieldIcon(field) {
  if (field === 'availability') return 'hotel'
  if (field === 'rates') return 'payments'
  return 'rule'
}

function syncFieldClass(field) {
  if (field === 'availability')
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
  if (field === 'rates')
    return 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
  return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
}

function syncFieldDotClass(field) {
  if (field === 'availability') return 'bg-emerald-500'
  if (field === 'rates') return 'bg-violet-500'
  return 'bg-amber-500'
}

// ── Actions ──

function confirmFullSync() {
  showConfirm.value = true
}

function startFullSync() {
  showConfirm.value = false
  emit('sync')
}

function handleRetryFailed() {
  emit('retryFailed')
}
</script>
