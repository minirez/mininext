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
        <!-- Hotel Selector (only on routes that need it) -->
        <div v-if="showHotelSelector" class="w-48 md:w-56">
          <HotelSelector
            :model-value="hotelStore.selectedHotel"
            @update:model-value="hotelStore.setHotel"
          />
        </div>

        <!-- Partner Selector (Platform Admin Only) -->
        <PartnerSelector />

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
            <div
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

                <!-- Dark Mode Toggle -->
                <button
                  class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-between"
                  @click="uiStore.toggleDarkMode"
                >
                  <span class="flex items-center gap-3">
                    <svg
                      v-if="uiStore.darkMode"
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                    {{ uiStore.darkMode ? $t('common.lightMode') : $t('common.darkMode') }}
                  </span>
                  <span class="text-xs text-gray-400">{{ uiStore.darkMode ? '☀️' : '🌙' }}</span>
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
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useHotelStore } from '@/stores/hotel'
import PartnerSelector from '@/components/common/PartnerSelector.vue'
import HotelSelector from '@/components/common/HotelSelector.vue'
import NotificationBell from '@/components/common/NotificationBell.vue'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()

// Language settings
const languages = [
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Türkçe' }
]

const currentLocale = computed(() => locale.value)

const changeLanguage = lang => {
  locale.value = lang
  localStorage.setItem('language', lang)
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

// Dynamic title based on route
const displayTitle = computed(() => {
  if (isPlanningRoute.value) {
    return planningTitles.value[route.name] || t('planning.title')
  }
  return props.pageTitle
})

// Dynamic description based on route
const displayDescription = computed(() => {
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
