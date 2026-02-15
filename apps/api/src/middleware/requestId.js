import { randomUUID } from 'crypto'

/**
 * Request ID middleware
 * Generates a unique request ID for each incoming request.
 * Accepts X-Request-ID from upstream (load balancer, gateway) or generates a new one.
 * Attaches it to req.id and sets it on the response header.
 */
export function requestIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || randomUUID()

  req.id = requestId
  res.setHeader('X-Request-ID', requestId)

  next()
}
