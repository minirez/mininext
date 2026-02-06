<template>
  <header class="widget-header">
    <div class="widget-header-left">
      <!-- Hotel Logo or Name -->
      <img
        v-if="hotel?.logo?.url"
        :src="hotel.logo.url"
        :alt="hotelName"
        class="widget-logo"
      />
      <span v-else class="widget-hotel-name">{{ hotelName }}</span>
    </div>

    <div class="widget-header-right">
      <!-- Language Selector -->
      <div class="widget-lang-selector">
        <button
          class="widget-lang-button"
          @click="toggleLangMenu"
        >
          <span class="widget-lang-flag">{{ currentFlag }}</span>
          <WidgetIcon name="chevron-down" :size="16" />
        </button>

        <!-- No Transition - required for Shadow DOM compatibility -->
        <div v-if="showLangMenu" class="widget-lang-menu">
          <button
            v-for="lang in availableLanguages"
            :key="lang.code"
            class="widget-lang-option"
            :class="{ 'is-active': locale === lang.code }"
            @click="selectLanguage(lang.code)"
          >
            <span class="widget-lang-flag">{{ lang.flag }}</span>
            <span>{{ lang.name }}</span>
          </button>
        </div>
      </div>

      <!-- Close Button -->
      <button
        class="widget-close-button"
        :aria-label="$t('common.close')"
        @click="$emit('close')"
      >
        <WidgetIcon name="x" :size="20" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { B2C_LANGUAGES, LANGUAGE_FLAGS } from '@booking-engine/constants'
import WidgetIcon from './WidgetIcon.vue'

defineEmits(['close'])

const store = inject('widgetStore')
const { locale, setLocaleMessage, availableLocales } = useI18n()

const showLangMenu = ref(false)

// Hotel info
const hotel = computed(() => store.hotel)
const hotelName = computed(() => {
  const name = hotel.value?.name
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
})

// Language
const availableLanguages = computed(() => {
  return B2C_LANGUAGES.map(code => ({
    code,
    flag: LANGUAGE_FLAGS[code] || '🌐',
    name: getLanguageName(code)
  }))
})

const currentFlag = computed(() => {
  return LANGUAGE_FLAGS[locale.value] || '🌐'
})

function getLanguageName(code) {
  const names = {
    tr: 'Türkçe',
    en: 'English',
    de: 'Deutsch',
    ru: 'Русский',
    ar: 'العربية',
    fr: 'Français',
    es: 'Español',
    it: 'Italiano',
    nl: 'Nederlands',
    pl: 'Polski',
    pt: 'Português',
    ro: 'Română',
    uk: 'Українська',
    el: 'Ελληνικά',
    bg: 'Български',
    he: 'עברית',
    fa: 'فارسی',
    az: 'Azərbaycan',
    sq: 'Shqip',
    zh: '中文',
    da: 'Dansk'
  }
  return names[code] || code.toUpperCase()
}

function toggleLangMenu(e) {
  e.stopPropagation() // Prevent immediate close from handleClickOutside
  showLangMenu.value = !showLangMenu.value
}

async function selectLanguage(code) {
  // Load locale if not loaded
  try {
    const messages = await import(`@/locales/${code}/index.js`)
    setLocaleMessage(code, messages.default)
  } catch (e) {
    console.warn(`Could not load locale ${code}`)
  }

  locale.value = code
  localStorage.setItem('language', code)
  showLangMenu.value = false
}

// Close menu on outside click (Shadow DOM compatible)
function handleClickOutside(e) {
  // Use composedPath for Shadow DOM compatibility
  const path = e.composedPath ? e.composedPath() : [e.target]
  const clickedInSelector = path.some(el => el.classList?.contains('widget-lang-selector'))
  if (!clickedInSelector) {
    showLangMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

:deep(.dark) .widget-header {
  background: #1f2937;
  border-bottom-color: #374151;
}

.widget-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.widget-logo {
  height: 36px;
  width: auto;
  object-fit: contain;
}

.widget-hotel-name {
  font-weight: 600;
  font-size: 1.125rem;
  color: #111827;
}

:deep(.dark) .widget-hotel-name {
  color: white;
}

.widget-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Language Selector */
.widget-lang-selector {
  position: relative;
}

.widget-lang-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 150ms ease;
}

.widget-lang-button:hover {
  background: #e5e7eb;
  color: #111827;
}

:deep(.dark) .widget-lang-button:hover {
  background: #374151;
  color: white;
}

.widget-lang-flag {
  font-size: 1.25rem;
  line-height: 1;
}

.widget-lang-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
  min-width: 150px;
}

:deep(.dark) .widget-lang-menu {
  background: #1f2937;
  border-color: #374151;
}

.widget-lang-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.875rem;
  color: #374151;
  transition: background 150ms ease;
}

.widget-lang-option:hover {
  background: #f3f4f6;
}

.widget-lang-option.is-active {
  background: var(--widget-primary-50, #f5f3ff);
  color: var(--widget-primary, #7c3aed);
}

:deep(.dark) .widget-lang-option {
  color: #d1d5db;
}

:deep(.dark) .widget-lang-option:hover {
  background: #374151;
}

/* Close Button */
.widget-close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: transparent;
  border-radius: 9999px;
  cursor: pointer;
  color: #6b7280;
  transition: all 150ms ease;
}

.widget-close-button:hover {
  background: #e5e7eb;
  color: #111827;
}

:deep(.dark) .widget-close-button:hover {
  background: #374151;
  color: white;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 150ms ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
