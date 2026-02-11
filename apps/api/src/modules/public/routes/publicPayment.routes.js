/**
 * Public Payment Routes
 * Payment methods, BIN query, payment initiation, callbacks, bank accounts
 */

import express from 'express'
import * as publicService from '../public.service.js'
import { pricingLimiter, publicBookingLimiter } from '#middleware/rateLimiter.js'
import { validateBody, validateQuery } from '#middleware/validation.js'
import PlatformSettings from '#modules/platform-settings/platformSettings.model.js'
import Partner from '#modules/partner/partner.model.js'
import { asyncHandler } from '#helpers'

const router = express.Router()

/**
 * @swagger
 * /api/public/payment/bin:
 *   post:
 *     tags: [Public]
 *     summary: Query card BIN for installment options
 *     description: Get installment options based on card BIN number (first 6-8 digits)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hotelCode, bin, amount]
 *             properties:
 *               hotelCode:
 *                 type: string
 *                 description: Hotel slug or ID
 *               bin:
 *                 type: string
 *                 description: First 6-8 digits of card number
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               currency:
 *                 type: string
 *                 default: TRY
 *     responses:
 *       200:
 *         description: BIN query result with installment options
 */
router.post(
  '/payment/bin',
  pricingLimiter,
  validateBody({
    hotelCode: { type: 'string', required: true },
    bin: { type: 'string', required: true },
    amount: { type: 'number', required: true },
    currency: { type: 'string' }
  }),
  publicService.queryBinPublic
)

/**
 * @swagger
 * /api/public/bookings/{bookingNumber}/pay:
 *   post:
 *     tags: [Public]
 *     summary: Initiate credit card payment for booking
 *     description: Start a credit card payment process. Returns 3D Secure redirect URL.
 *     security: []
 *     parameters:
 *       - name: bookingNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, card]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email for verification
 *               posId:
 *                 type: string
 *                 description: Optional POS ID (auto-selected if not provided)
 *               installment:
 *                 type: integer
 *                 default: 1
 *                 description: Number of installments
 *               card:
 *                 type: object
 *                 required: [holder, number, expiry, cvv]
 *                 properties:
 *                   holder:
 *                     type: string
 *                   number:
 *                     type: string
 *                   expiry:
 *                     type: string
 *                     description: MM/YY format
 *                   cvv:
 *                     type: string
 *     responses:
 *       200:
 *         description: Payment initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     transactionId:
 *                       type: string
 *                     requires3D:
 *                       type: boolean
 *                     formUrl:
 *                       type: string
 *                       description: URL to redirect for 3D Secure
 *                     status:
 *                       type: string
 */
router.post(
  '/bookings/:bookingNumber/pay',
  publicBookingLimiter,
  validateBody({
    email: { type: 'string', required: true },
    posId: { type: 'string' },
    installment: { type: 'integer' },
    card: { type: 'object', required: true }
  }),
  publicService.initiateBookingPayment
)

/**
 * @swagger
 * /api/public/bookings/{bookingNumber}/payment-status:
 *   get:
 *     tags: [Public]
 *     summary: Get payment status for booking
 *     description: Check payment status for a booking. Can check specific payment or overall status.
 *     security: []
 *     parameters:
 *       - name: bookingNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: email
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *       - name: paymentId
 *         in: query
 *         schema:
 *           type: string
 *         description: Optional specific payment ID to check
 *     responses:
 *       200:
 *         description: Payment status
 */
router.get(
  '/bookings/:bookingNumber/payment-status',
  validateQuery({
    email: { type: 'string', required: true },
    paymentId: { type: 'string' }
  }),
  publicService.getPaymentStatus
)

/**
 * @swagger
 * /api/public/hotels/{hotelCode}/payment-methods:
 *   get:
 *     tags: [Public]
 *     summary: Get available payment methods for hotel
 *     description: Returns enabled payment methods and installment options
 *     security: []
 *     parameters:
 *       - name: hotelCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment methods configuration
 */
router.get('/hotels/:hotelCode/payment-methods', publicService.getPaymentMethods)

/**
 * @swagger
 * /api/public/payment/callback:
 *   get:
 *     tags: [Public]
 *     summary: 3D Secure callback
 *     description: Callback endpoint for 3D Secure verification. Redirects to appropriate page.
 *     security: []
 *     parameters:
 *       - name: transactionId
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: paymentId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to result page
 */
router.get('/payment/callback', publicService.payment3DCallback)
router.post('/payment/callback', publicService.payment3DCallback)

/**
 * @swagger
 * /api/public/payment/bank-accounts:
 *   get:
 *     tags: [Public]
 *     summary: Get bank accounts for bank transfer
 *     description: Returns active bank accounts and description for bank transfer payment.
 *     security: []
 *     parameters:
 *       - name: partnerId
 *         in: query
 *         schema:
 *           type: string
 *         description: Partner ID (optional, uses platform accounts if not specified or partner uses platform accounts)
 *     responses:
 *       200:
 *         description: Bank accounts list
 */
router.get(
  '/payment/bank-accounts',
  asyncHandler(async (req, res) => {
    const { partnerId } = req.query

    let bankAccounts = []
    let bankTransferDescription = {}
    let bankTransferEnabled = false

    // Check if partner has own bank accounts
    if (partnerId) {
      const partner = await Partner.findById(partnerId).lean()
      if (
        partner?.paymentSettings &&
        !partner.paymentSettings.usePlatformBankAccounts &&
        partner.paymentSettings.bankAccounts?.length > 0
      ) {
        bankAccounts = partner.paymentSettings.bankAccounts.filter(a => a.isActive)
        bankTransferDescription = partner.paymentSettings.bankTransferDescription || {}
        bankTransferEnabled = partner.paymentSettings.bankTransferEnabled || false

        return res.json({
          success: true,
          data: { bankAccounts, bankTransferDescription, bankTransferEnabled }
        })
      }
    }

    // Fall back to platform bank accounts
    const settings = await PlatformSettings.getSettings()
    bankAccounts = (settings.billing?.bankAccounts || []).filter(a => a.isActive)
    bankTransferDescription = settings.billing?.bankTransferDescription || {}
    bankTransferEnabled = settings.billing?.bankTransferEnabled || false

    res.json({
      success: true,
      data: { bankAccounts, bankTransferDescription, bankTransferEnabled }
    })
  })
)

export default router
