import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import logger from '../core/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATES_DIR = path.join(__dirname, '../templates/emails')
const MAIZZLE_DIR = path.join(__dirname, '../templates/maizzle')

/**
 * Template variable definitions for each email type
 * These help document what variables each template expects
 */
export const TEMPLATE_VARIABLES = {
  'booking-confirmation': [
    'BOOKING_NUMBER',
    'STATUS',
    'HOTEL_NAME',
    'HOTEL_ADDRESS',
    'CHECKIN_DATE',
    'CHECKOUT_DATE',
    'NIGHTS',
    'ROOM_TYPE',
    'GUESTS',
    'BOARD_TYPE',
    'TOTAL_PRICE',
    'GUEST_NAME',
    'GUEST_EMAIL',
    'GUEST_PHONE',
    'BOOKING_URL',
    'BANK_TRANSFER_SECTION',
    'PAYMENT_METHOD'
  ],
  'booking-cancelled': [
    'BOOKING_NUMBER',
    'HOTEL_NAME',
    'CHECKIN_DATE',
    'CHECKOUT_DATE',
    'CANCELLED_AT',
    'CANCELLATION_REASON',
    'ORIGINAL_AMOUNT',
    'CANCELLATION_FEE',
    'REFUND_AMOUNT'
  ],
  welcome: ['USER_NAME', 'USER_EMAIL', 'ACCOUNT_TYPE', 'COMPANY_NAME', 'DASHBOARD_URL'],
  'password-reset': ['RESET_URL', 'EXPIRY_TIME'],
  '2fa-setup': ['BACKUP_CODES', 'SECURITY_URL'],
  'payment-reminder': [
    'BOOKING_NUMBER',
    'HOTEL_NAME',
    'CHECKIN_DATE',
    'CHECKOUT_DATE',
    'TOTAL_AMOUNT',
    'PAID_AMOUNT',
    'REMAINING_AMOUNT',
    'PAYMENT_DEADLINE',
    'PAYMENT_URL'
  ],
  'checkin-reminder': [
    'BOOKING_NUMBER',
    'HOTEL_NAME',
    'HOTEL_ADDRESS',
    'HOTEL_PHONE',
    'CHECKIN_DATE',
    'CHECKIN_TIME',
    'CHECKOUT_DATE',
    'CHECKOUT_TIME',
    'ROOM_TYPE',
    'GUESTS',
    'MAP_URL',
    'DAYS_LEFT'
  ],
  activation: [
    'USER_NAME',
    'USER_EMAIL',
    'INVITER_NAME',
    'ACCOUNT_NAME',
    'USER_ROLE',
    'ACTIVATION_URL'
  ],
  'payment-link': [
    'CUSTOMER_NAME',
    'DESCRIPTION',
    'AMOUNT',
    'CURRENCY',
    'PAYMENT_URL',
    'EXPIRY_DATE',
    'COMPANY_NAME',
    'COMPANY_LOGO'
  ],
  'email-reply': ['REPLY_BODY', 'ORIGINAL_FROM', 'ORIGINAL_DATE', 'ORIGINAL_BODY', 'SUBJECT'],
  'new-partner-notification': [
    'PARTNER_NAME',
    'PARTNER_EMAIL',
    'PARTNER_PHONE',
    'PARTNER_TYPE',
    'CONTACT_NAME',
    'SUBMITTED_AT',
    'REVIEW_URL'
  ]
}

/**
 * Default text labels for templates (multi-language support)
 */
