/**
 * Booking Email Service
 * Email preview and send operations for bookings
 */

import { asyncHandler } from '#helpers'
import { NotFoundError, ValidationError } from '#core/errors.js'
import Booking from './booking.model.js'
import Hotel from '#modules/hotel/hotel.model.js'
import PlatformSettings from '#modules/platform-settings/platformSettings.model.js'
import Partner from '#modules/partner/partner.model.js'
import User from '#modules/user/user.model.js'
import { renderEmailTemplate, TEMPLATE_LABELS } from '#helpers/emailTemplates.js'
import { sendEmail, sendBookingConfirmation } from '#helpers/mail.js'
import notificationService from '#services/notificationService.js'
import logger from '#core/logger.js'
import config from '#config'
import { formatDateLocale, formatCurrency } from '@booking-engine/utils'

/**
 * Get email preview HTML
 * GET /api/bookings/:id/email-preview/:type
 */
export const previewBookingEmail = asyncHandler(async (req, res) => {
  const { id, type } = req.params
  const { language = 'tr' } = req.query

  // Validate email type
  const validTypes = ['confirmation', 'payment_reminder', 'hotel_notification', 'checkin_reminder']
  if (!validTypes.includes(type)) {
    throw new ValidationError(`Invalid email type. Valid types: ${validTypes.join(', ')}`)
  }

  // Get booking with hotel and partner details
  const booking = await Booking.findById(id)
    .populate('hotel', 'name address contact policies')
    .populate('partner', 'companyName email address branding')
    .lean()

  if (!booking) {
    throw new NotFoundError('Booking not found')
  }

  // Build template data based on type
  const templateData = await buildEmailTemplateData(booking, type, language)

  // Get template name based on type
  const templateName = getTemplateName(type)

  // Render email HTML
  const html = await renderEmailTemplate(templateName, templateData, language)

  res.json({
    success: true,
    data: {
      html,
      subject: getEmailSubject(type, booking, language),
      recipient: getDefaultRecipient(type, booking),
      type
    }
  })
})

/**
 * Send booking email
 * POST /api/bookings/:id/send-email
 */
export const sendBookingEmail = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { type, recipient, customEmail, language = 'tr', sendCopy = false } = req.body

  // Validate email type
  const validTypes = ['confirmation', 'payment_reminder', 'hotel_notification', 'checkin_reminder']
  if (!validTypes.includes(type)) {
    throw new ValidationError(`Invalid email type. Valid types: ${validTypes.join(', ')}`)
  }

  // Get booking with hotel and partner details
  const booking = await Booking.findById(id)
    .populate('hotel', 'name address contact policies notifications')
    .populate('partner', 'companyName email address branding')
    .lean()

  if (!booking) {
    throw new NotFoundError('Booking not found')
  }

  // Determine recipient email
  let toEmail = customEmail

  if (!toEmail) {
    if (recipient === 'guest') {
      toEmail = booking.contact?.email
    } else if (recipient === 'hotel') {
      toEmail = booking.hotel?.notifications?.email || booking.hotel?.contact?.email
    }
  }

  if (!toEmail) {
    throw new ValidationError('No recipient email address available')
  }

  // Build template data
  const templateData = await buildEmailTemplateData(booking, type, language)
  const templateName = getTemplateName(type)
  const subject = getEmailSubject(type, booking, language)

  // Render email HTML
  const html = await renderEmailTemplate(templateName, templateData, language)

  // Send email
  const result = await sendEmail({
    to: toEmail,
    subject,
    html,
    partnerId: booking.partner,
    type: `booking-${type}`,
    metadata: {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      emailType: type,
      sentBy: req.user._id
    }
  })

  // Optionally send copy to admin
  if (sendCopy && req.user.email && req.user.email !== toEmail) {
    try {
      await sendEmail({
        to: req.user.email,
        subject: `[Copy] ${subject}`,
        html,
        partnerId: booking.partner,
        type: `booking-${type}-copy`
      })
    } catch (error) {
      logger.warn('Failed to send copy email:', error.message)
    }
  }

  res.json({
    success: true,
    message: 'Email sent successfully',
    data: {
      messageId: result.messageId,
      recipient: toEmail,
      type
    }
  })
})

