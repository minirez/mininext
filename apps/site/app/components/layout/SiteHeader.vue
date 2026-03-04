<template>
  <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
    <!-- Main Navigation -->
    <nav
      class="transition-all duration-300"
      :class="[
        isTransparent && !scrolled
          ? 'bg-transparent text-white'
          : 'bg-white/95 backdrop-blur-md text-gray-800 shadow-sm border-b border-gray-100/50'
      ]"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 lg:h-[68px]">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2.5 shrink-0">
            <img
              v-if="partner.logo"
              :src="imageUrl(partner.logo)"
              :alt="partner.partnerName"
              class="max-h-[50px] w-auto"
            />
            <span
              v-else
              class="text-xl font-bold transition-colors"
              :class="isTransparent && !scrolled ? 'text-white drop-shadow-sm' : 'text-gray-900'"
            >
              {{ partner.partnerName }}
            </span>
          </NuxtLink>

          <!-- Desktop Navigation with Mega Menu -->
          <nav class="hidden lg:flex items-center gap-0.5">
            <div
              v-for="tab in navigationTabs"
              :key="tab.link"
              class="relative group"
              @mouseenter="openMegaMenu(tab)"
              @mouseleave="closeMegaMenu"
            >
              <NuxtLink
                :to="tab.link || '#'"
                class="px-3.5 py-2 text-[14px] font-medium rounded-lg transition-colors flex items-center gap-1"
                :class="
                  isTransparent && !scrolled
                    ? 'hover:bg-white/10 text-white/90 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                "
              >
                {{ ml(tab.title) || tab.fallbackLabel }}
                <!-- Dropdown arrow for items with submenu -->
                <svg
                  v-if="tab.megaMenu"
                  class="w-3.5 h-3.5 opacity-50 transition-transform"
                  :class="{ 'rotate-180': activeMegaMenu === tab.link }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </NuxtLink>

              <!-- Mega Menu Dropdown -->
              <Transition name="mega-menu">
                <div
                  v-if="tab.megaMenu && activeMegaMenu === tab.link"
                  class="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-4 px-5 min-w-[280px] z-50"
                >
                  <!-- Destinations mega menu -->
                  <template v-if="tab.megaMenuType === 'destinations'">
                    <p
                      class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1"
                    >
                      {{ $t('sections.popularDestinations') }}
                    </p>
                    <div class="grid gap-0.5">
                      <NuxtLink
                        v-for="dest in megaMenuDestinations"
                        :key="dest.city"
                        :to="`/destinations/${dest.city}`"
                        class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors group/item"
                      >
                        <img
                          v-if="dest.photo?.link"
                          :src="imageUrl(dest.photo)"
                          :alt="dest.city"
                          class="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div
                          v-else
                          class="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center"
                        >
                          <svg
                            class="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                            />
                          </svg>
                        </div>
                        <div>
                          <span
                            class="text-sm font-medium text-gray-800 group-hover/item:text-site-primary transition-colors"
                            >{{ dest.city }}</span
                          >
                          <span v-if="dest.country" class="block text-xs text-gray-400">{{
                            dest.country
                          }}</span>
                        </div>
                      </NuxtLink>
                    </div>
                    <NuxtLink
                      to="/hotels"
                      class="block mt-3 pt-3 border-t border-gray-100 text-center text-sm font-medium text-site-primary hover:text-site-primary-dark transition-colors"
                    >
                      {{ $t('common.viewAll') }} →
                    </NuxtLink>
                  </template>

                  <!-- Generic links mega menu -->
                  <template v-else-if="tab.megaMenuType === 'links' && tab.subItems?.length">
                    <div class="grid gap-0.5">
                      <NuxtLink
                        v-for="sub in tab.subItems"
                        :key="sub.link"
                        :to="sub.link || '#'"
                        class="px-2 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 hover:text-site-primary transition-colors"
                      >
                        {{ ml(sub.title) || sub.fallbackLabel }}
                      </NuxtLink>
                    </div>
                  </template>
                </div>
              </Transition>
            </div>
          </nav>

          <!-- Right side -->
          <div class="hidden lg:flex items-center gap-2">
            <LanguageSwitcher />
            <CurrencySwitcher />

            <!-- Phone (compact) -->
            <a
              v-if="partner.contact?.phone"
              :href="`tel:${partner.contact.phone}`"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
              :class="
                isTransparent && !scrolled
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              "
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
              <span class="hidden xl:inline">{{ partner.contact.phone }}</span>
            </a>

            <!-- Partner Login button -->
            <a
              :href="adminPanelUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              :class="
                isTransparent && !scrolled
                  ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                  : 'bg-site-primary hover:bg-site-primary-dark text-white shadow-sm'
              "
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              {{ $t('common.partnerLogin') }}
            </a>
          </div>

          <!-- Mobile hamburger -->
          <button
            class="lg:hidden p-2 rounded-lg transition-colors"
            :class="isTransparent && !scrolled ? 'hover:bg-white/10' : 'hover:bg-gray-100'"
            @click="ui.toggleMobileMenu()"
            :aria-label="ui.mobileMenuOpen ? $t('common.close') : $t('common.menu')"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                v-if="!ui.mobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile menu -->
    <Transition name="mobile-menu">
      <MobileMenu v-if="ui.mobileMenuOpen" />
    </Transition>
  </header>

  <!-- Spacer to prevent content jump (only on non-transparent pages) -->
  <div v-if="!isTransparent" class="h-16 lg:h-[68px]" />
