/**
 * @module @booking-engine/utils/string
 * @description String manipulation utilities for booking engine applications.
 * Provides text formatting, transformation, and generation functions.
 */

/**
 * Capitalize first letter of string, lowercase the rest
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string, or empty string if invalid
 * @example
 * capitalize('hello') // 'Hello'
 * capitalize('HELLO') // 'Hello'
 * capitalize('') // ''
 */
export const capitalize = str => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Capitalize first letter of each word (title case)
 * @param {string} str - String to convert
 * @returns {string} Title cased string, or empty string if invalid
 * @example
 * titleCase('hello world') // 'Hello World'
 * titleCase('HELLO WORLD') // 'Hello World'
 */
export const titleCase = str => {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Convert string to URL-friendly slug
 * @param {string} str - String to slugify
 * @returns {string} URL-friendly slug (lowercase, hyphenated)
 * @example
 * slugify('Hello World') // 'hello-world'
 * slugify('Test & Demo!') // 'test-demo'
 * slugify('  Multiple   Spaces  ') // 'multiple-spaces'
 */
export const slugify = str => {
  if (!str) return ''
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Convert camelCase string to kebab-case
 * @param {string} str - camelCase string
 * @returns {string} kebab-case string
 * @example
 * camelToKebab('helloWorld') // 'hello-world'
 * camelToKebab('myTestFunction') // 'my-test-function'
 * camelToKebab('XMLParser') // 'x-m-l-parser'
 */
export const camelToKebab = str => {
  if (!str) return ''
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Convert kebab-case string to camelCase
 * @param {string} str - kebab-case string
 * @returns {string} camelCase string
 * @example
 * kebabToCamel('hello-world') // 'helloWorld'
 * kebabToCamel('my-test-function') // 'myTestFunction'
 */
export const kebabToCamel = str => {
  if (!str) return ''
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Remove diacritics (accents) from string
 * Useful for search normalization
 * @param {string} str - String with diacritics
 * @returns {string} String without diacritics
 * @example
 * removeDiacritics('café') // 'cafe'
 * removeDiacritics('über') // 'uber'
 * removeDiacritics('İstanbul') // 'Istanbul'
 */
export const removeDiacritics = str => {
  if (!str) return ''
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Character set options for random string generation
 * @typedef {'alphanumeric'|'alphabetic'|'numeric'|'hex'} CharsetType
 */

/**
 * Generate random string of specified length
 * @param {number} [length=8] - Length of string to generate
 * @param {CharsetType|string} [charset='alphanumeric'] - Preset charset name or custom characters
 * @returns {string} Random string
 * @example
 * randomString(10) // 'Ab3xK9mPqR' (example)
 * randomString(6, 'numeric') // '384729' (example)
 * randomString(8, 'hex') // 'A3F8B2C1' (example)
 * randomString(4, 'ABC') // 'BCAB' (example, custom charset)
 */
export const randomString = (length = 8, charset = 'alphanumeric') => {
  const charsets = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    alphabetic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    numeric: '0123456789',
    hex: '0123456789ABCDEF'
  }
  const chars = charsets[charset] || charset
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} HTML-escaped string
 * @example
 * escapeHtml('<script>alert(1)</script>') // '&lt;script&gt;alert(1)&lt;/script&gt;'
 * escapeHtml('"test"') // '&quot;test&quot;'
 * escapeHtml("it's") // 'it&#39;s'
 */
export const escapeHtml = str => {
  if (!str) return ''
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return str.replace(/[&<>"']/g, char => entities[char])
}

/**
 * Strip all HTML tags from string
 * @param {string} html - HTML string
 * @returns {string} Plain text without HTML tags
 * @example
 * stripHtml('<p>Hello</p>') // 'Hello'
 * stripHtml('<b>Bold</b> text') // 'Bold text'
 * stripHtml('<a href="#">Link</a>') // 'Link'
 */
export const stripHtml = html => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Check if string is empty or contains only whitespace
 * @param {string} str - String to check
 * @returns {boolean} True if string is empty, null, undefined, or whitespace only
 * @example
 * isEmpty('') // true
 * isEmpty('   ') // true
 * isEmpty(null) // true
 * isEmpty('hello') // false
 */
export const isEmpty = str => {
  return !str || str.trim().length === 0
}

/**
 * Pad string to specified length
 * @param {string|number} value - Value to pad
 * @param {number} length - Target length
 * @param {string} [char='0'] - Padding character
 * @param {'start'|'end'} [position='start'] - Position to add padding
 * @returns {string} Padded string
 * @example
 * pad(5, 3) // '005'
 * pad('a', 4, 'x') // 'xxxa'
 * pad('a', 4, 'x', 'end') // 'axxx'
 * pad(123, 3) // '123' (no padding needed)
 */
export const pad = (value, length, char = '0', position = 'start') => {
  const str = String(value)
  if (str.length >= length) return str
  const padding = char.repeat(length - str.length)
  return position === 'start' ? padding + str : str + padding
}

/**
 * Generate initials from full name
 * @param {string} name - Full name
 * @param {number} [count=2] - Maximum number of initials
 * @returns {string} Uppercase initials
 * @example
 * getInitials('John Doe') // 'JD'
 * getInitials('John Michael Doe') // 'JM'
 * getInitials('John Michael Doe', 3) // 'JMD'
 * getInitials('John') // 'J'
 * getInitials('') // ''
 */
export const getInitials = (name, count = 2) => {
  if (!name) return ''
  const words = name.trim().split(/\s+/)
  return words
    .slice(0, count)
    .map(w => w.charAt(0).toUpperCase())
    .join('')
}

/**
 * @typedef {Object} StringUtils
 * @property {typeof capitalize} capitalize - Capitalize first letter
 * @property {typeof titleCase} titleCase - Title case string
 * @property {typeof slugify} slugify - Create URL slug
 * @property {typeof camelToKebab} camelToKebab - Convert to kebab-case
 * @property {typeof kebabToCamel} kebabToCamel - Convert to camelCase
 * @property {typeof removeDiacritics} removeDiacritics - Remove accents
 * @property {typeof randomString} randomString - Generate random string
 * @property {typeof escapeHtml} escapeHtml - Escape HTML characters
 * @property {typeof stripHtml} stripHtml - Remove HTML tags
 * @property {typeof isEmpty} isEmpty - Check if empty/whitespace
 * @property {typeof pad} pad - Pad string to length
 * @property {typeof getInitials} getInitials - Get name initials
 */

/** @type {StringUtils} */
export default {
  capitalize,
  titleCase,
  slugify,
  camelToKebab,
  kebabToCamel,
  removeDiacritics,
  randomString,
  escapeHtml,
  stripHtml,
  isEmpty,
  pad,
  getInitials
}
