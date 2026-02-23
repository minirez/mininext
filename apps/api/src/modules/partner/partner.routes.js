import express from 'express'
import * as partnerService from './partner.service.js'
import { protect, requireAdmin, requirePartnerOrAdmin } from '#middleware/auth.js'
import { partnerContext } from '#middleware/partnerContext.js'
import upload from '#helpers/upload.js'

const router = express.Router()

// ==================== Partner Self-Profile Routes ====================
// Partner users manage their own profile, platform admins manage selected partner
router.get(
  '/my/profile',
  protect,
  requirePartnerOrAdmin,
  partnerContext,
  partnerService.getMyProfile
)
router.put(
  '/my/profile',
  protect,
  requirePartnerOrAdmin,
  partnerContext,
  partnerService.updateMyProfile
)
router.put(
  '/my/admin-theme',
  protect,
  requirePartnerOrAdmin,
  partnerContext,
  partnerService.updateMyAdminTheme
)
router.post(
  '/my/profile/logo',
  protect,
  requirePartnerOrAdmin,
  partnerContext,
  upload.single('logo'),
  partnerService.uploadMyLogo
)
router.put(
  '/my/pos-settings',
  protect,
  requirePartnerOrAdmin,
  partnerContext,
  partnerService.updatePosSettings
)
router.delete(
  '/my/profile/logo',
  protect,
  requirePartnerOrAdmin,
  partnerContext,
  partnerService.deleteMyLogo
)
router.post(
  '/my/profile/favicon',
  protect,
  requirePartnerOrAdmin,
  partnerContext,
  upload.single('favicon'),
  partnerService.uploadMyFavicon
)
router.delete(
  '/my/profile/favicon',
  protect,
  requirePartnerOrAdmin,
  partnerContext,
  partnerService.deleteMyFavicon
)

// ==================== Admin Routes (require admin role) ====================
// All routes below require authentication and admin role
router.use(protect)
router.use(requireAdmin)
router.use(partnerContext)

// CRUD routes
router.post('/', partnerService.createPartner)
router.get('/', partnerService.getPartners)

// Static routes (must be before /:id to avoid conflicts)
router.get('/sms-providers', partnerService.getSMSProviders)
router.get('/subscription-catalog', partnerService.getCatalog)
router.get('/subscriptions/purchases', partnerService.getAllPurchases)

// Global subscription payment links management (admin) - must be before /:id
router.get('/subscription-payment-links', partnerService.getAllSubscriptionPaymentLinks)
router.delete(
  '/subscription-payment-links/:linkId',
  partnerService.softDeleteSubscriptionPaymentLink
)
router.post(
  '/subscription-payment-links/:linkId/restore',
  partnerService.restoreSubscriptionPaymentLink
)

router.get('/:id', partnerService.getPartner)
router.put('/:id', partnerService.updatePartner)
router.put('/:id/admin-theme', partnerService.updatePartnerAdminTheme)
router.delete('/:id', partnerService.deletePartner)

// Actions
router.post('/:id/activate', partnerService.activatePartner)
router.post('/:id/deactivate', partnerService.deactivatePartner)
router.post('/:id/approve', partnerService.approvePartner)

// Subscription Management (purchases & PMS limits)
router.get('/:id/subscription', partnerService.getSubscription)
router.put('/:id/subscription', partnerService.updateSubscription)
router.post('/:id/subscription/purchases', partnerService.addPurchase)
router.put('/:id/subscription/purchases/:purchaseId', partnerService.updatePurchase)
router.post('/:id/subscription/purchases/:purchaseId/cancel', partnerService.cancelPurchase)
router.post('/:id/subscription/purchases/:purchaseId/mark-paid', partnerService.markPurchaseAsPaid)
router.delete('/:id/subscription/purchases/:purchaseId', partnerService.deletePurchase)
router.get(
  '/:id/subscription/purchases/:purchaseId/payment-links',
  partnerService.getPaymentLinksForPurchase
)
router.post(
  '/:id/subscription/purchases/:purchaseId/send-link',
  partnerService.sendPaymentLinkForPurchase
)
router.post('/:id/subscription/purchase-with-link', partnerService.createPurchaseWithPaymentLink)
router.post(
  '/:id/subscription/payment-links/:linkId/cancel',
  partnerService.cancelSubscriptionPaymentLink
)
router.post(
  '/:id/subscription/payment-links/:linkId/resend',
  partnerService.resendSubscriptionPaymentLinkNotification
)

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
