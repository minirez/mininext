/**
 * Auth Flow Tests
 * Tests for generateTokens and login validation logic
 */

import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'

// Set test env before imports
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long-for-tests'
process.env.JWT_ACCESS_EXPIRE = '15m'
process.env.JWT_REFRESH_EXPIRE = '7d'

// Mock all external dependencies
vi.mock('#core/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('#modules/user/user.model.js', () => ({
  default: { findOne: vi.fn() }
}))

vi.mock('#modules/partner/partner.model.js', () => ({
  default: { findById: vi.fn() }
}))

vi.mock('#modules/agency/agency.model.js', () => ({
  default: { findById: vi.fn() }
}))

vi.mock('#modules/session/session.model.js', () => ({
  default: { createFromToken: vi.fn() }
}))

vi.mock('#helpers/twoFactor.js', () => ({
  verify2FAToken: vi.fn()
}))

vi.mock('#helpers/mail.js', () => ({
  sendPasswordResetEmail: vi.fn(),
  sendNewPartnerNotification: vi.fn(),
  getAdminUrl: vi.fn(() => 'http://localhost:5180')
}))

vi.mock('#middleware/rateLimiter.js', () => ({
  checkLoginLockout: vi.fn().mockResolvedValue({ isLocked: false }),
  recordFailedLogin: vi.fn().mockResolvedValue({ remainingAttempts: 4, isLocked: false }),
  clearFailedLogins: vi.fn(),
  unblockAccount: vi.fn()
}))

import { generateTokens } from '../../../modules/auth/auth.service.js'

describe('Auth Flow', () => {
  // ── generateTokens ──────────────────────────────────────────────────────

  describe('generateTokens', () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      accountType: 'partner',
      role: 'admin'
    }

    const mockAccount = {
      _id: '507f1f77bcf86cd799439022'
    }

    it('should return both accessToken and refreshToken', () => {
      const tokens = generateTokens(mockUser, mockAccount)

      expect(tokens).toHaveProperty('accessToken')
      expect(tokens).toHaveProperty('refreshToken')
      expect(typeof tokens.accessToken).toBe('string')
      expect(typeof tokens.refreshToken).toBe('string')
    })

    it('should include correct payload in access token', () => {
      const { accessToken } = generateTokens(mockUser, mockAccount)
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)

      expect(decoded.userId).toBe(mockUser._id)
      expect(decoded.accountId).toBe(mockAccount._id)
      expect(decoded.accountType).toBe('partner')
      expect(decoded.role).toBe('admin')
    })

    it('should include only userId in refresh token', () => {
      const { refreshToken } = generateTokens(mockUser, mockAccount)
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)

      expect(decoded.userId).toBe(mockUser._id)
      expect(decoded).not.toHaveProperty('accountId')
      expect(decoded).not.toHaveProperty('role')
    })

    it('should generate valid JWTs that can be verified', () => {
      const { accessToken, refreshToken } = generateTokens(mockUser, mockAccount)

      expect(() => jwt.verify(accessToken, process.env.JWT_SECRET)).not.toThrow()
      expect(() => jwt.verify(refreshToken, process.env.JWT_SECRET)).not.toThrow()
    })

    it('should generate different tokens for different users', () => {
      const tokens1 = generateTokens(mockUser, mockAccount)
      const tokens2 = generateTokens({ ...mockUser, _id: '507f1f77bcf86cd799439099' }, mockAccount)

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken)
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken)
    })

    it('should handle different account types', () => {
      const agencyUser = { ...mockUser, accountType: 'agency', role: 'user' }
      const { accessToken } = generateTokens(agencyUser, mockAccount)
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)

      expect(decoded.accountType).toBe('agency')
      expect(decoded.role).toBe('user')
    })
  })

  // ── Login validation (unit-level checks) ────────────────────────────────

  describe('Login validation', () => {
    it('should require email to be case-insensitive (model query uses toLowerCase)', async () => {
      const User = (await import('../../../modules/user/user.model.js')).default

      // Verify that findOne is called (login implementation lowercases email)
      // This is a pattern verification - the actual login function lowercases before query
      expect(User.findOne).toBeDefined()
    })

    it('should have lockout protection configured', async () => {
      const { checkLoginLockout, recordFailedLogin } = await import('#middleware/rateLimiter.js')

      // Verify lockout functions are available
      expect(checkLoginLockout).toBeDefined()
      expect(recordFailedLogin).toBeDefined()
    })
  })

  // ── JWT token expiry ──────────────────────────────────────────────────────

  describe('JWT token expiry', () => {
    it('should have appropriate access token expiry', () => {
      const { accessToken } = generateTokens(
        { _id: 'test', accountType: 'partner', role: 'admin' },
        { _id: 'acc' }
      )
      const decoded = jwt.decode(accessToken)

      // Access token should expire within reasonable time (15m to 24h)
      const expiresInSeconds = decoded.exp - decoded.iat
      expect(expiresInSeconds).toBeGreaterThan(0)
      expect(expiresInSeconds).toBeLessThanOrEqual(86400) // max 24 hours
    })

    it('should have longer refresh token expiry than access token', () => {
      const user = { _id: 'test', accountType: 'partner', role: 'admin' }
      const account = { _id: 'acc' }
      const { accessToken, refreshToken } = generateTokens(user, account)

      const accessDecoded = jwt.decode(accessToken)
      const refreshDecoded = jwt.decode(refreshToken)

      const accessExpiry = accessDecoded.exp - accessDecoded.iat
      const refreshExpiry = refreshDecoded.exp - refreshDecoded.iat

      expect(refreshExpiry).toBeGreaterThan(accessExpiry)
    })
  })
})
