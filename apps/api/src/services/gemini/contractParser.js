import logger from '../../core/logger.js'
import { getAI, GEMINI_MODEL } from './client.js'
import { cleanAndParseJson, validatePricingCompleteness } from './helpers.js'

// Max parallel room pricing extractions (Gemini rate limit friendly)
const PARALLEL_ROOMS = 3

/**
 * Helper: Call Gemini with file + text prompt, return raw text
 */
const callGeminiWithFile = async (
  client,
  base64Content,
  mimeType,
  prompt,
  maxOutputTokens = 16384
) => {
  const response = await client.models.generateContentStream({
    model: GEMINI_MODEL,
    config: {
      temperature: 0.1,
      maxOutputTokens
    },
    contents: [
      {
        role: 'user',
        parts: [{ inlineData: { mimeType, data: base64Content } }, { text: prompt }]
      }
    ]
  })

  let fullText = ''
  let chunkCount = 0
  for await (const chunk of response) {
    chunkCount++
    if (chunk.text) fullText += chunk.text
  }

  logger.info(`Gemini response - chunks: ${chunkCount}, length: ${fullText.length} chars`)
  return fullText
}

/**
 * PASS 1: Extract contract structure (no pricing)
 * Returns: contractInfo, periods, roomTypes, mealPlans, childTypes, earlyBookingDiscounts, pricingType
 */
