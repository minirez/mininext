<template>
  <div class="flex h-screen overflow-hidden bg-gray-100 dark:bg-slate-900">
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
        v-if="uiStore.isMobile && uiStore.sidebarOpen"
        class="fixed inset-0 bg-black/50 z-40"
        @click="uiStore.closeSidebar"
      ></div>
    </Transition>

    <!-- Sidebar -->
    <Transition
      enter-active-class="transition-transform ease-out duration-300"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform ease-in duration-200"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <Sidebar
        v-show="!uiStore.isMobile || uiStore.sidebarOpen"
        :class="[
          uiStore.isMobile ? 'fixed left-0 top-0 z-50 h-full' : ''
        ]"
        @navigate="handleNavigate"
      />
    </Transition>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <Header
        :page-title="pageTitle"
        :page-description="pageDescription"
      >
        <template #actions>
          <slot name="headerActions"></slot>
        </template>
      </Header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto bg-gray-100 dark:bg-slate-900">
        <div class="px-4 md:px-6 py-4 md:py-8">
          <router-view v-slot="{ Component }">
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 transform translate-y-4"
              enter-to-class="opacity-100 transform translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 transform translate-y-0"
              leave-to-class="opacity-0 transform -translate-y-4"
              mode="out-in"
            >
              <component :is="Component" />
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
import { useUIStore } from '@/stores/ui'

const route = useRoute()
const uiStore = useUIStore()
const { t } = useI18n()

// Initialize UI store on mount
onMounted(() => {
  uiStore.initializeUI()
})

onUnmounted(() => {
  uiStore.cleanupUI()
})

// Close sidebar on route change (mobile only)
watch(() => route.path, () => {
  if (uiStore.isMobile) {
    uiStore.closeSidebar()
  }
})

// Handle navigation from sidebar
const handleNavigate = () => {
  if (uiStore.isMobile) {
    uiStore.closeSidebar()
  }
}

// Base titles by route name
const getBaseTitle = (routeName) => {
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
    'site-settings': t('siteSettings.title')
  }
  return titles[routeName] || 'Booking Engine'
}

const getBaseDescription = (routeName) => {
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
    'site-settings': t('siteSettings.description')
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
watch(pageTitle, (newTitle) => {
  document.title = newTitle ? `${newTitle} | Booking Engine` : 'Booking Engine'
}, { immediate: true })

// Clear custom title on route change
watch(() => route.name, () => {
  uiStore.clearPageTitle()
})
</script>

<style>
/* Global styles for layout consistency */
.container {
  max-width: 1280px;
}
</style>
