/**
 * String Utilities Tests
 */

import { describe, it, expect } from '@jest/globals'
import {
  capitalize,
  titleCase,
  slugify,
  camelToKebab,
  kebabToCamel,
  removeDiacritics,
  randomString,
  escapeHtml,
  stripHtml,
  isEmpty,
  pad,
  getInitials
} from '../string.js'

describe('String Utils', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('HELLO')).toBe('Hello')
    })

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('')
      expect(capitalize(null)).toBe('')
    })
  })

  describe('titleCase', () => {
    it('should capitalize each word', () => {
      expect(titleCase('hello world')).toBe('Hello World')
      expect(titleCase('HELLO WORLD')).toBe('Hello World')
    })
  })

  describe('slugify', () => {
    it('should create URL-friendly slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('Test & Demo!')).toBe('test-demo')
    })

    it('should handle special characters', () => {
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
    })
  })

  describe('camelToKebab', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(camelToKebab('helloWorld')).toBe('hello-world')
      expect(camelToKebab('myTestFunction')).toBe('my-test-function')
    })
  })

  describe('kebabToCamel', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(kebabToCamel('hello-world')).toBe('helloWorld')
      expect(kebabToCamel('my-test-function')).toBe('myTestFunction')
    })
  })

  describe('removeDiacritics', () => {
    it('should remove accents', () => {
      expect(removeDiacritics('café')).toBe('cafe')
      expect(removeDiacritics('über')).toBe('uber')
      expect(removeDiacritics('İstanbul')).toBe('Istanbul')
    })
  })

  describe('randomString', () => {
    it('should generate string of specified length', () => {
      expect(randomString(10)).toHaveLength(10)
      expect(randomString(5)).toHaveLength(5)
    })

    it('should use specified charset', () => {
      const numeric = randomString(10, 'numeric')
      expect(numeric).toMatch(/^[0-9]+$/)
    })
  })

  describe('escapeHtml', () => {
    it('should escape HTML characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
      expect(escapeHtml('"test"')).toBe('&quot;test&quot;')
    })
  })

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello</p>')).toBe('Hello')
      expect(stripHtml('<b>Bold</b> text')).toBe('Bold text')
    })
  })

  describe('isEmpty', () => {
    it('should return true for empty strings', () => {
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('   ')).toBe(true)
      expect(isEmpty(null)).toBe(true)
    })

    it('should return false for non-empty strings', () => {
      expect(isEmpty('hello')).toBe(false)
    })
  })

  describe('pad', () => {
    it('should pad string at start', () => {
      expect(pad(5, 3)).toBe('005')
      expect(pad('a', 4, 'x')).toBe('xxxa')
    })

    it('should pad string at end', () => {
      expect(pad('a', 4, 'x', 'end')).toBe('axxx')
    })
  })

  describe('getInitials', () => {
    it('should get initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('John')).toBe('J')
    })

    it('should limit number of initials', () => {
      expect(getInitials('John Michael Doe', 2)).toBe('JM')
    })

    it('should handle empty input', () => {
      expect(getInitials('')).toBe('')
    })
  })
})
