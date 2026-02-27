/**
 * @module services/queryBuilder
 * @description Centralized query building utilities for MongoDB.
 * Provides pagination, filtering, search, and query construction helpers.
 * Replaces duplicate implementations across modules.
 */

import { escapeRegex } from '#helpers'

/**
 * Pagination result object
 * @typedef {Object} PaginationResult
 * @property {number} page - Current page number
 * @property {number} limit - Items per page
 * @property {number} skip - Number of items to skip
 */

/**
 * Pagination info for responses
 * @typedef {Object} PaginationInfo
 * @property {number} page - Current page number
 * @property {number} limit - Items per page
 * @property {number} total - Total item count
 * @property {number} pages - Total number of pages
 */

/**
 * Paginated query result
 * @typedef {Object} PaginatedResult
 * @property {Array} data - Array of results
 * @property {PaginationInfo} pagination - Pagination metadata
 */

/**
 * Query options for paginated queries
 * @typedef {Object} QueryOptions
 * @property {number} [page] - Page number
 * @property {number} [limit] - Items per page
 * @property {Object} [sort] - Sort criteria
 * @property {string} [select] - Fields to select
 * @property {string|Object|Array} [populate] - Population options
 * @property {boolean} [lean] - Return plain objects
 */

/**
 * Filter configuration for buildFilterFromQuery
 * @typedef {Object} FilterConfig
 * @property {Object} [baseFilter] - Base filter to extend
 * @property {string[]} [searchFields] - Fields to search in
 * @property {string} [statusField] - Status field name
 * @property {string} [dateField] - Date field name
 * @property {string[]} [additionalFields] - Additional equality filter fields
 */

/** @constant {number} Default page number */
export const DEFAULT_PAGE = 1

/** @constant {number} Default items per page */
export const DEFAULT_LIMIT = 20

/** @constant {number} Maximum items per page */
export const MAX_LIMIT = 100

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query object
 * @param {Object} [options={}] - Override defaults
 * @param {number} [options.defaultPage] - Default page if not specified
 * @param {number} [options.defaultLimit] - Default limit if not specified
 * @param {number} [options.maxLimit] - Maximum allowed limit
 * @returns {PaginationResult} Parsed pagination parameters
 * @example
 * const { page, limit, skip } = parsePagination(req.query)
 * // { page: 1, limit: 20, skip: 0 }
 *
 * const { page, limit, skip } = parsePagination({ page: '3', limit: '50' })
 * // { page: 3, limit: 50, skip: 100 }
 */
export const parsePagination = (query, options = {}) => {
  const page = Math.max(1, parseInt(query.page) || options.defaultPage || DEFAULT_PAGE)
  let limit = parseInt(query.limit) || options.defaultLimit || DEFAULT_LIMIT
  limit = Math.min(limit, options.maxLimit || MAX_LIMIT)

  return {
    page,
    limit,
    skip: (page - 1) * limit
  }
}

/**
 * Execute paginated query with count
 * Runs count and find queries in parallel for better performance
 * @param {import('mongoose').Model} Model - Mongoose model
 * @param {Object} [filter={}] - Query filter
 * @param {QueryOptions} [options={}] - Query options
 * @returns {Promise<PaginatedResult>} Paginated result with data and pagination info
 * @example
 * const result = await paginatedQuery(Hotel, { status: 'active' }, {
 *   page: 1,
 *   limit: 20,
 *   sort: { name: 1 },
 *   populate: 'partner'
 * })
 * // { data: [...], pagination: { page: 1, limit: 20, total: 100, pages: 5 } }
 */
export const paginatedQuery = async (Model, filter = {}, options = {}) => {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    sort = { createdAt: -1 },
    select = '-__v',
    populate = null,
    lean = true
  } = options

  const skip = (page - 1) * limit

  // Execute count and find in parallel for better performance
  const [total, items] = await Promise.all([
    Model.countDocuments(filter),
    buildQuery(Model.find(filter), { sort, skip, limit, select, populate, lean })
  ])

  return {
    data: items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

/**
 * Build query with common options (internal helper)
 * @private
 * @param {import('mongoose').Query} query - Mongoose query
 * @param {Object} options - Query options
 * @returns {import('mongoose').Query} Modified query
 */
const buildQuery = (query, options) => {
  const { sort, skip, limit, select, populate, lean } = options

  if (sort) query = query.sort(sort)
  if (skip !== undefined) query = query.skip(skip)
  if (limit) query = query.limit(parseInt(limit))
  if (select) query = query.select(select)

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(p => {
        query = query.populate(p)
      })
    } else {
      query = query.populate(populate)
    }
  }

  if (lean) query = query.lean()

  return query
}

/**
 * Build search filter for multiple fields using case-insensitive regex
 * @param {string} searchTerm - Search term
 * @param {string[]} fields - Fields to search in
 * @param {Object} [existingFilter={}] - Existing filter to extend
 * @returns {Object} MongoDB filter with $or search condition
 * @example
 * const filter = buildSearchFilter('john', ['name', 'email'])
 * // { $or: [{ name: { $regex: 'john', $options: 'i' } }, { email: { $regex: 'john', $options: 'i' } }] }
 *
 * const filter = buildSearchFilter('test', ['name'], { status: 'active' })
 * // { status: 'active', $or: [{ name: { $regex: 'test', $options: 'i' } }] }
 */
