/**
 * Storefront Upload Helper
 * Handles image uploads for storefront content including:
 * - Hero images
 * - Location/destination photos
 * - Campaign banners
 * - Settings images (logo, favicon, certifications)
 * - Header tab images
 * - Theme-specific images
 * - Custom theme section images
 */

import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create uploads directory structure
const uploadsDir = path.join(__dirname, '../../uploads')
const storefrontDir = path.join(uploadsDir, 'storefront')

/**
 * Normalize uploadType values (support legacy aliases).
 * Keep this centralized so admin/api/migration stay consistent.
 */
export const normalizeStorefrontUploadType = (uploadType) => {
  const t = String(uploadType || '').trim()
  if (!t) return 'general'

  // Backwards-compatible aliases
  if (t === 'header-tab' || t === 'header_tab') return 'headerTab'

  return t
}

/**
 * Compute the subPath under `uploads/storefront/<partnerId>/...` for an upload.
 * @param {object} opts
 * @param {string} opts.uploadType
 * @param {string|number} [opts.uploadIndex]
 * @param {string} [opts.sectionType] - required when uploadType === 'custom'
 * @param {string|number} [opts.sectionIndex] - required when uploadType === 'custom'
 */
export const getStorefrontUploadSubPath = ({
  uploadType,
  uploadIndex = '0',
  sectionType = 'general',
  sectionIndex = '0'
} = {}) => {
  const type = normalizeStorefrontUploadType(uploadType)
  const idx = String(uploadIndex ?? '0')

  switch (type) {
    case 'hero':
      return 'hero'
    case 'location':
      return `locations/${idx}`
    case 'campaign':
      return `campaigns/${idx}`
    case 'logo':
    case 'favicon':
    case 'etbis':
    case 'tursab':
      return 'settings'
    case 'headerTab':
      return `header/${idx}`

    // Theme-specific uploads (legacy homepageTheme variants)
    case 'tour-hero':
    case 'tour-campaign':
    case 'tour-location':
      return `tour/${type.replace('tour-', '')}/${idx}`
    case 'flight-hero':
    case 'flight-location':
      return `flight/${type.replace('flight-', '')}/${idx}`
    case 'activity-hero':
    case 'activity-campaign':
    case 'activity-location':
      return `activity/${type.replace('activity-', '')}/${idx}`
    case 'bedbank-hero':
    case 'bedbank-location':
      return `bedbank/${type.replace('bedbank-', '')}/${idx}`
    case 'transfer-hero':
      return 'transfer/hero'
    case 'cruise-hero':
      return 'cruise/hero'

    // Gallery photos
    case 'photos':
      return `photos/${idx}`

    // Custom theme section uploads (dynamic)
    case 'custom': {
      const sType = String(sectionType || 'general').trim() || 'general'
      const sIdx = String(sectionIndex ?? '0')
      return `custom/${sType}/${sIdx}/${idx}`
    }

    default:
      return 'general'
  }
}

/**
 * Get upload directory for a partner (ensures existence).
 */
const getPartnerDir = (partnerId, subPath = '') => {
  const partnerDir = path.join(storefrontDir, partnerId.toString(), subPath)
  if (!fs.existsSync(partnerDir)) {
    fs.mkdirSync(partnerDir, { recursive: true })
  }
  return partnerDir
}

/**
 * Public helper for other modules (migration, etc.).
 */
export const getStorefrontDiskPath = (partnerId, subPath = '') => getPartnerDir(partnerId, subPath)

/**
 * Configure multer storage for storefront images
 */
const storefrontStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const partnerId = req.partnerId || req.user?.accountId
    if (!partnerId) {
      return cb(new Error('Partner ID required for upload'))
    }

    const subPath = getStorefrontUploadSubPath({
      uploadType: req.body?.uploadType,
      uploadIndex: req.body?.uploadIndex,
      sectionType: req.body?.sectionType,
      sectionIndex: req.body?.sectionIndex
    })

    const destDir = getPartnerDir(partnerId, subPath)
    cb(null, destDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename (consistent with other upload helpers)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const uploadType = req.body?.uploadType || 'general'

    cb(null, `${uploadType}-${uniqueSuffix}${ext}`)
  }
})

/**
 * File filter - only images
 */
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg|ico/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = /image\/(jpeg|jpg|png|gif|webp|svg\+xml|x-icon|vnd.microsoft.icon)/.test(
    file.mimetype
  )

  if (extname || mimetype) {
    return cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'))
  }
}

/**
 * Multer instance for storefront uploads
 */
export const storefrontUpload = multer({
  storage: storefrontStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

/**
 * Get the URL path for a storefront file (relative to `/uploads`).
 * NOTE: keeps backwards-compatible signature, but supports custom-theme fields.
 */
export const getStorefrontFileUrl = (partnerId, uploadType, filename, uploadIndex = null, opts = {}) => {
  const subPath = getStorefrontUploadSubPath({
    uploadType,
    uploadIndex: uploadIndex ?? '0',
    sectionType: opts?.sectionType,
    sectionIndex: opts?.sectionIndex
  })
  return `storefront/${partnerId}/${subPath}/${filename}`
}

/**
 * Delete a storefront file
 */
export const deleteStorefrontFile = (partnerId, relativePath) => {
  try {
    const filePath = path.join(storefrontDir, partnerId.toString(), relativePath)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
  } catch (error) {
    console.error('Delete file error:', error)
  }
  return false
}

/**
 * Delete all files in a partner's storefront directory
 */
export const deletePartnerStorefrontFiles = (partnerId) => {
  try {
    const partnerDir = path.join(storefrontDir, partnerId.toString())
    if (fs.existsSync(partnerDir)) {
      fs.rmSync(partnerDir, { recursive: true, force: true })
      return true
    }
  } catch (error) {
    console.error('Delete partner files error:', error)
  }
  return false
}

export default {
  storefrontUpload,
  getStorefrontFileUrl,
  deleteStorefrontFile,
  deletePartnerStorefrontFiles
}
