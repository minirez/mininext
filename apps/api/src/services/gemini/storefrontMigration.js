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

// ==================== NORMALIZERS / MAPPERS ====================

const isPlainObject = v => Boolean(v) && typeof v === 'object' && !Array.isArray(v)

const normalizeLangArray = (value, fallbackLang = 'en') => {
  if (!value) return [{ lang: fallbackLang, value: '' }]

  if (Array.isArray(value)) {
    const mapped = value
      .map(item => {
        if (typeof item === 'string') return { lang: fallbackLang, value: item }
        if (isPlainObject(item))
          return { lang: typeof item.lang === 'string' ? item.lang : fallbackLang, value: item.value ?? '' }
        return null
      })
      .filter(Boolean)

    return mapped.length ? mapped : [{ lang: fallbackLang, value: '' }]
  }

  if (typeof value === 'string') return [{ lang: fallbackLang, value }]

  // Support legacy objects: { en: "x", tr: "y" }
  if (isPlainObject(value)) {
    const entries = Object.entries(value)
      .map(([lang, v]) => ({ lang, value: v ?? '' }))
      .filter(i => typeof i.lang === 'string')
    return entries.length ? entries : [{ lang: fallbackLang, value: '' }]
  }

  return [{ lang: fallbackLang, value: '' }]
}

const normalizePhoto = (photo) => {
  if (!photo) return { id: '', width: 0, height: 0, link: '' }
  if (typeof photo === 'string') return { id: '', width: 0, height: 0, link: photo }
  if (!isPlainObject(photo)) return { id: '', width: 0, height: 0, link: '' }

  return {
    id: typeof photo.id === 'string' ? photo.id : '',
    width: typeof photo.width === 'number' ? photo.width : 0,
    height: typeof photo.height === 'number' ? photo.height : 0,
    link: typeof photo.link === 'string' ? photo.link : (typeof photo.url === 'string' ? photo.url : '')
  }
}

/**
 * Map an "old storefront export" to the current schema shape.
 * Notes:
 * - We intentionally skip: custom theme presets + draft structures.
 * - We preserve the nested header/footer structure, including sub-menus.
 */
