/**
 * Tier Pricing Tests
 * Tests for calculateTierPricing and getEffectiveSalesSettings
 */

import { describe, it, expect } from 'vitest'
import { calculateTierPricing, getEffectiveSalesSettings } from '../../../services/pricing/tiers.js'

describe('Tier Pricing', () => {
  // ── getEffectiveSalesSettings ─────────────────────────────────────────────

  describe('getEffectiveSalesSettings', () => {
    it('should return market defaults when no season', () => {
      const market = {
        workingMode: 'net',
        commissionRate: 15,
        markup: { b2c: 20, b2b: 10 },
        agencyCommission: 12,
        agencyMarginShare: 60
      }

      const result = getEffectiveSalesSettings(market)

      expect(result.workingMode).toBe('net')
      expect(result.commissionRate).toBe(15)
      expect(result.markup.b2c).toBe(20)
      expect(result.markup.b2b).toBe(10)
      expect(result.agencyCommission).toBe(12)
      expect(result.agencyMarginShare).toBe(60)
    })

    it('should use safe defaults when market is null', () => {
      const result = getEffectiveSalesSettings(null)

      expect(result.workingMode).toBe('net')
      expect(result.commissionRate).toBe(10)
      expect(result.markup.b2c).toBe(0)
      expect(result.markup.b2b).toBe(0)
      expect(result.agencyCommission).toBe(10)
      expect(result.agencyMarginShare).toBe(50)
    })

    it('should use season override when inheritFromMarket is false', () => {
      const market = {
        workingMode: 'net',
        commissionRate: 10,
        markup: { b2c: 15, b2b: 5 },
        agencyCommission: 10,
        agencyMarginShare: 50
      }

      const season = {
        salesSettingsOverride: {
          inheritFromMarket: false,
          workingMode: 'commission',
          commissionRate: 20,
          markup: { b2c: 25, b2b: 12 },
          agencyCommission: 15,
          agencyMarginShare: 40
        }
      }

      const result = getEffectiveSalesSettings(market, season)

      expect(result.workingMode).toBe('commission')
      expect(result.commissionRate).toBe(20)
      expect(result.markup.b2c).toBe(25)
      expect(result.markup.b2b).toBe(12)
      expect(result.agencyMarginShare).toBe(40)
    })

    it('should keep market values when season inheritFromMarket is true', () => {
      const market = {
        workingMode: 'commission',
        commissionRate: 10,
        markup: { b2c: 20, b2b: 8 },
        agencyCommission: 10,
        agencyMarginShare: 50
      }

      const season = {
        salesSettingsOverride: {
          inheritFromMarket: true,
          workingMode: 'net',
          commissionRate: 30
        }
      }

      const result = getEffectiveSalesSettings(market, season)

      expect(result.workingMode).toBe('commission')
      expect(result.commissionRate).toBe(10)
      expect(result.markup.b2c).toBe(20)
    })

    it('should handle partial season override', () => {
      const market = {
        workingMode: 'net',
        commissionRate: 10,
        markup: { b2c: 15, b2b: 5 },
        agencyCommission: 10,
        agencyMarginShare: 50
      }

      const season = {
        salesSettingsOverride: {
          inheritFromMarket: false,
          // Only override commission rate, rest falls back to market
          commissionRate: 25
        }
      }

      const result = getEffectiveSalesSettings(market, season)

      // Overridden
      expect(result.commissionRate).toBe(25)
      // Falls back to market
      expect(result.workingMode).toBe('net')
      expect(result.markup.b2c).toBe(15)
    })
  })

  // ── calculateTierPricing - NET mode ───────────────────────────────────────

  describe('calculateTierPricing - NET mode', () => {
    it('should calculate net mode with markup', () => {
      const result = calculateTierPricing(1000, {
        workingMode: 'net',
        markup: { b2c: 20, b2b: 10 }
      })

      expect(result.hotelCost).toBe(1000)
      expect(result.b2cPrice).toBe(1200) // 1000 * 1.20
      expect(result.b2bPrice).toBe(1100) // 1000 * 1.10
      expect(result.basePrice).toBe(1000)
    })

    it('should calculate net mode with zero markup', () => {
      const result = calculateTierPricing(500, {
        workingMode: 'net',
        markup: { b2c: 0, b2b: 0 }
      })

      expect(result.hotelCost).toBe(500)
      expect(result.b2cPrice).toBe(500)
      expect(result.b2bPrice).toBe(500)
    })

    it('should handle missing markup gracefully', () => {
      const result = calculateTierPricing(1000, {
        workingMode: 'net'
      })

      expect(result.hotelCost).toBe(1000)
      expect(result.b2cPrice).toBe(1000)
      expect(result.b2bPrice).toBe(1000)
    })

    it('should include correct breakdown for NET mode', () => {
      const result = calculateTierPricing(1000, {
        workingMode: 'net',
        markup: { b2c: 20, b2b: 10 }
      })

      expect(result.breakdown.workingMode).toBe('net')
      expect(result.breakdown.b2cMarkup).toBe(20)
      expect(result.breakdown.b2bMarkup).toBe(10)
      expect(result.breakdown.partnerB2CProfit).toBe(200)
      expect(result.breakdown.partnerB2BProfit).toBe(100)
    })

    it('should calculate real margin percentages correctly', () => {
      const result = calculateTierPricing(800, {
        workingMode: 'net',
        markup: { b2c: 25, b2b: 0 }
      })

      // b2cPrice = 1000, hotelCost = 800, margin = 200/1000 = 20%
      expect(result.breakdown.realB2CMarginPercent).toBe(20)
      // b2bPrice = 800, hotelCost = 800, margin = 0%
      expect(result.breakdown.realB2BMarginPercent).toBe(0)
    })

    it('should round to 2 decimal places', () => {
      const result = calculateTierPricing(333.33, {
        workingMode: 'net',
        markup: { b2c: 33, b2b: 17 }
      })

      // 333.33 * 1.33 = 443.3289 -> 443.33
      expect(result.b2cPrice).toBe(443.33)
      // 333.33 * 1.17 = 389.9961 -> 390
      expect(result.b2bPrice).toBe(390)
    })
  })

  // ── calculateTierPricing - COMMISSION mode ────────────────────────────────

  describe('calculateTierPricing - COMMISSION mode', () => {
    it('should calculate commission mode correctly', () => {
      const result = calculateTierPricing(1100, {
        workingMode: 'commission',
        commissionRate: 10,
        markup: { b2c: 0 },
        agencyMarginShare: 50
      })

      // hotelCost = 1100 / 1.10 = 1000
      expect(result.hotelCost).toBe(1000)
      // b2cPrice = 1100 (no markup)
      expect(result.b2cPrice).toBe(1100)
      // Real margin = 10/110 * 100 = 9.0909%
      // Agency share = 9.0909 * 0.50 = 4.5454%
      // b2bPrice = 1100 * (1 - 0.045454) = 1100 * 0.954546 ≈ 1050
      expect(result.b2bPrice).toBe(1050)
    })

    it('should correctly calculate hotel cost from gross price', () => {
      const result = calculateTierPricing(2000, {
        workingMode: 'commission',
        commissionRate: 20,
        markup: { b2c: 0 },
        agencyMarginShare: 50
      })

      // hotelCost = 2000 / 1.20 = 1666.67
      expect(result.hotelCost).toBe(1666.67)
    })

    it('should add B2C markup on top of gross price', () => {
      const result = calculateTierPricing(1000, {
        workingMode: 'commission',
        commissionRate: 10,
        markup: { b2c: 15 },
        agencyMarginShare: 50
      })

      // b2cPrice = 1000 * 1.15 = 1150
      expect(result.b2cPrice).toBe(1150)
    })

    it('should ensure partner never has negative B2B margin', () => {
      // Even with 100% agency share, partner gets 0 but never negative
      const result = calculateTierPricing(1100, {
        workingMode: 'commission',
        commissionRate: 10,
        markup: { b2c: 0 },
        agencyMarginShare: 100
      })

      // Real margin = 10/110 = 9.09%
      // Agency gets 100% of margin = 9.09%
      // b2bPrice = 1100 * (1 - 0.0909) = 1000
      // Partner B2B profit = 1000 - 1000 = 0
      expect(result.b2bPrice).toBeCloseTo(1000, 0)
      expect(result.b2bPrice).toBeGreaterThanOrEqual(result.hotelCost)
    })

    it('should handle 0% agency margin share', () => {
      const result = calculateTierPricing(1100, {
        workingMode: 'commission',
        commissionRate: 10,
        markup: { b2c: 0 },
        agencyMarginShare: 0
      })

      // Agency gets 0% of margin, so b2bPrice = basePrice
      expect(result.b2bPrice).toBe(1100)
      // Partner keeps all margin
      expect(result.breakdown.partnerB2BProfit).toBeCloseTo(100, 0)
    })

    it('should include detailed breakdown for commission mode', () => {
      const result = calculateTierPricing(1100, {
        workingMode: 'commission',
        commissionRate: 10,
        markup: { b2c: 5 },
        agencyMarginShare: 50
      })

      expect(result.breakdown.workingMode).toBe('commission')
      expect(result.breakdown.commissionRate).toBe(10)
      expect(result.breakdown.realMarginPercent).toBe(9.09) // 10/110 * 100
      expect(result.breakdown.agencyMarginShare).toBe(50)
      expect(result.breakdown.b2cMarkup).toBe(5)
    })

    it('should use default 10% commission when not specified', () => {
      const result = calculateTierPricing(1100, {
        workingMode: 'commission',
        markup: { b2c: 0 },
        agencyMarginShare: 50
      })

      // hotelCost = 1100 / 1.10 = 1000
      expect(result.hotelCost).toBe(1000)
    })

    it('should handle default 50% agency margin share', () => {
      const result = calculateTierPricing(1100, {
        workingMode: 'commission',
        commissionRate: 10,
        markup: { b2c: 0 }
        // agencyMarginShare not specified, defaults to 50
      })

      // b2bPrice should be the same as with explicit 50%
      expect(result.b2bPrice).toBe(1050)
    })
  })

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should handle zero base price', () => {
      const result = calculateTierPricing(0, {
        workingMode: 'net',
        markup: { b2c: 20, b2b: 10 }
      })

      expect(result.hotelCost).toBe(0)
      expect(result.b2cPrice).toBe(0)
      expect(result.b2bPrice).toBe(0)
    })

    it('should handle very small prices', () => {
      const result = calculateTierPricing(0.01, {
        workingMode: 'net',
        markup: { b2c: 50 }
      })

      // 0.01 * 1.50 = 0.015 -> rounded to 0.02
      expect(result.b2cPrice).toBe(0.02)
    })

    it('should handle very large prices', () => {
      const result = calculateTierPricing(999999.99, {
        workingMode: 'net',
        markup: { b2c: 10 }
      })

      // 999999.99 * 1.10 = 1099999.989 -> 1099999.99
      expect(result.b2cPrice).toBe(1099999.99)
    })
  })
})
