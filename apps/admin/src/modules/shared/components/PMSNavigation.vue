<template>
  <nav class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 md:px-6">
    <div class="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.to"
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
        :class="isActive(item.to)
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
          : 'text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-700'"
      >
        <span class="material-icons text-lg">{{ item.icon }}</span>
        <span class="hidden sm:inline">{{ item.label }}</span>
      </RouterLink>

      <!-- Quick Actions -->
      <div class="ml-auto flex items-center gap-2">
        <!-- Quick Check-in -->
        <button
          v-if="showQuickCheckin"
          @click="$emit('quick-checkin')"
          class="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span class="material-icons text-lg">login</span>
          <span class="hidden md:inline">{{ $t('pms.nav.quickCheckin') }}</span>
        </button>

        <!-- Quick Walk-in -->
        <button
          v-if="showQuickWalkin"
          @click="$emit('quick-walkin')"
          class="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span class="material-icons text-lg">person_add</span>
          <span class="hidden md:inline">{{ $t('pms.nav.quickWalkin') }}</span>
        </button>

        <!-- New Reservation -->
        <button
          v-if="showNewReservation"
          @click="$emit('new-reservation')"
          class="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span class="material-icons text-lg">add</span>
          <span class="hidden md:inline">{{ $t('pms.nav.newReservation') }}</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePmsAuthStore } from '@/stores/pms/pmsAuth'
import { usePmsContextInjection } from '@/composables/usePmsContext'

const { t } = useI18n()
const route = useRoute()
const pmsAuthStore = usePmsAuthStore()
const { isPmsUser } = usePmsContextInjection()

defineEmits(['quick-checkin', 'quick-walkin', 'new-reservation'])

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

// Permission check helper - Partner users have full access
const hasAccess = (permissions) => {
  if (!isPmsUser.value) return true // Partner has full access
  return pmsAuthStore.hasAnyPermission(permissions)
}

// All navigation items with permission requirements
const allNavItems = computed(() => [
  { name: 'dashboard', to: '/pms/dashboard', icon: 'dashboard', label: t('pms.nav.dashboard'), permissions: ['dashboard.view'] },
  { name: 'room-plan', to: '/pms/room-plan', icon: 'calendar_view_week', label: t('pms.nav.roomPlan'), permissions: ['reservations.view', 'frontdesk.roomMove'] },
  { name: 'reservations', to: '/pms/reservations', icon: 'event_note', label: t('pms.nav.reservations'), permissions: ['reservations.view'] },
  { name: 'front-desk', to: '/pms/front-desk', icon: 'meeting_room', label: t('pms.nav.frontDesk'), permissions: ['frontdesk.checkin', 'frontdesk.checkout', 'frontdesk.walkin'] },
  { name: 'housekeeping', to: '/pms/housekeeping', icon: 'cleaning_services', label: t('pms.nav.housekeeping'), permissions: ['housekeeping.view'] },
  { name: 'guests', to: '/pms/guests', icon: 'people', label: t('pms.nav.guests'), permissions: ['guests.view'] },
  { name: 'cashier', to: '/pms/cashier', icon: 'point_of_sale', label: t('pms.nav.cashier'), permissions: ['billing.view', 'billing.payment'] },
  { name: 'billing', to: '/pms/billing', icon: 'receipt_long', label: t('pms.nav.billing'), permissions: ['billing.view', 'billing.invoice'] },
  { name: 'reports', to: '/pms/reports', icon: 'assessment', label: t('pms.nav.reports'), permissions: ['reports.operational', 'reports.financial'] },
  { name: 'kbs', to: '/pms/kbs', icon: 'verified_user', label: t('pms.nav.kbs'), permissions: ['guests.view'] },
  { name: 'night-audit', to: '/pms/night-audit', icon: 'nightlight', label: t('pms.nav.nightAudit'), permissions: ['reports.operational', 'reports.financial'] },
  { name: 'users', to: '/pms/users', icon: 'manage_accounts', label: t('pms.nav.users'), partnerOnly: true },
  { name: 'settings', to: '/pms/settings', icon: 'settings', label: t('pms.nav.settings'), partnerOnly: true }
])

// Filter nav items based on user's permissions
const navItems = computed(() => {
  return allNavItems.value.filter(item => {
    // Partner-only items
    if (item.partnerOnly) {
      return !isPmsUser.value
    }
    // Check permissions
    return hasAccess(item.permissions || [])
  })
})

// Show quick action buttons only if user has relevant permissions
const showQuickCheckin = computed(() => hasAccess(['frontdesk.checkin']))
const showQuickWalkin = computed(() => hasAccess(['frontdesk.walkin']))
const showNewReservation = computed(() => hasAccess(['reservations.create']))
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
