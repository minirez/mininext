/**
 * Widget Translation Composable
 * Simple i18n for the booking widget.
 *
 * Usage:
 *   const { t } = useTranslation()
 *   t('search.searchButton')        -> 'Oda Ara'
 *   t('results.unavailable.minStay', { nights: 3 }) -> 'Bu odada en az 3 gece kalmalisiniz'
 */
import { ref, computed } from 'vue'
import tr from '../locales/tr.js'
import en from '../locales/en.js'

const locales = { tr, en }
const currentLocale = ref('tr')

/**
 * Set the active locale
 * @param {string} locale - 'tr' or 'en'
 */
export function setLocale(locale) {
  if (locales[locale]) {
    currentLocale.value = locale
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
 * @param {string} code - Locale code (e.g. 'de')
 * @param {object} messages - Translation messages
 */
export function registerLocale(code, messages) {
  locales[code] = messages
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
    const messages = locales[currentLocale.value] || locales.tr
    const value = getNestedValue(messages, key)
    if (value === undefined) {
      // Fallback to Turkish
      const fallback = getNestedValue(locales.tr, key)
      if (fallback === undefined) return key
      return typeof fallback === 'string' ? interpolate(fallback, params) : fallback
    }
    return typeof value === 'string' ? interpolate(value, params) : value
  }

  return {
    t,
    locale,
    setLocale,
    getLocale
  }
}
