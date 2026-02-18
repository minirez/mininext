import SiteSettings from './siteSettings.model.js'
import Partner from '../partner/partner.model.js'
import { NotFoundError, BadRequestError, ConflictError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { getSiteFileUrl, deleteSiteFile } from '#helpers/siteUpload.js'
import logger from '#core/logger.js'
import sslService from '#services/sslService.js'
import { getPartnerId } from '#services/helpers.js'
import {
  hostinger,
  checkExistingRecord,
  createAutoRecord,
  isRootDomain
} from '#services/dns/index.js'

// Get site settings
export const getSiteSettings = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  // Verify partner exists
  const partner = await Partner.findById(partnerId)
  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Get or create settings
  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  res.json({
    success: true,
    data: settings
  })
})

// Update site settings (general update)
export const updateSiteSettings = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  // Update allowed fields
  const { setup, general, homepage, contact } = req.body

  if (setup) {
    settings.setup = { ...settings.setup, ...setup }
  }
  if (general) {
    settings.general = { ...settings.general, ...general }
  }
  if (homepage) {
    settings.homepage = { ...settings.homepage, ...homepage }
  }
  if (contact) {
    settings.contact = { ...settings.contact, ...contact }
  }

  await settings.save()

  res.json({
    success: true,
    message: req.t('SITE_SETTINGS_UPDATED'),
    data: settings
  })
})

// Update setup section (domains)
export const updateSetup = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  const { b2cDomain, b2bDomain, pmsDomain } = req.body

  // Clean domain: trim, lowercase, empty string -> null (sparse index uyumu)
  const cleanDomain = d => (d && d.trim() ? d.trim().toLowerCase() : null)

  // Domain benzersizlik kontrolü (Partner branding unique sparse index)
  const domainChecks = [
    { value: b2cDomain, field: 'branding.siteDomain' },
    { value: b2bDomain, field: 'branding.extranetDomain' },
    { value: pmsDomain, field: 'branding.pmsDomain' }
  ]

  for (const { value, field } of domainChecks) {
    if (value === undefined) continue
    const clean = cleanDomain(value)
    if (!clean) continue
    const existing = await Partner.findOne({
      [field]: clean,
      _id: { $ne: partnerId }
    })
    if (existing) {
      throw new ConflictError(req.t('DOMAIN_ALREADY_IN_USE'))
    }
  }

  if (b2cDomain !== undefined) {
    const clean = cleanDomain(b2cDomain)
    const oldDomain = settings.setup.b2cDomain
    if (clean !== oldDomain) {
      settings.setup.b2cSslStatus = 'none'
      if (oldDomain) {
        sslService
          .removeNginxConfig(oldDomain)
          .catch(err =>
            logger.error(`[SSL] Failed to remove nginx config for ${oldDomain}:`, err.message)
          )
      }
    }
    settings.setup.b2cDomain = clean || ''
  }

  if (b2bDomain !== undefined) {
    const clean = cleanDomain(b2bDomain)
    const oldDomain = settings.setup.b2bDomain
    if (clean !== oldDomain) {
      settings.setup.b2bSslStatus = 'none'
      if (oldDomain) {
        sslService
          .removeNginxConfig(oldDomain)
          .catch(err =>
            logger.error(`[SSL] Failed to remove nginx config for ${oldDomain}:`, err.message)
          )
      }
    }
    settings.setup.b2bDomain = clean || ''
  }

  if (pmsDomain !== undefined) {
    const clean = cleanDomain(pmsDomain)
    const oldDomain = settings.setup.pmsDomain
    if (clean !== oldDomain) {
      settings.setup.pmsSslStatus = 'none'
      if (oldDomain) {
        sslService
          .removeNginxConfig(oldDomain)
          .catch(err =>
            logger.error(`[SSL] Failed to remove nginx config for ${oldDomain}:`, err.message)
          )
      }
    }
    settings.setup.pmsDomain = clean || ''
  }

  await settings.save()

  // Also update partner branding domains (null for empty - sparse index uyumu)
  const updateFields = {}
  if (b2cDomain !== undefined) updateFields['branding.siteDomain'] = cleanDomain(b2cDomain)
  if (b2bDomain !== undefined) updateFields['branding.extranetDomain'] = cleanDomain(b2bDomain)
  if (pmsDomain !== undefined) updateFields['branding.pmsDomain'] = cleanDomain(pmsDomain)

  if (Object.keys(updateFields).length > 0) {
    try {
      await Partner.findByIdAndUpdate(partnerId, updateFields)
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictError(req.t('DOMAIN_ALREADY_IN_USE'))
      }
      throw err
    }
  }

  res.json({
    success: true,
    message: req.t('SETUP_UPDATED'),
    data: settings.setup
  })
})

