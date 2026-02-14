import { AppError } from '../core/errors.js'
import logger from '../core/logger.js'
import config from '../config/index.js'
import { captureException } from '../core/sentry.js'

export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500
  let message = err.message

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400
    const firstError = Object.values(err.errors)[0]
    message = req.t(firstError.message)
  }

  // Mongoose duplicate key error
  else if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyPattern)[0]
    message = req.t(`DUPLICATE_${field.toUpperCase()}`)
  }

  // Mongoose cast error
  else if (err.name === 'CastError') {
    statusCode = 400
    message = req.t('INVALID_ID')
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = req.t('INVALID_TOKEN')
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = req.t('TOKEN_EXPIRED')
  }

  // Translate message if it's an i18n key
  else if (err instanceof AppError) {
    message = req.t(message)
  }

  // Log and report 5xx errors
  if (statusCode >= 500) {
    logger.error(`${err.message}\n${err.stack}`)

    // Send to Sentry with request context
    captureException(err, {
      user: req.user
        ? {
            id: req.user._id?.toString(),
            email: req.user.email,
            accountType: req.user.accountType
          }
        : undefined,
      tags: {
        method: req.method,
        url: req.originalUrl
      },
      extra: {
        query: req.query,
        ip: req.ip
      }
    })
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(err.details && { details: err.details }),
    ...(config.isDev && { stack: err.stack })
  })
}

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: req.t('NOT_FOUND')
  })
}
