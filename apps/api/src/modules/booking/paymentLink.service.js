import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import Payment from './payment.model.js'
import logger from '#core/logger.js'

/**
 * SECURITY: Get partner ID with strict validation
 * For booking/payment operations, partner is ALWAYS required
 * Platform admins must select a partner before accessing booking data
 */
function getRequiredPartnerId(req, source = 'query') {
  // Partner users: always use their own partner
  if (req.user?.accountType === 'partner') {
    return req.user.accountId
  }

  // Platform admin: check multiple sources
  const partnerId = req.partnerId || req.body?.partnerId || req.query?.partnerId

  if (!partnerId) {
    throw new BadRequestError('PARTNER_SELECTION_REQUIRED')
  }

  return partnerId
}

// ============================================================================
// PAYMENT LINK FOR EXISTING PAYMENT
// ============================================================================

/**
 * Create a payment link for an existing pending payment
 * This allows customers to pay via a public link
 */
export const createPaymentLinkForPayment = asyncHandler(async (req, res) => {
  const { id: bookingId, paymentId } = req.params
  const { sendEmail = false, sendSms = false } = req.body
  const partnerId = getRequiredPartnerId(req)

  // VALIDATION: expiresInDays must be a positive integer (1-365)
  let expiresInDays = parseInt(req.body.expiresInDays) || 7
  if (expiresInDays < 1) expiresInDays = 1
  if (expiresInDays > 365) expiresInDays = 365

  // Find the payment
  const payment = await Payment.findOne({
    _id: paymentId,
    booking: bookingId,
    type: 'credit_card',
    partner: partnerId // SECURE: Always filter by partner
  }).populate('booking', 'bookingNumber leadGuest contact partner')

  if (!payment) {
    throw new NotFoundError('PAYMENT_NOT_FOUND')
  }

  // Only pending payments can have links created
  if (payment.status !== 'pending') {
    throw new BadRequestError('PAYMENT_NOT_PENDING')
  }

  // Check if there's already an active payment link for this payment
  const PaymentLink = (await import('../paymentLink/paymentLink.model.js')).default
  const existingLink = await PaymentLink.findOne({
    linkedPayment: payment._id,
    status: { $in: ['pending', 'viewed', 'processing'] }
  })

  if (existingLink) {
    // Update existing link with latest customer info if needed
    const leadGuest = payment.booking?.leadGuest || {}
    const contact = payment.booking?.contact || {}
    const updatedEmail = leadGuest.email || contact.email || ''
    const updatedPhone = leadGuest.phone || contact.phone || ''

    // Update customer info if it was empty before
    if ((!existingLink.customer.email && updatedEmail) || (!existingLink.customer.phone && updatedPhone)) {
      existingLink.customer.email = existingLink.customer.email || updatedEmail
      existingLink.customer.phone = existingLink.customer.phone || updatedPhone
      await existingLink.save()
    }

    // Send notifications if requested and not sent before
    const shouldSendEmail = sendEmail && existingLink.customer.email && !existingLink.notifications.emailSent
    const shouldSendSms = sendSms && existingLink.customer.phone && !existingLink.notifications.smsSent

    if (shouldSendEmail || shouldSendSms) {
      try {
        const { sendPaymentLinkNotification } = await import('./payment-notifications.service.js')
        const Partner = (await import('../partner/partner.model.js')).default
        const partner = await Partner.findById(payment.partner)

        await sendPaymentLinkNotification(existingLink, partner, {
          email: shouldSendEmail,
          sms: shouldSendSms
        })
      } catch (notifyError) {
        logger.error('Failed to send notification for existing link:', notifyError.message)
      }
    }

    return res.json({
      success: true,
      data: existingLink,
      message: 'EXISTING_LINK_RETURNED'
    })
  }

  // Get customer info from booking (leadGuest + contact fallback)
  const leadGuest = payment.booking?.leadGuest || {}
  const contact = payment.booking?.contact || {}
  const customerName = `${leadGuest.firstName || ''} ${leadGuest.lastName || ''}`.trim() || 'Müşteri'
  const customerEmail = leadGuest.email || contact.email || ''
  const customerPhone = leadGuest.phone || contact.phone || ''

  // Create payment link
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const paymentLink = new PaymentLink({
    partner: payment.partner,
    booking: payment.booking._id,
    linkedPayment: payment._id,
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone
    },
    description: `Rezervasyon Ödemesi - ${payment.booking.bookingNumber}`,
    amount: payment.amount,
    currency: payment.currency,
    installment: {
      enabled: true,
      maxCount: 12,
      rates: {}
    },
    expiresAt,
    createdBy: req.user._id
  })

  await paymentLink.save()

  // Store payment link reference in payment
  payment.cardDetails = payment.cardDetails || {}
  payment.cardDetails.paymentLink = paymentLink._id
  payment.cardDetails.linkSentAt = new Date()
  await payment.save()

  // Send notifications if requested
  if ((sendEmail || sendSms) && (customerEmail || customerPhone)) {
    try {
      const { sendPaymentLinkNotification } = await import('./payment-notifications.service.js')
      const Partner = (await import('../partner/partner.model.js')).default
      const partner = await Partner.findById(payment.partner)

      await sendPaymentLinkNotification(paymentLink, partner, {
        email: sendEmail && !!customerEmail,
        sms: sendSms && !!customerPhone
      })
    } catch (notifyError) {
      logger.error('Failed to send payment link notification:', notifyError.message)
      // Don't fail the request, just log the error
    }
  }

  res.status(201).json({
    success: true,
    data: paymentLink,
    message: 'PAYMENT_LINK_CREATED'
  })
})
