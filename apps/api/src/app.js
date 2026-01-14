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

// CORS - Dynamic origin validation for multi-tenant domains
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true)
    }

    // Development: Allow localhost origins only
    if (config.isDev) {
      try {
        const url = new URL(origin)
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          return callback(null, true)
        }
      } catch (_e) {
        // Invalid URL, reject
      }
    }

    // Check against static allowed origins from env
    const allowedOrigins = config.cors.origin || []
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // Extract hostname from origin for dynamic partner domain validation
    try {
      const url = new URL(origin)
      const hostname = url.hostname

      // Allow localhost in development
      if (config.isDev && (hostname === 'localhost' || hostname === '127.0.0.1')) {
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
app.use(cors(corsOptions))

// Body parser (10MB limit - sufficient for most uploads, prevents DoS)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// i18n
app.use(i18nMiddleware)

// Audit middleware (for tracking HTTP requests)
app.use(auditMiddleware)

// CSRF Protection (for state-changing requests)
app.use(csrfProtection)

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
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

// 404 handler
app.use(notFoundHandler)

// Error handler (must be last)
app.use(errorHandler)

export default app
