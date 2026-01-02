import { GoogleGenAI } from '@google/genai'
import logger from '../core/logger.js'

const GEMINI_MODEL = 'gemini-3-flash-preview'

// Cache for API key and client
let cachedApiKey = null
let cachedApiKeyExpiry = 0
const API_KEY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get Gemini API key from PlatformSettings or environment
 */
const getGeminiApiKey = async () => {
  // Check cache first
  if (cachedApiKey && Date.now() < cachedApiKeyExpiry) {
    return cachedApiKey
  }

  try {
    // Dynamic import to avoid circular dependencies
    const { default: PlatformSettings } = await import('../modules/platform-settings/platformSettings.model.js')
    const settings = await PlatformSettings.getSettings()
    const credentials = settings.getGeminiCredentials()

    if (credentials?.apiKey) {
      cachedApiKey = credentials.apiKey
      cachedApiKeyExpiry = Date.now() + API_KEY_CACHE_TTL
      logger.info('Using Gemini API key from PlatformSettings')
      return cachedApiKey
    }
  } catch (error) {
    logger.warn('Failed to load Gemini API key from database:', error.message)
  }

  // Fall back to environment variable
  if (process.env.GEMINI_API_KEY) {
    cachedApiKey = process.env.GEMINI_API_KEY
    cachedApiKeyExpiry = Date.now() + API_KEY_CACHE_TTL
    logger.info('Using Gemini API key from environment')
    return cachedApiKey
  }

  return null
}

/**
 * Pre-process content to extract room information and group images
 * This helps Gemini understand room structure better
 */
const preprocessRoomContent = (content) => {
  if (!content) return { content, roomHints: null }

  // Reset used codes for this extraction
  usedCodes.clear()

  // Extract ALL hotel images - more permissive pattern
  const imagePattern = /https?:\/\/[^\s"'<>\]]+\.(jpg|jpeg|png|webp)/gi
  const rawImages = [...new Set((content.match(imagePattern) || []))]

  // Filter to keep only hotel-related images
  const allImages = rawImages.filter(img => {
    const imgLower = img.toLowerCase()
    // Must be hotel/room related
    const isHotelImage = imgLower.includes('hotel') ||
      imgLower.includes('room') ||
      imgLower.includes('oda') ||
      imgLower.includes('ets') ||
      imgLower.includes('cdn') ||
      imgLower.includes('gallery') ||
      imgLower.includes('upload') ||
      imgLower.includes('image') ||
      imgLower.includes('photo') ||
      imgLower.includes('media')
    // Skip icons, logos, social media
    const isExcluded = imgLower.includes('icon') ||
      imgLower.includes('logo') ||
      imgLower.includes('favicon') ||
      imgLower.includes('facebook') ||
      imgLower.includes('twitter') ||
      imgLower.includes('instagram') ||
      imgLower.includes('google') ||
      imgLower.includes('pixel') ||
      imgLower.includes('avatar') ||
      imgLower.includes('flag') ||
      /[-_](16|24|32|48|64|icon)[-_.]/.test(imgLower)
    return isHotelImage && !isExcluded
  })

  // Separate property images from room images
  const propertyImages = []
  const roomImages = []

  allImages.forEach(img => {
    const imgLower = img.toLowerCase()
    // Room images: contain etsrooms, /room/, /oda/ in URL
    const isRoomImage = imgLower.includes('etsrooms') ||
      imgLower.includes('/room/') ||
      imgLower.includes('/oda/') ||
      imgLower.includes('_room_') ||
      imgLower.includes('_oda_') ||
      /room[-_]?\d/i.test(imgLower)

    if (isRoomImage) {
      roomImages.push(img)
    } else {
      propertyImages.push(img)
    }
  })

  // Group ROOM images by timestamp (images with same timestamp likely belong to same room)
  const imageGroups = {}
  const ungroupedRoomImages = []

  roomImages.forEach(img => {
    // Try multiple timestamp patterns
    const timestampMatch = img.match(/_(\d{14})_(\d+)/i) ||
      img.match(/\/(\d{14})_/i) ||
      img.match(/_(\d{12,14})[_\-]/i)
    if (timestampMatch) {
      const ts = timestampMatch[1]
      if (!imageGroups[ts]) imageGroups[ts] = []
      imageGroups[ts].push(img)
    } else {
      ungroupedRoomImages.push(img)
    }
  })

  // Sort groups by image count (larger groups are likely main room types)
  const sortedGroups = Object.entries(imageGroups)
    .sort((a, b) => b[1].length - a[1].length)

  // Find room names in content - more comprehensive patterns
  const roomPatterns = [
    // ETS Tur specific - room name before "* * *" separator
    /\.(?:jpg|jpeg|png|webp)\)\n\n([^\n]+)\n\n\* \* \*/gi,
    // ETS Tur - room name with # header
    /###\s*([^\n#]+)/gi,
    // Room type with size
    /\*\*([^\*\n]+(?:Oda|Room|Suite|Villa|Bungalow)[^\*\n]*)\*\*/gi,
    // Generic room patterns - expanded
    /(?:^|\n)\s*((?:Luxury |Serenity |Laguna |Garden |Sea View |Land View |Deniz Manzaralı |Kara Manzaralı |Yandan |Pool |Beach |Mountain |City |Executive |Presidential |Premium )?(?:Suite|Superior|Süperior|Standard|Standart|Deluxe|Delüks|Family|Aile|Economy|Promo|Villa|Bungalow|Junior|King|Queen|Twin|Double|Single|Connect|Dublex|Duplex|Terrace|Penthouse|Residence)[^\n]{0,40}(?:\s*Oda|\s*Room)?)\s*\n/gi,
    // Turkish room types
    /(?:^|\n)\s*((?:Standart|Delüks|Süit|Süperior|Aile|Ekonomi|Promo|Villa|Bungalov)[^\n]{0,40}(?:\s*Oda)?)\s*\n/gi,
    // Residence types
    /(?:^|\n)\s*((?:King|Executive|Presidential|Premium|Royal)\s+(?:Residence|Suite)[^\n]{0,30})\s*\n/gi,
    // Manzaralı patterns
    /(?:^|\n)\s*((?:Luxury|Deluxe|Superior|Süperior)\s+(?:Deniz|Kara|Yandan Deniz)\s+Manzaralı[^\n]{0,20})\s*\n/gi
  ]

  const foundRooms = new Set()
  roomPatterns.forEach(pattern => {
    let match
    const patternCopy = new RegExp(pattern.source, pattern.flags) // Reset lastIndex
    while ((match = patternCopy.exec(content)) !== null) {
      let name = match[1].trim()
      // Clean up the name
      name = name.replace(/^\*+|\*+$/g, '').replace(/^#+\s*/, '').trim()
      if (name.length > 3 && name.length < 80 &&
          !name.includes('http') &&
          !name.includes('Otel') &&
          !name.includes('Hotel') &&
          !name.includes('Resort') &&
          !name.includes('Puan') &&
          !name.includes('TL') &&
          !name.includes('€') &&
          !name.includes('$')) {
        foundRooms.add(name)
      }
    }
  })

  // Also look for "Tesisin Oda Puanı" sections count as a hint
  const roomScoreCount = (content.match(/Tesisin Oda Puanı/gi) || []).length

  // Extract room sizes
  const roomSizes = [...new Set((content.match(/\d+\s*m²/g) || []))]

  // Build room hints
  const roomList = [...foundRooms]
  const roomHints = []

  // If we found room score sections but not enough rooms, note this
  const expectedRoomCount = Math.max(roomList.length, roomScoreCount, sortedGroups.length)

  roomHints.push('=== BULUNAN ODA TİPLERİ (TAM LİSTE) ===')
  roomHints.push(`Sayfada tespit edilen oda bölümü sayısı: ${roomScoreCount}`)
  roomHints.push(`Görsel grupları sayısı: ${sortedGroups.length}`)
  roomHints.push(`Oda boyutları: ${roomSizes.join(', ')}`)
  roomHints.push('')

  if (roomList.length > 0) {
    roomHints.push('Bulunan oda isimleri:')
    roomList.forEach((name, i) => {
      const code = generateRoomCode(name, i)
      roomHints.push(`${i + 1}. ${name} (Kod: ${code})`)
    })
  } else {
    roomHints.push(`DİKKAT: Oda isimleri regex ile bulunamadı ama ${roomScoreCount} oda bölümü var!`)
    roomHints.push('Lütfen içerikten oda isimlerini manuel olarak çıkar.')
  }

  roomHints.push('')
  roomHints.push(`*** TOPLAM ${allImages.length} GÖRSEL: ${propertyImages.length} otel görseli + ${roomImages.length} oda görseli ***`)
  roomHints.push('')

  // Property/Hotel images section
  if (propertyImages.length > 0) {
    roomHints.push('=== OTEL GÖRSELLERİ (images dizisine ekle, roomTemplates DEĞİL!) ===')
    roomHints.push('Bu görseller otelin genel alanları: havuz, restoran, lobi, dış cephe vb.')
    propertyImages.slice(0, 20).forEach((img, j) => roomHints.push(`  ${j + 1}. ${img}`))
    if (propertyImages.length > 20) {
      roomHints.push(`  ... ve ${propertyImages.length - 20} görsel daha`)
    }
    roomHints.push('')
  }

  // Room image groups section
  roomHints.push('=== ODA GÖRSELLERİ (roomTemplates içinde kullan!) ===')
  sortedGroups.forEach(([ts, imgs], i) => {
    const roomName = roomList[i] || `Bilinmeyen Oda ${i + 1}`
    roomHints.push(`\nGrup ${i + 1} - ${roomName}: ${imgs.length} görsel`)
    // Show ALL images in group
    imgs.forEach((img, j) => roomHints.push(`  ${j + 1}. ${img}`))
  })

  if (ungroupedRoomImages.length > 0) {
    roomHints.push(`\n=== GRUPLANMAMIŞ ODA GÖRSELLERİ (${ungroupedRoomImages.length} adet) ===`)
    roomHints.push('Bu görselleri içeriklerine göre uygun odalara dağıt:')
    ungroupedRoomImages.forEach((img, j) => roomHints.push(`  ${j + 1}. ${img}`))
  }

  roomHints.push('')
  roomHints.push('*** ÖNEMLİ: Otel görsellerini "images" dizisine, oda görsellerini "roomTemplates" içine koy! ***')
  roomHints.push('*** Otel görselleri ile oda görsellerini KARIŞTIRMA! ***')

  return {
    content: content,
    roomHints: roomHints.join('\n'),
    imageGroups: sortedGroups,
    roomNames: roomList,
    totalImages: allImages.length,
    propertyImageCount: propertyImages.length,
    roomImageCount: roomImages.length,
    expectedRoomCount
  }
}

/**
 * Generate unique room code from room name
 * Uses a Set to track used codes and appends numbers for duplicates
 */
const usedCodes = new Set()

const generateRoomCode = (name, index) => {
  const nameLower = name.toLowerCase()
  let baseCode = ''

  // Check for specific room types - more specific first
  if (nameLower.includes('presidential') && nameLower.includes('residence')) baseCode = 'PRE'
  else if (nameLower.includes('executive') && nameLower.includes('residence')) baseCode = 'EXE'
  else if (nameLower.includes('king') && nameLower.includes('residence')) baseCode = 'KNG'
  else if (nameLower.includes('premium') && nameLower.includes('suite')) baseCode = 'PRS'
  else if (nameLower.includes('suite') && nameLower.includes('serenity')) baseCode = 'SRN'
  else if (nameLower.includes('suite') && nameLower.includes('junior')) baseCode = 'JRS'
  else if (nameLower.includes('suite')) baseCode = 'STE'
  else if (nameLower.includes('villa') && nameLower.includes('garden')) baseCode = 'GRV'
  else if (nameLower.includes('villa')) baseCode = 'VIL'
  else if (nameLower.includes('bungalow') || nameLower.includes('bungalov')) baseCode = 'BNG'
  else if (nameLower.includes('residence')) baseCode = 'RES'
  else if (nameLower.includes('luxury') && nameLower.includes('deniz')) baseCode = 'LXD'
  else if (nameLower.includes('luxury') && nameLower.includes('kara')) baseCode = 'LXK'
  else if (nameLower.includes('luxury') && nameLower.includes('yandan')) baseCode = 'LXY'
  else if (nameLower.includes('luxury')) baseCode = 'LUX'
  else if (nameLower.includes('deluxe') && nameLower.includes('deniz')) baseCode = 'DXD'
  else if (nameLower.includes('deluxe') && nameLower.includes('kara')) baseCode = 'DXK'
  else if (nameLower.includes('deluxe') && nameLower.includes('yandan')) baseCode = 'DXY'
  else if (nameLower.includes('deluxe') || nameLower.includes('delüks')) baseCode = 'DLX'
  else if (nameLower.includes('superior') || nameLower.includes('süperior')) baseCode = 'SUP'
  else if (nameLower.includes('standard') || nameLower.includes('standart')) baseCode = 'STD'
  else if (nameLower.includes('family') || nameLower.includes('aile')) baseCode = 'FAM'
  else if (nameLower.includes('economy') || nameLower.includes('ekonomi')) baseCode = 'ECO'
  else if (nameLower.includes('promo')) baseCode = 'PRM'
  else if (nameLower.includes('deniz') || nameLower.includes('sea')) baseCode = 'SEA'
  else if (nameLower.includes('kara') || nameLower.includes('land')) baseCode = 'LND'
  else {
    // Fallback: generate from first letters
    const words = name.split(/\s+/).filter(w => w.length > 2)
    if (words.length >= 2) {
      baseCode = (words[0][0] + words[1][0] + (words[2]?.[0] || '')).toUpperCase()
    } else {
      baseCode = `RM${index + 1}`
    }
  }

  // Ensure uniqueness by appending number if needed
  let finalCode = baseCode
  let counter = 2
  while (usedCodes.has(finalCode)) {
    finalCode = `${baseCode}${counter}`
    counter++
  }
  usedCodes.add(finalCode)

  return finalCode
}

// Reset used codes for each extraction
const resetUsedCodes = () => {
  usedCodes.clear()
}

// Initialize the AI client
let ai = null
let aiKeyHash = null

const getAI = async () => {
  const apiKey = await getGeminiApiKey()
  if (!apiKey) return null

  // Create new client if key changed or not initialized
  const keyHash = apiKey.substring(0, 10)
  if (!ai || aiKeyHash !== keyHash) {
    ai = new GoogleGenAI({ apiKey })
    aiKeyHash = keyHash
  }
  return ai
}

// Language names for better translation context
const languageNames = {
  tr: 'Turkish',
  en: 'English',
  ru: 'Russian',
  el: 'Greek',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  fr: 'French',
  ro: 'Romanian',
  bg: 'Bulgarian',
  pt: 'Portuguese',
  da: 'Danish',
  zh: 'Chinese',
  ar: 'Arabic',
  fa: 'Persian',
  he: 'Hebrew',
  sq: 'Albanian',
  uk: 'Ukrainian',
  pl: 'Polish',
  az: 'Azerbaijani'
}

/**
 * Generate content using Gemini AI
 */
const generateContent = async (prompt, options = {}) => {
  const client = await getAI()
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured. Please configure it in Platform Settings.')
  }

  const config = {
    temperature: options.temperature || 0.3,
    maxOutputTokens: options.maxOutputTokens || 16000,
    ...(options.thinkingLevel && {
      thinkingConfig: {
        thinkingLevel: options.thinkingLevel
      }
    })
  }

  logger.info('Gemini request - model: ' + GEMINI_MODEL + ', config: ' + JSON.stringify(config))

  // Use streaming to collect complete response
  const response = await client.models.generateContentStream({
    model: GEMINI_MODEL,
    config,
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  })

  // Collect all chunks
  let fullText = ''
  let chunkCount = 0
  for await (const chunk of response) {
    chunkCount++
    if (chunk.text) {
      fullText += chunk.text
    }
  }

  logger.info('Gemini response - chunks: ' + chunkCount + ', totalLength: ' + fullText.length)

  return fullText
}

