<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800"
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
        <div
          class="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl shadow-lg mb-4 overflow-hidden"
        >
          <img :src="siteSettingsStore.faviconUrl" alt="Logo" class="w-20 h-20 object-contain" />
        </div>
        <h1 class="text-3xl font-bold text-white">{{ $t('auth.portalTitle') }}</h1>
        <p class="text-purple-200 mt-2">{{ $t('auth.portalSubtitle') }}</p>
      </div>

      <!-- Auth Form Container -->
      <div
        class="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 rounded-2xl shadow-xl p-8"
      >
        <router-view />
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-purple-200 text-sm">
          © {{ new Date().getFullYear() }}
          <a
            href="https://adviceal.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-purple-100 hover:text-white underline transition-colors"
            >{{ $t('auth.footerCompany') }}</a
          >, {{ $t('auth.footerSlogan') }}
        </p>
      </div>
    </div>

    <!-- Background Pattern -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-16 -right-16 w-64 h-64 bg-purple-500 rounded-full opacity-20 blur-3xl"
      ></div>
      <div
        class="absolute -bottom-16 -left-16 w-96 h-96 bg-purple-700 rounded-full opacity-20 blur-3xl"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import LanguageSelector from '@/components/common/LanguageSelector.vue'
import { useUIStore } from '@/stores/ui'
import { useSiteSettingsStore } from '@/stores/siteSettings'

const uiStore = useUIStore()
const siteSettingsStore = useSiteSettingsStore()

const isDark = computed(() => uiStore.darkMode)
const toggleTheme = () => uiStore.toggleDarkMode()

// Fetch site settings for favicon (if not already loaded)
onMounted(() => {
  if (!siteSettingsStore.loaded && !siteSettingsStore.loading) {
    siteSettingsStore.fetchSettings()
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