</template>

<script setup lang="ts">
const partner = usePartnerStore()
const storefront = useStorefrontStore()
const ui = useUiStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()
const route = useRoute()

const { t: $t } = useI18n()

// Mega menu state
const activeMegaMenu = ref<string | null>(null)
let megaMenuTimeout: ReturnType<typeof setTimeout> | null = null

function openMegaMenu(tab: any) {
  if (megaMenuTimeout) clearTimeout(megaMenuTimeout)
  if (tab.megaMenu) {
    activeMegaMenu.value = tab.link
  }
}

function closeMegaMenu() {
  megaMenuTimeout = setTimeout(() => {
    activeMegaMenu.value = null
  }, 150)
}

// Destinations for mega menu
const megaMenuDestinations = computed(() => {
  return storefront.locationSection?.items?.slice(0, 6) || []
})

const navigationTabs = computed(() => {
  if (storefront.header.tabs?.length) {
    return storefront.header.tabs.map((tab: any) => ({
      ...tab,
      megaMenu: tab.subItems?.length > 0,
      megaMenuType: tab.subItems?.length > 0 ? 'links' : null
    }))
  }
  return [
    {
      link: '/hotels',
      fallbackLabel: $t('common.hotels'),
      megaMenu: megaMenuDestinations.value.length > 0,
      megaMenuType: 'destinations'
    },
    { link: '/destinations', fallbackLabel: $t('common.destinations'), megaMenu: false },
    { link: '/page/contact', fallbackLabel: $t('common.contact'), megaMenu: false }
  ]
})

const scrolled = ref(false)
const isTransparent = computed(() => {
  if (storefront.header?.headerType === 'white') return false
  const path = route.path
  return path === '/' || /^\/[a-z]{2}$/.test(path) || path.startsWith('/draftlive')
})

const adminPanelUrl = ref('#')

onMounted(() => {
  // Set admin panel URL client-side to avoid hydration mismatch
  const parts = window.location.hostname.split('.')
  if (parts.length >= 2) {
    adminPanelUrl.value = `https://app.${parts.slice(-2).join('.')}`
  }

  const handleScroll = () => {
    scrolled.value = window.scrollY >= 10
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
})

// Close mobile menu on route change
watch(
  () => route.path,
  () => {
    ui.mobileMenuOpen = false
    activeMegaMenu.value = null
  }
)
</script>

<style scoped>
.mega-menu-enter-active,
.mega-menu-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.mega-menu-enter-from,
.mega-menu-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}
.mega-menu-enter-to,
.mega-menu-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>
