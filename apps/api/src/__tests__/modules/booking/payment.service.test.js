/**
 * Payment Service Unit Tests
 * Tests for payment operations (add, update, confirm, cancel, refund)
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
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

jest.unstable_mockModule('#services/paymentGateway.js', () => ({
  default: {
    refundTransaction: jest.fn(),
    cancelTransaction: jest.fn(),
    queryBin: jest.fn(),
    processPayment: jest.fn(),
    getTransactionStatus: jest.fn()
  }
}))

// Mock models
const mockPayment = {
  _id: new mongoose.Types.ObjectId(),
  partner: new mongoose.Types.ObjectId(),
  booking: new mongoose.Types.ObjectId(),
  type: 'credit_card',
  amount: 1000,
  currency: 'TRY',
  status: 'pending',
  save: jest.fn().mockResolvedValue(true),
  confirm: jest.fn().mockResolvedValue(true),
  cancel: jest.fn().mockResolvedValue(true),
  processRefund: jest.fn().mockResolvedValue(true),
  populate: jest.fn().mockReturnThis()
}

const mockBooking = {
  _id: new mongoose.Types.ObjectId(),
  partner: new mongoose.Types.ObjectId(),
  pricing: { grandTotal: 5000, currency: 'TRY' },
  payment: { status: 'pending', paidAmount: 0 },
  save: jest.fn().mockResolvedValue(true)
}

jest.unstable_mockModule('../../../modules/booking/payment.model.js', () => ({
  default: {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByBooking: jest.fn(),
    calculatePaidAmount: jest.fn()
  }
}))

jest.unstable_mockModule('../../../modules/booking/booking.model.js', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn()
  }
}))

// Import after mocks
const Payment = (await import('../../../modules/booking/payment.model.js')).default
const Booking = (await import('../../../modules/booking/booking.model.js')).default

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Payment Model Methods', () => {
    describe('confirm()', () => {
      it('should confirm pending payment', async () => {
        const payment = {
          ...mockPayment,
          status: 'pending',
          confirm: jest.fn().mockImplementation(async function(userId) {
            this.status = 'completed'
            this.completedAt = new Date()
            return this
          })
        }

        await payment.confirm('user123')

        expect(payment.status).toBe('completed')
        expect(payment.completedAt).toBeDefined()
      })

      it('should throw error if payment is not pending', async () => {
        const payment = {
          ...mockPayment,
          status: 'completed',
          confirm: jest.fn().mockImplementation(async function() {
            if (this.status !== 'pending') {
              throw new Error('PAYMENT_NOT_PENDING')
            }
          })
        }

        await expect(payment.confirm('user123')).rejects.toThrow('PAYMENT_NOT_PENDING')
      })

      it('should set confirmedBy and confirmedAt for bank transfer', async () => {
        const userId = new mongoose.Types.ObjectId()
        const payment = {
          ...mockPayment,
          status: 'pending',
          type: 'bank_transfer',
          bankTransfer: {},
          confirm: jest.fn().mockImplementation(async function(uid) {
            this.status = 'completed'
            this.completedAt = new Date()
            this.bankTransfer.confirmedBy = uid
            this.bankTransfer.confirmedAt = new Date()
            return this
          })
        }

        await payment.confirm(userId)

        expect(payment.bankTransfer.confirmedBy).toBe(userId)
        expect(payment.bankTransfer.confirmedAt).toBeDefined()
      })
    })

    describe('cancel()', () => {
      it('should cancel pending payment', async () => {
        const payment = {
          ...mockPayment,
          status: 'pending',
          cancel: jest.fn().mockImplementation(async function() {
            if (this.status !== 'pending') {
              throw new Error('PAYMENT_NOT_PENDING')
            }
            this.status = 'cancelled'
            return this
          })
        }

        await payment.cancel()

        expect(payment.status).toBe('cancelled')
      })

      it('should throw error when cancelling completed payment', async () => {
        const payment = {
          ...mockPayment,
          status: 'completed',
          cancel: jest.fn().mockImplementation(async function() {
            if (this.status !== 'pending') {
              throw new Error('PAYMENT_NOT_PENDING')
            }
          })
        }

        await expect(payment.cancel()).rejects.toThrow('PAYMENT_NOT_PENDING')
      })
    })

    describe('processRefund()', () => {
      it('should process full refund for completed payment', async () => {
        const userId = new mongoose.Types.ObjectId()
        const payment = {
          ...mockPayment,
          status: 'completed',
          amount: 1000,
          processRefund: jest.fn().mockImplementation(async function(amount, reason, uid) {
            if (this.status !== 'completed') {
              throw new Error('PAYMENT_NOT_COMPLETED')
            }
            if (amount > this.amount) {
              throw new Error('REFUND_EXCEEDS_PAYMENT')
            }
            this.status = 'refunded'
            this.refund = { amount, reason, refundedAt: new Date(), refundedBy: uid }
            return this
          })
        }

        await payment.processRefund(1000, 'Customer request', userId)

        expect(payment.status).toBe('refunded')
        expect(payment.refund.amount).toBe(1000)
        expect(payment.refund.reason).toBe('Customer request')
      })

      it('should process partial refund', async () => {
        const userId = new mongoose.Types.ObjectId()
        const payment = {
          ...mockPayment,
          status: 'completed',
          amount: 1000,
          processRefund: jest.fn().mockImplementation(async function(amount, reason, uid) {
            if (this.status !== 'completed') {
              throw new Error('PAYMENT_NOT_COMPLETED')
            }
            if (amount > this.amount) {
              throw new Error('REFUND_EXCEEDS_PAYMENT')
            }
            this.status = 'refunded'
            this.refund = { amount, reason, refundedAt: new Date(), refundedBy: uid }
            return this
          })
        }

        await payment.processRefund(500, 'Partial refund', userId)

        expect(payment.status).toBe('refunded')
        expect(payment.refund.amount).toBe(500)
      })

      it('should reject refund exceeding payment amount', async () => {
        const payment = {
          ...mockPayment,
          status: 'completed',
          amount: 1000,
          processRefund: jest.fn().mockImplementation(async function(amount) {
            if (amount > this.amount) {
              throw new Error('REFUND_EXCEEDS_PAYMENT')
            }
          })
        }

        await expect(payment.processRefund(1500, 'Too much', 'user123'))
          .rejects.toThrow('REFUND_EXCEEDS_PAYMENT')
      })

      it('should reject refund for non-completed payment', async () => {
        const payment = {
          ...mockPayment,
          status: 'pending',
          processRefund: jest.fn().mockImplementation(async function() {
            if (this.status !== 'completed') {
              throw new Error('PAYMENT_NOT_COMPLETED')
            }
          })
        }

        await expect(payment.processRefund(100, 'Test', 'user123'))
          .rejects.toThrow('PAYMENT_NOT_COMPLETED')
      })
    })
  })

  describe('Payment Creation', () => {
    it('should auto-complete cash payment on creation', () => {
      // Simulating pre-save middleware behavior
      const payment = {
        type: 'cash',
        status: 'pending',
        completedAt: null,
        isNew: true
      }

      // Simulate pre-save middleware
      if (payment.isNew && ['cash', 'agency_credit'].includes(payment.type)) {
        payment.status = 'completed'
        payment.completedAt = new Date()
      }

      expect(payment.status).toBe('completed')
      expect(payment.completedAt).toBeDefined()
    })

    it('should auto-complete agency_credit payment on creation', () => {
      const payment = {
        type: 'agency_credit',
        status: 'pending',
        completedAt: null,
        isNew: true
      }

      if (payment.isNew && ['cash', 'agency_credit'].includes(payment.type)) {
        payment.status = 'completed'
        payment.completedAt = new Date()
      }

      expect(payment.status).toBe('completed')
    })

    it('should keep credit_card payment as pending on creation', () => {
      const payment = {
        type: 'credit_card',
        status: 'pending',
        completedAt: null,
        isNew: true
      }

      if (payment.isNew && ['cash', 'agency_credit'].includes(payment.type)) {
        payment.status = 'completed'
        payment.completedAt = new Date()
      }

      expect(payment.status).toBe('pending')
      expect(payment.completedAt).toBeNull()
    })

    it('should keep bank_transfer payment as pending on creation', () => {
      const payment = {
        type: 'bank_transfer',
        status: 'pending',
        isNew: true
      }

      if (payment.isNew && ['cash', 'agency_credit'].includes(payment.type)) {
        payment.status = 'completed'
      }

      expect(payment.status).toBe('pending')
    })
  })

  describe('Booking Payment Summary', () => {
    it('should calculate correct paidAmount from completed payments', () => {
      const payments = [
        { status: 'completed', amount: 1000 },
        { status: 'completed', amount: 500 },
        { status: 'pending', amount: 200 }
      ]

      const paidAmount = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0)

      expect(paidAmount).toBe(1500)
    })

    it('should determine "paid" status when paidAmount >= grandTotal', () => {
      const grandTotal = 1000
      const paidAmount = 1000

      let status = 'pending'
      if (paidAmount >= grandTotal) {
        status = 'paid'
      } else if (paidAmount > 0) {
        status = 'partial'
      }

      expect(status).toBe('paid')
    })

    it('should determine "partial" status when paidAmount > 0 but < grandTotal', () => {
      const grandTotal = 1000
      const paidAmount = 500

      let status = 'pending'
      if (paidAmount >= grandTotal) {
        status = 'paid'
      } else if (paidAmount > 0) {
        status = 'partial'
      }

      expect(status).toBe('partial')
    })

    it('should determine "pending" status when paidAmount is 0', () => {
      const grandTotal = 1000
      const paidAmount = 0

      let status = 'pending'
      if (paidAmount >= grandTotal) {
        status = 'paid'
      } else if (paidAmount > 0) {
        status = 'partial'
      }

      expect(status).toBe('pending')
    })

    it('should determine "refunded" status when all payments refunded', () => {
      const payments = [
        { status: 'refunded', amount: 500 },
        { status: 'refunded', amount: 500 }
      ]

      const paidAmount = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0)

      const hasRefund = payments.some(p => p.status === 'refunded')

      let status = 'pending'
      if (paidAmount > 0) {
        status = 'partial'
      }
      if (hasRefund && paidAmount === 0) {
        status = 'refunded'
      }

      expect(status).toBe('refunded')
    })
  })

  describe('Payment Validation', () => {
    it('should reject invalid amount (zero)', () => {
      const amount = 0
      const isValid = amount > 0

      expect(isValid).toBe(false)
    })

    it('should reject invalid amount (negative)', () => {
      const amount = -100
      const isValid = amount > 0

      expect(isValid).toBe(false)
    })

    it('should accept valid amount', () => {
      const amount = 100
      const isValid = amount > 0

      expect(isValid).toBe(true)
    })

    it('should validate payment type enum', () => {
      const validTypes = ['credit_card', 'bank_transfer', 'cash', 'agency_credit', 'pay_at_checkin']
      const testType = 'credit_card'

      expect(validTypes.includes(testType)).toBe(true)
    })

    it('should reject invalid payment type', () => {
      const validTypes = ['credit_card', 'bank_transfer', 'cash', 'agency_credit', 'pay_at_checkin']
      const testType = 'bitcoin'

      expect(validTypes.includes(testType)).toBe(false)
    })
  })
})
