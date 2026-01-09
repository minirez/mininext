/**
 * Format Utilities Tests
 */

import { describe, it, expect } from '@jest/globals'
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  normalizePhone,
  formatPhone,
  formatPhoneForSMS,
  truncate,
  formatFileSize,
  mask
} from '../format.js'

describe('Format Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency with locale', () => {
      const result = formatCurrency(1250.5, 'EUR', 'tr-TR')
      expect(result).toContain('1.250')
    })

    it('should return empty string for invalid amount', () => {
      expect(formatCurrency(null)).toBe('')
      expect(formatCurrency(NaN)).toBe('')
    })
  })

  describe('formatNumber', () => {
    it('should format number with locale', () => {
      const result = formatNumber(1250.5, 'tr-TR')
      expect(result).toContain('1.250')
    })

    it('should return empty string for invalid number', () => {
      expect(formatNumber(null)).toBe('')
    })
  })

  describe('formatPercent', () => {
    it('should format percentage', () => {
      expect(formatPercent(25)).toBe('25%')
      expect(formatPercent(25.5, 1)).toBe('25.5%')
    })

    it('should handle decimal value', () => {
      expect(formatPercent(0.25, 0, true)).toBe('25%')
    })

    it('should return empty string for invalid value', () => {
      expect(formatPercent(null)).toBe('')
    })
  })

  describe('normalizePhone', () => {
    it('should remove non-digit characters', () => {
      expect(normalizePhone('+90 (532) 123 45 67')).toBe('905321234567')
    })

    it('should return empty string for falsy input', () => {
      expect(normalizePhone(null)).toBe('')
      expect(normalizePhone('')).toBe('')
    })
  })

  describe('formatPhone', () => {
    it('should format 10-digit number', () => {
      expect(formatPhone('5321234567')).toBe('(532) 123 45 67')
    })

    it('should format 11-digit number with 0', () => {
      expect(formatPhone('05321234567')).toBe('(532) 123 45 67')
    })

    it('should format 12-digit with country code', () => {
      expect(formatPhone('905321234567')).toBe('+90 (532) 123 45 67')
    })
  })

  describe('formatPhoneForSMS', () => {
    it('should convert to E.164 format', () => {
      expect(formatPhoneForSMS('5321234567')).toBe('905321234567')
      expect(formatPhoneForSMS('05321234567')).toBe('905321234567')
    })

    it('should keep already correct format', () => {
      expect(formatPhoneForSMS('905321234567')).toBe('905321234567')
    })
  })

  describe('truncate', () => {
    it('should truncate long text', () => {
      expect(truncate('This is a long text', 10)).toBe('This is...')
    })

    it('should not truncate short text', () => {
      expect(truncate('Short', 10)).toBe('Short')
    })

    it('should return empty string for falsy input', () => {
      expect(truncate(null)).toBe('')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1048576)).toBe('1.0 MB')
    })
  })

  describe('mask', () => {
    it('should mask text', () => {
      expect(mask('1234567890')).toBe('12****90')
    })

    it('should handle short text', () => {
      expect(mask('12')).toBe('****')
    })

    it('should handle null', () => {
      expect(mask(null)).toBe('****')
    })
  })
})
