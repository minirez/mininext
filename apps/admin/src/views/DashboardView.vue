<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <span class="material-icons text-5xl text-purple-600 animate-spin">refresh</span>
        <p class="text-gray-500 dark:text-slate-400 mt-4">{{ $t('common.loading') }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 rounded-xl p-8 text-center">
      <span class="material-icons text-5xl text-red-500">error_outline</span>
      <p class="text-red-600 dark:text-red-400 mt-4">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        @click="loadDashboard"
      >
        {{ $t('common.retry') }}
      </button>
    </div>

    <!-- Platform Admin Dashboard -->
    <PlatformDashboard
      v-else-if="isPlatformAdmin"
      :stats="dashboardData.stats"
      :recent-bookings="dashboardData.recentBookings"
      :top-partners="dashboardData.topPartners"
      :monthly-trend="dashboardData.monthlyTrend"
    />

    <!-- Partner Dashboard -->
    <PartnerDashboard
      v-else-if="isPartner"
      :stats="dashboardData.stats"
      :recent-bookings="dashboardData.recentBookings"
      :top-agencies="dashboardData.topAgencies"
      :top-hotels="dashboardData.topHotels"
      :daily-trend="dashboardData.dailyTrend"
    />

    <!-- Agency Dashboard -->
    <AgencyDashboard
      v-else-if="isAgency"
      :stats="dashboardData.stats"
      :recent-bookings="dashboardData.recentBookings"
      :top-hotels="dashboardData.topHotels"
      :daily-trend="dashboardData.dailyTrend"
    />

    <!-- Fallback -->
    <div v-else class="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
      <span class="material-icons text-5xl text-gray-400">dashboard</span>
      <p class="text-gray-500 dark:text-slate-400 mt-4">{{ $t('dashboard.welcome') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { usePartnerStore } from '@/stores/partner'
import { useAsyncAction } from '@/composables/useAsyncAction'
import * as dashboardService from '@/services/dashboardService'
import PlatformDashboard from '@/components/dashboard/PlatformDashboard.vue'
import PartnerDashboard from '@/components/dashboard/PartnerDashboard.vue'
import AgencyDashboard from '@/components/dashboard/AgencyDashboard.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const partnerStore = usePartnerStore()

// Async action composable
const { isLoading: loading, execute: executeLoad } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })

const error = ref(null)
const dashboardData = ref({
  stats: {},
  recentBookings: [],
  topPartners: [],
  topAgencies: [],
  topHotels: [],
  monthlyTrend: [],
  dailyTrend: []
})

// User type checks - Platform admin viewing as partner should see partner dashboard
const isPlatformAdmin = computed(
  () => authStore.isPlatformAdmin && !partnerStore.hasSelectedPartner
)
const isPartner = computed(
  () =>
    authStore.accountType === 'partner' ||
    (authStore.isPlatformAdmin && partnerStore.hasSelectedPartner)
)
const isAgency = computed(() => authStore.accountType === 'agency')

const loadDashboard = async () => {
  error.value = null

  await executeLoad(
    async () => {
      if (isPlatformAdmin.value) {
        return dashboardService.getPlatformDashboard()
      } else if (isPartner.value) {
        return dashboardService.getPartnerDashboard()
      } else if (isAgency.value) {
        return dashboardService.getAgencyDashboard()
      }
    },
    {
      onSuccess: data => {
        if (data) {
          dashboardData.value = data
        }
      },
      onError: err => {
        console.error('Dashboard load error:', err)
        error.value = t('dashboard.loadError')
      }
    }
  )
}

// Reload dashboard when partner selection changes
watch(
  () => partnerStore.selectedPartner,
  () => {
    loadDashboard()
  }
)

onMounted(() => {
  loadDashboard()
})
</script>
