/**
 * Auth Service Unit Tests
 * Tests for authentication functions
 */

import { describe, it, expect, jest } from '@jest/globals'
import jwt from 'jsonwebtoken'

// Mock dependencies before importing auth service
jest.unstable_mockModule('#config', () => ({
  default: {
    jwt: {
      secret: 'test-secret-key-for-testing-32chars!',
      accessExpire: '15m',
      refreshExpire: '7d'
    }
  }
}))

jest.unstable_mockModule('#core/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}))

// Import after mocks
const { generateTokens } = await import('../../../modules/auth/auth.service.js')
const config = (await import('#config')).default

describe('Auth Service', () => {
  describe('generateTokens', () => {
    const mockUser = {
      _id: 'user123',
      role: 'admin',
      accountType: 'partner'
    }

    const mockAccount = {
      _id: 'partner456'
    }

    it('should generate access and refresh tokens', () => {
      const tokens = generateTokens(mockUser, mockAccount)

      expect(tokens).toHaveProperty('accessToken')
      expect(tokens).toHaveProperty('refreshToken')
      expect(typeof tokens.accessToken).toBe('string')
      expect(typeof tokens.refreshToken).toBe('string')
    })

    it('should create valid JWT access token with correct payload', () => {
      const { accessToken } = generateTokens(mockUser, mockAccount)
      const decoded = jwt.verify(accessToken, config.jwt.secret)

      expect(decoded.userId).toBe(mockUser._id)
      expect(decoded.accountId).toBe(mockAccount._id)
      expect(decoded.accountType).toBe(mockUser.accountType)
      expect(decoded.role).toBe(mockUser.role)
    })

    it('should create valid JWT refresh token with userId', () => {
      const { refreshToken } = generateTokens(mockUser, mockAccount)
      const decoded = jwt.verify(refreshToken, config.jwt.secret)

      expect(decoded.userId).toBe(mockUser._id)
      expect(decoded).not.toHaveProperty('accountId')
    })

    it('should create tokens with expiration', () => {
      const { accessToken, refreshToken } = generateTokens(mockUser, mockAccount)

      const decodedAccess = jwt.decode(accessToken)
      const decodedRefresh = jwt.decode(refreshToken)

      expect(decodedAccess.exp).toBeDefined()
      expect(decodedRefresh.exp).toBeDefined()
      expect(decodedRefresh.exp).toBeGreaterThan(decodedAccess.exp)
    })

    it('should handle different account types', () => {
      const agencyUser = { ...mockUser, accountType: 'agency' }
      const { accessToken } = generateTokens(agencyUser, mockAccount)
      const decoded = jwt.verify(accessToken, config.jwt.secret)

      expect(decoded.accountType).toBe('agency')
    })

    it('should handle platform admin', () => {
      const platformUser = {
        _id: 'admin123',
        role: 'admin',
        accountType: 'platform'
      }
      const platformAccount = { _id: 'platform' }

      const { accessToken } = generateTokens(platformUser, platformAccount)
      const decoded = jwt.verify(accessToken, config.jwt.secret)

      expect(decoded.accountType).toBe('platform')
    })
  })
})
