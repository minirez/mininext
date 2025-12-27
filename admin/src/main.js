import './assets/tailwind.css' // Import Tailwind CSS

import {createApp} from 'vue'
import {createPinia} from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'
import i18n from './plugins/i18n'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// Expose router globally for service worker message handling
window.__vueRouter = router
app.use(Toast, {
  position: 'bottom-right',
  timeout: 8000,
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
  maxToasts: 5,
  // Aşağıdan yukarıya doğru stack
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
