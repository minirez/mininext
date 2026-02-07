/**
 * @module tests/setup
 * @description Global test setup for Vitest.
 * Sets up environment variables and cleanup hooks.
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest'

// ── Environment variables for test context ──────────────────────────────────
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long-for-tests'
process.env.JWT_ACCESS_EXPIRE = '15m'
process.env.JWT_REFRESH_EXPIRE = '7d'
process.env.MONGODB_URI = 'mongodb://localhost:27017/booking-engine-test'
process.env.PORT = '4001'
process.env.REDIS_ENABLED = 'false'
process.env.FRONTEND_URL = 'http://localhost:5173'

// ── Global mocks ────────────────────────────────────────────────────────────

// Mock logger to suppress output during tests
vi.mock('#core/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn()
  }
}))

// ── Lifecycle hooks ─────────────────────────────────────────────────────────

beforeAll(() => {
  // Any global test initialization
})

afterEach(() => {
  // Clear all mocks between tests to prevent leakage
  vi.clearAllMocks()
})

afterAll(() => {
  // Restore all mocks after all tests complete
  vi.restoreAllMocks()
})