export const TEMPLATE_LABELS = {
  tr: {
    // Common - Layout
    COMPANY_NAME: 'Maxirez',
    COMPANY_ADDRESS: 'İstanbul, Türkiye',
    FOOTER_TEXT: 'Bu e-posta otomatik olarak gönderilmiştir.',
    UNSUBSCRIBE_TEXT: 'E-posta bildirimlerinden çık',
    UNSUBSCRIBE_URL: '#',
    HELP_TEXT: 'Yardıma mı ihtiyacınız var? Bize ulaşın:',
    SUPPORT_EMAIL: 'info@maxirez.com',
    SITE_URL: 'https://app.maxirez.com',
    LOGO_URL: 'https://app.maxirez.com/minirez.png',
    LANG: 'tr',

    // Booking Confirmation
    GREETING_TITLE: 'Rezervasyonunuz Onaylandı!',
    GREETING_TEXT: 'Rezervasyonunuz başarıyla oluşturuldu. Detaylar aşağıdadır.',
    BOOKING_NUMBER_LABEL: 'Rezervasyon No',
    CHECKIN_LABEL: 'Giriş Tarihi',
    CHECKOUT_LABEL: 'Çıkış Tarihi',
    NIGHTS_LABEL: 'Gece Sayısı',
    ROOM_LABEL: 'Oda Tipi',
    GUESTS_LABEL: 'Misafirler',
    BOARD_LABEL: 'Pansiyon',
    TOTAL_LABEL: 'Toplam',
    GUEST_INFO_TITLE: 'Misafir Bilgileri',
    VIEW_BOOKING_BUTTON: 'Rezervasyonu Görüntüle',

    // Bank Transfer
    BANK_TRANSFER_TITLE: 'Banka Havale Bilgileri',
    BANK_TRANSFER_NOTE:
      'Lütfen havale açıklamasına rezervasyon numaranızı yazınız. Ödemeniz onaylandığında e-posta ile bilgilendirileceksiniz.',
    BANK_NAME_LABEL: 'Banka',
    ACCOUNT_NAME_LABEL: 'Hesap Sahibi',
    IBAN_LABEL: 'IBAN',
    SWIFT_LABEL: 'Swift',
    PAYMENT_METHOD_LABEL: 'Ödeme Yöntemi',
    PAYMENT_METHOD_BANK_TRANSFER: 'Banka Havalesi',
    PAYMENT_METHOD_CREDIT_CARD: 'Kredi Kartı',
    PAYMENT_METHOD_PAY_AT_HOTEL: 'Otelde Ödeme',

    // Booking Cancelled
    CANCELLED_TITLE: 'Rezervasyonunuz İptal Edildi',
    CANCELLED_SUBTITLE: 'Aşağıda iptal edilen rezervasyonunuzun detaylarını bulabilirsiniz.',
    HOTEL_LABEL: 'Otel',
    DATES_LABEL: 'Tarihler',
    CANCELLED_AT_LABEL: 'İptal Tarihi',
    REASON_TITLE: 'İptal Nedeni',
    REFUND_TITLE: 'İade Bilgileri',
    ORIGINAL_AMOUNT_LABEL: 'Orijinal Tutar',
    CANCELLATION_FEE_LABEL: 'İptal Ücreti',
    REFUND_AMOUNT_LABEL: 'İade Tutarı',
    REFUND_NOTE: 'İade işlemi 5-10 iş günü içinde gerçekleştirilecektir.',
    NEW_BOOKING_BUTTON: 'Yeni Rezervasyon Yap',

    // Welcome
    GREETING: 'Hoş Geldiniz',
    WELCOME_TEXT: 'Hesabınız başarıyla oluşturuldu. Platformumuza hoş geldiniz!',
    ACCOUNT_INFO_TITLE: 'Hesap Bilgileri',
    EMAIL_LABEL: 'E-posta',
    ACCOUNT_TYPE_LABEL: 'Hesap Tipi',
    COMPANY_LABEL: 'Şirket',
    FEATURES_TITLE: 'Platformumuzda neler yapabilirsiniz?',
    FEATURE_1: 'Otel rezervasyonları yapın ve yönetin',
    FEATURE_2: 'Özel fiyatlardan yararlanın',
    FEATURE_3: 'Detaylı raporlara erişin',
    FEATURE_4: '7/24 destek alın',
    GET_STARTED_BUTTON: 'Başlayın',
    HELP_TITLE: 'Yardıma mı ihtiyacınız var?',

    // Password Reset
    PASSWORD_RESET_TITLE: 'Şifre Sıfırlama',
    PASSWORD_RESET_SUBTITLE: 'Şifrenizi sıfırlamak için aşağıdaki butona tıklayın.',
    PASSWORD_RESET_DESC:
      'Hesabınız için şifre sıfırlama talebinde bulundunuz. Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.',
    RESET_BUTTON: 'Şifremi Sıfırla',
    ALTERNATIVE_TEXT: 'Buton çalışmıyorsa aşağıdaki linki kullanın:',
    EXPIRY_WARNING: 'Bu link 1 saat içinde geçerliliğini yitirecektir.',
    SECURITY_NOTE: 'Güvenliğiniz için bu linki kimseyle paylaşmayın.',

    // 2FA Setup
    TWO_FA_TITLE: 'İki Faktörlü Doğrulama Etkinleştirildi',
    TWO_FA_SUBTITLE: 'Hesabınız artık daha güvende!',
    SUCCESS_MESSAGE: 'İki faktörlü doğrulama başarıyla etkinleştirildi.',
    BACKUP_CODES_TITLE: 'Yedek Kodlarınız',
    BACKUP_CODES_DESC:
      'Bu kodları güvenli bir yerde saklayın. Telefonunuza erişemezseniz bu kodları kullanabilirsiniz.',
    WARNING_MESSAGE:
      'Her kod yalnızca bir kez kullanılabilir. Bu kodları asla kimseyle paylaşmayın.',
    NEXT_STEPS_TITLE: 'Sonraki Adımlar',
    STEP_1: 'Authenticator uygulamanızı (Google Authenticator, Authy vb.) açık tutun',
    STEP_2: 'Yedek kodlarınızı güvenli bir yerde saklayın',
    STEP_3: 'Giriş yaparken 6 haneli kodu girin',
    SECURITY_BUTTON: 'Güvenlik Ayarları',

    // Payment Reminder
    PAYMENT_TITLE: 'Ödeme Hatırlatması',
    PAYMENT_SUBTITLE: 'Rezervasyonunuz için ödeme bekleniyor.',
    URGENCY_MESSAGE: 'Ödeme süreniz dolmak üzere!',
    TOTAL_AMOUNT_LABEL: 'Toplam Tutar',
    PAID_AMOUNT_LABEL: 'Ödenen',
    REMAINING_LABEL: 'Kalan',
    DEADLINE_LABEL: 'Son Ödeme Tarihi',
    PAY_NOW_BUTTON: 'Şimdi Öde',
    PAYMENT_METHODS_TEXT: 'Kredi kartı, banka kartı veya havale ile ödeme yapabilirsiniz.',
    CANCELLATION_WARNING: 'Ödeme yapılmadığı takdirde rezervasyonunuz iptal edilecektir.',

    // Check-in Reminder
    CHECKIN_TITLE: 'Check-in Hatırlatması',
    CHECKIN_SUBTITLE: 'Tatiliniz yaklaşıyor! İşte rezervasyon detaylarınız.',
    COUNTDOWN_LABEL: "Check-in'e kalan",
    DAYS_TEXT: 'gün',
    IMPORTANT_INFO_TITLE: 'Önemli Bilgiler',
    DIRECTIONS_BUTTON: 'Yol Tarifi Al',
    HOTEL_CONTACT_LABEL: 'Otel İletişim',

    // Account Activation
    ACTIVATION_GREETING: 'Hoş Geldiniz',
    ACTIVATION_SUBTITLE: 'Hesabınızı aktifleştirmek için şifrenizi belirleyin.',
    ACTIVATION_INVITER_MESSAGE: 'sizi hesaba kullanıcı olarak ekledi',
    ACTIVATION_ACCOUNT_INFO_TITLE: 'Hesap Bilgileri',
    ACTIVATION_ACCOUNT_LABEL: 'Hesap',
    ACTIVATION_ROLE_LABEL: 'Rol',
    ACTIVATION_DESCRIPTION:
      'Aşağıdaki butona tıklayarak hesabınızı aktifleştirin ve şifrenizi belirleyin.',
    ACTIVATION_ACTIVATE_BUTTON: 'Hesabı Aktifleştir',
    ACTIVATION_ALTERNATIVE_TEXT: 'Buton çalışmıyorsa aşağıdaki linki kullanın:',
    ACTIVATION_EXPIRY_WARNING: 'Bu link 7 gün içinde geçerliliğini yitirecektir.',
    ACTIVATION_SECURITY_NOTE: 'Bu linki kimseyle paylaşmayın.',

    // Payment Link
    PAYMENT_LINK_TITLE: 'Ödeme Linki',
    PAYMENT_LINK_SUBTITLE: 'Size bir ödeme talebi gönderildi',
    PAYMENT_LINK_PREVIEW: 'Ödeme yapmanız için size bir link gönderildi.',
    PAYMENT_LINK_GREETING: 'Merhaba',
    PAYMENT_LINK_MESSAGE: 'Aşağıdaki ödeme talebini gerçekleştirmek için butona tıklayın.',
    PAYMENT_DETAILS_LABEL: 'Ödeme Detayları',
    DESCRIPTION_LABEL: 'Açıklama',
    AMOUNT_LABEL: 'Tutar',
    EXPIRY_WARNING_LABEL: 'Bu link şu tarihe kadar geçerlidir',
    PAY_NOW_BUTTON: 'Şimdi Öde',
    SECURITY_NOTE_LABEL: 'Güvenlik Notu',
    SECURITY_NOTE:
      'Ödeme işlemi 3D Secure ile güvence altındadır. Kart bilgileriniz şifreli olarak iletilir.',

    // New Partner Notification
    NEW_PARTNER_TITLE: 'Yeni Partner Başvurusu',
    NEW_PARTNER_SUBTITLE: 'Yeni bir partner başvurusu alındı.',
    PARTNER_INFO_TITLE: 'Partner Bilgileri',
    PARTNER_NAME_LABEL: 'Firma Adı',
    PARTNER_EMAIL_LABEL: 'E-posta',
    PARTNER_PHONE_LABEL: 'Telefon',
    PARTNER_TYPE_LABEL: 'Partner Tipi',
    CONTACT_NAME_LABEL: 'Yetkili Kişi',
    SUBMITTED_AT_LABEL: 'Başvuru Tarihi',
    PARTNER_TYPE_HOTEL: 'Otel',
    PARTNER_TYPE_AGENCY: 'Acente',
    REVIEW_BUTTON: 'Başvuruyu İncele',
    NEW_PARTNER_FOOTER_NOTE:
      'Bu e-posta yeni bir partner başvurusu alındığında otomatik olarak gönderilmiştir.'
  },
  en: {
    // Common - Layout
    COMPANY_NAME: 'Maxirez',
    COMPANY_ADDRESS: 'Istanbul, Turkey',
    FOOTER_TEXT: 'This email was sent automatically.',
    UNSUBSCRIBE_TEXT: 'Unsubscribe from emails',
    UNSUBSCRIBE_URL: '#',
    HELP_TEXT: 'Need help? Contact us:',
    SUPPORT_EMAIL: 'info@maxirez.com',
    SITE_URL: 'https://app.maxirez.com',
    LOGO_URL: 'https://app.maxirez.com/minirez.png',
    LANG: 'en',

    // Booking Confirmation
    GREETING_TITLE: 'Your Booking is Confirmed!',
    GREETING_TEXT: 'Your reservation has been successfully created. Details are below.',
    BOOKING_NUMBER_LABEL: 'Booking No',
    CHECKIN_LABEL: 'Check-in Date',
    CHECKOUT_LABEL: 'Check-out Date',
    NIGHTS_LABEL: 'Nights',
    ROOM_LABEL: 'Room Type',
    GUESTS_LABEL: 'Guests',
    BOARD_LABEL: 'Board',
    TOTAL_LABEL: 'Total',
    GUEST_INFO_TITLE: 'Guest Information',
    VIEW_BOOKING_BUTTON: 'View Booking',

    // Bank Transfer
    BANK_TRANSFER_TITLE: 'Bank Transfer Details',
    BANK_TRANSFER_NOTE:
      'Please include your booking number in the transfer description. You will be notified by email once your payment is confirmed.',
    BANK_NAME_LABEL: 'Bank',
    ACCOUNT_NAME_LABEL: 'Account Holder',
    IBAN_LABEL: 'IBAN',
    SWIFT_LABEL: 'Swift',
    PAYMENT_METHOD_LABEL: 'Payment Method',
    PAYMENT_METHOD_BANK_TRANSFER: 'Bank Transfer',
    PAYMENT_METHOD_CREDIT_CARD: 'Credit Card',
    PAYMENT_METHOD_PAY_AT_HOTEL: 'Pay at Hotel',

    // Booking Cancelled
    CANCELLED_TITLE: 'Your Booking Has Been Cancelled',
    CANCELLED_SUBTITLE: 'Below you can find the details of your cancelled booking.',
    HOTEL_LABEL: 'Hotel',
    DATES_LABEL: 'Dates',
    CANCELLED_AT_LABEL: 'Cancelled At',
    REASON_TITLE: 'Cancellation Reason',
    REFUND_TITLE: 'Refund Information',
    ORIGINAL_AMOUNT_LABEL: 'Original Amount',
    CANCELLATION_FEE_LABEL: 'Cancellation Fee',
    REFUND_AMOUNT_LABEL: 'Refund Amount',
    REFUND_NOTE: 'The refund will be processed within 5-10 business days.',
    NEW_BOOKING_BUTTON: 'Make New Booking',

    // Welcome
    GREETING: 'Welcome',
    WELCOME_TEXT: 'Your account has been successfully created. Welcome to our platform!',
    ACCOUNT_INFO_TITLE: 'Account Information',
    EMAIL_LABEL: 'Email',
    ACCOUNT_TYPE_LABEL: 'Account Type',
    COMPANY_LABEL: 'Company',
    FEATURES_TITLE: 'What can you do on our platform?',
    FEATURE_1: 'Make and manage hotel reservations',
    FEATURE_2: 'Benefit from special prices',
    FEATURE_3: 'Access detailed reports',
    FEATURE_4: 'Get 24/7 support',
    GET_STARTED_BUTTON: 'Get Started',
    HELP_TITLE: 'Need help?',

    // Password Reset
    PASSWORD_RESET_TITLE: 'Password Reset',
    PASSWORD_RESET_SUBTITLE: 'Click the button below to reset your password.',
    PASSWORD_RESET_DESC:
      'You have requested a password reset for your account. If you did not make this request, you can ignore this email.',
    RESET_BUTTON: 'Reset Password',
    ALTERNATIVE_TEXT: "If the button doesn't work, use the link below:",
    EXPIRY_WARNING: 'This link will expire in 1 hour.',
    SECURITY_NOTE: 'For your security, do not share this link with anyone.',

    // 2FA Setup
    TWO_FA_TITLE: 'Two-Factor Authentication Enabled',
    TWO_FA_SUBTITLE: 'Your account is now more secure!',
    SUCCESS_MESSAGE: 'Two-factor authentication has been successfully enabled.',
    BACKUP_CODES_TITLE: 'Your Backup Codes',
    BACKUP_CODES_DESC:
      "Keep these codes in a safe place. You can use them if you can't access your phone.",
    WARNING_MESSAGE: 'Each code can only be used once. Never share these codes with anyone.',
    NEXT_STEPS_TITLE: 'Next Steps',
    STEP_1: 'Keep your authenticator app (Google Authenticator, Authy, etc.) ready',
    STEP_2: 'Store your backup codes in a safe place',
    STEP_3: 'Enter the 6-digit code when logging in',
    SECURITY_BUTTON: 'Security Settings',

    // Payment Reminder
    PAYMENT_TITLE: 'Payment Reminder',
    PAYMENT_SUBTITLE: 'Payment is pending for your reservation.',
    URGENCY_MESSAGE: 'Your payment deadline is approaching!',
    TOTAL_AMOUNT_LABEL: 'Total Amount',
    PAID_AMOUNT_LABEL: 'Paid',
    REMAINING_LABEL: 'Remaining',
    DEADLINE_LABEL: 'Payment Deadline',
    PAY_NOW_BUTTON: 'Pay Now',
    PAYMENT_METHODS_TEXT: 'You can pay with credit card, debit card or bank transfer.',
    CANCELLATION_WARNING: 'Your reservation will be cancelled if payment is not received.',

    // Check-in Reminder
    CHECKIN_TITLE: 'Check-in Reminder',
    CHECKIN_SUBTITLE: 'Your vacation is approaching! Here are your booking details.',
    COUNTDOWN_LABEL: 'Days until check-in',
    DAYS_TEXT: 'days',
    IMPORTANT_INFO_TITLE: 'Important Information',
    DIRECTIONS_BUTTON: 'Get Directions',
    HOTEL_CONTACT_LABEL: 'Hotel Contact',

    // Account Activation
    ACTIVATION_GREETING: 'Welcome',
    ACTIVATION_SUBTITLE: 'Set your password to activate your account.',
    ACTIVATION_INVITER_MESSAGE: 'has added you as a user',
    ACTIVATION_ACCOUNT_INFO_TITLE: 'Account Information',
    ACTIVATION_ACCOUNT_LABEL: 'Account',
    ACTIVATION_ROLE_LABEL: 'Role',
    ACTIVATION_DESCRIPTION:
      'Click the button below to activate your account and set your password.',
    ACTIVATION_ACTIVATE_BUTTON: 'Activate Account',
    ACTIVATION_ALTERNATIVE_TEXT: "If the button doesn't work, use the link below:",
    ACTIVATION_EXPIRY_WARNING: 'This link will expire in 7 days.',
    ACTIVATION_SECURITY_NOTE: 'Do not share this link with anyone.',

    // Payment Link
    PAYMENT_LINK_TITLE: 'Payment Link',
    PAYMENT_LINK_SUBTITLE: 'A payment request has been sent to you',
    PAYMENT_LINK_PREVIEW: 'You have received a payment link.',
    PAYMENT_LINK_GREETING: 'Hello',
    PAYMENT_LINK_MESSAGE: 'Click the button below to complete the following payment request.',
    PAYMENT_DETAILS_LABEL: 'Payment Details',
    DESCRIPTION_LABEL: 'Description',
    AMOUNT_LABEL: 'Amount',
    EXPIRY_WARNING_LABEL: 'This link is valid until',
    PAY_NOW_BUTTON: 'Pay Now',
    SECURITY_NOTE_LABEL: 'Security Note',
    SECURITY_NOTE:
      'This payment is secured with 3D Secure. Your card details are transmitted encrypted.',

    // New Partner Notification
    NEW_PARTNER_TITLE: 'New Partner Application',
    NEW_PARTNER_SUBTITLE: 'A new partner application has been received.',
    PARTNER_INFO_TITLE: 'Partner Information',
    PARTNER_NAME_LABEL: 'Company Name',
    PARTNER_EMAIL_LABEL: 'Email',
    PARTNER_PHONE_LABEL: 'Phone',
    PARTNER_TYPE_LABEL: 'Partner Type',
    CONTACT_NAME_LABEL: 'Contact Person',
    SUBMITTED_AT_LABEL: 'Submitted At',
    PARTNER_TYPE_HOTEL: 'Hotel',
    PARTNER_TYPE_AGENCY: 'Agency',
    REVIEW_BUTTON: 'Review Application',
    NEW_PARTNER_FOOTER_NOTE:
      'This email was sent automatically when a new partner application was received.'
  }
}