/**
 * Translate text using Gemini AI
 */
export const translateText = async (text, sourceLang, targetLang) => {
  if (!text || text.trim() === '') {
    return ''
  }

  const sourceLangName = languageNames[sourceLang] || sourceLang
  const targetLangName = languageNames[targetLang] || targetLang

  const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}.
Only return the translated text, nothing else. Do not add quotes or explanations.
If the text contains HTML tags, preserve them.

Text to translate:
${text}`

  try {
    const result = await generateContent(prompt, { temperature: 0.3 })
    return result?.trim() || ''
  } catch (error) {
    logger.error('Translation error:', error.message)
    throw error
  }
}

/**
 * Translate multiple fields to multiple languages in a SINGLE API call
 */
export const translateFields = async (fields, sourceLang, targetLangs) => {
  const results = {}

  // Initialize results
  for (const lang of targetLangs) {
    results[lang] = {}
  }

  // Get non-empty fields
  const fieldsToTranslate = {}
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    if (fieldValue && fieldValue.trim()) {
      fieldsToTranslate[fieldName] = fieldValue
    } else {
      // Empty fields stay empty in all languages
      for (const lang of targetLangs) {
        results[lang][fieldName] = ''
      }
    }
  }

  // If no fields to translate, return early
  if (Object.keys(fieldsToTranslate).length === 0) {
    return results
  }

  // Filter out source language from targets
  const actualTargets = targetLangs.filter(lang => lang !== sourceLang)

  // Add source language values directly
  results[sourceLang] = { ...fieldsToTranslate }

  if (actualTargets.length === 0) {
    return results
  }

  // Build target languages list with names
  const targetLangsList = actualTargets.map(code => {
    const name = languageNames[code] || code
    return `"${code}": "${name}"`
  }).join(', ')

  const sourceLangName = languageNames[sourceLang] || sourceLang

  // Build fields list for prompt
  const fieldsJson = JSON.stringify(fieldsToTranslate, null, 2)

  const prompt = `You are a professional translator. Translate the following fields from ${sourceLangName} to multiple languages.

IMPORTANT RULES:
1. Return ONLY a valid JSON object, nothing else
2. Top-level keys are language codes
3. Each language contains the translated fields with same field names
4. Preserve any HTML tags if present
5. Keep translations natural and contextually appropriate

Source fields (${sourceLangName}):
${fieldsJson}

Target languages: {${targetLangsList}}

Return JSON format:
{
  "${actualTargets[0]}": {"fieldName": "translation", ...},
  "${actualTargets[1] || actualTargets[0]}": {"fieldName": "translation", ...}
}`

  try {
    const responseText = await generateContent(prompt, {
      temperature: 0.2,
      maxOutputTokens: 8000
    })

    if (!responseText) {
      throw new Error('No response from AI')
    }

    // Clean up response
    let cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Try to extract JSON
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    const translations = JSON.parse(cleanedResponse)

    // Merge translations into results
    for (const lang of actualTargets) {
      if (translations[lang]) {
        results[lang] = { ...results[lang], ...translations[lang] }
      }
    }

    logger.info(`Fields translation completed: ${Object.keys(fieldsToTranslate).length} fields to ${actualTargets.length} languages`)
    return results

  } catch (error) {
    logger.error('Fields translation error:', error.message)
    return results
  }
}

/**
 * Batch translate content object to all target languages in a SINGLE API call
 * Much faster than translating each language separately
 */
export const batchTranslate = async (content, sourceLang, allLangs) => {
  const sourceContent = content[sourceLang]

  if (!sourceContent || sourceContent.trim() === '') {
    return content
  }

  // Filter out source language
  const targetLangs = allLangs.filter(lang => lang !== sourceLang)

  if (targetLangs.length === 0) {
    return content
  }

  // Build target languages list with names for better context
  const targetLangsList = targetLangs.map(code => {
    const name = languageNames[code] || code
    return `"${code}": "${name}"`
  }).join(', ')

  const sourceLangName = languageNames[sourceLang] || sourceLang

  const prompt = `You are a professional translator. Translate the following text from ${sourceLangName} to multiple languages.

IMPORTANT RULES:
1. Return ONLY a valid JSON object, nothing else
2. Keys must be the language codes exactly as provided
3. Values must be the translated text
4. Preserve any HTML tags if present
5. Do not add quotes around the JSON, just return raw JSON
6. Keep translations natural and contextually appropriate

Source text (${sourceLangName}):
"${sourceContent}"

Target languages: {${targetLangsList}}

