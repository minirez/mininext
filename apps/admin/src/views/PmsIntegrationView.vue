<template>
  <div class="space-y-6">
    <!-- Header with Hotel Selector -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ $t('pmsIntegration.title') }}
          </h1>
          <p class="mt-1 text-gray-500 dark:text-gray-400">
            {{ $t('pmsIntegration.description') }}
          </p>
        </div>

        <!-- Hotel Selector -->
        <div class="w-full md:w-80">
          <HotelSelector
            v-model="selectedHotel"
            :placeholder="$t('pmsIntegration.selectHotel')"
            @change="onHotelChange"
          />
        </div>
      </div>
    </div>

    <!-- No Hotel Selected -->
    <div
      v-if="!selectedHotel"
      class="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center"
    >
      <span class="material-icons text-6xl text-gray-300 dark:text-gray-600 block mb-4">apartment</span>
      <p class="text-gray-500 dark:text-gray-400">{{ $t('pmsIntegration.selectHotelPrompt') }}</p>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="bg-white dark:bg-slate-800 rounded-lg shadow p-12">
      <div class="flex justify-center">
        <Spinner size="lg" />
      </div>
    </div>

    <!-- Hotel PMS Status -->
    <template v-else>
      <!-- Hotel Info Card -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <span class="material-icons text-2xl text-indigo-600 dark:text-indigo-400">hotel</span>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ selectedHotel?.name }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ selectedHotel?.address?.city }}<template v-if="selectedHotel?.address?.country">, {{ selectedHotel?.address?.country }}</template>
                </p>
              </div>
            </div>

            <!-- PMS Status Badge & Action -->
            <div class="flex items-center gap-3">
              <span
                v-if="hotelPmsStatus"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': hotelPmsStatus.status === 'active',
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': hotelPmsStatus.status === 'pending',
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': hotelPmsStatus.status === 'failed'
                }"
              >
                <span class="material-icons text-sm mr-1">
                  {{ hotelPmsStatus.status === 'active' ? 'check_circle' : hotelPmsStatus.status === 'pending' ? 'schedule' : 'error' }}
                </span>
                {{ $t(`pmsIntegration.hotelStatus.${hotelPmsStatus.status}`) }}
              </span>

              <button
                v-if="!hotelPmsStatus"
                class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                @click="openProvisionModal"
              >
                <span class="material-icons text-lg mr-1.5">cloud_upload</span>
                {{ $t('pmsIntegration.provisionButton') }}
              </button>

              <button
                v-else-if="hotelPmsStatus.status === 'active'"
                class="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                @click="openSyncModal"
              >
                <span class="material-icons text-lg mr-1.5">sync</span>
                {{ $t('pmsIntegration.syncButton') }}
              </button>
            </div>
          </div>
        </div>

        <!-- PMS Details (if provisioned) -->
        <div v-if="hotelPmsStatus" class="border-t border-gray-200 dark:border-slate-700">
          <dl class="divide-y divide-gray-200 dark:divide-slate-700">
            <div class="px-6 py-4 flex justify-between">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ $t('pmsIntegration.pmsHotelId') }}</dt>
              <dd class="text-sm font-mono text-gray-900 dark:text-white">{{ hotelPmsStatus.pmsHotelId || '-' }}</dd>
            </div>
            <div class="px-6 py-4 flex justify-between">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ $t('pmsIntegration.provisionedAt') }}</dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                {{ hotelPmsStatus.provisionedAt ? formatDateTime(hotelPmsStatus.provisionedAt) : '-' }}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Success Message with Credentials -->
      <div
        v-if="provisionResult"
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6"
      >
        <div class="flex items-start gap-4">
          <span class="material-icons text-2xl text-green-600 dark:text-green-400">check_circle</span>
          <div class="flex-1">
            <h4 class="font-semibold text-green-800 dark:text-green-200 mb-2">
              {{ $t('pmsIntegration.provisionSuccess') }}
            </h4>
            <p class="text-green-700 dark:text-green-300 text-sm mb-4">
              {{ $t('pmsIntegration.provisionSuccessDesc') }}
            </p>

            <!-- Credentials Box -->
            <div class="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-3">
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400 uppercase">{{ $t('pmsIntegration.username') }}</span>
                <p class="font-mono text-gray-900 dark:text-white">{{ provisionResult.username }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400 uppercase">{{ $t('pmsIntegration.tempPassword') }}</span>
                <p class="font-mono text-gray-900 dark:text-white text-lg">{{ provisionResult.tempPassword }}</p>
              </div>
            </div>

            <p class="text-xs text-green-600 dark:text-green-400 mt-3">
              <span class="material-icons text-sm align-middle mr-1">warning</span>
              {{ $t('pmsIntegration.saveCredentialsWarning') }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Provision Modal -->
    <Modal v-model="showProvisionModal" :title="$t('pmsIntegration.provisionModalTitle')" size="lg">
      <div class="space-y-6">
        <!-- Description -->
        <p class="text-gray-600 dark:text-gray-400">
          {{ $t('pmsIntegration.provisionModalDesc') }}
        </p>

        <!-- Hotel Summary -->
        <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <span class="material-icons text-2xl text-indigo-600 dark:text-indigo-400">hotel</span>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ selectedHotel?.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ selectedHotel?.address?.city }}</p>
            </div>
          </div>
        </div>

        <!-- What to Sync -->
        <div>
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {{ $t('pmsIntegration.selectDataToSync') }}
          </h4>

          <div class="space-y-3">
            <!-- Room Types -->
            <label class="flex items-start gap-3 p-3 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
              <input
                v-model="syncOptions.roomTypes"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ $t('pmsIntegration.roomTypes') }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('pmsIntegration.roomTypesDesc') }}</p>
              </div>
              <span class="text-xs bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                {{ roomTypesCount }} {{ $t('common.items') }}
              </span>
            </label>

            <!-- Board Types -->
            <label class="flex items-start gap-3 p-3 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
              <input
                v-model="syncOptions.boardTypes"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ $t('pmsIntegration.boardTypes') }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('pmsIntegration.boardTypesDesc') }}</p>
              </div>
              <span class="text-xs bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                {{ boardTypesCount }} {{ $t('common.items') }}
              </span>
            </label>
          </div>
        </div>

        <!-- Warning -->
        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div class="flex gap-3">
            <span class="material-icons text-amber-600 dark:text-amber-400">info</span>
            <p class="text-sm text-amber-800 dark:text-amber-200">
              {{ $t('pmsIntegration.provisionWarning') }}
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            @click="showProvisionModal = false"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="provisioning"
            @click="provisionHotel"
          >
            <Spinner v-if="provisioning" size="sm" class="mr-2" />
            <span class="material-icons text-lg mr-1.5" v-else>rocket_launch</span>
            {{ $t('pmsIntegration.startProvisioning') }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import partnerService from '@/services/partnerService'
import HotelSelector from '@/components/common/HotelSelector.vue'
import { Spinner, Modal } from '@/components/ui'

const { t } = useI18n()
const toast = useToast()

// State
const selectedHotel = ref(null)
const loading = ref(false)
const provisioning = ref(false)
const hotelPmsStatus = ref(null)
const provisionResult = ref(null)
const showProvisionModal = ref(false)
const showSyncModal = ref(false)

// Sync options
const syncOptions = ref({
  roomTypes: true,
  boardTypes: true
})

// Hotel data counts
const roomTypesCount = ref(0)
const boardTypesCount = ref(0)

// Format date with time
const formatDateTime = (date) => {
  return new Date(date).toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Fetch hotel data counts
const fetchHotelDataCounts = async () => {
  if (!selectedHotel.value?._id) return

  try {
    // TODO: Implement these API calls when endpoints are ready
    // For now, use placeholder values
    roomTypesCount.value = selectedHotel.value?.roomConfig?.totalRooms || 0
    boardTypesCount.value = 3 // Placeholder
  } catch (error) {
    console.error('Failed to fetch hotel data counts:', error)
  }
}

// Fetch PMS status for selected hotel
const fetchHotelPmsStatus = async () => {
  if (!selectedHotel.value?._id) {
    hotelPmsStatus.value = null
    return
  }

  try {
    loading.value = true
    provisionResult.value = null

    const response = await partnerService.getHotelPmsStatus(selectedHotel.value._id)
    hotelPmsStatus.value = response.data?.pmsStatus || null

    // Also fetch data counts for modal
    await fetchHotelDataCounts()
  } catch (error) {
    console.error('Failed to fetch hotel PMS status:', error)
    hotelPmsStatus.value = null
  } finally {
    loading.value = false
  }
}

// Handle hotel selection change
const onHotelChange = (hotel) => {
  provisionResult.value = null
  if (hotel) {
    fetchHotelPmsStatus()
  } else {
    hotelPmsStatus.value = null
  }
}

// Open provision modal
const openProvisionModal = () => {
  syncOptions.value = {
    roomTypes: true,
    boardTypes: true
  }
  showProvisionModal.value = true
}

// Open sync modal
const openSyncModal = () => {
  showSyncModal.value = true
}

// Provision hotel to PMS
const provisionHotel = async () => {
  if (!selectedHotel.value?._id) return

  try {
    provisioning.value = true

    const response = await partnerService.provisionHotelToPms(selectedHotel.value._id, {
      syncOptions: syncOptions.value
    })

    // Store credentials to display
    provisionResult.value = response.data

    toast.success(t('pmsIntegration.provisionSuccess'))
    showProvisionModal.value = false

    // Refresh status
    await fetchHotelPmsStatus()
  } catch (error) {
    console.error('Failed to provision hotel:', error)
    const errorMessage = error.response?.data?.message
    if (errorMessage === 'PMS_NOT_ENABLED') {
      toast.error(t('pmsIntegration.errors.pmsNotEnabled'))
    } else if (errorMessage === 'HOTEL_ALREADY_PROVISIONED') {
      toast.error(t('pmsIntegration.errors.alreadyProvisioned'))
    } else {
      toast.error(error.response?.data?.message || t('common.error'))
    }
  } finally {
    provisioning.value = false
  }
}

// Watch for hotel changes
watch(selectedHotel, (newHotel) => {
  if (newHotel) {
    fetchHotelPmsStatus()
  }
})
</script>
