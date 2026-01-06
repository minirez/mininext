/**
 * Base Entity Service
 * Provides common CRUD operations for all entities
 * Reduces boilerplate code across modules
 *
 * Usage:
 *   class AgencyService extends BaseEntityService {
 *     constructor() {
 *       super(Agency, {
 *         entityName: 'agency',
 *         allowedFields: ['name', 'email', 'phone'],
 *         searchFields: ['name', 'email'],
 *         defaultSort: { createdAt: -1 },
 *         populate: ['partner']
 *       })
 *     }
 *   }
 */

import { NotFoundError, BadRequestError } from '../../core/errors.js'
import {
  paginatedQuery,
  buildFilterFromQuery,
  parsePagination
} from '../queryBuilder.js'
import { sendSuccess, sendMessage, sendCreated } from '../responseHelper.js'

export class BaseEntityService {
  /**
   * @param {Model} Model - Mongoose model
   * @param {Object} config - Service configuration
   */
  constructor(Model, config = {}) {
    this.Model = Model
    this.config = {
      entityName: config.entityName || 'entity',
      allowedFields: config.allowedFields || [],
      searchFields: config.searchFields || ['name'],
      defaultSort: config.defaultSort || { createdAt: -1 },
      populate: config.populate || null,
      select: config.select || '-__v',
      ...config
    }

    // Bind methods to preserve 'this' context
    this.list = this.list.bind(this)
    this.getById = this.getById.bind(this)
    this.create = this.create.bind(this)
    this.update = this.update.bind(this)
    this.delete = this.delete.bind(this)
    this.activate = this.activate.bind(this)
    this.deactivate = this.deactivate.bind(this)
  }

  /**
   * Get entity name in uppercase for error messages
   */
  get entityNameUpper() {
    return this.config.entityName.toUpperCase()
  }

  /**
   * Build filter from request with tenant context
   * Override in subclass for custom filtering
   * @param {Request} req - Express request
   * @returns {Object} Filter object
   */
  buildFilter(req) {
    const { query } = req
    const baseFilter = this.getTenantFilter(req)

    return buildFilterFromQuery(query, {
      baseFilter,
      searchFields: this.config.searchFields,
      additionalFields: this.config.filterFields || []
    })
  }

  /**
   * Get tenant filter (partner context)
   * Override in subclass if entity has different tenant field
   * @param {Request} req - Express request
   * @returns {Object} Tenant filter
   */
  getTenantFilter(req) {
    // For partner-scoped entities
    if (req.partnerId) {
      return { partner: req.partnerId }
    }
    return {}
  }

