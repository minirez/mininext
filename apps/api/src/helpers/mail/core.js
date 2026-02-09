import config from '../../config/index.js'
import logger from '../../core/logger.js'
import { htmlToText } from '../emailTemplates.js'
import EmailLog from '../../modules/email-log/emailLog.model.js'
import { getEmailSettings, getSESClient } from './transporter.js'

// Lazy-loaded AWS SES command classes
let _sesCommands = null
const getSESCommands = async () => {
  if (!_sesCommands) {
    const mod = await import('@aws-sdk/client-ses')
    _sesCommands = {
      SendEmailCommand: mod.SendEmailCommand,
      SendRawEmailCommand: mod.SendRawEmailCommand
    }
  }
  return _sesCommands
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
 * @param {string} options.partnerType - Partner type for dynamic from domain: 'hotel' or 'agency' (optional)
 * @param {string} options.type - Email type for logging (optional)
 * @param {string} options.userId - Related user ID (optional)
 * @param {Object} options.metadata - Additional metadata (optional)
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  from,
  partnerId,
  partnerType,
  type = 'other',
  userId,
  metadata
}) => {
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
    const client = await getSESClient(settings, cacheKey)

    // Determine from address with dynamic domain based on partnerType
    let fromAddress = from
    if (!fromAddress) {
      let fromEmail = settings.fromEmail
      let fromName = settings.fromName

      // Resolve partnerType from partner record if not provided
      let resolvedPartnerType = partnerType
      if (!resolvedPartnerType && partnerId) {
        try {
          const { default: Partner } = await import('../../modules/partner/partner.model.js')
          const partner = await Partner.findById(partnerId).select('partnerType').lean()
          resolvedPartnerType = partner?.partnerType
        } catch (e) {
          // Ignore - will use default domain
        }
      }

      // Switch domain for hotel partners: maxirez.com -> minirez.com
      if (resolvedPartnerType === 'hotel') {
        if (fromEmail) {
          fromEmail = fromEmail.replace(/@maxirez\.com$/, '@minirez.com')
        }
        if (fromName) {
          fromName = fromName.replace(/Maxirez/gi, 'Minirez')
        }
      }

      fromAddress = `${fromName} <${fromEmail}>`
    }

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

    const { SendEmailCommand } = await getSESCommands()
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
    const client = await getSESClient(settings, cacheKey)

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

    const { SendRawEmailCommand } = await getSESCommands()
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
