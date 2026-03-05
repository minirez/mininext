<template>
  <header
    class="site-header-root fixed top-0 left-0 right-0 z-[1000] flex items-center transition-all duration-400"
    :class="headerClasses"
    :style="{ height: headerHeight }"
  >
    <div class="w-full" :class="isWhiteHeader ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : 'px-8 sm:px-5'">
      <div class="flex items-center justify-between flex-nowrap">
        <!-- Logo -->
        <div class="flex items-center shrink-0">
          <NuxtLink v-if="partner.logo" to="/" class="mr-5 flex items-center">
            <img
              :src="imageUrl(partner.logo)"
              :alt="partner.partnerName"
              class="max-h-[50px] w-auto md:max-w-[120px]"
            />
          </NuxtLink>
          <span
            v-else-if="partner.partnerName"
            class="text-xl font-bold mr-5"
            :class="textColorClass"
          >
            {{ partner.partnerName }}
          </span>

          <!-- Desktop Navigation -->
          <nav class="hidden xl:block">
            <ul class="flex" :class="textColorClass">
              <li
                v-for="(tab, tabIndex) in headerTabs"
                :key="tabIndex"
                class="relative py-6"
                :class="{ 'current': isTabActive(tab) }"
                @mouseenter="openDropdown(tabIndex)"
                @mouseleave="closeDropdown(tabIndex)"
              >
                <NuxtLink
                  :to="tab.link || '#'"
                  class="flex items-center justify-between text-[15px] font-medium px-2.5 transition-all duration-200"
                  :class="isTabActive(tab) ? 'text-site-primary' : ''"
                >
                  <span class="mr-2.5">{{ ml(tab.title) }}</span>
                  <svg
                    v-if="tab.items?.length"
                    class="w-[7px] h-[7px] opacity-60"
                    fill="currentColor"
                    viewBox="0 0 10 10"
                  >
                    <path d="M5 7L0 2h10z" />
                  </svg>
                </NuxtLink>

                <!-- Mega menu (tabs with subitems) -->
                <div
                  v-if="hasSubItems(tab)"
                  class="absolute top-full left-0 bg-white p-8 rounded text-gray-900 w-[800px] transition-all duration-200"
                  :style="{
                    opacity: openTab === tabIndex ? '1' : '0',
                    pointerEvents: openTab === tabIndex ? 'auto' : 'none',
                    boxShadow: '0 10px 30px rgba(5,16,54,0.03)',
                    zIndex: 9999
                  }"
                >
                  <div class="flex gap-x-10 gap-y-2.5 pb-8 flex-wrap">
                    <button
                      v-for="(item, itemIndex) in tab.items"
                      :key="itemIndex"
                      class="text-gray-500 font-medium text-[15px] pb-1 border-b-2 transition-colors"
                      :class="getActiveNested(tabIndex) === itemIndex
                        ? 'border-site-primary text-gray-900'
                        : 'border-transparent hover:text-gray-700'"
                      @click="setActiveNested(tabIndex, itemIndex)"
                      @dblclick="item.link && navigateTo(item.link)"
                    >
                      {{ ml(item.title) }}
                    </button>
                  </div>

                  <div v-if="tab.items?.[getActiveNested(tabIndex)]">
                    <ul class="flex justify-between">
                      <li class="flex-1">
                        <div>
                          <div class="text-[15px] font-medium">
                            {{ ml(tab.items[getActiveNested(tabIndex)].title) }}
                          </div>
                          <div class="space-y-1.5 text-[15px] pt-1.5">
                            <div
                              v-for="(subItem, subIndex) in tab.items[getActiveNested(tabIndex)].subItems || []"
                              :key="subIndex"
                              :class="isLinkActive(subItem.link) ? 'text-site-primary' : ''"
                            >
                              <NuxtLink
                                :to="subItem.link || '#'"
                                class="font-normal hover:text-site-primary transition-colors"
                              >
                                {{ ml(subItem.title) }}
                              </NuxtLink>
                            </div>
                          </div>
                        </div>
                      </li>
                      <li class="relative w-[270px] shrink-0 flex">
                        <img
                          v-if="tab.photo?.link"
                          :src="imageUrl(tab.photo)"
                          :alt="ml(tab.title)"
                          class="rounded w-full h-full object-cover min-h-[300px]"
                        />
                        <div
                          v-else
                          class="w-full h-full bg-gray-100 rounded flex items-center justify-center min-h-[300px]"
                        >
                          <div class="text-center text-sm text-gray-500">
                            <div class="text-lg font-medium mb-2.5">{{ ml(tab.title) }}</div>
                          </div>
                        </div>
                        <div class="absolute inset-0 px-8 py-6">
                          <div class="text-[22px] font-medium leading-snug text-white">
                            {{ ml(tab.items?.[getActiveNested(tabIndex)]?.title) }}
                          </div>
                          <NuxtLink
                            v-if="tab.items?.[getActiveNested(tabIndex)]?.link"
                            :to="tab.items[getActiveNested(tabIndex)].link"
                            class="inline-flex items-center uppercase h-[50px] px-8 bg-white text-gray-900 mt-5 font-medium rounded hover:bg-site-primary hover:text-white transition-colors"
                          >
                            View All
                          </NuxtLink>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Regular dropdown (items without subitems) -->
                <ul
                  v-else-if="tab.items?.length && !hasSubItems(tab)"
                  class="absolute top-full left-0 bg-white rounded text-gray-900 min-w-[240px] py-5 px-5 transition-all duration-200"
                  :style="{
                    opacity: openTab === tabIndex ? '1' : '0',
                    pointerEvents: openTab === tabIndex ? 'auto' : 'none',
                    boxShadow: '0 10px 60px rgba(5,16,54,0.05)',
                    zIndex: 9999
                  }"
                >
                  <li
                    v-for="(item, itemIndex) in tab.items"
                    :key="itemIndex"
                    :class="isLinkActive(item.link) ? 'text-site-primary' : ''"
                  >
                    <NuxtLink
                      :to="item.link || '#'"
                      class="block py-1.5 px-4 rounded font-normal hover:text-site-primary hover:bg-site-primary/5 transition-colors"
                    >
                      {{ ml(item.title) }}
                    </NuxtLink>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>
        </div>

        <!-- Right side actions -->
        <div class="flex items-center">
          <!-- Desktop right side -->
          <div class="hidden xl:flex items-center">
            <div class="flex items-center gap-x-5">
              <CurrencySwitcher :text-class="textColorClass" />
              <div class="w-px h-5" :class="dividerClass" />
              <LanguageSwitcher :text-class="textColorClass" />
            </div>

            <!-- Cart button -->
            <div class="flex items-center ml-5">
              <button
                class="relative flex items-center justify-center w-10 h-10 rounded border transition-all"
                :class="cartButtonClass"
                title="Shopping Cart"
              >
                <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-5.98.572m5.98-.572h9m-9 0a3 3 0 01-5.98.572M17.25 14.25a3 3 0 005.98.572m-5.98-.572h-9m9 0a3 3 0 015.98.572M3.75 4.863l.75 9.75a1.5 1.5 0 001.5 1.387h9a1.5 1.5 0 001.5-1.387l.75-9.75" />
                </svg>
              </button>
            </div>

            <!-- Sign in button -->
            <div class="flex items-center ml-5">
              <a
                :href="adminPanelUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center px-8 h-[50px] text-sm font-normal rounded border transition-all"
                :class="signInButtonClass"
              >
                {{ $t('common.partnerLogin') }}
              </a>
            </div>
          </div>

          <!-- Mobile hamburger -->
          <div class="xl:hidden flex items-center gap-x-5 pl-8" :class="textColorClass">
            <button
              class="flex items-center text-xl"
              @click="ui.toggleMobileMenu()"
              :aria-label="$t('common.menu')"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Mobile menu -->
  <Transition name="mobile-menu">
    <MobileMenu v-if="ui.mobileMenuOpen" />
  </Transition>

  <!-- Spacer to prevent content jump (only on non-transparent pages) -->
  <div v-if="!isTransparent" :style="{ height: headerHeight }" />