const extractContractStructure = async (client, base64Content, mimeType, context) => {
  const existingRoomsStr =
    context.roomTypes?.map(rt => `${rt.code}: ${rt.name}`).join(', ') || 'Yok'
  const existingMealPlansStr =
    context.mealPlans?.map(mp => `${mp.code}: ${mp.name}`).join(', ') || 'Yok'
  const currency = context.currency || 'EUR'

  const prompt = `Sen Türkiye'de deneyimli bir KONTRAT ANALISTISIN. Bu kontrat dökümanini analiz et.

!!! ÖNEMLİ: FIYAT CIKARMA! Sadece YAPISAL bilgileri çıkar. Fiyatlar ayrı adımda işlenecek. !!!

MEVCUT SISTEM VERILERI:
- Oda Tipleri: ${existingRoomsStr}
- Pansiyon Tipleri: ${existingMealPlansStr}
- Para Birimi: ${currency}

GÖREV: Aşağıdaki bilgileri JSON olarak çıkar:

1. contractInfo: Otel adı, geçerlilik tarihleri, para birimi, notlar
2. pricingType: Fiyatlandırma tipini belirle:
   - "unit" → Ünite/oda bazlı fiyat (tek fiyat + ekstra kişi)
   - "per_person" → Kişi bazlı (OBP) - her yetişkin sayısı için ayrı fiyat
   - "per_person_multiplier" → Çarpanlı OBP - baz fiyat + çarpan tablosu (ör: 1 kişi: x0.8, 2 kişi: x1.0, 3 kişi: x1.3)
3. periods: Tüm dönemler (code, name, startDate, endDate, minStay)
4. roomTypes: Tüm oda tipleri (kapasite dahil)
5. mealPlans: Pansiyon tipleri
6. childTypes: Çocuk yaş grupları
7. earlyBookingDiscounts: EB indirimleri

ÇARPANLI OBP TESPİT:
- Bir "baz fiyat" + çarpan tablosu varsa → per_person_multiplier
- Ör: "Baz: 100€, 1 kişi: %80, 2 kişi: %100, 3 kişi: %130"
- Ör: "SGL: 0.8, DBL: 1.0, TRP: 1.3" gibi çarpan satırları

PERIYOT TARİHLERİ:
- Her periyot için code (P1, P2...), name, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
- minStay belirtilmişse ekle

ODA TİPLERİ EŞLEŞTİRME:
Mevcut odalarla (${existingRoomsStr}) eşleştir:
- Kod bazlı: "STD" → STD, "DLX" → DLX
- İsim bazlı: "Standard Room" → STD, "Deluxe" → DLX
- Eşleşme yoksa: isNewRoom: true, suggestedCode ile 3 harfli kod öner
- matchedCode SADECE mevcut listeden olabilir!

ODA KAPASİTESİ:
- "Ünite Fiyatı (X Kişi)" → standardOccupancy: X
- "X+1. Kişi: Y TL" varsa → maxAdults: X+1
- "(2+2)" → maxAdults: 2, maxChildren: 2, maxOccupancy: 4

PANSİYON EŞLEŞTİRME:
- "All Inclusive" / "Her Şey Dahil" / "AI" → AI
- "Ultra All Inclusive" / "UAI" → UAI
- "Full Board" / "Tam Pansiyon" → FB
- "Half Board" / "Yarım Pansiyon" → HB
- "Bed & Breakfast" / "Oda Kahvaltı" → BB
- "Room Only" / "Sadece Oda" → RO

EB İNDİRİMLERİ:
- salePeriod: Satış dönemi (startDate, endDate)
- stayPeriod: Konaklama dönemi
- discountPercentage, paymentDueDate, isCumulative

JSON FORMATI:
{
  "contractInfo": {
    "hotelName": "...",
    "validFrom": "YYYY-MM-DD",
    "validTo": "YYYY-MM-DD",
    "currency": "${currency}",
    "pricingType": "unit | per_person | per_person_multiplier",
    "notes": "..."
  },
  "periods": [
    { "code": "P1", "name": "...", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "minStay": 1 }
  ],
  "roomTypes": [
    {
      "contractName": "...",
      "contractCode": "...",
      "matchedCode": "... veya null",
      "isNewRoom": true/false,
      "suggestedCode": "...",
      "confidence": 85,
      "capacity": {
        "standardOccupancy": 2,
        "maxAdults": 3,
        "maxChildren": 2,
        "maxInfants": 1,
        "maxOccupancy": 5
      }
    }
  ],
  "mealPlans": [
    {
      "contractName": "...",
      "contractCode": "...",
      "matchedCode": "... veya null",
      "isNewMealPlan": true/false,
      "suggestedCode": "...",
      "confidence": 90
    }
  ],
  "childTypes": [
    { "id": 1, "name": "Bebek", "minAge": 0, "maxAge": 2 }
  ],
  "earlyBookingDiscounts": [
    {
      "name": "EB %20",
      "discountPercentage": 20,
      "salePeriod": { "startDate": "...", "endDate": "..." },
      "stayPeriod": { "startDate": "...", "endDate": "..." },
      "paymentDueDate": "...",
      "isCumulative": false
    }
  ]
}

SADECE GEÇERLİ JSON DÖNDÜR - AÇIKLAMA YAZMA!`

  logger.info('Pass 1: Extracting contract structure...')
  const text = await callGeminiWithFile(client, base64Content, mimeType, prompt, 16384)
  const structure = cleanAndParseJson(text)

  logger.info(
    `Pass 1 complete - periods: ${structure.periods?.length}, rooms: ${structure.roomTypes?.length}, meals: ${structure.mealPlans?.length}, pricingType: ${structure.contractInfo?.pricingType}`
  )
  return structure
}

/**
 * PASS 2: Extract pricing for a single room type
 * Returns: array of pricing entries for this room
 */
