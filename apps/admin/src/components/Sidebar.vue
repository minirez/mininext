<template>
  <aside
    class="bg-white dark:bg-slate-800 flex flex-col py-6 border-r border-gray-200 dark:border-slate-700 h-screen overflow-y-auto overflow-x-hidden transition-all duration-300"
    :class="uiStore.sidebarExpanded ? 'w-56' : 'w-20'"
  >
    <!-- Logo / Module Icon Section -->
    <div
      class="flex items-center px-4 mb-6"
      :class="uiStore.sidebarExpanded ? 'justify-between' : 'justify-center'"
    >
      <!-- Dynamic Module Icon -->
      <div
        class="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"
      >
        <span class="material-icons text-white">{{ currentModuleIcon }}</span>
      </div>

      <!-- App Name (only when expanded) -->
      <span
        v-if="uiStore.sidebarExpanded"
        class="text-lg font-semibold text-gray-800 dark:text-white ml-3 truncate"
      >
        Booking
      </span>
    </div>

    <!-- Main Navigation -->
    <nav class="flex flex-col flex-1 px-3">
      <!-- Main Section -->
      <div class="flex flex-col space-y-1 mb-4">
        <span
          class="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2"
          :class="uiStore.sidebarExpanded ? 'px-3' : 'text-center'"
        >
          {{ $t('nav.main') }}
        </span>

        <RouterLink
          v-for="item in mainSection"
          :key="item.name"
          :to="item.to"
          class="flex items-center rounded-lg transition-colors duration-200 cursor-pointer group relative"
          :class="[
            uiStore.sidebarExpanded ? 'px-3 py-2.5' : 'p-3 justify-center',
            {
              'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30': isActive(
                item.to
              ),
              'text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30':
                !isActive(item.to)
            }
          ]"
          :title="!uiStore.sidebarExpanded ? item.label : ''"
          @click="emit('navigate')"
        >
          <span class="material-icons flex-shrink-0">{{ item.icon }}</span>

          <!-- Label (only when expanded) -->
          <span v-if="uiStore.sidebarExpanded" class="ml-3 text-sm font-medium truncate">
            {{ item.label }}
          </span>

          <!-- Tooltip (only when collapsed) -->
          <span
            v-if="!uiStore.sidebarExpanded"
            class="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity"
          >
            {{ item.label }}
          </span>
        </RouterLink>
      </div>
    </nav>

    <!-- Bottom Navigation -->
    <div
      class="flex flex-col space-y-1 mt-auto pt-4 px-3 border-t border-gray-200 dark:border-slate-700"
    >
      <!-- Toggle Sidebar Button -->
      <button
        class="flex items-center rounded-lg transition-colors duration-200 cursor-pointer text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30"
        :class="uiStore.sidebarExpanded ? 'px-3 py-2.5' : 'p-3 justify-center'"
        :title="uiStore.sidebarExpanded ? $t('nav.collapseSidebar') : $t('nav.expandSidebar')"
        @click="uiStore.toggleSidebarExpanded"
      >
        <span
          class="material-icons flex-shrink-0 transition-transform"
          :class="{ 'rotate-180': uiStore.sidebarExpanded }"
        >
          chevron_right
        </span>
        <span v-if="uiStore.sidebarExpanded" class="ml-3 text-sm font-medium truncate">
          {{ $t('nav.collapseSidebar') }}
        </span>
      </button>

      <!-- Other Bottom Nav Items -->
      <button
        v-for="item in bottomNavItems"
        :key="item.name"
        class="flex items-center rounded-lg transition-colors duration-200 cursor-pointer text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 group relative"
        :class="uiStore.sidebarExpanded ? 'px-3 py-2.5' : 'p-3 justify-center'"
        :title="!uiStore.sidebarExpanded ? item.label : ''"
        @click="handleBottomNav(item)"
      >
        <span class="material-icons flex-shrink-0">{{ item.icon }}</span>

        <!-- Label (only when expanded) -->
        <span v-if="uiStore.sidebarExpanded" class="ml-3 text-sm font-medium truncate">
          {{ item.label }}
        </span>

        <!-- Tooltip (only when collapsed) -->
        <span
          v-if="!uiStore.sidebarExpanded"
          class="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity"
        >
          {{ item.label }}
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { usePartnerStore } from '@/stores/partner'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUIStore()
const partnerStore = usePartnerStore()
const { t } = useI18n()

// Emit
const emit = defineEmits(['navigate'])

// Check if a route is active
const isActive = path => {
  return route.path === path || route.path.startsWith(path + '/')
}

// Get current module icon based on route
const currentModuleIcon = computed(() => {
  const routeIconMap = {
    '/dashboard': 'dashboard',
    '/partners': 'business',
    '/admin/regions': 'map',
    '/admin/hotel-base': 'domain',
    '/admin/audit-logs': 'history',
    '/admin/platform-settings': 'settings',
    '/admin/email-logs': 'mail',
    '/agencies': 'groups',
    '/site-management': 'language',
    '/hotels': 'hotel',
    '/planning': 'event_note',
    '/bookings': 'book_online',
    '/tours': 'tour',
    '/profile': 'person',
    '/developers': 'code',
    '/pms-integration': 'link',
    '/my-subscription': 'card_membership',
    '/issues': 'bug_report',
    '/payment': 'payments'
  }

  // Find matching route
  for (const [path, icon] of Object.entries(routeIconMap)) {
    if (route.path === path || route.path.startsWith(path + '/')) {
      return icon
    }
  }

  // Default icon
  return 'dashboard'
})

