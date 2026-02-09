<template>
  <div class="space-y-6">
    <!-- Connection Status -->
    <div
      v-if="connection"
      class="flex items-center gap-3 p-4 rounded-lg"
      :class="{
        'bg-green-50 dark:bg-green-900/20': connection.status === 'active',
        'bg-red-50 dark:bg-red-900/20': connection.status === 'error',
        'bg-gray-50 dark:bg-gray-900/20': connection.status === 'inactive'
      }"
    >
      <span
        class="material-icons"
        :class="{
          'text-green-600': connection.status === 'active',
          'text-red-600': connection.status === 'error',
          'text-gray-500': connection.status === 'inactive'
        }"
      >
        {{
          connection.status === 'active'
            ? 'check_circle'
            : connection.status === 'error'
              ? 'error'
              : 'pause_circle'
        }}
      </span>
      <div>
        <p
          class="font-medium text-sm"
          :class="{
            'text-green-800 dark:text-green-200': connection.status === 'active',
            'text-red-800 dark:text-red-200': connection.status === 'error',
            'text-gray-800 dark:text-gray-200': connection.status === 'inactive'
          }"
        >
          {{ $t(`pms.channelManager.status.${connection.status}`) }}
        </p>
        <p v-if="connection.lastError" class="text-xs text-red-600 dark:text-red-400 mt-0.5">
          {{ connection.lastError.message }}
        </p>
      </div>
    </div>

    <!-- Credentials Form -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('pms.channelManager.connection.userId') }}
        </label>
        <input
          v-model="form.credentials.userId"
          type="text"
          autocomplete="off"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          :placeholder="$t('pms.channelManager.connection.userIdPlaceholder')"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('pms.channelManager.connection.password') }}
        </label>
        <input
          v-model="form.credentials.password"
          type="password"
          autocomplete="new-password"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          :placeholder="$t('pms.channelManager.connection.passwordPlaceholder')"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('pms.channelManager.connection.propertyId') }}
        </label>
        <input
          v-model="form.credentials.propertyId"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          :placeholder="$t('pms.channelManager.connection.propertyIdPlaceholder')"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('pms.channelManager.connection.serviceUrl') }}
        </label>
        <input
          v-model="form.credentials.serviceUrl"
          type="url"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="https://cm.reseliva.com/pms"
        />
      </div>
    </div>

    <!-- Integration Type -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ $t('pms.channelManager.connection.integrationType') }}
      </label>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.integrationType"
            type="radio"
            value="one_way"
            class="text-indigo-600"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">{{
            $t('pms.channelManager.connection.oneWay')
          }}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.integrationType"
            type="radio"
            value="two_way"
            class="text-indigo-600"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">{{
            $t('pms.channelManager.connection.twoWay')
          }}</span>
        </label>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {{
          form.integrationType === 'one_way'
            ? $t('pms.channelManager.connection.oneWayDesc')
            : $t('pms.channelManager.connection.twoWayDesc')
        }}
      </p>
    </div>

    <!-- Settings -->
    <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {{ $t('pms.channelManager.connection.settings') }}
      </h4>
      <div class="space-y-3">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.settings.autoConfirmReservations"
            type="checkbox"
            class="rounded text-indigo-600"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">{{
            $t('pms.channelManager.connection.autoConfirm')
          }}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.settings.includeBreakdown"
            type="checkbox"
            class="rounded text-indigo-600"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">{{
            $t('pms.channelManager.connection.includeBreakdown')
          }}</span>
        </label>
        <label
          v-if="form.integrationType === 'two_way'"
          class="flex items-center gap-2 cursor-pointer"
        >
          <input
            v-model="form.settings.autoSyncInventory"
            type="checkbox"
            class="rounded text-indigo-600"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">{{
            $t('pms.channelManager.connection.autoSyncInventory')
          }}</span>
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 border-t border-gray-200 dark:border-slate-700 pt-4">
      <button
        :disabled="saving"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        @click="save"
      >
        <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
        <span class="material-icons text-sm">save</span>
        {{ $t('common.save') }}
      </button>
      <button
        :disabled="testing"
        class="px-4 py-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 flex items-center gap-2"
        @click="test"
      >
        <span v-if="testing" class="material-icons animate-spin text-sm">refresh</span>
        <span class="material-icons text-sm">link</span>
        {{ $t('pms.channelManager.connection.testConnection') }}
      </button>
      <button
        v-if="connection"
        class="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 ml-auto"
        @click="$emit('delete')"
      >
        <span class="material-icons text-sm">delete</span>
        {{ $t('common.delete') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  connection: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  testing: { type: Boolean, default: false }
})

const emit = defineEmits(['save', 'test', 'delete'])

const form = ref({
  credentials: {
    userId: '',
    password: '',
    propertyId: '',
    serviceUrl: ''
  },
  integrationType: 'one_way',
  settings: {
    autoConfirmReservations: true,
    includeBreakdown: true,
    autoSyncInventory: false
  }
})

// Load existing connection data
watch(
  () => props.connection,
  conn => {
    if (conn) {
      form.value.credentials = {
        userId: conn.credentials?.userId || '',
        password: '', // Don't show masked password
        propertyId: conn.credentials?.propertyId || '',
        serviceUrl: conn.credentials?.serviceUrl || ''
      }
      form.value.integrationType = conn.integrationType || 'one_way'
      form.value.settings = {
        autoConfirmReservations: conn.settings?.autoConfirmReservations ?? true,
        includeBreakdown: conn.settings?.includeBreakdown ?? true,
        autoSyncInventory: conn.settings?.autoSyncInventory ?? false
      }
    }
  },
  { immediate: true }
)

function save() {
  emit('save', { ...form.value })
}

function test() {
  emit('test')
}
</script>
