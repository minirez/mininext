import { createServer } from 'http'
import { validateEnv } from './config/validateEnv.js'

// Validate environment variables before anything else
validateEnv()

import app from './app.js'
import config from './config/index.js'
import logger from './core/logger.js'
import { connectDB } from './core/mongoose.js'
import bootstrap from './core/bootstrap.js'
import { initSocket } from './core/socket.js'
import { initRedis, closeRedis } from './core/redis.js'
import { startExchangeScheduler, stopExchangeScheduler } from './services/exchangeScheduler.js'
import {
  startChannelScheduler,
  stopChannelScheduler
} from './modules/channel-manager/channelScheduler.js'
import { initWorkers } from './workers/index.js'
import { closeQueues } from './core/queue.js'
import { stopMetricsCollection } from './middleware/metrics.js'

// Connect to database
await connectDB()

// Initialize Redis (optional - for distributed rate limiting)
await initRedis()

// Run bootstrap (initial setup)
await bootstrap()

// Create HTTP server (for Socket.IO compatibility)
const httpServer = createServer(app)

// Initialize Socket.IO
initSocket(httpServer)

// Start server
const server = httpServer.listen(config.port, async () => {
  logger.info(`🚀 Server running in ${config.env} mode`)
  logger.info(`📡 Listening on port ${config.port}`)
  logger.info('🔌 Socket.IO enabled')
  logger.info('🌍 CORS enabled: dynamic origin validation (multi-tenant)')

  // Initialize BullMQ workers and scheduled jobs
  await initWorkers()
  logger.info('⚡ Queue workers initialized')

  // Start exchange rate scheduler (fallback for non-Redis environments)
  startExchangeScheduler()
  logger.info('💱 Exchange rate scheduler started')

  // Start channel manager scheduler (fallback for non-Redis environments)
  startChannelScheduler()
  logger.info('📡 Channel manager scheduler started')
})

// Graceful shutdown with timeout
let isShuttingDown = false

const gracefulShutdown = async signal => {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info(`${signal} received, shutting down gracefully...`)

  // Force exit after 30 seconds
  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 30s, forcing exit')
    process.exit(1)
  }, 30000)
  forceExitTimeout.unref()

  try {
    // Stop metrics collection
    stopMetricsCollection()

    // Stop exchange scheduler
    stopExchangeScheduler()

    // Stop channel manager scheduler
    stopChannelScheduler()

    // Close queue workers
    await closeQueues()

    // Close Redis connection
    await closeRedis()

    server.close(() => {
      clearTimeout(forceExitTimeout)
      logger.info('Server closed')
      process.exit(0)
    })
  } catch (err) {
    logger.error('Error during shutdown', { error: err.message })
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
