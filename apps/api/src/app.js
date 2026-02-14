import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import config from './config/index.js'
import { i18nMiddleware } from './helpers/i18n.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { auditMiddleware } from './middleware/auditMiddleware.js'
import { csrfProtection } from './middleware/csrf.js'
import { initSentry, sentryErrorHandler } from './core/sentry.js'

// Initialize Sentry before anything else
initSentry()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'http://localhost:4000', 'http://localhost:5174']
      }
    }
  })
)

// CORS for public routes (widget embeds on any domain)
app.use('/api/public', cors({ origin: true, credentials: false }))

// CORS for channel manager webhooks (called by Reseliva)
app.use('/api/channel-manager/webhook', cors({ origin: true, credentials: false }))

// CORS - Dynamic origin validation for multi-tenant domains
// Public routes are already handled above with open CORS, skip them here
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true)
    }

    // Check against static allowed origins from env (CORS_ORIGIN)
    const allowedOrigins = config.cors.origin || []
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // Extract hostname from origin for additional checks
    try {
      const url = new URL(origin)
      const hostname = url.hostname

      // Development: Allow localhost and local dev domains
      if (config.isDev) {
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return callback(null, true)
        }
        // Allow *.mini.com for local development
        if (hostname.endsWith('.mini.com') || hostname === 'mini.com') {
          return callback(null, true)
        }
        // Allow *.minirezervasyon.com for local storefront development
        if (hostname.endsWith('.minirezervasyon.com') || hostname === 'minirezervasyon.com') {
          return callback(null, true)
        }
      }

      // Allow *.maxirez.com for production subdomains
      if (hostname.endsWith('.maxirez.com') || hostname === 'maxirez.com') {
        return callback(null, true)
      }

      // Allow *.minirez.com for hotel partner domain
      if (hostname.endsWith('.minirez.com') || hostname === 'minirez.com') {
        return callback(null, true)
      }

      // Production: Only allow configured origins
      // Partner domains should be added to CORS_ORIGIN env variable
      return callback(new Error('Origin not allowed by CORS'), false)
    } catch (_e) {
      return callback(new Error('Invalid origin'), false)
    }
  },
  credentials: true
}
// Skip public routes - they already have open CORS (widget can embed on any domain)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/public')) return next()
  cors(corsOptions)(req, res, next)
})

// Body parser (10MB limit - sufficient for most uploads, prevents DoS)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// i18n
app.use(i18nMiddleware)

// Audit middleware (for tracking HTTP requests)
app.use(auditMiddleware)

// CSRF Protection (for state-changing requests)
app.use(csrfProtection)

// Health check - liveness (basic: is process alive?)
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  })
})

// Health check - readiness (detailed: are dependencies healthy?)
app.get('/health/ready', async (_req, res) => {
  const checks = {}
  let healthy = true

  // MongoDB check
  try {
    const mongoose = (await import('mongoose')).default
    const state = mongoose.connection.readyState
    checks.mongodb = {
      status: state === 1 ? 'ok' : 'error',
      readyState: ['disconnected', 'connected', 'connecting', 'disconnecting'][state] || 'unknown'
    }
    if (state !== 1) healthy = false
  } catch {
    checks.mongodb = { status: 'error' }
    healthy = false
  }

  // Redis check
  try {
    const { isRedisConnected, getRedisClient } = await import('./core/redis.js')
    if (isRedisConnected()) {
      await getRedisClient().ping()
      checks.redis = { status: 'ok' }
    } else {
      checks.redis = { status: 'disabled' }
    }
  } catch {
    checks.redis = { status: 'error' }
  }

  // Uptime & Memory
  const memUsage = process.memoryUsage()
  checks.system = {
    uptime: `${Math.floor(process.uptime())}s`,
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
    },
    nodeVersion: process.version
  }

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'ready' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  })
})

// API Routes
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Booking Engine API',
    version: '1.0.0',
    docs: '/api/docs'
  })
})

// Swagger API Documentation
import { setupSwagger } from './loaders/swagger.js'
setupSwagger(app)

// Auto-load module routes
import { loadRoutes } from './loaders/routes.js'
await loadRoutes(app)

// Payment webhook routes (must be loaded separately - not part of booking module)
import paymentWebhookRoutes from './modules/booking/paymentWebhook.routes.js'
app.use('/api/payments', paymentWebhookRoutes)

// Payment analytics routes
import paymentAnalyticsRoutes from './modules/booking/paymentAnalytics.routes.js'
app.use('/api/payments/analytics', paymentAnalyticsRoutes)

// Payment link public routes (no auth required)
import paymentLinkPublicRoutes from './modules/paymentLink/paymentLinkPublic.routes.js'
app.use('/api/pay', paymentLinkPublicRoutes)

// Public storefront routes (no auth required - resolves partner from domain)
import publicStorefrontRoutes from './modules/public/publicStorefront.routes.js'
app.use('/api/public/storefront', publicStorefrontRoutes)

// Public Paximum routes (storefront API key auth - for site3 server-to-server calls)
import publicPaximumRoutes from './modules/public/publicPaximum.routes.js'
app.use('/api/public/paximum', publicPaximumRoutes)

// Legacy storefront routes (backward compatibility with site3)
// These use the old API structure with referer-based partner resolution
import legacyStorefrontRoutes from './modules/legacyStorefront/legacyStorefront.routes.js'
app.use('/storefronts', legacyStorefrontRoutes)

// Short URL redirect (for link.mini.com / link.maxirez.com)
import shortUrlRoutes from './modules/shortUrl/shortUrl.routes.js'
app.use('/l', shortUrlRoutes)

// 404 handler
app.use(notFoundHandler)

// Sentry error handler (captures 5xx errors before response)
app.use(sentryErrorHandler())

// Error handler (must be last)
app.use(errorHandler)

export default app
