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
      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          v-if="hasChanges"
          :disabled="saving"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          @click="saveAllSettings"
        >
          <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
          <span v-else class="material-icons text-sm">save</span>
          {{ $t('settings.save') }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <span class="material-icons animate-spin text-4xl text-indigo-600">refresh</span>
      </div>

      <!-- Settings Tabs -->
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
          <!-- Domain Settings -->
          <DomainSettings v-if="activeTab === 'domain'" :hotel-id="hotelId" />

          <!-- General Settings -->
          <GeneralSettings
            v-if="activeTab === 'general'"
            v-model="settings.general"
            :timezones="timezones"
            :currencies="currencies"
            @change="markChanged"
          />

          <!-- Front Desk Settings -->
          <FrontDeskSettings
            v-else-if="activeTab === 'frontDesk'"
            v-model="settings.frontDesk"
            @change="markChanged"
          />

          <!-- Room Types Settings -->
          <RoomTypesSettings v-else-if="activeTab === 'roomTypes'" />

          <!-- Meal Plans Settings -->
          <MealPlansSettings v-else-if="activeTab === 'mealPlans'" />

          <!-- Agency Settings -->
          <AgencySettings v-else-if="activeTab === 'agencies'" />

          <!-- Tax Settings -->
          <TaxSettings
            v-else-if="activeTab === 'taxes'"
            v-model="settings.taxes"
            @change="markChanged"
          />

          <!-- Invoicing Settings -->
          <InvoicingSettings
            v-else-if="activeTab === 'invoicing'"
            v-model="settings.invoicing"
            @change="markChanged"
          />

          <!-- Housekeeping Settings -->
          <HousekeepingSettings
            v-else-if="activeTab === 'housekeeping'"
            v-model="settings.housekeeping"
            @change="markChanged"
          />

          <!-- Cashier Settings -->
          <CashierSettings
            v-else-if="activeTab === 'cashier'"
            v-model="settings.cashier"
            @change="markChanged"
          />

          <!-- Notification Settings -->
          <NotificationSettings
            v-else-if="activeTab === 'notifications'"
            v-model="settings.notifications"
            @change="markChanged"
          />

          <!-- Reservation Settings -->
          <ReservationSettings
            v-else-if="activeTab === 'reservations'"
            v-model="settings.reservations"
            @change="markChanged"
          />

          <!-- Guest Settings -->
          <GuestSettings
            v-else-if="activeTab === 'guests'"
            v-model="settings.guests"
            @change="markChanged"
          />

          <!-- KBS Settings -->
          <KBSSettings
            v-else-if="activeTab === 'kbs'"
            v-model="settings.kbs"
            @change="markChanged"
          />

          <!-- Exchange Settings -->
          <ExchangeSettings
            v-else-if="activeTab === 'exchange'"
            v-model="settings.exchange"
            :hotel-id="hotelId"
            @change="markChanged"
          />
        </div>
      </div>
    </template>

    <!-- Reset Confirmation Modal -->
    <div
      v-if="showResetModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showResetModal = false"
    >
      <div class="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {{ $t('settings.resetSettings') }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ $t('settings.resetConfirmation') }}
        </p>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
            @click="showResetModal = false"
          >
            {{ $t('settings.cancel') }}
          </button>
          <button
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            @click="confirmReset"
          >
            {{ $t('settings.reset') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import * as settingsService from '@/services/pms/settingsService'

// Tab components
import GeneralSettings from '@/components/pms/settings/GeneralSettings.vue'
import FrontDeskSettings from '@/components/pms/settings/FrontDeskSettings.vue'
import TaxSettings from '@/components/pms/settings/TaxSettings.vue'
import InvoicingSettings from '@/components/pms/settings/InvoicingSettings.vue'
import HousekeepingSettings from '@/components/pms/settings/HousekeepingSettings.vue'
import CashierSettings from '@/components/pms/settings/CashierSettings.vue'
import NotificationSettings from '@/components/pms/settings/NotificationSettings.vue'
import ReservationSettings from '@/components/pms/settings/ReservationSettings.vue'
import GuestSettings from '@/components/pms/settings/GuestSettings.vue'
import KBSSettings from '@/components/pms/settings/KBSSettings.vue'
import ExchangeSettings from '@/components/pms/settings/ExchangeSettings.vue'
import AgencySettings from '@/components/pms/settings/AgencySettings.vue'
import RoomTypesSettings from '@/components/pms/settings/RoomTypesSettings.vue'
import MealPlansSettings from '@/components/pms/settings/MealPlansSettings.vue'
import DomainSettings from '@/components/pms/settings/DomainSettings.vue'
import { usePmsStore } from '@/stores/pms'

const toast = useToast()
const { t } = useI18n()
const pmsStore = usePmsStore()
const hotelId = computed(() => pmsStore.hotelId)

// State
const loading = ref(true)
const saving = ref(false)
const hasChanges = ref(false)
const showResetModal = ref(false)
const resetSection = ref(null)
const activeTab = ref('domain')

const settings = ref({
  general: {},
  frontDesk: {},
  taxes: {},
  invoicing: {},
  housekeeping: {},
  cashier: {},
  notifications: {},
  reservations: {},
  guests: {},
  exchange: { mode: 'tcmb', manualRates: {} },
  kbs: {}
})

const timezones = ref([])
const currencies = ref([])

// Tabs configuration - computed to support i18n reactivity
const tabs = computed(() => [
  { id: 'domain', label: t('settings.tabs.domain'), icon: 'dns' },
  { id: 'general', label: t('settings.tabs.general'), icon: 'settings' },
  { id: 'frontDesk', label: t('settings.tabs.frontDesk'), icon: 'desk' },
  { id: 'roomTypes', label: t('settings.tabs.roomTypes'), icon: 'bed' },
  { id: 'mealPlans', label: t('settings.tabs.mealPlans'), icon: 'restaurant' },
  { id: 'agencies', label: t('settings.tabs.agencies'), icon: 'business' },
  { id: 'taxes', label: t('settings.tabs.taxes'), icon: 'receipt' },
  { id: 'invoicing', label: t('settings.tabs.invoicing'), icon: 'description' },
  { id: 'housekeeping', label: t('settings.tabs.housekeeping'), icon: 'cleaning_services' },
  { id: 'cashier', label: t('settings.tabs.cashier'), icon: 'point_of_sale' },
  { id: 'exchange', label: t('settings.tabs.exchange'), icon: 'currency_exchange' },
  { id: 'notifications', label: t('settings.tabs.notifications'), icon: 'notifications' },
  { id: 'reservations', label: t('settings.tabs.reservations'), icon: 'event' },
  { id: 'guests', label: t('settings.tabs.guests'), icon: 'people' },
  { id: 'kbs', label: t('settings.tabs.kbs'), icon: 'badge' }
])

// Methods
const loadSettings = async () => {
  if (!hotelId.value) return

  loading.value = true
  try {
    const [settingsRes, timezonesRes, currenciesRes] = await Promise.all([
      settingsService.getSettings(hotelId.value),
      settingsService.getTimezones(),
      settingsService.getCurrencies()
    ])

    if (settingsRes.success) {
      settings.value = {
        general: settingsRes.data.general || {},
        frontDesk: settingsRes.data.frontDesk || {},
        taxes: settingsRes.data.taxes || {},
        invoicing: settingsRes.data.invoicing || {},
        housekeeping: settingsRes.data.housekeeping || {},
        cashier: settingsRes.data.cashier || {},
        notifications: settingsRes.data.notifications || {},
        reservations: settingsRes.data.reservations || {},
        guests: settingsRes.data.guests || {},
        exchange: settingsRes.data.exchange || { mode: 'tcmb', manualRates: {} },
        kbs: settingsRes.data.kbs || {}
      }
    }

    if (timezonesRes.success) {
      timezones.value = timezonesRes.data
    }

    if (currenciesRes.success) {
      currencies.value = currenciesRes.data
    }

    hasChanges.value = false
  } catch (error) {
    console.error('Error loading settings:', error)
    toast.error(t('settings.loadError'))
  } finally {
    loading.value = false
  }
}

const markChanged = () => {
  hasChanges.value = true
}

const saveAllSettings = async () => {
  if (!hotelId.value) return

  saving.value = true
  try {
    const response = await settingsService.updateAllSettings(hotelId.value, settings.value)
    if (response.success) {
      toast.success(t('settings.saveSuccess'))
      hasChanges.value = false
    }
  } catch (error) {
    console.error('Error saving settings:', error)
    toast.error(t('settings.saveError'))
  } finally {
    saving.value = false
  }
}

const openResetModal = section => {
  resetSection.value = section
  showResetModal.value = true
}

const confirmReset = async () => {
  if (!hotelId.value) return

  try {
    const response = await settingsService.resetSettings(hotelId.value, resetSection.value)
    if (response.success) {
      toast.success(t('settings.resetSuccess'))
      await loadSettings()
    }
  } catch (error) {
    console.error('Error resetting settings:', error)
    toast.error(t('settings.resetError'))
  } finally {
    showResetModal.value = false
    resetSection.value = null
  }
}

// Lifecycle
onMounted(() => {
  loadSettings()
})

// Reload when hotel changes
watch(hotelId, () => {
  loadSettings()
})

// Expose for child components
defineExpose({ openResetModal })
</script>
