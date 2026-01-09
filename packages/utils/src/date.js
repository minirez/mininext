/**
 * @module @booking-engine/utils/date
 * @description Date manipulation utilities for booking engine applications.
 * Provides common date formatting, calculation, and validation functions.
 */

/**
 * Format date as ISO date string (YYYY-MM-DD)
 * @param {Date|string|number} date - Date to format (Date object, ISO string, or timestamp)
 * @returns {string} Formatted date string in YYYY-MM-DD format, or empty string if invalid
 * @example
 * formatDate(new Date('2024-06-15')) // '2024-06-15'
 * formatDate('2024-06-15T14:30:00Z') // '2024-06-15'
 * formatDate(null) // ''
 */
export const formatDate = date => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

/**
 * Format date as localized string using Intl.DateTimeFormat
 * @param {Date|string|number} date - Date to format
 * @param {string} [locale='tr-TR'] - BCP 47 locale code
 * @param {Intl.DateTimeFormatOptions} [options={}] - Additional formatting options
 * @returns {string} Localized date string, or empty string if invalid
 * @example
 * formatDateLocale('2024-06-15', 'tr-TR') // '15 Haziran 2024'
 * formatDateLocale('2024-06-15', 'en-US') // 'June 15, 2024'
 * formatDateLocale('2024-06-15', 'tr-TR', { month: 'short' }) // '15 Haz 2024'
 */
export const formatDateLocale = (date, locale = 'tr-TR', options = {}) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const defaultOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return d.toLocaleDateString(locale, { ...defaultOptions, ...options })
}

/**
 * Calculate number of nights between check-in and check-out dates
 * @param {Date|string} checkIn - Check-in date
 * @param {Date|string} checkOut - Check-out date
 * @returns {number} Number of nights (0 if dates are invalid or same)
 * @example
 * getNights('2024-06-15', '2024-06-18') // 3
 * getNights('2024-06-15', '2024-06-15') // 0
 */
export const getNights = (checkIn, checkOut) => {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
  const diffTime = end.getTime() - start.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

/**
 * Generate array of date strings between start and end dates (exclusive of end date)
 * @param {Date|string} startDate - Start date (inclusive)
 * @param {Date|string} endDate - End date (exclusive)
 * @returns {string[]} Array of date strings in YYYY-MM-DD format
 * @example
 * getDateRange('2024-06-15', '2024-06-18')
 * // ['2024-06-15', '2024-06-16', '2024-06-17']
 */
export const getDateRange = (startDate, endDate) => {
  const dates = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return []

  const current = new Date(start)
  while (current < end) {
    dates.push(formatDate(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

/**
 * Add or subtract days from a date
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to add (negative to subtract)
 * @returns {Date} New Date object
 * @example
 * addDays('2024-06-15', 5) // Date object for 2024-06-20
 * addDays('2024-06-15', -3) // Date object for 2024-06-12
 */
export const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Check if a date is in the past (before today)
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is before today (midnight)
 * @example
 * isPastDate('2020-01-01') // true
 * isPastDate('2030-01-01') // false
 */
export const isPastDate = date => {
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

/**
 * Check if a date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 * @example
 * isToday(new Date()) // true
 * isToday('2020-01-01') // false (unless today is 2020-01-01)
 */
export const isToday = date => {
  const d = new Date(date)
  const today = new Date()
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

/**
 * Get start of day (00:00:00.000)
 * @param {Date|string} date - Date to process
 * @returns {Date} Date object set to start of day
 * @example
 * startOfDay('2024-06-15T14:30:00')
 * // Date object: 2024-06-15T00:00:00.000
 */
export const startOfDay = date => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of day (23:59:59.999)
 * @param {Date|string} date - Date to process
 * @returns {Date} Date object set to end of day
 * @example
 * endOfDay('2024-06-15T14:30:00')
 * // Date object: 2024-06-15T23:59:59.999
 */
export const endOfDay = date => {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * @typedef {Object} DateUtils
 * @property {typeof formatDate} formatDate - Format date as YYYY-MM-DD
 * @property {typeof formatDateLocale} formatDateLocale - Format date with locale
 * @property {typeof getNights} getNights - Calculate nights between dates
 * @property {typeof getDateRange} getDateRange - Get array of dates
 * @property {typeof addDays} addDays - Add days to date
 * @property {typeof isPastDate} isPastDate - Check if date is past
 * @property {typeof isToday} isToday - Check if date is today
 * @property {typeof startOfDay} startOfDay - Get start of day
 * @property {typeof endOfDay} endOfDay - Get end of day
 */

/** @type {DateUtils} */
export default {
  formatDate,
  formatDateLocale,
  getNights,
  getDateRange,
  addDays,
  isPastDate,
  isToday,
  startOfDay,
  endOfDay
}
