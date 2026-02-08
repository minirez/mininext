/**
 * Storefront API Key Authentication Middleware
 *
 * Provides server-to-server authentication for storefront frontends (e.g. site3)
 * that need to call Paximum/bedbank endpoints without a user JWT.
 *
 * The storefront key is a static secret shared between the API and the storefront
 * server. It is sent via the `x-storefront-key` header.
 *
 * This is NOT meant for end-user (browser) requests — only for the storefront's
 * server-side proxy layer.
 */

import config from '#config'
import { UnauthorizedError } from '#core/errors.js'
import logger from '#core/logger.js'

/**
 * Validate the x-storefront-key header against the configured secret.
 * Rejects with 401 if missing or invalid.
 */
export const requireStorefrontKey = (req, res, next) => {
  const key = req.headers['x-storefront-key']

  if (!key) {
    throw new UnauthorizedError('MISSING_STOREFRONT_KEY')
  }

  if (!config.storefrontApiKey) {
    logger.error('STOREFRONT_API_KEY is not configured on the server')
    throw new UnauthorizedError('STOREFRONT_AUTH_NOT_CONFIGURED')
  }

  if (key !== config.storefrontApiKey) {
    throw new UnauthorizedError('INVALID_STOREFRONT_KEY')
  }

  // Mark request as storefront-authenticated (no user context)
  req.isStorefront = true

  next()
}