/**
 * Build Maizzle templates (for development)
 * In production, templates should be pre-built
 */
export const buildTemplates = async () => {
  try {
    execSync('npm run build', { cwd: MAIZZLE_DIR, stdio: 'inherit' })
    logger.info('Email templates built successfully')
  } catch (error) {
    logger.error('Failed to build email templates', { error: error.message })
    throw error
  }
}

/**
 * Render email template with variables
 * @param {string} templateName - Name of the template file (without .html)
 * @param {Object} variables - Variables to replace in template
 * @param {string} language - Language code (tr, en)
 * @returns {Promise<string>} Rendered HTML
 */
export const renderEmailTemplate = async (templateName, variables = {}, language = 'tr') => {
  try {
    // Get labels for the language
    const labels = TEMPLATE_LABELS[language] || TEMPLATE_LABELS.tr

    // Read content template
    const contentPath = path.join(TEMPLATES_DIR, `${templateName}.html`)
    let html = await fs.readFile(contentPath, 'utf-8')

    // Merge labels with variables (variables take precedence)
    const allVariables = {
      ...labels,
      LANG: language,
      YEAR: new Date().getFullYear(),
      ...variables
    }

    // Replace all variables - support both %% KEY %% and {{ KEY }} formats
    Object.keys(allVariables).forEach(key => {
      // New Maizzle format: %% KEY %%
      const regex1 = new RegExp(`%%\\s*${key}\\s*%%`, 'g')
      html = html.replace(regex1, allVariables[key] ?? '')
      // Legacy format: {{ KEY }}
      const regex2 = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      html = html.replace(regex2, allVariables[key] ?? '')
    })

    return html
  } catch (error) {
    // If Maizzle template not found, try legacy base template
    if (error.code === 'ENOENT') {
      return renderLegacyTemplate(templateName, variables)
    }
    throw new Error(`Failed to render email template: ${error.message}`)
  }
}

