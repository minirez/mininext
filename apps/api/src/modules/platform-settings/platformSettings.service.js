import PlatformSettings from './platformSettings.model.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import logger from '../../core/logger.js'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import axios from 'axios'
import { decrypt } from '../../helpers/encryption.js'

/**
 * Get platform settings
 * Returns masked version (no sensitive data exposed)
 */
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.getSettings()

  res.json({
    success: true,
    data: settings.toSafeJSON()
  })
})

/**
 * Update platform settings
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const { aws, netgsm, webPush, gemini, firecrawl } = req.body

  let settings = await PlatformSettings.getSettings()

  // Update AWS SES settings
  if (aws?.ses !== undefined) {
    settings.aws = settings.aws || {}
    settings.aws.ses = settings.aws.ses || {}

    if (aws.ses.enabled !== undefined) settings.aws.ses.enabled = aws.ses.enabled
    if (aws.ses.region) settings.aws.ses.region = aws.ses.region
    if (aws.ses.accessKeyId) settings.aws.ses.accessKeyId = aws.ses.accessKeyId
    if (aws.ses.secretAccessKey) settings.aws.ses.secretAccessKey = aws.ses.secretAccessKey
    if (aws.ses.fromEmail) settings.aws.ses.fromEmail = aws.ses.fromEmail
    if (aws.ses.fromName) settings.aws.ses.fromName = aws.ses.fromName
  }

  // Update NetGSM settings
  if (netgsm !== undefined) {
    settings.netgsm = settings.netgsm || {}

    if (netgsm.enabled !== undefined) settings.netgsm.enabled = netgsm.enabled
    if (netgsm.usercode) settings.netgsm.usercode = netgsm.usercode
    if (netgsm.password) settings.netgsm.password = netgsm.password
    if (netgsm.msgheader) settings.netgsm.msgheader = netgsm.msgheader
    if (netgsm.apiUrl) settings.netgsm.apiUrl = netgsm.apiUrl
  }

  // Update Web Push settings
  if (webPush !== undefined) {
    settings.webPush = settings.webPush || {}

    if (webPush.enabled !== undefined) settings.webPush.enabled = webPush.enabled
    if (webPush.publicKey) settings.webPush.publicKey = webPush.publicKey
    if (webPush.privateKey) settings.webPush.privateKey = webPush.privateKey
    if (webPush.contactEmail) settings.webPush.contactEmail = webPush.contactEmail
  }

  // Update Gemini settings
  if (gemini !== undefined) {
    settings.gemini = settings.gemini || {}

    if (gemini.enabled !== undefined) settings.gemini.enabled = gemini.enabled
    if (gemini.apiKey) settings.gemini.apiKey = gemini.apiKey
  }

  // Update Firecrawl settings
  if (firecrawl !== undefined) {
    settings.firecrawl = settings.firecrawl || {}

    if (firecrawl.enabled !== undefined) settings.firecrawl.enabled = firecrawl.enabled
    if (firecrawl.apiKey) settings.firecrawl.apiKey = firecrawl.apiKey
  }

  await settings.save()

  logger.info('Platform settings updated by user:', req.user?.email)

  res.json({
    success: true,
    message: 'Platform settings updated successfully',
    data: settings.toSafeJSON()
  })
})

/**
 * Test email configuration
 * Sends a test email to verify AWS SES setup
 */
