import config from '../../config/index.js'
import logger from '../../core/logger.js'

// Lazy-loaded SESClient constructor
let _SESClient = null
const getSESClientClass = async () => {
  if (!_SESClient) {
    const mod = await import('@aws-sdk/client-ses')
    _SESClient = mod.SESClient
  }
  return _SESClient
}

// Cached SES clients (keyed by partnerId or 'platform')
const sesClients = new Map()

/**
 * Get email settings from database or fall back to env config
 * @param {string} partnerId - Optional partner ID for partner-specific settings
 * @returns {Object} Email settings
 */
export const getEmailSettings = async (partnerId = null) => {
  try {
    // Dynamic import to avoid circular dependencies
    const { default: PlatformSettings } =
      await import('../../modules/platform-settings/platformSettings.model.js')

    // If partner ID provided, check for partner-specific settings
    if (partnerId) {
      const { default: Partner } = await import('../../modules/partner/partner.model.js')
      const partner = await Partner.findById(partnerId)

      if (partner?.notifications?.email?.useOwnSES) {
        const partnerEmail = partner.notifications.email
        if (partnerEmail.aws?.accessKeyId && partnerEmail.aws?.secretAccessKey) {
          const { decrypt } = await import('../encryption.js')
          return {
            enabled: true,
            source: 'partner',
            region: partnerEmail.aws.region || 'eu-west-1',
            accessKeyId: decrypt(partnerEmail.aws.accessKeyId),
            secretAccessKey: decrypt(partnerEmail.aws.secretAccessKey),
            fromEmail: partnerEmail.aws.fromEmail,
            fromName: partnerEmail.aws.fromName || partner.companyName
          }
        }
      }
    }

    // Use platform settings from database
    const platformSettings = await PlatformSettings.getSettings()
    const credentials = platformSettings.getAWSCredentials()

    if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
      return {
        enabled: true,
        source: 'platform-db',
        ...credentials
      }
    }
  } catch (error) {
    logger.warn('Failed to load email settings from database, falling back to env:', error.message)
  }

  // Fall back to environment variables
  if (config.aws?.ses?.accessKeyId && config.aws?.ses?.secretAccessKey) {
    logger.warn('Using AWS credentials from env (PlatformSettings not available)')
    return {
      enabled: true,
      source: 'env',
      region: config.aws.ses.region,
      accessKeyId: config.aws.ses.accessKeyId,
      secretAccessKey: config.aws.ses.secretAccessKey,
      fromEmail: process.env.SES_FROM_EMAIL || 'noreply@maxirez.com',
      fromName: process.env.SES_FROM_NAME || 'MaxiRez'
    }
  }

  return { enabled: false, source: 'none' }
}

/**
 * Get or create SES client with given settings
 * @param {Object} settings - Email settings
 * @param {string} cacheKey - Cache key for this client
 * @returns {Promise<SESClient>} AWS SES client
 */
export const getSESClient = async (settings, cacheKey = 'platform') => {
  // Check cache
  const cached = sesClients.get(cacheKey)
  if (cached) {
    return cached
  }

  // Lazy-load SESClient
  const SESClient = await getSESClientClass()

  // Create new client
  const client = new SESClient({
    region: settings.region,
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey
    }
  })

  // Cache it (but clear after 5 minutes to pick up credential changes)
  sesClients.set(cacheKey, client)
  setTimeout(() => sesClients.delete(cacheKey), 5 * 60 * 1000)

  return client
}

/**
 * Clear SES client cache (useful when credentials change)
 */
export const clearEmailCache = () => {
  sesClients.clear()
  logger.info('Email client cache cleared')
}

/**
 * Get admin panel URL for a partner
 * Uses partner's custom extranetDomain if set, otherwise falls back to platform default
 */
export const getAdminUrl = async partnerId => {
  if (partnerId) {
    try {
      const { default: Partner } = await import('../../modules/partner/partner.model.js')
      const partner = await Partner.findById(partnerId)
        .select('branding.extranetDomain partnerType')
        .lean()
      if (partner?.branding?.extranetDomain) {
        return `https://${partner.branding.extranetDomain}`
      }
      if (partner?.partnerType === 'hotel') {
        return config.adminUrl.replace('maxirez.com', 'minirez.com')
      }
    } catch (error) {
      logger.warn('Failed to get partner extranetDomain:', error.message)
    }
  }
  // Fall back to platform default
  return config.adminUrl
}
