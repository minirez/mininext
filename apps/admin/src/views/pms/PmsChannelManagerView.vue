<template>
  <div class="space-y-6">
    <!-- No Hotel Selected Warning -->
    <div
      v-if="!hotelId"
      class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center"
    >
      <span class="material-icons text-4xl text-amber-500 mb-2">domain_disabled</span>
      <p class="font-medium text-amber-800 dark:text-amber-200">
        {{ $t('settings.users.hotelRequired') }}
      </p>
      <p class="text-sm text-amber-600 dark:text-amber-400 mt-1">
        {{ $t('settings.users.hotelRequiredDesc') }}
      </p>
    </div>

    <template v-else>
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <span class="material-icons animate-spin text-4xl text-indigo-600">refresh</span>
      </div>

      <div
        v-else
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
          <div class="flex min-w-max">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
              :class="
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
              "
              @click="activeTab = tab.id"
            >
              <span class="material-icons text-sm mr-1 align-middle">{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Connection Settings -->
          <ConnectionSettings
            v-if="activeTab === 'connection'"
            :connection="connection"
            :saving="saving"
            :testing="testing"
            @save="handleSave"
            @test="handleTest"
            @delete="handleDelete"
          />

          <!-- Product Mapping -->
          <ProductMapping
            v-else-if="activeTab === 'mapping'"
            :products="products"
            :existing-mappings="connection?.roomMappings || []"
            :local-room-types="localRoomTypes"
            :local-meal-plans="localMealPlans"
            :loading-products="loadingProducts"
            :saving-mappings="savingMappings"
            :last-fetched-at="connection?.cachedProducts?.fetchedAt || null"
            @fetchProducts="handleFetchProducts"
            @save="handleSaveMappings"
          />

          <!-- OTA List -->
          <OTAList
            v-else-if="activeTab === 'ota'"
            :ota-list="otaList"
            :ota-products="otaProducts"
            :ota-products-fetched-at="otaProductsFetchedAt"
            :loading="loadingOTAs"
            :loading-products="loadingOTAProducts"
            :last-fetched-at="connection?.lastSync?.products || null"
            @refresh="handleFetchOTAs"
            @fetchProducts="handleFetchOTAProducts"
          />

          <!-- Reservations -->
          <ReservationLog
            v-else-if="activeTab === 'reservations'"
            :sync-status="syncStatus"
            :last-results="lastSyncResults"
            :syncing="syncing"
            @sync="handleReservationSync"
          />

          <!-- Inventory -->
          <InventorySync
            v-else-if="activeTab === 'inventory'"
            :integration-type="connection?.integrationType || 'one_way'"
            :sync-status="syncStatus"
            :last-results="lastInventoryResults"
            :syncing="syncingInventory"
            :queue-data="queueData"
            :retrying="retryingFailed"
            @sync="handleInventorySync"
            @loadQueue="loadQueueStatus"
            @retryFailed="handleRetryFailed"
          />

          <!-- Logs -->
          <SyncLogs
            v-else-if="activeTab === 'logs'"
            :logs="allLogs"
            :log-detail="logDetail"
            :detail-loading="detailLoading"
            @filter="handleFilterLogs"
            @viewLog="handleViewLog"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import { usePmsStore } from '@/stores/pms'
import { pmsLogger } from '@/utils/logger'
import * as channelManagerService from '@/services/pms/channelManagerService'
import { getRoomTypes } from '@/services/planning/roomTypeService'
import { getMealPlans } from '@/services/planning/mealPlanService'
import ConnectionSettings from '@/components/pms/channel-manager/ConnectionSettings.vue'
import ProductMapping from '@/components/pms/channel-manager/ProductMapping.vue'
import OTAList from '@/components/pms/channel-manager/OTAList.vue'
import ReservationLog from '@/components/pms/channel-manager/ReservationLog.vue'
import InventorySync from '@/components/pms/channel-manager/InventorySync.vue'
import SyncLogs from '@/components/pms/channel-manager/SyncLogs.vue'

const toast = useToast()
const { t } = useI18n()
const pmsStore = usePmsStore()
const hotelId = computed(() => pmsStore.hotelId)

// State
const loading = ref(true)
const activeTab = ref('connection')
const connection = ref(null)
const saving = ref(false)
const testing = ref(false)

// Products & Mapping
const products = ref([])
const localRoomTypes = ref([])
const localMealPlans = ref([])
const loadingProducts = ref(false)
const savingMappings = ref(false)

// OTA
const otaList = ref(null)
const otaProducts = ref(null)
const otaProductsFetchedAt = ref(null)
const loadingOTAs = ref(false)
const loadingOTAProducts = ref(false)

// Reservations
const syncStatus = ref(null)
const lastSyncResults = ref(null)
const syncing = ref(false)

// Inventory
const lastInventoryResults = ref(null)
const syncingInventory = ref(false)

// Sync Queue
const queueData = ref(null)
const retryingFailed = ref(false)

// Logs
const allLogs = ref([])
const logDetail = ref(null)
const detailLoading = ref(false)

// Tabs
const tabs = computed(() => [
  { id: 'connection', icon: 'link', label: t('pms.channelManager.tabs.connection') },
  { id: 'mapping', icon: 'account_tree', label: t('pms.channelManager.tabs.mapping') },
  { id: 'ota', icon: 'share', label: t('pms.channelManager.tabs.ota') },
  { id: 'reservations', icon: 'book_online', label: t('pms.channelManager.tabs.reservations') },
  { id: 'inventory', icon: 'inventory', label: t('pms.channelManager.tabs.inventory') },
  { id: 'logs', icon: 'description', label: t('pms.channelManager.tabs.logs') }
])

// Load data on mount
onMounted(() => {
  if (hotelId.value) loadConnection()
})

// Reload when hotel changes
watch(hotelId, newId => {
  if (newId) loadConnection()
})

async function loadConnection() {
  loading.value = true
  try {
    const res = await channelManagerService.getConnection(hotelId.value)
    connection.value = res.data?.connection || null

    // Always load local room types & meal plans for mapping
    await loadLocalData()

    if (connection.value) {
      // Restore cached products from DB
      if (connection.value.cachedProducts?.roomTypes?.length) {
        products.value = connection.value.cachedProducts.roomTypes
      }

      // Restore cached OTAs from DB
      if (connection.value.connectedOTAs?.length) {
        otaList.value = {
          connected: connection.value.connectedOTAs
            .filter(o => o.status === 'connected')
            .map(o => o.name),
          notConnected: connection.value.connectedOTAs
            .filter(o => o.status === 'not_connected')
            .map(o => o.name)
        }
      }

      // Load sync status
      await loadSyncStatus()
    }
  } catch (err) {
    pmsLogger.error('Failed to load connection:', err)
  } finally {
    loading.value = false
  }
}

async function loadLocalData() {
  try {
    const [rtRes, mpRes] = await Promise.all([
      getRoomTypes(hotelId.value),
      getMealPlans(hotelId.value)
    ])
    localRoomTypes.value = rtRes.data || []
    localMealPlans.value = mpRes.data || []
  } catch (err) {
    pmsLogger.error('Failed to load local room types / meal plans:', err)
  }
}

async function loadSyncStatus() {
  try {
    const res = await channelManagerService.getSyncStatus(hotelId.value)
    syncStatus.value = res.data?.status || null
  } catch (err) {
    pmsLogger.error('Failed to load sync status:', err)
  }
}

// Connection handlers
async function handleSave(formData) {
  saving.value = true
  try {
    const res = await channelManagerService.saveConnection(hotelId.value, formData)
    connection.value = res.data?.connection || null
    toast.success(t('pms.channelManager.messages.connectionSaved'))
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    saving.value = false
  }
}

async function handleTest() {
  testing.value = true
  try {
    const res = await channelManagerService.testConnection(hotelId.value)
    if (res.data?.success) {
      toast.success(t('pms.channelManager.messages.connectionSuccess'))
      await loadConnection()
    } else {
      toast.error(res.data?.message || t('pms.channelManager.messages.connectionFailed'))
    }
  } catch (err) {
    toast.error(err.response?.data?.error || t('pms.channelManager.messages.connectionFailed'))
  } finally {
    testing.value = false
  }
}

async function handleDelete() {
  if (!confirm(t('pms.channelManager.messages.deleteConfirm'))) return
  try {
    await channelManagerService.deleteConnection(hotelId.value)
    connection.value = null
    toast.success(t('pms.channelManager.messages.connectionDeleted'))
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  }
}

// Products & Mapping handlers
async function handleFetchProducts() {
  loadingProducts.value = true
  try {
    const res = await channelManagerService.fetchProducts(hotelId.value)
    products.value = res.data?.products?.roomTypes || []
    // Update connection (backend caches products in DB)
    if (res.data?.connection) {
      connection.value = res.data.connection
    }
    toast.success(t('pms.channelManager.messages.productsFetched'))
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    loadingProducts.value = false
  }
}

async function handleSaveMappings(mappings) {
  savingMappings.value = true
  try {
    const res = await channelManagerService.saveMappings(hotelId.value, mappings)
    connection.value = res.data?.connection || connection.value
    toast.success(t('pms.channelManager.messages.mappingsSaved'))
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    savingMappings.value = false
  }
}

// OTA handlers
async function handleFetchOTAs() {
  loadingOTAs.value = true
  try {
    const res = await channelManagerService.fetchOTAs(hotelId.value)
    otaList.value = res.data?.otaList || null
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    loadingOTAs.value = false
  }
}

// OTA product mappings handler
async function handleFetchOTAProducts() {
  loadingOTAProducts.value = true
  try {
    const res = await channelManagerService.fetchOTAProducts(hotelId.value)
    otaProducts.value = res.data?.otaProducts || null
    otaProductsFetchedAt.value = new Date().toISOString()
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    loadingOTAProducts.value = false
  }
}

// Reservation sync handlers
async function handleReservationSync() {
  syncing.value = true
  try {
    const res = await channelManagerService.triggerReservationSync(hotelId.value)
    lastSyncResults.value = res.data?.results || null
    await loadSyncStatus()
    toast.success(t('pms.channelManager.messages.syncCompleted'))
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    syncing.value = false
  }
}

// Inventory sync handlers
async function handleInventorySync() {
  syncingInventory.value = true
  try {
    const res = await channelManagerService.triggerInventorySync(hotelId.value)
    lastInventoryResults.value = res.data?.results || null
    await loadSyncStatus()
    toast.success(t('pms.channelManager.messages.inventorySyncCompleted'))
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    syncingInventory.value = false
  }
}

// Sync Queue handlers
async function loadQueueStatus() {
  try {
    const res = await channelManagerService.getPendingSyncs(hotelId.value)
    queueData.value = res.data || null
  } catch (err) {
    pmsLogger.error('Failed to load queue status:', err)
  }
}

async function handleRetryFailed() {
  retryingFailed.value = true
  try {
    await channelManagerService.retryFailedSyncs(hotelId.value)
    toast.success(t('pms.channelManager.inventory.retryQueued'))
    await loadQueueStatus()
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    retryingFailed.value = false
  }
}

// Log handlers
async function handleFilterLogs(filters) {
  try {
    const res = await channelManagerService.getLogs(hotelId.value, {
      type: filters.type || undefined,
      status: filters.status || undefined,
      limit: 50
    })
    allLogs.value = res.data?.data || []
  } catch (err) {
    pmsLogger.error('Failed to load logs:', err)
  }
}

async function handleViewLog(logId) {
  detailLoading.value = true
  try {
    const res = await channelManagerService.getLogDetail(hotelId.value, logId)
    logDetail.value = res.data?.log || null
  } catch (err) {
    toast.error(t('common.error'))
  } finally {
    detailLoading.value = false
  }
}

// Load data when tab becomes active
watch(activeTab, tab => {
  if (tab === 'logs') {
    handleFilterLogs({})
  }
  if (tab === 'reservations') {
    loadSyncStatus()
  }
  if (tab === 'inventory') {
    loadQueueStatus()
  }
})
</script>