export const testEmail = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email address is required'
    })
  }

  const settings = await PlatformSettings.getSettings()
  const credentials = settings.getAWSCredentials()

  if (!credentials) {
    return res.status(400).json({
      success: false,
      error: 'AWS SES is not configured or not enabled'
    })
  }

  if (!credentials.accessKeyId || !credentials.secretAccessKey) {
    return res.status(400).json({
      success: false,
      error: 'AWS credentials are not complete'
    })
  }

  try {
    const sesClient = new SESClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      }
    })

    const params = {
      Source: `${credentials.fromName} <${credentials.fromEmail}>`,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Test Email - Booking Platform',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #4F46E5;">Email Configuration Test</h1>
                <p>This is a test email from Booking Platform.</p>
                <p>If you received this email, your AWS SES configuration is working correctly!</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
                <p style="color: #6B7280; font-size: 12px;">
                  Sent from: ${credentials.fromEmail}<br>
                  Region: ${credentials.region}
                </p>
              </div>
            `,
            Charset: 'UTF-8'
          }
        }
      }
    }

    const command = new SendEmailCommand(params)
    const response = await sesClient.send(command)

    logger.info(`Test email sent successfully to ${email}. MessageId: ${response.MessageId}`)

    res.json({
      success: true,
      message: `Test email sent to ${email}`,
      messageId: response.MessageId
    })
  } catch (error) {
    logger.error('Test email failed:', error.message)

    res.status(400).json({
      success: false,
      error: error.message || 'Failed to send test email'
    })
  }
})

/**
 * Test SMS configuration
 * Sends a test SMS to verify NetGSM setup
 */
export const testSMS = asyncHandler(async (req, res) => {
  const { phone } = req.body

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: 'Phone number is required'
    })
  }

  const settings = await PlatformSettings.getSettings()
  const credentials = settings.getNetGSMCredentials()

  if (!credentials) {
    return res.status(400).json({
      success: false,
      error: 'NetGSM is not configured or not enabled'
    })
  }

  if (!credentials.usercode || !credentials.password) {
    return res.status(400).json({
      success: false,
      error: 'NetGSM credentials are not complete'
    })
  }

  try {
    // Format phone number: get last 10 digits and prepend 0
    const cleanPhone = phone.replace(/\s/g, '').replace(/[^0-9]/g, '')
    const formattedPhone = '0' + cleanPhone.substr(-10)

    const message = 'Booking Platform test mesaji. SMS yapilandirmasi basarili!'

    // Build XML body (NetGSM XML API format)
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
    <header>
        <company dil="TR">Netgsm</company>
        <usercode>${credentials.usercode}</usercode>
        <password>${credentials.password}</password>
        <type>1:n</type>
        <msgheader>${credentials.msgheader || 'BOOKING'}</msgheader>
    </header>
    <body>
        <msg><![CDATA[${message}]]></msg>
        <no>${formattedPhone}</no>
    </body>
</mainbody>`

    const response = await axios.post('https://api.netgsm.com.tr/sms/send/xml', xmlBody, {
      headers: { 'Content-Type': 'text/xml' },
      timeout: 30000
    })

    // Parse NetGSM response
    const [code, ...rest] = response.data.toString().split(' ')

    if (code === '00') {
      logger.info(`Test SMS sent successfully to ${formattedPhone}`)

      res.json({
        success: true,
        message: `Test SMS sent to ${phone}`,
        messageId: rest.join(' ')
      })
    } else {
      const errorMessages = {
        '20': 'Message text is empty',
        '30': 'Invalid user credentials',
        '40': 'Message header not defined',
        '50': 'Account is not active',
        '70': 'Invalid parameters'
      }

      throw new Error(errorMessages[code] || `NetGSM error code: ${code}`)
    }
  } catch (error) {
    logger.error('Test SMS failed:', error.message)

    res.status(400).json({
      success: false,
      error: error.message || 'Failed to send test SMS'
    })
  }
})

/**
 * Generate VAPID keys for Web Push
 */
export const generateVAPIDKeys = asyncHandler(async (req, res) => {
  try {
    // Dynamic import for web-push
    const webpush = await import('web-push')
    const vapidKeys = webpush.default.generateVAPIDKeys()

    res.json({
      success: true,
      data: {
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey
      }
    })
  } catch (error) {
    logger.error('Failed to generate VAPID keys:', error.message)

    res.status(500).json({
      success: false,
      error: 'Failed to generate VAPID keys'
    })
  }
})

/**
 * Get public VAPID key (for frontend)
 * This endpoint doesn't require authentication
 */
export const getVAPIDPublicKey = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.getSettings()

  if (!settings.webPush?.enabled || !settings.webPush?.publicKey) {
    return res.status(404).json({
      success: false,
      error: 'Web Push is not configured'
    })
  }

  res.json({
    success: true,
    data: {
      publicKey: settings.webPush.publicKey
    }
  })
})

export default {
  getSettings,
  updateSettings,
  testEmail,
  testSMS,
  generateVAPIDKeys,
  getVAPIDPublicKey
}
