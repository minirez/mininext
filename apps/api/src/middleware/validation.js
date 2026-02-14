/**
 * @module middleware/validation
 * @description Input validation middleware and utilities for API endpoints.
 * Provides validators, sanitizers, and Express middleware for request validation.
 */

import { BadRequestError } from '../core/errors.js'

/**
 * Validation error detail
 * @typedef {Object} ValidationErrorDetail
 * @property {string} field - Field name that failed validation
 * @property {string} message - Error message
 */

/**
 * Schema validation rule
 * @typedef {Object} ValidationRule
 * @property {'string'|'number'|'integer'|'boolean'|'array'|'object'|'date'|'objectId'|'email'|'phone'|'currency'} [type] - Expected type
 * @property {boolean} [required] - Whether field is required
 * @property {string} [message] - Custom error message
 * @property {number} [min] - Minimum value (for numbers)
 * @property {number} [max] - Maximum value (for numbers)
 * @property {number} [minLength] - Minimum length (for strings)
 * @property {number} [maxLength] - Maximum length (for strings)
 * @property {Array} [enum] - Allowed values
 * @property {Function} [validate] - Custom validation function
 */

/**
 * Validate MongoDB ObjectId format (24 hex characters)
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId format
 * @example
 * isValidObjectId('507f1f77bcf86cd799439011') // true
 * isValidObjectId('invalid') // false
 */
export function isValidObjectId(id) {
  if (!id) return false
  return /^[0-9a-fA-F]{24}$/.test(id.toString())
}

/**
 * Validate date string format (YYYY-MM-DD)
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid date format
 * @example
 * isValidDateString('2024-01-15') // true
 * isValidDateString('01-15-2024') // false
 * isValidDateString('2024-13-01') // false (invalid month)
 */
export function isValidDateString(dateStr) {
  if (!dateStr) return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false

  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date)
}

/**
 * Validate date is not in the past (today or future)
 * @param {string} dateStr - Date string to validate (YYYY-MM-DD)
 * @returns {boolean} True if date is today or in the future
 * @example
 * isNotPastDate('2030-01-01') // true
 * isNotPastDate('2020-01-01') // false
 */
export function isNotPastDate(dateStr) {
  if (!isValidDateString(dateStr)) return false
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid-email') // false
 */
export function isValidEmail(email) {
  if (!email) return false
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Validate phone number format (8-15 digits, optional leading +)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 * @example
 * isValidPhone('+905551234567') // true
 * isValidPhone('5551234567') // true
 * isValidPhone('123') // false (too short)
 */
export function isValidPhone(phone) {
  if (!phone) return false
  // Allow + and digits, minimum 8 characters
  const regex = /^\+?[0-9]{8,15}$/
  return regex.test(phone.replace(/[\s-]/g, ''))
}

/**
 * List of supported currency codes
 * @constant {string[]}
 */
export const VALID_CURRENCIES = [
  'TRY',
  'USD',
  'EUR',
  'GBP',
  'RUB',
  'SAR',
  'AED',
  'CHF',
  'JPY',
  'CNY'
]

/**
 * Validate currency code against supported currencies
 * @param {string} currency - Currency code to validate
 * @returns {boolean} True if valid currency
 * @example
 * isValidCurrency('USD') // true
 * isValidCurrency('usd') // true (case-insensitive)
 * isValidCurrency('XYZ') // false
 */
export function isValidCurrency(currency) {
  return VALID_CURRENCIES.includes(currency?.toUpperCase())
}

/**
 * Sanitize string input by trimming and truncating
 * @param {string} str - String to sanitize
 * @param {number} [maxLength=255] - Maximum allowed length
 * @returns {string} Sanitized string
 * @example
 * sanitizeString('  hello  ', 10) // 'hello'
 * sanitizeString('long string', 4) // 'long'
 */
export function sanitizeString(str, maxLength = 255) {
  if (!str) return ''
  return String(str).trim().slice(0, maxLength)
}

/**
 * Parse integer options
 * @typedef {Object} ParseIntegerOptions
 * @property {number|null} [min] - Minimum value (clamps if below)
 * @property {number|null} [max] - Maximum value (clamps if above)
 * @property {number|null} [defaultValue] - Default if parsing fails
 */

/**
 * Parse and validate integer with optional clamping
 * @param {*} value - Value to parse
 * @param {ParseIntegerOptions} [options={}] - Parsing options
 * @returns {number|null} Parsed integer or null/defaultValue if invalid
 * @example
 * parseInteger('42') // 42
 * parseInteger('5', { min: 10 }) // 10 (clamped to min)
 * parseInteger('abc', { defaultValue: 0 }) // 0
 */
export function parseInteger(value, options = {}) {
  const { min = null, max = null, defaultValue = null } = options

  if (value === undefined || value === null || value === '') {
    return defaultValue
  }

  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    return defaultValue
  }

  if (min !== null && parsed < min) return min
  if (max !== null && parsed > max) return max

  return parsed
}

/**
 * Parse and validate positive number (>= 0)
 * @param {*} value - Value to parse
 * @param {number} [defaultValue=0] - Default value if invalid
 * @returns {number} Parsed positive number or default
 * @example
 * parsePositiveNumber('3.14') // 3.14
 * parsePositiveNumber('-5', 0) // 0 (negative returns default)
 * parsePositiveNumber('abc', 10) // 10
 */
export function parsePositiveNumber(value, defaultValue = 0) {
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }

  const parsed = parseFloat(value)
  if (isNaN(parsed) || parsed < 0) {
    return defaultValue
  }

  return parsed
}

