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
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create uploads directory structure
const uploadsDir = path.join(__dirname, '../../uploads')
const storefrontDir = path.join(uploadsDir, 'storefront')

// ==================== MD5 DEDUPE (PER PARTNER) ====================

/**
 * We keep a tiny per-partner index file mapping md5 -> relativePath
 * to avoid rescanning directories on every upload.
 *
 * NOTE: This is best-effort and optimized for the common case (single API instance).
 */
const md5IndexLocks = new Map()

const withPartnerMd5Lock = async (partnerId, fn) => {
  const key = String(partnerId)
  const prev = md5IndexLocks.get(key) || Promise.resolve()

  let release
  const next = new Promise(resolve => {
    release = resolve
  })
  const chain = prev.then(() => next)
  md5IndexLocks.set(key, chain)

  try {
    await prev
    return await fn()
  } finally {
    release()
    // Cleanup: only remove if no newer lock was queued
    if (md5IndexLocks.get(key) === chain) md5IndexLocks.delete(key)
  }
}

const getPartnerRootDir = partnerId => {
  const partnerDir = path.join(storefrontDir, partnerId.toString())
  if (!fs.existsSync(partnerDir)) fs.mkdirSync(partnerDir, { recursive: true })
  return partnerDir
}

const getPartnerMd5IndexPath = partnerId =>
  path.join(getPartnerRootDir(partnerId), '.md5-index.json')

const readMd5Index = async partnerId => {
  const indexPath = getPartnerMd5IndexPath(partnerId)
  try {
    if (!fs.existsSync(indexPath)) return null
    const raw = await fs.promises.readFile(indexPath, 'utf8')
    const parsed = JSON.parse(raw || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeMd5Index = async (partnerId, index) => {
  const indexPath = getPartnerMd5IndexPath(partnerId)
  try {
    await fs.promises.writeFile(indexPath, JSON.stringify(index || {}, null, 0), 'utf8')
  } catch {
    // best-effort
  }
}

export const md5BufferHex = buffer => crypto.createHash('md5').update(buffer).digest('hex')

export const md5FileHex = async filePath =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5')
    const stream = fs.createReadStream(filePath)
    stream.on('data', chunk => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })

const toPosixPath = p => String(p || '').replace(/\\/g, '/')

const isLikelyImageFile = filename => {
  const ext = path.extname(String(filename || '')).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'].includes(ext)
}

const buildMd5IndexFromDisk = async partnerId => {
  const root = getPartnerRootDir(partnerId)
  const index = {}

  const walk = async dirAbs => {
    let entries = []
    try {
      entries = await fs.promises.readdir(dirAbs, { withFileTypes: true })
    } catch {
      return
    }

    for (const ent of entries) {
      // Skip dotfiles/folders
      if (ent.name?.startsWith?.('.')) continue

      const abs = path.join(dirAbs, ent.name)
      if (ent.isDirectory()) {
        // eslint-disable-next-line no-await-in-loop
        await walk(abs)
        continue
      }

      if (!ent.isFile()) continue
      if (!isLikelyImageFile(ent.name)) continue

      try {
        // eslint-disable-next-line no-await-in-loop
        const md5 = await md5FileHex(abs)
        if (!md5) continue
        if (index[md5]) continue

        const rel = toPosixPath(path.relative(root, abs)).replace(/^\/+/, '')
        if (rel) index[md5] = rel
      } catch {
        // ignore individual file failures
      }
    }
  }

  await walk(root)
  return index
}

/**
 * Get an existing relative path for this md5 (if any), and clean stale entries.
 * @returns {Promise<string|null>} relativePath (posix-ish, no leading slash)
 */
export const getExistingStorefrontFileByMd5 = async (partnerId, md5Hex) =>
  withPartnerMd5Lock(partnerId, async () => {
    const md5 = String(md5Hex || '')
      .trim()
      .toLowerCase()
    if (!md5) return null

    let index = await readMd5Index(partnerId)
    if (index === null) {
      // First run for this partner: build once (best-effort) to enable true dedupe
      index = await buildMd5IndexFromDisk(partnerId)
      await writeMd5Index(partnerId, index)
    }
    const rel = typeof index[md5] === 'string' ? index[md5] : null
    if (!rel) return null

    const abs = path.join(getPartnerRootDir(partnerId), rel)
    if (fs.existsSync(abs)) return rel

    // stale mapping: remove
    delete index[md5]
    await writeMd5Index(partnerId, index)
    return null
  })

/**
 * Register md5 -> relativePath mapping (best-effort).
 */
export const setStorefrontFileMd5 = async (partnerId, md5Hex, relativePath) =>
  withPartnerMd5Lock(partnerId, async () => {
    const md5 = String(md5Hex || '')
      .trim()
      .toLowerCase()
    if (!md5) return
    const rel = String(relativePath || '').replace(/^\/+/, '')
    if (!rel) return

    const index = (await readMd5Index(partnerId)) || {}
    index[md5] = rel
    await writeMd5Index(partnerId, index)
  })

/**
 * Normalize uploadType values (support legacy aliases).
 * Keep this centralized so admin/api/migration stay consistent.
 */
export const normalizeStorefrontUploadType = uploadType => {
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
  const allowedTypes = /jpeg|jpg|png|gif|webp|ico/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = /image\/(jpeg|jpg|png|gif|webp|x-icon|vnd.microsoft.icon)/.test(file.mimetype)

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
    fileSize: 50 * 1024 * 1024 // 50MB limit (images are optimized after upload)
  }
})

/**
 * Get the URL path for a storefront file (relative to `/uploads`).
 * NOTE: keeps backwards-compatible signature, but supports custom-theme fields.
 */
export const getStorefrontFileUrl = (
  partnerId,
  uploadType,
  filename,
  uploadIndex = null,
  opts = {}
) => {
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
export const deletePartnerStorefrontFiles = partnerId => {
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
