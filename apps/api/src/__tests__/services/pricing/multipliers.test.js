/**
 * Multipliers Tests
 * Tests for override hierarchy: RoomType → Market → Season → Rate
 */

import { describe, it, expect } from 'vitest'
import {
  mapToObject,
  getEffectiveMinAdults,
  getEffectivePricingType,
  getEffectiveMultiplierTemplate,
  getEffectiveChildAgeGroups,
  getEffectiveRoundingRule
} from '../../../services/pricing/multipliers.js'

// ── Test helpers ──────────────────────────────────────────────────────────────

const roomTypeId = '507f1f77bcf86cd799439011'

const createRoomType = (overrides = {}) => ({
  _id: roomTypeId,
  occupancy: { minAdults: 1, maxAdults: 4 },
  pricingType: 'unit',
  useMultipliers: false,
  multiplierTemplate: null,
  ...overrides
})

const createOverride = (opts = {}) => ({
  roomType: roomTypeId,
  ...opts
})

// ── mapToObject ─────────────────────────────────────────────────────────────

describe('mapToObject', () => {
  it('should convert a Map to plain object', () => {
    const map = new Map([
      ['1', 1.0],
      ['2', 0.75],
      ['3', 0.5]
    ])

    const result = mapToObject(map)

    expect(result).toEqual({ 1: 1.0, 2: 0.75, 3: 0.5 })
  })

  it('should handle nested Maps', () => {
    const inner = new Map([['a', 1]])
    const outer = new Map([['nested', inner]])

    const result = mapToObject(outer)

    expect(result).toEqual({ nested: { a: 1 } })
  })

  it('should return null for null input', () => {
    expect(mapToObject(null)).toBeNull()
  })

  it('should return plain objects as-is (from lean())', () => {
    const obj = { 1: 1.0, 2: 0.75 }
    const result = mapToObject(obj)

    expect(result).toEqual({ 1: 1.0, 2: 0.75 })
  })

  it('should handle non-object values', () => {
    expect(mapToObject('string')).toBe('string')
    expect(mapToObject(42)).toBe(42)
  })
})

// ── getEffectiveMinAdults ───────────────────────────────────────────────────

describe('getEffectiveMinAdults', () => {
  it('should return roomType minAdults by default', () => {
    const roomType = createRoomType({ occupancy: { minAdults: 2 } })
    expect(getEffectiveMinAdults(roomType)).toBe(2)
  })

  it('should return 1 when roomType has no minAdults', () => {
    const roomType = createRoomType({ occupancy: {} })
    expect(getEffectiveMinAdults(roomType)).toBe(1)
  })

  it('should use market override when active', () => {
    const roomType = createRoomType({ occupancy: { minAdults: 1 } })
    const market = {
      pricingOverrides: [createOverride({ useMinAdultsOverride: true, minAdults: 2 })]
    }

    expect(getEffectiveMinAdults(roomType, market)).toBe(2)
  })

  it('should ignore market override when useMinAdultsOverride is false', () => {
    const roomType = createRoomType({ occupancy: { minAdults: 1 } })
    const market = {
      pricingOverrides: [createOverride({ useMinAdultsOverride: false, minAdults: 3 })]
    }

    expect(getEffectiveMinAdults(roomType, market)).toBe(1)
  })

  it('should prefer season override over market override', () => {
    const roomType = createRoomType({ occupancy: { minAdults: 1 } })
    const market = {
      pricingOverrides: [createOverride({ useMinAdultsOverride: true, minAdults: 2 })]
    }
    const season = {
      pricingOverrides: [createOverride({ useMinAdultsOverride: true, minAdults: 3 })]
    }

    expect(getEffectiveMinAdults(roomType, market, season)).toBe(3)
  })

  it('should handle roomType with object-style _id in overrides', () => {
    const roomType = createRoomType()
    const market = {
      pricingOverrides: [
        { roomType: { _id: roomTypeId }, useMinAdultsOverride: true, minAdults: 2 }
      ]
    }

    expect(getEffectiveMinAdults(roomType, market)).toBe(2)
  })

  it('should handle null roomType', () => {
    expect(getEffectiveMinAdults(null)).toBe(1)
  })
})

// ── getEffectivePricingType ─────────────────────────────────────────────────

describe('getEffectivePricingType', () => {
  it('should return roomType default', () => {
    const roomType = createRoomType({ pricingType: 'unit' })
    expect(getEffectivePricingType(roomType)).toBe('unit')
  })

  it('should use market override', () => {
    const roomType = createRoomType({ pricingType: 'unit' })
    const market = {
      pricingOverrides: [
        createOverride({ usePricingTypeOverride: true, pricingType: 'per_person' })
      ]
    }

    expect(getEffectivePricingType(roomType, market)).toBe('per_person')
  })

  it('should prefer season over market', () => {
    const roomType = createRoomType({ pricingType: 'unit' })
    const market = {
      pricingOverrides: [
        createOverride({ usePricingTypeOverride: true, pricingType: 'per_person' })
      ]
    }
    const season = {
      pricingOverrides: [createOverride({ usePricingTypeOverride: true, pricingType: 'unit' })]
    }

    expect(getEffectivePricingType(roomType, market, season)).toBe('unit')
  })

  it('should use rate as final override', () => {
    const roomType = createRoomType({ pricingType: 'unit' })
    const rate = { pricingType: 'per_person' }

    expect(getEffectivePricingType(roomType, null, null, rate)).toBe('per_person')
  })

  it('should default to unit when roomType has no pricingType', () => {
    const roomType = createRoomType({ pricingType: undefined })
    expect(getEffectivePricingType(roomType)).toBe('unit')
  })
})

