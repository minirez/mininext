/**
 * B2C Widget Entry Point
 *
 * This file is the entry point for the embeddable booking widget.
 * It creates an isolated Vue app inside a Shadow DOM for CSS isolation.
 *
 * Usage:
 * <script src="https://widget.maxirez.com/widget.js" data-hotel="hotelCode" data-partner="partnerId"></script>
 *
 * Options (data attributes):
 * - data-hotel: Hotel code/slug (required)
 * - data-partner: Partner ID (required for partner hotels)
 * - data-mode: 'floating' | 'inline' | 'fullpage' (default: 'floating')
 * - data-theme: 'light' | 'dark' | 'auto' (default: 'light')
 * - data-primary-color: Hex color (default: '#7c3aed')
 * - data-language: Language code (default: auto-detect from browser)
 * - data-container: Container element ID for inline mode
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

import WidgetApp from './modules/widget/WidgetApp.vue'
import { createWidgetRouter } from './modules/widget/router'

// Import styles as inline string for Shadow DOM injection
import widgetStyles from './modules/widget/styles/widget.css?inline'

// Get configuration from script tag or container
function getConfig() {
  // Try to get config from current script
  const script = document.currentScript

  // Or from container element
  const container = document.getElementById('maxirez-widget')

  const source = script || container

  if (!source) {
    console.error('[MaxiRez Widget] No configuration found. Use data-hotel attribute.')
    return null
  }

  const config = {
    hotelCode: source.dataset.hotel,
    partnerId: source.dataset.partner || null,
    mode: source.dataset.mode || 'floating',
    theme: source.dataset.theme || 'light',
    primaryColor: source.dataset.primaryColor || '#7c3aed',
    language: source.dataset.language || navigator.language?.split('-')[0] || 'en',
    containerId: source.dataset.container || 'maxirez-widget'
  }

  if (!config.hotelCode) {
    console.error('[MaxiRez Widget] data-hotel attribute is required.')
    return null
  }

  // Partner ID is recommended for partner hotels to ensure correct hotel-partner association
  if (!config.partnerId) {
    console.warn('[MaxiRez Widget] data-partner attribute is recommended for partner hotels.')
  }

  return config
}

// Lazy load locale messages
async function loadLocaleMessages(locale) {
  try {
    const messages = await import(`./locales/${locale}/index.js`)
    return messages.default
  } catch (e) {
    console.warn(`[MaxiRez Widget] Locale ${locale} not found, falling back to English`)
    const fallback = await import('./locales/en/index.js')
    return fallback.default
  }
}

// Create and mount widget
async function createWidget(config) {
  // Create mount point
  let mountPoint
  let shadowRoot

  if (config.mode === 'inline') {
    // Inline mode: use container or create one
    let container = document.getElementById(config.containerId)
    if (!container) {
      container = document.createElement('div')
      container.id = config.containerId
      document.body.appendChild(container)
    }

    // Use Shadow DOM for style isolation
    shadowRoot = container.attachShadow({ mode: 'open' })
    mountPoint = document.createElement('div')
    mountPoint.id = 'widget-root'
    shadowRoot.appendChild(mountPoint)
  } else {
    // Floating/Fullpage mode: append to body
    const host = document.createElement('div')
    host.id = 'maxirez-widget-host'
    document.body.appendChild(host)

    shadowRoot = host.attachShadow({ mode: 'open' })
    mountPoint = document.createElement('div')
    mountPoint.id = 'widget-root'
    shadowRoot.appendChild(mountPoint)
  }

  // Inject styles into shadow DOM as inline style (required for Shadow DOM)
  const styleEl = document.createElement('style')
  styleEl.textContent = widgetStyles
  shadowRoot.prepend(styleEl)

  // Load locale messages
  const messages = {
    en: await loadLocaleMessages('en')
  }

  if (config.language !== 'en') {
    messages[config.language] = await loadLocaleMessages(config.language)
  }

  // Create Vue app
  const app = createApp(WidgetApp, {
    hotelCode: config.hotelCode,
    partnerId: config.partnerId,
    mode: config.mode,
    theme: config.theme,
    primaryColor: config.primaryColor,
    language: config.language
  })

  // Install plugins
  app.use(createPinia())
  app.use(createWidgetRouter())
  app.use(createI18n({
    legacy: false,
    locale: config.language,
    fallbackLocale: 'en',
    messages,
    silentTranslationWarn: true,
    silentFallbackWarn: true
  }))

  // Mount app
  app.mount(mountPoint)

  // Expose API for external control
  window.MaxiResWidget = {
    open: () => {
      const store = app.config.globalProperties.$pinia.state.value.widget
      if (store) store.isOpen = true
    },
    close: () => {
      const store = app.config.globalProperties.$pinia.state.value.widget
      if (store) store.isOpen = false
    },
    setDates: (checkIn, checkOut) => {
      const store = app.config.globalProperties.$pinia.state.value.widget
      if (store) {
        store.search.checkIn = checkIn
        store.search.checkOut = checkOut
      }
    }
  }

  return app
}

// Load Inter font at document level
function loadGlobalFonts() {
  // Check if already loaded
  if (document.querySelector('link[href*="Inter"]')) return

  // Inter font for widget text
  const fontLink = document.createElement('link')
  fontLink.rel = 'stylesheet'
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  document.head.appendChild(fontLink)
}

// Initialize on DOM ready
function init() {
  loadGlobalFonts()
  const config = getConfig()
  if (config) {
    createWidget(config)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

// Export for programmatic usage
export { createWidget, getConfig }
