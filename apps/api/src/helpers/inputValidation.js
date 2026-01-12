/**
 * Input Validation Helpers
 * Centralized validation for external API inputs
 */

import { BadRequestError } from '../core/errors.js'

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @param {object} options - Validation options
 * @throws {BadRequestError} If URL is invalid
 */
export const validateUrl = (url, options = {}) => {
  const { allowedProtocols = ['http:', 'https:'], maxLength = 2048, fieldName = 'URL' } = options

  if (!url) {
    throw new BadRequestError(`${fieldName}_REQUIRED`)
  }

  if (typeof url !== 'string') {
    throw new BadRequestError(`${fieldName}_MUST_BE_STRING`)
  }

  if (url.length > maxLength) {
    throw new BadRequestError(`${fieldName}_TOO_LONG`)
  }

  try {
    const parsed = new URL(url)
    if (!allowedProtocols.includes(parsed.protocol)) {
      throw new BadRequestError(`${fieldName}_INVALID_PROTOCOL`)
    }
  } catch (e) {
    if (e instanceof BadRequestError) throw e
    throw new BadRequestError(`${fieldName}_INVALID_FORMAT`)
  }
}

/**
 * Validate domain name
 * @param {string} domain - Domain to validate
 * @param {object} options - Validation options
 * @throws {BadRequestError} If domain is invalid
 */
