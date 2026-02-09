/**
 * Input Sanitization Helpers
 * Security utilities for sanitizing user input
 */

/**
 * Validate and sanitize sort parameter for MongoDB
 * Only allows alphanumeric field names with optional - prefix and dot notation
 * @param {string} sort - Sort parameter from user input
 * @param {string[]} allowedFields - List of allowed field names
 * @param {string} defaultSort - Default sort if invalid
 * @returns {string} - Sanitized sort string
 */
export const sanitizeSort = (sort, allowedFields = [], defaultSort = '-createdAt') => {
  if (!sort || typeof sort !== 'string') return defaultSort

  // Remove any potential injection characters
  const sanitized = sort.trim()

  // Check for injection patterns (objects, functions, etc.)
  if (sanitized.includes('{') || sanitized.includes('$') || sanitized.includes('(')) {
    return defaultSort
  }

  // Extract field name (remove leading - for descending)
  const isDescending = sanitized.startsWith('-')
  const fieldName = isDescending ? sanitized.slice(1) : sanitized

  // Only allow alphanumeric, underscore, and dot (for nested fields)
  if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(fieldName)) {
    return defaultSort
  }

  // If allowedFields is specified, validate against it
  if (allowedFields.length > 0 && !allowedFields.includes(fieldName)) {
    return defaultSort
  }

  return sanitized
}

/**
 * Sanitize pagination parameters
 * @param {*} limit - Limit parameter
 * @param {*} page - Page parameter
 * @param {number} maxLimit - Maximum allowed limit (default 100)
 * @param {number} defaultLimit - Default limit (default 50)
 * @returns {{limit: number, page: number}}
 */
export const sanitizePagination = (limit, page, maxLimit = 100, defaultLimit = 50) => {
  let sanitizedLimit = parseInt(limit, 10)
  let sanitizedPage = parseInt(page, 10)

  // Handle NaN and enforce bounds
  if (isNaN(sanitizedLimit) || sanitizedLimit < 1) {
    sanitizedLimit = defaultLimit
  } else if (sanitizedLimit > maxLimit) {
    sanitizedLimit = maxLimit
  }

  if (isNaN(sanitizedPage) || sanitizedPage < 1) {
    sanitizedPage = 1
  }

  return { limit: sanitizedLimit, page: sanitizedPage }
}

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean}
 */
export const isValidObjectId = id => {
  if (!id || typeof id !== 'string') return false
  return /^[0-9a-fA-F]{24}$/.test(id)
}

export default {
  sanitizeSort,
  sanitizePagination,
  isValidObjectId
}
