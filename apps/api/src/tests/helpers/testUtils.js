/**
 * @module tests/helpers/testUtils
 * @description Utility functions for writing backend tests.
 * Provides mock factories for users, partners, Express req/res objects, and Mongoose models.
 */

import { vi } from 'vitest'
import mongoose from 'mongoose'

// ── ID Generators ───────────────────────────────────────────────────────────

/**
 * Generate a valid MongoDB ObjectId string
 * @returns {string}
 */
export const generateObjectId = () => new mongoose.Types.ObjectId().toString()

// ── Mock Data Factories ─────────────────────────────────────────────────────

/**
 * Create a mock user object
 * @param {Object} [overrides={}] - Properties to override
 * @returns {Object} Mock user
 */
export const createTestUser = (overrides = {}) => ({
  _id: generateObjectId(),
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  isActive: true,
  partner: generateObjectId(),
  avatar: {
    url: '/uploads/avatars/test.png',
    filename: 'test.png',
    uploadedAt: new Date()
  },
  permissions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

/**
 * Create a mock partner object
 * @param {Object} [overrides={}] - Properties to override
 * @returns {Object} Mock partner
 */
export const createTestPartner = (overrides = {}) => ({
  _id: generateObjectId(),
  name: 'Test Partner',
  slug: 'test-partner',
  email: 'partner@example.com',
  phone: '+905551234567',
  isActive: true,
  subscription: {
    plan: 'pro',
    status: 'active',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  },
  branding: {
    primaryColor: '#6366f1',
    logo: null
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

/**
 * Create a mock tag object
 * @param {Object} [overrides={}] - Properties to override
 * @returns {Object} Mock tag
 */
export const createTestTag = (overrides = {}) => ({
  _id: generateObjectId(),
  name: {
    tr: 'Test Etiket',
    en: 'Test Tag',
    de: 'Test-Tag',
    fr: 'Etiquette Test',
    es: 'Etiqueta de Prueba',
    ru: '',
    el: '',
    it: '',
    ro: '',
    bg: '',
    pt: '',
    da: '',
    zh: '',
    ar: '',
    fa: '',
    he: '',
    sq: '',
    uk: '',
    pl: '',
    az: ''
  },
  slug: 'test-etiket',
  color: '#6366f1',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

// ── Express Mock Factories ──────────────────────────────────────────────────

/**
 * Create a mock Express request object
 * @param {Object} [overrides={}] - Properties to override (params, query, body, user, etc.)
 * @returns {Object} Mock Express request
 */
export const mockRequest = (overrides = {}) => {
  const req = {
    params: {},
    query: {},
    body: {},
    headers: {
      'user-agent': 'vitest',
      'content-type': 'application/json'
    },
    user: createTestUser(),
    ip: '127.0.0.1',
    method: 'GET',
    path: '/',
    get: vi.fn((header) => req.headers[header.toLowerCase()]),
    ...overrides
  }
  return req
}

/**
 * Create a mock Express response object with spy functions.
 * Supports chaining: res.status(200).json({...})
 * @returns {Object} Mock Express response with jest-compatible spies
 */
export const mockResponse = () => {
  const res = {
    statusCode: 200,
    _data: null,
    _headers: {}
  }

  res.status = vi.fn((code) => {
    res.statusCode = code
    return res
  })

  res.json = vi.fn((data) => {
    res._data = data
    return res
  })

  res.send = vi.fn((data) => {
    res._data = data
    return res
  })

  res.set = vi.fn((key, value) => {
    res._headers[key] = value
    return res
  })

  res.header = vi.fn((key, value) => {
    res._headers[key] = value
    return res
  })

  res.cookie = vi.fn(() => res)
  res.clearCookie = vi.fn(() => res)
  res.redirect = vi.fn()
  res.end = vi.fn()

  return res
}

/**
 * Create a mock Express next function
 * @returns {Function} Mock next function (vi.fn)
 */
export const mockNext = () => vi.fn()

// ── Mongoose Mock Helpers ───────────────────────────────────────────────────

/**
 * Create a mock Mongoose model with common static methods.
 * Each method returns a vi.fn() that can be configured per test.
 *
 * @param {string} modelName - Name for identification in error messages
 * @returns {Object} Mock model with find, findById, findOne, create, etc.
 */
export const createMockModel = (modelName = 'MockModel') => {
  const mockDoc = {
    save: vi.fn().mockResolvedValue(undefined),
    deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    toJSON: vi.fn(function () { return { ...this } }),
    toObject: vi.fn(function () { return { ...this } })
  }

  const model = vi.fn((data) => ({
    ...data,
    ...mockDoc,
    _id: data?._id || generateObjectId()
  }))

  // Static methods
  model.find = vi.fn().mockReturnValue({
    sort: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([]),
      skip: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([])
      }),
      exec: vi.fn().mockResolvedValue([])
    }),
    limit: vi.fn().mockResolvedValue([]),
    exec: vi.fn().mockResolvedValue([])
  })

  model.findById = vi.fn().mockResolvedValue(null)
  model.findOne = vi.fn().mockResolvedValue(null)
  model.findByIdAndUpdate = vi.fn().mockResolvedValue(null)
  model.findByIdAndDelete = vi.fn().mockResolvedValue(null)
  model.countDocuments = vi.fn().mockResolvedValue(0)
  model.create = vi.fn().mockResolvedValue(mockDoc)
  model.deleteMany = vi.fn().mockResolvedValue({ deletedCount: 0 })
  model.updateMany = vi.fn().mockResolvedValue({ modifiedCount: 0 })
  model.aggregate = vi.fn().mockResolvedValue([])

  model.modelName = modelName

  return model
}

/**
 * Helper to simulate an asyncHandler-wrapped service function call.
 * Since service functions are wrapped in asyncHandler(async (req, res) => ...),
 * this helper extracts the inner handler and calls it directly.
 *
 * @param {Function} handler - The asyncHandler-wrapped handler
 * @param {Object} req - Mock request
 * @param {Object} res - Mock response
 * @param {Function} [next] - Mock next function
 * @returns {Promise<void>}
 */
export const callHandler = async (handler, req, res, next) => {
  // asyncHandler returns (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
  // So we just call the wrapped function directly
  const nextFn = next || mockNext()
  try {
    await handler(req, res, nextFn)
  } catch (error) {
    // If the handler throws (not caught by asyncHandler in test context), pass to next
    nextFn(error)
  }
}
