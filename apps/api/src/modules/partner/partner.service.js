import Partner from './partner.model.js'
import { escapeRegex } from '#helpers'
import User from '../user/user.model.js'
import Agency from '../agency/agency.model.js'
import Hotel from '../hotel/hotel.model.js'
import { NotFoundError, ConflictError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { sendWelcomeEmail, sendEmail, sendActivationEmail, getAdminUrl } from '#helpers/mail.js'
import sesIdentityService from '#services/sesIdentityService.js'
import { queueHotelProvisioning, queueUserProvisioning, getQueueStatus } from '#services/pmsQueueService.js'
import { SUBSCRIPTION_PLANS, PLAN_TYPES, SUBSCRIPTION_CONFIG } from '#constants/subscriptionPlans.js'
import { createInvoice } from '#modules/subscriptionInvoice/subscriptionInvoice.service.js'
import crypto from 'crypto'
import logger from '#core/logger.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Generate random password
const generatePassword = () => {
  return crypto.randomBytes(8).toString('hex')
}

// Create partner
export const createPartner = asyncHandler(async (req, res) => {
  const partner = await Partner.create(req.body)

  // Create admin user for partner
  const tempPassword = generatePassword()
  const adminUser = await User.create({
    accountType: 'partner',
    accountId: partner._id,
    name: req.body.companyName + ' Admin',
    email: req.body.email,
    password: tempPassword,
    role: 'admin',
    status: 'active'
  })

  // Send welcome email with credentials
  try {
    await sendWelcomeEmail({
      to: adminUser.email,
      name: adminUser.name,
      email: adminUser.email,
      password: tempPassword,
      accountType: 'Partner',
      loginUrl: partner.branding?.siteDomain
        ? `https://${partner.branding.siteDomain}/login`
        : 'https://admin.booking-engine.com/login'
    })
    logger.info(`Welcome email sent to partner admin: ${adminUser.email}`)
  } catch (error) {
    logger.error(`Failed to send welcome email: ${error.message}`)
  }

  res.status(201).json({
    success: true,
    message: req.t('PARTNER_CREATED'),
    data: {
      partner,
      adminUser: {
        email: adminUser.email,
        tempPassword // Remove this in production, only send via email
      }
    }
  })
})

// Get all partners
export const getPartners = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query

  // Build filter
  const filter = {}
  if (status) filter.status = status
  if (search) {
    const escapedSearch = escapeRegex(search)
    filter.$or = [
      { companyName: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
      { 'branding.siteDomain': { $regex: escapedSearch, $options: 'i' } }
    ]
  }

  // Pagination
  const skip = (page - 1) * limit
  const total = await Partner.countDocuments(filter)
  const partners = await Partner.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))

  res.json({
    success: true,
    data: {
      partners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

// Get partner by ID
export const getPartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  res.json({
    success: true,
    data: partner
  })
})

// Update partner
export const updatePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Update only allowed fields (security: prevent mass assignment)
  const allowedFields = [
    'companyName',
    'tradeName',
    'email',
    'phone',
    'taxOffice',
    'taxNumber',
    'address',
    'branding',
    'settings',
    'contactPerson',
    'notes',
    'status',
    'partnerType'
  ]

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      partner[field] = req.body[field]
    }
  })

  await partner.save()

  res.json({
    success: true,
    message: req.t('PARTNER_UPDATED'),
    data: partner
  })
})

// Delete partner
export const deletePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Check if partner has agencies - query database directly for accurate count
  const agenciesCount = await Agency.countDocuments({ partnerId: partner._id })
  if (agenciesCount > 0) {
    throw new ConflictError('PARTNER_HAS_AGENCIES')
  }

  // Also delete associated admin user
  await User.deleteMany({ accountType: 'partner', accountId: partner._id })

  await partner.deleteOne()

  res.json({
    success: true,
    message: req.t('PARTNER_DELETED')
  })
})

// Activate partner
export const activatePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  await partner.activate()

  res.json({
    success: true,
    message: req.t('PARTNER_ACTIVATED'),
    data: partner
  })
})

// Deactivate partner
export const deactivatePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  await partner.deactivate()

  res.json({
    success: true,
    message: req.t('PARTNER_DEACTIVATED'),
    data: partner
  })
})

