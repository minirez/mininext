/**
 * Notification Log Routes
 */

import express from 'express'
import notificationLogService from './notification-log.service.js'
import { protect } from '#middleware/auth.js'
import { asyncHandler } from '#helpers'

const router = express.Router()

// All routes require authentication
router.use(protect)

// Get notification logs (with filters)
router.get('/', asyncHandler(notificationLogService.list))

// Get statistics
router.get('/stats', asyncHandler(notificationLogService.getStats))

// Get type breakdown (for charts)
router.get('/breakdown', asyncHandler(notificationLogService.getTypeBreakdown))

// Get channel performance
router.get('/channels', asyncHandler(notificationLogService.getChannelStats))

// Get single log detail
router.get('/:id', asyncHandler(notificationLogService.getById))

export default router
