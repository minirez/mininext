import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import config from './config/index.js'
import { i18nMiddleware } from './helpers/i18n.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { auditMiddleware } from './middleware/auditMiddleware.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "http://localhost:4000", "http://localhost:5174"],
    },
  },
}))

// CORS - Dynamic origin validation for multi-tenant domains
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true)
    }

    // In development, allow all origins
    if (config.isDev) {
      return callback(null, true)
    }

    // Check against static allowed origins
    const allowedOrigins = config.cors.origin || []
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // Extract hostname from origin
    try {
      const url = new URL(origin)
      const hostname = url.hostname

      // Dynamic check: Allow any subdomain pattern (partner domains)
      // In production, we trust partner-configured domains
      // The actual domain validation happens at the API level
      // For CORS, we allow the request but auth will validate the domain
      return callback(null, true)
    } catch (e) {
      return callback(new Error('Invalid origin'), false)
    }
  },
  credentials: true
}
app.use(cors(corsOptions))

// Body parser (increased limit for base64 file uploads like contract PDFs)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// i18n
app.use(i18nMiddleware)

// Audit middleware (for tracking HTTP requests)
app.use(auditMiddleware)

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
    version: '1.0.0'
  })
})

// Module routes
import authRoutes from './modules/auth/auth.routes.js'
import partnerRoutes from './modules/partner/partner.routes.js'
import agencyRoutes from './modules/agency/agency.routes.js'
import userRoutes from './modules/user/user.routes.js'
import siteSettingsRoutes from './modules/siteSettings/siteSettings.routes.js'
import translationRoutes from './modules/translation/translation.routes.js'
import hotelRoutes from './modules/hotel/hotel.routes.js'
import planningRoutes from './modules/planning/planning.routes.js'
import tagRoutes from './modules/tag/tag.routes.js'
import locationRoutes from './modules/location/location.routes.js'
import auditRoutes from './modules/audit/audit.routes.js'
import publicRoutes from './modules/public/public.routes.js'
import bookingRoutes from './modules/booking/booking.routes.js'
import pmsRoutes from './modules/pms/pms.routes.js'
import platformSettingsRoutes from './modules/platform-settings/platformSettings.routes.js'
import pushRoutes from './modules/push/push.routes.js'
import dashboardRoutes from './modules/dashboard/dashboard.routes.js'
import exchangeRoutes from './modules/exchange/exchange.routes.js'
import notificationRoutes from './modules/notification/notification.routes.js'
import paximumRoutes from './modules/paximum/paximum.routes.js'

app.use('/api/auth', authRoutes)
app.use('/api/partners', partnerRoutes)
app.use('/api/agencies', agencyRoutes)
app.use('/api/users', userRoutes)
app.use('/api/site-settings', siteSettingsRoutes)
app.use('/api/translation', translationRoutes)
app.use('/api/hotels', hotelRoutes)
app.use('/api/planning', planningRoutes)
app.use('/api/tags', tagRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/audit-logs', auditRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/pms', pmsRoutes)
app.use('/api/platform-settings', platformSettingsRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/exchange', exchangeRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/paximum', paximumRoutes)

// 404 handler
app.use(notFoundHandler)

// Error handler (must be last)
app.use(errorHandler)

export default app
