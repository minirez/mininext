/**
 * Image Processing Pipeline
 * Handles image optimization, resizing, thumbnail generation, and WebP conversion.
 * Uses sharp for high-performance image processing.
 */
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { logInfo, logError } from '../core/logger.js'

const PRESETS = {
  avatar: {
    full: { width: 400, height: 400, fit: 'cover' },
    thumb: { width: 80, height: 80, fit: 'cover' }
  },
  hotel: {
    full: { width: 1200, height: 800, fit: 'inside' },
    thumb: { width: 400, height: 267, fit: 'inside' }
  },
  document: {
    full: { width: 1600, height: 1200, fit: 'inside' },
    thumb: null // No thumbnail for documents
  }
}

/**
 * Process an uploaded image: resize, optimize, create thumbnail, convert to WebP
 * @param {string} filePath - Path to the uploaded file
 * @param {string} preset - Preset name (avatar, hotel, document)
 * @param {Object} options - Additional options
 * @param {number} options.quality - JPEG/WebP quality (default: 80)
 * @param {boolean} options.keepOriginal - Keep original file (default: false)
 * @param {boolean} options.webp - Create WebP version (default: true)
 * @returns {Object} { original, optimized, thumbnail, webp }
 */
export async function processImage(filePath, preset = 'hotel', options = {}) {
  const { quality = 80, keepOriginal = false, webp = true } = options
  const config = PRESETS[preset] || PRESETS.hotel
  const ext = path.extname(filePath).toLowerCase()
  const dir = path.dirname(filePath)
  const basename = path.basename(filePath, ext)
  const result = { original: filePath }

  // Skip non-image files
  if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    return result
  }

  try {
    const image = sharp(filePath)
    const metadata = await image.metadata()

    // Only process if image is larger than target
    if (
      config.full &&
      (metadata.width > config.full.width || metadata.height > config.full.height)
    ) {
      const optimizedPath = path.join(dir, `${basename}-opt${ext}`)
      await sharp(filePath)
        .resize(config.full.width, config.full.height, {
          fit: config.full.fit,
          withoutEnlargement: true
        })
        .jpeg({ quality, mozjpeg: true })
        .toFile(optimizedPath)

      // Replace original with optimized if not keeping original
      if (!keepOriginal) {
        await fs.rename(optimizedPath, filePath)
        result.optimized = filePath
      } else {
        result.optimized = optimizedPath
      }

      logInfo(`Image optimized: ${basename}`, {
        originalSize: metadata.width + 'x' + metadata.height,
        targetSize: config.full.width + 'x' + config.full.height
      })
    }

    // Create thumbnail
    if (config.thumb) {
      const thumbPath = path.join(dir, `${basename}-thumb${ext}`)
      await sharp(filePath)
        .resize(config.thumb.width, config.thumb.height, {
          fit: config.thumb.fit,
          withoutEnlargement: true
        })
        .jpeg({ quality: quality - 10, mozjpeg: true })
        .toFile(thumbPath)

      result.thumbnail = thumbPath
    }

    // Create WebP version
    if (webp && ext !== '.webp') {
      const webpPath = path.join(dir, `${basename}.webp`)
      await sharp(filePath)
        .resize(config.full.width, config.full.height, {
          fit: config.full.fit,
          withoutEnlargement: true
        })
        .webp({ quality: quality + 5 })
        .toFile(webpPath)

      result.webp = webpPath
    }

    return result
  } catch (error) {
    logError('Image processing failed', error, { filePath, preset })
    // Return original file on error - don't break upload
    return result
  }
}

/**
 * Process avatar image specifically - always create both sizes
 * @param {string} filePath - Uploaded avatar path
 * @returns {Object} { path, thumbnail }
 */
export async function processAvatar(filePath) {
  const result = await processImage(filePath, 'avatar', {
    quality: 85,
    keepOriginal: false,
    webp: false // Avatars don't need WebP for simplicity
  })
  return result
}

/**
 * Process hotel image - full + thumbnail + WebP
 * @param {string} filePath - Uploaded hotel image path
 * @returns {Object} { original, optimized, thumbnail, webp }
 */
export async function processHotelImage(filePath) {
  return processImage(filePath, 'hotel', {
    quality: 80,
    keepOriginal: false,
    webp: true
  })
}
