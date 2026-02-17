import express from 'express'
import * as packageService from './subscription-package.service.js'
import { protect, requireAdmin } from '#middleware/auth.js'

const router = express.Router()

// Public / partner-facing (requires auth)
router.get('/active', protect, packageService.listActive)

// Admin routes
router.use(protect)
router.use(requireAdmin)

router.get('/', packageService.list)
router.get('/:id', packageService.getById)
router.post('/', packageService.create)
router.put('/:id', packageService.update)
router.delete('/:id', packageService.remove)

export default router
