/**
 * Pricing Utilities Tests
 */

import { describe, it, expect } from '@jest/globals'
import {
  roundPrice,
  calculatePrice,
  calculateDiscount,
  applyDiscount,
  calculateTotal,
  calculateADR,
  calculatePriceChange,
  hasPriceChanged
} from '../pricing.js'

describe('Pricing Utils', () => {
  describe('roundPrice', () => {
    it('should round according to rules', () => {
      expect(roundPrice(123.45, 'round')).toBe(123)
      expect(roundPrice(123.45, 'ceil')).toBe(124)
      expect(roundPrice(123.45, 'floor')).toBe(123)
      expect(roundPrice(123.45, 'nearest5')).toBe(125)
      expect(roundPrice(123.45, 'nearest10')).toBe(120)
    })

    it('should return original for none rule', () => {
      expect(roundPrice(123.45, 'none')).toBe(123.45)
    })

    it('should return 0 for invalid input', () => {
      expect(roundPrice(null)).toBe(0)
      expect(roundPrice(NaN)).toBe(0)
    })
  })

  describe('calculatePrice', () => {
    it('should calculate price with multiplier', () => {
      expect(calculatePrice(100, 1.5)).toBe(150)
    })

    it('should apply rounding rule', () => {
      expect(calculatePrice(100, 1.234, 'round')).toBe(123)
    })
  })

  describe('calculateDiscount', () => {
    it('should calculate discount amount', () => {
      expect(calculateDiscount(100, 10)).toBe(10)
      expect(calculateDiscount(200, 25)).toBe(50)
    })

    it('should return 0 for missing values', () => {
      expect(calculateDiscount(null, 10)).toBe(0)
      expect(calculateDiscount(100, null)).toBe(0)
    })
  })

  describe('applyDiscount', () => {
    it('should apply discount to price', () => {
      expect(applyDiscount(100, 10)).toBe(90)
      expect(applyDiscount(200, 25)).toBe(150)
    })

    it('should return original for no discount', () => {
      expect(applyDiscount(100, 0)).toBe(100)
      expect(applyDiscount(100, null)).toBe(100)
    })
  })

  describe('calculateTotal', () => {
    it('should sum array of prices', () => {
      expect(calculateTotal([100, 150, 200])).toBe(450)
    })

    it('should handle null values in array', () => {
      expect(calculateTotal([100, null, 200])).toBe(300)
    })

    it('should return 0 for non-array', () => {
      expect(calculateTotal(null)).toBe(0)
    })
  })

  describe('calculateADR', () => {
    it('should calculate average daily rate', () => {
      expect(calculateADR(300, 3)).toBe(100)
    })

    it('should return 0 for missing values', () => {
      expect(calculateADR(0, 3)).toBe(0)
      expect(calculateADR(300, 0)).toBe(0)
    })
  })

  describe('calculatePriceChange', () => {
    it('should calculate percentage change', () => {
      expect(calculatePriceChange(100, 120)).toBe(20)
      expect(calculatePriceChange(100, 80)).toBe(-20)
    })

    it('should return 0 for zero old price', () => {
      expect(calculatePriceChange(0, 100)).toBe(0)
    })
  })

  describe('hasPriceChanged', () => {
    it('should detect significant price change', () => {
      expect(hasPriceChanged(100, 105, 1)).toBe(true)
      expect(hasPriceChanged(100, 100.5, 1)).toBe(false)
    })

    it('should return false for missing prices', () => {
      expect(hasPriceChanged(null, 100)).toBe(false)
      expect(hasPriceChanged(100, null)).toBe(false)
    })
  })
})
