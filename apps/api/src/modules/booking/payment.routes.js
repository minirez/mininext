import express from 'express'
import multer from 'multer'
import path from 'path'
import { protect } from '../../middleware/auth.js'
import * as paymentService from './payment.service.js'

const router = express.Router({ mergeParams: true })

// Configure multer for receipt uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/payments/')
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
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
 * @route   GET /api/bookings/:id/payments
 * @desc    Get all payments for a booking
 * @access  Private
 */
router.get('/', paymentService.getPayments)

/**
 * @route   POST /api/bookings/:id/payments
 * @desc    Add new payment
 * @access  Private
 */
router.post('/', paymentService.addPayment)

/**
 * @route   PATCH /api/bookings/:id/payments/:paymentId
 * @desc    Update payment
 * @access  Private
 */
router.patch('/:paymentId', paymentService.updatePayment)

/**
 * @route   POST /api/bookings/:id/payments/:paymentId/confirm
 * @desc    Confirm bank transfer payment
 * @access  Private
 */
router.post('/:paymentId/confirm', paymentService.confirmPayment)

/**
 * @route   POST /api/bookings/:id/payments/:paymentId/refund
 * @desc    Refund payment
 * @access  Private
 */
router.post('/:paymentId/refund', paymentService.refundPayment)

/**
 * @route   POST /api/bookings/:id/payments/:paymentId/upload-receipt
 * @desc    Upload receipt for bank transfer
 * @access  Private
 */
router.post('/:paymentId/upload-receipt', upload.single('receipt'), paymentService.uploadReceipt)

/**
 * @route   GET /api/bookings/:id/payments/:paymentId/receipt
 * @desc    Get receipt file
 * @access  Private
 */
router.get('/:paymentId/receipt', paymentService.getReceipt)

/**
 * @route   DELETE /api/bookings/:id/payments/:paymentId
 * @desc    Delete pending payment
 * @access  Private
 */
router.delete('/:paymentId', paymentService.deletePayment)

export default router
