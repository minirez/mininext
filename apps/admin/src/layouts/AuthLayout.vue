<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800"
  >
    <!-- Top Bar: Language & Theme -->
    <div class="fixed top-4 right-4 flex items-center gap-2 z-50">
      <LanguageSelector class="!text-white hover:!bg-white/10" />
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
          class="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4"
        >
          <svg
            class="w-12 h-12 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white">Booking Engine</h1>
        <p class="text-purple-200 mt-2">Admin Panel</p>
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
          © {{ new Date().getFullYear() }} Booking Engine. All rights reserved.
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
import { computed } from 'vue'
import LanguageSelector from '@/components/common/LanguageSelector.vue'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()

const isDark = computed(() => uiStore.darkMode)
const toggleTheme = () => uiStore.toggleDarkMode()
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
