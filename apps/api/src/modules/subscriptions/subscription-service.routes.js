import express from 'express'
import * as service from './subscription-service.service.js'
import { protect, requireAdmin } from '#middleware/auth.js'

const router = express.Router()

// Public / partner-facing (requires auth)
router.get('/active', protect, service.listActive)

// Admin routes
router.use(protect)
router.use(requireAdmin)

router.get('/', service.list)
router.get('/:id', service.getById)
router.post('/', service.create)
router.put('/:id', service.update)
router.delete('/:id', service.remove)

export default router