const extractRoomPricing = async (client, base64Content, mimeType, structure, room) => {
  const pricingType = structure.contractInfo?.pricingType || 'unit'
  const roomCode = room.contractCode || room.suggestedCode || room.contractName
  const roomName = room.contractName

  // Build period reference
  const periodsRef = structure.periods
    .map(p => `${p.code}: ${p.name} (${p.startDate} → ${p.endDate})`)
    .join('\n')

  // Build meal plan reference
  const mealsRef = (structure.mealPlans || [])
    .map(m => m.contractCode || m.suggestedCode || m.contractName)
    .join(', ')

  const mealCount = structure.mealPlans?.length || 1
  const periodCount = structure.periods?.length || 1
  const expectedCount = periodCount * mealCount

  let pricingInstructions = ''
  if (pricingType === 'unit') {
    pricingInstructions = `FIYATLANDIRMA TİPİ: ÜNITE BAZLI (unit)
Her kayıt için:
- pricePerNight: Oda/ünite fiyatı
- extraAdult: Ekstra yetişkin fiyatı (varsa, yoksa 0)
- extraChild: Çocuk fiyatları dizisi [1.çocuk, 2.çocuk] (varsa)
- extraInfant: Bebek fiyatı (varsa, yoksa 0)`
  } else if (pricingType === 'per_person') {
    pricingInstructions = `FIYATLANDIRMA TİPİ: KİŞİ BAZLI (OBP - per_person)
Her kayıt için:
- pricingType: "per_person"
- occupancyPricing: { "1": fiyat, "2": fiyat, "3": fiyat, ... } (her yetişkin sayısı için)
- extraChild: Çocuk fiyatları dizisi [1.çocuk, 2.çocuk] (varsa)
- pricePerNight KULLANMA (0 veya null)`
  } else if (pricingType === 'per_person_multiplier') {
    pricingInstructions = `FIYATLANDIRMA TİPİ: ÇARPANLI KİŞİ BAZLI (per_person_multiplier)
Her kayıt için:
- pricingType: "per_person_multiplier"
- pricePerNight: BAZ fiyat (çarpanların uygulanacağı temel fiyat)
- extraChild: Çocuk fiyatları dizisi (varsa)
- extraInfant: Bebek fiyatı (varsa, yoksa 0)
NOT: Çarpan tablosu ayrı çıkarılacak, burada sadece baz fiyatları ver.`
  }

  const prompt = `Bu kontrat dökümanından "${roomName}" (${roomCode}) odasının FİYATLARINI çıkar.

DÖNEMLER:
${periodsRef}

PANSİYONLAR: ${mealsRef}

${pricingInstructions}

Her dönem × pansiyon kombinasyonu için bir kayıt oluştur.
TOPLAM ${expectedCount} kayıt bekleniyor (${periodCount} dönem × ${mealCount} pansiyon).

HİÇBİR FİYAT ATLAMA! Tablodaki TÜM dönemlerin fiyatlarını çıkar!

JSON FORMATI:
{
  "roomCode": "${roomCode}",
  "pricing": [
    { "periodCode": "P1", "roomCode": "${roomCode}", "mealPlanCode": "...", ... }
  ]
}

SADECE GEÇERLİ JSON DÖNDÜR!`

  const text = await callGeminiWithFile(client, base64Content, mimeType, prompt, 8192)
  const result = cleanAndParseJson(text)

  const pricing = result.pricing || []
  logger.info(`Pass 2 [${roomCode}]: Found ${pricing.length}/${expectedCount} price entries`)
  return pricing
}

/**
 * PASS 3: Extract multiplier table (only for per_person_multiplier)
 * Returns: { adultMultipliers, childMultipliers, roundingRule }
 */
