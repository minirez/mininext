import express from 'express'
import * as myService from './my.service.js'
import { protect } from '#middleware/auth.js'

const router = express.Router()

// All routes require authentication (but not admin)
router.use(protect)

// Get my subscription info (for partner users)
router.get('/subscription', myService.getMySubscription)

// Initiate subscription purchase with payment (for partner users)
router.post('/subscription/purchase', myService.initiatePurchase)

// Payment callback (called by payment service - needs to be accessible)
// Note: This is called internally by payment service with forwarded auth
router.post('/subscription/payment-callback', myService.paymentCallback)

// Get my invoices (for partner users)
router.get('/invoices', myService.getMyInvoices)

// Download invoice PDF (for partner users)
router.get('/invoices/:id/pdf', myService.downloadMyInvoicePDF)

export default router