// Update general settings
export const updateGeneral = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  const allowedFields = [
    'logo',
    'favicon',
    'activeLanguages',
    'defaultLanguage',
    'maintenanceMode',
    'maintenanceMessage',
    'siteTitle',
    'siteDescription'
  ]

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      settings.general[field] = req.body[field]
    }
  })

  if (req.body.tursab !== undefined) {
    settings.general.tursab = {
      ...settings.general.tursab,
      ...req.body.tursab
    }
  }

  await settings.save()

  res.json({
    success: true,
    message: req.t('GENERAL_SETTINGS_UPDATED'),
    data: settings.general
  })
})

// Update homepage settings
export const updateHomepage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  const { slider, activeServices } = req.body

  if (slider !== undefined) {
    settings.homepage.slider = slider
  }

  if (activeServices !== undefined) {
    settings.homepage.activeServices = {
      ...settings.homepage.activeServices,
      ...activeServices
    }
  }

  await settings.save()

  res.json({
    success: true,
    message: req.t('HOMEPAGE_SETTINGS_UPDATED'),
    data: settings.homepage
  })
})

// Update contact settings
export const updateContact = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  const { callCenter, whatsapp, email, address, socialMedia } = req.body

  if (callCenter !== undefined) {
    settings.contact.callCenter = { ...settings.contact.callCenter, ...callCenter }
  }
  if (whatsapp !== undefined) {
    settings.contact.whatsapp = { ...settings.contact.whatsapp, ...whatsapp }
  }
  if (email !== undefined) {
    settings.contact.email = { ...settings.contact.email, ...email }
  }
  if (address !== undefined) {
    settings.contact.address = { ...settings.contact.address, ...address }
  }
  if (socialMedia !== undefined) {
    settings.contact.socialMedia = { ...settings.contact.socialMedia, ...socialMedia }
  }

  await settings.save()

  res.json({
    success: true,
    message: req.t('CONTACT_SETTINGS_UPDATED'),
    data: settings.contact
  })
})

// Update tracking settings
export const updateTracking = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  const { googleAnalytics, googleTagManager, facebookPixel, microsoftClarity, customScripts } =
    req.body

  if (!settings.tracking) {
    settings.tracking = {}
  }

  if (googleAnalytics !== undefined) {
    settings.tracking.googleAnalytics = { ...settings.tracking.googleAnalytics, ...googleAnalytics }
  }
  if (googleTagManager !== undefined) {
    settings.tracking.googleTagManager = {
      ...settings.tracking.googleTagManager,
      ...googleTagManager
    }
  }
  if (facebookPixel !== undefined) {
    settings.tracking.facebookPixel = { ...settings.tracking.facebookPixel, ...facebookPixel }
  }
  if (microsoftClarity !== undefined) {
    settings.tracking.microsoftClarity = {
      ...settings.tracking.microsoftClarity,
      ...microsoftClarity
    }
  }
  if (customScripts !== undefined) {
    settings.tracking.customScripts = { ...settings.tracking.customScripts, ...customScripts }
  }

  await settings.save()

  res.json({
    success: true,
    message: req.t('TRACKING_SETTINGS_UPDATED'),
    data: settings.tracking
  })
})

// Add slider item
export const addSliderItem = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  const newSlider = {
    image: req.body.image || '',
    title: req.body.title || {},
    subtitle: req.body.subtitle || {},
    link: req.body.link || '',
    order: settings.homepage.slider.length,
    isActive: req.body.isActive !== false
  }

  settings.homepage.slider.push(newSlider)
  await settings.save()

  res.status(201).json({
    success: true,
    message: req.t('SLIDER_ADDED'),
    data: settings.homepage.slider
  })
})

// Update slider item
export const updateSliderItem = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { sliderId } = req.params

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  const sliderIndex = settings.homepage.slider.findIndex(s => s._id.toString() === sliderId)

  if (sliderIndex === -1) {
    throw new NotFoundError('SLIDER_NOT_FOUND')
  }

  const allowedFields = ['image', 'title', 'subtitle', 'link', 'order', 'isActive']
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      settings.homepage.slider[sliderIndex][field] = req.body[field]
    }
  })

  await settings.save()

  res.json({
    success: true,
    message: req.t('SLIDER_UPDATED'),
    data: settings.homepage.slider
  })
})