  /**
   * List entities with pagination
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async list(req, res) {
    const filter = this.buildFilter(req)
    const { page, limit } = parsePagination(req.query)

    const result = await paginatedQuery(this.Model, filter, {
      page,
      limit,
      sort: req.query.sort ? this.parseSort(req.query.sort) : this.config.defaultSort,
      select: this.config.select,
      populate: this.config.populate
    })

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
  }

  /**
   * Get single entity by ID
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async getById(req, res) {
    const entity = await this.findByIdWithTenant(req.params.id, req)

    if (!entity) {
      throw new NotFoundError(`${this.entityNameUpper}_NOT_FOUND`)
    }

    sendSuccess(res, entity)
  }

  /**
   * Create new entity
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async create(req, res) {
    const data = this.filterAllowedFields(req.body)

    // Add tenant context
    const tenantFilter = this.getTenantFilter(req)
    Object.assign(data, tenantFilter)

    // Add audit info
    if (req.user) {
      data.createdBy = req.user._id
    }

    const entity = await this.Model.create(data)

    sendCreated(res, entity)
  }

  /**
   * Update entity
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async update(req, res) {
    const entity = await this.findByIdWithTenant(req.params.id, req)

    if (!entity) {
      throw new NotFoundError(`${this.entityNameUpper}_NOT_FOUND`)
    }

    // Apply only allowed fields
    this.applyAllowedFields(entity, req.body)

    // Add audit info
    if (req.user) {
      entity.updatedBy = req.user._id
    }

    await entity.save()

    sendMessage(res, req.t(`${this.entityNameUpper}_UPDATED`), entity)
  }

  /**
   * Delete entity
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async delete(req, res) {
    const entity = await this.findByIdWithTenant(req.params.id, req)

    if (!entity) {
      throw new NotFoundError(`${this.entityNameUpper}_NOT_FOUND`)
    }

    // Check for dependencies before delete
    await this.checkDependencies(entity, req)

    await entity.deleteOne()

    sendMessage(res, req.t(`${this.entityNameUpper}_DELETED`))
  }

  /**
   * Activate entity
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async activate(req, res) {
    const entity = await this.findByIdWithTenant(req.params.id, req)

    if (!entity) {
      throw new NotFoundError(`${this.entityNameUpper}_NOT_FOUND`)
    }

    if (entity.status === 'active') {
      throw new BadRequestError(`${this.entityNameUpper}_ALREADY_ACTIVE`)
    }

    entity.status = 'active'
    if (req.user) {
      entity.updatedBy = req.user._id
    }
    await entity.save()

    sendMessage(res, req.t(`${this.entityNameUpper}_ACTIVATED`), entity)
  }

  /**
   * Deactivate entity
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async deactivate(req, res) {
    const entity = await this.findByIdWithTenant(req.params.id, req)

    if (!entity) {
      throw new NotFoundError(`${this.entityNameUpper}_NOT_FOUND`)
    }

    if (entity.status === 'inactive') {
      throw new BadRequestError(`${this.entityNameUpper}_ALREADY_INACTIVE`)
    }

    entity.status = 'inactive'
    if (req.user) {
      entity.updatedBy = req.user._id
    }
    await entity.save()

    sendMessage(res, req.t(`${this.entityNameUpper}_DEACTIVATED`), entity)
  }

  // ==================== Helper Methods ====================

  /**
   * Find entity by ID with tenant context
   * @param {string} id - Entity ID
   * @param {Request} req - Express request for tenant context
   * @returns {Promise<Document|null>}
   */
  async findByIdWithTenant(id, req) {
    const filter = {
      _id: id,
      ...this.getTenantFilter(req)
    }

    let query = this.Model.findOne(filter)

    if (this.config.populate) {
      const populates = Array.isArray(this.config.populate)
        ? this.config.populate
        : [this.config.populate]
      populates.forEach(p => {
        query = query.populate(p)
      })
    }

    return query.exec()
  }

  /**
   * Filter request body to only allowed fields
   * @param {Object} body - Request body
   * @returns {Object} Filtered data
   */
  filterAllowedFields(body) {
    const data = {}
    this.config.allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    })
    return data
  }

  /**
   * Apply allowed fields to existing entity
   * @param {Document} entity - Mongoose document
   * @param {Object} body - Request body
   */
  applyAllowedFields(entity, body) {
    this.config.allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        entity[field] = body[field]
      }
    })
  }

  /**
   * Check for dependencies before delete
   * Override in subclass to add dependency checks
   * @param {Document} entity - Entity to check
   * @param {Request} req - Express request
   */
  async checkDependencies(_entity, _req) {
    // Override in subclass
    // Example: throw new ConflictError('ENTITY_HAS_DEPENDENCIES')
  }

  /**
   * Parse sort parameter from query string
   * @param {string} sortString - Sort string (e.g., "-createdAt" or "name")
   * @returns {Object} Mongoose sort object
   */
  parseSort(sortString) {
    if (!sortString) return this.config.defaultSort

    const sort = {}
    const fields = sortString.split(',')

    fields.forEach(field => {
      if (field.startsWith('-')) {
        sort[field.substring(1)] = -1
      } else {
        sort[field] = 1
      }
    })

    return sort
  }
}

export default BaseEntityService
