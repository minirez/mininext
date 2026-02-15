import Partner from './partner.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Keep a single source of truth for allowed theme ids (admin panel)
const ADMIN_THEME_IDS = [
  'midnight-blue', // default (blue / dark blue)
  'ocean',
  'nord',
  'graphite',
  'sand',
  'forest',
  'rose',
  'sunset',
  'lavender',
  'emerald',
  'citrus',
  'cyber',
  'slate',
  'coffee',
  'winter',
  'aurora',
  'candy',
  'abyss',
  'silk',
  'vintage'
]

const normalizeAdminThemeId = theme => {
  if (!theme || typeof theme !== 'string') return null
  const trimmed = theme.trim()
  return ADMIN_THEME_IDS.includes(trimmed) ? trimmed : null
}

// Update POS settings (for partner users)
export const updatePosSettings = asyncHandler(async (req, res) => {
  const partnerId = req.partnerId

  if (!partnerId) {
    throw new BadRequestError('NO_PARTNER_SELECTED')
  }

  const partner = await Partner.findById(partnerId)
  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const { useOwnPos } = req.body
  if (typeof useOwnPos === 'boolean') {
    if (!partner.paymentSettings) partner.paymentSettings = {}
    partner.paymentSettings.useOwnPos = useOwnPos
    partner.markModified('paymentSettings')
  }

  await partner.save()

  res.json({
    success: true,
    data: { useOwnPos: partner.paymentSettings.useOwnPos }
  })
})

// Get my profile (for partner users)
export const getMyProfile = asyncHandler(async (req, res) => {
  // Get partner ID from authenticated user
  const partnerId = req.partnerId

  if (!partnerId) {
    throw new BadRequestError('NO_PARTNER_SELECTED')
  }

  const partner = await Partner.findById(partnerId).select(
    'companyName tradeName email phone taxOffice taxNumber address branding paymentSettings'
  )

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  res.json({
    success: true,
    data: partner
  })
})

// Update my profile (for partner users - limited fields)
export const updateMyProfile = asyncHandler(async (req, res) => {
  const partnerId = req.partnerId

  if (!partnerId) {
    throw new BadRequestError('NO_PARTNER_SELECTED')
  }

  const partner = await Partner.findById(partnerId)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Only allow updating specific fields (not email, branding domains, etc.)
  const allowedFields = [
    'companyName',
    'tradeName',
    'phone',
    'taxOffice',
    'taxNumber',
    'address',
    'paymentSettings'
  ]

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      partner[field] = req.body[field]
    }
  })

  await partner.save()

  res.json({
    success: true,
    message: req.t ? req.t('PROFILE_UPDATED') : 'Profile updated successfully',
    data: partner
  })
})

/**
 * Update my admin theme (partner users)
 * Route: PUT /partners/my/admin-theme
 */
export const updateMyAdminTheme = asyncHandler(async (req, res) => {
  const partnerId = req.partnerId
  if (!partnerId) {
    throw new BadRequestError('NO_PARTNER_SELECTED')
  }

  const theme = normalizeAdminThemeId(req.body?.theme)
  if (!theme) {
    throw new BadRequestError('INVALID_ADMIN_THEME')
  }

  const partner = await Partner.findById(partnerId)
  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  if (!partner.branding) partner.branding = {}
  partner.branding.adminTheme = theme
  await partner.save()

  res.json({
    success: true,
    message: req.t ? req.t('ADMIN_THEME_UPDATED') : 'Admin theme updated successfully',
    data: { theme: partner.branding.adminTheme }
  })
})

/**
 * Update a partner's admin theme (platform admin)
 * Route: PUT /partners/:id/admin-theme
 */
export const updatePartnerAdminTheme = asyncHandler(async (req, res) => {
  const theme = normalizeAdminThemeId(req.body?.theme)
  if (!theme) {
    throw new BadRequestError('INVALID_ADMIN_THEME')
  }

  const partner = await Partner.findById(req.params.id)
  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  if (!partner.branding) partner.branding = {}
  partner.branding.adminTheme = theme
  await partner.save()

  res.json({
    success: true,
    message: req.t ? req.t('ADMIN_THEME_UPDATED') : 'Admin theme updated successfully',
    data: { theme: partner.branding.adminTheme }
  })
})

// Upload my logo (for partner users)
export const uploadMyLogo = asyncHandler(async (req, res) => {
  const partnerId = req.partnerId

  if (!partnerId) {
    throw new BadRequestError('NO_PARTNER_SELECTED')
  }

  const partner = await Partner.findById(partnerId)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  if (!req.file) {
    throw new BadRequestError('NO_FILE_UPLOADED')
  }

  // Initialize branding if not exists
  if (!partner.branding) {
    partner.branding = {}
  }

  // Set logo path
  partner.branding.logo = `/uploads/partners/${req.file.filename}`

  await partner.save()

  res.json({
    success: true,
    message: req.t ? req.t('LOGO_UPLOADED') : 'Logo uploaded successfully',
    data: {
      logo: partner.branding.logo
    }
  })
})

// Delete my logo (for partner users)
export const deleteMyLogo = asyncHandler(async (req, res) => {
  const partnerId = req.partnerId

  if (!partnerId) {
    throw new BadRequestError('NO_PARTNER_SELECTED')
  }

  const partner = await Partner.findById(partnerId)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Delete file if exists
  if (partner.branding?.logo) {
    const uploadsDir = path.join(__dirname, '../../../uploads')
    const filePath = path.join(uploadsDir, partner.branding.logo.replace('/uploads/', ''))

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    partner.branding.logo = null
    await partner.save()
  }

  res.json({
    success: true,
    message: req.t ? req.t('LOGO_DELETED') : 'Logo deleted successfully'
  })
})

// Upload my favicon (for partner users)
export const uploadMyFavicon = asyncHandler(async (req, res) => {
  const partnerId = req.partnerId

  if (!partnerId) {
    throw new BadRequestError('NO_PARTNER_SELECTED')
  }

  const partner = await Partner.findById(partnerId)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  if (!req.file) {
    throw new BadRequestError('NO_FILE_UPLOADED')
  }

  // Initialize branding if not exists
  if (!partner.branding) {
    partner.branding = {}
  }

  // Set favicon path
  partner.branding.favicon = `/uploads/partners/${req.file.filename}`

  await partner.save()

  res.json({
    success: true,
    message: req.t ? req.t('FAVICON_UPLOADED') : 'Favicon uploaded successfully',
    data: {
      favicon: partner.branding.favicon
    }
  })
})

// Delete my favicon (for partner users)
export const deleteMyFavicon = asyncHandler(async (req, res) => {
  const partnerId = req.partnerId

  if (!partnerId) {
    throw new BadRequestError('NO_PARTNER_SELECTED')
  }

  const partner = await Partner.findById(partnerId)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Delete file if exists
  if (partner.branding?.favicon) {
    const uploadsDir = path.join(__dirname, '../../../uploads')
    const filePath = path.join(uploadsDir, partner.branding.favicon.replace('/uploads/', ''))

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    partner.branding.favicon = null
    await partner.save()
  }

  res.json({
    success: true,
    message: req.t ? req.t('FAVICON_DELETED') : 'Favicon deleted successfully'
  })
})