</template>

<script setup lang="ts">
const partner = usePartnerStore()
const storefront = useStorefrontStore()
const ui = useUiStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()
const route = useRoute()
const { t: $t } = useI18n()

const isWhiteHeader = computed(() => storefront.header?.headerType === 'white')

const isTransparent = computed(() => {
  const path = route.path
  return path === '/' || /^\/[a-z]{2}$/.test(path) || path.startsWith('/draftlive')
})

const scrolled = ref(false)
const headerHeight = '90px'

onMounted(() => {
  const handleScroll = () => {
    scrolled.value = window.scrollY >= 10
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
})

const headerClasses = computed(() => {
  if (isWhiteHeader.value) {
    if (scrolled.value) {
      return 'bg-white shadow-[0_10px_30px_rgba(5,16,54,0.03)]'
    }
    return isTransparent.value ? 'bg-transparent' : 'bg-white shadow-[0_10px_30px_rgba(5,16,54,0.03)]'
  }
  if (scrolled.value) {
    return 'bg-gray-800 shadow-[rgba(149,157,165,0.2)_0px_8px_24px]'
  }
  return isTransparent.value ? 'bg-transparent' : 'bg-gray-800 shadow-[rgba(149,157,165,0.2)_0px_8px_24px]'
})

const textColorClass = computed(() => {
  if (isWhiteHeader.value) {
    if (scrolled.value || !isTransparent.value) return 'text-gray-900'
    return 'text-white'
  }
  return 'text-white'
})

const dividerClass = computed(() => {
  if (isWhiteHeader.value && (scrolled.value || !isTransparent.value)) {
    return 'bg-gray-900/20'
  }
  return 'bg-white/20'
})

const cartButtonClass = computed(() => {
  if (isWhiteHeader.value && (scrolled.value || !isTransparent.value)) {
    return 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
  }
  return 'border-white text-white hover:bg-white hover:text-gray-900'
})

const signInButtonClass = computed(() => {
  if (isWhiteHeader.value && (scrolled.value || !isTransparent.value)) {
    return 'border-gray-900 text-gray-900 hover:bg-site-primary hover:text-white hover:border-site-primary'
  }
  return 'border-white text-white hover:bg-site-primary hover:text-white hover:border-site-primary'
})

// Navigation tabs from storefront
const headerTabs = computed(() => {
  return storefront.header?.tabs || []
})

// Dropdown state — fully JS-driven via inline :style to bypass all CSS specificity issues
const openTab = ref<number | null>(null)
const nestedMenus = reactive<Record<number, number>>({})
let closeTimer: ReturnType<typeof setTimeout> | undefined

function openDropdown(tabIndex: number) {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = undefined }
  const tab = headerTabs.value[tabIndex]
  if (tab?.items?.length) {
    openTab.value = tabIndex
    if (nestedMenus[tabIndex] === undefined) nestedMenus[tabIndex] = 0
  }
}

