<template>
  <div class="space-y-6">
    <!-- Enable KBS -->
    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <div>
        <h3 class="font-medium text-gray-900 dark:text-white">{{ $t('settings.kbs.title') }}</h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('settings.kbs.description') }}
        </p>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          v-model="localSettings.enabled"
          type="checkbox"
          class="sr-only peer"
          @change="emitChange"
        />
        <div
          class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"
        ></div>
      </label>
    </div>

    <!-- KBS Type -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('settings.kbs.kbsType') }}
        </label>
        <select
          v-model="localSettings.type"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          @change="emitChange"
        >
          <option value="egm">{{ $t('settings.kbs.kbsTypes.police') }}</option>
          <option value="jandarma">{{ $t('settings.kbs.kbsTypes.gendarmerie') }}</option>
        </select>
        <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {{ $t('settings.kbs.kbsTypeHelp') }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('settings.kbs.facilityCode') }}
        </label>
        <input
          v-model="localSettings.facilityCode"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          :placeholder="$t('settings.kbs.facilityCodePlaceholder')"
          @input="emitChange"
        />
        <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {{ $t('settings.kbs.facilityCodeHelp') }}
        </p>
      </div>
    </div>

    <!-- Credentials -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('settings.kbs.username') }}
        </label>
        <input
          v-model="localSettings.username"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          :placeholder="$t('settings.kbs.usernamePlaceholder')"
          @input="emitChange"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('settings.kbs.password') }}
        </label>
        <div class="relative">
          <input
            v-model="localSettings.password"
            :type="showPassword ? 'text' : 'password'"
            class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            :placeholder="$t('settings.kbs.passwordPlaceholder')"
            @input="emitChange"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="showPassword = !showPassword"
          >
            <span class="material-icons text-xl">{{
              showPassword ? 'visibility_off' : 'visibility'
            }}</span>
          </button>
        </div>
        <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {{ $t('settings.kbs.passwordHelp') }}
        </p>
      </div>
    </div>

    <!-- Personnel ID (Jandarma only) -->
    <div v-if="localSettings.type === 'jandarma'">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {{ $t('settings.kbs.staffIdNumber') }}
      </label>
      <input
        v-model="localSettings.personnelIdNumber"
        type="text"
        class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white max-w-md"
        :placeholder="$t('settings.kbs.staffIdPlaceholder')"
        maxlength="11"
        @input="emitChange"
      />
      <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
        {{ $t('settings.kbs.staffIdHelp') }}
      </p>
    </div>

    <!-- Auto Send Settings -->
    <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('settings.kbs.autoSubmission') }}
      </h4>

      <div class="space-y-4">
        <div
          class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
        >
          <div>
            <h5 class="font-medium text-gray-900 dark:text-white">
              {{ $t('settings.kbs.autoSubmit') }}
            </h5>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('settings.kbs.autoSubmitDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localSettings.autoSend.enabled"
              type="checkbox"
              class="sr-only peer"
              @change="emitChange"
            />
            <div
              class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"
            ></div>
          </label>
        </div>

        <div v-if="localSettings.autoSend.enabled" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('settings.kbs.delay') }}
            </label>
            <input
              v-model.number="localSettings.autoSend.delayMinutes"
              type="number"
              min="0"
              max="60"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              @input="emitChange"
            />
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('settings.kbs.delayHelp') }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('settings.kbs.nightStart') }}
            </label>
            <select
              v-model.number="localSettings.autoSend.nightStartHour"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              @change="emitChange"
            >
              <option v-for="h in 24" :key="h - 1" :value="h - 1">
                {{ (h - 1).toString().padStart(2, '0') }}:00
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('settings.kbs.nightEnd') }}
            </label>
            <select
              v-model.number="localSettings.autoSend.nightEndHour"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              @change="emitChange"
            >
              <option v-for="h in 24" :key="h - 1" :value="h - 1">
                {{ (h - 1).toString().padStart(2, '0') }}:00
              </option>
            </select>
          </div>
        </div>

        <div
          v-if="localSettings.autoSend.enabled"
          class="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400"
        >
          <span class="material-icons text-amber-500">info</span>
          <span
            >{{ localSettings.autoSend.nightStartHour }}:00 -
            {{ localSettings.autoSend.nightEndHour }}:00
            {{ $t('settings.kbs.noSubmissionBetween') }}</span
          >
        </div>
      </div>
    </div>

    <!-- Connection Test -->
    <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('settings.kbs.connectionTest') }}
      </h4>

      <div class="flex items-center gap-4">
        <button
          :disabled="testing || !localSettings.enabled"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          @click="testConnection"
        >
          <span v-if="testing" class="material-icons animate-spin text-sm">refresh</span>
          <span v-else class="material-icons text-sm">wifi</span>
          {{ testing ? $t('settings.kbs.testing') : $t('settings.kbs.testConnection') }}
        </button>

        <!-- Last Connection Status -->
        <div v-if="localSettings.lastConnection?.status" class="flex items-center gap-2">
          <span
            class="w-3 h-3 rounded-full"
            :class="{
              'bg-green-500': localSettings.lastConnection.status === 'success',
              'bg-red-500': localSettings.lastConnection.status === 'error',
              'bg-gray-400': localSettings.lastConnection.status === 'never'
            }"
          ></span>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ getConnectionStatusText() }}
          </span>
        </div>
      </div>

      <!-- Test Result -->
      <div
        v-if="testResult"
        class="mt-4 p-4 rounded-lg"
        :class="
          testResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
        "
      >
        <div class="flex items-start gap-2">
          <span
            class="material-icons"
            :class="testResult.success ? 'text-green-600' : 'text-red-600'"
          >
            {{ testResult.success ? 'check_circle' : 'error' }}
          </span>
          <div>
            <p
              class="font-medium"
              :class="
                testResult.success
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300'
              "
            >
              {{ testResult.message }}
            </p>
            <p v-if="testResult.services" class="text-sm mt-1 text-gray-600 dark:text-gray-400">
              Servisler: {{ testResult.services.join(', ') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Box -->
    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
      <div class="flex items-start gap-3">
        <span class="material-icons text-blue-500">info</span>
        <div class="text-sm text-blue-700 dark:text-blue-300">
          <p class="font-medium mb-1">{{ $t('settings.kbs.aboutKbs') }}</p>
          <ul class="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
            <li v-for="(item, index) in $tm('settings.kbs.aboutKbsInfo')" :key="index">
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { usePmsStore } from '@/stores/pms'
import * as kbsService from '@/services/pms/kbsService'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const toast = useToast()
const pmsStore = usePmsStore()

// Local state
const showPassword = ref(false)
const testing = ref(false)
const testResult = ref(null)

// Default structure
const defaultSettings = {
  enabled: false,
  type: 'egm',
  facilityCode: '',
  username: '',
  password: '',
  personnelIdNumber: '',
  autoSend: {
    enabled: false,
    delayMinutes: 5,
    pauseAtNight: true,
    nightStartHour: 23,
    nightEndHour: 7
  },
  lastConnection: {
    status: 'never',
    timestamp: null,
    message: null
  }
}

// Merge with defaults
const localSettings = ref({
  ...defaultSettings,
  ...props.modelValue,
  autoSend: {
    ...defaultSettings.autoSend,
    ...(props.modelValue?.autoSend || {})
  },
  lastConnection: {
    ...defaultSettings.lastConnection,
    ...(props.modelValue?.lastConnection || {})
  }
})

// Watch for external changes
watch(
  () => props.modelValue,
  newVal => {
    localSettings.value = {
      ...defaultSettings,
      ...newVal,
      autoSend: {
        ...defaultSettings.autoSend,
        ...(newVal?.autoSend || {})
      },
      lastConnection: {
        ...defaultSettings.lastConnection,
        ...(newVal?.lastConnection || {})
      }
    }
  },
  { deep: true }
)

// Emit changes
const emitChange = () => {
  emit('update:modelValue', localSettings.value)
  emit('change')
}

// Test connection
const testConnection = async () => {
  const hotelId = pmsStore.hotelId
  if (!hotelId) {
    toast.error(t('settings.kbs.noHotelSelected'))
    return
  }

  testing.value = true
  testResult.value = null

  try {
    const response = await kbsService.testConnection(hotelId)
    testResult.value = response.data || response

    if (response.success) {
      localSettings.value.lastConnection = {
        status: 'success',
        timestamp: new Date(),
        message: t('settings.kbs.connectionSuccess')
      }
      toast.success(t('settings.kbs.connectionSuccessToast'))
    } else {
      localSettings.value.lastConnection = {
        status: 'error',
        timestamp: new Date(),
        message: response.message || t('settings.kbs.connectionError')
      }
      toast.error(response.message || t('settings.kbs.connectionError'))
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: error.response?.data?.message || error.message || t('settings.kbs.connectionError')
    }
    localSettings.value.lastConnection = {
      status: 'error',
      timestamp: new Date(),
      message: testResult.value.message
    }
    toast.error(testResult.value.message)
  } finally {
    testing.value = false
  }
}

// Get connection status text
const getConnectionStatusText = () => {
  const { status, timestamp, message } = localSettings.value.lastConnection || {}

  if (status === 'never') return t('settings.kbs.notTested')
  if (status === 'success') {
    const date = timestamp ? new Date(timestamp).toLocaleString('tr-TR') : ''
    return t('settings.kbs.lastSuccess', { date })
  }
  if (status === 'error') {
    return message || t('settings.kbs.connectionError')
  }
  return ''
}
</script>
