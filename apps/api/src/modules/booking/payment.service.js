import path from 'path'
import fs from 'fs'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import Payment from './payment.model.js'
import Booking from './booking.model.js'

/**
 * Get all payments for a booking
 */
export const getPayments = asyncHandler(async (req, res) => {
	const { id: bookingId } = req.params
	const partnerId = req.user.role === 'platform_admin'
		? req.query.partnerId
		: req.user.partner

	// Verify booking exists and belongs to partner
	const booking = await Booking.findOne({
		_id: bookingId,
		...(partnerId && { partner: partnerId })
	}).select('bookingNumber pricing.grandTotal pricing.currency payment')

	if (!booking) {
		return res.status(404).json({
			success: false,
			message: 'BOOKING_NOT_FOUND'
		})
	}

	const payments = await Payment.findByBooking(bookingId)

	// Calculate totals
	const paidAmount = payments
		.filter(p => p.status === 'completed')
		.reduce((sum, p) => sum + p.amount, 0)

	const pendingAmount = payments
		.filter(p => p.status === 'pending')
		.reduce((sum, p) => sum + p.amount, 0)

	res.json({
		success: true,
		data: {
			payments,
			summary: {
				grandTotal: booking.pricing?.grandTotal || 0,
				paidAmount,
				pendingAmount,
				remainingAmount: (booking.pricing?.grandTotal || 0) - paidAmount,
				currency: booking.pricing?.currency || 'TRY'
			}
		}
	})
})

/**
 * Add new payment
 */
export const addPayment = asyncHandler(async (req, res) => {
	const { id: bookingId } = req.params
	const partnerId = req.user.role === 'platform_admin'
		? req.body.partnerId || req.query.partnerId
		: req.user.partner

	// Verify booking exists
	const booking = await Booking.findOne({
		_id: bookingId,
		...(partnerId && { partner: partnerId })
	})

	if (!booking) {
		return res.status(404).json({
			success: false,
			message: 'BOOKING_NOT_FOUND'
		})
	}

	const {
		type,
		amount,
		currency,
		notes,
		bankTransfer,
		cardDetails
	} = req.body

	// Validate amount
	if (!amount || amount <= 0) {
		return res.status(400).json({
			success: false,
			message: 'INVALID_AMOUNT'
		})
	}

	// Create payment
	const payment = new Payment({
		partner: booking.partner,
		booking: bookingId,
		type,
		amount,
		currency: currency || booking.pricing?.currency || 'TRY',
		notes,
		createdBy: req.user._id
	})

	// Add type-specific details
	if (type === 'bank_transfer' && bankTransfer) {
		payment.bankTransfer = {
			bankName: bankTransfer.bankName,
			iban: bankTransfer.iban,
			accountHolder: bankTransfer.accountHolder,
			reference: bankTransfer.reference,
			receiptUrl: bankTransfer.receiptUrl
		}
	}

	if (type === 'credit_card' && cardDetails) {
		payment.cardDetails = {
			lastFour: cardDetails.lastFour,
			brand: cardDetails.brand,
			paymentLink: cardDetails.paymentLink,
			linkSentAt: cardDetails.linkSentAt
		}
	}

	await payment.save()

	// Update booking payment reference and recalculate paidAmount
	await updateBookingPayment(bookingId)

	// Populate and return
	await payment.populate('createdBy', 'firstName lastName email')

	res.status(201).json({
		success: true,
		data: payment,
		message: 'PAYMENT_ADDED'
	})
})

/**
 * Update payment
 */