// Approve partner (activate partner and send activation email to user)
export const approvePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  if (partner.status !== 'pending') {
    throw new ConflictError('PARTNER_NOT_PENDING')
  }

  // Find the admin user for this partner
  const adminUser = await User.findOne({
    accountType: 'partner',
    accountId: partner._id,
    role: 'admin'
  })

  if (!adminUser) {
    throw new NotFoundError('PARTNER_ADMIN_USER_NOT_FOUND')
  }

  // Activate partner
  await partner.activate()

  // Generate activation token for user to set their password
  const activationToken = adminUser.generateActivationToken()
  adminUser.status = 'pending_activation' // Keep as pending_activation until they set password
  await adminUser.save()

  // Send activation email
  let activationEmailSent = false
  try {
    logger.info(`Attempting to send activation email to: ${adminUser.email}`)
    await sendActivationEmail({
      to: adminUser.email,
      name: adminUser.name,
      inviterName: 'Booking Engine',
      accountName: partner.companyName,
      userRole: 'Partner Admin',
      token: activationToken,
      partnerId: partner._id,
      partnerCity: partner.address?.city || ''
    })
    activationEmailSent = true
    logger.info(`Activation email sent successfully to partner admin: ${adminUser.email}`)
  } catch (error) {
    logger.error(`Failed to send activation email to ${adminUser.email}:`, error.message || error)
    logger.error('Full error:', JSON.stringify(error, null, 2))
    // Don't fail the approval if email fails - they can request a new one
  }

  res.json({
    success: true,
    message: req.t('PARTNER_APPROVED'),
    data: {
      partner,
      activationEmailSent,
      adminEmail: adminUser.email
    }
  })
})

// Upload partner document
export const uploadDocument = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  if (!req.file) {
    throw new BadRequestError('NO_FILE_UPLOADED')
  }

  const { documentType } = req.body

  if (!documentType || !['license', 'certificate', 'other'].includes(documentType)) {
    throw new BadRequestError('INVALID_DOCUMENT_TYPE')
  }

  // Create document entry
  const document = {
    type: documentType,
    name: req.file.originalname,
    url: `/uploads/partners/${req.file.filename}`,
    uploadedAt: new Date()
  }

  // Add to partner documents
  partner.documents.push(document)
  await partner.save()

  res.json({
    success: true,
    message: req.t('DOCUMENT_UPLOADED'),
    data: {
      document,
      partner
    }
  })
})

// Delete partner document
export const deleteDocument = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const documentId = req.params.documentId
  const documentIndex = partner.documents.findIndex(doc => doc._id.toString() === documentId)

  if (documentIndex === -1) {
    throw new NotFoundError('DOCUMENT_NOT_FOUND')
  }

  // Remove document
  partner.documents.splice(documentIndex, 1)
  await partner.save()

  res.json({
    success: true,
    message: req.t('DOCUMENT_DELETED'),
    data: partner
  })
})

// Serve partner document (authenticated)
export const serveDocument = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const documentId = req.params.documentId
  const document = partner.documents.find(doc => doc._id.toString() === documentId)

  if (!document) {
    throw new NotFoundError('DOCUMENT_NOT_FOUND')
  }

  // Build file path
  const uploadsDir = path.join(__dirname, '../../../uploads')
  const filePath = path.join(uploadsDir, document.url.replace('/uploads/', ''))

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError('FILE_NOT_FOUND')
  }

  // Get file extension to set content type
  const ext = path.extname(filePath).toLowerCase()
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }

  const contentType = contentTypes[ext] || 'application/octet-stream'

  // Set headers
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `inline; filename="${document.name}"`)

  // Stream file
  const fileStream = fs.createReadStream(filePath)
  fileStream.pipe(res)
})

// Get partner email settings
export const getEmailSettings = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Return email settings (without decrypted secrets)
  const emailSettings = partner.notifications?.email || {}

  res.json({
    success: true,
    data: {
      useOwnSES: emailSettings.useOwnSES || false,
      aws: emailSettings.aws
        ? {
            region: emailSettings.aws.region,
            accessKeyId: emailSettings.aws.accessKeyId
              ? '***' + emailSettings.aws.accessKeyId.slice(-4)
              : null,
            fromEmail: emailSettings.aws.fromEmail,
            fromName: emailSettings.aws.fromName
          }
        : null,
      domainVerification: emailSettings.domainVerification || null
    }
  })
})

// Update partner email settings
export const updateEmailSettings = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { useOwnSES, aws } = req.body

  // Initialize notifications if not exists
  if (!partner.notifications) {
    partner.notifications = {}
  }
  if (!partner.notifications.email) {
    partner.notifications.email = {}
  }

  partner.notifications.email.useOwnSES = useOwnSES

  if (useOwnSES && aws) {
    // Only update non-empty values
    if (!partner.notifications.email.aws) {
      partner.notifications.email.aws = {}
    }

    if (aws.region) partner.notifications.email.aws.region = aws.region
    if (aws.accessKeyId) partner.notifications.email.aws.accessKeyId = aws.accessKeyId
    if (aws.secretAccessKey) partner.notifications.email.aws.secretAccessKey = aws.secretAccessKey
    if (aws.fromEmail) partner.notifications.email.aws.fromEmail = aws.fromEmail
    if (aws.fromName) partner.notifications.email.aws.fromName = aws.fromName
  }

  await partner.save()

  res.json({
    success: true,
    message: req.t ? req.t('EMAIL_SETTINGS_UPDATED') : 'Email settings updated',
    data: {
      useOwnSES: partner.notifications.email.useOwnSES
    }
  })
})

