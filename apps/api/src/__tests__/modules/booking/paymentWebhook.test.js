/**
 * Payment Webhook Tests
 * Tests for webhook processing, idempotency, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockRequest, mockResponse } from '../../../tests/helpers/testUtils.js'

// Mock dependencies
vi.mock('#core/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('#helpers', () => ({
  asyncHandler: fn => fn,
  withTransaction: vi.fn(async cb => cb(null)) // No session (standalone mode)
}))

const mockPayment = {
  _id: 'payment123',
  booking: 'booking456',
  status: 'completed',
  amount: 1000
}

const mockBooking = {
  _id: 'booking456',
  partner: 'partner789',
  pricing: { grandTotal: 1000, currency: 'TRY' },
  payment: { paymentTerms: {} }
}

vi.mock('../../../modules/booking/payment.model.js', () => ({
  default: {
    findOneAndUpdate: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn()
  }
}))

vi.mock('../../../modules/booking/booking.model.js', () => ({
  default: {
    findById: vi.fn()
  }
}))

vi.mock('../../../modules/booking/payment.service.js', () => ({
  updateBookingPayment: vi.fn()
}))

vi.mock('../../../modules/booking/payment-notifications.service.js', () => ({
  sendPaymentNotification: vi.fn()
}))

vi.mock('../../../modules/booking/email.service.js', () => ({
  sendAutomaticBookingEmails: vi.fn().mockResolvedValue(undefined)
}))

import { paymentWebhook } from '../../../modules/booking/paymentWebhook.service.js'
import Payment from '../../../modules/booking/payment.model.js'
import Booking from '../../../modules/booking/booking.model.js'
import { updateBookingPayment } from '../../../modules/booking/payment.service.js'
import { withTransaction } from '#helpers'

describe('Payment Webhook', () => {
  let req, res

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: successful payment webhook
    req = mockRequest({
      body: {
        transactionId: 'txn_123',
        externalId: 'payment123',
        success: true,
        authCode: 'AUTH001',
        refNumber: 'REF001',
        provisionNumber: 'PROV001',
        maskedCard: '4444****1234',
        brand: 'Visa',
        cardType: 'credit',
        cardFamily: 'Bonus',
        cardBank: 'Garanti',
        installment: 1,
        amount: 1000
      },
      headers: {
        'x-api-key': 'payment-webhook-secret',
        'user-agent': 'payment-service/1.0'
      }
    })

    res = mockResponse()

    // Default mocks
    withTransaction.mockImplementation(async cb => cb(null))
    Payment.findOneAndUpdate.mockResolvedValue(mockPayment)
    Payment.findById.mockResolvedValue(mockPayment)
    Booking.findById.mockResolvedValue(mockBooking)
    updateBookingPayment.mockResolvedValue(undefined)
  })

  // ── API Key validation ──────────────────────────────────────────────────

  describe('API key validation', () => {
    it('should reject invalid API key', async () => {
      req.headers['x-api-key'] = 'wrong-key'

      await paymentWebhook(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Invalid API key' })
      )
    })

    it('should accept valid API key', async () => {
      await paymentWebhook(req, res)

      expect(res.status).not.toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })
  })

  // ── Input validation ──────────────────────────────────────────────────────

  describe('Input validation', () => {
    it('should reject missing externalId', async () => {
      req.body.externalId = undefined

      await paymentWebhook(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Missing externalId' })
      )
    })

    it('should skip payment link webhooks (PL- prefix)', async () => {
      req.body.externalId = 'PL-abc123'

      await paymentWebhook(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Payment link handled separately' })
      )
      expect(Payment.findOneAndUpdate).not.toHaveBeenCalled()
    })
  })

  // ── Successful payment ────────────────────────────────────────────────────

  describe('Successful payment processing', () => {
    it('should update payment to completed status', async () => {
      await paymentWebhook(req, res)

      expect(Payment.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'payment123', status: 'pending' },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'completed'
          })
        }),
        expect.objectContaining({ new: true })
      )
    })

    it('should store card details from webhook', async () => {
      await paymentWebhook(req, res)

      const updateCall = Payment.findOneAndUpdate.mock.calls[0]
      const setData = updateCall[1].$set

      expect(setData['cardDetails.gatewayResponse']).toEqual(
        expect.objectContaining({
          authCode: 'AUTH001',
          refNumber: 'REF001',
          brand: 'Visa',
          cardBank: 'Garanti'
        })
      )
    })

    it('should update booking payment on success', async () => {
      await paymentWebhook(req, res)

      expect(updateBookingPayment).toHaveBeenCalledWith('booking456', {})
    })

    it('should store commission data when provided', async () => {
      req.body.commission = {
        bankRate: 1.5,
        bankAmount: 15,
        platformRate: 0.5,
        platformAmount: 5,
        totalRate: 2.0,
        totalAmount: 20,
        netAmount: 980
      }

      await paymentWebhook(req, res)

      const updateCall = Payment.findOneAndUpdate.mock.calls[0]
      const setData = updateCall[1].$set

      expect(setData.commission).toEqual(
        expect.objectContaining({
          bankRate: 1.5,
          netAmount: 980
        })
      )
    })

    it('should return success response', async () => {
      await paymentWebhook(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Payment completed',
          paymentStatus: 'completed'
        })
      )
    })
  })

  // ── Failed payment ────────────────────────────────────────────────────────

  describe('Failed payment processing', () => {
    beforeEach(() => {
      req.body.success = false
      req.body.error = 'Card declined'

      const failedPayment = { ...mockPayment, status: 'failed' }
      Payment.findOneAndUpdate.mockResolvedValue(failedPayment)
    })

    it('should update payment to failed status', async () => {
      await paymentWebhook(req, res)

      expect(Payment.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'payment123', status: 'pending' },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'failed'
          })
        }),
        expect.anything()
      )
    })

    it('should store error details on failure', async () => {
      await paymentWebhook(req, res)

      const updateCall = Payment.findOneAndUpdate.mock.calls[0]
      const setData = updateCall[1].$set

      expect(setData['cardDetails.gatewayResponse']).toEqual(
        expect.objectContaining({
          error: 'Card declined'
        })
      )
    })

    it('should NOT update booking payment on failure', async () => {
      await paymentWebhook(req, res)

      expect(updateBookingPayment).not.toHaveBeenCalled()
    })

    it('should return failure response', async () => {
      await paymentWebhook(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // webhook processed successfully
          message: 'Payment failed'
        })
      )
    })
  })

  // ── Idempotency ───────────────────────────────────────────────────────────

  describe('Idempotency (duplicate webhook handling)', () => {
    it('should handle already-processed payment', async () => {
      // findOneAndUpdate returns null (already processed - not pending)
      Payment.findOneAndUpdate.mockResolvedValue(null)
      withTransaction.mockImplementation(async cb => cb(null))

      // Re-mock to return the result from withTransaction
      withTransaction.mockImplementation(async cb => {
        Payment.findOneAndUpdate.mockResolvedValue(null)
        return cb(null)
      })

      // findById returns existing payment
      Payment.findById.mockResolvedValue({ ...mockPayment, status: 'completed' })

      await paymentWebhook(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Already processed' })
      )
    })

    it('should return 404 for non-existent payment', async () => {
      withTransaction.mockImplementation(async cb => cb(null))
      Payment.findOneAndUpdate.mockResolvedValue(null)
      Payment.findById.mockResolvedValue(null)

      // Need to re-implement withTransaction to return null payment
      withTransaction.mockImplementation(async () => ({
        payment: null,
        alreadyProcessed: true
      }))

      await paymentWebhook(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  // ── lastFour extraction ───────────────────────────────────────────────────

  describe('Card detail extraction', () => {
    it('should extract lastFour from maskedCard when not provided directly', async () => {
      req.body.lastFour = undefined
      req.body.maskedCard = '4444****5678'

      await paymentWebhook(req, res)

      const updateCall = Payment.findOneAndUpdate.mock.calls[0]
      const setData = updateCall[1].$set

      expect(setData['cardDetails.lastFour']).toBe('5678')
    })

    it('should use provided lastFour when available', async () => {
      req.body.lastFour = '9999'
      req.body.maskedCard = '4444****5678'

      await paymentWebhook(req, res)

      const updateCall = Payment.findOneAndUpdate.mock.calls[0]
      const setData = updateCall[1].$set

      expect(setData['cardDetails.lastFour']).toBe('9999')
    })
  })
})
