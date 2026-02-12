<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useWidgetStore } from './stores/widget'
import { useTranslation, setLocale } from './composables/useTranslation'

// Views
import SearchView from './views/SearchView.vue'
import ResultsView from './views/ResultsView.vue'
import BookingView from './views/BookingView.vue'
import PaymentView from './views/PaymentView.vue'
import BankTransferView from './views/BankTransferView.vue'
import ConfirmationView from './views/ConfirmationView.vue'

const widgetStore = useWidgetStore()
const { t } = useTranslation()

// Sync widget language config with translation system
watch(
  () => widgetStore.config.language,
  lang => {
    if (lang) setLocale(lang)
  },
  { immediate: true }
)

// Scroll widget content to top on step change
watch(
  () => widgetStore.currentStep,
  () => {
    nextTick(() => {
      const root = document.getElementById('maxirez-widget-root')
      const shadow = root?.shadowRoot
      if (shadow) {
        const content = shadow.querySelector('.widget-content')
        if (content) content.scrollTop = 0
      }
    })
  }
)

const isOpen = computed(() => widgetStore.isOpen)
const currentStep = computed(() => widgetStore.currentStep)
const mode = computed(() => widgetStore.config.mode)
const theme = computed(() => widgetStore.effectiveTheme)
const hotelInfo = computed(() => widgetStore.hotelInfo)
const hotelName = computed(() => hotelInfo.value?.name || 'Hotel')
const hotelLogo = computed(() => {
  const url = hotelInfo.value?.logo?.url || hotelInfo.value?.images?.[0]?.url
  return url ? widgetStore.resolveAssetUrl(url) : null
})
const hotelStars = computed(() => hotelInfo.value?.stars || 0)
const showPoweredBy = computed(() => widgetStore.widgetConfig?.showPoweredBy !== false)
const position = computed(
  () => widgetStore.widgetConfig?.triggerPosition || widgetStore.config.position || 'bottom-right'
)
const widgetConfig = computed(() => widgetStore.widgetConfig)

// WhatsApp
const whatsappEnabled = computed(
  () => widgetConfig.value?.whatsapp?.enabled && widgetConfig.value?.whatsapp?.number
)
const whatsappUrl = computed(() => {
  const number = widgetConfig.value?.whatsapp?.number?.replace(/\D/g, '')
  const lang = widgetStore.config.language || 'tr'
  const msg = widgetConfig.value?.whatsapp?.message?.[lang] || ''
  return `https://wa.me/${number}${msg ? '?text=' + encodeURIComponent(msg) : ''}`
})

// Language Dropdown
const langDropdownOpen = ref(false)
const availableLanguages = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'el', label: 'Ελληνικά' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'fr', label: 'Français' },
  { code: 'ro', label: 'Română' },
  { code: 'bg', label: 'Български' },
  { code: 'pt', label: 'Português' },
  { code: 'da', label: 'Dansk' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'fa', label: 'فارسی' },
  { code: 'he', label: 'עברית' },
  { code: 'sq', label: 'Shqip' },
  { code: 'uk', label: 'Українська' },
  { code: 'pl', label: 'Polski' },
  { code: 'az', label: 'Azərbaycan' }
]
const currentLang = computed(() => widgetStore.config.language || 'en')

function toggleLangDropdown() {
  langDropdownOpen.value = !langDropdownOpen.value
}

function changeLanguage(code) {
  widgetStore.setLanguage(code)
  langDropdownOpen.value = false
}

// View component mapping
const viewComponents = {
  search: SearchView,
  results: ResultsView,
  booking: BookingView,
  payment: PaymentView,
  'bank-transfer': BankTransferView,
  confirmation: ConfirmationView
}

const currentView = computed(() => viewComponents[currentStep.value] || SearchView)

// Step indicator
const steps = ['search', 'results', 'booking', 'payment', 'confirmation']
const stepLabels = computed(() => ({
  search: t('steps.search'),
  results: t('steps.results'),
  booking: t('steps.booking'),
  payment: t('steps.payment'),
  confirmation: t('steps.confirmation')
}))
// bank-transfer maps to payment step index for indicator
const currentStepIndex = computed(() => {
  const step = currentStep.value === 'bank-transfer' ? 'payment' : currentStep.value
  return steps.indexOf(step)
})

// Trigger button text
const triggerText = computed(() => {
  const texts = widgetStore.widgetConfig?.triggerText
  const lang = widgetStore.config.language || 'tr'
  return texts?.[lang] || texts?.tr || t('search.triggerButton')
})

function openWidget() {
  widgetStore.openWidget()
}

function closeWidget() {
  widgetStore.closeWidget()
}
</script>