// Create domain identity in AWS SES
export const createEmailIdentity = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { domain, fromEmail, fromName } = req.body

  if (!domain) {
    throw new BadRequestError('DOMAIN_REQUIRED')
  }

  // Initialize notifications structure
  if (!partner.notifications) partner.notifications = {}
  if (!partner.notifications.email) partner.notifications.email = {}

  try {
    // Create domain identity in AWS SES using platform credentials
    const result = await sesIdentityService.createDomainIdentity(domain)

    // Save domain verification info to partner
    partner.notifications.email.useOwnSES = true
    partner.notifications.email.domainVerification = {
      domain,
      status: result.dkimStatus || 'pending',
      dkimTokens: result.dkimTokens,
      verifiedAt: result.verified ? new Date() : null,
      lastCheckedAt: new Date()
    }

    // Save sender info if provided
    if (!partner.notifications.email.aws) {
      partner.notifications.email.aws = {}
    }
    if (fromEmail) partner.notifications.email.aws.fromEmail = fromEmail
    if (fromName) partner.notifications.email.aws.fromName = fromName

    await partner.save()

    logger.info(`Domain identity created for partner ${partner._id}: ${domain}`)

    res.json({
      success: true,
      message: 'Domain oluşturuldu. DNS kayıtlarını ekleyin.',
      data: {
        domain,
        dkimTokens: result.dkimTokens,
        dkimStatus: result.dkimStatus,
        verified: result.verified,
        dnsRecords: result.dnsRecords
      }
    })
  } catch (error) {
    logger.error(`Domain identity creation failed: ${error.message}`)
    throw new BadRequestError(error.message || 'Domain oluşturulamadı')
  }
})

// Get domain verification status from AWS SES
export const getVerificationStatus = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const domainVerification = partner.notifications?.email?.domainVerification

  // Domain yoksa boş response dön (404 yerine)
  if (!domainVerification || !domainVerification.domain) {
    return res.json({
      success: true,
      data: null
    })
  }

  try {
    // Check actual status from AWS SES
    const result = await sesIdentityService.getIdentityStatus(domainVerification.domain)

    // Update partner's verification status
    partner.notifications.email.domainVerification.status = result.dkimStatus
    partner.notifications.email.domainVerification.lastCheckedAt = new Date()

    if (result.verified && !partner.notifications.email.domainVerification.verifiedAt) {
      partner.notifications.email.domainVerification.verifiedAt = new Date()
    }

    await partner.save()

    res.json({
      success: true,
      data: {
        domain: domainVerification.domain,
        status: result.dkimStatus,
        verified: result.verified,
        dkimTokens: result.dkimTokens,
        dnsRecords: result.dnsRecords,
        lastCheckedAt: new Date()
      }
    })
  } catch (error) {
    logger.error(`Verification status check failed: ${error.message}`)
    throw new BadRequestError(error.message || 'Doğrulama durumu alınamadı')
  }
})

// Delete domain identity from AWS SES
export const deleteEmailIdentity = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const domainVerification = partner.notifications?.email?.domainVerification

  if (!domainVerification || !domainVerification.domain) {
    throw new NotFoundError('NO_DOMAIN_VERIFICATION')
  }

  try {
    // Delete domain from AWS SES
    await sesIdentityService.deleteIdentity(domainVerification.domain)

    // Clear partner's domain verification
    partner.notifications.email.useOwnSES = false
    partner.notifications.email.domainVerification = null

    await partner.save()

    logger.info(`Domain identity deleted for partner ${partner._id}: ${domainVerification.domain}`)

    res.json({
      success: true,
      message: 'Domain başarıyla kaldırıldı'
    })
  } catch (error) {
    logger.error(`Domain deletion failed: ${error.message}`)
    throw new BadRequestError(error.message || 'Domain silinemedi')
  }
})

