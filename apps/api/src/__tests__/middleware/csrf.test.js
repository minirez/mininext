/**
 * CSRF Protection Middleware Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { csrfProtection, strictCsrfProtection } from '../../middleware/csrf.js'
import { ForbiddenError } from '../../core/errors.js'

describe('CSRF Protection Middleware', () => {
  let mockReq, mockRes, mockNext

  beforeEach(() => {
    mockReq = {
      method: 'POST',
      path: '/api/bookings',
      headers: {}
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    mockNext = jest.fn()
  })

  describe('csrfProtection', () => {
    describe('Safe Methods', () => {
      it('should allow GET requests without any headers', () => {
        mockReq.method = 'GET'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should allow HEAD requests without any headers', () => {
        mockReq.method = 'HEAD'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should allow OPTIONS requests without any headers', () => {
        mockReq.method = 'OPTIONS'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })
    })

    describe('Exempt Paths', () => {
      it('should allow POST to /api/auth/login', () => {
        mockReq.path = '/api/auth/login'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should allow POST to /api/auth/register', () => {
        mockReq.path = '/api/auth/register'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should allow POST to /api/auth/forgot-password', () => {
        mockReq.path = '/api/auth/forgot-password'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should allow POST to /api/public/*', () => {
        mockReq.path = '/api/public/hotels'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should allow requests to /health', () => {
        mockReq.path = '/health'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })
    })

    describe('X-Requested-With Header', () => {
      it('should allow POST with X-Requested-With: XMLHttpRequest', () => {
        mockReq.headers['x-requested-with'] = 'XMLHttpRequest'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should allow POST with lowercase x-requested-with header', () => {
        mockReq.headers['x-requested-with'] = 'xmlhttprequest'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should allow DELETE with X-Requested-With header', () => {
        mockReq.method = 'DELETE'
        mockReq.headers['x-requested-with'] = 'XMLHttpRequest'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should allow PUT with X-Requested-With header', () => {
        mockReq.method = 'PUT'
        mockReq.headers['x-requested-with'] = 'XMLHttpRequest'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should allow PATCH with X-Requested-With header', () => {
        mockReq.method = 'PATCH'
        mockReq.headers['x-requested-with'] = 'XMLHttpRequest'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })
    })

    describe('X-CSRF-Token Header', () => {
      it('should allow POST with X-CSRF-Token header', () => {
        mockReq.headers['x-csrf-token'] = 'some-token'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })
    })

    describe('Content-Type: application/json', () => {
      it('should allow POST with application/json content-type', () => {
        mockReq.headers['content-type'] = 'application/json'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should allow POST with application/json; charset=utf-8', () => {
        mockReq.headers['content-type'] = 'application/json; charset=utf-8'

        csrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })
    })

    describe('CSRF Rejection', () => {
      it('should reject POST without any CSRF headers', () => {
        mockReq.method = 'POST'

        expect(() => {
          csrfProtection(mockReq, mockRes, mockNext)
        }).toThrow(ForbiddenError)
      })

      it('should reject DELETE without any CSRF headers', () => {
        mockReq.method = 'DELETE'

        expect(() => {
          csrfProtection(mockReq, mockRes, mockNext)
        }).toThrow(ForbiddenError)
      })

      it('should reject PUT without any CSRF headers', () => {
        mockReq.method = 'PUT'

        expect(() => {
          csrfProtection(mockReq, mockRes, mockNext)
        }).toThrow(ForbiddenError)
      })

      it('should reject PATCH without any CSRF headers', () => {
        mockReq.method = 'PATCH'

        expect(() => {
          csrfProtection(mockReq, mockRes, mockNext)
        }).toThrow(ForbiddenError)
      })

      it('should reject POST with form-urlencoded content-type', () => {
        mockReq.headers['content-type'] = 'application/x-www-form-urlencoded'

        expect(() => {
          csrfProtection(mockReq, mockRes, mockNext)
        }).toThrow(ForbiddenError)
      })

      it('should reject POST with invalid X-Requested-With value', () => {
        mockReq.headers['x-requested-with'] = 'InvalidValue'

        expect(() => {
          csrfProtection(mockReq, mockRes, mockNext)
        }).toThrow(ForbiddenError)
      })

      it('should throw ForbiddenError with correct error code', () => {
        try {
          csrfProtection(mockReq, mockRes, mockNext)
        } catch (error) {
          expect(error).toBeInstanceOf(ForbiddenError)
          expect(error.message).toBe('CSRF_VALIDATION_FAILED')
        }
      })
    })
  })

  describe('strictCsrfProtection', () => {
    describe('Safe Methods', () => {
      it('should allow GET requests', () => {
        mockReq.method = 'GET'

        strictCsrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })
    })

    describe('X-Requested-With Required', () => {
      it('should allow POST with X-Requested-With header', () => {
        mockReq.headers['x-requested-with'] = 'XMLHttpRequest'

        strictCsrfProtection(mockReq, mockRes, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should reject POST without X-Requested-With even with JSON content-type', () => {
        mockReq.headers['content-type'] = 'application/json'

        expect(() => {
          strictCsrfProtection(mockReq, mockRes, mockNext)
        }).toThrow(ForbiddenError)
      })

      it('should reject POST with X-CSRF-Token but no X-Requested-With', () => {
        mockReq.headers['x-csrf-token'] = 'token'

        expect(() => {
          strictCsrfProtection(mockReq, mockRes, mockNext)
        }).toThrow(ForbiddenError)
      })
    })
  })
})
