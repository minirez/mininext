import express from 'express'
import * as myService from './my.service.js'
import { protect } from '#middleware/auth.js'
import logger from '#core/logger.js'

const router = express.Router()

// Payment callback (called by payment service - NO AUTH required)
// This must be before the protect middleware
router.post(
  '/subscription/payment-callback',
  (req, res, next) => {
    // Verify webhook key for security
    const webhookKey = req.headers['x-api-key'] || req.headers['x-webhook-key']
    const expectedKey = process.env.PAYMENT_WEBHOOK_KEY

    if (webhookKey !== expectedKey) {
      logger.error('[Subscription Callback] Invalid webhook key')
      return res.status(401).json({ success: false, error: 'Invalid webhook key' })
    }

    next()
  },
  myService.paymentCallback
)

// All other routes require authentication
router.use(protect)

// Get my subscription info (for partner users)
router.get('/subscription', myService.getMySubscription)

// Query BIN for subscription payment (for partner users)
router.post('/subscription/query-bin', myService.querySubscriptionBin)

// Activate trial (no payment, one-time only)
router.post('/subscription/activate-trial', myService.activateTrial)

// Get subscription alert status (trial/renewal/grace warnings)
router.get('/subscription/alert', myService.getSubscriptionAlert)

// Initiate subscription purchase with payment (for partner users)
router.post('/subscription/purchase', myService.initiatePurchase)

// Pay for existing pending purchase (admin-created packages)
router.post('/subscription/purchases/:purchaseId/pay', myService.payPendingPurchase)

// Membership self-service
router.get('/membership', myService.getMyMembership)
router.get('/membership/catalog', myService.getMembershipCatalog)
router.post('/membership/purchase', myService.purchaseMembership)

// Get my invoices (for partner users)
router.get('/invoices', myService.getMyInvoices)

// Download invoice PDF (for partner users)
router.get('/invoices/:id/pdf', myService.downloadMyInvoicePDF)

export default router
