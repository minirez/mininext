import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import logger from '#core/logger.js'

const PRESETS = {
  hotel: { maxWidth: 1920, maxHeight: 1080, quality: 80 },
  room: { maxWidth: 1920, maxHeight: 1080, quality: 80 },
  tour: { maxWidth: 1920, maxHeight: 1080, quality: 80 },
  storefront: { maxWidth: 1920, maxHeight: 1080, quality: 80 },
  avatar: { maxWidth: 400, maxHeight: 400, quality: 85 },
  logo: { maxWidth: null, maxHeight: null, quality: 85 }
}

const PROCESSABLE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])

/**
 * Optimize uploaded image: resize + convert to WebP + delete original
 * @param {string} filePath - File path saved by multer
 * @param {string} preset - Preset name
 * @returns {Promise<{ path: string, filename: string }>}
 */
export async function optimizeUpload(filePath, preset = 'hotel') {
  const ext = path.extname(filePath).toLowerCase()

  if (!PROCESSABLE_EXTS.has(ext)) {
    return { path: filePath, filename: path.basename(filePath) }
  }

  const config = PRESETS[preset] || PRESETS.hotel
  const dir = path.dirname(filePath)
  const basename = path.basename(filePath, ext)
  const webpPath = path.join(dir, `${basename}.webp`)

  try {
    let pipeline = sharp(filePath)
    const metadata = await pipeline.metadata()

    if (config.maxWidth && config.maxHeight) {
      if (metadata.width > config.maxWidth || metadata.height > config.maxHeight) {
        pipeline = pipeline.resize(config.maxWidth, config.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }
    }

    await pipeline.webp({ quality: config.quality }).toFile(webpPath)

    if (filePath !== webpPath) {
      await fs.unlink(filePath).catch(() => {})
    }

    logger.info(
      `[ImageOptimizer] ${basename}${ext} -> ${basename}.webp (${metadata.width}x${metadata.height} -> preset:${preset})`
    )

    return { path: webpPath, filename: `${basename}.webp` }
  } catch (err) {
    logger.error('[ImageOptimizer] Optimization failed, keeping original', {
      filePath,
      preset,
      error: err.message
    })
    return { path: filePath, filename: path.basename(filePath) }
  }
}
