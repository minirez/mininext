import express from 'express'
import { getPaymentLinkByToken, completePaymentLink } from './paymentLink.service.js'

const router = express.Router()

/**
 * Public Payment Link Routes
 * These routes do not require authentication
 * They are accessed by customers via the payment link
 */

// Get payment link details by token
router.get('/:token', getPaymentLinkByToken)

// Complete payment (called by payment service after successful payment)
router.post('/:token/complete', completePaymentLink)

export default router
