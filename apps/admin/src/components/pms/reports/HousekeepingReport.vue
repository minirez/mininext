<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('reports.totalRooms') }}</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ data?.summary?.total || 0 }}
        </p>
      </div>
      <div
        class="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4"
      >
        <p class="text-sm text-green-600 dark:text-green-400">{{ $t('reports.clean') }}</p>
        <p class="text-2xl font-bold text-green-700 dark:text-green-300">
          {{ data?.summary?.clean || 0 }}
        </p>
      </div>
      <div
        class="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4"
      >
        <p class="text-sm text-red-600 dark:text-red-400">{{ $t('reports.dirty') }}</p>
        <p class="text-2xl font-bold text-red-700 dark:text-red-300">
          {{ data?.summary?.dirty || 0 }}
        </p>
      </div>
      <div
        class="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4"
      >
        <p class="text-sm text-blue-600 dark:text-blue-400">{{ $t('reports.inspected') }}</p>
        <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">
          {{ data?.summary?.inspected || 0 }}
        </p>
      </div>
      <div
        class="bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-4"
      >
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('reports.cleaningRate') }}</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          %{{ data?.summary?.cleanPercentage || 0 }}
        </p>
      </div>
    </div>

    <!-- By Floor -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
    >
      <h3 class="font-medium text-gray-900 dark:text-white mb-4">{{ $t('reports.byFloor') }}</h3>
      <div class="space-y-3">
        <div
          v-for="(floorData, floor) in data?.byFloor || {}"
          :key="floor"
          class="flex items-center gap-4"
        >
          <div class="w-16 text-sm font-medium text-gray-900 dark:text-white">
            {{ $t('reports.floor') }} {{ floor }}
          </div>
          <div class="flex-1 flex gap-1 h-6">
            <div
              v-if="floorData.clean"
              class="bg-green-500 rounded"
              :style="{ width: `${(floorData.clean / floorData.total) * 100}%` }"
              :title="`${$t('reports.clean')}: ${floorData.clean}`"
            ></div>
            <div
              v-if="floorData.inspected"
              class="bg-blue-500 rounded"
              :style="{ width: `${(floorData.inspected / floorData.total) * 100}%` }"
              :title="`${$t('reports.inspected')}: ${floorData.inspected}`"
            ></div>
            <div
              v-if="floorData.dirty"
              class="bg-red-500 rounded"
              :style="{ width: `${(floorData.dirty / floorData.total) * 100}%` }"
              :title="`${$t('reports.dirty')}: ${floorData.dirty}`"
            ></div>
            <div
              v-if="floorData.in_progress"
              class="bg-yellow-500 rounded"
              :style="{ width: `${(floorData.in_progress / floorData.total) * 100}%` }"
              :title="`${$t('reports.cleaning')}: ${floorData.in_progress}`"
            ></div>
            <div
              v-if="floorData.out_of_order"
              class="bg-gray-500 rounded"
              :style="{ width: `${(floorData.out_of_order / floorData.total) * 100}%` }"
              :title="`${$t('reports.outOfOrder')}: ${floorData.out_of_order}`"
            ></div>
          </div>
          <div class="w-16 text-sm text-gray-500">
            {{ floorData.total }} {{ $t('reports.rooms') }}
          </div>
        </div>
      </div>
      <div class="flex gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 text-xs">
        <span class="flex items-center gap-1"
          ><span class="w-3 h-3 bg-green-500 rounded"></span> {{ $t('reports.clean') }}</span
        >
        <span class="flex items-center gap-1"
          ><span class="w-3 h-3 bg-blue-500 rounded"></span> {{ $t('reports.inspected') }}</span
        >
        <span class="flex items-center gap-1"
          ><span class="w-3 h-3 bg-red-500 rounded"></span> {{ $t('reports.dirty') }}</span
        >
        <span class="flex items-center gap-1"
          ><span class="w-3 h-3 bg-yellow-500 rounded"></span> {{ $t('reports.cleaning') }}</span
        >
        <span class="flex items-center gap-1"
          ><span class="w-3 h-3 bg-gray-500 rounded"></span> {{ $t('reports.outOfOrder') }}</span
        >
      </div>
    </div>

    <!-- Rooms Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <h3 class="font-medium text-gray-900 dark:text-white">{{ $t('reports.roomList') }}</h3>
      </div>
      <div class="overflow-x-auto max-h-96">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.room') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.type') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.status') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.cleaning') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {{ $t('reports.lastCleaned') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="room in data?.rooms || []" :key="room.roomNumber">
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {{ room.roomNumber }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {{ room.roomType }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="getRoomStatusClass(room.status)"
                  >{{ getRoomStatusLabel(room.status) }}</span
                >
              </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="getHkStatusClass(room.housekeepingStatus)"
                  >{{ getHkStatusLabel(room.housekeepingStatus) }}</span
                >
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {{ room.lastCleaned ? formatDateTime(room.lastCleaned) : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  data: Object
})

const formatDateTime = date => {
  if (!date) return '-'
  return new Date(date).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getRoomStatusLabel = status => {
  const statusMap = {
    available: 'reports.roomStatus.available',
    occupied: 'reports.roomStatus.occupied',
    reserved: 'reports.roomStatus.reserved',
    maintenance: 'reports.roomStatus.maintenance',
    blocked: 'reports.roomStatus.blocked'
  }
  return statusMap[status] ? t(statusMap[status]) : status
}

const getRoomStatusClass = status => {
  const classes = {
    available: 'bg-green-100 text-green-800',
    occupied: 'bg-blue-100 text-blue-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    maintenance: 'bg-red-100 text-red-800',
    blocked: 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getHkStatusLabel = status => {
  const statusMap = {
    clean: 'reports.hkStatus.clean',
    dirty: 'reports.hkStatus.dirty',
    inspected: 'reports.hkStatus.inspected',
    in_progress: 'reports.hkStatus.inProgress',
    out_of_order: 'reports.hkStatus.outOfOrder'
  }
  return statusMap[status] ? t(statusMap[status]) : status
}

const getHkStatusClass = status => {
  const classes = {
    clean: 'bg-green-100 text-green-800',
    dirty: 'bg-red-100 text-red-800',
    inspected: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    out_of_order: 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}
</script>