/**
 * Built-in validation type checkers
 * @private
 * @type {Object.<string, Function>}
 */
const SCHEMA_TYPES = {
  string: value => typeof value === 'string',
  number: value => typeof value === 'number' && !isNaN(value),
  integer: value => Number.isInteger(value),
  boolean: value => typeof value === 'boolean',
  array: value => Array.isArray(value),
  object: value => typeof value === 'object' && value !== null && !Array.isArray(value),
  date: value => isValidDateString(value),
  objectId: value => isValidObjectId(value),
  email: value => isValidEmail(value),
  phone: value => isValidPhone(value),
  currency: value => isValidCurrency(value)
}

/**
 * Validate request body against schema
 * Creates Express middleware that validates req.body
 * @param {Object.<string, ValidationRule>} schema - Validation schema
 * @returns {import('express').RequestHandler} Express middleware
 * @throws {BadRequestError} Throws VALIDATION_ERROR with details if validation fails
 * @example
 * router.post('/booking', validateBody({
 *   guestName: { type: 'string', required: true, minLength: 2 },
 *   email: { type: 'email', required: true },
 *   adults: { type: 'integer', min: 1, max: 10 }
 * }), createBooking)
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const errors = []

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field]

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: rules.message || `${field} is required`
        })
        continue
      }

      // Skip validation if field is optional and not provided
      if (value === undefined || value === null) {
        continue
      }

      // Type check
      if (rules.type && SCHEMA_TYPES[rules.type]) {
        if (!SCHEMA_TYPES[rules.type](value)) {
          errors.push({
            field,
            message: `${field} must be of type ${rules.type}`
          })
          continue
        }
      }

      // Min/Max for numbers
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({
            field,
            message: `${field} must be at least ${rules.min}`
          })
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push({
            field,
            message: `${field} must be at most ${rules.max}`
          })
        }
      }

      // Min/Max length for strings
      if (typeof value === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push({
            field,
            message: `${field} must be at least ${rules.minLength} characters`
          })
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push({
            field,
            message: `${field} must be at most ${rules.maxLength} characters`
          })
        }
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({
          field,
          message: `${field} must be one of: ${rules.enum.join(', ')}`
        })
      }

      // Custom validator
      if (rules.validate && typeof rules.validate === 'function') {
        const result = rules.validate(value, req.body)
        if (result !== true) {
          errors.push({
            field,
            message: result || `${field} validation failed`
          })
        }
      }
    }

    if (errors.length > 0) {
      return next(new BadRequestError('VALIDATION_ERROR', { errors }))
    }

    next()
  }
}

/**
 * Validate query parameters
 * Creates Express middleware that validates and coerces req.query
 * Note: Query params are strings by default, this middleware coerces numbers/booleans
 * @param {Object.<string, ValidationRule>} schema - Validation schema
 * @returns {import('express').RequestHandler} Express middleware
 * @throws {BadRequestError} Throws VALIDATION_ERROR with details if validation fails
 * @example
 * router.get('/hotels', validateQuery({
 *   page: { type: 'integer', min: 1 },
 *   limit: { type: 'integer', min: 1, max: 100 },
 *   active: { type: 'boolean' }
 * }), listHotels)
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const errors = []

    for (const [param, rules] of Object.entries(schema)) {
      let value = req.query[param]

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          param,
          message: rules.message || `Query parameter ${param} is required`
        })
        continue
      }

      // Skip validation if param is optional and not provided
      if (value === undefined || value === null) {
        continue
      }

      // Type coercion for query params (they come as strings)
      if (rules.type === 'number' || rules.type === 'integer') {
        value = parseFloat(value)
        req.query[param] = value
        if (isNaN(value)) {
          errors.push({
            param,
            message: `${param} must be a valid number`
          })
          continue
        }
      } else if (rules.type === 'boolean') {
        value = value === 'true' || value === '1'
        req.query[param] = value
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({
          param,
          message: `${param} must be one of: ${rules.enum.join(', ')}`
        })
      }
    }

    if (errors.length > 0) {
      return next(new BadRequestError('VALIDATION_ERROR', { errors }))
    }

    next()
  }
}

/**
 * Validate route parameters (URL params)
 * Creates Express middleware that validates req.params
 * @param {Object.<string, ValidationRule>} schema - Validation schema
 * @returns {import('express').RequestHandler} Express middleware
 * @throws {BadRequestError} Throws VALIDATION_ERROR with details if validation fails
 * @example
 * router.get('/hotels/:id', validateParams({
 *   id: { type: 'objectId' }
 * }), getHotel)
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const errors = []

    for (const [param, rules] of Object.entries(schema)) {
      const value = req.params[param]

      // ObjectId check
      if (rules.type === 'objectId' && !isValidObjectId(value)) {
        errors.push({
          param,
          message: `Invalid ${param} format`
        })
      }
    }

    if (errors.length > 0) {
      return next(new BadRequestError('VALIDATION_ERROR', { errors }))
    }

    next()
  }
}

/**
 * Common validation schemas for reuse across endpoints
 * @constant {Object.<string, Object.<string, ValidationRule>>}
 * @example
 * // Use spread to combine schemas
 * validateBody({
 *   ...commonSchemas.dateRange,
 *   hotelId: { type: 'objectId', required: true }
 * })
 */