/**
 * Render legacy template (fallback for templates not yet migrated to Maizzle)
 */
const renderLegacyTemplate = async (templateName, variables = {}) => {
  try {
    const basePath = path.join(TEMPLATES_DIR, 'base.html')
    let baseTemplate = await fs.readFile(basePath, 'utf-8')

    const contentPath = path.join(TEMPLATES_DIR, `${templateName}.html`)
    let contentTemplate = await fs.readFile(contentPath, 'utf-8')

    // Replace variables in content
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      contentTemplate = contentTemplate.replace(regex, variables[key] || '')
    })

    // Default variables for base template
    const baseVariables = {
      COMPANY_NAME: variables.COMPANY_NAME || 'Booking Engine',
      YEAR: new Date().getFullYear(),
      WEBSITE_URL: variables.WEBSITE_URL || 'https://booking-engine.com',
      SUPPORT_URL: variables.SUPPORT_URL || 'https://booking-engine.com/support',
      PRIVACY_URL: variables.PRIVACY_URL || 'https://booking-engine.com/privacy',
      CONTENT: contentTemplate
    }

    // Replace variables in base template
    Object.keys(baseVariables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      baseTemplate = baseTemplate.replace(regex, baseVariables[key] || '')
    })

    return baseTemplate
  } catch (error) {
    throw new Error(`Failed to render legacy template: ${error.message}`)
  }
}

/**
 * Generate plain text from HTML
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
export const htmlToText = html => {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gs, '')
    .replace(/<script[^>]*>.*?<\/script>/gs, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, '\t')
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim()
}

/**
 * Get available template names
 */
export const getAvailableTemplates = async () => {
  try {
    const files = await fs.readdir(TEMPLATES_DIR)
    return files
      .filter(f => f.endsWith('.html') && f !== 'base.html')
      .map(f => f.replace('.html', ''))
  } catch (error) {
    return []
  }
}

export default {
  renderEmailTemplate,
  htmlToText,
  buildTemplates,
  getAvailableTemplates,
  TEMPLATE_VARIABLES,
  TEMPLATE_LABELS
}
