import express from 'express'
import emailLogService from './emailLog.service.js'
import { protect } from '#middleware/auth.js'
import { requirePermission } from '#middleware/permission.js'
import { asyncHandler } from '#helpers'

const router = express.Router()

// ==========================================
// PUBLIC ROUTES (no auth required)
// ==========================================

// AWS SES webhook (SNS notifications for delivery/bounce/complaint/open tracking)
// SNS sends body as text/plain, so we need text parser
router.post(
  '/ses-webhook',
  express.text({ type: ['text/plain', 'application/json'] }),
  asyncHandler(emailLogService.handleSESWebhook)
)

// ==========================================
// PROTECTED ROUTES
// ==========================================
router.use(protect)

// Get email logs (platform: all, partner: own)
router.get('/', requirePermission('settings', 'view'), asyncHandler(emailLogService.list))

// Get email stats
router.get('/stats', requirePermission('settings', 'view'), asyncHandler(emailLogService.getStats))

// Get single email log
router.get('/:id', requirePermission('settings', 'view'), asyncHandler(emailLogService.getById))

// Retry failed email (platform only)
router.post(
  '/:id/retry',
  requirePermission('settings', 'edit'),
  asyncHandler(emailLogService.retry)
)

export default router