export const commonSchemas = {
  // Booking/Price calculation
  priceQuery: {
    hotelId: { type: 'objectId', required: true },
    roomTypeId: { type: 'objectId', required: true },
    mealPlanId: { type: 'objectId', required: true },
    marketId: { type: 'objectId', required: true },
    checkInDate: { type: 'date', required: true },
    checkOutDate: { type: 'date', required: true },
    adults: { type: 'integer', min: 1, max: 10 },
    children: { type: 'array' }
  },

  // Date range
  dateRange: {
    startDate: { type: 'date', required: true },
    endDate: { type: 'date', required: true }
  },

  // Pagination
  pagination: {
    page: { type: 'integer', min: 1 },
    limit: { type: 'integer', min: 1, max: 100 }
  }
}

/**
 * Global ObjectId param validation middleware
 * Automatically validates all route params named 'id' or ending with 'Id'
 * Apply at router level to protect all sub-routes
 * @returns {import('express').RequestHandler}
 * @example
 * // In route loader or app.js:
 * app.use('/api', validateObjectIdParams())
 *
 * // Now all /:id, /:hotelId, /:bookingId params are auto-validated
 * router.get('/:id', handler) // ← :id is validated automatically
 */
export function validateObjectIdParams() {
  return (req, _res, next) => {
    const params = req.params || {}
    for (const [key, value] of Object.entries(params)) {
      // Check params named 'id' or ending with 'Id' (e.g. hotelId, bookingId)
      if ((key === 'id' || key.endsWith('Id')) && value) {
        if (!isValidObjectId(value)) {
          return next(
            new BadRequestError('INVALID_ID', {
              errors: [{ param: key, message: `Invalid ${key} format` }]
            })
          )
        }
      }
    }
    next()
  }
}

export default {
  isValidObjectId,
  isValidDateString,
  isNotPastDate,
  isValidEmail,
  isValidPhone,
  isValidCurrency,
  sanitizeString,
  parseInteger,
  parsePositiveNumber,
  validateBody,
  validateQuery,
  validateParams,
  validateObjectIdParams,
  commonSchemas,
  VALID_CURRENCIES
}
