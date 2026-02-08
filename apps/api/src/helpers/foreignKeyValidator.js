/**
 * Foreign Key Validation Helper
 * Prevents orphan records by validating references before save
 */

import mongoose from 'mongoose'
import { BadRequestError } from '#core/errors.js'
import logger from '#core/logger.js'

/**
 * Validate that a single foreign key reference exists
 * @param {string} modelName - The model to check against
 * @param {ObjectId|string} id - The ID to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Additional options
 * @param {Object} options.session - Mongoose session for transaction support
 * @param {boolean} options.required - If true, null/undefined will throw error
 * @param {Object} options.additionalQuery - Extra query conditions (e.g., { hotel: hotelId })
 * @returns {Promise<boolean>} - True if valid
 * @throws {BadRequestError} - If reference doesn't exist
 */
export const validateForeignKey = async (modelName, id, fieldName, options = {}) => {
  const { session, required = false, additionalQuery = {} } = options

  // Skip if not required and no value provided
  if (!id) {
    if (required) {
      throw new BadRequestError(`${fieldName} zorunludur`)
    }
    return true
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Geçersiz ${fieldName} formatı`)
  }

  try {
    const Model = mongoose.model(modelName)
    const query = { _id: id, ...additionalQuery }

    const exists = await Model.exists(query).session(session || null)

    if (!exists) {
      const extraInfo =
        Object.keys(additionalQuery).length > 0 ? ` (${JSON.stringify(additionalQuery)})` : ''
      throw new BadRequestError(`${fieldName} bulunamadı${extraInfo}`)
    }

    return true
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error
    }
    // Model not registered or other mongoose error
    logger.error(`[FK Validation] Error validating ${modelName}.${fieldName}:`, error.message)
    throw new BadRequestError(`${fieldName} doğrulanamadı`)
  }
}

/**
 * Validate multiple foreign key references in parallel
 * @param {Array} validations - Array of validation configs
 * @param {Object} options - Shared options (session, etc.)
 * @returns {Promise<boolean>} - True if all valid
 *
 * @example
 * await validateForeignKeys([
 *   { model: 'Hotel', id: hotelId, field: 'Otel', required: true },
 *   { model: 'Room', id: roomId, field: 'Oda', required: true, query: { hotel: hotelId } },
 *   { model: 'Booking', id: bookingId, field: 'Rezervasyon' }
 * ], { session })
 */
export const validateForeignKeys = async (validations, options = {}) => {
  const { session } = options

  // Filter out empty optional validations for efficiency
  const activeValidations = validations.filter(v => v.id || v.required)

  if (activeValidations.length === 0) {
    return true
  }

  // Run all validations in parallel
  const results = await Promise.allSettled(
    activeValidations.map(v =>
      validateForeignKey(v.model, v.id, v.field, {
        session,
        required: v.required,
        additionalQuery: v.query || {}
      })
    )
  )

  // Collect all errors
  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason.message)

  if (errors.length > 0) {
    throw new BadRequestError(errors.join(', '))
  }

  return true
}

/**
 * Create a Mongoose pre-save middleware for FK validation
 * @param {Array} fieldConfigs - Array of field configurations
 * @returns {Function} - Mongoose middleware function
 *
 * @example
 * staySchema.pre('save', createFKValidationMiddleware([
 *   { field: 'hotel', model: 'Hotel', required: true },
 *   { field: 'room', model: 'Room', required: true, scopeField: 'hotel' },
 *   { field: 'booking', model: 'Booking', scopeField: 'hotel' }
 * ]))
 */
export const createFKValidationMiddleware = fieldConfigs => {
  return async function (next) {
    try {
      // Only validate modified fields (for updates) or all fields (for new docs)
      const validations = fieldConfigs
        .filter(config => this.isNew || this.isModified(config.field))
        .map(config => {
          const validation = {
            model: config.model,
            id: this[config.field],
            field: config.fieldLabel || config.field,
            required: config.required
          }

          // Add scope query if specified (e.g., check room belongs to same hotel)
          if (config.scopeField && this[config.scopeField]) {
            validation.query = { [config.scopeField]: this[config.scopeField] }
          }

          return validation
        })

      if (validations.length > 0) {
        await validateForeignKeys(validations)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Validate FK with existence check and return the document
 * Useful when you need the referenced document for further processing
 * @param {string} modelName - The model to check against
 * @param {ObjectId|string} id - The ID to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Additional options
 * @returns {Promise<Document>} - The found document
 * @throws {BadRequestError} - If reference doesn't exist
 */
export const validateAndGetDocument = async (modelName, id, fieldName, options = {}) => {
  const { session, required = false, additionalQuery = {}, select } = options

  if (!id) {
    if (required) {
      throw new BadRequestError(`${fieldName} zorunludur`)
    }
    return null
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Geçersiz ${fieldName} formatı`)
  }

  try {
    const Model = mongoose.model(modelName)
    let query = Model.findOne({ _id: id, ...additionalQuery })

    if (session) query = query.session(session)
    if (select) query = query.select(select)

    const doc = await query

    if (!doc) {
      throw new BadRequestError(`${fieldName} bulunamadı`)
    }

    return doc
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error
    }
    logger.error(`[FK Validation] Error fetching ${modelName}:`, error.message)
    throw new BadRequestError(`${fieldName} doğrulanamadı`)
  }
}

/**
 * Check if a document has any references pointing to it (reverse FK check)
 * Useful before deleting to prevent orphan references
 * @param {ObjectId|string} id - The ID to check references for
 * @param {Array} references - Array of { model, field } to check
 * @returns {Promise<Object>} - { hasReferences: boolean, references: [...] }
 */
export const checkReferences = async (id, references) => {
  const foundRefs = []

  await Promise.all(
    references.map(async ({ model, field, label }) => {
      try {
        const Model = mongoose.model(model)
        const count = await Model.countDocuments({ [field]: id })

        if (count > 0) {
          foundRefs.push({
            model,
            field,
            label: label || model,
            count
          })
        }
      } catch (error) {
        logger.warn(`[FK Check] Could not check ${model}.${field}:`, error.message)
      }
    })
  )

  return {
    hasReferences: foundRefs.length > 0,
    references: foundRefs
  }
}

/**
 * Prevent deletion if references exist
 * @param {ObjectId|string} id - The ID to check
 * @param {Array} references - Array of { model, field, label } to check
 * @throws {BadRequestError} - If references exist
 */
export const preventDeleteWithReferences = async (id, references) => {
  const { hasReferences, references: refs } = await checkReferences(id, references)

  if (hasReferences) {
    const refDetails = refs.map(r => `${r.label} (${r.count})`).join(', ')
    throw new BadRequestError(`Silinemez: Bu kayda bağlı veriler mevcut - ${refDetails}`)
  }
}
