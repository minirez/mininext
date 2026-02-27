/**
 * Metrics Routes - Prometheus Metrics Endpoint
 * Protected by debug API key (x-debug-key header)
 *
 * GET /api/metrics → Prometheus-format metrics
 */

import express from 'express'
import client from 'prom-client'
import { timingSafeCompare } from '#helpers'

const router = express.Router()

// Debug API key middleware (reusable pattern from debug.routes.js)
const debugAuth = (req, res, next) => {
  // Allow key via header or query param (useful for Prometheus scraper config)
  const apiKey = req.headers['x-debug-key'] || req.query.key
  const validKey = process.env.DEBUG_API_KEY

  if (!validKey) {
    return res.status(503).json({
      success: false,
      error: 'Debug endpoint not configured'
    })
  }

  if (!timingSafeCompare(apiKey, validKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid debug key'
    })
  }

  next()
}

router.use(debugAuth)

/**
 * GET /api/metrics
 * Returns all registered Prometheus metrics in text exposition format
 */
router.get('/', async (_req, res) => {
  try {
    const metrics = await client.register.metrics()
    res.set('Content-Type', client.register.contentType)
    res.end(metrics)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/metrics/json
 * Returns metrics as JSON (useful for debugging)
 */
router.get('/json', async (_req, res) => {
  try {
    const metrics = await client.register.getMetricsAsJSON()
    res.json({
      success: true,
      data: metrics
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
