<template>
  <div>
    <!-- Detail Views (Room Type, Market, etc.) - No navigation, full screen -->
    <template v-if="isDetailRoute">
      <router-view />
    </template>

    <!-- Main Planning View with Navigation -->
    <template v-else>
      <!-- Navigation -->
      <ModuleNavigation :items="navItems" color="indigo" />

      <!-- No Hotel Selected State -->
      <div v-if="!selectedHotel">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
          <div class="p-12 text-center">
            <span class="material-icons text-6xl text-gray-300 dark:text-slate-600">hotel</span>
            <h3 class="mt-4 text-lg font-medium text-gray-800 dark:text-white">
              {{ $t('planning.selectHotelPrompt') }}
            </h3>
            <p class="mt-2 text-gray-500 dark:text-slate-400">
              {{ $t('planning.selectHotelPromptDescription') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Main Content (when hotel is selected) -->
      <div v-else>
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <!-- Hotel Settings Tab -->
          <div v-show="activeTab === 'settings'">
            <HotelSettingsTab
              v-if="selectedHotel"
              :hotel="selectedHotel"
              @refresh="handleRefresh"
            />
          </div>

          <!-- Rooms & Meal Plans Tab -->
          <div v-show="activeTab === 'rooms'">
            <RoomsTab v-if="selectedHotel" :hotel="selectedHotel" @refresh="handleRefresh" />
          </div>

          <!-- Markets Tab -->
          <div v-show="activeTab === 'markets'">
            <MarketsTab v-if="selectedHotel" :hotel="selectedHotel" @refresh="handleRefresh" />
          </div>

          <!-- Campaigns Tab -->
          <div v-show="activeTab === 'campaigns'">
            <CampaignsTab v-if="selectedHotel" :hotel="selectedHotel" @refresh="handleRefresh" />
          </div>

          <!-- Promo Codes Tab -->
          <div v-show="activeTab === 'promo-codes'">
            <PromoCodesTab v-if="selectedHotel" :hotel="selectedHotel" @refresh="handleRefresh" />
          </div>

          <!-- Pricing Tab -->
          <div v-show="activeTab === 'pricing'">
            <PricingTab
              v-if="selectedHotel"
              :hotel="selectedHotel"
              :active="activeTab === 'pricing'"
              :refresh-trigger="refreshTrigger"
              @refresh="handleRefresh"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'
import { useUIStore } from '@/stores/ui'
import HotelSettingsTab from '@/components/planning/settings/HotelSettingsTab.vue'
import RoomsTab from '@/components/planning/rooms/RoomsTab.vue'
import MarketsTab from '@/components/planning/markets/MarketsTab.vue'
import CampaignsTab from '@/components/planning/campaigns/CampaignsTab.vue'
import PromoCodesTab from '@/components/planning/promos/PromoCodesTab.vue'
import PricingTab from '@/components/planning/pricing/PricingTab.vue'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'

const { t } = useI18n()
const route = useRoute()
const hotelStore = useHotelStore()
const uiStore = useUIStore()

// Navigation items for ModuleNavigation - each tab becomes a nav item
const navItems = computed(() => [
  {
    name: 'settings',
    to: '/planning/settings',
    icon: 'settings',
    label: t('planning.tabs.settings'),
    exact: true
  },
  {
    name: 'rooms',
    to: '/planning/rooms',
    icon: 'bed',
    label: t('planning.tabs.rooms'),
    exact: true
  },
  {
    name: 'markets',
    to: '/planning/markets',
    icon: 'public',
    label: t('planning.tabs.markets'),
    exact: true
  },
  {
    name: 'campaigns',
    to: '/planning/campaigns',
    icon: 'campaign',
    label: t('planning.tabs.campaigns'),
    exact: true
  },
  {
    name: 'promo-codes',
    to: '/planning/promo-codes',
    icon: 'confirmation_number',
    label: t('planning.tabs.promoCodes'),
    exact: true
  },
  {
    name: 'pricing',
    to: '/planning/pricing',
    icon: 'payments',
    label: t('planning.tabs.pricing'),
    exact: true
  }
])

// Get selected hotel from store
const selectedHotel = computed(() => hotelStore.selectedHotel)

// Update page title suffix when hotel changes
watch(
  selectedHotel,
  hotel => {
    if (hotel) {
      uiStore.setPageTitleSuffix(hotel.name)
    } else {
      uiStore.clearPageTitle()
    }
  },
  { immediate: true }
)

// Clear title suffix when leaving page
onUnmounted(() => {
  uiStore.clearPageTitle()
})

// Valid tab IDs
const validTabs = ['settings', 'rooms', 'markets', 'campaigns', 'promo-codes', 'pricing']

// Detail route names that should render via router-view
const detailRouteNames = ['room-type-new', 'room-type-detail', 'market-new', 'market-detail']

// Check if current route is a detail view (room type, market, etc.)
const isDetailRoute = computed(() => {
  return detailRouteNames.includes(route.name)
})

// Get active tab from route meta or path
const activeTab = computed(() => {
  // Check route meta first (set by child routes)
  if (route.meta.tab && validTabs.includes(route.meta.tab)) {
    return route.meta.tab
  }
  // Fallback: extract from path
  const pathParts = route.path.split('/')
  const lastPart = pathParts[pathParts.length - 1]
  if (validTabs.includes(lastPart)) {
    return lastPart
  }
  return 'settings'
})

// Refresh trigger for cross-tab data updates
const refreshTrigger = ref(0)

const handleRefresh = async () => {
  // Refresh hotel data from API
  await hotelStore.refreshHotel()
  // Increment trigger to force child components to refresh their data
  refreshTrigger.value++
}
</script>
