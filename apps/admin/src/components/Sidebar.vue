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
      <!-- App Logo - Uses uploaded favicon if available -->
      <div
        class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
      >
        <img :src="siteSettingsStore.faviconUrl" alt="Logo" class="w-10 h-10 object-contain" />
      </div>

      <!-- Current Module Icon (only when expanded) -->
      <span v-if="uiStore.sidebarExpanded" class="ml-3 truncate flex items-center">
        <span
          class="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"
        >
          <span class="material-icons text-white">{{ currentModuleIcon }}</span>
        </span>
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
          <!-- Icon with badge dot (collapsed mode) -->
          <span class="relative flex-shrink-0">
            <span class="material-icons">{{ item.icon }}</span>
            <span
              v-if="item.badge && !uiStore.sidebarExpanded"
              class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 leading-none"
            >
              {{ item.badge > 99 ? '99+' : item.badge }}
            </span>
          </span>

          <!-- Label (only when expanded) -->
          <span v-if="uiStore.sidebarExpanded" class="ml-3 text-sm font-medium truncate flex-1">
            {{ item.label }}
          </span>

          <!-- Badge (expanded mode) -->
          <span
            v-if="item.badge && uiStore.sidebarExpanded"
            class="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none ml-auto flex-shrink-0"
          >
            {{ item.badge > 99 ? '99+' : item.badge }}
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
import { computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { usePartnerStore } from '@/stores/partner'
import { usePmsStore } from '@/stores/pms'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import { useMailboxStore } from '@/stores/mailbox'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUIStore()
const partnerStore = usePartnerStore()
const pmsStore = usePmsStore()
const siteSettingsStore = useSiteSettingsStore()
const mailboxStore = useMailboxStore()
const { t } = useI18n()

// Fetch site settings if not loaded (for favicon)
// Skip if platform admin without a selected partner (endpoint requires partner context)
onMounted(() => {
  const isAdminWithoutPartner = authStore.isPlatformAdmin && !partnerStore.hasSelectedPartner
  if (!siteSettingsStore.loaded && !siteSettingsStore.loading && !isAdminWithoutPartner) {
    siteSettingsStore.fetchSettings()
  }
})

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
    '/admin/mailbox': 'inbox',
    '/agencies': 'groups',
    '/site-management': 'language',
    '/hotels': 'hotel',
    '/planning': 'event_note',
    '/bookings': 'book_online',
    '/tours': 'tour',
    '/profile': 'person',
    '/developers': 'code',
    '/pms-integration': 'link',
    '/pms/dashboard': 'dashboard',
    '/pms/front-desk': 'hotel',
    '/pms/room-plan': 'grid_view',
    '/pms/housekeeping': 'cleaning_services',
    '/pms/reservations': 'book_online',
    '/pms/guests': 'people',
    '/pms/kbs': 'badge',
    '/pms/cashier': 'point_of_sale',
    '/pms/billing': 'receipt_long',
    '/pms/night-audit': 'nightlight',
    '/pms/reports': 'assessment',
    '/pms/settings': 'settings',
    '/pms/channel-manager': 'swap_horiz',
    '/pms/users': 'manage_accounts',
    '/my-subscription': 'card_membership',
    '/issues': 'bug_report',
    '/payment': 'payments',
    '/admin/migration': 'swap_horiz',
    '/admin/reservations': 'book_online',
    '/my-membership': 'card_membership'
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

// Check if current route is a PMS route
const isPmsView = computed(() => route.path.startsWith('/pms/'))

// Main section - always visible
const mainSection = computed(() => {
  const items = []

  // PMS View Mode - show PMS navigation
  if (isPmsView.value) {
    items.push({
      name: 'pms-dashboard',
      to: '/pms/dashboard',
      icon: 'dashboard',
      label: t('pms.nav.dashboard')
    })
    items.push({
      name: 'pms-front-desk',
      to: '/pms/front-desk',
      icon: 'hotel',
      label: t('pms.nav.frontDesk')
    })
    items.push({
      name: 'pms-room-plan',
      to: '/pms/room-plan',
      icon: 'grid_view',
      label: t('pms.nav.roomPlan')
    })
    items.push({
      name: 'pms-reservations',
      to: '/pms/reservations',
      icon: 'book_online',
      label: t('pms.nav.reservations')
    })
    items.push({
      name: 'pms-housekeeping',
      to: '/pms/housekeeping',
      icon: 'cleaning_services',
      label: t('pms.nav.housekeeping')
    })
    items.push({
      name: 'pms-guests',
      to: '/pms/guests',
      icon: 'people',
      label: t('pms.nav.guests')
    })
    items.push({
      name: 'pms-cashier',
      to: '/pms/cashier',
      icon: 'point_of_sale',
      label: t('pms.nav.cashier')
    })
    items.push({
      name: 'pms-billing',
      to: '/pms/billing',
      icon: 'receipt_long',
      label: t('pms.nav.billing')
    })
    items.push({ name: 'pms-kbs', to: '/pms/kbs', icon: 'badge', label: t('pms.nav.kbs') })
    items.push({
      name: 'pms-night-audit',
      to: '/pms/night-audit',
      icon: 'nightlight',
      label: t('pms.nav.nightAudit')
    })
    items.push({
      name: 'pms-reports',
      to: '/pms/reports',
      icon: 'assessment',
      label: t('pms.nav.reports')
    })
    items.push({
      name: 'pms-users',
      to: '/pms/users',
      icon: 'manage_accounts',
      label: t('pms.nav.users')
    })
    items.push({
      name: 'pms-channel-manager',
      to: '/pms/channel-manager',
      icon: 'swap_horiz',
      label: t('pms.nav.channelManager')
    })
    items.push({
      name: 'pms-settings',
      to: '/pms/settings',
      icon: 'settings',
      label: t('pms.nav.settings')
    })
    return items
  }

  // Dashboard is always visible if user has permission
  if (hasPermission('dashboard')) {
    items.push({
      name: 'dashboard',
      to: '/dashboard',
      icon: 'dashboard',
      label: t('nav.dashboard')
    })
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
    items.push({
      name: 'platform-reservations',
      to: '/admin/reservations',
      icon: 'book_online',
      label: t('nav.platformReservations')
    })
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
      name: 'mailbox',
      to: '/admin/mailbox',
      icon: 'inbox',
      label: t('nav.mailbox'),
      badge: mailboxStore.unreadCount
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
    items.push({
      name: 'migration',
      to: '/admin/migration',
      icon: 'swap_horiz',
      label: t('migration.title')
    })
    items.push({
      name: 'tursab-directory',
      to: '/admin/tursab-directory',
      icon: 'menu_book',
      label: t('tursab.title')
    })
  }

  // Partner menu items (visible when in partner view, filtered by permissions)
  // Order: Dashboard (above), Rezervasyonlar, Oteller, Planlama, Turlar, Site Yönetimi, then rest
  if (isPartnerView) {
    // 1. Rezervasyonlar
    if (hasPermission('booking')) {
      items.push({
        name: 'bookings',
        to: '/bookings',
        icon: 'book_online',
        label: t('nav.bookings')
      })
    }
    // 2. Oteller
    if (hasPermission('hotels')) {
      items.push({ name: 'hotels', to: '/hotels', icon: 'hotel', label: t('nav.hotels') })
    }
    // 3. Planlama
    if (hasPermission('planning')) {
      items.push({
        name: 'planning',
        to: '/planning',
        icon: 'event_note',
        label: t('nav.planning')
      })
    }
    // 4. Turlar & Aktiviteler
    if (hasPermission('tours') || hasPermission('booking')) {
      items.push({ name: 'tours', to: '/tours', icon: 'tour', label: t('nav.tours') })
    }
    // 5. Site Yönetimi
    if (hasPermission('settings')) {
      items.push({
        name: 'site-management',
        to: '/site-management/settings',
        icon: 'language',
        label: t('nav.siteManagement')
      })
    }

    // --- Rest of the items ---
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
    }
    if (hasPermission('pms')) {
      items.push({ name: 'pms', to: '/pms/dashboard', icon: 'apartment', label: 'PMS' })
    }
    if (hasPermission('settings')) {
      items.push({
        name: 'developers',
        to: '/developers',
        icon: 'code',
        label: t('nav.developers')
      })
    }

    // Only real partner users can see their own subscription/membership
    if (authStore.accountType === 'partner') {
      items.push({
        name: 'my-membership',
        to: '/my-membership',
        icon: 'card_membership',
        label: t('membership.myMembership.title')
      })
      items.push({
        name: 'my-subscription',
        to: '/my-subscription',
        icon: 'receipt_long',
        label: t('nav.mySubscription')
      })
    }
  }

  return items
})

const bottomNavItems = computed(() => {
  const items = []

  // Show "Back to Panel" when in PMS view
  if (isPmsView.value) {
    items.push({
      name: 'back-to-panel',
      icon: 'arrow_back',
      label: t('pms.backToPanel'),
      action: () => {
        pmsStore.exitPmsMode()
        router.push('/dashboard')
      }
    })
  }

  items.push({
    name: 'profile',
    icon: 'person',
    label: t('nav.profile'),
    action: () => {
      router.push('/profile')
    }
  })

  items.push({
    name: 'logout',
    icon: 'logout',
    label: t('auth.logout'),
    action: () => {
      authStore.logout()
    }
  })

  return items
})
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
