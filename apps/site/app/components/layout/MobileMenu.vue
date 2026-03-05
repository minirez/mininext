<template>
  <ClientOnly>
    <Teleport to="body">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-900/70 z-[999] xl:hidden" @click="ui.toggleMobileMenu()" />

      <!-- Menu panel (slide from right like Bootstrap offcanvas) -->
      <div
        class="fixed inset-y-0 right-0 w-[300px] max-w-[85vw] bg-white shadow-2xl z-[1000] xl:hidden flex flex-col animate-slide-in-right"
      >
        <!-- Header with logo + close -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <NuxtLink v-if="partner.logo" to="/" class="shrink-0" @click="ui.toggleMobileMenu()">
            <img
              :src="imageUrl(partner.logo)"
              :alt="partner.partnerName"
              class="max-h-[40px] w-auto py-1"
            />
          </NuxtLink>
          <span v-else class="font-semibold text-gray-900">{{ partner.partnerName }}</span>
          <button
            @click="ui.toggleMobileMenu()"
            class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Nav links with accordion submenus -->
        <nav class="flex-1 overflow-y-auto px-5 py-5">
          <div v-for="(tab, tabIndex) in headerTabs" :key="tabIndex">
            <!-- Tab with children (accordion) -->
            <template v-if="tab.items?.length">
              <button
                class="w-full flex items-center justify-between h-[50px] px-5 rounded text-xl font-medium transition-colors"
                :class="isTabActive(tab) ? 'text-site-primary' : 'text-gray-900 hover:text-site-primary hover:bg-site-primary/5'"
                @click="toggleAccordion(tabIndex)"
              >
                {{ ml(tab.title) }}
                <svg
                  class="w-2 h-2 transition-transform duration-200"
                  :class="openAccordion === tabIndex ? 'rotate-180' : '-rotate-90'"
                  fill="currentColor"
                  viewBox="0 0 10 10"
                >
                  <path d="M5 7L0 2h10z" />
                </svg>
              </button>

              <!-- Sub-items accordion content -->
              <div
                v-show="openAccordion === tabIndex"
                class="pl-5"
              >
                <div v-for="(item, itemIndex) in tab.items" :key="itemIndex">
                  <!-- Item with sub-sub-items -->
                  <template v-if="item.subItems?.length">
                    <button
                      class="w-full flex items-center justify-between h-[40px] px-5 rounded text-lg font-medium transition-colors"
                      :class="isItemActive(item) ? 'text-site-primary' : 'text-gray-900 hover:text-site-primary'"
                      @click="toggleSubAccordion(tabIndex, itemIndex)"
                    >
                      {{ ml(item.title) }}
                      <svg
                        class="w-2 h-2 transition-transform duration-200"
                        :class="openSubAccordion === `${tabIndex}-${itemIndex}` ? 'rotate-180' : '-rotate-90'"
                        fill="currentColor"
                        viewBox="0 0 10 10"
                      >
                        <path d="M5 7L0 2h10z" />
                      </svg>
                    </button>

                    <div v-show="openSubAccordion === `${tabIndex}-${itemIndex}`" class="pl-5 pb-2">
                      <NuxtLink
                        v-for="(subItem, subIndex) in item.subItems"
                        :key="subIndex"
                        :to="subItem.link || '#'"
                        class="block h-[40px] leading-[40px] px-5 rounded text-base font-normal transition-colors"
                        :class="isLinkActive(subItem.link) ? 'text-site-primary' : 'text-gray-700 hover:text-site-primary'"
                        @click="ui.toggleMobileMenu()"
                      >
                        {{ ml(subItem.title) }}
                      </NuxtLink>
                    </div>
                  </template>

                  <!-- Simple item link -->
                  <NuxtLink
                    v-else
                    :to="item.link || '#'"
                    class="block h-[40px] leading-[40px] px-5 rounded text-lg font-medium transition-colors"
                    :class="isLinkActive(item.link) ? 'text-site-primary' : 'text-gray-700 hover:text-site-primary'"
                    @click="ui.toggleMobileMenu()"
                  >
                    {{ ml(item.title) }}
                  </NuxtLink>
                </div>
              </div>
            </template>

            <!-- Simple tab link -->
            <NuxtLink
              v-else
              :to="tab.link || '#'"
              class="block h-[50px] leading-[50px] px-5 rounded text-xl font-medium transition-colors"
              :class="isLinkActive(tab.link) ? 'text-site-primary' : 'text-gray-900 hover:text-site-primary hover:bg-site-primary/5'"
              @click="ui.toggleMobileMenu()"
            >
              {{ ml(tab.title) }}
            </NuxtLink>
          </div>
        </nav>

        <!-- Footer section -->
        <div class="border-t border-gray-100 px-5 py-4 space-y-3">
          <div class="flex items-center gap-3">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>

          <div class="space-y-2">
            <a
              v-if="partner.contact?.phone"
              :href="`tel:${partner.contact.phone}`"
              class="flex items-center gap-3 px-3 py-3 rounded-xl bg-site-primary/5 text-site-primary font-medium"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {{ partner.contact.phone }}
            </a>
            <a
              v-if="partner.contact?.email"
              :href="`mailto:${partner.contact.email}`"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm"
            >
              <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              {{ partner.contact.email }}
            </a>
          </div>

          <a
            :href="adminPanelUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-site-primary text-white font-semibold text-sm transition-colors hover:bg-site-primary-dark"
          >
            <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            {{ $t('common.partnerLogin') }}
          </a>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
const partner = usePartnerStore()
const storefront = useStorefrontStore()
const ui = useUiStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()
const { t: $t } = useI18n()
const route = useRoute()

const openAccordion = ref<number | null>(null)
const openSubAccordion = ref<string | null>(null)

const headerTabs = computed(() => {
  if (storefront.header?.tabs?.length) return storefront.header.tabs
  return [
    { link: '/hotels', title: [{ lang: 'en', value: $t('common.hotels') }] },
    { link: '/destinations', title: [{ lang: 'en', value: $t('common.destinations') }] },
    { link: '/page/contact', title: [{ lang: 'en', value: $t('common.contact') }] }
  ]
})

function toggleAccordion(index: number) {
  openAccordion.value = openAccordion.value === index ? null : index
  openSubAccordion.value = null
}

function toggleSubAccordion(tabIndex: number, itemIndex: number) {
  const key = `${tabIndex}-${itemIndex}`
  openSubAccordion.value = openSubAccordion.value === key ? null : key
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

function isItemActive(item: any): boolean {
  if (isLinkActive(item.link)) return true
  return item.subItems?.some((sub: any) => isLinkActive(sub.link)) || false
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
</script>