// Delete slider item
export const deleteSliderItem = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { sliderId } = req.params

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  const sliderIndex = settings.homepage.slider.findIndex(s => s._id.toString() === sliderId)

  if (sliderIndex === -1) {
    throw new NotFoundError('SLIDER_NOT_FOUND')
  }

  settings.homepage.slider.splice(sliderIndex, 1)
  await settings.save()

  res.json({
    success: true,
    message: req.t('SLIDER_DELETED'),
    data: settings.homepage.slider
  })
})

// Request SSL certificate (placeholder for production implementation)
export const requestSsl = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { type } = req.body // 'b2c', 'b2b', or 'pms'

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  if (!['b2c', 'b2b', 'pms'].includes(type)) {
    throw new BadRequestError('INVALID_SSL_TYPE')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  const domainFieldMap = { b2c: 'b2cDomain', b2b: 'b2bDomain', pms: 'pmsDomain' }
  const statusFieldMap = { b2c: 'b2cSslStatus', b2b: 'b2bSslStatus', pms: 'pmsSslStatus' }

  const domainField = domainFieldMap[type]
  const statusField = statusFieldMap[type]

  if (!settings.setup[domainField]) {
    throw new BadRequestError('DOMAIN_NOT_SET')
  }

  // In production, this would trigger Let's Encrypt SSL request
  // For now, just set status to pending
  settings.setup[statusField] = 'pending'
  await settings.save()

  logger.info(`SSL certificate requested for ${type} domain: ${settings.setup[domainField]}`)

  res.json({
    success: true,
    message: req.t('SSL_REQUEST_SUBMITTED'),
    data: settings.setup
  })
})

// Verify DNS CNAME record for a domain
export const verifyDns = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { type, domain } = req.body // 'b2c', 'b2b', or 'pms'

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  if (!['b2c', 'b2b', 'pms'].includes(type)) {
    throw new BadRequestError('INVALID_SSL_TYPE')
  }

  if (!domain) {
    throw new BadRequestError('DOMAIN_REQUIRED')
  }

  // DNS doğrulama yap
  const result = await sslService.verifyDNS(domain)

  res.json({
    success: result.success,
    message: req.t(result.message),
    data: {
      verified: result.success,
      cnameTarget: result.cnameTarget,
      serverIP: result.serverIP,
      domainIP: result.domainIP
    }
  })
})

// Full SSL setup (DNS verify + Certificate + Nginx)
export const setupSsl = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { type } = req.body // 'b2c', 'b2b', or 'pms'

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  if (!['b2c', 'b2b', 'pms'].includes(type)) {
    throw new BadRequestError('INVALID_SSL_TYPE')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  const domainFieldMap = { b2c: 'b2cDomain', b2b: 'b2bDomain', pms: 'pmsDomain' }
  const statusFieldMap = { b2c: 'b2cSslStatus', b2b: 'b2bSslStatus', pms: 'pmsSslStatus' }
  const expiryFieldMap = { b2c: 'b2cSslExpiresAt', b2b: 'b2bSslExpiresAt', pms: 'pmsSslExpiresAt' }

  const domainField = domainFieldMap[type]
  const statusField = statusFieldMap[type]
  const expiryField = expiryFieldMap[type]

  const domain = settings.setup[domainField]

  if (!domain) {
    throw new BadRequestError('DOMAIN_NOT_SET')
  }

  // Status'u pending yap
  settings.setup[statusField] = 'pending'
  await settings.save()

  logger.info(`[SSL] Starting SSL setup for ${domain} (${type}, partner: ${partnerId})`)

  // Tam SSL kurulumu yap
  const result = await sslService.setupSSL(domain, type, partnerId.toString())

  if (result.success) {
    // Başarılı - status'u active yap
    settings.setup[statusField] = 'active'
    settings.setup[expiryField] = result.expiresAt
    await settings.save()

    logger.info(`[SSL] SSL setup completed for ${domain}`)

    res.json({
      success: true,
      message: req.t('SSL_SETUP_COMPLETE'),
      data: {
        status: 'active',
        expiresAt: result.expiresAt,
        setup: settings.setup
      }
    })
  } else {
    // Başarısız - status'u failed yap
    settings.setup[statusField] = 'failed'
    await settings.save()

    logger.error(`[SSL] SSL setup failed for ${domain}: ${result.message}`)

    res.status(400).json({
      success: false,
      message: req.t(result.message),
      data: {
        status: 'failed',
        step: result.step,
        details: result.details || null,
        setup: settings.setup
      }
    })
  }
})