const extractMultiplierTable = async (client, base64Content, mimeType, _structure) => {
  const prompt = `Bu kontrat dökümanındaki ÇARPAN TABLOSUNU çıkar.

Bu kontrat "Çarpanlı Kişi Bazlı" (OBP with multipliers) fiyatlandırma kullanıyor.
Bir BAZ FİYAT var ve her kişi sayısı için çarpan uygulanıyor.

ÇIKARILACAK BİLGİLER:
1. adultMultipliers: Her yetişkin sayısı için çarpan değeri
   - "1": tek kişi çarpanı (genelde 0.7-0.9)
   - "2": çift kişi çarpanı (genelde 1.0 - baz)
   - "3": üç kişi çarpanı (genelde 1.2-1.5)
   - vs.

2. childMultipliers: Çocuk yaş grupları için çarpanlar (sıra bazlı)
   - Her çocuk sırası (1, 2, 3...) için yaş grubuna göre çarpan
   - Yaş grupları: "infant" (0-2), "first" (3-6), "second" (7-12)

3. roundingRule: Yuvarlama kuralı
   - "none": Yuvarlama yok
   - "nearest": En yakına yuvarla
   - "up": Yukarı yuvarla
   - "down": Aşağı yuvarla

ÖRNEKLER:
- "%80" veya "0.80" → 0.8
- "%100" veya "1.00" → 1.0
- "%130" veya "1.30" → 1.3
- "FREE" veya "Ücretsiz" → 0

JSON FORMATI:
{
  "adultMultipliers": { "1": 0.8, "2": 1.0, "3": 1.3 },
  "childMultipliers": {
    "1": { "infant": 0, "first": 0.3, "second": 0.5 },
    "2": { "infant": 0, "first": 0.3, "second": 0.5 }
  },
  "roundingRule": "none"
}

SADECE GEÇERLİ JSON DÖNDÜR!`

  logger.info('Pass 3: Extracting multiplier table...')
  const text = await callGeminiWithFile(client, base64Content, mimeType, prompt, 4096)
  const result = cleanAndParseJson(text)

  logger.info(
    `Pass 3 complete - adultMultipliers: ${Object.keys(result.adultMultipliers || {}).length} entries`
  )
  return result
}

/**
 * Process rooms in parallel batches
 */
const extractAllRoomPricing = async (client, base64Content, mimeType, structure) => {
  const rooms = structure.roomTypes || []
  const allPricing = []

  for (let i = 0; i < rooms.length; i += PARALLEL_ROOMS) {
    const batch = rooms.slice(i, i + PARALLEL_ROOMS)
    logger.info(
      `Processing room batch ${Math.floor(i / PARALLEL_ROOMS) + 1}/${Math.ceil(rooms.length / PARALLEL_ROOMS)}: ${batch.map(r => r.contractCode || r.contractName).join(', ')}`
    )

    const results = await Promise.all(
      batch.map(room => extractRoomPricing(client, base64Content, mimeType, structure, room))
    )

    for (const pricing of results) {
      allPricing.push(...pricing)
    }
  }

  return allPricing
}

/**
 * Retry extraction for missing room/period combinations
 */
const retryMissingPricing = async (client, base64Content, mimeType, structure, missingEntries) => {
  // Group missing entries by room
  const missingByRoom = {}
  for (const entry of missingEntries) {
    if (!missingByRoom[entry.roomCode]) missingByRoom[entry.roomCode] = []
    missingByRoom[entry.roomCode].push(entry)
  }

  const retryPricing = []
  const roomCodes = Object.keys(missingByRoom)

  for (let i = 0; i < roomCodes.length; i += PARALLEL_ROOMS) {
    const batch = roomCodes.slice(i, i + PARALLEL_ROOMS)

    const results = await Promise.all(
      batch.map(roomCode => {
        const room = structure.roomTypes.find(
          r => (r.contractCode || r.suggestedCode || r.contractName) === roomCode
        )
        if (!room) return Promise.resolve([])
        return extractRoomPricing(client, base64Content, mimeType, structure, room)
      })
    )

    for (const pricing of results) {
      retryPricing.push(...pricing)
    }
  }

  return retryPricing
}

