import winston from 'winston'
import config from '../config/index.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { combine, timestamp, printf, colorize, json, errors } = winston.format

// Custom format for console (human-readable)
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`

  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    // Remove stack from inline display (shown separately)
    const { stack, ...rest } = metadata
    if (Object.keys(rest).length > 0) {
      msg += ` ${JSON.stringify(rest)}`
    }
    if (stack) {
      msg += `\n${stack}`
    }
  }

  return msg
})

// JSON format for file logging
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
)

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs')

// Create logger
const logger = winston.createLogger({
  level: config.isDev ? 'debug' : 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true })),
  defaultMeta: {
    service: 'booking-engine-api'
  },
  transports: [
    // Console output (colorized, human-readable)
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), consoleFormat)
    })
  ]
})

// Add file transports in production
if (!config.isDev) {
  // Error log file
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  )

  // Combined log file
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  )
}

/**
 * Log an error with context
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or metadata
 * @param {Object} context - Additional context
 */
export function logError(message, error, context = {}) {
  const meta = {
    ...context,
    timestamp: new Date().toISOString()
  }

  if (error instanceof Error) {
    meta.errorName = error.name
    meta.errorMessage = error.message
    meta.stack = error.stack
    if (error.code) meta.errorCode = error.code
  } else if (typeof error === 'object') {
    Object.assign(meta, error)
  }

  logger.error(message, meta)
}

/**
 * Log a warning with context
 * @param {string} message - Warning message
 * @param {Object} context - Additional context
 */
export function logWarning(message, context = {}) {
  logger.warn(message, context)
}

/**
 * Log an info message with context
 * @param {string} message - Info message
 * @param {Object} context - Additional context
 */
export function logInfo(message, context = {}) {
  logger.info(message, context)
}

/**
 * Log a debug message
 * @param {string} message - Debug message
 * @param {Object} context - Additional context
 */
export function logDebug(message, context = {}) {
  logger.debug(message, context)
}

/**
 * Log an API request
 * @param {Object} req - Express request
 * @param {Object} options - Additional options
 */
export function logRequest(req, options = {}) {
  const { duration, statusCode, error } = options

  const meta = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode,
    duration: duration ? `${duration}ms` : undefined,
    userId: req.user?._id,
    partnerId: req.user?.accountType === 'partner' ? req.user?.accountId : req.partnerId
  }

  if (error) {
    meta.error = error.message || error
    logger.error(`${req.method} ${req.originalUrl}`, meta)
  } else {
    logger.info(`${req.method} ${req.originalUrl}`, meta)
  }
}

/**
 * Log a pricing operation
 * @param {string} operation - Operation name
 * @param {Object} data - Operation data
 */
export function logPricingOperation(operation, data = {}) {
  logger.info(`Pricing: ${operation}`, {
    operation,
    ...data
  })
}

/**
 * Log a security event
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export function logSecurityEvent(event, data = {}) {
  logger.warn(`Security: ${event}`, {
    type: 'security',
    event,
    ...data
  })
}

/**
 * Log a performance metric
 * @param {string} operation - Operation name
 * @param {number} duration - Duration in ms
 * @param {Object} metadata - Additional metadata
 */
export function logPerformance(operation, duration, metadata = {}) {
  const level = duration > 1000 ? 'warn' : 'debug'
  logger[level](`Performance: ${operation}`, {
    type: 'performance',
    operation,
    duration: `${duration}ms`,
    slow: duration > 1000,
    ...metadata
  })
}

/**
 * Create a child logger with additional context
 * @param {Object} context - Context to add to all logs
 * @returns {Object} Child logger
 */
export function createChildLogger(context = {}) {
  return logger.child(context)
}

export default logger
