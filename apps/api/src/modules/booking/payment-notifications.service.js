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
  const recipientEmail = booking?.contact?.email || booking?.leadGuest?.email
  if (!recipientEmail) {
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

    // Load partner for branding
    let partner = null
    const partnerId = booking.partner?._id || booking.partner
    if (partnerId) {
      try {
        const { default: Partner } = await import('../partner/partner.model.js')
        partner = await Partner.findById(partnerId)
          .select('companyName email address branding')
          .lean()
      } catch (err) {
        logger.warn('[PaymentNotification] Failed to load partner:', err.message)
      }
    }

    // Branding variables (partner override → platform defaults)
    const companyName = partner?.companyName || process.env.PLATFORM_NAME || 'MaxiRez'
    const supportEmail = partner?.email || process.env.SUPPORT_EMAIL || 'destek@maxirez.com'
    const siteUrl = partner?.branding?.siteDomain
      ? `https://${partner.branding.siteDomain}`
      : process.env.FRONTEND_URL || 'https://app.maxirez.com'

    let logoUrl = ''
    if (partner?.branding?.logo) {
      logoUrl = partner.branding.logo.startsWith('http')
        ? partner.branding.logo
        : `${config.apiUrl}${partner.branding.logo.startsWith('/') ? '' : '/'}${partner.branding.logo}`
    }

    const companyAddress = partner?.address
      ? `${partner.address.street || ''}, ${partner.address.city || ''} ${partner.address.postalCode || ''}`
          .trim()
          .replace(/^,\s*|,\s*$/g, '')
      : ''

    // Format amount
    const currencySymbol =
      { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }[payment.currency] || payment.currency
    const formattedAmount = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(
      payment.amount
    )

    // Payment type display
    const paymentTypeLabels = {
      credit_card: 'Kredi Kartı',
      bank_transfer: 'Banka Havalesi',
      pay_at_hotel: 'Otelde Ödeme'
    }

    // Refund reason section HTML (only for refund)
    let refundReasonSection = ''
    if (eventType === 'refunded' && payment.refund?.reason) {
      refundReasonSection = `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fefce8;border-radius:12px;border-left:4px solid #eab308;margin-bottom:24px;" role="none">
<tr><td style="padding:16px 20px;">
<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#854d0e;text-transform:uppercase;letter-spacing:0.5px;">İade Nedeni</p>
<p style="margin:0;font-size:14px;color:#92400e;">${payment.refund.reason}</p>
</td></tr>
</table>`
    }

    const subjects = {
      completed: `Ödemeniz Alındı - ${companyName}`,
      failed: `Ödeme Başarısız - ${companyName}`,
      refunded: `İade İşleminiz Tamamlandı - ${companyName}`
    }

    await notificationService.send({
      type: notificationType,
      recipient: {
        email: recipientEmail,
        name:
          `${booking.leadGuest?.firstName || ''} ${booking.leadGuest?.lastName || ''}`.trim() ||
          'Guest',
        phone: booking.contact?.phone || booking.leadGuest?.phone
      },
      data: {
        subject: subjects[eventType],
        // Branding (partner override)
        COMPANY_NAME: companyName,
        SUPPORT_EMAIL: supportEmail,
        SITE_URL: siteUrl,
        COMPANY_ADDRESS: companyAddress,
        ...(logoUrl && { LOGO_URL: logoUrl }),
        // Payment data
        CUSTOMER_NAME:
          `${booking.leadGuest?.firstName || ''} ${booking.leadGuest?.lastName || ''}`.trim() ||
          'Misafir',
        BOOKING_NUMBER: booking.bookingNumber,
        AMOUNT: `${currencySymbol}${formattedAmount}`,
        CURRENCY: payment.currency,
        PAYMENT_TYPE: payment.type,
        PAYMENT_TYPE_DISPLAY: paymentTypeLabels[payment.type] || payment.type,
        PAYMENT_DATE: new Date().toLocaleDateString('tr-TR'),
        HOTEL_NAME: booking.hotelName,
        CHECK_IN: new Date(booking.checkIn).toLocaleDateString('tr-TR'),
        CHECK_OUT: new Date(booking.checkOut).toLocaleDateString('tr-TR'),
        // Refund specific
        REFUND_AMOUNT: payment.refund?.amount
          ? `${currencySymbol}${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(payment.refund.amount)}`
          : formattedAmount
            ? `${currencySymbol}${formattedAmount}`
            : '',
        REFUND_REASON_SECTION: refundReasonSection
      },
      channels: ['email'],
      partnerId,
      relatedTo: { model: 'Payment', id: payment._id }
    })

    logger.info('[PaymentNotification] Sent:', {
      type: notificationType,
      paymentId: payment._id,
      email: recipientEmail
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