/**
 * Update guest info (inline edit)
 * PATCH /api/bookings/:id/guest-info
 */
export const updateGuestInfo = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updates = req.body

  const booking = await Booking.findById(id)

  if (!booking) {
    throw new NotFoundError('Booking not found')
  }

  // Check if booking can be edited
  if (['cancelled', 'completed', 'no_show'].includes(booking.status)) {
    throw new ValidationError('Cannot update guest info for finalized bookings')
  }

  // Allowed fields for inline edit
  const allowedLeadGuestFields = [
    'firstName',
    'lastName',
    'title',
    'nationality',
    'tcNumber',
    'passportNumber'
  ]
  const allowedContactFields = ['email', 'phone', 'alternativePhone']
  const allowedBookingFields = ['guestLanguage', 'specialRequests']

  const changes = []

  // Update lead guest fields
  if (updates.leadGuest) {
    for (const [key, value] of Object.entries(updates.leadGuest)) {
      if (allowedLeadGuestFields.includes(key)) {
        const oldValue = booking.leadGuest?.[key]
        if (oldValue !== value) {
          if (!booking.leadGuest) booking.leadGuest = {}
          booking.leadGuest[key] = value
          changes.push({ field: `leadGuest.${key}`, from: oldValue, to: value })
        }
      }
    }
  }

  // Update contact fields
  if (updates.contact) {
    for (const [key, value] of Object.entries(updates.contact)) {
      if (allowedContactFields.includes(key)) {
        const oldValue = booking.contact?.[key]
        if (oldValue !== value) {
          if (!booking.contact) booking.contact = {}
          booking.contact[key] = value
          changes.push({ field: `contact.${key}`, from: oldValue, to: value })
        }
      }
    }
  }

  // Update booking-level fields
  for (const [key, value] of Object.entries(updates)) {
    if (allowedBookingFields.includes(key)) {
      const oldValue = booking[key]
      if (oldValue !== value) {
        booking[key] = value
        changes.push({ field: key, from: oldValue, to: value })
      }
    }
  }

  // Update room guests
  if (updates.rooms && Array.isArray(updates.rooms)) {
    for (let i = 0; i < updates.rooms.length; i++) {
      const roomUpdate = updates.rooms[i]
      if (roomUpdate.guests && Array.isArray(roomUpdate.guests) && booking.rooms[i]) {
        for (let j = 0; j < roomUpdate.guests.length; j++) {
          const guestUpdate = roomUpdate.guests[j]
          if (booking.rooms[i].guests[j]) {
            for (const [key, value] of Object.entries(guestUpdate)) {
              if (['firstName', 'lastName', 'title', 'nationality', 'dateOfBirth'].includes(key)) {
                const oldValue = booking.rooms[i].guests[j][key]
                if (oldValue !== value) {
                  booking.rooms[i].guests[j][key] = value
                  changes.push({
                    field: `rooms[${i}].guests[${j}].${key}`,
                    from: oldValue,
                    to: value
                  })
                }
              }
            }
          }
        }
      }
    }
  }

  if (changes.length === 0) {
    return res.json({
      success: true,
      message: 'No changes detected',
      data: { changes: [] }
    })
  }

  // Add modification record
  booking.modifications.push({
    modifiedAt: new Date(),
    modifiedBy: req.user._id,
    type: 'guests',
    description: `Guest info updated: ${changes.map(c => c.field).join(', ')}`,
    previousValue: changes.reduce((acc, c) => ({ ...acc, [c.field]: c.from }), {}),
    newValue: changes.reduce((acc, c) => ({ ...acc, [c.field]: c.to }), {})
  })

  await booking.save()

  res.json({
    success: true,
    message: 'Guest info updated successfully',
    data: {
      changes,
      booking: await Booking.findById(id).lean()
    }
  })
})

// Helper functions

