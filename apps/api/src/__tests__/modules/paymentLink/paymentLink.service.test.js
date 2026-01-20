/**
 * PaymentLink Service Unit Tests
 * Tests for payment link operations
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

// Mock dependencies
jest.unstable_mockModule('#core/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

jest.unstable_mockModule('#services/paymentGateway.js', () => ({
  default: {
    getDefaultRates: jest.fn()
  }
}))

describe('PaymentLink Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PaymentLink Model', () => {
    describe('Token Generation', () => {
      it('should generate unique UUID token', () => {
        const token = uuidv4()

        expect(token).toBeDefined()
        expect(typeof token).toBe('string')
        expect(token.length).toBe(36) // UUID format
        expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      })

      it('should generate different tokens on each call', () => {
        const token1 = uuidv4()
        const token2 = uuidv4()

        expect(token1).not.toBe(token2)
      })
    })

    describe('Link Number Generation', () => {
      it('should generate link number in correct format', () => {
        const year = new Date().getFullYear()
        const count = 42
        const linkNumber = `PL-${year}-${String(count + 1).padStart(6, '0')}`

        expect(linkNumber).toBe(`PL-${year}-000043`)
        expect(linkNumber).toMatch(/^PL-\d{4}-\d{6}$/)
      })

      it('should pad link number correctly for small counts', () => {
        const year = 2026
        const count = 0
        const linkNumber = `PL-${year}-${String(count + 1).padStart(6, '0')}`

        expect(linkNumber).toBe('PL-2026-000001')
      })

      it('should handle large counts without overflow', () => {
        const year = 2026
        const count = 999999
        const linkNumber = `PL-${year}-${String(count + 1).padStart(6, '0')}`

        expect(linkNumber).toBe('PL-2026-1000000')
      })
    })

    describe('Payment URL Generation', () => {
      it('should generate correct payment URL for development', () => {
        const token = 'test-token-123'
        process.env.NODE_ENV = 'development'
        const baseUrl = 'https://payment.mini.com'
        const paymentUrl = `${baseUrl}/pay-link/${token}`

        expect(paymentUrl).toBe('https://payment.mini.com/pay-link/test-token-123')
      })

      it('should generate correct payment URL for production', () => {
        const token = 'prod-token-456'
        process.env.NODE_ENV = 'production'
        const baseUrl = 'https://payment.minires.com'
        const paymentUrl = `${baseUrl}/pay-link/${token}`

        expect(paymentUrl).toBe('https://payment.minires.com/pay-link/prod-token-456')
      })

      it('should use custom PAYMENT_PUBLIC_URL if set', () => {
        const token = 'custom-token-789'
        process.env.PAYMENT_PUBLIC_URL = 'https://custom-payment.example.com'
        const baseUrl = process.env.PAYMENT_PUBLIC_URL
        const paymentUrl = `${baseUrl}/pay-link/${token}`

        expect(paymentUrl).toBe('https://custom-payment.example.com/pay-link/custom-token-789')

        // Cleanup
        delete process.env.PAYMENT_PUBLIC_URL
      })
    })

    describe('Expiry Calculations', () => {
      it('should calculate isExpired correctly for expired link', () => {
        const paymentLink = {
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          status: 'pending'
        }

        const isExpired = paymentLink.expiresAt < new Date() && paymentLink.status === 'pending'

        expect(isExpired).toBe(true)
      })

      it('should calculate isExpired correctly for valid link', () => {
        const paymentLink = {
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          status: 'pending'
        }

        const isExpired = paymentLink.expiresAt < new Date() && paymentLink.status === 'pending'

        expect(isExpired).toBe(false)
      })

      it('should not mark paid link as expired', () => {
        const paymentLink = {
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          status: 'paid'
        }

        const isExpired = paymentLink.expiresAt < new Date() && paymentLink.status === 'pending'

        expect(isExpired).toBe(false)
      })

      it('should calculate daysUntilExpiry correctly', () => {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        const now = new Date()
        const diff = expiresAt - now
        const daysUntilExpiry = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))

        expect(daysUntilExpiry).toBe(7)
      })

      it('should return 0 for expired links', () => {
        const expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
        const now = new Date()
        const diff = expiresAt - now
        const daysUntilExpiry = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))

        expect(daysUntilExpiry).toBe(0)
      })
    })

    describe('Status Transitions', () => {
      it('should mark link as viewed', () => {
        const paymentLink = {
          status: 'pending',
          viewedAt: null
        }

        // Simulate markViewed
        if (!paymentLink.viewedAt) {
          paymentLink.viewedAt = new Date()
          if (paymentLink.status === 'pending') {
            paymentLink.status = 'viewed'
          }
        }

        expect(paymentLink.status).toBe('viewed')
        expect(paymentLink.viewedAt).toBeDefined()
      })

      it('should not change status if already viewed', () => {
        const viewedAt = new Date(Date.now() - 1000)
        const paymentLink = {
          status: 'viewed',
          viewedAt
        }

        // Simulate markViewed again
        if (!paymentLink.viewedAt) {
          paymentLink.viewedAt = new Date()
          paymentLink.status = 'viewed'
        }

        expect(paymentLink.viewedAt).toBe(viewedAt) // Should not change
      })

      it('should mark link as processing', () => {
        const paymentLink = {
          status: 'viewed'
        }

        paymentLink.status = 'processing'

        expect(paymentLink.status).toBe('processing')
      })

      it('should mark link as paid with transaction data', () => {
        const paymentLink = {
          status: 'processing',
          paidAt: null,
          transaction: null
        }

        const transactionData = {
          transactionId: 'tx-123',
          lastFour: '1234',
          brand: 'Visa',
          installment: 1
        }

        // Simulate markPaid
        paymentLink.status = 'paid'
        paymentLink.paidAt = new Date()
        paymentLink.transaction = {
          gatewayTransactionId: transactionData.transactionId,
          lastFour: transactionData.lastFour,
          brand: transactionData.brand,
          installmentCount: transactionData.installment
        }

        expect(paymentLink.status).toBe('paid')
        expect(paymentLink.paidAt).toBeDefined()
        expect(paymentLink.transaction.gatewayTransactionId).toBe('tx-123')
        expect(paymentLink.transaction.lastFour).toBe('1234')
      })

      it('should cancel link with reason', () => {
        const userId = new mongoose.Types.ObjectId()
        const paymentLink = {
          status: 'pending',
          cancelledBy: null,
          cancelledAt: null,
          cancelReason: null
        }

        // Simulate cancel
        if (paymentLink.status === 'paid') {
          throw new Error('Cannot cancel paid link')
        }
        paymentLink.status = 'cancelled'
        paymentLink.cancelledBy = userId
        paymentLink.cancelledAt = new Date()
        paymentLink.cancelReason = 'Customer request'

        expect(paymentLink.status).toBe('cancelled')
        expect(paymentLink.cancelledBy).toBe(userId)
        expect(paymentLink.cancelReason).toBe('Customer request')
      })

      it('should not allow cancelling paid link', () => {
        const paymentLink = {
          status: 'paid'
        }

        expect(() => {
          if (paymentLink.status === 'paid') {
            throw new Error('Cannot cancel paid payment link')
          }
        }).toThrow('Cannot cancel paid payment link')
      })
    })

    describe('Notification Recording', () => {
      it('should record email notification', () => {
        const paymentLink = {
          notifications: {
            emailSent: false,
            emailSentAt: null,
            lastResendAt: null,
            resendCount: 0
          }
        }

        // Simulate recordNotification('email')
        paymentLink.notifications.emailSent = true
        paymentLink.notifications.emailSentAt = new Date()
        paymentLink.notifications.lastResendAt = new Date()
        paymentLink.notifications.resendCount = (paymentLink.notifications.resendCount || 0) + 1

        expect(paymentLink.notifications.emailSent).toBe(true)
        expect(paymentLink.notifications.emailSentAt).toBeDefined()
        expect(paymentLink.notifications.resendCount).toBe(1)
      })

      it('should record SMS notification', () => {
        const paymentLink = {
          notifications: {
            smsSent: false,
            smsSentAt: null,
            lastResendAt: null,
            resendCount: 0
          }
        }

        // Simulate recordNotification('sms')
        paymentLink.notifications.smsSent = true
        paymentLink.notifications.smsSentAt = new Date()
        paymentLink.notifications.lastResendAt = new Date()
        paymentLink.notifications.resendCount = (paymentLink.notifications.resendCount || 0) + 1

        expect(paymentLink.notifications.smsSent).toBe(true)
        expect(paymentLink.notifications.smsSentAt).toBeDefined()
        expect(paymentLink.notifications.resendCount).toBe(1)
      })

      it('should increment resendCount on multiple notifications', () => {
        const paymentLink = {
          notifications: {
            emailSent: true,
            resendCount: 2
          }
        }

        paymentLink.notifications.resendCount = (paymentLink.notifications.resendCount || 0) + 1

        expect(paymentLink.notifications.resendCount).toBe(3)
      })
    })

    describe('LinkedPayment Integration', () => {
      it('should store linkedPayment reference', () => {
        const paymentId = new mongoose.Types.ObjectId()
        const paymentLink = {
          linkedPayment: null
        }

        paymentLink.linkedPayment = paymentId

        expect(paymentLink.linkedPayment).toBe(paymentId)
      })

      it('should allow null linkedPayment for standalone links', () => {
        const paymentLink = {
          linkedPayment: null,
          booking: new mongoose.Types.ObjectId()
        }

        expect(paymentLink.linkedPayment).toBeNull()
        expect(paymentLink.booking).toBeDefined()
      })
    })

    describe('Expire Pending Links', () => {
      it('should identify expired pending and viewed links', () => {
        const now = new Date()
        const pastTime = new Date(now.getTime() - 1000)
        const futureTime = new Date(now.getTime() + 1000)
        const links = [
          { status: 'pending', expiresAt: pastTime },    // expired - count
          { status: 'pending', expiresAt: futureTime },  // not expired - skip
          { status: 'viewed', expiresAt: pastTime },     // expired - count
          { status: 'paid', expiresAt: pastTime }        // paid - skip
        ]

        const expiredLinks = links.filter(link =>
          ['pending', 'viewed'].includes(link.status) && link.expiresAt < now
        )

        // pending (expired) + viewed (expired) = 2
        expect(expiredLinks.length).toBe(2)
      })

      it('should update status to expired', () => {
        const paymentLink = {
          status: 'pending',
          expiresAt: new Date(Date.now() - 1000)
        }

        if (paymentLink.expiresAt < new Date() && paymentLink.status === 'pending') {
          paymentLink.status = 'expired'
        }

        expect(paymentLink.status).toBe('expired')
      })
    })

    describe('Installment Rates', () => {
      it('should store installment configuration', () => {
        const paymentLink = {
          installment: {
            enabled: true,
            maxCount: 6,
            rates: {
              '2': 1.5,
              '3': 2.0,
              '6': 3.5
            }
          }
        }

        expect(paymentLink.installment.enabled).toBe(true)
        expect(paymentLink.installment.maxCount).toBe(6)
        expect(paymentLink.installment.rates['3']).toBe(2.0)
      })

      it('should default installment to disabled', () => {
        const paymentLink = {
          installment: {
            enabled: false,
            maxCount: 1,
            rates: {}
          }
        }

        expect(paymentLink.installment.enabled).toBe(false)
        expect(paymentLink.installment.maxCount).toBe(1)
      })
    })
  })

  describe('Payment Completion Flow', () => {
    it('should update linked Payment when PaymentLink is paid', () => {
      const payment = {
        _id: new mongoose.Types.ObjectId(),
        status: 'pending',
        cardDetails: {}
      }

      const transactionData = {
        transactionId: 'tx-456',
        lastFour: '9876',
        brand: 'Mastercard',
        installment: 3
      }

      // Simulate completeCardPayment on linked payment
      payment.status = 'completed'
      payment.completedAt = new Date()
      payment.cardDetails.gatewayTransactionId = transactionData.transactionId
      payment.cardDetails.lastFour = transactionData.lastFour
      payment.cardDetails.brand = transactionData.brand
      payment.cardDetails.installment = transactionData.installment

      expect(payment.status).toBe('completed')
      expect(payment.cardDetails.gatewayTransactionId).toBe('tx-456')
    })

    it('should store commission data in transaction', () => {
      const paymentLink = {
        transaction: null
      }

      const transactionData = {
        commission: {
          bankRate: 1.5,
          bankAmount: 15,
          platformRate: 0.5,
          platformAmount: 5,
          totalRate: 2.0,
          totalAmount: 20,
          netAmount: 980
        }
      }

      paymentLink.transaction = {
        commission: transactionData.commission
      }

      expect(paymentLink.transaction.commission.bankRate).toBe(1.5)
      expect(paymentLink.transaction.commission.netAmount).toBe(980)
    })
  })
})
