/**
 * Payment Notifications Service
 *
 * Centralized notification functions for payment-related events.
 * This file exists to break circular dependencies between:
 * - payment.service.js
 * - paymentLink.service.js
 * - paymentWebhook.routes.js
 *
 * All payment notification functions should be imported from here.
 */

import config from '#config'
import logger from '#core/logger.js'
import notificationService from '#services/notificationService.js'
import ShortUrl from '../shortUrl/shortUrl.model.js'

/**
 * Send payment notification to customer (for booking payments)
 * Used when a payment is completed, failed, or refunded
 *
 * @param {Object} payment - Payment document
 * @param {Object} booking - Booking document with leadGuest populated
 * @param {string} eventType - 'completed' | 'failed' | 'refunded'
 */
export async function sendPaymentNotification(payment, booking, eventType) {
  if (!booking?.leadGuest?.email) {
    logger.warn('[PaymentNotification] No email for notification:', { bookingId: booking?._id })
    return
  }

  try {
    const notificationTypes = {
      completed: 'payment_completed',
      failed: 'payment_failed',
      refunded: 'payment_refunded'
    }

    const notificationType = notificationTypes[eventType]
    if (!notificationType) return

    // Format amount
    const currencySymbol =
      { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }[payment.currency] || payment.currency
    const formattedAmount = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(
      payment.amount
    )

    await notificationService.send({
      type: notificationType,
      recipient: {
        email: booking.leadGuest.email,
        name: `${booking.leadGuest.firstName} ${booking.leadGuest.lastName}`,
        phone: booking.leadGuest.phone
      },
      data: {
        subject:
          eventType === 'completed'
            ? 'Ödemeniz Alındı'
            : eventType === 'failed'
              ? 'Ödeme Başarısız'
              : 'İade İşleminiz Tamamlandı',
        CUSTOMER_NAME: `${booking.leadGuest.firstName} ${booking.leadGuest.lastName}`,
        BOOKING_NUMBER: booking.bookingNumber,
        AMOUNT: `${currencySymbol}${formattedAmount}`,
        CURRENCY: payment.currency,
        PAYMENT_TYPE: payment.type,
        PAYMENT_DATE: new Date().toLocaleDateString('tr-TR'),
        HOTEL_NAME: booking.hotelName,
        CHECK_IN: new Date(booking.checkIn).toLocaleDateString('tr-TR'),
        CHECK_OUT: new Date(booking.checkOut).toLocaleDateString('tr-TR'),
        // Refund specific
        REFUND_AMOUNT: payment.refund?.amount
          ? `${currencySymbol}${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(payment.refund.amount)}`
          : null,
        REFUND_REASON: payment.refund?.reason
      },
      channels: ['email'],
      partnerId: booking.partner,
      relatedTo: { model: 'Payment', id: payment._id }
    })

    logger.info('[PaymentNotification] Sent:', {
      type: notificationType,
      paymentId: payment._id,
      email: booking.leadGuest.email
    })
  } catch (error) {
    logger.error('[PaymentNotification] Failed:', error.message)
  }
}

/**
 * Send payment link notification to customer
 * Used when a payment link is created or resent
 *
 * @param {Object} paymentLink - PaymentLink document
 * @param {Object} partner - Partner document (optional)
 * @param {Object} channels - { email: boolean, sms: boolean }
 */
