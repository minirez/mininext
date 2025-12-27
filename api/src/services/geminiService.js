import { GoogleGenAI } from '@google/genai'
import logger from '../core/logger.js'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-3-flash-preview'

// Initialize the AI client
let ai = null
const getAI = () => {
  if (!ai && GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
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
  const client = getAI()
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured')
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

export default {
  translateText,
  translateFields,
  batchTranslate,
  parsePricingCommand,
  languageNames
}
