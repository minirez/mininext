/**
 * Partner Isolation Helper
 * Provides consistent partner filtering across all services
 */

/**
 * Get effective partner ID from request
 * @param {Object} req - Express request object
 * @returns {string|null} - Partner ID or null for platform-level
 */
export function getEffectivePartnerId(req) {
  if (req.user?.accountType === 'partner') {
    // Partner users: always use their own partner
    return req.user.accountId
  }
  // Platform admin: use selected partner from header or query
  return req.partnerId || req.query?.partnerId || null
}

/**
 * Build partner filter for MongoDB queries
 * Ensures strict partner isolation
 * @param {Object} req - Express request object
 * @param {string} fieldName - The field name for partner (default: 'partner')
 * @returns {Object} - MongoDB filter condition
 */
export function buildPartnerFilter(req, fieldName = 'partner') {
  const partnerId = getEffectivePartnerId(req)

  if (partnerId) {
    return { [fieldName]: partnerId }
  }

  // Platform admin without partner selection: show only platform-level items
  return {
    $or: [
      { [fieldName]: null },
      { [fieldName]: { $exists: false } }
    ]
  }
}

/**
 * Build partner condition for $and queries
 * Use this when you need to add partner filter to existing conditions array
 * @param {Object} req - Express request object
 * @param {string} fieldName - The field name for partner (default: 'partner')
 * @returns {Object} - MongoDB condition to push to $and array
 */
export function getPartnerCondition(req, fieldName = 'partner') {
  return buildPartnerFilter(req, fieldName)
}

/**
 * Check if user can access a document with given partner
 * @param {Object} req - Express request object
 * @param {string|Object|null} documentPartnerId - Partner ID from document
 * @returns {boolean} - True if access is allowed
 */
export function canAccessPartner(req, documentPartnerId) {
  const docPartnerId = documentPartnerId?.toString?.() || documentPartnerId

  if (req.user?.accountType === 'partner') {
    // Partner users: must match their partner
    return docPartnerId === req.user.accountId?.toString()
  }

  // Platform admin
  const selectedPartnerId = req.partnerId?.toString()

  if (selectedPartnerId) {
    // Partner selected: must match
    return docPartnerId === selectedPartnerId
  }

  // No partner selected: only platform-level (no partner)
  return !docPartnerId
}

/**
 * Get partner ID to assign to new documents
 * @param {Object} req - Express request object
 * @returns {string|undefined} - Partner ID or undefined for platform-level
 */
export function getPartnerForCreate(req) {
  if (req.user?.accountType === 'partner') {
    return req.user.accountId
  }
  // Platform admin: use selected partner or undefined for platform-level
  return req.partnerId || undefined
}

export default {
  getEffectivePartnerId,
  buildPartnerFilter,
  getPartnerCondition,
  canAccessPartner,
  getPartnerForCreate
}
