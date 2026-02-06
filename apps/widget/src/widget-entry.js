/**
 * MaxiRez Booking Widget Entry Point
 * Embeddable booking widget for hotel websites
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useWidgetStore } from './stores/widget'

// Import CSS as string for shadow DOM injection
import widgetStyles from './styles/widget.css?inline'

// Default API URL based on environment
const getDefaultApiUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host.includes('mini.com') || host === 'localhost') {
      return 'https://api.mini.com/api'
    }
  }
  return 'https://api.maxirez.com/api'
}

/**
 * Create and mount widget instance
 * @param {Object} config - Widget configuration
 */
export async function createWidget(config = {}) {
  const {
    hotelCode,
    partnerId,
    mode = 'floating',
    theme = 'light',
    primaryColor = '#6366f1',
    language = 'tr',
    containerId,
    apiUrl = getDefaultApiUrl(),
    position = 'bottom-right'
  } = config

  if (!hotelCode) {
    console.error('[MaxiResWidget] Hotel code is required')
    return null
  }

  // Remove existing widget if any
  const existingHost = document.getElementById('maxirez-widget-root')
  if (existingHost) {
    existingHost.remove()
  }

  // Create host element
  const hostElement = document.createElement('div')
  hostElement.id = 'maxirez-widget-root'
  document.body.appendChild(hostElement)

  // Create shadow root for style isolation
  const shadowRoot = hostElement.attachShadow({ mode: 'open' })

  // Inject styles with CSS custom properties
  const styleElement = document.createElement('style')
  styleElement.textContent = widgetStyles.replace(
    '--primary: #6366f1',
    `--primary: ${primaryColor}`
  ).replace(
    '--primary-hover: #4f46e5',
    `--primary-hover: ${adjustColor(primaryColor, -15)}`
  ).replace(
    '--primary-light: #e0e7ff',
    `--primary-light: ${adjustColor(primaryColor, 90)}`
  )
  shadowRoot.appendChild(styleElement)

  // Create mount point
  const mountPoint = document.createElement('div')
  mountPoint.id = 'widget-app'
  if (theme === 'dark') {
    mountPoint.classList.add('dark')
  }
  shadowRoot.appendChild(mountPoint)

  // Create Vue app
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // Mount app
  app.mount(mountPoint)

  // Initialize store
  const widgetStore = useWidgetStore()
  await widgetStore.initialize({
    hotelCode,
    partnerId,
    mode,
    theme,
    primaryColor,
    language,
    containerId,
    apiUrl,
    position
  })

  // Create public API
  const widgetApi = {
    open: () => widgetStore.openWidget(),
    close: () => widgetStore.closeWidget(),
    toggle: () => widgetStore.isOpen ? widgetStore.closeWidget() : widgetStore.openWidget(),
    setDates: (checkIn, checkOut) => widgetStore.setDates(checkIn, checkOut),
    setGuests: (adults, children) => widgetStore.setGuests(adults, children),
    getConfig: () => ({ ...widgetStore.config }),
    destroy: () => {
      app.unmount()
      hostElement.remove()
      delete window.MaxiResWidget
    }
  }

  // Expose to window
  window.MaxiResWidget = widgetApi

  console.log('[MaxiResWidget] Initialized for', hotelCode)
  return widgetApi
}

/**
 * Adjust color brightness
 * @param {string} hex - Hex color
 * @param {number} percent - Percent to adjust (-100 to 100)
 */
function adjustColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

/**
 * Auto-initialize from script tag
 */
function autoInit() {
  const script = document.currentScript || document.querySelector('script[data-hotel]')
  if (!script) return

  const config = {
    hotelCode: script.dataset.hotel,
    partnerId: script.dataset.partner,
    mode: script.dataset.mode || 'floating',
    theme: script.dataset.theme || 'light',
    primaryColor: script.dataset.primaryColor || script.dataset.color || '#6366f1',
    language: script.dataset.language || script.dataset.lang || 'tr',
    containerId: script.dataset.container,
    apiUrl: script.dataset.apiUrl || script.dataset.api,
    position: script.dataset.position || 'bottom-right'
  }

  if (config.hotelCode) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => createWidget(config))
    } else {
      createWidget(config)
    }
  }
}

// Auto-init
if (typeof document !== 'undefined') {
  autoInit()
}

export default { createWidget }