// ── getEffectiveMultiplierTemplate ──────────────────────────────────────────

describe('getEffectiveMultiplierTemplate', () => {
  it('should return defaults when no multipliers configured', () => {
    const roomType = createRoomType()
    const result = getEffectiveMultiplierTemplate(roomType)

    expect(result.useMultipliers).toBe(false)
    expect(result.adultMultipliers).toEqual({})
    expect(result.childMultipliers).toEqual({})
    expect(result.combinationTable).toEqual([])
    expect(result.roundingRule).toBe('none')
  })

  it('should use roomType multiplier template', () => {
    const roomType = createRoomType({
      useMultipliers: true,
      multiplierTemplate: {
        adultMultipliers: { 1: 1.0, 2: 0.75 },
        childMultipliers: { 1: 0.5 },
        combinationTable: [{ adults: 2, children: 1, multiplier: 0.8 }],
        roundingRule: 'round'
      }
    })

    const result = getEffectiveMultiplierTemplate(roomType)

    expect(result.useMultipliers).toBe(true)
    expect(result.adultMultipliers).toEqual({ 1: 1.0, 2: 0.75 })
    expect(result.childMultipliers).toEqual({ 1: 0.5 })
    expect(result.roundingRule).toBe('round')
  })

  it('should use market override over roomType', () => {
    const roomType = createRoomType({
      useMultipliers: true,
      multiplierTemplate: {
        adultMultipliers: { 1: 1.0 },
        roundingRule: 'none'
      }
    })
    const market = {
      pricingOverrides: [
        createOverride({
          useMultiplierOverride: true,
          multiplierOverride: {
            adultMultipliers: { 1: 0.9, 2: 0.7 },
            roundingRule: 'ceil'
          }
        })
      ]
    }

    const result = getEffectiveMultiplierTemplate(roomType, market)

    expect(result.useMultipliers).toBe(true)
    expect(result.adultMultipliers).toEqual({ 1: 0.9, 2: 0.7 })
    expect(result.roundingRule).toBe('ceil')
  })

  it('should use rate as highest priority override', () => {
    const roomType = createRoomType({
      useMultipliers: true,
      multiplierTemplate: {
        adultMultipliers: { 1: 1.0 },
        roundingRule: 'none'
      }
    })
    const rate = {
      useMultiplierOverride: true,
      multiplierOverride: {
        adultMultipliers: { 1: 0.5 },
        roundingRule: 'floor'
      }
    }

    const result = getEffectiveMultiplierTemplate(roomType, null, null, rate)

    expect(result.adultMultipliers).toEqual({ 1: 0.5 })
    expect(result.roundingRule).toBe('floor')
  })
})

// ── getEffectiveChildAgeGroups ──────────────────────────────────────────────

describe('getEffectiveChildAgeGroups', () => {
  const hotelGroups = [
    { name: 'child', minAge: 2, maxAge: 6 },
    { name: 'teen', minAge: 7, maxAge: 12 }
  ]

  it('should return hotel child age groups by default', () => {
    const hotel = { childAgeGroups: hotelGroups }
    expect(getEffectiveChildAgeGroups(hotel)).toEqual(hotelGroups)
  })

  it('should return empty array when hotel has no groups', () => {
    expect(getEffectiveChildAgeGroups({})).toEqual([])
  })

  it('should use market override when not inheriting from hotel', () => {
    const hotel = { childAgeGroups: hotelGroups }
    const marketGroups = [{ name: 'child', minAge: 0, maxAge: 11 }]
    const market = {
      childAgeSettings: {
        inheritFromHotel: false,
        childAgeGroups: marketGroups
      }
    }

    expect(getEffectiveChildAgeGroups(hotel, market)).toEqual(marketGroups)
  })

  it('should keep hotel groups when market inherits from hotel', () => {
    const hotel = { childAgeGroups: hotelGroups }
    const market = {
      childAgeSettings: {
        inheritFromHotel: true,
        childAgeGroups: [{ name: 'child', minAge: 0, maxAge: 11 }]
      }
    }

    expect(getEffectiveChildAgeGroups(hotel, market)).toEqual(hotelGroups)
  })

  it('should prefer season override over market', () => {
    const hotel = { childAgeGroups: hotelGroups }
    const market = {
      childAgeSettings: {
        inheritFromHotel: false,
        childAgeGroups: [{ name: 'child', minAge: 0, maxAge: 11 }]
      }
    }
    const seasonGroups = [{ name: 'kid', minAge: 0, maxAge: 5 }]
    const season = {
      childAgeSettings: {
        inheritFromMarket: false,
        childAgeGroups: seasonGroups
      }
    }

    expect(getEffectiveChildAgeGroups(hotel, market, season)).toEqual(seasonGroups)
  })
})

// ── getEffectiveRoundingRule ────────────────────────────────────────────────

describe('getEffectiveRoundingRule', () => {
  it('should return none by default', () => {
    const roomType = createRoomType()
    expect(getEffectiveRoundingRule(roomType)).toBe('none')
  })

  it('should return roomType rounding rule', () => {
    const roomType = createRoomType({
      useMultipliers: true,
      multiplierTemplate: { roundingRule: 'ceil' }
    })

    expect(getEffectiveRoundingRule(roomType)).toBe('ceil')
  })
})