/**
 * Build email template data based on booking and email type
 */
async function buildEmailTemplateData(booking, type, language = 'tr') {
  const labels = TEMPLATE_LABELS[language] || TEMPLATE_LABELS.tr
  const hotel = booking.hotel || {}
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'

  // Get partner branding - if already populated use it, otherwise fetch from DB
  let partner = {}
  if (booking.partner?.companyName || booking.partner?.branding) {
    // Already populated (e.g. from .populate('partner'))
    partner = booking.partner
  } else {
    const partnerId = booking.partner?._id || booking.partner
    if (partnerId) {
      partner =
        (await Partner.findById(partnerId).select('companyName email address branding').lean()) ||
        {}
    }
  }

  // Format dates
  const checkInDate = formatDateLocale(booking.checkIn, locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const checkOutDate = formatDateLocale(booking.checkOut, locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // Format price
  const totalPrice = formatCurrency(
    booking.pricing?.grandTotal || 0,
    booking.pricing?.currency || 'TRY',
    locale
  )

  // Get room type name
  const roomType =
    booking.rooms?.[0]?.roomTypeName?.[language] ||
    booking.rooms?.[0]?.roomTypeName?.tr ||
    booking.rooms?.[0]?.roomTypeCode ||
    ''

  // Get meal plan name
  const boardType =
    booking.rooms?.[0]?.mealPlanName?.[language] ||
    booking.rooms?.[0]?.mealPlanName?.tr ||
    booking.rooms?.[0]?.mealPlanCode ||
    ''

  // Get hotel name
  const hotelName =
    typeof hotel.name === 'object'
      ? hotel.name[language] || hotel.name.tr || hotel.name.en
      : hotel.name || booking.hotelName || ''

  // Build guest name
  const guestName = booking.leadGuest
    ? `${booking.leadGuest.firstName || ''} ${booking.leadGuest.lastName || ''}`.trim()
    : ''

  // Get guest count text
  const guestCount = []
  if (booking.totalAdults) {
    guestCount.push(`${booking.totalAdults} ${language === 'tr' ? 'Yetişkin' : 'Adult'}`)
  }
  if (booking.totalChildren) {
    guestCount.push(`${booking.totalChildren} ${language === 'tr' ? 'Çocuk' : 'Child'}`)
  }

  // Base URL for booking
  const baseUrl = config.adminUrl || 'https://app.maxirez.com'
  const siteUrl = config.frontendUrl || 'https://maxirez.com'
  const bookingUrl = `${baseUrl}/bookings/${booking._id}`

  // Email title based on type
  const emailTitles = {
    tr: {
      confirmation: 'Rezervasyon Onayı',
      payment_reminder: 'Ödeme Hatırlatması',
      checkin_reminder: 'Check-in Hatırlatması',
      hotel_notification: 'Yeni Rezervasyon Bildirimi'
    },
    en: {
      confirmation: 'Booking Confirmation',
      payment_reminder: 'Payment Reminder',
      checkin_reminder: 'Check-in Reminder',
      hotel_notification: 'New Booking Notification'
    }
  }

  // Preview text for email clients
  const previewTexts = {
    tr: {
      confirmation: `${booking.bookingNumber} numaralı rezervasyonunuz onaylandı`,
      payment_reminder: `${booking.bookingNumber} için ödeme hatırlatması`,
      checkin_reminder: `Check-in günü yaklaşıyor - ${hotelName}`,
      hotel_notification: `Yeni rezervasyon: ${booking.bookingNumber}`
    },
    en: {
      confirmation: `Your booking ${booking.bookingNumber} has been confirmed`,
      payment_reminder: `Payment reminder for ${booking.bookingNumber}`,
      checkin_reminder: `Check-in day is approaching - ${hotelName}`,
      hotel_notification: `New booking: ${booking.bookingNumber}`
    }
  }

  // Common data for all templates
  const commonData = {
    // Template meta
    TITLE: emailTitles[language]?.[type] || emailTitles.tr[type],
    PREVIEW_TEXT: previewTexts[language]?.[type] || previewTexts.tr[type],
    LANG: language,

    // Site & Branding (use partner branding if available)
    SITE_URL: partner.branding?.siteDomain ? `https://${partner.branding.siteDomain}` : siteUrl,
    LOGO_URL: partner.branding?.logo
      ? `${config.apiUrl}${partner.branding.logo.startsWith('/') ? '' : '/'}${partner.branding.logo}`
      : `${siteUrl}/logo.png`,
    SUPPORT_EMAIL: partner.email || config.supportEmail || 'destek@maxirez.com',
    COMPANY_NAME: partner.companyName || labels.COMPANY_NAME || 'Booking Engine',
    COMPANY_ADDRESS: partner.address
      ? `${partner.address.street || ''}, ${partner.address.city || ''} ${partner.address.postalCode || ''}`
          .trim()
          .replace(/^,\s*|,\s*$/g, '')
      : labels.COMPANY_ADDRESS || '',

    // Booking details
    BOOKING_NUMBER: booking.bookingNumber,
    HOTEL_NAME: hotelName,
    HOTEL_ADDRESS: hotel.address?.full || hotel.address?.street || '',
    CHECKIN_DATE: checkInDate,
    CHECKOUT_DATE: checkOutDate,
    NIGHTS: booking.nights || '',
    ROOM_TYPE: roomType,
    GUESTS: guestCount.join(', '),
    BOARD_TYPE: boardType,
    TOTAL_PRICE: totalPrice,
    GUEST_NAME: guestName,
    GUEST_EMAIL: booking.contact?.email || '',
    GUEST_PHONE: booking.contact?.phone || '',
    BOOKING_URL: bookingUrl,
    STATUS: language === 'tr' ? 'Onaylandı' : 'Confirmed',

    // Spread labels from emailTemplates.js
    ...labels
  }

  // Type-specific data
  switch (type) {
    case 'payment_reminder':
      return {
        ...commonData,
        TOTAL_AMOUNT: totalPrice,
        PAID_AMOUNT: formatCurrency(
          booking.payment?.paidAmount || 0,
          booking.pricing?.currency || 'TRY',
          locale
        ),
        REMAINING_AMOUNT: formatCurrency(
          (booking.pricing?.grandTotal || 0) - (booking.payment?.paidAmount || 0),
          booking.pricing?.currency || 'TRY',
          locale
        ),
        PAYMENT_DEADLINE: checkInDate,
        PAYMENT_URL: bookingUrl
      }

    case 'checkin_reminder': {
      const daysLeft = Math.ceil((new Date(booking.checkIn) - new Date()) / (1000 * 60 * 60 * 24))
      // Build map URL - prefer coordinates for accurate directions
      const coords = hotel.address?.coordinates
      let mapUrl
      if (coords?.lat && coords?.lng) {
        // Google Maps directions URL with coordinates
        mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`
      } else {
        // Fallback to hotel name search
        mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelName)}`
      }
      return {
        ...commonData,
        CHECKIN_TIME: hotel.policies?.checkInTime || '14:00',
        CHECKOUT_TIME: hotel.policies?.checkOutTime || '12:00',
        HOTEL_PHONE: hotel.contact?.phone || '',
        MAP_URL: mapUrl,
        DAYS_LEFT: daysLeft > 0 ? daysLeft : 0
      }
    }

    case 'hotel_notification':
      return {
        ...commonData,
        TITLE: language === 'tr' ? 'Yeni Rezervasyon Bildirimi' : 'New Booking Notification',
        SUBTITLE:
          language === 'tr'
            ? `${booking.bookingNumber} numaralı yeni rezervasyon oluşturuldu`
            : `New booking ${booking.bookingNumber} has been created`
      }

    default: {
      // Build discount section HTML
      const discountSection = buildDiscountSection(booking, locale, labels)

      // For confirmation emails, add bank transfer info if payment method is bank_transfer
      if (booking.payment?.method === 'bank_transfer') {
        const bankSection = await buildBankTransferSection(booking, language)
        return {
          ...commonData,
          BANK_TRANSFER_SECTION: bankSection,
          PAYMENT_METHOD: labels.PAYMENT_METHOD_BANK_TRANSFER || 'Banka Havalesi',
          DISCOUNT_SECTION: discountSection
        }
      }
      return {
        ...commonData,
        BANK_TRANSFER_SECTION: '',
        PAYMENT_METHOD: '',
        DISCOUNT_SECTION: discountSection
      }
    }
  }
}

/**
 * Build discount section HTML for confirmation emails
 * Returns empty string if no discount applied
 */
function buildDiscountSection(booking, locale, labels) {
  const totalDiscount = booking.pricing?.totalDiscount || 0
  if (totalDiscount <= 0) return ''

  const currency = booking.pricing?.currency || 'TRY'
  const originalPrice = formatCurrency(booking.pricing?.subtotal || 0, currency, locale)
  const discountAmount = formatCurrency(totalDiscount, currency, locale)

  // Get campaign names
  const campaignNames =
    booking.rooms
      ?.flatMap(r => r.campaigns || [])
      .map(c => c.discountText || c.name)
      .filter(Boolean)
      .join(', ') || ''

  const campaignLabel = labels.LANG === 'en' ? 'Campaign' : 'Kampanya'
  const originalLabel = labels.LANG === 'en' ? 'Original Price' : 'Orijinal Fiyat'
  const discountLabel = labels.LANG === 'en' ? 'Discount' : 'İndirim'

  return `<tr><td style="padding:0 0 8px;">
<table width="100%" cellpadding="0" cellspacing="0" role="none">
<tr>
<td style="font-size:13px;color:#64748b;">${originalLabel}</td>
<td align="right" style="font-size:13px;color:#94a3b8;text-decoration:line-through;">${originalPrice}</td>
</tr>
${
  campaignNames
    ? `<tr>
<td style="font-size:13px;color:#64748b;">${campaignLabel}</td>
<td align="right"><span style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${campaignNames}</span></td>
</tr>`
    : ''
}
<tr>
<td style="font-size:13px;color:#64748b;">${discountLabel}</td>
<td align="right" style="font-size:13px;color:#ef4444;font-weight:600;">-${discountAmount}</td>
</tr>
</table>
</td></tr>`
}

/**
 * Build bank transfer HTML section for confirmation emails
 */
async function buildBankTransferSection(booking, language = 'tr') {
  try {
    const labels = TEMPLATE_LABELS[language] || TEMPLATE_LABELS.tr
    const partnerId = booking.partner?._id || booking.partner
    const bookingCurrency = booking.pricing?.currency || 'TRY'

    let bankAccounts = []
    let bankTransferDescription = {}

    // Check partner's own bank accounts first
    if (partnerId) {
      const partner = await Partner.findById(partnerId).lean()
      if (
        partner?.paymentSettings &&
        !partner.paymentSettings.usePlatformBankAccounts &&
        partner.paymentSettings.bankAccounts?.length > 0
      ) {
        bankAccounts = partner.paymentSettings.bankAccounts.filter(a => a.isActive)
        bankTransferDescription = partner.paymentSettings.bankTransferDescription || {}
      }
    }

    // Fallback to platform bank accounts
    if (bankAccounts.length === 0) {
      const settings = await PlatformSettings.getSettings()
      bankAccounts = (settings.billing?.bankAccounts || []).filter(a => a.isActive)
      bankTransferDescription = settings.billing?.bankTransferDescription || {}
    }

    if (bankAccounts.length === 0) return ''

    // Filter by booking currency - show only matching currency accounts
    const filtered = bankAccounts.filter(a => a.currency === bookingCurrency)
    if (filtered.length > 0) {
      bankAccounts = filtered
    }

    // Get description in the correct language
    const description =
      bankTransferDescription instanceof Map
        ? bankTransferDescription.get(language) || bankTransferDescription.get('tr') || ''
        : bankTransferDescription[language] || bankTransferDescription.tr || ''

    // Build compact table rows
    const accountRows = bankAccounts
      .map(
        account => `
<tr style="border-bottom:1px solid #f1f5f9;">
<td style="padding:10px 14px;vertical-align:middle;">
<p style="margin:0;font-size:14px;font-weight:600;color:#1e293b;">${account.bankName || ''}</p>
<p style="margin:2px 0 0;font-size:12px;color:#64748b;">${account.accountName || ''}</p>
</td>
<td style="padding:10px 14px;vertical-align:middle;text-align:right;">
<p style="margin:0;font-size:13px;font-weight:600;color:#1e293b;font-family:monospace;letter-spacing:0.5px;">${account.iban || ''}</p>
${account.swift ? `<p style="margin:2px 0 0;font-size:11px;color:#94a3b8;">SWIFT: ${account.swift}</p>` : ''}
</td>
</tr>`
      )
      .join('')

    return `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fefce8;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px;" role="none">
<tr><td style="padding:20px;">
<h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#92400e;">
<span style="display:inline-block;margin-right:8px;">🏦</span>${labels.BANK_TRANSFER_TITLE || 'Banka Havale Bilgileri'}
</h3>
${description ? `<p style="margin:0 0 16px;font-size:14px;color:#78350f;line-height:1.5;">${description}</p>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;border:1px solid #e2e8f0;" role="none">
${accountRows}
</table>
<p style="margin:16px 0 0;font-size:13px;color:#92400e;line-height:1.5;font-style:italic;">${labels.BANK_TRANSFER_NOTE || ''}</p>
</td></tr></table>`
  } catch (error) {
    logger.error('Failed to build bank transfer section:', error.message)
    return ''
  }
}

/**
 * Get template name for email type
 */
function getTemplateName(type) {
  const templates = {
    confirmation: 'booking-confirmation',
    payment_reminder: 'payment-reminder',
    checkin_reminder: 'checkin-reminder',
    hotel_notification: 'booking-confirmation' // Use confirmation template for hotel
  }
  return templates[type] || 'booking-confirmation'
}

/**
 * Get email subject based on type
 */
function getEmailSubject(type, booking, language = 'tr') {
  const subjects = {
    tr: {
      confirmation: `Rezervasyon Onayı - ${booking.bookingNumber}`,
      payment_reminder: `Ödeme Hatırlatması - ${booking.bookingNumber}`,
      checkin_reminder: `Check-in Hatırlatması - ${booking.hotelName}`,
      hotel_notification: `Yeni Rezervasyon - ${booking.bookingNumber}`
    },
    en: {
      confirmation: `Booking Confirmation - ${booking.bookingNumber}`,
      payment_reminder: `Payment Reminder - ${booking.bookingNumber}`,
      checkin_reminder: `Check-in Reminder - ${booking.hotelName}`,
      hotel_notification: `New Booking - ${booking.bookingNumber}`
    }
  }
  return subjects[language]?.[type] || subjects.tr[type]
}

/**
 * Get default recipient based on email type
 */
function getDefaultRecipient(type, booking) {
  if (type === 'hotel_notification') {
    return {
      type: 'hotel',
      email: booking.hotel?.notifications?.email || booking.hotel?.contact?.email || null
    }
  }
  return {
    type: 'guest',
    email: booking.contact?.email || null
  }
}

/**
 * Send automatic booking emails after booking creation or payment completion
 * Sends: 1) Confirmation to customer  2) Notification to partner members
 *
 * @param {string} bookingId - Booking document ID
 * @param {Object} options
 * @param {string} options.trigger - 'creation' | 'payment_completed'
 * @param {string} options.language - Language code (default: 'en')
 */
export async function sendAutomaticBookingEmails(bookingId, options = {}) {
  const { trigger = 'creation', language: langOverride } = options

  try {
    // Load booking with hotel and partner
    const booking = await Booking.findById(bookingId)
      .populate('hotel', 'name address contact policies')
      .populate('partner', 'companyName email address branding')
      .lean()

    if (!booking) {
      logger.error('[AutoEmail] Booking not found:', bookingId)
      return
    }

    const language = langOverride || booking.guestLanguage || 'en'

    // 1) Send confirmation email to CUSTOMER
    const customerEmail = booking.contact?.email
    if (customerEmail) {
      try {
        const templateData = await buildEmailTemplateData(booking, 'confirmation', language)
        const templateName = getTemplateName('confirmation')
        const subject = getEmailSubject('confirmation', booking, language)
        const html = await renderEmailTemplate(templateName, templateData, language)

        await sendEmail({
          to: customerEmail,
          subject,
          html,
          partnerId: booking.partner?._id || booking.partner,
          type: 'booking-confirmation',
          metadata: {
            bookingId: booking._id,
            bookingNumber: booking.bookingNumber,
            trigger,
            automatic: true
          }
        })

        logger.info('[AutoEmail] Customer confirmation sent:', {
          bookingNumber: booking.bookingNumber,
          to: customerEmail,
          trigger
        })
      } catch (err) {
        logger.error('[AutoEmail] Failed to send customer email:', err.message)
      }
    }

    // 2) Send notification to PARTNER MEMBERS
    const partnerId = booking.partner?._id || booking.partner
    if (partnerId) {
      try {
        // Find active partner users
        const partnerUsers = await User.find({
          accountType: 'partner',
          accountId: partnerId,
          status: 'active'
        })
          .select('email firstName lastName')
          .lean()

        if (partnerUsers.length > 0) {
          const partnerEmails = partnerUsers.map(u => u.email).filter(Boolean)

          if (partnerEmails.length > 0) {
            const templateData = await buildEmailTemplateData(
              booking,
              'hotel_notification',
              language
            )
            const templateName = getTemplateName('hotel_notification')
            const subject = getEmailSubject('hotel_notification', booking, language)
            const html = await renderEmailTemplate(templateName, templateData, language)

            // Send to all partner members
            for (const email of partnerEmails) {
              try {
                await sendEmail({
                  to: email,
                  subject,
                  html,
                  partnerId,
                  type: 'booking-hotel-notification',
                  metadata: {
                    bookingId: booking._id,
                    bookingNumber: booking.bookingNumber,
                    trigger,
                    automatic: true
                  }
                })
              } catch (memberErr) {
                logger.error('[AutoEmail] Failed to send to partner member:', {
                  email,
                  error: memberErr.message
                })
              }
            }

            logger.info('[AutoEmail] Partner notification sent:', {
              bookingNumber: booking.bookingNumber,
              recipients: partnerEmails.length,
              trigger
            })
          }
        }

        // Also send to hotel contact email if available
        const hotelEmail = booking.hotel?.contact?.email
        if (hotelEmail && !partnerUsers.some(u => u.email === hotelEmail)) {
          try {
            const templateData = await buildEmailTemplateData(
              booking,
              'hotel_notification',
              language
            )
            const templateName = getTemplateName('hotel_notification')
            const subject = getEmailSubject('hotel_notification', booking, language)
            const html = await renderEmailTemplate(templateName, templateData, language)

            await sendEmail({
              to: hotelEmail,
              subject,
              html,
              partnerId,
              type: 'booking-hotel-notification',
              metadata: {
                bookingId: booking._id,
                bookingNumber: booking.bookingNumber,
                trigger,
                automatic: true
              }
            })

            logger.info('[AutoEmail] Hotel contact notification sent:', {
              bookingNumber: booking.bookingNumber,
              to: hotelEmail
            })
          } catch (hotelErr) {
            logger.error('[AutoEmail] Failed to send to hotel contact:', hotelErr.message)
          }
        }
      } catch (err) {
        logger.error('[AutoEmail] Failed to send partner notifications:', err.message)
      }
    }
  } catch (error) {
    logger.error('[AutoEmail] Unexpected error:', error.message)
  }
}

export default {
  previewBookingEmail,
  sendBookingEmail,
  updateGuestInfo,
  sendAutomaticBookingEmails
}
