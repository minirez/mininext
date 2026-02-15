import mongoose from 'mongoose'
import config from '../config/index.js'
import logger from './logger.js'

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: 25,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    })

    logger.info(`MongoDB connected: ${mongoose.connection.host}`)
    logger.info(`Database: ${mongoose.connection.name}`)
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`)
    process.exit(1)
  }
}

// Connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

mongoose.connection.on('error', error => {
  logger.error(`MongoDB error: ${error.message}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close()
  logger.info('MongoDB connection closed')
  process.exit(0)
})

export default mongoose
