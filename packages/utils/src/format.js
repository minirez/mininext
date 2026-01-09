/**
 * @module @booking-engine/utils/format
 * @description Formatting utilities for display purposes.
 * Provides currency, phone number, percentage, and other formatting functions.
 */

/**
 * Format number as currency string using Intl.NumberFormat
 * @param {number} amount - Amount to format
 * @param {string} [currency='EUR'] - ISO 4217 currency code
 * @param {string} [locale='tr-TR'] - BCP 47 locale code
 * @returns {string} Formatted currency string, or empty string if invalid
 * @example
 * formatCurrency(1250.50, 'EUR', 'tr-TR') // '€1.250,50'
 * formatCurrency(1250, 'TRY', 'tr-TR') // '₺1.250'
 * formatCurrency(1250.50, 'USD', 'en-US') // '$1,250.50'
 */
export const formatCurrency = (amount, currency = 'EUR', locale = 'tr-TR') => {
  if (amount == null || isNaN(amount)) return ''
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format number with locale-specific formatting
 * @param {number} num - Number to format
 * @param {string} [locale='tr-TR'] - BCP 47 locale code
 * @param {Intl.NumberFormatOptions} [options={}] - Additional formatting options
 * @returns {string} Formatted number string, or empty string if invalid
 * @example
 * formatNumber(1250.5, 'tr-TR') // '1.250,5'
 * formatNumber(1250.5, 'en-US') // '1,250.5'
 * formatNumber(0.25, 'tr-TR', { style: 'percent' }) // '%25'
 */
export const formatNumber = (num, locale = 'tr-TR', options = {}) => {
  if (num == null || isNaN(num)) return ''
  return new Intl.NumberFormat(locale, options).format(num)
}

/**
 * Format value as percentage string
 * @param {number} value - Value to format
 * @param {number} [decimals=0] - Number of decimal places
 * @param {boolean} [isDecimal=false] - If true, value is 0-1 range; if false, 0-100 range
 * @returns {string} Formatted percentage string with % symbol, or empty string if invalid
 * @example
 * formatPercent(25) // '25%'
 * formatPercent(25.5, 1) // '25.5%'
 * formatPercent(0.25, 0, true) // '25%'
 */
export const formatPercent = (value, decimals = 0, isDecimal = false) => {
  if (value == null || isNaN(value)) return ''
  const percent = isDecimal ? value * 100 : value
  return `${percent.toFixed(decimals)}%`
}

/**
 * Normalize phone number by removing all non-digit characters
 * @param {string} phone - Phone number to normalize
 * @returns {string} Phone number with only digits, or empty string if invalid
 * @example
 * normalizePhone('+90 (532) 123 45 67') // '905321234567'
 * normalizePhone('0532-123-4567') // '05321234567'
 */
export const normalizePhone = phone => {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

/**
 * Format Turkish phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number or original input if format not recognized
 * @example
 * formatPhone('5321234567') // '(532) 123 45 67'
 * formatPhone('05321234567') // '(532) 123 45 67'
 * formatPhone('905321234567') // '+90 (532) 123 45 67'
 */
export const formatPhone = phone => {
  const digits = normalizePhone(phone)

  // 10 digits: 5XX XXX XX XX
  if (digits.length === 10 && digits.startsWith('5')) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
  }

  // 11 digits with 0: (5XX) XXX XX XX
  if (digits.length === 11 && digits.startsWith('0')) {
    const d = digits.slice(1)
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
  }

  // 12 digits with 90: +90 (5XX) XXX XX XX
  if (digits.length === 12 && digits.startsWith('90')) {
    const d = digits.slice(2)
    return `+90 (${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
  }

  return phone
}

/**
 * Format phone number for SMS sending (E.164 format for Turkey)
 * @param {string} phone - Phone number to format
 * @returns {string} E.164 formatted phone number (digits only, starting with country code)
 * @example
 * formatPhoneForSMS('5321234567') // '905321234567'
 * formatPhoneForSMS('05321234567') // '905321234567'
 * formatPhoneForSMS('+90 532 123 45 67') // '905321234567'
 */
export const formatPhoneForSMS = phone => {
  const digits = normalizePhone(phone)

  if (digits.length === 12 && digits.startsWith('90')) {
    return digits
  }

  if (digits.length === 10 && digits.startsWith('5')) {
    return `90${digits}`
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return `90${digits.slice(1)}`
  }

  return digits
}

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} [maxLength=100] - Maximum length including ellipsis
 * @returns {string} Truncated text with '...' if exceeded, or original text if shorter
 * @example
 * truncate('This is a long text', 10) // 'This is...'
 * truncate('Short', 10) // 'Short'
 */
export const truncate = (text, maxLength = 100) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Format file size in bytes to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string with appropriate unit (B, KB, MB, GB)
 * @example
 * formatFileSize(0) // '0 B'
 * formatFileSize(1024) // '1.0 KB'
 * formatFileSize(1048576) // '1.0 MB'
 * formatFileSize(1073741824) // '1.0 GB'
 */
export const formatFileSize = bytes => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

/**
 * Mask sensitive data by showing only first and last characters
 * @param {string} text - Text to mask
 * @param {number} [visibleChars=2] - Number of characters to show at start and end
 * @returns {string} Masked text with asterisks in the middle
 * @example
 * mask('1234567890') // '12****90'
 * mask('1234567890', 3) // '123****890'
 * mask('AB') // '****' (too short to mask)
 * mask(null) // '****'
 */
export const mask = (text, visibleChars = 2) => {
  if (!text) return '****'
  if (text.length <= visibleChars * 2) return '****'
  return `${text.slice(0, visibleChars)}****${text.slice(-visibleChars)}`
}

/**
 * @typedef {Object} FormatUtils
 * @property {typeof formatCurrency} formatCurrency - Format as currency
 * @property {typeof formatNumber} formatNumber - Format number with locale
 * @property {typeof formatPercent} formatPercent - Format as percentage
 * @property {typeof normalizePhone} normalizePhone - Remove non-digits from phone
 * @property {typeof formatPhone} formatPhone - Format phone for display
 * @property {typeof formatPhoneForSMS} formatPhoneForSMS - Format phone for SMS
 * @property {typeof truncate} truncate - Truncate text with ellipsis
 * @property {typeof formatFileSize} formatFileSize - Format bytes as human-readable
 * @property {typeof mask} mask - Mask sensitive data
 */

/** @type {FormatUtils} */
export default {
  formatCurrency,
  formatNumber,
  formatPercent,
  normalizePhone,
  formatPhone,
  formatPhoneForSMS,
  truncate,
  formatFileSize,
  mask
}
