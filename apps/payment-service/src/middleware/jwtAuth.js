import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

/**
 * Simple JWT Auth - sadece token validate eder, DB lookup yapmaz
 * Booking-engine admin panelinden gelen istekler için
 */
export function simpleJwtAuth(req, res, next) {
  // JWT_SECRET'ı runtime'da al (dotenv yüklendikten sonra)
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: false, error: 'Token gerekli' });
    }

    const token = authHeader.split(' ')[1];

    // Debug log
    console.log('[JWT Auth] Secret length:', JWT_SECRET?.length);
    console.log('[JWT Auth] Token preview:', token?.substring(0, 50) + '...');

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('[JWT Auth] Decoded:', JSON.stringify(decoded));

    // Token'dan user bilgisini al (DB lookup yok)
    req.user = {
      _id: new mongoose.Types.ObjectId(decoded.userId || decoded.id || decoded._id),
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      partnerId: decoded.partnerId ? new mongoose.Types.ObjectId(decoded.partnerId) : null,
      isPlatformAdmin: decoded.role === 'platform_admin' || decoded.role === 'admin',
      fromToken: true
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: false, error: 'Token süresi dolmuş' });
    }
    return res.status(401).json({ status: false, error: 'Geçersiz token' });
  }
}

/**
 * Legacy jwtAuth - DB lookup yapar (payment-service internal users için)
 * @deprecated simpleJwtAuth kullanın
 */
export async function jwtAuth(req, res, next) {
  // simpleJwtAuth'a yönlendir
  return simpleJwtAuth(req, res, next);
}

// Only superadmin
export function superAdminOnly(req, res, next) {
  if (!req.user.isSuperAdmin()) {
    return res.status(403).json({ status: false, error: 'Yetkiniz yok' });
  }
  next();
}

// Admin or superadmin
export function adminOnly(req, res, next) {
  if (!['superadmin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ status: false, error: 'Yetkiniz yok' });
  }
  next();
}

// Generate JWT
export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}
