/**
 * Notification Log Routes
 */

import express from 'express'
import * as notificationLogService from './notification-log.service.js'
import { protect, requireAdmin } from '#middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// Get notification logs (with filters)
router.get('/', notificationLogService.getNotificationLogs)

// Get statistics
router.get('/stats', notificationLogService.getNotificationStats)

// Get type breakdown (for charts)
router.get('/breakdown', notificationLogService.getTypeBreakdown)

// Get channel performance
router.get('/channels', notificationLogService.getChannelStats)

// Get single log detail
router.get('/:id', notificationLogService.getNotificationLog)

export default router
