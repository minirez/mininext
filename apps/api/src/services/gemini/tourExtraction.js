import logger from '../../core/logger.js'
import { generateContent } from './client.js'
import { isJsonTruncated, repairTruncatedJson } from './helpers.js'

/**
 * Extract tour data from text using Gemini AI
 * Returns structured JSON matching the tour schema with confidence scores
 */
export const extractTourData = async (content, retryCount = 0) => {
  const MAX_RETRIES = 2

  if (!content || content.trim() === '') {
    throw new Error('Content is required')
  }

  const prompt = `Sen bir tur paketi veri çıkarma uzmanısın. Aşağıdaki metinden tur bilgilerini çıkar ve JSON formatında döndür.

ÖNEMLİ KURALLAR:
1. SADECE geçerli JSON döndür, başka bir şey ekleme
2. Bulamadığın alanları boş string "" veya null olarak bırak
3. Her alan için confidence (güven) skoru ekle (0-100 arası)
4. Çoklu dil alanlarında Türkçe (tr) ve İngilizce (en) için değer ver
5. Enum değerleri için sadece belirtilen seçenekleri kullan
6. Fiyatları currency ve basePricing içinde döndür

TUR VERİ ŞEMASI:

{
  "code": "TUR001 (tur kodu, maksimum 20 karakter, büyük harf)",
  "name": {
    "tr": "Türkçe tur adı",
    "en": "English tour name"
  },
  "shortDescription": {
    "tr": "Kısa açıklama (1-2 cümle)",
    "en": "Short description"
  },
  "description": {
    "tr": "Detaylı açıklama",
    "en": "Detailed description"
  },
  "tourType": "cruise|cultural|international|activity|workshop|transfer|nature|city|museum|adventure|religious|yacht|boat|ferry|other",
  "destination": {
    "country": "Ülke adı",
    "city": "Şehir adı",
    "region": "Bölge"
  },
  "departurePoints": [
    {
      "city": "İstanbul",
      "name": { "tr": "İstanbul Havalimanı", "en": "Istanbul Airport" },
      "isDefault": true
    }
  ],
  "duration": {
    "nights": 2,
    "days": 3
  },
  "basePricing": {
    "currency": "TRY|EUR|USD|GBP",
    "startingPrice": 23990,
    "adult": {
      "single": 27990,
      "double": 23990,
      "triple": 23990
    },
    "child": {
      "withBed": 20990,
      "withoutBed": 17990
    },
    "infant": {
      "price": 3500
    }
  },
  "transportation": [
    {
      "type": "flight|bus|ferry|car|train|combined",
      "carrier": "THY, Pegasus vb.",
      "class": "economy|business|first|standard|comfort",
      "details": { "tr": "Ulaşım detayları", "en": "Transportation details" },
      "isIncluded": true,
      "flightInfo": {
        "outbound": {
          "flightNo": "PC1913",
          "departure": "ERCAN",
          "arrival": "İSTANBUL (SAW)",
          "date": "20 MART 2026",
          "time": "07:20"
        },
        "return": {
          "flightNo": "PC1926",
          "departure": "İSTANBUL (SAW)",
          "arrival": "ECN",
          "date": "22 MART 2026",
          "time": "20:30"
        }
      }
    }
  ],
  "accommodations": [
    {
      "hotelName": "Otel adı",
      "hotelAddress": "Otel adresi",
      "nights": 2,
      "mealPlanCode": "HB|FB|BB|RO|AI",
      "mealPlanName": { "tr": "Yarım Pansiyon", "en": "Half Board" },
      "roomType": "Standart Oda",
      "starRating": 4,
      "isMainHotel": true,
      "order": 0
    }
  ],
  "inclusions": [
    { "tr": "Uçak bileti", "en": "Flight ticket" },
    { "tr": "Otel konaklaması", "en": "Hotel accommodation" },
    { "tr": "Transfer hizmetleri", "en": "Transfer services" },
    { "tr": "Profesyonel rehberlik hizmeti", "en": "Professional guide service" }
  ],
  "exclusions": [
    { "tr": "Öğle yemekleri", "en": "Lunches" },
    { "tr": "Müze ve ören yeri girişleri", "en": "Museum and site entrances" },
    { "tr": "Kişisel harcamalar", "en": "Personal expenses" }
  ],
  "itinerary": [
    {
      "day": 1,
      "title": { "tr": "Varış Günü", "en": "Arrival Day" },
      "description": { "tr": "Detaylı günlük program açıklaması", "en": "Detailed daily program description" },
      "meals": ["dinner"],
      "activities": [
        { "tr": "Havalimanı karşılama", "en": "Airport pickup" },
        { "tr": "Selimiye Camii ziyareti", "en": "Selimiye Mosque visit" }
      ],
      "accommodation": "Edirne Oteli",
      "overnight": { "tr": "Edirne", "en": "Edirne" }
    }
  ],
  "highlights": [
    { "tr": "Selimiye Camii", "en": "Selimiye Mosque" },
    { "tr": "II. Bayezid Külliyesi", "en": "Bayezid II Complex" }
  ],
  "participants": {
    "min": 10,
    "max": 40
  },
  "ageRequirements": {
    "childMinAge": 2,
    "childMaxAge": 11,
    "infantMaxAge": 2
  },
  "confidence": {
    "name": 95,
    "description": 80,
    "destination": 90,
    "duration": 100,
    "basePricing": 85,
    "transportation": 85,
    "accommodations": 80,
    "itinerary": 75,
    "inclusions": 85,
    "exclusions": 80
  }
}

FİYATLANDIRMA TALİMATLARI:
- startingPrice: En düşük kişi başı fiyatı (genellikle "İki kişilik odada kişi başı" fiyatı)
- Detaylı fiyat tablosu varsa (tek kişilik, iki kişilik, çocuk vb.) adult, child, infant objelerini doldur
- "İki kişilik odada kişi başı" = adult.double
- "Tek kişilik oda" = adult.single
- "İlave yatak" = adult.triple
- "6-11 yaş çocuk" = child.withBed
- "2-5 yaş çocuk" = child.withoutBed
- "0-2 yaş bebek" = infant.price
- Peşin/Nakit fiyatları tercih et (varsa)
- Para birimi TRY, EUR, USD, GBP olabilir

GÜNLÜK PROGRAM TALİMATLARI:
- Her gün için ayrı bir itinerary objesi oluştur
- Gün numarasını (day) doğru sırayla ver
- Günlük açıklamayı (description) metinden detaylı şekilde al
- Yemekleri (meals): breakfast, lunch, dinner, snack olarak belirt
- Aktiviteleri ziyaret edilen yerlerden çıkar
- Konaklama bilgisini her gün için ekle
- overnight: O gece kalınan şehir

KONAKLAMA TALİMATLARI:
- Birden fazla otel varsa her birini ayrı ekle
- Ana oteli isMainHotel: true olarak işaretle
- Gece sayısını ve pansiyon tipini belirt (HB = Yarım Pansiyon, FB = Tam Pansiyon)
- Yıldız sayısını belirt (bilinmiyorsa 4 varsay)

ULAŞIM TALİMATLARI:
- Ana ulaşım tipini belirt (uçak, otobüs, gemi vb.)
- Uçuş bilgilerini flightInfo'ya ekle (varsa)
- Taşıyıcı firmaları belirt (Pegasus, THY vb.)

DAHİL/HARİÇ HİZMETLER:
- "Ücrete Dahil Olan Hizmetler" bölümünü inclusions'a aktar
- "Ücrete Dahil Olmayan Hizmetler" bölümünü exclusions'a aktar
- Her bir maddeyi ayrı obje olarak { tr, en } formatında ver

İÇERİK:
"""
${content}
"""

Sadece JSON döndür:`

  try {
    const responseText = await generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 32768
    })

    if (!responseText) {
      throw new Error('No response received from AI')
    }

    logger.info(`Tour extraction - Gemini response length: ${responseText.length} chars`)

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
      logger.warn(`Tour extraction response truncated, retry ${retryCount + 1}/${MAX_RETRIES}`)

      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
        return extractTourData(content, retryCount + 1)
      }

      logger.warn('Max retries reached, attempting to repair truncated JSON')
      cleanedResponse = repairTruncatedJson(cleanedResponse)
    }

    try {
      const parsed = JSON.parse(cleanedResponse)
      logger.info(
        'Tour data extraction completed - itinerary days: ' +
          (parsed.itinerary?.length || 0) +
          ', accommodations: ' +
          (parsed.accommodations?.length || 0)
      )
      return {
        success: true,
        data: parsed
      }
    } catch (parseError) {
      logger.error('Failed to parse tour AI response: ' + cleanedResponse.substring(0, 500))

      if (retryCount < MAX_RETRIES) {
        logger.info(`Retrying due to parse error, attempt ${retryCount + 2}/${MAX_RETRIES + 1}`)
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
        return extractTourData(content, retryCount + 1)
      }

      return {
        success: false,
        error: 'AI yanıtı parse edilemedi',
        rawResponse: cleanedResponse.substring(0, 1000)
      }
    }
  } catch (error) {
    logger.error('Tour data extraction error: ' + error.message)

    if (
      retryCount < MAX_RETRIES &&
      (error.message.includes('timeout') || error.message.includes('network'))
    ) {
      logger.info(`Retrying due to error, attempt ${retryCount + 2}/${MAX_RETRIES + 1}`)
      await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)))
      return extractTourData(content, retryCount + 1)
    }

    throw error
  }
}
