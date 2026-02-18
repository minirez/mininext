import logger from '../../core/logger.js'
import { getAI, GEMINI_MODEL } from './client.js'
import { cleanAndParseJson, validatePricingCompleteness } from './helpers.js'

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
      maxOutputTokens,
      // Minimal thinking for data extraction tasks - reduces latency significantly
      thinkingConfig: { thinkingLevel: 'minimal' }
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
- minStay: Minimum konaklama süresi (gece). Her periyotta farklı olabilir! Belirtilmemişse 1.
- releaseDay: Release/stop sales gün sayısı. Her periyotta farklı olabilir! Belirtilmemişse 0.
- ÖNEMLİ: Kontratın "minimum gece" veya "min. stay" veya "min konaklama" sütununu her periyot için ayrı oku!
- ÖNEMLİ: Kontratın "release" veya "stop sale" veya "kapanış" sütununu her periyot için ayrı oku!

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
    { "code": "P1", "name": "...", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "minStay": 3, "releaseDay": 2 }
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

  // Normalize keys - AI sometimes uses different key names
  if (!structure.roomTypes && structure.rooms) {
    structure.roomTypes = structure.rooms
    delete structure.rooms
  }
  if (!structure.mealPlans && structure.meals) {
    structure.mealPlans = structure.meals
    delete structure.meals
  }
  if (!structure.mealPlans && structure.mealTypes) {
    structure.mealPlans = structure.mealTypes
    delete structure.mealTypes
  }
  if (!structure.mealPlans && structure.boardTypes) {
    structure.mealPlans = structure.boardTypes
    delete structure.boardTypes
  }
  if (!structure.periods && structure.pricingPeriods) {
    structure.periods = structure.pricingPeriods
    delete structure.pricingPeriods
  }
  if (!structure.periods && structure.seasons) {
    structure.periods = structure.seasons
    delete structure.seasons
  }
  // contractInfo might be named differently
  if (!structure.contractInfo && structure.contract) {
    structure.contractInfo = structure.contract
    delete structure.contract
  }
  if (!structure.contractInfo && structure.info) {
    structure.contractInfo = structure.info
    delete structure.info
  }

  // Ensure pricingType is on contractInfo
  if (structure.contractInfo && !structure.contractInfo.pricingType && structure.pricingType) {
    structure.contractInfo.pricingType = structure.pricingType
  }

  logger.info(
    `Pass 1 complete - periods: ${structure.periods?.length}, rooms: ${structure.roomTypes?.length}, meals: ${structure.mealPlans?.length}, pricingType: ${structure.contractInfo?.pricingType}`
  )

  // Warn if critical data is still missing
  if (!structure.roomTypes?.length) {
    logger.warn('Pass 1: No room types found! Available keys: ' + Object.keys(structure).join(', '))
  }
  if (!structure.mealPlans?.length) {
    logger.warn('Pass 1: No meal plans found! Available keys: ' + Object.keys(structure).join(', '))
  }

  return structure
}

/**
 * Build indexed alias maps for rooms and meals to avoid code mismatch.
 * Returns { roomAliasToCode, codeToRoomAlias, mealAliasToCode, codeToMealAlias, roomAliasRef, mealAliasRef }
 */
const buildAliasMaps = (rooms, meals) => {
  const roomAliasToCode = {}
  const codeToRoomAlias = {}
  const mealAliasToCode = {}
  const codeToMealAlias = {}

  rooms.forEach((r, i) => {
    const alias = `R${String(i + 1).padStart(2, '0')}`
    const code = r.contractCode || r.suggestedCode || r.contractName
    roomAliasToCode[alias] = code
    codeToRoomAlias[code] = alias
  })

  meals.forEach((m, i) => {
    const alias = `M${String(i + 1).padStart(2, '0')}`
    const code = m.contractCode || m.suggestedCode || m.contractName
    mealAliasToCode[alias] = code
    codeToMealAlias[code] = alias
  })

  const roomAliasRef = rooms
    .map((r, i) => {
      const alias = `R${String(i + 1).padStart(2, '0')}`
      return `${alias} = ${r.contractName}`
    })
    .join('\n')

  const mealAliasRef = meals
    .map((m, i) => {
      const alias = `M${String(i + 1).padStart(2, '0')}`
      return `${alias} = ${m.contractName}`
    })
    .join(', ')

  return {
    roomAliasToCode,
    codeToRoomAlias,
    mealAliasToCode,
    codeToMealAlias,
    roomAliasRef,
    mealAliasRef
  }
}