export const buildSearchFilter = (searchTerm, fields, existingFilter = {}) => {
  if (!searchTerm || !fields?.length) {
    return existingFilter
  }

  const searchRegex = { $regex: escapeRegex(searchTerm), $options: 'i' }
  const searchConditions = fields.map(field => ({ [field]: searchRegex }))

  // If existing filter already has $or, we need to $and them
  if (existingFilter.$or) {
    return {
      ...existingFilter,
      $and: [{ $or: existingFilter.$or }, { $or: searchConditions }]
    }
  }

  return {
    ...existingFilter,
    $or: searchConditions
  }
}

/**
 * Build date range filter for a field
 * @param {string} field - Date field name
 * @param {string|Date|null} startDate - Start date (inclusive)
 * @param {string|Date|null} endDate - End date (inclusive, set to end of day)
 * @param {Object} [existingFilter={}] - Existing filter to extend
 * @returns {Object} MongoDB filter with date range
 * @example
 * const filter = buildDateFilter('createdAt', '2024-01-01', '2024-12-31')
 * // { createdAt: { $gte: Date, $lte: Date } }
 *
 * const filter = buildDateFilter('checkIn', '2024-06-15', null)
 * // { checkIn: { $gte: Date } }
 */
export const buildDateFilter = (field, startDate, endDate, existingFilter = {}) => {
  const filter = { ...existingFilter }

  if (startDate || endDate) {
    filter[field] = {}
    if (startDate) {
      filter[field].$gte = new Date(startDate)
    }
    if (endDate) {
      // Set to end of day
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filter[field].$lte = end
    }
  }

  return filter
}

/**
 * Build status filter with support for 'all' value (which returns all statuses)
 * @param {string|null} status - Status value (null or 'all' returns no filter)
 * @param {Object} [existingFilter={}] - Existing filter to extend
 * @param {string} [fieldName='status'] - Status field name
 * @returns {Object} MongoDB filter with status
 * @example
 * buildStatusFilter('active') // { status: 'active' }
 * buildStatusFilter('all') // {} (no filter)
 * buildStatusFilter('confirmed', {}, 'bookingStatus') // { bookingStatus: 'confirmed' }
 */
export const buildStatusFilter = (status, existingFilter = {}, fieldName = 'status') => {
  if (!status || status === 'all') {
    return existingFilter
  }

  return {
    ...existingFilter,
    [fieldName]: status
  }
}

/**
 * Build complete filter from request query parameters
 * Combines search, status, date range, and additional field filters
 * @param {Object} query - Request query object
 * @param {FilterConfig} [config={}] - Filter configuration
 * @returns {Object} Complete MongoDB filter
 * @example
 * const filter = buildFilterFromQuery(
 *   { search: 'john', status: 'active', startDate: '2024-01-01', hotelId: '123' },
 *   {
 *     baseFilter: { partner: partnerId },
 *     searchFields: ['name', 'email'],
 *     additionalFields: ['hotelId']
 *   }
 * )
 */
export const buildFilterFromQuery = (query, config = {}) => {
  let filter = { ...config.baseFilter }

  const {
    searchFields = [],
    statusField = 'status',
    dateField = 'createdAt',
    additionalFields = []
  } = config

  // Search filter
  if (query.search && searchFields.length) {
    filter = buildSearchFilter(query.search, searchFields, filter)
  }

  // Status filter
  if (query.status) {
    filter = buildStatusFilter(query.status, filter, statusField)
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    filter = buildDateFilter(dateField, query.startDate, query.endDate, filter)
  }

  // Additional simple equality filters
  additionalFields.forEach(field => {
    if (query[field] && query[field] !== 'all') {
      filter[field] = query[field]
    }
  })

  return filter
}

/**
 * Send paginated response with nested data structure
 * @param {import('express').Response} res - Express response object
 * @param {PaginatedResult} result - Result from paginatedQuery
 * @param {string} [dataKey='items'] - Key name for data array
 * @returns {void}
 * @example
 * const result = await paginatedQuery(Hotel, filter, options)
 * sendPaginatedResponse(res, result, 'hotels')
 * // Response: { success: true, data: { hotels: [...], pagination: {...} } }
 */
export const sendPaginatedResponse = (res, result, dataKey = 'items') => {
  res.json({
    success: true,
    data: {
      [dataKey]: result.data,
      pagination: result.pagination
    }
  })
}

/**
 * Send paginated response with flat structure (data and pagination at root level)
 * @param {import('express').Response} res - Express response object
 * @param {PaginatedResult} result - Result from paginatedQuery
 * @returns {void}
 * @example
 * sendFlatPaginatedResponse(res, result)
 * // Response: { success: true, data: [...], pagination: {...} }
 */
export const sendFlatPaginatedResponse = (res, result) => {
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination
  })
}

export default {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePagination,
  paginatedQuery,
  buildSearchFilter,
  buildDateFilter,
  buildStatusFilter,
  buildFilterFromQuery,
  sendPaginatedResponse,
  sendFlatPaginatedResponse
}
