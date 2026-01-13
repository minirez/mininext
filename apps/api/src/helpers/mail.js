import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses'
import config from '../config/index.js'
import logger from '../core/logger.js'
import { renderEmailTemplate, htmlToText } from './emailTemplates.js'
import EmailLog from '../modules/email-log/emailLog.model.js'

// Cached SES clients (keyed by partnerId or 'platform')
const sesClients = new Map()

/**
 * Get email settings from database or fall back to env config
 * @param {string} partnerId - Optional partner ID for partner-specific settings
 * @returns {Object} Email settings
 */
const getEmailSettings = async (partnerId = null) => {
  try {
    // Dynamic import to avoid circular dependencies
    const { default: PlatformSettings } =
      await import('../modules/platform-settings/platformSettings.model.js')

    // If partner ID provided, check for partner-specific settings
    if (partnerId) {
      const { default: Partner } = await import('../modules/partner/partner.model.js')
      const partner = await Partner.findById(partnerId)

      if (partner?.notifications?.email?.useOwnSES) {
        const partnerEmail = partner.notifications.email
        if (partnerEmail.aws?.accessKeyId && partnerEmail.aws?.secretAccessKey) {
          const { decrypt } = await import('./encryption.js')
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

  // Fall back to environment variables (fromEmail/fromName must be set in PlatformSettings)
  if (config.aws?.ses?.accessKeyId && config.aws?.ses?.secretAccessKey) {
    logger.warn(
      'Using AWS credentials from env but fromEmail/fromName must be configured in Platform Settings'
    )
    return {
      enabled: true,
      source: 'env',
      region: config.aws.ses.region,
      accessKeyId: config.aws.ses.accessKeyId,
      secretAccessKey: config.aws.ses.secretAccessKey,
      fromEmail: 'noreply@example.com', // Placeholder - must be set in PlatformSettings
      fromName: 'Booking Engine'
    }
  }

  return { enabled: false, source: 'none' }
}

/**
 * Get or create SES client with given settings
 * @param {Object} settings - Email settings
 * @param {string} cacheKey - Cache key for this client
 * @returns {SESClient} AWS SES client
 */
const getSESClient = (settings, cacheKey = 'platform') => {
  // Check cache
  const cached = sesClients.get(cacheKey)
  if (cached) {
    return cached
  }

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
 * Send email using AWS SES
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @param {string} options.from - From email (optional, uses config default)
 * @param {string} options.partnerId - Partner ID for partner-specific settings (optional)
 * @param {string} options.type - Email type for logging (optional)
 * @param {string} options.userId - Related user ID (optional)
 * @param {Object} options.metadata - Additional metadata (optional)
 */
export const sendEmail = async ({ to, subject, html, text, from, partnerId, type = 'other', userId, metadata }) => {
  // Create email log entry
  let emailLog = null
  try {
    emailLog = await EmailLog.create({
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      type,
      status: 'pending',
      partnerId: partnerId || null,
      userId: userId || null,
      metadata
    })
  } catch (logError) {
    logger.warn('Failed to create email log entry:', logError.message)
  }

  try {
    const settings = await getEmailSettings(partnerId)

    // If email is not configured, log to console in development
    if (!settings.enabled) {
      if (config.isDev) {
        logger.warn('AWS SES not configured, logging email to console:')
        logger.info({
          to,
          subject,
          from: from || 'noreply@example.com',
          html: html?.substring(0, 200) + '...'
        })

        // Update log
        if (emailLog) {
          await EmailLog.markSent(emailLog._id, 'dev-mode-no-email-sent', 'dev-mode')
        }

        return { success: true, messageId: 'dev-mode-no-email-sent' }
      } else {
        const error = new Error('AWS SES is not configured')
        if (emailLog) {
          await EmailLog.markFailed(emailLog._id, error)
        }
        throw error
      }
    }

    const cacheKey = settings.source === 'partner' ? `partner-${partnerId}` : 'platform'
    const client = getSESClient(settings, cacheKey)

    const fromAddress = from || `${settings.fromName} <${settings.fromEmail}>`

    const params = {
      Source: fromAddress,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8'
          }
        }
      }
    }

    // Add plain text if provided
    if (text) {
      params.Message.Body.Text = {
        Data: text,
        Charset: 'UTF-8'
      }
    }

    const command = new SendEmailCommand(params)
    const response = await client.send(command)

    logger.info(
      `Email sent successfully to ${to} (source: ${settings.source}). MessageId: ${response.MessageId}`
    )

    // Update log as sent
    if (emailLog) {
      await EmailLog.markSent(emailLog._id, response.MessageId, settings.source)
    }

    return {
      success: true,
      messageId: response.MessageId,
      source: settings.source
    }
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error)

    // Update log as failed
    if (emailLog) {
      await EmailLog.markFailed(emailLog._id, error)
    }

    throw error
  }
}

/**
 * Send welcome email with credentials
 */
export const sendWelcomeEmail = async ({
  to,
  name,
  email,
  password,
  accountType,
  loginUrl,
  partnerId,
  language = 'tr'
}) => {
  const subject = language === 'tr' ? 'Booking Engine\'e Hoş Geldiniz' : 'Welcome to Booking Engine'

  // Get partner info for branding
  let companyName = 'Booking Engine'
  let companyAddress = language === 'tr' ? 'İstanbul, Türkiye' : 'Istanbul, Turkey'
  let siteUrl = config.adminUrl

  if (partnerId) {
    try {
      const { default: Partner } = await import('../modules/partner/partner.model.js')
      const partner = await Partner.findById(partnerId).select('companyName branding address').lean()
      if (partner) {
        companyName = partner.companyName || companyName
        companyAddress = partner.address?.city || companyAddress
        if (partner.branding?.extranetDomain) {
          siteUrl = `https://${partner.branding.extranetDomain}`
        }
      }
    } catch (error) {
      logger.warn('Failed to get partner info for welcome email:', error.message)
    }
  }

  const html = await renderEmailTemplate('welcome', {
    // Dynamic values with correct variable names
    USER_NAME: name,
    USER_EMAIL: email,
    PASSWORD: password,
    ACCOUNT_TYPE: accountType,
    DASHBOARD_URL: loginUrl || siteUrl,
    // Layout variables
    TITLE: language === 'tr' ? 'Hoş Geldiniz' : 'Welcome',
    PREVIEW_TEXT: language === 'tr' ? 'Hesabınız başarıyla oluşturuldu' : 'Your account has been created',
    LOGO_URL: 'https://booking-engine.com/logo.png',
    SITE_URL: siteUrl,
    COMPANY_NAME: companyName,
    COMPANY_ADDRESS: companyAddress,
    SUPPORT_EMAIL: 'support@booking-engine.com',
    UNSUBSCRIBE_URL: '#'
  }, language)

  const text = htmlToText(html)

  return sendEmail({ to, subject, html, text, partnerId, type: 'welcome' })
}

/**
 * Send 2FA setup email with backup codes
 */
export const send2FASetupEmail = async ({
  to,
  name,
  backupCodes,
  securityUrl,
  partnerId,
  language = 'tr'
}) => {
  // Import TEMPLATE_LABELS for language-specific text
  const { TEMPLATE_LABELS } = await import('./emailTemplates.js')
  const labels = TEMPLATE_LABELS[language] || TEMPLATE_LABELS.tr

  const subject = language === 'tr'
    ? 'İki Faktörlü Doğrulama Etkinleştirildi'
    : 'Two-Factor Authentication Enabled'

  // Get partner info for branding
  let companyName = 'Booking Engine'
  let companyAddress = language === 'tr' ? 'İstanbul, Türkiye' : 'Istanbul, Turkey'
  let siteUrl = config.adminUrl

  if (partnerId) {
    try {
      const { default: Partner } = await import('../modules/partner/partner.model.js')
      const partner = await Partner.findById(partnerId).select('companyName branding address').lean()
      if (partner) {
        companyName = partner.companyName || companyName
        companyAddress = partner.address?.city || companyAddress
        if (partner.branding?.extranetDomain) {
          siteUrl = `https://${partner.branding.extranetDomain}`
        }
      }
    } catch (error) {
      logger.warn('Failed to get partner info for 2FA email:', error.message)
    }
  }

  // Format backup codes as a string
  const formattedCodes = Array.isArray(backupCodes) ? backupCodes.join('\n') : backupCodes

  const html = await renderEmailTemplate('2fa-setup', {
    // Use labels for title/subtitle
    TITLE: labels.TWO_FA_TITLE,
    SUBTITLE: labels.TWO_FA_SUBTITLE,
    // Dynamic values
    USER_NAME: name,
    BACKUP_CODES: formattedCodes,
    SECURITY_URL: securityUrl || `${siteUrl}/settings/security`,
    // Layout variables
    PREVIEW_TEXT: labels.TWO_FA_SUBTITLE,
    LOGO_URL: 'https://booking-engine.com/logo.png',
    SITE_URL: siteUrl,
    COMPANY_NAME: companyName,
    COMPANY_ADDRESS: companyAddress,
    SUPPORT_EMAIL: 'support@booking-engine.com',
    UNSUBSCRIBE_URL: '#'
  }, language)

  const text = htmlToText(html)

  return sendEmail({ to, subject, html, text, partnerId, type: '2fa-setup' })
}

/**
 * Get admin panel URL for a partner
 * Uses partner's custom extranetDomain if set, otherwise falls back to platform default
 */
export const getAdminUrl = async (partnerId) => {
  if (partnerId) {
    try {
      const { default: Partner } = await import('../modules/partner/partner.model.js')
      const partner = await Partner.findById(partnerId).select('branding.extranetDomain').lean()
      if (partner?.branding?.extranetDomain) {
        return `https://${partner.branding.extranetDomain}`
      }
    } catch (error) {
      logger.warn('Failed to get partner extranetDomain:', error.message)
    }
  }
  // Fall back to platform default
  return config.adminUrl
}

/**
 * Send account activation email (for new users to set their password)
 */
export const sendActivationEmail = async ({ to, name, inviterName, accountName, userRole = 'Kullanıcı', token, partnerId, language = 'tr', partnerCity = '' }) => {
  const baseUrl = await getAdminUrl(partnerId)
  const activationUrl = `${baseUrl}/activate/${token}`

  // Build company info for footer
  const companyName = accountName || 'Booking Engine'
  const companyAddress = partnerCity || 'İstanbul, Türkiye'

  try {
    // Use Maizzle template
    const html = await renderEmailTemplate('activation', {
      // Content variables
      USER_NAME: name,
      USER_EMAIL: to,
      INVITER_NAME: inviterName,
      ACCOUNT_NAME: accountName,
      USER_ROLE: userRole,
      ACTIVATION_URL: activationUrl,
      // Layout variables
      TITLE: language === 'tr' ? 'Hesap Aktivasyonu' : 'Account Activation',
      PREVIEW_TEXT: language === 'tr' ? 'Hesabınızı aktifleştirmek için tıklayın' : 'Click to activate your account',
      LOGO_URL: 'https://booking-engine.com/logo.png',
      SITE_URL: baseUrl,
      COMPANY_NAME: companyName,
      COMPANY_ADDRESS: companyAddress
    }, language)

    const text = htmlToText(html)
    const subject = language === 'tr' ? 'Hesabınızı Aktifleştirin - Booking Engine' : 'Activate Your Account - Booking Engine'

    return sendEmail({ to, subject, html, text, partnerId, type: 'activation' })
  } catch (error) {
    // Fallback to simple HTML if template fails
    logger.warn('Failed to render activation template, using fallback:', error.message)

    const subject = 'Hesabınızı Aktifleştirin - Booking Engine'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5;">Hoş Geldiniz!</h1>
        <p>Merhaba ${name},</p>
        <p><strong>${inviterName}</strong> sizi <strong>${accountName}</strong> hesabına kullanıcı olarak ekledi.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${activationUrl}" style="background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Hesabı Aktifleştir
          </a>
        </p>
        <p style="color: #f59e0b; font-size: 14px;">Bu link 7 gün içinde geçerliliğini yitirecektir.</p>
        <p style="font-size: 12px; color: #6b7280;">Link: ${activationUrl}</p>
      </div>
    `
    const text = `Merhaba ${name},\n\n${inviterName} sizi ${accountName} hesabına kullanıcı olarak ekledi.\n\nHesabınızı aktifleştirmek için: ${activationUrl}\n\nBu link 7 gün içinde geçerliliğini yitirecektir.`

    return sendEmail({ to, subject, html, text, partnerId, type: 'activation' })
  }
}

/**
 * Send booking confirmation email
 */
export const sendBookingConfirmation = async ({
  to,
  bookingNumber,
  hotelName,
  hotelAddress,
  checkIn,
  checkOut,
  nights,
  roomType,
  guests,
  boardType,
  totalPrice,
  guestName,
  guestEmail,
  guestPhone,
  bookingUrl,
  partnerId,
  language = 'tr'
}) => {
  const subject = language === 'tr'
    ? `Rezervasyon Onayı - ${bookingNumber}`
    : `Booking Confirmation - ${bookingNumber}`

  // Get partner info for branding
  let companyName = 'Booking Engine'
  let companyAddress = language === 'tr' ? 'İstanbul, Türkiye' : 'Istanbul, Turkey'
  let siteUrl = config.adminUrl

  if (partnerId) {
    try {
      const { default: Partner } = await import('../modules/partner/partner.model.js')
      const partner = await Partner.findById(partnerId).select('companyName branding address').lean()
      if (partner) {
        companyName = partner.companyName || companyName
        companyAddress = partner.address?.city || companyAddress
        if (partner.branding?.extranetDomain) {
          siteUrl = `https://${partner.branding.extranetDomain}`
        }
      }
    } catch (error) {
      logger.warn('Failed to get partner info for booking confirmation email:', error.message)
    }
  }

  const html = await renderEmailTemplate('booking-confirmation', {
    // Booking details
    BOOKING_NUMBER: bookingNumber,
    STATUS: language === 'tr' ? 'Onaylandı' : 'Confirmed',
    HOTEL_NAME: hotelName,
    HOTEL_ADDRESS: hotelAddress || '',
    CHECKIN_DATE: checkIn,
    CHECKOUT_DATE: checkOut,
    NIGHTS: nights || '',
    ROOM_TYPE: roomType || '',
    GUESTS: guests || '',
    BOARD_TYPE: boardType || '',
    TOTAL_PRICE: totalPrice,
    // Guest info
    GUEST_NAME: guestName || '',
    GUEST_EMAIL: guestEmail || to,
    GUEST_PHONE: guestPhone || '',
    BOOKING_URL: bookingUrl,
    // Layout variables
    TITLE: language === 'tr' ? 'Rezervasyon Onayı' : 'Booking Confirmation',
    PREVIEW_TEXT: language === 'tr' ? `Rezervasyonunuz onaylandı - ${bookingNumber}` : `Your booking is confirmed - ${bookingNumber}`,
    LOGO_URL: 'https://booking-engine.com/logo.png',
    SITE_URL: siteUrl,
    COMPANY_NAME: companyName,
    COMPANY_ADDRESS: companyAddress,
    SUPPORT_EMAIL: 'support@booking-engine.com',
    UNSUBSCRIBE_URL: '#'
  }, language)

  const text = htmlToText(html)

  return sendEmail({ to, subject, html, text, partnerId, type: 'booking-confirmation' })
}

