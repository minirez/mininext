/**
 * Payment Service Configuration
 * Handles environment-specific settings with automatic detection
 */

const PORT = process.env.PORT || 7043;

/**
 * Check if running in development mode
 * Must be a function to read env AFTER dotenv loads
 */
function isDev() {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Get the callback base URL for 3D Secure forms
 * In development: uses localhost with the current port
 * In production: uses CALLBACK_BASE_URL env variable
 */
function getCallbackBaseUrl() {
  // In production, use CALLBACK_BASE_URL or default to payment.minires.com
  if (!isDev()) {
    return process.env.CALLBACK_BASE_URL || 'https://payment.minires.com';
  }

  // In development, always use localhost
  return `http://localhost:${PORT}`;
}

/**
 * Get the frontend URL for redirects after payment
 * In development: uses localhost:5173 (Vite dev server)
 * In production: uses FRONTEND_URL env variable
 */
function getFrontendUrl() {
  // In production, use FRONTEND_URL or default
  if (!isDev()) {
    return process.env.FRONTEND_URL || 'https://app.minires.com';
  }

  return 'http://localhost:5173';
}

const config = {
  port: PORT,
  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  },
  get isDevelopment() {
    return isDev();
  },
  get isProduction() {
    return process.env.NODE_ENV === 'production';
  },

  // MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/payment',

  // JWT
  jwtSecret: process.env.JWT_SECRET,

  // URLs - these are getter functions for dynamic resolution
  get callbackBaseUrl() {
    return getCallbackBaseUrl();
  },

  get frontendUrl() {
    return getFrontendUrl();
  },

  // Server info
  serviceName: process.env.SERVICE_NAME || 'payment-service',
  serverPublicIp: process.env.SERVER_PUBLIC_IP || null
};

export default config;
export { getCallbackBaseUrl, getFrontendUrl };
