/**
 * Widget Translation Composable
 * Simple i18n for the booking widget with lazy locale loading.
 *
 * Usage:
 *   const { t } = useTranslation()
 *   t('search.searchButton')        -> 'Search Rooms'
 *   t('results.unavailable.minStay', { nights: 3 }) -> 'Minimum stay of 3 nights required'
 */
import { ref, computed } from 'vue'

// Only bundle TR and EN statically (most used), lazy-load the rest
import tr from '../locales/tr.js'
import en from '../locales/en.js'

const locales = { tr, en }
const currentLocale = ref('en')
const isLoading = ref(false)

// Dynamic locale loaders - only imported when needed
const localeLoaders = {
  ru: () => import('../locales/ru.js'),
  el: () => import('../locales/el.js'),
  de: () => import('../locales/de.js'),
  es: () => import('../locales/es.js'),
  it: () => import('../locales/it.js'),
  fr: () => import('../locales/fr.js'),
  ro: () => import('../locales/ro.js'),
  bg: () => import('../locales/bg.js'),
  pt: () => import('../locales/pt.js'),
  da: () => import('../locales/da.js'),
  zh: () => import('../locales/zh.js'),
  ar: () => import('../locales/ar.js'),
  fa: () => import('../locales/fa.js'),
  he: () => import('../locales/he.js'),
  sq: () => import('../locales/sq.js'),
  uk: () => import('../locales/uk.js'),
  pl: () => import('../locales/pl.js'),
  az: () => import('../locales/az.js')
}

/**
 * Set the active locale. Loads locale dynamically if not bundled.
 * @param {string} locale - Language code (e.g. 'en', 'de', 'fr')
 */
export async function setLocale(locale) {
  // Already loaded
  if (locales[locale]) {
    currentLocale.value = locale
    return
  }

  // Lazy load
  const loader = localeLoaders[locale]
  if (loader) {
    isLoading.value = true
    try {
      const mod = await loader()
      locales[locale] = mod.default
      currentLocale.value = locale
    } catch {
      // Fallback to English on load failure
      currentLocale.value = 'en'
    } finally {
      isLoading.value = false
    }
  }
}

/**
 * Get the current locale code
 */
export function getLocale() {
  return currentLocale.value
}

/**
 * Register a custom locale
 * @param {string} code - Locale code (e.g. 'ja')
 * @param {object} messages - Translation messages
 */
export function registerLocale(code, messages) {
  locales[code] = messages
}

/**
 * Check if a locale is available (bundled or loadable)
 * @param {string} code - Locale code
 * @returns {boolean}
 */
export function isLocaleAvailable(code) {
  return !!(locales[code] || localeLoaders[code])
}

/**
 * Get a nested value from an object by dot-separated path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

/**
 * Interpolate {placeholders} in a string
 */
function interpolate(str, params) {
  if (!params || typeof str !== 'string') return str
  return str.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`)
}

export function useTranslation() {
  const locale = computed(() => currentLocale.value)

  /**
   * Translate a key with optional interpolation params
   * @param {string} key - Dot-separated key (e.g. 'search.searchButton')
   * @param {object} [params] - Interpolation values
   * @returns {string|Array|any} Translated value or the key if not found
   */
  function t(key, params) {
    const messages = locales[currentLocale.value] || locales.en
    const value = getNestedValue(messages, key)
    if (value === undefined) {
      // Fallback to English
      const fallback = getNestedValue(locales.en, key)
      if (fallback === undefined) return key
      return typeof fallback === 'string' ? interpolate(fallback, params) : fallback
    }
    return typeof value === 'string' ? interpolate(value, params) : value
  }

  return {
    t,
    locale,
    isLoading,
    setLocale,
    getLocale
  }
}
