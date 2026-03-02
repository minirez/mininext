<template>
  <ClientOnly>
    <Teleport to="body">
      <!-- Backdrop -->
      <div class="backdrop-overlay lg:hidden" @click="ui.toggleMobileMenu()" />

      <!-- Menu panel (slide from right) -->
      <div
        class="fixed inset-y-0 right-0 w-[300px] max-w-[85vw] bg-white shadow-2xl z-50 lg:hidden flex flex-col animate-slide-in-right"
      >
        <!-- Close button -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span class="font-semibold text-gray-900">{{ $t('common.menu') }}</span>
          <button
            @click="ui.toggleMobileMenu()"
            class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <svg
              class="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Nav links -->
        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NuxtLink
            v-for="tab in navigationTabs"
            :key="tab.link"
            :to="tab.link || '#'"
            class="block px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-site-primary transition-colors font-medium"
            @click="ui.toggleMobileMenu()"
          >
            {{ ml(tab.title) || tab.fallbackLabel }}
          </NuxtLink>
        </nav>

        <!-- Bottom section -->
        <div class="border-t border-gray-100 px-5 py-4 space-y-3">
          <!-- Language & Currency -->
          <div class="flex items-center gap-3">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>

          <!-- Contact info -->
          <div class="space-y-2">
            <a
              v-if="partner.contact?.phone"
              :href="`tel:${partner.contact.phone}`"
              class="flex items-center gap-3 px-3 py-3 rounded-xl bg-site-primary/5 text-site-primary font-medium"
            >
              <svg
                class="w-5 h-5"
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
              {{ partner.contact.phone }}
            </a>

            <a
              v-if="partner.contact?.email"
              :href="`mailto:${partner.contact.email}`"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm"
            >
              <svg
                class="w-4.5 h-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              {{ partner.contact.email }}
            </a>
          </div>

          <!-- Partner Login -->
          <a
            :href="adminPanelUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-site-primary text-white font-semibold text-sm transition-colors hover:bg-site-primary-dark"
          >
            <svg
              class="w-4.5 h-4.5"
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
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
const partner = usePartnerStore()
const storefront = useStorefrontStore()
const ui = useUiStore()
const { ml } = useMultiLang()
const { t: $t } = useI18n()

const navigationTabs = computed(() => {
  if (storefront.header.tabs?.length) return storefront.header.tabs
  return [
    { link: '/hotels', fallbackLabel: $t('common.hotels') },
    { link: '/destinations', fallbackLabel: $t('common.destinations') },
    { link: '/page/contact', fallbackLabel: $t('common.contact') }
  ]
})

const adminPanelUrl = ref('#')

onMounted(() => {
  const parts = window.location.hostname.split('.')
  if (parts.length >= 2) {
    adminPanelUrl.value = `https://app.${parts.slice(-2).join('.')}`
  }
})
</script>
