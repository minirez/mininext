import express from 'express'
import * as authService from './auth.service.js'
import { protect } from '../../middleware/auth.js'
import { strictLimiter } from '../../middleware/rateLimiter.js'

const router = express.Router()

// Public routes - with strict rate limiting to prevent brute force attacks
router.post('/login', strictLimiter, authService.login)
router.post('/register', strictLimiter, authService.register)
router.post('/refresh-token', strictLimiter, authService.refreshToken)

// Protected routes
router.post('/logout', protect, authService.logout)
router.get('/me', protect, authService.me)
router.put('/notification-preferences', protect, authService.updateNotificationPreferences)
router.put('/change-password', protect, strictLimiter, authService.changePassword)

export default router
