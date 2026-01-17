/**
 * Payment Service
 * Virtual POS payment processing
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env from payment-service directory
const __filename_env = fileURLToPath(import.meta.url);
const __dirname_env = path.dirname(__filename_env);
dotenv.config({ path: path.join(__dirname_env, '../.env') });

import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import { connectDB } from './config/database.js';
import config from './config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
import { simpleApiKeyAuth } from './middleware/simpleApiKeyAuth.js';
import { gatewayAuth, optionalGatewayAuth } from './middleware/gatewayAuth.js';
import { simpleJwtAuth } from './middleware/jwtAuth.js';

// Routes
import companyRoutes from './routes/company.routes.js';
import posRoutes from './routes/pos.routes.js';
import paymentRoutes, { publicPaymentRoutes } from './routes/payment.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import binRoutes from './routes/bin.routes.js';
import partnerCommissionRoutes from './routes/partnerCommission.routes.js';
import paymentLinkRoutes from './routes/paymentLink.routes.js';

const app = express();
const PORT = process.env.PORT || 7043;
const SERVICE_NAME = process.env.SERVICE_NAME || 'payment-service';

// CORS configuration - parse comma-separated origins
let allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['*'];

// In development, always allow localhost origins
if (process.env.NODE_ENV !== 'production') {
  const devOrigins = [
    'http://localhost:5173',
    'http://localhost:4000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4000'
  ];
  allowedOrigins = [...new Set([...allowedOrigins, ...devOrigins])];
}

// Custom CORS middleware that allows all origins for public payment routes
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Public routes - allow all origins (bank 3D callbacks, payment links)
  const isPublicRoute = req.path.startsWith('/payment') || req.path.startsWith('/pay-link');

  if (isPublicRoute) {
    // Allow any origin for public payment routes
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    return next();
  }

  // For other routes, use standard CORS
  cors({
    origin: (reqOrigin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!reqOrigin) return callback(null, true);

      // Check if origin is allowed
      if (allowedOrigins.includes('*') || allowedOrigins.includes(reqOrigin)) {
        return callback(null, reqOrigin);
      }

      callback(new Error('CORS not allowed'));
    },
    credentials: true
  })(req, res, next);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || `pay-${Date.now()}`;
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Request logging
app.use((req, res, next) => {
  if (req.path === '/health') return next();

  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      service: SERVICE_NAME,
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    }));
  });

  next();
});

// ============================================================================
// HEALTH CHECK (public)
// ============================================================================

app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    service: SERVICE_NAME,
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };

  res.json(health);
});

// Server info endpoint (for getting server IP, callback URLs, etc.)
app.get('/info', async (req, res) => {
  const os = await import('os');

  // Get server IP - prefer env var, fallback to network interface detection
  let serverIp = process.env.SERVER_PUBLIC_IP || null;

  if (!serverIp) {
    // Try to detect from network interfaces (non-internal IPv4)
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          serverIp = iface.address;
          break;
        }
      }
      if (serverIp) break;
    }
  }

  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    serverIp: serverIp || 'unknown',
    callbackBaseUrl: config.callbackBaseUrl,
    port: PORT
  });
});

// ============================================================================
// PUBLIC ROUTES (no auth - called by browser/bank for 3D callbacks)
// ============================================================================

// Allow iframe embedding for payment routes (bank 3D Secure forms)
app.use('/payment', (req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  next();
});

app.use('/payment', publicPaymentRoutes);

// Payment Link routes (public customer-facing pages)
app.use('/pay-link', (req, res, next) => {
  // Allow iframe embedding and CORS for payment link pages
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  next();
});
app.use('/pay-link', paymentLinkRoutes);

// ============================================================================
// API ROUTES (protected by JWT or API Key)
// ============================================================================

// Flexible auth middleware - JWT (admin panel) veya API Key (gateway/external)
app.use('/api', (req, res, next) => {
  // JWT Bearer token varsa onu kullan
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return simpleJwtAuth(req, res, next);
  }

  // API Key varsa gateway auth kullan
  if (req.headers['x-api-key']) {
    return simpleApiKeyAuth()(req, res, (err) => {
      if (err) return next(err);
      gatewayAuth(req, res, next);
    });
  }

  // Hiçbiri yoksa 401
  return res.status(401).json({
    status: false,
    error: 'Authentication required (Bearer token or API Key)'
  });
});

// Company management - DEPRECATED (use partnerId on POS instead)
// Kept for backward compatibility, will be removed
app.use('/api/companies', companyRoutes);

// POS management
app.use('/api/pos', posRoutes);

// BIN management
app.use('/api/bins', binRoutes);

// Partner commission management
app.use('/api/partner-commissions', partnerCommissionRoutes);

// Transaction history (MUST be before paymentRoutes due to /:id catch-all)
app.use('/api/transactions', transactionRoutes);

// Payment processing - mounted at /api since gateway strips /payment prefix
// Gateway: /api/payment/pay → Service: /api/pay
// NOTE: This has /:id route that catches everything, so it must be LAST
app.use('/api', paymentRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: false,
    error: `Route not found: ${req.method} ${req.path}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(err.status || 500).json({
    status: false,
    error: err.message || 'Internal Server Error'
  });
});

// ============================================================================
// STARTUP
// ============================================================================

async function start() {
  try {
    await connectDB();
    console.log('MongoDB connected');

    // Check for SSL certificates
    const certPath = path.join(__dirname, '../certs/cert.pem');
    const keyPath = path.join(__dirname, '../certs/key.pem');
    const useHttps = fs.existsSync(certPath) && fs.existsSync(keyPath);

    if (useHttps) {
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };

      https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   Payment Service (HTTPS)                     ║
║   ───────────────────────────                     ║
║                                                   ║
║   Server running on https://localhost:${PORT}      ║
║                                                   ║
║   Endpoints:                                      ║
║   • GET  /api/companies     - Company management  ║
║   • GET  /api/pos           - POS management      ║
║   • POST /api/payment/pay   - Process payment     ║
║   • GET  /api/transactions  - Transaction history ║
║   • GET  /health            - Health check        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
        `);
      });
    } else {
      app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   Payment Service (HTTP)                      ║
║   ──────────────────────────                      ║
║                                                   ║
║   Server running on http://localhost:${PORT}       ║
║                                                   ║
║   Endpoints:                                      ║
║   • GET  /api/companies     - Company management  ║
║   • GET  /api/pos           - POS management      ║
║   • POST /api/payment/pay   - Process payment     ║
║   • GET  /api/transactions  - Transaction history ║
║   • GET  /health            - Health check        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
        `);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
