<script setup>
import { computed, watch } from 'vue'
import { useWidgetStore } from './stores/widget'
import { useTranslation, setLocale } from './composables/useTranslation'

// Views
import SearchView from './views/SearchView.vue'
import ResultsView from './views/ResultsView.vue'
import BookingView from './views/BookingView.vue'
import PaymentView from './views/PaymentView.vue'
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
const position = computed(() => widgetStore.config.position || 'bottom-right')

// View component mapping
const viewComponents = {
  search: SearchView,
  results: ResultsView,
  booking: BookingView,
  payment: PaymentView,
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
const currentStepIndex = computed(() => steps.indexOf(currentStep.value))

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
