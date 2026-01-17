import axios from 'axios'
import logger from '../core/logger.js'
import config from '../config/index.js'

/**
 * NetGSM SMS Service
 * Documentation: https://www.netgsm.com.tr/dokuman/
 */
class SMSService {
  constructor() {
    this.apiUrl = 'https://api.netgsm.com.tr/sms/send/xml'
  }

  /**
   * Get SMS settings from database
   * @returns {Object} SMS settings
   */
  async getSettings() {
    try {
      const { default: PlatformSettings } =
        await import('../modules/platform-settings/platformSettings.model.js')
      const settings = await PlatformSettings.getSettings()
      return settings.getNetGSMCredentials()
    } catch (error) {
      logger.warn('Failed to load SMS settings from database:', error.message)
      return null
    }
  }

  /**
   * Format phone number to NetGSM format
   * Converts various formats to 905XXXXXXXXX
   * @param {string} phone - Phone number in any format
   * @returns {string} Formatted phone number
   */
  formatPhone(phone) {
    if (!phone) return null

    // Remove all non-numeric characters
    const cleaned = phone.replace(/[^0-9]/g, '')

    // Handle different formats
    if (cleaned.startsWith('90') && cleaned.length === 12) {
      // Already in format: 905XXXXXXXXX
      return cleaned
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      // Format: 05XXXXXXXXX -> 905XXXXXXXXX
      return '9' + cleaned
    } else if (cleaned.length === 10 && cleaned.startsWith('5')) {
      // Format: 5XXXXXXXXX -> 905XXXXXXXXX
      return '90' + cleaned
    } else if (cleaned.startsWith('00905') && cleaned.length === 15) {
      // Format: 00905XXXXXXXXX -> 905XXXXXXXXX
      return cleaned.substring(2)
    }

    // Return as is if format is unknown
    return cleaned
  }

  /**
   * Parse NetGSM response
   * @param {string} response - Raw response from NetGSM
   * @returns {Object} Parsed result
   */
  parseResponse(response) {
    const data = response.toString().trim()
    const parts = data.split(' ')
    const code = parts[0]
    const messageId = parts.slice(1).join(' ')

    const errorMessages = {
      '00': 'Success',
      20: 'Message text is empty',
      30: 'Invalid user credentials',
      40: 'Message header not defined in system',
      50: 'Account is not active',
      51: 'Account blocked',
      70: 'Invalid parameters',
      80: 'Querying limit exceeded',
      85: 'Same content filter - duplicate message blocked'
    }

    const success = code === '00'

    return {
      success,
      code,
      messageId: success ? messageId : null,
      error: success ? null : errorMessages[code] || `Unknown error: ${code}`
    }
  }

