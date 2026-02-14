import express from 'express'
import * as service from './membership-package.service.js'
import { protect, requireAdmin } from '#middleware/auth.js'

const router = express.Router()

// Public catalog (auth optional - before protect middleware)
router.get('/public', service.getPublicCatalog)

// All other routes require authentication + admin
router.use(protect)
router.use(requireAdmin)

// Stats
router.get('/stats', service.getStats)

// CRUD routes
router.get('/', service.getList)
router.get('/:id', service.getById)
router.get('/:id/calculate-price', service.calculatePrice)
router.post('/', service.create)
router.put('/:id', service.update)
router.delete('/:id', service.archive)

export default router
