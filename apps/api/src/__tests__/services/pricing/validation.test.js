/**
 * Pricing Validation Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { PricingError, validatePricingResult } from '../../../services/pricing/validation.js'

describe('Pricing Validation', () => {
  describe('PricingError', () => {
    it('should create error with code and default details', () => {
      const error = new PricingError('PRICING_FAILED')

      expect(error.name).toBe('PricingError')
      expect(error.code).toBe('PRICING_FAILED')
      expect(error.message).toBe('PRICING_FAILED')
      expect(error.details).toEqual({})
    })

    it('should create error with custom details', () => {
      const details = { hotelId: '123', reason: 'No rates found' }
      const error = new PricingError('NO_RATES', details)

      expect(error.code).toBe('NO_RATES')
      expect(error.details).toEqual(details)
    })

    it('should be an instance of Error', () => {
      const error = new PricingError('TEST')
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('validatePricingResult', () => {
    let validResult

    beforeEach(() => {
      validResult = {
        success: true,
        pricing: {
          originalTotal: 1000,
          finalTotal: 900,
          totalDiscount: 100
        }
      }
    })

    it('should return result for valid pricing', () => {
      const result = validatePricingResult(validResult)
      expect(result).toEqual(validResult)
    })

    it('should throw PRICING_CALCULATION_FAILED for unsuccessful result', () => {
      const failedResult = {
        success: false,
        error: 'NO_RATES',
        message: 'No rates available'
      }

      expect(() => validatePricingResult(failedResult)).toThrow(PricingError)

      try {
        validatePricingResult(failedResult)
      } catch (error) {
        expect(error.code).toBe('PRICING_CALCULATION_FAILED')
        expect(error.details.error).toBe('NO_RATES')
        expect(error.details.message).toBe('No rates available')
      }
    })

    it('should throw MISSING_PRICING_DATA for missing pricing object', () => {
      const noPricingResult = {
        success: true
        // missing pricing
      }

      expect(() => validatePricingResult(noPricingResult)).toThrow(PricingError)

      try {
        validatePricingResult(noPricingResult)
      } catch (error) {
        expect(error.code).toBe('MISSING_PRICING_DATA')
      }
    })

    it('should throw for missing originalTotal', () => {
      const result = {
        success: true,
        pricing: {
          finalTotal: 900
          // missing originalTotal
        }
      }

      expect(() => validatePricingResult(result)).toThrow(PricingError)

      try {
        validatePricingResult(result)
      } catch (error) {
        expect(error.code).toBe('MISSING_PRICING_FIELD_ORIGINALTOTAL')
      }
    })

    it('should throw for missing finalTotal', () => {
      const result = {
        success: true,
        pricing: {
          originalTotal: 1000
          // missing finalTotal
        }
      }

      expect(() => validatePricingResult(result)).toThrow(PricingError)

      try {
        validatePricingResult(result)
      } catch (error) {
        expect(error.code).toBe('MISSING_PRICING_FIELD_FINALTOTAL')
      }
    })

    it('should include context in error details', () => {
      const context = { hotelId: '123', checkInDate: '2024-01-15' }
      const failedResult = { success: false, error: 'TEST' }

      try {
        validatePricingResult(failedResult, context)
      } catch (error) {
        expect(error.details.hotelId).toBe('123')
        expect(error.details.checkInDate).toBe('2024-01-15')
      }
    })

    it('should handle null pricing field values', () => {
      const result = {
        success: true,
        pricing: {
          originalTotal: null,
          finalTotal: 900
        }
      }

      expect(() => validatePricingResult(result)).toThrow(PricingError)
    })

    it('should accept zero values for totals', () => {
      const result = {
        success: true,
        pricing: {
          originalTotal: 0,
          finalTotal: 0,
          totalDiscount: 0
        }
      }

      const validated = validatePricingResult(result)
      expect(validated.pricing.originalTotal).toBe(0)
    })

    it('should validate logical consistency (warn but not throw)', () => {
      // This test verifies the function handles inconsistent totals
      // It should log a warning but still return the result
      const inconsistentResult = {
        success: true,
        pricing: {
          originalTotal: 1000,
          finalTotal: 800, // Should be 900 (1000 - 100)
          totalDiscount: 100
        }
      }

      // Should not throw, just warn
      const result = validatePricingResult(inconsistentResult)
      expect(result).toEqual(inconsistentResult)
    })

    it('should handle pricing with no discount', () => {
      const result = {
        success: true,
        pricing: {
          originalTotal: 500,
          finalTotal: 500,
          totalDiscount: 0
        }
      }

      const validated = validatePricingResult(result)
      expect(validated.pricing.finalTotal).toBe(500)
    })
  })
})
