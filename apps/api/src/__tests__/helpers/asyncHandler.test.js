/**
 * asyncHandler Tests
 * Test async error handling wrapper
 */

import { describe, it, expect, jest } from '@jest/globals'
import { asyncHandler } from '../../helpers/asyncHandler.js'

describe('asyncHandler', () => {
  it('should call the handler function with req, res, next', async () => {
    const handler = jest.fn().mockResolvedValue('result')
    const wrappedHandler = asyncHandler(handler)

    const req = { body: {} }
    const res = { json: jest.fn() }
    const next = jest.fn()

    await wrappedHandler(req, res, next)

    expect(handler).toHaveBeenCalledWith(req, res, next)
  })

  it('should call next with error when handler throws', async () => {
    const error = new Error('Test error')
    const handler = jest.fn().mockRejectedValue(error)
    const wrappedHandler = asyncHandler(handler)

    const req = {}
    const res = {}
    const next = jest.fn()

    await wrappedHandler(req, res, next)
    // Flush microtasks: asyncHandler doesn't return the promise chain,
    // so .catch(next) resolves as a microtask after the await
    await Promise.resolve()

    expect(next).toHaveBeenCalledWith(error)
  })

  it('should not call next when handler succeeds', async () => {
    const handler = jest.fn().mockResolvedValue('success')
    const wrappedHandler = asyncHandler(handler)

    const req = {}
    const res = {}
    const next = jest.fn()

    await wrappedHandler(req, res, next)

    expect(next).not.toHaveBeenCalled()
  })
})
