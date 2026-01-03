import mongoose from 'mongoose'
import crypto from 'crypto'
import Partner from '../modules/partner/partner.model.js'
import Agency from '../modules/agency/agency.model.js'
import User from '../modules/user/user.model.js'
import Hotel from '../modules/hotel/hotel.model.js'
import logger from './logger.js'

/**
 * Generate a secure random password
 */
function generateSecurePassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  const randomBytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length]
  }
  return password
}

/**
 * Clean up stale/obsolete indexes from collections
 */
async function cleanupStaleIndexes() {
  try {
    const hotelCollection = mongoose.connection.collection('hotels')
    const indexes = await hotelCollection.indexes()

    // Find and drop stale seo.slug index
    const staleIndex = indexes.find(idx => idx.name === 'partner_1_seo.slug_1')
    if (staleIndex) {
      await hotelCollection.dropIndex('partner_1_seo.slug_1')
      logger.info('✓ Dropped stale index: partner_1_seo.slug_1')
    }
  } catch (error) {
    // Ignore errors - collection might not exist yet
    if (!error.message.includes('ns not found')) {
      logger.warn(`Index cleanup warning: ${error.message}`)
    }
  }
}

export async function bootstrap() {
  try {
    logger.info('🔧 Running bootstrap...')

    // Clean up stale indexes
    await cleanupStaleIndexes()

    // Platform admin user kontrolü
    const platformAdmin = await User.findOne({
      accountType: 'platform',
      email: 'admin@platform.com'
    })

    if (!platformAdmin) {
      logger.info('Creating platform admin user...')

      // Generate secure random password
      const initialPassword = generateSecurePassword(16)

      await User.create({
        accountType: 'platform',
        accountId: new mongoose.Types.ObjectId(),
        name: 'Platform Admin',
        email: 'admin@platform.com',
        password: initialPassword,
        role: 'admin',
        status: 'active',
        forcePasswordChange: true // Force password change on first login
      })

      // Log password only once - this is the only time it will be shown
      logger.warn('═══════════════════════════════════════════════════════════')
      logger.warn('  PLATFORM ADMIN CREATED - SAVE THIS PASSWORD!')
      logger.warn('  Email: admin@platform.com')
      logger.warn(`  Password: ${initialPassword}`)
      logger.warn('  You will be required to change this password on first login.')
      logger.warn('═══════════════════════════════════════════════════════════')
    }

    logger.info('✓ Bootstrap completed')
  } catch (error) {
    logger.error(`Bootstrap error: ${error.message}`)
  }
}

export default bootstrap