Return JSON format:
{"${targetLangs[0]}": "translation", "${targetLangs[1] || targetLangs[0]}": "translation", ...}`

  try {
    const responseText = await generateContent(prompt, {
      temperature: 0.2,
      maxOutputTokens: 8000
    })

    if (!responseText) {
      throw new Error('No response from AI')
    }

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Try to extract JSON
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    const translations = JSON.parse(cleanedResponse)

    // Build result with source content and translations
    const result = { ...content }
    result[sourceLang] = sourceContent

    for (const lang of targetLangs) {
      if (translations[lang]) {
        result[lang] = translations[lang]
      }
    }

    logger.info(`Batch translation completed: ${targetLangs.length} languages in single call`)
    return result

  } catch (error) {
    logger.error('Batch translation error:', error.message)

    // Fallback: return original content with source
    const result = { ...content }
    result[sourceLang] = sourceContent
    return result
  }
}

/**
 * Parse a natural language pricing command using Gemini AI
 */
export const parsePricingCommand = async (command, context = {}) => {
  if (!command || command.trim() === '') {
    throw new Error('Command is required')
  }

  const today = new Date().toISOString().split('T')[0]
  const currentYear = new Date().getFullYear()

  // Build context string for AI
  const roomTypesStr = context.roomTypes?.map(rt => {
    const statusTag = rt.status === 'inactive' ? ' [inaktif]' : ''
    return `${rt.code}: ${rt.name}${statusTag}`
  }).join(', ') || 'Belirtilmemiş'
  const mealPlansStr = context.mealPlans?.map(mp => `${mp.code}: ${mp.name}`).join(', ') || 'Belirtilmemiş'
  const seasonsStr = context.seasons?.map(s => {
    const startDate = s.dateRanges?.[0]?.startDate ? new Date(s.dateRanges[0].startDate).toISOString().split('T')[0] : ''
    const endDate = s.dateRanges?.[0]?.endDate ? new Date(s.dateRanges[0].endDate).toISOString().split('T')[0] : ''
    return `${s.code}: ${s.name} (${startDate} - ${endDate})`
  }).join(', ') || 'Belirtilmemiş'

  // Build current month context
  let currentMonthStr = ''
  if (context.currentMonth?.year && context.currentMonth?.month) {
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    const monthName = monthNames[context.currentMonth.month - 1]
    currentMonthStr = `${monthName} ${context.currentMonth.year}`
  }

  logger.info('AI Context - Seasons: ' + seasonsStr)
  logger.info('AI Context - RoomTypes: ' + roomTypesStr)
  logger.info('AI Context - MealPlans: ' + mealPlansStr)
  logger.info('AI Context - Current Month: ' + currentMonthStr)

  // Build the current month date range for the prompt
  let currentMonthDateRange = ''
  if (context.currentMonth?.year && context.currentMonth?.month) {
    const year = context.currentMonth.year
    const month = context.currentMonth.month
    const lastDay = new Date(year, month, 0).getDate()
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    currentMonthDateRange = `${startDate} ile ${endDate} arası`
  }

  // Build selection context string for AI
  let selectionStr = ''
  if (context.selectionContext) {
    const sel = context.selectionContext
    selectionStr = `
###############################################
# SEÇİLİ HÜCRELER (KULLANICI TARAFINDAN SEÇİLDİ!)
# Hücre Sayısı: ${sel.count}
# Tarih Aralığı: ${sel.startDate} - ${sel.endDate}
# Odalar: ${sel.roomTypes?.join(', ') || 'Tümü'}
# Pansiyonlar: ${sel.mealPlans?.join(', ') || 'Tümü'}
###############################################
`
    logger.info('AI Context - Selection: ' + JSON.stringify(sel))
  }

  const prompt = `Otel fiyatlandırma asistanısın. Komutu JSON'a çevir.

Bugün: ${today}
${currentMonthStr ? `
###############################################
# EKRANDA GÖRÜNTÜLENEN AY: ${currentMonthStr}
# TARİH ARALIĞI: ${currentMonthDateRange}
# "aşağıdaki" = BU AY = ${currentMonthStr}
###############################################
` : ''}${selectionStr}
Odalar: ${roomTypesStr}
Pansiyonlar: ${mealPlansStr}
Sezonlar: ${seasonsStr}

Komut: "${command}"

JSON formatı (SADECE JSON döndür):
{
  "success": true,
  "actions": [{"action": "ACTION", "filters": {"roomTypes": "all", "mealPlans": "all", "daysOfWeek": "all"}, "value": 100, "valueType": "percentage"}],
  "dateRange": {"startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"},
  "summary": {"tr": "...", "en": "..."}
}

ACTION: stop_sale, open_sale, single_stop, open_single, set_price, update_price, set_supplement, update_allotment, update_min_stay, update_max_stay, close_to_arrival, close_to_departure

CTA/CTD KURALLARI (ÇOK ÖNEMLİ!):
- close_to_arrival (CTA) ve close_to_departure (CTD) için value: true veya false OLMALI
- "CTA/CTD kaldır", "CTA/CTD aç", "CTA/CTD iptal" → value: false (kısıtlamayı KALDIR)
- "CTA/CTD ekle", "CTA/CTD uygula", "CTA/CTD kapat" → value: true (kısıtlama EKLE)
- "bütün ctd'leri kaldır" = close_to_departure, value: false
- "girişe kapat" = close_to_arrival, value: true
- "çıkışa aç" = close_to_departure, value: false

SEÇİLİ HÜCRELER (EN ÖNCELİKLİ!):
- "seçili", "seçilen", "seçilmiş", "işaretli", "işaretlenen" kelimelerinden BİRİ VARSA VE SEÇİLİ HÜCRELER VARSA:
  → MUTLAKA seçili hücrelerin tarih aralığını kullan!
  → filters.roomTypes = seçili odalar
  → filters.mealPlans = seçili pansiyonlar
  → Kullanıcı takvimden seçtiği günlere işlem uygulamak istiyor!
- SEÇİLİ HÜCRELER YOKSA ve "seçili" denirse → Hata döndür: {"success":false,"error":"Seçili hücre yok. Önce takvimden hücre seçin."}

TARİH BELİRLEME (ÇOK ÖNEMLİ!):
- "aşağıdaki", "aşağıda", "bu ay", "görüntülenen", "ekrandaki", "şu anki", "mevcut" kelimelerinden BİRİ VARSA:
  → MUTLAKA ${currentMonthStr ? `${currentMonthStr} (${currentMonthDateRange.replace(' ile ', ' - ').replace(' arası', '')})` : 'Görüntülenen ayı'} kullan!
  → SEZON KULLANMA! Sadece görüntülenen ayın tarihlerini kullan!
- SADECE "sezon" veya "tüm sezon" denirse → Sezonlar listesinden tarihleri al
- Tarih belirtilmemişse → ${currentMonthStr ? currentMonthStr : 'Görüntülenen ayı kullan'}

GÜN FİLTRESİ (daysOfWeek - SADECE STRING!):
- "haftasonu", "weekend", "cmt paz", "cumartesi pazar" → ["saturday", "sunday"]
- "haftaiçi", "weekday" → ["monday", "tuesday", "wednesday", "thursday", "friday"]
- "cuma", "friday" → ["friday"]
- "pazartesi salı" → ["monday", "tuesday"]
- Belirtilmemişse → "all"

İŞLEM TİPİ:
- Yeni fiyat: set_price (value: sabit TL)
- Zam/indirim: update_price (valueType: "percentage" veya "fixed")
- Stop: stop_sale, Aç: open_sale
- Single Stop: single_stop (tek kişi satışı kapat), open_single (tek kişi satışı aç)
- Pansiyon farkı: set_supplement

DİĞER:
- Birden fazla işlem → actions dizisine hepsini ekle
- summary gelecek zamanda: "uygulanacak", "girilecek"
- [inaktif] odalar dahil

ÖRNEK 1 - "aşağıdaki haftasonlarına %10 zam" (Görüntülenen: ${currentMonthStr || 'Haziran 2026'}):
NOT: "aşağıdaki" dediği için SEZON DEĞİL, görüntülenen ayı kullandık!
{"success":true,"actions":[{"action":"update_price","filters":{"roomTypes":"all","mealPlans":"all","daysOfWeek":["saturday","sunday"]},"value":10,"valueType":"percentage"}],"dateRange":{"startDate":"${context.currentMonth ? `${context.currentMonth.year}-${String(context.currentMonth.month).padStart(2,'0')}-01` : '2026-06-01'}","endDate":"${context.currentMonth ? `${context.currentMonth.year}-${String(context.currentMonth.month).padStart(2,'0')}-${new Date(context.currentMonth.year, context.currentMonth.month, 0).getDate()}` : '2026-06-30'}"},"summary":{"tr":"${currentMonthStr || 'Haziran 2026'} haftasonlarına %10 zam uygulanacak","en":"..."}}

ÖRNEK 2 - "tüm sezon için fiyatları güncelle":
NOT: "sezon" dediği için Sezonlar listesinden tarih aldık!
{"success":true,"actions":[{"action":"update_price",...}],"dateRange":{"startDate":"2026-04-01","endDate":"2026-10-31"},...}

ÖRNEK 3 - "seçili günlere stop çek" (SEÇİLİ HÜCRELER: 2026-06-15 - 2026-06-20, Odalar: STD, DBL, Pansiyonlar: AI):
NOT: "seçili" dediği için SEÇİLİ HÜCRELERİN tarih aralığını ve filtrelerini kullandık!
{"success":true,"actions":[{"action":"stop_sale","filters":{"roomTypes":["STD","DBL"],"mealPlans":["AI"],"daysOfWeek":"all"},"value":true}],"dateRange":{"startDate":"2026-06-15","endDate":"2026-06-20"},"summary":{"tr":"Seçili 6 hücreye stop sale uygulanacak","en":"Stop sale will be applied to 6 selected cells"}}`

  try {
    const responseText = await generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 65536,
      thinkingLevel: 'low'
    })

    if (!responseText) {
      throw new Error('No response received from AI')
    }

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Try to extract JSON if there's extra text
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    try {
      const parsed = JSON.parse(cleanedResponse)
      logger.info('AI parsed response: ' + JSON.stringify(parsed))
      return parsed
    } catch (parseError) {
      logger.error('Failed to parse AI response: ' + cleanedResponse)
      return {
        success: false,
        error: 'AI yanıtı parse edilemedi',
        rawResponse: cleanedResponse.substring(0, 500)
      }
    }
  } catch (error) {
    logger.error('AI parsing error: ' + error.message)
    throw error
  }
}

/**
 * Check if JSON response is truncated (incomplete)
 */
const isJsonTruncated = (jsonStr) => {
  if (!jsonStr) return true
  const trimmed = jsonStr.trim()
  // JSON should end with } or ]
  if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) return true
  // Try to count braces
  let braceCount = 0
  let bracketCount = 0
  let inString = false
  let escaped = false
  for (const char of trimmed) {
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (char === '{') braceCount++
      else if (char === '}') braceCount--
      else if (char === '[') bracketCount++
      else if (char === ']') bracketCount--
    }
  }
  return braceCount !== 0 || bracketCount !== 0
}

/**
 * Attempt to repair truncated JSON by closing open brackets
 * This is a best-effort recovery for truncated responses
 */
const repairTruncatedJson = (jsonStr) => {
  if (!jsonStr) return '{}'

  let repaired = jsonStr.trim()

  // Remove any trailing incomplete property (e.g., "name": "Some incomplete)
  // Find last complete property
  const lastCompleteMatch = repaired.match(/^([\s\S]*"[^"]+"\s*:\s*(?:"[^"]*"|[\d.]+|true|false|null|\{[\s\S]*?\}|\[[\s\S]*?\]))\s*,?\s*"[^"]*$/m)
  if (lastCompleteMatch) {
    repaired = lastCompleteMatch[1]
  }

  // Remove trailing comma if present
  repaired = repaired.replace(/,\s*$/, '')

  // Count unclosed brackets
  let braceCount = 0
  let bracketCount = 0
  let inString = false
  let escaped = false

  for (const char of repaired) {
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (char === '{') braceCount++
      else if (char === '}') braceCount--
      else if (char === '[') bracketCount++
      else if (char === ']') bracketCount--
    }
  }

  // Close unclosed brackets
  while (bracketCount > 0) {
    repaired += ']'
    bracketCount--
  }
  while (braceCount > 0) {
    repaired += '}'
    braceCount--
  }

  logger.info(`Repaired JSON: added ${-braceCount} braces, ${-bracketCount} brackets`)
  return repaired
}

/**
 * Extract hotel data from text, URL content, or document using Gemini AI
 * Returns structured JSON matching the hotel schema with confidence scores
 * Includes retry logic for truncated responses
 */
export const extractHotelData = async (content, contentType = 'text', retryCount = 0) => {
  const MAX_RETRIES = 2

  if (!content || content.trim() === '') {
    throw new Error('Content is required')
  }

  // Pre-process content to extract room information
  const preprocessed = preprocessRoomContent(content)
  const roomHintsSection = preprocessed.roomHints
    ? `\n${preprocessed.roomHints}\n`
    : ''

  logger.info(`Preprocessed: ${preprocessed.roomNames?.length || 0} rooms found, ${preprocessed.totalImages || 0} images (${preprocessed.propertyImageCount || 0} property + ${preprocessed.roomImageCount || 0} room)`)

  const prompt = `Sen bir otel veri çıkarma uzmanısın. Aşağıdaki ${contentType === 'url' ? 'web sayfası içeriğinden' : contentType === 'pdf' ? 'PDF dökümanından' : 'metinden'} otel bilgilerini çıkar ve JSON formatında döndür.

