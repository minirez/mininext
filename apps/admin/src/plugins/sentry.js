import * as Sentry from '@sentry/vue'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || ''

/**
 * Initialize Sentry for Vue 3 app
 * @param {import('vue').App} app - Vue app instance
 * @param {import('vue-router').Router} router - Vue Router instance
 */
export function initSentry(app, router) {
  if (!SENTRY_DSN) {
    return
  }

  Sentry.init({
    app,
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: `booking-engine-admin@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.replayIntegration({
        // Capture 10% of sessions, 100% on error
        maskAllText: false,
        blockAllMedia: false
      })
    ],

    // Performance: sample 10% in production
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Session Replay: capture 0% normally, 100% on error
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    // Filter expected errors
    beforeSend(event, hint) {
      const error = hint?.originalException

      // Skip network errors (401, 403) - expected in auth flow
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return null
      }

      // Skip cancelled requests (user navigation)
      if (error?.code === 'ERR_CANCELED') {
        return null
      }

      return event
    },

    // Don't track these URLs
    denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i]
  })
}

/**
 * Set Sentry user context (call after login)
 * @param {Object} user - User object
 */
export function setSentryUser(user) {
  if (!SENTRY_DSN) return

  if (user) {
    Sentry.setUser({
      id: user._id,
      email: user.email,
      username: `${user.firstName} ${user.lastName}`,
      accountType: user.accountType
    })
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Capture a frontend exception with context
 * @param {Error} error
 * @param {Object} context
 */
export function captureException(error, context = {}) {
  if (!SENTRY_DSN) return

  Sentry.withScope(scope => {
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
    Sentry.captureException(error)
  })
}
