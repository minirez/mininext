/**
 * Restrictions Tests
 * Tests for checkRestrictions - availability and booking rule validation
 */

import { describe, it, expect } from 'vitest'
import { checkRestrictions } from '../../../services/pricing/restrictions.js'

describe('checkRestrictions', () => {
  // ── Base rate factory ─────────────────────────────────────────────────────

  const createRate = (overrides = {}) => ({
    stopSale: false,
    singleStop: false,
    allotment: 10,
    sold: 0,
    releaseDays: 0,
    minStay: null,
    maxStay: null,
    closedToArrival: false,
    closedToDeparture: false,
    ...overrides
  })

  // ── Bookable scenarios ────────────────────────────────────────────────────

  describe('bookable scenarios', () => {
    it('should return bookable for a normal rate', () => {
      const rate = createRate()
      const result = checkRestrictions(rate, { adults: 2 })

      expect(result.isBookable).toBe(true)
      expect(result.messages).toHaveLength(0)
      expect(Object.values(result.restrictions).every(v => v === false)).toBe(true)
    })

    it('should be bookable when all conditions are met', () => {
      const rate = createRate({
        allotment: 5,
        sold: 3,
        releaseDays: 2,
        minStay: 2,
        maxStay: 7
      })

      const result = checkRestrictions(rate, {
        adults: 2,
        checkInDate: new Date(Date.now() + 5 * 86400000), // 5 days ahead
        checkOutDate: new Date(Date.now() + 8 * 86400000), // 3 nights
        requiredRooms: 1
      })

      expect(result.isBookable).toBe(true)
    })
  })

  // ── Stop sale ─────────────────────────────────────────────────────────────

  describe('stop sale', () => {
    it('should block when stopSale is active', () => {
      const rate = createRate({ stopSale: true })
      const result = checkRestrictions(rate)

      expect(result.isBookable).toBe(false)
      expect(result.restrictions.stopSale).toBe(true)
      expect(result.messages).toContain('Stop sale active')
    })
  })

  // ── Minimum adults ────────────────────────────────────────────────────────

  describe('minimum adults', () => {
    it('should block when adults below minimum', () => {
      const rate = createRate()
      const result = checkRestrictions(rate, {
        adults: 1,
        minAdults: 2
      })

      expect(result.isBookable).toBe(false)
      expect(result.restrictions.belowMinAdults).toBe(true)
      expect(result.messages).toContain('Minimum 2 adult(s) required')
    })

    it('should allow when adults equal to minimum', () => {
      const rate = createRate()
      const result = checkRestrictions(rate, {
        adults: 2,
        minAdults: 2
      })

      expect(result.restrictions.belowMinAdults).toBe(false)
    })

    it('should use default minAdults of 1', () => {
      const rate = createRate()
      const result = checkRestrictions(rate, { adults: 1 })

      expect(result.restrictions.belowMinAdults).toBe(false)
    })
  })

  // ── Single stop (legacy) ──────────────────────────────────────────────────

  describe('single stop', () => {
    it('should block single occupancy when singleStop is active', () => {
      const rate = createRate({ singleStop: true })
      const result = checkRestrictions(rate, { adults: 1 })

      expect(result.isBookable).toBe(false)
      expect(result.restrictions.singleStop).toBe(true)
      expect(result.messages).toContain('Single occupancy not available')
    })

    it('should allow 2+ adults even with singleStop', () => {
      const rate = createRate({ singleStop: true })
      const result = checkRestrictions(rate, { adults: 2 })

      expect(result.restrictions.singleStop).toBe(false)
    })
  })

  // ── Allotment ─────────────────────────────────────────────────────────────

  describe('allotment', () => {
    it('should block when no rooms available', () => {
      const rate = createRate({ allotment: 5, sold: 5 })
      const result = checkRestrictions(rate, { requiredRooms: 1 })

      expect(result.isBookable).toBe(false)
      expect(result.restrictions.noAvailability).toBe(true)
      expect(result.restrictions.insufficientAllotment).toBe(true)
      expect(result.messages).toContain('No rooms available')
    })

    it('should block when insufficient rooms for multi-room booking', () => {
      const rate = createRate({ allotment: 5, sold: 3 })
      const result = checkRestrictions(rate, { requiredRooms: 3 })

      expect(result.isBookable).toBe(false)
      expect(result.restrictions.insufficientAllotment).toBe(true)
    })

    it('should allow when enough rooms available', () => {
      const rate = createRate({ allotment: 10, sold: 5 })
      const result = checkRestrictions(rate, { requiredRooms: 3 })

      expect(result.restrictions.insufficientAllotment).toBe(false)
    })

    it('should skip allotment check when allotment is null (unlimited)', () => {
      const rate = createRate({ allotment: null })
      const result = checkRestrictions(rate, { requiredRooms: 100 })

      expect(result.restrictions.noAvailability).toBe(false)
      expect(result.restrictions.insufficientAllotment).toBe(false)
    })

    it('should handle legacy available field', () => {
      const rate = createRate({ allotment: null, available: 0 })
      const result = checkRestrictions(rate)

      expect(result.restrictions.noAvailability).toBe(true)
    })
  })

  // ── Release days ──────────────────────────────────────────────────────────

  describe('release days', () => {
    it('should block when booking too close to check-in', () => {
      const rate = createRate({ releaseDays: 3 })
      const tomorrow = new Date(Date.now() + 86400000) // 1 day ahead

      const result = checkRestrictions(rate, {
        checkInDate: tomorrow,
        bookingDate: new Date()
      })

      expect(result.isBookable).toBe(false)
      expect(result.restrictions.releaseDays).toBe(true)
      expect(result.messages).toContain('Minimum 3 days advance booking required')
    })

    it('should allow when booking far enough in advance', () => {
      const rate = createRate({ releaseDays: 3 })
      const checkIn = new Date(Date.now() + 5 * 86400000) // 5 days ahead

      const result = checkRestrictions(rate, {
        checkInDate: checkIn,
        bookingDate: new Date()
      })

      expect(result.restrictions.releaseDays).toBe(false)
    })

    it('should skip when releaseDays is 0', () => {
      const rate = createRate({ releaseDays: 0 })

      const result = checkRestrictions(rate, {
        checkInDate: new Date() // today
      })

      expect(result.restrictions.releaseDays).toBe(false)
    })
  })

  // ── Min/Max stay ──────────────────────────────────────────────────────────

  describe('min/max stay', () => {
    it('should block when stay is shorter than minStay', () => {
      const rate = createRate({ minStay: 3 })
      const checkIn = new Date('2026-03-01')
      const checkOut = new Date('2026-03-03') // 2 nights

      const result = checkRestrictions(rate, { checkInDate: checkIn, checkOutDate: checkOut })

      expect(result.isBookable).toBe(false)
      expect(result.restrictions.minStay).toBe(true)
      expect(result.messages).toContain('Minimum 3 night stay required')
    })

    it('should block when stay exceeds maxStay', () => {
      const rate = createRate({ maxStay: 5 })
      const checkIn = new Date('2026-03-01')
      const checkOut = new Date('2026-03-08') // 7 nights

      const result = checkRestrictions(rate, { checkInDate: checkIn, checkOutDate: checkOut })

      expect(result.isBookable).toBe(false)
      expect(result.restrictions.maxStay).toBe(true)
      expect(result.messages).toContain('Maximum 5 night stay allowed')
    })

    it('should allow when stay is within min/max range', () => {
      const rate = createRate({ minStay: 2, maxStay: 7 })
      const checkIn = new Date('2026-03-01')
      const checkOut = new Date('2026-03-05') // 4 nights

      const result = checkRestrictions(rate, { checkInDate: checkIn, checkOutDate: checkOut })

      expect(result.restrictions.minStay).toBe(false)
      expect(result.restrictions.maxStay).toBe(false)
    })

    it('should allow exactly minStay nights', () => {
      const rate = createRate({ minStay: 3 })
      const checkIn = new Date('2026-03-01')
      const checkOut = new Date('2026-03-04') // exactly 3 nights

      const result = checkRestrictions(rate, { checkInDate: checkIn, checkOutDate: checkOut })

      expect(result.restrictions.minStay).toBe(false)
    })
  })

  // ── Closed to arrival/departure ───────────────────────────────────────────

  describe('closed to arrival/departure', () => {
    it('should block arrivals on closed-to-arrival dates', () => {
      const rate = createRate({ closedToArrival: true })
      const result = checkRestrictions(rate)

      expect(result.isBookable).toBe(false)
      expect(result.restrictions.closedToArrival).toBe(true)
      expect(result.messages).toContain('Arrival not allowed on this date')
    })

    it('should block departures on closed-to-departure dates', () => {
      const rate = createRate({ closedToDeparture: true })
      const result = checkRestrictions(rate)

      expect(result.isBookable).toBe(false)
      expect(result.restrictions.closedToDeparture).toBe(true)
      expect(result.messages).toContain('Departure not allowed on this date')
    })
  })

  // ── Multiple restrictions ─────────────────────────────────────────────────

  describe('multiple restrictions', () => {
    it('should accumulate all restriction messages', () => {
      const rate = createRate({
        stopSale: true,
        closedToArrival: true,
        allotment: 0,
        sold: 0
      })

      const result = checkRestrictions(rate, { adults: 1, minAdults: 2, requiredRooms: 1 })

      expect(result.isBookable).toBe(false)
      expect(result.messages.length).toBeGreaterThanOrEqual(3)
      expect(result.restrictions.stopSale).toBe(true)
      expect(result.restrictions.belowMinAdults).toBe(true)
      expect(result.restrictions.closedToArrival).toBe(true)
    })
  })
})
