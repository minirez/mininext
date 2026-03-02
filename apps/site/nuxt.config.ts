import tailwindcss from '@tailwindcss/vite'

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
      alias: {
        '@intlify/core-base': '/var/www/mini/booking-engine/node_modules/.pnpm/@intlify+core-base@10.0.8/node_modules/@intlify/core-base/dist/core-base.mjs',
        '@intlify/shared': '/var/www/mini/booking-engine/node_modules/.pnpm/@intlify+shared@10.0.8/node_modules/@intlify/shared/dist/shared.mjs',
        '@intlify/message-compiler': '/var/www/mini/booking-engine/node_modules/.pnpm/@intlify+message-compiler@10.0.8/node_modules/@intlify/message-compiler/dist/message-compiler.mjs',
      },
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
    alias: {
      '@intlify/core-base': '/var/www/mini/booking-engine/node_modules/.pnpm/@intlify+core-base@10.0.8/node_modules/@intlify/core-base/dist/core-base.mjs',
      '@intlify/shared': '/var/www/mini/booking-engine/node_modules/.pnpm/@intlify+shared@10.0.8/node_modules/@intlify/shared/dist/shared.mjs',
      '@intlify/message-compiler': '/var/www/mini/booking-engine/node_modules/.pnpm/@intlify+message-compiler@10.0.8/node_modules/@intlify/message-compiler/dist/message-compiler.mjs',
    },
    externals: {
      inline: ['vue-i18n', '@intlify/core-base', '@intlify/shared', '@intlify/message-compiler'],
    },
  },
})
