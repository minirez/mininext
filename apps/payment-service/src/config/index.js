/**
 * Payment Service Configuration
 * Handles environment-specific settings with automatic detection
 */

const PORT = process.env.PORT || 7043;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV !== 'production';

/**
 * Get the callback base URL for 3D Secure forms
 * In development: uses localhost with the current port
 * In production: uses CALLBACK_BASE_URL env variable
 */
function getCallbackBaseUrl() {
  // If explicitly set, use that (for production or custom setups)
  if (process.env.CALLBACK_BASE_URL) {
    // But in development, prefer localhost even if CALLBACK_BASE_URL is set
    if (isDevelopment) {
      return `http://localhost:${PORT}`;
    }
    return process.env.CALLBACK_BASE_URL;
  }

  // Default to localhost for development
  return `http://localhost:${PORT}`;
}

/**
 * Get the frontend URL for redirects after payment
 * In development: uses localhost:5173 (Vite dev server)
 * In production: uses FRONTEND_URL env variable
 */
function getFrontendUrl() {
  if (process.env.FRONTEND_URL) {
    if (isDevelopment) {
      return 'http://localhost:5173';
    }
    return process.env.FRONTEND_URL;
  }

  return 'http://localhost:5173';
}

const config = {
  port: PORT,
  nodeEnv: NODE_ENV,
  isDevelopment,
  isProduction: NODE_ENV === 'production',

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
