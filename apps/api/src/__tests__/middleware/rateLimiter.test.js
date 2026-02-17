/**
 * Rate Limiter Tests
 * Test rate limiting middleware functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  createRateLimiter,
  recordFailedLogin,
  checkLoginLockout,
  clearFailedLogins,
  getFailedLoginStats,
  clearRateLimiterStore
} from '../../middleware/rateLimiter.js'

// Mock Redis as disconnected for in-memory tests
jest.unstable_mockModule('../../core/redis.js', () => ({
  isRedisConnected: () => false,
  redisRateLimitStore: {
    get: jest.fn(),
    set: jest.fn(),
    increment: jest.fn(),
    delete: jest.fn(),
    getStats: jest.fn()
  }
}))

describe('Rate Limiter Middleware', () => {
  beforeEach(() => {
    clearRateLimiterStore()
  })

  describe('createRateLimiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5
      })

      const req = global.testUtils.mockRequest({
        ip: '127.0.0.1',
        originalUrl: '/api/test',
        headers: {}
      })
      const res = global.testUtils.mockResponse()
      res.set = jest.fn()
      const next = global.testUtils.mockNext()

      await limiter(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': 5,
          'X-RateLimit-Remaining': 4
        })
      )
    })

    it('should block requests exceeding limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        message: 'Rate limit exceeded'
      })

      const req = global.testUtils.mockRequest({
        ip: '127.0.0.1',
        originalUrl: '/api/test',
        headers: {}
      })
      const res = global.testUtils.mockResponse()
      res.set = jest.fn()
      const next = global.testUtils.mockNext()

      // First request
      await limiter(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)

      // Second request
      await limiter(req, res, next)
      expect(next).toHaveBeenCalledTimes(2)

      // Third request - should be blocked
      await limiter(req, res, next)
      expect(res.status).toHaveBeenCalledWith(429)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded'
        })
      )
    })

    it('should skip rate limiting when skip function returns true', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        skip: req => req.headers['x-skip-limit'] === 'true'
      })

      const req = global.testUtils.mockRequest({
        ip: '127.0.0.1',
        originalUrl: '/api/test',
        headers: { 'x-skip-limit': 'true' }
      })
      const res = global.testUtils.mockResponse()
      res.set = jest.fn()
      const next = global.testUtils.mockNext()

      // Multiple requests should all pass
      await limiter(req, res, next)
      await limiter(req, res, next)
      await limiter(req, res, next)

      expect(next).toHaveBeenCalledTimes(3)
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should use custom key generator', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: req => req.body.email
      })

      const req1 = global.testUtils.mockRequest({
        ip: '127.0.0.1',
        originalUrl: '/api/test',
        headers: {},
        body: { email: 'user1@test.com' }
      })
      const req2 = global.testUtils.mockRequest({
        ip: '127.0.0.1',
        originalUrl: '/api/test',
        headers: {},
        body: { email: 'user2@test.com' }
      })

      const res = global.testUtils.mockResponse()
      res.set = jest.fn()
      const next = global.testUtils.mockNext()

      // Different emails should have separate limits
      await limiter(req1, res, next)
      await limiter(req2, res, next)

      expect(next).toHaveBeenCalledTimes(2)
    })

    it('should handle x-forwarded-for header', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2
      })

      const req = global.testUtils.mockRequest({
        ip: '127.0.0.1',
        originalUrl: '/api/test',
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }
      })
      const res = global.testUtils.mockResponse()
      res.set = jest.fn()
      const next = global.testUtils.mockNext()

      await limiter(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('should not send headers when headers option is false', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        headers: false
      })

      const req = global.testUtils.mockRequest({
        ip: '127.0.0.1',
        originalUrl: '/api/test',
        headers: {}
      })
      const res = global.testUtils.mockResponse()
      res.set = jest.fn()
      const next = global.testUtils.mockNext()

      await limiter(req, res, next)

      expect(res.set).not.toHaveBeenCalled()
    })
  })

  describe('Failed Login Tracking', () => {
    beforeEach(async () => {
      await clearFailedLogins('test@example.com')
    })

    it('should track failed login attempts', async () => {
      const result = await recordFailedLogin('test@example.com')

      expect(result.isLocked).toBe(false)
      expect(result.remainingAttempts).toBe(4)
      expect(result.totalAttempts).toBe(1)
    })

    it('should lock account after 5 failed attempts', async () => {
      // Record 5 failed attempts (sequential by design)
      // eslint-disable-next-line no-await-in-loop
      for (let i = 0; i < 4; i++) {
        await recordFailedLogin('test@example.com')
      }

      const result = await recordFailedLogin('test@example.com')

      expect(result.isLocked).toBe(true)
      expect(result.remainingAttempts).toBe(0)
      expect(result.lockoutMinutes).toBe(30)
    })

    it('should return locked status for already locked account', async () => {
      // Lock the account (sequential by design)
      // eslint-disable-next-line no-await-in-loop
      for (let i = 0; i < 5; i++) {
        await recordFailedLogin('test@example.com')
      }

      // Try again - should still be locked
      const result = await recordFailedLogin('test@example.com')

      expect(result.isLocked).toBe(true)
    })

    it('should check lockout status', async () => {
      // Not locked initially
      let status = await checkLoginLockout('test@example.com')
      expect(status.isLocked).toBe(false)

      // Lock the account (sequential by design)
      // eslint-disable-next-line no-await-in-loop
      for (let i = 0; i < 5; i++) {
        await recordFailedLogin('test@example.com')
      }

      // Now locked
      status = await checkLoginLockout('test@example.com')
      expect(status.isLocked).toBe(true)
      expect(status.lockoutMinutes).toBeGreaterThan(0)
    })

    it('should clear failed logins after successful login', async () => {
      // Record some failed attempts
      await recordFailedLogin('test@example.com')
      await recordFailedLogin('test@example.com')

      // Clear on successful login
      await clearFailedLogins('test@example.com')

      // Check - should be reset
      const status = await checkLoginLockout('test@example.com')
      expect(status.isLocked).toBe(false)
    })

    it('should return statistics', () => {
      const stats = getFailedLoginStats()

      expect(stats).toHaveProperty('totalEntries')
      expect(stats).toHaveProperty('lockedAccounts')
      expect(stats).toHaveProperty('storeSize')
      expect(stats).toHaveProperty('usingRedis')
    })

    it('should handle case-insensitive emails', async () => {
      await recordFailedLogin('Test@Example.com')
      await recordFailedLogin('TEST@EXAMPLE.COM')
      await recordFailedLogin('test@example.com')

      const status = await checkLoginLockout('TEST@example.COM')
      expect(status.isLocked).toBe(false) // Only 3 attempts, need 5 to lock
    })
  })
})