/**
 * Send booking cancellation email
 */
export const sendBookingCancellation = async ({
  to,
  bookingNumber,
  hotelName,
  checkIn,
  checkOut,
  cancelledAt,
  reason,
  originalAmount,
  cancellationFee,
  refundAmount,
  newBookingUrl,
  partnerId,
  language = 'tr'
}) => {
  // Import TEMPLATE_LABELS for language-specific text
  const { TEMPLATE_LABELS } = await import('./emailTemplates.js')
  const labels = TEMPLATE_LABELS[language] || TEMPLATE_LABELS.tr

  const subject = language === 'tr'
    ? `Rezervasyon İptal Edildi - ${bookingNumber}`
    : `Booking Cancelled - ${bookingNumber}`

  // Get partner info for branding
  let companyName = 'Booking Engine'
  let companyAddress = language === 'tr' ? 'İstanbul, Türkiye' : 'Istanbul, Turkey'
  let siteUrl = config.adminUrl

  if (partnerId) {
    try {
      const { default: Partner } = await import('../modules/partner/partner.model.js')
      const partner = await Partner.findById(partnerId).select('companyName branding address').lean()
      if (partner) {
        companyName = partner.companyName || companyName
        companyAddress = partner.address?.city || companyAddress
        if (partner.branding?.extranetDomain) {
          siteUrl = `https://${partner.branding.extranetDomain}`
        }
      }
    } catch (error) {
      logger.warn('Failed to get partner info for booking cancellation email:', error.message)
    }
  }

  const html = await renderEmailTemplate('booking-cancelled', {
    // Use labels for title/subtitle
    TITLE: labels.CANCELLED_TITLE,
    SUBTITLE: labels.CANCELLED_SUBTITLE,
    // Booking details
    BOOKING_NUMBER: bookingNumber,
    HOTEL_NAME: hotelName,
    CHECKIN_DATE: checkIn,
    CHECKOUT_DATE: checkOut,
    CANCELLED_AT: cancelledAt || new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'),
    CANCELLATION_REASON: reason || '',
    // Refund info (optional)
    ORIGINAL_AMOUNT: originalAmount || '',
    CANCELLATION_FEE: cancellationFee || '',
    REFUND_AMOUNT: refundAmount || '',
    NEW_BOOKING_URL: newBookingUrl || siteUrl,
    // Layout variables
    PREVIEW_TEXT: language === 'tr' ? `Rezervasyonunuz iptal edildi - ${bookingNumber}` : `Your booking has been cancelled - ${bookingNumber}`,
    LOGO_URL: 'https://booking-engine.com/logo.png',
    SITE_URL: siteUrl,
    COMPANY_NAME: companyName,
    COMPANY_ADDRESS: companyAddress,
    SUPPORT_EMAIL: 'support@booking-engine.com',
    UNSUBSCRIBE_URL: '#'
  }, language)

  const text = htmlToText(html)

  return sendEmail({ to, subject, html, text, partnerId, type: 'booking-cancelled' })
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async ({ to, name, resetUrl, partnerId, language = 'tr' }) => {
  // Import TEMPLATE_LABELS for language-specific text
  const { TEMPLATE_LABELS } = await import('./emailTemplates.js')
  const labels = TEMPLATE_LABELS[language] || TEMPLATE_LABELS.tr

  const subject = language === 'tr' ? 'Şifre Sıfırlama Talebi' : 'Password Reset Request'

  // Get partner info for branding
  let companyName = labels.COMPANY_NAME
  let companyAddress = labels.COMPANY_ADDRESS
  let siteUrl = config.adminUrl

  if (partnerId) {
    try {
      const { default: Partner } = await import('../modules/partner/partner.model.js')
      const partner = await Partner.findById(partnerId).select('companyName branding address').lean()
      if (partner) {
        companyName = partner.companyName || companyName
        companyAddress = partner.address?.city || companyAddress
        if (partner.branding?.extranetDomain) {
          siteUrl = `https://${partner.branding.extranetDomain}`
        }
      }
    } catch (error) {
      logger.warn('Failed to get partner info for password reset email:', error.message)
    }
  }

  const html = await renderEmailTemplate('password-reset', {
    // Map template variables to labels
    TITLE: labels.PASSWORD_RESET_TITLE,
    SUBTITLE: labels.PASSWORD_RESET_SUBTITLE,
    DESCRIPTION: labels.PASSWORD_RESET_DESC,
    RESET_BUTTON: labels.RESET_BUTTON,
    ALTERNATIVE_TEXT: labels.ALTERNATIVE_TEXT,
    EXPIRY_WARNING: labels.EXPIRY_WARNING,
    SECURITY_NOTE: labels.SECURITY_NOTE,
    // Dynamic values
    RESET_URL: resetUrl,
    USER_NAME: name,
    // Layout variables
    PREVIEW_TEXT: labels.PASSWORD_RESET_SUBTITLE,
    LOGO_URL: 'https://booking-engine.com/logo.png',
    SITE_URL: siteUrl,
    COMPANY_NAME: companyName,
    COMPANY_ADDRESS: companyAddress,
    FOOTER_TEXT: labels.FOOTER_TEXT,
    UNSUBSCRIBE_URL: '#',
    UNSUBSCRIBE_TEXT: labels.UNSUBSCRIBE_TEXT
  }, language)

  const text = htmlToText(html)

  return sendEmail({ to, subject, html, text, partnerId, type: 'password-reset' })
}

/**
 * Clear SES client cache (useful when credentials change)
 */
export const clearEmailCache = () => {
  sesClients.clear()
  logger.info('Email client cache cleared')
}

/**
 * Send email with attachments using raw email format
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @param {Array} options.attachments - Array of attachments [{filename, content, contentType}]
 * @param {string} options.partnerId - Partner ID for partner-specific settings (optional)
 */
export const sendEmailWithAttachments = async ({
  to,
  subject,
  html,
  text,
  attachments = [],
  partnerId
}) => {
  try {
    const settings = await getEmailSettings(partnerId)

    if (!settings.enabled) {
      if (config.isDev) {
        logger.warn('AWS SES not configured, logging email to console:')
        logger.info({ to, subject, attachments: attachments.map(a => a.filename) })
        return { success: true, messageId: 'dev-mode-no-email-sent' }
      } else {
        throw new Error('AWS SES is not configured')
      }
    }

    const cacheKey = settings.source === 'partner' ? `partner-${partnerId}` : 'platform'
    const client = getSESClient(settings, cacheKey)

    const fromAddress = `${settings.fromName} <${settings.fromEmail}>`
    const toAddresses = Array.isArray(to) ? to : [to]
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Build MIME message
    let rawMessage = [
      `From: ${fromAddress}`,
      `To: ${toAddresses.join(', ')}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: multipart/alternative; boundary="alt_boundary"',
      '',
      '--alt_boundary',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(text || htmlToText(html)).toString('base64'),
      '',
      '--alt_boundary',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(html).toString('base64'),
      '',
      '--alt_boundary--'
    ]

    // Add attachments
    for (const attachment of attachments) {
      const contentBase64 = Buffer.isBuffer(attachment.content)
        ? attachment.content.toString('base64')
        : Buffer.from(attachment.content).toString('base64')

      rawMessage = rawMessage.concat([
        '',
        `--${boundary}`,
        `Content-Type: ${attachment.contentType || 'application/octet-stream'}; name="${attachment.filename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        '',
        contentBase64
      ])
    }

    rawMessage.push('', `--${boundary}--`)

    const params = {
      RawMessage: {
        Data: Buffer.from(rawMessage.join('\r\n'))
      }
    }

    const command = new SendRawEmailCommand(params)
    const response = await client.send(command)

    logger.info(`Email with attachments sent to ${to}. MessageId: ${response.MessageId}`)

    return {
      success: true,
      messageId: response.MessageId,
      source: settings.source
    }
  } catch (error) {
    logger.error(`Failed to send email with attachments to ${to}:`, error)
    throw error
  }
}