/**
 * Parse hotel pricing contract (PDF/Word/Image) using Gemini AI
 * Multi-pass approach:
 *   Pass 1: Structure extraction (no prices)
 *   Pass 2: Per-room pricing extraction (parallel)
 *   Pass 3: Multiplier table (if per_person_multiplier)
 *   Validation + targeted retry for missing entries
 *
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

  const base64Content = Buffer.isBuffer(fileContent) ? fileContent.toString('base64') : fileContent

  try {
    logger.info(
      `Parsing hotel contract (multi-pass) - mimeType: ${mimeType}, contentSize: ${base64Content.length} chars`
    )

    // === PASS 1: Structure Extraction ===
    const structure = await extractContractStructure(client, base64Content, mimeType, context)

    // === PASS 2: Per-Room Pricing Extraction ===
    const pricing = await extractAllRoomPricing(client, base64Content, mimeType, structure)

    // === PASS 3: Multiplier Table (if needed) ===
    let multiplierData = null
    const pricingType = structure.contractInfo?.pricingType
    if (pricingType === 'per_person_multiplier') {
      multiplierData = await extractMultiplierTable(client, base64Content, mimeType, structure)
    }

    // === VALIDATION ===
    let validation = validatePricingCompleteness(structure, pricing)
    logger.info(
      `Validation: ${validation.completeness}% complete (${validation.totalFound}/${validation.totalExpected})`
    )

    // === RETRY for missing entries ===
    let finalPricing = pricing
    if (
      validation.completeness < 100 &&
      validation.missingEntries.length > 0 &&
      validation.missingEntries.length <= 30
    ) {
      logger.info(`Retrying ${validation.missingEntries.length} missing price entries...`)
      const retryPricing = await retryMissingPricing(
        client,
        base64Content,
        mimeType,
        structure,
        validation.missingEntries
      )

      if (retryPricing.length > 0) {
        // Merge: add only truly new entries
        const existingKeys = new Set(
          pricing.map(p => `${p.periodCode}|${p.roomCode}|${p.mealPlanCode}`)
        )
        const newEntries = retryPricing.filter(
          p => !existingKeys.has(`${p.periodCode}|${p.roomCode}|${p.mealPlanCode}`)
        )
        finalPricing = [...pricing, ...newEntries]

        // Re-validate
        validation = validatePricingCompleteness(structure, finalPricing)
        logger.info(
          `After retry: ${validation.completeness}% complete (${validation.totalFound}/${validation.totalExpected}), recovered ${newEntries.length} entries`
        )
      }
    }

    // === BUILD RESULT ===
    const result = {
      ...structure,
      pricing: finalPricing,
      ...(multiplierData && { multiplierData }),
      validation: {
        completeness: validation.completeness,
        totalExpected: validation.totalExpected,
        totalFound: validation.totalFound,
        missingCount: validation.missingEntries.length
      },
      warnings: structure.warnings || [],
      confidence: structure.confidence || { overall: 75, periods: 80, rooms: 80, pricing: 70 }
    }

    // Add completeness warning if not 100%
    if (validation.completeness < 100) {
      result.warnings.push(
        `${validation.missingEntries.length} fiyat kaydı eksik olabilir (beklenen: ${validation.totalExpected}, bulunan: ${validation.totalFound}, tamamlanma: %${validation.completeness})`
      )
    }

    // Adjust confidence based on completeness
    if (result.confidence && validation.completeness < 100) {
      result.confidence.pricing = validation.completeness
      result.confidence.overall = Math.round(
        (result.confidence.periods + result.confidence.rooms + validation.completeness) / 3
      )
    }

    const periodCount = structure.periods?.length || 0
    const roomCount = structure.roomTypes?.length || 0
    const mealPlanCount = structure.mealPlans?.length || 0

    logger.info('Contract parsing completed (multi-pass):')
    logger.info(`  - Periods: ${periodCount}`)
    logger.info(`  - Room types: ${roomCount}`)
    logger.info(`  - Meal plans: ${mealPlanCount}`)
    logger.info(`  - Prices: ${finalPricing.length} (expected: ${validation.totalExpected})`)
    logger.info(`  - Completeness: ${validation.completeness}%`)
    logger.info(`  - Pricing type: ${pricingType}`)
    if (multiplierData) logger.info('  - Multiplier table: extracted')

    return { success: true, data: result }
  } catch (error) {
    logger.error('Contract parsing error: ' + error.message)
    return { success: false, error: error.message }
  }
}