ÖNEMLİ KURALLAR:
1. SADECE geçerli JSON döndür, başka bir şey ekleme
2. Bulamadığın alanları boş string "" veya null olarak bırak
3. Her alan için confidence (güven) skoru ekle (0-100 arası)
4. Çoklu dil alanlarında Türkçe (tr) ve İngilizce (en) için değer ver, diğerlerini boş bırak
5. amenities ve profile.features için sadece belirtilen enum değerlerini kullan
6. Koordinatları ondalıklı sayı olarak ver (örn: 36.8523)
7. Resimleri çıkarırken: sadece otel fotoğraflarını al (banner, icon, reklam resimlerini alma), TAM URL kullan (https://... ile başlamalı), en az 5-10 resim bul

OTEL VERİ ŞEMASI:

{
  "name": "Otel adı (string)",
  "description": {
    "tr": "Türkçe açıklama",
    "en": "English description"
  },
  "stars": 5,
  "type": "hotel|apart|boutique|resort|hostel|villa|guesthouse|motel|pension|camping",
  "category": "economy|standard|superior|deluxe|luxury|ultra-luxury",
  "address": {
    "street": "Sokak/Cadde",
    "district": "İlçe",
    "city": "Şehir",
    "country": "Ülke",
    "postalCode": "Posta kodu",
    "coordinates": {
      "lat": 36.8523,
      "lng": 30.7233
    }
  },
  "contact": {
    "phone": "+90 xxx",
    "email": "email@hotel.com",
    "website": "https://...",
    "fax": "+90 xxx"
  },
  "amenities": [
    "wifi", "parking", "freeParking", "valetParking",
    "pool", "indoorPool", "outdoorPool", "spa", "gym", "sauna", "hammam",
    "restaurant", "bar", "roomService", "breakfast",
    "reception24h", "concierge", "laundry", "dryCleaning", "airportShuttle",
    "businessCenter", "meetingRooms", "conferenceHall",
    "kidsClub", "playground", "babysitting",
    "beachAccess", "privateBeach", "garden", "terrace",
    "wheelchairAccessible", "elevator",
    "petFriendly", "smokingArea", "nonSmoking",
    "casino", "nightclub", "cinema", "gameRoom",
    "tennis", "golf", "diving", "surfing", "skiing"
  ],
  "roomConfig": {
    "totalRooms": 100,
    "floors": 5,
    "hasElevator": true
  },
  "policies": {
    "checkIn": "14:00",
    "checkOut": "12:00",
    "maxBabyAge": 2,
    "maxChildAge": 12,
    "childPolicy": { "tr": "...", "en": "..." },
    "petPolicy": { "tr": "...", "en": "..." }
  },
  "profile": {
    "overview": {
      "content": { "tr": "...", "en": "..." },
      "establishedYear": 2010,
      "renovationYear": 2023,
      "chainBrand": "Marka adı"
    },
    "facilities": {
      "content": { "tr": "...", "en": "..." },
      "features": ["wifi", "freeWifi", "parking", "freeParking", "reception24h", "concierge", "elevator", "airConditioning", "laundry", "garden", "terrace"]
    },
    "dining": {
      "content": { "tr": "...", "en": "..." },
      "features": ["mainRestaurant", "alacarteRestaurant", "buffetRestaurant", "snackBar", "poolBar", "beachBar", "lobbyBar", "roomService", "minibar"],
      "restaurants": [{ "name": "...", "cuisine": "...", "reservationRequired": false }]
    },
    "sportsEntertainment": {
      "content": { "tr": "...", "en": "..." },
      "features": ["fitness", "tennis", "volleyball", "waterSports", "animation", "liveMusic", "disco"]
    },
    "spaWellness": {
      "content": { "tr": "...", "en": "..." },
      "features": ["spa", "hammam", "sauna", "jacuzzi", "massage"]
    },
    "familyKids": {
      "content": { "tr": "...", "en": "..." },
      "features": ["kidsClub", "playground", "babyPool", "kidsPool", "waterSlides", "babysitting", "kidsMenu"],
      "kidsClubAges": { "min": 4, "max": 12 }
    },
    "beachPool": {
      "content": { "tr": "...", "en": "..." },
      "features": ["privateBeach", "sandyBeach", "sunbeds", "outdoorPool", "indoorPool", "kidsPool", "waterSlides"],
      "beachDetails": { "distance": 0, "type": "sand|pebble|platform|mixed", "length": 500 },
      "pools": [{ "type": "outdoor|indoor|kids", "heated": false, "dimensions": "25x12m" }]
    },
    "honeymoon": {
      "content": { "tr": "...", "en": "..." },
      "features": ["romanticRoomDecoration", "champagne", "romanticDinner", "couplesSpa"],
      "available": true
    },
    "location": {
      "content": { "tr": "...", "en": "..." },
      "distances": [
        { "place": "Havalimanı", "distance": 45, "unit": "km" },
        { "place": "Şehir merkezi", "distance": 10, "unit": "km" },
        { "place": "Plaj", "distance": 0, "unit": "m" }
      ]
    }
  },
  "images": [
    {
      "url": "https://hotel.com/full-path/image.jpg (tam URL, relative path değil)",
      "alt": "Resim açıklaması",
      "category": "exterior|lobby|room|pool|beach|restaurant|spa|garden|other"
    }
  ],
  "logo": "https://hotel.com/logo.png (otel logosu tam URL, varsa)",
  "roomTemplates": [
    {
      "code": "STD|DLX|STE|FAM|SGL|DBL|TWN|SUITE|BUNG|VILLA (kısa kod)",
      "name": { "tr": "Standart Oda", "en": "Standard Room" },
      "description": { "tr": "Oda açıklaması", "en": "Room description" },
      "images": [
        { "url": "https://hotel.com/room1-image1.jpg", "caption": { "tr": "", "en": "" } },
        { "url": "https://hotel.com/room1-image2.jpg", "caption": { "tr": "", "en": "" } },
        { "url": "https://hotel.com/room1-image3.jpg", "caption": { "tr": "", "en": "" } }
      ],
      "amenities": [
        "wifi", "airConditioning", "heating", "tv", "satelliteTV", "smartTV", "minibar", "refrigerator", "kettle", "coffeeMachine",
        "privateBathroom", "bathtub", "shower", "rainShower", "jacuzzi", "hairdryer", "toiletries", "bathrobes", "slippers",
        "seaView", "poolView", "gardenView", "cityView", "mountainView", "balcony", "terrace", "privatePool",
        "safe", "desk", "sofa", "wardrobe", "ironingEquipment", "soundproofing",
        "roomService", "dailyHousekeeping", "wheelchairAccessible", "connectedRooms", "nonSmoking", "petFriendly"
      ],
      "size": 25,
      "bedConfiguration": [
        { "type": "single|double|queen|king|twin|sofa|bunk|extra", "count": 1 }
      ],
      "occupancy": {
        "maxAdults": 2,
        "maxChildren": 2,
        "totalMaxGuests": 4
      }
    }
  ],
  "confidence": {
    "name": 95,
    "description": 80,
    "stars": 100,
    "address": 90,
    "contact": 85,
    "amenities": 75,
    "profile": 70,
    "images": 60,
    "roomTemplates": 70
  }
}

ODA ŞABLONLARI TALİMATLARI (ÇOK ÖNEMLİ!):
- "BULUNAN ODA TİPLERİ" bölümünde listelenen TÜM odalari çıkar - HİÇBİRİNİ ATLAMA!
- Her oda için BENZERSİZ kod kullan (aynı kodu iki odada kullanma!)
- Oda olanaklarını (amenities) sadece yukarıdaki listeden seç
- Oda boyutunu (m²), yatak tipini ve kapasiteyi çıkar

GÖRSEL ATAMA KURALLARI (EN ÖNEMLİ!):
- "OTEL GÖRSELLERİ" bölümündeki görseller → "images" dizisine (havuz, restoran, lobi, dış cephe)
- "ODA GÖRSELLERİ" bölümündeki görseller → "roomTemplates[].images" dizisine
- OTEL görsellerini ODA görsellerine KARIŞTIRMA!
- URL'de "etsrooms" geçen görseller SADECE odalara ait - "images" dizisine KOYMA!
- URL'de "hotelImages" geçen görseller SADECE otele ait - "roomTemplates" içine KOYMA!
- Her oda grubundaki TÜM görselleri ilgili odaya ekle
- Navbar, icon, banner, logo, sosyal medya görsellerini KULLANMA

${roomHintsSection}

İÇERİK:
"""
${content}
"""

Sadece JSON döndür:`

  try {
    // Use higher token limit for comprehensive extraction
    const responseText = await generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 65536  // Maximum for Gemini
    })

    if (!responseText) {
      throw new Error('No response received from AI')
    }

    logger.info(`Gemini raw response length: ${responseText.length} chars`)

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Try to extract JSON if there's extra text
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    // Check if response is truncated
    if (isJsonTruncated(cleanedResponse)) {
      logger.warn(`Gemini response appears truncated (${cleanedResponse.length} chars), retry ${retryCount + 1}/${MAX_RETRIES}`)

      if (retryCount < MAX_RETRIES) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
        return extractHotelData(content, contentType, retryCount + 1)
      }

      // Last resort: try to repair truncated JSON by closing brackets
      logger.warn('Max retries reached, attempting to repair truncated JSON')
      cleanedResponse = repairTruncatedJson(cleanedResponse)
    }

    try {
      const parsed = JSON.parse(cleanedResponse)
      logger.info('Hotel data extraction completed - fields: ' + Object.keys(parsed).length + ', rooms: ' + (parsed.roomTemplates?.length || 0))
      return {
        success: true,
        data: parsed
      }
    } catch (parseError) {
      logger.error('Failed to parse AI response: ' + cleanedResponse.substring(0, 500))

      // If we haven't exhausted retries, try again
      if (retryCount < MAX_RETRIES) {
        logger.info(`Retrying due to parse error, attempt ${retryCount + 2}/${MAX_RETRIES + 1}`)
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
        return extractHotelData(content, contentType, retryCount + 1)
      }

      return {
        success: false,
        error: 'AI yanıtı parse edilemedi',
        rawResponse: cleanedResponse.substring(0, 1000)
      }
    }
  } catch (error) {
    logger.error('Hotel data extraction error: ' + error.message)

    // Retry on network/API errors
    if (retryCount < MAX_RETRIES && (error.message.includes('timeout') || error.message.includes('network'))) {
      logger.info(`Retrying due to error, attempt ${retryCount + 2}/${MAX_RETRIES + 1}`)
      await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)))
      return extractHotelData(content, contentType, retryCount + 1)
    }

    throw error
  }
}

/**
 * Fetch URL content using Firecrawl and extract hotel data with Gemini
 * Firecrawl crawls multiple pages (about, rooms, facilities, etc.) for comprehensive data
 * @param {string} url - Hotel URL to extract data from
 * @param {object} options - Options including progress emitter
 * @param {ProgressEmitter} options.progress - Optional progress emitter for real-time updates
 */
export const extractHotelDataFromUrl = async (url, options = {}) => {
  const { progress } = options

  if (!url || !url.trim()) {
    throw new Error('URL is required')
  }

  const client = await getAI()
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured. Please configure it in Platform Settings.')
  }

  // Initialize progress steps if emitter provided
  if (progress) {
    progress.setSteps([
      { id: 'init', label: { tr: 'Başlatılıyor', en: 'Initializing' } },
      { id: 'crawl', label: { tr: 'Web sayfası taranıyor', en: 'Crawling web page' } },
      { id: 'preprocess', label: { tr: 'İçerik ön işleniyor', en: 'Preprocessing content' } },
      { id: 'extract', label: { tr: 'AI ile veri çıkarılıyor', en: 'Extracting data with AI' } },
      { id: 'validate', label: { tr: 'Veriler doğrulanıyor', en: 'Validating data' } }
    ])
    progress.startStep('init', { url })
  }

  let webContent = null
  let crawledPages = []

  // Try Firecrawl first for better content extraction
  try {
    const firecrawl = await import('./firecrawlService.js')

    if (firecrawl.isConfigured()) {
      logger.info('Using Firecrawl to crawl hotel website: ' + url)

      if (progress) {
        progress.completeStep('init')
        progress.startStep('crawl', { method: 'firecrawl', maxPages: 12 })
      }

      const crawlResult = await firecrawl.smartFetch(url, {
        maxPages: 12,
        onPageScraped: (pageInfo) => {
          // Emit progress for each scraped page
          if (progress) {
            progress.updateStep('crawl', {
              currentPage: pageInfo.url,
              pagesScraped: pageInfo.index + 1,
              totalChars: pageInfo.totalChars,
              imagesFound: pageInfo.imagesFound
            })
          }
        }
      })

      if (crawlResult && crawlResult.success && crawlResult.content) {
        webContent = crawlResult.content
        crawledPages = crawlResult.pages || []
        logger.info(`Firecrawl success: ${crawledPages.length} pages, ${webContent.length} chars`)

        if (progress) {
          progress.completeStep('crawl', {
            pagesScraped: crawledPages.length,
            totalChars: webContent.length,
            uniqueImages: crawlResult.uniqueImages || 0
          })
        }
      }
    }
  } catch (firecrawlError) {
    logger.warn('Firecrawl failed, will use Gemini direct: ' + firecrawlError.message)
    if (progress) {
      progress.updateStep('crawl', { error: firecrawlError.message, fallback: true })
    }
  }

  // If we have content from Firecrawl, use extractHotelData with that content
  if (webContent && webContent.length > 500) {
    logger.info('Extracting hotel data from Firecrawl content')

    if (progress) {
      progress.startStep('preprocess')
    }

    // Pre-process to get room hints
    const preprocessed = preprocessRoomContent(webContent)

    if (progress) {
      progress.completeStep('preprocess', {
        roomsFound: preprocessed.roomNames?.length || 0,
        imagesFound: preprocessed.totalImages || 0,
        roomNames: preprocessed.roomNames || []
      })
      progress.startStep('extract', { method: 'firecrawl_content' })
    }

    const result = await extractHotelData(webContent, 'url', 0, progress)

    if (result.success) {
      if (progress) {
        progress.completeStep('extract', {
          fieldsExtracted: Object.keys(result.data).length,
          roomTemplates: result.data.roomTemplates?.length || 0
        })
        progress.startStep('validate')
        progress.completeStep('validate', {
          valid: true,
          roomCodes: result.data.roomTemplates?.map(r => r.code) || []
        })
        progress.complete({
          success: true,
          hotelName: result.data.name,
          roomCount: result.data.roomTemplates?.length || 0,
          imageCount: result.data.images?.length || 0
        })
      }

      return {
        ...result,
        sourceUrl: url,
        crawledPages: crawledPages
      }
    }
  }

  // Fallback: Use Gemini's direct URL reading capability
  logger.info('Falling back to Gemini direct URL reading: ' + url)

  if (progress) {
    if (!progress.steps.find(s => s.id === 'crawl')?.status) {
      progress.completeStep('init')
    }
    progress.startStep('crawl', { method: 'gemini_direct' })
  }

  const prompt = `Sen bir otel veri çıkarma uzmanısın. Bu web sayfasından otel bilgilerini çıkar ve JSON formatında döndür.

ÖNEMLİ KURALLAR:
1. SADECE geçerli JSON döndür, başka bir şey ekleme
2. Bulamadığın alanları boş string "" veya null olarak bırak
3. Her alan için confidence (güven) skoru ekle (0-100 arası)
4. Çoklu dil alanlarında - sayfanın dilinde içerik var ise o dile yaz, yoksa Türkçe ve İngilizce için tahmin et
5. amenities ve profile.features için sadece belirtilen enum değerlerini kullan
6. Koordinatları ondalıklı sayı olarak ver (örn: 36.8523)
7. Resimleri çıkarırken: sadece otel fotoğraflarını al (banner, icon, reklam resimlerini alma), TAM URL kullan (https://... ile başlamalı), en az 5-10 resim bul

OTEL VERİ ŞEMASI:

{
  "name": "Otel adı (string)",
  "description": {
    "tr": "Türkçe açıklama",
    "en": "English description"
  },
  "stars": 5,
  "type": "hotel|apart|boutique|resort|hostel|villa|guesthouse|motel|pension|camping",
  "category": "economy|standard|superior|deluxe|luxury|ultra-luxury",
  "address": {
    "street": "Sokak/Cadde",
    "district": "İlçe",
    "city": "Şehir",
    "country": "Ülke",
    "postalCode": "Posta kodu",
    "coordinates": {
      "lat": 36.8523,
      "lng": 30.7233
    }
  },
  "contact": {
    "phone": "+90 xxx",
    "email": "email@hotel.com",
    "website": "https://...",
    "fax": "+90 xxx"
  },
  "amenities": [
    "wifi", "parking", "freeParking", "valetParking",
    "pool", "indoorPool", "outdoorPool", "spa", "gym", "sauna", "hammam",
    "restaurant", "bar", "roomService", "breakfast",
    "reception24h", "concierge", "laundry", "dryCleaning", "airportShuttle",
    "businessCenter", "meetingRooms", "conferenceHall",
    "kidsClub", "playground", "babysitting",
    "beachAccess", "privateBeach", "garden", "terrace",
    "wheelchairAccessible", "elevator",
    "petFriendly", "smokingArea", "nonSmoking",
    "casino", "nightclub", "cinema", "gameRoom",
    "tennis", "golf", "diving", "surfing", "skiing"
  ],
  "roomConfig": {
    "totalRooms": 100,
    "floors": 5,
    "hasElevator": true
  },
  "policies": {
    "checkIn": "14:00",
    "checkOut": "12:00",
    "maxBabyAge": 2,
    "maxChildAge": 12,
    "childPolicy": { "tr": "...", "en": "..." },
    "petPolicy": { "tr": "...", "en": "..." }
  },
  "profile": {
    "overview": {
      "content": { "tr": "...", "en": "..." },
      "establishedYear": 2010,
      "renovationYear": 2023,
      "chainBrand": "Marka adı"
    },
    "facilities": {
      "content": { "tr": "...", "en": "..." },
      "features": ["wifi", "freeWifi", "parking", "freeParking", "reception24h", "concierge", "elevator", "airConditioning", "laundry", "garden", "terrace"]
    },
    "dining": {
      "content": { "tr": "...", "en": "..." },
      "features": ["mainRestaurant", "alacarteRestaurant", "buffetRestaurant", "snackBar", "poolBar", "beachBar", "lobbyBar", "roomService", "minibar"],
      "restaurants": [{ "name": "...", "cuisine": "...", "reservationRequired": false }]
    },
    "sportsEntertainment": {
      "content": { "tr": "...", "en": "..." },
      "features": ["fitness", "tennis", "volleyball", "waterSports", "animation", "liveMusic", "disco"]
    },
    "spaWellness": {
      "content": { "tr": "...", "en": "..." },
      "features": ["spa", "hammam", "sauna", "jacuzzi", "massage"]
    },
    "familyKids": {
      "content": { "tr": "...", "en": "..." },
      "features": ["kidsClub", "playground", "babyPool", "kidsPool", "waterSlides", "babysitting", "kidsMenu"],
      "kidsClubAges": { "min": 4, "max": 12 }
    },
    "beachPool": {
      "content": { "tr": "...", "en": "..." },
      "features": ["privateBeach", "sandyBeach", "sunbeds", "outdoorPool", "indoorPool", "kidsPool", "waterSlides"],
      "beachDetails": { "distance": 0, "type": "sand|pebble|platform|mixed", "length": 500 },
      "pools": [{ "type": "outdoor|indoor|kids", "heated": false, "dimensions": "25x12m" }]
    },
    "honeymoon": {
      "content": { "tr": "...", "en": "..." },
      "features": ["romanticRoomDecoration", "champagne", "romanticDinner", "couplesSpa"],
      "available": true
    },
    "location": {
      "content": { "tr": "...", "en": "..." },
      "distances": [
        { "place": "Havalimanı", "distance": 45, "unit": "km" },
        { "place": "Şehir merkezi", "distance": 10, "unit": "km" },
        { "place": "Plaj", "distance": 0, "unit": "m" }
      ]
    }
  },
  "images": [
    {
      "url": "https://hotel.com/full-path/image.jpg (tam URL, relative path değil)",
      "alt": "Resim açıklaması",
      "category": "exterior|lobby|room|pool|beach|restaurant|spa|garden|other"
    }
  ],
  "logo": "https://hotel.com/logo.png (otel logosu tam URL, varsa)",
  "roomTemplates": [
    {
      "code": "STD|DLX|STE|FAM|SGL|DBL|TWN|SUITE|BUNG|VILLA (kısa kod)",
      "name": { "tr": "Standart Oda", "en": "Standard Room" },
      "description": { "tr": "Oda açıklaması", "en": "Room description" },
      "images": [
        { "url": "https://hotel.com/room1-image1.jpg", "caption": { "tr": "", "en": "" } },
        { "url": "https://hotel.com/room1-image2.jpg", "caption": { "tr": "", "en": "" } },
        { "url": "https://hotel.com/room1-image3.jpg", "caption": { "tr": "", "en": "" } }
      ],
      "amenities": [
        "wifi", "airConditioning", "heating", "tv", "satelliteTV", "smartTV", "minibar", "refrigerator", "kettle", "coffeeMachine",
        "privateBathroom", "bathtub", "shower", "rainShower", "jacuzzi", "hairdryer", "toiletries", "bathrobes", "slippers",
        "seaView", "poolView", "gardenView", "cityView", "mountainView", "balcony", "terrace", "privatePool",
        "safe", "desk", "sofa", "wardrobe", "ironingEquipment", "soundproofing",
        "roomService", "dailyHousekeeping", "wheelchairAccessible", "connectedRooms", "nonSmoking", "petFriendly"
      ],
      "size": 25,
      "bedConfiguration": [
        { "type": "single|double|queen|king|twin|sofa|bunk|extra", "count": 1 }
      ],
      "occupancy": {
        "maxAdults": 2,
        "maxChildren": 2,
        "totalMaxGuests": 4
      }
    }
  ],
  "confidence": {
    "name": 95,
    "description": 80,
    "stars": 100,
    "address": 90,
    "contact": 85,
    "amenities": 75,
    "profile": 70,
    "images": 60,
    "roomTemplates": 70
  }
}

ODA ŞABLONLARI TALİMATLARI (ÖNEMLİ!):
- Otel web sitesinden TÜM oda tiplerini çıkar (en az 3-5 farklı oda tipi bul)
- Her oda tipi için: kod (STD, DLX, STE, FAM, SGL, DBL, TWN, SUITE, BUNG, VILLA vb.), isim, açıklama bul
- ÖNEMLİ: Her oda tipi için TÜM görselleri al (oda başına 5-10 görsel olabilir). Galeri, slider veya fotoğraf koleksiyonundaki tüm resimleri dahil et!
- Oda görsellerini oda tipine göre grupla (sadece o odaya ait fotoğrafları al)
- Oda olanaklarını (amenities) sadece yukarıdaki listeden seç
- Oda boyutunu (m²), yatak tipini ve kapasiteyi çıkar
- Oda tipleri genellikle "Odalar", "Rooms", "Accommodation", "Oda Tipleri" gibi sayfalarda bulunur

Sadece JSON döndür:`

  try {
    // Use Gemini's URL fetching capability as fallback with retry
    const MAX_DIRECT_RETRIES = 2

    if (progress) {
      progress.updateStep('crawl', { usingGeminiDirect: true })
    }

    for (let attempt = 0; attempt <= MAX_DIRECT_RETRIES; attempt++) {
      try {
        if (progress && attempt > 0) {
          progress.updateStep('crawl', { retry: attempt })
        }

        const response = await client.models.generateContentStream({
          model: GEMINI_MODEL,
          config: {
            temperature: 0.1,
            maxOutputTokens: 65536  // Maximum for comprehensive extraction
          },
          contents: [{
            role: 'user',
            parts: [
              {
                fileData: {
                  fileUri: url,
                  mimeType: 'text/html'
                }
              },
              { text: prompt }
            ]
          }]
        })

        // Collect all chunks
        let fullText = ''
        let chunkCount = 0
        for await (const chunk of response) {
          chunkCount++
          if (chunk.text) {
            fullText += chunk.text
          }
          // Update progress every 50 chunks
          if (progress && chunkCount % 50 === 0) {
            progress.updateStep('crawl', { chunks: chunkCount, chars: fullText.length })
          }
        }

        logger.info(`Gemini direct response - chunks: ${chunkCount}, length: ${fullText.length} chars`)

        if (progress) {
          progress.completeStep('crawl', { chunks: chunkCount, chars: fullText.length })
          progress.startStep('preprocess')
          progress.completeStep('preprocess', { method: 'gemini_direct' })
          progress.startStep('extract')
        }

        if (!fullText) {
          throw new Error('No response received from AI')
        }

        // Clean up response
        let cleanedResponse = fullText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0]
        }

        // Check for truncation
        if (isJsonTruncated(cleanedResponse)) {
          if (attempt < MAX_DIRECT_RETRIES) {
            logger.warn(`Gemini direct response truncated (attempt ${attempt + 1}), retrying...`)
            if (progress) {
              progress.updateStep('extract', { truncated: true, retry: attempt + 1 })
            }
            await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)))
            continue
          }
          // Last attempt - try to repair
          logger.warn('Max retries reached for Gemini direct, attempting to repair JSON')
          cleanedResponse = repairTruncatedJson(cleanedResponse)
        }

        const parsed = JSON.parse(cleanedResponse)
        logger.info('Hotel data extraction from URL completed (Gemini direct) - rooms: ' + (parsed.roomTemplates?.length || 0))

        if (progress) {
          progress.completeStep('extract', {
            roomTemplates: parsed.roomTemplates?.length || 0,
            images: parsed.images?.length || 0
          })
          progress.startStep('validate')
          progress.completeStep('validate', {
            valid: true,
            roomCodes: parsed.roomTemplates?.map(r => r.code) || []
          })
          progress.complete({
            success: true,
            hotelName: parsed.name,
            roomCount: parsed.roomTemplates?.length || 0,
            imageCount: parsed.images?.length || 0
          })
        }

        return {
          success: true,
          data: parsed,
          sourceUrl: url
        }
      } catch (parseError) {
        if (attempt < MAX_DIRECT_RETRIES && parseError.message?.includes('JSON')) {
          logger.warn(`JSON parse error on attempt ${attempt + 1}, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)))
          continue
        }
        throw parseError
      }
    }

    // Should not reach here, but fallback
    if (progress) {
      progress.fail('AI yanıtı parse edilemedi (tüm denemeler başarısız)')
    }
    return {
      success: false,
      error: 'AI yanıtı parse edilemedi (tüm denemeler başarısız)'
    }
  } catch (error) {
    logger.error('Hotel data extraction from URL error: ' + error.message)
    if (progress) {
      progress.fail(error.message)
    }
    throw error
  }
}