// Get SSL status for a domain type
export const getSslStatus = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { type } = req.params // 'b2c', 'b2b', or 'pms'

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  if (!['b2c', 'b2b', 'pms'].includes(type)) {
    throw new BadRequestError('INVALID_SSL_TYPE')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  const domainFieldMap = { b2c: 'b2cDomain', b2b: 'b2bDomain', pms: 'pmsDomain' }
  const statusFieldMap = { b2c: 'b2cSslStatus', b2b: 'b2bSslStatus', pms: 'pmsSslStatus' }
  const expiryFieldMap = { b2c: 'b2cSslExpiresAt', b2b: 'b2bSslExpiresAt', pms: 'pmsSslExpiresAt' }

  const domain = settings.setup[domainFieldMap[type]]
  const status = settings.setup[statusFieldMap[type]] || 'none'
  const expiresAt = settings.setup[expiryFieldMap[type]]

  // Eğer domain varsa ve status active ise, sertifika bilgilerini kontrol et
  let certInfo = null
  if (domain && status === 'active') {
    certInfo = await sslService.checkCertificate(domain)
  }

  res.json({
    success: true,
    data: {
      domain,
      status,
      expiresAt,
      certInfo
    }
  })
})

// Upload site image (logo, favicon, slider)
export const uploadSiteImage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  if (!req.file) {
    throw new BadRequestError('FILE_REQUIRED')
  }

  const type = req.body.type || 'image'
  const fileUrl = getSiteFileUrl(partnerId, req.file.filename)

  if (type === 'logo' || type === 'favicon') {
    const settings = await SiteSettings.getOrCreateForPartner(partnerId)
    settings.general[type] = fileUrl
    await settings.save()
  } else if (type === 'tursab') {
    const settings = await SiteSettings.getOrCreateForPartner(partnerId)
    if (!settings.general.tursab) settings.general.tursab = {}
    settings.general.tursab.photo = fileUrl
    await settings.save()
  }

  res.json({
    success: true,
    message: req.t('FILE_UPLOADED'),
    data: {
      url: fileUrl,
      filename: req.file.filename,
      type
    }
  })
})

// Delete site image
export const deleteSiteImage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { filename, type } = req.body

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  if (!filename) {
    throw new BadRequestError('FILENAME_REQUIRED')
  }

  // Delete file from disk
  deleteSiteFile(partnerId, filename)

  if (type === 'logo' || type === 'favicon') {
    const settings = await SiteSettings.getOrCreateForPartner(partnerId)
    settings.general[type] = ''
    await settings.save()
  } else if (type === 'tursab') {
    const settings = await SiteSettings.getOrCreateForPartner(partnerId)
    if (settings.general.tursab) {
      settings.general.tursab.photo = ''
    }
    await settings.save()
  }

  res.json({
    success: true,
    message: req.t('FILE_DELETED')
  })
})

// ==================== DNS Management ====================

// Get DNS records for a domain
export const getDnsRecords = asyncHandler(async (req, res) => {
  const { domain } = req.query

  if (!domain) {
    throw new BadRequestError('DOMAIN_REQUIRED')
  }

  try {
    const records = await hostinger.getRecords(domain)

    res.json({
      success: true,
      data: records
    })
  } catch (err) {
    if (err.code === 'DOMAIN_NOT_IN_HOSTINGER') {
      return res.status(404).json({
        success: false,
        error: 'DOMAIN_NOT_IN_HOSTINGER',
        message: 'This domain is not managed by Hostinger'
      })
    }
    throw err
  }
})

// Update (add/replace) DNS records
export const updateDnsRecords = asyncHandler(async (req, res) => {
  const { domain, records, overwrite } = req.body

  if (!domain) {
    throw new BadRequestError('DOMAIN_REQUIRED')
  }
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new BadRequestError('RECORDS_REQUIRED')
  }

  const result = await hostinger.updateRecords(domain, records, overwrite || false)

  res.json({
    success: true,
    data: result
  })
})

