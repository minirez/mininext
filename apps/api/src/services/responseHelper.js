/**
 * @module services/responseHelper
 * @description Standardized response helpers for consistent API responses.
 * All endpoints should use these helpers for uniform response formatting.
 */

/**
 * Standard success response structure
 * @typedef {Object} SuccessResponse
 * @property {boolean} success - Always true for success responses
 * @property {*} data - Response payload
 */

/**
 * Standard error response structure
 * @typedef {Object} ErrorResponse
 * @property {boolean} success - Always false for error responses
 * @property {string} message - Error message
 * @property {Object} [details] - Optional error details
 */

/**
 * Pagination information
 * @typedef {Object} PaginationInfo
 * @property {number} page - Current page number
 * @property {number} limit - Items per page
 * @property {number} total - Total item count
 * @property {number} [pages] - Total number of pages
 */

/**
 * Send success response with data
 * @param {import('express').Response} res - Express response object
 * @param {*} data - Response data (object, array, or primitive)
 * @param {number} [statusCode=200] - HTTP status code
 * @returns {void}
 * @example
 * sendSuccess(res, { id: 1, name: 'Hotel A' })
 * sendSuccess(res, hotels, 200)
 */
export const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data
  })
}

/**
 * Send success response with message (and optional data)
 * Useful for action confirmations like "Item deleted successfully"
 * @param {import('express').Response} res - Express response object
 * @param {string} message - Success message (can be i18n key)
 * @param {*} [data=null] - Optional additional data
 * @returns {void}
 * @example
 * sendMessage(res, 'BOOKING_CONFIRMED')
 * sendMessage(res, 'USER_CREATED', { id: newUser._id })
 */
export const sendMessage = (res, message, data = null) => {
  const response = {
    success: true,
    message
  }
  if (data !== null) {
    response.data = data
  }
  res.json(response)
}

/**
 * Send 201 Created response with data
 * Use after successfully creating a new resource
 * @param {import('express').Response} res - Express response object
 * @param {*} data - Created resource data
 * @returns {void}
 * @example
 * const booking = await bookingService.create(bookingData)
 * sendCreated(res, booking)
 */
export const sendCreated = (res, data) => {
  sendSuccess(res, data, 201)
}

/**
 * Send 204 No Content response
 * Use after successful delete or update with no content to return
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 * @example
 * await bookingService.delete(bookingId)
 * sendNoContent(res)
 */
export const sendNoContent = res => {
  res.status(204).send()
}

/**
 * Send paginated list response
 * Standard format for list endpoints with optional pagination
 * @param {import('express').Response} res - Express response object
 * @param {Array} items - List of items
 * @param {PaginationInfo|null} [pagination=null] - Pagination info (page, limit, total)
 * @param {string} [itemsKey='items'] - Key name for items array in response
 * @returns {void}
 * @example
 * // Without pagination
 * sendList(res, hotels)
 *
 * // With pagination
 * sendList(res, hotels, { page: 1, limit: 20, total: 100 })
 *
 * // With custom key
 * sendList(res, bookings, pagination, 'bookings')
 */
export const sendList = (res, items, pagination = null, itemsKey = 'items') => {
  const response = {
    success: true,
    data: {
      [itemsKey]: items
    }
  }

  if (pagination) {
    response.data.pagination = pagination
  }

  res.json(response)
}

/**
 * Send error response
 * Note: Prefer throwing custom errors (BadRequestError, etc.) and using error middleware.
 * Use this only when you need direct response control without throwing.
 * @param {import('express').Response} res - Express response object
 * @param {string} message - Error message (can be i18n key)
 * @param {number} [statusCode=400] - HTTP status code
 * @param {Object|null} [details=null] - Optional error details
 * @returns {void}
 * @example
 * // Simple error
 * sendError(res, 'INVALID_INPUT')
 *
 * // With status code
 * sendError(res, 'NOT_FOUND', 404)
 *
 * // With details
 * sendError(res, 'VALIDATION_FAILED', 422, { field: 'email', error: 'Invalid format' })
 */
export const sendError = (res, message, statusCode = 400, details = null) => {
  const response = {
    success: false,
    message
  }

  if (details) {
    response.details = details
  }

  res.status(statusCode).json(response)
}

/**
 * Response factory object for creating response structures
 * Useful for building responses in services before sending
 * @namespace createResponse
 */
export const createResponse = {
  /**
   * Create success response object
   * @param {*} data - Response data
   * @returns {SuccessResponse} Success response object
   * @example
   * const response = createResponse.success({ id: 1 })
   * // { success: true, data: { id: 1 } }
   */
  success: data => ({ success: true, data }),

  /**
   * Create error response object
   * @param {string} message - Error message
   * @param {Object|null} [details=null] - Error details
   * @returns {ErrorResponse} Error response object
   * @example
   * const response = createResponse.error('VALIDATION_FAILED', { field: 'email' })
   * // { success: false, message: 'VALIDATION_FAILED', details: { field: 'email' } }
   */
  error: (message, details = null) => ({
    success: false,
    message,
    ...(details && { details })
  }),

  /**
   * Create list response object
   * @param {Array} items - List items
   * @param {PaginationInfo|null} [pagination=null] - Pagination info
   * @param {string} [itemsKey='items'] - Key name for items
   * @returns {SuccessResponse} List response object
   * @example
   * const response = createResponse.list(hotels, { page: 1, total: 50 })
   */
  list: (items, pagination = null, itemsKey = 'items') => ({
    success: true,
    data: {
      [itemsKey]: items,
      ...(pagination && { pagination })
    }
  })
}

export default {
  sendSuccess,
  sendMessage,
  sendCreated,
  sendNoContent,
  sendList,
  sendError,
  createResponse
}