export const updatePayment = asyncHandler(async (req, res) => {
	const { id: bookingId, paymentId } = req.params
	const partnerId = req.user.role === 'platform_admin'
		? req.query.partnerId
		: req.user.partner

	const payment = await Payment.findOne({
		_id: paymentId,
		booking: bookingId,
		...(partnerId && { partner: partnerId })
	})

	if (!payment) {
		return res.status(404).json({
			success: false,
			message: 'PAYMENT_NOT_FOUND'
		})
	}

	// Only pending payments can be updated
	if (payment.status !== 'pending') {
		return res.status(400).json({
			success: false,
			message: 'PAYMENT_NOT_EDITABLE'
		})
	}

	const allowedFields = ['amount', 'notes', 'bankTransfer', 'cardDetails']
	allowedFields.forEach(field => {
		if (req.body[field] !== undefined) {
			if (field === 'bankTransfer') {
				payment.bankTransfer = { ...payment.bankTransfer, ...req.body.bankTransfer }
			} else if (field === 'cardDetails') {
				payment.cardDetails = { ...payment.cardDetails, ...req.body.cardDetails }
			} else {
				payment[field] = req.body[field]
			}
		}
	})

	await payment.save()
	await updateBookingPayment(bookingId)

	res.json({
		success: true,
		data: payment,
		message: 'PAYMENT_UPDATED'
	})
})

/**
 * Confirm bank transfer payment
 */
export const confirmPayment = asyncHandler(async (req, res) => {
	const { id: bookingId, paymentId } = req.params
	const partnerId = req.user.role === 'platform_admin'
		? req.query.partnerId
		: req.user.partner

	const payment = await Payment.findOne({
		_id: paymentId,
		booking: bookingId,
		...(partnerId && { partner: partnerId })
	})

	if (!payment) {
		return res.status(404).json({
			success: false,
			message: 'PAYMENT_NOT_FOUND'
		})
	}

	if (payment.status !== 'pending') {
		return res.status(400).json({
			success: false,
			message: 'PAYMENT_NOT_PENDING'
		})
	}

	await payment.confirm(req.user._id)
	await updateBookingPayment(bookingId)

	res.json({
		success: true,
		data: payment,
		message: 'PAYMENT_CONFIRMED'
	})
})

/**
 * Cancel payment
 */
export const cancelPayment = asyncHandler(async (req, res) => {
	const { id: bookingId, paymentId } = req.params
	const partnerId = req.user.role === 'platform_admin'
		? req.query.partnerId
		: req.user.partner

	const payment = await Payment.findOne({
		_id: paymentId,
		booking: bookingId,
		...(partnerId && { partner: partnerId })
	})

	if (!payment) {
		return res.status(404).json({
			success: false,
			message: 'PAYMENT_NOT_FOUND'
		})
	}

	await payment.cancel()
	await updateBookingPayment(bookingId)

	res.json({
		success: true,
		data: payment,
		message: 'PAYMENT_CANCELLED'
	})
})

/**
 * Refund payment
 */
export const refundPayment = asyncHandler(async (req, res) => {
	const { id: bookingId, paymentId } = req.params
	const { amount, reason } = req.body
	const partnerId = req.user.role === 'platform_admin'
		? req.query.partnerId
		: req.user.partner

	const payment = await Payment.findOne({
		_id: paymentId,
		booking: bookingId,
		...(partnerId && { partner: partnerId })
	})

	if (!payment) {
		return res.status(404).json({
			success: false,
			message: 'PAYMENT_NOT_FOUND'
		})
	}

	if (!amount || amount <= 0) {
		return res.status(400).json({
			success: false,
			message: 'INVALID_REFUND_AMOUNT'
		})
	}

	if (!reason) {
		return res.status(400).json({
			success: false,
			message: 'REFUND_REASON_REQUIRED'
		})
	}

	try {
		await payment.processRefund(amount, reason, req.user._id)
		await updateBookingPayment(bookingId)

		res.json({
			success: true,
			data: payment,
			message: 'PAYMENT_REFUNDED'
		})
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message
		})
	}
})

/**
 * Upload receipt for bank transfer
 */
