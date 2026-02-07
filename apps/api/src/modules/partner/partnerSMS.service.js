import Partner from './partner.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import logger from '#core/logger.js'

// Get partner SMS settings
export const getSMSSettings = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Return SMS settings (mask sensitive data)
  const smsSettings = partner.notifications?.sms || {}
  const config = smsSettings.config || {}

  // Create masked config based on provider
  let maskedConfig = null
  if (smsSettings.provider && smsSettings.provider !== 'platform') {
    maskedConfig = {}
    switch (smsSettings.provider) {
      case 'netgsm':
        maskedConfig.usercode = config.usercode ? '***' + config.usercode.slice(-4) : null
        maskedConfig.msgheader = config.msgheader || null
        break
      case 'iletimerkezi':
        maskedConfig.apiKey = config.apiKey ? '***' + config.apiKey.slice(-4) : null
        maskedConfig.sender = config.sender || null
        break
      case 'twilio':
        maskedConfig.accountSid = config.accountSid ? '***' + config.accountSid.slice(-4) : null
        maskedConfig.fromNumber = config.fromNumber || null
        break
      case 'vonage':
        maskedConfig.apiKey = config.apiKey ? '***' + config.apiKey.slice(-4) : null
        maskedConfig.fromNumber = config.fromNumber || null
        break
    }
  }

  res.json({
    success: true,
    data: {
      enabled: smsSettings.enabled !== false,
      provider: smsSettings.provider || 'platform',
      config: maskedConfig
    }
  })
})

// Update partner SMS settings
export const updateSMSSettings = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { enabled, provider, config } = req.body

  // Initialize notifications if not exists
  if (!partner.notifications) {
    partner.notifications = {}
  }
  if (!partner.notifications.sms) {
    partner.notifications.sms = {}
  }

  // Update settings
  if (enabled !== undefined) partner.notifications.sms.enabled = enabled
  if (provider) partner.notifications.sms.provider = provider

  // Update config if provided and provider is not 'platform'
  if (config && provider !== 'platform') {
    if (!partner.notifications.sms.config) {
      partner.notifications.sms.config = {}
    }

    // Only update non-empty values
    Object.keys(config).forEach(key => {
      if (config[key]) {
        partner.notifications.sms.config[key] = config[key]
      }
    })
  }

  await partner.save()

  res.json({
    success: true,
    message: req.t ? req.t('SMS_SETTINGS_UPDATED') : 'SMS settings updated successfully',
    data: {
      enabled: partner.notifications.sms.enabled,
      provider: partner.notifications.sms.provider
    }
  })
})

// Test partner SMS configuration
export const testPartnerSMS = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { phone } = req.body

  if (!phone) {
    throw new BadRequestError('PHONE_REQUIRED')
  }

  const smsSettings = partner.notifications?.sms
  if (!smsSettings || smsSettings.provider === 'platform') {
    throw new BadRequestError('OWN_SMS_NOT_CONFIGURED')
  }

  // Get decrypted credentials
  const credentials = partner.getSMSCredentials()
  if (!credentials) {
    throw new BadRequestError('SMS_CREDENTIALS_NOT_CONFIGURED')
  }

  try {
    // Import SMS provider factory
    const SMSProviderFactory = (await import('../../services/sms/index.js')).default

    // Get provider and send test message
    const provider = await SMSProviderFactory.createProvider(smsSettings.provider, credentials)
    const result = await provider.send({
      phone,
      message: 'Booking Platform test mesajı. SMS yapılandırmanız başarılı!'
    })

    if (result.success) {
      logger.info(`Test SMS sent for partner ${partner._id} to ${phone}`)

      res.json({
        success: true,
        message: req.t ? req.t('TEST_SMS_SENT') : 'Test SMS sent successfully',
        messageId: result.messageId
      })
    } else {
      throw new BadRequestError(result.error || 'SMS_SEND_FAILED')
    }
  } catch (error) {
    logger.error(`Test SMS failed for partner ${partner._id}: ${error.message}`)

    res.status(400).json({
      success: false,
      error: error.message || 'Failed to send test SMS'
    })
  }
})

// Get partner SMS balance
export const getSMSBalance = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const smsSettings = partner.notifications?.sms
  if (!smsSettings || smsSettings.provider === 'platform') {
    throw new BadRequestError('OWN_SMS_NOT_CONFIGURED')
  }

  // Get decrypted credentials
  const credentials = partner.getSMSCredentials()
  if (!credentials) {
    throw new BadRequestError('SMS_CREDENTIALS_NOT_CONFIGURED')
  }

  try {
    // Import SMS provider factory
    const SMSProviderFactory = (await import('../../services/sms/index.js')).default

    // Get provider and check balance
    const provider = await SMSProviderFactory.createProvider(smsSettings.provider, credentials)
    const result = await provider.getBalance()

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error(`Balance check failed for partner ${partner._id}: ${error.message}`)

    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get SMS balance'
    })
  }
})

// Get available SMS providers
export const getSMSProviders = asyncHandler(async (req, res) => {
  const SMSProviderFactory = (await import('../../services/sms/index.js')).default

  const providers = await SMSProviderFactory.getAvailableProviders()

  // Add platform as default option
  const allProviders = [
    {
      name: 'platform',
      displayName: 'Platform Varsayılanı',
      fields: [],
      supportsBalance: false
    },
    ...providers
  ]

  res.json({
    success: true,
    data: allProviders
  })
})
