import Partner from './partner.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { sendEmail } from '#helpers/mail.js'
import sesIdentityService from '#services/sesIdentityService.js'
import logger from '#core/logger.js'

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