export const uploadReceipt = asyncHandler(async (req, res) => {
	const { id: bookingId, paymentId } = req.params
	const partnerId = req.user.role === 'platform_admin'
		? req.query.partnerId
		: req.user.partner

	const payment = await Payment.findOne({
		_id: paymentId,
		booking: bookingId,
		type: 'bank_transfer',
		...(partnerId && { partner: partnerId })
	})

	if (!payment) {
		return res.status(404).json({
			success: false,
			message: 'PAYMENT_NOT_FOUND'
		})
	}

	if (!req.file) {
		return res.status(400).json({
			success: false,
			message: 'NO_FILE_UPLOADED'
		})
	}

	// Store file path
	payment.bankTransfer.receiptUrl = `/uploads/payments/${req.file.filename}`
	await payment.save()

	res.json({
		success: true,
		data: payment,
		message: 'RECEIPT_UPLOADED'
	})
})

/**
 * Get receipt file
 */
export const getReceipt = asyncHandler(async (req, res) => {
	const { id: bookingId, paymentId } = req.params
	const partnerId = req.user.role === 'platform_admin'
		? req.query.partnerId
		: req.user.partner

	const payment = await Payment.findOne({
		_id: paymentId,
		booking: bookingId,
		...(partnerId && { partner: partnerId })
	})

	if (!payment) {
		return res.status(404).json({
			success: false,
			message: 'PAYMENT_NOT_FOUND'
		})
	}

	if (!payment.bankTransfer?.receiptUrl) {
		return res.status(404).json({
			success: false,
			message: 'RECEIPT_NOT_FOUND'
		})
	}

	// Get file path
	const filename = path.basename(payment.bankTransfer.receiptUrl)
	const filePath = path.join(process.cwd(), 'uploads', 'payments', filename)

	// Check if file exists
	if (!fs.existsSync(filePath)) {
		return res.status(404).json({
			success: false,
			message: 'FILE_NOT_FOUND'
		})
	}

	// Get file extension and set content type
	const ext = path.extname(filename).toLowerCase()
	const contentTypes = {
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.png': 'image/png',
		'.pdf': 'application/pdf'
	}
	const contentType = contentTypes[ext] || 'application/octet-stream'

	res.setHeader('Content-Type', contentType)
	res.setHeader('Content-Disposition', `inline; filename="${filename}"`)

	// Stream the file
	const fileStream = fs.createReadStream(filePath)
	fileStream.pipe(res)
})

/**
 * Delete payment (only pending)
 */
export const deletePayment = asyncHandler(async (req, res) => {
	const { id: bookingId, paymentId } = req.params
	const partnerId = req.user.role === 'platform_admin'
		? req.query.partnerId
		: req.user.partner

	const payment = await Payment.findOne({
		_id: paymentId,
		booking: bookingId,
		...(partnerId && { partner: partnerId })
	})

	if (!payment) {
		return res.status(404).json({
			success: false,
			message: 'PAYMENT_NOT_FOUND'
		})
	}

	if (payment.status !== 'pending') {
		return res.status(400).json({
			success: false,
			message: 'ONLY_PENDING_PAYMENTS_CAN_BE_DELETED'
		})
	}

	await payment.deleteOne()
	await updateBookingPayment(bookingId)

	res.json({
		success: true,
		message: 'PAYMENT_DELETED'
	})
})

/**
 * Helper: Update booking payment status and amounts
 */
async function updateBookingPayment(bookingId) {
	const payments = await Payment.find({ booking: bookingId })

	const paidAmount = payments
		.filter(p => p.status === 'completed')
		.reduce((sum, p) => sum + p.amount, 0)

	const booking = await Booking.findById(bookingId)
	if (!booking) return

	const grandTotal = booking.pricing?.grandTotal || 0

	// Determine payment status
	let status = 'pending'
	if (paidAmount >= grandTotal) {
		status = 'paid'
	} else if (paidAmount > 0) {
		status = 'partial'
	}

	// Check if any payment was refunded
	const hasRefund = payments.some(p => p.status === 'refunded')
	if (hasRefund && paidAmount === 0) {
		status = 'refunded'
	}

	// Update booking
	booking.payment.paidAmount = paidAmount
	booking.payment.status = status
	booking.payment.payments = payments.map(p => p._id)

	await booking.save()
}
