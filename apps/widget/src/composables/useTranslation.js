/**
 * Widget Translation Composable
 * Simple i18n for the booking widget.
 *
 * Usage:
 *   const { t } = useTranslation()
 *   t('search.searchButton')        -> 'Search Rooms'
 *   t('results.unavailable.minStay', { nights: 3 }) -> 'Minimum stay of 3 nights required'
 */
import { ref, computed } from 'vue'
import tr from '../locales/tr.js'
import en from '../locales/en.js'
import ru from '../locales/ru.js'
import el from '../locales/el.js'
import de from '../locales/de.js'
import es from '../locales/es.js'
import it from '../locales/it.js'
import fr from '../locales/fr.js'
import ro from '../locales/ro.js'
import bg from '../locales/bg.js'
import pt from '../locales/pt.js'
import da from '../locales/da.js'
import zh from '../locales/zh.js'
import ar from '../locales/ar.js'
import fa from '../locales/fa.js'
import he from '../locales/he.js'
import sq from '../locales/sq.js'
import uk from '../locales/uk.js'
import pl from '../locales/pl.js'
import az from '../locales/az.js'

const locales = { tr, en, ru, el, de, es, it, fr, ro, bg, pt, da, zh, ar, fa, he, sq, uk, pl, az }
const currentLocale = ref('en')

/**
 * Set the active locale
 * @param {string} locale - Language code (e.g. 'en', 'de', 'fr')
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
 * @param {string} code - Locale code (e.g. 'ja')
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
    setLocale,
    getLocale
  }
}
