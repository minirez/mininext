import mongoose from 'mongoose'
import logger from '#core/logger.js'

const DEFAULT_URI = 'mongodb://85.31.238.34:27017/webv2'

let connection = null

/**
 * Create or return cached legacy DB connection
 * @param {string} [uri] - MongoDB URI (default: webv2)
 * @returns {Promise<mongoose.Connection>}
 */
export async function createLegacyConnection(uri = DEFAULT_URI) {
  if (connection && connection.readyState === 1) {
    return connection
  }

  // Close stale connection if exists
  if (connection) {
    try {
      await connection.close()
    } catch {}
    connection = null
  }

  connection = mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 30000,
    maxPoolSize: 5
  })

  connection.on('connected', () => {
    logger.info(`[Migration] Legacy DB connected: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`)
  })

  connection.on('error', err => {
    logger.error('[Migration] Legacy DB error:', err.message)
  })

  // Wait for connection to be ready
  await connection.asPromise()

  return connection
}

/**
 * Get existing legacy connection (null if not connected)
 */
export function getLegacyConnection() {
  if (connection && connection.readyState === 1) {
    return connection
  }
  return null
}

/**
 * Disconnect legacy DB
 */
export async function disconnectLegacy() {
  if (connection) {
    try {
      await connection.close()
      logger.info('[Migration] Legacy DB disconnected')
    } catch (err) {
      logger.error('[Migration] Legacy DB disconnect error:', err.message)
    }
    connection = null
  }
}

/**
 * Get connection status
 */
export function getLegacyStatus() {
  if (!connection) return { connected: false, state: 'disconnected' }

  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }

  return {
    connected: connection.readyState === 1,
    state: stateMap[connection.readyState] || 'unknown',
    host: connection.host,
    name: connection.name
  }
}
