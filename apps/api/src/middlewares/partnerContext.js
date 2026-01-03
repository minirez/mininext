/**
 * Partner Context Middleware
 *
 * Platform admins can set X-Partner-Id header to view/manage data as a specific partner.
 * This middleware extracts the partner ID from the header and attaches it to the request.
 */

export const partnerContext = (req, res, next) => {
  // Get partner ID from header (sent by frontend when platform admin selects a partner)
  const partnerIdHeader = req.headers['x-partner-id']

  if (partnerIdHeader) {
    // Only platform admins can use this feature
    if (req.user?.accountType === 'platform' && req.user?.role === 'admin') {
      req.partnerId = partnerIdHeader
      req.viewingAsPartner = true
    }
    // Regular users cannot spoof partner ID - silently ignore
  }

  // For partner users, use their own partner ID
  if (req.user?.accountType === 'partner') {
    req.partnerId = req.user.accountId
  }

  // For PMS users, use their partner ID from the PMS token
  // This allows PMS users to access agency and other partner-scoped resources
  if (req.pmsPartnerId && !req.partnerId) {
    req.partnerId = req.pmsPartnerId
  }

  // For agency users, their partner ID is stored in the agency document
  // This will be handled in specific routes that need it

  next()
}
