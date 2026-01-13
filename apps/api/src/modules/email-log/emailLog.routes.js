import express from 'express'
import * as emailLogService from './emailLog.service.js'
import { protect } from '#middleware/auth.js'
import { requirePermission } from '#middleware/permission.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// Get email logs (platform: all, partner: own)
router.get('/', requirePermission('settings', 'view'), emailLogService.getEmailLogs)

// Get email stats
router.get('/stats', requirePermission('settings', 'view'), emailLogService.getEmailStats)

// Get single email log
router.get('/:id', requirePermission('settings', 'view'), emailLogService.getEmailLog)

// Retry failed email (platform only)
router.post('/:id/retry', requirePermission('settings', 'edit'), emailLogService.retryEmail)

export default router
