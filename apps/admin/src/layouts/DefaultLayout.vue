<template>
  <div
    class="flex h-screen overflow-hidden bg-gray-100 dark:bg-slate-900 print:block print:h-auto print:overflow-visible print:bg-white"
  >
    <!-- Mobile Backdrop -->
    <Transition
      enter-active-class="transition-opacity ease-linear duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-linear duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="uiStore.isMobile && uiStore.sidebarOpen && showSidebar"
        class="fixed inset-0 bg-black/50 z-40 print:hidden"
        @click="uiStore.closeSidebar"
      ></div>
    </Transition>

    <!-- Sidebar (hidden in print) -->
    <Transition
      enter-active-class="transition-transform ease-out duration-300"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform ease-in duration-200"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <Sidebar
        v-show="showSidebar"
        :class="[uiStore.isMobile ? 'fixed left-0 top-0 z-50 h-full' : '', 'print:hidden']"
        @navigate="handleNavigate"
      />
    </Transition>

    <!-- Main Content Area -->
    <div class="flex-1 min-h-0 flex flex-col overflow-hidden print:block print:overflow-visible">
      <!-- Header (hidden in print) -->
      <Header :page-title="pageTitle" :page-description="pageDescription" class="print:hidden">
        <template #actions>
          <slot name="headerActions"></slot>
        </template>
      </Header>

      <!-- Subscription Alert Modal (trial/renewal/grace) -->
      <SubscriptionAlertModal />

      <!-- Page Content -->
      <main
        class="flex-1 min-h-0 overflow-y-auto bg-gray-100 dark:bg-slate-900 print:overflow-visible print:bg-white"
      >
        <div class="px-4 md:px-6 py-4 md:py-8 print:px-0 print:py-0">
          <router-view v-slot="{ Component, route }">
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 transform translate-y-4"
              enter-to-class="opacity-100 transform translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 transform translate-y-0"
              leave-to-class="opacity-0 transform -translate-y-4"
              mode="out-in"
            >
              <component :is="Component" :key="route.path" />
            </Transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Sidebar from '@/components/Sidebar.vue'
import Header from '@/components/Header.vue'
import SubscriptionAlertModal from '@/components/common/SubscriptionAlertModal.vue'
import { useUIStore } from '@/stores/ui'

const route = useRoute()
const uiStore = useUIStore()
const { t } = useI18n()

// Show sidebar: show on desktop, toggle on mobile
const showSidebar = computed(() => {
  return !uiStore.isMobile || uiStore.sidebarOpen
})

// Initialize UI store on mount
onMounted(() => {
  uiStore.initializeUI()
})

onUnmounted(() => {
  uiStore.cleanupUI()
})

// Close sidebar on route change (mobile only)
watch(
  () => route.path,
  () => {
    if (uiStore.isMobile) {
      uiStore.closeSidebar()
    }
  }
)

// Handle navigation from sidebar
const handleNavigate = () => {
  if (uiStore.isMobile) {
    uiStore.closeSidebar()
  }
}

// Base titles by route name
const getBaseTitle = routeName => {
  if (route.meta?.titleKey) {
    return t(route.meta.titleKey)
  }
  const titles = {
    dashboard: t('dashboard.title'),
    partners: t('partners.title'),
    profile: t('user.profile'),
    planning: t('planning.title'),
    agencies: t('agencies.title'),
    settings: t('settings.title'),
    hotels: t('hotels.title'),
    'hotel-detail': t('hotels.title'),
    'hotel-new': t('hotels.title'),
    'room-type-detail': t('planning.title'),
    'room-type-new': t('planning.title'),
    'market-detail': t('planning.title'),
    'market-new': t('planning.title'),
    'region-management': t('locations.title'),
    'site-settings': t('siteSettings.title'),
    developers: t('developers.title'),
    bookings: t('booking.bookings'),
    'booking-new': t('booking.newBooking'),
    'booking-detail': t('booking.bookingDetails')
  }
  return titles[routeName] || 'Booking Engine'
}

