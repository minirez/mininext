import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'

const require = createRequire(import.meta.url)
const intlifyAlias = {
  '@intlify/core-base': resolve(dirname(require.resolve('@intlify/core-base/package.json')), 'dist/core-base.mjs'),
  '@intlify/shared': resolve(dirname(require.resolve('@intlify/shared/package.json')), 'dist/shared.mjs'),
  '@intlify/message-compiler': resolve(dirname(require.resolve('@intlify/message-compiler/package.json')), 'dist/message-compiler.mjs'),
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  future: {
    compatibilityVersion: 4,
  },

  ssr: true,

  devServer: {
    host: '0.0.0.0',
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/image',
    '@nuxtjs/sitemap',
  ],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
    },
    resolve: {
      alias: intlifyAlias,
    },
    ssr: {
      noExternal: ['vue-i18n', '@intlify/core-base', '@intlify/shared', '@intlify/message-compiler'],
    },
  },

  runtimeConfig: {
    apiBaseUrl: 'http://localhost:4000',
    public: {
      apiBaseUrl: '/api',
      mapboxToken: '',
      sentryDsn: '',
    },
  },

  routeRules: {
    '/': { isr: 300 },
    '/hotels': { isr: 120 },
    '/hotels/**': { isr: 300 },
    '/destinations/**': { isr: 600 },
    '/page/**': { isr: 1800 },
    '/hotels/*/book': { isr: false },
    '/booking/**': { isr: false },
    '/search': { isr: false },
    '/payment/**': { isr: false },
    '/draftlive/**': {
      headers: {
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': 'frame-ancestors *',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
      isr: false,
    },
  },

  image: {
    domains: ['api.maxirez.com', 'localhost:4000'],
    format: ['webp', 'avif'],
  },

  i18n: {
    bundle: {
      optimizeTranslationDirective: false,
    },
    locales: [
      { code: 'tr', name: 'Türkçe', file: 'tr.json', dir: 'ltr' },
      { code: 'en', name: 'English', file: 'en.json', dir: 'ltr' },
      { code: 'de', name: 'Deutsch', file: 'de.json', dir: 'ltr' },
      { code: 'ru', name: 'Русский', file: 'ru.json', dir: 'ltr' },
      { code: 'ar', name: 'العربية', file: 'ar.json', dir: 'rtl' },
      { code: 'fr', name: 'Français', file: 'fr.json', dir: 'ltr' },
      { code: 'es', name: 'Español', file: 'es.json', dir: 'ltr' },
      { code: 'it', name: 'Italiano', file: 'it.json', dir: 'ltr' },
      { code: 'nl', name: 'Nederlands', file: 'nl.json', dir: 'ltr' },
      { code: 'pt', name: 'Português', file: 'pt.json', dir: 'ltr' },
      { code: 'ja', name: '日本語', file: 'ja.json', dir: 'ltr' },
      { code: 'ko', name: '한국어', file: 'ko.json', dir: 'ltr' },
      { code: 'zh', name: '中文', file: 'zh.json', dir: 'ltr' },
      { code: 'pl', name: 'Polski', file: 'pl.json', dir: 'ltr' },
      { code: 'uk', name: 'Українська', file: 'uk.json', dir: 'ltr' },
      { code: 'cs', name: 'Čeština', file: 'cs.json', dir: 'ltr' },
      { code: 'sv', name: 'Svenska', file: 'sv.json', dir: 'ltr' },
      { code: 'he', name: 'עברית', file: 'he.json', dir: 'rtl' },
      { code: 'fa', name: 'فارسی', file: 'fa.json', dir: 'rtl' },
      { code: 'ro', name: 'Română', file: 'ro.json', dir: 'ltr' },
    ],
    defaultLocale: 'tr',
    strategy: 'prefix_except_default',
    lazy: false,
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_lang',
      fallbackLocale: 'tr',
    },
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },

  devtools: { enabled: true },

  nitro: {
    compressPublicAssets: true,
    alias: intlifyAlias,
    externals: {
      inline: [
        'vue-i18n', '@intlify/core-base', '@intlify/shared', '@intlify/message-compiler',
        'vue', '@vue/server-renderer', '@vue/runtime-core', '@vue/runtime-dom',
        '@vue/compiler-dom', '@vue/compiler-core', '@vue/shared', '@vue/reactivity',
      ],
    },
  },
})
