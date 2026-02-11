import dotenv from 'dotenv'

// Load environment variables
// Try environment-specific file first, then fallback to .env
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'

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

  // CORS - Use CORS_ORIGIN env variable in all environments
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || [
      'http://localhost:3000',
      'http://localhost:5173'
    ]
  },

  // Frontend/Admin URL - Used for password reset links, activation emails etc.
  // IMPORTANT: Must be set in production!
  frontendUrl: process.env.FRONTEND_URL || process.env.ADMIN_URL || 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || process.env.API_BASE_URL || 'http://localhost:4000',

  // AWS - fromEmail/fromName are stored in database (PlatformSettings)
  aws: {
    ses: {
      region: process.env.AWS_SES_REGION || 'eu-west-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      configurationSetName: process.env.AWS_SES_CONFIGURATION_SET || ''
    }
  },

  // Redis - Used for distributed rate limiting and caching
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'booking:'
  },

  // Encryption - Used for sensitive data encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY
  },

  // External APIs
  gemini: {
    apiKey: process.env.GEMINI_API_KEY
  },

  firecrawl: {
    apiKey: process.env.FIRECRAWL_API_KEY
  },

  // SSL/Nginx Configuration
  ssl: {
    serverPublicIp: process.env.SERVER_PUBLIC_IP,
    certbotEmail: process.env.CERTBOT_EMAIL || 'admin@maxirez.com',
    certbotWebroot: process.env.CERTBOT_WEBROOT || '/var/www/certbot',
    nginxSitesAvailable: process.env.NGINX_SITES_AVAILABLE || '/etc/nginx/sites-available',
    nginxSitesEnabled: process.env.NGINX_SITES_ENABLED || '/etc/nginx/sites-enabled',
    frontendPorts: {
      b2c: parseInt(process.env.B2C_FRONTEND_PORT) || 3000,
      b2b: parseInt(process.env.B2B_FRONTEND_PORT) || 3001,
      pms: parseInt(process.env.PMS_FRONTEND_PORT) || 3002
    },
    apiBackend: process.env.API_BACKEND_URL || 'http://localhost:4000'
  },

  // Storefront API Key - For server-to-server auth from storefront frontends (site3 etc.)
  storefrontApiKey: process.env.STOREFRONT_API_KEY || ''
}

// Validation
if (!config.jwt.secret) {
  throw new Error('JWT_SECRET is required in environment variables')
}

// Security warnings
const insecureSecrets = [
  'your-super-secret-jwt-key-change-this-in-production',
  'secret',
  'jwt-secret',
  'change-me',
  'development-secret'
]

if (insecureSecrets.includes(config.jwt.secret.toLowerCase())) {
  if (config.env === 'production') {
    throw new Error('SECURITY ERROR: Using insecure JWT_SECRET in production!')
  } else {
    console.warn('⚠️  WARNING: Using placeholder JWT_SECRET. Change this before production!')
  }
}

if (config.jwt.secret.length < 32) {
  console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters for security')
}

export default config