const getBaseDescription = routeName => {
  if (route.meta?.descriptionKey) {
    return t(route.meta.descriptionKey)
  }
  const descriptions = {
    dashboard: t('dashboard.description'),
    partners: t('partners.description'),
    planning: t('planning.description'),
    agencies: t('agencies.description'),
    settings: t('settings.description'),
    hotels: t('hotels.description'),
    'region-management': t('locations.description'),
    'site-settings': t('siteSettings.description'),
    developers: t('developers.description'),
    bookings: t('booking.bookingsDescription')
  }
  return descriptions[routeName] || ''
}

// Page title - uses custom title from store if set, otherwise base title
const pageTitle = computed(() => {
  // If view set a custom title, use it
  if (uiStore.customPageTitle) {
    return uiStore.customPageTitle
  }

  const baseTitle = getBaseTitle(route.name)

  // If there's a suffix (e.g., hotel name), append it
  if (uiStore.pageTitleSuffix) {
    return `${baseTitle} - ${uiStore.pageTitleSuffix}`
  }

  return baseTitle
})

const pageDescription = computed(() => {
  // If view set a custom description, use it
  if (uiStore.customPageDescription) {
    return uiStore.customPageDescription
  }
  return getBaseDescription(route.name)
})

// Update browser title
watch(
  pageTitle,
  newTitle => {
    document.title = newTitle ? `${newTitle} | Booking Engine` : 'Booking Engine'
  },
  { immediate: true }
)

// Clear custom title on route change
watch(
  () => route.name,
  () => {
    uiStore.clearPageTitle()
  }
)
</script>

<style>
/* Global styles for layout consistency */
.container {
  max-width: 1280px;
}

/* Print Styles */
@media print {
  @page {
    margin: 10mm;
    size: A4;
  }

  html,
  body {
    height: auto !important;
    overflow: visible !important;
    background: white !important;
    font-size: 11px !important;
  }

  /* Force colors to print */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Hide all fixed/sticky elements */
  .fixed,
  .sticky {
    position: static !important;
  }

  /* Ensure content is visible */
  .overflow-hidden,
  .overflow-y-auto {
    overflow: visible !important;
  }

  /* Compact spacing */
  .p-6 {
    padding: 0.75rem !important;
  }
  .p-5 {
    padding: 0.625rem !important;
  }
  .p-4 {
    padding: 0.5rem !important;
  }
  .p-3 {
    padding: 0.375rem !important;
  }
  .py-6 {
    padding-top: 0.5rem !important;
    padding-bottom: 0.5rem !important;
  }
  .py-4 {
    padding-top: 0.375rem !important;
    padding-bottom: 0.375rem !important;
  }
  .px-6 {
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }
  .px-4 {
    padding-left: 0.375rem !important;
    padding-right: 0.375rem !important;
  }
  .mb-6 {
    margin-bottom: 0.5rem !important;
  }
  .mb-4 {
    margin-bottom: 0.375rem !important;
  }
  .mt-6 {
    margin-top: 0.5rem !important;
  }
  .mt-4 {
    margin-top: 0.375rem !important;
  }
  .gap-6 {
    gap: 0.5rem !important;
  }
  .gap-4 {
    gap: 0.375rem !important;
  }
  .space-y-6 > * + * {
    margin-top: 0.5rem !important;
  }
  .space-y-4 > * + * {
    margin-top: 0.375rem !important;
  }

  /* Smaller text */
  .text-2xl {
    font-size: 1.25rem !important;
  }
  .text-xl {
    font-size: 1rem !important;
  }
  .text-lg {
    font-size: 0.875rem !important;
  }

  /* Compact rounded corners */
  .rounded-xl {
    border-radius: 0.5rem !important;
  }
  .rounded-lg {
    border-radius: 0.375rem !important;
  }

  /* Reset dark mode colors for print */
  .dark\:bg-slate-800,
  .dark\:bg-slate-900,
  .dark\:bg-slate-700 {
    background-color: white !important;
  }

  .dark\:text-white,
  .dark\:text-slate-300,
  .dark\:text-slate-400 {
    color: #1f2937 !important;
  }

  .dark\:border-slate-700,
  .dark\:border-slate-600 {
    border-color: #e5e7eb !important;
  }
}
</style>
