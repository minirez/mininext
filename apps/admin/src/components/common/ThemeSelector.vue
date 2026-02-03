<template>
  <div ref="containerRef" class="relative">
    <!-- Theme Button -->
    <button
      class="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      :title="$t('themes.select')"
      @click="togglePanel"
    >
      <span class="material-icons text-xl">palette</span>
    </button>

    <!-- Dropdown Panel (Teleport to body) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          :style="dropdownStyle"
          class="fixed w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 z-[9999] overflow-hidden"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50"
          >
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ $t('themes.select') }}
            </h3>
          </div>

          <!-- Dark/Light Mode Toggle -->
          <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ $t('common.appearance') }}
              </span>
              <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                  :class="
                    !uiStore.darkMode
                      ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  "
                  @click="uiStore.setDarkMode(false)"
                >
                  <span class="material-icons text-base">light_mode</span>
                </button>
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                  :class="
                    uiStore.darkMode
                      ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  "
                  @click="uiStore.setDarkMode(true)"
                >
                  <span class="material-icons text-base">dark_mode</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Theme Grid -->
          <div class="max-h-[350px] overflow-y-auto p-3">
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="theme in themeOptions"
                :key="theme.value"
                class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                :class="[
                  themeStore.themeId === theme.value
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                ]"
                @click="handleChange(theme.value)"
              >
                <span
                  class="w-4 h-4 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: theme.color }"
                ></span>
                <span class="truncate">{{ theme.label }}</span>
                <span
                  v-if="themeStore.themeId === theme.value"
                  class="material-icons text-sm ml-auto text-purple-600 dark:text-purple-400"
                >
                  check
                </span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Overlay to close panel -->
    <Teleport to="body">
      <div v-if="isOpen" class="fixed inset-0 z-[9998]" @click="closePanel"></div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore, ADMIN_THEME_IDS } from '@/stores/theme'
import { useUIStore } from '@/stores/ui'

const themeStore = useThemeStore()
const uiStore = useUIStore()
const { t } = useI18n()
const containerRef = ref(null)

// Panel state
const isOpen = ref(false)

// Dropdown positioning
const dropdownStyle = ref({ top: '0px', right: '0px' })
const DROPDOWN_HEIGHT = 450

const updateDropdownPosition = () => {
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  const openAbove = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow

  // Calculate right position to keep dropdown within viewport
  const rightPos = Math.max(16, viewportWidth - rect.right)

  if (openAbove) {
    dropdownStyle.value = {
      bottom: `${viewportHeight - rect.top + 8}px`,
      top: 'auto',
      right: `${rightPos}px`
    }
  } else {
    dropdownStyle.value = {
      top: `${rect.bottom + 8}px`,
      bottom: 'auto',
      right: `${rightPos}px`
    }
  }
}

// Theme preview colors (approximate primary color for each theme)
const themeColors = {
  mini: '#3b82f6',
  ocean: '#06b6d4',
  nord: '#5e81ac',
  graphite: '#71717a',
  sand: '#b48c50',
  forest: '#22c55e',
  rose: '#f43f5e',
  sunset: '#f97316',
  lavender: '#a855f7',
  emerald: '#10b981',
  citrus: '#eab308',
  cyber: '#a855f7',
  slate: '#64748b',
  coffee: '#b47846',
  winter: '#0ea5e9',
  aurora: '#14b8a6',
  candy: '#ec4899',
  abyss: '#6366f1',
  silk: '#e1b964',
  vintage: '#50a58c'
}

const themeOptions = computed(() => {
  return ADMIN_THEME_IDS.map(id => ({
    value: id,
    label: getLabel(id),
    color: themeColors[id] || '#6366f1'
  }))
})

const getLabel = id => {
  // Normalize keys: midnight-blue -> midnightBlue
  const key = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  return t(`themes.options.${key}`)
}

// Watch for panel open to update position
watch(isOpen, open => {
  if (open) {
    updateDropdownPosition()
  }
})

// Methods
const togglePanel = () => {
  isOpen.value = !isOpen.value
}

const closePanel = () => {
  isOpen.value = false
}

const handleChange = async nextThemeId => {
  await themeStore.setTheme(nextThemeId)
  closePanel()
}

// Keyboard escape to close
const handleEscape = event => {
  if (event.key === 'Escape' && isOpen.value) {
    closePanel()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>
