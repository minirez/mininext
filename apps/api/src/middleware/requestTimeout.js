/**
 * Request Timeout middleware
 * Enforces a maximum duration for requests to prevent hanging connections.
 * Default: 30 seconds for API, 120 seconds for file uploads.
 */
export function requestTimeout(defaultMs = 30000) {
  return (req, res, next) => {
    // Longer timeout for file upload and AI processing endpoints
    // AI contract parsing needs up to 5 min for large contracts (16+ rooms)
    const isContractParse = req.path.includes('/contract/parse')
    const isUpload =
      req.path.includes('/upload') ||
      req.path.includes('/avatar') ||
      req.path.includes('/photos') ||
      req.path.includes('/import')
    const timeout = isContractParse ? 300000 : isUpload ? 180000 : defaultMs

    req.setTimeout(timeout)
    res.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout'
        })
      }
    })

    next()
  }
}