// Handle bottom nav button click
const handleBottomNav = item => {
  item.action()
  emit('navigate')
}

// Check if user has permission for a module
const hasPermission = module => {
  // Platform admins and admin role users have all permissions
  if (authStore.isPlatformAdmin || authStore.user?.role === 'admin') {
    return true
  }

  // Check user's permissions array
  const permissions = authStore.user?.permissions || []
  const permission = permissions.find(p => p.module === module)
  return permission?.actions?.view === true
}

// Main section - always visible
const mainSection = computed(() => {
  const items = []

  // Dashboard is always visible if user has permission
  if (hasPermission('dashboard')) {
    items.push({ name: 'dashboard', to: '/dashboard', icon: 'dashboard', label: t('nav.dashboard') })
  }

  // Determine effective view mode:
  // - Platform admin with no partner selected -> Admin view
  // - Platform admin with partner selected -> Partner view (as if logged in as that partner)
  // - Platform user (non-admin) -> Partner view (permission-based)
  // - Partner user -> Partner view
  const isAdminView = authStore.isPlatformAdmin && !partnerStore.hasSelectedPartner
  const isPartnerView =
    authStore.accountType === 'partner' ||
    (authStore.isPlatformAdmin && partnerStore.hasSelectedPartner) ||
    (authStore.accountType === 'platform' && !authStore.isPlatformAdmin) // Non-admin platform users

  // Admin-only menu items (visible only when in admin view)
  if (isAdminView) {
    items.push({ name: 'partners', to: '/partners', icon: 'business', label: t('nav.partners') })
    items.push({ name: 'users', to: '/users', icon: 'people', label: t('nav.users') })
    items.push({
      name: 'region-management',
      to: '/admin/regions',
      icon: 'map',
      label: t('nav.regionManagement')
    })
    items.push({
      name: 'hotel-base',
      to: '/admin/hotel-base',
      icon: 'domain',
      label: t('nav.hotelBase')
    })
    items.push({
      name: 'audit-logs',
      to: '/admin/audit-logs',
      icon: 'history',
      label: t('nav.auditLogs')
    })
    items.push({
      name: 'platform-settings',
      to: '/admin/platform-settings',
      icon: 'settings',
      label: t('nav.platformSettings')
    })
    items.push({
      name: 'email-logs',
      to: '/admin/email-logs',
      icon: 'mail',
      label: t('nav.emailLogs')
    })
    items.push({
      name: 'issues',
      to: '/issues',
      icon: 'bug_report',
      label: t('nav.issues')
    })
    items.push({
      name: 'payment',
      to: '/payment',
      icon: 'payments',
      label: t('nav.payment')
    })
  }

  // Partner menu items (visible when in partner view, filtered by permissions)
  if (isPartnerView) {
    // Payment - tüm partnerlar için
    items.push({
      name: 'payment',
      to: '/payment',
      icon: 'payments',
      label: t('nav.payment')
    })
    if (hasPermission('agencies')) {
      items.push({ name: 'agencies', to: '/agencies', icon: 'groups', label: t('nav.agencies') })
    }
    if (hasPermission('settings')) {
      items.push({ name: 'users', to: '/users', icon: 'people', label: t('nav.users') })
      items.push({
        name: 'site-management',
        to: '/site-management/settings',
        icon: 'language',
        label: t('nav.siteManagement')
      })
    }
    if (hasPermission('hotels')) {
      items.push({ name: 'hotels', to: '/hotels', icon: 'hotel', label: t('nav.hotels') })
    }
    if (hasPermission('planning')) {
      items.push({ name: 'planning', to: '/planning', icon: 'event_note', label: t('nav.planning') })
    }
    if (hasPermission('booking')) {
      items.push({ name: 'bookings', to: '/bookings', icon: 'book_online', label: t('nav.bookings') })
    }
    if (hasPermission('tours') || hasPermission('booking')) {
      items.push({ name: 'tours', to: '/tours', icon: 'tour', label: t('nav.tours') })
    }
    if (hasPermission('pms')) {
      items.push({ name: 'pms-integration', to: '/pms-integration', icon: 'link', label: 'PMS' })
    }
    if (hasPermission('settings')) {
      items.push({ name: 'developers', to: '/developers', icon: 'code', label: t('nav.developers') })
    }

    // Only real partner users can see their own subscription
    if (authStore.accountType === 'partner') {
      items.push({
        name: 'my-subscription',
        to: '/my-subscription',
        icon: 'card_membership',
        label: t('nav.mySubscription')
      })
    }
  }

  return items
})

const bottomNavItems = computed(() => [
  {
    name: 'profile',
    icon: 'person',
    label: t('nav.profile'),
    action: () => {
      router.push('/profile')
    }
  },
  {
    name: 'logout',
    icon: 'logout',
    label: t('auth.logout'),
    action: () => {
      authStore.logout()
    }
  }
])
</script>

<style scoped>
/* Scrollbar styling for sidebar */
aside::-webkit-scrollbar {
  width: 4px;
}

aside::-webkit-scrollbar-track {
  background: transparent;
}

aside::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.dark aside::-webkit-scrollbar-thumb {
  background: #475569;
}
</style>
