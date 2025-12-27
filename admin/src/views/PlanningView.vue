<template>
  <div>
    <!-- No Hotel Selected State -->
    <div v-if="!selectedHotel" class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="p-12 text-center">
        <span class="material-icons text-6xl text-gray-300 dark:text-slate-600">hotel</span>
        <h3 class="mt-4 text-lg font-medium text-gray-800 dark:text-white">{{ $t('planning.selectHotelPrompt') }}</h3>
        <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('planning.selectHotelPromptDescription') }}</p>
      </div>
    </div>

    <!-- Main Content (when hotel is selected) -->
    <div v-else class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <!-- Selected Hotel Info Bar -->
      <div class="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center gap-3">
        <div v-if="selectedHotel.logo || getMainImage(selectedHotel)" class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
          <img
            :src="getImageUrl(selectedHotel.logo || getMainImage(selectedHotel))"
            :alt="selectedHotel.name"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="flex-1">
          <div class="font-medium text-gray-800 dark:text-white flex items-center gap-2">
            {{ selectedHotel.name }}
            <span class="flex items-center text-yellow-500">
              <span v-for="n in selectedHotel.stars" :key="n" class="material-icons text-sm">star</span>
            </span>
          </div>
          <div class="text-sm text-gray-500 dark:text-slate-400">
            {{ selectedHotel.address?.city }}, {{ selectedHotel.address?.country }}
          </div>
        </div>
        <router-link
          :to="`/hotels/${selectedHotel._id}`"
          class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm flex items-center gap-1"
        >
          <span class="material-icons text-sm">open_in_new</span>
          {{ $t('planning.viewHotel') }}
        </router-link>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-slate-700">
        <nav class="flex -mb-px">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2"
            :class="activeTab === tab.id
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'"
          >
            <span class="material-icons text-lg">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Rooms & Meal Plans Tab -->
        <div v-show="activeTab === 'rooms'">
          <RoomsTab
            v-if="selectedHotel"
            :hotel="selectedHotel"
            @refresh="handleRefresh"
          />
        </div>

        <!-- Markets Tab -->
        <div v-show="activeTab === 'markets'">
          <MarketsTab
            v-if="selectedHotel"
            :hotel="selectedHotel"
            @refresh="handleRefresh"
          />
        </div>

        <!-- Campaigns Tab -->
        <div v-show="activeTab === 'campaigns'">
          <CampaignsTab
            v-if="selectedHotel"
            :hotel="selectedHotel"
            @refresh="handleRefresh"
          />
        </div>

        <!-- Pricing Tab -->
        <div v-show="activeTab === 'pricing'">
          <PricingTab
            v-if="selectedHotel"
            :hotel="selectedHotel"
            @refresh="handleRefresh"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useHotelStore } from '@/stores/hotel'
import RoomsTab from '@/components/planning/rooms/RoomsTab.vue'
import MarketsTab from '@/components/planning/markets/MarketsTab.vue'
import CampaignsTab from '@/components/planning/campaigns/CampaignsTab.vue'
import PricingTab from '@/components/planning/pricing/PricingTab.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const hotelStore = useHotelStore()

// Get selected hotel from store
const selectedHotel = computed(() => hotelStore.selectedHotel)

// Valid tab IDs
const validTabs = ['rooms', 'markets', 'campaigns', 'pricing']

// Initialize activeTab from route query or default to 'rooms'
const getInitialTab = () => {
  const tabFromRoute = route.query.tab
  return validTabs.includes(tabFromRoute) ? tabFromRoute : 'rooms'
}

const activeTab = ref(getInitialTab())

// Watch activeTab and update route
watch(activeTab, (newTab) => {
  if (newTab && newTab !== route.query.tab) {
    router.replace({
      query: { ...route.query, tab: newTab }
    })
  }
})

// Watch route changes (e.g., browser back/forward)
watch(() => route.query.tab, (newTab) => {
  if (newTab && validTabs.includes(newTab) && newTab !== activeTab.value) {
    activeTab.value = newTab
  }
})

// Tabs configuration
const tabs = computed(() => [
  {
    id: 'rooms',
    label: t('planning.tabs.rooms'),
    icon: 'bed'
  },
  {
    id: 'markets',
    label: t('planning.tabs.markets'),
    icon: 'public'
  },
  {
    id: 'campaigns',
    label: t('planning.tabs.campaigns'),
    icon: 'campaign'
  },
  {
    id: 'pricing',
    label: t('planning.tabs.pricing'),
    icon: 'payments'
  }
])

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
  const baseUrl = apiBaseUrl.replace('/api', '')
  return `${baseUrl}${url}`
}

const getMainImage = (hotel) => {
  const mainImage = hotel.images?.find(img => img.isMain)
  return mainImage?.url || hotel.images?.[0]?.url || null
}

const handleRefresh = () => {
  // Can be used to trigger data refresh across tabs
}
</script>