const mapStorefrontToCurrentShape = (source) => {
  const src = (source && typeof source === 'object') ? source : {}

  const out = {}

  // Root legacy homepage sections (kept for UI selection + apply logic)
  if (src.hero) {
    out.hero = {
      photo: normalizePhoto(src.hero.photo),
      title: normalizeLangArray(src.hero.title),
      description: normalizeLangArray(src.hero.description),
      searchOptions: Array.isArray(src.hero.searchOptions) ? src.hero.searchOptions : ['hotel'],
      backdropFilter: Boolean(src.hero.backdropFilter),
      negativeMarginOverride: isPlainObject(src.hero.negativeMarginOverride)
        ? src.hero.negativeMarginOverride
        : { status: false, value: 0, applyOn: 'all' }
    }
  }

  if (Array.isArray(src.campaignSection)) {
    out.campaignSection = src.campaignSection.map(c => ({
      photo: normalizePhoto(c?.photo),
      title: normalizeLangArray(c?.title),
      url: typeof c?.url === 'string' ? c.url : '',
      description: normalizeLangArray(c?.description)
    }))
  }

  // locationSection may exist, otherwise legacy `locations` array can be converted.
  const locationSectionSource =
    isPlainObject(src.locationSection) ? src.locationSection : (Array.isArray(src.locations) ? { items: src.locations } : null)
  if (locationSectionSource) {
    out.locationSection = {
      title: normalizeLangArray(locationSectionSource.title),
      description: normalizeLangArray(locationSectionSource.description),
      items: Array.isArray(locationSectionSource.items)
        ? locationSectionSource.items.map((item, index) => ({
            city: typeof item?.city === 'string' ? item.city : '',
            country: typeof item?.country === 'string' ? item.country : '',
            photo: normalizePhoto(item?.photo),
            index: typeof item?.index === 'number' ? item.index : index,
            link: typeof item?.link === 'string' ? item.link : ''
          }))
        : []
    }
  }

  if (src.hotels) {
    out.hotels = {
      title: normalizeLangArray(src.hotels?.title),
      description: normalizeLangArray(src.hotels?.description),
      ids: Array.isArray(src.hotels?.ids) ? src.hotels.ids : [],
      names: Array.isArray(src.hotels?.names) ? src.hotels.names : []
    }
  }

  if (src.tours) {
    out.tours = {
      title: normalizeLangArray(src.tours?.title),
      description: normalizeLangArray(src.tours?.description),
      ids: Array.isArray(src.tours?.ids) ? src.tours.ids : [],
      names: normalizeLangArray(src.tours?.names)
    }
  }

  // Settings
  if (src.settings && typeof src.settings === 'object') {
    out.settings = {
      name: typeof src.settings?.name === 'string' ? src.settings.name : '',
      logo: normalizePhoto(src.settings?.logo),
      favicon: normalizePhoto(src.settings?.favicon),
      etbis: {
        photo: normalizePhoto(src.settings?.etbis?.photo),
        id: typeof src.settings?.etbis?.id === 'string' ? src.settings.etbis.id : ''
      },
      tursab: {
        photo: normalizePhoto(src.settings?.tursab?.photo),
        link: typeof src.settings?.tursab?.link === 'string' ? src.settings.tursab.link : '',
        documentNumber:
          typeof src.settings?.tursab?.documentNumber === 'string' ? src.settings.tursab.documentNumber : ''
      },
      socials: {
        facebook: src.settings?.socials?.facebook || '',
        instagram: src.settings?.socials?.instagram || '',
        twitter: src.settings?.socials?.twitter || '',
        linkedin: src.settings?.socials?.linkedin || '',
        youtube: src.settings?.socials?.youtube || '',
        appStore: src.settings?.socials?.appStore || '',
        googlePlay: src.settings?.socials?.googlePlay || ''
      },
      callcenter: {
        number: src.settings?.callcenter?.number || src.settings?.callCenter?.phone || '',
        whatsapp: src.settings?.callcenter?.whatsapp || src.settings?.callCenter?.whatsapp || '',
        email: src.settings?.callcenter?.email || src.settings?.callCenter?.email || ''
      },
      callCenter: {
        phone: src.settings?.callCenter?.phone || src.settings?.callcenter?.number || '',
        whatsapp: src.settings?.callCenter?.whatsapp || src.settings?.callcenter?.whatsapp || '',
        email: src.settings?.callCenter?.email || src.settings?.callcenter?.email || '',
        workingHours: src.settings?.callCenter?.workingHours || ''
      },
      banks: Array.isArray(src.settings?.banks) ? src.settings.banks : [],
      paymentMethods: Array.isArray(src.settings?.paymentMethods) ? src.settings.paymentMethods : [],
      seo: {
        title: normalizeLangArray(src.settings?.seo?.title),
        keywords: normalizeLangArray(src.settings?.seo?.keywords),
        description: normalizeLangArray(src.settings?.seo?.description),
        googleAnalyticsId:
          typeof src.settings?.seo?.googleAnalyticsId === 'string' ? src.settings.seo.googleAnalyticsId : ''
      },
      extranetLink: typeof src.settings?.extranetLink === 'string' ? src.settings.extranetLink : '',
      siteTitle: typeof src.settings?.siteTitle === 'string' ? src.settings.siteTitle : '',
      themeColor: typeof src.settings?.themeColor === 'string' ? src.settings.themeColor : (typeof src.themeColor === 'string' ? src.themeColor : ''),
      address: typeof src.settings?.address === 'string' ? src.settings.address : ''
    }
  } else if (typeof src.themeColor === 'string') {
    // Keep legacy themeColor so apply endpoint can still set settings.themeColor
    out.themeColor = src.themeColor
  }

  // Header
  if (src.header?.tabs && Array.isArray(src.header.tabs)) {
    out.header = {
      headerType: typeof src.header?.headerType === 'string' ? src.header.headerType : 'default',
      tabs: src.header.tabs.map(tab => ({
        title: normalizeLangArray(tab?.title),
        link: typeof tab?.link === 'string' ? tab.link : '',
        photo: normalizePhoto(tab?.photo),
        items: Array.isArray(tab?.items)
          ? tab.items.map(item => ({
              title: normalizeLangArray(item?.title),
              link: typeof item?.link === 'string' ? item.link : '',
              subItems: Array.isArray(item?.subItems)
                ? item.subItems.map(sub => ({
                    title: normalizeLangArray(sub?.title),
                    link: typeof sub?.link === 'string' ? sub.link : '',
                    subItems: Array.isArray(sub?.subItems) ? sub.subItems : [] // keep deeper nesting if any
                  }))
                : []
            }))
          : []
      }))
    }
  }

  // Footer (enforce schema max constraints)
  if (src.footer?.items && Array.isArray(src.footer.items)) {
    out.footer = {
      items: src.footer.items.slice(0, 3).map(item => ({
        title: normalizeLangArray(item?.title),
        link: typeof item?.link === 'string' ? item.link : '',
        subItems: Array.isArray(item?.subItems)
          ? item.subItems.slice(0, 8).map(sub => ({
              title: normalizeLangArray(sub?.title),
              link: typeof sub?.link === 'string' ? sub.link : ''
            }))
          : []
      }))
    }
  }

  // Pages
  if (Array.isArray(src.pages)) {
    out.pages = src.pages.map(p => ({
      url: typeof p?.url === 'string' ? p.url : '',
      title: normalizeLangArray(p?.title),
      content: normalizeLangArray(p?.content)
    }))
  }

  // Photos gallery
  if (Array.isArray(src.photos)) {
    out.photos = src.photos.slice(0, 20).map(p => normalizePhoto(p))
  }

  // Theme templates (we keep them under homepageTheme; no custom themes)
  if (src.homepageTheme && typeof src.homepageTheme === 'object') {
    const theme = src.homepageTheme
    out.homepageTheme = { type: typeof theme.type === 'string' ? theme.type : 'home1' }

    const copyThemeBlock = (key) => {
      if (!theme[key] || typeof theme[key] !== 'object') return
      // Normalize photos inside known theme blocks where needed.
      const t = theme[key]
      out.homepageTheme[key] = JSON.parse(JSON.stringify(t))
    }

    ;[
      'home1',
      'home2',
      'hotel',
      'tour',
      'flight',
      'activity',
      'bedbank',
      'transfer',
      'cruise'
    ].forEach(copyThemeBlock)
  }

  // Fill the selected "template" block (home1/home2/hotel) from legacy root fields.
  // This makes preview + apply consistent even if the source JSON had only root fields.
  const themeType = out.homepageTheme?.type || (typeof src.homepageTheme?.type === 'string' ? src.homepageTheme.type : 'home1')
  const target = ['home1', 'home2', 'hotel'].includes(themeType) ? themeType : 'home1'

  // If the source is already in the new format (data lives under homepageTheme[target]),
  // expose those sections at root-level as well so the admin importer can select/apply them.
  const themeSource = src.homepageTheme && typeof src.homepageTheme === 'object' ? src.homepageTheme[target] : null
  if (themeSource && typeof themeSource === 'object') {
    if (out.hero === undefined && themeSource.hero) out.hero = themeSource.hero
    if (out.campaignSection === undefined && themeSource.campaignSection) out.campaignSection = themeSource.campaignSection
    if (out.locationSection === undefined && themeSource.locationSection) out.locationSection = themeSource.locationSection
    if (out.hotels === undefined && themeSource.hotels) out.hotels = themeSource.hotels
    if (out.tours === undefined && themeSource.tours) out.tours = themeSource.tours
  }

  out.homepageTheme = out.homepageTheme || { type: themeType }
  out.homepageTheme.type = themeType
  out.homepageTheme[target] = isPlainObject(out.homepageTheme[target]) ? out.homepageTheme[target] : {}
  ;['hero', 'campaignSection', 'locationSection', 'hotels', 'tours'].forEach(key => {
    if (out[key] !== undefined) out.homepageTheme[target][key] = out[key]
  })

  // IMPORTANT: Skip legacy/custom theme structures entirely (user request)
  delete out.customTheme
  delete out.useCustomTheme
  delete out.savedThemePresets
  delete out.draft

  return out
}

/**
 * Collect all images from storefront data
 */
const collectAllImages = (data, baseCdnUrl = 'https://images.minirez.com') => {
  const images = []

  // Helper to add image with context
  const addImage = (photo, section, index = null) => {
    const url = getImageUrl(photo, baseCdnUrl)
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

    // Map/normalize into the latest shape (safe for older storefront exports)
    const cleanedData = mapStorefrontToCurrentShape(sourceData)

    // Collect all images
    const images = collectAllImages(cleanedData, baseCdnUrl)
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