function closeDropdown(_tabIndex: number) {
  closeTimer = setTimeout(() => { openTab.value = null }, 150)
}

function getActiveNested(tabIndex: number): number {
  return nestedMenus[tabIndex] ?? 0
}

function setActiveNested(tabIndex: number, itemIndex: number) {
  nestedMenus[tabIndex] = itemIndex
}

function hasSubItems(tab: any): boolean {
  if (!tab.items?.length) return false
  return tab.items.some((item: any) => item.subItems?.length > 0)
}

function isTabActive(tab: any): boolean {
  if (isLinkActive(tab.link)) return true
  if (tab.items?.length) {
    return tab.items.some((item: any) => {
      if (isLinkActive(item.link)) return true
      return item.subItems?.some((sub: any) => isLinkActive(sub.link))
    })
  }
  return false
}

function isLinkActive(link: string): boolean {
  if (!link) return false
  if (link === '/' && route.path === '/') return true
  if (link !== '/' && route.path.startsWith(link)) return true
  return false
}

const adminPanelUrl = ref('#')

onMounted(() => {
  const parts = window.location.hostname.split('.')
  if (parts.length >= 2) {
    adminPanelUrl.value = `https://app.${parts.slice(-2).join('.')}`
  }
})

watch(() => route.path, () => {
  ui.mobileMenuOpen = false
  openTab.value = null
})
</script>

<style>
@media (max-width: 767px) {
  .site-header-root { height: 80px !important; }
}
</style>
