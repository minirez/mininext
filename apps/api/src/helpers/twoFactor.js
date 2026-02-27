import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'
import logger from '../core/logger.js'

// Track last used TOTP counter per user to prevent replay attacks
const lastUsedCounters = new Map()
// Clean up old entries every hour
setInterval(
  () => {
    const cutoff = Date.now() - 2 * 60 * 1000 // 2 minutes (one full TOTP window cycle)
    for (const [key, entry] of lastUsedCounters) {
      if (entry.timestamp < cutoff) lastUsedCounters.delete(key)
    }
  },
  60 * 60 * 1000
)

/**
 * Generate 2FA secret
 * @param {string} email - User email
 * @param {string} issuer - App name
 * @returns {Object} Secret and otpauth URL
 */
export const generate2FASecret = (email, issuer = 'Booking Engine') => {
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${email})`,
    issuer: issuer,
    length: 32
  })

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url
  }
}

/**
 * Generate QR code as Data URL
 * @param {string} otpauthUrl - OTP Auth URL
 * @returns {Promise<string>} QR code data URL
 */
export const generateQRCode = async otpauthUrl => {
  try {
    return await QRCode.toDataURL(otpauthUrl)
  } catch (error) {
    logger.error('Failed to generate QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Verify TOTP token
 * @param {string} token - 6-digit token from authenticator
 * @param {string} secret - User's 2FA secret
 * @param {number} window - Time window for validation (default: 1)
 * @returns {boolean} True if valid
 */
export const verify2FAToken = (token, secret, window = 1, userId = null) => {
  try {
    const result = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: window
    })

    if (!result) return false

    // Replay protection: prevent same TOTP code from being used twice
    if (userId) {
      const currentCounter = Math.floor(Date.now() / 30000) // 30-second TOTP period
      const key = `${userId}:${token}`
      const lastUsed = lastUsedCounters.get(key)

      if (lastUsed && lastUsed.counter === currentCounter) {
        logger.warn(`2FA replay attempt detected for user ${userId}`)
        return false
      }

      lastUsedCounters.set(key, { counter: currentCounter, timestamp: Date.now() })
    }

    return true
  } catch (error) {
    logger.error('Failed to verify 2FA token:', error)
    return false
  }
}

/**
 * Generate backup codes
 * @param {number} count - Number of backup codes to generate
 * @returns {string[]} Array of backup codes
 */
export const generateBackupCodes = (count = 10) => {
  const codes = []
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}

export default {
  generate2FASecret,
  generateQRCode,
  verify2FAToken,
  generateBackupCodes
}
