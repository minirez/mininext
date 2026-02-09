/**
 * CSRF Protection Middleware
 *
 * Bu middleware, state-changing isteklerde (POST, PUT, DELETE, PATCH)
 * X-Requested-With header'ı kontrolü yapar.
 *
 * Bu yaklaşım JWT Bearer token kullanan API'ler için uygundur çünkü:
 * 1. Tarayıcılar cross-origin isteklerde custom header'ları otomatik göndermez
 * 2. Preflight (OPTIONS) isteği gerektirir, bu da CSRF saldırılarını engeller
 * 3. Frontend her state-changing istekte header eklemek zorundadır
 *
 * Not: Bu middleware public API endpoint'lerinde kullanılmamalıdır.
 */

import { ForbiddenError } from '#core/errors.js'

/**
 * CSRF koruması gerektirmeyen path'ler
 */
const EXEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
  '/api/public',
  '/api/docs',
  '/api/exchange',
  '/api/mailbox',
  '/health'
]

/**
 * Path'in muaf olup olmadığını kontrol et
 */
const isExemptPath = path => {
  return EXEMPT_PATHS.some(exempt => path.startsWith(exempt))
}

/**
 * CSRF Protection Middleware
 * State-changing methods için X-Requested-With header kontrolü yapar
 */
export const csrfProtection = (req, res, next) => {
  // Safe methods için kontrol gereksiz
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) {
    return next()
  }

  // Exempt path'ler için bypass
  if (isExemptPath(req.path)) {
    return next()
  }

  // X-Requested-With header kontrolü
  const xRequestedWith = req.headers['x-requested-with']

  // XMLHttpRequest veya fetch için standart değer
  if (xRequestedWith && xRequestedWith.toLowerCase() === 'xmlhttprequest') {
    return next()
  }

  // Alternatif: X-CSRF-Token header kontrolü (frontend'den gönderilirse)
  const csrfToken = req.headers['x-csrf-token']
  if (csrfToken) {
    return next()
  }

  // Content-Type kontrolü - sadece JSON isteklerine izin ver (form submit'leri engeller)
  const contentType = req.headers['content-type']
  if (contentType && contentType.includes('application/json')) {
    // JSON content-type ile gelen isteklere izin ver
    // Form-based CSRF saldırıları genellikle application/x-www-form-urlencoded kullanır
    return next()
  }

  // CSRF koruması başarısız
  throw new ForbiddenError('CSRF_VALIDATION_FAILED', {
    message: 'Missing or invalid CSRF protection header',
    requiredHeaders: ['X-Requested-With: XMLHttpRequest', 'Content-Type: application/json']
  })
}

/**
 * Strict CSRF - Sadece X-Requested-With header'ı gerektirir
 * Daha hassas endpoint'ler için kullanılabilir
 */
export const strictCsrfProtection = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) {
    return next()
  }

  const xRequestedWith = req.headers['x-requested-with']
  if (!xRequestedWith || xRequestedWith.toLowerCase() !== 'xmlhttprequest') {
    throw new ForbiddenError('CSRF_VALIDATION_FAILED', {
      message: 'X-Requested-With header required for this endpoint'
    })
  }

  next()
}

export default csrfProtection