// Delete DNS records
export const deleteDnsRecords = asyncHandler(async (req, res) => {
  const { domain, filters } = req.body

  if (!domain) {
    throw new BadRequestError('DOMAIN_REQUIRED')
  }
  if (!filters || !Array.isArray(filters) || filters.length === 0) {
    throw new BadRequestError('FILTERS_REQUIRED')
  }

  const result = await hostinger.deleteRecords(domain, filters)

  res.json({
    success: true,
    data: result
  })
})

// Create DNS record automatically (A for root domain, CNAME for subdomain)
export const createCname = asyncHandler(async (req, res) => {
  const { domain } = req.body

  if (!domain) {
    throw new BadRequestError('DOMAIN_REQUIRED')
  }

  const { exists, notInHostinger, isRoot } = await checkExistingRecord(domain)

  if (notInHostinger) {
    return res.status(404).json({
      success: false,
      error: 'DOMAIN_NOT_IN_HOSTINGER',
      message: 'This domain is not managed by Hostinger'
    })
  }

  if (exists) {
    return res.json({
      success: true,
      alreadyExists: true,
      isRoot,
      message: isRoot ? 'A record already exists' : 'CNAME record already exists'
    })
  }

  const result = await createAutoRecord(domain)

  res.json({
    success: true,
    data: result,
    isRoot,
    message: isRoot ? 'A record created successfully' : 'CNAME record created successfully'
  })
})

// One-click setup: CNAME + SSL
export const oneClickSetup = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { type } = req.body // 'b2c', 'b2b', or 'pms'

  if (!partnerId) {
    throw new BadRequestError('PARTNER_REQUIRED')
  }

  if (!['b2c', 'b2b', 'pms'].includes(type)) {
    throw new BadRequestError('INVALID_TYPE')
  }

  const settings = await SiteSettings.getOrCreateForPartner(partnerId)

  const domainFieldMap = { b2c: 'b2cDomain', b2b: 'b2bDomain', pms: 'pmsDomain' }
  const statusFieldMap = { b2c: 'b2cSslStatus', b2b: 'b2bSslStatus', pms: 'pmsSslStatus' }
  const expiryFieldMap = { b2c: 'b2cSslExpiresAt', b2b: 'b2bSslExpiresAt', pms: 'pmsSslExpiresAt' }

  const domain = settings.setup[domainFieldMap[type]]

  if (!domain) {
    throw new BadRequestError('DOMAIN_NOT_SET')
  }

  logger.info(`[OneClickSetup] Starting for ${domain} (${type}, partner: ${partnerId})`)

  // Step 1: DNS record (A for root, CNAME for subdomain)
  try {
    const { exists, notInHostinger } = await checkExistingRecord(domain)

    if (notInHostinger) {
      return res.status(400).json({
        success: false,
        step: 'dns',
        message: 'This domain is not managed by Hostinger'
      })
    }

    if (!exists) {
      await createAutoRecord(domain)
      logger.info(`[OneClickSetup] DNS record created for ${domain}`)
    } else {
      logger.info(`[OneClickSetup] DNS record already exists for ${domain}`)
    }
  } catch (err) {
    logger.error(`[OneClickSetup] DNS record creation failed for ${domain}:`, err.message)
    return res.status(400).json({
      success: false,
      step: 'dns',
      message: err.message || 'DNS record creation failed'
    })
  }

  // Step 2: SSL setup
  settings.setup[statusFieldMap[type]] = 'pending'
  await settings.save()

  const result = await sslService.setupSSL(domain, type, partnerId.toString())

  if (result.success) {
    settings.setup[statusFieldMap[type]] = 'active'
    settings.setup[expiryFieldMap[type]] = result.expiresAt
    await settings.save()

    logger.info(`[OneClickSetup] Completed for ${domain}`)

    res.json({
      success: true,
      message: 'One-click setup completed',
      data: {
        status: 'active',
        expiresAt: result.expiresAt,
        setup: settings.setup
      }
    })
  } else {
    settings.setup[statusFieldMap[type]] = 'failed'
    await settings.save()

    logger.error(`[OneClickSetup] SSL failed for ${domain}: ${result.message}`)

    res.status(400).json({
      success: false,
      step: result.step || 'ssl',
      message: result.message || 'SSL setup failed',
      data: {
        status: 'failed',
        setup: settings.setup
      }
    })
  }
})
