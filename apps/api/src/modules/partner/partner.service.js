import Partner from './partner.model.js'
import User from '../user/user.model.js'
import Agency from '../agency/agency.model.js'
import { NotFoundError, ConflictError, BadRequestError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import { sendWelcomeEmail, sendEmail } from '../../helpers/mail.js'
import sesIdentityService from '../../services/sesIdentityService.js'
import crypto from 'crypto'
import logger from '../../core/logger.js'
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
    filter.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'branding.siteDomain': { $regex: search, $options: 'i' } }
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
    'code'
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

// Approve partner (activate partner and user)
export const approvePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  if (partner.status !== 'pending') {
    throw new ConflictError('PARTNER_NOT_PENDING')
  }

  // Activate partner
  await partner.activate()

  // Activate partner admin user
  await User.updateOne(
    { accountType: 'partner', accountId: partner._id, role: 'admin' },
    { status: 'active' }
  )

  // Note: Email notification will be sent via Partner model post-save hook

  res.json({
    success: true,
    message: req.t('PARTNER_APPROVED'),
    data: partner
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
