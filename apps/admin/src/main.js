import './assets/tailwind.css' // Import Tailwind CSS
import './assets/themesLive.css' // Admin theme variables

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'
import i18n, { initI18n } from './plugins/i18n'

// Initialize app with async locale loading
async function initApp() {
  // Load locale messages before mounting
  await initI18n()

  const app = createApp(App)

  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.use(i18n)

  // Initialize theme engine early (before mount)
  const { useThemeStore } = await import('@/stores/theme')
  const themeStore = useThemeStore()
  await themeStore.initializeTheme()

  // Expose router globally for service worker message handling
  window.__vueRouter = router
  app.use(Toast, {
    position: 'bottom-right',
    timeout: 5000,
    closeOnClick: false, // Toast'a tıklayınca bildirime gidilecek
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: true,
    hideProgressBar: false,
    closeButton: 'button',
    icon: true,
    rtl: false,
    newestOnTop: true,
    maxToasts: 1, // Sadece 1 toast göster
    filterBeforeCreate: (toast, toasts) => {
      // Aynı mesajlı toast'ları filtrele
      if (toasts.filter(t => t.content === toast.content).length !== 0) {
        return false
      }
      return toast
    },
    toastClassName: 'cursor-pointer'
  })

  app.mount('#app')

  // Twemoji parsing for Windows flag emoji support
  const parseEmojis = () => {
    if (window.twemoji) {
      window.twemoji.parse(document.body, {
        folder: 'svg',
        ext: '.svg',
        className: 'twemoji'
      })
    }
  }

  // Parse emojis after initial render and on route changes
  router.afterEach(() => {
    setTimeout(parseEmojis, 100)
  })

  // Initial parse
  setTimeout(parseEmojis, 500)
}

// Start the application
initApp()
