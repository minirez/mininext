import express from 'express'
import {
  getPaymentLinks,
  getPaymentLink,
  createPaymentLink,
  updatePaymentLink,
  cancelPaymentLink,
  resendNotification,
  getPaymentLinkStats
} from './paymentLink.service.js'
import { protect } from '#middleware/auth.js'
import { requirePermission } from '#middleware/permission.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// Get payment link statistics
router.get(
  '/stats',
  requirePermission('payment-link', 'view'),
  getPaymentLinkStats
)

// List payment links
router.get(
  '/',
  requirePermission('payment-link', 'view'),
  getPaymentLinks
)

// Get single payment link
router.get(
  '/:id',
  requirePermission('payment-link', 'view'),
  getPaymentLink
)

// Create payment link
router.post(
  '/',
  requirePermission('payment-link', 'create'),
  createPaymentLink
)

// Update payment link
router.put(
  '/:id',
  requirePermission('payment-link', 'edit'),
  updatePaymentLink
)

// Cancel payment link
router.post(
  '/:id/cancel',
  requirePermission('payment-link', 'delete'),
  cancelPaymentLink
)

// Resend notification
router.post(
  '/:id/resend',
  requirePermission('payment-link', 'edit'),
  resendNotification
)

export default router
