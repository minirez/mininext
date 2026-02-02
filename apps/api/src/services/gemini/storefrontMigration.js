/**
 * Storefront Migration Service
 * Handles AI-assisted migration of storefront data from external sources
 * Downloads images from source CDN and re-uploads to our system
 */

import logger from '../../core/logger.js'
import { generateContent } from './client.js'
import { isJsonTruncated, repairTruncatedJson } from './helpers.js'
import fetch from 'node-fetch'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Temp directory for downloaded images
// 3 levels up from services/gemini/ to reach api/uploads/
const tempDir = path.join(__dirname, '../../../uploads/temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

/**
 * Download image from URL and return buffer
 */
const downloadImage = async (url, timeout = 30000) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const buffer = await response.buffer()
    const contentType = response.headers.get('content-type') || 'image/webp'

    return { buffer, contentType }
  } catch (error) {
    logger.warn(`Failed to download image: ${url} - ${error.message}`)
    return null
  }
}

/**
 * Extract image URL from storefront photo object
 */
const getImageUrl = (photo, baseCdnUrl = 'https://images.minirez.com') => {
  if (!photo) return null

  if (typeof photo === 'string') {
    if (photo.startsWith('http')) return photo
    return `${baseCdnUrl}/${photo}`
  }

  if (photo.link) {
    if (photo.link.startsWith('http')) return photo.link
    return `${baseCdnUrl}/${photo.link}`
  }

  return null
}

/**
 * Collect all images from storefront data
 */
const collectAllImages = (data) => {
  const images = []

  // Helper to add image with context
  const addImage = (photo, section, index = null) => {
    const url = getImageUrl(photo)
    if (url) {
      images.push({
        url,
        section,
        index,
        originalId: photo?.id || null,
        width: photo?.width || 0,
        height: photo?.height || 0
      })
    }
  }

  // Hero image
  if (data.hero?.photo) {
    addImage(data.hero.photo, 'hero')
  }

  // Settings images
  if (data.settings?.logo) addImage(data.settings.logo, 'logo')
  if (data.settings?.favicon) addImage(data.settings.favicon, 'favicon')
  if (data.settings?.etbis?.photo) addImage(data.settings.etbis.photo, 'etbis')
  if (data.settings?.tursab?.photo) addImage(data.settings.tursab.photo, 'tursab')

  // Location section images
  if (data.locationSection?.items) {
    data.locationSection.items.forEach((item, i) => {
      if (item.photo) addImage(item.photo, 'location', i)
    })
  }

  // Locations array images
  if (data.locations) {
    data.locations.forEach((item, i) => {
      if (item.photo) addImage(item.photo, 'location', i)
    })
  }

  // Campaign section images
  if (data.campaignSection) {
    data.campaignSection.forEach((item, i) => {
      if (item.photo) addImage(item.photo, 'campaign', i)
    })
  }

  // Header tab images
  if (data.header?.tabs) {
    data.header.tabs.forEach((tab, i) => {
      if (tab.photo?.link) addImage(tab.photo, 'headerTab', i)
    })
  }

  // Theme-specific images
  const theme = data.homepageTheme
  if (theme) {
    // Tour theme
    if (theme.tour?.hero?.photo) addImage(theme.tour.hero.photo, 'tour-hero')
    if (theme.tour?.campaignSection?.campaign?.photo) {
      addImage(theme.tour.campaignSection.campaign.photo, 'tour-campaign')
    }
    if (theme.tour?.locations?.items) {
      theme.tour.locations.items.forEach((item, i) => {
        if (item.photo) addImage(item.photo, 'tour-location', i)
      })
    }

    // Flight theme
    if (theme.flight?.hero?.photo) {
      if (Array.isArray(theme.flight.hero.photo)) {
        theme.flight.hero.photo.forEach((p, i) => {
          if (p?.link) addImage(p, 'flight-hero', i)
        })
      } else {
        addImage(theme.flight.hero.photo, 'flight-hero')
      }
    }

    // Activity theme
    if (theme.activity?.hero?.photo) addImage(theme.activity.hero.photo, 'activity-hero')
    if (theme.activity?.campaignSection?.campaign) {
      if (Array.isArray(theme.activity.campaignSection.campaign)) {
        theme.activity.campaignSection.campaign.forEach((c, i) => {
          if (c.photo) addImage(c.photo, 'activity-campaign', i)
        })
      }
    }

    // Bedbank theme
    if (theme.bedbank?.hero?.photo) addImage(theme.bedbank.hero.photo, 'bedbank-hero')
    if (theme.bedbank?.locations?.items) {
      theme.bedbank.locations.items.forEach((item, i) => {
        if (item.photo) addImage(item.photo, 'bedbank-location', i)
      })
    }

    // Transfer theme
    if (theme.transfer?.hero?.photo) addImage(theme.transfer.hero.photo, 'transfer-hero')

    // Cruise theme
    if (theme.cruise?.hero?.photo) addImage(theme.cruise.hero.photo, 'cruise-hero')
  }

  // Root level photos array
  if (data.photos && Array.isArray(data.photos)) {
    data.photos.forEach((photo, i) => {
      if (photo?.link || photo?.id) {
        addImage(photo, 'photos', i)
      }
    })
  }

  return images
}

/**
 * Transform storefront data using AI for intelligent mapping
 */