/**
 * Parse hotel pricing contract (PDF/Word/Image) using Gemini AI
 * Extracts room types, meal plans, periods, and pricing from contract documents
 * @param {Buffer|string} fileContent - File content as base64 or buffer
 * @param {string} mimeType - File MIME type (application/pdf, image/*, etc.)
 * @param {object} context - Hotel context (existing room types, meal plans, currency)
 * @returns {object} Parsed contract data with periods, rooms, meal plans, and prices
 */
export const parseHotelContract = async (fileContent, mimeType, context = {}) => {
  const client = await getAI()
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured. Please configure it in Platform Settings.')
  }

  // Convert Buffer to base64 if needed
  const base64Content = Buffer.isBuffer(fileContent)
    ? fileContent.toString('base64')
    : fileContent

  // Build context string
  const existingRoomsStr = context.roomTypes?.map(rt => `${rt.code}: ${rt.name}`).join(', ') || 'Yok'
  const existingMealPlansStr = context.mealPlans?.map(mp => `${mp.code}: ${mp.name}`).join(', ') || 'Yok'
  const currency = context.currency || 'EUR'

  const prompt = `Sen Türkiye'de bir seyahat acentesinde çalışan deneyimli bir KONTRAT ANALİSTİsin. Yıllardır otel kontratlarını okuyup sisteme giriyorsun. Türk turizm sektörünün tüm jargonlarını, kısaltmalarını ve yazılı olmayan kurallarını biliyorsun.

Görevin: Bu kontrat dökümanını analiz edip TÜM fiyatları ve koşulları JSON formatına dönüştürmek.

═══════════════════════════════════════════════════════════════
MEVCUT SİSTEM VERİLERİ
═══════════════════════════════════════════════════════════════
Oda Tipleri: ${existingRoomsStr}
Pansiyon Tipleri: ${existingMealPlansStr}
Para Birimi: ${currency}

═══════════════════════════════════════════════════════════════
!!! EN KRİTİK KURAL - TÜM PERİYOTLAR !!!
═══════════════════════════════════════════════════════════════
Kontratta fiyat tablosu genellikle şu yapıdadır:

TABLO YAPISI:
┌─────────────────┬──────────┬──────────┬──────────┬──────────┐
│ ODA TİPİ        │ Periyot1 │ Periyot2 │ Periyot3 │ Periyot4 │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Standard Room   │   100    │   120    │   150    │   180    │
│ Superior Room   │   130    │   150    │   180    │   210    │
│ Deluxe Room     │   160    │   180    │   220    │   260    │
│ Family Room     │   200    │   230    │   280    │   320    │
└─────────────────┴──────────┴──────────┴──────────┴──────────┘

YAPMAN GEREKEN:
1. Tablodaki HER SÜTUNU (her periyot) oku
2. Tablodaki HER SATIRI (her oda) oku
3. Her oda × periyot kombinasyonu için ayrı pricing kaydı oluştur

ÖRNEK: 4 oda ve 4 periyot varsa → 16 pricing kaydı olmalı
- Standard + P1, Standard + P2, Standard + P3, Standard + P4
- Superior + P1, Superior + P2, Superior + P3, Superior + P4
- vs...

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!! KRİTİK - EKSİKSİZ FİYAT ÇIKARIMI !!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

HİÇBİR FİYAT ATLAMA! HER ODA İÇİN HER PERİYODUN FİYATI OLMALI!

- Tabloda fiyat görüyorsan MUTLAKA pricing dizisine ekle
- Bir oda için bazı periyotlarda fiyat eksik olamaz
- Kontrol: pricing.length = oda sayısı × periyot sayısı × pansiyon sayısı
- Eksik fiyat varsa kontrat geçersiz sayılır!

SADECE İLK PERİYOT DEĞİL, TÜM PERİYOTLARIN FİYATLARINI ÇEK!
SADECE İLK ODA DEĞİL, TÜM ODALARIN FİYATLARINI ÇEK!

═══════════════════════════════════════════════════════════════
PERİYOT TARİHLERİ
═══════════════════════════════════════════════════════════════
Periyotların tarihleri genelde tablonun üstünde veya ayrı bir yerde yazar:
- "Dönem 1: 01.04.2025 - 31.05.2025"
- "Dönem 2: 01.06.2025 - 30.06.2025"
vs.

Her periyot için code, name, startDate, endDate çıkar.

═══════════════════════════════════════════════════════════════
ÇIKTI JSON FORMATI
═══════════════════════════════════════════════════════════════
{
  "success": true,
  "contractInfo": {
    "hotelName": "Otel adı",
    "validFrom": "2025-04-01",
    "validTo": "2025-10-31",
    "currency": "${currency}",
    "pricingType": "unit | per_person",
    "notes": "Önemli notlar"
  },
  "childTypes": [
    { "id": 1, "name": "Bebek", "minAge": 0, "maxAge": 2 },
    { "id": 2, "name": "1. Çocuk", "minAge": 3, "maxAge": 6 },
    { "id": 3, "name": "2. Çocuk", "minAge": 7, "maxAge": 12 }
  ],
  "periods": [
    { "code": "P1", "name": "1. Dönem", "startDate": "2025-04-01", "endDate": "2025-05-31" },
    { "code": "P2", "name": "2. Dönem", "startDate": "2025-06-01", "endDate": "2025-06-30" },
    { "code": "P3", "name": "3. Dönem", "startDate": "2025-07-01", "endDate": "2025-08-31" },
    { "code": "P4", "name": "4. Dönem", "startDate": "2025-09-01", "endDate": "2025-10-31" }
  ],
  "roomTypes": [
    {
      "contractName": "Kontrattaki oda adı",
      "contractCode": "STD",
      "matchedCode": "STD veya null",
      "isNewRoom": true/false,
      "suggestedCode": "3 harfli kod önerisi",
      "confidence": 95,
      "capacity": {
        "standardOccupancy": 2,
        "maxAdults": 2,
        "maxChildren": 2,
        "maxInfants": 1,
        "maxOccupancy": 4
      }
    }
  ],
  "mealPlans": [
    {
      "contractName": "Pansiyon adı",
      "contractCode": "AI",
      "matchedCode": "AI veya null",
      "isNewMealPlan": true/false,
      "suggestedCode": "Kod önerisi",
      "confidence": 90
    }
  ],
  "pricing": [
    // Ünite Bazlı (unit) örnekler - pricingType: "unit" veya belirtilmemiş
    { "periodCode": "P1", "roomCode": "STD", "mealPlanCode": "AI", "pricePerNight": 100, "extraAdult": 30, "extraChild": [20, 15], "extraInfant": 0 },
    { "periodCode": "P2", "roomCode": "STD", "mealPlanCode": "AI", "pricePerNight": 120, "extraAdult": 35, "extraChild": [25, 18], "extraInfant": 0 },
    { "periodCode": "P1", "roomCode": "VIP", "mealPlanCode": "AI", "pricePerNight": 93000, "extraAdult": 20000, "extraChild": [15000, 12000], "extraInfant": 0 },

    // Kişi Bazlı (OBP) örnek - pricingType: "per_person"
    { "periodCode": "P1", "roomCode": "DLX", "mealPlanCode": "AI", "pricingType": "per_person", "occupancyPricing": { "1": 80, "2": 100, "3": 130 }, "extraChild": [30, 25] }
  ],
  "earlyBookingDiscounts": [
    {
      "name": "EB %20",
      "discountPercentage": 20,
      "salePeriod": { "startDate": "2024-11-01", "endDate": "2024-12-31" },
      "stayPeriod": { "startDate": "2025-04-01", "endDate": "2025-10-31" },
      "paymentDueDate": "2025-01-15",
      "isCumulative": false
    }
  ],
  "warnings": [],
  "confidence": { "overall": 85, "periods": 90, "rooms": 85, "pricing": 80 }
}

═══════════════════════════════════════════════════════════════
!!! KONTROL LİSTESİ - ÇIKMADAN ÖNCE MUTLAKA DOĞRULA !!!
═══════════════════════════════════════════════════════════════

★★★ FİYAT KONTROLÜ - EN ÖNEMLİ ★★★
□ Kaç periyot var? → periods dizisinde hepsi var mı?
□ Kaç oda tipi var? → roomTypes dizisinde hepsi var mı?
□ pricing dizisi = periyot sayısı × oda sayısı × pansiyon sayısı mı?
□ HER ODA İÇİN HER PERİYODUN FİYATI VAR MI? → EKSİK OLAMAZ!
□ Tabloda gördüğün her fiyatı pricing dizisine ekledin mi?
□ Her periyotta minStay değeri var mı?

!!! EKSİK FİYAT = GEÇERSİZ KONTRAT !!!
Eğer tabloda 13 oda ve 10 periyot varsa → 130 fiyat kaydı olmalı!
Eksik varsa tekrar kontrol et ve ekle!

□ EB indirimi var mı? → earlyBookingDiscounts dizisine ekle!
  - salePeriod.startDate ve endDate (satış dönemi)
  - stayPeriod.startDate ve endDate (konaklama dönemi)

□ Her oda için KAPASİTE bilgisi doğru mu?
  - STANDART DOLULUK: Fiyatın kaç kişi için olduğu → standardOccupancy
    Örnek: "Ünite Fiyatı (8 Kişi)" → standardOccupancy = 8
  - MAKSİMUM YETİŞKİN: Ekstra kişi varsa kaç kişi sığar → maxAdults
    Örnek: "9. Kişi: 20.000 TL" varsa → maxAdults = 9
  - MAKSİMUM KAPASİTE: Toplam kapasite → maxOccupancy
  - roomTypes[].capacity objesine ekle

□ Ekstra kişi fiyatları var mı?
  - "X. Kişi: Y TL" → extraAdult = Y, maxAdults = X, maxOccupancy = X
  - Çocuk fiyatlarını extraChild dizisine ekle [1.çocuk, 2.çocuk]
  - pricing[] kaydına extraAdult, extraChild, extraInfant ekle

ÖRNEK HESAPLAMA:
- 5 periyot × 8 oda × 1 pansiyon = 40 pricing kaydı olmalı
- 4 periyot × 6 oda × 2 pansiyon = 48 pricing kaydı olmalı
- 10 periyot × 13 oda × 1 pansiyon = 130 pricing kaydı olmalı

═══════════════════════════════════════════════════════════════
EŞLEŞTİRME KURALLARI
═══════════════════════════════════════════════════════════════

PANSİYON:
- "All Inclusive", "Her Şey Dahil", "AI" → AI
- "Ultra All Inclusive", "UAI" → UAI
- "Full Board", "Tam Pansiyon", "FB" → FB
- "Half Board", "Yarım Pansiyon", "HB" → HB
- "Bed & Breakfast", "Oda Kahvaltı", "BB" → BB
- "Room Only", "Sadece Oda", "RO" → RO

ODA TİPLERİ EŞLEŞTİRME (ÇOK ÖNEMLİ):
Mevcut oda tiplerini (${existingRoomsStr}) kontrat oda isimleriyle eşleştir.

EŞLEŞTİRME MANTIĞI:
1. KOD BAZLI: Kontrat kodu = Mevcut kod → DOĞRUDAN EŞLEŞTİR
   - "STD" → STD, "DLX" → DLX, "SNG" → SNG

2. İSİM BAZLI EŞLEŞTIRME (fuzzy):
   - "Standard Room", "Standart Oda", "Standard" → STD (varsa)
   - "Deluxe Room", "Delüks Oda" → DLX (varsa)
   - "Single Room", "Tek Kişilik" → SNG (varsa)
   - "Double Room", "Çift Kişilik" → DBL (varsa)
   - "Twin Room" → TWN (varsa)
   - "Superior Room" → SUP (varsa)
   - "Suite", "Suit" → SUI veya STE (varsa)
   - "Family Room", "Aile Odası" → FAM veya FML (varsa)
   - "Triple Room", "Üç Kişilik" → TRP (varsa)
   - "Junior Suite" → JSU (varsa)
   - "Economy", "Ekonomi" → ECO (varsa)

3. ANAHTAR KELİME ARAMASI:
   - İsimde "Standard" varsa STD kodlu odayı ara
   - İsimde "Deluxe" varsa DLX kodlu odayı ara
   - İsimde "Suite" varsa SUI veya STE kodlu odayı ara
   - İsimde "Family" varsa FAM kodlu odayı ara

4. MEVCUT İSİM KARŞILAŞTIRMASI:
   - Mevcut oda isimlerinin içinde kontrat ismini ara
   - Örnek: Mevcut "Standard Oda" → Kontrat "Standard Room" = EŞLEŞ

5. HİÇ EŞLEŞME YOKSA:
   - isNewRoom: true
   - suggestedCode: 3 harfli kod öner (örn: "Deluxe Sea View" → "DSV")
   - matchedCode: null

!!! ÖNEMLİ !!!
- matchedCode SADECE mevcut oda kodlarından biri olabilir: ${existingRoomsStr}
- Eğer mevcut listede eşleşen yoksa matchedCode = null, isNewRoom = true
- Eşleşme bulunursa matchedCode = o oda kodu, isNewRoom = false

ÇOCUK YAŞLARI:
- "0-2.99" → minAge:0, maxAge:2
- "3-6.99" → minAge:3, maxAge:6
- "7-12.99" → minAge:7, maxAge:12

═══════════════════════════════════════════════════════════════
MİNİMUM KONAKLAMA ŞARTLARI
═══════════════════════════════════════════════════════════════

Kontratda minimum gece şartları farklı şekillerde belirtilebilir:

ÖRNEK 1 - TARİH ARALIĞI BAZLI:
"01.04 - 08.04.2025 ve 07.10 - 31.10.2025 konaklamalarda minimum 3 gece konaklama şartı bulunmaktadır. Diğer tarih aralıkları için minimum 4 gece konaklama şartı bulunmaktadır."

BU METNİN YORUMU:
- P1 periyodu (01.04-08.04) → minStay: 3
- Son periyot (07.10-31.10) → minStay: 3
- Diğer periyotlar → minStay: 4

ÖRNEK 2 - GENEL:
"Tüm sezon için minimum 5 gece konaklama zorunludur"
→ Tüm periyotlar için minStay: 5

ÖRNEK 3 - PERİYOT BAZLI:
Tabloda her periyot için ayrı minStay sütunu varsa, o değerleri kullan.

HER PERİYOT İÇİN minStay BELİRLE!
periods dizisinde her periyoda mutlaka minStay ekle.

═══════════════════════════════════════════════════════════════
FİYATLANDIRMA TİPİ
═══════════════════════════════════════════════════════════════
- "Ünite Bazlı" / "Unit Based" / "Per Room" → pricingType: "unit"
- "Kişi Bazlı" / "Per Person" / "OBP" → pricingType: "per_person"

═══════════════════════════════════════════════════════════════
!!! KİŞİ BAZLI FİYATLANDIRMA (OBP) - ÇOK ÖNEMLİ !!!
═══════════════════════════════════════════════════════════════

Kişi bazlı (OBP - Occupancy Based Pricing) kontratlarda her yetişkin sayısı için ayrı fiyat belirlenir.

ÖRNEK OBP KONTRAT:
"Standard Oda
1 Kişi: 80 €
2 Kişi: 100 €
3 Kişi: 130 €"

BU METNİN YORUMU:
- pricingType: "per_person"
- occupancyPricing: { "1": 80, "2": 100, "3": 130 }
- pricePerNight: KULLANILMAZ (0 veya null)
- extraAdult: KULLANILMAZ (0)
- singleSupplement: KULLANILMAZ (0)

OBP'DE ÇOCUK FİYATLARI:
- Çocuklar yetişkin sayısına DAHİL DEĞİL
- Çocuk fiyatları ayrıca belirtilir (extraChild array)
- Örnek: "1. Çocuk: 30 €, 2. Çocuk: 25 €" → extraChild: [30, 25]

ÜNİTE BAZLI vs KİŞİ BAZLI AYIRT ETME:
1. "X Kişi: Y TL" formatında fiyatlar varsa → per_person
2. "1 Kişi", "2 Kişi", "3 Kişi" şeklinde ayrı fiyatlar → per_person
3. "Ünite Fiyatı", "Oda Fiyatı", tek bir fiyat → unit
4. "Ekstra Yatak/Kişi" varsa → unit

pricing dizisinde OBP için:
{
  "periodCode": "P1",
  "roomCode": "STD",
  "mealPlanCode": "AI",
  "pricingType": "per_person",
  "occupancyPricing": {
    "1": 80,
    "2": 100,
    "3": 130
  },
  "extraChild": [30, 25]
}

═══════════════════════════════════════════════════════════════
!!! ODA KAPASİTESİ VE EKSTRA KİŞİ - ÇOK ÖNEMLİ !!!
═══════════════════════════════════════════════════════════════

Türk turizm kontratlarında kapasite ve ekstra kişi fiyatlandırması şu şekillerde ifade edilir:

ÖRNEK 1 - VİLLA/BÜYÜK ODALAR:
"VIP Villa
Ünite Fiyatı (8 Kişi): 93.000 TL
9. Kişi: 20.000 TL"

BU METNİN YORUMU:
- standardOccupancy: 8 (Standart doluluk - fiyata DAHİL kişi sayısı)
- maxAdults: 9 (9. kişi fiyatı VAR = odaya 9 yetişkin SIĞABİLİYOR!)
- maxOccupancy: 9 (maksimum toplam kapasite)
- pricePerNight: 93000 (8 kişi dahil ünite fiyatı)
- extraAdult: 20000 (9. kişi için ekstra ücret)

!!! ÇOK ÖNEMLİ MANTIK !!!
- "X Kişi" fiyatı = standart doluluk = standardOccupancy = X
- "X+1. Kişi" fiyatı VARSA = odaya X+1 kişi sığar = maxAdults = X+1, maxOccupancy = X+1
- "X+1. Kişi" fiyatı YOKSA = maxAdults = X, maxOccupancy = X

ÖRNEK 2 - STANDART ODALAR:
"Standard Oda (2+1)
2 Yetişkin: 5.000 TL
3. Kişi (Ekstra Yatak): 1.500 TL"

BU METNİN YORUMU:
- standardOccupancy: 2 (fiyata dahil kişi sayısı)
- maxAdults: 3 (3. kişi kabul ediliyor = 3 yetişkin sığar)
- maxOccupancy: 3
- pricePerNight: 5000
- extraAdult: 1500

ÖRNEK 3 - PARANTEZ İÇİ KAPASİTE:
"Aile Odası (2+2)" → standardOccupancy: 2, maxAdults: 2, maxChildren: 2, maxOccupancy: 4
"Suite (4 Kişi)" ve "5. Kişi: X TL" varsa → standardOccupancy: 4, maxAdults: 5, maxOccupancy: 5
"Villa (6+2)" → standardOccupancy: 6, maxAdults: 6, maxChildren: 2, maxOccupancy: 8

KAPASİTE HESAPLAMA KURALLARI:
1. "Ünite Fiyatı (X Kişi)" → standardOccupancy = X (fiyata dahil kişi sayısı)
2. "X+1. Kişi: Y TL" veya "Ekstra Kişi: Y TL" varsa → maxAdults = X+1, maxOccupancy = X+1
3. Ekstra kişi fiyatı YOKSA → maxAdults = standardOccupancy
4. "X+Y" formatı → maxAdults = X, maxChildren = Y, maxOccupancy = X+Y

ÇOCUK FİYATLARI:
- "0-2 yaş FREE/Ücretsiz" → maxInfants: 1 veya 2
- "1. Çocuk: X TL" → İlk çocuk fiyatı
- "2. Çocuk: Y TL" → İkinci çocuk fiyatı

pricing dizisine şunları ekle:
{
  "periodCode": "P1",
  "roomCode": "VIP",
  "mealPlanCode": "AI",
  "pricePerNight": 93000,
  "extraAdult": 20000,
  "extraChild": [15000, 12000],  // 1. ve 2. çocuk fiyatları
  "extraInfant": 0
}

roomTypes dizisinde kapasite:
{
  "contractName": "VIP Villa",
  "contractCode": "VIP",
  "capacity": {
    "standardOccupancy": 8,
    "maxAdults": 9,
    "maxChildren": 2,
    "maxInfants": 2,
    "maxOccupancy": 9
  }
}

NOT: minAdults KULLANMA! standardOccupancy kullan.

═══════════════════════════════════════════════════════════════
!!! ERKEN REZERVASYON (EB) İNDİRİMLERİ - ÇOK ÖNEMLİ !!!
═══════════════════════════════════════════════════════════════

EB metinlerini DİKKATLİCE yorumla. Türkiye turizm sektöründe EB şu şekilde ifade edilir:

ÖRNEK METİN:
"31.12.2024 tarihine kadar gönderilen tüm rezervasyonlar için %20 erken rezervasyon indirimi uygulanacaktır."

BU METNİN YORUMU:
- SATIŞ DÖNEMİ (salePeriod): Bugünden 31.12.2024'e kadar
  - startDate: Kontratın geçerlilik başlangıcı veya bugün (hangisi önceyse)
  - endDate: 31.12.2024
- KONAKLAMA DÖNEMİ (stayPeriod): Tüm sezon
  - startDate: Sezonun başlangıç tarihi (ilk periyodun başlangıcı)
  - endDate: Sezonun bitiş tarihi (son periyodun bitişi)
- discountPercentage: 20

GENEL KURALLAR:
1. "X tarihine kadar gönderilen/yapılan rezervasyonlar" → Satış bitiş tarihi X
2. Satış başlangıç tarihi belirtilmemişse → Kontrat başlangıcı veya bugün
3. Konaklama dönemi belirtilmemişse → Tüm sezon (validFrom - validTo)
4. "Tüm sezon için geçerlidir" → stayPeriod = sezon tarihleri
5. Birden fazla EB varsa hepsini ayrı ayrı çıkar (%15, %20, %25 gibi)

DİĞER EB TERİMLERİ:
- "Erken Rezervasyon", "Early Bird", "EB", "E.B"
- "Ön Rezervasyon İndirimi"
- "Advance Booking Discount"

EB JSON FORMATI:
{
  "earlyBookingDiscounts": [
    {
      "name": "EB %20",
      "discountPercentage": 20,
      "salePeriod": {
        "startDate": "2024-01-01",
        "endDate": "2024-12-31"
      },
      "stayPeriod": {
        "startDate": "2025-04-01",
        "endDate": "2025-10-31"
      },
      "paymentDueDate": "2025-01-15",
      "isCumulative": false,
      "notes": "Ödeme 15.01.2025'e kadar yapılmalı"
    }
  ]
}

═══════════════════════════════════════════════════════════════
SADECE GEÇERLİ JSON DÖNDÜR - AÇIKLAMA YAZMA!
═══════════════════════════════════════════════════════════════`

  try {
    logger.info(`Parsing hotel contract - mimeType: ${mimeType}, contentSize: ${base64Content.length} chars`)

    const response = await client.models.generateContentStream({
      model: GEMINI_MODEL,
      config: {
        temperature: 0.1,
        maxOutputTokens: 65536
      },
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Content
            }
          },
          { text: prompt }
        ]
      }]
    })

    // Collect all chunks
    let fullText = ''
    let chunkCount = 0
    for await (const chunk of response) {
      chunkCount++
      if (chunk.text) {
        fullText += chunk.text
      }
    }

    logger.info(`Contract parsing response - chunks: ${chunkCount}, length: ${fullText.length} chars`)

    if (!fullText) {
      throw new Error('No response received from AI')
    }

    // Clean up response
    let cleanedResponse = fullText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    // Check for truncation and repair if needed
    if (isJsonTruncated(cleanedResponse)) {
      logger.warn('Contract parsing response appears truncated, attempting repair')
      cleanedResponse = repairTruncatedJson(cleanedResponse)
    }

    const parsed = JSON.parse(cleanedResponse)

    // Calculate expected vs actual prices
    const periodCount = parsed.periods?.length || 0
    const roomCount = parsed.roomTypes?.length || 0
    const mealPlanCount = parsed.mealPlans?.length || 0
    const actualPrices = parsed.pricing?.length || 0
    const expectedPrices = periodCount * roomCount * mealPlanCount

    logger.info(`Contract parsing completed:`)
    logger.info(`  - Periods: ${periodCount}`)
    logger.info(`  - Room types: ${roomCount}`)
    logger.info(`  - Meal plans: ${mealPlanCount}`)
    logger.info(`  - Prices: ${actualPrices} (expected: ${expectedPrices})`)

    if (actualPrices < expectedPrices) {
      const missing = expectedPrices - actualPrices
      logger.warn(`  - MISSING ${missing} price entries (${Math.round(missing/expectedPrices*100)}% incomplete)`)
      if (!parsed.warnings) parsed.warnings = []
      parsed.warnings.push(`${missing} fiyat kaydı eksik olabilir (beklenen: ${expectedPrices}, bulunan: ${actualPrices})`)
    }

    return {
      success: true,
      data: parsed
    }
  } catch (error) {
    logger.error('Contract parsing error: ' + error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

export default {
  translateText,
  translateFields,
  batchTranslate,
  parsePricingCommand,
  extractHotelData,
  extractHotelDataFromUrl,
  parseHotelContract,
  languageNames
}