<template>
  <!-- Floating Trigger Button (only in floating mode) -->
  <button
    v-if="mode === 'floating' && !isOpen"
    :class="['widget-trigger', { left: position.includes('left') }]"
    @click="openWidget"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
    {{ triggerText }}
  </button>

  <!-- WhatsApp Floating Button -->
  <a
    v-if="mode === 'floating' && !isOpen && whatsappEnabled"
    :href="whatsappUrl"
    target="_blank"
    rel="noopener noreferrer"
    :class="['widget-whatsapp', { left: position.includes('left') }]"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor">
      <path
        d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.302 22.602c-.388 1.092-1.938 1.998-3.156 2.264-.834.178-1.924.32-5.594-1.202-4.694-1.944-7.712-6.696-7.946-7.006-.226-.31-1.846-2.46-1.846-4.692 0-2.232 1.168-3.33 1.584-3.786.388-.424.916-.612 1.226-.612.15 0 .284.008.404.014.418.018.628.042.904.7.346.82 1.186 2.898 1.29 3.11.104.212.2.49.064.8-.128.31-.24.502-.452.77-.212.268-.436.474-.648.764-.192.252-.408.522-.168.96.24.434 1.068 1.762 2.294 2.854 1.578 1.404 2.862 1.852 3.332 2.046.34.14.746.104 1-.162.32-.336.716-.894 1.118-1.446.286-.394.646-.444 1.02-.302.378.136 2.392 1.128 2.802 1.334.41.206.684.31.784.478.098.168.098.968-.292 2.06z"
      />
    </svg>
  </a>

  <!-- Widget Modal/Container (no Teleport for Shadow DOM compatibility) -->
  <div v-if="mode === 'floating' && isOpen" class="widget-overlay">
    <div :class="['widget-container', { dark: theme === 'dark' }]">
      <!-- Header -->
      <div class="widget-header">
        <div class="widget-header-left">
          <img v-if="hotelLogo" :src="hotelLogo" :alt="hotelName" class="widget-logo" />
          <div v-else class="widget-logo widget-logo-placeholder">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div class="widget-hotel-info">
            <span class="widget-hotel-name">{{ hotelName }}</span>
            <div v-if="hotelStars > 0" class="widget-hotel-stars">
              <svg
                v-for="i in hotelStars"
                :key="i"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div class="widget-header-actions">
          <div class="widget-lang-selector">
            <button class="widget-lang-btn" @click="toggleLangDropdown">
              <span class="widget-lang-code">{{ currentLang.toUpperCase() }}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div v-if="langDropdownOpen" class="widget-lang-dropdown">
              <button
                v-for="lang in availableLanguages"
                :key="lang.code"
                :class="['widget-lang-option', { active: currentLang === lang.code }]"
                @click="changeLanguage(lang.code)"
              >
                <span>{{ lang.label }}</span>
                <svg
                  v-if="currentLang === lang.code"
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            </div>
          </div>
          <button class="widget-close" @click="closeWidget">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Step Indicator -->
      <div v-if="currentStep !== 'confirmation'" class="step-indicator">
        <template v-for="(step, index) in steps.slice(0, -1)" :key="step">
          <div
            v-if="index > 0"
            :class="['step-line', { completed: index <= currentStepIndex }]"
          ></div>
          <div
            :class="[
              'step-item',
              { active: index === currentStepIndex, completed: index < currentStepIndex }
            ]"
          >
            <div class="step-dot"></div>
            <span class="step-label">{{ stepLabels[step] }}</span>
          </div>
        </template>
      </div>

      <!-- Content -->
      <div class="widget-content">
        <component :is="currentView" />
      </div>

      <!-- Footer -->
      <div v-if="showPoweredBy" class="widget-footer">
        {{ t('footer.poweredBy') }}
        <a href="https://maxirez.com" target="_blank" rel="noopener">MaxiRez</a>
      </div>
    </div>
  </div>

  <!-- Inline Mode -->
  <div v-if="mode === 'inline'" :class="['widget-container', 'inline', { dark: theme === 'dark' }]">
    <div class="widget-content">
      <component :is="currentView" />
    </div>
    <div v-if="showPoweredBy" class="widget-footer">
      {{ t('footer.poweredBy') }}
      <a href="https://maxirez.com" target="_blank" rel="noopener">MaxiRez</a>
    </div>
  </div>

  <!-- Fullpage Mode -->
  <div v-if="mode === 'fullpage'" :class="['widget-fullpage', { dark: theme === 'dark' }]">
    <div class="widget-container fullpage">
      <div class="widget-header">
        <div class="widget-header-left">
          <img v-if="hotelLogo" :src="hotelLogo" :alt="hotelName" class="widget-logo" />
          <div class="widget-hotel-info">
            <span class="widget-hotel-name">{{ hotelName }}</span>
            <div v-if="hotelStars > 0" class="widget-hotel-stars">
              <svg
                v-for="i in hotelStars"
                :key="i"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div class="widget-header-actions">
          <div class="widget-lang-selector">
            <button class="widget-lang-btn" @click="toggleLangDropdown">
              <span class="widget-lang-code">{{ currentLang.toUpperCase() }}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div v-if="langDropdownOpen" class="widget-lang-dropdown">
              <button
                v-for="lang in availableLanguages"
                :key="lang.code"
                :class="['widget-lang-option', { active: currentLang === lang.code }]"
                @click="changeLanguage(lang.code)"
              >
                <span>{{ lang.label }}</span>
                <svg
                  v-if="currentLang === lang.code"
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="currentStep !== 'confirmation'" class="step-indicator">
        <template v-for="(step, index) in steps.slice(0, -1)" :key="step">
          <div
            v-if="index > 0"
            :class="['step-line', { completed: index <= currentStepIndex }]"
          ></div>
          <div
            :class="[
              'step-item',
              { active: index === currentStepIndex, completed: index < currentStepIndex }
            ]"
          >
            <div class="step-dot"></div>
            <span class="step-label">{{ stepLabels[step] }}</span>
          </div>
        </template>
      </div>
      <div class="widget-content">
        <component :is="currentView" />
      </div>
      <div v-if="showPoweredBy" class="widget-footer">
        {{ t('footer.poweredBy') }}
        <a href="https://maxirez.com" target="_blank" rel="noopener">MaxiRez</a>
      </div>
    </div>
  </div>
</template>

<!-- All styles in widget.css for Shadow DOM compatibility -->
