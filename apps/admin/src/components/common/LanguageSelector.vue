<template>
  <div ref="dropdownRef" class="relative">
    <button
      class="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
      :class="
        variant === 'auth'
          ? 'text-white hover:bg-white/10'
          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
      "
      :title="$t('nav.language')"
      @click="isOpen = !isOpen"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>
      <span class="text-sm font-medium uppercase">{{ currentLocale }}</span>
      <svg
        class="w-4 h-4 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown (Teleport to body) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          :style="dropdownStyle"
          class="fixed w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-[9999]"
        >
          <button
            v-for="lang in languages"
            :key="lang.code"
            class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-between"
            :class="{
              'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20':
                currentLocale === lang.code
            }"
            @mousedown.prevent="changeLanguage(lang.code)"
          >
            <span>{{ lang.name }}</span>
            <svg
              v-if="currentLocale === lang.code"
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- Backdrop -->
    <Teleport to="body">
      <div v-if="isOpen" class="fixed inset-0 z-[9998]" @click="isOpen = false"></div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/plugins/i18n'

// Props
defineProps({
  variant: {
    type: String,
    default: 'default', // 'default' or 'auth'
    validator: value => ['default', 'auth'].includes(value)
  }
})

const { locale } = useI18n()
const isOpen = ref(false)
const dropdownRef = ref(null)
const isLoading = ref(false)

// Dropdown positioning
const dropdownStyle = ref({ top: '0px', right: '0px' })
const DROPDOWN_HEIGHT = 120

const updateDropdownPosition = () => {
  if (!dropdownRef.value) return

  const rect = dropdownRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  const openAbove = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow

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

// Watch for dropdown open
watch(isOpen, open => {
  if (open) {
    updateDropdownPosition()
  }
})

const languages = [
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Türkçe' }
]

const currentLocale = computed(() => locale.value)

const changeLanguage = async lang => {
  if (isLoading.value) return
  isLoading.value = true
  try {
    await setLocale(lang)
  } finally {
    isLoading.value = false
    isOpen.value = false
  }
}
</script>
