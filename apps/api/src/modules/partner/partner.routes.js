import express from 'express'
import * as partnerService from './partner.service.js'
import { protect, requireAdmin } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'
import upload from '#helpers/upload.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(protect)
router.use(requireAdmin)
router.use(partnerContext)

// CRUD routes
router.post('/', partnerService.createPartner)
router.get('/', partnerService.getPartners)

// Static routes (must be before /:id to avoid conflicts)
router.get('/sms-providers', partnerService.getSMSProviders)

router.get('/:id', partnerService.getPartner)
router.put('/:id', partnerService.updatePartner)
router.delete('/:id', partnerService.deletePartner)

// Actions
router.post('/:id/activate', partnerService.activatePartner)
router.post('/:id/deactivate', partnerService.deactivatePartner)
router.post('/:id/approve', partnerService.approvePartner)

// PMS Integration
router.post('/:id/activate-pms', partnerService.activatePms)
router.get('/:id/pms-status', partnerService.getPmsStatus)

// Document upload
router.post('/:id/upload', upload.single('document'), partnerService.uploadDocument)
router.delete('/:id/documents/:documentId', partnerService.deleteDocument)

// Serve document (authenticated)
router.get('/:id/documents/:documentId/file', partnerService.serveDocument)

// Email settings
router.get('/:id/email-settings', partnerService.getEmailSettings)
router.put('/:id/email-settings', partnerService.updateEmailSettings)
router.post('/:id/email-settings/create-identity', partnerService.createEmailIdentity)
router.get('/:id/email-settings/verification-status', partnerService.getVerificationStatus)
router.delete('/:id/email-settings/delete-identity', partnerService.deleteEmailIdentity)
router.post('/:id/email-settings/test-email', partnerService.testPartnerEmail)

// SMS settings
router.get('/:id/sms-settings', partnerService.getSMSSettings)
router.put('/:id/sms-settings', partnerService.updateSMSSettings)
router.post('/:id/sms-settings/test', partnerService.testPartnerSMS)
router.get('/:id/sms-settings/balance', partnerService.getSMSBalance)

export default router
