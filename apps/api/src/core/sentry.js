import * as Sentry from '@sentry/node'
import config from '#config'

const SENTRY_DSN = process.env.SENTRY_DSN || ''

/**
 * Initialize Sentry error tracking
 * Only active when SENTRY_DSN is configured
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: config.env,
    release: `booking-engine-api@${process.env.npm_package_version || '1.0.0'}`,

    // Performance: sample 10% in production, 100% in dev
    tracesSampleRate: config.isDev ? 1.0 : 0.1,

    // Don't send PII by default
    sendDefaultPii: false,

    // Filter out noisy/expected errors
    beforeSend(event, hint) {
      const error = hint?.originalException

      // Skip expected 4xx errors (client errors)
      if (error?.statusCode && error.statusCode < 500) {
        return null
      }

      // Skip JWT token expired (expected in normal flow)
      if (error?.name === 'TokenExpiredError') {
        return null
      }

      return event
    },

    // Ignore specific transaction URLs
    ignoreTransactions: ['/health', '/api'],

    integrations: [
      // Capture unhandled promise rejections
      Sentry.onUnhandledRejectionIntegration({ mode: 'warn' })
    ]
  })
}

/**
 * Capture an exception in Sentry with optional context
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 * @param {Object} context.user - User info { id, email, accountType }
 * @param {Object} context.tags - Custom tags
 * @param {Object} context.extra - Extra data
 */
export function captureException(error, context = {}) {
  if (!SENTRY_DSN) return

  Sentry.withScope(scope => {
    if (context.user) {
      scope.setUser(context.user)
    }

    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })
    }

    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
    }

    if (context.level) {
      scope.setLevel(context.level)
    }

    Sentry.captureException(error)
  })
}

/**
 * Express error handler middleware for Sentry
 * Should be added BEFORE the main error handler
 */
export function sentryErrorHandler() {
  if (!SENTRY_DSN) {
    return (_err, _req, _res, next) => next(_err)
  }

  return (err, req, res, next) => {
    // Only capture 5xx errors
    const statusCode = err.statusCode || 500
    if (statusCode >= 500) {
      Sentry.withScope(scope => {
        // Add request context
        scope.setTag('method', req.method)
        scope.setTag('url', req.originalUrl)
        scope.setTag('statusCode', statusCode)

        // Add user context if authenticated
        if (req.user) {
          scope.setUser({
            id: req.user._id?.toString(),
            email: req.user.email,
            accountType: req.user.accountType
          })
        }

        // Add request data
        scope.setExtra('query', req.query)
        scope.setExtra('ip', req.ip)
        scope.setExtra('userAgent', req.get('User-Agent'))

        // Add request ID for tracing
        if (req.id) {
          scope.setTag('requestId', req.id)
        }

        // Don't include body for sensitive routes
        const sensitiveRoutes = [
          '/api/auth/login',
          '/api/auth/register',
          '/api/auth/reset-password',
          '/api/payments',
          '/api/pay',
          '/api/public/payment',
          '/api/bookings'
        ]
        if (!sensitiveRoutes.some(r => req.originalUrl.startsWith(r))) {
          // Sanitize body - remove potential sensitive fields
          const sanitizedBody = req.body ? { ...req.body } : undefined
          if (sanitizedBody) {
            delete sanitizedBody.password
            delete sanitizedBody.cardNumber
            delete sanitizedBody.cvv
            delete sanitizedBody.token
            delete sanitizedBody.refreshToken
          }
          scope.setExtra('body', sanitizedBody)
        }

        Sentry.captureException(err)
      })
    }

    next(err)
  }
}

export { Sentry }
