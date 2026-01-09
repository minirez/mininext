/**
 * Date Utilities Tests
 */

import { describe, it, expect } from '@jest/globals'
import {
  formatDate,
  formatDateLocale,
  getNights,
  getDateRange,
  addDays,
  isPastDate,
  isToday,
  startOfDay,
  endOfDay
} from '../date.js'

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      expect(formatDate('2024-06-15')).toBe('2024-06-15')
      expect(formatDate(new Date('2024-06-15'))).toBe('2024-06-15')
    })

    it('should return empty string for invalid date', () => {
      expect(formatDate(null)).toBe('')
      expect(formatDate(undefined)).toBe('')
      expect(formatDate('invalid')).toBe('')
    })
  })

  describe('formatDateLocale', () => {
    it('should format date with locale', () => {
      const result = formatDateLocale('2024-06-15', 'tr-TR')
      expect(result).toContain('2024')
      expect(result).toContain('15')
    })

    it('should return empty string for invalid date', () => {
      expect(formatDateLocale(null)).toBe('')
    })
  })

  describe('getNights', () => {
    it('should calculate nights between dates', () => {
      expect(getNights('2024-06-15', '2024-06-18')).toBe(3)
      expect(getNights('2024-06-15', '2024-06-16')).toBe(1)
    })

    it('should return 0 for same dates', () => {
      expect(getNights('2024-06-15', '2024-06-15')).toBe(0)
    })

    it('should return 0 for invalid dates', () => {
      expect(getNights('invalid', '2024-06-15')).toBe(0)
    })
  })

  describe('getDateRange', () => {
    it('should return array of dates', () => {
      const dates = getDateRange('2024-06-15', '2024-06-18')
      expect(dates).toHaveLength(3)
      expect(dates[0]).toBe('2024-06-15')
      expect(dates[1]).toBe('2024-06-16')
      expect(dates[2]).toBe('2024-06-17')
    })

    it('should return empty array for invalid dates', () => {
      expect(getDateRange('invalid', '2024-06-18')).toEqual([])
    })
  })

  describe('addDays', () => {
    it('should add days to date', () => {
      const result = addDays('2024-06-15', 5)
      expect(formatDate(result)).toBe('2024-06-20')
    })

    it('should handle negative days', () => {
      const result = addDays('2024-06-15', -3)
      expect(formatDate(result)).toBe('2024-06-12')
    })
  })

  describe('isPastDate', () => {
    it('should return true for past dates', () => {
      expect(isPastDate('2020-01-01')).toBe(true)
    })

    it('should return false for future dates', () => {
      expect(isPastDate('2030-01-01')).toBe(false)
    })
  })

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true)
    })

    it('should return false for other dates', () => {
      expect(isToday('2020-01-01')).toBe(false)
    })
  })

  describe('startOfDay', () => {
    it('should return start of day', () => {
      const result = startOfDay('2024-06-15T14:30:00')
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
    })
  })

  describe('endOfDay', () => {
    it('should return end of day', () => {
      const result = endOfDay('2024-06-15T14:30:00')
      expect(result.getHours()).toBe(23)
      expect(result.getMinutes()).toBe(59)
    })
  })
})
