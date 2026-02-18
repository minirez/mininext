import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import http from 'http'
import logger from '../core/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '../../uploads')
const hotelsDir = path.join(uploadsDir, 'hotels')

// Ensure directories exist
if (!fs.existsSync(hotelsDir)) {
  fs.mkdirSync(hotelsDir, { recursive: true })
}

/**
 * Download an image from URL and save it locally
 * @param {string} imageUrl - URL of the image to download
 * @param {string} hotelId - Hotel ID for organizing files
 * @param {string} prefix - Prefix for filename (e.g., 'gallery', 'logo')
 * @returns {Promise<{success: boolean, path?: string, filename?: string, error?: string}>}
 */
export const downloadImage = async (imageUrl, hotelId, prefix = 'img') => {
  return new Promise(resolve => {
    try {
      if (!imageUrl || !imageUrl.startsWith('http')) {
        return resolve({ success: false, error: 'Invalid URL' })
      }

      // Create hotel-specific directory
      const hotelDir = path.join(hotelsDir, hotelId.toString())
      if (!fs.existsSync(hotelDir)) {
        fs.mkdirSync(hotelDir, { recursive: true })
      }

      // Extract extension from URL or default to jpg
      const urlPath = new URL(imageUrl).pathname
      let ext = path.extname(urlPath).toLowerCase()
      if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        ext = '.jpg'
      }

      // Generate unique filename
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const filename = `${prefix}-${timestamp}-${random}${ext}`
      const filePath = path.join(hotelDir, filename)

      // Choose http or https
      const protocol = imageUrl.startsWith('https') ? https : http
      const urlObj = new URL(imageUrl)

      const request = protocol.get(
        imageUrl,
        {
          timeout: 30000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
            Referer: `${urlObj.protocol}//${urlObj.host}/`,
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'same-origin'
          }
        },
        response => {
          // Handle redirects
          if (
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            const redirectUrl = response.headers.location.startsWith('http')
              ? response.headers.location
              : new URL(response.headers.location, imageUrl).href
            return downloadImage(redirectUrl, hotelId, prefix).then(resolve)
          }

          if (response.statusCode !== 200) {
            return resolve({ success: false, error: `HTTP ${response.statusCode}` })
          }

          // Check content type
          const contentType = response.headers['content-type'] || ''
          if (!contentType.includes('image')) {
            return resolve({ success: false, error: 'Not an image' })
          }

          const fileStream = fs.createWriteStream(filePath)
          response.pipe(fileStream)

          fileStream.on('finish', () => {
            fileStream.close()
            // Return relative path for storage
            const relativePath = `/uploads/hotels/${hotelId}/${filename}`
            resolve({ success: true, path: relativePath, filename })
          })

          fileStream.on('error', err => {
            fs.unlink(filePath, () => {})
            resolve({ success: false, error: err.message })
          })
        }
      )

      request.on('error', err => {
        resolve({ success: false, error: err.message })
      })

      request.on('timeout', () => {
        request.destroy()
        resolve({ success: false, error: 'Timeout' })
      })
    } catch (error) {
      resolve({ success: false, error: error.message })
    }
  })
}

/**
 * Download multiple images for a hotel
 * @param {Array} images - Array of {url, alt, category} objects
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<Array>} Array of downloaded image objects
 */
export const downloadHotelImages = async (images, hotelId) => {
  if (!images || !images.length) return []

  const results = []
  let successCount = 0

  for (let i = 0; i < images.length && successCount < 20; i++) {
    const img = images[i]
    if (!img.url) continue

    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await downloadImage(img.url, hotelId, `gallery-${i}`)

      if (result.success) {
        results.push({
          url: result.path,
          caption: img.alt || '',
          isMain: i === 0, // First image is main
          order: i
        })
        successCount++
        logger.info(`Downloaded image ${i + 1}: ${img.url.substring(0, 50)}...`)
      } else {
        logger.warn(`Failed to download image: ${img.url} - ${result.error}`)
      }
    } catch (error) {
      logger.warn(`Error downloading image: ${error.message}`)
    }
  }

  logger.info(`Downloaded ${successCount}/${images.length} images for hotel ${hotelId}`)
  return results
}

/**
 * Download hotel logo
 * @param {string} logoUrl - URL of the logo
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<string|null>} Local path or null
 */
