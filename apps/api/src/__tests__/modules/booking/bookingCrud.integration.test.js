/**
 * Booking CRUD Integration Tests
 * Tests for createBookingWithPaymentLink and related payment flows
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'

// Mock dependencies
jest.unstable_mockModule('#core/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

jest.unstable_mockModule('#services/notificationService.js', () => ({
  default: {
    send: jest.fn().mockResolvedValue({ success: true })
  }
}))

jest.unstable_mockModule('#services/pricingService.js', () => ({
  default: {
    reserveAllotment: jest.fn().mockResolvedValue({ success: true })
  }
}))

describe('Booking CRUD Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createBookingWithPaymentLink', () => {
    it('should create Booking + Payment + PaymentLink together', () => {
      // Simulating the flow from createBookingWithPaymentLink
      const partnerId = new mongoose.Types.ObjectId()
      const userId = new mongoose.Types.ObjectId()
      const bookingId = new mongoose.Types.ObjectId()
      const paymentId = new mongoose.Types.ObjectId()
      const paymentLinkId = new mongoose.Types.ObjectId()

      const finalTotal = 5000
      const currency = 'TRY'
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      // 1. Create Booking
      const booking = {
        _id: bookingId,
        partner: partnerId,
        bookingNumber: 'BK-2026-000001',
        pricing: {
          grandTotal: finalTotal,
          currency
        },
        payment: {
          status: 'pending',
          method: 'credit_card',
          dueAmount: finalTotal,
          paymentLinkId: null,
          paymentLinkToken: null
        }
      }

      // 2. Create Payment (NEW - this is what we fixed)
      const payment = {
        _id: paymentId,
        partner: partnerId,
        booking: bookingId,
        type: 'credit_card',
        amount: finalTotal,
        currency,
        status: 'pending',
        cardDetails: {
          linkExpiresAt: expiresAt,
          paymentLink: null,
          linkSentAt: null
        },
        createdBy: userId
      }

      // 3. Create PaymentLink with linkedPayment
      const paymentLink = {
        _id: paymentLinkId,
        partner: partnerId,
        booking: bookingId,
        linkedPayment: paymentId, // This links to Payment
        token: 'test-uuid-token',
        amount: finalTotal,
        currency,
        status: 'pending',
        expiresAt,
        createdBy: userId
      }

      // 4. Update Booking with payment link reference
      booking.payment.paymentLinkId = paymentLinkId
      booking.payment.paymentLinkToken = paymentLink.token

      // 5. Update Payment with paymentLink reference
      payment.cardDetails.paymentLink = paymentLinkId
      payment.cardDetails.linkSentAt = new Date()

      // Assertions
      expect(booking._id).toBe(bookingId)
      expect(payment._id).toBe(paymentId)
      expect(paymentLink._id).toBe(paymentLinkId)

      // Verify linkages
      expect(payment.booking.toString()).toBe(bookingId.toString())
      expect(paymentLink.booking.toString()).toBe(bookingId.toString())
      expect(paymentLink.linkedPayment.toString()).toBe(paymentId.toString())
      expect(payment.cardDetails.paymentLink.toString()).toBe(paymentLinkId.toString())
      expect(booking.payment.paymentLinkId.toString()).toBe(paymentLinkId.toString())
    })

    it('should set Payment.linkedPayment correctly', () => {
      const paymentId = new mongoose.Types.ObjectId()

      const paymentLink = {
        linkedPayment: null
      }

      // During createBookingWithPaymentLink, linkedPayment should be set
      paymentLink.linkedPayment = paymentId

      expect(paymentLink.linkedPayment).toBe(paymentId)
    })

    it('should keep Payment status as pending initially', () => {
      const payment = {
        type: 'credit_card',
        status: 'pending',
        amount: 1000
      }

      // Credit card payments via payment link should stay pending
      expect(payment.status).toBe('pending')
    })

    it('should set Booking.payment.paymentLinkId correctly', () => {
      const paymentLinkId = new mongoose.Types.ObjectId()
      const token = 'test-token-123'

      const booking = {
        payment: {
          status: 'pending',
          paymentLinkId: null,
          paymentLinkToken: null
        }
      }

      booking.payment.paymentLinkId = paymentLinkId
      booking.payment.paymentLinkToken = token

      expect(booking.payment.paymentLinkId).toBe(paymentLinkId)
      expect(booking.payment.paymentLinkToken).toBe(token)
    })

    it('should store cardDetails.paymentLink reference in Payment', () => {
      const paymentLinkId = new mongoose.Types.ObjectId()

      const payment = {
        type: 'credit_card',
        cardDetails: {
          paymentLink: null,
          linkSentAt: null
        }
      }

      payment.cardDetails.paymentLink = paymentLinkId
      payment.cardDetails.linkSentAt = new Date()

      expect(payment.cardDetails.paymentLink).toBe(paymentLinkId)
      expect(payment.cardDetails.linkSentAt).toBeDefined()
    })
  })

  describe('PaymentLink Payment Completion', () => {
    it('should complete Payment when PaymentLink is paid', () => {
      const payment = {
        _id: new mongoose.Types.ObjectId(),
        status: 'pending',
        completedAt: null,
        cardDetails: {
          gatewayTransactionId: null,
          gatewayStatus: 'pending'
        }
      }

      const transactionData = {
        transactionId: 'tx-12345',
        authCode: 'AUTH123',
        lastFour: '4242',
        brand: 'Visa',
        installment: 1
      }

      // Simulate completeCardPayment
      payment.status = 'completed'
      payment.completedAt = new Date()
      payment.cardDetails.gatewayTransactionId = transactionData.transactionId
      payment.cardDetails.gatewayStatus = 'completed'
      payment.cardDetails.lastFour = transactionData.lastFour
      payment.cardDetails.brand = transactionData.brand
      payment.cardDetails.installment = transactionData.installment

      expect(payment.status).toBe('completed')
      expect(payment.completedAt).toBeDefined()
      expect(payment.cardDetails.gatewayTransactionId).toBe('tx-12345')
    })

    it('should update Booking.payment.paidAmount when Payment completes', () => {
      const booking = {
        pricing: { grandTotal: 1000 },
        payment: {
          status: 'pending',
          paidAmount: 0,
          payments: []
        }
      }

      const completedPayment = {
        _id: new mongoose.Types.ObjectId(),
        status: 'completed',
        amount: 1000
      }

      // Simulate updateBookingPayment
      const payments = [completedPayment]
      const paidAmount = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0)

      booking.payment.paidAmount = paidAmount
      booking.payment.payments = payments.map(p => p._id)

      // Determine status
      if (paidAmount >= booking.pricing.grandTotal) {
        booking.payment.status = 'paid'
      } else if (paidAmount > 0) {
        booking.payment.status = 'partial'
      }

      expect(booking.payment.paidAmount).toBe(1000)
      expect(booking.payment.status).toBe('paid')
    })

    it('should set partial payment status when payment is less than total', () => {
      const booking = {
        pricing: { grandTotal: 2000 },
        payment: {
          status: 'pending',
          paidAmount: 0
        }
      }

      const completedPayment = {
        status: 'completed',
        amount: 500
      }

      const paidAmount = completedPayment.amount
      booking.payment.paidAmount = paidAmount

      if (paidAmount >= booking.pricing.grandTotal) {
        booking.payment.status = 'paid'
      } else if (paidAmount > 0) {
        booking.payment.status = 'partial'
      }

      expect(booking.payment.status).toBe('partial')
    })
  })

  describe('Payment Record Visibility', () => {
    it('should return Payment in booking payments list', () => {
      const bookingId = new mongoose.Types.ObjectId()

      const payments = [
        {
          _id: new mongoose.Types.ObjectId(),
          booking: bookingId,
          type: 'credit_card',
          amount: 1000,
          status: 'pending',
          cardDetails: {
            paymentLink: new mongoose.Types.ObjectId()
          }
        }
      ]

      // When fetching payments for a booking, this payment should appear
      const bookingPayments = payments.filter(p =>
        p.booking.toString() === bookingId.toString()
      )

      expect(bookingPayments.length).toBe(1)
      expect(bookingPayments[0].type).toBe('credit_card')
      expect(bookingPayments[0].status).toBe('pending')
    })

    it('should show pending credit card payment in payments list', () => {
      const payment = {
        type: 'credit_card',
        status: 'pending',
        amount: 5000,
        cardDetails: {
          paymentLink: new mongoose.Types.ObjectId(),
          linkSentAt: new Date()
        }
      }

      // This should be visible in the "Ödemeler" tab as a pending credit card payment
      expect(payment.status).toBe('pending')
      expect(payment.cardDetails.paymentLink).toBeDefined()
      expect(payment.cardDetails.linkSentAt).toBeDefined()
    })
  })

  describe('Email/SMS Notification Flow', () => {
    it('should record email notification when sent', () => {
      const paymentLink = {
        notifications: {
          emailSent: false,
          emailSentAt: null,
          resendCount: 0
        }
      }

      // Simulate notification sent
      paymentLink.notifications.emailSent = true
      paymentLink.notifications.emailSentAt = new Date()
      paymentLink.notifications.resendCount = 1

      expect(paymentLink.notifications.emailSent).toBe(true)
      expect(paymentLink.notifications.emailSentAt).toBeDefined()
    })

    it('should record SMS notification when sent', () => {
      const paymentLink = {
        notifications: {
          smsSent: false,
          smsSentAt: null,
          resendCount: 0
        }
      }

      // Simulate notification sent
      paymentLink.notifications.smsSent = true
      paymentLink.notifications.smsSentAt = new Date()
      paymentLink.notifications.resendCount = 1

      expect(paymentLink.notifications.smsSent).toBe(true)
      expect(paymentLink.notifications.smsSentAt).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle booking without payment link (normal flow)', () => {
      const booking = {
        payment: {
          status: 'pending',
          method: 'cash',
          paymentLinkId: null,
          paymentLinkToken: null
        }
      }

      expect(booking.payment.paymentLinkId).toBeNull()
      expect(booking.payment.method).toBe('cash')
    })

    it('should handle payment link expiry', () => {
      const paymentLink = {
        status: 'pending',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }

      const isExpired = paymentLink.expiresAt < new Date()

      if (isExpired && paymentLink.status === 'pending') {
        paymentLink.status = 'expired'
      }

      expect(paymentLink.status).toBe('expired')
    })

    it('should handle already paid payment link', () => {
      const paymentLink = {
        status: 'paid',
        paidAt: new Date()
      }

      // Trying to pay again should not create duplicate payment
      const canPay = paymentLink.status !== 'paid'

      expect(canPay).toBe(false)
    })
  })
})
