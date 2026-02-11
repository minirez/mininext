<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br"
    :class="[branding.config.gradientFrom, branding.config.gradientTo]"
  >
    <!-- Top Bar: Language & Theme -->
    <div class="fixed top-4 right-4 flex items-center gap-2 z-50">
      <LanguageSelector variant="auth" />
      <button
        class="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        :title="isDark ? 'Light Mode' : 'Dark Mode'"
        @click="toggleTheme"
      >
        <span class="material-icons text-xl">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>
    </div>

    <div class="absolute inset-0 bg-black opacity-10"></div>
    <div class="relative z-10 w-full max-w-md px-6">
      <!-- Logo -->
      <div class="text-center mb-8">
        <!-- Partner logo (custom domain) -->
        <template v-if="partnerBranding">
          <div
            v-if="partnerBranding.logo"
            class="inline-flex items-center justify-center w-28 h-28 bg-white rounded-2xl shadow-lg mb-4 overflow-hidden"
          >
            <img
              :src="partnerLogoUrl"
              :alt="partnerBranding.partnerName"
              class="w-24 h-24 object-contain"
            />
          </div>
          <h1 class="text-3xl font-bold text-white">{{ partnerBranding.partnerName }}</h1>
          <p class="mt-2" :class="branding.config.textMuted">
            {{ $t(branding.config.portalSubtitle) }}
          </p>
        </template>

        <!-- Default logo (platform domain) -->
        <template v-else>
          <div
            class="inline-flex items-center justify-center w-28 h-28 bg-white rounded-2xl shadow-lg mb-4 overflow-hidden"
          >
            <img :src="aaLogo" alt="AdviceAl Logo" class="w-24 h-24 object-contain" />
          </div>
          <h1 class="text-3xl font-bold text-white">{{ $t(branding.config.portalTitle) }}</h1>
          <p class="mt-2" :class="branding.config.textMuted">
            {{ $t(branding.config.portalSubtitle) }}
          </p>
        </template>
      </div>

      <!-- Auth Form Container -->
      <div
        class="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 rounded-2xl shadow-xl p-8"
      >
        <router-view />
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p v-if="partnerBranding" class="text-sm" :class="branding.config.textMuted">
          © {{ new Date().getFullYear() }} {{ partnerBranding.partnerName }}
        </p>
        <p v-else class="text-sm" :class="branding.config.textMuted">
          © {{ new Date().getFullYear() }}
          <a
            href="https://adviceal.com"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-white underline transition-colors"
            :class="branding.config.textAccent"
            >{{ $t('auth.footerCompany') }}</a
          >, {{ $t('auth.footerSlogan') }}
        </p>
      </div>
    </div>

    <!-- Background Pattern -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20 blur-3xl"
        :class="branding.config.bgCircle1"
      ></div>
      <div
        class="absolute -bottom-16 -left-16 w-96 h-96 rounded-full opacity-20 blur-3xl"
        :class="branding.config.bgCircle2"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import LanguageSelector from '@/components/common/LanguageSelector.vue'
import { useUIStore } from '@/stores/ui'
import { useDomainBranding } from '@/composables/useDomainBranding'
import { getFileUrl } from '@/utils/imageUrl'
import api from '@/services/api'
import aaLogo from '@/assets/aa-logo.jpeg'

const uiStore = useUIStore()
const branding = useDomainBranding()

const isDark = computed(() => uiStore.darkMode)
const toggleTheme = () => uiStore.toggleDarkMode()

// Partner branding from custom domain
const partnerBranding = ref(null)
const partnerLogoUrl = computed(() => {
  if (!partnerBranding.value?.logo) return null
  return getFileUrl(partnerBranding.value.logo)
})

// Detect if we're on a custom partner domain
const isCustomDomain = () => {
  const hostname = window.location.hostname
  // Platform domains - not a custom partner domain
  const platformDomains = ['localhost', 'maxirez.com', 'minirez.com', 'adviceal.com']
  return !platformDomains.some(d => hostname === d || hostname.endsWith('.' + d))
}

onMounted(async () => {
  if (!isCustomDomain()) return

  try {
    const { data } = await api.get('/api/public/resolve-domain', {
      params: { domain: window.location.hostname }
    })
    if (data.success && data.data) {
      partnerBranding.value = data.data
    }
  } catch {
    // Not a partner domain or API unavailable - use default branding
  }
})
</script>

<style scoped>
/* Additional animations or effects */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.auth-layout {
  position: relative;
}
</style>
