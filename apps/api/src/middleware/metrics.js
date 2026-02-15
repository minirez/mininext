/**
 * Prometheus Metrics Middleware
 * Collects HTTP request metrics and system-level metrics.
 *
 * Metrics exposed:
 *   - http_request_duration_seconds (histogram)
 *   - http_requests_total (counter)
 *   - http_active_requests (gauge)
 *   - http_response_size_bytes (histogram)
 *   - Default prom-client metrics (GC, heap, event loop, memory, etc.)
 */

import client from 'prom-client'

// ─── Collect default metrics (GC, heap stats, event loop, memory, etc.) ───
client.collectDefaultMetrics({
  prefix: '',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
})

// ─── HTTP Metrics ───

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
})

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

const httpActiveRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of currently active HTTP requests'
})

const httpResponseSize = new client.Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000]
})

// ─── Normalize route for labels ───

/**
 * Normalize Express route path for Prometheus labels.
 * Replaces ObjectId-like segments and numeric IDs with :id placeholder
 * to avoid high-cardinality label values.
 */
function normalizeRoute(req) {
  // Use the matched Express route pattern if available
  if (req.route && req.baseUrl !== undefined) {
    return `${req.baseUrl}${req.route.path}`
  }

  // Fallback: normalize the raw path
  let route = req.path || req.url

  // Replace MongoDB ObjectId patterns (24 hex chars)
  route = route.replace(/\/[a-f0-9]{24}/g, '/:id')

  // Replace numeric IDs
  route = route.replace(/\/\d+/g, '/:id')

  // Replace UUIDs
  route = route.replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, '/:id')

  return route
}

// ─── Express Middleware ───

/**
 * Metrics middleware - must be added BEFORE routes in app.js
 */
export function metricsMiddleware(req, res, next) {
  // Skip metrics endpoint itself to avoid self-referencing
  if (req.path === '/api/metrics') {
    return next()
  }

  // Track active requests
  httpActiveRequests.inc()

  // Start timer
  const end = httpRequestDuration.startTimer()

  // Hook into response finish
  res.on('finish', () => {
    httpActiveRequests.dec()

    const route = normalizeRoute(req)
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode
    }

    // Record duration
    end(labels)

    // Increment request counter
    httpRequestsTotal.inc(labels)

    // Record response size
    const contentLength = parseInt(res.getHeader('content-length'), 10)
    if (!isNaN(contentLength)) {
      httpResponseSize.observe(labels, contentLength)
    }
  })

  next()
}

/**
 * Cleanup function for graceful shutdown
 */
export function stopMetricsCollection() {
  client.register.clear()
}

export default metricsMiddleware