/**
 * Send Night Audit reports email
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.hotelName - Hotel name
 * @param {Date} options.auditDate - Audit date
 * @param {Object} options.summary - Audit summary stats
 * @param {Array} options.reports - PDF report buffers [{type, buffer}]
 * @param {string} options.partnerId - Partner ID
 */
export const sendNightAuditReports = async ({
  to,
  hotelName,
  auditDate,
  summary,
  reports,
  partnerId
}) => {
  const dateStr = new Date(auditDate).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const subject = `Night Audit Raporları - ${hotelName} - ${dateStr}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .stats { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
        .stat { background: white; padding: 15px; border-radius: 8px; flex: 1; min-width: 120px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-value { font-size: 28px; font-weight: bold; color: #4F46E5; }
        .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .reports { margin-top: 20px; }
        .reports h3 { color: #374151; margin-bottom: 10px; }
        .reports ul { list-style: none; padding: 0; }
        .reports li { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌙 Night Audit Tamamlandı</h1>
          <p>${hotelName} - ${dateStr}</p>
        </div>
        <div class="content">
          <p>Merhaba,</p>
          <p>${dateStr} tarihli Night Audit işlemi başarıyla tamamlandı. Günün özeti aşağıdadır:</p>

          <div class="stats">
            <div class="stat">
              <div class="stat-value">%${summary?.occupancyRate || 0}</div>
              <div class="stat-label">Doluluk</div>
            </div>
            <div class="stat">
              <div class="stat-value">${summary?.arrivals || 0}</div>
              <div class="stat-label">Giriş</div>
            </div>
            <div class="stat">
              <div class="stat-value">${summary?.departures || 0}</div>
              <div class="stat-label">Çıkış</div>
            </div>
            <div class="stat">
              <div class="stat-value">${summary?.inHouseGuests || 0}</div>
              <div class="stat-label">Misafir</div>
            </div>
          </div>

          <div class="reports">
            <h3>📎 Ekli Raporlar</h3>
            <ul>
              ${reports.map(r => `<li>📄 ${r.filename}</li>`).join('')}
            </ul>
          </div>

          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            Bu e-posta Night Audit tamamlandığında otomatik olarak gönderilmiştir.
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Booking Engine - Tüm hakları saklıdır.
        </div>
      </div>
    </body>
    </html>
  `

  const attachments = reports.map(r => ({
    filename: r.filename,
    content: r.buffer,
    contentType: 'application/pdf'
  }))

  return sendEmailWithAttachments({
    to,
    subject,
    html,
    attachments,
    partnerId
  })
}

export default {
  sendEmail,
  sendEmailWithAttachments,
  sendWelcomeEmail,
  send2FASetupEmail,
  sendActivationEmail,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendPasswordResetEmail,
  sendNightAuditReports,
  clearEmailCache,
  getAdminUrl
}