  /**
   * Send single SMS
   * @param {Object} options - SMS options
   * @param {string} options.phone - Recipient phone number
   * @param {string} options.message - SMS content
   * @param {string} options.language - Language (TR/EN)
   * @returns {Object} Send result
   */
  async send({ phone, message, language = 'TR' }) {
    const settings = await this.getSettings()

    if (!settings) {
      if (config.isDev) {
        logger.warn('NetGSM not configured, logging SMS to console:')
        logger.info({ phone, message })
        return { success: true, messageId: 'dev-mode-no-sms-sent' }
      }
      throw new Error('NetGSM is not configured')
    }

    // Format phone: get last 10 digits and prepend 0
    const cleanPhone = phone.replace(/\s/g, '').replace(/[^0-9]/g, '')
    const formattedPhone = '0' + cleanPhone.substr(-10)

    if (!formattedPhone || formattedPhone.length !== 11) {
      throw new Error('Invalid phone number')
    }

    try {
      // Build XML body (NetGSM XML API format)
      const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
    <header>
        <company dil="${language}">Netgsm</company>
        <usercode>${settings.usercode}</usercode>
        <password>${settings.password}</password>
        <type>1:n</type>
        <msgheader>${settings.msgheader}</msgheader>
    </header>
    <body>
        <msg><![CDATA[${message}]]></msg>
        <no>${formattedPhone}</no>
    </body>
</mainbody>`

      const response = await axios.post(this.apiUrl, xmlBody, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 30000
      })

      const result = this.parseResponse(response.data)

      if (result.success) {
        logger.info(`SMS sent successfully to ${formattedPhone}. MessageId: ${result.messageId}`)
      } else {
        logger.error(`SMS failed to ${formattedPhone}: ${result.error}`)
      }

      return result
    } catch (error) {
      logger.error(`SMS send error to ${formattedPhone}:`, error.message)
      throw error
    }
  }

  /**
   * Send bulk SMS (same message to multiple recipients)
   * @param {Object} options - Bulk SMS options
   * @param {string[]} options.phones - Array of phone numbers
   * @param {string} options.message - SMS content
   * @param {string} options.language - Language (TR/EN)
   * @returns {Object[]} Array of send results
   */
  async sendBulk({ phones, message, language = 'TR' }) {
    const results = []

    for (const phone of phones) {
      try {
        const result = await this.send({ phone, message, language })
        results.push({ phone, ...result })
      } catch (error) {
        results.push({ phone, success: false, error: error.message })
      }
    }

    return results
  }

  /**
   * Get SMS credit balance
   * @returns {Object} Credit info
   */
  async getCredits() {
    const settings = await this.getSettings()

    if (!settings) {
      throw new Error('NetGSM is not configured')
    }

    try {
      const params = new URLSearchParams({
        usercode: settings.usercode,
        password: settings.password,
        stession: 1 // Credit query parameter
      })

      const response = await axios.get(
        `https://api.netgsm.com.tr/balance/check/get?${params.toString()}`,
        {
          timeout: 30000
        }
      )

      const data = response.data.toString().trim()

      if (data.startsWith('0')) {
        return {
          success: false,
          error: 'Failed to get credit balance'
        }
      }

      return {
        success: true,
        credits: parseFloat(data)
      }
    } catch (error) {
      logger.error('Failed to get SMS credits:', error.message)
      throw error
    }
  }

  /**
   * Pre-defined SMS templates
   */
  templates = {
    bookingConfirmation: data => {
      return `Rezervasyonunuz onaylandi!\nRez No: ${data.bookingNumber}\nOtel: ${data.hotelName}\nGiris: ${data.checkIn}\nCikis: ${data.checkOut}`
    },

    bookingCancellation: data => {
      return `Rezervasyonunuz iptal edildi.\nRez No: ${data.bookingNumber}\nOtel: ${data.hotelName}`
    },

    paymentReminder: data => {
      return `Odeme hatirlatmasi: ${data.bookingNumber} no'lu rezervasyonunuz icin ${data.amount} ${data.currency} odeme bekleniyor.`
    },

    checkinReminder: data => {
      return `Giris hatirlatmasi: Yarin ${data.hotelName} otelinde konaklamaniz basliyor. Iyi tatiller!`
    },

    verificationCode: data => {
      return `Dogrulama kodunuz: ${data.code}\nBu kod 5 dakika icinde gecersiz olacaktir.`
    },

    paymentLink: data => {
      return `${data.companyName}: ${data.amount} ${data.currency} tutarinda odeme linkiniz: ${data.paymentUrl}`
    }
  }

  /**
   * Send templated SMS
   * @param {string} templateName - Template name
   * @param {Object} data - Template data
   * @param {string} phone - Recipient phone
   * @returns {Object} Send result
   */
  async sendTemplate(templateName, data, phone) {
    const template = this.templates[templateName]

    if (!template) {
      throw new Error(`Unknown SMS template: ${templateName}`)
    }

    const message = template(data)
    return this.send({ phone, message })
  }
}

// Export singleton
const smsService = new SMSService()
export default smsService

export { SMSService }
