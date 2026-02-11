import config from '../../config/index.js'
import logger from '../../core/logger.js'
import { renderEmailTemplate, htmlToText, TEMPLATE_LABELS } from '../emailTemplates.js'
import { sendEmail, sendEmailWithAttachments } from './core.js'
import { getAdminUrl } from './transporter.js'

/**
 * Get email branding variables from PlatformSettings (base) and Partner (override)
 * Priority: Partner fields > PlatformSettings fields > TEMPLATE_LABELS defaults
 */
const getEmailBranding = async partnerId => {
  const result = { SITE_URL: config.adminUrl }

  // 1) Load platform defaults from PlatformSettings
  try {
    const { default: PlatformSettings } =
      await import('../../modules/platform-settings/platformSettings.model.js')
    const settings = await PlatformSettings.getSettings()
    if (settings) {
      const companyName = settings.billing?.companyName
      if (companyName && companyName !== 'Platform Company') result.COMPANY_NAME = companyName
      if (settings.billing?.email) result.SUPPORT_EMAIL = settings.billing.email

      const addr = settings.billing?.address
      if (addr?.city) {
        result.COMPANY_ADDRESS = addr.country ? `${addr.city}, ${addr.country}` : addr.city
      }
    }
  } catch (error) {
    logger.warn('Failed to load platform branding:', error.message)
  }

  // 2) Override with partner-specific branding if partnerId provided
  if (partnerId) {
    try {
      const { default: Partner } = await import('../../modules/partner/partner.model.js')
      const partner = await Partner.findById(partnerId)
        .select('companyName branding address email')
        .lean()
      if (partner) {
        if (partner.companyName) result.COMPANY_NAME = partner.companyName
        if (partner.email) result.SUPPORT_EMAIL = partner.email

        if (partner.address?.city) {
          result.COMPANY_ADDRESS = partner.address.country
            ? `${partner.address.city}, ${partner.address.country}`
            : partner.address.city
        }

        if (partner.branding?.logo) {
          result.LOGO_URL = `${config.apiUrl}${partner.branding.logo}`
        }

        if (partner.branding?.extranetDomain) {
          result.SITE_URL = `https://${partner.branding.extranetDomain}`
        }
      }
    } catch (error) {
      logger.warn('Failed to load partner branding:', error.message)
    }
  }

  return result
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
  const labels = TEMPLATE_LABELS[language] || TEMPLATE_LABELS.tr
  const subject = language === 'tr' ? "Booking Engine'e Hoş Geldiniz" : 'Welcome to Booking Engine'

  // Get branding from PlatformSettings (base) + Partner (override)
  const brandingVars = await getEmailBranding(partnerId)

  const html = await renderEmailTemplate(
    'welcome',
    {
      // Dynamic values
      USER_NAME: name,
      USER_EMAIL: email,
      PASSWORD: password,
      ACCOUNT_TYPE: accountType,
      DASHBOARD_URL: loginUrl || brandingVars.SITE_URL,
      TITLE: language === 'tr' ? 'Hoş Geldiniz' : 'Welcome',
      PREVIEW_TEXT:
        language === 'tr' ? 'Hesabınız başarıyla oluşturuldu' : 'Your account has been created',
      ...brandingVars
    },
    language
  )

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
  const labels = TEMPLATE_LABELS[language] || TEMPLATE_LABELS.tr

  const subject =
    language === 'tr'
      ? 'İki Faktörlü Doğrulama Etkinleştirildi'
      : 'Two-Factor Authentication Enabled'

  const brandingVars = await getEmailBranding(partnerId)

  // Format backup codes as a string
  const formattedCodes = Array.isArray(backupCodes) ? backupCodes.join('\n') : backupCodes

  const html = await renderEmailTemplate(
    '2fa-setup',
    {
      TITLE: labels.TWO_FA_TITLE,
      SUBTITLE: labels.TWO_FA_SUBTITLE,
      USER_NAME: name,
      BACKUP_CODES: formattedCodes,
      SECURITY_URL: securityUrl || `${brandingVars.SITE_URL}/settings/security`,
      PREVIEW_TEXT: labels.TWO_FA_SUBTITLE,
      ...brandingVars
    },
    language
  )

  const text = htmlToText(html)

  return sendEmail({ to, subject, html, text, partnerId, type: '2fa-setup' })
}

/**
 * Send account activation email (for new users to set their password)
 */
