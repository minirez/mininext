import { createServer } from 'http'
import app from './app.js'
import config from './config/index.js'
import logger from './core/logger.js'
import { connectDB } from './core/mongoose.js'
import bootstrap from './core/bootstrap.js'
import { initSocket } from './core/socket.js'
import { initRedis, closeRedis } from './core/redis.js'
import { startExchangeScheduler, stopExchangeScheduler } from './services/exchangeScheduler.js'

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
const server = httpServer.listen(config.port, () => {
  logger.info(`🚀 Server running in ${config.env} mode`)
  logger.info(`📡 Listening on port ${config.port}`)
  logger.info('🔌 Socket.IO enabled')
  logger.info('🌍 CORS enabled: dynamic origin validation (multi-tenant)')

  // Start exchange rate scheduler
  startExchangeScheduler()
  logger.info('💱 Exchange rate scheduler started')
})

// Graceful shutdown
const gracefulShutdown = async signal => {
  logger.info(`${signal} received, shutting down gracefully...`)

  // Stop exchange scheduler
  stopExchangeScheduler()

  // Close Redis connection
  await closeRedis()

  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
