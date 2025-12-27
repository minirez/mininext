import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import config from './config/index.js'
import { i18nMiddleware } from './helpers/i18n.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

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

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}))

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// i18n
app.use(i18nMiddleware)

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

// 404 handler
app.use(notFoundHandler)

// Error handler (must be last)
app.use(errorHandler)

export default app
