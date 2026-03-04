<template>
  <footer class="bg-gray-900 text-gray-300">
    <!-- Newsletter + TURSAB bar -->
    <div class="bg-gray-800/50 border-b border-gray-700/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <!-- Left: Newsletter text -->
          <div class="text-center md:text-left shrink-0">
            <h3 class="text-white font-semibold text-base">{{ $t('sections.newsletter') }}</h3>
            <p class="text-gray-400 text-sm mt-0.5">{{ $t('sections.newsletterDesc') }}</p>
          </div>

          <!-- Center: TURSAB badge -->
          <div v-if="partner.tursab?.photo?.link" class="shrink-0">
            <a
              v-if="partner.tursab.link"
              :href="partner.tursab.link"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <img :src="partner.tursab.photo.link" alt="TURSAB" class="h-10" />
              <span v-if="partner.tursab.documentNumber" class="text-xs text-gray-400">
                TURSAB {{ partner.tursab.documentNumber }}
              </span>
            </a>
            <div v-else class="flex items-center gap-2 opacity-70">
              <img :src="partner.tursab.photo.link" alt="TURSAB" class="h-10" />
              <span v-if="partner.tursab.documentNumber" class="text-xs text-gray-400">
                TURSAB {{ partner.tursab.documentNumber }}
              </span>
            </div>
          </div>

          <!-- Right: Email form -->
          <form
            @submit.prevent="handleSubscribe"
            class="flex gap-2 w-full md:w-auto md:min-w-[320px]"
          >
            <input
              v-model="email"
              type="email"
              :placeholder="$t('sections.emailPlaceholder')"
              required
              class="flex-1 px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-site-primary/50 transition-colors text-sm"
            />
            <button
              type="submit"
              class="px-5 py-2.5 bg-site-primary hover:bg-site-primary-dark text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              {{ $t('sections.subscribe') }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Main footer: 5-column layout matching site3 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
        <!-- Column 1: Contact info -->
        <div class="space-y-4">
          <!-- Logo -->
          <NuxtLink to="/" class="inline-block mb-2">
            <img
              v-if="partner.logo"
              :src="imageUrl(partner.logo)"
              :alt="partner.partnerName"
              class="h-8 w-auto brightness-0 invert"
            />
            <span v-else class="text-lg font-bold text-white">
              {{ partner.partnerName }}
            </span>
          </NuxtLink>

          <ul class="space-y-4 text-sm">
            <li v-if="partner.contact?.phone">
              <div class="text-sm text-gray-400 mb-1">{{ $t('footer.tollFreeCustomerCare') || 'Toll Free Customer Care' }}</div>
              <a
                :href="`tel:${partner.contact.phone}`"
                class="text-lg font-medium text-site-primary hover:text-white transition-colors"
              >
                {{ partner.contact.phone }}
              </a>
            </li>
            <li v-if="partner.contact?.email">
              <div class="text-sm text-gray-400 mb-1">{{ $t('footer.needLiveSupport') || 'Need live support?' }}</div>
              <a
                :href="`mailto:${partner.contact.email}`"
                class="text-lg font-medium text-site-primary hover:text-white transition-colors"
              >
                {{ partner.contact.email }}
              </a>
            </li>
            <li v-if="partner.contact?.address">
              <div class="text-sm text-gray-400 mb-1">{{ $t('footer.address') || 'Address' }}</div>
              <div class="text-xs text-gray-400 leading-relaxed">
                {{ partner.contact.address }}
              </div>
            </li>
            <li
              v-if="partner.contact?.workingHours"
              class="flex items-center gap-2.5 text-gray-400"
            >
              <svg
                class="w-4 h-4 text-site-primary shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {{ partner.contact.workingHours }}
            </li>
          </ul>
        </div>

        <!-- Columns 2-3: Storefront footer link columns -->
        <div v-for="(section, i) in storefront.footer.items" :key="i" class="space-y-3">
          <h3 class="text-white font-semibold text-sm uppercase tracking-wider">
            {{ ml(section.title) }}
          </h3>
          <ul class="space-y-2">
            <li v-for="(sub, j) in section.subItems" :key="j">
              <a
                v-if="sub.link?.startsWith('http')"
                :href="sub.link"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm hover:text-white transition-colors"
              >
                {{ ml(sub.title) }}
              </a>
              <NuxtLink
                v-else
                :to="sub.link || '#'"
                class="text-sm hover:text-white transition-colors"
              >
                {{ ml(sub.title) }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Fill remaining columns if storefront has less than 2 -->
        <template v-if="storefront.footer.items.length < 2">
          <div class="space-y-3">
            <h3 class="text-white font-semibold text-sm uppercase tracking-wider">
              {{ $t('footer.quickLinks') }}
            </h3>
            <ul class="space-y-2">
              <li>
                <NuxtLink to="/hotels" class="text-sm hover:text-white transition-colors">{{
                  $t('common.hotels')
                }}</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/destinations" class="text-sm hover:text-white transition-colors">{{
                  $t('common.destinations')
                }}</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/page/contact" class="text-sm hover:text-white transition-colors">{{
                  $t('common.contact')
                }}</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/page/about" class="text-sm hover:text-white transition-colors">{{
                  $t('common.about')
                }}</NuxtLink>
              </li>
            </ul>
          </div>
        </template>

        <!-- Column 4: Social media -->
        <div class="space-y-3">
          <h3
            v-if="socialLinks.length"
            class="text-white font-semibold text-sm uppercase tracking-wider"
          >
            {{ $t('footer.followUs') }}
          </h3>
          <div v-if="socialLinks.length" class="flex flex-wrap gap-2">
            <a
              v-for="social in socialLinks"
              :key="social.platform"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-site-primary transition-all text-gray-400 hover:text-white hover:-translate-y-0.5"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  v-if="social.platform === 'facebook'"
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
                <path
                  v-else-if="social.platform === 'instagram'"
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                />
                <path
                  v-else-if="social.platform === 'twitter'"
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                />
                <path
                  v-else-if="social.platform === 'youtube'"
                  d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                />
                <path
                  v-else-if="social.platform === 'linkedin'"
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                />
                <path
                  v-else
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                />
              </svg>
            </a>
          </div>

          <!-- Legal links -->
          <div class="mt-4 space-y-2">
            <NuxtLink to="/page/privacy" class="block text-sm hover:text-white transition-colors">{{
              $t('footer.privacy')
            }}</NuxtLink>
            <NuxtLink to="/page/terms" class="block text-sm hover:text-white transition-colors">{{
              $t('footer.terms')
            }}</NuxtLink>
            <NuxtLink to="/page/cookies" class="block text-sm hover:text-white transition-colors">{{
              $t('footer.cookies')
            }}</NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Copyright bar -->
    <div class="border-t border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-0">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <!-- Left: Copyright -->
          <span class="text-xs text-gray-500">
            {{
              $t('footer.copyright', { year: new Date().getFullYear(), name: partner.partnerName })
            }}
          </span>

          <!-- Center: Language & Currency switchers -->
          <div class="flex items-center gap-3">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>

          <!-- Right: Social icons (compact) -->
          <div v-if="socialLinks.length" class="flex items-center gap-2">
            <a
              v-for="social in socialLinks"
              :key="'bottom-' + social.platform"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-500 hover:text-white transition-colors"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  v-if="social.platform === 'facebook'"
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
                <path
                  v-else-if="social.platform === 'instagram'"
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                />
                <path
                  v-else-if="social.platform === 'twitter'"
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                />
                <path
                  v-else-if="social.platform === 'youtube'"
                  d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                />
                <path
                  v-else-if="social.platform === 'linkedin'"
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Scrolling payment/bank logos marquee -->
    <div class="bg-gray-950/50 border-t border-gray-800/50 overflow-hidden py-3">
      <div class="marquee-track flex items-center gap-8 whitespace-nowrap">
        <template v-for="n in 2" :key="n">
          <div
            v-for="method in bankLogos"
            :key="method + '-' + n"
            class="inline-flex items-center px-4"
          >
            <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{{
              method
            }}</span>
          </div>
        </template>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const partner = usePartnerStore()
const storefront = useStorefrontStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()
const { t: $t } = useI18n()

const api = useApi()
const email = ref('')
const subscribed = ref(false)
const bankLogos = [
  'Visa',
  'Mastercard',
  'American Express',
  'Troy',
  'QNB Finansbank',
  'Garanti BBVA',
  'World Card',
  'Maximum Card',
  'Axess Card',
  'Bonus Card',
  'Paraf Card',
  'CardFinans'
]

async function handleSubscribe() {
  if (!email.value) return
  try {
    await api.post('/api/public/storefront/newsletter/subscribe', { email: email.value })
    email.value = ''
    subscribed.value = true
    setTimeout(() => { subscribed.value = false }, 4000)
  } catch {
    // silent
  }
}

const socialLinks = computed(() => {
  if (!partner.socials) return []
  return Object.entries(partner.socials)
    .filter(([, url]) => url)
    .map(([platform, url]) => ({ platform, url }))
})
</script>

<style scoped>
.marquee-track {
  animation: marquee 30s linear infinite;
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>
