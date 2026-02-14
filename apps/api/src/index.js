import { createServer } from 'http'
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

// Graceful shutdown
const gracefulShutdown = async signal => {
  logger.info(`${signal} received, shutting down gracefully...`)

  // Stop exchange scheduler
  stopExchangeScheduler()

  // Stop channel manager scheduler
  stopChannelScheduler()

  // Close queue workers
  await closeQueues()

  // Close Redis connection
  await closeRedis()

  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
