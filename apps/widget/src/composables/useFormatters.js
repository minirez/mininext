/**
 * Formatting composable for widget
 * Provides currency and date formatting functions
 */

import { computed } from 'vue'
import { useWidgetStore } from '../stores/widget'

export function useFormatters() {
  const widgetStore = useWidgetStore()

  const locale = computed(() => {
    const lang = widgetStore.config.language || 'tr'
    const localeMap = {
      tr: 'tr-TR',
      en: 'en-US',
      de: 'de-DE',
      fr: 'fr-FR',
      es: 'es-ES',
      ru: 'ru-RU',
      ar: 'ar-SA'
    }
    return localeMap[lang] || 'tr-TR'
  })

  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (defaults to search currency)
   */
  function formatCurrency(amount, currency = null) {
    const curr = currency || widgetStore.searchResults?.search?.currency ||
                 widgetStore.selectedOption?.pricing?.currency ||
                 widgetStore.booking?.pricing?.currency || 'TRY'

    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: curr
    }).format(amount || 0)
  }

  /**
   * Format date - short format (day month)
   * @param {string|Date} dateStr - Date to format
   */
  function formatDateShort(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale.value, {
      day: 'numeric',
      month: 'short'
    })
  }

  /**
   * Format date - medium format (weekday, day month)
   * @param {string|Date} dateStr - Date to format
   */
  function formatDateMedium(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale.value, {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  /**
   * Format date - long format (weekday, day month year)
   * @param {string|Date} dateStr - Date to format
   */
  function formatDateLong(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return {
    locale,
    formatCurrency,
    formatDateShort,
    formatDateMedium,
    formatDateLong
  }
}