const transformWithAI = async (sourceData, retryCount = 0) => {
  const MAX_RETRIES = 2

  const prompt = `Sen bir web sitesi veri dönüştürme uzmanısın. Aşağıdaki JSON verisini analiz et ve yapısal olarak aynı formatta döndür.

ÖNEMLİ KURALLAR:
1. Veriyi olduğu gibi koru, sadece gereksiz alanları temizle
2. Photo objelerini aynı formatta tut: { id, width, height, link }
3. Multilingual alanları koru: [{ lang: "en", value: "" }, { lang: "tr", value: "" }]
4. Boş veya anlamsız alanları null olarak işaretle
5. SADECE geçerli JSON döndür

KAYNAK VERİ:
${JSON.stringify(sourceData, null, 2)}

Bu veriyi temizleyip döndür. Photo linklerini olduğu gibi koru - bunlar ayrıca işlenecek.
Sadece JSON döndür:`

  try {
    const responseText = await generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 65536
    })

    if (!responseText) {
      throw new Error('No response received from AI')
    }

    logger.info(`Storefront migration - Gemini response length: ${responseText.length} chars`)

    // Clean up response
    let cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Extract JSON
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    // Check for truncation
    if (isJsonTruncated(cleanedResponse)) {
      logger.warn(`Storefront migration response truncated, retry ${retryCount + 1}/${MAX_RETRIES}`)

      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
        return transformWithAI(sourceData, retryCount + 1)
      }

      logger.warn('Max retries reached, attempting to repair truncated JSON')
      cleanedResponse = repairTruncatedJson(cleanedResponse)
    }

    const parsed = JSON.parse(cleanedResponse)
    return { success: true, data: parsed }
  } catch (error) {
    logger.error('Storefront AI transformation error: ' + error.message)

    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
      return transformWithAI(sourceData, retryCount + 1)
    }

    // If AI fails, return the original data
    return { success: true, data: sourceData }
  }
}

/**
 * Main migration function - processes storefront JSON and prepares for import
 */
export const migrateStorefrontData = async (jsonContent, options = {}) => {
  const { downloadImages = true, baseCdnUrl = 'https://images.minirez.com' } = options

  try {
    // Parse the input JSON
    let sourceData
    if (typeof jsonContent === 'string') {
      // Handle wrapped response format
      const parsed = JSON.parse(jsonContent)
      sourceData = parsed.data || parsed
    } else {
      sourceData = jsonContent.data || jsonContent
    }

    logger.info('Starting storefront migration')

    // Collect all images
    const images = collectAllImages(sourceData)
    logger.info(`Found ${images.length} images to process`)

    // Create image mapping for download tracking
    const imageMapping = images.map(img => ({
      ...img,
      status: 'pending',
      newUrl: null,
      error: null
    }))

    // Optionally transform with AI (for cleaning/validation)
    // For now we skip AI transformation since the data structure is already good
    // const transformed = await transformWithAI(sourceData)
    // const cleanedData = transformed.data

    // Use source data directly (it's already in our format)
    const cleanedData = sourceData

    // Generate summary
    const summary = {
      sectionsFound: [],
      imagesFound: images.length,
      languagesFound: new Set()
    }

    // Check which sections exist
    if (cleanedData.hero?.photo?.link) summary.sectionsFound.push('hero')
    if (cleanedData.locationSection?.items?.length) summary.sectionsFound.push('locations')
    if (cleanedData.campaignSection?.length) summary.sectionsFound.push('campaigns')
    if (cleanedData.hotels?.ids?.length) summary.sectionsFound.push('hotels')
    if (cleanedData.tours?.ids?.length) summary.sectionsFound.push('tours')
    if (cleanedData.header?.tabs?.length) summary.sectionsFound.push('header')
    if (cleanedData.footer?.items?.length) summary.sectionsFound.push('footer')
    if (cleanedData.settings?.name) summary.sectionsFound.push('settings')
    if (cleanedData.homepageTheme?.type) summary.sectionsFound.push('theme')
    if (cleanedData.pages?.length) summary.sectionsFound.push('pages')

    // Find languages
    const checkLang = (arr) => {
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          if (item?.lang) summary.languagesFound.add(item.lang)
        })
      }
    }
    checkLang(cleanedData.hero?.title)
    checkLang(cleanedData.hero?.description)
    checkLang(cleanedData.settings?.seo?.title)

    return {
      success: true,
      data: cleanedData,
      images: imageMapping,
      summary: {
        ...summary,
        languagesFound: [...summary.languagesFound]
      }
    }
  } catch (error) {
    logger.error('Storefront migration error: ' + error.message)
    return {
      success: false,
      error: error.message,
      data: null
    }
  }
}

/**
 * Download and prepare a single image for upload
 * Returns the image buffer and metadata ready for multer-style upload
 */
export const downloadImageForUpload = async (imageUrl, timeout = 30000) => {
  const result = await downloadImage(imageUrl, timeout)
  if (!result) return null

  // Determine file extension from content type or URL
  let ext = '.webp'
  const urlExt = path.extname(new URL(imageUrl).pathname).toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico'].includes(urlExt)) {
    ext = urlExt
  } else if (result.contentType.includes('jpeg')) {
    ext = '.jpg'
  } else if (result.contentType.includes('png')) {
    ext = '.png'
  } else if (result.contentType.includes('gif')) {
    ext = '.gif'
  } else if (result.contentType.includes('ico') || result.contentType.includes('icon')) {
    ext = '.ico'
  }

  return {
    buffer: result.buffer,
    contentType: result.contentType,
    extension: ext,
    size: result.buffer.length
  }
}

/**
 * Save downloaded image to temp file for processing
 */
export const saveToTempFile = async (imageBuffer, filename) => {
  const tempPath = path.join(tempDir, filename)
  await fs.promises.writeFile(tempPath, imageBuffer)
  return tempPath
}

/**
 * Clean up temp files
 */
export const cleanupTempFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  } catch (error) {
    logger.warn(`Failed to cleanup temp file: ${filePath}`)
  }
}

export default {
  migrateStorefrontData,
  downloadImageForUpload,
  saveToTempFile,
  cleanupTempFile,
  collectAllImages
}