export async function sendPaymentLinkNotification(paymentLink, partner, channels = {}) {
  const { email = true, sms = false } = channels
  const result = { email: null, sms: null }

  // Default company info for platform-level links
  const companyName = partner?.companyName || process.env.PLATFORM_NAME || 'MaxiRez'
  const companyLogo = partner?.branding?.logo || null

  // Format amount and currency
  const formattedAmount = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(
    paymentLink.amount
  )
  const currencySymbol =
    { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }[paymentLink.currency] || paymentLink.currency
  const formattedExpiry = new Date(paymentLink.expiresAt).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  // Site ve support bilgileri
  const siteUrl =
    partner?.branding?.website || process.env.FRONTEND_URL || 'https://app.maxirez.com'
  const supportEmail = partner?.supportEmail || process.env.SUPPORT_EMAIL || 'destek@maxirez.com'

  // Logo URL - tam URL olmalı
  let logoUrl = ''
  if (companyLogo) {
    if (companyLogo.startsWith('http')) {
      logoUrl = companyLogo
    } else {
      logoUrl = `${config.apiUrl}${companyLogo}`
    }
  }

  const notificationData = {
    // Template labels (Turkish)
    LANG: 'tr',
    PAYMENT_LINK_TITLE: 'Ödeme Linki',
    PAYMENT_LINK_SUBTITLE: 'Size bir ödeme talebi gönderildi',
    PAYMENT_LINK_PREVIEW: `${companyName} - Ödeme Talebi`,
    PAYMENT_LINK_GREETING: 'Merhaba',
    PAYMENT_LINK_MESSAGE: 'Aşağıdaki ödeme talebini gerçekleştirmek için butona tıklayın.',
    PAYMENT_DETAILS_LABEL: 'Ödeme Detayları',
    DESCRIPTION_LABEL: 'Açıklama',
    AMOUNT_LABEL: 'Tutar',
    EXPIRY_WARNING_LABEL: 'Bu link şu tarihe kadar geçerlidir',
    PAY_NOW_BUTTON: 'Şimdi Öde',
    ALTERNATIVE_TEXT: 'Buton çalışmıyorsa aşağıdaki linki kullanın:',
    SECURITY_NOTE_LABEL: 'Güvenlik Notu',
    SECURITY_NOTE:
      'Ödeme işlemi 3D Secure ile güvence altındadır. Kart bilgileriniz şifreli olarak iletilir.',
    HELP_TEXT: 'Yardıma mı ihtiyacınız var? Bize ulaşın:',
    FOOTER_TEXT: 'Bu e-posta bir ödeme talebi içermektedir.',
    COMPANY_ADDRESS: '',
    UNSUBSCRIBE_URL: '#',
    UNSUBSCRIBE_TEXT: 'Abonelikten çık',

    // Dynamic data
    CUSTOMER_NAME: paymentLink.customer.name,
    DESCRIPTION: paymentLink.description,
    AMOUNT: `${currencySymbol}${formattedAmount}`,
    CURRENCY: '', // Already included in AMOUNT with symbol
    PAYMENT_URL: paymentLink.paymentUrl,
    EXPIRY_DATE: formattedExpiry,
    COMPANY_NAME: companyName,
    LOGO_URL: logoUrl,
    SITE_URL: siteUrl,
    SUPPORT_EMAIL: supportEmail,

    // Küçük harfli değişkenler (SMS için)
    customerName: paymentLink.customer.name,
    description: paymentLink.description,
    amount: paymentLink.amount,
    currency: paymentLink.currency,
    paymentUrl: paymentLink.paymentUrl,
    expiresAt: paymentLink.expiresAt,
    companyName,
    companyLogo
  }

  // Send email notification
  if (email && paymentLink.customer.email) {
    try {
      const emailResult = await notificationService.send({
        type: 'payment_link',
        recipient: {
          email: paymentLink.customer.email,
          name: paymentLink.customer.name
        },
        data: {
          subject: `Ödeme Linki - ${companyName}`,
          ...notificationData
        },
        channels: ['email'],
        partnerId: partner?._id,
        relatedTo: { model: 'PaymentLink', id: paymentLink._id }
      })

      result.email = emailResult
      await paymentLink.recordNotification('email')
    } catch (error) {
      logger.error('[PaymentLinkNotification] Email failed:', error.message)
      result.email = { success: false, error: error.message }
    }
  }

  // Send SMS notification with SHORT URL
  if (sms && paymentLink.customer.phone) {
    try {
      // SMS için kısa URL oluştur
      const shortUrl = await ShortUrl.createShortUrl({
        originalUrl: paymentLink.paymentUrl,
        type: 'payment_link',
        relatedId: paymentLink._id,
        partner: partner?._id,
        expiresAt: paymentLink.expiresAt
      })

      logger.info('[PaymentLinkNotification] Short URL created:', {
        linkNumber: paymentLink.linkNumber,
        shortUrl: shortUrl.shortUrl
      })

      // SMS için kısa URL'li data
      const smsData = {
        ...notificationData,
        paymentUrl: shortUrl.shortUrl // Kısa URL kullan
      }

      const smsResult = await notificationService.send({
        type: 'payment_link',
        recipient: {
          phone: paymentLink.customer.phone,
          name: paymentLink.customer.name
        },
        data: smsData,
        channels: ['sms'],
        partnerId: partner?._id,
        relatedTo: { model: 'PaymentLink', id: paymentLink._id }
      })

      result.sms = smsResult
      await paymentLink.recordNotification('sms')
    } catch (error) {
      logger.error('[PaymentLinkNotification] SMS failed:', error.message)
      result.sms = { success: false, error: error.message }
    }
  }

  return result
}
