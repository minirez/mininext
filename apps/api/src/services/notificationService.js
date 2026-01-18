import logger from '../core/logger.js'
import config from '../config/index.js'
import {
  sendEmail,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendPasswordResetEmail
} from '../helpers/mail.js'
import smsService from './smsService.js'
import { sendPushToUser } from '../modules/push/push.service.js'
import NotificationLog from '../modules/notification-log/notificationLog.model.js'

/**
 * Unified Notification Service
 * Handles sending notifications through multiple channels (email, SMS, push)
 */
class NotificationService {
  /**
   * Notification type configurations
   */
  static typeConfig = {
    booking_confirmation: {
      channels: ['email', 'sms', 'push'],
      emailTemplate: 'booking-confirmation',
      smsTemplate: 'bookingConfirmation',
      pushTitle: 'Rezervasyon Onaylandı'
    },
    booking_cancelled: {
      channels: ['email', 'sms', 'push'],
      emailTemplate: 'booking-cancelled',
      smsTemplate: 'bookingCancellation',
      pushTitle: 'Rezervasyon İptal Edildi'
    },
    booking_modified: {
      channels: ['email', 'push'],
      emailTemplate: 'booking-modified',
      pushTitle: 'Rezervasyon Güncellendi'
    },
    payment_reminder: {
      channels: ['email', 'sms', 'push'],
      emailTemplate: 'payment-reminder',
      smsTemplate: 'paymentReminder',
      pushTitle: 'Ödeme Hatırlatması'
    },
    checkin_reminder: {
      channels: ['email', 'sms', 'push'],
      emailTemplate: 'checkin-reminder',
      smsTemplate: 'checkinReminder',
      pushTitle: 'Giriş Hatırlatması'
    },
    welcome: {
      channels: ['email'],
      emailTemplate: 'welcome'
    },
    password_reset: {
      channels: ['email'],
      emailTemplate: 'password-reset'
    },
    '2fa_setup': {
      channels: ['email'],
      emailTemplate: '2fa-setup'
    },
    payment_link: {
      channels: ['email', 'sms'],
      emailTemplate: 'payment-link',
      smsTemplate: 'paymentLink',
      pushTitle: 'Ödeme Linki'
    },
    payment_completed: {
      channels: ['email'],
      emailTemplate: 'payment-completed',
      pushTitle: 'Ödeme Alındı'
    },
    payment_failed: {
      channels: ['email'],
      emailTemplate: 'payment-failed',
      pushTitle: 'Ödeme Başarısız'
    },
    payment_refunded: {
      channels: ['email'],
      emailTemplate: 'payment-refunded',
      pushTitle: 'İade Tamamlandı'
    }
  }

