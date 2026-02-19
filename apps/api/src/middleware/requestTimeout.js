/**
 * Request Timeout middleware
 * Enforces a maximum duration for requests to prevent hanging connections.
 * Default: 30 seconds for API, 120 seconds for file uploads/search.
 */
export function requestTimeout(defaultMs = 30000) {
  return (req, res, next) => {
    // AI contract endpoints — no timeout (multi-pass Gemini can take 10+ min)
    const isContractEndpoint =
      req.path.includes('/contract/') ||
      req.url.includes('/contract/') ||
      req.originalUrl?.includes('/contract/')
    if (isContractEndpoint) return next()

    const isUpload =
      req.path.includes('/upload') || req.path.includes('/avatar') || req.path.includes('/photos')

    // Public search/availability — can be heavy for hotels with many room types
    const isSearch =
      req.path.includes('/search') ||
      req.path.includes('/availability') ||
      req.originalUrl?.includes('/search') ||
      req.originalUrl?.includes('/availability')

    const timeout = isUpload || isSearch ? 120000 : defaultMs

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