/**
 * Replace alias codes (R01, M01) back to original codes in pricing entries
 */
const replaceAliasesInPricing = (pricing, roomAliasToCode, mealAliasToCode) => {
  return pricing.map(p => ({
    ...p,
    roomCode: roomAliasToCode[p.roomCode] || p.roomCode,
    mealPlanCode: mealAliasToCode[p.mealPlanCode] || p.mealPlanCode
  }))
}

/**
 * PASS 2: Extract ALL room pricing in CSV format (single API call)
 * Uses indexed aliases (R01, R02, M01...) to prevent code mismatch between AI output and validation.
 */
const extractAllPricingCSV = async (client, base64Content, mimeType, structure) => {
  const pricingType = structure.contractInfo?.pricingType || 'unit'

  const periods = structure.periods || []
  const rooms = structure.roomTypes || []
  const meals = structure.mealPlans || []

  const { roomAliasToCode, mealAliasToCode, roomAliasRef, mealAliasRef } = buildAliasMaps(
    rooms,
    meals
  )

  const periodsRef = periods
    .map(p => `${p.code}: ${p.name} (${p.startDate} → ${p.endDate})`)
    .join('\n')

  const roomAliases = Object.keys(roomAliasToCode)
  const mealAliases = Object.keys(mealAliasToCode)

  const roomCount = rooms.length
  const periodCount = periods.length
  const mealCount = meals.length || 1
  const expectedCount = roomCount * periodCount * mealCount

  let csvColumns, csvExample, pricingInstructions

  if (pricingType === 'unit') {
    csvColumns = 'ROOM|PERIOD|MEAL|PRICE|EXTRA_ADULT|EXTRA_CHILD1|EXTRA_CHILD2|EXTRA_INFANT'
    csvExample = `R01|P1|M01|1500|300|200|150|0`
    pricingInstructions = `Unit (oda bazlı) fiyatlandırma:
- PRICE: Oda/ünite gecelik fiyatı
- EXTRA_ADULT: Ekstra yetişkin fiyatı (yoksa 0)
- EXTRA_CHILD1: 1. çocuk fiyatı (yoksa 0)
- EXTRA_CHILD2: 2. çocuk fiyatı (yoksa 0)
- EXTRA_INFANT: Bebek fiyatı (yoksa 0)`
  } else if (pricingType === 'per_person') {
    csvColumns = 'ROOM|PERIOD|MEAL|1PAX|2PAX|3PAX|4PAX|CHILD1|CHILD2|INFANT'
    csvExample = `R01|P1|M01|1200|1000|900|850|300|200|0`
    pricingInstructions = `Kişi bazlı (OBP) fiyatlandırma:
- 1PAX: 1 yetişkin kişi başı fiyat
- 2PAX: 2 yetişkin kişi başı fiyat
- 3PAX: 3 yetişkin kişi başı fiyat (yoksa 0)
- 4PAX: 4 yetişkin kişi başı fiyat (yoksa 0)
- CHILD1: 1. çocuk fiyatı (yoksa 0)
- CHILD2: 2. çocuk fiyatı (yoksa 0)
- INFANT: Bebek fiyatı (yoksa 0)`
  } else {
    csvColumns = 'ROOM|PERIOD|MEAL|BASE_PRICE|CHILD1|CHILD2|INFANT'
    csvExample = `R01|P1|M01|1000|300|200|0`
    pricingInstructions = `Çarpanlı kişi bazlı fiyatlandırma:
- BASE_PRICE: Baz fiyat (çarpanlar ayrı çıkarılacak)
- CHILD1: 1. çocuk fiyatı (yoksa 0)
- CHILD2: 2. çocuk fiyatı (yoksa 0)
- INFANT: Bebek fiyatı (yoksa 0)`
  }

  const prompt = `Bu kontrat dökümanından TÜM oda tiplerinin TÜM dönemlerdeki fiyatlarını çıkar.

ODA KODLARI (bu KISA KODLARI kullan!):
${roomAliasRef}

DÖNEMLER:
${periodsRef}

PANSİYONLAR: ${mealAliasRef}

${pricingInstructions}

TOPLAM ${expectedCount} satır bekleniyor (${roomCount} oda × ${periodCount} dönem × ${mealCount} pansiyon).
HİÇBİR FİYAT ATLAMA! Tablodaki TÜM fiyatları çıkar!

CSV FORMATI (| ile ayrılmış, başlık satırı KOYMA):
${csvColumns}

ÖRNEK:
${csvExample}

KURALLAR:
1. Her satırda ROOM, PERIOD ve MEAL kodu OLMALI
2. Oda kodu SADECE şunlardan biri olabilir: ${roomAliases.join(', ')}
3. Dönem kodu SADECE şunlardan biri olabilir: ${periods.map(p => p.code).join(', ')}
4. Pansiyon kodu SADECE şunlardan biri olabilir: ${mealAliases.join(', ')}
5. Sadece sayısal değerler kullan (para birimi sembolü KOYMA)
6. Boş/bilinmeyen değer için 0 yaz
7. Başlık satırı KOYMA, direkt verilerle başla
8. Açıklama/yorum satırı YAZMA

SADECE CSV VERİSİ DÖNDÜR!`

  logger.info(
    `Pass 2: Extracting ALL pricing in CSV format (expecting ${expectedCount} entries)...`
  )

  // CSV is very compact: ~50 chars/line. Allow generous tokens but cap at 65K
  const maxTokens = Math.min(Math.max(16384, expectedCount * 100), 65536)
  const text = await callGeminiWithFile(client, base64Content, mimeType, prompt, maxTokens)

  const rawPricing = parseCSVPricing(text, pricingType)
  // Replace aliases back to original codes for validation compatibility
  const pricing = replaceAliasesInPricing(rawPricing, roomAliasToCode, mealAliasToCode)
  logger.info(`Pass 2 complete: Found ${pricing.length}/${expectedCount} price entries from CSV`)

  return pricing
}