  /**
   * Send notification through specified channels
   * @param {Object} options - Notification options
   * @param {string} options.type - Notification type
   * @param {Object} options.recipient - Recipient info { userId, email, phone, name }
   * @param {Object} options.data - Template data
   * @param {string[]} options.channels - Channels to use (optional, uses type default)
   * @param {string} options.partnerId - Partner ID for tenant-specific settings
   * @param {Object} options.relatedTo - Related entity { model, id }
   * @param {Object} options.meta - Request metadata { ip, userAgent, triggeredBy }
   * @returns {Object} Send results
   */
  async send(options) {
    const { type, recipient, data, channels, partnerId, relatedTo, meta } = options

    const config = NotificationService.typeConfig[type]
    if (!config && type !== 'custom') {
      throw new Error(`Unknown notification type: ${type}`)
    }

    const activeChannels = channels || config?.channels || ['email']

    // Create notification log entry
    const log = new NotificationLog({
      type,
      recipient: recipient.userId,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone,
      partner: partnerId,
      relatedTo,
      subject: data.subject || config?.pushTitle,
      templateData: data,
      requestMeta: meta
    })

    const results = {}

    // Send email
    if (activeChannels.includes('email') && recipient.email) {
      try {
        log.channels.email = { attempted: true }

        // Use emailTemplate from config if available, otherwise use type
        const templateName = config?.emailTemplate || type

        const emailResult = await sendEmail({
          to: recipient.email,
          subject: data.subject || this.getEmailSubject(type, data),
          html: data.html || (await this.renderEmailTemplate(templateName, data)),
          partnerId
        })

        log.channels.email.success = emailResult.success
        log.channels.email.messageId = emailResult.messageId
        log.channels.email.source = emailResult.source
        log.channels.email.sentAt = new Date()

        results.email = emailResult
      } catch (error) {
        log.channels.email.success = false
        log.channels.email.error = error.message
        results.email = { success: false, error: error.message }
        logger.error('Email notification failed:', error.message)
      }
    }

    // Send SMS
    if (activeChannels.includes('sms') && recipient.phone) {
      try {
        log.channels.sms = { attempted: true }

        const smsResult = await smsService.sendTemplate(
          config?.smsTemplate || type,
          data,
          recipient.phone
        )

        log.channels.sms.success = smsResult.success
        log.channels.sms.messageId = smsResult.messageId
        log.channels.sms.error = smsResult.error
        log.channels.sms.sentAt = new Date()

        results.sms = smsResult
      } catch (error) {
        log.channels.sms.success = false
        log.channels.sms.error = error.message
        results.sms = { success: false, error: error.message }
        logger.error('SMS notification failed:', error.message)
      }
    }

    // Send push notification
    if (activeChannels.includes('push') && recipient.userId) {
      try {
        log.channels.push = { attempted: true }

        const pushPayload = {
          title: config?.pushTitle || data.subject || 'Bildirim',
          body: this.getPushBody(type, data),
          icon: '/web-app-manifest-192x192.png',
          data: {
            type,
            ...data.pushData
          }
        }

        const pushResult = await sendPushToUser(recipient.userId, pushPayload)

        log.channels.push.success = pushResult.success
        log.channels.push.sent = pushResult.sent
        log.channels.push.failed = pushResult.failed
        log.channels.push.sentAt = new Date()

        results.push = pushResult
      } catch (error) {
        log.channels.push.success = false
        log.channels.push.sent = 0
        log.channels.push.failed = 1
        results.push = { success: false, error: error.message }
        logger.error('Push notification failed:', error.message)
      }
    }

    // Save log
    await log.save()

    return {
      success: log.status !== 'failed',
      status: log.status,
      logId: log._id,
      results
    }
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmation(booking, recipient, partnerId) {
    const data = {
      bookingNumber: booking.bookingNumber,
      hotelName: booking.hotelName || booking.hotel?.name?.tr || booking.hotel?.name?.en,
      checkIn: this.formatDate(booking.checkIn),
      checkOut: this.formatDate(booking.checkOut),
      totalPrice: this.formatPrice(booking.totalPrice, booking.currency),
      bookingUrl: `${config.frontendUrl}/bookings/${booking._id}`
    }

    return this.send({
      type: 'booking_confirmation',
      recipient,
      data,
      partnerId,
      relatedTo: { model: 'Booking', id: booking._id }
    })
  }

  /**
   * Send booking cancellation notification
   */
  async sendBookingCancellation(booking, recipient, partnerId, reason) {
    const data = {
      bookingNumber: booking.bookingNumber,
      hotelName: booking.hotelName || booking.hotel?.name?.tr || booking.hotel?.name?.en,
      checkIn: this.formatDate(booking.checkIn),
      checkOut: this.formatDate(booking.checkOut),
      reason
    }

    return this.send({
      type: 'booking_cancelled',
      recipient,
      data,
      partnerId,
      relatedTo: { model: 'Booking', id: booking._id }
    })
  }

  /**
   * Send payment reminder notification
   */
  async sendPaymentReminder(booking, recipient, partnerId) {
    const data = {
      bookingNumber: booking.bookingNumber,
      hotelName: booking.hotelName || booking.hotel?.name?.tr,
      amount: booking.remainingBalance || booking.totalPrice,
      currency: booking.currency,
      dueDate: this.formatDate(booking.paymentDueDate || booking.checkIn)
    }

    return this.send({
      type: 'payment_reminder',
      recipient,
      data,
      partnerId,
      relatedTo: { model: 'Booking', id: booking._id }
    })
  }

  /**
   * Send check-in reminder notification
   */
  async sendCheckinReminder(booking, recipient, partnerId) {
    const data = {
      bookingNumber: booking.bookingNumber,
      hotelName: booking.hotelName || booking.hotel?.name?.tr,
      checkIn: this.formatDate(booking.checkIn),
      checkInTime: booking.checkInTime || '14:00'
    }

    return this.send({
      type: 'checkin_reminder',
      recipient,
      data,
      partnerId,
      relatedTo: { model: 'Booking', id: booking._id }
    })
  }

  /**
   * Get email subject for notification type
   */
  getEmailSubject(type, data) {
    const subjects = {
      booking_confirmation: `Rezervasyon Onayı - ${data.bookingNumber}`,
      booking_cancelled: `Rezervasyon İptali - ${data.bookingNumber}`,
      booking_modified: `Rezervasyon Güncellendi - ${data.bookingNumber}`,
      payment_reminder: `Ödeme Hatırlatması - ${data.bookingNumber}`,
      checkin_reminder: `Check-in Hatırlatması - ${data.hotelName}`,
      welcome: 'Hoş Geldiniz - Booking Platform',
      password_reset: 'Şifre Sıfırlama Talebi',
      '2fa_setup': 'İki Faktörlü Doğrulama Kurulumu'
    }

    return subjects[type] || 'Bildirim'
  }

  /**
   * Get push notification body
   */
  getPushBody(type, data) {
    const bodies = {
      booking_confirmation: `${data.hotelName} otelinde ${data.checkIn} - ${data.checkOut} tarihleri için rezervasyonunuz onaylandı.`,
      booking_cancelled: `${data.hotelName} otelindeki rezervasyonunuz iptal edildi.`,
      booking_modified: `${data.hotelName} rezervasyonunuz güncellendi.`,
      payment_reminder: `${data.bookingNumber} rezervasyonu için ${data.amount} ${data.currency} ödeme bekleniyor.`,
      checkin_reminder: `Yarın ${data.hotelName} otelinde konaklamanız başlıyor.`
    }

    return bodies[type] || data.body || ''
  }

  /**
   * Render email template (placeholder - will be enhanced with Maizzle)
   */
  async renderEmailTemplate(type, data) {
    // For now, use the existing renderEmailTemplate from emailTemplates.js
    try {
      const { renderEmailTemplate } = await import('../helpers/emailTemplates.js')
      return await renderEmailTemplate(type, data)
    } catch {
      // Fallback to basic HTML
      return `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Bildirim</h1>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
      `
    }
  }

  /**
   * Format date for display
   */
  formatDate(date) {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  /**
   * Format price for display
   */
  formatPrice(amount, currency = 'TRY') {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency
    }).format(amount)
  }
}

// Export singleton
const notificationService = new NotificationService()
export default notificationService

export { NotificationService }