export const sendActivationEmail = async ({
  to,
  name,
  inviterName,
  accountName,
  userRole = 'Kullanıcı',
  token,
  partnerId,
  language = 'tr',
  partnerCity = ''
}) => {
  const baseUrl = await getAdminUrl(partnerId)
  const activationUrl = `${baseUrl}/activate/${token}`

  const brandingVars = await getEmailBranding(partnerId)
  if (accountName) brandingVars.COMPANY_NAME = accountName
  if (partnerCity) brandingVars.COMPANY_ADDRESS = partnerCity
  brandingVars.SITE_URL = baseUrl

  try {
    const html = await renderEmailTemplate(
      'activation',
      {
        USER_NAME: name,
        USER_EMAIL: to,
        INVITER_NAME: inviterName,
        ACCOUNT_NAME: accountName,
        USER_ROLE: userRole,
        ACTIVATION_URL: activationUrl,
        TITLE: language === 'tr' ? 'Hesap Aktivasyonu' : 'Account Activation',
        PREVIEW_TEXT:
          language === 'tr'
            ? 'Hesabınızı aktifleştirmek için tıklayın'
            : 'Click to activate your account',
        ...brandingVars
      },
      language
    )

    const text = htmlToText(html)
    const subject =
      language === 'tr'
        ? 'Hesabınızı Aktifleştirin - Booking Engine'
        : 'Activate Your Account - Booking Engine'

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
  const subject =
    language === 'tr'
      ? `Rezervasyon Onayı - ${bookingNumber}`
      : `Booking Confirmation - ${bookingNumber}`

  const brandingVars = await getEmailBranding(partnerId)

  const html = await renderEmailTemplate(
    'booking-confirmation',
    {
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
      GUEST_NAME: guestName || '',
      GUEST_EMAIL: guestEmail || to,
      GUEST_PHONE: guestPhone || '',
      BOOKING_URL: bookingUrl,
      TITLE: language === 'tr' ? 'Rezervasyon Onayı' : 'Booking Confirmation',
      PREVIEW_TEXT:
        language === 'tr'
          ? `Rezervasyonunuz onaylandı - ${bookingNumber}`
          : `Your booking is confirmed - ${bookingNumber}`,
      ...brandingVars
    },
    language
  )

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
  const labels = TEMPLATE_LABELS[language] || TEMPLATE_LABELS.tr

  const subject =
    language === 'tr'
      ? `Rezervasyon İptal Edildi - ${bookingNumber}`
      : `Booking Cancelled - ${bookingNumber}`

  const brandingVars = await getEmailBranding(partnerId)

  const html = await renderEmailTemplate(
    'booking-cancelled',
    {
      TITLE: labels.CANCELLED_TITLE,
      SUBTITLE: labels.CANCELLED_SUBTITLE,
      BOOKING_NUMBER: bookingNumber,
      HOTEL_NAME: hotelName,
      CHECKIN_DATE: checkIn,
      CHECKOUT_DATE: checkOut,
      CANCELLED_AT:
        cancelledAt || new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'),
      CANCELLATION_REASON: reason || '',
      ORIGINAL_AMOUNT: originalAmount || '',
      CANCELLATION_FEE: cancellationFee || '',
      REFUND_AMOUNT: refundAmount || '',
      NEW_BOOKING_URL: newBookingUrl || brandingVars.SITE_URL,
      PREVIEW_TEXT:
        language === 'tr'
          ? `Rezervasyonunuz iptal edildi - ${bookingNumber}`
          : `Your booking has been cancelled - ${bookingNumber}`,
      ...brandingVars
    },
    language
  )

  const text = htmlToText(html)

  return sendEmail({ to, subject, html, text, partnerId, type: 'booking-cancelled' })
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async ({
  to,
  name,
  resetUrl,
  partnerId,
  language = 'tr'
}) => {
  const labels = TEMPLATE_LABELS[language] || TEMPLATE_LABELS.tr
  const subject = language === 'tr' ? 'Şifre Sıfırlama Talebi' : 'Password Reset Request'

  const brandingVars = await getEmailBranding(partnerId)

  const html = await renderEmailTemplate(
    'password-reset',
    {
      TITLE: labels.PASSWORD_RESET_TITLE,
      SUBTITLE: labels.PASSWORD_RESET_SUBTITLE,
      DESCRIPTION: labels.PASSWORD_RESET_DESC,
      RESET_BUTTON: labels.RESET_BUTTON,
      ALTERNATIVE_TEXT: labels.ALTERNATIVE_TEXT,
      EXPIRY_WARNING: labels.EXPIRY_WARNING,
      SECURITY_NOTE: labels.SECURITY_NOTE,
      RESET_URL: resetUrl,
      USER_NAME: name,
      PREVIEW_TEXT: labels.PASSWORD_RESET_SUBTITLE,
      ...brandingVars
    },
    language
  )

  const text = htmlToText(html)

  return sendEmail({ to, subject, html, text, partnerId, type: 'password-reset' })
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

/**
 * Send Issue Nudge Email
 * Sends a reminder/notification email about an issue
 */
export const sendIssueNudgeEmail = async ({
  to,
  recipientName,
  senderName,
  issueNumber,
  issueTitle,
  issueUrl,
  message,
  language = 'tr'
}) => {
  const isEn = language === 'en'

  const subject = isEn
    ? `[${issueNumber}] Reminder: ${issueTitle}`
    : `[${issueNumber}] Hatırlatma: ${issueTitle}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px; }
        .content { padding: 30px; }
        .issue-box { background: #f8fafc; border-left: 4px solid #7c3aed; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .issue-number { color: #6b7280; font-size: 13px; font-family: monospace; }
        .issue-title { color: #1f2937; font-size: 18px; font-weight: 600; margin-top: 5px; }
        .message-box { background: #fef3c7; border-radius: 8px; padding: 15px 20px; margin: 20px 0; }
        .message-label { color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
        .message-text { color: #78350f; font-size: 15px; line-height: 1.5; }
        .btn { display: inline-block; background: #7c3aed; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .btn:hover { background: #6d28d9; }
        .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .sender-info { color: #6b7280; font-size: 14px; margin-bottom: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 ${isEn ? 'Issue Reminder' : 'Talep Hatırlatması'}</h1>
          <p>${isEn ? 'You have a pending issue that needs attention' : 'Dikkatinizi bekleyen bir talep var'}</p>
        </div>
        <div class="content">
          <p>${isEn ? 'Hi' : 'Merhaba'} ${recipientName},</p>

          <p class="sender-info">
            <strong>${senderName}</strong> ${isEn ? 'sent you a reminder about this issue:' : 'bu talep hakkında size bir hatırlatma gönderdi:'}
          </p>

          <div class="issue-box">
            <div class="issue-number">${issueNumber}</div>
            <div class="issue-title">${issueTitle}</div>
          </div>

          ${
            message
              ? `
          <div class="message-box">
            <div class="message-label">${isEn ? 'Message' : 'Mesaj'}</div>
            <div class="message-text">${message}</div>
          </div>
          `
              : ''
          }

          <div style="text-align: center;">
            <a href="${issueUrl}" class="btn">${isEn ? 'View Issue' : 'Talebi Görüntüle'}</a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            ${
              isEn
                ? 'This email was sent because someone wanted to remind you about this issue.'
                : 'Bu e-posta, birisi bu talep hakkında sizi bilgilendirmek istediği için gönderildi.'
            }
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Booking Engine
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to,
    subject,
    html,
    type: 'issue-nudge'
  })
}

/**
 * Send notification to platform admins about a new partner registration
 */
export const sendNewPartnerNotification = async ({
  partnerName,
  partnerEmail,
  partnerPhone,
  partnerType,
  contactName,
  language = 'tr'
}) => {
  const { default: User } = await import('../../modules/user/user.model.js')

  // Find platform admin users
  const admins = await User.find({
    accountType: 'platform',
    role: 'admin',
    status: 'active'
  })
    .select('email')
    .lean()

  if (!admins.length) {
    logger.warn('No platform admins found to notify about new partner registration')
    return
  }

  const labels = TEMPLATE_LABELS[language] || TEMPLATE_LABELS.tr
  const partnerTypeLabel =
    partnerType === 'hotel' ? labels.PARTNER_TYPE_HOTEL : labels.PARTNER_TYPE_AGENCY
  const submittedAt = new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const subject = `${labels.NEW_PARTNER_TITLE}: ${partnerName}`
  const reviewUrl = `${config.adminUrl}/partners`

  const html = await renderEmailTemplate(
    'new-partner-notification',
    {
      NEW_PARTNER_TITLE: labels.NEW_PARTNER_TITLE,
      NEW_PARTNER_SUBTITLE: labels.NEW_PARTNER_SUBTITLE,
      PARTNER_INFO_TITLE: labels.PARTNER_INFO_TITLE,
      PARTNER_NAME_LABEL: labels.PARTNER_NAME_LABEL,
      PARTNER_EMAIL_LABEL: labels.PARTNER_EMAIL_LABEL,
      PARTNER_PHONE_LABEL: labels.PARTNER_PHONE_LABEL,
      PARTNER_TYPE_LABEL: labels.PARTNER_TYPE_LABEL,
      CONTACT_NAME_LABEL: labels.CONTACT_NAME_LABEL,
      SUBMITTED_AT_LABEL: labels.SUBMITTED_AT_LABEL,
      REVIEW_BUTTON: labels.REVIEW_BUTTON,
      NEW_PARTNER_FOOTER_NOTE: labels.NEW_PARTNER_FOOTER_NOTE,
      PARTNER_NAME: partnerName,
      PARTNER_EMAIL: partnerEmail,
      PARTNER_PHONE: partnerPhone,
      PARTNER_TYPE: partnerTypeLabel,
      CONTACT_NAME: contactName,
      SUBMITTED_AT: submittedAt,
      REVIEW_URL: reviewUrl,
      PREVIEW_TEXT: `${labels.NEW_PARTNER_SUBTITLE} - ${partnerName}`,
      TITLE: labels.NEW_PARTNER_TITLE
    },
    language
  )

  const text = htmlToText(html)
  const adminEmails = admins.map(a => a.email)

  return sendEmail({
    to: adminEmails,
    subject,
    html,
    text,
    type: 'new-partner-notification'
  })
}
