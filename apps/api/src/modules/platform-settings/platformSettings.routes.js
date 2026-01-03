import express from 'express'
import { protect, requirePlatformAdmin } from '../../middleware/auth.js'
import * as service from './platformSettings.service.js'

const router = express.Router()

// Public routes
router.get('/vapid-public-key', service.getVAPIDPublicKey)

// Protected routes (Platform Admin only)
router.use(protect)
router.use(requirePlatformAdmin)

// Get platform settings
router.get('/', service.getSettings)

// Update platform settings
router.put('/', service.updateSettings)

// Test email
router.post('/test-email', service.testEmail)

// Test SMS
router.post('/test-sms', service.testSMS)

// Generate VAPID keys
router.post('/generate-vapid', service.generateVAPIDKeys)

// Test Paximum connection
router.post('/test-paximum', service.testPaximum)

export default router
