<template>
  <header
    class="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700"
  >
    <div class="px-3 md:px-6 py-3 md:py-4 flex justify-between items-center">
      <!-- Left side: Hamburger + Title -->
      <div class="flex items-center gap-3">
        <!-- Hamburger Menu (Mobile Only) -->
        <button
          v-if="uiStore.isMobile"
          class="p-2 text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          @click="uiStore.toggleSidebar"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              v-if="!uiStore.sidebarOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Page Title and Description -->
        <div>
          <h1 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">
            {{ displayTitle }}
          </h1>
          <p
            v-if="displayDescription && !uiStore.isMobile"
            class="text-sm text-gray-500 dark:text-slate-400 mt-1"
          >
            {{ displayDescription }}
          </p>
        </div>
      </div>

      <!-- Right side: Hotel Selector, Partner Selector, User menu -->
      <div class="flex items-center gap-2">
        <!-- PMS Hotel Selector (only on PMS routes) -->
        <div v-if="isPmsRoute" class="w-48 md:w-56">
          <PmsHotelSelector />
        </div>

        <!-- Hotel Selector (only on planning routes) -->
        <div v-else-if="showHotelSelector" class="w-48 md:w-56">
          <HotelSelector
            :model-value="hotelStore.selectedHotel"
            @update:model-value="hotelStore.setHotel"
          />
        </div>

        <!-- PMS / BE Mode Toggle -->
        <button
          v-if="isPmsRoute"
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          :title="$t('pms.backToPanel')"
          @click="switchToPanel"
        >
          <span class="material-icons text-lg">dashboard</span>
          <span v-if="!uiStore.isMobile">MaxiRez</span>
        </button>
        <button
          v-else-if="showPmsLink"
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
          :title="'PMS'"
          @click="switchToPms"
        >
          <span class="material-icons text-lg">apartment</span>
          <span v-if="!uiStore.isMobile">PMS</span>
        </button>

        <!-- Partner Selector (Platform Admin Only) -->
        <PartnerSelector />

        <!-- Theme Selector -->
        <ThemeSelector />

        <!-- Notification Bell -->
        <NotificationBell />

        <!-- User Dropdown -->
        <div
          ref="userDropdownRef"
          class="relative border-l border-gray-200 dark:border-slate-700 pl-3"
        >
          <button
            class="flex items-center gap-2 p-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            @click="toggleUserDropdown"
          >
            <!-- User Avatar -->
            <div v-if="userAvatarUrl" class="w-8 h-8 rounded-full overflow-hidden">
              <img
                :src="userAvatarUrl"
                :alt="authStore.user?.name"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium"
            >
              {{ getInitials(authStore.user?.name) }}
            </div>
            <!-- User Name (Desktop) -->
            <div v-if="!uiStore.isMobile" class="text-left">
              <p class="text-sm font-medium text-gray-800 dark:text-white">
                {{ authStore.user?.name || 'User' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">{{ getRoleName() }}</p>
            </div>
            <!-- Dropdown Arrow -->
            <svg
              class="w-4 h-4 transition-transform"
              :class="{ 'rotate-180': userDropdownOpen }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div
              v-if="userDropdownOpen"
              class="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50"
            >
              <!-- User Info -->
              <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                <p class="text-sm font-medium text-gray-800 dark:text-white">
                  {{ authStore.user?.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">{{ authStore.user?.email }}</p>
              </div>

              <!-- Menu Items -->
              <div class="py-1">
                <!-- Profile -->
                <button
                  class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3"
                  @click="goToProfile"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {{ $t('user.profile') }}
                </button>

                <!-- Language Selector -->
                <div class="px-4 py-2">
                  <label
                    class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 block"
                    >{{ $t('user.language') }}</label
                  >
                  <div class="flex gap-2">
                    <button
                      v-for="lang in languages"
                      :key="lang.code"
                      class="flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors"
                      :class="
                        currentLocale === lang.code
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      "
                      @click="changeLanguage(lang.code)"
                    >
                      {{ lang.name }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Logout -->
              <div class="py-1 border-t border-gray-200 dark:border-slate-700">
                <button
                  class="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                  @click="handleLogout"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  {{ $t('auth.logout') }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/plugins/i18n'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useHotelStore } from '@/stores/hotel'
import { usePmsStore } from '@/stores/pms'
import { usePartnerStore } from '@/stores/partner'
import PartnerSelector from '@/components/common/PartnerSelector.vue'
import HotelSelector from '@/components/common/HotelSelector.vue'
import PmsHotelSelector from '@/components/pms/PmsHotelSelector.vue'
import NotificationBell from '@/components/common/NotificationBell.vue'
import ThemeSelector from '@/components/common/ThemeSelector.vue'
import { getAvatarUrl } from '@/utils/imageUrl'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()

// Language settings
const languages = [
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Türkçe' }
]

const currentLocale = computed(() => locale.value)

const changeLanguage = async lang => {
  await setLocale(lang)
}

// Props
const props = defineProps({
  pageTitle: {
    type: String,
    default: 'Booking Engine'
  },
  pageDescription: {
    type: String,
    default: ''
  }
})

const authStore = useAuthStore()
const uiStore = useUIStore()
const hotelStore = useHotelStore()
const pmsStore = usePmsStore()
const partnerStore = usePartnerStore()

// User avatar URL using shared utility
const userAvatarUrl = computed(() => getAvatarUrl(authStore.user))

// PMS route detection
const isPmsRoute = computed(() => route.path.startsWith('/pms/'))

// Show PMS link for partner users with PMS permission (when not already in PMS mode)
const showPmsLink = computed(() => {
  if (isPmsRoute.value) return false
  const user = authStore.user
  if (!user) return false
  // Platform admins: PMS link only when a partner is selected (PMS requires partner context)
  if (authStore.isPlatformAdmin) return partnerStore.hasSelectedPartner
  // Partner users with PMS permission
  if (user.accountType === 'partner') {
    const permissions = user.permissions || []
    const pmsPerm = permissions.find(p => p.module === 'pms')
    return pmsPerm?.actions?.view === true || user.role === 'admin' || user.pmsRole
  }
  return false
})

// Switch to PMS mode
const switchToPms = () => {
  pmsStore.enterPmsMode()
  // Only copy from hotelStore if PMS doesn't already have a hotel
  if (!pmsStore.selectedPmsHotel && hotelStore.selectedHotel) {
    pmsStore.setHotel(hotelStore.selectedHotel)
  }
  router.push('/pms/dashboard')
}

// Switch back to panel
const switchToPanel = () => {
  pmsStore.exitPmsMode()
  router.push('/dashboard')
}

// Routes that need hotel selector
const hotelRequiredRoutes = [
  'planning-settings',
  'planning-rooms',
  'planning-markets',
  'planning-campaigns',
  'planning-pricing',
  'room-type-new',
  'room-type-detail',
  'market-new',
  'market-detail'
]
const showHotelSelector = computed(() => {
  // Check by route name
  if (hotelRequiredRoutes.includes(route.name)) return true
  // Also check by path for planning module
  if (route.path.startsWith('/planning')) return true
  return false
})

// Check if current route is Planning
const isPlanningRoute = computed(() => {
  return route.path.startsWith('/planning')
})

// Get hotel name
const selectedHotelName = computed(() => {
  const hotel = hotelStore.selectedHotel
  if (!hotel) return ''
  return hotel.name?.tr || hotel.name?.en || hotel.name || ''
})

// Planning route titles
const planningTitles = computed(() => ({
  'planning-settings': t('planning.tabs.settings'),
  'planning-rooms': t('planning.tabs.rooms'),
  'planning-markets': t('planning.tabs.markets'),
  'planning-campaigns': t('planning.tabs.campaigns'),
  'planning-pricing': t('planning.tabs.pricing'),
  'room-type-new': t('planning.roomTypes.newRoomType'),
  'room-type-detail': t('planning.roomTypes.editRoomType'),
  'market-new': t('planning.markets.newMarket'),
  'market-detail': t('planning.markets.editMarket')
}))

// PMS route titles
const pmsTitles = computed(() => ({
  'pms-dashboard': t('pms.nav.dashboard'),
  'pms-front-desk': t('pms.nav.frontDesk'),
  'pms-room-plan': t('pms.nav.roomPlan'),
  'pms-reservations': t('pms.nav.reservations'),
  'pms-housekeeping': t('pms.nav.housekeeping'),
  'pms-housekeeping-mobile': t('pms.nav.housekeeping'),
  'pms-guests': t('pms.nav.guests'),
  'pms-guest-detail': t('pms.nav.guests'),
  'pms-kbs': t('pms.nav.kbs'),
  'pms-cashier': t('pms.nav.cashier'),
  'pms-billing': t('pms.nav.billing'),
  'pms-night-audit': t('pms.nav.nightAudit'),
  'pms-reports': t('pms.nav.reports'),
  'pms-settings': t('pms.nav.settings'),
  'pms-users': t('pms.nav.users')
}))

// Dynamic title based on route
const displayTitle = computed(() => {
  if (isPmsRoute.value) {
    return pmsTitles.value[route.name] || 'PMS'
  }
  if (isPlanningRoute.value) {
    return planningTitles.value[route.name] || t('planning.title')
  }
  return props.pageTitle
})

// Dynamic description based on route
const displayDescription = computed(() => {
  if (isPmsRoute.value && pmsStore.hotelName) {
    return pmsStore.hotelName
  }
  if (isPlanningRoute.value && selectedHotelName.value) {
    return selectedHotelName.value
  }
  return props.pageDescription
})

// User dropdown
const userDropdownRef = ref(null)
const userDropdownOpen = ref(false)

const toggleUserDropdown = () => {
  userDropdownOpen.value = !userDropdownOpen.value
}

const getInitials = name => {
  if (!name) return 'U'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const getRoleName = () => {
  const role = authStore.user?.role
  const roleNames = {
    platformAdmin: t('user.roles.platformAdmin'),
    partnerAdmin: t('user.roles.partnerAdmin'),
    agencyAdmin: t('user.roles.agencyAdmin'),
    agencyUser: t('user.roles.agencyUser')
  }
  return roleNames[role] || role
}

const goToProfile = () => {
  userDropdownOpen.value = false
  router.push('/profile')
}

const handleLogout = async () => {
  userDropdownOpen.value = false
  await authStore.logout()
  router.push('/login')
}

// Click outside handler
const handleClickOutside = event => {
  if (userDropdownRef.value && !userDropdownRef.value.contains(event.target)) {
    userDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
