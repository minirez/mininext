/**
 * Simple API Key Authentication Middleware
 * For gateway/internal service authentication
 */

/**
 * API Key validation middleware factory
 * @param {Object} options
 * @param {string[]} options.validKeys - Valid API key list
 * @param {string} options.headerName - API key header name (default: x-api-key)
 * @param {boolean} options.optional - Is key optional? (default: false)
 * @returns {Function} Express middleware
 */
export function simpleApiKeyAuth(options = {}) {
  const {
    validKeys = [],
    headerName = 'x-api-key',
    optional = false
  } = options

  // Get keys from env
  const envKeys = process.env.VALID_API_KEYS?.split(',').map(k => k.trim()) || []
  const allValidKeys = [...new Set([...validKeys, ...envKeys])]

  return (req, res, next) => {
    const apiKey = req.headers[headerName.toLowerCase()]

    // No key provided
    if (!apiKey) {
      if (optional) {
        return next()
      }
      return res.status(401).json({
        status: false,
        error: 'API Key required'
      })
    }

    // Invalid key
    if (!allValidKeys.includes(apiKey)) {
      return res.status(403).json({
        status: false,
        error: 'Invalid API Key'
      })
    }

    // Add key info to request
    req.apiKey = apiKey
    req.apiKeyValid = true

    next()
  }
}

export default simpleApiKeyAuth
