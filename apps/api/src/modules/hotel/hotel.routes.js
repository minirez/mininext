import express from 'express'
import { protect, requireAdmin } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'

// Import sub-route modules
import baseRoutes from './routes/hotelBase.routes.js'
import roomTemplateRoutes from './routes/hotelRoomTemplates.routes.js'
import aiRoutes from './routes/hotelAI.routes.js'
import linkRoutes from './routes/hotelLink.routes.js'
import crudRoutes from './routes/hotelCrud.routes.js'
import photosRoutes from './routes/hotelPhotos.routes.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(protect)
router.use(requireAdmin)

// ===== SuperAdmin Routes (no partnerContext) =====
// These routes must come BEFORE partnerContext
router.use('/', baseRoutes) // Base hotel CRUD and linked partners
router.use('/', roomTemplateRoutes) // Room templates management
router.use('/', aiRoutes) // AI extraction

// Apply partner context for remaining routes
router.use(partnerContext)

// ===== Partner Routes (with partnerContext) =====
router.use('/', linkRoutes) // Link/unlink to base hotels
router.use('/', crudRoutes) // Partner hotel CRUD
router.use('/', photosRoutes) // Image and logo management

export default router