/**
 * Parse CSV pricing response into structured pricing array
 */
const parseCSVPricing = (text, pricingType) => {
  if (!text) return []

  // Clean the response
  const cleaned = text
    .replace(/```(?:csv|text)?\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const lines = cleaned.split('\n').filter(line => {
    const trimmed = line.trim()
    if (!trimmed) return false
    if (trimmed.startsWith('#')) return false
    // Skip header lines
    if (/^ROOM\s*\|/i.test(trimmed)) return false
    if (/PERIOD.*MEAL.*PRICE/i.test(trimmed)) return false
    // Must have pipe separators with at least 3 fields
    if ((trimmed.match(/\|/g) || []).length < 2) return false
    return true
  })

  const pricing = []

  for (const line of lines) {
    const parts = line.split('|').map(s => s.trim())

    try {
      if (pricingType === 'unit') {
        if (parts.length < 4) continue
        const entry = {
          roomCode: parts[0],
          periodCode: parts[1],
          mealPlanCode: parts[2],
          pricePerNight: parseFloat(parts[3]) || 0,
          extraAdult: parseFloat(parts[4]) || 0,
          extraChild: [],
          extraInfant: parseFloat(parts[7]) || 0,
          pricingType: 'unit'
        }
        const child1 = parseFloat(parts[5])
        const child2 = parseFloat(parts[6])
        if (child1) entry.extraChild.push(child1)
        if (child2) entry.extraChild.push(child2)
        if (entry.pricePerNight > 0) pricing.push(entry)
      } else if (pricingType === 'per_person') {
        if (parts.length < 5) continue
        const occupancyPricing = {}
        const pax1 = parseFloat(parts[3])
        const pax2 = parseFloat(parts[4])
        const pax3 = parseFloat(parts[5])
        const pax4 = parseFloat(parts[6])
        if (pax1) occupancyPricing['1'] = pax1
        if (pax2) occupancyPricing['2'] = pax2
        if (pax3) occupancyPricing['3'] = pax3
        if (pax4) occupancyPricing['4'] = pax4

        const entry = {
          roomCode: parts[0],
          periodCode: parts[1],
          mealPlanCode: parts[2],
          pricingType: 'per_person',
          occupancyPricing,
          pricePerNight: 0,
          extraChild: [],
          extraInfant: parseFloat(parts[9]) || 0
        }
        const child1 = parseFloat(parts[7])
        const child2 = parseFloat(parts[8])
        if (child1) entry.extraChild.push(child1)
        if (child2) entry.extraChild.push(child2)
        if (Object.keys(occupancyPricing).length > 0) pricing.push(entry)
      } else {
        // per_person_multiplier
        if (parts.length < 4) continue
        const entry = {
          roomCode: parts[0],
          periodCode: parts[1],
          mealPlanCode: parts[2],
          pricingType: 'per_person_multiplier',
          pricePerNight: parseFloat(parts[3]) || 0,
          extraChild: [],
          extraInfant: parseFloat(parts[6]) || 0
        }
        const child1 = parseFloat(parts[4])
        const child2 = parseFloat(parts[5])
        if (child1) entry.extraChild.push(child1)
        if (child2) entry.extraChild.push(child2)
        if (entry.pricePerNight > 0) pricing.push(entry)
      }
    } catch (err) {
      logger.warn(`CSV parse error on line: "${line}" - ${err.message}`)
    }
  }

  return pricing
}

/**
 * Retry extraction for specific missing entries (single call, CSV format)
 * Uses the same alias system as Pass 2 for consistency
 */
const retryMissingPricingCSV = async (
  client,
  base64Content,
  mimeType,
  structure,
  missingEntries
) => {
  const pricingType = structure.contractInfo?.pricingType || 'unit'
  const rooms = structure.roomTypes || []
  const meals = structure.mealPlans || []

  const { roomAliasToCode, mealAliasToCode, roomAliasRef, mealAliasRef } = buildAliasMaps(
    rooms,
    meals
  )

  // Build reverse lookup: original code → alias
  const codeToRoomAlias = {}
  for (const [alias, code] of Object.entries(roomAliasToCode)) {
    codeToRoomAlias[code] = alias
  }
  const codeToMealAlias = {}
  for (const [alias, code] of Object.entries(mealAliasToCode)) {
    codeToMealAlias[code] = alias
  }

  // Group missing by room alias for clarity
  const missingByRoom = {}
  for (const entry of missingEntries) {
    const roomAlias = codeToRoomAlias[entry.roomCode] || entry.roomCode
    const mealAlias = codeToMealAlias[entry.mealPlanCode] || entry.mealPlanCode
    if (!missingByRoom[roomAlias]) missingByRoom[roomAlias] = []
    missingByRoom[roomAlias].push(`${entry.periodCode}/${mealAlias}`)
  }

  const missingDesc = Object.entries(missingByRoom)
    .map(([room, combos]) => `- ${room}: ${combos.join(', ')}`)
    .join('\n')

  let csvColumns
  if (pricingType === 'unit') {
    csvColumns = 'ROOM|PERIOD|MEAL|PRICE|EXTRA_ADULT|EXTRA_CHILD1|EXTRA_CHILD2|EXTRA_INFANT'
  } else if (pricingType === 'per_person') {
    csvColumns = 'ROOM|PERIOD|MEAL|1PAX|2PAX|3PAX|4PAX|CHILD1|CHILD2|INFANT'
  } else {
    csvColumns = 'ROOM|PERIOD|MEAL|BASE_PRICE|CHILD1|CHILD2|INFANT'
  }

  const prompt = `Bu kontrat dökümanından aşağıdaki EKSİK fiyat kayıtlarını çıkar.

ODA KODLARI (bu KISA KODLARI kullan!):
${roomAliasRef}

PANSİYONLAR: ${mealAliasRef}

EKSİK KAYITLAR:
${missingDesc}

TOPLAM ${missingEntries.length} satır bekleniyor.

CSV FORMATI (| ile ayrılmış, başlık KOYMA):
${csvColumns}

KURALLAR:
1. Oda kodu SADECE R01, R02, ... formatında olmalı
2. Pansiyon kodu SADECE M01, M02, ... formatında olmalı
3. Sadece yukarıdaki EKSİK kombinasyonların fiyatlarını ver
4. HİÇBİR FİYAT ATLAMA!

SADECE CSV VERİSİ DÖNDÜR!`

  logger.info(`Retry: Extracting ${missingEntries.length} missing entries...`)
  const text = await callGeminiWithFile(client, base64Content, mimeType, prompt, 8192)
  const rawPricing = parseCSVPricing(text, pricingType)
  return replaceAliasesInPricing(rawPricing, roomAliasToCode, mealAliasToCode)
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
 * Parse hotel pricing contract (PDF/Word/Image) using Gemini AI
 * Optimized 2-pass approach with CSV format:
 *   Pass 1: Structure extraction (JSON) ~10-15s
 *   Pass 2: ALL pricing in CSV format (single call) ~15-25s
 *   Pass 3: Multiplier table if needed (JSON) ~5-10s
 *   Validation + targeted retry for missing entries ~10-15s (if needed)
 *   Total: ~30-50s (was ~90-180s with per-room approach)
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
    const startTime = Date.now()
    logger.info(
      `Parsing hotel contract (CSV mode) - mimeType: ${mimeType}, contentSize: ${base64Content.length} chars`
    )

    // === PASS 1: Structure Extraction (JSON) ===
    const structure = await extractContractStructure(client, base64Content, mimeType, context)
    const pass1Time = Date.now()
    logger.info(`Pass 1 took ${Math.round((pass1Time - startTime) / 1000)}s`)

    // === PASS 2: All Pricing in CSV Format (single call) ===
    const pricing = await extractAllPricingCSV(client, base64Content, mimeType, structure)
    const pass2Time = Date.now()
    logger.info(`Pass 2 took ${Math.round((pass2Time - pass1Time) / 1000)}s`)

    // === PASS 3: Multiplier Table (if needed) ===
    let multiplierData = null
    const pricingType = structure.contractInfo?.pricingType
    if (pricingType === 'per_person_multiplier') {
      multiplierData = await extractMultiplierTable(client, base64Content, mimeType, structure)
      logger.info(`Pass 3 took ${Math.round((Date.now() - pass2Time) / 1000)}s`)
    }

    // === VALIDATION ===
    let validation = validatePricingCompleteness(structure, pricing)
    logger.info(
      `Validation: ${validation.completeness}% complete (${validation.totalFound}/${validation.totalExpected})`
    )

    // === RETRY for missing entries (single focused call) ===
    let finalPricing = pricing
    if (
      validation.completeness < 100 &&
      validation.missingEntries.length > 0 &&
      validation.missingEntries.length <= 50
    ) {
      logger.info(`Retrying ${validation.missingEntries.length} missing price entries...`)
      const retryStart = Date.now()

      try {
        const retryPricing = await retryMissingPricingCSV(
          client,
          base64Content,
          mimeType,
          structure,
          validation.missingEntries
        )

        if (retryPricing.length > 0) {
          const existingKeys = new Set(
            pricing.map(p => `${p.periodCode}|${p.roomCode}|${p.mealPlanCode}`)
          )
          const newEntries = retryPricing.filter(
            p => !existingKeys.has(`${p.periodCode}|${p.roomCode}|${p.mealPlanCode}`)
          )
          finalPricing = [...pricing, ...newEntries]

          validation = validatePricingCompleteness(structure, finalPricing)
          logger.info(
            `After retry: ${validation.completeness}% (${validation.totalFound}/${validation.totalExpected}), recovered ${newEntries.length} entries in ${Math.round((Date.now() - retryStart) / 1000)}s`
          )
        }
      } catch (retryError) {
        logger.warn(`Retry failed: ${retryError.message}`)
      }
    }

    // === BUILD RESULT ===
    const totalTime = Math.round((Date.now() - startTime) / 1000)
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

    if (validation.completeness < 100) {
      result.warnings.push(
        `${validation.missingEntries.length} fiyat kaydı eksik olabilir (beklenen: ${validation.totalExpected}, bulunan: ${validation.totalFound}, tamamlanma: %${validation.completeness})`
      )
    }

    if (result.confidence && validation.completeness < 100) {
      result.confidence.pricing = validation.completeness
      result.confidence.overall = Math.round(
        (result.confidence.periods + result.confidence.rooms + validation.completeness) / 3
      )
    }

    const periodCount = structure.periods?.length || 0
    const roomCount = structure.roomTypes?.length || 0
    const mealPlanCount = structure.mealPlans?.length || 0

    logger.info(`Contract parsing completed in ${totalTime}s:`)
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