// Test partner email configuration
export const testPartnerEmail = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { email } = req.body

  if (!email) {
    throw new BadRequestError('EMAIL_REQUIRED')
  }

  // Check if partner has own SES configured
  const emailSettings = partner.notifications?.email
  if (!emailSettings?.useOwnSES) {
    throw new BadRequestError('OWN_SES_NOT_CONFIGURED')
  }

  const domainVerification = emailSettings.domainVerification
  if (!domainVerification || domainVerification.status !== 'verified') {
    throw new BadRequestError('DOMAIN_NOT_VERIFIED')
  }

  try {
    // Send test email using platform SES with partner's verified domain
    const fromEmail = emailSettings.aws?.fromEmail || `noreply@${domainVerification.domain}`
    const fromName = emailSettings.aws?.fromName || partner.companyName

    await sendEmail({
      to: email,
      subject: 'Test E-postası - Domain Doğrulama Başarılı',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #4F46E5;">E-posta Yapılandırma Testi</h1>
          <p>Bu bir test e-postasıdır.</p>
          <p>E-posta domain'iniz <strong>${domainVerification.domain}</strong> başarıyla doğrulanmış ve aktif durumdadır.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 12px;">
            Gönderen: ${fromEmail}<br>
            Partner: ${partner.companyName}
          </p>
        </div>
      `,
      from: `${fromName} <${fromEmail}>`,
      partnerId: partner._id
    })

    logger.info(`Test email sent for partner ${partner._id} to ${email}`)

    res.json({
      success: true,
      message: 'Test e-postası gönderildi'
    })
  } catch (error) {
    logger.error(`Test email failed for partner ${partner._id}: ${error.message}`)
    throw new BadRequestError(error.message || 'Test e-postası gönderilemedi')
  }
})

// Get partner SMS settings
export const getSMSSettings = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Return SMS settings (mask sensitive data)
  const smsSettings = partner.notifications?.sms || {}
  const config = smsSettings.config || {}

  // Create masked config based on provider
  let maskedConfig = null
  if (smsSettings.provider && smsSettings.provider !== 'platform') {
    maskedConfig = {}
    switch (smsSettings.provider) {
      case 'netgsm':
        maskedConfig.usercode = config.usercode ? '***' + config.usercode.slice(-4) : null
        maskedConfig.msgheader = config.msgheader || null
        break
      case 'iletimerkezi':
        maskedConfig.apiKey = config.apiKey ? '***' + config.apiKey.slice(-4) : null
        maskedConfig.sender = config.sender || null
        break
      case 'twilio':
        maskedConfig.accountSid = config.accountSid ? '***' + config.accountSid.slice(-4) : null
        maskedConfig.fromNumber = config.fromNumber || null
        break
      case 'vonage':
        maskedConfig.apiKey = config.apiKey ? '***' + config.apiKey.slice(-4) : null
        maskedConfig.fromNumber = config.fromNumber || null
        break
    }
  }

  res.json({
    success: true,
    data: {
      enabled: smsSettings.enabled !== false,
      provider: smsSettings.provider || 'platform',
      config: maskedConfig
    }
  })
})

// Update partner SMS settings
export const updateSMSSettings = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { enabled, provider, config } = req.body

  // Initialize notifications if not exists
  if (!partner.notifications) {
    partner.notifications = {}
  }
  if (!partner.notifications.sms) {
    partner.notifications.sms = {}
  }

  // Update settings
  if (enabled !== undefined) partner.notifications.sms.enabled = enabled
  if (provider) partner.notifications.sms.provider = provider

  // Update config if provided and provider is not 'platform'
  if (config && provider !== 'platform') {
    if (!partner.notifications.sms.config) {
      partner.notifications.sms.config = {}
    }

    // Only update non-empty values
    Object.keys(config).forEach(key => {
      if (config[key]) {
        partner.notifications.sms.config[key] = config[key]
      }
    })
  }

  await partner.save()

  res.json({
    success: true,
    message: req.t ? req.t('SMS_SETTINGS_UPDATED') : 'SMS settings updated successfully',
    data: {
      enabled: partner.notifications.sms.enabled,
      provider: partner.notifications.sms.provider
    }
  })
})

// Test partner SMS configuration
export const testPartnerSMS = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { phone } = req.body

  if (!phone) {
    throw new BadRequestError('PHONE_REQUIRED')
  }

  const smsSettings = partner.notifications?.sms
  if (!smsSettings || smsSettings.provider === 'platform') {
    throw new BadRequestError('OWN_SMS_NOT_CONFIGURED')
  }

  // Get decrypted credentials
  const credentials = partner.getSMSCredentials()
  if (!credentials) {
    throw new BadRequestError('SMS_CREDENTIALS_NOT_CONFIGURED')
  }

  try {
    // Import SMS provider factory
    const SMSProviderFactory = (await import('../../services/sms/index.js')).default

    // Get provider and send test message
    const provider = await SMSProviderFactory.createProvider(smsSettings.provider, credentials)
    const result = await provider.send({
      phone,
      message: 'Booking Platform test mesajı. SMS yapılandırmanız başarılı!'
    })

    if (result.success) {
      logger.info(`Test SMS sent for partner ${partner._id} to ${phone}`)

      res.json({
        success: true,
        message: req.t ? req.t('TEST_SMS_SENT') : 'Test SMS sent successfully',
        messageId: result.messageId
      })
    } else {
      throw new BadRequestError(result.error || 'SMS_SEND_FAILED')
    }
  } catch (error) {
    logger.error(`Test SMS failed for partner ${partner._id}: ${error.message}`)

    res.status(400).json({
      success: false,
      error: error.message || 'Failed to send test SMS'
    })
  }
})

// Get partner SMS balance
export const getSMSBalance = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const smsSettings = partner.notifications?.sms
  if (!smsSettings || smsSettings.provider === 'platform') {
    throw new BadRequestError('OWN_SMS_NOT_CONFIGURED')
  }

  // Get decrypted credentials
  const credentials = partner.getSMSCredentials()
  if (!credentials) {
    throw new BadRequestError('SMS_CREDENTIALS_NOT_CONFIGURED')
  }

  try {
    // Import SMS provider factory
    const SMSProviderFactory = (await import('../../services/sms/index.js')).default

    // Get provider and check balance
    const provider = await SMSProviderFactory.createProvider(smsSettings.provider, credentials)
    const result = await provider.getBalance()

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error(`Balance check failed for partner ${partner._id}: ${error.message}`)

    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get SMS balance'
    })
  }
})

// Get available SMS providers
export const getSMSProviders = asyncHandler(async (req, res) => {
  const SMSProviderFactory = (await import('../../services/sms/index.js')).default

  const providers = await SMSProviderFactory.getAvailableProviders()

  // Add platform as default option
  const allProviders = [
    {
      name: 'platform',
      displayName: 'Platform Varsayılanı',
      fields: [],
      supportsBalance: false
    },
    ...providers
  ]

  res.json({
    success: true,
    data: allProviders
  })
})

// ==================== PMS Integration ====================

/**
 * Activate PMS for a partner
 * - Generates API credentials
 * - Queues hotel provisioning jobs for all partner hotels
 * - Queues admin user provisioning job
 */
export const activatePms = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Check if PMS is already activated
  if (partner.pmsIntegration?.enabled && partner.pmsIntegration?.provisioningStatus === 'completed') {
    throw new ConflictError('PMS_ALREADY_ACTIVATED')
  }

  // Check queue status
  const queueStatus = await getQueueStatus()
  if (!queueStatus.enabled) {
    throw new BadRequestError('PMS_QUEUE_NOT_AVAILABLE')
  }

  // Get optional PMS domain from request
  const { pmsDomain } = req.body

  // Generate PMS credentials if not already generated
  if (!partner.pmsIntegration?.apiSettings?.apiKey) {
    partner.generatePmsCredentials()
  }

  // Update PMS integration settings
  partner.pmsIntegration.enabled = true
  partner.pmsIntegration.provisioningStatus = 'pending'
  if (pmsDomain) {
    partner.pmsIntegration.pmsDomain = pmsDomain
  }

  await partner.save()

  // Get all active hotels for this partner
  const hotels = await Hotel.find({ partner: partner._id, status: 'active' })

  if (hotels.length === 0) {
    throw new BadRequestError('NO_HOTELS_TO_PROVISION')
  }

  // Get partner admin user
  const adminUser = await User.findOne({
    accountType: 'partner',
    accountId: partner._id,
    role: 'admin',
    status: 'active'
  })

  if (!adminUser) {
    throw new NotFoundError('PARTNER_ADMIN_USER_NOT_FOUND')
  }

  // Generate temporary password for PMS user
  const tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 16)

  // Queue provisioning jobs
  const jobResults = {
    hotels: [],
    user: null
  }

  try {
    // Queue hotel provisioning jobs
    for (const hotel of hotels) {
      // Skip already provisioned hotels
      if (partner.isHotelProvisioned(hotel._id)) {
        logger.info(`Hotel ${hotel._id} already provisioned, skipping`)
        continue
      }

      const jobInfo = await queueHotelProvisioning(partner, hotel)
      jobResults.hotels.push({
        hotelId: hotel._id,
        hotelName: hotel.name?.tr || hotel.name?.en || hotel.name,
        jobId: jobInfo.jobId
      })

      // Track provisioned hotel
      partner.pmsIntegration.provisionedHotels.push({
        hotelId: hotel._id,
        status: 'pending',
        provisionedAt: new Date()
      })
    }

    // Queue user provisioning for the first hotel
    if (hotels.length > 0) {
      const primaryHotel = hotels[0]
      const userJobInfo = await queueUserProvisioning(partner, primaryHotel, adminUser, tempPassword)
      jobResults.user = {
        userId: adminUser._id,
        email: adminUser.email,
        jobId: userJobInfo.jobId,
        tempPassword // Only returned once - should be sent via email
      }
    }

    await partner.save()

    logger.info(`PMS activation initiated for partner ${partner._id}: ${jobResults.hotels.length} hotels, 1 user`)

    res.json({
      success: true,
      message: req.t ? req.t('PMS_ACTIVATION_INITIATED') : 'PMS activation initiated',
      data: {
        partnerId: partner._id,
        status: partner.pmsIntegration.provisioningStatus,
        queuedJobs: {
          hotels: jobResults.hotels.length,
          users: jobResults.user ? 1 : 0
        },
        tempPassword: jobResults.user?.tempPassword,
        pmsDomain: partner.pmsIntegration.pmsDomain
      }
    })
  } catch (error) {
    // Update status on failure
    partner.pmsIntegration.provisioningStatus = 'failed'
    partner.pmsIntegration.lastError = {
      message: error.message,
      timestamp: new Date()
    }
    await partner.save()

    logger.error(`PMS activation failed for partner ${partner._id}: ${error.message}`)
    throw new BadRequestError(error.message || 'PMS_ACTIVATION_FAILED')
  }
})

/**
 * Get PMS integration status for a partner
 */
export const getPmsStatus = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const pmsIntegration = partner.pmsIntegration || {}

  // Get queue status
  const queueStatus = await getQueueStatus()

  // Get provisioned hotels details
  const provisionedHotels = []
  if (pmsIntegration.provisionedHotels?.length > 0) {
    const hotelIds = pmsIntegration.provisionedHotels.map(h => h.hotelId)
    const hotels = await Hotel.find({ _id: { $in: hotelIds } }).select('name slug').lean()
    const hotelMap = new Map(hotels.map(h => [h._id.toString(), h]))

    for (const ph of pmsIntegration.provisionedHotels) {
      const hotel = hotelMap.get(ph.hotelId.toString())
      provisionedHotels.push({
        hotelId: ph.hotelId,
        hotelName: hotel?.name?.tr || hotel?.name?.en || 'Unknown',
        pmsHotelId: ph.pmsHotelId,
        status: ph.status,
        provisionedAt: ph.provisionedAt,
        lastError: ph.lastError
      })
    }
  }

  res.json({
    success: true,
    data: {
      enabled: pmsIntegration.enabled || false,
      pmsDomain: pmsIntegration.pmsDomain,
      provisioningStatus: pmsIntegration.provisioningStatus || 'none',
      provisionedHotels,
      lastSyncAt: pmsIntegration.lastSyncAt,
      lastError: pmsIntegration.lastError,
      queueStatus: {
        enabled: queueStatus.enabled,
        status: queueStatus.status
      }
    }
  })
})

// ==================== Subscription Management ====================

/**
 * Get all purchases across all partners (for admin subscription management)
 */
export const getAllPurchases = asyncHandler(async (req, res) => {
  // Get all partners with their subscription purchases
  const partners = await Partner.find({
    'subscription.purchases': { $exists: true, $ne: [] }
  }).select('companyName email subscription.purchases').lean()

  // Flatten purchases with partner info
  const allPurchases = []

  for (const partner of partners) {
    if (partner.subscription?.purchases) {
      for (const purchase of partner.subscription.purchases) {
        allPurchases.push({
          partner: {
            _id: partner._id,
            companyName: partner.companyName,
            email: partner.email
          },
          purchase: {
            _id: purchase._id,
            plan: purchase.plan,
            planName: SUBSCRIPTION_PLANS[purchase.plan]?.name || purchase.plan,
            period: purchase.period,
            price: purchase.price,
            payment: purchase.payment,
            status: purchase.status,
            createdAt: purchase.createdAt
          }
        })
      }
    }
  }

  // Sort by createdAt desc (newest first)
  allPurchases.sort((a, b) => new Date(b.purchase.createdAt) - new Date(a.purchase.createdAt))

  res.json({
    success: true,
    data: allPurchases
  })
})

/**
 * Get available subscription plans
 */
export const getSubscriptionPlans = asyncHandler(async (req, res) => {
  const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, value]) => ({
    id: key,
    ...value
  }))

  res.json({
    success: true,
    data: plans
  })
})

/**
 * Get partner subscription details
 */
export const getSubscription = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Use the helper method to get full subscription status
  const subscriptionStatus = partner.getSubscriptionStatus()

  res.json({
    success: true,
    data: subscriptionStatus
  })
})

/**
 * Update partner subscription settings (customLimits, status, notes)
 * Note: Plan and dates are managed through purchases
 */
export const updateSubscription = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { customLimits, notes, status } = req.body

  // Initialize subscription if not exists
  if (!partner.subscription) {
    partner.subscription = { purchases: [] }
  }

  // Update status (for manual override like suspend/cancel)
  if (status) {
    const validStatuses = ['active', 'cancelled', 'suspended']
    if (!validStatuses.includes(status)) {
      throw new BadRequestError('INVALID_SUBSCRIPTION_STATUS')
    }
    partner.subscription.status = status
    logger.info(`Partner ${partner._id} subscription status set to: ${status}`)
  }

  // Update custom limits
  if (customLimits !== undefined) {
    if (!partner.subscription.customLimits) {
      partner.subscription.customLimits = {}
    }

    // Handle pmsMaxHotels
    if (customLimits.pmsMaxHotels !== undefined) {
      const pmsLimit = customLimits.pmsMaxHotels

      // Validate: must be -1 (unlimited), 0 (disabled), null (use plan default), or positive number
      if (pmsLimit !== null && pmsLimit !== -1 && pmsLimit < 0) {
        throw new BadRequestError('INVALID_PMS_LIMIT')
      }

      partner.subscription.customLimits.pmsMaxHotels = pmsLimit

      // Update pmsIntegration.enabled based on custom limit
      if (pmsLimit > 0 || pmsLimit === -1) {
        if (!partner.pmsIntegration) {
          partner.pmsIntegration = {}
        }
        partner.pmsIntegration.enabled = true
      } else if (pmsLimit === 0) {
        if (partner.pmsIntegration) {
          partner.pmsIntegration.enabled = false
        }
      }

      logger.info(`Partner ${partner._id} custom PMS limit set: ${pmsLimit}`)
    }
  }

  // Update notes
  if (notes !== undefined) {
    partner.subscription.notes = notes
  }

  await partner.save()

  // Return updated subscription status
  const subscriptionStatus = partner.getSubscriptionStatus()

  res.json({
    success: true,
    message: req.t ? req.t('SUBSCRIPTION_UPDATED') : 'Subscription updated successfully',
    data: subscriptionStatus
  })
})

/**
 * Add purchase (package) to partner subscription
 * @param {boolean} isPaid - If false, creates a pending purchase awaiting payment
 */
export const addPurchase = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const {
    plan,
    startDate,
    endDate,
    amount,
    currency,
    isPaid = true,
    paymentDate,
    paymentMethod,
    paymentReference,
    paymentNotes
  } = req.body

  // Validate required fields
  if (!plan || !startDate || !endDate || !amount) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  // Validate plan
  if (!PLAN_TYPES.includes(plan)) {
    throw new BadRequestError('INVALID_SUBSCRIPTION_PLAN')
  }

  // Initialize subscription if not exists
  if (!partner.subscription) {
    partner.subscription = { purchases: [] }
  }
  if (!partner.subscription.purchases) {
    partner.subscription.purchases = []
  }

  // Mark previous active purchases as expired (if their end date has passed)
  const now = new Date()
  partner.subscription.purchases.forEach(p => {
    if (p.status === 'active' && new Date(p.period.endDate) < now) {
      p.status = 'expired'
    }
  })

  // Create purchase object - always starts as 'pending', requires manual approval
  const purchase = {
    plan,
    period: {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    },
    price: {
      amount,
      currency: currency || 'USD'
    },
    status: 'pending', // Always pending - must be approved via "Mark as Paid"
    createdAt: new Date(),
    createdBy: req.user._id
  }

  // Add purchase to array
  partner.subscription.purchases.push(purchase)

  await partner.save()

  // Get the added purchase with its generated _id
  const addedPurchase = partner.subscription.purchases[partner.subscription.purchases.length - 1]

  logger.info(
    `Purchase added for partner ${partner._id}: ${plan} - ${amount} ${currency || 'USD'} (pending - awaiting payment approval)`
  )

  res.json({
    success: true,
    message: req.t ? req.t('PURCHASE_ADDED') : 'Purchase added successfully',
    data: {
      purchase: {
        _id: addedPurchase._id,
        plan: addedPurchase.plan,
        planName: SUBSCRIPTION_PLANS[addedPurchase.plan]?.name || addedPurchase.plan,
        period: addedPurchase.period,
        price: addedPurchase.price,
        status: addedPurchase.status
      },
      subscription: partner.getSubscriptionStatus()
    }
  })
})

/**
 * Update existing purchase
 */
export const updatePurchase = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { purchaseId } = req.params
  const { plan, startDate, endDate, amount, currency, paymentMethod, paymentReference, paymentNotes } = req.body

  const purchase = partner.subscription?.purchases?.find(p => p._id.toString() === purchaseId)

  if (!purchase) {
    throw new NotFoundError('PURCHASE_NOT_FOUND')
  }

  // Only pending or active purchases can be edited
  if (!['pending', 'active'].includes(purchase.status)) {
    throw new BadRequestError('PURCHASE_CANNOT_BE_EDITED')
  }

  // Update fields if provided
  if (plan) {
    if (!PLAN_TYPES.includes(plan)) {
      throw new BadRequestError('INVALID_SUBSCRIPTION_PLAN')
    }
    purchase.plan = plan
  }

  if (startDate) purchase.period.startDate = new Date(startDate)
  if (endDate) purchase.period.endDate = new Date(endDate)

  if (amount !== undefined) purchase.price.amount = amount
  if (currency) purchase.price.currency = currency

  // Update payment info if provided (for pending purchases)
  if (paymentMethod || paymentReference || paymentNotes) {
    if (!purchase.payment) purchase.payment = {}
    if (paymentMethod) purchase.payment.method = paymentMethod
    if (paymentReference !== undefined) purchase.payment.reference = paymentReference
    if (paymentNotes !== undefined) purchase.payment.notes = paymentNotes
  }

  await partner.save()

  logger.info(`Purchase ${purchaseId} updated for partner ${partner._id}`)

  res.json({
    success: true,
    message: req.t ? req.t('PURCHASE_UPDATED') : 'Purchase updated successfully',
    data: {
      purchase: {
        _id: purchase._id,
        plan: purchase.plan,
        planName: SUBSCRIPTION_PLANS[purchase.plan]?.name || purchase.plan,
        period: purchase.period,
        price: purchase.price,
        payment: purchase.payment,
        status: purchase.status
      },
      subscription: partner.getSubscriptionStatus()
    }
  })
})

/**
 * Mark pending purchase as paid
 */
export const markPurchaseAsPaid = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { purchaseId } = req.params
  const { paymentDate, paymentMethod, paymentReference, paymentNotes } = req.body

  if (!paymentDate) {
    throw new BadRequestError('PAYMENT_DATE_REQUIRED')
  }

  const purchase = partner.subscription?.purchases?.find(p => p._id.toString() === purchaseId)

  if (!purchase) {
    throw new NotFoundError('PURCHASE_NOT_FOUND')
  }

  if (purchase.status !== 'pending') {
    throw new BadRequestError('PURCHASE_NOT_PENDING')
  }

  // Update purchase status and payment info
  purchase.status = 'active'
  purchase.payment = {
    date: new Date(paymentDate),
    method: paymentMethod || 'bank_transfer',
    reference: paymentReference,
    notes: paymentNotes
  }

  // Update general subscription status
  partner.subscription.status = 'active'

  // Update PMS integration based on plan
  const planConfig = SUBSCRIPTION_PLANS[purchase.plan]
  if (planConfig?.pmsEnabled) {
    if (!partner.pmsIntegration) {
      partner.pmsIntegration = {}
    }
    partner.pmsIntegration.enabled = true
  }

  await partner.save()

  // Create invoice for the purchase
  let invoice = null
  try {
    invoice = await createInvoice(partner._id, purchase, req.user._id)

    // Update purchase with invoice reference
    purchase.invoice = invoice._id
    await partner.save()

    logger.info(`Invoice ${invoice.invoiceNumber} created for partner ${partner._id}`)
  } catch (invoiceError) {
    logger.error(`Failed to create invoice for partner ${partner._id}: ${invoiceError.message}`)
  }

  logger.info(`Purchase ${purchaseId} marked as paid for partner ${partner._id}`)

  res.json({
    success: true,
    message: req.t ? req.t('PURCHASE_MARKED_PAID') : 'Purchase marked as paid successfully',
    data: {
      purchase: {
        _id: purchase._id,
        plan: purchase.plan,
        planName: SUBSCRIPTION_PLANS[purchase.plan]?.name || purchase.plan,
        period: purchase.period,
        price: purchase.price,
        payment: purchase.payment,
        status: purchase.status,
        invoice: invoice
          ? {
              _id: invoice._id,
              invoiceNumber: invoice.invoiceNumber
            }
          : null
      },
      subscription: partner.getSubscriptionStatus()
    }
  })
})

/**
 * Cancel purchase from partner subscription
 */
export const cancelPurchase = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { purchaseId } = req.params
  const { reason } = req.body

  const purchase = partner.subscription?.purchases?.find(p => p._id.toString() === purchaseId)

  if (!purchase) {
    throw new NotFoundError('PURCHASE_NOT_FOUND')
  }

  if (purchase.status === 'cancelled') {
    throw new BadRequestError('PURCHASE_ALREADY_CANCELLED')
  }

  // Cancel the purchase
  purchase.status = 'cancelled'
  purchase.cancelledAt = new Date()
  purchase.cancelledBy = req.user._id
  purchase.cancellationReason = reason

  // Recalculate subscription status
  partner.subscription.status = partner.calculateSubscriptionStatus()

  await partner.save()

  logger.info(`Purchase ${purchaseId} cancelled for partner ${partner._id}`)

  res.json({
    success: true,
    message: req.t ? req.t('PURCHASE_CANCELLED') : 'Purchase cancelled successfully',
    data: {
      subscription: partner.getSubscriptionStatus()
    }
  })
})