export const validateDomain = (domain, options = {}) => {
  const { maxLength = 253, fieldName = 'Domain' } = options

  if (!domain) {
    throw new BadRequestError(`${fieldName}_REQUIRED`)
  }

  if (typeof domain !== 'string') {
    throw new BadRequestError(`${fieldName}_MUST_BE_STRING`)
  }

  if (domain.length > maxLength) {
    throw new BadRequestError(`${fieldName}_TOO_LONG`)
  }

  // Basic domain validation regex
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  if (!domainRegex.test(domain)) {
    throw new BadRequestError(`${fieldName}_INVALID_FORMAT`)
  }

  // Prevent command injection
  if (/[;&|`$(){}[\]<>\\]/.test(domain)) {
    throw new BadRequestError(`${fieldName}_CONTAINS_INVALID_CHARACTERS`)
  }
}

/**
 * Validate date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {object} options - Validation options
 * @throws {BadRequestError} If dates are invalid
 */
export const validateDateRange = (startDate, endDate, options = {}) => {
  const { maxDays = 365, allowPast = true, fieldName = 'Date range' } = options

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime())) {
    throw new BadRequestError('START_DATE_INVALID')
  }

  if (isNaN(end.getTime())) {
    throw new BadRequestError('END_DATE_INVALID')
  }

  if (start > end) {
    throw new BadRequestError('START_DATE_AFTER_END_DATE')
  }

  if (!allowPast) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    if (start < now) {
      throw new BadRequestError('START_DATE_IN_PAST')
    }
  }

  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  if (daysDiff > maxDays) {
    throw new BadRequestError(`${fieldName}_EXCEEDS_MAX_DAYS`)
  }

  return { start, end, days: daysDiff }
}

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {object} options - Validation options
 * @returns {object} Validated pagination params
 */
export const validatePagination = (page, limit, options = {}) => {
  const { maxLimit = 100, defaultLimit = 20, defaultPage = 1 } = options

  let validPage = parseInt(page, 10)
  let validLimit = parseInt(limit, 10)

  if (isNaN(validPage) || validPage < 1) {
    validPage = defaultPage
  }

  if (isNaN(validLimit) || validLimit < 1) {
    validLimit = defaultLimit
  }

  if (validLimit > maxLimit) {
    validLimit = maxLimit
  }

  return {
    page: validPage,
    limit: validLimit,
    skip: (validPage - 1) * validLimit
  }
}

/**
 * Validate currency code
 * @param {string} currency - Currency code
 * @throws {BadRequestError} If currency is invalid
 */
export const validateCurrency = currency => {
  const validCurrencies = ['TRY', 'USD', 'EUR', 'GBP', 'RUB', 'SAR', 'AED', 'CHF', 'JPY', 'CNY']

  if (!currency) {
    throw new BadRequestError('CURRENCY_REQUIRED')
  }

  const upperCurrency = currency.toUpperCase()
  if (!validCurrencies.includes(upperCurrency)) {
    throw new BadRequestError('CURRENCY_INVALID')
  }

  return upperCurrency
}

/**
 * Validate email
 * @param {string} email - Email to validate
 * @throws {BadRequestError} If email is invalid
 */
export const validateEmail = email => {
  if (!email) {
    throw new BadRequestError('EMAIL_REQUIRED')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new BadRequestError('EMAIL_INVALID')
  }

  if (email.length > 254) {
    throw new BadRequestError('EMAIL_TOO_LONG')
  }

  return email.toLowerCase().trim()
}

/**
 * Validate phone number
 * @param {string} phone - Phone to validate
 * @param {object} options - Validation options
 * @throws {BadRequestError} If phone is invalid
 */
export const validatePhone = (phone, options = {}) => {
  const { minLength = 10, maxLength = 15, countryCode = 'TR' } = options

  if (!phone) {
    throw new BadRequestError('PHONE_REQUIRED')
  }

  const digits = phone.replace(/\D/g, '')

  if (digits.length < minLength) {
    throw new BadRequestError('PHONE_TOO_SHORT')
  }

  if (digits.length > maxLength) {
    throw new BadRequestError('PHONE_TOO_LONG')
  }

  // Turkey specific validation
  if (countryCode === 'TR') {
    const isValid =
      (digits.length === 10 && digits.startsWith('5')) ||
      (digits.length === 11 && digits.startsWith('05')) ||
      (digits.length === 12 && digits.startsWith('905'))

    if (!isValid) {
      throw new BadRequestError('PHONE_INVALID_FORMAT')
    }
  }

  return digits
}

/**
 * Validate positive number
 * @param {number} value - Value to validate
 * @param {object} options - Validation options
 * @throws {BadRequestError} If value is invalid
 */
export const validatePositiveNumber = (value, options = {}) => {
  const { fieldName = 'Value', min = 0, max = Number.MAX_SAFE_INTEGER, allowZero = true } = options

  const num = Number(value)

  if (isNaN(num)) {
    throw new BadRequestError(`${fieldName}_MUST_BE_NUMBER`)
  }

  if (!allowZero && num === 0) {
    throw new BadRequestError(`${fieldName}_CANNOT_BE_ZERO`)
  }

  if (num < min) {
    throw new BadRequestError(`${fieldName}_TOO_SMALL`)
  }

  if (num > max) {
    throw new BadRequestError(`${fieldName}_TOO_LARGE`)
  }

  return num
}

/**
 * Validate ObjectId
 * @param {string} id - ObjectId to validate
 * @param {string} fieldName - Field name for error message
 * @throws {BadRequestError} If id is invalid
 */
export const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    throw new BadRequestError(`${fieldName}_REQUIRED`)
  }

  const objectIdRegex = /^[a-fA-F0-9]{24}$/
  if (!objectIdRegex.test(id)) {
    throw new BadRequestError(`${fieldName}_INVALID`)
  }

  return id
}

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input, options = {}) => {
  const { maxLength = 1000, trim = true, lowercase = false } = options

  if (!input) return ''

  let result = String(input)

  if (trim) {
    result = result.trim()
  }

  if (result.length > maxLength) {
    result = result.slice(0, maxLength)
  }

  if (lowercase) {
    result = result.toLowerCase()
  }

  // Remove potentially dangerous characters for basic XSS prevention
  result = result.replace(/[<>]/g, '')

  return result
}

/**
 * Escape special regex characters in a string
 * Prevents ReDoS attacks when using user input in MongoDB $regex queries
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for regex use
 */
export const escapeRegex = str => {
  if (!str) return ''
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Build safe search query for MongoDB
 * @param {string} search - Search term
 * @param {string[]} fields - Fields to search in
 * @returns {object} MongoDB query object with escaped regex
 */
export const buildSearchQuery = (search, fields) => {
  if (!search || !fields || fields.length === 0) return {}
  const escapedSearch = escapeRegex(search)
  return {
    $or: fields.map(field => ({
      [field]: { $regex: escapedSearch, $options: 'i' }
    }))
  }
}

export default {
  validateUrl,
  validateDomain,
  validateDateRange,
  validatePagination,
  validateCurrency,
  validateEmail,
  validatePhone,
  validatePositiveNumber,
  validateObjectId,
  sanitizeString,
  escapeRegex,
  buildSearchQuery
}