export const downloadHotelLogo = async (logoUrl, hotelId) => {
  if (!logoUrl) return null

  const result = await downloadImage(logoUrl, hotelId, 'logo')

  if (result.success) {
    logger.info(`Downloaded logo for hotel ${hotelId}`)
    return result.path
  }

  logger.warn(`Failed to download logo: ${result.error}`)
  return null
}

/**
 * Download images for a room template
 * @param {Array} images - Array of {url, caption} objects
 * @param {string} hotelId - Hotel ID
 * @param {string} roomCode - Room template code
 * @returns {Promise<Array>} Array of downloaded image objects
 */
export const downloadRoomTemplateImages = async (images, hotelId, roomCode) => {
  if (!images || !images.length) return []

  const results = []
  let successCount = 0

  // Create room-specific directory
  const roomDir = path.join(hotelsDir, 'base', hotelId.toString(), 'rooms', roomCode.toLowerCase())
  if (!fs.existsSync(roomDir)) {
    fs.mkdirSync(roomDir, { recursive: true })
  }

  for (let i = 0; i < images.length && successCount < 10; i++) {
    const img = images[i]
    if (!img.url) continue

    try {
      // Custom download for room templates
      // eslint-disable-next-line no-await-in-loop
      const result = await downloadImageToPath(img.url, roomDir, `room-${i}`)

      if (result.success) {
        results.push({
          url: `/uploads/hotels/base/${hotelId}/rooms/${roomCode.toLowerCase()}/${result.filename}`,
          caption: img.caption || {},
          isMain: i === 0,
          order: i
        })
        successCount++
        logger.info(
          `Downloaded room image ${i + 1} for ${roomCode}: ${img.url.substring(0, 50)}...`
        )
      } else {
        logger.warn(`Failed to download room image: ${img.url} - ${result.error}`)
      }
    } catch (error) {
      logger.warn(`Error downloading room image: ${error.message}`)
    }
  }

  logger.info(`Downloaded ${successCount}/${images.length} images for room template ${roomCode}`)
  return results
}

/**
 * Download image to a specific path
 * @param {string} imageUrl - URL of the image
 * @param {string} targetDir - Target directory path
 * @param {string} prefix - Filename prefix
 * @returns {Promise<{success: boolean, path?: string, filename?: string, error?: string}>}
 */
const downloadImageToPath = async (imageUrl, targetDir, prefix) => {
  return new Promise(resolve => {
    try {
      if (!imageUrl || !imageUrl.startsWith('http')) {
        return resolve({ success: false, error: 'Invalid URL' })
      }

      // Extract extension from URL or default to jpg
      const urlPath = new URL(imageUrl).pathname
      let ext = path.extname(urlPath).toLowerCase()
      if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        ext = '.jpg'
      }

      // Generate unique filename
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const filename = `${prefix}-${timestamp}-${random}${ext}`
      const filePath = path.join(targetDir, filename)

      // Choose http or https
      const protocol = imageUrl.startsWith('https') ? https : http
      const urlObj = new URL(imageUrl)

      const request = protocol.get(
        imageUrl,
        {
          timeout: 30000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
            Referer: `${urlObj.protocol}//${urlObj.host}/`,
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'same-origin'
          }
        },
        response => {
          // Handle redirects
          if (
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            const redirectUrl = response.headers.location.startsWith('http')
              ? response.headers.location
              : new URL(response.headers.location, imageUrl).href
            return downloadImageToPath(redirectUrl, targetDir, prefix).then(resolve)
          }

          if (response.statusCode !== 200) {
            return resolve({ success: false, error: `HTTP ${response.statusCode}` })
          }

          // Check content type
          const contentType = response.headers['content-type'] || ''
          if (!contentType.includes('image')) {
            return resolve({ success: false, error: 'Not an image' })
          }

          const fileStream = fs.createWriteStream(filePath)
          response.pipe(fileStream)

          fileStream.on('finish', () => {
            fileStream.close()
            resolve({ success: true, path: filePath, filename })
          })

          fileStream.on('error', err => {
            fs.unlink(filePath, () => {})
            resolve({ success: false, error: err.message })
          })
        }
      )

      request.on('error', err => {
        resolve({ success: false, error: err.message })
      })

      request.on('timeout', () => {
        request.destroy()
        resolve({ success: false, error: 'Timeout' })
      })
    } catch (error) {
      resolve({ success: false, error: error.message })
    }
  })
}

export default {
  downloadImage,
  downloadHotelImages,
  downloadHotelLogo,
  downloadRoomTemplateImages
}
