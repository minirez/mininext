import dotenv from 'dotenv'

// Load environment variables
// Try environment-specific file first, then fallback to .env
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development'

dotenv.config({ path: envFile })
dotenv.config() // Fallback to .env if specific file doesn't have all vars

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Server
  port: parseInt(process.env.PORT) || 4000,

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpire: process.env.JWT_ACCESS_EXPIRE || '15m',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d'
  },

  // CORS - Allow all origins in development, use env in production
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
      : true  // Allow all origins in development
  },

  // AWS - fromEmail/fromName are stored in database (PlatformSettings)
  aws: {
    ses: {
      region: process.env.AWS_SES_REGION || 'eu-west-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  }
}

// Validation
if (!config.jwt.secret) {
  throw new Error('JWT_SECRET is required in environment variables')
}

export default config
