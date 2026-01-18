import express from 'express'
import multer from 'multer'
import path from 'path'
import { protect } from '#middleware/auth.js'
import * as paymentService from './payment.service.js'

const router = express.Router({ mergeParams: true })

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payments/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    }
    cb(new Error('Only images and PDFs are allowed'))
  }
})

// All routes require authentication
router.use(protect)

/**
 * @swagger
 * /api/booking/{id}/payments:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking payments
 *     description: Get all payments for a booking
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       method:
 *                         type: string
 *                         enum: [credit_card, bank_transfer, cash, other]
 *                       status:
 *                         type: string
 *                         enum: [pending, confirmed, refunded, failed]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/', paymentService.getPayments)

/**
 * @swagger
 * /api/booking/{id}/payments:
 *   post:
 *     tags: [Bookings]
 *     summary: Add payment
 *     description: Add a new payment to a booking
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, method]
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: EUR
 *               method:
 *                 type: string
 *                 enum: [credit_card, bank_transfer, cash, other]
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment added
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', paymentService.addPayment)

/**
 * @swagger
 * /api/booking/{id}/payments/{paymentId}:
 *   patch:
 *     tags: [Bookings]
 *     summary: Update payment
 *     description: Update a payment record
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: paymentId
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
 *             properties:
 *               amount:
 *                 type: number
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:paymentId', paymentService.updatePayment)

/**
 * @swagger
 * /api/booking/{id}/payments/{paymentId}/confirm:
 *   post:
 *     tags: [Bookings]
 *     summary: Confirm payment
 *     description: Confirm a bank transfer payment
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: paymentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment confirmed
 *       400:
 *         description: Payment cannot be confirmed
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:paymentId/confirm', paymentService.confirmPayment)

/**
 * @swagger
 * /api/booking/{id}/payments/{paymentId}/refund:
 *   post:
 *     tags: [Bookings]
 *     summary: Refund payment
 *     description: Refund a payment
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: paymentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Partial refund amount (optional, defaults to full refund)
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment refunded
 *       400:
 *         description: Payment cannot be refunded
 */
router.post('/:paymentId/refund', paymentService.refundPayment)

/**
 * @swagger
 * /api/booking/{id}/payments/{paymentId}/upload-receipt:
 *   post:
 *     tags: [Bookings]
 *     summary: Upload payment receipt
 *     description: Upload receipt for bank transfer payment
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: paymentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Receipt uploaded
 *       400:
 *         description: Invalid file type or size (max 5MB, JPG/PNG/PDF only)
 */
router.post('/:paymentId/upload-receipt', upload.single('receipt'), paymentService.uploadReceipt)

/**
 * @swagger
 * /api/booking/{id}/payments/{paymentId}/receipt:
 *   get:
 *     tags: [Bookings]
 *     summary: Get payment receipt
 *     description: Get the receipt file for a payment
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: paymentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Receipt not found
 */
router.get('/:paymentId/receipt', paymentService.getReceipt)

/**
 * @swagger
 * /api/booking/{id}/payments/{paymentId}:
 *   delete:
 *     tags: [Bookings]
 *     summary: Delete payment
 *     description: Delete a pending payment
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: paymentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment deleted
 *       400:
 *         description: Only pending payments can be deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:paymentId', paymentService.deletePayment)

// ============================================================================
// CREDIT CARD PAYMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /api/booking/{id}/payments/{paymentId}/card/query-bin:
 *   post:
 *     tags: [Bookings]
 *     summary: Query BIN for installment options
 *     description: Query card BIN to get available installment options and card info
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: paymentId
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
 *             required: [bin]
 *             properties:
 *               bin:
 *                 type: string
 *                 description: First 6-8 digits of card number
 *     responses:
 *       200:
 *         description: BIN info and installment options
 */
router.post('/:paymentId/card/query-bin', paymentService.queryCardBin)

/**
 * @swagger
 * /api/booking/{id}/payments/{paymentId}/card/process:
 *   post:
 *     tags: [Bookings]
 *     summary: Process credit card payment
 *     description: Process payment with credit card (may require 3D Secure)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: paymentId
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
 *             required: [card]
 *             properties:
 *               posId:
 *                 type: string
 *                 description: Optional specific POS to use
 *               installment:
 *                 type: number
 *                 default: 1
 *               card:
 *                 type: object
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
 *               customer:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *     responses:
 *       200:
 *         description: Payment initiated (may require 3D redirect)
 */
router.post('/:paymentId/card/process', paymentService.processCardPayment)

/**
 * @swagger
 * /api/booking/{id}/payments/{paymentId}/card/status:
 *   get:
 *     tags: [Bookings]
 *     summary: Get card payment status
 *     description: Check the status of a card payment
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: paymentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status
 */
router.get('/:paymentId/card/status', paymentService.getCardPaymentStatus)

// ============================================================================
// PRE-AUTHORIZATION ROUTES
// ============================================================================

/**
 * @swagger
 * /api/booking/{id}/payments/{paymentId}/card/pre-authorize:
 *   post:
 *     tags: [Bookings]
 *     summary: Pre-authorize card payment
 *     description: Hold amount on card without capturing (for deposits)
 */
router.post('/:paymentId/card/pre-authorize', paymentService.preAuthorizeCard)

/**
 * @swagger
 * /api/booking/{id}/payments/{paymentId}/card/capture:
 *   post:
 *     tags: [Bookings]
 *     summary: Capture pre-authorized payment
 *     description: Capture a previously pre-authorized amount
 */
router.post('/:paymentId/card/capture', paymentService.capturePreAuth)

/**
 * @swagger
 * /api/booking/{id}/payments/{paymentId}/card/release:
 *   post:
 *     tags: [Bookings]
 *     summary: Release pre-authorized payment
 *     description: Void/release a pre-authorized amount
 */
router.post('/:paymentId/card/release', paymentService.releasePreAuth)

/**
 * @swagger
 * /api/booking/{id}/payments/pre-authorized:
 *   get:
 *     tags: [Bookings]
 *     summary: Get pre-authorized payments
 *     description: Get all pre-authorized payments for a booking
 */
router.get('/pre-authorized', paymentService.getPreAuthorizedPayments)

export default router
